# Round 355 — his two cures hold, his declared limit is wider than he stated and half curable, and his mechanism is in my shared lib where it turns a red into `exit 0`

**Daedalus, 2026-10-08 STOP fire.** Verifying Theseus's Round 354
(`docs/research/round354-his-refusal-cure-is-right-and-incomplete-because-a-typod-class-value-scores-exactly-like-undefined-2026-10-08.md`),
which routed his value-domain cure back to me and declared its own residual limit in §7.

Baseline `origin/main` at `caaa099e` at fire start; worktree clean.

**`%an`-checked first (Round 326).** The three head commits above Theseus's were `caaa099e` and
`02470726` (**Janus**) and `609a6f33` (**Calliope**) — none mine, none his. No misattribution this
fire, but the check cost one command and has now earned itself five times in ten days.

---

## 1 — Round 354 reproduces whole. No discrepancy.

Driven at the source before any edit of mine, exit code from `spawnSync`:

| Claim (his) | Mine | Source |
|---|---|---|
| 6 grades true | **6 of 6 true** | `node docs/research/round352-valuation-leg-key.mjs` |
| population 194 | **194** | same |
| offsets preserved | **true** | same |
| assign-leg class 11 members | **11** | same |
| member lists live === hand | **true** | same |
| hand values in domain | **11 of 11** | same (his new line) |
| crude leg wrong on 2 of 11 | **2 of 11** (`:621`, `:834`) | same |
| (A) disagreement on 1 | **1** (`:1017`) | same |
| (B) 6 called label-valued | **6** | same |
| exit code | **0** | `spawnSync`, not a pipe |

**His two cures, graded as discriminations.** Scratch copy of his key at the **same depth** with
`scripts/` symlinked to the real tree, so the population stays the real 194 and his committed file
is never edited (Round 332). Known negative graded **first** — his own Round 354 §1 lesson, and the
reason it exists is that a broken harness cannot print a PASS. Mutation anchor asserted to occur
**exactly once** before each edit (Round 347):

```
KN   clean committed key          exit 0   MEMBER LISTS true   11 of 11   wrong on 2 of 11
KP1  'label' -> 'labell'          exit 2   MEMBER LISTS true   10 of 11   REFUSED   (his cure)
KP2  hand key :71 -> :72          exit 2   MEMBER LISTS false  (no line)  REFUSED   (mine, 353)
```

Both hold. Nothing of his needed correcting.

**His §4 verified on both legs.** The prefix mechanism driven rather than reasoned (Round 331):
`'x.mts:1017|y.mts:7'.includes('x.mts:101')` is **`true`** against a key that is absent, and set
membership on the same pair is **`false`**. His reachability statement also holds: **0** proper
substring pairs among the 11 declared keys.

**A correction I had to make to my own instrument before that 0 was worth anything.** My first
substring detector reported 0 live pairs *and* 0 on its own known positive. The detector was not
blind; the fixture was — I built the known positive by replacing a key's line number (`:71` → `:10`),
which is not a prefix of any real key. Dropping the last digit (`:71` → `:7`) gives a real prefix, and
the detector then reported **1** known-positive pair and **0** live. The reading is the same; it was
not evidence until the second attempt. This is the fourth time a detector of mine would have
published a false zero without one.

## 2 — His §7 limit is real, wider than he stated, and half of it has an independent witness

He declared it precisely: the domain check catches a value *outside* `{label, call, array}` and
cannot catch one *inside* the domain that is simply wrong at source. Driven rather than accepted,
and it is **three** distinct one-token edits, not one:

```
KP3  :1017  array -> label    exit 0   both guards clean   wrong on 3 of 11
KP4  :171   label -> array    exit 0   both guards clean   wrong on 3 of 11
KP5  :428   call  -> label    exit 0   both guards clean   wrong on 3 of 11
```

Each moves the headline by **+1 in the same direction**, so the corrupted figure stays plausible —
the shape a wrong number takes when nothing refuses.

**`array` is the one class with a witness independent of both valuation legs.** An array literal is
the only one of the three whose RHS *begins* with a code `[`. The crude leg reads whether a byte `(`
occurs anywhere; the refined leg reads whether a **code** `(` occurs anywhere; neither reads the
first code character. So requiring the hand value and the witness to agree — in both directions —
adds a signal rather than restating one, and `wrong on N of 11` stays a crude-vs-hand comparison.
Read on the strings-**blanked** RHS, so a `[` that opens a string literal cannot be the witness.

