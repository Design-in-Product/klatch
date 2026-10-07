# Theseus — 2026-10-07 (Opus) — duty-cycle fires

## 10:47 PT — START fire, Round 346

Briefing: pulled state is `origin/main` at `4db47671`, worktree clean, branch
`claude/theseus-cycle` tracking main at the same commit. Read `docs/COORDINATION.md` (my section)
and `ls -t docs/mail/`. One new memo addressed to me:
`daedalus-to-theseus-argus-…-your-cure-c-is-built-and-counterfactually-graded-…-2026-10-07.md`
(Round 345). Read in full, in this fire, and answered in this fire.

**`%an`-checked the head commits before assuming anything.** All three head commits (`4db47671`,
`6dde9392`, `89eed598`) are **Daedalus's**, not mine — and all three carry my own fire's subject
shape. My last fire was Round 344 (10/06 STOP). This is the trap Round 326 cost a fire to;
`--oneline` hides the author.

### Gate, re-derived off each instrument rather than carried

| check | result |
|---|---|
| `npx tsc --noEmit -p packages/server` | no output, rc 0 → **0 `error TS`** |
| `npx tsc --noEmit -p packages/client` | no output, rc 0 → **0 `error TS`** |
| `npm test` (unpiped) server | **140 files, 2178 passed, 1 skipped (2179)** |
| `npm test` (unpiped) client | **26 passed + 13 skipped files, 333 passed + 13 skipped (346)** |
| `node scripts/sweep-probes.mjs` verdict line | `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred` |
| `probe-round269` driven directly | `All 54 regression checks passed, 3 measurements, 0 skips`, exit 0, `[F8] PASS` |

All six match Daedalus's published figures exactly. `npm test` was run **unpiped** into a captured
output file and both summary blocks read out of it — a pipe returns the tail's exit code and
discards the head. The sweep's **verdict line** was read, not its exit code (the run exits 2).

**One slip, corrected in-fire:** I ran `probe-round269 … | tail -0`, which discarded the output I
intended to cite. Re-ran unpiped. Exactly the failure mode my own notes warn about.

### Daedalus's two corrections — both hold

- **Correction 1 (my four-file class is two at file level): confirmed, read by hand.** 4-member
  population, so the hand reading is primary. `round282:619` and `round284:477` each carry a literal
  `[MEAS]` in a `console.log` first argument. `round280:56` / `round281:49` render theirs inside
  `record` from the `outcome` **parameter** — the ternary carries no `'MEAS'` literal. My premise was
  wrong at file level; my site-level reading stands.
- **Correction 2 (vacuous for the absent-claim reason): confirmed by driving it.**
  `measurementCheck` returns **0 keys** for `round255`'s entry. Also 0 for `round224`'s, which
  matters below.

### The work unit: his §4 residual, measured

He named "F8 is file-level; a partially blind file passes it. Not built." Took it this fire.

Two offset-based keys differing in **what selects the site** (not sharing a denominator), graded on
three real shapes before any tree figure was read off them:

| | SWEPT (36) | DEFERRED (109) |
|---|---|---|
| no MEAS literal | 4 | 45 |
| fully visible | 24 | 56 |
| fully blind (F8 sees) | 1 | 2 |
| **partially blind (F8 does not)** | **7** | **6** |
| offsets not preserved | 0 | 0 |

Independent cross-check: 24+1+7 = F8's published **32**; 24+7 = its **31**. Exact, from a key that
never asks F8's question.

**Hand-read all 13 unreached-site sets.** 5 real (`224` swept; `224b`, `247`, `282`, `284`
deferred), 8 false class — prose, a type union, `round269`'s own fixtures/regex sources, and four
files where the hit is the **word** `MEASURED`/`MEASURES` (F8's key is `indexOf`; MEAS is a
substring). So his refusal of site-count equality was right and is now priced: 8 of 13.

**FINDING — the hoisted-ternary class is four files, not one.** `probe-round224:71→72` hoists the
same ternary `round255:171→172` does, and `round224` is **SWEPT and undeclared**. F8's comment says
the inline-ternary case "rescues round224" — true of the file, and that is the hiding mechanism: 224
has two emitters, F6 grades `:561`, has never seen `:72`. Driven: renderer → `[]` on 224's real two
lines, `["  MEAS [X] X"]` on its sibling. F8 cannot declare it (file-keyed; declaring a
file-level-reached file reds the `declared-but-not-invisible` conjunct).

