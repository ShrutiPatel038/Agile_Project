# Sprint 2 Review — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 2 |
| **Review date** | Tue 2026-10-28 (end of Day 2) |
| **Attendees** | Mitali Radia (PO), Muskan Dalsania (SM), Shruti Patel (Dev) |
| **Velocity** | 35 SP committed → 35 SP accepted |

---

## Sprint goal — achieved ✓

> Make EV-Go bookable end-to-end: super admin sets up stations and vehicles, a user browses and creates a booking, a station master starts and completes the ride.

All acceptance criteria for the committed stories were met.

---

## Stories completed vs committed

| Key | Story | SP | Status |
|---|---|---|---|
| EVG-27 | Browse stations | 2 | ✓ Accepted |
| EVG-28 | Browse vehicles available for a time window | 3 | ✓ Accepted |
| EVG-29 | SA manages stations | 3 | ✓ Accepted |
| EVG-30 | SA manages vehicles (CRUD + image upload) | 3 | ✓ Accepted |
| EVG-31 | SA manages station masters | 3 | ✓ Accepted |
| EVG-32 | In-app notifications (stub; real Notification model Sprint 3) | 1 | ✓ Accepted |
| EVG-33 | Create booking without double-booking | 8 | ✓ Accepted |
| EVG-34 | View & modify my bookings | 5 | ✓ Accepted |
| EVG-35 | SM starts / completes / cancels rides | 3 | ✓ Accepted |
| EVG-36 | SM station dashboard | 4 | ✓ Accepted |

**Total: 35 SP accepted / 35 SP committed**

---

## Demo script

All URLs assume `backend` running on `http://localhost:5000` and `frontend` on `http://localhost:5173`.

### Step 1 — Super admin: create station
```
POST /api/super-admin/stations
{ "name": "Ahmedabad Central", "location": "SG Highway, Ahmedabad" }
→ 201 { station object }
```
Cache key `public:stations` is evicted. Subsequent `GET /api/public/stations` returns the new station.

### Step 2 — Super admin: add vehicle
```
POST /api/super-admin/vehicles  (multipart/form-data)
modelName=EV Trail X | pricePerHour=150 | stationId=<id> | image=<file>
→ 201 { vehicle object }
```

### Step 3 — Super admin: create station master
```
POST /api/super-admin/users/masters
{ "name": "Raj Mehta", "email": "raj@evgo.in", "password": "Test@1234", "stationId": "<id>" }
→ 201 { message: "Station Master account created successfully." }
```

### Step 4 — User: browse available vehicles
```
GET /api/public/vehicles?stationId=<id>&startTime=2026-10-28T09:00:00Z&endTime=2026-10-28T11:00:00Z
→ [ { vehicle }, ... ]  — only non-conflicting vehicles returned
```
Frontend: navigate to `/vehicles`, select the station, set start/end times, click "Find Vehicles". EV Trail X appears.

### Step 5 — User: create booking
```
POST /api/bookings
{ vehicleId, stationId, startTime, endTime, emergencyContacts: [] }
→ 201 { booking }  status: "confirmed", paymentStatus: "pending"
```
Frontend: click "Book Now" on a vehicle card → BookingModal → select time slot, click "Book Now".

### Step 6 — Manually mark payment completed (Sprint 3 adds Razorpay)
```
# Directly in MongoDB or via Mongo shell:
db.bookings.updateOne({ _id: ObjectId("...") }, { $set: { paymentStatus: "completed" } })
```

### Step 7 — Station master: start ride
```
PUT /api/station-master/bookings/<id>
{ "status": "active" }
→ { message: "Booking status updated to active" }
```
Frontend: log in as station master → `/dashboard` → Confirmed Bookings table → click "Start Ride".

### Step 8 — Station master: complete ride
```
PUT /api/station-master/bookings/<id>
{ "status": "completed" }
→ { message: "Booking status updated to completed" }
```
Frontend: Active Rides table → click "Complete".

### Step 9 — User: view booking history
Frontend: `/profile` → My Bookings shows booking with status "completed".

### Step 10 — Station master: verify dashboard stats update
Reload `/dashboard` — Total Vehicles back to available, Active Rides count decrements.

---

## Feedback / decisions recorded

| Item | Decision |
|---|---|
| `paymentStatus: pending` bookings can't start | SM is prompted; payment step ships in Sprint 3 (EVG-37) |
| BookingModal shows "Simulate Payment" stub | Acceptable for Sprint 2 demo; real Razorpay in Sprint 3 |
| Socket.IO real-time refresh not yet wired | Dashboard requires manual reload; fixed in Sprint 3 (EVG-41) |
| Notification model stubbed | `createNotificationUtil` logs a debug line; real model in Sprint 3 |

---

## Backlog changes

- No scope changes. Sprint 3 adds payment (EVG-37, EVG-38, EVG-39), real-time (EVG-41), and background jobs (EVG-42, EVG-43, EVG-44).
