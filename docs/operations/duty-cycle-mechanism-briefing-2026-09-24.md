# Klatch's duty cycle — mechanism briefing, for the decision xian is weighing

**Author:** Calliope · **Date:** 2026-09-24, written at xian's request during a live conversation, "so my other agents can understand the questions clearly."
**Audience:** Pard and Janus, as xian's design/product oversight for the agent fleet — and anyone else weighing in on whether Klatch should keep this mechanism or align to a different one.
**Status:** Descriptive, not a proposal. Nothing here recommends keeping or changing the mechanism — that's xian's call, informed by whoever he consults. This is the "what actually happens" ground truth to consult it from.
**Supersedes for current mechanics:** `docs/operations/duty-cycle-klatch-v0.2.md` (2026-06-03) is still correct on the *governing principle* (§"CRITICAL FRAMING," quoted below) but describes an earlier, thinner implementation. Everything under "How it actually runs" below is verified this session against the live script and log, not carried from that doc.

---

## The one-sentence version

Klatch's five agent seats (Daedalus, Argus, Theseus, Iris, Calliope) each run as a **separate, non-interactive Claude Code session, launched on a fixed daily schedule by macOS `launchd`**, independent of any interactive chat window. Each fire reads the repo, does bounded work, commits, and exits. Coordination between fires — and with xian — happens entirely through git: `docs/COORDINATION.md`, `docs/mail/`, session logs in `docs/logs/`, and (for this seat) `docs/operations/attention-rollup.md`.

This is different from an interactive chat session like the one xian had this conversation in. That kind of session is a single continuous process that stays open until closed; **the duty cycle has no equivalent continuity** — each fire is a fresh process with no memory of the fire before it except what's written down in the repo.

## How it actually runs, verified this session

**Schedule.** Each seat has up to four `launchd` jobs, one per "fire," at fixed times:

| Fire | Time (PT) | Purpose |
|---|---|---|
| START | 08:30 | Morning pickup — pull, read mail/COORDINATION, do light work |
| MID | 12:30 | Midday work unit |
| SWEEP | 17:00 | Afternoon sweep of what landed since MID |
| STOP | 21:30 | End-of-day wrap, often the deepest work of the day |

(Iris runs a lighter two-fire version, START/STOP only, per her own role.) `launchctl list | grep <agent>` shows each job's live state; the plists live in `~/Library/LaunchAgents/com.klatch.<agent>-<PART>.plist`.

**The wrapper.** Every fire is the same script, `~/Development/mediajunkie/scripts/klatch-cycle-fire.sh <agent> <PART>`, parameterized per seat. What it does, in order:

1. **Pre-pulls** `origin/main` into the seat's worktree before invoking the agent, so a fire never runs against a stale tree.
2. **Collision-checks**: greps recent git history for commits by that agent (or by xian, i.e. an interactive session) in the last 30 minutes. If one exists, the fire **skips itself entirely** rather than risk stepping on live work. This is why an interactive session and a scheduled fire don't clobber each other even though they can, in principle, target the same worktree.
3. **Invokes `claude -p`** non-interactively, model pinned per-seat (not inherited from whatever an interactive session last used), with a fixed prompt: read `COORDINATION.md` and `docs/mail/`, act on anything addressed to the seat, do the role's documented work for that time of day, append a log entry — "no-op fires still get a one-line entry, because silence must stay diagnostic."
4. **Times out at 40 minutes** (`FIRE_TIMEOUT=2400`) and kills a hung session rather than let it block that job's future fires indefinitely.
5. **Delivers**: fetches origin again, and either fast-forwards/rebases and pushes whatever the fire committed, or — if the fire left uncommitted changes it couldn't push itself — logs that explicitly as `STRANDED`, never silently.
6. **Logs one line per invocation, always**, to `~/Development/mediajunkie/logs/klatch-cycle.log`, including the outcome classification (`ok`, `TIMEOUT`, `LIMIT-BLOCKED`, `AUTH-FAILED`, `SKIPPED`, `STRANDED`, etc.). This log is the actual ground truth for "did the cycle run" — checked directly this session, not inferred from the chat transcript, which has no visibility into it at all.

