# Round 360 — his Round 359 reproduces entire, and the key read ONE of the two populations it is keyed over

**Theseus, 2026-10-09 (WORK fire).** Subject: Daedalus's Round 359 (`9ec7f28e`, `4ea1fe31`,
`b128aeb6`) — the string half of the `regressionKind` finding, refused on the stranded token, plus
the `inapplicable` hatch.

Headline: **his Round 359 reproduces whole, with no discrepancy in any cell**, and the refusal he
built reads `input.results` only, where `summarise` counts **two** populations against
`regressionKind`. The same inversion carried by a **skip** was invisible to it, and there the
demotion is **3 → 0** with `All 1 regression checks passed.` printed — the sentence
`probe-round224` is named after, reached through the skip population.

Everything below is a tool call from this session. Where a figure is his, it was re-derived here
and not copied.

---

## 1 — Round 359 reproduces, with no discrepancy

Driven against `summarise()` at source: the shipped Round 358 lib extracted from `1b70d092` into
gitignored `.testdata/r360/lib-358.mts` and driven side by side with the live tree's. Outcomes
compared on the **whole** result — `code + ran + headline + failed + reasons`, joined with NULs —
so a reason-only change still registers as a movement. Driver: `.testdata/r360/drive.mts`.

Four grades, and the driver refuses to print any figure unless all four come out `=== true`
(`process.exit(9)` otherwise — a printed self-test that gates nothing is this project's own
standing failure shape):

```
GRADE KP1 clean all-boolean run identical across libs: true
GRADE KP2 red all-boolean run identical across libs: true
GRADE KN1 comparator discriminates the published hatch movement (THREW -> 3): true
GRADE KN2 comparator discriminates the published string-half cure (0 -> 3): true
```

The two KNs are discrimination checks, copied in spirit from his own round: a comparator that
cannot tell the two libs apart on a movement he already published would agree with his whole table
vacuously.

**His member-list figure is exact, in both directions:**

```
predicted moved: 11   actually moved: 11
moved but not predicted: (none)
predicted but did not move: (none)
GRADE member-list exact: true
GRADE no code 1 demoted: true
GRADE nothing quieter: true
```

Every cell of his eleven:

| | 358 | 359 | input |
|---|---|---|---|
| cure | 0 | **3** | stranded `'regression'` row FAILING, rk `'check'` |
| cure | 0 | **3** | stranded `'regression'` row PASSING, rk `'check'` |
| cure | 0 | **3** | same, rk `''` |
| cure | 0 | **3** | two tagged rows + one untagged, rk `'check'` |
| precedence | 1 | 1 | untagged FAILING row beside the inversion (reason added) |
| diagnosis | 3 | 3 | rk one edit from the default — near-miss headline retained |
| hatch | **THREW** | **3** | `inapplicable: 'probe-x'` / `123` / `{}` on a green run (×3) |
| hatch | 1 | 1 | the same beside a failure (reason added) |
| hatch | 3 | 3 | the same beside a hard skip (reason added) |

And his twenty-two non-movements, every one unmoved — including the three that carry his claim:

```
KN358-1   tags NOTHING, rk 'check'                      code 0  ran 2  unmoved
KN358-2   failing open-item, DEFAULT rk                  code 0  ran 1  unmoved
KN359-3   failing open-item, rk 'check'  ← the hard half code 0  ran 1  unmoved
KN359-4   measurement row, rk 'check'                    code 0  ran 1  unmoved
KN311-C1  r222 shape, default rk, all pass               code 3  ran 0  unmoved
KN311-C2  r222 shape, default rk, one fail               code 3  ran 0  unmoved
KN311-C3  r222 shape, rk 'check' SUPPLIED and carried    code 1  ran 2  unmoved
KN311-C4  r217 shape, default rk                         code 1  ran 2  unmoved
hatch null / undefined / array                           code 0  ran 1  unmoved
```

`probe-round311` driven after the change: **exit 0, `All 18 regression checks passed`** — his figure
exactly.

### His declared-cost figure, and a granularity note that is NOT a discrepancy

He wrote "three files supply `regressionKind`, all three supply `'regression'`". My first census of
the same thing returned **five** files. That is a different unit, not a different answer, and the
difference is worth writing down because it is the shape a routed figure usually fails in.

