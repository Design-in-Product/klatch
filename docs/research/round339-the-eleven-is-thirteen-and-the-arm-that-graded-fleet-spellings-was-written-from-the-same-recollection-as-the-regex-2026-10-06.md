# Round 339 — the 11 is 13, and the arm that graded fleet spellings was written from the same recollection as the regex it graded

**Daedalus, 2026-10-06 START fire.** Verifies Theseus's Round 338, accepts its refusal, and lands a
separate repair the verification turned up.

Baseline: `origin/main` at `b2bc3eef` on arrival, worktree clean, `HEAD == origin/main` verified by
`git fetch`. Authorship of the three `coord+log: 10/6 START fire` commits above my own last
checkpoint checked with `%an` before reading any of them as mine — they are **Iris's, Calliope's and
Argus's**, none mine, in a subject shape indistinguishable from mine at `--oneline`.

---

## 1 — Round 338's refusal is ACCEPTED, and its 11 reproduces exactly

Measured here under a key deliberately unlike his — he classified by `const measure =` helper-body
text and a file-wide `kind` scan; this one extracts each candidate helper's body by **brace
matching** and asks one question of it: does the measurement path put a label into a JS container
(`.push`/`.set`/`.add`), or only into a counter or stdout?

| his figure | reproduces here |
|---|---|
| population **194** files under `scripts/` | **194** — `readdirSync` walk, 200 files total, 194 with a `.ts`/`.mts`/`.mjs` extension (the other 6 are 2 `.json`, 3 `.sh`, 1 extensionless) |
| **33** files defining `const measure =` | **33**, exactly |
| the hole is **11** files, all counter-only | **all 11 reproduce**, and his list is a **strict subset** of mine |
| `sweep-probes.mjs:137-138` already pays for two spellings | verified in source, and it is the thread §4 pulls |
| `probe-outcome.mts` has no measurement channel (his §2) | **independently corroborated** — see §3 |

**His verdict stands and I am not re-litigating it.** Do not add a measurement channel to
`probe-outcome.mts`. His three reasons survive my own check: the grading rule is per-file
(`probe-round289`'s deliberate `[V5]` collision), the great majority of files would not adopt the
channel, and the gap has nothing live to starve. On that last point I checked the thing his memo
asserted rather than showed — **none of the 13 files has an arm that grades its own measurement
labels.** Every `new Set(…)` / `distinct` / `collision` hit in those files is domain data: entity
names, file sets, classifier shapes. Latent, not live, confirmed per file.

## 2 — But the hole is 13, and the two extra files were unreachable by BOTH of his keys

`probe-round220:62` and `probe-round221:52` each declare

```ts
function measure(name: string, detail: string) {
  console.log(`MEAS ${name} — ${detail}`);
}
```

No container, no counter — **log-only**, and declared with `function`, not `const`. By the property
his census is about (can an in-process assertion recover the measurement labels this file emits?)
both are holes. They are a **sixth shape**, and his shape table has no row for them.

**Why neither of his keys could see them, which is the part worth keeping.** His §4 offers the
convergence of two keys as the strongest available evidence: *"The narrow pass (classify only the 33
files defining `const measure =`, by helper body) and the wide pass over all 194 files return an
identical member list"* (his research doc, lines 88-91, read verbatim). The two passes differ in
**denominator** — 33 vs 194 — but share one predicate: the hole is keyed on `const measure =`. A
helper declared `function measure(…)` is outside the reach of both. **28 files under `scripts/`
declare `function measure(`** — a sub-population his narrow pass structurally excluded — and 2 of
those 28 are holes.

> **General form, and it corrects a method we have both been leaning on:** two independent keys
> agreeing on a member list is weak evidence when both inherit the same *denominator predicate*.
> Agreement rules out errors in the parts that differ, and is silent on the assumption they share.
> The repair is not a third key of the same family — it is to vary the predicate that selects the
> population, not just the one that classifies its members.

This does not weaken the refusal. It **strengthens** it: 13 latent files, none with a label arm, and
the repair when a seat next opens one is still the same two lines.

## 3 — My detector was wrong four times, and each time a graded known positive said so

Reported because the final number is only worth what the disagreements were worth, and because two
of the four mechanisms are new to this project's record.

| v | reads | the failure, and what found it |
|---|---|---|
| v1 | 9 holes | **FAIL on a known positive.** Two mechanisms at once (below). |
| v2 | 16 holes | **FAIL.** Over-matched `measure*` by name: 3 arm drivers called holes. |
| v3 | 14 holes | **FAIL.** The default-parameter brace trap (below). |
| v4 | **13 holes** | all 12 known positives PASS; stable under comment-blanked source |

**v1 mechanism (a) — I independently repeated the exact error his §4 warned about.** I let a
`results.push({kind:'measurement'})` *anywhere in the file* vouch for a counter-only `measure`
helper. His v1 did the same thing and he named the cure in the memo I had just read: key on the
measurement path, not on the file containing a kind field somewhere. It cost 5 files
(300, 303, 304, 307, 310) — every one of which he had right.

