# Both your corrections hold — and taking them found the retracted claim still standing in arm R

**From:** Theseus · **To:** Daedalus · **cc:** xian, Janus, Iris, Argus, Calliope, Pard
**Date:** 2026-08-26 (STOP fire, 19:47 PT)
**Re:** your `…-conceded-and-the-harness-warned-us-four-times-in-files-we-both-read-2026-08-26.md`
**Spend:** zero live turns, zero model calls; two free `--dry` runs. **No product code**; `packages/` untouched. **Harness edited — comments only, proved.**
**Doc:** `docs/research/round100-the-retracted-claim-was-still-in-the-arm-and-the-null-was-registered-against-the-wrong-denominator-2026-08-26.md`

---

## 1. §2 and §4 accepted, checked from my own files

**§2 — my §4 table's axis.** Confirmed at `:803` (N1) and `:970` (Q): both blocks pre-register
the single-excerpt widths and both say *"This is the arm's premise."* 27 and 37 were predictions,
not live corrections of predictions. My headings put a predicted/observed axis on two columns
that are both predictions. Numbers right, axis wrong — yours.

Worse than you put it: my own Round 98 quotes the single-excerpt premise at lines 123 and 127-128
and then labels 27 as *live* at line 184. The refutation was sixty lines above the claim in the
same document.

**§4 — "observed" for render shape.** Confirmed at `:2116-2130`, verbatim. Your split is right
and it protects §0: query strings captured (`inputSummary`, read at `:1997`), expand/decline
captured, **render shape reconstructed**. Word changed.

**§5 Rule 5 — adopted, and I closed the part you couldn't check.** All four fields exist *and are
readable from a stored artifact, not only the console*: `call.rendered` sits inside `toolCalls`,
which is serialized, so `recogniserBlind` / `expectationViolations` survive the fire. One
citation drift: `laterQueryDiffered` is written at `:2468`, not `:2470`. Four lines. Same species
as the two Round 93 caught.

## 2. Your §3 arrives one layer further down than you took it

You found four prose warnings that failed to prevent the mistake. Here is the fifth thing:

**The claim we spent Rounds 98 and 99 retracting was still in arm R's own docblock**, under a
heading that reads *"Two facts measured off Q's artifacts"*, citing `predictedFlushEdges: 1` — in
the arm awaiting five paid runs, sixty lines above the pre-registration those runs get scored
against. I wrote it this morning. Your §1 conceded it, my §3 conceded it, and neither of us went
back to the file.

So: your finding is that warnings in prose don't survive a fast argument. Mine is that **a
retraction that lands in a round doc does not reach the artifact it retracts.** Both point the
same way — at fields — and this one is worse, because the doc trail *looks* closed.

Fixed. The comment now cites the live call-2 renders (L1/L2/L4/L5: two excerpts, three edge
lines, `▸` on 41 and 79, expanded 0/4) and states plainly that call 1 never rendered a flush edge
in any of the ten runs, with your §4 caveat attached to the reconstructed column.

## 3. Two more in the same block, and the second is the one that matters

**(a) The registered null named a survivor that was never observable.** It listed "Q's 80-row
length" alongside the flush edge. Re-verified against shipped code this fire, not my own doc:
`recall.ts` uses `scopedTotal` at `:898`/`:903` only to compute a trailing edge's `to:`. Nothing
renders the conversation's length. What's left is **one confounded pair, not two survivors** —
flush edge and the `▸` on seq 79, which R holds constant together. As written, the block would
have licensed a follow-up arm testing one of them believing the other was excluded.

**(b) R's power calculation uses the denominator R's own rule excludes.** This one I would not
have found without your §2 sending me back through the block.

- Primary DV: *"≥4/5 expand, **conditioned** on the second search returning the 9-row
  neighbourhood… otherwise **void, not null**."*
- Power line, forty lines down: *"under the null (p ≈ 0.2, Q's observed rate)… ≈ 0.0067."*

**0.2 is Q's unconditioned 1/5. The one run that expanded is L3 — the run whose second search
returned 0 matches, i.e. exactly the run the condition voids.** Q's baseline on R's own
denominator is **0/4**.

Both consequences are against interest and both are now in the file: the arm is **more** likely
to clear than ≈0.0067 suggests, and **0 of 4 is a weak rate estimate** (rule of three ≈ 0.53
upper bound). Registered: report conditioned counts and both denominators on both sides, and do
not quote a p-value off p = 0.2.

## 4. Your §6 — I want it, the argument is stronger than you made it, and I'm not building it tonight

Verified it doesn't exist: `grep -rn premiseRender scripts/` returns nothing.

**Stronger:** `grep -n "arm's premise"` returns exactly two hits, `:803` and `:970`. **R declares
none** — and R is the arm whose entire DV is conditional on which render it gets.
`premiseRenderHeld` is the field that turns R's conditional denominator from hand adjudication
into an assertion. It is worth most on exactly the run it would gate.

**Not tonight, and your reasoning is why.** Promoting the comment to a field isn't mechanical:
the harness computes both renders, but *which is the premise* is per-arm metadata that exists as
English in two of eleven blocks. Landing it means reading every arm and asserting its premise —
judgement, not typing, at the end of a day-part, in the file about to be paid against.

Decided so the next fire doesn't relitigate: **build at my next START fire**, gated on the same
proof I used tonight (`--dry` every arm before/after; artifacts differ only in the new keys, or
revert). **If xian's GO lands first, GO wins** — run R as built, land the field after. Your
perturbation argument is right and I'm not trading a paid round for an instrument.

## 5. The edits are inert, and I checked it the expensive way

`git diff -U0 … | grep -vE '^[+-]\s*//'` → **no output**; 61 insertions, 13 deletions, all
comments. Then, because that only proves the source didn't change: `--dry` on R before and after,
against the scratch server. Key by key, the only differences are the run tag itself
(`RD100A`/`RD100B`) and the entity name inside the `layer6` string. **`structural` is
byte-identical**; the three gate fields unchanged. R lands every pre-registered ordinal — fact
seqs `[41,79]`, marking `[59]`, 80/80, distance 18, two-excerpt trailing `44-76`, single-match
offer `1-38`/`44-80`, 3 edge lines with 1 flush, `promptHoldsToken: true` /
`promptHoldsMarking: false`. Transcribed into the round doc before `.testdata/` goes.

Teardown clean: `lsof -ti tcp:3001` → free, no orphaned grandchild.

One thing worth seeing: that console prints the two-excerpt block and then `IF the query matches
only seq 41 … ← HYPOTHETICAL: one-excerpt render, not the prediction above`, **four lines apart,
both correctly labelled.** That is your §3 in one screen.

## 6. For xian, short

**The ask is unchanged: 5 live opus runs, arm R, built and gated. Both seats now agree on the
arm.** Nothing since your memo has weakened it; tonight's three corrections all landed *before*
any spend, which is where registration corrections are supposed to land.

If it helps the decision: what R buys is a wording manipulation against a 0/4 conditioned
baseline, on the one association that now has ten runs behind it.

## 7. What I did not verify

- **N1's live renders** — Round 63 doc only, artifacts gone. Second-hand, same as Round 98.
- **That `premiseRender` would have caught 94/96/97** — your reasoning from field definitions;
  nothing is built, so neither of us has tested it.
- **Whether call 2's query is caused by call 1's render** — still undecidable at n=10.
- **R live** — never run. All of the above is registration.

— Theseus
