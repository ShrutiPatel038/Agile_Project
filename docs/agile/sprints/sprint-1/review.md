# Sprint 1 Review — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 1 |
| **Planned date** | Sun 2026-10-25 |
| **Actual end** | Mon 2026-10-27 (carried over — see below) |
| **Facilitator** | Muskan Dalsania (SM) |
| **Attendees** | Mitali Radia (PO), Muskan Dalsania, Shruti Patel |

---

## Sprint goal — was it met?

**Goal:** Get the skeleton working end-to-end — repo conventions, Agile artefacts, a user can register and log in, and every push to `main` is linted by CI.

**Result: Met** (with carry-over — see below).

All five pointed stories are complete. CI is green on `main` for both backend lint and frontend lint+build. A `POST /api/auth/register` and `POST /api/auth/login` work end-to-end against a local MongoDB instance.

---

## Stories committed vs completed

| Key | Story | SP | Status | Notes |
|---|---|---|---|---|
| EVG-21 | Backend foundation: health, logging, config | 3 | ✅ Done | Winston + Morgan wired; `/health` returns `{"status":"ok"}` |
| EVG-22 | CI pipeline: lint and build on every push | 3 | ✅ Done | Both backend and frontend jobs green on `main` |
| EVG-23 | User registration and login | 5 | ✅ Done | Register, login, logout, getMe working; JWT in httpOnly cookie + Bearer |
| EVG-24 | Role-based access (User / SM / SA) | 3 | ✅ Done | `protectRoute`, `stationMaster`, `superAdmin` guards in place |
| EVG-25 | Rate limiting on sensitive endpoints | 2 | ✅ Done | 5 limiters ported; `authLimiter` on register/login, `generalLimiter` global |
| | **Total** | **16 SP** | | Velocity = 16 SP |

---

## Tasks completed

| Key | Task | Status |
|---|---|---|
| EVG-12 | Repo setup (README, .gitignore, .editorconfig, .nvmrc) | ✅ Done |
| EVG-13 | Product vision and personas | ✅ Done |
| EVG-14 | Product backlog and user stories | ✅ Done |
| EVG-15 | Story map and release slices | ✅ Done |
| EVG-16 | Working agreement, DoR/DoD, JIRA setup | ✅ Done |
| EVG-26 | Frontend scaffold (Vite + React + Tailwind + ESLint) | ✅ Done |

---

## Demo script

Reviewer follows these steps to accept the sprint:

**1. Repo conventions**
```
cat .nvmrc          # → 20
cat .editorconfig   # → indent_style = space, indent_size = 4
npm run lint        # pass in backend/; pass in frontend/
```

**2. Health endpoint**
```
cd backend && npm start
curl http://localhost:5000/health
# → {"status":"ok","uptime":<n>}
```

**3. Register a new user**
```
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Riya Sharma","email":"riya@example.com","password":"pass1234"}' \
  | python -m json.tool
# → {"_id":"...","name":"Riya Sharma","email":"riya@example.com","role":"user","token":"..."}
```

**4. Login with the same credentials**
```
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"riya@example.com","password":"pass1234"}' \
  | python -m json.tool
# → same shape; Set-Cookie: jwt=... in response headers
```

**5. Protected route with Bearer token**
```
TOKEN=<token from step 3>
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
# → full user object (no password field)
```

**6. Role guard — unauthorized access**
```
# No token → 401
curl -s http://localhost:5000/api/auth/me
# → {"message":"Not authorized, no token"}
```

**7. CI green on GitHub**
- Open Actions tab → latest push to `main` → backend lint ✅ frontend lint+build ✅

**PO acceptance:** Mitali Radia accepted all five stories. The demo matched every acceptance criterion in [user-stories.md](../../user-stories.md) for EVG-21–25.

---

## Carry-over note

Sprint 1 was planned for a single day (2026-10-25) but the JIRA setup and CI debugging extended the work into 2026-10-26 and 2026-10-27. Two plan changes contributed:

1. **JIRA project type change:** Originally team-managed, switched to company-managed at my request. Required an extra commit (Commit 6) and field-mapping investigation.
2. **CI `hashFiles` bug:** GitHub Actions does not support `hashFiles()` in job-level `if` conditions. Required two fix commits before the workflow was stable.

These are realistic Scrum deviations. The carry-over is recorded here and the Sprint 2 plan is updated to reflect the shorter remaining window.

---

## Backlog changes

None. All committed stories were completed. No scope was added or removed.
