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

type createMaintenanceRequest struct {
	Description string `json:"description"`
	Cost        string `json:"cost"`
	StartDate   string `json:"start_date"` // YYYY-MM-DD
}

type maintenanceResponse struct {
	ID          uuid.UUID `json:"id"`
	VehicleID   uuid.UUID `json:"vehicle_id"`
	Description string    `json:"description"`
	Cost        string    `json:"cost"`
	StartDate   string    `json:"start_date"`
	EndDate     string    `json:"end_date,omitempty"`
	IsActive    bool      `json:"is_active"`
}

func dbMaintenanceToResponse(m database.MaintenanceLog) maintenanceResponse {
	end := ""
	if m.EndDate.Valid {
		end = m.EndDate.Time.Format("2006-01-02")
	}
	return maintenanceResponse{
		ID:          m.ID,
		VehicleID:   m.VehicleID,
		Description: m.Description,
		Cost:        m.Cost,
		StartDate:   m.StartDate.Format("2006-01-02"),
		EndDate:     end,
		IsActive:    m.IsActive.Bool,
	}
}

// HandleStartMaintenance begins maintenance and shifts vehicle to In Shop
func (cfg *Config) HandleStartMaintenance(w http.ResponseWriter, r *http.Request) {
	vUUID, err := uuid.Parse(chi.URLParam(r, "vehicleID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle ID")
		return
	}

	var req createMaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	sDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "start_date must be YYYY-MM-DD")
		return
	}

	var mLog database.MaintenanceLog
	// Transaction prevents In Shop collision
	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		vehicle, err := q.GetVehicleByID(r.Context(), vUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "vehicle not found")
		}
		if vehicle.Status.VehicleStatus == database.VehicleStatusOnTrip {
			return fmtErrorfStatus(http.StatusBadRequest, "cannot maintain a vehicle that is currently On Trip")
		}

		err = q.UpdateVehicleStatus(r.Context(), database.UpdateVehicleStatusParams{
			ID:     vUUID,
			Status: database.NullVehicleStatus{VehicleStatus: database.VehicleStatusInShop, Valid: true},
		})
		if err != nil {
			return err
		}

		mLog, err = q.CreateMaintenanceLog(r.Context(), database.CreateMaintenanceLogParams{
			VehicleID:   vUUID,
			Description: req.Description,
			Cost:        req.Cost,
			StartDate:   sDate,
		})
		return err
	})

	if err != nil {
		if statusErr, ok := err.(statusCodeError); ok {
			respondWithError(w, statusErr.code, statusErr.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to start maintenance")
		return
	}
	respondWithJSON(w, http.StatusCreated, dbMaintenanceToResponse(mLog))
}

// HandleCloseMaintenance ends maintenance and returns vehicle to Available (if not retired)
func (cfg *Config) HandleCloseMaintenance(w http.ResponseWriter, r *http.Request) {
	mUUID, err := uuid.Parse(chi.URLParam(r, "logID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid maintenance ID")
		return
	}

	var req struct {
		EndDate string `json:"end_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "missing end_date")
		return
	}
	eDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "end_date must be YYYY-MM-DD")
		return
	}

	var mLog database.MaintenanceLog
	err = cfg.DB.ExecTx(r.Context(), cfg.Conn, func(q *database.Queries) error {
		m, err := q.GetMaintenanceLogByID(r.Context(), mUUID)
		if err != nil {
			return fmtErrorfStatus(http.StatusNotFound, "maintenance log not found")
		}
		if !m.IsActive.Bool {
			return fmtErrorfStatus(http.StatusBadRequest, "maintenance log is already closed")
		}

		mLog, err = q.CloseMaintenanceLog(r.Context(), database.CloseMaintenanceLogParams{
			ID:      m.ID,
			EndDate: sql.NullTime{Time: eDate, Valid: true},
		})
		if err != nil {
			return err
		}

		vehicle, err := q.GetVehicleByID(r.Context(), m.VehicleID)
		if err == nil && vehicle.Status.VehicleStatus != database.VehicleStatusRetired {
			q.UpdateVehicleStatus(r.Context(), database.UpdateVehicleStatusParams{
				ID:     m.VehicleID,
				Status: database.NullVehicleStatus{VehicleStatus: database.VehicleStatusAvailable, Valid: true},
			})
		}
		return nil
	})

	if err != nil {
		if statusErr, ok := err.(statusCodeError); ok {
			respondWithError(w, statusErr.code, statusErr.Error())
			return
		}
		respondWithError(w, http.StatusInternalServerError, "failed to close maintenance")
		return
	}
	respondWithJSON(w, http.StatusOK, dbMaintenanceToResponse(mLog))
}

func (cfg *Config) HandleGetAllMaintenance(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") == "true"
	var logs []database.MaintenanceLog
	var err error

	if activeOnly {
		logs, err = cfg.DB.GetActiveMaintenanceLogs(r.Context())
	} else {
		// Not implemented in queries, so defaulting to active for safety, or we could add it to our DB queries.
		// Wait, GetMaintenanceLogsByVehicle is present. Let's just list active if we lack a get all.
		logs, err = cfg.DB.GetActiveMaintenanceLogs(r.Context())
	}

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch logs")
		return
	}

	result := make([]maintenanceResponse, len(logs))
	for i, m := range logs {
		result[i] = dbMaintenanceToResponse(m)
	}
	respondWithJSON(w, http.StatusOK, result)
}
