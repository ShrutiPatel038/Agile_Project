# User Stories — EV-Go

Each story has the form **As a / I want / so that**, plus acceptance criteria in **Given / When / Then**, priority (MoSCoW), story points and its JIRA key. Ordering and totals are in [product-backlog.md](product-backlog.md).

Roles: **User** (`user`), **Station Master** (`station-master`), **Super Admin** (`super-admin`). "Team" means the development team, for technical stories.

---

## Sprint 1

### EVG-21 · Backend foundation: health check, logging, config
**Epic** EVG-11 · **Priority** Must · **SP** 3

As the team, I want a health endpoint, structured logs and one place for configuration, so that containers can be health-checked and problems can be traced from the logs.

- **Given** the backend is running, **when** I call `GET /health`, **then** I get `200` with `{ status: "ok" }`, uptime, and the MongoDB connection state.
- **Given** `NODE_ENV=production`, **when** the app logs, **then** each entry is JSON, written to `logs/app.log` (errors also to `logs/error.log`), at the level set by `LOG_LEVEL`.
- **Given** any HTTP request, **when** it completes, **then** Morgan writes one request line through the Winston logger.
- **Given** a route throws an unhandled error, **when** it reaches the global error handler, **then** the error is logged with method and path, and the client gets a JSON `500` with no stack trace in production.
- **Given** MongoDB is down at start-up, **when** the connection fails, **then** a warning is logged and the connection is retried every 5 seconds without crashing the process.
- Logs never contain passwords, JWTs or Razorpay secrets.

### EVG-22 · CI pipeline: lint and build on every push
**Epic** EVG-11 · **Priority** Must · **SP** 3

As the team, I want every push and pull request to `main` linted and built automatically, so that broken code is caught before it is merged.

- **Given** a push or PR to `main`, **when** GitHub Actions runs, **then** the backend job runs `npm ci` and `npm run lint` on the Node version from `.nvmrc`.
- **Given** the frontend exists, **when** the pipeline runs, **then** a frontend job runs `npm ci`, `npm run lint` and `npm run build`.
- **Given** a lint error in either app, **when** CI runs, **then** that job fails and the commit shows a red check.
- npm cache is enabled, and the README shows the CI status badge.

### EVG-23 · User registration and login
**Epic** EVG-2 · **Priority** Must · **SP** 5

As a User, I want to create an account and log in with my email and password, so that I can book vehicles and see my bookings.

- **Given** a new email, **when** I `POST /api/auth/register` with name, email and password, **then** I get `201` with my id, name, email, role `user` and a JWT, and an httpOnly `jwt` cookie is set (30-day expiry).
- **Given** an email that is already registered, **when** I register again, **then** I get `400 "User already exists"`.
- **Given** correct credentials, **when** I `POST /api/auth/login`, **then** I get `200` with my profile and a token. **Given** a wrong password, **then** I get `401 "Invalid email or password"`.
- **Given** I'm logged in, **when** I call `GET /api/auth/me`, **then** I get my profile without the password field.
- **Given** I log out, **when** `POST /api/auth/logout` is called, **then** the cookie is cleared and protected pages send me back to `/login`.
- Passwords are stored only as bcrypt hashes (10 salt rounds).
- A phone number is **not** needed at sign-up. It's added and verified later through OTP (EVG-49).
- **Frontend:** the Login and Register pages store the token, set the user in AuthContext, and keep me logged in across a page refresh.

### EVG-24 · Role-based access for User / Station Master / Super Admin
**Epic** EVG-2 · **Priority** Must · **SP** 3

As a Super Admin, I want each route restricted to the roles that need it, so that customers can't reach staff or admin functions.

- **Given** no token, **when** I call a protected route, **then** I get `401 "Not authorized, no token"`. **Given** an invalid or expired token, **then** `401 "Not authorized, token failed"`.
- The token is read from `Authorization: Bearer` first, then from the `jwt` cookie.
- **Given** a User, **when** they call `/api/station-master/*`, **then** they get `403`. Station Masters and Super Admins are allowed.
- **Given** a Station Master, **when** they call `/api/super-admin/*`, **then** they get `403`. Only Super Admins are allowed.
- **Frontend:** `/dashboard` is visible only to Station Masters, `/super-admin/*` only to Super Admins, and user pages only to logged-in users. Everyone else is redirected.

### EVG-25 · Rate limiting on sensitive endpoints
**Epic** EVG-2 · **Priority** Should · **SP** 2

