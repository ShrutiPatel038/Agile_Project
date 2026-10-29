# Test Strategy — EV-Go

## 1. Scope

This document describes the testing strategy for the EV-Go EV rental platform (MERN stack). It covers manual testing (implemented), and the planned automated testing approach.

---

## 2. Test levels

| Level | Coverage target | Tooling (planned) | Status |
|---|---|---|---|
| Unit | Utility functions, pricing logic, validation | Jest + Node test runner | Planned |
| Integration | API endpoints with a real MongoDB test database | Supertest + Jest | Planned |
| E2E | Full user flows in a browser | Playwright | Planned |

Automated tests are not implemented in this repository (per course scope). Manual test cases are in `manual-test-cases.md`. The planned implementation is described below.

---

## 3. TDD approach

For this project, Test-Driven Development would be applied to the pricing, deposit, and refund utility functions because they contain the most complex business logic, are pure functions (no DB dependency), and have a large number of edge cases.

### Workflow

1. Write a failing test that describes the expected behaviour.
2. Write the minimum code to pass the test.
3. Refactor without breaking the test.

### Example test cases (written out)

#### TC-TDD-01: `calculateRentalCost` — base price per hour

```js
// backend/utils/pricingUtils.test.js
import { calculateRentalCost } from './pricingUtils.js';

test('charges pricePerHour × hours for a standard booking', () => {
  const vehicle = { pricePerHour: 150 };
  const startTime = new Date('2026-10-28T09:00:00Z');
  const endTime   = new Date('2026-10-28T13:00:00Z'); // 4 hours
  expect(calculateRentalCost(vehicle, startTime, endTime)).toBe(600);
});
```

#### TC-TDD-02: `calculateSecurityDeposit` — 10 % clamped to [500, 5000]

```js
test('security deposit is 10% of totalCost, clamped to minimum 500', () => {
  expect(calculateSecurityDeposit(300)).toBe(500);   // 30 < 500, clamps to 500
  expect(calculateSecurityDeposit(2000)).toBe(200);  // 10% = 200 < 500, clamps to 500
  expect(calculateSecurityDeposit(8000)).toBe(800);  // 10% = 800, within range
  expect(calculateSecurityDeposit(70000)).toBe(5000); // 7000 > 5000, clamps to 5000
});
```

#### TC-TDD-03: `requestRefund` — tiered refund policy

```js
// The refund policy: >24h = 100%, 12–24h = 75%, 6–12h = 50%, <6h = 25%
test('refund is 100% when cancellation is more than 24h before start', () => {
  const booking = {
    totalCost: 800,
    startTime: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30h from now
    status: 'cancelled',
    paymentStatus: 'completed',
    securityDeposit: { amount: 500, status: 'held' },
    refund: { status: 'none' }
  };
  // Expected: 100% of 800 + 500 deposit = 1300
  expect(calculateRefundAmount(booking)).toBe(1300);
});

test('refund is 50% when cancellation is 8h before start', () => {
  const booking = {
    totalCost: 800,
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
    status: 'cancelled',
    paymentStatus: 'completed',
    securityDeposit: { amount: 500, status: 'held' },
    refund: { status: 'none' }
  };
  // Expected: 50% of 800 + 500 deposit = 900
  expect(calculateRefundAmount(booking)).toBe(900);
});
```

---

## 4. Unit test plan

### What would be unit-tested

| Module | Functions | Why |
|---|---|---|
| `pricingUtils.js` | `getDurationHours`, `calculateRentalCost`, `calculateSecurityDeposit`, `calculateOvertimeRate`, `calculateBookingCost` | Pure functions, many edge cases |
| `bookingValidationUtils.js` | `validateBookingTimes`, `calculatePaymentDeadline` | Business rules with multiple branches |
| `refundController.js` refund amount logic | Tiered % calculation | Critical financial logic |
| `socketAuth.js` | Token extraction from cookie header | String parsing edge cases |

### What would NOT be unit-tested (integration/E2E instead)

- Route handlers (depend on `req`, `res`, DB)
- Controllers with Mongoose calls
- Job timer callbacks in `jobs/` (depend on MongoDB and real timers)

---

## 5. Integration test plan

### Target: API routes with real MongoDB (in-memory or Docker)

Tool: **Supertest** + **Jest** + **mongodb-memory-server**

| Route | Test cases |
|---|---|
| `POST /api/auth/register` | valid registration; duplicate email → 400; missing fields → 400 |
| `POST /api/auth/login` | valid credentials → 200 + cookie; wrong password → 401 |
| `GET /api/public/stations` | returns cached list; cache miss populates cache |
| `POST /api/bookings` | valid booking → 201 + reserved vehicle; overlap → 409; past time → 400 |
| `POST /api/payments/verify` | valid HMAC → 200 + paymentStatus=completed; invalid HMAC → 400 |

---

## 6. E2E test plan

### Target: full user flows in a running app

Tool: **Playwright** (headless Chromium)

| Flow | Steps |
|---|---|
| User booking flow | Register → browse stations → select vehicle → book → pay (test mode) → view confirmed booking |
| Station master flow | Login as SM → view pending bookings → start ride → complete ride |
| Super-admin flow | Login as SA → create station → add vehicle → create SM → view analytics |
| Refund flow | Cancel booking >24h before start → request refund → verify 100% amount returned |

---

## 7. Test environment

| Environment | Database | Notes |
|---|---|---|
| Unit | None (mocked) | Fast; pure logic only |
| Integration | mongodb-memory-server (replica set mode) | No external services; the app needs only MongoDB |
| E2E | Docker Compose stack | Full app running |
| Manual | Local dev (`npm run dev:roles`) or Docker Compose | One frontend port per role for multi-role scenarios |
