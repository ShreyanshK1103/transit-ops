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

-- name: GetAllTrips :many
SELECT * FROM trips
ORDER BY created_at DESC;

-- name: GetTripByID :one
SELECT * FROM trips
WHERE id = $1;

-- name: GetTripsByStatus :many
SELECT * FROM trips
WHERE status = $1
ORDER BY created_at DESC;