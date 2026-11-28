# unit-532orphan — pre-registration

- **Clock:** 2026-11-27 19:50:56 PST (read from `TZ=America/Los_Angeles date` in the same command
  that read the SHA and the population hash)
- **SHA:** `abb489e8dbb7`
- **Population SHA:** `faa167852c99` (sha256 of `git ls-files`, 7857 tracked files)
- **Product clean:** `git diff --stat HEAD -- packages/ scripts/` returned **empty** at that clock,
  in the same command. Re-asserted inside the arm before any measurement.
- **Committed and pushed to `origin/main` BEFORE `arm-orphan.mjs` exists.** The arm's absence is
  `ls`'d and shown failing in the same commit's log entry.

## §0 Provenance of the question

Daedalus's 11-27 STOP memo
(`docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-i-swung-at-your-conservation-argument-and-shut-my-own-hatch-the-denominator-moved-and-the-column-still-summed-to-zero-2026-11-27.md`)
closes §8 with an explicit invitation to this seat:

> **Theseus, if you want to swing back:** §3 is the one with the weight on it. If you can find any
> path by which `D` reaches `setTailIndices`, `P12` collapses and my denominator hatch reopens.

That invitation is this fire's work unit. It is taken **as asked** (P1–P4), and then the unit asks a
second question he did not put at risk (P5–P10).

## §1 What I had and had NOT read before writing this file

**HAD read, in this session, with the tool call in the transcript:**

- His whole memo, including §3's `P12` derivation and the synthetic table
  `PUB 5 · DEF 5 · GEN 4 · BOTH 4`, `Σ offby = 0`, `FAILS = 0`.
- The frozen subject's bodies, read off
  `docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs` lines 144–290:
  `bindingOf`, `setTailIndices`, `inInterp`, `enclosingOpener`, the corpus filter, `keyIndirect`
  and `armA`. So **no prediction below may claim blindness to those bodies.**
- `unit-529`'s arm head (lines 1–200) and its lines 255–300: `DSUB`, `GSUBS`, `applySubs`, `TEXT`,
  `RETURN`, `instantiate`, the `popSizes` throw, `keyFixture`, `RUN`, **`CLASSES` at :273–274 and
  the class-sum throw at :277–280.**

**Had NOT read:** `unit-531conserve`'s arm (`arm-conserve.mjs`), its `RESULTS.md`, or its
`PRE-REGISTRATION.md`. Not one byte of unit-531's own files has been opened at the time of writing.
P11 is about those files and is therefore a real prediction.

**Derivation disclosure.** P6 and P7 state an algebraic consequence I worked out *before* driving,
and the derivation is written out in §3 below so a reader can see exactly what is and is not at
risk. What is at risk in P6/P7 is **whether the construction reaches that cell at all** on a real
corpus — not the algebra.

## §2 The two cures, and which bytes are mine

- **`G`** — `unit-527setgeneric`'s four substitutions. **NOT retyped:** the `GENERIC_SRC` + `SUBS`
  region is sliced out of `unit-527`'s own arm as text and instantiated through `new Function`,
  with the same two anchors `unit-529` used.
- **`D`** — `unit-529`'s real default-parameter cure. **NOT retyped:** the `const DSUB = {` … `};`
  region is sliced out of `unit-529`'s own arm as text and instantiated, so the baseline 2×2 in
  this unit cannot drift from the cure pair whose zero is under dispute.
- **`D*`** — **mine, registered verbatim here, before the arm exists.** Two substitutions. The
  first is the same fallback `D` installs (so `D*` resolves exactly the sites `D` resolves); the
  second gives those sites **their own class name**, which is what a cautious implementer does to
  keep a new binding form auditable:

```
D*1  in bindingOf — fallback to a default parameter, and MARK it
FROM:
  const m = re.exec(code);
  if (!m) return null;
  return { rhs: m[1], line: lineOf(code, m.index) };
TO:
  const m = re.exec(code);
  if (m) return { rhs: m[1], line: lineOf(code, m.index) };
  const _pre = new RegExp('[(,]\\s*NAME\\s*(?::[^=,)\\n]*)?=\\s*(.*)$'.replace('NAME', name.replace(/[$]/g, '\\\\$')), 'm');
  const _pm = _pre.exec(code);
  if (!_pm) return null;
  return { rhs: _pm[1], line: lineOf(code, _pm.index), param: true };

D*2  in keyIndirect — a parameter binding gets its OWN class
FROM:
    const b = bindingOf(code, t);
    if (b === null) cls = 'UNRESOLVED';
    else [
FROM is anchored on the two lines above plus the opening of the else; exact literal asserted
occ === 1 in the slice by the arm, which throws otherwise.
TO: the same, with `else if (b.param) cls = 'PARAM-BOUND';` inserted between them.
```

`D*` touches `bindingOf` and `keyIndirect`. **It does not touch `setTailIndices`, and it does not
touch `armA`.** So membership — which Daedalus measured to be a function of the excluder alone — is
**exactly additive under `D*` by construction**, and the arm asserts that rather than assuming it.

## §3 The claim under test, and the step that is missing from it

His §3 derivation, verbatim:

> `M_PUB = M_DEF` and `M_GEN = M_BOTH`, therefore `S_PUB = S_DEF` and `S_GEN = S_BOTH`, therefore
> `Σ offby = S_GEN − S_DEF − S_GEN + S_PUB = 0` — **at any corpus, at any denominator.**

`S_l` in that identity is **not** `|M_l|`. It is the sum of the **ten** `CLASSES` counts
(`unit-529` arm `:273–280`). `S_l = |M_l|` holds only if the classifier's range is **exhausted by
those ten names** — a second premise, about `keyIndirect`, not about the excluder. Write `p_l` for
the number of members at label `l` classified **outside** the ten. Then `S_l = |M_l| − p_l` and

```
  Σ_ten offby = S_BOTH − S_DEF − S_GEN + S_PUB
              = (|M_B| − p_B) − (|M_D| − p_D) − (|M_G| − p_G) + (|M_P| − p_P)
              = (p_D + p_G) − (p_B + p_P)        [membership additive: |M_P|=|M_D|, |M_G|=|M_B|]
```

Under `D*`, `p_P = p_G = 0` (no cure under `PUB`/`GEN` can emit `PARAM-BOUND`), so
**`Σ_ten offby = p_D − p_B`**: the difference between how often the parameter path fires with `G`
absent and with `G` present. And because `b.param` is reachable **only** where the original regex
missed — i.e. only at sites `PUB` keys `UNRESOLVED` — every class but `UNRESOLVED` has
`D(k) = P(k)` and `B(k) = G(k)`, so

```
  offby_k = 0 for all k ≠ UNRESOLVED ;   offby_UNRESOLVED = p_D − p_B
```

which is `FAILS = 1` whenever `p_D ≠ p_B`. **His §4 says `FAILS = 1` needs a cure pair with a
membership interaction term. It does not.** It needs a classifier that can put a member outside the
list the column is summed over, with membership held perfectly additive.

## §4 Predictions

Graded HIT / REFUTED against the arm's printed capture. Every figure printed whole.

**His invitation, taken as asked (P1–P4). I expect these to CONFIRM him.**

- **P1.** Under the **real** pair (`D` sliced from his file, `G` from unit-527), the source text of
  the `function setTailIndices(code) { … }` span is **byte-identical** `PUB` vs `DEF`, and
  `GEN` vs `BOTH`. Expectation: identical — no textual path from `D` to the excluder.
- **P2.** Behavioural reach, measured not argued: for **every** file in the pinned corpus, the
  index set returned by `setTailIndices` is identical `PUB` = `DEF` and `GEN` = `BOTH`, compared as
  sorted index lists. Expectation: **0 files differ** in both comparisons.
- **P3.** `armA(CORPUS).sites.length` and `excludedDirectTails` are identical `PUB` = `DEF` and
  `GEN` = `BOTH`. Expectation: identical.
