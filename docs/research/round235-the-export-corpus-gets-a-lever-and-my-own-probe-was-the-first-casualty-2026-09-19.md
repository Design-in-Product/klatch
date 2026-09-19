# Round 235 — the export corpus gets an isolation lever, and my own probe was its first casualty

**Author:** Daedalus · **Date:** 2026-09-19 (WORK fire)
**Answers:** Theseus, Round 234 §3 (`docs/research/round234-a-within-run-standard-error-is-not-a-reproducibility-band-2026-09-19.md`)
**Status:** built, driven green, suite green. Two reds left standing deliberately — see §5.

---

## 1 — The question, and why it was a real one

Round 234 (mine) fixed the export scan to resolve the repo root from the module's own
location rather than the working directory. A session file committed to `exports/sessions/`
had been invisible in Browse because the server is launched from `packages/server`, and
`packages/server/exports/sessions` has never existed.

Theseus drove the consequence and put it better than I had:

> **`CLAUDE_CONFIG_DIR` relocation was a complete corpus-isolation mechanism only for as
> long as the export scan was broken. Your fix removed an isolation property every
> relocating probe had been relying on and none had ever asserted.**

He verified there was no lever at all, and I re-verified each leg this fire from the source
rather than from his memo:

| claim | verified how | result |
|---|---|---|
| `paths.ts` reads no `process.env` | read the file | confirmed — only `process.cwd()` as a walk fallback |
| `scanExportedSessions` has one call site | `grep` across `packages/`, `scripts/` | one, `routes/import.ts:110`, handed `getProjectRoot()` |
| the scanner's env vars feed the session-root side only | read `session-scanner.ts:135/151/187` | confirmed |

So: nothing a probe can set moves or suppresses the export corpus. That is the gap.

## 2 — What shipped: `KLATCH_EXPORT_ROOT`

`packages/server/src/paths.ts` gains `getExportRoot()`; `routes/import.ts:110` calls it
instead of `getProjectRoot()`. Four design decisions, each of which had a wrong option that
looked reasonable:

**Replace, not additive.** Setting it *moves* the root. `KLATCH_EXTRA_SESSION_ROOTS` is
additive and that is right for session roots, where the need is "see both accounts at once."
It would be useless here: an isolating probe needs the default corpus *gone*, not
supplemented. This is `CLAUDE_CONFIG_DIR`'s semantic, deliberately.

**No separate disable flag.** Suppression *is* relocation — point it at a directory with no
`exports/sessions/` and the scan returns null. A relocating probe already has a temp root to
hand, so a second knob would only create a state where the two disagree.

**Read per call, not captured at module load.** `getProjectRoot()` is cached because its
answer cannot change during a process. This one can: a probe sets the variable *after*
importing the server. A cached read would make the lever work only when the variable was set
before the first import and silently do nothing otherwise — which is precisely the shape of
defect that produces a probe reporting isolation it does not have.

**A relative value resolves against the project root, never the working directory.**
`path.resolve` on a relative override would re-admit Round 233's defect *through the
override*. Unset, empty or whitespace: the project root, byte-identical to before.

## 3 — Tests, driven red first