**v1 mechanism (b) — `let measurements = 0;` is not a helper.** `probe-round200:44` declares a
counter; my regex matched `measure*` and my brace matcher then walked forward to an unrelated later
block and read it as the helper's body. An invented hole in a file with no measurement helper at all.

**v3 mechanism — the default-parameter brace trap. New, and it fails toward a FALSE DEFECT.**

```ts
async function measureRoot(
  arm: string, tag: string, root: string, inv: Inventory, extraEnv: Record<string, string> = {},
): Promise<ArmResult | null> {
```

A brace matcher started at the function *name* finds the `{}` **default value inside the parameter
list** first and returns it as the entire body. The helper then reads as recording nothing, and the
file reads as a hole. The cure is to paren-match past the parameter list before looking for `{`.
Worth naming next to the "source-scanning regex fails by returning a *smaller* number" class,
because this one fails in the **opposite** direction: it manufactures a defect rather than hiding one.

**v2 mechanism — delegation.** `measureCap`/`measureRoot` in three `probe-browse-*`/`probe-pm-*`
files are **arm drivers**: they record by calling `check(arm, …, 'measurement')`, so the helper body
has no `.push` of its own. A "measurement path" key must follow the delegate.

**Comment-blanked control.** The whole key re-run over `stripSource(src, false)` (the house scanner
in `scripts/lib/strip-source.mjs`, comments blanked, string literals kept): **1 of 194 files
classifies differently, and the 13 is unchanged.** The one file is `probe-outcome.mts` itself, which
drops from GRADEABLE to NONE — its only measurement mentions are prose. That is an independent
corroboration of his §2 claim that the lib has no measurement channel, arrived at from the other side.

I also hand-rolled this detector before checking `scripts/lib`, and used `strip-source.mjs` only as
an after-the-fact control. The lib should have been the starting point.

## 4 — THE LIVE FINDING: four fleet spellings, not two — and the arm guarding that could not fail

`sweep-probes.mjs` has said this since Round 269, and it is the sentence §1's last row sent me to:

> *there is no single fleet spelling to check for: `probe-round225` prints `MEAS [F] …` while
> `probe-round265` prints `  [C] MEAS  …`. So `measurementCheck` counts both spellings off the output*

`MEAS_LINE` encoded those two. And `probe-round269` arm F1 asserted *"measurementLines counts BOTH
fleet spellings"* — against `TWO_SPELLINGS`, a fixture **hand-written from the same two spellings the
regex already matched**. The arm was green, and green for the wrong reason: it restated the regex's
assumption instead of testing it.

**An arm whose fixture is its own hypothesis cannot fail on a case nobody thought of.** Enumerated
from the 36 swept files instead of recalled — 32 MEAS-emitting `console.log` templates, rendered and
run through the real counter — **four spellings are live and two were uncounted**:

| rendered | site | pre-339 |
|---|---|---|
| `MEAS [F] …` | probe-round225 | counted |
| `  [C] MEAS  …` | probe-round265:91 | counted |
| token-first, **indented two spaces** | probe-round224:561 | **NOT counted** |
| token **inside** the bracket | probe-round297:95 and :375 | **NOT counted** |

The first miss is the sharper one: it is the *same spelling* as probe-round225's, and the
`MEAS\s+\[` alternative had **no leading `\s*`**, so it counted at column 0 and vanished two spaces
in. The second puts `MEAS` inside the bracket, which neither alternative could reach.

**Latent, not live — and the honest reason, not a reassuring one.** Both probes are swept, but
neither entry's `why` claims a measurement count, so `measurementCheck` never graded either and
nothing was misreported. Had either entry ever claimed a count, the claim would have been silently
downgraded to *"unenforceable prose"* while the probe was in fact emitting countable lines.

**Price of widening, measured before shipping: zero.** All **7** count-claiming entries emit exactly
one countable shape each, and the two new alternatives add nothing to any of them. Both
originally-matched spellings still count — asserted, not assumed.

**Counterfactual driven, because an arm that cannot fail is the thing this section is about.** F6's
exact logic against the pre-339 regex reports **3 uncountable**; against the new one, **0**. The arm
is not vacuous.

### What landed

- **`sweep-probes.mjs`** — `MEAS_LINE` widened to all four spellings, each documented from a real
  emitting site. Append-only.
- **`probe-round269` F1** — fixture rebuilt from all four real renderings, and it now asserts the
  original pair still counts, so the widening cannot silently drop a spelling.
- **`probe-round269` F6, new** — the spelling set **DERIVED** from `SWEPT` source: every
  MEAS-bearing line any swept probe emits must be countable by the fleet counter. A fifth spelling
  reddens this instead of hiding. Comments are blanked through `stripSource` first so a commented-out
  emitter is not mistaken for a live one.
- Entry restaged: `expect` `/All 51…/` → `/All 52…/`, `why` 51/51 → 52/52. Measurements unchanged at 3.

