# Round 120 — the 8b sweep found two more sites, and the rig I built to prove the fix reported five non-answers first

**Theseus · 2026-08-30 (START fire) · zero API calls, zero model calls, zero live runs · `packages/` untouched · no GO requested**

Closes the open item Daedalus left in Round 119 §6: *"8b's structural limb is discharged in
`verify-rule-discrimination.mjs` §(f) **only**. The other `scripts/verify-*.mjs` have not been swept
for the copy-instead-of-share shape. That sweep is unrun."*

**Verifiers on this seat, run this fire:** `verify-design-assertions-gated.mjs` **PASS, 33** (was 29)
· `verify-rule-discrimination.mjs` **PASS** (unchanged, re-run not assumed) ·
`verify-verifier-exit-codes.mjs` **PASS, 19/19** · `verify-premise-render.mjs` **PASS, 20/20**.

---

## 1. The sweep, and what "swept" means here

Rule 8b (`docs/research/recall-arm-standing-rules-2026-08-28.md` §8) has two limbs. The structural
one — *the check and its mutant must apply the same named binding, not two copies of one intent* —
cannot be discharged by a check, so a sweep is the only instrument. All twelve `scripts/verify-*.mjs`
were read for check/mutant pairs. Because the vocabulary is not uniform, the sweep looked for three
idioms, not one: `MUTANT`/`mutation`, `negative control`, and `blunted`/`stand-in`/`must be caught`.
Searching only for the first would have missed the two files in group **B** below.

| File | Pair sites | Verdict |
|---|---|---|
| `verify-rule-discrimination.mjs` | 2 (§f) | **Clean** — Round 119's four shared bindings; no other section has a pair |
| `verify-design-assertions-gated.mjs` | 2 (§a, §c) | **Both defective** — §2 below |
| `verify-verifier-exit-codes.mjs` | 2 (C, D3) | **Clean, by a different mechanism** — §3 |
| `verify-empty-tail-detector.mjs` | 2 (negative controls) | Clean by inspection — §4 |
| `verify-recogniser-equivalence.mjs` | 1 (negative control) | Clean by inspection — §4 |
| the other 7 | 0 | No pair to sweep |

The two files with 35 and 29 raw `mutation` hits were the obvious candidates. The one that carried
the defects had 13, and the two clean ones had **zero** — the count is not the signal.

## 2. Two defects, in the file that checks the rules document

Both are in `verify-design-assertions-gated.mjs` — the file whose §(b) asserts that rule 8 was
widened rather than renumbered. Daedalus re-ran it green at 29 this morning, correctly; green was
never the question.

### (a) The as-of split — an inline copy, and half a claim never evaluated

**Structural.** The LIVE check filtered `PROPERTIES` on a four-clause predicate written inline; its
mutant filtered `MUTANT_PROPS` on a *second inline copy* of the same four clauses. Byte-identical
today, so nothing was wrong — this is the "correct today, one edit from silently uncoupling" case,
two of Daedalus's three §(f) sites in the same shape. This is my own Round 118 fix; the coupling
defect was in it from the start, one level below the data-model defect I did fix.

**Attribution, and this one is the sharper find.** The mutation's own sentence is *"drop P6u's
fixedBy and it reopens as a live finding, **while the frozen record is unchanged**"* — a conjunction.
Its expression evaluated `mutantOpen` and nothing else. `MUTANT_PROPS` had exactly **one reader** in
the file. The second conjunct was asserted nowhere.

That is rule 8b with the polarity reversed from where Round 118 found it. Round 118's case was a
*mutant* claiming a check it never ran through. This is a *check's name* claiming a conjunct its own
expression never evaluates — and the unevaluated conjunct is precisely the independence of the two
tenses, which is the entire point of the as-of split. The check most load-bearing for the Round 118
amendment was the one not being made.

**Fixed:** `frozenFindingsIn(props)` and `openTodayIn(props)`, each applied to both `PROPERTIES` and
`MUTANT_PROPS`. The MUTANT check now evaluates both conjuncts, plus two `BITES` checks — the
mutation moves the live expression, and leaves the frozen one alone.

### (b) §(c)'s mutant reads `WEAKENING_USES[0]` while the check loops the whole list

**Structural, and it is a latent narrowing rather than a copy.** The live check accumulates findings
across *every* entry of `WEAKENING_USES`; the mutant was built from `WEAKENING_USES[0].sites` and
re-expressed the `SUPPORTING_USES.includes` filter inline. Today `WEAKENING_USES.length === 1`, so
the two agree exactly — and the section's own honest limit says so: *"arm S has exactly ONE weakening
property today."*

The day a second WEAKENS property is added, **the check widens and the mutant does not.** The verdict
line would speak for all properties while the mutation licensed only the first one's arm, with no
check anywhere going red. The condition that makes the defect invisible (n=1) is stated in the file,
three lines above the defect, as a reason to trust the mutation.

**Fixed:** `supportingSitesIn(uses)` applied to both inventories, and the mutant now mutates the
**inventory** — `WEAKENING_USES.map(...)` reclassifying one site of entry 0 and carrying every other
entry unmutated — rather than a slice of it. It survives a second property being added. Plus two
`BITES` checks: the reclassification moves the finding expression, and does *not* move the
marker/site-count expression (the independence §(c)'s two checks need in order not to be one fact
under two names).

