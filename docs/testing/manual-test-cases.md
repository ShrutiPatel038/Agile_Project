# Manual Test Cases — EV-Go

> Run against a local `docker compose up` stack or a running dev environment.
> Base URL: `http://localhost:5000/api` (backend) · `http://localhost:5173` (frontend)

---

## Auth (EVG-23, EVG-24, EVG-25)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-01 | EVG-23 | Register a new user | POST `/auth/register` `{name, email, password}` | 201 · JWT cookie set · `{user, token}` |
| MT-02 | EVG-23 | Duplicate email blocked | Register same email twice | 400 · `{ message: 'Email already exists' }` |
| MT-03 | EVG-23 | Login valid user | POST `/auth/login` with correct password | 200 · JWT cookie set |
| MT-04 | EVG-24 | Station-master route blocked for user | GET `/station-master/dashboard-data` with user JWT | 403 |
| MT-05 | EVG-25 | Rate limit on login | POST `/auth/login` 11 times in 15 min | 429 on 11th request |

---

## Stations & Vehicles (EVG-27, EVG-28, EVG-29, EVG-30)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-06 | EVG-29 | SA creates station | POST `/super-admin/stations` `{name, address, coordinates, totalSlots}` | 201 · station object returned |
| MT-07 | EVG-30 | SA adds vehicle to station | POST `/super-admin/vehicles` `{stationId, modelName, pricePerHour, ...}` | 201 · vehicle with `status: available` |
| MT-08 | EVG-27 | Public station list (cache miss) | GET `/public/stations` (first call) | 200 · array of stations · Redis now holds `public:stations` |
| MT-09 | EVG-27 | Public station list (cache hit) | GET `/public/stations` again within 1h | Same result · response time < first call |
| MT-10 | EVG-28 | Vehicle availability check | GET `/public/vehicles/:stationId/available?start=&end=` | Returns vehicles not overlapping the window |

---

## Booking (EVG-33, EVG-34)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-11 | EVG-33 | Create valid booking | POST `/bookings` with valid startTime, endTime, vehicleId, stationId | 201 · booking with `status: pending-confirmation` · vehicle `status: reserved` |
| MT-12 | EVG-33 | Double-booking blocked | Two concurrent POST `/bookings` for same vehicle and overlapping time | One returns 201; second returns 409 `Already booked` |
| MT-13 | EVG-33 | Past start time rejected | POST `/bookings` with `startTime` in the past | 400 `Start time must be in the future` |
| MT-14 | EVG-34 | View my bookings | GET `/bookings/mybookings` | Array of user's bookings with paymentStatus |
| MT-15 | EVG-34 | Modify booking timing | PUT `/bookings/:id/modify` with new `endTime` | 200 · updated totalCost |

---

## Payments & Refunds (EVG-37, EVG-38, EVG-39)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-16 | EVG-37 | Create Razorpay order | POST `/payments/create-order` `{bookingId}` | 200 · `{orderId, amount, currency, keyId}` |
| MT-17 | EVG-37 | Verify payment (valid HMAC) | POST `/payments/verify` with correct `razorpay_signature` | 200 · `{success: true}` · booking `paymentStatus: completed` |
| MT-18 | EVG-37 | Reject invalid HMAC | POST `/payments/verify` with tampered signature | 400 `Invalid payment signature` |
| MT-19 | EVG-38 | Webhook idempotency | POST `/payments/webhook` twice with same `payment.captured` event | Both return 200 · booking updated only once |
| MT-20 | EVG-38 | Webhook requires raw body | POST `/payments/webhook` — check that `x-razorpay-signature` passes HMAC | 200 (fails if body was parsed by express.json first) |
| MT-21 | EVG-39 | Refund >24h before start | Cancel confirmed booking 30h before start · POST `/refunds/request` | Refund amount = 100% totalCost + securityDeposit |
| MT-22 | EVG-39 | Refund 8h before start | Cancel 8h before start · POST `/refunds/request` | Refund amount = 50% totalCost + securityDeposit |

---

## Station Master (EVG-35, EVG-36)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-23 | EVG-35 | Start ride — payment not complete | PUT `/station-master/bookings/:id` `{status: active}` on booking with `paymentStatus: pending` | 400 `Payment must be completed before starting ride` |
| MT-24 | EVG-35 | Start ride — payment complete | Same request on booking with `paymentStatus: completed` | 200 · booking `status: active` · vehicle `status: in-use` |
| MT-25 | EVG-35 | Complete ride | PUT `/station-master/bookings/:id` `{status: completed}` on active booking | 200 · vehicle freed · booking `status: completed` |
| MT-26 | EVG-36 | Dashboard data | GET `/station-master/dashboard-data` | Returns `{stats, vehicles, confirmedBookings, activeRides}` · isOverdue flag set on rides past endTime |

---

## Real-time (EVG-40)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-27 | EVG-40 | Socket.IO connect | Open frontend, observe browser console | `Socket connected: <id>` logged after login |
| MT-28 | EVG-40 | Booking confirmed event | Complete payment while browser is open | `booking_confirmed` event received · MyBookings refreshes |
| MT-29 | EVG-40 | SM dashboard refresh | SM browser open while user pays for booking | `dashboard_refresh` event → Confirmed Bookings list updates |

---

## Loyalty & Engagement (EVG-45, EVG-46, EVG-47)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-30 | EVG-45 | Points earned after payment | GET `/loyalty/profile` after completing a ₹800 payment | `loyaltyPoints` increased by 8 (`floor(800/100)`) |
| MT-31 | EVG-45 | Redeem points | POST `/loyalty/redeem` `{points: 100}` | `discountValue: 100` · `remainingPoints` reduced by 100 |
| MT-32 | EVG-46 | Create support ticket | POST `/support` `{subject, description, category: 'payment', priority: 'urgent'}` | 201 · `sla.responseDeadline` = now + 1h |
| MT-33 | EVG-47 | Toggle favorite | POST `/favorites/:vehicleId` | First call → `isFavorite: true`; second call → `isFavorite: false` |

---

## Super-Admin Analytics (EVG-44)

| ID | Story | Scenario | Steps | Expected result |
|---|---|---|---|---|
| MT-34 | EVG-44 | Get analytics (cache miss) | GET `/super-admin/analytics` (first call, cold cache) | 200 · `{financials, fleet, loyaltyTiers, topStations, monthlyRevenue, support}` |
| MT-35 | EVG-44 | Get analytics (cache hit) | GET `/super-admin/analytics` again within 12h | Same result · faster response (Redis cache hit) |
