# Architecture

TransitOps is organized into two main parts: a Go-based REST API backend and a Next.js/React frontend.

## 1. Backend Service (Go)

The backend follows a layer-based structure, utilizing standard Go conventions:
- **Frameworks:** Chi router (go-chi/chi)
- **Database:** PostgreSQL with SQLC for type-safe query generation
- **Structure:**
  - `cmd/api/main.go`: Entry point, sets up the server, database connection, and middleware.
  - `internal/handlers/`: Contains the HTTP controllers and logic to parse requests/responses.
  - `internal/database/`: Auto-generated SQLC code.
  - `internal/middleware/`: Contains authentication (JWT) and RBAC middlewares.
  - `sql/schema/`: The database table definitions for `.sql` initialization.
  - `sql/queries/`: The raw SQL queries used by SQLC.

## 2. Frontend Interface (React/Next.js)

The frontend is a single-page style React application wrapped by a Next.js App Router for tooling and optimization.
- **Frameworks:** Next.js (React 19), Tailwind CSS, Recharts for data visualization.
- **Components:** Uses Shadcn-inspired UI components.
- **State Management:** A lightweight global state is provided by React Context (`TransitOpsContext`). Note: In this version, the frontend operates primarily with mock data in context for high-performance interactivity. The backend exposes full CRUD functionality that can be mapped directly to context actions for a fully integrated system.
- **Styling:** Adopts a dark-themed, glassmorphic UI using standard Tailwind CSS classes.

## 3. Environment & Deployment (Docker)

The whole stack is deployed seamlessly via Docker Compose:
- **db:** Initializes a `postgres:15-alpine` container and loads schema definitions from `sql/schema`.
- **backend:** Rebuilt cleanly on every start using `golang:1.23-alpine` image, relying on a two-staged Docker build.
- **frontend:** Uses `node:20-alpine` focusing on generating a production build and serving it efficiently.

All external configurations are injected using docker-compose environment variables to strictly follow 12-factor app patterns.
