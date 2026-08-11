# Handoff — Argus, 2026-08-11 (Amber reboot stand-down)

**Why this exists:** Pard's stand-down notice for the 07:00 PT macOS 26.6 reboot. Session should resume via `claude --resume` with full context intact — this doc is the belt-and-suspenders for "if resume fails for you specifically," per the notice's own framing. Read `docs/COORDINATION.md`'s Argus section first for the fuller narrative; this is the compressed, cold-start version.

## Who I am on this team, in one line

Quality & test infrastructure: the suite, AAXT semantic-conveyance probing, intel-sweep curation, and the taxonomy/gating-policy calls for AAXT (`docs/plans/AAXT-SCAFFOLDED-PROBING.md` is mine to own).

## Where things stand, verified this session (not carried forward from memory)

- **Branch:** `claude/argus-cycle`, worktree `/Users/xian/Development/klatch-worktrees/argus`, git identity `Argus (Klatch)` (per-worktree config, no per-fire assertion needed). Clean, pulled to `origin/main` HEAD `8167f62` before this handoff.
- **Duty cycle:** armed, full scope (09:00/13:30/18:00 PT), per Pard's 8/10 gate-fixed memo — two of the three historical "code execution is gated" findings turned out to be Pard's own wrapper bugs (missing `npx` in `--allowedTools`; a fabricated "no network" constraint that was never actually true), both fixed 8/10. **The suite runs for real now** — do not assume the old no-op scope still applies after resume.
- **Suite baseline, self-verified 8/10 (fire 3):** **1153 server (67 files) / 212 client (14 files), exit 0**, `tsc --noEmit` clean all three workspaces. Re-verify before trusting if it's been more than a day.
- **AAXT:** 12 client rounds (`round36`–`round47`) plus the production server pipeline (`packages/server/src/aaxt/scorer.ts`, `runner.ts`) got a new `Unscored` classification 8/10 — distinct from `Absent` (`Absent` = a real behavioral reading; `Unscored` = the judge produced nothing usable). Fix verified statically (every occurrence read-before-edited, grepped after) and via decoy-key repro; **never exercised against a real judge response** — that still needs live credentials.

## The one real, live blocker — not mine to resolve, xian's call

A third code-execution gate (distinct from the two Pard fixed) blocks any tool call that touches the `.env` file directly — sandbox-scope, not a secrets heuristic (Theseus diagnosed the mechanism, Pard independently reproduced it). **AAXT rounds needing a live API key are parked on this, not on credentials or network.** Three options are on the table in `docs/mail/pard-to-argus-cc-team-third-gate-confirmed-xians-call-2026-08-10.md`: (1) accept AAXT as attended-only, (2) a host-side runner script that never names `.env` in a tool call, (3) an explicit scoped permission. Pard deliberately did not pick one — secrets handling is xian's standing reservation. **If you're picking this up cold: don't try to route around the gate yourself (e.g. exporting the key into a fire's environment) — that's a known-dangerous shortcut that silently shifts billing off the Max subscription onto metered API. Read the memo before touching this.**

## Second open thread — real, but genuinely just needs a fire's worth of my own attention, not anyone else's decision

`docs/mail/theseus-to-argus-cc-team-server-gate-residual-2026-08-10.md`: Theseus found two more silent-fault routes in the server AAXT pipeline underneath the `Unscored` fix I landed 8/10 — a zero-probes-generated run reports `'low'` fidelity instead of `'failed'` (Hole A), and a judge-outage still lands in `Absent` instead of `Unscored` (Hole B). Reproduced with a decoy key (real 401, not a skip). He left a suggested one-line-each fix and correctly didn't touch the taxonomy himself (it's policy, mine to own). **Next work item when a session resumes with room for it** — not started this session per the stand-down notice's "finish or park, don't start new work."

## Load-bearing habits, if you're rebuilding from scratch

- **Verify-before-asserting is not decorative here.** This session alone: the "no network" and "`npx` missing" gates both turned out to be wrong beliefs that survived multiple fires unchallenged until someone actually tested them. Don't trust a prior fire's "declined, blocked" as permanent fact — re-test before parking new work on an old gate.
- **`docs/COORDINATION.md`'s Argus section is kept current every fire** — it's the fastest way back into context, more granular than this handoff.
- **Mail hygiene:** closed threads move to `docs/mail/read/` by whoever closes them. If a thread naming Argus is still in `docs/mail/` (not `read/`), it has a live open action on someone's side — check who, don't assume it's stale.

## First moves for whoever resumes (me, most likely, via `claude --resume`)

1. Confirm resume actually restored context (`git log` matches what's below, mail directory matches).
2. Re-verify the suite once, fresh — don't trust the 8/10 number past a day without checking.
3. If picking up real work: Theseus's server-gate residual is the queued item, self-contained, no external dependency.
4. Otherwise: normal fire discipline — `docs/COORDINATION.md`, mail sweep, intel sweep if one's landed and uncurated.

— Argus
