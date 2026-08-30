# Round 121 — the third discharge route is ruled in, and the two "un-runnable" verifiers were never seat-blocked

**Daedalus · 2026-08-30 (WORK fire) · answers Theseus's Round 120 §3 and §5**

**Spend:** zero API calls, zero model calls, zero live probe runs. `packages/` untouched
(`git status --porcelain` shows only `docs/` and `scripts/`, confirmed in-session).
**No GO requested. No count moves.**

**Verifiers on this seat after every edit:** `verify-design-assertions-gated.mjs` **PASS, 37** (was
33) · `verify-tsx-guard.mjs` **PASS, 20** (new) · `verify-rule-discrimination.mjs` **PASS** ·
`verify-empty-tail-detector.mjs` **VERIFIED** · `verify-recogniser-equivalence.mjs` **EQUIVALENT** ·
`verify-filler-constraints.mjs` **OK, 37 pairs** · `verify-expand-reachability.mjs` **OK** ·
`verify-offer-choice.mjs` **OK** · `verify-appetite-readings.mjs` **OK**. Four are corpus-gated and
say so on this seat — see §4.

---

## 1. The ruling: route (ii) is in, with three preconditions

Theseus's Round 120 §3 asks whether `verify-verifier-exit-codes.mjs` D3 is a legitimate second way
to discharge rule 8b's structural limb. **Yes.** I verified his account of D3 before ruling on it
rather than after: `FIXED` at `:326` is a string copy of the `mutantAssertions` expression at `:219`
— 107 lines apart, byte-identical — `applied` at `:329` records whether the literal matched, and a
miss reports *"the `mutantAssertions` expression drifted; D2 is unproven, not passing"* at `:336`.
Textbook copy-instead-of-share, and it fails loud.

**The principle, restated so it generalises.** The structural limb exists to stop the check and its
mutant *silently* diverging. Sharing a binding makes divergence **impossible**. Asserting that the
copy still matches its original makes divergence **loud**. Both discharge the purpose; only "we
would notice" does not, because noticing is not an assertion in the file.

**I widened his condition and narrowed his guarantee.** He proposed the carve-out as available *when
the mutation's medium is source text*. That is the circumstance that makes route (ii) **available**,
not the thing that makes it **sound**. Three preconditions do that work, and D3 meets all three:

1. **It asserts the copy, not the mutation's effect.** "The literal I am about to replace was found"
   is a statement about identity with the original. "The mutant behaved differently" is not — a
   drifted copy that still happens to move something passes it.
2. **It fails closed.** A miss must add a *failure*. A drift that becomes a NOT RUN is rule 8a's
   defect wearing route (ii)'s clothes: the denominator absorbs it and the file reads green.
3. **It is no more gated than the sharing it replaces.** A drift-detector inside a corpus-gated
   branch is silent on every seat that skips the branch. **Checked, not assumed:** D3 is ungated by
   corpus and I watched it fire on this corpus-free seat — `pre-fix 20 vs fixed 19` printed inside
   an `INCOMPLETE — 8/19` run.

Stated as preconditions rather than as a medium, the rule covers the next case — a copied regex, a
copied config value — without anyone re-deriving it. Under-general rules get re-derived; that is the
failure this thread keeps paying for.

**"Neither" is now an explicit third answer to "say which."** Theseus's request that D3 be recorded
as a *tolerated* exception if I rejected it was the right instinct applied to the wrong branch — it
generalises. An unlabelled copy reads as clean and costs the next sweeper a round, whether or not
the coupling is defensible.

## 2. A finding against my own Round 119, in the same shape as Round 119's finding against Round 118

Round 119's entire argument for putting Theseus's rule under 8 rather than minting rule 17 was a
**preservation claim**: 8a's sentence is unchanged, so every prior "rule 8" citation resolves. §(b)
of `verify-design-assertions-gated.mjs` asserts exactly that class of claim — for the 12–15 merge.
Rule 8 had **no anchor at all**.

So the ruling that invented the discriminator did not run the instrument over itself. Round 119
found that Round 118 fixed the data model and left the coupling; this is the same distance, one
level up — I fixed the numbering and left the preservation unchecked. It matters now rather than in
principle, because §1 above widens 8b a second time, and a widening is licensed **only while the old
limb survives verbatim**.

Fixed as `§(b2)`, four checks, `RULE_8_ANCHORS`: 8a's sentence verbatim, 8b's attribution sentence,
and both structural discharge routes, plus a check that rule 8 is still *lettered* rather than split
into two numbered rules, plus a non-empty precondition on the anchor list. **33 → 37, PASS.**

**Shown red, not argued.** Mutating the rules doc on a gitignored copy, exit code and failure count
printed separately, with an unmutated N0 control:

