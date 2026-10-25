# Story Map — EV-Go

The story map lays the backlog out along the renter's journey (the **backbone**), with the supporting staff and platform work below it. Horizontal **release slices** cut through the map: each slice is the thinnest set of stories that gives a usable product at the end of a sprint.

Story details: [user-stories.md](user-stories.md) · Priorities and points: [product-backlog.md](product-backlog.md)

## 1. Backbone: the renter's journey

```mermaid
flowchart LR
    A["🔎 Browse<br/>find a station<br/>and a free EV"] --> B["📅 Booking<br/>reserve a time slot"]
    B --> C["💳 Payment<br/>pay before the deadline"]
    C --> D["🚗 Ride<br/>pick up and drive"]
    D --> E["✅ Completion<br/>return the vehicle"]
    E --> F["⭐ Post-ride<br/>refunds, rewards,<br/>feedback, support"]
```

Two supporting lanes sit under the backbone. Users never see them, but the journey doesn't work without them:

- **Station & admin operations:** stations, fleet, staff, analytics (Station Master, Super Admin)
- **Platform:** auth, notifications, logging, CI, containers

## 2. The map

Rows are release slices, columns are backbone activities. Each cell lists the user tasks (stories) delivered in that slice. Within a cell, the most important story comes first.

| Slice | 🔎 Browse | 📅 Booking | 💳 Payment | 🚗 Ride | ✅ Completion | ⭐ Post-ride |
|---|---|---|---|---|---|---|
| **R0: Foundation** (Sprint 1) | Sign up / log in *(EVG-23)* | – | – | – | – | – |
| **R1: Bookable** (Sprint 2) | See stations *(EVG-27)*<br/>Find a vehicle free for my slot *(EVG-28)* | Book without double-booking *(EVG-33)*<br/>View & modify my bookings *(EVG-34)* | – | Station master starts the ride *(EVG-35)* | Station master completes / cancels *(EVG-35)* | My ride analytics *(EVG-34)* |
| **R2: Paid & reliable** (Sprint 3) | – | Unpaid bookings auto-released *(EVG-42)* | Pay with Razorpay *(EVG-37)*<br/>Confirmed even if the tab closes *(EVG-38)*<br/>Email + PDF invoice *(EVG-41)* | Live updates *(EVG-40)*<br/>Overtime billed automatically *(EVG-43)* | Deposit released *(EVG-39)* | Request a refund *(EVG-39)*<br/>Earn & redeem points *(EVG-45)*<br/>Raise a support ticket *(EVG-46)* |
| **R3: Complete & shippable** (Sprint 4) | Save favourites, read reviews *(EVG-47)* | Verify my phone *(EVG-49)* | – | Chat with station, emergency alert *(EVG-48)* | – | Review the vehicle *(EVG-47)* |

**Supporting lanes**

| Slice | Station & admin operations | Platform |
|---|---|---|
| **R0** (Sprint 1) | – | Health, logging, config *(EVG-21)*<br/>CI lint + build *(EVG-22)*<br/>Role-based access *(EVG-24)*<br/>Rate limiting *(EVG-25)* |
| **R1** (Sprint 2) | Manage stations *(EVG-29)*<br/>Manage vehicles *(EVG-30)*<br/>Manage station masters *(EVG-31)*<br/>Station dashboard *(EVG-36)* | In-app notifications *(EVG-32)* |
| **R2** (Sprint 3) | System analytics *(EVG-44)*<br/>Customers & active rides *(EVG-50)*<br/>Approve refunds *(EVG-39)* | Payment watchdogs *(EVG-42)* |
| **R3** (Sprint 4) | – | Docker + Compose + CI image build *(EVG-51)*<br/>Test strategy *(EVG-52)*<br/>CD / cloud / K8s / monitoring plans *(EVG-53)*<br/>Architecture + README *(EVG-54)* |

## 3. Release slices

### R0: Foundation (Sprint 1, 2026-10-25)
**Outcome:** a user can register and log in, each role sees only its own area, and every push is linted by CI.
Not yet useful to a renter, but it's the walking skeleton everything else hangs on.

```mermaid
flowchart LR
    subgraph R0["R0: Foundation"]
        direction LR
        P1["EVG-21<br/>health + logging"] --> P2["EVG-22<br/>CI"]
        A1["EVG-23<br/>register / login"] --> A2["EVG-24<br/>roles"] --> A3["EVG-25<br/>rate limits"]
    end
```

### R1: Bookable (Sprint 2, 2026-10-26)
**Outcome:** the first complete journey. A super admin sets up a station, vehicles and a station master. A user finds a free vehicle and books it. The station master starts and completes the ride.
Payment is skipped in this slice, so bookings stay `paymentStatus: pending`. Starting a ride needs a completed payment, so the start-ride demo in R1 uses a seeded paid booking.

```mermaid
flowchart LR
    subgraph R1["R1: Bookable"]
        direction LR
        S0["EVG-29/30/31<br/>admin sets up<br/>station, fleet, staff"] --> S1["EVG-27<br/>see stations"]
        S1 --> S2["EVG-28<br/>free vehicles"]
        S2 --> S3["EVG-33<br/>book safely"]
        S3 --> S4["EVG-34<br/>my bookings"]
        S3 --> S5["EVG-35/36<br/>start + complete<br/>from dashboard"]
    end
```

### R2: Paid & reliable (Sprint 3, 2026-10-27)
**Outcome:** a commercially usable product. Every booking is paid through Razorpay or released automatically. Refunds follow the published policy. Staff see changes live. Late returns are billed without anyone stepping in.

```mermaid
flowchart LR
    subgraph R2["R2: Paid & reliable"]
        direction LR
        B["booking<br/>(R1)"] --> P["EVG-37<br/>pay"]
        P --> W["EVG-38<br/>webhook safety net"]
        P --> M["EVG-41<br/>email + invoice"]
        B --> T["EVG-42<br/>auto-cancel unpaid"]
        P --> R["ride (R1)"] --> O["EVG-43<br/>overtime"]
        R --> F["EVG-39<br/>deposit + refund"]
        F --> L["EVG-45<br/>loyalty"]
        RT["EVG-40<br/>real-time"] -.-> P
        RT -.-> R
    end
```

### R3: Complete & shippable (Sprint 4, 2026-10-28)
**Outcome:** the full feature set (reviews, favourites, chat, OTP), running with `docker compose up` and built by CI, with test and operations documentation.

```mermaid
flowchart LR
    subgraph R3["R3: Complete & shippable"]
        direction LR
        E1["EVG-47<br/>reviews + favourites"]
        E2["EVG-48<br/>chat + emergency"]
        E3["EVG-49<br/>phone OTP"]
        D1["EVG-51<br/>Docker + Compose"] --> D2["CI image build"]
        D3["EVG-52/53/54<br/>test + ops docs"]
    end
```

## 4. Reading the map

- **The first slice that works end to end is R1.** By the end of Sprint 2 a booking can go through browse → book → ride → complete. Sprint 2's demo should walk exactly that path.
- **Payment arrives in R2, not R1, on purpose.** The booking engine (transaction, overlap check, pricing) is the riskiest part, so it goes first without Razorpay in the way. `paymentStatus` and `paymentDeadline` are already stored in R1, so payment plugs in later without changing the booking model.
- **Post-ride grows over time.** Analytics comes in R1, refunds, loyalty and support in R2, reviews in R3. If a sprint overruns, the right-hand columns and the **Could** stories (EVG-45 to EVG-49) are cut first, and the backbone stays complete.
- **The platform lane is front-loaded and back-loaded.** Auth and CI come first because everything depends on them. Containers and ops docs come last because they package what already works.
