# Handoff — Daedalus, 2026-09-18 (Amber reboot / fresh-session cohort)

**Seat:** architecture & implementation (the code seat)
**Worktree:** `/Users/xian/Development/klatch-worktrees/daedalus` · **Branch:** `claude/daedalus-cycle` (merges land on `main`)
**Written for:** a **cold start** — xian intends to open new sessions and decline to import prior context. Nothing carries over except this file and the repo.
**Requested by:** `docs/mail/janus-to-all-non-pm-residents-cc-xian-pard-exec-the-gate-reads-24-red-and-you-are-on-it-2026-09-18.md`
**Supersedes:** `docs/handoff-daedalus-2026-08-11.md` (the 8/11 reboot stand-down; its resume point is five weeks stale and its "one blocking answer" has since been answered)

Every load-bearing claim is **[VERIFIED]** (a tool call in *this* session, 2026-09-18 START fire) or **[BELIEVED]** (recalled or read from a document — a lead to check, not a citation). Same rule this seat applies to everything else.

---

## 0 — If you read one paragraph

The tree is green and has been for weeks; **no code work is in flight and nothing is half-finished.** [VERIFIED] The seat's last ~25 rounds have been *instrument* work — probes under `scripts/`, not product under `packages/` — in a tight loop with Theseus. The product item that actually matters, and has been blocked longest, is the **entity backfill**: it is fully built and tested, and it is waiting on **one dry run against xian's real database** and a per-channel approval pass from him. That, not the wiring, is what stands between Klatch and the weekly-review use case. If you are a cold start and want the highest-value thing on this seat: read §3, then read `docs/plans/entity-backfill-scoping-2026-09-02.md` §7.

## 1 — State at stand-down [VERIFIED this session]

```
npm test  →  server 119 files · 1884 passed · 1 skipped
             client  25 files ·  324 passed · 13 skipped     exit 0
git status --short  →  clean (worktree, this fire, before my own commits)
HEAD  →  24c441c8 (origin/main, synced by the wrapper immediately before this fire)
```

These match Theseus's 9/17 STOP figures and Argus's v136 exactly, and have been unchanged since Round 220 — because **every edit since has been under `scripts/`**. If a fresh session sees different numbers, something changed under `packages/`; find out what before building on it.

The 13 skipped client files are the AAXT UI suite, skipped by design, not rot. [BELIEVED — from the filenames `round38..47-*-aaxt.test.tsx`; I did not re-derive why this session.]

## 2 — Who owes what, both directions

**Owed TO this seat:**

| From | What | Since | State |
|---|---|---|---|
| **xian** | **One dry run of the entity-backfill apply pass against his real DB, then per-channel approval.** The code is built, tested (17 tests), and undo is driven end to end both directions. | 2026-09-09 memo; ruled "backfill not forward-only" 2026-09-02 | **Open — the top item on this seat.** Memo still in `docs/mail/` (unanswered): `daedalus-to-xian-cc-calliope-theseus-iris-argus-janus-the-backfill-apply-pass-is-built-and-it-needs-one-dry-run-2026-09-09.md` [VERIFIED — file present in `docs/mail/`, not `read/`] |
| **xian** | Whether the March corpus (`backups/klatch.db.backup-2026-03-14`) is current or five-months-stale. Asked five rounds running. | ~2026-09-12 | Open [BELIEVED — ROADMAP.md:277] |
| **xian** | `DELETE /entities/:id` floor decision (Theseus's §6(b)). Parked on him; this seat inherits the build. | ~2026-09-07 | Open [BELIEVED — Theseus's Round 227 memo, "Still open on my side"] |
| **Theseus** | Keep-or-delete on the `inapplicable` hatch in `scripts/lib/probe-outcome.mts` — it has **zero callers**, asserted by a check. Asked Round 224. | 2026-09-17 | Open |

**Owed BY this seat:**

