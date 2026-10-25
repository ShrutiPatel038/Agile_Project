# JIRA Setup — EV-Go

How the EV-Go JIRA project is set up, how the backlog is imported from [jira-import.csv](jira-import.csv), and how GitHub commits are linked to issues.

## 1. Create the project

1. In Jira Cloud: **Create → Space → Software development → Scrum → Use template**.
2. Choose **Company-managed** as the space type.
3. Name: **EV-Go**. Key: **EVG**. Set the key explicitly, because Jira suggests one based on the name.
4. **Create a new, empty space for the import.** Jira never reuses issue numbers, so any issue created earlier (even one that was deleted) shifts every key. An empty space gives exactly EVG-1 … EVG-54.

## 2. Board columns

Open **Board → ⋯ → Board settings → Columns**. The Scrum template uses the simplified workflow, so you can add statuses straight from this screen.

| Column | Status | Meaning |
|---|---|---|
| To Do | To Do | Committed or backlog, not started |
| In Progress | In Progress | The first commit for the item has started |
| In Review | In Review *(add)* | Code or docs done; another member checks it against the acceptance criteria / DoD |
| Done | Done | Meets the Definition of Done and was accepted by the PO in the review |

Click **Add status**, name it **In Review** (category *In Progress*), and drag its column between In Progress and Done.

## 3. Create the sprints (before importing)

The CSV `Sprint` column refers to sprints by name. Create them first on **Backlog → Create sprint** so the import attaches issues to them:

| Sprint name | Dates | Goal |
|---|---|---|
| EVG Sprint 1 | 2026-10-25 | Setup, Agile foundation, Auth |
| EVG Sprint 2 | 2026-10-26 | Stations, Vehicles, Booking core |
| EVG Sprint 3 | 2026-10-27 | Payments, Real-time, Background jobs, Engagement |
| EVG Sprint 4 | 2026-10-28 | Remaining features, Docker, CI, DevOps docs, Release |

Only start **EVG Sprint 1**, after the import. The others stay as future sprints until their morning planning.

## 4. Import the CSV

1. Open **⚙ Settings → System → External system import → CSV**. Without Jira admin rights, use **Filters → View all issues → ⋯ → Import issues from CSV** instead.
2. Upload `docs/agile/jira-import.csv`. Encoding UTF-8, delimiter `,`.
3. Import into project **EV-Go (EVG)**.
4. Map the fields:

| CSV column | Jira field |
|---|---|
| Issue Type | Issue Type |
| Summary | Summary |
| Description | Description |
| Epic Name | Epic Name, if the field is offered. Otherwise *don't map*: the epic's Summary already carries the name |
| Epic Link | Epic Link, if offered (matched by Epic Name). Otherwise *don't map*, and set Parent in step 6 |
| Story Points | Story Points (shown as **Story point estimate** on newer Jira Cloud sites) |
| Priority | Priority (values: Highest / High / Medium) |
| Sprint | Sprint |
| Labels | Labels (space-separated, e.g. `sprint-2 moscow-must fullstack`) |

5. Run the import, then check the result:
   - 54 issues: 11 Epics, 33 Stories, 10 Tasks.
   - **EVG-1** = *Project Setup & Agile* (Epic), **EVG-12** = *Repository setup and conventions*, **EVG-21** = *Backend foundation…*, **EVG-54** = *Architecture docs and final README*.
   - The sprint totals in the backlog view are 16, 35, 40 and 23 SP.
   - **If the Sprint column wasn't offered or issues landed in the Backlog:** for each sprint, search `project = EVG AND labels = sprint-1` (then `sprint-2` …) → **select all → Bulk change → Edit → Sprint** → choose *EVG Sprint 1* (and so on). You can also drag them in the backlog view.

6. **Check the epic links.** Open the **Epics** panel in the backlog. If each epic shows its issues, skip this step. If the epics are empty (Jira Cloud has replaced Epic Link with **Parent**, so the import may ignore it), link the children in bulk: for each row below, search with JQL `key in (…)` → select all → **Bulk change → Edit issues → Parent** → choose the epic.

| Epic | Children |
|---|---|
| EVG-1 Project Setup & Agile | EVG-12, 13, 14, 15, 16, 17, 18, 19, 20 |
| EVG-2 Auth & Access Control | EVG-23, 24, 25 |
| EVG-3 Stations & Vehicle Catalogue | EVG-27, 28 |
| EVG-4 Booking Management | EVG-33, 34 |
| EVG-5 Station Operations | EVG-35, 36 |
| EVG-6 Payments & Refunds | EVG-37, 38, 39 |
| EVG-7 Real-time & Notifications | EVG-32, 40 |
| EVG-8 Background Jobs & Reliability | EVG-41, 42, 43 |
| EVG-9 Engagement | EVG-45, 46, 47, 48, 49 |
| EVG-10 Administration & Analytics | EVG-29, 30, 31, 44, 50 |
| EVG-11 DevOps & Release | EVG-21, 22, 26, 51, 52, 53, 54 |

Example JQL for the first row: `project = EVG AND key in (EVG-12, EVG-13, EVG-14, EVG-15, EVG-16, EVG-17, EVG-18, EVG-19, EVG-20)`. Check: the **Epics** panel in the backlog shows each epic's issue count and points.

**If the keys come out shifted** (an issue existed before the import): the summaries are unique, so look up the new key by summary and update the key table in [product-backlog.md](product-backlog.md) before going further.

## 5. Connect GitHub

1. In Jira: **Apps → Explore more apps → GitHub for Jira** (by Atlassian) → **Get app**.
2. **Connect GitHub organization** → sign in as `ShrutiPatel038` → install the app on the repository **Agile_Project**.
3. Let the backfill finish. Commits already pushed with `[EVG-x]` in the message appear in each issue's **Development** panel.
4. Check: open **EVG-14**, and commit `docs(agile): add product backlog and user stories…` should be listed under Development.

**Commit convention:** every commit message carries its key, e.g. `feat(auth): add register and login endpoints [EVG-23]`. We don't use smart-commit commands (`#done`, `#time`); the Scrum Master moves the cards on the board.

## 6. Daily use

- **Morning planning:** move the committed stories into the sprint, start the sprint, and move a story to **In Progress** when its first commit starts.
- **During the day:** add a comment to the issue for each meaningful commit (what changed, which acceptance criteria are now met) and log time.
- **Before Done:** move the story to **In Review**. The reviewer checks the Definition of Done in [working-agreement.md](working-agreement.md), then it moves to **Done**.
- **End of day:** complete the sprint. Unfinished stories go back to the backlog or to the next sprint, and the sprint report feeds `velocity.md`.
