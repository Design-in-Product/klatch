---
unit: unit-477ddlcolumns
agent: Daedalus
date: 2026-11-18 (WORK fire)
opened: 13:17 PST · pre-reg pushed 13:21:00 · `date` reads throughout, none estimated
ledger: 8 registered — 1 HIT (P6), 1 HIT (P7), 6 REFUTED (P1, P2, P3, P4, P5, P8)
---

# unit-477ddlcolumns — RESULTS

**Six of eight predictions refuted, and the two headlines are both inversions of what I
registered.** The fixture does not disagree with production — it agrees at every granularity
`sqlite_master` can express. And the arithmetic gap I predicted was a property of my cure turned
out to be two of my own published figures measured over the wrong population.

## 1. The routed question, answered: they agree completely

Argus's 11/18 finding put the load on `__tests__/setup.ts`: `migration.test.ts` runs neither
`applySchema` nor `runMigrations`, so the suite's schema-shaped claims rest on a fixture nothing
compared to production. I boarded the column-level question as mine. The answer:

| granularity | result |
|---|---|
| tables | **9 both sides, 0 either-only** |
| column name sets | **identical for all 9 of 9 tables** — 0 prod-only, 0 fixture-only |
| `PRAGMA table_info` attributes (type / notnull / default / pk) | **0 differences** |
| `CREATE TABLE` text | **byte-identical on 4 of 9** (`channel_entities`, `file_refs`, `files`, `ground_rules_presets`) |
| top-level DDL clause multiset | **EQUAL on 9 of 9** — 0 genuinely different clauses |
| column **order** | **differs on 5 of 9** (`channels`, `entities`, `message_artifacts`, `messages`, `projects`) |
| objects (tables + indexes) | **13 both sides, 0 either-only** |

**The sole difference between the two schemas is the ordinal position of columns in five tables,
and the cause is structural rather than drift:** production reaches its schema through
`ALTER TABLE ADD COLUMN`, which can only append, so every migrated column lands last; the fixture
types each column in its logical place. `entities.effort` and `entities.reflections` are the clean
example — P4 called them fixture-only, and they are in production, added by migration, which is
exactly why they sit last on one side and mid-list on the other.

**What that order difference costs, measured rather than assumed: nothing in this repo.** No
positional `INSERT INTO t VALUES` against any of the nine tables (the four hits are probes' own
scratch table `t`), no `.raw()`, no `.columns()`, and the only two `.pluck()` calls are
single-column aggregates in `schema-delta.ts`. Column order is an attribute nothing here reads.

### P1–P5 all refuted, in the same direction

P1 (≥1 name-set difference), P2 (≥3 tables differing), P3 (drift in both directions), P4
(`effort`/`reflections` fixture-only) and P5 (at least one attribute difference behind a name
agreement) were all registered on the premise that two hand-maintained DDLs *must* have drifted.
They have not. P5 is worth naming separately: I predicted that name-set agreement would prove a
weaker key than attribute agreement, and it is weaker **in principle** — `Census.cols` carries
names only — but here the stronger key finds nothing the weaker one missed.

## 2. The finding the refutations left standing: the shipped comparator cannot see a permutation

Put to the **real exported `census()` and `diffCensus()`**, both directions:

```
fixture → production    rebuiltTables (5): channels, entities, message_artifacts, messages, projects
production → fixture    rebuiltTables (5): channels, entities, message_artifacts, messages, projects
                        addedObjects 0 · droppedObjects 0 · addedColumns 0 · alteredTables 0 · empty=false
```

`appendOnly` — `was.every((c, i) => cols[i] === c)` — is false for a permutation, and
`rebuiltTables` is the **fall-through for everything that is not append-only**. So two schemas that
agree on every clause are reported as five rebuilt tables. **The symmetry is the tell:** a real
rebuild is directional, a permutation reports identically both ways.

Two things I am **not** doing about it, each with its reason:

- **Not adding a `permutedTables` bucket.** `SchemaDelta` is a published interface with
  `describeSchemaDelta` and two round465 test files reading it. More to the point, the ambiguity is
  **unreachable through `schemaDelta()`**, whose two censuses come from one handle, where a
  permutation requires a genuine rebuild. The only reachable path is the two-database comparison —
  which **did not exist until I exported `census()` twenty minutes earlier in this fire.** Changing
  a published interface over a hazard my own export created is the wrong size of response.
- **Not touching the disclosure string.** `describeSchemaDelta` says *"table(s) rebuilt, not altered
  in place"*, which is now known to be wrong for a permutation; round465's tests assert against that
  block. Declared here instead.

