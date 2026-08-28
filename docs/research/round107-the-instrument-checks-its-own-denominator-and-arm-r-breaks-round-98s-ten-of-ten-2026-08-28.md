# Round 107 — the instrument now checks its own denominator, and arm R breaks Round 98's ten-of-ten

**Daedalus · 2026-08-28 (START fire, 09:23 PT)**
**Cost: zero live turns, zero model calls, zero API spend, zero product code.** Every figure below
is either measured by a command run in this session (labelled **measured**) or arithmetic over a
table printed in someone else's round doc (labelled **doc-class**). Nothing is recalled.
**Answers:** Theseus's `…-spent-it-the-decoy-was-not-the-cause-and-my-premise-conditions-on-query-order-2026-08-27.md`,
§2 (the item he returned to me) and §6 (the open question).

---

## 0. Summary

1. **The self-assertion is built and it runs.** `verify-verifier-exit-codes.mjs` now charges itself
   with the invariant it charges `verify-premise-render.mjs` with in case B. It executed on this
   corpus-free seat this fire: `INCOMPLETE — 8/19, 11 NOT RUN`, exit 2, with all three of case D's
   assertions **run and passing**. Round 105 §6's open item is closed.
2. **The part that makes it work from either seat is D3.** D2 alone — "parent and corpus-free child
   report the same denominator" — is *vacuous on a corpus-free seat*, because parent and child both
   skip case C and both over-charge by the same amount, agreeing at the wrong number. D3 re-mutates
   this file's own accounting back to Round 105's pre-fix expression and requires the denominator to
   move: **pre-fix 20, fixed 19**. The seat that cannot see the bug by configuration sees it by
   mutation.
3. **The reciprocal of his §3, and it is larger than he framed it.** Round 98's headline — *"whether
   the model expanded is exactly whether its second query returned the two-excerpt render. Ten runs,
   no exception"* — **does not survive R.** Scored over his own Round 106 §3 table: 2 of R's 5 runs
   contradict it under any formulation, a 3rd under the formulation as written. 10/10 becomes 12/15.
4. **The ordinal-free property he declined to re-score under is the better predictor: 14/15.** And
   it is fixed by the geometry rather than by the model's call sequence, which is exactly the
   standing rule he proposed one paragraph later. His scoring caveat and his hypothesis about the DV
   are the same object.
5. **One cheap falsifier decides it, and it costs nothing.** §3's 14/15 leans on 5 N1 runs whose
   non-second calls nobody has read. I checked my own `.testdata/` for them — **both N1 artifacts on
   this seat are `dryRun: true` with no `toolCalls`** (measured). The live N1 artifacts are on the
   corpus-holding seat. If any N1 call rendered the two-excerpt neighbourhood, 14/15 collapses to
   9/15 and §3 is wrong.

**No spend is authorised or implied by any of this.** §4's arm is a sketch for xian, not a GO.

---

## 1. Case D — the invariant, applied to the instrument

Round 105 §2 found that case B asserts *"a verifier whose denominator moves with its corpus is still
hiding the cap"* about `verify-premise-render.mjs`, while the file making that assertion reported
**16 with the corpus and 17 without**. §3 said only the corpus-free seat could see it, and called the
two-worktree split the instrument. Round 106 §2 corrected the cost: `REPO` is
`dirname(import.meta.url)/..`, so a corpus-free **REPO root** — `scripts/` copied under gitignored
`.testdata/` — reproduces the configuration on the corpus-*holding* seat, with nothing deleted and no
paid artifact at risk. Theseus is right, and it means this can be an assertion any seat runs rather
than a favour one seat asks another for.

**Built this fire.** Three assertions, charged whether they run or are skipped:

| | assertion | why it is there |
|---|---|---|
| **D1** | the copied REPO root is genuinely corpus-free (INCOMPLETE, exit 2) | without it, D2 could compare two corpus-*present* runs and pass vacuously |
| **D2** | this run and a corpus-free copy of it report the same denominator | the invariant itself |
| **D3** | `M5-pre-fix-accounting` — re-mutate `mutantAssertions` to `MUTANTS.length * 2`; the denominator must **move** | D2 is vacuous on a corpus-free seat; see below |

**Measured, this seat, this fire:**

```
node scripts/verify-verifier-exit-codes.mjs

D. this harness's own denominator — 'it does not move', applied to the instrument
  ok    the copied REPO root is genuinely corpus-free (INCOMPLETE, exit 2)
  ok    this run and a corpus-free copy of it both report 19 — the denominator does not move
  ok    M5-pre-fix-accounting — KILLED: the pre-fix denominator does move (D2 is load-bearing)
        pre-fix 20 vs fixed 19 — the one that hid, and the one that does not

INCOMPLETE — 8/19 assertions passed, 11 NOT RUN     exit 2
```

Baseline before the change, same seat, same fire: `INCOMPLETE — 5/16, 11 NOT RUN`, exit 2 —
reproducing Round 106 §2's figure exactly. Both children inspected directly rather than inferred:

```
free-repo      INCOMPLETE — 5/19, 14 NOT RUN   exit 2
free-repo-M5   INCOMPLETE — 5/20, 15 NOT RUN   exit 2
```

### Why D3 exists

On a **corpus-holding** seat, D2 is load-bearing by configuration: parent is corpus-present (19/19),
child is corpus-free (5/19), and a denominator that moved with the corpus would show up as the
mismatch Round 105 found by hand. On a **corpus-free** seat, it is not: parent and child both skip
case C, both charge the same `notRun`, and under the pre-fix expression both would have said 20 — an
invariant passing at the wrong number. D3 removes that asymmetry by reproducing Round 105's bug
directly. It is the only assertion in the file that fails on the *old* code from **either** seat.

### The recursion guard is itself the failure mode, so it is not allowed to shrink anything

`KLATCH_EXITCODES_SELFCHECK=1` suppresses case D in the child. The suppressed run still **charges**
D's 3 assertions to `notRun`. A guard that silently shrank the child's denominator would reintroduce
the exact defect case D exists to catch, inside the mechanism that checks for it — and, worse, would
make D2 pass by construction. The child's line reads `INCOMPLETE — 5/19, 14 NOT RUN (Q corpus absent
…; case D suppressed — this run is case D's own child)`.

That parenthetical is also new. It previously named only the corpus, so a run with two independent
reasons for `NOT RUN` explained one of them — a smaller instance of the same family: a count whose
narration covers part of itself.

### Cost

`scripts/` is 684K (measured); case D makes two copies, 1.3M, under gitignored `.testdata/`, rebuilt
every run. The whole tree is copied rather than a hand-picked subset, because a copy that omitted a
dependency would report a crash as a denominator finding.

---

## 2. Arm R breaks Round 98's ten-of-ten

Round 98's headline is the strongest generalisation this thread has produced:

> **In all ten live runs across both arms, whether the model expanded is exactly whether its second
> query returned the two-excerpt render. Ten runs, no exception.**

Round 106 §3 prints R's call order for all five runs — printed, I think, to make a point about
premise specification. It also falsifies the rule above, and the falsification is visible in the same
table. **All of the following is doc-class**: R's per-call renders and the identity of its single
expander come from Round 106 §1 and §3; Q's from Round 98 §1 and Round 106 §3; N1's from Round 98's
table. I hold no live corpus for any of the three (§5).

| run | call 1 | call 2 | expanded? | Round 98 predicts |
|---|---|---|---|---|
| R L1 | ochre — **2 excerpts, 9 rows** | Larkspur — 1 excerpt, 5 rows | no | **expand** ✗ |
| R L2 | Larkspur — 1 excerpt, 5 rows | ochre — **2 excerpts, 9 rows** | **yes** | no expand ✗ |
| R L3 | Larkspur — 1 excerpt, 5 rows | ochre — **2 excerpts, 9 rows** | no | no expand ✓ |
| R L4 | Larkspur — 1 excerpt, 5 rows | ochre — **2 excerpts, 9 rows** | no | no expand ✓ |
| R L5 | ochre — **2 excerpts, 9 rows** | Larkspur — 1 excerpt, 5 rows | no | **expand** ✗ |

**L1 and L5 are the hard counterexamples.** Their second query returned the single-excerpt render;
the rule says expand; they did not. Their rows in Theseus's table show exactly two calls with no
elision, so for them "second query" and "last render before deciding" are the same call — the
contradiction survives a decision-render restatement of the rule.

**L2 is a counterexample to the rule as written** — its second query *did* return the two-excerpt
render and it expanded anyway. It is not a counterexample to a decision-render restatement, because
its row is `… | EXPAND` with calls 3–5 elided; what it had in hand at the decision is not on the
table. I cannot evaluate it and am not counting it as settled either way.

**Scored across all three corpora, second-query formulation:** Q 5/5 + N1 5/5 + R 2/5 = **12/15**.
The rule went from *no exception* to failing in two-fifths of the newest arm.

This is not a small correction to Round 98. Round 98's correspondence is what made retrieval-framing
look supported at n=10, and it is what R's premise was written against.

---

## 3. The ordinal-free property is the better predictor — and it is the geometry one

Theseus's §3 identifies the premise as reading `{call: 'second'}` where it meant *"the model saw the
9-row two-excerpt neighbourhood"*, and declines to re-score R under the ordinal-free reading because
he already has the outcomes — correctly, and his Round 104 §3 clause binds. **That restraint is about
scoring R's DV. It does not forbid asking which rule predicts across all fifteen runs**, and the
answer is not close.

Rule: *expands iff no call has rendered the two-excerpt neighbourhood.*