**This is a population-wide arm, and Round 338 refused a population-wide channel — so I applied his
own general form rather than reasoning by analogy.** `measurementLines` is ONE shared counter that
every swept entry's measurement claim is graded against, so "is every emitted shape countable" is a
property **of the population**. The label-collision rule Round 336 measured belongs to each **file**
(`probe-round289`'s `[V5]` is deliberate), which is why that arm stayed file-local and this one does
not. Same test, opposite answer, and the test is what decides it.

## 5 — Two stale committed comments, both corrected from the run

1. **A file carried both a claim and its own refutation, 300 lines apart.** The entry comment above
   `probe-round269` ended: *"Every other entry claiming a count emits nothing countable and is
   annotated as unenforceable prose."* The header paragraph 300 lines up had **already retracted
   exactly that guess** (*"this paragraph first said that most swept probes print no measurement
   line … That was a guess and it was wrong"*). The correction landed in one place and not the other.
   Settled off the driving run, not off either comment: the sweep prints `note — …` for every
   unenforceable claim and **the run emitted no such line**, so all 7 claims are graded.
2. **"All 6 entries claiming a count"** was true when written; Round 324's entry made it **7**.
   Re-counted off `SWEEP` rather than carried forward. Annotated rather than rewritten — the
   historical sentence describes a past run and stays.

## 6 — Three mistakes of my own in landing this, all caught by driving

- **`expect: {}` was never empty.** I read every entry's pin with `JSON.stringify(e.expect)` and with
  `Object.keys(e.expect)`, and **both render a RegExp as `{}`** — so I recorded "no pin" for pinned
  entries and shipped a `why` figure that contradicted a pin I believed absent. The census caught it:
  *"why says 52 where expect pins 51"*, and `expect` is `/All 51 regression checks passed/`. A reader
  that prints entry shape that way reports every pinned entry as unpinned. (The 224/297 finding in §4
  does not rest on this — it rests on `why` having no measurement claim, read from the string.)
- **My own new comment reddened `probe-round308` B1.** The pointer detector pairs every
  `probe-roundNNN` on a line with every `[A-Z]\d+` on the same line. My fixture lines put a rendered
  `[A1]` next to a citation of the file it came from, which reads as an unexplained pointer to that
  file's arm A1. Fixed by putting attributions on their own lines, in both files, with the reason
  recorded at both sites so the next seat does not undo it. B1 back to 6 of 6 explained.
- **A type error I would have shipped if I had trusted the sweep alone.** `SWEPT as Array<{file:
  string}>` — `SWEPT` is `readonly SweptEntry[]`, so the cast is TS2352. It reddened `probe-round303`
  D2/D3 and `probe-round304` **through the typecheck, two probes away from anything I touched**, and
  reported as *fewer* widening errors than pinned rather than as an error in my file. The cast was
  unnecessary.

**First drive after the change: 6 red, 1 census problem.** Final: baseline restored. Worth stating
plainly — the cure needed three repairs of its own, and none of the three was visible by reading.

## 7 — Gate

Both halves run on the final tree, unpiped, each read from a captured file.

- `npm test` — **0 `error TS`**; server **140 files / 2178 passed / 1 skipped**; client
  **25 passed / 13 skipped**; `CENSUS OK`; swept **36**.
- `npx tsc -p scripts/tsconfig.json --noEmit` — **clean, 0 errors** (1 error before the cast fix).
- `node scripts/sweep-probes.mjs --drive`, verdict line read rather than the exit code (exit 2 is
  BLOCKED): **`SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude),
  0 census problem(s), 109 deferred`** — identical to Argus's 09:0x baseline on this tree.
- Blocked probe is `probe-round225`, port 3001, the standing long-running occupant owned by `xian`.
  Not this fire's, unmoved since Round 291.
- `probe-round269` standalone: **`All 52 regression checks passed, 3 measurements, 0 skips`**,
  F1 and F6 both PASS. `probe-round308`: **`All 23 regression checks passed.`**, 8 measurements,
  31 labels all distinct.
- No server started, no port bound, no database opened, no model called. Scratch under
  `.testdata/r339-daedalus/` (`.gitignore:33`), uncommitted.

## 8 — Open

- **Closed from my side:** Round 338's refusal, accepted. No measurement channel in
  `probe-outcome.mts`. His 11 verified; the population is 13 by the same property.
- **For Theseus, not taken by me:** `probe-round220:62` and `probe-round221:52` are the 2 extra
  holes. Same disposition as his 11 — adopt the ids array when a seat next opens one of them for its
  own reasons. Recorded so the next census does not read them as new.
- **Landed:** the four-spelling repair and arms F1/F6, graded and gated.
- **Named, not taken:** `probe-round240:63`'s template-string label (his §7), unchanged and still
  depended on by nothing.
- **Not mine, unmoved:** `probe-round225`'s port-3001 block.
- **Parked on xian, unchanged:** the entity-delete thread; the CIO Laya/AAXT memo (`to: themis,
  argus`).

**Nothing in this fire needs a decision from xian.**
