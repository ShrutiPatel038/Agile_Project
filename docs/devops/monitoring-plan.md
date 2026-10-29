# Monitoring Plan — EV-Go

## What we monitor and why

EV-Go handles real financial transactions (Razorpay) and real-time vehicle reservations. A failed payment or a double-booking has a direct user impact, so monitoring focuses on those flows first.

---

## Logging (implemented)

Winston + Morgan are already wired in the codebase.

| Event | Log level | Fields logged |
|---|---|---|
| Server start | `info` | port, NODE_ENV |
| MongoDB connected | `info` | host |
| HTTP request | `http` (Morgan) | method, url, status, response time |
| Booking created | `info` | bookingId, userId, vehicleId, stationId, totalCost |
| Booking cancelled | `info` | bookingId, reason |
| Payment verified | `info` | bookingId, razorpayOrderId (no payment payload) |
| Payment failed | `warn` | bookingId, error message |
| Webhook received | `info` | event type only (no payload) |
| Job scheduled (payment timeout / overtime) | `info` | bookingId, minutes until it fires |
| Job completed | `info` | jobId |
| Job failed | `error` | jobId, error message |
| Cron result | `info` | job name, count affected |
| Global error handler | `error` | message, stack |

**Never logged:** passwords, JWTs, full payment payloads, Razorpay secrets, card numbers.

Log files (production): `backend/logs/app.log` (all levels), `backend/logs/error.log` (error only). Both in `.gitignore`.

> Many controllers restored from the original project still use `console.log` / `console.error`. Those lines reach the container stdout but not the Winston log files; moving them to `logger` is a known to-do.

---

## Metrics (planned — Prometheus + Grafana)

> Not implemented in this repo. This section describes what would be instrumented.

### Backend metrics (prom-client)

| Metric | Type | Labels | Alert threshold |
|---|---|---|---|
| `http_request_duration_seconds` | Histogram | method, route, status | p95 > 2s |
| `http_requests_total` | Counter | method, route, status | 5xx rate > 1% |
| `booking_created_total` | Counter | — | — (informational) |
| `payment_verified_total` | Counter | status (success/fail) | fail rate > 5% |
| `job_duration_seconds` | Histogram | job (payment_timeout, overtime, email) | p95 > 30s |
| `job_failures_total` | Counter | job | > 10/min |
| `pending_job_timers` | Gauge | job | — (informational; drops to 0 after a restart) |
| `active_socket_connections` | Gauge | — | > 500 |

### Infrastructure metrics (CloudWatch / node-exporter)

| Metric | Alert |
|---|---|
| CPU utilisation (ECS task) | > 80% for 5 min |
| Memory usage (ECS task) | > 85% |
| MongoDB connections | > 80% of pool |
| Backend process heap (cache + timers live in memory) | > 80% of container limit |

---

## Alerting (planned)

| Trigger | Severity | Channel | Who |
|---|---|---|---|
| payment_verified_total fail rate > 5% | Critical | PagerDuty + Slack #alerts | On-call dev |
| 5xx rate > 1% sustained 5 min | High | Slack #alerts | On-call dev |
| Confirmation email failures > 10/min | High | Slack #alerts | On-call dev |
| MongoDB replica set primary step-down | Critical | PagerDuty | On-call dev |
| CPU > 80% 5 min | Medium | Slack #infra | Team |
| Cron job: 0 bookings cancelled in 1h (expected > 0) | Low | Slack #infra | Team |

---

## Dashboards (planned — Grafana)

### Dashboard 1: Business health

- Bookings created / hour (line chart, last 24h)
- Payments verified vs failed (stacked bar)
- Active bookings now (gauge)
- Revenue today (counter)

### Dashboard 2: System health

- HTTP request rate and p95 latency (line chart)
- 5xx rate (gauge, green < 0.1%, red > 1%)
- Pending job timers (line chart)
- Socket.IO active connections (gauge)

### Dashboard 3: Infrastructure

- ECS CPU and memory per task
- MongoDB connection pool utilisation
- Backend heap usage and cache hit rate
- Error log rate from CloudWatch Logs Insights

---

## Log aggregation (planned)

Winston JSON logs → CloudWatch Logs → CloudWatch Logs Insights for ad-hoc queries.

Example query — find all failed payments in the last hour:

```
fields @timestamp, bookingId, message
| filter level = "warn" and message like /Payment failed/
| sort @timestamp desc
| limit 50
```

---

## Runbook: payment failure spike

1. Check Grafana: is `payment_verified_total` fail rate elevated?
2. Check Winston logs for `Payment failed` entries → what error message is Razorpay returning?
3. Check Razorpay dashboard for webhook delivery failures.
4. If Razorpay is down: bookings with `paymentStatus: pending` will be cleaned up by the 10-min cron watchdog (cancels bookings past their payment deadline).
5. Notify affected users via support ticket system.
