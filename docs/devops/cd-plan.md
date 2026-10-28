# Continuous Delivery Plan — EV-Go

## Overview

This document describes the planned CD pipeline for EV-Go. CI (GitHub Actions) is implemented; the CD stages below are planned for a cloud deployment (AWS / Render / Railway).

---

## Pipeline stages

```
Developer push → GitHub
  └── CI (GitHub Actions)
        ├── backend lint          (fast gate, ~1 min)
        ├── frontend lint + build (~2 min)
        └── Docker image build    (~3 min)
              └── [on main branch, CI passes] → CD trigger
                    ├── Build & tag Docker images
                    │     backend:  evgo-backend:<sha>
                    │     frontend: evgo-frontend:<sha>
                    ├── Push to container registry (GHCR / ECR)
                    ├── Deploy to Staging environment
                    │     docker compose pull && docker compose up -d
                    ├── Smoke tests (manual or automated)
                    └── [Approval gate] → Deploy to Production
```

---

## Environments

| Environment | Trigger | Approval | URL |
|---|---|---|---|
| Staging | Push to `main` passes CI | Automatic | `staging.evgo.example.com` |
| Production | Manual approval after staging smoke test | Manual (SM or SA) | `evgo.example.com` |

---

## Deployment strategy

**Rolling update** (single-server) — suitable for the current scale:
1. Pull new images.
2. `docker compose up -d --no-deps backend` — replace backend container (MongoDB stays up, so bookings continue).
3. Wait for `GET /health` → 200 before replacing frontend.
4. `docker compose up -d --no-deps frontend` — replace frontend container.

Zero-downtime is preserved because the backend health gate prevents traffic from reaching the new container until it is ready.

---

## Rollback procedure

```bash
# Identify the last good image tag from git log
LAST_GOOD_SHA=$(git log --oneline -5)

# Pull previous image
docker pull ghcr.io/org/evgo-backend:<last-good-sha>

# Roll back backend
docker compose stop backend
BACKEND_IMAGE=ghcr.io/org/evgo-backend:<last-good-sha> docker compose up -d backend
```

---

## Secrets management

| Secret | Storage |
|---|---|
| `MONGO_URI` | Docker secret / env var in deployment platform |
| `REDIS_URL` | Docker secret |
| `JWT_SECRET` | Docker secret (rotate quarterly) |
| `RAZORPAY_KEY_ID` / `SECRET` | Docker secret (never in image layer) |
| `RAZORPAY_WEBHOOK_SECRET` | Docker secret |
| `EMAIL_USER` / `EMAIL_PASS` | Docker secret |

Never bake secrets into Docker images. The CI workflow does not push images (just builds them to validate the Dockerfiles).

---

## CD tooling (planned)

| Tool | Purpose |
|---|---|
| GitHub Actions | CI already implemented; CD jobs to be added |
| GHCR (GitHub Container Registry) | Store tagged Docker images |
| Docker Compose (on server) | Deploy and manage containers |
| `docker compose healthcheck` | Verify new container before switching traffic |

---

## Definition of Done for a release

- [ ] CI passes (lint + build + Docker build)
- [ ] Staging deployment smoke test: `GET /health` → 200, frontend loads, test booking flow works
- [ ] No new `error` level logs in staging for 10 min after deploy
- [ ] SM and SA dashboards load without error
- [ ] Manual approval recorded in GitHub deployment log
