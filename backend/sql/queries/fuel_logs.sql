-- name: CreateFuelLog :one
INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetFuelLogsByVehicle :many
SELECT * FROM fuel_logs
WHERE vehicle_id = $1
ORDER BY log_date DESC;

-- name: GetAllFuelLogs :many
SELECT * FROM fuel_logs
ORDER BY log_date DESC;

-- ──────────────────────────────────────────────────────────────────────────────
-- Operational Cost per Vehicle (single query, O(n) scan)
--
-- Uses CTEs to pre-aggregate each cost source independently, then joins once.
-- This avoids the classic N×M cross-join explosion from joining fuel_logs ×
-- maintenance_logs × expenses directly.
--
-- Time complexity: O(F + M + E + V) where
--   F = fuel_log rows, M = maintenance rows, E = expense rows, V = vehicle rows
-- No nested loops, no correlated subqueries.
-- ──────────────────────────────────────────────────────────────────────────────
-- name: GetOperationalCostPerVehicle :many
WITH fuel_agg AS (
    SELECT
        vehicle_id,
        COALESCE(SUM(cost), 0)   AS total_fuel_cost,
        COALESCE(SUM(liters), 0) AS total_liters
    FROM fuel_logs
    GROUP BY vehicle_id
),
maintenance_agg AS (
    SELECT
        vehicle_id,
        COALESCE(SUM(cost), 0) AS total_maintenance_cost
    FROM maintenance_logs
    GROUP BY vehicle_id
),
expense_agg AS (
    SELECT
        vehicle_id,
        COALESCE(SUM(amount), 0) AS total_other_expenses
    FROM expenses
    GROUP BY vehicle_id
),
trip_agg AS (
    SELECT
        vehicle_id,
        COALESCE(SUM(planned_distance), 0) AS total_distance
    FROM trips
    WHERE status = 'Completed'
    GROUP BY vehicle_id
)
SELECT
    v.id                                                          AS vehicle_id,
    v.registration_number,
    v.name_model,
    v.acquisition_cost,

    -- Individual cost buckets
    COALESCE(f.total_fuel_cost, 0)                                AS total_fuel_cost,
    COALESCE(m.total_maintenance_cost, 0)                         AS total_maintenance_cost,
    COALESCE(e.total_other_expenses, 0)                           AS total_other_expenses,

    -- Total Operational Cost = Fuel + Maintenance + Other
    (COALESCE(f.total_fuel_cost, 0)
     + COALESCE(m.total_maintenance_cost, 0)
     + COALESCE(e.total_other_expenses, 0))                       AS total_operational_cost,

    -- Fuel Efficiency = Total Distance / Total Liters (km/L or mi/gal)
    CASE
        WHEN COALESCE(f.total_liters, 0) > 0
        THEN ROUND(COALESCE(t.total_distance, 0) / f.total_liters, 2)
        ELSE 0
    END                                                           AS fuel_efficiency,

    -- Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
    -- Revenue is not tracked yet, so we show cost-based ROI as negative ratio
    -- ROI = −(Fuel + Maintenance) / Acquisition Cost  (lower is better)
    CASE
        WHEN v.acquisition_cost > 0
        THEN ROUND(
            -(COALESCE(f.total_fuel_cost, 0) + COALESCE(m.total_maintenance_cost, 0))
            / v.acquisition_cost, 4
        )
        ELSE 0
    END                                                           AS cost_roi

FROM vehicles v
LEFT JOIN fuel_agg        f ON f.vehicle_id = v.id
LEFT JOIN maintenance_agg m ON m.vehicle_id = v.id
LEFT JOIN expense_agg     e ON e.vehicle_id = v.id
LEFT JOIN trip_agg        t ON t.vehicle_id = v.id
ORDER BY total_operational_cost DESC;
