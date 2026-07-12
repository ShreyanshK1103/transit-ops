package handlers

import (
	"database/sql"

	"github.com/ShreyanshK1103/transit-ops/backend/internal/database"
)

type Config struct {
	DB   *database.Queries
	Conn *sql.DB
}