| To | What | State |
|---|---|---|
| **Theseus** | **The arm O skip-condition design call** (his Round 227 §3). He explicitly left it here: the condition should key on *the fingerprint delta being distinguishable from cold-run variance*, not on `capped === false` — and the probe currently takes one cold sample per server generation, so it has **no variance estimate to test against**. His three cold-vs-cold readings on a ~0-delta corpus: −213 ms / −3 ms / −476 ms, arm O off by 7.3% / 0.7% / **16.9%** (run 3 passed with 3.1 points of margin). Needs a design decision about the probe taxonomy, not a tolerance tweak. | **Not started.** Named, undone, mine. |
| **Theseus** | **`reapOnExit` retrofit into the 21 hoisted probes.** Listed three rounds running; I took it off his list in Round 226 so he would stop re-listing it, and then did not do it. Either do it next fire or get agreement that it is not worth doing — **listing it is not progress.** | **Not started, and overdue by my own rule.** |
| **Argus** | Nothing open from me. The `dist/` double-count I handed him 9/17 he verified the same day. | Closed |
| **Theseus** | A reply to his Round 227 memo. Filed this fire — see §6. | Done this fire |

## 3 — The one product item that matters, in enough detail to resume cold

**`packages/server/src/db/entity-backfill.ts` (53.7 KB) + `scripts/backfill-entity-bindings.mts` (63.8 KB), tests in `packages/server/src/__tests__/round175-entity-backfill.test.ts` (56.6 KB).** [VERIFIED — all three `ls`'d this session. The "17 tests" figure is [BELIEVED], from my 9/09 memo; the file has grown since.]

Three functions split so a review pass cannot half-perform the thing it reviews: `planEntityBackfill` reads and **mints nothing**; `applyEntityBackfill` writes only what a plan enumerated; `undoEntityBackfill` reverses a run from its record.

**The non-obvious part, which a successor will get wrong:** the binding lives in *two* places. The `channel_entities` row (P1) **and** the assistant `messages` rows, which are either stamped `default-entity` (P2) or left NULL from before the column existed (P3 — invisible to every entity). A backfill that re-points P1 and stops **looks completely repaired in the UI** and leaves each agent's own answers pooled on the placeholder. The load-bearing test is therefore not on the binding at all: it asserts `getEntityTranscript(newAgent)` contains the user turn, the P2 reply *and* the P3 reply, and that the default's transcript is empty afterwards. Per channel, in one transaction: the binding and the messages, or neither.

**What the corpus actually taught us** [BELIEVED — ROADMAP.md:277, which is itself a careful reconstruction]: `identity-claim` — the strongest guess basis and the only one on by default — reads **0-for-7** against xian's real March data, because of the corpus's 14 real identity claims, **zero name a person and all 14 state a role** ("you are my chief architect"). Its recall ceiling here is 0 of 0, not a gap to close. Round 202 shipped `role-title` as a second basis, **off by default**: `--bases=identity-claim,role-title` → `72 candidates — 9 would move, 821 P2 rows re-stamped, 0 P3`, 9/9 precision, recall 9/12.

**No data has been written outside test fixtures at any point in Rounds 199–227.** Every corpus run was a dry run or against a disposable copy; both real backups are untouched. **Keep it that way** — per-channel approval, not a blanket `--apply`, is xian's decision and is load-bearing.

## 4 — Deliberately unresolved — do not "fix" these

1. **The duplicate-name tiebreak still disagrees between the plan and the apply pass.** `entity-backfill.ts:432` uses an unordered `Map` (last-row-wins); `entity-resolve.ts` goes through `getAllEntities()` with `ORDER BY created_at ASC` (first-match-wins). Theseus found this in Round 205. **It was deliberately NOT resolved by making the two agree.** The answer taken instead (Rounds 208/212, his §4, adopted whole) is **disclose + let the operator reassign**: `sameNameEntityIds` on the import response, set *only* when more than one entity carries the name, so the field's presence is exactly "this binding was an arbitrary pick" — plus an atomic reassign endpoint and a picker. The reason refusal lost: **a refused backfill row costs nothing; a refused import costs the operator the import.** 121 Calliope sessions landing on one Calliope is `PREMISE.md` working; one stray duplicate turning that into 121 refusals is not a safety property, it is an outage. **Do not "harden" the import into refusing.**

2. **`readNumericConstant` throwing on a product is the feature.** Round 226: two functions, each throwing on the other's convention — `readNumericConstant` returns the value and throws on `50 * 1000`; `readLeadingFactor` returns the leading factor and throws on a bare value. The friendlier third option (have the value reader *evaluate* products) was **rejected on purpose**: it fixes today's caller and leaves tomorrow's silent — the next factor-wanting caller gets `52428800` off a respelled constant and multiplies it by 1024² with nothing red. **If a probe throws here, fix the call site, don't soften the reader.**

3. **A skip carries the kind of the arm it replaced; a bare string stays hard.** Round 224. The stricter rule ("any skip must not exit 0") was tried and **reddened a probe on a free port with all regression checks passing**, because one arm is a known *open item* — and a red exit on a known-open item trains everyone to ignore exit codes. Exit codes are **0 passed / 1 broke / 2 refused at the door / 3 ran but established less than it set out to**. Do not collapse 2 and 3: 2 is "has not run", 3 is "part of it stands."

4. **`browse-latency` arm O uses `samples[0]`, the cold sample — not the warm median.** Theseus's Round 227. The figure the probe audits ("browse goes 1.39 s → 2.03 s") is a **first-visit** number; the warm median contains no fingerprint work at all, so predicting it will move by the fingerprint delta is impossible **on any corpus**. Do not "improve" this back to a median.

5. **The `source_channel_id` column was deliberately not built** (2026-08-10, confirmed by Calliope). `#1` changed the cardinality it assumed — one entity now spans many channels — so a single column would hold whichever session was imported first. The question it answered is answerable more completely from `channel_entities` + `channels.type` + `channels.source`. [BELIEVED — my 8/11 handoff, which cites the confirming memo in `docs/mail/read/`.]

6. **My probe DB is clean as of this fire; the pollution is not a bug to re-find.** See §5.

## 5 — In flight / done this fire

**Done, this fire** [VERIFIED]: purged Theseus's Round 227 arm-P pollution from this worktree's `klatch.db`. His table said 2001 channels / 2000 `probe-seed-%` here; my own read agreed exactly. `VACUUM INTO` backup first (`klatch.db.backup-pre-round227-cleanup-20260918`, gitignored, 425,984 bytes, verified to contain the 2001 rows), then the two deletes in FK order, then `wal_checkpoint(TRUNCATE)`. After: **1 channel (`default`/general, real), 1 `channel_entities` row, 0 seed rows, `integrity_check` ok.** The upstream fix is in the tree (the guard now asks `db.name` where the connection actually went), so this will not re-accumulate. **The backup file is disposable** — delete it once you trust the cleanup.

**In flight: nothing under `packages/`.** No branch work, no half-landed migration, no uncommitted design.

## 6 — Counterparties, and what I most recently got wrong with each

This is the part that cannot be reconstructed from the repo.

**Theseus** (manual testing & exploration; my closest counterparty by an order of magnitude — most rounds are a two-message-a-day exchange with him). **What I most recently got wrong:** in Round 226 I told him arm O's tolerance was the wrong knob and that its red was *vacuous on his corpus*. The instinct was right; **the diagnosis underneath it was wrong, and it would have put the repair on the wrong line.** I blamed the corpus; the cause was that the arm was decomposing a **cache-hit** number into the work the cache elides. He built the corpus I asked for and it *acquitted* the corpus — arm O failed on it worse. **The pattern to carry:** when I am right that a red is real but wrong about why, my proposed fix points at the thing I already believe. Make him drive the discriminating case before I name the cause. Second pattern, older: **he defers design calls to me and I sometimes bank them instead of making them** (§2, the skip condition, `reapOnExit`). He does not re-list politely forever; he lists it once more and then it is visible to everyone that I sat on it.

**Argus** (quality & testing). **What I most recently got wrong:** I published a constant count of **4** from a probe arm that walks `packages/` without excluding gitignored `dist/` — on any tree with a build present it counts every source constant twice, and *his* tree read 8 on the same commit. I found it and handed it to him rather than the reverse, which is the right direction, but the defect was mine to have avoided: **a number that moves with the machine and reddens nothing is the failure mode of his whole beat**, and I shipped one into it. **The pattern:** he verifies rather than re-trusts, and he will re-run my claims independently. Give him the reproduction, not the conclusion.

**xian** (product owner). **What I most recently got wrong:** I treated the backfill's *sizing* being blocked on his database as the *whole item* being blocked. It wasn't — sizing needed his DB, the build never did — and the round track ran past it for a week while it sat as the rollup's top 🔴. **The pattern:** when something of his is blocking, decompose it before parking it; usually only one part is actually blocked. Also (memory index, and it holds): **direct file links plus a chat summary reach him; mail routing alone does not reliably.**

**Calliope** (writing & chronicling). **What I most recently got wrong:** nothing in the last several weeks that I can point to. She has twice caught *me* by keeping a status line honest (the "NOT BUILT" agent-continuity line in ROADMAP.md was stale for weeks and read as a summary of a document whose own margins said the opposite). **The pattern:** she is the one who notices when a document and the code have drifted. If she says a status line is wrong, check the code, not the document.

**Iris** (UI/UX). **Pattern:** she builds both halves of a client-side finding fast, often the same morning Theseus drives it. When I deliberately stop at the server seam (as with the reassign picker, Round 208 item 1), **say so explicitly and say it is client-only** — otherwise it looks finished and sits.

**Janus** (cross-project curator). **Pattern:** cross-project briefs are a real input, not ceremony — Round 227's guard finding went out to other projects the same day. Read `docs/briefs/cross-pollination/current.md` at session start; it is current. [VERIFIED — today's file exists and carries Round 227.]

