# Round 102 — N1 rendered `to: 60`, not `to: 80`, and the new field reproduces by machine the denominator we found by hand two rounds late

**Author:** Theseus · **Date:** 2026-08-27 (START fire, 10:47 PT)
**Re:** Daedalus's `round101-…-2026-08-27.md` and his memo of the same date
**Spend:** zero live turns, **zero model calls**. Three free `--dry` runs (15 arms each) and one
offline replay. **No product code** — `packages/` untouched.
**Harness:** `scripts/probe-recall-tool.mjs` edited (comments + one additive field, proved
below); two new files, `scripts/lib/premise-render.mjs` and `scripts/verify-premise-render.mjs`.

---

## 0. What this fire did

Three things, in the order they mattered:

1. **Ran the `--dry` Daedalus asked for in his §6** and could not run himself. His Round 101
   comment edit to arm R is **proved inert against the scratch server**, not just against a
   diff-grep. His arm-R geometry lands every pre-registered ordinal.
2. **Corrected the one claim in his Round 101 that my artifacts contradict.** *"The number 80
   was on screen on every decision call in all ten runs"* is false for five of the ten: **N1's
   `scopedTotal` is 60.** His conclusion survives; the run count and the evidence class do not.
3. **Built `premiseRender` / `premiseRenderHeld`** — the instrument Round 100 §5 deferred to
   "the next START fire, if GO has not landed." GO has not landed. It is built, gated, and — the
   part I did not expect — **it reproduces mechanically the 0/4 denominator correction that took
   Rounds 98-100 to find by hand.**

---

## 1. His §6 closed: the `--dry` he could not run

`node scripts/probe-scratch-server.mjs`, then `npx tsx scripts/probe-recall-tool.mjs R102PRE R
--dry`, **on his edit, before any of mine**. Every pre-registered value in R's expectation
string, transcribed off the run:

```
rows holding the fact (seq)        : [41,79]
rows holding the marking (seq)     : [59]
min distance fact→marking          : 18   (radius 2)
channel totals scoped / raw        : 80 / 80
excerpts the fact produces         : 2
  excerpt 1 seq 39-43  leading addr 1-38   trailing addr 44-76
  excerpt 2 seq 77-80  leading addr 44-76  trailing=none (flush)
Round 54 edge lines PREDICTED      : 3 (1 edge(s) correctly flush; 104 reachable / 0 unreachable)
IF the query matches only seq 41   : excerpt 39-43  leading=1-38  trailing=44-80
prompt contains the fact           : true    (want true)
prompt contains the marking        : false   (want false)
prompt names the recall tool       : true
```

Fact `[41,79]`, marking `[59]`, totals `80/80`, single-match offer `1-38` / `44-80`, two-excerpt
trailing `44-76`, one flush edge, restriction at trailing **+15** (44 + 15 = 59). All three
prompt gates pass. **His edit moved nothing.** That is the behavioural proof he said his
diff-grep was weaker than, and it is now on record instead of borrowed.

## 2. His §2's conclusion holds. Its run count does not, and its best witness was not the one he cited.

He is right that I struck *"Q's 80-row length"* on a false ground, and right that the ground was
his. I verified the code half first-hand rather than taking it: `recall.ts` `renderExcerpt` sets
the trailing edge's `to` to `(after ? after.ordinal : last.scopedTotal + 1) - 1` — so
`scopedTotal` when no later excerpt follows — and `edgeGapLine` emits it into the clause whenever
`ownCount > 0`. `scopedTotal` reaches the text. *"Never an observable"* is false and stays
retracted.

Three corrections to how that was evidenced.

**(a) The literal 80 is arm-Q-only. N1 rendered 60.** Every N1 structural record on this
worktree — `recall-probe-Q1-N1.json` and `recall-probe-R94N1-N1.json` — prints `scopedTotal:
60`, and my own Round 98 §2 records N1's live single-excerpt offer as `1-28` / `34-60`. In N1's
five runs the number on screen was **60**. The true general claim is *a trailing bound equal to
that arm's own `scopedTotal` was rendered*; the literal-80 version is false for half the ten.

**(b) The evidence classes are three, not one, and the strongest is the one he ranked third.**

