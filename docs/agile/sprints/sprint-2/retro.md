# Sprint 2 Retrospective — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 2 |
| **Retro date** | Tue 2026-10-28 |
| **Facilitator** | Muskan Dalsania |

---

## Last sprint's action items — did we follow through?

| Sprint 1 action | Outcome |
|---|---|
| Use explicit job-level conditions instead of `hashFiles()` in CI | ✓ Done — frontend job no longer uses hashFiles; CI passes |
| Separate stub files (Booking stub, notificationUtil stub) for dependencies not yet built | ✓ Done — used consistently this sprint |
| Keep commits small (1-10 files) and always leave repo buildable | ✓ Done — every commit passed lint + build before merging |

---

## Start

- **Run the Vite dev server during every frontend commit** — we discovered the DatePicker CSS import was missing only at build time, not lint. A live dev-server check catches rendering issues earlier.
- **Add a `seed.js` script early** — manually patching `paymentStatus` in Mongo during the demo was awkward. A seed script with one fully-paid booking would let the SM start-ride demo run without DB surgery.

## Stop

- **Leaving Socket.IO and queue guards as comments** — they worked fine as null-checks this sprint, but we should add them explicitly to the integration checklist so they don't silently fail in production.
- **Writing placeholder comments in source files** — comments like "// Full implementation in Commit 20" add noise. Prefer small, complete implementations.

## Continue

- **Extracting pure utilities (pricingUtils, bookingValidationUtils)** — made the booking logic testable without a DB and kept `createBooking` readable. Continue this pattern for payment and refund logic.
- **Lazy-importing queueService and Socket.IO** — the guarded imports (`if (req.io)`, lazy `getQueue()`) kept the server starting cleanly in Sprint 2 without Redis or BullMQ. Continue for Sprint 3 additions.
- **One-sprint stub → replace cycle** — stubs (BookingModal, PaymentModal, notificationUtil) were replaced in the same sprint or the next one, so the history reads as incremental development. Continue this pattern.

---

## Action items for Sprint 3

| # | Action | Owner | By when |
|---|---|---|---|
| 1 | Add `seed.js` with one paid confirmed booking so SM dashboard demo works without DB surgery | Shruti | Sprint 3 Day 1 |
| 2 | Run `npm run dev` locally during every frontend commit to catch CSS/rendering issues before lint | All | Sprint 3 (ongoing) |
| 3 | Add Socket.IO and BullMQ to the per-commit verify checklist once Sprint 3 wires them | Muskan | Sprint 3 Day 1 |
