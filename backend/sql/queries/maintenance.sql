-- name: CreateMaintenanceLog :one
INSERT INTO maintenance_logs (vehicle_id, description, cost, start_date, is_active)
VALUES ($1, $2, $3, $4, TRUE)
RETURNING *;

-- name: GetMaintenanceLogsByVehicle :many
SELECT * FROM maintenance_logs
WHERE vehicle_id = $1
ORDER BY start_date DESC;

-- name: GetActiveMaintenanceLogs :many
SELECT * FROM maintenance_logs
WHERE is_active = TRUE
ORDER BY start_date DESC;

-- name: CloseMaintenanceLog :one
UPDATE maintenance_logs
SET is_active = FALSE, end_date = $2
WHERE id = $1
RETURNING *;