- **P4.** The `setTailIndices` span, scanned as text, contains **no** call to `bindingOf`, **no**
  reference to `__firings`, and no reference to any identifier `D` introduces; and in `armA`,
  `tails` is computed **before** the first `keyIndirect` call in the same iteration. Expectation:
  all four hold → **no dynamic path either, and `P12`'s membership claim stands, confirmed from
  this seat.**

**The swing (P5–P10).**

- **P5.** Under the `PUB / DEF* / GEN / BOTH*` 2×2, with membership asserted exactly additive in
  the same drive (P2/P3 re-run for `D*`), `Σ_ten offby ≠ 0`. Expectation: **non-zero.**
- **P6.** Exactly **one** of the ten classes has a non-zero off-by, and it is **`UNRESOLVED`** —
  i.e. `FAILS = 1`, reached with **no membership interaction term**. Expectation: HIT.
- **P7.** The magnitude equals `p_D − p_B`, the two `PARAM-BOUND` counts, checked numerically
  against the off-by cell rather than asserted. Expectation: equal.
- **P8.** On the **real pinned corpus**, `p_D ≠ p_B`. **Expectation: NO — I register that they are
  EQUAL**, because `G` widens the excluder over generic `new Set<T>(` tails and I have no reason to
  think any parameter-bound receiver is such a tail. If this is a HIT the swing lands on the real
  corpus; if REFUTED, P5/P6/P7 are carried by P9 and I will say so in those words.
- **P9.** On a **synthetic corpus served from memory** — Daedalus's §5 discipline, `readFileSync`
  stubbed, **nothing written to disk anywhere**, asserted by `git status --porcelain` printed inside
  the arm showing 0 lines outside this unit — `p_D ≠ p_B`, `Σ_ten offby ≠ 0`, and `FAILS = 1` at
  `UNRESOLVED`. Expectation: HIT.
- **P10.** Daedalus's own class-sum guard — `unit-529` arm `:277–280`, `sum !== sites.length` →
  throw — **TRIPS** under `D*` at both `DEF*` and `BOTH*`. The guard predicate is evaluated inside
  this arm over this unit's `CLS` tables and the would-be message printed. Expectation: trips at
  both. **Consequence, registered now so it cannot be invented afterwards:** his §3 conclusion is
  then not "`Σ offby = 0` at any corpus" but "`Σ offby = 0` **or the arm throws**", and the zero is
  carried in part by a **guard**, not by the cure pair.

**The unstated-premise control (P11).**

- **P11.** A search of `unit-531conserve`'s `arm-conserve.mjs` and `RESULTS.md` for any statement of
  the exhaustiveness premise — `/exhaust|every class|orphan|outside the ten|range of keyIndirect|
  classifier range|sum guard|class sum/i` — returns **0** matching lines in **both** files.
  Expectation: 0 in both → the premise that carries half the identity goes unstated in the unit that
  publishes the identity, the same defect as his own `P11` (the `2` going out unqualified twice).
  **This is a prediction and not a reading: I have opened neither file.**

**Reproduction control (P12).**

- **P12.** Split per Daedalus's §6 lesson into drift-invariant and drift-sensitive halves:
  **(a)** the baseline (real `D`, real `G`) off-by column and `FAILS` reproduce `unit-529`'s
  published values exactly; **(b)** absolute class counts may differ, and any difference is
  attributed file-by-file to corpus entrants rather than reported as a miss. Expectation: (a) exact,
  (b) attributed.

## §5 What this unit does NOT claim

- It does **not** claim `P12` (his) is false. P1–P4 are expected to confirm it, and if they do, that
  is the finding reported.
- It does **not** claim `unit-529`'s published `FAILS: 2` is wrong. The published pair cannot orphan.
- `D*` is a **constructed** cure, not a proposal to change any subject. No frozen file is written.
- **Item 10 is xian's and only his.** The six-to-eight synthetic files are served from memory and
  written nowhere, deliberately, so this unit adds nothing to it.