**A second-order observation, recorded because it is reachable where the first is not:** for a
non-`appendOnly` table, the constraint check (`alteredTables`) sits in the `else` branch, so the
constraint question is **never asked** of exactly the tables reported as rebuilt. That one *is*
reachable through `schemaDelta()` — a real rebuild that also widens a `CHECK` reports only
"rebuilt". The verdict is unaffected (both make `empty` false and both exit 1); only the
disclosure's detail is. **Argus's lane if he wants it; not boarded as mine.**

## 3. P6 HIT, by live census instead of by reading

`messages_rebuild` is in **neither** effective schema — created and dropped inside the migration.
So the `10` vs `9` `CREATE TABLE` text count between `db/index.ts` and `setup.ts` over-reports, and
the effective table sets are the same size. In the START fire I checked this by reading the names;
here it is checked by censusing two live databases.

## 4. The cure: the measurement is now a standing guarantee

`packages/server/src/__tests__/schema-fixture-agreement.test.ts` — 7 legs, tracked, in `npm test`.
It asserts **equality up to permutation**: same tables, same column names, same `PRAGMA`
attributes, same top-level clause multiset, with order free to differ. A stricter key would redden
on the next migration for a reason that is not drift; a names-only key would pass a fixture whose
`CHECK` had diverged.

**C3 — the cripple those four legs needed.** All four are of the form *two things are equal*, and
every assertion of that form passes when the comparison is blind. One column planted in `setup.ts`'s
`files` DDL:

| | legs |
|---|---|
| before cripple | **7 passed** |
| under cripple | **4 FAILED / 3 passed** — red: column names, column attributes, equal-up-to-permutation, fixture-side KP; green: same-tables (a column is not a table — correct), production-side KP, fixture-clean-again |
| after restore | `grep -c cripple_c3_drift` → **0**, `git status --porcelain` on the path **clean** |

The cripple was local and never pushed, and **no gate leg of mine was running over the file.** This
morning I crippled a tracked module while two of my own gate legs were driving over it; that is the
mistake being avoided here, not a rule being followed.

One of the four reds is informative beyond its purpose: the fixture-side KP went red because its
`toEqual(['files.kp_fixture_only'])` is exact and the crippled tree gave it two entries. That leg
doubles as a drift detector by accident of being written exactly rather than loosely, and it is
named as an accident rather than claimed as design.

### `census()` exported, with the reason at the site

A caller wanting to compare two schemas had two options, and the other one was to re-derive
`census()` at the call site from `sqlite_master` and `PRAGMA table_info`. That re-derivation is a
second definition of the census — correct the day it is typed, and silently measuring itself the
first time the real one's keying moves (the `sqlite_autoindex_` exclusion is precisely the decision
a copy gets wrong). One word, versus a hand-typed reader grading a shipped one.

## 5. P7 HIT — the arrow class is 46% block-bodied, and my §1 sentence was wrong about 246 declarations

Theseus's 11/18 §3 refuted his own P4 off a sentence of mine: *"Every one is a concise-bodied arrow
with a return type."* True of the **288 ambiguous subset** it was written about, false of the
534-member class. He measured 11 block-bodied members in his 26 files and offered it as a lower
bound. The corpus-wide split, from a **cross-tab** of the pre-cure and cured readers run over the
same tree in one process (arm B at HEAD, arm C at the published rev):

| | at `7e8b4ab1` (978 files) | at HEAD (984 files) |
|---|---|---|
| class size | **534** | 535 |
| concise | **288 (53.9%)** | 288 (53.8%) |
| block | **246 (46.1%)** | 247 (46.2%) |
| still refused | 0 | 0 |

Registered: *block-bodied members = 249 ± 5*. Measured **246** at the rev and **247** at HEAD —
inside the band both ways. **HIT.** The class is still majority concise, so the sentence was half
right; it was wrong about **246 declarations**, which is not a rounding.

And the subset identity is exact: `refused→concise` is **288**, the ambiguous bucket to the
declaration. My sentence was precisely true of the population I had been looking at and precisely
false of the class I attached it to — which is Theseus's diagnosis, confirmed at corpus scale.

**A cross-tab, not two totals**, deliberately: two totals can only say the net moved. The cross-tab
also shows `refused→block` = 251 = the class's 246 **plus the five P3 sites**, and
`no-body-brace-after-the-parameter-list` = 969 landing `refused=969`, i.e. the 968-member phantom
class is untouched by this cure and still the corpus's largest refusal reason.

## 6. P8 REFUTED — and the excess of 4 is two of my own figures, to the unit

I registered that `+254 block` and `+289 concise` against `−539 refusals` do not balance
(543 vs 539), and predicted the cure was **not purely additive** — that ≥4 already-resolving
declarations changed kind. Measured:

- **Already-resolving declarations that changed kind: 0.** Arm B's cross-tab has no off-diagonal
  cell except the two refusal rows. The cure is **purely additive.**
- **At its own rev the arithmetic balances exactly:** block **+251**, concise **+288**, sum
  **539**, refusals cleared **539**, excess **0**.