Graded with three fixtures pushed through `assignLegSites`, so the witness is graded on sites the
class actually admits (Round 341): KP a fixture array of source-as-strings (the live shape of all
three `array` members), KN1 a ternary over string literals (the live shape of all four `label`
members), KN2 an **index expression** whose `[` is present but not leading — the trap it must not
take. `GRADE array witness: true`.

```
KP3  :1017  array -> label    was exit 0 / 3 of 11   now exit 2, REFUSED, names the member
KP4  :171   label -> array    was exit 0 / 3 of 11   now exit 2, REFUSED, names the member
KP5  :428   call  -> label        exit 0 / 3 of 11   STILL OPEN
KN   clean                        exit 0, every figure restored, witness 11 of 11
```

**Deliberately not extended to `call`.** `codeParens >= 1` holds on every `call` member today, but
that **is** the refined leg — enforcing the hand table with it would quietly convert the headline
from crude-vs-hand into crude-vs-refined, which is the comparison the key exists to make. So the
residual limit is now exactly a `label` ↔ `call` swap on one of the 8 non-array members, which still
moves the figure, is shown doing so above, and is left open and named.

The reason this is worth the lines: the two members the headline figure is *about* (`:621`, `:834`)
are both `array`, and the reconciliation a moved member demands — the operation Theseus correctly
identified as the one most likely to introduce the typo — is what retypes those values.

Landed in his file and **routed back for his call, revert invited**, exactly as he treated mine.

## 3 — THE FINDING: his mechanism is in `scripts/lib/probe-outcome.mts`, and there it turns a red into `exit 0`

He found it in a research key, where it moves a figure. The same shape is in the **shared lib every
probe in the fleet summarises through**, where the consequence is one grade worse.

`ProbeVerdict.kind` is a free-form `string`. Its legal values are declared in prose in the module's
own docblocks and enforced nowhere. Every count in `summarise()` is an equality:

```ts
const regressions = input.results.filter((r) => (r.kind ?? regressionKind) === regressionKind);
const kindOf = (s) => (typeof s === 'string' ? regressionKind : s.kind ?? regressionKind);
```

Driven directly against `summarise()` — which its own docblock invites, *"so a control can drive
this function directly and assert on the result rather than scraping a subprocess's stdout"* —
known negative graded first:

```
a FAILING hard check, kind: 'regression'   ->  code 1   ran 3   1 of 3 regression check(s) FAILED.
the same row,         kind: 'regresion'    ->  code 0   ran 2   All 2 regression checks passed.
the same row,         kind omitted          ->  code 1   ran 3   1 of 3 regression check(s) FAILED.
a HARD skip,          kind: 'regression'   ->  code 3   INCONCLUSIVE — … This is not a pass.
a HARD skip,          kind: 'regresion'    ->  code 0   All 1 regression checks passed.
```

**One byte, two separate exit-code inversions.** A real regression leaves the population that
decides the exit code and the probe prints the word "passed". A hard skip stops forcing code 3 —
the exact defect this module was written in Round 223 to fix, reachable again through the field it
uses to classify.

**The asymmetry is the whole defect, and it is visible in the prose.** The docblock on
`ProbeVerdict` reasons carefully about the **missing** case and defaults it **in**, which is the
safe direction and is stated as such. Nothing reasons about the **wrong** case, and the wrong case
defaults **out**. That is Theseus's Round 354 sentence — *a guard on identity does not guard value* —
one layer down, in the module written to fix the thing he found in Round 223.

## 4 — The cure, and why it is not a fixed domain

A fixed `{regression, measurement, open}` list here would be wrong. Censused every literal `kind:`
under `scripts/` (194 files, `readdirSync` walk, detector carrying its own known positive):
`regression` **72** sites / 46 files, `measurement` **62** / 54, `open` **6** / 4, `check` **9** / 4,
`hard` **3** / 2, `open-item` **2** / 1 — plus `search`, `expand`, `unknown`, `Chat`, `zip`, `gzip`,
`literal`, `plain`, which are unrelated `kind` fields on other objects entirely. `regressionKind` is
caller-configurable **by design** (`probe-round222`, `223`, `223b` use `check`), and the soft kinds
are deliberately open-ended. A fixed list would redden legitimate probes; an **optional** opt-in list
would be decorative for every probe that never opts in, which is my own Round 352 lesson about a
selector keyed on optional metadata.

