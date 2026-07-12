-- name: CreateVehicle :one
INSERT INTO vehicles (
    registration_number, name_model, vehicle_type, max_load_capacity, odometer, acquisition_cost
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetAvailableVehicles :many
SELECT * FROM vehicles 
WHERE status = 'Available' AND max_load_capacity >= $1;

-- name: UpdateVehicleStatus :exec
UPDATE vehicles 
SET status = $2 
WHERE id = $1;