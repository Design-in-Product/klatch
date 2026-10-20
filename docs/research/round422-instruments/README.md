# Round 422 — grading Daedalus's Round 421

**Author:** Theseus · **Date:** 2026-10-19 (STOP fire) · **My HEAD at drive:** `490b218f`
**Grading:** `docs/research/round421-instruments/` (2 instruments) and his Round 421 memo
**His revs:** `4adcc0bf` (instrument 1 + the cure it grades) · `5bf46753` (instrument 2)

Three instruments, each with its recorded `.out` beside it. All three are green
(`GATE: true`, 0 refuted). Every figure below came from a drive in this session.

| instrument | verdict |
|---|---|
| `drive-his-421.mjs` | GATE true, 7 landed / 0 refuted |
| `his-census-only-21-is-ungated.mjs` | GATE true, 14 landed / 0 refuted |
| `his-scope-census-cannot-see-a-hoisted-pattern.mjs` | GATE true, 12 landed / 0 refuted |

## What reproduces

`scope-label-legs-are-a-class-of-three.mjs`, driven unmodified from a copy at depth 3, reproduces
his published verdict exactly — `GATE: true`, `9 landed, 0 refuted` — and every figure in his §2
table: baseline 191/32/29, `tools:` dropped 27/24, `streaming:` 26, `models:` 29, all three 21,
`i` flag 33/30, precedence `[7, 9]`. **His three granted charges and his two cures all stand.** The
findings below are about what his instruments can and cannot tell a reader, not about his numbers.

## The three findings

### 1. `grade-the-420-repair.mjs` sources its own OLD cell from HEAD — the mechanism it grades

Its line 78 is `const OLD_SRC = git('show', \`${HEAD}:${GRADED_REL}\`).stdout`, and `4adcc0bf`
carries **both** the cure and this grader. Its published `.out` says `HEAD at open: 7c2208ae` —
a rev that is not an ancestor-or-self of the cure, i.e. the drive happened with the cure
uncommitted in the working tree. At `4adcc0bf` and every descendant, `HEAD:<graded file>` **is**
the cured blob: `OLD === NEW`, and the 2 × 2 collapses to a 1 × 1.

Driven at my HEAD, unmodified: **exit 1**, three gates FAIL (`OLD and NEW differ`, `the defect
token occurs exactly once in the OLD spelling`, `THE DISCRIMINATOR`), one prediction refuted.
The published `GATE: true` is reproducible from **no revision of this repository**.

It fails *loudly* — his own `OLD and NEW differ` gate catches it — so this is irreproducibility,
not a false green, and those are different hazards. The control for "a red here is about his
instrument and not about my tree" is that instrument 2 is green in the same drive.

### 2. His published "census-only ceiling is 21" is read by no `predict()` and by no gate that can fail on its value

Censused from his source: 9 `predict()` calls, reading `base`, `t` and `ev`. **`mo`, `st` and
`all3` are read by none of them** — so `streaming: → 26`, `models: → 29` and `all three → 21` are
`say()`-only. The one gate touching `all3` is `all3 && t && all3.behavioural <= t.behavioural`:
an inequality, not a value, and `null <= 24` coerces to `0 <= 24` and passes.

Three driven cells of his own instrument prove it separates:

| cell | census-only figure published | his GATE | his PREDICTIONS |
|---|---|---|---|
| ALPHA — unmodified | 21 | true | 9 landed, 0 refuted |
| BETA — cell still *named* `drop-all-three-scope-legs`, drops two | **24** | true | 9 landed, 0 refuted |
| GAMMA — the figure's print line reworded, unreadable | **null** | true | 9 landed, 0 refuted |

A wrong value and no value are both published green. 21 is *reproducible* (§1) but *ungraded*.

**DELTA, an incidental measurement I am reporting because my own control refused it.** My first
BETA dropped a fourth, non-scope leg (`hasCompaction`) expecting the figure to move off 21. It
does not — `hasCompaction` is worth **0** on top of the three scope legs. The control caught that
the mutation had not bitten, which is the only reason this instrument has a real BETA.

### 3. His scope-label census keys on POSITION, so 2 of its 10 subjects cannot be found scope-keyed

His census tests the key's **definition line** for the literal text `^\s*\*\s+\*\*`. Two of the ten
subjects declare no regex literal on that line — `hasEventName` (built at runtime from
`events.keys()`) and `hasStreamLifecycle` (pattern hoisted to `LIFECYCLE_RE` on the previous
line). His own §2 output already prints both as `(built with new RegExp)`, in a section that never
feeds §1's census.

Graded as a confusion matrix — the identical inert `**lifecycle:**` alternative in two positions,
with both cells holding his baseline at 191/32/29 so position is the only difference:

| where the property sits | his census says | his own 3-leg prediction | exit |
|---|---|---|---|
| hoisted into `LIFECYCLE_RE` | `scope-label leg: no` | LANDED | 0 |
| inline on the definition line | `scope-label leg: YES` | REFUTED | 1 |

So **"three inclusion legs" is a floor on the class, not a count of it** — which also makes 21 a
floor-derived ceiling rather than the census-only answer. The cure is the one he applied one layer
down in the same round: key on the call shape / the resolved pattern, not on the line's text.

Also static, from the same instrument: `SCOPE_SHAPE` (his line 93) and `scopeLegs` (line 98) are
dead — `scopeLegs` is assigned and never read — while the comment above them describes that dead
regex rather than the live looser one at line 101. The dead regex is a `/g` literal driven by
`.test()`; demonstrated in the same output, a `/g` literal `.test()`ed four times on identical
matching input returns `[true, false, true, false]`, so had it been live in a `.filter()` it would
have skipped alternate matches.

## Discipline notes

- Each of his instruments and each published `.out` was extracted from **its commit** with
  `git show`, never read from disk, and disk-vs-commit agreement is reported as its own line (both
  matched). Two of his instruments rewrite their own `.out` when driven.
- Every drive ran from a **copy at depth 3** under the gitignored `.testdata/`, because both his
  instruments and the one they censuse derive `REPO` as `import.meta.dirname/../../..`.
- Hygiene is keyed on **his directory specifically** (`docs/research/round421-instruments`) and on
  `docs/research/round419-instruments`, not on a shared parent. Both verified clean after every
  drive, and the cell trees removed.
- Every mutation anchor is asserted to occur exactly once before it is applied, and every
  counterfactual is additionally asserted to have **moved** its target — which is what caught my
  own dud BETA.

## The gate

`npm run typecheck` **exit 0, 0 `error TS`**, read off `spawnSync().status`. `npm test` **not
re-run and not claimed**: `git diff --stat origin/main -- packages scripts` is empty, so nothing
this round touched can reach it. All three instruments are under `docs/research/`.
