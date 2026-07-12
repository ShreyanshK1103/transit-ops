package handlers

import (
	"fmt"
	"net/http"
	"strconv"
)

// dashboardResponse is the clean JSON response for GET /api/v1/dashboard.
type dashboardResponse struct {
	// Vehicle KPIs
	TotalVehicles         int64   `json:"total_vehicles"`
	AvailableVehicles     int64   `json:"available_vehicles"`
	ActiveVehicles        int64   `json:"active_vehicles"`
	VehiclesInMaintenance int64   `json:"vehicles_in_maintenance"`
	RetiredVehicles       int64   `json:"retired_vehicles"`
	FleetUtilizationPct   float64 `json:"fleet_utilization_pct"`

	// Trip KPIs
	ActiveTrips    int64 `json:"active_trips"`
	PendingTrips   int64 `json:"pending_trips"`
	CompletedTrips int64 `json:"completed_trips"`

	// Driver KPIs
	DriversOnDuty    int64 `json:"drivers_on_duty"`
	AvailableDrivers int64 `json:"available_drivers"`
	TotalDrivers     int64 `json:"total_drivers"`
}

// HandleGetDashboard returns all dashboard KPIs in a single response.
//
//	GET /api/v1/dashboard
//	200: { "total_vehicles": 12, "available_vehicles": 8, ... }
func (cfg *Config) HandleGetDashboard(w http.ResponseWriter, r *http.Request) {
	kpis, err := cfg.DB.GetDashboardKPIs(r.Context())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "could not fetch dashboard KPIs")
		return
	}

	// FleetUtilizationPct comes as interface{} from sqlc because of COALESCE(ROUND(...)).
	// The postgres driver returns NUMERIC as []byte or string — we parse it to float64.
	utilization := parseNumericToFloat(kpis.FleetUtilizationPct)

	respondWithJSON(w, http.StatusOK, dashboardResponse{
		TotalVehicles:         kpis.TotalVehicles,
		AvailableVehicles:     kpis.AvailableVehicles,
		ActiveVehicles:        kpis.ActiveVehicles,
		VehiclesInMaintenance: kpis.VehiclesInMaintenance,
		RetiredVehicles:       kpis.RetiredVehicles,
		FleetUtilizationPct:   utilization,
		ActiveTrips:           kpis.ActiveTrips,
		PendingTrips:          kpis.PendingTrips,
		CompletedTrips:        kpis.CompletedTrips,
		DriversOnDuty:         kpis.DriversOnDuty,
		AvailableDrivers:      kpis.AvailableDrivers,
		TotalDrivers:          kpis.TotalDrivers,
	})
}

// parseNumericToFloat converts a postgres NUMERIC value (returned as []byte, string, or int64)
// into a float64. Returns 0 on any parse failure.
func parseNumericToFloat(v interface{}) float64 {
	switch val := v.(type) {
	case []byte:
		f, _ := strconv.ParseFloat(string(val), 64)
		return f
	case string:
		f, _ := strconv.ParseFloat(val, 64)
		return f
	case int64:
		return float64(val)
	case float64:
		return val
	default:
		f, _ := strconv.ParseFloat(fmt.Sprintf("%v", val), 64)
		return f
	}
}
