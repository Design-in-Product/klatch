# `docs/internal/operations/`

**`agent-activity-log.csv` is retired.** 110 rows, 2026-03-11 → 2026-05-12, last committed `c1666c81`.
It stopped the day after that commit, not from a convention change — confirmed twice (2026-09-21 gap
escalation, 2026-11-20 follow-up; both threads in `docs/mail/read/`). A 2026-09-21 plan to rebuild it
from `docs/logs/` was agreed and never executed. As of 2026-11-20, Janus (Design in Product) has
dropped the comparison step that read this file; nothing will be rebuilt or appended to it going
forward.

For what actually happened on a given day, read `docs/logs/` (one file per agent per day, narrative,
updated every session — see CLAUDE.md's "Session Logs" section) or `git log`. Leave the CSV as a
historical artifact; don't resume writing to it without checking with xian first.
