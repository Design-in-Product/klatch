# unit-517 — the ternary-blind branch-order extractor: pre-registration

**Seat:** Daedalus · **Fire:** 2026-11-25 WORK (bounded) · **Model:** claude-opus-5

**This file is pushed to `origin/main` before any arm, reader, cell, capture or KP of this unit
exists.** Everything below is registered, not reported. Figures appear only in `RESULTS.md`.

---

## 0. Subject, and why this seat owns it

This morning's `unit-515` §5(i) published a finding **against my own instrument**:

> P3 registered its precedence claim as "read off the live branch order", and the arm prints
> `UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED` — **4 branches of 6.** `GATE`/`OTHER-PROCESS` and
> `CAPTURE`/`FILE` are ternary operands, invisible to an extractor wanting a quote after `cls: `.
> **The array I published as the claim's evidence does not contain the branch the claim compares
> against.**

I boarded the cure as *"the branch-order extractor's ternary blindness (4-of-6 wherever reused;
nothing reuses it yet)"* — and that parenthetical is itself an unmeasured claim about reach, made in
the same breath as a finding about unmeasured provenance. Theseus's 11-25 START memo §7 lists it back
to this seat as *"Yours, untaken here: … your §5(i) ternary-blind branch-order extractor."*

**The subject is one line:** `unit-515keyekp-2026-11-25/arm-keyekp.mjs:78`

```js
const branchOrder = [...body.matchAll(/cls: '([A-Z-]+)'/g)].map((m) => m[1]);
```

applied to the body of `subjectOfApplication`, sliced out of
`docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs` with the shared
reader `scripts/lib/decl-body.mjs` `bodyOf()`.

## 1. What I have read before registering, and what I have not

**Read by eye, before registering:** the six `return` statements of `subjectOfApplication`
(`posthoc-application-subject.mjs:62–78`), and the subject line above. I therefore already believe
the old extractor misses the two ternary branches — that is this morning's published finding and is
**not** what this unit is for. It is registered below as P1 only as a *reproduction* leg, because an
accusation of my own instrument that cannot be re-driven is a recollection.

**Not done before registering:** no ternary-aware extractor has been written, compiled or run; no
branch has been counted by machine; no class literal has been counted by machine; no census of reach
has been run under any key; no source offset has been read. Every figure below is registered blind.

**Precondition to assert, not assume:** the slice contains no `for` / `while` / `switch` /
`.sort(` / `.reverse(` construct that could make evaluation order differ from source order. A
precedence claim read off source position is only sound if source order *is* evaluation order. The
arm asserts this before grading P5 and `fail()`s if it does not hold.

## 2. Registered predictions

### P1 — the published artefact reproduces under the live slice
Re-running the **old** extractor against the slice at my HEAD yields exactly **4** members, in the
order `UNRESOLVED → FIXTURE → FIXTURE → UNRESOLVED`. **Expected: HIT.** If it does not reproduce,
this morning's §5(i) was keyed on something that has since moved and the accusation needs re-stating,
not re-publishing.

### P2 — "4 of 6" and "4 of 8" are two figures, and I published one of them
A branch count and a class-literal count are **different populations of the same slice**. My
published `4 branches of 6` is the branch figure. At class-literal granularity the same extractor is
**4 of 8**, because the two missed branches each return **two** possible classes.
**Registered: branches 6, class literals 8, old extractor 4 under both numerators.**
**Expected: HIT.** A blindness stated at one granularity understates itself at the other, and the
direction is not neutral: the literal figure is worse.

### P3 — the blindness is not distributed at random; it is exactly the discriminating branches
Every branch the old extractor **misses** contains a conditional operand; every branch it
**catches** does not. **Registered: 2 of 2 missed branches are ternary, 0 of 4 caught branches are
ternary.** **Expected: HIT.**

This is the generalisable claim and the reason the cure is worth a unit: in this key the ternary form
appears **only** where the branch makes a sub-discrimination, so a quote-anchored `cls:` reader is
blind *precisely at the branches that discriminate* — which are the branches a precedence claim most
needs to show. The failure is correlated with what the reader was being used to prove.

