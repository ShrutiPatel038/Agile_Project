# Sprint 4 Planning — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 4 |
| **Date** | Wed 2026-10-28 (Day 4) |
| **Time-box** | 09:00 – 17:00 |
| **Scrum Master** | Muskan Dalsania |
| **Product Owner** | Mitali Radia |
| **Developers** | Mitali Radia, Muskan Dalsania, Shruti Patel |

---

## Sprint goal

> **Ship it:** containerise the application with Docker and Compose, add the CI Docker image build job, write the complete testing and DevOps documentation suite, and produce the final README so the repo fully demonstrates the Agile + DevOps requirements of the course.

---

## Capacity

| Person | Hours available | Hours for dev (75%) |
|---|---|---|
| Mitali Radia | 6h | 4.5h |
| Muskan Dalsania | 6h | 4.5h |
| Shruti Patel | 6h | 4.5h |
| **Total** | **18h** | **13.5h** |

Sprint 3 velocity: 43 SP in 13.5 dev h → ~3.2 SP/h. Targeting 25–30 SP this sprint (docs-heavy, less dev work).

---

## Committed stories

| Key | Story | Points | Priority | Owner |
|---|---|---|---|---|
| EVG-51 | Containerised deployment (Docker + Compose + CI image build) | 8 | Must Have | Shruti |
| EVG-52 | Test strategy, manual test cases, test pyramid | 5 | Must Have | Mitali |
| EVG-53 | CD / cloud / Kubernetes / monitoring plans | 5 | Must Have | Muskan |
| EVG-54 | Architecture docs + final README | 5 | Must Have | Shruti |
| EVG-18 | Sprint 4 planning, review, retro | 3 | Must Have | All |

**Total committed: 26 SP**

---

## Task breakdown

### EVG-51 — Docker + Compose + CI (Shruti, ~3h)
- [ ] `backend/Dockerfile` — `node:20-alpine`, `npm ci --omit=dev`, non-root user, `HEALTHCHECK /health`
- [ ] `frontend/Dockerfile` — multi-stage: Node build → Nginx serve
- [ ] `frontend/nginx.conf` — SPA fallback, `/api` + `/socket.io` proxy
- [ ] `backend/.dockerignore`, `frontend/.dockerignore`
- [ ] `docker-compose.yml` — frontend, backend, mongo (replica set); named volumes; healthchecks
- [ ] `docs/devops/docker.md` — run commands
- [ ] `.github/workflows/ci.yml` — add Docker image build job (needs-backend + needs-frontend)

### EVG-52 — Testing docs (Mitali, ~2h)
- [ ] `docs/testing/test-strategy.md` — unit / integration / E2E split, TDD section with 3 written test cases
- [ ] `docs/testing/manual-test-cases.md` — happy path + edge cases mapped to EVG-xx stories
- [ ] `docs/testing/test-pyramid.md` — planned pyramid percentages

### EVG-53 — DevOps docs (Muskan, ~2h)
- [ ] `docs/devops/cd-plan.md` — GitHub Actions → Docker Hub → target environment
- [ ] `docs/devops/cloud-plan.md` — AWS/GCP/Azure options + deployment steps
- [ ] `docs/devops/kubernetes-plan.md` — Deployments, Services, ConfigMaps, Secrets + Mermaid topology
- [ ] `docs/devops/monitoring-plan.md` — health, latency, error rate, payment failures, queue backlog + Winston integration

### EVG-54 — Architecture + README (Shruti, ~1.5h)
- [ ] `docs/architecture.md` — system diagram (Mermaid), request flow, CI pipeline diagram
- [ ] `README.md` — CI badge, prerequisites, local dev setup, Docker run, env vars, team

---

## Definition of Done (Sprint 4)

- `docker compose up` starts all four services with no manual steps.
- Backend image passes `HEALTHCHECK` within 30s.
- Frontend image serves the SPA at `http://localhost:5173` via Nginx.
- CI pipeline: backend lint → frontend lint + build → Docker image builds pass on main.
- All docs files reference real endpoints, real models, real sprint dates — no generic boilerplate.
