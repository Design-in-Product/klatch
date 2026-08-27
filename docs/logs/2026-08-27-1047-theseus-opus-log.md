# Theseus session log — 2026-08-27 (opus)

Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch `claude/theseus-cycle`.

---

## 10:47 PT — START fire

Briefing done: `git log` (at `122c786`, clean), `docs/COORDINATION.md`, `ls docs/mail/`.
One new memo addressed to me — Daedalus's
`…-the-length-was-on-screen-in-all-ten-runs-and-i-broke-three-citations-naming-the-bug-2026-08-27.md`
(his Round 101). Read in full at the start of the fire. Two asks in it:

1. §6 — run `--dry` on his comment edit to arm R; he could not (his worktree has no Q corpus and
   he did not stand up the scratch server). He explicitly declined to borrow my 8/26 proof.
2. §5 — build `premiseRenderHeld`, which Round 100 §5 scheduled for "my next START fire, unless
   xian's GO on arm R lands first." Checked: **no GO has landed.** So the build fires.

Also §2, which says my Round 100 §3(a) strike was right on a false ground, and that the ground
was his own Round 97 §3.

## 11:0x — verifying his §2 rather than taking it

Read `packages/server/src/claude/recall.ts` directly (not the docs, not his memo):

- `renderExcerpt:898/903` — trailing edge `to: (after ? after.ordinal : last.scopedTotal + 1) - 1`
  → `scopedTotal` when no later excerpt follows.
- `edgeGapLine:291-318` — emits `${P.edgeAddressTo}${address.to}` whenever `ownCount > 0`.

**His code claim holds.** `scopedTotal` reaches the rendered text as an expand bound.

Then checked the artifact half, which he flagged as second-hand from my Round 98.

**My own probe script lied to me first.** My initial node one-liner read `c.addressesOffered`
off the tool call and printed `undefined` for all five Q runs. That would have been a confident
reversal of my own Round 98 §2 — "the field is absent from the artifacts" — produced by my bug.
`addressesOffered` sits inside `c.rendered`. Corrected before it reached anything written.

Re-read properly across all five `recall-probe-R94L{1..5}-Q.json`:

```
L1 call1.addressesOffered=[1-38, 44-80]   "to: 80" in rendered edge line: true
L2 call1.addressesOffered=[1-38, 44-80]   true
L3 call1.addressesOffered=[1-38, 44-80]   true   (also call3 — the expand)
L4 call1.addressesOffered=[1-38, 44-80]   true
L5 call1.addressesOffered=[1-38, 44-80]   true
```

Then checked the **evidence class** of that, since Round 100 accepted his §4 caveat: read the
`call.rendered` assembly in the probe — *"reconstructed, not captured … a divergence would be
invisible to it."* So `addressesOffered` is reconstruction-class. The captured column is
`inputSummary` → `readCallKind`, which gives L3 call 3:

```
L3 call3 kind=expand expand={"conversation":"vesper-1-1-QR94L3","from":44,"to":80}
```

**The model emitted 80.** That is the only captured-class witness, and it covers one run.

## 11:1x — the finding that changes his run count

Surveyed every artifact in `.testdata/`:

```
recall-probe-Q1-N1.json      arm=N1  scopedTotal=60  toolCalls=0
recall-probe-R94N1-N1.json   arm=N1  scopedTotal=60  toolCalls=0
recall-probe-Q1-Q.json       arm=Q   scopedTotal=80  toolCalls=0
recall-probe-Q2-Q.json       arm=Q   scopedTotal=80  toolCalls=0
recall-probe-R94-Q.json      arm=Q   scopedTotal=80  toolCalls=0
recall-probe-R96DRY-QR.json  arm=Q/R scopedTotal=80  toolCalls=0
recall-probe-R94L{1..5}-Q.json  arm=Q  scopedTotal=80  toolCalls=2/2/3/2/2, live
```

**N1's `scopedTotal` is 60.** So "the number 80 was on screen in all ten runs" is false for five
of them — in N1's runs the bound was 60. Cross-checked against my own Round 98 §2 (line 130):
N1's live single-excerpt offer is `1-28` / `34-60`. Round 98's Limits also records that N1's
result JSONs were deleted, so N1's render is doc-class.

Consequence for the registered triple, written into arm R's docblock: N1 (60) vs Q (80) split
5/5 vs 1/5, so the bound **has** already varied in the direction of the outcome — but confounded
with distance and with the second-query render. What it does establish is that **R holds
`scopedTotal` at 80**, making R vs Q the only comparison in the file where the bound is constant.

## 11:2x — his §6, run

```
node scripts/probe-scratch-server.mjs        → READY, holding .testdata/recall-probe.db
npx tsx scripts/probe-recall-tool.mjs R102PRE R --dry     ← on HIS edit, before any of mine
```

Every pre-registered ordinal in R's expectation string lands:

```
fact seqs [41,79] · marking [59] · min distance 18 (radius 2) · totals 80/80
excerpt 1 seq 39-43  leading 1-38   trailing 44-76
excerpt 2 seq 77-80  leading 44-76  trailing=none (flush)
edge lines PREDICTED 3 (1 flush; 104 reachable / 0 unreachable)
IF query matches only seq 41: leading 1-38, trailing 44-80
prompt contains the fact true · marking false · names the tool true
```

Restriction at trailing +15 (44 + 15 = 59). **His edit moved nothing.** §6 closed.

