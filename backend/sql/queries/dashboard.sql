-- name: GetDashboardKPIs :one
-- Single query that computes all dashboard KPIs using conditional aggregation.
-- This avoids N+1 round trips to the database.
SELECT
    -- Vehicle KPIs
    COUNT(v.id)                                                    AS total_vehicles,
    COUNT(v.id) FILTER (WHERE v.status = 'Available')              AS available_vehicles,
    COUNT(v.id) FILTER (WHERE v.status = 'On Trip')                AS active_vehicles,
    COUNT(v.id) FILTER (WHERE v.status = 'In Shop')                AS vehicles_in_maintenance,
    COUNT(v.id) FILTER (WHERE v.status = 'Retired')                AS retired_vehicles,

    -- Fleet Utilization = (On Trip) / (Total - Retired) * 100
    -- COALESCE to 0 if there are no non-retired vehicles to avoid division by zero
    COALESCE(
        ROUND(
            COUNT(v.id) FILTER (WHERE v.status = 'On Trip') * 100.0
            / NULLIF(COUNT(v.id) FILTER (WHERE v.status != 'Retired'), 0),
            1
        ), 0
    )                                                              AS fleet_utilization_pct,

    -- Trip KPIs (subqueries to avoid cross-join multiplication)
    (SELECT COUNT(*) FROM trips WHERE status = 'Dispatched')       AS active_trips,
    (SELECT COUNT(*) FROM trips WHERE status = 'Draft')            AS pending_trips,
    (SELECT COUNT(*) FROM trips WHERE status = 'Completed')        AS completed_trips,

    -- Driver KPIs
    (SELECT COUNT(*) FROM drivers WHERE status = 'On Trip')        AS drivers_on_duty,
    (SELECT COUNT(*) FROM drivers WHERE status = 'Available')      AS available_drivers,
    (SELECT COUNT(*) FROM drivers)                                 AS total_drivers
FROM vehicles v;
