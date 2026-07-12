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

// ── JSON types ───────────────────────────────────────────────────────────────

type createExpenseRequest struct {
	VehicleID   string `json:"vehicle_id"`
	Category    string `json:"category"` // "toll", "fine", "insurance", "misc"
	Amount      string `json:"amount"`
	ExpenseDate string `json:"expense_date"` // "YYYY-MM-DD"
	Description string `json:"description"`
}

type expenseResponse struct {
	ID          uuid.UUID `json:"id"`
	VehicleID   uuid.UUID `json:"vehicle_id"`
	Category    string    `json:"category"`
	Amount      string    `json:"amount"`
	ExpenseDate string    `json:"expense_date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

func dbExpenseToResponse(e database.Expense) expenseResponse {
	desc := ""
	if e.Description.Valid {
		desc = e.Description.String
	}
	createdAt := time.Time{}
	if e.CreatedAt.Valid {
		createdAt = e.CreatedAt.Time
	}
	return expenseResponse{
		ID:          e.ID,
		VehicleID:   e.VehicleID,
		Category:    e.Category,
		Amount:      e.Amount,
		ExpenseDate: e.ExpenseDate.Format("2006-01-02"),
		Description: desc,
		CreatedAt:   createdAt,
	}
}

// ── Handlers ─────────────────────────────────────────────────────────────────

// HandleCreateExpense records a new expense (toll, fine, insurance, etc.).
//
//	POST /api/v1/expenses
func (cfg *Config) HandleCreateExpense(w http.ResponseWriter, r *http.Request) {
	var req createExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.VehicleID == "" || req.Category == "" || req.Amount == "" || req.ExpenseDate == "" {
		respondWithError(w, http.StatusBadRequest, "vehicle_id, category, amount, and expense_date are required")
		return
	}

	vehicleUUID, err := uuid.Parse(req.VehicleID)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle_id format")
		return
	}

	expDate, err := time.Parse("2006-01-02", req.ExpenseDate)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "expense_date must be in YYYY-MM-DD format")
		return
	}

	// Validate vehicle exists
	_, err = cfg.DB.GetVehicleByID(r.Context(), vehicleUUID)
	if err != nil {
		if err == sql.ErrNoRows {
			respondWithError(w, http.StatusNotFound, "vehicle not found")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not verify vehicle")
		return
	}

	expense, err := cfg.DB.CreateExpense(r.Context(), database.CreateExpenseParams{
		VehicleID:   vehicleUUID,
		Category:    req.Category,
		Amount:      req.Amount,
		ExpenseDate: expDate,
		Description: sql.NullString{String: req.Description, Valid: req.Description != ""},
	})
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not create expense")
		return
	}

	respondWithJSON(w, http.StatusCreated, dbExpenseToResponse(expense))
}

// HandleGetExpenses returns all expenses, optionally filtered by vehicle_id.
//
//	GET /api/v1/expenses
//	GET /api/v1/expenses?vehicle_id=<uuid>
func (cfg *Config) HandleGetExpenses(w http.ResponseWriter, r *http.Request) {
	vehicleIDStr := r.URL.Query().Get("vehicle_id")

	if vehicleIDStr != "" {
		vid, err := uuid.Parse(vehicleIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "invalid vehicle_id")
			return
		}
		expenses, err := cfg.DB.GetExpensesByVehicle(r.Context(), vid)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "could not fetch expenses")
			return
		}
		result := make([]expenseResponse, len(expenses))
		for i, e := range expenses {
			result[i] = dbExpenseToResponse(e)
		}
		respondWithJSON(w, http.StatusOK, result)
		return
	}

	expenses, err := cfg.DB.GetAllExpenses(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch expenses")
		return
	}
	result := make([]expenseResponse, len(expenses))
	for i, e := range expenses {
		result[i] = dbExpenseToResponse(e)
	}
	respondWithJSON(w, http.StatusOK, result)
}

// HandleGetExpensesByVehicle returns expenses for a specific vehicle.
//
//	GET /api/v1/vehicles/{vehicleID}/expenses
func (cfg *Config) HandleGetExpensesByVehicle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "vehicleID")
	vid, err := uuid.Parse(idStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid vehicle ID")
		return
	}

	expenses, err := cfg.DB.GetExpensesByVehicle(r.Context(), vid)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch expenses")
		return
	}

	result := make([]expenseResponse, len(expenses))
	for i, e := range expenses {
		result[i] = dbExpenseToResponse(e)
	}
	respondWithJSON(w, http.StatusOK, result)
}