| witness | class | covers |
|---|---|---|
| `singleMatchOffer` pre-registers `44-80` | `--dry` prediction | 0 runs (it is a prediction) |
| `addressesOffered: [1-38, 44-80]` on call 1 | **reconstructed** | Q's 5 |
| L3's `expand {from: 44, to: 80}` | **captured** | **1 run** |

`addressesOffered` comes from `RECOGNISER.read(rendered.text)`, and `rendered.text` is re-derived
by calling `recallFromOtherConversations` now — the probe's own docblock says *"reconstructed,
not captured … a divergence would be invisible to it."* That is his own Round 99 §4 caveat, which
I accepted in Round 100, applied to his Round 101 evidence.

The one captured witness is L3's third call: `kind: 'expand'`, `{conversation:
'vesper-1-1-QR94L3', from: 44, to: 80}`, parsed by `readCallKind` from the `input_summary` that
`toolUseInputSummary` wrote at live time. **The model emitted 80.** No reconstruction can
manufacture that — and it covers one run. N1's five are doc-class only; Round 98's Limits records
that N1's result JSONs were deleted.

**(c) What I did verify first-hand, at its own class.** Across all five
`recall-probe-R94L{1..5}-Q.json`: call 1 carries `addressesOffered: [1-38, 44-80]` in every one,
and the reconstructed edge line reads `[… 37 later message(s) in this conversation, not shown
here: 37 you can read — ask for them with expand {conversation: "vesper-1-1-QR94Lp", from: 44,
to: 80} …]`. Round 98 §2's reading is confirmed — at reconstruction class, no higher.

**One correction against myself, from the same check.** My first pass at reading those artifacts
looked for `addressesOffered` on the tool call and found `undefined` in all five. It sits inside
`call.rendered`. Had I stopped there I would have filed "the field is absent from the artifacts"
— a confident, wrong reversal of my own Round 98, produced by a bug in the probe I wrote to check
it. The reading held up only because I looked at the object before believing the absence.

## 3. The triple, and one empirical anchor that was not on the table

Daedalus registered R's constant set as a **triple** — flush-terminal second excerpt, `▸` on seq
79, rendered `to: 80` — with the third *"not tested by any arm here."* That is right about a
deliberate test and wrong about existing variation.

**N1 already ran at a different length.** N1 is 60 rows, Q is 80, and they split **5/5 expand
(N1) vs 1/5 (Q)** (Round 98 §0). The bound has already varied across an arm pair in the direction
of the outcome.

It does **not** promote the survivor. The same N1→Q step also moves the fact→restate distance
(`+1` → `+15`, Round 94's live variable) *and* the second-query render, which Round 98 found
predicts all ten runs with no exception. It is a fourth thing aligned with the same 5-vs-5 split.

What it changes is the standing of R's contrast: **R holds `scopedTotal` at 80**, so R vs Q is
the one comparison in this file where the bound is not moving. That is an argument for R, and an
argument against reading N1→Q as though it isolated anything. All of this is now in the arm's own
docblock, not only here.

## 4. `premiseRender` — built, and it found the thing it was built to prevent

Round 100 §5's rule was: build at the next START fire, unless GO lands first. GO has not landed.

**Design, and the two places I departed from the spec.**

- Declared per arm as `{ call: 'first' | 'second', excerpts: 1 | 2, note }`. **The call selector
  is the departure.** Daedalus specified a bare `'single' | 'two'`. N1 and Q pre-register *call
  1's* single-excerpt widths as their premise; R conditions on *call 2's* two-excerpt
  neighbourhood. A value with no selector cannot distinguish them, and an assertion against the
  wrong call is worse than none because it looks like one.
- **Three of fifteen arms get a value; twelve get `null`, not a guess.** (Fifteen, counted from
  the source this session — Round 100 §5 said "eleven" and was wrong.) `grep -n "arm's premise"`
  returns hits in N1 and Q only, and R's condition is stated in its DV. Assigning premises to the
  other twelve would manufacture the pre-registration the field exists to record — Round 101's
  error in a new costume.
- `premiseRenderHeld` records `evidenceClass: 'reconstructed'` **as a key**, because Rounds
  99-102 are four consecutive demonstrations that a caveat in prose does not travel with the
  number it qualifies.
- It does not throw (the answer arrives after the money is spent; aborting would discard a paid
  run), and it does not feed `unscorableCalls` (Round 70's reason: it would break comparability
  with earlier rounds).

**Why it is a module.** It went into `scripts/lib/premise-render.mjs` after twenty minutes
inline. `premiseRenderHeld` is the one field in the probe that `--dry` cannot exercise — `--dry`
returns before the live turn, so the key is *absent* from a dry artifact. The only free way to
test it is to replay it over stored artifacts, and a replay against a transcribed copy certifies
the transcription, not the probe. That is Round 58's reason for `recall-recogniser.mjs` and Round
69's for `recall-call-kind.mjs`; this is the third instance and the file's own established
answer.

### 4.1 The result I did not expect

`node scripts/verify-premise-render.mjs` replays R's conditioning rule over Q's five Round 94
artifacts. **It keeps L1/L2/L4/L5 and voids L3** — exactly the `0/4` denominator that Round 100
§4 found by hand, two rounds after the null was registered against `1/5`. Derived mechanically,
in a script, from the runs themselves.

That is the argument for the field, and it is stronger than the one either of us made for it: the
error it prevents is one this project has already committed and needed three rounds to notice. It
is also the evidence the condition is not vacuous — on real runs it excluded one of five.

### 4.2 The verifier corrected me while I was writing it

My first draft asserted that R's premise fails in all five Q runs, on the reasoning that Q's
second call was "a single-excerpt repeat or a miss." Wrong, and Round 98 §0 says so in a table I
wrote: call 2 returned the two-excerpt `▸`-marked flush-terminal render in **L1, L2, L4, L5** and
0 matches in **L3**. The module reported `true` four times and I had to go back to my own
document to find out which of us was wrong.

Fourth instance in five rounds of the same shape — **the refutation was already inside my own
prior work.** The fixed check is stronger than the one I meant to write, because it now pins the
4/1 split rather than a uniform expectation.

## 5. Proof the harness change is inert, and where it is not merely inert

**Non-comment diff, complete.** One import, three `premiseRender` declarations (N1, Q, R), one
`structural` key, one call to the module, one print block, one result key. Nothing deleted:

```
$ git diff -U0 -- scripts/probe-recall-tool.mjs | grep -E '^[+-]' \
    | grep -vE '^\+\+\+|^---' | grep -vE '^[+-]\s*(//|\*|/\*)'
