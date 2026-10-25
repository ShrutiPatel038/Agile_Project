# EV-Go — EV Rental Management System

EV-Go is a MERN-stack platform for renting electric vehicles from staffed stations. It covers the whole rental: browse stations and vehicles, book a time slot, pay through Razorpay, run the ride with a station master, then handle overtime billing, refunds and loyalty points.

This repository rebuilds EV-Go incrementally with Scrum and DevOps practices. The work runs as four one-day sprints, tracked in JIRA (`EVG-*` keys in every commit), with CI on GitHub Actions and containerised with Docker Compose.

> 🚧 Work in progress. Sprint 1 started on 2026-10-25.

## Roles

| Role | What they do |
|---|---|
| **User** | Browses vehicles, books rides, pays, raises support tickets, earns loyalty points |
| **Station Master** | Starts and ends rides at their station, handles refunds and support |
| **Super Admin** | Manages stations, vehicles and station masters; views system analytics |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Backend | Node.js 20, Express |
| Database | MongoDB (Mongoose) |
| Cache / queues | Redis, BullMQ |
| Real-time | Socket.IO |
| Payments | Razorpay |
| Logging | Winston + Morgan |
| CI | GitHub Actions |
| Containers | Docker, Docker Compose, Nginx |

## Repository layout (planned)

```
backend/      Express API, workers, cron jobs
frontend/     React SPA
docs/agile/   Vision, backlog, user stories, story map, sprint docs, JIRA import
docs/testing/ Test strategy, manual test cases, test pyramid
docs/devops/  Docker, CD, cloud, Kubernetes and monitoring plans
```

## Getting started

Setup instructions will be added as the backend and frontend are scaffolded.