As a Super Admin, I want repeated requests to sensitive endpoints throttled, so that brute-force and spam attempts are blocked.

- **Given** 5 login/register attempts from one IP within 15 minutes, **when** a 6th is sent, **then** it gets `429` with "Too many login attempts…".
- Limits also exist for payments (10 / 1 min), booking creation (20 / 10 min), OTP send (3 / 1 h) and general API use (100 / 15 min).
- Responses include the standard `RateLimit-*` headers.

---

## Sprint 2

### EVG-27 · Browse stations
**Epic** EVG-3 · **Priority** Must · **SP** 1

As a User, I want to see all EV-Go stations, so that I can choose where to pick up a vehicle.

- **Given** I'm on the home page, **when** it loads, **then** `GET /api/public/stations` returns every station with name and location, and no login is needed.
- **Given** the list was fetched in the last hour, **when** it is requested again, **then** it is served from the `public:stations` cache (Redis, or the in-memory fallback if Redis is down).
- **Given** a Super Admin creates or updates a station, **when** stations are next requested, **then** the cache has been invalidated and the change shows.

### EVG-28 · Browse vehicles available for a time window
**Epic** EVG-3 · **Priority** Must · **SP** 3

As a User, I want to see only the vehicles that are free at a station for my chosen start and end time, so that I don't try to book a car that's taken.

- **Given** a station, start time and end time, **when** I call `GET /api/public/vehicles?stationId&startTime&endTime`, **then** I get the station's vehicles except those under `maintenance` and those with an overlapping booking that is `confirmed`, `active` or `pending-confirmation`.
- Overlap means `existing.startTime < requested.endTime AND existing.endTime > requested.startTime`.
- **Given** any of the three parameters is missing, **then** I get `400`.
- **Frontend:** the Vehicles page has date pickers and shows each vehicle's image, price per hour and one-way option.

### EVG-29 · Super admin manages stations
**Epic** EVG-10 · **Priority** Must · **SP** 2

As a Super Admin, I want to create and edit stations, so that the network matches the real locations.

- **Given** a unique name and a location, **when** I `POST /api/super-admin/stations`, **then** the station is created and `public:stations` is invalidated.
- **When** I `PUT /api/super-admin/stations/:id`, **then** it is updated and the cache is invalidated.
- I can list all stations, see a station overview (vehicles, masters, bookings) and open the details of one station.

### EVG-30 · Super admin manages vehicles
**Epic** EVG-10 · **Priority** Must · **SP** 3

As a Super Admin, I want to add, edit and remove vehicles with a photo and pricing, so that customers see an accurate fleet.

- **Given** model name, station, price per hour and an image file, **when** I `POST /api/super-admin/vehicles` (multipart), **then** the image is saved and served under `/images`, and the vehicle is created with status `available`.
- I can set `allowOneWayTrip` and `oneWayDropOffFee`, battery level, mileage and licence plate.
- **When** I `PUT /api/super-admin/vehicles/:id` or `DELETE` it, **then** the change is saved and the station's staff get an in-app notification.
- A Station Master can add a vehicle to their own station through `POST /api/station-master/vehicles`.

### EVG-31 · Super admin manages station masters
**Epic** EVG-10 · **Priority** Must · **SP** 3

As a Super Admin, I want to create station masters and assign them to stations, so that every station is staffed before it takes bookings.

- **When** I `POST /api/super-admin/users/masters` with name, email, password and station, **then** a user with role `station-master` linked to that station is created and notified.
- I can update a master (`PUT /users/masters/:id`) or remove them (`DELETE /users/masters/:userId`), and the master gets a notification.
- **Given** stations with no master, **when** I run `POST /api/super-admin/cleanup-unmanaged`, **then** they're reported or cleaned up, and `GET /staff-data` shows staffing per station.

### EVG-32 · In-app notifications
**Epic** EVG-7 · **Priority** Should · **SP** 2

As a User, I want a list of notifications about my bookings, so that I don't miss changes even if I wasn't online when they happened.

- **Given** a system event (vehicle added, master assigned, booking cancelled…), **when** `createNotificationUtil` runs, **then** a Notification is saved with title, message, type and priority.
- `GET /api/notifications` returns my notifications, newest first, and `PUT /api/notifications/:id/read` marks one as read.
- Notifications are deleted automatically after 30 days (TTL index).