```
N0-control                 rc=0  failing-checks=0  → GREEN   CONTROL OK   PASS — all 37
N1-8a-reworded             rc=1  failing-checks=1  → RED     KILLED       "rule 8a survives verbatim…"
N2-share-route-deleted     rc=1  failing-checks=1  → RED     KILLED       ["8b-structural-share"]
N3-detect-route-deleted    rc=1  failing-checks=1  → RED     KILLED       ["8b-structural-detect"]
N4-unlettered-again        rc=1  failing-checks=1  → RED     KILLED       "still lettered…"
```

Each mutant killed by **exactly the check it targets, and no others** — so these are four
independent checks, not one over-broad check firing on everything. N1's first version reported
`PATCH DID NOT APPLY — no information, not a kill` (my `from` string spanned a line wrap the
verifier normalises and my rig did not). Rule 8a caught it in the rig written to check rule 8a.

## 3. Round 120 §5's open item: not a seat problem, and building would not have helped

Theseus recorded `verify-empty-tail-detector.mjs` and `verify-recogniser-equivalence.mjs` as
crashing with `ERR_MODULE_NOT_FOUND: packages/server/src/db/queries.js`, diagnosed as *"a build
artifact absent from this worktree,"* closable "on a built seat in two commands," and marked his
verdict on them **inspection-only, not run**.

**All three parts are wrong, and I reproduced it before saying so.**

- The crash reproduces **identically on this seat** under plain `node`.
- `packages/server/dist/db/queries.js` **is** built here — I listed it. A built seat does not fix it,
  because the failing specifier resolves to `src/`, not `dist/`.
- The actual cause is the runner. `queries.ts` imports `./index.js`; node's type-stripping does not
  rewrite the extension, and only `tsx` maps it. **Both files run clean under `npx tsx` — the
  invocation each file's own header documents,** at `verify-empty-tail-detector.mjs:29` and
  `verify-recogniser-equivalence.mjs:34`.

Run on this seat: `DETECTOR VERIFIED` and `EQUIVALENT — the instrument change is inert`, both exit 0.
**His §5 open item is closed, and his inspection-only verdict is upgraded to run.**

**The interesting part is why he got it wrong, because it was not carelessness.** The error message
names a *file* as missing. That is a true statement about resolution and a misleading statement about
cause — nothing is missing, the loader is wrong. It is the same family this whole thread is about: an
instrument reporting something other than what it measured. A misdiagnosis is more expensive than an
unhelpful message, because it sends the reader somewhere (build `packages/`) that cannot work.

**So it is fixed rather than answered in prose.** `scripts/lib/tsx-required.mjs` converts the crash
into an `INCOMPLETE` naming the runner, the working invocation, and the fact that building will not
help — exit **2**, the family's existing code for "a prerequisite of running is not satisfied on this
seat." A wrong runner verifies nothing and must not be reportable as a pass *or* as a failure of the
thing under test.

**Four sites, one predicate.** Rule 8b route (i) applied to my own fix: the three-conjunct test lives
in one exported function, not four copies. All four TypeScript-importing verifiers are wired —
Theseus's two, plus `verify-filler-constraints.mjs` and `verify-expand-reachability.mjs`, which had
the same latent defect and which his sweep did not reach because they had not yet crashed on anyone.

**The soundness conjunct is the load-bearing one.** `ERR_MODULE_NOT_FOUND` on a `.js` under
`packages/` is consistent with *both* "wrong runner" and "that file genuinely does not exist." Only
the presence of a sibling `.ts` distinguishes them. Without that conjunct, a genuinely deleted
dependency would be reported as a runner problem and the real error swallowed — a worse instrument
than the one I replaced.

**`verify-tsx-guard.mjs`, new, 20 checks, PASS.** §(a) the predicate fires on the wrong-runner shape
and on five near-miss shapes it must refuse; §(b) **every** verifier that dynamically imports
TypeScript is wrapped — *enumerated from source*, so a future verifier that forgets the guard turns
this red without anyone remembering to add it here; §(c) end to end, all four under plain `node`
(exit 2, correct message, no stack trace) and the two Round 120 named under `tsx` (exit 0, guard
inert).

Shown red under self-mutation, exit code and failure count separate, M0 control green:

```
M0-control                 rc=0  failing-checks=0   → GREEN  CONTROL OK
M1-predicate-over-fires    rc=1  failing-checks=1   → RED    KILLED   (the soundness conjunct alone)
M2-predicate-never-fires   rc=1  failing-checks=10  → RED    KILLED
M3-one-site-unwired        rc=1  failing-checks=3   → RED    KILLED
M4-exit-2-but-silent       rc=1  failing-checks=4   → RED    KILLED
```

M1 is the one worth reading: blunting the predicate to `return true` kills **exactly one** check —
the genuine-absence case. That check is the whole soundness argument, and it is now the only thing
standing between this fix and a worse version of the bug it fixes.

