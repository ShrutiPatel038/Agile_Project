# JIRA Setup — EV-Go

How the EV-Go JIRA project is set up, how the backlog is imported from [jira-import.csv](jira-import.csv), and how GitHub commits are linked to issues.

## 1. Create the project

1. In Jira Cloud: **Projects → Create project → Software development → Scrum**.
2. Choose **Team-managed** (the project type EV-Go uses). In a team-managed project, epics are linked to their children through the **Parent** field, and story points live in **Story point estimate**. §4 shows how the import handles both.
3. Name: **EV-Go**. Key: **EVG**.
4. **Don't create any issues by hand before the import.** Keys are assigned in CSV row order, so an empty project gives exactly EVG-1 … EVG-54.

> A company-managed project works too. In that case, map `Epic Name` → Epic Name, `Epic Link` → Epic Link and `Story Points` → Story Points in §4, and skip step 6 there.

## 2. Board columns

In a team-managed project, each board column is a status. Open **Board → ⋯ → Manage columns** (or click **+** next to the last column):

| Column / status | Meaning |
|---|---|
| To Do | Committed or backlog, not started |
| In Progress | The first commit for the item has started |
| In Review | Code or docs done; another member checks it against the acceptance criteria / DoD |
| Done | Meets the Definition of Done and was accepted by the PO in the review |

Add **In Review** between In Progress and Done. Make sure **Done** is still the column marked as the done status (the ✓ on the column).

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
4. Map the fields (team-managed):

| CSV column | Jira field |
|---|---|
| Issue Type | Issue Type |
| Summary | Summary |
| Description | Description |
| Epic Name | *Don't map.* An epic's name is its Summary in team-managed projects |
| Epic Link | *Don't map.* Set as Parent in step 6 |
| Story Points | **Story point estimate** |
| Priority | Priority (values: Highest / High / Medium) |
| Sprint | Sprint |
| Labels | Labels (space-separated, e.g. `sprint-2 moscow-must fullstack`) |

5. Run the import, then check the result:
   - 54 issues: 11 Epics, 33 Stories, 10 Tasks.
   - **EVG-1** = *Project Setup & Agile* (Epic), **EVG-12** = *Repository setup and conventions*, **EVG-21** = *Backend foundation…*, **EVG-54** = *Architecture docs and final README*.
   - The sprint totals in the backlog view are 16, 35, 40 and 23 SP.
   - **If the Sprint column wasn't offered or issues landed in the Backlog:** for each sprint, search `project = EVG AND labels = sprint-1` (then `sprint-2` …) → **select all → Bulk change → Edit → Sprint** → choose *EVG Sprint 1* (and so on). You can also drag them in the backlog view.

6. **Link stories and tasks to their epics.** For each row below, search with JQL `key in (…)` → select all → **Bulk change → Edit issues → Parent** → choose the epic. In the backlog, you can also select the issues and use **⋯ → Parent**.

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