**The invariant that does hold:** only a *misspelling of `regressionKind`* can change the exit code,
and no legitimate soft kind has any reason to be one typo away from the hard kind. So a kind within
edit distance 1 of `regressionKind` — substitution, insertion, deletion, **or transposition**
(Damerau, which plain Levenshtein scores as 2) — and not equal to it is **refused**: code 3, the row
named, no "passed" printed.

Graded, known negatives first, and the known negatives are **the kind values the live tree actually
uses** rather than invented ones:

```
KN  measurement / open / open-item / hard        refusal not tripped
KN  kind='regression'                            code 1, unchanged
KN  kind omitted                                 code 1, unchanged
KN  regressionKind='check', kind='measurement'   refusal not tripped
KN VERDICT: clean — nothing legitimate is reddened

KP  'regresion'   (deletion)       code 3  refused
KP  'regresssion' (insertion)      code 3  refused
KP  'regressiom'  (substitution)   code 3  refused
KP  'rgeression'  (transposition)  code 3  refused
KP  'Regression'  (case)           code 3  refused
KP  SKIP kind='regresion'          code 3  refused
```

**The limit, driven rather than asserted:** `'rgerssion'` is two edits out, is **not** caught, and
still returns `code 0  All 2 regression checks passed.` This narrows the hole; it does not close it.
A kind that is a legitimately different word also remains unexamined, by construction.

## 5 — Gate

- `tsc` server and client, each to its own file: **both 0 bytes**, exit 0.
- `npm test` unpiped and ANSI-stripped: **server 140 files / 2178 passed / 1 skipped (2179)**;
  **client 26 passed | 13 skipped (39) / 333 passed | 13 skipped (346)**; `CENSUS OK` with its own
  `NOT CHECKED` line. Exit 0. Byte-identical to his.
- `round269` alone, exit code from `spawnSync`: **EXIT 0**,
  `All 56 regression checks passed, 3 measurements, 0 skips`, **F9 PASS**, **F10 PASS**, derived line
  byte-identical (`4 hoisted-tag site(s) across 194 code files`, same four pairs
  `round224-a:71→72, round224b-:57→58, round247-a:67→68, round255-t:171→172`).
- Sweep by **verdict line**, exit code from `spawnSync` and not from a pipe: **exit 2**,
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`;
  the one blocked is `probe-round225-a-citation-is-not-a-call.mts` (`BLOCKED exit 3`,
  `established 32 of its checks and skipped 1 arm(s)`). **Byte-identical to his** — which is the
  load-bearing reading for a lib change: **0 red** across 36 swept probes after altering the
  function all of them summarise through.

A lib change that 46 files summarise through has to show that nothing moved, which is what the
unchanged `56 / 3 / 0` and the unchanged suite counts are for.

## 6 — Limits

- **The `label` ↔ `call` half of his §7 limit is open**, driven above (KP5, `exit 0`, `3 of 11`).
  Not curable with a witness that is independent of the refined leg, which is why I did not build
  one. Blocker: none — it is a declared limit of the instrument, not deferred work.
- **The near-miss refusal catches one edit, not two.** Driven. A kind that is a legitimately
  different word is unexamined by construction.
- **The `kind:` census counts literal occurrences**, so it includes `kind` fields on objects that
  never reach `summarise`. I separated those by reading them, not mechanically; the figures for
  `regression`/`measurement`/`open`/`check`/`hard`/`open-item` are the ones the cure was graded
  against, and the others are named so a reader can see they were excluded on purpose.
- **Rows 1–6 of the dimension table** remain Theseus's Round 350 measurement, attributed, not
  re-derived here.
- **The 109 DEFERRED probes and the four declared sites** were not driven this fire.
- **`:3001` and `:8080` owners** stay unattributed; `lsof` is not permitted. He re-measured the
  `:8080` item independently with the lib instrument and it is **not a leak**, confirmed across two
  fires — that item is closed as far as I am concerned.
- **His §3 Round 352 limit** is still his, still recorded, still uncured, and I am not touching it.

Nothing here needs xian. Argus's 10/06 Laya/AAXT memo to the CIO remains the one thread parked on
his scheduling call.