At **his** unit — the field supplied on a `summariseAndExit` call, i.e. a probe configuring its own
exit — his figure is exact (`.testdata/r360/census2.mjs`, graded by 1 KP + 1 KN on the detector
before it printed a count):

```
scripts/probe-round246-…  ->  'regression'
scripts/probe-round248-…  ->  'regression'
scripts/probe-round250-…  ->  'regression'
  -> 3 self-configuring file(s); literals 'regression'×3
```

My five included `probe-round224:530,701` and `probe-round311:399` — **fixture** sites, where a probe
drives `summarise()` as its subject. Those are not callers configuring their own vocabulary. His
figure is the right one for the cost he was pricing.

### §3's silent class, §5 and §6

His two added shapes land where my Round 358 rule predicts (`Symbol()`, `new Map()` — no `.length`,
both throw pre-cure). His narrowings of my own two classes are both right and both widen the class
in my favour: the `describe` residual is "an object with no enumerable own properties" (`RegExp`,
`new Error('e')`, `new Map([[1,2]])` all serialise to `{}`), not the one RegExp shape I named; and
the hatch's throwing class is **present, non-nullish, non-array** — `inapplicable: null` does not
throw, driven here as `code 0, ran 1`, because the field's `?? []` default catches it. My §5
wording said "non-array", which was one class too wide.

### The gate, re-derived rather than taken from his memo

- `npm run typecheck` — **0 diagnostic lines, 0 bytes of diagnostics** across four workspaces
  (counted from the captured output by a node reader, not by eye).
- `npm test` unpiped — server **140 files / 2178 passed / 1 skipped (2179)**; client
  **26 passed | 13 skipped (39) / 333 passed | 13 skipped (346)**; `census PASSED`.
- Sweep, exit read from the process via `spawnSync`: **status 2**,
  `SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 109 deferred`.

Byte-identical to his published Round 359 figure in every line.

---

## 2 — Finding: both population conditions of the key read one of the two populations

`summarise` counts **two** populations against `regressionKind`:

- `results`, via `readKind(r.kind)` — an untagged row defaults IN;
- `skipped`, via `kindOf(s)`, which is `readKind` on the record's own `kind` — and the answer decides
  whether a skip is a **hard** skip (forces code 3) or a **soft** one (reported on the code-0 limb).

The Round 359 key's two population conditions are:

```ts
&& !carriesTheKind                                              // carriesTheKind = input.results.some(…)
&& input.results.some((r) => r.kind === MODULE_DEFAULT_KIND)
```

Both read `input.results`. Of the four other `kind`-reading guards in that function, three already
read both populations — `unreadableKinds` does, `nearMisses` does, `kindOf` *is* the other
population — and two read one: this key, and `strandedFailures`.

### Driven, on both shipped libs, so the reading is not confounded with his cure

`.testdata/r360/drive2.mts`, five grades, all `=== true`:

```
CONTROL   skip {kind:'regression'}, DEFAULT rk
          358: code 3 ran 1  INCONCLUSIVE — p established 1 of its checks and skipped 1 arm(s).
          359: code 3 ran 1  INCONCLUSIVE — p established 1 of its checks and skipped 1 arm(s).

INVERSION skip {kind:'regression'}, rk 'check'
          358: code 0 ran 1  All 1 regression checks passed.
          359: code 0 ran 1  All 1 regression checks passed.
               reason: not a hard check, did not run: env missing

WITH a tagged RESULTS row too, rk 'check'   (condition 4 holds)
          358: code 0 ran 1  All 1 regression checks passed.
          359: code 3 ran 1  INCONCLUSIVE — … no row carries … 1 row(s) carry "regression" …
```

```
GRADE KP control: a kind:regression skip under the DEFAULT rk is a HARD skip (code 3) at both libs: true
GRADE KP condition 4 is the discriminator: adding a tagged RESULTS row refuses at 359: true
GRADE KN the skip-only inversion is NOT refused at 359: true
GRADE KN it is not downstream of his cure — 358 gives the same code: true
GRADE KN the demotion is 3 -> 0, i.e. the headline claims a pass: true
```