Harmless today on **both** legs: all three renderings count 1, and 224's entry makes no measurement
claim either.

**CURE D built, graded and priced before routing.** Keyed on the shape (a MEAS *literal* assigned to
a name, that name interpolated into a `console.log` template), not on site equality. Graded on
**2 known positives + 5 known negatives, all copied from real tree shapes**; flags **exactly 4 files
of 194**, every flag hand-read, **0 false defects**; same flag set in both population units
(191 excl. the 3 `.d.mts`). Routed to Daedalus with an explicit ask to grade the cure separately
from the finding.

**Population re-derived in the published unit:** 194 code files recursive (146 `.mts` + 46 `.mjs` +
2 `.ts`, 3 of them `.d.mts`), 175 top-level. Both standing figures reproduce.

### Limits stated

- Source-population answer; the 109 DEFERRED probes were not driven (binding ports is not
  proportionate in a START fire).
- The detector is same-file and direct-interpolation: a tag reaching the template through a function
  parameter is invisible to it too. That is the `record()` class and it stays declared.
- `probe-round225`'s holding PID not re-read; no claim about what holds 3001.
- Measurement scripts live in gitignored `.testdata/` on purpose — a script carrying MEAS string
  literals, placed under `scripts/`, becomes a member of the population it measures. The durable
  copy of the detector is in the writeup.

### Deliverables

- `docs/research/round346-the-hoisted-ternary-class-is-four-files-and-one-is-swept-undeclared-and-invisible-to-f8-by-construction-2026-10-07.md`
- `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-residual-has-five-real-members-…-2026-10-07.md`
- `git mv` of the closed Round 344/345 pair into `docs/mail/read/` (my 10/06 ask, fulfilled; his
  10/07 memo, answered — my 346 reply stays visible because CURE D is an open routed action).
- COORDINATION.md Theseus section updated.

### Mail handled

- **Daedalus Round 345 → read, verified, answered in this fire.** Thread's open item (his §4
  residual) taken and routed back as CURE D.
- **Argus's 10/06 Laya/AAXT memo to the CIO** — re-read in `docs/mail/` this fire. Still open and
  parked on **xian's scheduling call**; not mine to close, left visible.
- Nothing else in `docs/mail/` is addressed to me and unanswered.

### Nothing needs a decision from xian from this fire

The one open thread that does is Argus's Laya/AAXT memo, above.

## 10:5x PT — wrap verification (Round 346)

**Step 1 — commit on `origin/main`.** `git fetch origin && git log origin/main --oneline -3`:

```
74d43361 research+mail+coord+log: Round 346 — the hoisted-ternary class is four files, and one is swept, undeclared and invisible to F8 by construction
4db47671 log: 10/7 START fire wrap verification — both Round 345 commits on origin/main, five deliverables confirmed and their content checked in the pushed blobs
6dde9392 coord+log: 10/7 START fire — Round 345, CURE C built, counterfactually graded and landed; the routed four-file class is two at file level
```

Pushed `4db47671..74d43361 HEAD -> main`.

**Step 2 — each deliverable present in the pushed tree**, by `git ls-tree -r --name-only
origin/main` against the paths (the tree, not the local filesystem):

- `docs/research/round346-the-hoisted-ternary-class-is-four-files-…-2026-10-07.md` ✓
- `docs/mail/theseus-to-daedalus-argus-…-your-residual-has-five-real-members-…-2026-10-07.md` ✓
- `docs/mail/read/daedalus-to-theseus-argus-…-your-cure-c-is-built-…-2026-10-07.md` ✓ (archived)
- `docs/logs/2026-10-07-1047-theseus-opus-log.md` ✓

**Content checked in the pushed blobs, not just the paths:** `git show
origin/main:docs/research/round346-….md` contains the `4 of 194` / partially-blind figures
(6 matching lines), and `git show origin/main:docs/COORDINATION.md` carries the
`Round 346 (START fire)` status block (1 match).

**Note on the pre-commit hook:** it printed `census PASSED` and said so itself —
`NOT CHECKED: none of the 36 swept probes was driven`. The census is **not** the gate and I did not
treat it as one; the sweep was driven separately and its verdict line read, above.

Nothing stranded, nothing uncommitted. This log entry is the last thing pushed.
