# Sprint 3 Retrospective — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 3 |
| **Date** | Wed 2026-10-28 (end of Day 3–4) |
| **Facilitator** | Muskan Dalsania |
| **Format** | Start / Stop / Continue |

---

## Sprint 2 retro action items — did we do them?

| Action | Done? |
|---|---|
| Wire Socket.IO `dashboard_refresh` to StationMasterDashboard | ✅ Done — emitted from payment, stationMaster, and overtime controllers |
| Attach PDF invoice to confirmation email | ✅ Done — `invoiceService.js` generates PDF in `uploads/invoices/` |
| Replace PaymentModal stub before end of Sprint 3 | ✅ Done — real Razorpay Checkout in Commit 28 |

---

## Start

- **Write env.example updates alongside each new feature.** Three new env vars (RAZORPAY keys, EMAIL_USER/PASS, REDIS_URL) were added across Sprint 3 commits but `.env.example` wasn't updated each time. Update it at the start of the commit that introduces the var.
- **Add a basic health check to queueService** so startup logs show whether BullMQ is using Redis or falling back to inline.

## Stop

- **Circular imports via stub pattern.** The stubs for `notificationController` and `calculateAndCacheSystemAnalytics` worked but created two commits that later needed to be patched. Next time, port the dependency first rather than stubbing it.
- **Over-relying on `global.io`.** Storing Socket.IO on `global` works but makes unit testing harder. Consider passing `io` as a parameter in Sprint 4 refactor if time allows.

## Continue

- **Lazy queueService imports** — the `getQueue()` pattern kept early commits stable when BullMQ wasn't wired. Keep for any future optional dependencies.
- **Logger instead of console.** Every controller uses `logger.info/warn/error` — no `console.log` leakage.
- **Express.raw() webhook guard.** Mounting the webhook before `express.json()` was the right call; HMAC verification works correctly.
- **Idempotent payment finalization.** `finalizeSuccessfulPayment` is safe to call twice; the webhook and verify endpoint both use it.

---

## Action items for Sprint 4

| # | Action | Owner | Done by |
|---|---|---|---|
| 1 | Update `.env.example` with all Sprint 3 vars (Razorpay, Email, Redis) | Shruti | Start of Sprint 4 |
| 2 | Add queueService startup health log (Redis connected / in-memory fallback) | Muskan | Commit 30 |
| 3 | Write `docs/testing/manual-test-cases.md` with payment and Socket.IO test cases | Mitali | Commit 33 |
