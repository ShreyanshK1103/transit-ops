FROM golang:alpine AS builder


WORKDIR /app

# Download dependencies first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the Go application
RUN go build -o main cmd/api/main.go

# Use a clean alpine image for runtime
FROM alpine:latest
WORKDIR /app

# Copy the built binary
COPY --from=builder /app/main .

EXPOSE 8080
CMD ["./main"]
