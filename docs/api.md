# API Documentation

The TransitOps backend exposes a v1 RESTful application programming interface. The API uses JSON bodies for requests and returns standardized JSON responses.

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication
Most endpoints require a valid JWT token. The token should be sent in the `Authorization` header as a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

### Public Routes

- `GET /healthz`: Application readiness probe.
- `POST /login`: Generate JWT token for access.

### Protected Routes (Requires Auth)

#### Dashboard
- `GET /dashboard`: Get centralized operational state.

#### Vehicles
- `GET /vehicles`: List all vehicles.
- `POST /vehicles`: Register a new vehicle.
- `GET /vehicles/{vehicleID}`: Get vehicle details.
- `PUT /vehicles/{vehicleID}`: Update vehicle properties/status.

#### Drivers
- `GET /drivers`: List all drivers.
- `POST /drivers`: Register a new driver.
- `GET /drivers/{driverID}`: Get driver specifics.
- `PUT /drivers/{driverID}`: Update driver availability/status.

#### Trips
- `GET /trips`: Get ongoing and past trips.
- `POST /trips`: Create a trip plan.
- `PUT /trips/{tripID}/dispatch`: Dispatch a trip, converting vehicles/drivers to 'On Trip'.
- `PUT /trips/{tripID}/complete`: Mark a trip as completed.
- `PUT /trips/{tripID}/cancel`: Safely cancel a pending trip.

#### Maintenance & Work Orders
- `GET /maintenance`: Fetch all work orders.
- `POST /vehicles/{vehicleID}/maintenance`: Open a work order.
- `PUT /maintenance/{logID}/close`: Resolve a work order.

#### Fleet Analytics & Costs
- `POST /fuel-logs`: Log fuel transaction.
- `GET /fuel-logs`: Fetch fleet-wide fuel logs.
- `POST /expenses`: Record miscellaneous expenses.
- `GET /expenses`: See fleet-wide expense reports.
- `GET /vehicles/{vehicleID}/expenses`: View expenses scoped to a specific vehicle.
- `GET /operational-costs`: Gets O(F+M+E+V) combined analytics in a single query payload.