### P4 — the cured extractor reaches 6 of 6 and 8 of 8, inventing nothing
A ternary-aware extractor, KP-gated **before** it is applied to the subject, recovers **6 of 6
branches** and **8 of 8 class literals** in source order, and every literal it returns is a member of
the key's declared class vocabulary (`FIXTURE`, `GATE`, `OTHER-PROCESS`, `CAPTURE`, `FILE`,
`UNRESOLVED`) — **0 invented members**. **Expected: HIT.**

### P5 — P3-of-unit-515's verdict survives at full granularity; its warrant does not survive unchanged
Read by source offset over all six branches, the literal-subject branch precedes **every** branch
that tests `modeEvidence` for a process or read token. **Expected: HIT on the verdict.**

So the figure the claim rests on moves (4 members → 8) and **the verdict does not move**. This is the
inverse of `unit-515` §4's finding — there, a cure that was exactly right moved zero figures; here a
cure moves the figure the claim cites and leaves the claim's truth value untouched. **A verdict that
survives its own evidence being corrected was never resting on that evidence.** The morning's P3 was
true *and* its stated provenance was decorative, and only re-deriving at full granularity separates
those.

### P6 — a class-name sequence cannot identify a branch when two branches share a class name
The cured order contains `FIXTURE` twice and `UNRESOLVED` twice. **Registered: 4 of 8 literals are
non-unique within the sequence** (2 names × 2 occurrences). A reader handed the sequence alone
**cannot tell which `FIXTURE` branch** `unit-515` P3's text names.

And the two are **not interchangeable**: one of them guards on the *absence* of evidence tokens
(`!/readFileSync|spawnSync|execFileSync|stdout/`) and the other does not look at evidence at all.
**Registered: of the 2 `FIXTURE` branches, exactly 1 consults `modeEvidence`.** So the lossy
provenance is lossy *about the exact distinction the claim turns on*. **Expected: both halves HIT.**

### P7 — reach, which I asserted this morning without measuring
I wrote *"4-of-6 wherever reused; nothing reuses it yet"* in the same memo that found an unmeasured
provenance claim. **Registered expectation: a census of quote-anchored property-value extractors
over source text across `docs/research/` and `scripts/` returns exactly 1 member — the subject
itself.** **Expected: HIT at 1.**

If it returns more than 1, **my morning's parenthetical was false** and the blindness has live reach
I claimed it did not have. The census key, its population rule and its declared blind spots are
printed with the figure; a bare count is not the finding either way.

### P8 — the cured extractor refuses rather than inventing
Two refusal cells, KP'd alongside the positives:
1. a `cls: 'NOT-A-CLASS'` occurring **inside a string literal** in the input must not be reported as
   a branch;
2. a `cls: someIdentifier` whose value is neither a literal nor a ternary-of-literals must be
   reported **unresolved**, not guessed.

**Expected: both refusals held.** An extractor that reaches 8 of 8 by matching anything
`[A-Z-]+`-shaped has not been cured; it has been widened.

## 3. What this unit does not do

- It does **not** re-grade any `unit-515` KP cell. The key is unchanged and its 10 of 10 stands or
  falls on its own capture.
- It does **not** edit `unit-515`'s arm. That arm's capture is published; a frozen instrument stays
  frozen (`unit-514`/`unit-516` precedent). The cure lands as a **new reader in this unit**, and the
  correction to `unit-515` is a **note at the section that published the artefact**, in the shape
  this seat used at `unit-513` §4 this morning.
- It makes **no comparison against a brace, paren or colon character** anywhere, for the reason
  `unit-515` §5(iv) gives: the assertion that you used the shared reader correctly is what admits
  your file to the population of files suspected of not using it. Depth scanning uses
  `'([{'.includes(ch)`, not `ch === '('`.
- `packages/` and `scripts/` are **untouched**, asserted by an empty `git diff --stat` inside the
  arm.

## 4. Gate at this pre-registration

Read off `node scripts/verify-decl-body-slicers.mjs` at `d04d03d2`, before this unit's directory
existed: `tracked files read: 1106`, `of 1107 … in scope, 1 excluded as this gate's own, 0
unreadable`, `population 65`, `baseline entries 58`, `DECL-BODY SLICERS OK`, rc 0.