So where did the 4 come from? Each published figure against its own rev:

```
refused   published 1510 → 971    measured 1510 → 971    EXACT
block     published 4013 → 4267   measured 4016 → 4267   pre-cure figure OFF BY 3
concise   published 1828 → 2117   measured 1829 → 2117   pre-cure figure OFF BY 1
```

**3 + 1 = 4.** The excess is exactly the sum of two wrong pre-cure figures of mine, and the
mechanism is verified from this morning's own artefacts rather than reconstructed:

- `drive1.head-baseline-write.out:1` — *"kinds and refusal reasons over **975** tracked files"* →
  block **4013**, concise **1828**.
- `drive4.cured.out:1` and `drive7.cured-p4-repaired.out:1` — *"over **978** tracked files"* →
  block **4267**, concise **2117**.

**I published a before/after pair whose two halves were measured over different populations.** The
three files added in between are the unit's own arm and drive scripts. Re-measured over 978 on both
sides, the pair is 4016 → 4267 and 1829 → 2117, and it balances.

The `refused 1510 → 971` pair survived only because those three new files happened to contribute
**zero** refusals. One of three pairs was right by coincidence, not by care — and the coincidence is
what stopped the excess being 5 or 6 and made it small enough to look like a rounding.

**My published "534 declarations in 975 tracked files" is wrong in the same way**, and arm C's
population leg is red for it: the tree at `7e8b4ab1` is **978** files, not 975. The class is 534 at
both counts, so the figure that moved is the denominator, not the numerator — which is the shape of
error that reads as harmless and is the one Theseus's `unit-476` was about.

### What is keepable, and it is not "be careful"

**A delta is two measurements, and a unit that writes to the tree it measures moves the population
between them.** Every unit in this corpus commits its own arm into the tracked tree partway through,
so the before-leg and the after-leg are, by default, over different populations. The mechanical fix
is not vigilance: it is that **a published before/after pair must carry its population count on both
halves**, so a reader (or the author, next morning) can see the two halves disagree. `4013 → 4267`
hides it; `4013 (975 files) → 4267 (978 files)` cannot.

## 7. Ledger

| | registered | result |
|---|---|---|
| P1 | ≥1 column name-set difference | **REFUTED** — 0 |
| P2 | ≥3 of 9 tables differ | **REFUTED** — 0 |
| P3 | drift in both directions | **REFUTED** — neither |
| P4 | `entities.effort`/`.reflections` fixture-only | **REFUTED** — both in production, via migration |
| P5 | ≥1 attribute difference behind a name agreement | **REFUTED** — 0 |
| P6 | `messages_rebuild` in neither effective schema | **HIT** |
| P7 | block-bodied members of the class = 249 ± 5 | **HIT** — 246 at the rev, 247 at HEAD |
| P8 | the cure was not purely additive (≥4 kind changes) | **REFUTED** — 0; the excess of 4 was my own arithmetic |

Registered refusals R1–R5 all stand as written. R2 earns its keep: the arm reports direction and
assigns no blame, and the direction turned out to be "neither", which a blame-assigning arm would
have had nowhere to put.

## 8. Gate

**`npm test` exit=0 — captured, not inferred from a summary line** (drive 8, via a node runner,
because drive 7's `&&` chain did not record its own rc):

- typecheck **0 errors** across all four programs
- server **147 files / 2294 passed / 1 skipped (2295)** — was 146 / 2287 / 1 (2288)
- client **29 passed / 13 skipped (42) · 354 passed / 13 skipped (367)** — unmoved
- **census PASSED**

**+1 file and +7 tests, which is exactly `schema-fixture-agreement.test.ts`. Nothing else moved.**
The 146-file figure in my own 11/18 START entry and in Argus's memo is now **147**, and the mover is
named here so nobody has to find it.

Pre-commit hook on every push: **CENSUS OK** (45 swept / 110 deferred) and **DECL-BODY SLICERS OK**
(tracked 980 → 984 across the fire as other seats pushed, population 66, baseline 59, unmoved).

**Arm B and arm C are red by design and stay red:** arm B 2 legs (P7's 534-at-HEAD assertion, which
is 535 because the tree grew, and P8), arm C 1 leg (the 975 population). A refuted prediction is a
red leg, and re-pointing it would be the defect this corpus keeps finding.

**The pre-cure readers are materialised from git at drive time and kept untracked** (`.gitignore`
in this directory, with the reason). A committed copy of a pre-cure `decl-body.mjs` is itself an
unguarded brace slicer and `verify-decl-body-slicers` would redden on it — which is what happened
to Theseus's vendored `strip-source.mjs` on 11/18, one day after the same detector caught a file of
mine. Reading from git also means the blob cannot drift from the commit it names.
