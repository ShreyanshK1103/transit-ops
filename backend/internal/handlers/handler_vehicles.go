package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ── JSON Request / Response types ────────────────────────────────────────────

type createVehicleRequest struct {
	RegistrationNumber string `json:"registration_number"`
	NameModel          string `json:"name_model"`
	VehicleType        string `json:"vehicle_type"`
	MaxLoadCapacity    string `json:"max_load_capacity"`
	Odometer           string `json:"odometer"`
	AcquisitionCost    string `json:"acquisition_cost"`
}

type updateVehicleRequest struct {
	NameModel       string `json:"name_model"`
	VehicleType     string `json:"vehicle_type"`
	MaxLoadCapacity string `json:"max_load_capacity"`
	Odometer        string `json:"odometer"`
	AcquisitionCost string `json:"acquisition_cost"`
}

type vehicleResponse struct {
	ID                 uuid.UUID `json:"id"`
	RegistrationNumber string    `json:"registration_number"`
	NameModel          string    `json:"name_model"`
	VehicleType        string    `json:"vehicle_type"`
	MaxLoadCapacity    string    `json:"max_load_capacity"`
	Odometer           string    `json:"odometer"`
	AcquisitionCost    string    `json:"acquisition_cost"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
}

// dbVehicleToResponse converts a sqlc Vehicle model to a clean JSON response.
func dbVehicleToResponse(v database.Vehicle) vehicleResponse {
	odometer := ""
	if v.Odometer.Valid {
		odometer = v.Odometer.String
	}
	status := ""
	if v.Status.Valid {
		status = string(v.Status.VehicleStatus)
	}
	createdAt := time.Time{}
	if v.CreatedAt.Valid {
		createdAt = v.CreatedAt.Time
	}

	return vehicleResponse{
		ID:                 v.ID,
		RegistrationNumber: v.RegistrationNumber,
		NameModel:          v.NameModel,
		VehicleType:        v.VehicleType,
		MaxLoadCapacity:    v.MaxLoadCapacity,
		Odometer:           odometer,
		AcquisitionCost:    v.AcquisitionCost,
		Status:             status,
		CreatedAt:          createdAt,
	}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// HandleCreateVehicle creates a new vehicle.
//
//	POST /api/v1/vehicles
//	Body: { "registration_number", "name_model", "vehicle_type", "max_load_capacity", "odometer", "acquisition_cost" }
func (cfg *Config) HandleCreateVehicle(w http.ResponseWriter, r *http.Request) {
	var req createVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.RegistrationNumber == "" || req.NameModel == "" || req.VehicleType == "" ||
		req.MaxLoadCapacity == "" || req.AcquisitionCost == "" {
		respondWithError(w, http.StatusBadRequest, "registration_number, name_model, vehicle_type, max_load_capacity, and acquisition_cost are required")
		return
	}

	// Business rule: registration number must be unique (DB UNIQUE constraint handles it,
	// but we give a friendlier error message)
	vehicle, err := cfg.DB.CreateVehicle(r.Context(), database.CreateVehicleParams{
		RegistrationNumber: req.RegistrationNumber,
		NameModel:          req.NameModel,
		VehicleType:        req.VehicleType,
		MaxLoadCapacity:    req.MaxLoadCapacity,
		Odometer:           sql.NullString{String: req.Odometer, Valid: req.Odometer != ""},
		AcquisitionCost:    req.AcquisitionCost,
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "unique constraint") {
			respondWithError(w, http.StatusConflict, "a vehicle with this registration number already exists")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not create vehicle")
		return
	}

	respondWithJSON(w, http.StatusCreated, dbVehicleToResponse(vehicle))
}

// HandleGetAllVehicles returns all vehicles.
//
//	GET /api/v1/vehicles
func (cfg *Config) HandleGetAllVehicles(w http.ResponseWriter, r *http.Request) {
	vehicles, err := cfg.DB.GetAllVehicles(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch vehicles")
		return
	}

	result := make([]vehicleResponse, len(vehicles))
	for i, v := range vehicles {
		result[i] = dbVehicleToResponse(v)
	}

	respondWithJSON(w, http.StatusOK, result)
}

// HandleGetVehicleByID returns a single vehicle by its UUID.
//
//	GET /api/v1/vehicles/{vehicleID}
func (cfg *Config) HandleGetVehicleByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "vehicleID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle ID")
		return
	}

	vehicle, err := cfg.DB.GetVehicleByID(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "vehicle not found")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not fetch vehicle")
		return
	}

	respondWithJSON(w, http.StatusOK, dbVehicleToResponse(vehicle))
}

// HandleUpdateVehicle updates a vehicle's mutable fields.
//
//	PUT /api/v1/vehicles/{vehicleID}
func (cfg *Config) HandleUpdateVehicle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "vehicleID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle ID")
		return
	}

	var req updateVehicleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.NameModel == "" || req.VehicleType == "" || req.MaxLoadCapacity == "" || req.AcquisitionCost == "" {
		respondWithError(w, http.StatusBadRequest, "name_model, vehicle_type, max_load_capacity, and acquisition_cost are required")
		return
	}

	vehicle, err := cfg.DB.UpdateVehicle(r.Context(), database.UpdateVehicleParams{
		ID:              id,
		NameModel:       req.NameModel,
		VehicleType:     req.VehicleType,
		MaxLoadCapacity: req.MaxLoadCapacity,
		Odometer:        sql.NullString{String: req.Odometer, Valid: req.Odometer != ""},
		AcquisitionCost: req.AcquisitionCost,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "vehicle not found")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not update vehicle")
		return
	}

	respondWithJSON(w, http.StatusOK, dbVehicleToResponse(vehicle))
}