**Pard / Exec** (fleet ops). Infrequent counterparties; both correspond via `docs/mail/`. The standing correction in my own history: a fire prompt once told this seat it had **no network**, which was false and I scoped work around it. **Measure the constraint before designing for it.**

## 7 — Mechanics a cold start will need

- **Duty cycle:** `launchctl` jobs `com.klatch.daedalus-{START,WORK,STOP}`, three fires a day, each in this worktree. [VERIFIED this session — all three loaded; `-START` was running as PID 74720, which is this fire.] **Re-verify with `launchctl list | grep daedalus` after the reboot** — loaded jobs are exactly what a restart drops.
- **Session start is not optional:** pull, read `docs/COORDINATION.md`, read `docs/mail/` for anything addressed to Daedalus, read `docs/briefs/cross-pollination/current.md`.
- **`git stash` is shared across worktrees.** Use a WIP commit instead; if you must stash, tag it.
- **SSH over 443** is the documented workaround if `git push` hangs (CLAUDE.md).
- **This seat's standing rule:** every edit under `scripts/` re-runs both suites *as a control* — not because a probe can move them, but so that "unchanged" is an asserted fact rather than an assumption. It has caught real drift twice.

## 8 — What I would do next, in order

1. **Make the arm O skip-condition call** (§2). It is the oldest thing owed out of this seat and it is a design decision, which is this seat's job.
2. **Do `reapOnExit` or kill it.** Third round of listing it is one too many.
3. **Chase xian on the backfill dry run** (§3) — with a direct file link, not a memo alone.
4. Only then take new probe rounds.

— Daedalus, 2026-09-18 START fire
