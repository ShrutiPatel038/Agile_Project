# Product Vision — EV-Go

## Vision statement

**For** city commuters and travellers who want to drive an electric car without owning one,
**who** are tired of rental counters, unclear pricing and bookings that fall through,
**EV-Go** is a web platform for renting EVs from staffed stations
**that** lets them book a specific vehicle for a specific time slot, pay online, and have the ride started and closed by a station master in minutes.
**Unlike** phone-and-paper rental desks or generic car-rental sites,
**EV-Go** guarantees that a paid booking cannot be double-booked, calculates every price on the server, and keeps users, station staff and administrators in sync in real time.

## Problem we are solving

| Who | Problem today |
|---|---|
| Renters | Can't see which vehicle is actually free for their time window; prices change at the counter; no proof of booking if the payment page closes |
| Station staff | Bookings arrive by phone or walk-in; no single view of today's pickups, active rides and overdue returns; overtime and deposits worked out by hand |
| Operator (head office) | No live view across stations; stations can end up with no staff assigned yet still accept bookings; revenue figures pieced together from spreadsheets |

## Product goals

1. **Reliable booking.** A vehicle can never be booked twice for overlapping times, even when two users submit at the same moment.
2. **Trustworthy payments.** A user who pays always ends up with a confirmed booking or a refund, even if the browser closes mid-payment.
3. **Fast station operations.** A station master can start or end a ride in a single action from their dashboard.
4. **Live visibility.** Booking, payment and ride changes reach the affected user, station and super admin without a page refresh.
5. **Minimal infrastructure.** The app needs only Node and MongoDB. Caching, background jobs and real-time updates run in memory, and cron jobs act as a safety net for timers lost on restart.

## Success measures

| Measure | Target |
|---|---|
| Double bookings for overlapping slots | 0 |
| Paid bookings left without confirmation or refund | 0 |
| Unpaid bookings released after the payment deadline | Exact time (in-process timer); ≤ 1 minute late after a restart (cron fallback) |
| Time for a station master to start or end a ride | < 30 seconds |
| CI pipeline on every push to `main` | Lint + build green before merge |

## Scope

**In scope (this release)**
- Registration and login with three roles (User, Station Master, Super Admin)
- Station and vehicle catalogue with time-window availability
- Booking with server-side pricing, a security deposit, one-way trips and modification
- Razorpay checkout, signature verification and a webhook fallback
- Security deposit lifecycle, a time-based refund policy and refund processing
- Ride start, completion and cancellation by station masters, with overtime billing
- Real-time notifications (Socket.IO), confirmation email with a PDF invoice
- Loyalty points and tiers, support tickets with SLAs, reviews, favourites, booking chat, phone OTP
- Super Admin management of stations, vehicles, staff, customers, active rides and analytics
- Structured logging, CI, Docker images and Docker Compose

**Out of scope (documented as plans only)**
- Automated test suites (strategy and manual cases only)
- Continuous deployment, Kubernetes, cloud infrastructure, monitoring dashboards
- Native mobile apps, live GPS tracking of vehicles, KYC document verification

---

## Personas

### 1. Riya: the renter (role: `user`)

| | |
|---|---|
| **Age / job** | 27, software engineer, Ahmedabad |
| **Tech comfort** | High: books cabs, food and travel on her phone |
| **Context** | Doesn't own a car. Rents an EV 2–3 times a month for weekend trips and the occasional one-way drive to another city. |

**Goals**
- See exactly which EVs are free for Saturday 9 AM–6 PM at her nearest station.
- Know the full price, including the one-way drop-off fee and the deposit, before paying.
- Get a confirmation email and invoice she can show at the counter.
- Get her deposit back quickly, and a fair refund if plans change.

**Frustrations**
- Paid once on another site, the page timed out, and she had no booking and no refund for a week.
- "Available" cars that turned out to be taken when she arrived.
- Surprise late fees with no explanation of how they were calculated.

**What EV-Go gives her**
Conflict-aware vehicle search, a server-calculated price breakdown, payment confirmed by webhook even if she closes the tab, a refund policy shown up front (100% / 75% / 50% / 25%), overtime charged at a stated 1.5× rate after a 15-minute grace period, and loyalty points on every ride.

---

### 2. Arjun: the station master (role: `station-master`)

| | |
|---|---|
| **Age / job** | 34, runs the EV-Go station at SG Highway |
| **Tech comfort** | Medium: uses a laptop at the counter all day |
| **Context** | Handles 15–25 pickups and returns a day, plus walk-in questions and complaints. |

**Goals**
- One dashboard showing today's pickups, active rides and anything overdue.
- Start a ride only when payment is complete, so he never hands keys to an unpaid customer.
- Have overtime calculated automatically when a car comes back late.
- Approve refunds and answer support tickets without calling head office.

**Frustrations**
- Customers turn up claiming they've paid, and he can't verify it.
- Working out late fees on a calculator while the customer argues.
- Finding out about new bookings only when the customer arrives.

**What EV-Go gives him**
A station dashboard that refreshes live on new bookings and payments, ride start blocked unless `paymentStatus` is `completed`, automatic overtime jobs, refund approval through Razorpay, and support tickets with SLA deadlines.

---

### 3. Meera: the super admin (role: `super-admin`)

| | |
|---|---|
| **Age / job** | 41, operations head for EV-Go |
| **Tech comfort** | Medium-high: lives in dashboards and reports |
| **Context** | Oversees all stations, the fleet and the staff; reports revenue to management weekly. |

**Goals**
- Open new stations, add vehicles with photos and pricing, and assign station masters.
- Make sure no station accepts bookings while it has no station master.
- See system-wide revenue, booking volume and active rides at a glance.
- Step in on any ride (for example, cancel it) and handle problem customers.

**Frustrations**
- Analytics pages that take ages to load.
- Stations left unmanaged after staff changes.
- No single place to see every active ride across the city.

**What EV-Go gives her**
Station, vehicle and staff management, a check that blocks bookings at unmanaged stations, a cleanup action for unmanaged stations, analytics pre-computed every 3 hours and served from cache, and an active-rides view with cancel control.

---

## Persona → epic mapping

| Epic | Riya (User) | Arjun (Station Master) | Meera (Super Admin) |
|---|:-:|:-:|:-:|
| EVG-2 Auth & Access Control | ● | ● | ● |
| EVG-3 Stations & Vehicle Catalogue | ● | | ● |
| EVG-4 Booking Management | ● | ● | |
| EVG-5 Station Operations | | ● | |
| EVG-6 Payments & Refunds | ● | ● | |
| EVG-7 Real-time & Notifications | ● | ● | ● |
| EVG-8 Background Jobs & Reliability | ● | ● | |
| EVG-9 Engagement | ● | ● | |
| EVG-10 Administration & Analytics | | | ● |
| EVG-11 DevOps & Release | (team) | (team) | (team) |
