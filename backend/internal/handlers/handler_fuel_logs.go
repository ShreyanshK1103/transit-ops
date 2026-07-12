package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"github.com/google/uuid"
)

// ── JSON Request / Response types ────────────────────────────────────────────

type createFuelLogRequest struct {
	VehicleID string `json:"vehicle_id"`
	Liters    string `json:"liters"`
	Cost      string `json:"cost"`
	LogDate   string `json:"log_date"` // "YYYY-MM-DD"
}

type fuelLogResponse struct {
	ID        uuid.UUID `json:"id"`
	VehicleID string    `json:"vehicle_id"`
	Liters    string    `json:"liters"`
	Cost      string    `json:"cost"`
	LogDate   string    `json:"log_date"`
	CreatedAt time.Time `json:"created_at"`
}

type operationalCostResponse struct {
	VehicleID            uuid.UUID `json:"vehicle_id"`
	RegistrationNumber   string    `json:"registration_number"`
	NameModel            string    `json:"name_model"`
	AcquisitionCost      string    `json:"acquisition_cost"`
	TotalFuelCost        float64   `json:"total_fuel_cost"`
	TotalMaintenanceCost float64   `json:"total_maintenance_cost"`
	TotalOtherExpenses   float64   `json:"total_other_expenses"`
	TotalOperationalCost float64   `json:"total_operational_cost"`
	FuelEfficiency       float64   `json:"fuel_efficiency"`
	CostROI              float64   `json:"cost_roi"`
}

func dbFuelLogToResponse(f database.FuelLog) fuelLogResponse {
	vid := ""
	if f.VehicleID.Valid {
		vid = f.VehicleID.UUID.String()
	}
	createdAt := time.Time{}
	if f.CreatedAt.Valid {
		createdAt = f.CreatedAt.Time
	}
	return fuelLogResponse{
		ID:        f.ID,
		VehicleID: vid,
		Liters:    f.Liters,
		Cost:      f.Cost,
		LogDate:   f.LogDate.Format("2006-01-02"),
		CreatedAt: createdAt,
	}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// HandleCreateFuelLog creates a fuel log after validating the vehicle exists.
//
//	POST /api/v1/fuel-logs
//	Body: { "vehicle_id", "liters", "cost", "log_date" }
func (cfg *Config) HandleCreateFuelLog(w http.ResponseWriter, r *http.Request) {
	var req createFuelLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.VehicleID == "" || req.Liters == "" || req.Cost == "" || req.LogDate == "" {
		respondWithError(w, http.StatusBadRequest, "vehicle_id, liters, cost, and log_date are required")
		return
	}

	// Validate numeric fields
	liters, err := strconv.ParseFloat(req.Liters, 64)
	if err != nil || liters <= 0 {
		respondWithError(w, http.StatusBadRequest, "liters must be a positive number")
		return
	}
	cost, err := strconv.ParseFloat(req.Cost, 64)
	if err != nil || cost < 0 {
		respondWithError(w, http.StatusBadRequest, "cost must be a non-negative number")
		return
	}

	// Parse vehicle UUID
	vehicleUUID, err := uuid.Parse(req.VehicleID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle_id format")
		return
	}

	// Parse date
	logDate, err := time.Parse("2006-01-02", req.LogDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "log_date must be in YYYY-MM-DD format")
		return
	}

	// ── Business rule: vehicle must exist ──
	_, err = cfg.DB.GetVehicleByID(r.Context(), vehicleUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "vehicle not found")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not verify vehicle")
		return
	}

	// Insert fuel log
	fuelLog, err := cfg.DB.CreateFuelLog(r.Context(), database.CreateFuelLogParams{
		VehicleID: uuid.NullUUID{UUID: vehicleUUID, Valid: true},
		Liters:    req.Liters,
		Cost:      req.Cost,
		LogDate:   logDate,
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not create fuel log")
		return
	}

	respondWithJSON(w, http.StatusCreated, dbFuelLogToResponse(fuelLog))
}

// HandleGetFuelLogs returns all fuel logs, optionally filtered by vehicle_id query param.
//
//	GET /api/v1/fuel-logs
//	GET /api/v1/fuel-logs?vehicle_id=<uuid>
func (cfg *Config) HandleGetFuelLogs(w http.ResponseWriter, r *http.Request) {
	vehicleIDStr := r.URL.Query().Get("vehicle_id")

	if vehicleIDStr != "" {
		vid, err := uuid.Parse(vehicleIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid vehicle_id")
			return
		}
		logs, err := cfg.DB.GetFuelLogsByVehicle(r.Context(), uuid.NullUUID{UUID: vid, Valid: true})
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "could not fetch fuel logs")
			return
		}
		result := make([]fuelLogResponse, len(logs))
		for i, l := range logs {
			result[i] = dbFuelLogToResponse(l)
		}
		respondWithJSON(w, http.StatusOK, result)
		return
	}

	logs, err := cfg.DB.GetAllFuelLogs(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch fuel logs")
		return
	}
	result := make([]fuelLogResponse, len(logs))
	for i, l := range logs {
		result[i] = dbFuelLogToResponse(l)
	}
	respondWithJSON(w, http.StatusOK, result)
}

// HandleGetOperationalCosts returns the pre-aggregated operational cost breakdown per vehicle.
// Single DB call, O(F + M + E + V) time complexity via CTE pre-aggregation.
//
//	GET /api/v1/operational-costs
func (cfg *Config) HandleGetOperationalCosts(w http.ResponseWriter, r *http.Request) {
	rows, err := cfg.DB.GetOperationalCostPerVehicle(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not compute operational costs")
		return
	}

	result := make([]operationalCostResponse, len(rows))
	for i, row := range rows {
		result[i] = operationalCostResponse{
			VehicleID:            row.VehicleID,
			RegistrationNumber:   row.RegistrationNumber,
			NameModel:            row.NameModel,
			AcquisitionCost:      row.AcquisitionCost,
			TotalFuelCost:        toFloat64(row.TotalFuelCost),
			TotalMaintenanceCost: toFloat64(row.TotalMaintenanceCost),
			TotalOtherExpenses:   toFloat64(row.TotalOtherExpenses),
			TotalOperationalCost: toFloat64(row.TotalOperationalCost),
			FuelEfficiency:       toFloat64(row.FuelEfficiency),
			CostROI:              toFloat64(row.CostRoi),
		}
	}

	respondWithJSON(w, http.StatusOK, result)
}

// toFloat64 converts postgres NUMERIC (interface{}, int32, string, []byte) to float64.
func toFloat64(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case int32:
		return float64(val)
	case int64:
		return float64(val)
	case []byte:
		f, _ := strconv.ParseFloat(string(val), 64)
		return f
	case string:
		f, _ := strconv.ParseFloat(val, 64)
		return f
	default:
		f, _ := strconv.ParseFloat(fmt.Sprintf("%v", val), 64)
		return f
	}
}