Note carried forward for whoever runs this next: plain `node` fails on `queries.js`
(`ERR_MODULE_NOT_FOUND`) — use `npx tsx` — and `--dry` still needs the scratch server on :3001.
`timeout` is not available in this shell.

## 11:3x–12:xx — building `premiseRender` / `premiseRenderHeld`

Counted the arms from source rather than from Round 100: **15** (`A B D E F L M N1 Q R G H J K
C`). My Round 100 §5 said "eleven" — wrong, corrected in the new docblock.

Design decisions, both departures from Daedalus's spec and both recorded in the file:

- **Call selector.** `{ call: 'first' | 'second', excerpts: 1 | 2, note }`. N1 and Q pre-register
  *call 1's* single-excerpt widths ("This is the arm's premise"); R conditions on *call 2's*
  two-excerpt 9-row neighbourhood. A bare `'single' | 'two'` cannot distinguish them.
- **3 of 15 declared, 12 `null` and not guessed.** Assigning a premise to an arm that never
  declared one manufactures the pre-registration the field records.

Extracted to `scripts/lib/premise-render.mjs` after ~20 minutes inline, for the reason Round 58
and Round 69 both give: `premiseRenderHeld` cannot run at `--dry`, so it can only be exercised by
replay, and a replay against a transcribed copy certifies the transcription rather than the
probe. `scripts/verify-premise-render.mjs` imports the same module the probe imports.

**The verifier corrected me.** First draft asserted R's premise fails in all five Q runs. It came
back `true` four times. Round 98 §0's table — mine — says call 2 returned the two-excerpt render
in L1/L2/L4/L5 and 0 matches in L3. The module was right. Fixed check pins the 4/1 split, which
is stronger than what I meant to write.

**And then the result worth the fire:** R's conditioning rule, replayed over Q's five artifacts,
keeps L1/L2/L4/L5 and voids L3 — **exactly the `0/4` denominator Round 100 §4 found by hand two
rounds after the null was registered against `1/5`.** Added as an explicit assertion.

## Gate — Round 100 §5's proof, run twice

Stashed my edits, ran the baseline, restored, ran after; then re-ran after the module extraction.

```
npx tsx scripts/probe-recall-tool.mjs R102A A B D E F L M N1 Q R G H J K C --dry   (pre-edit)
npx tsx scripts/probe-recall-tool.mjs R102B  … --dry                              (post-edit)
npx tsx scripts/probe-recall-tool.mjs R102C  … --dry                              (post-extraction)

A vs B → new keys across all 15 arms: structural:premiseRender · moved: none   GATE PASS
A vs C → new keys across all 15 arms: structural:premiseRender · moved: none   GATE PASS
```

Every other `structural` key and every non-`structural` top-level key byte-identical in all 15
arms, run tag normalised.

```
node --check scripts/probe-recall-tool.mjs      → OK
node --check scripts/lib/premise-render.mjs     → OK
node --check scripts/verify-premise-render.mjs  → OK
node scripts/verify-premise-render.mjs          → PASS 20/20
```

Non-comment diff, complete — 22 added lines, **0 removed**:

```
+import { readPremiseRenderHeld } from './lib/premise-render.mjs';
+    premiseRender: { call:'first',  excerpts:1, note:… }      × 2  (N1, Q)
+    premiseRender: { call:'second', excerpts:2, note:… }      × 1  (R)
+      premiseRender: arm.premiseRender ?? null,
+  const premiseRenderHeld = readPremiseRenderHeld(arm.premiseRender, toolCalls);
+  if (premiseRenderHeld !== null) { … print block … }
+    premiseRenderHeld,
```

Teardown: `TaskStop` on the scratch server, then `lsof -ti tcp:3001` → **free, no orphaned
grandchild**.

## Mail hygiene — backlog cleared

Round 94's log flagged "thirteen Daedalus↔Theseus memos from 8/21–8/24 remain in `docs/mail/`
though their rounds are closed … next fire's first hygiene item." It had grown to 22. All 22
(8/21–8/26) `git mv`'d to `docs/mail/read/`; each is superseded by a later memo in the same
rolling thread. **The 8/27 pair stays in `docs/mail/`** because the thread's one open action —
xian's GO for 5 live opus runs on arm R — is stated in both.

## Deliverables this fire

- `docs/research/round102-n1-rendered-60-not-80-and-the-field-reproduces-the-denominator-we-found-by-hand-2026-08-27.md`
- `docs/mail/theseus-to-daedalus-cc-xian-team-n1-rendered-60-and-the-field-caught-the-denominator-by-itself-2026-08-27.md`
- `scripts/lib/premise-render.mjs` (new)
- `scripts/verify-premise-render.mjs` (new)
- `scripts/probe-recall-tool.mjs` (comments + 22 additive non-comment lines)
- `docs/COORDINATION.md`, this log

**Spend: zero live turns, zero model calls.** `packages/` untouched.

## Open, carried

- **xian's GO for 5 live opus runs on arm R.** Unchanged, both seats agreed, nothing this fire
  weakens it.
- **`premiseRenderHeld` has never executed on a live run** — by construction, since R has not run.
  Certified against stored artifacts and synthetic edge cases only.
- **N1's live tool calls are unrecoverable** (JSONs deleted). The `60` is first-hand from N1's
  structural artifacts; "N1's runs rendered `to: 60`" leans on Round 98's doc-class reading.

## Session wrap verification

Steps 1–3 appended below after the commit lands.
