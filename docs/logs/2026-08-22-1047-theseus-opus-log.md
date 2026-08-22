# Theseus session log — 2026-08-22 (opus)

## 10:47 PT — START fire. Round 72: Daedalus's finding against my tap, taken and extended.

**Briefing.** Pulled state was current (wrapper synced). Read `docs/COORDINATION.md` (my section
and Argus's 09:03 entry), `ls docs/mail/`. One new memo addressed to me:
`daedalus-to-theseus-cc-xian-team-your-argument-is-better-than-mine-and-the-tap-says-no-frame-when-it-has-the-frame-2026-08-22.md`.
Read in full. Two items: my §4 closed in my favour (his ask withdrawn, `unscorableCalls` keeps its
Round 69 definition — nothing owed), and a defect in `scripts/lib/recall-tap.mjs` offered to me
rather than taken.

**Verified the defect before fixing it.** Wrote a throwaway script against the real modules — no
server, no network. First attempt printed `status: mismatch` rather than his `captured`, which for
a moment looked like a *second* defect. It was my error: `alignTapToCalls(frames, calls)` takes the
frame array first and I passed `{status, frames}`; `undefined > calls.length` is false and
`undefined === 0` is false, so both guards fell through and the offset loop ran zero iterations on
`NaN`. Corrected the call shape and reproduced his transcript exactly:

```
kind    : unknown
status  : captured
verdicts: ["no-frame"]
inputs  : [{"query":"depot cipher","expand":{"from":"12"}}]
flagged : 1  resolved: 0  unresolved: 1
  ← 1 flagged call(s) the tap could not adjudicate (no frame reached them).
```

`status: captured` and "no frame reached them", one run, one call. His §2 stands as written. It was
a fall-through, not a decision — I wrote `kind !== 'search'` to stop the tap *scoring* an unparseable
row and did not notice it was also answering a question about *capture*.

**The part his memo did not claim, and which I checked rather than assumed.** He framed `unknown`
as firing on producer-side grammar drift, so the expensive case waits on a future reword. It waits
on nothing. `readExpandArg` (`client.ts:599`) accepts any `string` conversation and any `number`
from/to; `EXPAND_SUMMARY` (`recall-call-kind.mjs:72`) requires a non-empty name and two integers.
Ran the real `readCallKind` over the real producer expression (`client.ts:620-622`):

| accepted `expand` | summary written | `kind` |
|---|---|---|
| `{conversation: 'vesper-1-1', from: 12, to: 38}` | `Expanded own conversation: vesper-1-1 12–38` | `expand` |
| `{conversation: '', from: 12, to: 38}` | `Expanded own conversation:  12–38` | **`unknown`** |
| `{conversation: '   ', from: 12, to: 38}` | `Expanded own conversation:     12–38` | `expand` |
| `{conversation: 'vesper-1-1', from: -1, to: 38}` | `Expanded own conversation: vesper-1-1 -1–38` | **`unknown`** |
| `{conversation: 'vesper-1-1', from: 12, to: 3.5}` | `Expanded own conversation: vesper-1-1 12–3.5` | **`unknown`** |

Three of five. One model typo in an echoed expand address prints the false line today. The
empty-name row is an expand the server **accepted and executed** whose artifact is unreadable
anyway — so the test could be built through the **real route** (real SDK mock, real artifact write,
real SSE frames via `driveWithTap`) instead of a hand-built `unknown` fixture. Not claiming any
stored run has hit it: reachability checked, incidence not.

**Fix, in his shape.** `TAP_VERDICT.UNREADABLE_SUMMARY` at `readTapVerdict` when `toolInput` is
non-null and `kind` is neither `expand` nor `search`. `resolvedByTap` does not count it —
holding the bytes is not adjudicating the row, and it declined to adjudicate deliberately, because
scoring it would reimplement `readExpandArg` and make the join one source read twice (Round 58).
`unresolvedCalls` keeps the row; `unreadableSummaryCalls` is additive and a strict subset, so the
console splits by subtraction and no existing count changes value. Used an explicit `adjudicated()`
predicate rather than `!== NO_FRAME`, because under the old spelling the next verdict added inherits
"resolved" silently — which is how this defect got in.

No probe edit needed: `tapSummary` is spread at `probe-recall-tool.mjs:1685` so the count reaches the
per-run JSON, and `:2054` prints any verdict other than `no-frame`, so the raw `tapInput` now surfaces
beside the new verdict automatically. Verified by reading both call sites, not inferred.

**Three controls, run not argued.**

| Control | Mutation | Result |
|---|---|---|
| A | Revert to `NO_FRAME` for `unknown` | 2 red, both `AssertionError`, no crashes |
| B | `adjudicated = v => v !== NO_FRAME` | 2 red, on `resolvedByTap`/`flaggedCalls` |
| C | Delete the "no frame reached them" branch — *the lazy fix* | **1 red, only the second new test** |

C is the finding. Deleting the false line passes the first new test completely — false sentence gone,
new sentence present, counts correct — and is caught only by the discriminator case that puts one
unreadable row and one genuine no-frame row in one run and requires both warnings to sum to
`unresolvedCalls`. The cheap fix trades a false warning for a lost true one. Second time on this
module that the discriminator, not the test naming the finding, does the work (Round 71 control B).

**Deliberately not done.** The `readExpandArg`/`EXPAND_SUMMARY` disagreement is producer-side
looseness; the tidy fix is in `client.ts`. Not touching it — changing a producer mid-experiment on
an argument is the Round 58 move I would refuse from Daedalus, and it changes what `kind` a
past-shaped call would get. Recorded as open in the doc §6 and flagged to him to overrule if he
reads it as over-caution.

**Deliverables.** `docs/research/round72-the-unknown-branch-is-reachable-today-2026-08-22.md`;
`docs/mail/theseus-to-daedalus-cc-xian-team-taken-and-it-fires-on-todays-producer-not-a-future-reword-2026-08-22.md`
(separate commit, ahead of the code commit, per the worktree mail rule).

**Cost:** zero API calls, zero live runs, no server started. Two throwaway node scripts, both
deleted before commit.

**Open, unchanged and still xian's:** the distance arm go/no-go — `F=17, L=20, G=8`, 80 rows, five
opus runs. This fire fixed a defect in an instrument, which is not a reason to run one. Also open and
not mine: per-condition reporting; the K-vs-J miss case; the 0/12 non-expansion path; the per-run
JSON ruling, option (2), the backfill.

**Mail state:** the two memos in this thread left in `docs/mail/` rather than moved to `read/`, so
Daedalus sees my reply first. He can close them.

---

## Session wrap verification

_Appended after the work above, per CLAUDE.md Session Wrap Protocol._

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -5
64c83d8 log+coordination: 8/22 START — round 72, the tap says captured-but-unreadable and the unknown branch fires today
e8262ef round72: the tap says captured-but-unreadable, and the unknown branch is reachable from today's producer
03b9201 mail: reply to Daedalus — his NO_FRAME finding taken, and the unknown branch fires on today's producer
f675ff2 log: 8/22 START — wrap verification appended
4c72d81 log+coordination+research: 8/22 START — my §4 withdrawn, and the tap reports no-frame for a frame it captured
```

All three of my commits present. The mail commit (`03b9201`) landed ahead of the code commit, as the
worktree mail rule requires.

**Step 2 — deliverables present in the `origin/main` tree** (`git ls-tree -r origin/main`):

```
docs/logs/2026-08-22-1047-theseus-opus-log.md
docs/mail/theseus-to-daedalus-cc-xian-team-taken-and-it-fires-on-todays-producer-not-a-future-reword-2026-08-22.md
docs/research/round72-the-unknown-branch-is-reachable-today-2026-08-22.md
packages/server/src/__tests__/round71-probe-tap-joins-the-wire-to-the-artifact.test.ts
scripts/lib/recall-tap.mjs
```

`git status --porcelain` empty — both scratch scripts deleted, nothing stray committed.

**Step 3 — suite and typecheck, run this fire after the final revert of control C:**

- `npx vitest run` (packages/server): **1417/1417 passing, 86 files.** Was 1415 before this fire
  (Argus's independently verified 09:03 figure); +2 is exactly the two tests added here.
- `npm run typecheck`: clean across `shared`, `server`, `client`.
- `node --check` clean on `scripts/lib/recall-tap.mjs` and `scripts/probe-recall-tool.mjs`.

This log is committed last, in the same commit as the coordination update, and is pushed with it.
Delivery is the wrapper's to confirm; what is verified above is that the commits and files are on
`origin/main` as of this fire.
