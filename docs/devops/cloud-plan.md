# Cloud DevOps Plan — EV-Go

## Target architecture

Single-region deployment on **AWS** (or equivalent cloud) using managed services to reduce operational overhead.

---

## Service mapping

| EV-Go component | AWS service | Notes |
|---|---|---|
| Frontend (Nginx SPA) | ECS Fargate (or S3 + CloudFront) | Static assets to CloudFront CDN for latency |
| Backend (Node/Express) | ECS Fargate | Task definition from `evgo-backend` Docker image |
| MongoDB | MongoDB Atlas M10 (or DocumentDB) | Replica set required for transactions |
| File uploads / invoices | S3 bucket | Replace local `uploads/` volume |
| Container registry | ECR (Elastic Container Registry) | Tagged images pushed by CI |
| Load balancer | ALB (Application Load Balancer) | HTTPS termination + /api + /socket.io routing |
| Secrets | AWS Secrets Manager | Injected into ECS task at runtime |
| Logs | CloudWatch Logs | Winston JSON logs stream here |
| Monitoring | CloudWatch + SNS | Alerts on error rate, latency, booking failures |

---

## Network topology

```
Internet
  └── Route 53 (DNS)
        └── CloudFront (CDN, HTTPS)
              ├── /assets/*  → S3 static bucket
              └── /*         → ALB
                    ├── /api/*      → ECS backend target group
                    ├── /socket.io/ → ECS backend target group (WebSocket)
                    └── /*          → ECS frontend target group (Nginx SPA)

ECS Tasks (private subnet)
  ├── backend  → MongoDB Atlas (private link)
  └── frontend → Nginx proxies to backend via ALB internal DNS
```

---

## Scaling

| Component | Strategy | Trigger |
|---|---|---|
| Backend ECS task | **One task**, scale vertically (more vCPU / memory) | CPU > 70% sustained |
| Frontend ECS tasks | Horizontal auto-scaling (stateless Nginx) | CPU > 70% |
| MongoDB Atlas | Manual tier upgrade | Storage > 80% |

The backend keeps its cache, job timers and Socket.IO rooms in memory, so it must run as a **single task**. Two backend tasks would each have their own cache and socket rooms, and an event emitted on one would not reach clients connected to the other. Horizontal scaling would first need a shared store for the cache, a persistent job queue, and a shared Socket.IO adapter.

---

## Cost estimate (MVP, low traffic)

| Service | Monthly estimate |
|---|---|
| ECS Fargate (1 backend + 1 frontend task × 0.5 vCPU, 1 GB) | ~$20 |
| MongoDB Atlas M10 | ~$57 |
| ALB | ~$20 |
| CloudFront + S3 | ~$5 |
| ECR | ~$1 |
| **Total** | **~$103/month** |

---

## Security hardening

- All services in a VPC; backend and data tiers in private subnets.
- Security groups: ALB → backend only on port 5000; backend → MongoDB Atlas only.
- Secrets injected at task start from Secrets Manager; never in image layers or env var logs.
- S3 bucket policy: write from backend task role only; read via signed URLs.
- WAF on ALB: block common OWASP top-10 patterns.
- ECR image scanning enabled; block images with critical CVEs.
