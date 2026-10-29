# Sprint 3 Planning — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 3 |
| **Date** | Tue 2026-10-27 (Day 3) |
| **Time-box** | 09:00 – 17:00 |
| **Scrum Master** | Muskan Dalsania |
| **Product Owner** | Mitali Radia |
| **Developers** | Mitali Radia, Muskan Dalsania, Shruti Patel |

---

## Sprint goal

> **Make the money work and the system live:** integrate Razorpay payments (create-order, verify, webhook), add Socket.IO real-time notifications, wire background jobs (email, payment timeout, overtime), and add engagement features (loyalty, reviews, favorites, notifications, OTP).

---

## Capacity

| Person | Hours available | Hours for dev (75%) |
|---|---|---|
| Mitali Radia | 6h | 4.5h |
| Muskan Dalsania | 6h | 4.5h |
| Shruti Patel | 6h | 4.5h |
| **Total** | **18h** | **13.5h** |

Sprint 2 velocity: 35 SP in 13.5 dev h → ~2.6 SP/h. Targeting 32–35 SP this sprint.

---

## Committed stories

| Key | Story | Points | Priority | Owner |
|---|---|---|---|---|
| EVG-37 | Pay for booking via Razorpay | 8 | Must Have | Shruti |
| EVG-38 | Receive refund on cancellation | 5 | Must Have | Shruti |
| EVG-39 | Security deposit lifecycle | 3 | Must Have | Shruti |
| EVG-40 | Webhook idempotency + unlinked payment recovery | 3 | Must Have | Shruti |
| EVG-41 | Real-time ride and payment updates (Socket.IO) | 5 | Must Have | Muskan |
| EVG-42 | Email notifications (NodeMailer + PDF invoice) | 3 | Should Have | Mitali |
| EVG-43 | Payment timeout and overtime background jobs | 5 | Must Have | Muskan |
| EVG-44 | Cron watchdog jobs | 2 | Should Have | Muskan |
| EVG-45 | Loyalty points system | 3 | Should Have | Mitali |
| EVG-46 | Support tickets with SLA | 3 | Should Have | Mitali |
| EVG-47 | Reviews, favorites, OTP, messages, remaining admin endpoints | 3 | Could Have | All |

**Total committed: 43 SP** (aggressive; EVG-47 is a single catch-all commit covering small items)

---

## Task breakdown

### EVG-37 — Razorpay payment (Shruti, ~2.5h)
- [ ] `paymentController.js`: `createOrder`, `verifyPayment` (HMAC)
- [ ] `paymentRoutes.js` + mount in server.js
- [ ] `PaymentModal.jsx` → replace stub with real Razorpay Checkout
- [ ] `.env.example`: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

### EVG-38/39/40 — Refunds, deposit, webhook (Shruti, ~1.5h)
- [ ] `refundController.js`: refund policy (0%/50%/100%), `processRefund`
- [ ] Webhook route with `express.raw()` raw body, HMAC verify, idempotent `finalizeSuccessfulPayment`
- [ ] Unlinked payment recovery (webhook arrives before booking linked to payment)
- [ ] `refundRoutes.js`

### EVG-41 — Socket.IO (Muskan, ~1.5h)
- [ ] `backend/server.js`: attach `http.createServer` + `io` instance
- [ ] `socketAuth.js` middleware
- [ ] `req.io` injected via middleware
- [ ] `frontend/src/context/SocketContext.jsx` + wrap in `main.jsx`

### EVG-42/43/44 — Job timers + cron (Muskan + Mitali, ~2h)
- [ ] `services/queueService.js` (emailQueue, paymentTimeoutQueue, overtimeQueue)
- [ ] `jobs/emailWorker.js` + PDF invoice (`invoiceService.js`)
- [ ] `jobs/paymentTimeoutWorker.js`
- [ ] `jobs/overtimeWorker.js`
- [ ] `jobs/cronJobs.js` (watchdog: expire unpaid bookings, release deposits, clear stale)

### EVG-45/46/47 — Engagement + remaining features (All, ~2h)
- [ ] Loyalty model + controller + routes
- [ ] Support ticket model + controller + routes (SLA)
- [ ] Notification model (replace stub in `notificationUtil.js`)
- [ ] Review model + controller + routes
- [ ] Favorite model + controller + routes
- [ ] OTP controller + routes
- [ ] Message controller + routes
- [ ] Remaining super-admin endpoints (analytics, user management, active rides)

---

## Definition of Done (Sprint 3)

- Payment flow: `createOrder` → Razorpay Checkout → `verifyPayment` completes booking → `paymentStatus: completed`.
- Webhook: raw body preserved, HMAC verified, idempotent on duplicate events.
- Socket.IO: user receives `notification` event on booking status change.
- Job timers are scheduled per booking, and the cron jobs start with the server.
- Cron watchdog runs at startup and cancels unpaid bookings past their deadline.
- All new endpoints pass `npm run lint`.
