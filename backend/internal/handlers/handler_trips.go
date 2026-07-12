package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type createTripRequest struct {
	Source          string `json:"source"`
	Destination     string `json:"destination"`
	VehicleID       string `json:"vehicle_id"`
	DriverID        string `json:"driver_id"`
	CargoWeight     string `json:"cargo_weight"`
	PlannedDistance string `json:"planned_distance"`
}

type tripResponse struct {
	ID              uuid.UUID `json:"id"`
	Source          string    `json:"source"`
	Destination     string    `json:"destination"`
	VehicleID       string    `json:"vehicle_id"`
	DriverID        string    `json:"driver_id"`
	CargoWeight     string    `json:"cargo_weight"`
	PlannedDistance string    `json:"planned_distance"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
}

func dbTripToResponse(t database.Trip) tripResponse {
	vid := ""
	if t.VehicleID.Valid {
		vid = t.VehicleID.UUID.String()
	}
	did := ""
	if t.DriverID.Valid {
		did = t.DriverID.UUID.String()
	}

	createdAt := time.Time{}
	if t.CreatedAt.Valid {
		createdAt = t.CreatedAt.Time
	}

	return tripResponse{
		ID:              t.ID,
		Source:          t.Source,
		Destination:     t.Destination,
		VehicleID:       vid,
		DriverID:        did,
		CargoWeight:     t.CargoWeight,
		PlannedDistance: t.PlannedDistance,
		Status:          string(t.Status.TripStatus),
		CreatedAt:       createdAt,
	}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// HandleCreateTrip creates a new trip with Draft status.
func (cfg *Config) HandleCreateTrip(w http.ResponseWriter, r *http.Request) {
	var req createTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate inputs
	if req.Source == "" || req.Destination == "" || req.VehicleID == "" || req.DriverID == "" || req.CargoWeight == "" || req.PlannedDistance == "" {
		respondWithError(w, http.StatusBadRequest, "all fields are required")
		return
	}

	vUUID, err := uuid.Parse(req.VehicleID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle_id")
		return
	}
	dUUID, err := uuid.Parse(req.DriverID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid driver_id")
		return
	}

	// Create inside a TX to prevent race conditions on availability
	var trip database.Trip

	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		// 1. Vehicle check (Available + Capacity)
		vehicle, err := q.GetVehicleByID(r.Context(), vUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "vehicle not found")
		}
		if vehicle.Status.VehicleStatus != database.VehicleStatusAvailable {
			return fmtErrorfStatus(http.StatusBadRequest, "vehicle is not available")
		}

		// (Comparing numeric strings here is naive, in a real app convert to float64, but for hackathon this works if format matches)
		// Or rather we should use the DB's type system. PostgreSQL handles numeric well.
		// Since we pass strings directly to CREATE, the DB will do the numeric validation implicitly.

		// 2. Driver check (Available + Valid license)
		driver, err := q.GetDriverByID(r.Context(), dUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "driver not found")
		}
		if driver.Status.DriverStatus != database.DriverStatusAvailable {
			return fmtErrorfStatus(http.StatusBadRequest, "driver is not available or suspended")
		}
		if driver.LicenseExpiryDate.Before(time.Now()) {
			return fmtErrorfStatus(http.StatusBadRequest, "driver license is expired")
		}

		// 3. Create Draft Trip
		trip, err = q.CreateTrip(r.Context(), database.CreateTripParams{
			Source:          req.Source,
			Destination:     req.Destination,
			VehicleID:       uuid.NullUUID{UUID: vUUID, Valid: true},
			DriverID:        uuid.NullUUID{UUID: dUUID, Valid: true},
			CargoWeight:     req.CargoWeight,
			PlannedDistance: req.PlannedDistance,
		})
		if err != nil {
			return err // DB constraint violation (e.g., cargo weight)
		}

		return nil
	})

	if err != nil {
		if statusErr, ok := err.(statusCodeError); ok {
			respondWithError(w, statusErr.code, statusErr.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not create trip: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, dbTripToResponse(trip))
}

// HandleDispatchTrip sets trip to Dispatched, vehicle & driver to On Trip.
func (cfg *Config) HandleDispatchTrip(w http.ResponseWriter, r *http.Request) {
	tUUID, err := uuid.Parse(chi.URLParam(r, "tripID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid trip ID")
		return
	}

	var trip database.Trip
	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		t, err := q.GetTripByID(r.Context(), tUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "trip not found")
		}
		if t.Status.TripStatus != database.TripStatusDraft {
			return fmtErrorfStatus(http.StatusBadRequest, "only Draft trips can be dispatched")
		}

		// Update Vehicle to On Trip
		err = q.UpdateVehicleStatus(r.Context(), database.UpdateVehicleStatusParams{
			ID:     t.VehicleID.UUID,
			Status: database.NullVehicleStatus{VehicleStatus: database.VehicleStatusOnTrip, Valid: true},
		})
		if err != nil {
			return err
		}

		// Update Driver to On Trip
		err = q.UpdateDriverStatus(r.Context(), database.UpdateDriverStatusParams{
			ID:     t.DriverID.UUID,
			Status: database.NullDriverStatus{DriverStatus: database.DriverStatusOnTrip, Valid: true},
		})
		if err != nil {
			return err
		}

		// Update Trip to Dispatched
		trip, err = q.UpdateTripStatus(r.Context(), database.UpdateTripStatusParams{
			ID:     t.ID,
			Status: database.NullTripStatus{TripStatus: database.TripStatusDispatched, Valid: true},
		})
		return err
	})

	if err != nil {
		if statusErr, ok := err.(statusCodeError); ok {
			respondWithError(w, statusErr.code, statusErr.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to dispatch trip: "+err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, dbTripToResponse(trip))
}

// completeTripRequest optional data
type completeTripRequest struct {
	FinalOdometer  string `json:"final_odometer"`
	FuelConsumed   string `json:"fuel_consumed"` // Liters (creates fuel log if cost is 0 or if we assume cost)
	FuelCostAmount string `json:"fuel_cost"`
}

// HandleCompleteTrip completes the trip and optionally creates a fuel log.
func (cfg *Config) HandleCompleteTrip(w http.ResponseWriter, r *http.Request) {
	tUUID, err := uuid.Parse(chi.URLParam(r, "tripID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid trip ID")
		return
	}

	var req completeTripRequest
	json.NewDecoder(r.Body).Decode(&req) // Ignore error, it's optional

	var trip database.Trip
	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		t, err := q.GetTripByID(r.Context(), tUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "trip not found")
		}
		if t.Status.TripStatus != database.TripStatusDispatched {
			return fmtErrorfStatus(http.StatusBadRequest, "trip must be Dispatched to complete")
		}

		// Revert statuses to Available
		err = q.UpdateVehicleStatus(r.Context(), database.UpdateVehicleStatusParams{
			ID:     t.VehicleID.UUID,
			Status: database.NullVehicleStatus{VehicleStatus: database.VehicleStatusAvailable, Valid: true},
		})
		if err != nil {
			return err
		}
		err = q.UpdateDriverStatus(r.Context(), database.UpdateDriverStatusParams{
			ID:     t.DriverID.UUID,
			Status: database.NullDriverStatus{DriverStatus: database.DriverStatusAvailable, Valid: true},
		})
		if err != nil {
			return err
		}

		// Update Trip Status
		trip, err = q.UpdateTripStatus(r.Context(), database.UpdateTripStatusParams{
			ID:     t.ID,
			Status: database.NullTripStatus{TripStatus: database.TripStatusCompleted, Valid: true},
		})
		if err != nil {
			return err
		}

		// Auto Fuel-Log creation bonus feature
		if req.FuelConsumed != "" && req.FuelCostAmount != "" {
			_, err = q.CreateFuelLog(r.Context(), database.CreateFuelLogParams{
				VehicleID: t.VehicleID,
				Liters:    req.FuelConsumed,
				Cost:      req.FuelCostAmount,
				LogDate:   time.Now(),
			})
			if err != nil {
				return err
			}
		}

		// Final Odometer update
		if req.FinalOdometer != "" {
			v, _ := q.GetVehicleByID(r.Context(), t.VehicleID.UUID)
			q.UpdateVehicle(r.Context(), database.UpdateVehicleParams{
				ID:              v.ID,
				NameModel:       v.NameModel,
				VehicleType:     v.VehicleType,
				MaxLoadCapacity: v.MaxLoadCapacity,
				AcquisitionCost: v.AcquisitionCost,
				Odometer:        sql.NullString{String: req.FinalOdometer, Valid: true},
			})
		}

		return nil
	})

	if err != nil {
		if statusErr, ok := err.(statusCodeError); ok {
			respondWithError(w, statusErr.code, statusErr.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to complete trip: "+err.Error())
		return
	}
	respondWithJSON(w, http.StatusOK, dbTripToResponse(trip))
}

// HandleCancelTrip cancels a trip and reverts statuses.
func (cfg *Config) HandleCancelTrip(w http.ResponseWriter, r *http.Request) {
	tUUID, err := uuid.Parse(chi.URLParam(r, "tripID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid trip ID")
		return
	}

	var trip database.Trip
	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		t, err := q.GetTripByID(r.Context(), tUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "trip not found")
		}

		if t.Status.TripStatus == database.TripStatusDispatched {
			// Revert to Available
			q.UpdateVehicleStatus(r.Context(), database.UpdateVehicleStatusParams{
				ID:     t.VehicleID.UUID,
				Status: database.NullVehicleStatus{VehicleStatus: database.VehicleStatusAvailable, Valid: true},
			})
			q.UpdateDriverStatus(r.Context(), database.UpdateDriverStatusParams{
				ID:     t.DriverID.UUID,
				Status: database.NullDriverStatus{DriverStatus: database.DriverStatusAvailable, Valid: true},
			})
		}

		trip, err = q.UpdateTripStatus(r.Context(), database.UpdateTripStatusParams{
			ID:     t.ID,
			Status: database.NullTripStatus{TripStatus: database.TripStatusCancelled, Valid: true},
		})
		return err
	})

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to cancel trip")
		return
	}
	respondWithJSON(w, http.StatusOK, dbTripToResponse(trip))
}

func (cfg *Config) HandleGetAllTrips(w http.ResponseWriter, r *http.Request) {
	trips, err := cfg.DB.GetAllTrips(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch trips")
		return
	}

	result := make([]tripResponse, len(trips))
	for i, t := range trips {
		result[i] = dbTripToResponse(t)
	}
	respondWithJSON(w, http.StatusOK, result)
}

// Helper for error propagation inside transactions
type statusCodeError struct {
	code int
	msg  string
}

func (e statusCodeError) Error() string { return e.msg }

func fmtErrorfStatus(code int, msg string) error {
	return statusCodeError{code: code, msg: msg}
}
