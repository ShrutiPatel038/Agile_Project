# Working Agreement — EV-Go Scrum Team

How we work together during the four one-day sprints (2026-10-25 → 2026-10-28). The whole team agreed to this at the start of Sprint 1, and it's revisited in every retrospective.

## 1. Team and roles

| Member | Scrum role | Also does |
|---|---|---|
| Mitali Radia | Product Owner | Developer |
| Muskan Dalsania | Scrum Master | Developer |
| Shruti Patel | Developer; repo owner and integrator (merges to `main`)| — |

- The **Product Owner** owns the backlog order, writes the acceptance criteria and accepts or rejects stories in the review.
- The **Scrum Master** runs the ceremonies, keeps the JIRA board current and removes blockers.
- **Developers** pull work from the sprint backlog, pair on risky stories (EVG-33, EVG-37, EVG-38) and review each other's changes before Done.

## 2. Sprint rhythm (1-day sprints)

| Time | Event | Length |
|---|---|---|
| 09:00 | Sprint planning: goal, commitment, task breakdown | 30 min |
| 13:00 | Mid-day sync (stand-up format: done / next / blocked) | 15 min |
| 16:30 | Sprint review: demo against the acceptance criteria, PO accepts or rejects | 30 min |
| 17:00 | Retrospective: Start / Stop / Continue + action items | 15 min |

The morning planning replaces the first daily stand-up, and the mid-day sync is the only stand-up in a one-day sprint.

## 3. Capacity

- **6 focused hours per person per sprint day.**
- Ceremonies take about 1.5 h per person (planning, sync, review, retro), which leaves **≈ 4.5 h of development time per person**.
- Team capacity is **3 × 4.5 h = 13.5 development hours per sprint**.
- Sprint 1 velocity is a baseline, not a target: half of Sprint 1 is process setup (unestimated tasks). From Sprint 2 onwards, the commitment is based on capacity, cross-checked against the previous sprint's velocity.

## 4. Estimation

- **Story points** on a Fibonacci scale: 1, 2, 3, 5, 8. Anything bigger than 8 has to be split before it can be committed.
- Estimated with **planning poker** in backlog refinement. If the votes differ by more than one step, the highest and lowest voters explain their reasoning and the team votes again.
- Points measure **complexity and risk, not hours**. Hours are only used for the task breakdown in sprint planning.
- **Tasks** (setup, documentation, ceremonies) are not pointed and don't count towards velocity.

**Reference stories**

| SP | Reference | Why |
|---|---|---|
| 1 | EVG-27 Browse stations | One read endpoint plus a cache, no business rules |
| 3 | EVG-28 Free vehicles for a time window | One query with overlap logic and a UI filter |
| 5 | EVG-37 Pay with Razorpay | External API, HMAC verification, idempotency |
| 8 | EVG-33 Create booking without double-booking | Transaction, concurrency, 10+ validation rules, pricing |

## 5. Definition of Ready (a story can enter a sprint when…)

- [ ] It's written as *As a … I want … so that …* and has a JIRA key.
- [ ] Its acceptance criteria are in Given/When/Then form in [user-stories.md](user-stories.md).
- [ ] It's estimated (≤ 8 SP) and has a MoSCoW priority.
- [ ] Its dependencies are done or in the same sprint. For example, EVG-37 Payment needs EVG-33 Booking.
- [ ] Any external setup it needs is known: Razorpay test keys, a Gmail app password, a MongoDB replica set (e.g. Atlas).
- [ ] The team understands it well enough to break it into tasks of 2 h or less.

## 6. Definition of Done (a story is Done when…)

**Code stories**
- [ ] Every acceptance criterion has been demonstrated manually (steps from `docs/testing/manual-test-cases.md` once it exists).
- [ ] `npm run lint` passes in every app the story touched, and the frontend `npm run build` succeeds.
- [ ] The app still installs and starts. No step leaves `main` broken.
- [ ] Key events go through the shared `logger`, never `console.log`. No passwords, JWTs, card data or secrets appear in the logs.
- [ ] No secrets are committed. Any new environment variable is added to `.env.example` with a placeholder.
- [ ] Every commit message follows `<type>(<scope>): <summary> [EVG-x]`.
- [ ] CI is green on `main` after the push.
- [ ] Another team member has reviewed the change (the JIRA card has passed through **In Review**).
- [ ] The Product Owner accepted it in the sprint review, and the JIRA issue is in **Done** with its story points set.

**Documentation stories and tasks**
- [ ] The content is specific to EV-Go (real endpoints, services, workflows). No generic filler.
- [ ] Mermaid diagrams render on GitHub, and relative links resolve.
- [ ] Reviewed by one other member.

**Sprint**
- [ ] The sprint review and retrospective are written up in `docs/agile/sprints/sprint-<n>/`.
- [ ] `velocity.md` is updated.
- [ ] Unfinished stories go back to the backlog (or the next sprint) with a note. They are never partly marked Done.

## 7. Engineering conventions

- **Commits:** small and focused (usually 1–10 files), one concern each, Conventional Commit types: `feat`, `fix`, `refactor`, `docs`, `chore`, `ci`, `build`, `style`.
- **Branching:** commits go to `main` through the integrator, and every push runs CI. Pull requests to `main` are linted the same way.
- **Code style:** ESLint in both apps and `.editorconfig` (4 spaces, LF, UTF-8).
- **Node version:** 20 everywhere (`.nvmrc`, CI, Docker images).
- **Secrets:** only in local `.env` files, which are gitignored. Each app ships a `.env.example`.

## 8. Board and communication

- **JIRA board columns:** To Do → In Progress → In Review → Done. A card moves to In Progress when its first commit starts. It only moves to Done when its acceptance criteria are met.
- Every commit carries its `EVG-x` key so it shows up on the issue through the GitHub integration (see [jira-setup.md](jira-setup.md)).
- Anyone blocked for more than 30 minutes raises it with the Scrum Master straight away instead of waiting for the sync.
- Decisions that change scope (for example dropping a Could story) are made by the Product Owner and recorded in the sprint review.