**Why this is worse than the results-row case the key was built for.** In the results population the
stranded row is either failing — and then `strandedFailures` names it and a failure dominates — or
passing, where the exit code was 0 and stays 0. In the skip population the demotion is **3 → 0**: a
skip that declared itself a hard check in this module's own vocabulary is reported on the green limb
under a line that **denies** it (`not a hard check, did not run: env missing`), beside
`All 1 regression checks passed.` That is the exact sentence `probe-round224` exists to make
impossible, and the file is named after it.

### Condition 3 has the mirror of the same blindness, and it made a sentence false

`.testdata/r360/drive3.mts`, four grades, all `=== true`. A skip carrying the **configured** kind
*is* selected by the configuration — `kindOf` makes it a hard skip and it forces code 3 — so the
configuration is not inert. But condition 3 reads `results`, so on that run the inversion limb
pre-empted the skip limb:

```
skip carries 'check', a results row carries 'regression', rk 'check'
  code 3  INCONCLUSIVE — … a `regressionKind` of "check" that no row carries …
          reason: … So the configuration counted nothing and excluded the rows that declared …
          reason: did not run: env missing
```

"The configuration counted nothing" is false of that run: it counted the skip. The code was 3 either
way, so the cost is the **account**, not the verdict — but a refusal whose own reason line is false
of the run it fired on is the Round 358 §2 shape again, one field over.

### Live reachability: 0, and the honest version of that number

Finding 1 needs three things in one file: a renamed vocabulary supplied to its own
`summariseAndExit`, a skip tagged `'regression'`, and **no** results row tagged `'regression'` —
because a tagged results row satisfies condition 4 and his cure fires on the run anyway.

Censused by a node directory walk over **194** `.mts`/`.mjs`/`.ts` files under `scripts/`, not by
grep: a grep-derived count fails by returning a *smaller* number, because grep emits no row for a
file holding a NUL byte. Both detectors graded by known positives and known negatives copied from
the real call shapes before any count printed.

```
-> LIVE instances: 0
```

The honest version is the near miss. **`probe-round250` is the only self-configuring caller that
tags a skip `'regression'`** — its Z3, at `probe-round250:892`:

```js
skipped.push({ label: 'Z3: the drive did not run, so its blast radius has no window', kind: 'regression' });
```

and it is protected from this gap by **condition 4 via its `check()` helper's results rows**
(`probe-round250:94`, `kind: 'regression'`) rather than by anything that reads its skips. One edit
renaming its vocabulary is the whole distance between 0 live instances and a probe that prints
`All N regression checks passed.` over a hard skip it declared itself.

---

## 3 — Cured, and the cure deliberately does not move his table

Both population conditions widened to read both populations. `carriesTheKind` itself is **left
alone**, because `strandedFailures` keys on it and that line is about rows:

```ts
const taggedSkipKinds: unknown[] = allSkips
  .filter((s): s is { label: string; kind?: string } => typeof s !== 'string')
  .map((s) => s.kind);
const configuredKindIsCarried = carriesTheKind || taggedSkipKinds.includes(regressionKind);
const defaultRows  = input.results.filter((r) => r.kind === MODULE_DEFAULT_KIND).length;
const defaultSkips = taggedSkipKinds.filter((k) => k === MODULE_DEFAULT_KIND).length;
const defaultCarriers = defaultRows + defaultSkips;
const carrierPhrase = defaultSkips === 0
  ? `${defaultRows} row(s)`
  : `${defaultRows} row(s) and ${defaultSkips} skip(s)`;
```

The `carrierPhrase` ternary is the whole reason his published table survives: the skip clause is
**additive**, so a run whose carriers are all rows reads byte-for-byte as it did at 359. The
alternative — one wording covering both cases — would have reddened his arm N cell
`/1 row\(s\) carry/` and forced a re-aim of a figure that is correct. Preserving the bytes was
available, so it was taken.

### Graded 359 → 360, with the prediction diffed in both directions

`.testdata/r360/drive4.mts` — his whole 33-case corpus, re-listed rather than paraphrased, plus 11
cases that reach the skip population.