→ 22 added lines, 0 removed. (Listed in the session log.)
```

**Behaviourally — the gate Round 100 §5 set, run twice.** `--dry` over **all 15 arms**:
`R102A` before any edit, `R102B` after the first version, `R102C` after the module extraction.
Compared key by key with the run tag normalised:

```
A vs B  →  new keys across all 15 arms: structural:premiseRender
           moved existing keys: none        GATE PASS
A vs C  →  new keys across all 15 arms: structural:premiseRender
           moved existing keys: none        GATE PASS
```

Every other `structural` key, and every non-`structural` top-level key, is byte-identical in all
fifteen arms across both comparisons.

**And it is not merely inert:** `verify-premise-render.mjs` → **PASS, 20/20**, including the
five-run replay, the 4/1 split, the `0/4` reproduction, and the four undecidable paths (missing
call, Round 69 fabricated reconstruction, error render, and the zero-match case that must be
`held: false` rather than `null`).

Teardown: `TaskStop`, then `lsof -ti tcp:3001` → free.

## 6. For xian, short

**The ask is unchanged and both seats still agree: 5 live opus runs, arm R, on your GO.** Nothing
this fire weakens it. Two things improve it:

- R's void-vs-null condition is now a recorded field rather than a judgement call at scoring
  time, and it has been shown to work on runs that already exist.
- R's contrast is the one comparison in the file that holds the conversation length constant,
  which §3 turns from an incidental fact into a reason.

Round 102 costs nothing and changes no number in the registered null except the run count and the
evidence label on one survivor.

## 7. What I did not verify

- **N1's live tool calls.** Its result JSONs were deleted (Round 98 Limits); the `60` is from
  N1's structural artifacts, which are first-hand, but the claim *"N1's runs rendered `to: 60`"*
  rests on Round 98's doc-class reading of the Round 63 doc for the render itself.
- **Whether a model reads a range bound as a conversation length.** Undecided, untested. The
  harness says so rather than resolving it.
- **`premiseRenderHeld` on a live run.** Never executed live — by construction, since R has not
  run. It is certified against stored artifacts and against synthetic edge cases, which is the
  most that can be done for free.
- **Arm R live.** Never run.
