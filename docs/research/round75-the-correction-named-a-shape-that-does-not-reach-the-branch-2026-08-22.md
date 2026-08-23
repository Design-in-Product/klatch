# Round 75 — the correction named a shape that does not reach the branch

**Date:** 2026-08-22 (STOP fire, 17:17 PT)
**Author:** Daedalus
**Files:** `scripts/lib/recall-tap.mjs` (one console string + comment),
`round71-probe-tap-joins-the-wire-to-the-artifact.test.ts` (+1 test),
`round56-recall-expand.test.ts` (+1 test)
**Suite:** server **1423/1423** (86 files), up from 1421 by exactly these two.
**Cost:** zero API calls, zero live runs, no server started.

---

## 0. The one-line version

Round 74's console fix told the operator that "an empty **or blank** conversation name"
produces an `UNREADABLE SUMMARY` row. A blank one does not. It parses, scores
`ACCEPTED_EXPAND`, and is never counted in that line — so an operator who follows the
sentence, greps `tapInput.expand`, finds a blank name and stops has explained a different
row than the one they are holding. Same failure Round 74 was written to prevent, one word
further in. Third instance of the class in three consecutive fires, and this time it is in
the correction itself.

## 1. What was measured, and how

Not read off the regex — run through the shipped modules, this session:

```
readCallKind('Expanded own conversation:  12–38')      → unknown   (name '')
readCallKind('Expanded own conversation:   12–38')     → expand    {conversation: ' ', from: 12, to: 38}
readCallKind('Expanded own conversation:     12–38')   → expand    {conversation: ' ', from: 12, to: 38}
readCallKind('Expanded own conversation: \t 12–38')    → expand    {conversation: '\t', …}
readCallKind('Expanded own conversation: vesper-1-1 -1–38')  → unknown
readCallKind('Expanded own conversation: vesper-1-1 12–3.5') → unknown
```

and through `readTapVerdict` with a matching frame:

```
''      → unknown → unreadable-summary
' '     → expand  → accepted-expand
'   '   → expand  → accepted-expand
'\t'    → expand  → accepted-expand
```

**The mechanism.** `EXPAND_SUMMARY` (`scripts/lib/recall-call-kind.mjs:72`) is

```js
/^Expanded own conversation:\s+(.+)\s+(\d+)–(\d+)$/
```

`(.+)` matches any character including a space. With a whitespace-only name the producer
emits a run of spaces between the prefix and the digits; the leading `\s+` takes some, `(.+)`
takes exactly one, the trailing `\s+` takes the rest, and the match succeeds with
`conversation: ' '`. With an *empty* name there is one space too few for that split, so the
match fails and the row classifies `unknown`. The difference between the loudest unscorable
warning and the quietest clean verdict is one space character.

`readCallKind` does not validate `m[1]` after the match (`recall-call-kind.mjs:88-98`), so
nothing downstream catches it.

## 2. Why the console line is the thing that was wrong

Round 74's own argument, applied to Round 74. The line is the only diagnostic an operator
gets for this branch. It now names three shapes; two of them are true and one of them sends
the reader to a row the tap already called clean. "Empty" and "blank" are the same word in
ordinary use — an operator scanning `tapInput.expand` for `""` will read `"   "` as a hit —
so deleting "or blank" is not enough. The line has to say which is which.

The shipped text:

> Check `tapInput.expand` FIRST: a LOOSE ARGUMENT the model sent — a conversation name that
> is **exactly the empty string**, or a negative or fractional position — renders into a
> summary the classifier cannot parse with no producer change at all. **A whitespace-only
> name is not one of them: it parses, scores as ACCEPTED_EXPAND and never reaches this
> count, so finding one has NOT explained this row** (the executor refuses it too — separate
> finding, Round 75). Only if those arguments are well-formed has the producer's summary
> grammar drifted.

**Controls, applied and run and reverted:**

| Control | Mutation | Result |
|---|---|---|
| A | Restore Round 74's "an empty or blank conversation name" | red — `expected '← 1 UNREADABLE SUMMARY…' not to match /empty or blank/` |
| B | Delete "or blank" and stop — *the lazy fix* | red — `expected … to match /whitespace-only name is not one of them/` |

B is the one that earns the test. It reads as a fix, removes the false clause, and leaves the
operator's wrong conclusion exactly as reachable. Theseus's Round 74 pattern, fifth instance:
the control does the work, not the assertion named after the finding.

## 3. The blank row is a real finding, and it is not fixed

The executor makes **no** distinction between the two names. `recall.ts:688` trims before the
`:713` guard, so `'   '` and `''` both return the address error, byte-identical text, pinned
this round in `round56-recall-expand.test.ts`. The producer has one behaviour; the instrument
reports two, at opposite ends of its scale.

**Not fixed, and the reason is the standing one.** Narrowing `EXPAND_SUMMARY`, or trimming
`m[1]` in `readCallKind`, would move rows between verdicts mid-experiment — the Round 58
refusal, the same rule Round 73 applied to `readExpandArg` and Round 74 applied to its own
fixture swap. `EXPAND_SUMMARY` is additionally documented as byte-identical to the regex the
probe carried before the extraction, "so the swap is provably inert"; changing it now retires
that guarantee for every past round.

It joins the parked change set as **item (5)**.

### What this is *not*

`ACCEPTED_EXPAND`'s docstring says "summary says expand, wire says expand" and "accepted"
there means accepted by `readExpandArg` — which is true of the blank row. So this is **not** a
mislabelled verdict, and the tap is not lying. The tap is silent about executor outcomes by
design, and stating that plainly is why the fix had to be the console prose rather than the
classifier. Recording the limit here so the next reader does not "fix" a verdict that is
already honest about its own scope.

## 4. Where it is pinned

| Half | File | Test |
|---|---|---|
| Producer | `round56-recall-expand.test.ts` | `refuses a whitespace-only name exactly as it refuses an empty one` |
| Classifier + console | `round71-…-tap-joins-…test.ts` | `does not tell the operator a blank conversation name lands in UNREADABLE SUMMARY` |

The split follows the one already in place: nothing in `round56` imports the instrument (the
producer must not be shaped to suit it), and the classifier assertions live beside the rest of
the tap's.

## 5. The pattern, now three fires long

- **Round 72** (Theseus): the tap said "no frame reached them" while holding the frame.
- **Round 74** (Theseus, on his own Round 72 fix): the console named producer grammar drift as
  the likely cause, when the other half of the same commit had shown the reachable-today cause
  was in the arguments.
- **Round 75** (this, on Round 74's fix): the corrected line names a shape that does not reach
  the branch it describes.

Each defect is smaller than the last and each is in operator-facing prose rather than in a
count or a verdict. Two readings, and I hold both:

1. The convergence is real — the instrument's *numbers* have survived three rounds of adversarial
   reading; only its sentences keep failing. That is the cheap failure to have.
2. Prose is where this instrument's errors live precisely because prose is not under test by
   default. Each of these three was found by a human reading the sentence, not by the suite.
   All three are now under test, which is the only reason to expect the fourth to be found
   before it ships rather than after.

I would not read three consecutive prose findings as evidence the instrument is ready. I would
read it as evidence that the review that finds them is working and has not yet run out.

**Standing, unchanged, and still xian's: the distance arm go/no-go** (`F=17, L=20, G=8`, 80
rows, five opus runs). Four consecutive fires across Theseus and me have now found defects in
instruments, producers and prose rather than in data. That is still not a reason to run one.
