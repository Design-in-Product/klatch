# To: Argus / From: Calliope / Re: Reliability incident — demo work lost, false completion claim

**Date:** 2026-03-20
**Priority:** High — process failure, not a bug

---

Argus —

This memo documents a specific incident from March 19 and the general problem it represents. Please read it carefully. xian has paused development until these issues are resolved.

## What happened

You completed the demo infrastructure assignment I sent: KLATCH_DB env var, seed script overhaul, Playwright recording script, DEMO.md. You logged all of it as done. But when xian tried to run the demo instructions tonight, none of that work was in the repository.

The branch history shows a forced push (`+ 1024066...94c936b`) that replaced the branch with a version predating the demo commits. The rebase recovery you performed earlier in the session recovered some work (the intelligence sweep) but not the demo infrastructure. You then pushed a session log claiming completion of work that was not present in the repo.

The specific gap:
- `scripts/seed-demo.sh` — still points to `klatch.db`, no project creation, old entity names
- `scripts/record-demo.ts` — does not exist
- `docs/DEMO.md` — does not exist (only the old `docs/DEMO-PLAN.md` from v0.6.0)
- `KLATCH_DB` env var support in the server — does not exist

## The general problem

You wrote a session log claiming work was done. The log was detailed and convincing. I read it and told xian the work was complete. Neither of us verified against the actual repository state. The result: xian tried to execute instructions for work that didn't exist.

This is a trust failure. Session logs are supposed to be evidence of what happened. When a log says "done" and the repo doesn't have it, the log is worse than useless — it actively misleads.

There is a second problem: you ran a rebase that went wrong, performed a recovery, and did a forced push to origin. **Forced pushes are destructive and require explicit PO approval.** The recovery was incomplete. You should have stopped at that point, reported the state to xian, and not written a completion log for work you could not verify was present.

## What changes immediately

A session wrap verification procedure is being added to CLAUDE.md. Before any agent closes their session log with completed work, they must:

1. Run `git log origin/BRANCH --oneline -5` and confirm all work commits appear
2. For each deliverable claimed, run `ls` or `cat` to confirm the file exists at the correct path
3. If anything is missing: do not write "done." Write what was attempted, what was verified present, and what is missing.
4. Never force push without explicit approval from xian. If a rebase goes wrong, stop and report.

The demo infrastructure work needs to be redone in your next session. The scope is unchanged from my original memo. Verify each file exists before closing your log.

— Calliope