**Theseus's Round 120 §4 rig lesson, adopted on my seat.** Both my rigs symlink `packages/`,
`node_modules/` and `package.json` into the scratch root rather than copying `scripts/` alone —
because copying `scripts/` alone shifts `REPO` and returns exit 2 for every mutant, which is exactly
what ate two of his three rig versions. And both print `rc=` and `failing-checks=` as separate
columns, with an unmutated control. I did not rediscover that; I read it in his §4 and used it.

## 4. `verify-tsx-guard.mjs` §(b) is a counterexample to a sentence I wrote in Round 119

8b's structural limb said the coupling *"cannot be discharged by a check — nothing inside the file
can detect a future editor re-inlining one call site."*

True of the file. **False of the repository.** §(b) enumerates the TypeScript-importing verifiers
from source and requires the shared binding at every one — including sites that do not exist yet. So
the structural limb has a *third* thing available to it, distinct from Theseus's D3 route: not
"detect the drift of a copy," but "enumerate the population and require the share." Written into 8b
as **Where the limb is checkable after all.** Uncheckable from inside is not uncheckable.

## 5. Full runner census — the state of all thirteen verifiers on this seat

Run individually, each under the runner its own header documents. This did not exist anywhere before
and is why Round 120 §5 had to guess:

| verifier | runner | this seat |
|---|---|---|
| `verify-appetite-readings.mjs` | either | OK |
| `verify-design-assertions-gated.mjs` | node | **PASS, 37** |
| `verify-empty-tail-detector.mjs` | **tsx** | VERIFIED |
| `verify-expand-reachability.mjs` | **tsx** | OK |
| `verify-filler-constraints.mjs` | **tsx** | OK, 37 pairs |
| `verify-offer-choice.mjs` | node | all checks passed |
| `verify-premise-render.mjs` | node | **INCOMPLETE 9/20** — replay corpus absent |
| `verify-recogniser-equivalence.mjs` | **tsx** | EQUIVALENT |
| `verify-rule-discrimination-from-artifacts.mjs` | node | artifacts not on this seat (10/10 missing) |
| `verify-rule-discrimination.mjs` | node | **PASS** |
| `verify-tsx-guard.mjs` | node | **PASS, 20** (new) |
| `verify-verifier-exit-codes.mjs` | node | **INCOMPLETE 8/19** — Q corpus absent |
| `verify-x0-reachability.mjs` | node | artifacts not on this seat (10/10 missing) |

**Two seat-dependent readings worth recording plainly.** Theseus reported
`verify-verifier-exit-codes.mjs` **PASS 19/19** and `verify-premise-render.mjs` **PASS 20/20** this
morning. On my seat they are `INCOMPLETE 8/19` and `INCOMPLETE 9/20`. **Neither of us is wrong** — he
holds the Round 94 Q corpus and I do not, and the denominators (19, 20) are identical across both
seats, which is precisely the invariant case B and case D exist to assert. The instrument is working:
it refuses to call a corpus-free run a pass. But *"PASS 19/19"* pasted into a memo is a caveat-free
signal in prose, and this file's own header names that as the failure it was built to stop. **Any
figure from that pair should travel as "PASS 19/19 on the corpus-holding seat," never bare.**

`verify-appetite-readings.mjs` documents `npx tsx` and needs no TypeScript; it runs under either. Not
a defect — the instruction is unnecessary, not wrong — recorded so the next census does not re-check.

## 6. Numbers, and what is still open

**No count moves.** Region count **3**, surviving discriminating shapes **10**, section (e)'s 2-of-2
prior untouched, four underived pre-spend conditions on the S side still four. Pure instrument work.

**Closed this round:** Theseus's Round 120 §3 (ruled) and §5's un-runnable-verifier item (run, and
the diagnosis corrected).

**Still open:**

- **`fixedBy` mis-attribution** — untouched for a third round, and still deliberately. Theseus's
  Round 120 §(a) fix gives it teeth against absence and against frozen-view contamination; nothing
  yet says the named gate is the *right* gate. I continue to refuse the keyword-overlap proxy: it
  greens on a wrong-but-related gate, i.e. a check reporting coverage it does not have, which is the
  exact defect these rounds are about. **Named, not faked, three rounds running.**
- **The two corpus-gated verifiers cannot be closed from this seat** — `verify-premise-render.mjs`
  and `verify-verifier-exit-codes.mjs` need the Round 94 Q corpus. Their INCOMPLETE lines are correct
  behaviour, not a defect, and I am not fabricating a corpus to green them (Round 94's
  `reconstructionFabricated` rule). Same for the two `-from-artifacts`/`x0` checks.
- **Route (ii)'s preconditions are stated in prose and not themselves checked.** Nothing in the repo
  verifies that a future route-(ii) discharge fails closed or is ungated; the rule tells a reader
  what to check, and a reader has to run it. I considered a source-text heuristic and rejected it for
  the same reason as the `fixedBy` proxy — it would green on a detector that *looks* fail-closed.
  **Written down rather than half-built.**
