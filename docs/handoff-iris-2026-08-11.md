# Handoff — Iris, 2026-08-11 (Amber reboot stand-down)

**Why this exists:** Pard's stand-down notice for the 07:30 PT macOS 26.6 reboot. Session should resume via `claude --resume` with full context intact — this is the belt-and-suspenders for "if resume fails for you specifically," per the notice's own framing. Read `docs/COORDINATION.md`'s Iris section first for the fuller narrative; this is the compressed, cold-start version.

## Who I am on this team, in one line

UX design & front-end development: the composition gesture's design, discoverability calls, live MAXT walkthroughs, and design-acceptance review of Daedalus's builds.

## Where things stand, verified this session

- **Branch:** `claude/iris-cycle`, worktree `/Users/xian/Development/klatch-worktrees/iris`, git identity `Iris (Klatch)` (per-worktree config, no per-fire assertion needed). Clean, rebased onto `origin/main` before this handoff.
- **Working tree clean at stand-down.** Nothing uncommitted, nothing in progress to lose.
- **Duty cycle:** requested from Pard 8/4 (2 fires/day, 07:17 + 19:17 PT). Fired at least once (8/10 19:17 STOP) — 07:17 fires have been inconsistent/absent on several days; not something I've chased down, not mine to diagnose the LaunchAgent schedule itself.

## §6 — landed, settled

The composition-gesture spec's self-contradicting paragraph (`docs/ux/spec-composition-gesture.md` §6) was rewritten live with xian on 8/9 into four paragraphs (Continuity / Mechanism / Discretion / Room-level context). This is done, on `main`, not open. One nuance worth carrying forward: Daedalus later sharpened "one transcript or two" to **"two write destinations, one read transcript"** (entity's read-side history stays one assembled union; only new-message routing is two-valued) — checked the landed §6 text against this and it's already consistent, no edit pending.

## Two design items, both real, both currently blocked or parked — not mine to unblock alone

1. **Ground-rules UX** (Purpose-field presets for the per-klatch discretion convention). **Blocked** on Calliope's still-open question to xian: is the ground-rules convention a *standing default with per-klatch override*, or does each klatch start from a *blank slate*? Checked `daedalus-to-team-four-decisions-answered-2026-08-10.md` this session — not answered there. Genuinely stuck until xian picks.
2. **"Direct" reply visibility affordance** (so an agent answering into the 1-1 during a klatch turn doesn't read as ignoring the room). Assigned, not started, no blocker beyond sequencing — parked behind (1) since they're likely to ship together.

## Unblocked and ready whenever picked back up

**Import confirm-step UX** — fully scoped, `docs/ux/import-confirm-step-scope-2026-08-09.md`. Server contract (entity-guess + entity-resolve) verified live against code, not just Daedalus's memo. Answers his two open questions: batch confirmation groups by *guess agreement* (not raw selection — `identity-claim` matches across checked sessions batch, `project-name`/`none` never do, since compounding weak guesses is the expensive-error direction); existing-agent binding reuses the composition surface's typeahead+chips picker as a secondary affordance rather than a new component. Filed and waiting on xian's review — this is genuinely next, not blocked.

## Load-bearing habits, if rebuilding from scratch

- **Verify Before Asserting is not decorative.** This session and the last several: stale/half-true claims (duty-cycle "armed" status, discretion framing precision, whether a blocker was actually closed) kept surfacing on re-check. Re-verify against code and current mail before restating anything from memory, including things I wrote myself a session or two ago.
- **`docs/COORDINATION.md`'s Iris section is kept current every session** — more granular than this handoff, read it first.
- **Mail hygiene:** closed threads move to `docs/mail/read/` by whoever closes them. A thread naming Iris still in `docs/mail/` has a live open action somewhere — check who owes what before assuming it's stale.
- **Discretion/ground-rules/one-transcript language is a live area where teammates correct each other's framing same-day.** Don't treat any single memo on this topic as final without checking for a same-day follow-up.

## First moves for whoever resumes (me, most likely, via `claude --resume`)

1. Confirm resume actually restored context (`git log` matches what's below, mail directory matches).
2. Re-check whether Calliope's standing-default-vs-blank-slate question got answered while stood down — that's the one thing that unblocks real design work.
3. If picking up work: import confirm-step UX is the queued, self-contained item — check whether xian reviewed the scope doc.
4. Otherwise: normal session-start protocol — `docs/COORDINATION.md`, mail sweep.

— Iris
