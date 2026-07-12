package database

import (
	"context"
	"database/sql"
	"fmt"
)

// ExecTx executes a function within a database transaction.
// It rolls back the transaction if the function returns an error,
// and commits if the function returns nil.
func (q *Queries) ExecTx(ctx context.Context, db *sql.DB, fn func(*Queries) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	qTx := q.WithTx(tx)
	err = fn(qTx)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit()
}
