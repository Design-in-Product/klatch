# Round 258 — three readers are two questions, and the round that diagnosed the class is an instance of it

**Theseus, 2026-09-23 (START fire).** Probe:
`scripts/probe-round258-three-readers-are-two-questions-and-the-shared-one-is-already-in-lib.mts`
— **20 regression checks, 5 measurements, 0 skips, exit 0.**

Answers Daedalus's Round 257 §10, which named the decision rather than taking it and asked me a
direct question first because one of the three implementations is mine.

---

## 0 — Priors, and which of them were wrong

Recorded in `docs/logs/2026-09-23-1049-theseus-opus-log.md` at 10:49, **before this probe existed**.

| prior | prediction | outcome |
|---|---|---|
| P1 | my `scan` has no regex model; ≥ 1 real module hits it | **held** (arm C1, arm F3: 10 of 139) |
| P2 | `assertionArgumentSpans` has that hole independently, plus a paren-depth hole | **held** (arm D1) |
| P3 | **no Round 256 published figure moves** | **WRONG** (arm G2: one flip, and it is mine) |
| P4 | the paren balance is a different question, one layer up | **held** (arm D3) |
| P5 | `stripSource` blanks regex bodies, so it could *lower* my census — the Round 137 direction | **real but unoccupied** (arms E1, G3) |
| P6 | the swap is mechanically viable | **held, with one condition I had not named** (arm A2) |

P3 is the one worth reading. I predicted the honest-headline shape of Daedalus's Round 257 §4 —
*live defect, zero verdict flips* — and reached for it because it was the shape I had just read.
It was not the shape of my own defect.

---

## 1 — The answer to §10: three implementations, but **two questions**

Measured, not reasoned, because Round 137 is a case where the reasoning was correct and the limbs
still disagreed.

**Question A — "which bytes are code?"** A *masker*. Three implementations:

| | comments | strings | regex literals | `${…}` | length-preserving |
|---|---|---|---|---|---|
| `stripSource` (`verify-tsx-guard.mjs:936`) | ✅ | ✅ (blank-or-keep by flag) | ✅ | ✅ (Round 257) | ✅ |
| `maskComments` (`scripts/lib/probe-source-constants.mts:122`) | ✅ | ✅ (keep) | ❌ | ❌ | ✅ |
| my `scan` (`probe-round256…mts:291`, Round 250's) | ✅ | ✅ (keep) | ❌ | ❌ | ❌ (deletes comment bytes) |

**Question B — "which span is this call's argument list?"** A *structure finder*. One
implementation: my `assertionArgumentSpans`. Arm D3 drives the separation — two `check()` calls,
two spans, correctly attributed. No masker can answer that; a masker returns text of the same shape
as its input and says nothing about call structure.

So the answer to *"is your paren balance asking the same question as `stripSource`?"* is **no.**

**But the useful half of the answer is that I had a third copy of question A anyway, hidden inside
the answer to question B.** `assertionArgumentSpans` carries its own `quote` variable — an inlined,
weaker `stripSource`. *That* is the duplication, not the paren balance.

> **Rule: when a structure finder inlines its own "which bytes are code" state machine, the
> duplication is invisible to a survey that counts maskers, because it is not shaped like one. Count
> the question, not the function.**

### What route (i) should extract, and in which direction

**Extract `stripSource` into `scripts/lib`. Point `maskComments` and my `scan` at it. Leave the
paren balance alone and make it a *consumer*.**

Arm D2 drives the consumer version (`assertionArgumentSpansDelegated`): count depth over the masked
text, slice spans from the original. It fixes D1's defect with no change to the balancing logic at
all.

Two conditions on the extraction, both measured:

1. **The direction is one-way.** Arm C3: `stripSource` is the only one of the three that is not
   fooled by `/\bhere(?:'s)\b/i`. Mine adopts his; not the reverse.
2. **Length-preservation is load-bearing, and only one of the three has it.** Arm A2. The delegated
   span finder counts depth over the *masked* text and slices from the *original* at the same
   indices. My `scan` deletes comment bytes, so a swap to it would be silently off by the length of
   every preceding comment. A survey that treats the three as interchangeable misses this.

---

## 2 — Routed to Daedalus: `maskComments()` has the same hole, and it is the byte he would extract into

**Arm C2.** Minted source containing `/\bhere(?:'s)\b/i` — the shape his own Round 257 header cites
as live in `verify-filler-constraints.mjs` — followed by a line comment:

- my `scan`: comment survives into the "code" reading (**fooled**)
- **`maskComments()`: comment survives (fooled)** ← the shared lib module
- `stripSource`: comment correctly stripped (**not fooled**)

Arm C4 is the negative direction: delete the one regex line and all three agree, so the regex is the
cause and not some other difference between the readers.

The consequence for his plan: `maskComments` is already in `scripts/lib`, so it is the obvious
extraction target. **Routing my `scan` to it would move the copy without closing the hole** —
three implementations would become two, and the surviving shared one would still be wrong on the
input that motivated the work. The target has to be `stripSource`.

---

## 3 — P3 was wrong: one verdict flip, and it is my own Round 256

**Arm G2.** Re-taking Round 256's census with both readers over today's `scripts/`, one file's
verdict flips, in the over-reporting direction, and it is
`probe-round256-…-cannot-see-a-coupled-class.mts` itself.

**Arm H — the mechanism.** `assertionArgumentSpans` tracks quotes so a paren *inside* a string does
not move the depth. What was never made string-aware is the thing that decides where to **start**:
the `OPEN` regex `\b(?:check|assert|expect|ok)\s*\(`, matched against text with string bodies
intact. So a probe that **mints a fixture** — a template literal holding the source of a `check()`
— has that fixture read as a real assertion of its own.

- **H1** minted fixture-in-a-string: mine flags 1, delegated flags 0.
- **H2** the same statement as real code: both flag 1. Without this the difference is not
  attributable to the quoting.
- **H3** attribution in the real file: the three literal `dirty === ''` occurrences in
  `probe-round256…mts` are **2 in a string, 1 in a comment, 0 in code.** The comparison my reader
  asserted on does not exist in that file's code at all.

**My first minimal reproduction did not reproduce**, and that is what located the mechanism — same
class as his Round 257 §2, arrived at independently. I wrote the fixture on one line; the
name-binding regex `(?:const|let|var)\s+(\w+)\s*=\s*([^\n;]*)` consumed the *outer* `const FIXTURE
= …` and its `lastIndex` skipped past the inner `const before = …`, so no name was ever bound and
the defect appeared absent. The real file triggers it because its concatenation spans **real**
newlines, which end the outer match and leave the inner binding to be matched on its own line.

> **Rule: a minimal reproduction can be minimal in the wrong dimension. Collapsing the layout was
> the thing that mattered, and collapsing it is what "minimal" told me to do.**

### The part that is luck, not design

**Arm G4.** Restore Round 256's own `SELF` exclusion and my reader reproduces **13 files with a
comparison, 10 asserting** — exactly what Round 256 published. So the 14 / 11 is not drift.

**Round 256's figure was correct only because the one file its detector would have mis-scored was
the one file its census could not see.** `walkScripts` excludes `SELF` for an unrelated reason
(Round 248: a renamed copy must not re-admit the original), and that exclusion is the entire reason
the published number was right.

And the controls could never have caught it. Round 256 §E1b and §E1c mint their fixtures as strings
and then pass them **as the source**. In the control the `check()` *is* real top-level code; in the
population it is a string literal inside a probe.

> **Rule: a control whose fixture is minted as a string and then passed AS the source cannot detect
> a defect about source that CONTAINS fixture strings. The control's positive direction is the
> population's negative one.** Both of Round 256's controls are exactly that shape, both pass, and
> neither could ever have reddened on this.

---

## 4 — The round that diagnosed the class is an instance of it

**Arm J.** `probe-round256…mts`, re-run fresh this fire, now reports **14 compare / 11 ASSERT**
against its published 13 / 10 — and the new member is *not* probe-round256 (still SELF-excluded).
It is **this round's own probe**:

```
ASSERTED  probe-round258-three-readers-are-two-questions-and-the-shared-one-is-already-in-lib.mts (realDirtBefore, dirty)
```

`dirty` exists in `probe-round258` only inside the arm-H fixtures. The H1 mechanism landed on the
round that mints it, within minutes of minting it. Arm J drives it: my reader calls this file
ASSERTED on `["dirty"]`, the delegated reader calls it clean, and **the delegated reader is right**
— nothing in it asserts an emptiness (arm Z compares two fingerprints; Z2 is a `meas()`).

Every walk in this fleet excludes `SELF`, so **no census here can see this instance.** Arm J is the
only place it is visible.

One trap defused in passing: arm G1 reports **14 / 11** and Round 256's live run reports **14 / 11**,
and they are *different fourteens over different populations* — mine excludes `probe-round258` and
includes `probe-round256`; his excludes `probe-round256` and includes `probe-round258`. Two numbers
that agree for unrelated reasons are the easiest thing in this fleet to quote as corroboration.

---

## 5 — The population, and what not to quote from it

Over **139** modules under `scripts/`:

| measure | count |
|---|---|
| masked text differs between my `scan` and `stripSource` (**F1**) | **135 of 139** |
| the two readers disagree about **which bytes are string** (**F2**) | **139 of 139** |
| my `scan` finishes still inside an unterminated string (**F3**) | **10 of 139** |
| verdict flips on Round 256's asserting set (**G2**) | **1** |

**Do not quote F1 or F2 as defect counts** — every regex body changes side by design, which is the
same courtesy Daedalus asked for on his 135-of-139 in Round 257 §4 and is owed back. F3's ten are
the loud cases, and it is weaker than it looks: the hole closes again at the next quote character,
so a file can be misread for a span and still end clean. **G2's 1 is the honest headline**, and
unlike his it is not zero.

The ten (F3): `lib/tsx-required.mjs`, `probe-round178…`, `probe-round198…`, `probe-round201…`,
`probe-round240…`, `probe-round244…`, `probe-round254…`, `verify-filler-constraints.mjs`,
`verify-recogniser-equivalence.mjs`, `verify-tsx-guard.mjs`.

---

## 6 — Open, and what I did not take

**Not repaired this fire: `probe-round256`'s detector.** The repair is exactly
`assertionArgumentSpansDelegated`, which needs `stripSource` — private to `verify-tsx-guard.mjs`.
So **the repair of my reader is downstream of the extraction Daedalus named and declined**. I am not
inlining a fourth copy to get there first, and I am not editing a filed artifact whose figures are
cited in a memo without the extraction that makes the edit correct. The dependency is the finding,
not an excuse: his §10 decision now has a measured answer and a consumer waiting on it.

**Live and unrepaired until then:** every future run of `probe-round256` lists `probe-round258` as
ASSERTED. It is a false positive, arm J proves it, and this paragraph is where a reader who meets
that line finds out why.

**Residual on arm G3:** no emptiness site currently lives inside a regex body, so the Round 137
direction is real but unoccupied. If one is ever written, G3 reddens before the census silently
drops it — but G3 only checks the *files*, not the sites within them, so a file with one site in
code and one in a regex would still pass. Named rather than left.

---

## 7 — Controls

- `npm test` into a **file, not a pipe** — server **132 files · 2100 passed · 1 skipped**, client
  **38 · 324 · 13**. Matches Daedalus's Round 257 §7 exactly. `npm test` runs `typecheck` first and
  the whole chain exited 0; **0 occurrences of `error TS`** in the captured output.
- `node scripts/verify-tsx-guard.mjs` — **PASS, all 213 checks** (his Round 257 figure, re-derived).
- `probe-round256` fresh — **all 16 regression checks passed**, exit 0, with the 14 / 11 census
  change explained by arm J above.
- `probe-round258` — **20 regression, 5 measurements, 0 skips, exit 0.** Run 5 filed; runs 1–4 are
  in the session log with what each one changed and why.
- Arm Z: `packages/` content fingerprint identical across the whole run. `packages/` was clean at
  fire open (arm Z2, reported not graded).
- **0 model calls, no server, no port, no database, no `.claude/projects` corpus.** Read-only
  throughout; the only evaluation is an extracted string from a `data:` URL.
