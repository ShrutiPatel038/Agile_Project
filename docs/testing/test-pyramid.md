# Test Pyramid — EV-Go

## Planned pyramid

```
          ▲
         /E2E\        ~10%   Playwright — full booking + payment flows
        /─────\
       /  Integ \     ~30%   Supertest + mongodb-memory-server — API routes
      /──────────\
     /    Unit    \   ~60%   Jest — pricingUtils, bookingValidationUtils, refund logic
    ──────────────────
```

## Target breakdown

| Layer | Tool | Count (planned) | What is tested |
|---|---|---|---|
| Unit | Jest | ~40 tests | `pricingUtils`, `bookingValidationUtils`, refund tier logic, `socketAuth` cookie extraction |
| Integration | Supertest + Jest | ~25 tests | Auth routes, booking creation (overlap), payment verify (HMAC), cache behaviour |
| E2E | Playwright | ~8 flows | Register→book→pay, SM ride lifecycle, SA CRUD, refund request |

## Rationale

- **Unit (60%):** The pricing and validation utilities are pure functions with multiple branches. They run in <1ms each and give the fastest confidence that the financial logic is correct.
- **Integration (30%):** The booking double-booking prevention relies on a Mongoose transaction + atomic check against a real MongoDB instance. It cannot be tested purely with mocks. Similarly, payment HMAC verification is meaningless without the real crypto path.
- **E2E (10%):** The full React → Express → MongoDB → Razorpay (test mode) flow is tested end-to-end for the two most critical journeys: booking + payment, and SM ride start/complete. These are expensive and slow, so they are kept small.

## Why not higher E2E coverage?

E2E tests for EV-Go are slow (~20s per flow) because:
1. The Razorpay Checkout opens in an iframe — Playwright must interact with it via test credentials.
2. Socket.IO events need the full stack (Redis, backend, frontend) running.
3. The MongoDB replica set needs ~10s to initialise.

Unit + integration tests catch 90% of regressions at a fraction of the time. E2E covers the happy path and the two most failure-prone flows.

## CI integration

```yaml
# Planned CI additions (Sprint 5, beyond course scope)
unit-tests:
  runs: jest --testPathPattern=utils
  time: ~5s

integration-tests:
  runs: jest --testPathPattern=routes
  needs: [unit-tests]
  time: ~30s

e2e-tests:
  runs: playwright test
  needs: [docker]   # full Compose stack
  time: ~3min
```

## Coverage goals

| Layer | Line coverage target |
|---|---|
| Unit | 90% of `utils/` |
| Integration | 80% of `controllers/` |
| E2E | Top 2 user journeys 100% |
