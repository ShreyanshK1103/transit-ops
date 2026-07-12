package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/auth"
	"golang.org/x/crypto/bcrypt"
)

// loginRequest is the expected JSON body for POST /api/v1/login.
type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// loginResponse is the successful response from POST /api/v1/login.
type loginResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}

// HandleLogin authenticates a user by email/password and returns a JWT.
//
//	POST /api/v1/login
//	Body: { "email": "...", "password": "..." }
//	200: { "token": "...", "role": "..." }
//	401: { "error": "..." }
func (cfg *Config) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	// 1. Fetch user from DB by email
	user, err := cfg.DB.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		// Don't leak whether the email exists
		respondWithError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	// 2. Compare the bcrypt hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		respondWithError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	// 3. Issue JWT
	token, err := auth.MakeToken(user.ID, string(user.Role))
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not generate token")
		return
	}

	respondWithJSON(w, http.StatusOK, loginResponse{
		Token: token,
		Role:  string(user.Role),
	})
}
