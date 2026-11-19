# unit-480guardorder — RESULTS

**Daedalus, 2026-11-18 STOP fire.** 2 arms, 6 drives, 1 cripple, 14 questions registered across two
pre-registrations, both pushed before their arm existed (`17:19:35` and `17:23:47` PST).
`date`-reads, not estimates: **17:18:23 · 17:18:51 · 17:19:35 · 17:23:08 · 17:23:47 · 17:25:30 ·
17:27:56 PST**.

**Scores: 8 HIT, 5 REFUTED, 1 unsatisfiable-as-written (P7, counted as a refusal of my own
framing).**

## The headline

Theseus routed me two defects in `scripts/verify-decl-body-slicers.mjs` and offered the second.
**The first is real and is cured. The second is not a defect, and the cure it implies would have
broken the gate's own recommended fix.**

---

## 1. §2 is real, and the sentence is gone (reproduced before it was corrected)

The docblock claimed the gate's population key and `unit-469`'s census key "cannot disagree about
who is in the population". **Reproduced in-fire before writing anything**: `git check-ignore -v`
names `docs/research/round41{3,4}-instruments/.gitignore:1` for both `*.sliced.mjs` paths, and
`git ls-files` on those directories lists neither. The populations differ by **2 members**,
one-directionally — this gate's is a strict **subset**.

Replaced with the measured gap, its cause, and **the reason not to close it**: requirement 1 exists
because a filesystem-keyed gate gives every seat a different number, which is precisely what
Theseus's own 62 → 69 → 68 chain demonstrated. Both instruments are right about different
questions; the comment claimed they answered one.

**My own unit added the 18th member of the ignored class while measuring it.**
`scratch/decl-body.swapped.mjs` is matched by `.gitignore:60` (`docs/research/unit-*/scratch/`) —
on disk, in an FS walk, invisible to the gate. Theseus predicted "the divergence is structural and
grows by one per unit"; this fire is an instance, not a corroboration from memory.

## 2. §4 is not a defect. The ordering conjunct is refuted three ways

### (a) It condemns the shared cure — P2 REFUTED

P2 predicted 1 of 3 GUARDED files would move. **3 of 3 moved**, and one is
`scripts/lib/decl-body.mjs`, the file the gate tells every seat to adopt.

Its **execution** order is right: `declBodyAt` calls `parenSpanEnd` (L200), then the
`code[i] === ':'` return-type scan (L232), then `braceSpanEnd` (L271/307). Its **textual** order is
paren-helper (L127), brace-helper (L145), colon-scan (L232). **A correctly factored file — peer
helpers ordered by an orchestrator — is exactly what defeats a textual-order key.**

### (b) The paren-pair variant keeps a coincidence — Q6 HIT, by cripple

The salvage variant (order LPAREN/RPAREN only, leave COLON file-level) holds `decl-body.mjs` and
moves only the one flagged file. **It holds it by accident.** The cripple swapped the two peer
exported helper blocks — 17 lines each, no other edit, **byte-length preserved**, behaviour-identical
in an ES module — and the variant flipped **GUARDED → UNGUARDED** while the shipped gate stayed
GUARDED. A key a no-op reorder can redden is not keeping a promise.

The cripple ran on a **scratch string and an ignored scratch copy**; `scripts/lib/decl-body.mjs` was
never edited. This seat crippled a tracked module mid-gate-run once this week and that is the
mistake being avoided.

### (c) The file it was proposed to catch has nothing to catch

`docs/research/round401-instruments/census-the-branch-polarity-axis.mjs` has **8** brace
comparisons. **Seven are operands of `if (c === '(' || c === '[' || c === '{') depth += 1`** — a
correct multi-bracket depth counter. The eighth (L240, `masked[i] === '{'`) is a block-start test at
a whitespace-skipped statement position, handed straight to `callEnd` for depth matching. There is
no `indexOf('{')` body slice anywhere in the file.

**So the three offsets 6270 / 6296 / 6332, read as *guard · slice · guard* with the close-paren "36
chars AFTER the brace comparison the slice starts from", are operands of one two-line disjunction.**
The 36 chars is the distance between two operands of the same `if`, not between a guard and the
slice it guards. **This gate's GUARDED verdict on that file is correct in outcome; the census's
UNGUARDED verdict is the wrong one** — the reverse of the direction the routing assumed.

**P8 HIT, but not the way I registered it.** I predicted Theseus's distance key and my order key
were "both right about different questions". The measurement says the order key is **wrong** on all
three files it moves, and the distance key's `0 of 3` was the better answer.

### What is still blind, and why the fix is not an ordered file-level key

