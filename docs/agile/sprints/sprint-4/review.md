# Sprint 4 Review — EV-Go

| | |
|---|---|
| Sprint | 4 of 4 |
| Date | 2026-10-28 |
| Duration | 1 day |
| Scrum Master | Muskan Dalsania |
| Product Owner | Mitali Radia |
| Attendees | Shruti Patel, Mitali Radia, Muskan Dalsania |

---

## Sprint goal

Deliver production-ready containerisation (Docker + CI image build), complete DevOps documentation suite (CD, cloud, Kubernetes, monitoring), write testing strategy with TDD examples, and produce the final architecture doc and README.

**Goal met: yes.**

---

## Committed vs completed

| Story | Points | Status |
|---|---|---|
| EVG-51 · Containerised deployment (Docker + Compose + CI image build) | 8 | Done |
| EVG-52 · Test strategy, manual tests, test pyramid | 5 | Done |
| EVG-53 · CD / cloud / Kubernetes / monitoring plans | 5 | Done |
| EVG-54 · Architecture docs & final README | 5 | Done |
| EVG-18 · Sprint 4 ceremonies (planning, review, retro) | 3 | Done |
| **Total** | **26** | **26 / 26 SP accepted** |

---

## Demo script

> Run `docker compose up --build` first. All steps assume services are healthy.

### 1. CI badge
- Open `README.md` on GitHub.
- Confirm the green CI badge links to the Actions workflow.

### 2. Docker Compose stack
```bash
docker compose up --build
# Wait for "Server running on port 5000"
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 3. Frontend loads
- Open `http://localhost:5173` — EV-Go home page renders.
- Register a new user; login succeeds; JWT cookie set.

### 4. Backend Dockerfile non-root user
```bash
docker exec evgo-backend whoami
# Expected: evgo
```

### 5. MongoDB replica set running inside Compose
```bash
docker exec evgo-mongo mongosh --eval "rs.status().myState"
# Expected: 1  (PRIMARY)
```

### 6. Architecture diagrams
- Open `docs/architecture.md` on GitHub.
- Confirm three Mermaid diagrams render: system, booking state machine, CI pipeline.

### 7. Testing docs
- Open `docs/testing/test-strategy.md` — three TDD Jest test cases present.
- Open `docs/testing/manual-test-cases.md` — MT-01 through MT-35.

### 8. DevOps docs
- `docs/devops/cd-plan.md` — rolling update pipeline, rollback, DoD checklist.
- `docs/devops/kubernetes-plan.md` — Mermaid cluster topology.
- `docs/devops/monitoring-plan.md` — Winston log table, Prometheus metrics, runbook.

---

## PO feedback

- All 26 SP accepted without reservation.
- README and architecture diagram gave the PO an instant orientation to the project structure.
- Docker Compose single-command startup (`docker compose up --build`) is exactly the goal for a demo environment.
- No stories carried over.

---

## Backlog changes

No new stories added. The product backlog is closed for this course project. Any future iterations would begin a new JIRA project.

---

## Metrics

| Metric | Value |
|---|---|
| Committed SP | 26 |
| Completed SP | 26 |
| Velocity | 26 |
| Bugs found in review | 0 |
| Stories carried over | 0 |
