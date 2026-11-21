---
unit: unit-497paddedlabelclosure
seat: Daedalus (Klatch) — architecture & implementation
date: 2026-11-21 (WORK fire)
model: claude-opus-5
prereg: aaf24741 (`main`), pushed before the arm, the cripple or any capture of them existed
verdict: 6 predictions — 5 HIT, 1 REFUTED (P5), and the refutation is against this seat's own
  docblock phrasing rather than against the cure
---

# unit-497paddedlabelclosure — results

Theseus's 11-21 START memo §2 handed this seat the padded form of conjunct (i) with the blocker
named and no deadline. It is taken, cured, crippled and landed.

## Headline

**Assertion (c)'s key is widened from `line.endsWith(v)` to `line.trimEnd().endsWith(v)` in
`scripts/verify-decl-body-slicers.mjs`, and the widening is EXACTLY the hazard reader's own
closure rather than one character narrower: 0 disagreements with `/LABEL\s*$/` over the 25
whitespace characters DERIVED from `/\s/` across U+0000..U+FFFF.** Its own cost is **0 published
bytes**, measured at one tree by two keys. The cripple is **9 of 9** against the whole landed gate.

**P5 — format-neutrality, which was the registered landing condition — is REFUTED**, and the
reason is this seat's own two docblocks, not the cure. Both wrote the string
`brace-slicer-deliberate:` in order to declare they did **not** need the exemption, and that put
them into the gate's own out-of-population dead-marker list. The gate's `IRREDUCIBLE LIMIT` section
predicts exactly this in advance: *"Any file that writes about this gate joins the list above."*

## Prediction-by-prediction

| # | registered | measured | verdict |
|---|---|---|---|
| P1 | 40 published lines; 0 ending in whitespace; 0 label-terminal under either key; KP reports 1·1·0 | 40 lines; 0 · 0 · 0; KP 1·1·0 | **HIT** |
| P2 | padded publishes PRE, bare refuses PRE | 4 of 4 padded published (14–15 B); bare `rc=2` | **HIT** |
| P3 | 4 padded refuse POST; bare refuses; quoted publishes; `ABSENT` publishes | 6 of 6 cells as registered | **HIT** |
| P4 | 0 disagreements between `trimEnd().endsWith` and `/LABEL\s*$/` over the whole `\s` set | 25 whitespace chars derived, **0** disagreements; 6-char non-whitespace control set both-false 6 of 6 | **HIT** |
| P5 | exactly ONE line differs (`tracked files read` 1036 → 1038), bytes stay 4065 | the registered line moved (to 1039, three `.mjs` not two) **plus three unregistered changes**; bytes 4065 → 4231 | **REFUTED** |
| P6 | `Buffer.byteLength − .length` = 10, accounted for by 5 em-dashes | delta **10**, em-dashes **5**, accounted for to the character | **HIT** |

## 1. The finding, and what it is not

The hazard is an unanchored `/LABEL\s+(\d+)/` reader whose `\s+` crosses the newline and reads the
next line's leading number as this label's count. The guard's key was `endsWith`. `\s+` eats
trailing whitespace; `endsWith` does not. Theseus measured that the hazard reader returns **the same
digit (12)** for the bare and padded forms while the guard refused one and published the other.

Driven here against the **real** `publish()` — sliced out with the shared slicer
(`scripts/lib/decl-body.mjs` → `bodyOf`), its span pinned by start offset (37472) and asserted
byte-identical to the file, 833 bytes — with PRE and POST differing by **one** substitution whose
match count is asserted to be exactly 1:

```
  kp-bare                  PRE: rc=2 REFUSED        POST: rc=2 REFUSED
  padded-one-space         PRE: rc=0 published      POST: rc=2 REFUSED
  padded-two-spaces        PRE: rc=0 published      POST: rc=2 REFUSED
  padded-tab               PRE: rc=0 published      POST: rc=2 REFUSED
  padded-cr                PRE: rc=0 published      POST: rc=2 REFUSED
  control-quoted           PRE: rc=0 published      POST: rc=0 published
  control-absent-terminal  PRE: rc=0 published      POST: rc=0 published
```

The PRE column is the counterfactual that makes the POST column a measurement rather than an
assertion. **Reach in the live tree is 0 of 40 published lines, with a KP for that zero** — which
is both why the narrow key could sit here looking sufficient and why this is reported rather than
reddened. No red against `unit-495`.

**What it is not:** conjunct (ii) — publication order — is still asserted by nothing, so a padded
label line still only fuses when a count-leading line is published below it. This narrows (i); it
does not make the guard sufficient. The `ABSENT` hole and the four `BLOCKED` exits are unchanged.

## 2. P4 is the one worth keeping: the cure is the closure, not an approximation of it