### EVG-33 · Create a booking without double-booking
**Epic** EVG-4 · **Priority** Must · **SP** 8

As a User, I want to book a specific vehicle for a time slot and know it's mine, so that I can plan my trip.

- **Given** valid details, **when** I `POST /api/bookings` with vehicleId, stationId, startTime and endTime, **then** a booking is created with `status: confirmed` and `paymentStatus: pending`, and the vehicle becomes `reserved`.
- Validation (each returns `400` with a clear message):
  - all required fields are present
  - the start isn't in the past
  - at least 30 minutes' notice
  - the duration is at least 1 hour and no more than 7 days
  - start and end fall within 6 AM–11 PM
  - the station has at least one station master
- Pricing is calculated only on the server:
  - `totalCost = hours × pricePerHour + oneWayFee`
  - `deposit = min(max(10% of totalCost, ₹500), ₹5000)`
  - `overtimeRate = 1.5 × pricePerHour`
- **Given** a different return station, **when** the vehicle allows one-way trips, **then** its `oneWayDropOffFee` (default ₹500) is added. Otherwise I get `400 "This vehicle does not support one-way trips."`
- **Given** another non-cancelled booking overlaps my slot, **when** I submit, **then** I get `409` and nothing is saved. The overlap check and the creation happen inside one MongoDB transaction.
- **Given** two users submit the same slot at the same moment, **then** exactly one booking is created.
- The payment deadline is 2 hours if the ride starts more than 12 hours away, otherwise 30 minutes.

### EVG-34 · View and modify my bookings
**Epic** EVG-4 · **Priority** Must · **SP** 5

As a User, I want to see my bookings and extend or shorten them, so that I can manage my plans.

- `GET /api/bookings/mybookings` returns my bookings with vehicle name and image.
- `GET /api/bookings/vehicle/:vehicleId/availability` returns the booked slots for a vehicle.
- `GET /api/bookings/analytics` returns my totals (rides, spend and so on). It's shown on the Analytics page.
- **Given** a `confirmed` or `active` booking, **when** I `PUT /api/bookings/:id/modify` with a new end time, **then** the cost difference is calculated on the server and recorded in `modifications[]`.
- **Given** the new end overlaps another booking, **then** I get `409 "Time slot not available for modification"`.
- **Given** an `active` ride is extended, **then** `paymentStatus` goes back to `pending` with a 10-minute deadline, and the response says `requiresPayment: true`.
- **Given** a completed or cancelled booking, **then** modification is refused with `400`.

### EVG-35 · Station master starts, completes and cancels rides
**Epic** EVG-5 · **Priority** Must · **SP** 5

As a Station Master, I want to start, complete or cancel a ride in one action, so that the vehicle status always matches reality.

- **Given** a `confirmed` booking with `paymentStatus: completed`, **when** I `PUT /api/station-master/bookings/:id` with `status: active`, **then** the booking becomes `active` and the vehicle `in-use`.
- **Given** the payment isn't complete, **when** I try to start the ride, **then** I get `400 "Payment must be completed before starting the ride"`.
- **Given** an `active` ride, **when** I set `completed`, **then** the vehicle returns to `available`.
- **Given** any booking that isn't completed, **when** I set `cancelled`, **then** the vehicle is freed. Cancelling a completed ride returns `400`.
- Any other transition returns `400 "Invalid status transition from X to Y"`.
- The customer gets a notification for each change.

### EVG-36 · Station master dashboard
**Epic** EVG-5 · **Priority** Must · **SP** 3

As a Station Master, I want one dashboard for my station, so that I can see what needs doing today.

- `GET /api/station-master/dashboard-data` returns my station's vehicles and bookings, grouped by status.
- `GET /api/station-master/bookings/pending` returns the bookings waiting for action.
- **Frontend:** `/dashboard` shows pickups, active rides and history, with Start / Complete / Cancel buttons that follow the transition rules in EVG-35.

---

## Sprint 3

### EVG-37 · Pay for a booking with Razorpay
**Epic** EVG-6 · **Priority** Must · **SP** 5

As a User, I want to pay for my booking online, so that it's secured before I arrive.

