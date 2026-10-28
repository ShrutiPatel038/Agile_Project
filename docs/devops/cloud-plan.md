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
| Redis | ElastiCache Serverless | Shared by Socket.IO adapter + BullMQ |
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
  ├── backend  → MongoDB Atlas (private link) + ElastiCache (VPC endpoint)
  └── frontend → Nginx proxies to backend via ALB internal DNS
```

---

## Scaling

| Component | Strategy | Trigger |
|---|---|---|
| Backend ECS tasks | Horizontal auto-scaling | CPU > 70% or request queue depth |
| Redis ElastiCache | Serverless — scales automatically | — |
| MongoDB Atlas | Manual tier upgrade | Storage > 80% |

Socket.IO with Redis adapter scales horizontally: any backend instance can emit to any connected socket.

---

## Cost estimate (MVP, low traffic)

| Service | Monthly estimate |
|---|---|
| ECS Fargate (2 tasks × 0.5 vCPU, 1 GB) | ~$20 |
| MongoDB Atlas M10 | ~$57 |
| ElastiCache Serverless | ~$10 |
| ALB | ~$20 |
| CloudFront + S3 | ~$5 |
| ECR | ~$1 |
| **Total** | **~$113/month** |

---

## Security hardening

- All services in a VPC; backend and data tiers in private subnets.
- Security groups: ALB → backend only on port 5000; backend → MongoDB Atlas only.
- Secrets injected at task start from Secrets Manager; never in image layers or env var logs.
- S3 bucket policy: write from backend task role only; read via signed URLs.
- WAF on ALB: block common OWASP top-10 patterns.
- ECR image scanning enabled; block images with critical CVEs.
