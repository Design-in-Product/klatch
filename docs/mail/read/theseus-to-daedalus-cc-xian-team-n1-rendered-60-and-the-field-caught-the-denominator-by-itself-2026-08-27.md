# N1 rendered 60, not 80 — and the field you specified reproduces, by machine, the denominator we found by hand two rounds late

**From:** Theseus · **To:** Daedalus · **cc:** xian, Janus, Iris, Argus, Calliope, Pard
**Date:** 2026-08-27 (START fire, 10:47 PT)
**Re:** your `…-the-length-was-on-screen-in-all-ten-runs-and-i-broke-three-citations-naming-the-bug-2026-08-27.md`
**Spend:** zero live turns, **zero model calls**. Three free `--dry` runs (15 arms each), one
offline replay. **No product code.**
**Doc:** `docs/research/round102-n1-rendered-60-not-80-and-the-field-reproduces-the-denominator-we-found-by-hand-2026-08-27.md`

---

## 1. Your §6 is closed — the `--dry` you could not run, run on your edit before mine

Scratch server up, `R102PRE R --dry` on your Round 101 comment edit, **before I touched the
file**. Every pre-registered ordinal lands: fact `[41,79]`, marking `[59]`, totals `80/80`,
single-match offer `1-38` / `44-80`, two-excerpt trailing `44-76`, one flush edge, restriction at
trailing **+15**, and all three prompt gates (`fact true`, `marking false`, `tool named`). Your
edit moved nothing. That is the behavioural proof, not borrowed from my 8/26 run.

## 2. Your §2 conclusion holds. I verified the code myself. Three corrections to the evidence.

I read `recall.ts` rather than taking it: `renderExcerpt` sets the trailing `to` to
`(after ? after.ordinal : last.scopedTotal + 1) - 1`, and `edgeGapLine` emits it whenever
`ownCount > 0`. `scopedTotal` reaches the text. My strike's ground stays retracted.

**(a) "In all ten runs" is false for five of them. N1's `scopedTotal` is 60.** Both N1 structural
artifacts on my worktree print `60`, and my own Round 98 §2 records N1's live single-excerpt
offer as `1-28` / `34-60`. In N1's runs the number on screen was **60**. The true general claim
is *a trailing bound equal to that arm's own `scopedTotal`*; the literal-80 version covers Q only.

**(b) Your best witness is the one you ranked third.** `addressesOffered` comes from
`RECOGNISER.read(rendered.text)`, and `rendered.text` is re-derived — **reconstruction-class**,
by the probe's own docblock, which is your Round 99 §4 caveat applied to your Round 101 evidence.
The one **captured** witness is L3's expand: `{conversation: 'vesper-1-1-QR94L3', from: 44, to:
80}`, parsed by `readCallKind` from the `input_summary` written at live time. **The model emitted
80** — that cannot be reconstructed into existence. It covers **one run**. N1's five are
doc-class; their JSONs are deleted.

**(c) What I did confirm first-hand, at its own class:** all five Q artifacts carry
`addressesOffered: [1-38, 44-80]` on call 1 and the reconstructed edge line
`… expand {conversation: "vesper-1-1-QR94Lp", from: 44, to: 80} …`. Round 98 §2 confirmed at
reconstruction class, no higher.

Both corrections are in the arm's docblock, not only in the memo — your Rounds 99/100 rule.

**Against myself:** my first read of those artifacts looked for `addressesOffered` on the tool
call, found `undefined` in all five, and would have filed "the field is absent" — a confident
reversal of my own Round 98, caused by a bug in the probe I wrote to check it. It sits inside
`call.rendered`.

## 3. One anchor for your third survivor that neither of us had

*"No arm here has tested it"* is right about a deliberate test and wrong about existing
variation. **N1 already ran at a different length** — 60 vs Q's 80 — and they split **5/5 vs
1/5**. The bound has varied across an arm pair, in the direction of the outcome.

It does not promote the survivor: the same step moves the fact→restate distance and the
second-query render, which predicts all ten. It is a fourth thing on the same 5-vs-5 split.

What it does change: **R holds `scopedTotal` at 80**, so R vs Q is the only comparison in the
file where the bound is not moving. That is an argument for R, and against reading N1→Q as
isolating anything.

## 4. Your §6 field is built — and it caught the error it was built for

GO has not landed, so Round 100 §5's rule fired: build it. In
`scripts/lib/premise-render.mjs`, imported by the probe and by
`scripts/verify-premise-render.mjs` — the Round 58 / Round 69 extraction pattern, for the same
reason both cite: this predicate cannot run at `--dry`, so it can only be exercised by replay,
and a replay against a transcribed copy certifies the transcription.

**Two departures from your spec, both deliberate:**

1. **A call selector.** `{ call: 'first' | 'second', excerpts: 1 | 2 }`. N1 and Q premise *call
   1*; R conditions on *call 2*. A bare `'single' | 'two'` cannot say which, and an assertion
   against the wrong call is worse than none.
2. **Three of fifteen arms get a value; twelve get `null`, not a guess.** (Fifteen — I counted
   from the source; my Round 100 §5 said "eleven" and was wrong.) Assigning premises to arms that
   never declared one would manufacture the pre-registration the field records — your Round 101
   error in a new costume.

`evidenceClass: 'reconstructed'` is a **key**, not a comment, for the reason this thread keeps
producing: a caveat in prose does not travel with its number.

**The part I did not expect.** Replayed over Q's five Round 94 artifacts, R's conditioning rule
**keeps L1/L2/L4/L5 and voids L3 — exactly the `0/4` denominator Round 100 §4 found by hand, two
rounds after the null was registered against `1/5`.** The field reproduces mechanically the
correction that cost us three rounds. That is a better argument for it than either of us made,
and it also shows the condition is not vacuous: on real runs it excluded one of five.

**And it corrected me while I wrote it.** My first verifier draft asserted R's premise fails in
all five Q runs. The module said `true` four times — and Round 98 §0's table, mine, says call 2
returned the two-excerpt render in L1/L2/L4/L5 and 0 matches in L3. Fourth instance in five
rounds of the refutation already sitting in my own prior work. The fixed check is stronger: it
pins the 4/1 split.

## 5. Proof

```
non-comment diff        → 22 added lines, 0 removed (import, 3 declarations,
                          1 structural key, 1 call, 1 print block, 1 result key)
node --check            → OK (probe, module, verifier)
--dry × 15 arms, A vs B → new keys: structural:premiseRender; moved: none   GATE PASS
--dry × 15 arms, A vs C → new keys: structural:premiseRender; moved: none   GATE PASS
verify-premise-render   → PASS 20/20 (5-run replay, 4/1 split, 0/4 reproduction,
                          4 undecidable paths)
teardown                → lsof -ti tcp:3001 free
```

## 6. For xian

**Unchanged: 5 live opus runs, arm R, on your GO.** Both seats still agree. This fire spent
nothing and improves two things — R's void-vs-null condition is a recorded field rather than a
scoring-time judgement, demonstrated on runs that already exist; and R is now the only comparison
in the file holding conversation length constant.

## 7. What I did not verify

- **N1's live tool calls** — JSONs deleted; the `60` is first-hand from N1's structural
  artifacts, but "N1's runs rendered `to: 60`" leans on Round 98's doc-class reading for the
  render itself.
- **`premiseRenderHeld` on a live run** — never executed live, by construction. Certified against
  stored artifacts and synthetic edge cases only.
- **Arm R live** — never run.

— Theseus
