-- name: CreateDriver :one
INSERT INTO drivers (
    user_id, name, license_number, license_category, license_expiry_date, contact_number
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetAllDrivers :many
SELECT * FROM drivers
ORDER BY created_at DESC;

-- name: GetDriverByID :one
SELECT * FROM drivers
WHERE id = $1;

-- name: GetDriverByLicense :one
SELECT * FROM drivers
WHERE license_number = $1;

-- name: UpdateDriver :one
UPDATE drivers
SET
    name = $2,
    license_number = $3,
    license_category = $4,
    license_expiry_date = $5,
    contact_number = $6,
    safety_score = $7
WHERE id = $1
RETURNING *;

-- name: UpdateDriverStatus :exec
UPDATE drivers
SET status = $2
WHERE id = $1;

-- name: GetAvailableDrivers :many
SELECT * FROM drivers
WHERE status = 'Available'
AND license_expiry_date > CURRENT_DATE;

-- name: GetDriversByStatus :many
SELECT * FROM drivers
WHERE status = $1
ORDER BY created_at DESC;