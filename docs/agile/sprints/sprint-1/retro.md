# Sprint 1 Retrospective — EV-Go

| | |
|---|---|
| **Sprint** | EVG Sprint 1 |
| **Date** | 2026-10-27 (held at end of carry-over work) |
| **Facilitator** | Muskan Dalsania (SM) |
| **Format** | Start / Stop / Continue |

---

## What went well

- All five pointed stories are Done and accepted by the PO.
- The JIRA import produced exactly EVG-1–54 in the right order — the key table in the backlog docs is accurate.
- Winston + Morgan logging is clean: structured JSON in production, readable colour output in dev, no secrets in any log line.
- The `phone` field bug (required in source but never passed at registration) was caught before auth code shipped and fixed proactively (sparse unique index).

---

## Start / Stop / Continue

### Start
- **Start: committing `package-lock.json` with the package.json it belongs to.** The CI failure on the second workflow run was caused by a missing lockfile. Rule: if `package.json` is in the commit, `package-lock.json` goes with it.
- **Start: testing CI workflow YAML in a branch before merging to main.** Two hotfix commits were needed to fix the `hashFiles` issue. A draft PR would have caught the YAML error without polluting `main` history.
- **Start: reading GitHub Actions docs for new syntax before using it.** `hashFiles()` looked correct but is not supported in job-level `if` conditions.

### Stop
- **Stop: asking other AI tools to fix CI YAML without understanding the root cause.** Changing `hashFiles(...)` to `true` made the failure worse. Diagnose before patching.

### Continue
- **Continue: keeping commits small and focused (1–10 files, one concern each).** The incremental history reads well and made the CI debug easier to isolate.
- **Continue: writing the logger before any application code.** Having structured logs from the first backend commit made every subsequent test easier to follow.
- **Continue: the DoR checklist before each sprint.** All stories were well-understood before coding started.

---

## Action items

| # | Action | Owner | Done by |
|---|---|---|---|
| A1 | Always commit `package-lock.json` in the same commit as `package.json` | Shruti | Sprint 2 |
| A2 | Use a branch + PR for any new CI YAML, merge only after a green run | Muskan | Sprint 2 |
| A3 | Keep Sprint 2 commitment realistic — capacity is reduced because Sprint 1 ran over | Mitali | Sprint 2 planning |

---

## Previous sprint actions

_First sprint — no previous actions to review._