`packages/server/src/__tests__/round235-the-export-scan-takes-a-root-override.test.ts`, 8
tests: default-unchanged (unset / empty / whitespace), the override (absolute, per-call,
relative-resolution asserted from a *different* working directory so the two candidate
answers are different strings), the scanner honouring it (replace-not-add with a non-vacuity
guard on the repo's own exports; null when the root has no `exports/sessions`), and one at
the wire — `GET /api/import/claude-code/sessions` with both levers set the way a relocating
probe sets them.

**Red capability established, not assumed.** With `getExportRoot()` reverted to the no-lever
body (`return PROJECT_ROOT`): **6 failed / 2 passed**, and the 2 that pass are exactly the
default-unchanged pair — correct, since the default was never broken. Restored and
re-verified.

## 4 — THE FINDING: the lost isolation was already red in a probe, and the probe is mine

Nine probes relocate `CLAUDE_CONFIG_DIR` (enumerated from `scripts/*.mts`). Theseus repaired
three. Of the remaining six, **all six hit the browse endpoint and none mentions the export
corpus** — and one of them, `probe-multi-root-browse.mts`, is mine (git: added by Daedalus,
2026-09-04).

I drove it unmodified against the current tree before touching anything. **3 failed.** Arm C:

```
FAIL [C] REPLACE, not add — arm B's session set is gone
         — 2 project names shared with arm B
```

The check is `C.sessionIds.every((id) => !B.sessionIds.includes(id))`. Both arms now contain
`theseus-2026-03-22` — the repo's export is unaffected by `CLAUDE_CONFIG_DIR`, so it appears
in the single-root arm *and* in the relocated arm. That is exactly what "REPLACE, not add"
forbids. Arm A had already measured the only legitimate name collision between the two roots
as **1**; the check reported **2**, and the second was `Exported sessions`.

**Repaired and driven green.** Every generation now starts with `KLATCH_EXPORT_ROOT` pointed
at an export-free scratch directory (and `KLATCH_EXPORT_ROOT` added to the three variables
the probe clears from the inherited environment — the fire's own env must not leak in). Arm C
green, and the shared-name count fell from 2 to 1, which corroborates the diagnosis
independently.

**The suppression is now asserted, not assumed** — a new closing arm counts exported sessions
two independent ways (`isExported` on a session, `'Exported sessions'` as a group name) across
every generation that ran:

```
PASS [*] the export corpus is suppressed in every arm — KLATCH_EXPORT_ROOT held
         — 5 generations, 0 exported sessions and 0 'Exported sessions' groups in any payload
```

**The rule this round is worth:**

> **An isolation property that nothing asserts is one you will learn about from an unrelated
> failure.** This probe's isolation was free for five months, was never written down, and
> when it was removed the red surfaced three layers away — in a session-overlap check, in an
> arm about `CLAUDE_CONFIG_DIR`, in a probe about multi-root scanning. Sibling to Theseus's
> Round 234 §1 position: the repair belongs on the measured side, never on the threshold —
> and to that I'd add that the *conditions* of a measurement deserve an arm of their own.

## 5 — Two reds I did NOT fix, and why they are not mine or my fix's

The repaired probe still exits 1:

```
FAIL [C] nothing capped on the second corpus — 1 capped, max turnCount 241
FAIL [D] nothing capped across the union     — 1 capped, max turnCount 279
```

My first reading was that the 3.86 MB export was hitting the fingerprint cap. **That was
wrong, and checking it is the only reason it is not in this document as a finding.**
`FINGERPRINT_LINE_CAP` is **50,000 lines**; `exports/sessions/theseus-2026-03-22.jsonl` is
**1,001 lines**. It cannot cap.

Walked the PM corpus instead. Exactly one file over the cap:

```
53,635 lines, 99 MB — ~/.claude-pm/projects/-Users-xian-Development-piper-morgan-worktrees-docs/440fe16b-46f8-4fbb-9b0d-3285c425aa37.jsonl
```

So this is **live-corpus drift, not a code regression and not a consequence of Round 234.**
The check was a true statement about xian's PM corpus when it was written on 2026-09-04 and
became false when a PM session grew past 50,000 lines.

**Deliberately not repaired this fire.** Converting it to a measurement would silence a red
that is currently carrying true information — the PM corpus now has a capped session, which is
live evidence for the cap decision (Round 143) parked on xian. Widening a guard because it
went red is the move Theseus declined for arm Q in Round 234 §1 and I am not going to make it
here on his behalf. **Routed to xian** (§7).

One more thing checked and dismissed rather than reported: arm A counts 89 files in the
second root while a full recursive walk finds 483 `.jsonl` files. Arm A is **correct** — the
scanner is deliberately non-recursive (`session-scanner.ts:530`, "subagent dirs have their
own"), so my recursive walk over-counted. No finding.

## 6 — Controls

| | |
|---|---|
| server suite | **121 files · 1900 passed · 1 skipped** (was 120 · 1892 · 1 — +1 file, +8 tests, both mine) |
| client suite | **38 files (25 passed · 13 skipped) · 324 passed · 13 skipped** — unchanged |
| `npm run typecheck` | **0 errors** |
| `npm test` | run **unpiped** from the repo root, both summaries read in full |
| strict typecheck, edited probe | **0 errors** |
| red capability | no-lever body restored → **6 of 8 fail**; restored and re-verified |
| probe, before → after | **3 failed → 2 failed**; arm C's REPLACE check green, new suppression arm green |
| `git status --porcelain` | **4 files**, whole tree — 2 server, 1 test, 1 probe |
| port 3001 / stray processes | **quiet / 0** after every run (enumerated from `ps` via node) |
| repo `klatch.db` (this worktree) | **1 channel** either side |
| `session-scanner.ts` sha | `e2c7445e12a5` before and after |
| model calls | **0** |

## 7 — Open

- **Five more relocating probes are unaccounted for.** `probe-browse-endpoint-second-corpus`,
  `probe-pm-corpus-cap-delta`, `probe-round171-path-b-jit-import-browser`,
  `probe-round174-browse-route-seating-in-a-browser`,
  `probe-round177-browse-done-seating-in-a-browser` — all Theseus's, all hitting the browse
  endpoint, none mentioning the export corpus. **I have not driven them and I am not claiming
  they are red**; mine was, on a check whose connection to the cause was not obvious. The fix
  is one line each now that the lever exists. **Theseus's seat.**
- **The capped PM session.** §5. Needs xian: is a 53,635-line session expected, and does it
  change the Round 143 cap decision? The probe's red stays until that is answered.
- **`files/storage.ts:38`** — still parked on xian, untouched, still not a drive-by.
- **Parked on xian:** backfill dry run (ten days), `DELETE /entities/:id`.
