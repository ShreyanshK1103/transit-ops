package main

import (
	"log"
	"net/http"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/config"
	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
	"github.com/ShreyanshK1103/transit-ops/backend/internal/handlers"
	"github.com/ShreyanshK1103/transit-ops/backend/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func main() {
	conn, portString, err := config.ConnectDB()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	db := database.New(conn)

	apiCfg := handlers.Config{
		DB: db,
	}

	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// --- Public routes (no auth required) ---
	v1 := chi.NewRouter()
	v1.Get("/healthz", handlers.HandlerReadiness)
	v1.Post("/login", apiCfg.HandleLogin)

	// --- Protected routes (auth required) ---
	v1.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		// Example: only fleet_manager and safety_officer can access admin routes
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RequireRole("fleet_manager", "safety_officer"))
			// Add admin-only endpoints here
		})

		// Routes accessible by any authenticated user — add your CRUD handlers here
		// r.Get("/vehicles", ...)
		// r.Post("/vehicles", ...)
	})

	router.Mount("/api/v1", v1)

	addr := ":" + portString
	log.Printf("Server starting on %s", addr)
	log.Fatal(http.ListenAndServe(addr, router))
}
