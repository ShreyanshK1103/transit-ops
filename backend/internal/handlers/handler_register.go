package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/auth"
	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"golang.org/x/crypto/bcrypt"
)

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type registerResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}

// HandleRegister registers a new user with the specified role and logs them in.
//
//	POST /api/v1/register
func (cfg *Config) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.Role == "" {
		respondWithError(w, http.StatusBadRequest, "email, password, and role are required")
		return
	}

	// Validate role
	validRoles := map[string]database.UserRole{
		"fleet_manager":     database.UserRoleFleetManager,
		"driver":            database.UserRoleDriver,
		"safety_officer":    database.UserRoleSafetyOfficer,
		"financial_analyst": database.UserRoleFinancialAnalyst,
	}

	role, ok := validRoles[req.Role]
	if !ok {
		respondWithError(w, http.StatusBadRequest, "invalid role provided")
		return
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "failed to secure password")
		return
	}

	// Create User in DB
	user, err := cfg.DB.CreateUser(r.Context(), database.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         role,
	})
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			respondWithError(w, http.StatusConflict, "email already exists")
			return
		}
		respondWithError(w, http.StatusInternalServerError, "could not register user")
		return
	}

	// Make Token
	token, err := auth.MakeToken(user.ID, string(user.Role))
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "user created but could not generate token")
		return
	}

	respondWithJSON(w, http.StatusCreated, registerResponse{
		Token: token,
		Role:  string(user.Role),
	})
}
