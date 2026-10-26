# Sprint 1 Planning — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 1 |
| **Date** | Sun 2026-10-25 (1-day sprint) |
| **Time-box** | 09:00 – 17:00 |
| **Scrum Master** | Muskan Dalsania |
| **Product Owner** | Mitali Radia |
| **Developers** | Mitali Radia, Muskan Dalsania, Shruti Patel |

---

## Sprint goal

> **Get the skeleton working end-to-end:** repo conventions in place, Agile artefacts written, a user can register and log in, and every push to `main` is linted by CI.

This sprint delivers the walking skeleton (EVG-11 / R0). No booking, no payment — just the foundation that every later sprint builds on.

---

## Capacity

| | |
|---|---|
| Team size | 3 |
| Hours per person | 6 h |
| Ceremony overhead | ~1.5 h/person (planning 30 min, mid-day sync 15 min, review 30 min, retro 15 min) |
| Development time/person | ~4.5 h |
| **Total dev capacity** | **13.5 dev hours** |

Sprint 1 is heavier on process work than later sprints (Agile artefacts, JIRA setup), so roughly half the capacity goes to unestimated tasks. The 16 SP commitment is a velocity baseline, not a forecast.

---

## Committed work

### Stories (pointed)

| Key | Story | SP | Priority | Owner |
|---|---|---|---|---|
| EVG-21 | Backend foundation: health check, logging, config | 3 | Must | Muskan |
| EVG-22 | CI pipeline: lint and build on every push | 3 | Must | Shruti |
| EVG-23 | User registration and login | 5 | Must | Mitali + Muskan |
| EVG-24 | Role-based access (User / SM / SA) | 3 | Must | Muskan |
| EVG-25 | Rate limiting on sensitive endpoints | 2 | Should | Shruti |
| | **Sprint total** | **16 SP** | | |

### Tasks (unestimated — process and docs)

| Key | Task | Owner |
|---|---|---|
| EVG-12 | Repository setup: README, `.gitignore`, `.editorconfig`, `.nvmrc` | Shruti |
| EVG-13 | Product vision and personas | Mitali |
| EVG-14 | Product backlog and user stories | Mitali |
| EVG-15 | Story map and release slices | Mitali |
| EVG-16 | Working agreement, DoR/DoD, JIRA import CSV, JIRA setup | Muskan |
| EVG-17 | Sprint 1 ceremonies (this doc + review + retro) | Muskan |
| EVG-26 | Frontend scaffold: Vite + React + Tailwind + ESLint, Axios, AuthContext | Shruti |

---

## Task breakdown

### EVG-12 — Repo setup (Shruti, ~30 min)
- [ ] Create `EV-Go-DevOps` repo, push initial `README.md`, `.gitignore`, `.editorconfig`, `.nvmrc` (Node 20)

### EVG-13 — Product vision (Mitali, ~45 min)
- [ ] Write `docs/agile/product-vision.md`: vision statement, problem, goals, success measures, scope in/out, personas (Riya/User, Arjun/SM, Meera/SA)

### EVG-14 — Backlog + user stories (Mitali, ~1 h)
- [ ] Write `docs/agile/product-backlog.md`: 11 epics, 33 stories, MoSCoW, SP
- [ ] Write `docs/agile/user-stories.md`: all 33 stories with Given/When/Then AC

### EVG-15 — Story map (Mitali, ~45 min)
- [ ] Write `docs/agile/story-map.md`: backbone + release slices R0–R3 with Mermaid diagrams

### EVG-16 — Working agreement + JIRA (Muskan, ~1 h)
- [ ] Write `docs/agile/working-agreement.md` (DoR, DoD, estimation, team conventions)
- [ ] Generate `docs/agile/jira-import.csv` (54 issues)
- [ ] Write `docs/agile/jira-setup.md` and import into JIRA Cloud (company-managed, key EVG)

### EVG-21 — Backend foundation (Muskan, ~1 h)
- [ ] Scaffold Express 5 app in `backend/`; add `GET /health` endpoint
- [ ] Add `backend/utils/logger.js` (Winston: JSON+file in prod, console in dev)
- [ ] Wire Morgan through Winston for HTTP logs
- [ ] Connect MongoDB (Mongoose) and Redis (ioredis) — log connect / disconnect events
- [ ] Load env from `.env`; create `backend/.env.example` with all required keys

### EVG-22 — CI pipeline (Shruti, ~45 min)
- [ ] Write `.github/workflows/ci.yml`: backend lint job + frontend lint+build job
- [ ] Node 20 from `.nvmrc`, npm cache enabled

### EVG-23 — Auth (Mitali + Muskan, ~1.5 h)
- [ ] Port `User` model (email, password bcrypt 10 rounds, role, loyaltyPoints, driverLicense)
- [ ] `registerUser`: validate, hash, issue JWT (30 d) in httpOnly cookie
- [ ] `loginUser`, `logoutUser`, `getMe`
- [ ] `protectRoute` middleware: cookie-first, Bearer fallback

### EVG-24 — Role middleware (Muskan, ~30 min)
- [ ] `stationMaster` guard, `superAdmin` guard, wire onto auth routes

### EVG-25 — Rate limiting (Shruti, ~30 min)
- [ ] Port `authLimiter` (5/15 min), `paymentLimiter`, `bookingLimiter`, `generalLimiter`, `otpLimiter`
- [ ] Apply to auth routes in `server.js`

### EVG-26 — Frontend scaffold (Shruti, ~1 h)
- [ ] Vite + React 19 + Tailwind + ESLint in `frontend/`
- [ ] Axios instance with Bearer interceptor + cookie fallback
- [ ] `AuthContext`, `ProtectedRoute`, Login and Register pages, role-based route guards
- [ ] Add frontend lint + build job to CI workflow

### EVG-17 — Sprint 1 ceremonies (Muskan, ~30 min)
- [ ] This planning doc (done)
- [ ] Write `review.md` and `retro.md` at end of day
- [ ] Create `docs/agile/velocity.md` after review

---

## Definition of Ready check

All committed stories pass DoR:
- [x] Written as *As a … I want … so that …* with a JIRA key — see [user-stories.md](../../user-stories.md)
- [x] Given/When/Then acceptance criteria written
- [x] Estimated (≤ 8 SP) and MoSCoW priority set
- [x] Dependencies: EVG-21 (backend scaffold) before EVG-23 (auth); EVG-23 before EVG-24. EVG-22 CI can go in parallel.
- [x] External setup known: no Razorpay or payments this sprint; only MongoDB + Redis needed
- [x] Each story has tasks ≤ 2 h above

---

## Sprint 1 risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| JIRA import keys don't match planned EVG-x | Medium | Use a fresh empty space — confirmed working |
| `User.phone` is `required` but `registerUser` doesn't send it | High | Make `phone` optional (sparse unique) before commit 10 |
| Node version mismatch between dev and CI | Low | `.nvmrc = 20` used in CI matrix and Dockerfiles |