- **Given** my pending booking, **when** I `POST /api/payments/create-order`, **then** a Razorpay order is created for `totalCost + deposit` in paise (INR). For an extension of an active ride, only the extra cost is charged. I get the orderId, amount and keyId.
- **Given** Razorpay checkout succeeds, **when** the frontend sends the order id, payment id and signature to `POST /api/payments/verify`, **then** the server checks `HMAC_SHA256(orderId|paymentId, KEY_SECRET)`.
- **Given** a valid signature, **then** `paymentStatus` becomes `completed`, the deposit becomes `held`, the payment-timeout job is cancelled, loyalty points are awarded once, a confirmation email is queued, and I get "Payment verified successfully".
- **Given** an invalid signature, **then** I get `400 "Invalid payment signature"` and nothing changes.
- **Given** the same payment is verified twice, **then** the second call returns success without processing anything again.

### EVG-38 · Payment confirmed even if the browser closes (webhook)
**Epic** EVG-6 · **Priority** Must · **SP** 5

As a User, I want my booking confirmed even if I close the tab right after paying, so that I never pay without getting a booking.

- `POST /api/payments/webhook` receives the raw body (`express.raw`) and verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET`. A bad signature gets `400`.
- `payment.captured` runs the same idempotent `finalizeSuccessfulPayment` as `/verify`, so a booking already confirmed by `/verify` isn't processed twice.
- `payment.failed` cancels the booking, frees the vehicle and notifies the user.
- `refund.processed` sets `refund.status` to `completed`.
- **Given** the booking update fails after payment, **then** the booking is marked `unlinked` and the update is retried once. If the retry also fails, a Razorpay refund is started and the booking is cancelled.

### EVG-39 · Security deposit and refunds
**Epic** EVG-6 · **Priority** Must · **SP** 5

As a User, I want to request a refund when I cancel, and get my deposit back after a clean ride, so that I only pay for what I used.

- **Given** my cancelled booking that was paid, **when** I `POST /api/refund/request`, **then** the refund depends on how long before the start I cancelled:

  | Time before start | Refund |
  |---|---|
  | More than 24 h | 100% |
  | 12–24 h | 75% |
  | 6–12 h | 50% |
  | Less than 6 h | 25% |

  The held deposit is added in full, and `refund.status` becomes `pending`.
- **Given** a completed booking with the deposit `held` and nothing deducted, **then** the refund is the deposit only.
- **Given** a booking that isn't cancelled or completed, wasn't paid, or already has a refund, **then** the request is refused with `400`.
- **Given** a pending refund, **when** a Station Master or Super Admin calls `POST /api/refund/process/:bookingId` with `approve: true`, **then** Razorpay refunds the amount, `refund.status` becomes `processing` and the deposit becomes `released`. With `approve: false`, the request is reset.
- `GET /api/refund/status/:bookingId` shows the refund status. The Refunds page lists eligible bookings.

### EVG-40 · Real-time updates over Socket.IO
**Epic** EVG-7 · **Priority** Should · **SP** 5

As a Station Master, I want my dashboard to update the moment a booking or payment changes, so that I don't have to keep refreshing.

- **Given** a socket connection with a valid JWT (in handshake auth or cookie), **then** it is accepted and joined to the user's personal room. Without a valid token it is rejected with "Authentication error".
- `joinAdminRooms` joins Super Admins to `super_admin_room` and Station Masters to `station_<stationId>`. `join_room` requests are checked by role.
- Events:
  - `booking_confirmed` goes to the user
  - `dashboard_refresh` goes to the station room and `super_admin_room`
  - `notification` goes to the user (reminders, cancellations, overtime)
- **Given** Redis is reachable, **then** the Redis adapter is used so events reach clients on any instance. Otherwise the in-memory adapter is used and a warning is logged.
- **Frontend:** SocketContext connects after login, NotificationBell shows unread items, and PushNotifications shows toasts.

### EVG-41 · Confirmation email with PDF invoice
**Epic** EVG-8 · **Priority** Should · **SP** 3

As a User, I want an email with a PDF invoice when my payment is confirmed, so that I have proof of booking.

- **Given** a payment is finalised, **then** a `booking-confirmation` job is added to the `emails` BullMQ queue (3 attempts, exponential backoff).
- The email worker (concurrency 2) generates a PDFKit invoice in `uploads/invoices/` and sends it through Nodemailer. The invoice shows the last 6 characters of the booking id, billing details, vehicle, stations, times, base cost, one-way fee, deposit and grand total.
- **Given** Redis is unavailable, **then** the email is sent inline instead, and the user still receives it.

### EVG-42 · Auto-cancel unpaid bookings, payment watchdogs
**Epic** EVG-8 · **Priority** Must · **SP** 3

As a Station Master, I want unpaid bookings released automatically at the deadline, so that vehicles aren't blocked by people who never pay.

- **Given** a booking is created, **then** a delayed `paymentTimeout` job is scheduled for the exact `paymentDeadline`.
- **Given** payment succeeds first, **then** the job is cancelled.
- **Given** the job fires and payment is still `pending`, **then** the booking is `cancelled`, the payment `failed`, the vehicle `available`, and the user is notified.
- A 1-minute cron fallback does the same for any missed deadlines, and sends a "10 minutes left" reminder once per booking.
- A 5-minute cron notifies users whose payment has been `processing` for more than 5 minutes. A 10-minute cron logs `unlinked` payments older than 5 minutes for follow-up.
- Every cron job is skipped, with a log line, while MongoDB is disconnected.

### EVG-43 · Overtime billing
**Epic** EVG-8 · **Priority** Should · **SP** 3

As a Station Master, I want late returns billed automatically, so that I don't have to argue about late fees.

- **Given** a ride starts, **then** an `overtime` job is scheduled for `endTime + 15 min` grace. **Given** the ride completes first, **then** the job is cancelled.
- **Given** the job fires and the ride is still `active`, **then**:
  - `overtimeHours = ceil((now − graceEnd) / 1 h)`
  - `overtimeCost = overtimeHours × 1.5 × pricePerHour`
  - these are saved to `overtimeCharges`, and `totalCost` is updated
- The user and the station are notified, and the job reschedules itself for 1 hour later until the ride is completed.
- Example: a ₹200/h ride booked 2–4 PM, still active at 5:30 PM, has 2 overtime hours = ₹600.

### EVG-44 · Super admin system analytics (cached)
**Epic** EVG-10 · **Priority** Should · **SP** 2

As a Super Admin, I want system-wide analytics that load instantly, so that I can report on the business without waiting.

- `GET /api/super-admin/analytics` returns revenue, booking counts, utilisation and per-station figures.
- Results are cached under `super_admin_analytics` for 12 hours. A cron job recomputes them every 3 hours, and once 5 seconds after start-up.
- **Given** a cache miss, **then** the analytics are computed, cached and returned.

### EVG-45 · Loyalty points, tiers and referrals
**Epic** EVG-9 · **Priority** Could · **SP** 3

As a User, I want to earn points on every ride and redeem them, so that I'm rewarded for renting with EV-Go.

- **Given** a payment is finalised, **then** I earn 1 point per ₹100, recorded once per booking as a LoyaltyTransaction.
- My tier follows lifetime spend: Silver from ₹10,000, Gold from ₹25,000, Platinum from ₹50,000.
- `GET /api/loyalty/profile` shows my points, tier and benefits. `GET /transactions` shows my history.
- `POST /api/loyalty/redeem` needs at least 100 points and enough balance (100 points = ₹100). Otherwise `400`.
- `POST /api/loyalty/apply-referral` gives 200 points to me and 500 to the referrer. Using my own code, an invalid code or a second code is refused.

### EVG-46 · Support tickets with SLA
**Epic** EVG-9 · **Priority** Could · **SP** 3

As a User, I want to raise a support ticket and see when to expect a reply, so that problems get resolved.

- `POST /api/support/create` needs subject, description and category. Otherwise `400`.
- SLA deadlines follow priority:

  | Priority | First response | Resolution |
  |---|---|---|
  | Urgent | 1 h | 4 h |
  | High | 4 h | 24 h |
  | Medium | 8 h | 48 h |
  | Low | 24 h | 72 h |

- I can list my tickets, view one and add messages. Staff can add internal notes that I can't see.
- Staff can list all tickets, change status and escalate. Escalation sets priority to urgent.
- **Given** a resolved ticket, **when** I rate it 1–5, **then** it is closed. Rating an unresolved ticket returns `400`.

### EVG-50 · Super admin manages customers and active rides
**Epic** EVG-10 · **Priority** Should · **SP** 3

As a Super Admin, I want to see customers and every active ride, and step in when needed, so that I can deal with problems anywhere in the network.

- `GET /api/super-admin/users/regular` lists customers. `GET /users/:id/details` shows one customer's bookings and activity. `DELETE /users/regular/:userId` removes a customer.
- `GET /rides/active` lists all active rides across stations.
- `PUT /rides/:bookingId/cancel` cancels a ride, frees the vehicle and notifies the user (`booking_update`).

---

## Sprint 4

### EVG-47 · Reviews and favourites
**Epic** EVG-9 · **Priority** Could · **SP** 3

As a User, I want to review vehicles I've driven and save favourites, so that I and other users can choose better.

- **Given** my completed booking, **when** I `POST /api/reviews`, **then** the review is saved. A booking that isn't completed, or that already has a review, returns `400`.
- Anyone can read `GET /api/reviews/vehicle/:id` and its average rating `/rating`.
- `POST /api/favorites/toggle/:vehicleId` adds or removes a favourite. `GET /api/favorites` lists them. `/check/:vehicleId` returns whether a vehicle is a favourite.

### EVG-48 · Booking chat and emergency alert
**Epic** EVG-9 · **Priority** Could · **SP** 2

As a User on a ride, I want to message my station, and raise an emergency, so that I get help quickly.

- `POST /api/messages` sends a message on a booking to the station's master. `GET /booking/:bookingId` returns the thread to its participants only (anyone else gets `403`). `GET /unread-count` returns unread messages.
- The Emergency button sends a typed `🚨 EMERGENCY: <type>` message (breakdown, accident, medical, security, other) on the active booking.

### EVG-49 · Phone verification (OTP)
**Epic** EVG-9 · **Priority** Could · **SP** 2

As a User, I want to verify my phone number, so that the station can reach me about my booking.

- `POST /api/otp/send` with a phone generates a 6-digit OTP valid for 10 minutes. It's rate-limited to 3 per hour.
- `POST /api/otp/verify` with the right OTP marks the phone verified. An expired or wrong OTP returns `400`.
- `GET /api/otp/status` returns the verification state.
- The OTP value is never written to the logs.

### EVG-51 · Containerised deployment (Docker + Compose + CI image build)
**Epic** EVG-11 · **Priority** Must · **SP** 8

As the team, I want the whole stack to start with one command, the same way on every machine, so that setup and demos are reliable.

- Backend image: `node:20-alpine`, `npm ci --omit=dev`, runs as a non-root user, with a `HEALTHCHECK` on `/health`.
- Frontend image: multi-stage. A Node 20 build stage produces the static files, which Nginx serves with SPA fallback. `/api` and `/socket.io` are proxied with WebSocket headers.
- Both apps have a `.dockerignore`, so no `.env`, `node_modules` or logs end up in an image.
- `docker compose up --build` starts mongo (single-node replica set `rs0`, so transactions work), redis, backend and frontend on one network, with named volumes `mongo-data`, `redis-data` and `backend-uploads`, `depends_on` healthchecks, and env from `.env`.
- **Given** the stack is up, **when** I open `http://localhost:5173`, **then** I can register, browse and create a booking.
- CI builds both images (without pushing) after the lint and build jobs pass.

