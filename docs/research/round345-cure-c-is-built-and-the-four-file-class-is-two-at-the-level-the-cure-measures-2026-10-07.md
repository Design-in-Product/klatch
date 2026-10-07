# Round 345 — CURE C is built, graded and landed, and the four-file class is two at the level the cure measures

**Daedalus, 2026-10-07 (START fire).** Baseline `origin/main` at `ca84bb6e`, clean. Takes
Theseus's Round 344 routed item — **CURE C**, priced there but explicitly not built and not
validated.

Driving sweep rendering of this fire's own arm, read off the run and not retyped:

```
  [F8] PASS  F6's own selector reaches every swept file that writes a MEAS label, and the
             files it cannot reach are declared, rendered and countable
```

## 1 — The finding reproduces exactly

Independently keyed (see §2), not re-run from his script:

| claim | Theseus (344) | mine |
|---|---|---|
| `probe-round255` is SWEPT | yes | **yes** |
| the blind site | `:171-172`, hoisted ternary | **`:171`, hoisted ternary** |
| `renderMeasMentions` on 255 | 0 | **0** |
| swept files blind to the renderer | 1 | **1** |
| the rendering is countable | yes | **yes** (`measurementLines` = 1) |

So F6 was grading **35 of its own 36 swept members** and reporting no gap. Confirmed.

## 2 — The independent key, graded before any figure was read off it

The key does not look at `console.log` at all — if it did, it could not grade the renderer. A MEAS
token is string-literal body **iff** the strings-blanked `stripSource` reading is blank at exactly
those four offsets. Both readings preserve every offset, so the offsets do all the work and **no
span is ever extracted**. That is deliberate: Round 344 lost a detector to the span route, which
returned 146 false defects against a true 0, because `stripSource` emits `${` verbatim and a space
inside a string blanks to a space. Offset-wise there are no edges to find.

Graded on shapes copied out of the tree, not typed:

| fixture | real site | want | got |
|---|---|---|---|
| hoisted ternary | `probe-round255:171-172` | key sees, renderer misses | **true / 0** |
| interpolated identifier | `geometry-distance-arm.mjs:102` | not a literal | **not a literal** |
| commented-out emitter | — | not a literal | **not a literal** |
| summary line | `probe-round240:474` | is a literal | **is a literal** |

`offsetsPreserved` is asserted on every swept file each run rather than assumed — it is the key's
premise, and a premise this arm cannot see broken is a premise it is trusting.

## 3 — What landed: F8, declared and two-sided

`scripts/probe-round269-…mts`, 53 → 54 checks. The arm asserts the set of swept files invisible to
F6's renderer **equals** a declared list, so it reds in **both** directions: a new blind file reds
it, and a declared file becoming visible reds it too, so the list cannot go stale. Each declared
entry carries the line it really renders and the arm asserts the fleet counter counts that line —
what F6 would have concluded about the member it cannot see is stated and checked, not left blank.

**Declared rather than complete, and that is a measurement not a concession.** `probe-round280`
renders its label through a `record(id, 'MEAS', text)` helper whose MEAS branch arrives as a
**function parameter**. No regex renderer resolves that, so "the renderer must see everything" is
not a cure that can be written; a ledger that reds on drift is.

### Counterfactual grading — a fixture that cannot fail before the cure is not a test

Driven in a `git init`'d scratch copy of `scripts/` under gitignored `.testdata/`, so no other
seat's tree was edited. **Scratch baseline: F8 PASS, 4 unrelated failures** (J1/J2/J5/J6, minted-
fixture arms that need the real repo paths) — stated because a red is only attributable against a
known baseline.

| counterfactual | conjunct under test | result |
|---|---|---|
| declaration removed | invisible-but-undeclared | **F8 FAIL** (5 of 54) |
| stale declaration for a visible file | declared-but-not-invisible | **F8 FAIL** (5 of 54) |
| declared rendering made uncountable | the countability leg | **F8 FAIL** (5 of 54) |

Each adds exactly one failure to the baseline's four. All three conjuncts red independently.

## 4 — Two corrections to the routed finding, both measured

**4a. The four-file class is two at the level CURE C measures.** Round 344 names
`round280/281/282/284` as the helper-emitter class. All four are genuinely in it at **site** level.
But `round282:619` and `round284:477` each *also* emit `` console.log(`[MEAS] …`) `` — a literal the
renderer does see — so at **file** level, which is the level CURE C specifies and F8 implements,
only **round280 and round281** are invisible. Checked by reading each file's own `console.log`
lines, not by assuming the family; 344 was right to read 284's helper separately, and the same care
one level over is what turns four into two.

A file-count premise cannot see a **partially** blind file. That is a real residual of CURE C as
specified, it is named here rather than left to be found at promotion, and F8's promotion figure is
computed live each run (`2` today) instead of written into a comment.

**4b. "Vacuously harmless today" is true for a different reason than the one given.** Round 344
attributes the harmlessness to the line being countable. The countability is real — but 255's SWEPT
entry **makes no measurement claim at all**, so `measurementCheck` grades nothing against those six
MEAS lines. Countability is why it would have been harmless *if* a claim existed; the absent claim
is why nothing was at stake. Both legs are now asserted separately: the claim is F6's business, the
rendering's countability is F8's.

## 5 — Gate, re-derived this fire

- `npx tsc --noEmit -p scripts/tsconfig.json` → **0 `error TS`**
- `npm test`, unpiped: server **140 files / 2178 passed / 1 skipped**, client **26 / 333 / 13 (346)**
  — the moved client figure Round 344 flagged, confirmed independently
- `node scripts/sweep-probes.mjs`, verdict line read rather than exit code:
  **`SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census
  problem(s), 109 deferred`** — exact match to the standing baseline
- `probe-round269` row: **`PASS exit 0 · All 54 regression checks passed`**
- the one blocker is the standing `probe-round225` (exit 3, 32 established, 1 arm hard-skipped),
  unchanged in name and shape and unrelated to this change. I did not re-read the holding PID this
  fire, so I make no claim about it.

## 6 — Open

- **Closed:** Theseus's routed CURE C. Built, counterfactually graded, landed green.
- **Residual, named not deferred:** F8 is file-level, so a partially blind file (a MEAS literal the
  renderer sees plus a helper-emitted label it does not) passes it. `round282`/`round284` are that
  shape today and are DEFERRED. A site-level premise cannot be derived — MEAS string literals
  include type unions and fixtures, so site-count equality would false-defect heavily. Not built.
- **At promotion:** `round280` and `round281` must be added to `DECLARED_INVISIBLE` when promoted,
  or F8 reds. That is the intended behaviour, and F8's detail line names both files on every run.
- **Nothing here needs a decision from xian.** The one thread that does is not mine: Argus's
  10/06 memo to the CIO answered the Laya/AAXT trial question (good fit, but a scoped engineering
  spike rather than a fire-sized check) and recommends **xian schedule it**. Re-read directly in
  `docs/mail/` this fire — open, addressed to CIO with xian cc'd, not to Daedalus, and correctly
  parked on that scheduling call.
