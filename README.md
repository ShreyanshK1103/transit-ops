# TransitOps 🚀

**AI Smart Transport Operations Platform**

TransitOps is a cutting-edge, fully integrated full-stack application designed to orchestrate modern transit ecosystems. Uniting fleet management, AI-driven intelligent dispatch routing, driver safety tracking, and financial analytics into one seamlessly connected dark-themed glassmorphism interface.

## 🌟 Key Features

- **Role-Based Access Control (RBAC):** Tailored dashboard experiences restrict or grant capabilities based on your operational clearance.
  - 🚍 **Fleet Manager**: Unrestricted access across all operational modules.
  - 🚗 **Driver (Class-A)**: Locked into the Smart Dispatcher to focus solely on routes and statuses.
  - 🛡️ **Safety Officer**: Focused on Registry & Profiles for compliance tracing and safety scoring.
  - 📈 **Financial Analyst**: Access strictly limited to Executive Dashboards and Maintenance Expenses to track budget health.
- **Flawless Backend Integration**: Golang backend processing authenticated JWT REST API endpoints communicating effortlessly with the Postgres Database utilizing ACID transactions.
- **Dynamic Context Rendering**: Fast asynchronous Next.js React UI that avoids unnecessary refreshes, syncing data directly to and from your PostgreSQL schema dynamically.
- **Predictive Aesthetics**: Designed with modern UI/UX principles emphasizing glassmorphism, Rechart visuals, and fluid `lucide-react` icons.

## ⚙️ Tech Stack

- **Backend**: Go (1.26), PostgreSQL (15-alpine), `sqlc` (Type-safe SQL Generation), Chi Router, and bcrypt/JWT Auth.
- **Frontend**: React, Next.js (Client-side rendered Context flows), TailwindCSS, Recharts.
- **Orchestration**: Docker, Docker Compose, custom `Makefile` for zero-configuration building.

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- `make` utility

### Local Deployment

To build and stand up the entire architecture (Frontend, Backend, and Database), simply use the provided Makefile:

```bash
# Compile dependencies and Build the Docker images
make build

# Start the application detached
make up
```

This starts the infrastructure:
- **Postgres Database**: Port `5433` (Internal `5432`)
- **Go API Backend**: Port `8080` (Internal `8080`)
- **Next.js Interface**: Port `3001` (Internal `3000`)

### Accessing the Platform

1. Navigate your browser to: **[http://localhost:3001](http://localhost:3001)**
2. You will be greeted by the Secure Terminal Interceptor. 
3. **Log In** via the Seeded Admin Account:
   - **Email**: `admin@transitops.com`
   - **Password**: `password123`
4. **Or Register** a brand new account and select your designated role to test out the varying frontend configurations!

## 🛠️ Available Commands

The following commands securely route docker capabilities via `make`:

- `make all` / `make up`: Start the containers in detached mode.
- `make build`: Build the entire Docker network.
- `make down`: Stop and forcibly tear down the DB volume and network schema.
- `make logs`: View logs for all running services in real-time.
- `make restart`: Instantly reboot the ecosystem.
- `make clean`: Shut down services and deeply prune unused docker objects.

## 📚 Documentation
For complete technical schemas, architecture configurations, and API structures, refer to:
- [API Documentation](docs/api.md)
- [Architecture & Design Schema](docs/architecture.md)