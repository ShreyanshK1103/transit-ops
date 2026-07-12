-- name: CreateTrip :one
INSERT INTO trips (
    source, destination, vehicle_id, driver_id, cargo_weight, planned_distance
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: UpdateTripStatus :one
UPDATE trips
SET status = $2
WHERE id = $1
RETURNING *;