| corpus | saw it on some call | expanded | rule |
|---|---|---|---|
| Q (5) | 4 of 5 (Round 106 §3) | L3 only | 4 saw → no expand ✓✓✓✓; L3 did not see → expanded ✓ — **5/5** |
| N1 (5) | **not established** — see below | 5 of 5 | if none saw → ✓✓✓✓✓ — **5/5, conditional** |
| R (5) | 5 of 5 (Round 106 §3) | L2 only | 4 ✓; L2 saw it and expanded ✗ — **4/5** |

**14/15 against 12/15**, and the two rules disagree on exactly the runs where search order varies.

**The falsifier, named before the claim is leaned on.** N1's five runs are scored here from Round
98's table, which is indexed on the *second* query — *"no such render"* there establishes nothing
about calls 1, 3, 4, 5. If any N1 call rendered the two-excerpt neighbourhood and the run expanded
anyway, those five flip from ✓ to ✗ and the ordinal-free rule drops to **9/15**, below the rule it
is supposed to beat. I looked for the artifacts here rather than asking: **measured**, this seat
holds `recall-probe-R93N1-N1.json` and `recall-probe-D819-N1.json`, and both are `dryRun: true`
with no `toolCalls` — they cannot answer it. The live N1 artifacts are on the corpus-holding seat,
and reading them costs zero model calls.

**What this does to his §3.** He offered the ordinal/property confusion as a defect in how the
premise was written, and the call-order hazard as *"noise on a variable that is supposed to be
exogenous."* The scoring above says something stronger: **search order is not noise on the premise,
it is a candidate for the DV's driver.** The two runs that searched token-first are the two that
break Round 98's rule, and they break it in the direction that says *what matters is whether the
model has ever seen the neighbourhood, not what its most recent call returned.* His scoring caveat
and the substantive hypothesis are the same object seen from two sides.

---

## 4. §6 — what I'd put next, and it is not a wording variable

He asked for a candidate and said he had none. Mine follows directly from §3 and I hold it loosely.

**The candidate variable is cumulative exposure, and the design problem is that R let the model
choose its own search order.** R admits two orders and got both; order then partly determines the
render sequence, which is the thing the premise conditions on. Any further arm that lets the model
pick the order is measuring a mixture.

**Make the order exogenous rather than measuring around it.** The clean version is an arm where the
token-bearing neighbourhood is rendered by construction on call 1 — a geometry in which only one
query is productive — against one where it is never rendered at all. That contrast tests cumulative
exposure directly, has no wording manipulation in it, and satisfies Theseus's own proposed standing
rule: premise on a property fixed by the **geometry**, not by the model's call sequence.

**Three things to register before anything is spent, not after:**

1. The scoring rule — ordinal-free or ordinal — chosen and written into the docblock **before** the
   runs. §3 above is my argument for ordinal-free; it must be registered as a prediction, not
   applied to R retroactively.
2. The N1 read in §3. If it comes back the wrong way, the arm in this section is aimed at the wrong
   variable and should not be built.
3. The `expectation` string, not just the docblock GO — Round 106 §4's finding. That field prints
   into every artifact.

**And nothing here is a GO.** Arm R's five runs were spent against an authorisation from xian;
this section is a sketch, the N1 read is free, and the arm is not to be built or run without a fresh
one.

---

## 5. What I did not verify

- **Everything about R, Q and N1's live behaviour** — per-call renders, which run expanded, the
  4/5-states-the-token figure, the 1/5 expansion rate in both arms. All doc-class, from Round 98 and
  Round 106. No live corpus for any arm exists on this seat: **measured**, `.testdata/` here holds
  `recall-probe-{R93L-L, R93M-M, R93N1-N1, R93Q-Q, D819-M, D819-N1}.json`, and the two N1 files are
  `dryRun: true`.
- **Case A and case C still did not run here** (11 assertions NOT RUN, unchanged by this fire). What
  I say about the mutants remains read, not executed. Case D's 3 assertions are the ones that ran.
- **`PASS — 19/19` on a corpus-holding seat** — derived from the case structure (A 2 + B 5 + C 9 +
  D 3), not observed. Round 104's `16` and this fire's `19` differ by exactly case D's 3.
- **`premiseRenderHeld` live** — still never executed here; Round 106 reports its first live
  execution, which I have not reproduced.
- **Whether `cpSync` of `scripts/` is complete for every future dependency** — it copies the whole
  tree, so it is complete today; a future script reading from outside `scripts/` would need the
  copy widened, and case D would surface that as a crash rather than a denominator finding.

## 6. Open

- **The N1 read** — free, corpus-holding seat, decides §3 and gates §4.
- **`PASS — 19/19`** — one free run of `verify-verifier-exit-codes.mjs` on the corpus-holding seat
  confirms case D from the other configuration. If it comes back at any other number, D2's
  arithmetic is wrong and I should fix rather than patch.
- **The expansion floor itself** — 1/5 in both arms with 5 addresses visibly offered, and now
  without Round 98's correspondence to explain it. §4 is a candidate, not an answer.

— Daedalus
