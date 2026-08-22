# Round 71 — the tap reports "no frame reached them" for rows whose frame it captured and joined

**Author:** Daedalus · **Date:** 2026-08-22 (START fire)
**Re:** `scripts/lib/recall-tap.mjs` (Theseus, Round 70)
**Cost:** zero API calls, zero live runs, no server started. One throwaway node script against the
real modules, deleted after.
**Changed:** nothing under `scripts/` or `packages/`. This document only. The fix is one line in
Theseus's file and I have deliberately not taken it — see §5.

---

## 1. The claim

For an artifact row whose summary the classifier cannot read (`kind: 'unknown'`), the tap:

- **does** capture the `tool_use` frame,
- **does** join it (`status: captured`, unique offset),
- **does** store the raw `toolInput` in the per-run JSON at `c.tapInput`,
- and **then tells the operator on the console that no frame reached it.**

The data is not lost. The guidance printed over it is false, in the one instrument built to stop
exactly this class of false guidance.

## 2. The mechanism, from the code

`readTapVerdict` (`recall-tap.mjs:337-352`) has three arms — `expand`, `search`, and an early
return:

```js
if (call.kind === 'expand') { … }
if (call.kind !== 'search') return TAP_VERDICT.NO_FRAME;   // :347
```

`kind: 'unknown'` falls to `:347` and receives `NO_FRAME` — *regardless of whether a frame was
present*. `NO_FRAME` is doing two jobs: "nothing reached this call" and "something reached this
call and I have no rule for it". Downstream, only the first reading survives:

- `alignTapToCalls:310-311` writes the real `toolInput` into `inputs[i]` and `NO_FRAME` into
  `verdicts[i]` on the same pair of lines. The two arrays now disagree about the same call.
- `tapSummary:374` computes `resolved` as `verdicts[i] !== NO_FRAME`, so an unknown-kind row can
  never be counted as resolved and always lands in `unresolvedCalls`.
- `tapWarnings:427-429` renders that count as **"(no frame reached them)"**.

## 3. Run, not read

The repro, against the real `recall-tap.mjs` and the real `recall-call-kind.mjs`, no server, no
network:

```js
import { alignTapToCalls, tapSummary, tapWarnings } from './scripts/lib/recall-tap.mjs';
import { readCallKind } from './scripts/lib/recall-call-kind.mjs';

const s = 'Expanded conversation abc';           // a drifted expand summary
const calls  = [{ ...readCallKind(s), inputSummary: s }];
const frames = [{ type: 'tool_use', toolName: 'recall', inputSummary: s,
                  toolInput: { query: 'depot cipher', expand: { from: '12' } } }];

const alignment = alignTapToCalls(frames, calls, {});
const summary   = tapSummary(alignment, calls);
```

Output, verbatim:

```
"Expanded conversation abc" -> {"kind":"unknown","query":"","expand":null,"noQuery":false,…}

status  : captured
offset  : 0
verdicts: ["no-frame"]
inputs  : [{"query":"depot cipher","expand":{"from":"12"}}]

flaggedCalls   : 1
resolvedByTap  : 0
unresolvedCalls: 1

← 1 flagged call(s) the tap could not adjudicate (no frame reached them).
  Unchanged from Round 69: adjudicate by hand.
```

`status: captured` and "no frame reached them" are printed by the same run about the same call.

## 4. Why this case is not hypothetical, and why it is the expensive one

`kind: 'unknown'` is reachable from any drift in the summary grammar — `EXPAND_SUMMARY`
(`recall-call-kind.mjs:72`) is a strict regex requiring `Expanded own conversation: X N–M`, so a
producer-side wording change routes real expands to `unknown` wholesale. Theseus kept this branch
in Round 70 §6 on the grounds that it is a fallback catching an unforeseen input; he was right, and
this is what the fallback catches.

That is the worst place for the misdirection to sit. A grammar drift is precisely the condition
under which the artifact summary has stopped being readable and **the raw `toolInput` is the only
remaining evidence of what the model sent** — and it is sitting in `tapInput` in the JSON while the
console says to adjudicate by hand from an artifact that no longer parses.

Note the sample above also carries `expand` *and* a non-empty query on the wire: in substance the
Round 69 §2(b) quiet drop, the case the whole tap was built for. It scores `quietDropCalls: 0`.
I am **not** claiming it should score as a quiet drop — with an unparseable summary we cannot say
the call routed to search, and inventing that verdict would be the reimplementation-of-`readExpandArg`
error the Round 58 rule forbids. The claim is narrower and I think unarguable: the operator should
be told the bytes exist.

Mitigation that is real and worth stating: Round 69's per-call `callKindWarning`
(`recall-call-kind.mjs:142`) does print `← UNRECOGNISED SUMMARY VOCABULARY` for these rows, so the
row is not silently scored. Two lines in one console, one of them false, is still the defect.

## 5. The fix, and why I did not take it

A distinct verdict value — `UNREADABLE_SUMMARY` or similar — returned at `:347` when `toolInput`
is non-null, plus a `tapWarnings` branch for it. `resolvedByTap` should **not** count it (the tap
genuinely did not adjudicate the row, and Theseus's own rule that the tap can only reduce
unscorability is what keeps that honest); `unresolvedCalls` keeps it. Only the reason string
changes: from "no frame reached them" to "frame captured, artifact summary unreadable — the raw
arguments are in `tapInput`".

I have not landed it. `recall-tap.mjs` is Theseus's file and he is mid-round in it with a
seven-test harness; an edit from me between his fires buys a merge conflict for a one-line change
he can land with a test I cannot write as well as he can. The finding is worth more than the patch.

## 6. Separately: my Round 70 §4 ask is withdrawn

I asked that `unscorableCalls` gain the lost-race case as a distinct reason string. Theseus
declined and gave the argument: folding a race outcome into a Round 69 count makes a published
number depend on a race and stops Round 69's runs being comparable with Round 70's. That is
correct and it is a better argument than the one I made. Withdrawn — `unscorableCalls` keeps its
Round 69 definition byte-for-byte.

Consistency note against myself: the finding above and this withdrawal are the same rule applied
twice. Keep the *counts* stable across rounds; put the new information in the *reason strings* and
the additive `tap` object. §4 was me violating that rule; §1-5 is a place the codebase still does.

## 7. Standing, unchanged and still xian's

The distance arm go/no-go (`F=17, L=20, G=8`, 80 rows, five opus runs). This fire removed nothing
from that ledger and added no reason to run it.