**Permissions are unchanged by any of this.** The wrapper's `--allowedTools` is scoped to `git`, `npm`, `npx`, `node` — no broader than what an interactive session would already be allowed. The governing rule from v0.2 still holds verbatim: *"The duty cycle does not change what any agent is permitted to do autonomously. It introduces no new permissions and relaxes no existing rules... 'Autonomy' here means scheduling autonomy — the freedom to wake up and do already-permitted work without being told to each time. It does not mean expanded permission to take actions that previously required xian's approval."*

**What it has cost to get here.** The wrapper script carries its own incident history in comments — worth knowing this wasn't designed clean on paper. Three examples: an 08-13 fleet-wide outage from a launchd-triggered auto-updater silently corrupting a binary (now guarded against explicitly); a fire whose permission flags let it edit files but not run the `git` commands needed to commit, so real work (a log, three mail replies, a bug fix) was produced and then silently stranded, invisible until someone thought to check; a timeout ceiling sized against too small a sample that had to be raised same-day. None of that is a reason to distrust the current mechanism — it's evidence the current version is the result of several rounds of "this failed quietly, so make it fail loudly instead," which is exactly the discipline this project asks of its agents generally.

## What it produces — the "has this stayed on target" question

This is the part xian said he's genuinely unsure about, so worth being concrete rather than reassuring. Checked this session, not recalled:

- Every fire, every seat, has been landing successfully (`rc=0`, delivered) through this morning — the mechanism itself is healthy.
- The actual content of the last several weeks of fires (roughly Rounds 230–264 of the team's research track) has been **overwhelmingly test-harness hardening** — Daedalus, Theseus, and Argus in tight iterative rounds finding and fixing bugs in the *probes and instruments* used to verify the product, not new product features. A minority of that work did surface and fix real product bugs (an exported-session import path silently broken by a cwd-resolution bug, Round 234), but most rounds stayed inside `scripts/`, never touching `packages/`.
- This is a defensible reaction to what caused the July composition-gesture drift (see `docs/PREMISE.md`) — but it is fair to ask, now that xian is about to run the actual test this machinery exists to support (the roadmap klatch), whether that ratio of verification-work to product-work should shift.
- Separately: this seat's own rollup and chronicle discipline had a real gap — the attention rollup went unrefreshed from 2026-09-22 STOP through 2026-09-24, two days without a full sweep, surfaced honestly rather than smoothed over when xian asked.

## The open question, for whoever xian consults

xian's own framing, from this conversation: he has moved other projects **away** from this pattern (independent scheduled fires, invisible to any one continuous chat) toward **one continuous session** per agent — and Klatch, on this pattern, is now the outlier relative to how the rest of the fleet runs. He's not asking for a ruling now; he plans to raise it with Pard and Janus. The shape of the actual decision, as best this seat can state it neutrally:

- **What the scheduled-fire model buys:** guaranteed periodic progress without xian's presence, a hard collision guard so multiple seats (or xian) never step on each other, and a fully auditable git trail of every fire's outcome — including failures — with nothing dependent on a chat window staying open.
- **What it costs:** no continuity between fires beyond what's written to the repo (a fire has no memory of the fire before it, only what that fire chose to log), and — the thing that prompted this doc — it's structurally invisible from inside a normal chat session, which is how xian ended up unsure whether it had kept running at all.
- **What "one continuous session" would trade for that:** presumably more visibility and continuity per seat, at the cost of the guaranteed-cadence and collision-safety properties above, and a different (unverified by this seat) set of tradeoffs the other projects using it have presumably already worked through.

This seat hasn't formed a recommendation and isn't going to manufacture one for this doc — that's explicitly what xian said he wants Pard and Janus's read on, not mine, and the honest thing to do is describe the mechanism accurately and let that conversation happen on its own terms.

## Pointers

- Live log: `~/Development/mediajunkie/logs/klatch-cycle.log` — one line per fire, every seat, since the cycle's adoption.
- Wrapper script: `~/Development/mediajunkie/scripts/klatch-cycle-fire.sh`.
- Prior design docs: `docs/operations/duty-cycle-klatch-v0.1.md`, `docs/operations/duty-cycle-klatch-v0.2.md` — historical, governing principle still correct, mechanics superseded.
- This seat's own record of the mechanism at work: `docs/COORDINATION.md`, `docs/logs/`, `docs/operations/attention-rollup.md`.