### EVG-52 · Test strategy, manual test cases, test pyramid
**Epic** EVG-11 · **Priority** Should · **SP** 3

As the team, I want a documented test approach, so that we know how quality is checked now and how automation would be added.

- `docs/testing/test-strategy.md` covers scope, levels and environments, plus a TDD section with written-out test cases for pricing, the deposit formula and refund percentages.
- `docs/testing/manual-test-cases.md` lists API, frontend and end-to-end workflow cases, each with steps and expected results and mapped to a story key.
- `docs/testing/test-pyramid.md` gives the planned unit / integration / E2E split for this codebase.

### EVG-53 · CD, cloud, Kubernetes and monitoring plans
**Epic** EVG-11 · **Priority** Should · **SP** 3

As the team, I want concrete plans for deployment and operations, so that we can take EV-Go to production next.

- `docs/devops/cd-plan.md` covers how images would be pushed and deployed from CI.
- `cloud-plan.md` compares target platforms and gives deployment steps.
- `kubernetes-plan.md` lists the Deployments, Services, ConfigMaps and Secrets per service, with a Mermaid topology.
- `monitoring-plan.md` covers health, latency, error rate, payment failures and queue backlog, and how the Winston logs feed into it.
- Everything refers to the real EV-Go services and endpoints.

### EVG-54 · Architecture docs and final README
**Epic** EVG-11 · **Priority** Should · **SP** 2

As a new developer, I want an architecture overview and a complete README, so that I can understand and run the project quickly.

- `docs/architecture.md` has Mermaid diagrams: the system, the booking state machine and the CI pipeline.
- The README has the CI badge, local setup, Docker run steps, links to all docs and screenshot placeholders.
