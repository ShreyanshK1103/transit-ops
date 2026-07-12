.PHONY: all build up down logs restart clean

# Default target
all: up

# Build all docker images
build:
	docker compose build

# Start all services in the background
up:
	docker compose up -d

# Stop and remove all containers, networks, and volumes
down:
	docker compose down -v

# View logs for all services
logs:
	docker compose logs -f

# Restart all services
restart: down up

# Clean up stopped containers and unused images
clean: down
	docker system prune -f
