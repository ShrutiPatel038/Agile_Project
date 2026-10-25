# Product Backlog — EV-Go

The backlog is ordered by sprint, then by priority. Full stories with acceptance criteria are in [user-stories.md](user-stories.md). JIRA keys match [jira-import.csv](jira-import.csv).

- **Priority:** MoSCoW. **M**ust / **S**hould / **C**ould / **W**on't (this release)
- **Estimate:** story points on a Fibonacci scale (1, 2, 3, 5, 8). See [estimation in working-agreement.md](working-agreement.md).
- **Tasks** (process and setup work) carry no story points and don't count towards velocity.

## Epics

| Key | Epic | Goal |
|---|---|---|
| EVG-1 | Project Setup & Agile | Repo, conventions and Scrum artefacts in place |
| EVG-2 | Auth & Access Control | Secure login and role-based access for three roles |
| EVG-3 | Stations & Vehicle Catalogue | Users can find a free vehicle for their time window |
| EVG-4 | Booking Management | Bookings with no double-booking and server-side pricing |
| EVG-5 | Station Operations | Station masters run rides from one dashboard |
| EVG-6 | Payments & Refunds | Every payment ends in a confirmed booking or a refund |
| EVG-7 | Real-time & Notifications | Changes reach the right people instantly |
| EVG-8 | Background Jobs & Reliability | Timeouts, overtime, email and watchdogs run without manual work |
| EVG-9 | Engagement | Loyalty, support, reviews, favourites, chat, OTP |
| EVG-10 | Administration & Analytics | Super admin controls the whole network |
| EVG-11 | DevOps & Release | Logging, CI, containers, test and ops documentation |

## Backlog

### Sprint 1: Setup, Agile foundation, Auth (2026-10-25)

| Key | Item | Type | Epic | Priority | SP |
|---|---|---|---|:-:|:-:|
| EVG-12 | Repository setup and conventions | Task | EVG-1 | M | – |
| EVG-13 | Product vision and personas | Task | EVG-1 | M | – |
| EVG-14 | Product backlog and user stories | Task | EVG-1 | M | – |
| EVG-15 | Story map and release slices | Task | EVG-1 | M | – |
| EVG-16 | Working agreement, DoR/DoD, JIRA setup | Task | EVG-1 | M | – |
| EVG-17 | Sprint 1 ceremonies (planning, review, retro) | Task | EVG-1 | M | – |
| EVG-21 | Backend foundation: health check, logging, config | Story | EVG-11 | M | 3 |
| EVG-22 | CI pipeline: lint and build on every push | Story | EVG-11 | M | 3 |
| EVG-23 | User registration and login | Story | EVG-2 | M | 5 |
| EVG-24 | Role-based access for User / Station Master / Super Admin | Story | EVG-2 | M | 3 |
| EVG-25 | Rate limiting on sensitive endpoints | Story | EVG-2 | S | 2 |
| EVG-26 | Frontend project setup | Task | EVG-11 | M | – |
| | **Sprint 1 story points** | | | | **16** |

### Sprint 2: Stations, Vehicles, Booking core (2026-10-26)

| Key | Item | Type | Epic | Priority | SP |
|---|---|---|---|:-:|:-:|
| EVG-18 | Sprint 2 ceremonies | Task | EVG-1 | M | – |
| EVG-27 | Browse stations | Story | EVG-3 | M | 1 |
| EVG-28 | Browse vehicles available for a time window | Story | EVG-3 | M | 3 |
| EVG-29 | Super admin manages stations | Story | EVG-10 | M | 2 |
| EVG-30 | Super admin manages vehicles | Story | EVG-10 | M | 3 |
| EVG-31 | Super admin manages station masters | Story | EVG-10 | M | 3 |
| EVG-32 | In-app notifications | Story | EVG-7 | S | 2 |
| EVG-33 | Create a booking without double-booking | Story | EVG-4 | M | 8 |
| EVG-34 | View and modify my bookings | Story | EVG-4 | M | 5 |
| EVG-35 | Station master starts, completes and cancels rides | Story | EVG-5 | M | 5 |
| EVG-36 | Station master dashboard | Story | EVG-5 | M | 3 |
| | **Sprint 2 story points** | | | | **35** |

