# Sprint 4 Retrospective — EV-Go

| | |
|---|---|
| Sprint | 4 of 4 (final) |
| Date | 2026-10-28 |
| Facilitator | Muskan Dalsania |
| Format | Start / Stop / Continue |

---

## Sprint 3 action items — how did we do?

| Action item from Sprint 3 retro | Outcome |
|---|---|
| Add raw-body middleware comment to server.js before the webhook route | Done — `server.js` has inline comment explaining the `express.raw()` must precede `express.json()` |
| Check BullMQ inline fallback path manually before Sprint 4 demo | Done — tested with Redis stopped; bookings still confirmed and emails sent inline |
| Write the architecture diagram before the final review | Done — `docs/architecture.md` with three Mermaid diagrams committed in Sprint 4 |

All three actions confirmed done.

---

## Start

- **Automated smoke tests on the Compose stack** — we ran the demo manually every sprint. A short Playwright script that opens the app and completes a booking would catch container-startup regressions automatically.
- **Image tagging by git SHA in CI** — the CI job builds images but does not tag them with the commit SHA. Adding `--tag ghcr.io/org/evgo-backend:${{ github.sha }}` would make deployments traceable to a specific commit.
- **Signed commits** — for a real project, GPG-signed commits would prevent impersonation and verify authorship in the git log.

## Stop

- **Last-minute README updates** — the README stayed as a skeleton until the final sprint. Next time, keep it current as each feature lands so it is never a one-sprint catch-up.
- **Deferring Docker healthcheck testing** — the `depends_on: condition: service_healthy` chain was written in Sprint 4 without being tested under failure conditions (e.g. Redis slow to start). Reserve time in the containerisation sprint to simulate failures.

## Continue

- **Webhook-before-json ordering** — the pattern of mounting `express.raw()` before `express.json()` for the Razorpay webhook was documented clearly and caused zero bugs during integration. Keep this practice for any new webhook routes.
- **Inline fallback pattern for Redis-dependent services** — BullMQ and the Socket.IO adapter both fall back gracefully when Redis is unavailable. This meant development worked without Redis running locally. Keep the pattern for any future optional dependencies.
- **EVG-xx keys in every commit** — JIRA traceability was easy to maintain because the commit template reminded us to include the key. Keep it.
- **Sprint docs written the same day** — review and retro docs were written on the sprint day itself, so the details (demo steps, feedback, action items) were accurate rather than reconstructed.

---

## Action items (for a Sprint 5 / future team)

| # | Action | Owner | Definition of done |
|---|---|---|---|
| A1 | Add Playwright smoke test that runs `docker compose up` and verifies the booking flow | Shruti | CI green on a new `e2e-smoke` job |
| A2 | Tag Docker images with `${{ github.sha }}` in the CI workflow | Muskan | Images in GHCR show commit SHA tag |
| A3 | Write a `CONTRIBUTING.md` with branch naming convention and PR checklist | Mitali | File in repo root, linked from README |

---

## Project retrospective (all four sprints)

### What went well across the project

- **Zero double-booking bugs** — the MongoDB transaction + overlap check held up through every test.
- **Webhook reliability** — the raw-body middleware pattern worked first time. Idempotent `finalizeSuccessfulPayment` meant re-delivered webhooks caused no duplicate state changes.
- **Redis fallback** — the cache and queue services degraded gracefully when Redis was unavailable, so no single service failure brought down the whole app.
- **JIRA traceability** — every commit has an EVG-xx key; sprint reviews have exact endpoint URLs. The project is fully auditable.
- **Docker Compose single-command startup** — `docker compose up --build` brings up the full stack including a MongoDB replica set. The healthcheck chain (`mongo healthy → redis healthy → backend healthy → frontend starts`) meant the stack was reliable from the first run.

### What we would do differently

- **Start Dockerfiles in Sprint 1** — building the Dockerfiles at the end meant we discovered the `node:18` vs `node:20` Vite compatibility issue late. Writing a minimal backend Dockerfile early would have caught environment drift sooner.
- **Shared branch strategy from day 1** — the team worked across branches with no formal merge schedule for the first two sprints, which led to some rebase friction. A simple `feature/EVG-xx` → `main` PR flow with a agreed merge window would smooth this.
- **Automated integration tests alongside each feature** — we wrote the test strategy docs at the end. Writing even a few Supertest tests per feature (especially the booking overlap and HMAC verify) in the same commit would have given us a regression safety net throughout.

### Velocity summary

| Sprint | Date | Committed | Completed | Velocity |
|---|---|---|---|---|
| Sprint 1 | 2026-10-25 | 16 | 16 | 16 |
| Sprint 2 | 2026-10-26 | 35 | 35 | 35 |
| Sprint 3 | 2026-10-27 | 43 | 43 | 43 |
| Sprint 4 | 2026-10-28 | 26 | 26 | 26 |
| **Total** | | **120** | **120** | **avg 30/sprint** |

100% of committed story points delivered across all four sprints.