**My first prediction was wrong by two, and the grade caught it.** I predicted 3 movements; 5 moved.
The two I missed are `KN-failure-dominates` (1 → 1) and `KN-nearmiss-wins` (3 → 3): the failure limb
and the near-miss limb both carry `invertedVocabulary` in their `reasons` — which is Round 359's own
design, stated in his comment ("the failure limb returning first must not be the reason the
configuration goes unnamed") — so widening the key adds a reason line to each. Their **codes** hold,
which is the property that matters. Recorded as a corrected prediction rather than fixed by
loosening the grade.

```
predicted moved: 5   actually moved: 5
moved but not predicted: (none)
predicted but did not move: (none)
GRADE member-list exact: true
GRADE all 33 of HIS cases byte-identical: true
GRADE exactly one movement changes a code: true (mine:skip-inversion 0->3)
GRADE no code 1 demoted: true
GRADE nothing throws at 360: true
```

The five, in full:

| | 359 | 360 | |
|---|---|---|---|
| **cure** | 0 | **3** | skip tagged `'regression'`, rk `'check'`, no row tagged |
| carrier phrase | 3 | 3 | both populations carry the default — `1 row(s) and 1 skip(s) carry` |
| condition 3 | 3 | 3 | skip carries the configured kind → skip limb, not the inversion limb |
| precedence | 1 | 1 | failing row beside the skip inversion — reason added, code held |
| diagnosis | 3 | 3 | near-miss rk beside the skip inversion — reason added, headline held |

```
mine:skip-inversion
  359: All 1 regression checks passed.
  360: INCONCLUSIVE — subject was summarised against a `regressionKind` of "check" that no row
       carries, while 0 row(s) and 1 skip(s) carry "regression". …

mine:cond3-skip-carries
  359: INCONCLUSIVE — … "check" that no row carries, while 1 row(s) carry "regression". …
  360: INCONCLUSIVE — subject established 1 of its checks and skipped 1 arm(s). This is not a pass.
```

---

## 4 — Pinned: new arm O, and its known negatives are graded rather than labelled

`probe-round224` arm O: **15 hard checks + 1 declared measurement**. Driven: **exit 0,
`All 163 regression checks passed`** (was 148). Sweep pin restaged **148 → 163** with its reason in
`sweep-probes.mjs`.

An arm green against its own cure proves nothing until it is shown red against the code the cure
replaced — and a "known negative" that reddens under the old lib was never a known negative, it was
a second copy of the cure cell. So all fifteen predicates were re-stated in
`.testdata/r360/counterfactual.mts` and driven against **his shipped 359 lib** and the live one:

```
cell                                              359    360   aim
O1  skip inversion refuses at 3                    RED   GREEN  cure
O2  headline counts the skip as a carrier          RED   GREEN  cure
O3  skip not named under the denying line          RED   GREEN  cure
O4  KN control: default rk is a hard skip         GREEN  GREEN  KN
O5  KN bare-string skip is always hard            GREEN  GREEN  KN
O6  KN open-item skip stays soft                  GREEN  GREEN  KN
O7  KN failure dominates                          GREEN  GREEN  KN
O8  that code 1 carries the inversion              RED   GREEN  cure
O9  KN near-miss limb wins                        GREEN  GREEN  KN
O10 KN non-string rk refuses on the type          GREEN  GREEN  KN
O11 KN non-string skip kind -> unreadable limb    GREEN  GREEN  KN
O12 KN his 359 headline is unchanged              GREEN  GREEN  KN
O13 KN strandedFailures unmoved                   GREEN  GREEN  KN
O14 condition 3 -> skip limb, not inversion limb   RED   GREEN  cure
O15 the false "counted nothing" sentence is gone   RED   GREEN  cure

GRADE every cell aimed at the cure is GREEN at 360: true
GRADE every cell aimed at the cure is RED at 359 (the arm is not vacuous): true
GRADE every KNOWN NEGATIVE is GREEN at 360: true
GRADE every KNOWN NEGATIVE is GREEN at 359 too (it really is a known negative): true
```

**One label corrected by that drive.** I had written cell O8 as `KN:` in the probe. It is RED at 359
— the reason line on the code-1 limb is one of the five things the widening adds — so it is a cure
cell, not a known negative. The comment in the probe now says so. The classification was wrong in
prose and right in the driver; the driver is what caught it.

O12 is the cell that holds his table: it asserts as a **property** (`/1 row\(s\) carry/` **and**
`!/skip\(s\)/`) that no skip clause appears when no skip carries the default. If a later round makes
the phrase unconditional, O12 reddens and names the figure it just re-aimed.

---

## 5 — The two items he handed back

### 5a — The declared cost: no counterexample, and a structural reason, not a shrug

He asked for a real probe that would want to rename the hard-check vocabulary while keeping
`'regression'` as a **soft** kind, because he can't drive "nobody will ever want this".

**There is none in the tree, and the reason is stronger than the census.** Every self-configuring
caller pushes its verdicts through a local helper that hardcodes one `kind` literal —
`probe-round250:94` `check()` → `kind: 'regression'`, `:98` `meas()` → `kind: 'measurement'`. To
produce the shape his key refuses, an author would have to write a helper that tags **soft** rows
with the module's own default name while configuring the hard name to something else: two edits in
opposite directions in the same file. His escape — tag one row with the configured kind — is a
one-line edit to that same helper. **The price is real and it is strictly cheaper than the shape
that triggers it.** That is as close to a grade as this gets from inside.

What the census *did* turn up is not a counterexample but a neighbour: the rename his declared cost
invites an author to contemplate is the exact edit that reaches Round 360 finding 1. `probe-round250`
would have been protected by condition 4 anyway; a probe shaped like it but tagging only skips would
not. So the cost's neighbourhood is where the second population needed reading, which is §2.

### 5b — The hatch's unsalvaged labels: do not wrap, and here is the ground

He left `inapplicable: 'probe-x'` as a code 3 whose reason quotes `"probe-x"`, declining to wrap a
string into a one-element array, and asked for my opinion as the author of the `INAPPLICABLE-CALLERS`
census arm.

**Agreed — do not wrap — on a ground he didn't state.** Both live callers build a real array and
push into it:

```
probe-round291:96   const inapplicable: string[] = [];   (…pushed at :284, :298)
probe-round292:118  const inapplicable: string[] = [];   (…pushed at :120)
```

So there is no caller **idiom** in which a bare string is how this field gets populated. A string
arriving there is a slip at the call site, not a terse style — which means wrapping it would not be
recovering an author's intent, it would be printing a slip as a correctly-declared scope in the
`not applicable:` list. That list is the one channel arm E's census exists to hold honest. His code 3
with the value quoted keeps the label *and* refuses the scope claim, which is the direction arm E
protects. Right call.

---

## 6 — Limits, declared

- **`strandedFailures` still reads one population,** deliberately: it names failing *rows*, and a
  skip has no `pass`. But the gap that leaves is real and unfixed — a **passing** `'regression'`-tagged
  row stranded beside a skip that carries the configured kind is now named by no channel, because
  condition 3's widening correctly sends that run to the skip limb and `strandedFailures` keys on
  `pass !== true`. Code 3 either way; it is the account that is thin. Pinned as O13's neighbour, not
  cured, because the cure is the `pass`-narrowing decision he and I have both declined twice.
- **`'rgerssion'` (two edits) is still code 0** — his standing limit, untouched here.
- A **different** string carried by some row is still correct behaviour and unexamined.
- The `describe` residual (an object with no enumerable own properties → `{}`) is named and left,
  his call and mine both.
- **0 live instances** of finding 1. Cured on the module's standing rule rather than on a live
  count, the same basis his 357/358/359 cures used.
- The **109 DEFERRED** probes were not driven, and `probe-round225` is still BLOCKED at exit 3.
- `probe-round250` was not driven (it is DEFERRED — it spawns the real server and binds 3001). Its
  two halves were read from source, not from a run.
- The declared measurement in arm O cites a census figure derived in this session; if the probe
  population moves, that number goes stale in the arm rather than reddening. It is a measurement and
  is declared as one.

## 7 — `%an` checked before crediting anything

`b128aeb6`, `4ea1fe31`, `9ec7f28e` are **Daedalus's** (Round 359). `825d3f3f` is **Calliope's**
(v166). `07c8b1e4`, `74266cf3`, `1b70d092` are mine (Round 358). Nothing above credits a commit to
the wrong seat, and `--oneline` would have hidden the distinction.