### Sprint 3: Payments, Real-time, Background jobs, Engagement (2026-10-27)

| Key | Item | Type | Epic | Priority | SP |
|---|---|---|---|:-:|:-:|
| EVG-19 | Sprint 3 ceremonies | Task | EVG-1 | M | – |
| EVG-37 | Pay for a booking with Razorpay | Story | EVG-6 | M | 5 |
| EVG-38 | Payment confirmed even if the browser closes (webhook) | Story | EVG-6 | M | 5 |
| EVG-39 | Security deposit and refunds | Story | EVG-6 | M | 5 |
| EVG-40 | Real-time updates over Socket.IO | Story | EVG-7 | S | 5 |
| EVG-41 | Confirmation email with PDF invoice | Story | EVG-8 | S | 3 |
| EVG-42 | Auto-cancel unpaid bookings, payment watchdogs | Story | EVG-8 | M | 3 |
| EVG-43 | Overtime billing | Story | EVG-8 | S | 3 |
| EVG-44 | Super admin system analytics (cached) | Story | EVG-10 | S | 2 |
| EVG-45 | Loyalty points, tiers and referrals | Story | EVG-9 | C | 3 |
| EVG-46 | Support tickets with SLA | Story | EVG-9 | C | 3 |
| EVG-50 | Super admin manages customers and active rides | Story | EVG-10 | S | 3 |
| | **Sprint 3 story points** | | | | **40** |

### Sprint 4: Remaining features, Docker, CI, DevOps docs, Release (2026-10-28)

| Key | Item | Type | Epic | Priority | SP |
|---|---|---|---|:-:|:-:|
| EVG-20 | Sprint 4 ceremonies + project retrospective | Task | EVG-1 | M | – |
| EVG-47 | Reviews and favourites | Story | EVG-9 | C | 3 |
| EVG-48 | Booking chat and emergency alert | Story | EVG-9 | C | 2 |
| EVG-49 | Phone verification (OTP) | Story | EVG-9 | C | 2 |
| EVG-51 | Containerised deployment (Docker + Compose + CI image build) | Story | EVG-11 | M | 8 |
| EVG-52 | Test strategy, manual test cases, test pyramid | Story | EVG-11 | S | 3 |
| EVG-53 | CD, cloud, Kubernetes and monitoring plans | Story | EVG-11 | S | 3 |
| EVG-54 | Architecture docs and final README | Story | EVG-11 | S | 2 |
| | **Sprint 4 story points** | | | | **23** |

**Total: 33 stories, 114 story points.** Plus 10 unestimated tasks.

## Won't have (this release)

These items were discussed and deliberately left out. They have no JIRA keys yet.

| Item | Reason |
|---|---|
| Driver licence / KYC document verification | Fields exist on `User.driverLicense`, but the upload flow needs secure file storage and manual review. Deferred. |
| Automated unit / integration / E2E tests | Course scope limits this release to a documented strategy ([test-strategy.md](../testing/test-strategy.md)) |
| Continuous deployment to a cloud host | Planned only ([cd-plan.md](../devops/cd-plan.md)) |
| Kubernetes deployment | Planned only ([kubernetes-plan.md](../devops/kubernetes-plan.md)) |
| Monitoring dashboards (Prometheus / Grafana) | Planned only ([monitoring-plan.md](../devops/monitoring-plan.md)) |
| Live GPS tracking of vehicles | Needs telematics hardware |
| Native mobile apps | The web SPA is responsive; native apps come later |
| Stripe as a second payment gateway | Razorpay covers the INR market; Stripe was dropped from the dependencies |

## Backlog refinement notes

- **EVG-33** is the riskiest story (concurrency + transactions). It's split into technical tasks in the Sprint 2 planning.
- **EVG-38** depends on the webhook receiving the raw request body. This has to be checked before any JSON body parser runs (`express.raw()` on `/api/payments/webhook` only).
- **EVG-42** and **EVG-43** depend on Redis for exact timing. Their acceptance criteria include the cron fallback for when Redis is down.
- Engagement stories (EVG-45 to EVG-49) are **Could**. If Sprint 3 overruns, they're the first to drop or move.
