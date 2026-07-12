-- name: CreateVehicle :one
INSERT INTO vehicles (
    registration_number, name_model, vehicle_type, max_load_capacity, odometer, acquisition_cost
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetAllVehicles :many
SELECT * FROM vehicles
ORDER BY created_at DESC;

-- name: GetVehicleByID :one
SELECT * FROM vehicles
WHERE id = $1;

-- name: GetVehicleByRegistration :one
SELECT * FROM vehicles
WHERE registration_number = $1;

-- name: UpdateVehicle :one
UPDATE vehicles
SET
    name_model = $2,
    vehicle_type = $3,
    max_load_capacity = $4,
    odometer = $5,
    acquisition_cost = $6
WHERE id = $1
RETURNING *;

-- name: UpdateVehicleStatus :exec
UPDATE vehicles
SET status = $2
WHERE id = $1;

-- name: GetAvailableVehicles :many
SELECT * FROM vehicles
WHERE status = 'Available' AND max_load_capacity >= $1;

-- name: GetVehiclesByStatus :many
SELECT * FROM vehicles
WHERE status = $1
ORDER BY created_at DESC;