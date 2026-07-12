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

type createDriverRequest struct {
	UserID            string `json:"user_id"` // optional UUID string
	Name              string `json:"name"`
	LicenseNumber     string `json:"license_number"`
	LicenseCategory   string `json:"license_category"`
	LicenseExpiryDate string `json:"license_expiry_date"` // "YYYY-MM-DD"
	ContactNumber     string `json:"contact_number"`
}

type updateDriverRequest struct {
	Name              string `json:"name"`
	LicenseNumber     string `json:"license_number"`
	LicenseCategory   string `json:"license_category"`
	LicenseExpiryDate string `json:"license_expiry_date"` // "YYYY-MM-DD"
	ContactNumber     string `json:"contact_number"`
	SafetyScore       *int32 `json:"safety_score"` // pointer so we can distinguish 0 from absent
}

type driverResponse struct {
	ID                uuid.UUID `json:"id"`
	UserID            string    `json:"user_id"` // empty string if null
	Name              string    `json:"name"`
	LicenseNumber     string    `json:"license_number"`
	LicenseCategory   string    `json:"license_category"`
	LicenseExpiryDate string    `json:"license_expiry_date"`
	ContactNumber     string    `json:"contact_number"`
	SafetyScore       int32     `json:"safety_score"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"created_at"`
}

// dbDriverToResponse converts a sqlc Driver model to a clean JSON response.
func dbDriverToResponse(d database.Driver) driverResponse {
	userID := ""
	if d.UserID.Valid {
		userID = d.UserID.UUID.String()
	}
	var safetyScore int32
	if d.SafetyScore.Valid {
		safetyScore = d.SafetyScore.Int32
	}
	status := ""
	if d.Status.Valid {
		status = string(d.Status.DriverStatus)
	}
	createdAt := time.Time{}
	if d.CreatedAt.Valid {
		createdAt = d.CreatedAt.Time
	}

	return driverResponse{
		ID:                d.ID,
		UserID:            userID,
		Name:              d.Name,
		LicenseNumber:     d.LicenseNumber,
		LicenseCategory:   d.LicenseCategory,
		LicenseExpiryDate: d.LicenseExpiryDate.Format("2006-01-02"),
		ContactNumber:     d.ContactNumber,
		SafetyScore:       safetyScore,
		Status:            status,
		CreatedAt:         createdAt,
	}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// HandleCreateDriver registers a new driver.
//
//	POST /api/v1/drivers
//	Body: { "name", "license_number", "license_category", "license_expiry_date", "contact_number", "user_id"? }
func (cfg *Config) HandleCreateDriver(w http.ResponseWriter, r *http.Request) {
	var req createDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.LicenseNumber == "" || req.LicenseCategory == "" ||
		req.LicenseExpiryDate == "" || req.ContactNumber == "" {
		respondWithError(w, http.StatusBadRequest, "name, license_number, license_category, license_expiry_date, and contact_number are required")
		return
	}

	// Parse the expiry date
	expiryDate, err := time.Parse("2006-01-02", req.LicenseExpiryDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "license_expiry_date must be in YYYY-MM-DD format")
		return
	}

	// Parse optional user_id
	var userID uuid.NullUUID
	if req.UserID != "" {
		parsed, err := uuid.Parse(req.UserID)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid user_id format")
			return
		}
		userID = uuid.NullUUID{UUID: parsed, Valid: true}
	}

	// Business rule: license number must be unique (DB UNIQUE constraint)
	driver, err := cfg.DB.CreateDriver(r.Context(), database.CreateDriverParams{
		UserID:            userID,
		Name:              req.Name,
		LicenseNumber:     req.LicenseNumber,
		LicenseCategory:   req.LicenseCategory,
		LicenseExpiryDate: expiryDate,
		ContactNumber:     req.ContactNumber,
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "unique constraint") {
			respondWithError(w, http.StatusConflict, "a driver with this license number already exists")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not create driver")
		return
	}

	respondWithJSON(w, http.StatusCreated, dbDriverToResponse(driver))
}

// HandleGetAllDrivers returns all drivers.
//
//	GET /api/v1/drivers
func (cfg *Config) HandleGetAllDrivers(w http.ResponseWriter, r *http.Request) {
	drivers, err := cfg.DB.GetAllDrivers(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch drivers")
		return
	}

	result := make([]driverResponse, len(drivers))
	for i, d := range drivers {
		result[i] = dbDriverToResponse(d)
	}

	respondWithJSON(w, http.StatusOK, result)
}

// HandleGetDriverByID returns a single driver by UUID.
//
//	GET /api/v1/drivers/{driverID}
func (cfg *Config) HandleGetDriverByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "driverID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid driver ID")
		return
	}

	driver, err := cfg.DB.GetDriverByID(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "driver not found")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not fetch driver")
		return
	}

	respondWithJSON(w, http.StatusOK, dbDriverToResponse(driver))
}

// HandleUpdateDriver updates a driver's mutable fields.
//
//	PUT /api/v1/drivers/{driverID}
func (cfg *Config) HandleUpdateDriver(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "driverID")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid driver ID")
		return
	}

	var req updateDriverRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" || req.LicenseNumber == "" || req.LicenseCategory == "" ||
		req.LicenseExpiryDate == "" || req.ContactNumber == "" {
		respondWithError(w, http.StatusBadRequest, "name, license_number, license_category, license_expiry_date, and contact_number are required")
		return
	}

	expiryDate, err := time.Parse("2006-01-02", req.LicenseExpiryDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "license_expiry_date must be in YYYY-MM-DD format")
		return
	}

	// Default safety score to 100 if not provided
	safetyScore := sql.NullInt32{Int32: 100, Valid: true}
	if req.SafetyScore != nil {
		safetyScore = sql.NullInt32{Int32: *req.SafetyScore, Valid: true}
	}

	driver, err := cfg.DB.UpdateDriver(r.Context(), database.UpdateDriverParams{
		ID:                id,
		Name:              req.Name,
		LicenseNumber:     req.LicenseNumber,
		LicenseCategory:   req.LicenseCategory,
		LicenseExpiryDate: expiryDate,
		ContactNumber:     req.ContactNumber,
		SafetyScore:       safetyScore,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "driver not found")
			return
		}
		if strings.Contains(err.Error(), "duplicate key") ||
			strings.Contains(err.Error(), "unique constraint") {
			respondWithError(w, http.StatusConflict, "a driver with this license number already exists")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not update driver")
		return
	}

	respondWithJSON(w, http.StatusOK, dbDriverToResponse(driver))
}
