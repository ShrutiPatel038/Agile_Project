# EV-Go — EV Rental Management System

[![CI](https://github.com/ShrutiPatel038/Agile_Project/actions/workflows/ci.yml/badge.svg)](https://github.com/ShrutiPatel038/Agile_Project/actions/workflows/ci.yml)

EV-Go is a MERN-stack platform for renting electric vehicles from staffed stations. It covers the full rental lifecycle: browse stations and vehicles, book a slot, pay through Razorpay, manage the ride as a station master, then handle overtime billing, refunds and loyalty points.

This repository rebuilds EV-Go with Scrum and DevOps practices across four one-day sprints (Oct 25–28 2026), tracked in JIRA (`EVG-*` keys in every commit), with CI on GitHub Actions and full containerisation via Docker Compose.

## Roles

| Role | Responsibilities |
|---|---|
| **User** | Browse stations, book and pay for rides, view booking history, earn loyalty points, raise support tickets |
| **Station Master** | Start and complete rides, view their station dashboard, manage vehicles |
| **Super Admin** | Manage stations, vehicles and station masters; view system analytics |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS |
| Backend | Node.js 20, Express 5 |
| Database | MongoDB 7 (Mongoose, replica set for transactions) |
| Cache | In-memory cache with TTL |
| Background jobs | In-process timers + node-cron |
| Real-time | Socket.IO 4 |
| Payments | Razorpay |
| Logging | Winston + Morgan |
| CI | GitHub Actions |
| Containers | Docker, Docker Compose, Nginx |

## Quick start (Docker)

```bash
# 1. Copy the env template and fill in your Razorpay and email credentials
cp backend/.env.example backend/.env

# 2. Build and start all services
docker compose up --build

# 3. Open the app
#    Frontend  →  http://localhost:5173
#    API       →  http://localhost:5000
#    Health    →  http://localhost:5000/health
```

Stop and clean up:

```bash
docker compose down          # stop containers, keep volumes (DB data)
docker compose down -v       # stop and wipe all volumes
```

## Local development (without Docker)

**Prerequisites:** Node 20 and a MongoDB replica set (MongoDB Atlas works). No other services are needed.

```bash
# Backend
cd backend
cp .env.example .env        # fill in secrets
npm install
npm run dev                  # http://localhost:5000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

### Testing several roles at the same time

Each browser origin (port) keeps its own login, so run one frontend port per role:

```bash
cd frontend
npm run dev:roles            # user → :5173, station master → :5174, super admin → :5175
```

Or start them one at a time with `npm run dev:user`, `npm run dev:master` and `npm run dev:admin`. Log in with a different role on each port; logging in or out on one port does not affect the others.

One backend serves all three ports, and real-time updates between roles need them on the same backend. To run an extra backend anyway:

```bash
cd backend
npm run dev:second           # port 5001, cron jobs disabled so they don't run twice
# any port: node server.js --port=5002 --no-jobs
```

To point a frontend at it, set `VITE_API_URL` before starting Vite (PowerShell: `$env:VITE_API_URL="http://localhost:5001"; npm run dev:admin`). Real-time events do not cross between backends, because each one runs its own in-memory Socket.IO server.

## Repository layout

```
backend/          Express API, job timers, cron jobs, Winston logger
frontend/         React SPA (Vite, Tailwind)
docs/
  agile/          Vision, backlog, user stories, story map, sprint docs, JIRA import
  testing/        Test strategy (TDD section), manual test cases, test pyramid
  devops/         Docker guide, CD plan, cloud plan, Kubernetes plan, monitoring plan
  architecture.md System diagram, booking state machine, CI pipeline diagram
.github/
  workflows/
    ci.yml        Lint (backend + frontend) → build → Docker image build
```

## CI

GitHub Actions runs on every push and pull request to `main`:

1. **Backend lint** — `npm run lint` (ESLint flat config)
2. **Frontend lint + build** — `npm run lint` then `npm run build` (Vite)
3. **Docker image build** — builds `evgo-backend:ci` and `evgo-frontend:ci` (no push)

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Agile process

| Artefact | Location |
|---|---|
| Product backlog | `docs/agile/product-backlog.md` |
| User stories | `docs/agile/user-stories.md` |
| Story map | `docs/agile/story-map.md` |
| JIRA import CSV | `docs/agile/jira-import.csv` |
| Sprint docs | `docs/agile/sprints/sprint-{1..4}/` |
| Velocity | `docs/agile/velocity.md` |

## Team

| Name | Role |
|---|---|
| Shruti Patel | Developer, repo owner / integrator |
| Mitali Radia | Product Owner + Developer |
| Muskan Dalsania | Scrum Master + Developer |
