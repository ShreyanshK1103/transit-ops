-- name: CreateExpense :one
INSERT INTO expenses (vehicle_id, category, amount, expense_date, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetExpensesByVehicle :many
SELECT * FROM expenses
WHERE vehicle_id = $1
ORDER BY expense_date DESC;

-- name: GetAllExpenses :many
SELECT * FROM expenses
ORDER BY expense_date DESC;
