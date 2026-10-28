# Docker & Docker Compose — EV-Go

## Prerequisites

- Docker Desktop ≥ 4.28 (Engine 26+)
- `docker compose` plugin (V2)

## Quick start

```bash
# 1. Copy env file and fill in Razorpay + Email secrets
cp backend/.env.example backend/.env

# 2. Build and start all services (mongo, redis, backend, frontend)
docker compose up --build

# 3. Services available at:
#    Frontend  → http://localhost:5173
#    Backend   → http://localhost:5000
#    Health    → http://localhost:5000/health
```

## Service architecture

```
browser
  └── frontend (nginx:alpine :80→5173)
        ├── /api/*      → proxy → backend:5000
        └── /socket.io/ → proxy → backend:5000 (WebSocket)
              └── backend (node:20-alpine :5000)
                    ├── mongo:27017  (replica set rs0)
                    └── redis:6379
```

## Individual commands

```bash
# Start in background
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild a single service after code change
docker compose up --build backend

# Stop and remove containers (keeps volumes)
docker compose down

# Remove everything including volumes (wipes DB data)
docker compose down -v
```

## Volumes

| Volume | Contents |
|---|---|
| `mongo-data` | MongoDB data files |
| `redis-data` | Redis RDB snapshot |
| `backend-uploads` | User-uploaded files and generated invoices |

## Environment variables

All backend env vars are read from `backend/.env` at startup. See `backend/.env.example` for the full list. The Compose file overrides `MONGO_URI` and `REDIS_URL` to point at the internal service names.

## MongoDB replica set

The `mongo` service uses a single-node replica set (`rs0`). This is required because `createBooking` uses a Mongoose session (multi-document transaction). The healthcheck runs `rs.initiate()` on first start; subsequent restarts detect the set is already initialised.

## Healthchecks

| Service | Check | Interval |
|---|---|---|
| mongo | `rs.status().ok` via mongosh | 10s |
| redis | `redis-cli ping` | 10s |
| backend | `GET /health` via wget | 30s |
| frontend | depends_on backend healthy | — |

## Production notes

- In production, set `VITE_API_URL` build arg to the real backend URL (e.g. `https://api.evgo.example.com`).
- Add TLS termination at the Nginx or load-balancer layer; the containers themselves run on plain HTTP.
- Replace `env_file: ./backend/.env` with Docker secrets or a secrets manager.