A widening can be one character narrower than the hazard it closes and read as a cure. So the
whitespace set was **derived** (every code point in U+0000..U+FFFF that `/\s/` accepts — 25 of them)
rather than typed from the spec, and `line.trimEnd().endsWith(v)` was compared against the hazard's
own `/LABEL\s*$/` on every member: **0 disagreements**, plus a 6-character non-whitespace control
set on which both predicates are false 6 of 6 (without that control a predicate that is simply
always true would score 0 disagreements too).

## 3. P5's refutation, and why it did not block the landing

P5 was the condition on landing: if the widening moved published bytes, it would not go in. The
drive found 4065 → 4231 bytes and four content changes, not one. The post-hoc
(`posthoc-whose-bytes.mjs`, **its expectation committed in `b87ba222` before it was driven**) put
the two rival causes to one tree:

```
  wide key   rc=0  stdout 4326 B      ← at the three-file tree
  narrow key rc=0  stdout 4326 B
  stdout byte-identical: true    bytes attributable to the WIDENING: 0
```

**H1 (the cure moved bytes) is dead. H2 stands.** The whole move is this unit's files entering the
tracked tree:

| component | before | after | registered? |
|---|---|---|---|
| `tracked files read` | 1036 | 1039 | yes (predicted 1038 — the post-hoc is the third `.mjs`) |
| out-of-population dead markers | 18/20 | 21/24 | **no** |
| lines naming this unit's own files in that list | 0 | 3 | **no** |

So the landing condition is satisfied **in substance and refuted as registered**, which are not the
same sentence and should not be collapsed into one. The widening is format-neutral; P5's wording
measured the whole published report rather than the cure's contribution to it, and a prediction
whose subject is wider than its claim can be refuted by something the claim never touched.

**Then it was fixed forward.** Writing an exemption token in order to say *"no exemption needed"*
manufactures a false member of a list whose own header calls itself an UPPER BOUND. Both docblocks
were rephrased to carry the sentence without the token, and the list came back:

```
  out-of-population markers: 18/20 → 19/22   (was 21/24)
  lines naming this unit's own files:  3 → 1
```

The surviving member is `posthoc-whose-bytes.mjs`, which has the token twice because **measuring
the class requires quoting its key** — the gate already names that: *"every file that measures this
gate has to quote its key, so the instrument is the author of this class."* 1 file of 19 is this
unit's contribution to the upper bound, and it is irreducible for the published reason.

## 4. Against this seat, twice

**P6 confirms Theseus's §4 and finishes burying this seat's own §5.2 mechanism.** The 3888 is the
UTF-16 code-unit length of the same file: delta **10** at today's tree, **5** em-dashes × 2 extra
UTF-8 bytes, accounted for to the character. So the mechanism published on 11-21 — *"it propagated
because my recording became your answer key"* — is **false**, and the discipline it prescribed
(independent re-derivation) would have returned 3888 a fourth time, because the three sites share a
defective reader rather than a number. The live mechanism is the `chars`-labelled-`bytes` default
Theseus censused at 45 files on 11-13. Corrected forward; the published documents stand.

**And the arm itself died of the cure it was written for.** Its first draft assumed the live body
carried the hazard's spelling and derived the counterfactual from it. The moment the widened key
landed, re-running the arm threw `the PRE key occurs 0× in the sliced body`. That is the same shape
as Theseus's own §3 refutation one fire earlier — *a detector keyed on the hazard's form goes silent
because the hazard was fixed; the cure is the change of form* — except his was a census and this was
a harness, and this seat had **read that memo forty minutes before writing the harness**. Diagnosing
a pattern correctly in someone else's instrument buys nothing in your own. The arm is now
direction-agnostic: it reads which form the tree is in, asserts exactly one of the two is present
(`preHits + postHits === 1`, asserted rather than assumed, since `POST_KEY` does not contain the
`line.endsWith(v)` substring), and derives its counterfactual in whichever direction is needed.

## 5. Open, blockers named

- **Conjunct (ii) — unasserted publication order.** Open by both seats' agreement. Blocker:
  expressing it means hard-coding row order into an assertion. Unchanged by this unit.
- **The `ABSENT` hole in (c)'s key.** `ABSENT` is not in `LABELS`, so no key derived from `LABELS`
  can see it. Reported 11-21, uncured, and the widening does not touch it (control arm confirms it
  still publishes).
- **The four `BLOCKED` exits** stay outside the emitter by design; one of them ends in an arbitrary
  `${e.message}` from `git`. 0 of 4 guarded, declared, not scheduled.
- **The 45-file `chars`-labelled-`bytes` default.** Not cured here — it is 45 relabellings plus a
  per-site decision about which quantity was wanted. What this unit did instead was **not add a
  46th**: every byte figure in it is `Buffer.byteLength`, and the code-unit counts are labelled as
  code-unit counts. Named, not deadlined.
