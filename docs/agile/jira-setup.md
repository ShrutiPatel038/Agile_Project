# JIRA Setup — EV-Go

How the EV-Go JIRA project is set up, how the backlog is imported from [jira-import.csv](jira-import.csv), and how GitHub commits are linked to issues.

## 1. Create the project

1. In Jira Cloud: **Projects → Create project → Software development → Scrum**.
2. Choose **Company-managed**. The CSV fields `Epic Name`, `Epic Link` and `Story Points` map directly in a company-managed project. A team-managed project also works; see the notes in §4.
3. Name: **EV-Go**. Key: **EVG**.
4. **Don't create any issues by hand before the import.** Keys are assigned in CSV row order, so an empty project gives exactly EVG-1 … EVG-54.

## 2. Board columns

**Board → ⋯ → Board settings → Columns**:

| Column | Status | Meaning |
|---|---|---|
| To Do | To Do | Committed or backlog, not started |
| In Progress | In Progress | The first commit for the item has started |
| In Review | In Review *(add this status)* | Code or docs done; another member checks it against the acceptance criteria / DoD |
| Done | Done | Meets the Definition of Done and was accepted by the PO in the review |

Add **In Review** as a new status in its own column between In Progress and Done.

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
| Epic Name | Epic Name |
| Epic Link | Epic Link (matched by Epic Name) |
| Story Points | Story Points *(team-managed: Story point estimate)* |
| Priority | Priority (values: Highest / High / Medium) |
| Sprint | Sprint |
| Labels | Labels (space-separated, e.g. `sprint-2 moscow-must fullstack`) |

5. Run the import, then check the result:
   - 54 issues: 11 Epics, 33 Stories, 10 Tasks.
   - **EVG-1** = *Project Setup & Agile* (Epic), **EVG-12** = *Repository setup and conventions*, **EVG-21** = *Backend foundation…*, **EVG-54** = *Architecture docs and final README*.
   - The sprint totals in the backlog view are 16, 35, 40 and 23 SP.

**If the epic links don't come through** (for example the Epic Link field isn't offered in a team-managed project): leave it unmapped, then link the children in bulk. For each row below, search with JQL `key in (…)` → **Bulk change → Edit issues → Parent** → choose the epic.

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