**29 → 33 self-checks, all green.**

## 3. `verify-verifier-exit-codes.mjs` — a copy that is safe, and why that is a real distinction

Case D3 holds `FIXED`, a **string copy** of the `mutantAssertions` expression at line 219, and
source-replaces it with Round 105's pre-fix form. That is textbook copy-instead-of-share: edit line
219 and the copy is stale.

It is nonetheless discharged, because the copy going stale is **fail-loud, not silent**. `applied`
records whether the literal matched, and a miss reports
*"the `mutantAssertions` expression drifted; D2 is unproven, not passing"* — rule 8a doing exactly
the job 8a exists for. This is worth naming as a pattern rather than waved through: **8b's structural
limb can also be discharged by making drift detectable, not only by sharing a binding.** A
source-text mutation is one of the few places where that is available, because the text it replaces
*is* the thing that must not drift.

Case C mutates the module under test and reads a real child run's verdict. There is no re-expression
to drift.

## 4. The two "negative control" files — clean by inspection, and I could not run them

`verify-empty-tail-detector.mjs` compares `readCallKind(c.summary)` against
`bluntedDetector(c.summary)`, where the blunted variant *wraps* the real function; and
`driftedPrefix` is compared against the real detector's own output as the reference.
`verify-recogniser-equivalence.mjs` applies the same `comparable()` to both the drifted and the real
recogniser's read. All three are the correct shape: the real binding is the reference, the variant is
derived from or compared against it.

**Stated because it is against this section:** both files crash on this seat —
`ERR_MODULE_NOT_FOUND: packages/server/src/db/queries.js`, a build artifact that is not present in
this worktree. My verdict on them is **from reading the code, not from running it**, and it stays
that way until someone runs them on a built seat. `packages/` was not touched this fire.

## 5. Against myself: the rig I built to prove the fix reported five non-answers

The four new checks are demonstrated red under self-mutation — five mutants, all `rc=1` KILLED, an
unmutated M0 control green. That is the second version of the rig.

The first version wrote mutants to `/tmp` and reported **`rc=2`, zero failures, for all five**. Exit
2 in this file is *"an input document is not on this seat"* — the verifier derives `REPO` from
`dirname(import.meta.url)/..`, so a mutant run from `/tmp` finds no `docs/`. Five patches applied,
five INCOMPLETEs, zero information. The second version moved them to `scripts/.r120-scratch/` and did
it **again** — a subdirectory shifts `REPO` down one level the same way.

I only knew because I printed the failure count and the exit code separately rather than reading
"non-zero, so it died." A rig that reports a non-zero exit and calls it a kill is the same defect this
entire thread is about, and I built it twice in the fire whose whole subject is that defect. The M0
control — an unmutated copy that must stay green — is what named the cause both times; without it
the third run would have looked identical to the first two and I had no other instrument that would
have told them apart.

The mutants, verbatim, so this is reproducible without the rig (which is deleted):

| id | mutation | killed by |
|---|---|---|
| M0 | none (control) | — green, rc=0 |
| M1 | `'P6u'` → `'NOPE'` in `MUTANT_PROPS` (mutation stops biting) | MUTANT-a, BITES-live |
| M2 | non-P6u branch `p` → `{...p, gate: null}` (mutation also moves the frozen view) | MUTANT-a, BITES-frozen |
| M3 | re-inline `openTodayIn` at the mutant site, one clause dropped | MUTANT-a |
| M4 | `i === 2` → `i === 99` in the site reclassification | MUTANT-c, BITES-c-moves |
| M5 | reclassify → `filter((s, i) => i !== 2)` (delete the site instead) | MUTANT-c, BITES-c-moves, BITES-c-marker |

M3 is the one that matters for the structural limb: it is a *re-inlining*, the exact edit the limb
says no check can catch — and here it is caught. **That does not generalise and I am not claiming it
does.** It is caught because this particular drifted predicate happens to change the result. A
re-inlining that stays value-equivalent today and drifts tomorrow is still undetectable from inside
the file. The limb remains discharged by construction; M3 is a bonus, not a proof.

## 6. Numbers and open items

**No count moves.** Region count **3**. Surviving discriminating shapes **10**. Four underived
pre-spend conditions on the S side, still four. Section (e)'s 2-of-2 prior untouched. Nothing in this
round bears on any of them; it is entirely instrument work.

**Closed:** Round 119 §6 — the cross-file 8b sweep. Twelve files, three idioms, two defects found and
fixed, one pattern named (§3).

**Still open, not touched by this round:**
- `fixedBy` **mis-attribution** — Daedalus's Round 119 §5, deliberately not closed with a keyword
  proxy. Unchanged. The §(a) fix above gives `fixedBy` teeth against *absence* and now against
  *frozen-view contamination*; it still says nothing about the named gate being the **right** gate.
- **Newly open, from §4:** `verify-empty-tail-detector.mjs` and `verify-recogniser-equivalence.mjs`
  have never been run on this seat. Their 8b verdict is inspection-only. Anyone on a built seat can
  close this in one command each.

**No GO requested. No spend. `packages/` untouched.**

— Theseus
