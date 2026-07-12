// seed_user is a one-off utility to insert a test user into the database.
// Run: go run cmd/seed/main.go
package main

import (
	"context"
	"fmt"
	"log"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/config"
	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	conn, _, err := config.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}
	db := database.New(conn)

	// Hash the password
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("failed to hash password:", err)
	}

	// Create a fleet_manager test user
	user, err := db.CreateUser(context.Background(), database.CreateUserParams{
		Email:        "admin@transitops.com",
		PasswordHash: string(hash),
		Role:         database.UserRoleFleetManager,
	})
	if err != nil {
		log.Fatal("failed to create user:", err)
	}

	fmt.Printf("✅ Created user: %s (ID: %s, Role: %s)\n", user.Email, user.ID, user.Role)
}
