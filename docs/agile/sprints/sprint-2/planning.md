# Sprint 2 Planning — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 2 |
| **Date** | Mon 2026-10-27 (1-day sprint; started late — Sprint 1 carried over) |
| **Time-box** | 09:00 – 17:00 |
| **Scrum Master** | Muskan Dalsania |
| **Product Owner** | Mitali Radia |
| **Developers** | Mitali Radia, Muskan Dalsania, Shruti Patel |

---

## Sprint goal

> **Make EV-Go bookable end-to-end:** a super admin sets up a station, adds vehicles and assigns a station master. A user browses stations, picks a free vehicle, creates a booking, and a station master starts and completes the ride.

Payment is deferred to Sprint 3. Bookings created this sprint keep `paymentStatus: pending`. The station master start-ride demo uses a seeded paid booking.

---

## Capacity

| | |
|---|---|
| Team size | 3 |
| Dev time per person | ~4.5 h (6 h total minus 1.5 h ceremonies) |
| **Total dev capacity** | **13.5 dev hours** |

Sprint 1 retro action A3: commitment is set conservatively — Sprint 1 ran over, so the team started Sprint 2 slightly later than planned. The 35 SP commitment reflects stories already understood from Sprint 1 planning (all are Must/Should with complete AC).

---

## Committed work

### Stories (pointed)

| Key | Story | SP | Priority | Owner |
|---|---|---|---|---|
| EVG-27 | Browse stations | 1 | Must | Shruti |
| EVG-28 | Browse vehicles available for a time window | 3 | Must | Shruti |
| EVG-29 | Super admin manages stations | 2 | Must | Mitali |
| EVG-30 | Super admin manages vehicles | 3 | Must | Mitali |
| EVG-31 | Super admin manages station masters | 3 | Must | Muskan |
| EVG-32 | In-app notifications | 2 | Should | Muskan |
| EVG-33 | Create a booking without double-booking | 8 | Must | Mitali + Muskan |
| EVG-34 | View and modify my bookings | 5 | Must | Shruti |
| EVG-35 | Station master starts, completes and cancels rides | 5 | Must | Muskan |
| EVG-36 | Station master dashboard | 3 | Must | Shruti |
| | **Sprint total** | **35 SP** | | |

### Tasks (unestimated)

| Key | Task | Owner |
|---|---|---|
| EVG-18 | Sprint 2 ceremonies (this doc + review + retro) | Muskan |

---

## Task breakdown

### EVG-27 + EVG-28 — Stations & vehicles browse (Shruti, ~1 h)
- [ ] Port `Station` and `Vehicle` models with all indexes
- [ ] Cache service (Redis + in-memory Map fallback) — `cacheService.get/set/del`
- [ ] `GET /api/public/stations` — cache-aside, 1 h TTL (`public:stations` key)
- [ ] `GET /api/public/vehicles?stationId=&startTime=&endTime=` — conflict-aware availability check against Booking model

### EVG-29 + EVG-30 + EVG-31 — Super admin CRUD (Mitali + Muskan, ~1.5 h)
- [ ] Station CRUD endpoints (`/api/super-admin/stations`) — invalidate `public:stations` on write
- [ ] Vehicle CRUD endpoints (`/api/super-admin/vehicles`) with `multer` image upload
- [ ] Station master user creation and station assignment (`/api/super-admin/station-masters`)

### EVG-32 — In-app notifications (Muskan, ~30 min)
- [ ] `Notification` model (userId, message, type, isRead, bookingId ref)
- [ ] `createNotificationUtil` helper used by booking and payment controllers
- [ ] `GET /api/notifications` (paginated, unread count) + `PATCH /api/notifications/:id/read`

### EVG-33 — Booking creation (Mitali + Muskan, ~2 h)
- [ ] `Booking` model — all fields from source including `status` enum, `securityDeposit`, `overtimeCharges`, `modifications[]`
- [ ] Pricing util: `totalCost = hours × pricePerHour + oneWayFee`, `deposit = min(max(10%×cost, ₹500), ₹5000)`
- [ ] `createBooking`: MongoDB session + transaction, overlap check, `findByIdAndUpdate` reservation (source pattern, not `findOneAndUpdate`)
- [ ] 11 validations: vehicle exists + available, station active, time slot valid, no overlap, etc.

### EVG-34 — View & modify bookings (Shruti, ~1 h)
- [ ] `GET /api/bookings/my` — user's own bookings with pagination
- [ ] `GET /api/bookings/:id` — single booking (owner or station master or SA)
- [ ] `PATCH /api/bookings/:id/modify` — extend/shorten within rules (not active/completed/cancelled)

### EVG-35 + EVG-36 — Station master operations (Muskan, ~1.5 h)
- [ ] `updateBookingStatus`: confirmed→active (requires `paymentStatus=completed`), active→completed, any→cancelled
- [ ] Overtime job scheduled on active→completed transition (wired in Commit 34)
- [ ] Dashboard: active bookings for station, today's schedule, vehicle statuses

### Frontend pages (Shruti + Mitali, ~2 h)
- [ ] `StationsPage` — list all stations with name, location, available vehicle count
- [ ] `VehiclesPage` — filter by station + time window, show price/type
- [ ] `BookingFormPage` — select slot, show price breakdown, submit
- [ ] `MyBookingsPage` — list bookings with status badges, modify option
- [ ] `StationMasterDashboard` — active bookings table, start/complete/cancel buttons
- [ ] Wire real components into `App.jsx` (replace placeholders)
- [ ] `Navbar` with role-aware links

---

## Definition of Ready check

All committed stories pass DoR:
- [x] Written as *As a … I want … so that …* with JIRA key — [user-stories.md](../../user-stories.md)
- [x] Given/When/Then AC written for every story
- [x] Estimated (≤ 8 SP), MoSCoW priority set
- [x] Dependencies: EVG-27/28 need Station + Vehicle models; EVG-33 needs both; EVG-29/30/31 need models too; EVG-32 used by EVG-33+35
- [x] External: no Razorpay this sprint; MongoDB replica set needed for EVG-33 transactions

---

## Sprint 2 risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| EVG-33 (booking transaction) is 8 SP — biggest story | High | Pair Mitali + Muskan on it; start first |
| Notification util (EVG-32) must exist before booking controller calls it | Medium | Port EVG-32 model first, even if frontend comes later |
| Frontend placeholder pages need replacing in same sprint | Medium | Shruti owns frontend; pair with Mitali for booking form |
| Sprint started late due to Sprint 1 carry-over | Medium | Accept reduced buffer; cut EVG-32 (Should) if time runs out |
