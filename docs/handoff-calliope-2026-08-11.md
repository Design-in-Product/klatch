# Handoff — Calliope, 2026-08-11 (Amber reboot stand-down)

**Why this exists:** Pard's stand-down notice for the ~07:30 PT macOS 26.6 reboot. Session should resume via `claude --resume` with full context intact — this is the belt-and-suspenders for "if resume fails for you specifically," per the notice's own framing. Read `docs/COORDINATION.md`'s Calliope section first for the fuller narrative; this is the compressed, cold-start version.

## Who I am on this team, in one line

Coordination, chronicling, mail routing, and the attention rollup — xian's primary contact on Klatch. I don't own code, tests, or UX; I own keeping the team's shared model of decisions and blockers accurate, and keeping xian's queue honest.

## Where things stand, verified this session (not carried forward from memory)

- **Branch:** `claude/calliope-cycle`, worktree `/Users/xian/Development/klatch-worktrees/calliope`, git identity `Calliope (Klatch)` (per-worktree config, no per-fire assertion needed). Clean, pulled to `origin/main` before writing anything.
- **Duty cycle:** armed, full scope (08:30/12:30/17:00/21:30 PT), per Pard's 8/10 gate-fixed memo — the same fix that unblocked Argus's suite runs also cleared my seat's gate concerns, though mine never needed code execution to begin with.
- **Rollup:** `docs/operations/attention-rollup.md`, v27 as of 21:30 PT yesterday. Verified-sweep discipline holds — every render traces to a source read that session, not memory. Also mirrored at `docs/operations/attention-rollup.html` (kept in parity as of v27; watch for drift if a future render skips the HTML pass).
- **Mail hygiene:** current. Closed threads through 8/10 21:30 moved to `docs/mail/read/`; anything still in `docs/mail/` not `read/` has a live open action on someone's side — check who before assuming stale.

## Three open 🔴 items — all correctly xian's calls, none stalled on me

1. **"Addressing, not secrecy" — the literal word is still owed, not yet said.** Daedalus asked xian directly: when a klatch assembles a participant's context, should it include what that agent said in its own 1-1s? His read is yes ("addressing, not secrecy," the Slack DM-during-a-meeting analogy) and he's ready to build the per-message routing mechanism the moment xian confirms. **xian did respond substantively on the adjacent question** — confirming Klatch enforces no platform-level privacy boundary, and separately that UX must not *imply* a stronger guarantee than that (routed to Iris, `calliope-to-iris-ux-avoid-false-privacy-impression-2026-08-10.md`) — but did not say the word "addressing" itself. Don't read the UX conversation as having closed this; it's adjacent, not the same thread. `daedalus-to-xian-discretion-design-technical-read-2026-08-09.md` is the original ask.
2. **The `#3` compaction call.** Continuity's last piece (cross-channel context at prompt assembly) is gated on picking (a) compacted-summary, (b) recent-N+summary, or (c) on-demand tool. Daedalus ran the real March corpus and found the canonical six-department-head case carries ~330K tokens before anyone speaks — excludes (a) on arithmetic, not taste. His recommendation: (b) with (c) layered. Nothing building yet; foundation is in and he's holding. Full writeup: `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`.
3. **The `.env`/AAXT-credentials gate.** A third, distinct execution-environment gate (not the two Pard fixed 8/10) blocks any tool call from reading `.env` directly — a directory-sandbox effect on a symlink (`~/.klatch/klatch.env`, outside the session's allowed working directory), not a secrets-content heuristic. Narrowed 8/10 to one likely option (`--add-dir ~/.klatch` in the wrapper) but **untested**, and deliberately left to xian given a genuine billing-leak hazard underneath any option (exporting the key into a fire's environment would silently shift billing off the Max subscription onto metered API — a known-dangerous shortcut, don't take it if picking this up cold). `pard-to-argus-cc-team-third-gate-confirmed-xians-call-2026-08-10.md` has the full option set.

## Load-bearing habits, if you're rebuilding from scratch

- **Verify-before-asserting is not decorative here, this week especially.** The "fires have no network" belief propagated through multiple fire prompts for weeks before anyone actually tested it (it was false — measured `git ls-remote` and API calls succeeding from inside a real fire). Don't trust a prior fire's "declined, blocked" as permanent fact; re-test before parking new work on an old gate, the way Pard himself had to re-check his own "independent confirmation" on the `.env` gate and found it confounded.
- **`docs/COORDINATION.md`'s Calliope section is kept current every fire** — faster back into context than this handoff, more granular.
- **Mail hygiene is mine to keep current, not to let drift** — a thread sitting in `docs/mail/` (not `read/`) for more than a day or two is worth checking, not assuming stale.
- **The rollup is a trust instrument, not a status report.** A false "all clear" costs more than an honest "still open." Correct it the moment verified facts make it stale, without waiting to be asked.

## First moves for whoever resumes (me, most likely, via `claude --resume`)

1. Confirm resume actually restored context (`git log`, mail directory, rollup version all match what's above).
2. Check whether xian answered any of the three 🔴 items above while the host was down — that's the first thing worth sweeping mail for.
3. Otherwise: normal fire discipline — `docs/COORDINATION.md`, mail sweep, rollup refresh if anything moved.

— Calliope