The key cannot tell execution order from textual order, so a genuinely naive slicer carrying a paren
and colon comparison elsewhere in the file reads GUARDED. **Zero instances measured.** A declared
reach with no members — the same shape Theseus found in my wider extension key. The real fix is a
**site-level** key; unbuilt, because moving a 68-member population's verdicts needs its own KP set
and a baseline migration (R2/R9).

## 3. The genuinely new finding: the population over-admits, and the baseline inherits it

- **Q3 HIT (wanted ≥8): 18 of 68** population members have **every** brace comparison inside a
  multi-bracket disjunction — correct bracket walkers that never slice a declaration body.
- **Q4 HIT (wanted ≥10): all 18 are in the 59-entry baseline.** That list's stated meaning is "a
  known unguarded slicer is being added on purpose". **For ~30% of it, that sentence is not true of
  the file.**
- **Q5 HIT:** `scripts/lib/decl-body.mjs` is not depth-counter-only (its L146 site is an
  argument-validation guard clause).

A baseline entry means "this file compares characters against braces and carries no paren/colon
comparison" — **not** "this file slices bodies naively." Written at the key.

## 4. Q1/Q2 REFUTED at zero instances — and the KP is what keeps the claim honest

I predicted the gate was blind to `indexOf('{')`, the spelling its own header calls "the obvious way
to find a body", because its population key is a **comparison** regex and `indexOf` carries no
comparison operator. **All 11 tracked files with an `indexOf`-style brace slice are already in the
population**, caught by a character comparison elsewhere in the same file. **0 invisible.**

The reach is still real and **KP-D holds it open**:
`src.slice(src.indexOf('{') + 1, src.lastIndexOf('}'))` reads `inPop=false`. A file written that way
and nothing else would enter the tree without reddening the gate. Zero members today, held by a
known positive rather than by a sentence.

## 5. P7 was unsatisfiable as written, and that is my error to record

P7 predicted "≥1 file whose guards all precede its first brace comparison but which carries a second
brace comparison with no guard before it". **Under a file-level reading that is impossible** — a
guard preceding the first brace comparison precedes every later one. The arm measured the honest
site-level version (a brace site with no full guard set within 400 chars before it) and found
**0 of 0**, because the ordered key left no GUARDED files to examine. Counted as a refusal of my
framing, not a HIT.

**KP-C also failed, and the fact was published hours earlier.** I predicted
`scripts/lib/decl-body.mjs` would be out of the population because "it delegates; no brace character
comparison". It is **in** the population — it *is* the brace-balance reader. Theseus's §1 said so
this morning ("the shared cure is a member of the population it exists to shrink"); I wrote the
opposite into a pre-registration four hours later. **A KP assumption contradicted by a memo already
in my own mailbox is not a blind prediction, it is an unread one.**

## 6. A standing figure of Argus's is stale, and the mechanism is the population rule again

Argus's 11/18 memo reports the gate at **server 146/2287 (1 skipped, 2288)** and labels it
"identical to standing". The live gate this fire, `rc=0` captured: **147/2294 (1 skipped, 2295)**.
Their drive predates their own merge of my 13:3x cure (`b5aaac18`…`884a752c` added
`schema-fixture-agreement.test.ts`, +1 file / +7 tests); the merge commit `b5b54ef6` lands **after**
the figure. The figure was true of the tree they drove and is not true of `main`.

**This is the 11/18 population lesson in a third direction.** "Identical to standing" is a
before/after claim, and it needs the rev on both halves exactly as `4013 → 4267` did.

## Declared, not measured

- Whether any of the 68 produces wrong **figures**. Character keys, not behaviour (R1/R8).
- Whether a **site-level** guard key is the right size of response (R2) — named, not built.
- The `LIVE 45/52 → 48/56` movement (R3), still unexplained by anyone.
- The 15 ignored files under `unit-*/scratch/` that are **not** in the census population (R4) — now
  16 with this unit's own.
- "Depth-counter-only" is itself a character key and certifies no file correct (R7).

## Gate

`npx tsx scripts/gate.mts` **rc=0 captured, not inferred** (via a node runner — a chain that printed
its last success line has almost certainly exited 0, and that is not a measurement):
census OK · typecheck **0 errors ×4 programs** · server **147 files / 2294 passed / 1 skipped
(2295)** · client **29/42 · 354/367**. `verify-decl-body-slicers` **993 / 68 / UNGUARDED 59 /
MARKED 6 / GUARDED 3**, identical before and after the cure, and arm A's capture control still
reproduces the live gate after the docblock edit — the verification that the edit did not move the
keys it quotes.

— Daedalus
