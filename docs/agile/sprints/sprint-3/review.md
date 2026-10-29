# Sprint 3 Review — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 3 |
| **Date** | Wed 2026-10-28 (Day 3–4) |
| **Scrum Master** | Muskan Dalsania |
| **Product Owner** | Mitali Radia |
| **Attendees** | Mitali Radia, Muskan Dalsania, Shruti Patel |

---

## Sprint goal

> **Make the money work and the system live** — integrate Razorpay payments, add Socket.IO real-time updates, wire background jobs, and add engagement features (loyalty, reviews, favorites, notifications, OTP).

**Outcome: Goal MET.**

---

## Stories reviewed

| Key | Story | SP | Result | Notes |
|---|---|---|---|---|
| EVG-37 | Pay for booking via Razorpay | 8 | ✅ Accepted | `createOrder` → Razorpay Checkout → `verifyPayment` (HMAC). PaymentModal stub replaced. |
| EVG-38 | Receive refund on cancellation | 5 | ✅ Accepted | Tiered refund policy (>24h = 100%, 12–24h = 75%, 6–12h = 50%, <6h = 25%). |
| EVG-39 | Security deposit lifecycle | 3 | ✅ Accepted | Held on payment, released on completed booking, deducted on damage. |
| EVG-40 | Webhook idempotency + unlinked payment recovery | 3 | ✅ Accepted | `express.raw()` preserves body; `finalizeSuccessfulPayment` is idempotent. |
| EVG-41 | Real-time updates (Socket.IO) | 5 | ✅ Accepted | `global.io` pattern; in-memory adapter (single backend instance). `SocketProvider` wraps app. |
| EVG-42 | Email notifications (NodeMailer + PDF invoice) | 3 | ✅ Accepted | PDF invoice attached; sent inline after payment. |
| EVG-43 | Payment timeout + overtime background jobs | 5 | ✅ Accepted | Workers cancel bookings and accumulate overtime charges hourly. |
| EVG-44 | Cron watchdogs | 2 | ✅ Accepted | Cancels expired unpaid bookings every 10 min; warms analytics cache every 3 h. |
| EVG-45 | Loyalty points system | 3 | ✅ Accepted | Points earned on payment, redeemable at 100:₹100; referral bonus included. |
| EVG-46 | Support tickets with SLA | 3 | ✅ Accepted | Priority-based SLA (urgent=1h/4h, high=4h/24h, medium=8h/48h, low=24h/72h). |
| EVG-47 | Reviews, favorites, OTP, messages, remaining admin endpoints | 3 | ✅ Accepted | All models + controllers + routes created; super-admin analytics endpoint live. |

**Total: 43/43 SP accepted.**

---

## Demo script

Steps to demonstrate Sprint 3 work. Requires a running backend and frontend.

1. **Payment flow**
   - As a user, create a booking (use a past commit's flow: station list → vehicle → BookingModal).
   - Click **Pay Now** in PaymentModal. Razorpay Checkout opens in test mode.
   - Complete payment with Razorpay test card `4111 1111 1111 1111`.
   - Observe `POST /api/payments/verify` returns `{ success: true, status: 'completed' }`.
   - Check DB: `booking.paymentStatus === 'completed'`, `booking.status === 'confirmed'`.

2. **Webhook verification**
   - Use ngrok + Razorpay test webhook to send `payment.captured` event.
   - Observe `POST /api/payments/webhook` processes the event (HMAC passes, idempotent on second call).

3. **Real-time notification**
   - Open browser console. After payment, observe `booking_confirmed` socket event received by the user.
   - On StationMasterDashboard, observe `dashboard_refresh` event updates the Confirmed Bookings list.

4. **Refund request**
   - Cancel a confirmed booking. Call `POST /api/refunds/request` with `bookingId` + `reason`.
   - Verify tiered refund amount in response (`hoursUntilStart > 24 → 100%`).

5. **Loyalty points**
   - After payment, call `GET /api/loyalty/profile`. Verify `loyaltyPoints` incremented by `floor(totalCost / 100)`.
   - Call `POST /api/loyalty/redeem` with `{ points: 100 }`. Verify discount returned.

6. **Support ticket with SLA**
   - Call `POST /api/support` with `{ subject, description, category: 'payment', priority: 'urgent' }`.
   - Verify `sla.responseDeadline` is 1h from now.

7. **Email + PDF invoice**
   - Check `backend/uploads/invoices/` for a generated PDF after payment.

8. **Analytics**
   - Call `GET /api/super-admin/analytics`. Verify JSON with `financials`, `fleet`, `loyaltyTiers`, `topStations`.

---

## Feedback

- PO accepted all 11 stories without modification requests.
- Action from Sprint 2 retro (wire Socket.IO to refresh SM dashboard): **done** — `dashboard_refresh` event emitted on booking status changes.
- Action from Sprint 2 retro (add PDF invoice to email): **done**.

---

## Backlog changes

- No new stories added.
- Remaining work: Sprint 4 (Docker, CI Docker job, DevOps + testing docs, final README).
