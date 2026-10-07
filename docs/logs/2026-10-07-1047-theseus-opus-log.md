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

## 15:0x PT — WORK fire, Round 348

Verifying Daedalus's Round 347 — his grading of the CURE D I routed in Round 346, landed as arm
**F9**. Baseline `origin/main` at `b1707f50`, clean.

**Authorship checked before assuming anything was mine.** `git log --format='%an'`: the three
commits above my last (`9f37a96e`) are **Daedalus's** (`5cfe0e91`, `d10b13e5`, `356ddb78`) and
`b1707f50` is **Argus's**. All four carry a subject shape I would have read as my own — this is the
Round 326 trap and `--oneline` hides it.

### His figures, re-derived

- **F9 driven directly:** `PASS`, `4 hoisted-tag site(s) across 194 code files`, line pairs
  `round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172`. Byte-identical to the
  memo's.
- **An independent key, sharing neither his regex nor his `stripSource`** —
  `.testdata/r348/ast-key.mjs`, string-vs-code decided by the TypeScript parser, so a shape spelled
  inside a string literal is that literal's `.text` and never a node. **Graded 12 of 12 before any
  tree figure was read off it**, then run: **his exact member list, 4 of 4, compared as members not
  counts.** Population independently derived at **194** by a `readdirSync` walk, not grep.
- **SWEPT/DEFERRED re-derived** from `sweep-probes.mjs` under his stated rule: 224 SWEPT (L249),
  224b DEFERRED (L1119), 247 DEFERRED (L1130), 255 SWEPT (L228) — exactly as published. A fifth
  substring hit at L1144 was a *different* file (`round255-…-mutations.mjs`); printing the matched
  line instead of counting matches is what kept it out of the figure.
- **His five blind dimensions: all five zero members.** Two more I added are also zero — a name
  containing `$` (his `${name}` reaches `new RegExp` unescaped, so `$` acts as an end-anchor and the
  emitter can never match; it fails toward a *smaller* number) and a label interpolated inside a
  larger span rather than bare. Seven documented limits, no live holes.

### My own first key was wrong, in the false-positive direction

It returned **7**, not 4. The three extras — round280:476→478, round281:221→222, round282:617→618 —
read from source rather than believed:

```
476|   const meas = rows.filter((r) => r.outcome === 'MEAS');
478|   console.log(`${passes.length} check(s) passed · … · ${meas.length} measurement(s)`);
```

Comparand, not label; array, not tag; count, not rendering. **His key excludes them correctly and
for a principled reason** — he requires the *bare* name interpolated, so `${meas.length}` cannot
match. Re-keyed with a bare/inner span split, a label-valued/call-valued split, and both real lines
as known negatives: **4**.

Second slip, caught only because the key prints its own grade: the corrected run printed
`GRADE 10 of 12 — KEY IS NOT GRADED, FIGURES BELOW ARE VOID` **beside a correct 4**, because the
grade ran on the raw pair list and the figure on the filtered predicate. A figure and the grade that
licenses it must be read off one predicate, or the grade licenses a different question.

### Correction 1 — the `2` and the `4` are two states, and the mis-read was mine

```
arm file at 29b6dff7 (his baseline, pre-F9): routed baseline=0   +emit-first=2   (delta=2)
arm file on main today (post-F9):            routed baseline=36  +emit-first=50
routed tree-wide, arm at 29b6dff7:  4 sites  (the same four line pairs)
routed tree-wide, arm as on main:  40 sites
```

His `2`, his clean `4`, and counterfactual D's `40 / 36 its own` **all reproduce exactly, each in its
own state**, and 36 + 4 = 40. The 36 are F9's own `HOISTED_KP`/`HOISTED_KN` arrays, which are the
shape written as strings. My first reading — that the `2` was unreproducible — was a **state** error
of mine. Round 328's lesson held.

### Correction 2 — the margin is the element order, not a semicolon

His committed comment: "escapes only because the enclosing match's `[^;]*` RHS swallows the
semicolon inside its first string element … **the margin is one semicolon wide**." That predicts a
mutation. Driven against his own blob where the routed baseline is 0, each anchor asserted to occur
exactly once before mutating (his own counterfactual-C lesson):

```
mutation 1  semicolon removed  → 0 site(s)            ← the claim predicts ≥1
mutation 2  order swapped      → 1 site(s)  623→622   ← this is what exposes it

enclosing-declarator match span, by state:
  original      : HOISTED_TERNARY_SITE L621→L622
  no semicolon  : HOISTED_TERNARY_SITE L621→L623            ← swallows MORE, not less
  order swapped : HOISTED_TERNARY_SITE L621→L622 | tag L623→L623
```

Removing the semicolon sends `[^;]*` on to the next one at `].join('\n');`, so the enclosing match
consumes the inner `const tag` *more* completely. The escape condition is *no `;` between the
enclosing `=` and the inner declarator* — assign-first satisfies it structurally, emit-first
violates it. **His own spelling table's second row (assign-first, no semicolon, escapes) is already
the counterexample**, and that table reproduces 5 of 5.

His finding and his fix are both right; only the stated mechanism is wrong. **Corrected in F9's own
comment block — comment-only.** F9 re-driven after the edit: still `PASS`, derived line
byte-for-byte identical, same 4 sites, same 194 files.

### Gate, each off its own instrument

- `tsc --noEmit` server and client, each to its own file: **both 0 bytes.** Not a `grep -c` of zero,
  which would also print 0 if the compiler had crashed.
- `npm test` **unpiped** to a file, summary lines read: server **140 files / 2178 passed / 1
  skipped**, client **26 passed / 13 skipped files, 333 passed / 13 skipped (346)**. Exact to his.
- Sweep driven separately, **verdict line** read rather than its exit code (exit 2 is BLOCKED by
  design — that is what this probe is *about*):
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`
- The pre-commit hook's census printed `census PASSED` and said of itself
  `NOT CHECKED: none of the 36 swept probes was driven`. It is not the gate and was not treated as
  one.

**A methodological limit I am stating rather than burying:** I made the comment edit while my *first*
sweep run was still in flight, so that run read a mixed tree and **is not cited as a baseline**. The
verdict above is from a clean post-edit run (`.testdata/r348/sweep-postedit.txt`); its line is
identical, 0 red, 0 census problems.

### Mail handled

- **Daedalus's Round 347 → read, verified, answered in this fire**, and `git mv`'d to
  `docs/mail/read/`: its routed item is landed and verified, and the one correction I found I
  applied myself, so nothing is left for him to action. My Round 348 reply stays visible in
  `docs/mail/` for his verification pass.
- **Argus's 10/06 Laya/AAXT memo to the CIO** — re-read in `docs/mail/` this fire. Still open, still
  parked on **xian's scheduling call**; not mine to close, left visible.
- Nothing else in `docs/mail/` is addressed to me and unanswered.

### Deliverables

- `docs/research/round348-every-347-figure-reproduces-in-its-own-state-and-the-one-semicolon-margin-is-the-element-order-2026-10-07.md`
- `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-every-347-figure-reproduces-…-2026-10-07.md`
- `scripts/probe-round269-…mts` — F9 comment block corrected (comment-only)
- `git mv` of Daedalus's Round 347 memo into `docs/mail/read/`
- COORDINATION.md Theseus section updated

### Nothing needs a decision from xian from this fire

The one open thread that does is Argus's Laya/AAXT memo, above.
