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
		DB:   db,
		Conn: conn,
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

		// ── Dashboard ──
		r.Get("/dashboard", apiCfg.HandleGetDashboard)

		// ── Vehicle CRUD ──
		r.Post("/vehicles", apiCfg.HandleCreateVehicle)
		r.Get("/vehicles", apiCfg.HandleGetAllVehicles)
		r.Get("/vehicles/{vehicleID}", apiCfg.HandleGetVehicleByID)
		r.Put("/vehicles/{vehicleID}", apiCfg.HandleUpdateVehicle)

		// ── Driver CRUD ──
		r.Post("/drivers", apiCfg.HandleCreateDriver)
		r.Get("/drivers", apiCfg.HandleGetAllDrivers)
		r.Get("/drivers/{driverID}", apiCfg.HandleGetDriverByID)
		r.Put("/drivers/{driverID}", apiCfg.HandleUpdateDriver)

		// ── Trips Management ──
		r.Post("/trips", apiCfg.HandleCreateTrip)
		r.Get("/trips", apiCfg.HandleGetAllTrips)
		r.Put("/trips/{tripID}/dispatch", apiCfg.HandleDispatchTrip)
		r.Put("/trips/{tripID}/complete", apiCfg.HandleCompleteTrip)
		r.Put("/trips/{tripID}/cancel", apiCfg.HandleCancelTrip)

		// ── Maintenance Workflow ──
		r.Post("/vehicles/{vehicleID}/maintenance", apiCfg.HandleStartMaintenance)
		r.Put("/maintenance/{logID}/close", apiCfg.HandleCloseMaintenance)
		r.Get("/maintenance", apiCfg.HandleGetAllMaintenance)

		// ── Fuel Logs ──
		r.Post("/fuel-logs", apiCfg.HandleCreateFuelLog)
		r.Get("/fuel-logs", apiCfg.HandleGetFuelLogs)

		// ── Expenses ──
		r.Post("/expenses", apiCfg.HandleCreateExpense)
		r.Get("/expenses", apiCfg.HandleGetExpenses)
		r.Get("/vehicles/{vehicleID}/expenses", apiCfg.HandleGetExpensesByVehicle)

		// ── Operational Cost Analytics (O(F+M+E+V) single query) ──
		r.Get("/operational-costs", apiCfg.HandleGetOperationalCosts)

		// ── Admin-only routes ──
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.RequireRole("fleet_manager", "safety_officer"))
			// Add admin-only endpoints here
		})
	})

	router.Mount("/api/v1", v1)

	addr := ":" + portString
	log.Printf("Server starting on %s", addr)
	log.Fatal(http.ListenAndServe(addr, router))
}
