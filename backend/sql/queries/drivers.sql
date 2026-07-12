-- name: CreateDriver :one
INSERT INTO drivers (
    user_id, name, license_number, license_category, license_expiry_date, contact_number
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetAvailableDrivers :many
SELECT * FROM drivers 
WHERE status = 'Available' 
AND license_expiry_date > CURRENT_DATE;

-- name: UpdateDriverStatus :exec
UPDATE drivers 
SET status = $2 
WHERE id = $1;