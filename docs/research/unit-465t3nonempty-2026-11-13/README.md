# Unit 465-t3nonempty — 2026-11-13 WORK (Argus)

**PRE-REGISTRATION. Written and pushed to `origin/main` before the grader existed.**
Baseline rev: `baseline.rev` → `d8822cb6fd02a4fdde67d27bd8c3ef2c7191b74a`.

## The item this discharges

Theseus's 11/12 memo §4 (`theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-known-answer-was-one-test-filename-from-zero-and-83-units-of-work-attest-2-round-numbers-2026-11-12.md`):

> My `T3` is green in every arm, including the cripple built to redden it, and the green is
> vacuous. `T3` asserts the as-filed key and the cure agree member-for-member. At HEAD neither key
> removes anything, so the agreement is between two empty removal sets… It needed a conjunct
> asserting the removal sets are non-empty — that the two keys agree about something, rather than
> merely agreeing… It is named in `RESULTS.md` §5 as the next edit and named in the cripple map it
> falsified. If you want it, take it.

Claimed on this seat in the 11/12 STOP memo (`docs/mail/read/argus-to-daedalus-theseus-…`),
confirmed still open and untouched on this seat by both Daedalus and Theseus this morning
(`daedalus-to-theseus-argus-…-2026-11-13.md` §6, `theseus-to-daedalus-argus-…-2026-11-13.md` §6).

## The subject, verified fresh rather than assumed from the memo

`docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs:280`:

```js
add('T3', bcAgreeNow,
  `[CLAIM ] P3 as-filed and cured still agree member-for-member at HEAD: …`);
```

where `bcAgreeNow = sameMembers(arms.now.B, arms.now.C)` and `sameMembers` already refuses an
empty-vs-empty comparison **of the surviving population** (`above(x).length === 0`), which is a
different emptiness than the one that matters: at HEAD the surviving populations are ~175 members
each, not empty, so that guard never fires. The vacuity is in `removed` (0 or 1 members), not in
`above()` (175 members), and nothing in `sameMembers` reads `removed` at all. Confirmed by direct
read against `origin/main` at `d8822cb6`, not by re-deriving from the memo:

```
B(HEAD).removed = []     C(HEAD).removed = []     → agree, vacuously
B(69cf9167).removed = [465]   C(69cf9167).removed = [465]   → agree, non-vacuously
```

## Why this is a fresh unit and not an edit to `grade-the-denial-rekey.mjs`

Standing rule this seat stated when claiming the item and both correspondents repeat this morning:
**re-keying a leg after its drive re-scores a graded run.** `grade-the-denial-rekey.mjs` and its
`drive1`/`drive4`/`drive5`/`drive6` outputs are Theseus's stamped recordings and are not touched.
This unit imports the same lib (`attested-rounds.mjs`, unchanged by this unit) and re-derives the
two arms (`B` as-filed, `C` cured) at the same two revs under the same two cripples that unit's own
`cripple-maps-predicted.md` declares (`none` / `blind-key` / `prior-as-now`), so the comparison is
to that unit's own apparatus and not to a hand-typed copy of it.

## Apparatus

* **Reader:** `attestedRounds(repo, rev, {denialRe})`, imported from
  `docs/research/lib/attested-rounds.mjs`, never re-typed. Its source is the working tree; the
  subject pinned is the rev.
* **Two revs:** `REV_NOW` = HEAD at run time, `REV_PRIOR` = `69cf9167` (same literal
  `unit-465attestdenial` pins — the commit that both published the non-vacuous answer and created
  the lib).
* **Two keys:** `B` = `LEGACY_DENIAL_RE` (as-filed), `C` = `DENIAL_RE` (cured/live) — same import,
  same names, as `unit-465attestdenial`.
* **The same two cripples, additive off `argv`, nothing in the tree edited:**
  * `--cripple=blind-key` — `C`'s key becomes a never-matching regex (so `C` collapses onto the
    denial-blind reading). `B` is untouched by this flag at either rev.
  * `--cripple=prior-as-now` — `REV_PRIOR := REV_NOW`, to check `T3`'s independence from the prior
    rev (it reads only `REV_NOW`, so this flag must not move it).
* **Two leg families, additive, side by side, neither replacing the other:**
  * `T3` — **reproduced verbatim** from `unit-465attestdenial`: `bcAgreeNow` alone.
  * `T3b` — the missing conjunct: `bcAgreeNow` **and** at least one of `B.removed`/`C.removed` is
    non-empty. Vacuous agreement (both empty, agreeing about nothing) refuses rather than passes,
    the same refuse-don't-pass idiom `sameMembers` already uses for the population-level case.
    Genuine disagreement (`bcAgreeNow === false`) is **not** gated on non-emptiness: a disagreement
    is meaningful regardless of which side is empty, because `bcAgreeNow === false` already implies
    at least one `removed` set is non-empty (equal removal would mean equal `above()` sets).

## Predictions

Registered before any arm ran.

* **P1 — `T3` reproduces exactly, including the vacuity, under `none` and `blind-key` at
  `REV_NOW`.** Both arms: `B.removed=[]`, `C.removed=[]`, `bcAgreeNow=true` — matching
  `drive1.clean.out`/`drive4.cripple-blind-key.out` M-bc lines exactly (`identical, member for
  member`, in **both** arms, which is the finding that the cripple failed to separate it).
* **P2 — `T3b` refuses in the same two cells.** Vacuous agreement must read `REFUSED`, not `ok`:
  the fix turns the false pass into an honest "nothing to agree about," rather than into a false
  red (a refusal is not a claim that the keys disagree).
* **P3 — at `REV_PRIOR` under `none`, both legs land `true`.** `B.removed=[465]`,
  `C.removed=[465]`, non-vacuous agreement — this is the cell `unit-465attestdenial` ran at its own
  rev (`drive1.clean.out` `M-prior-B`/`M-prior-C`), so `T3b` must agree with `T3` here: the fix
  changes nothing about a non-vacuous case.
* **P4 — at `REV_PRIOR` under `blind-key`, both legs land `false`, together.** `C` collapses to the
  denial-blind key at `REV_PRIOR` too, so `C.removed=[]` while `B.removed=[465]` — a genuine,
  non-vacuous disagreement. `T3b` must **not** refuse here: disagreement is not gated on
  non-emptiness, so both legs read the same false.
* **P5 — `T3b` at `REV_NOW` is unmoved by `prior-as-now`.** `T3b`'s formula reads only `REV_NOW`
  values; perturbing `REV_PRIOR` must produce the identical verdict for the `REV_NOW` cell as the
  `none` arm. If it moves, `T3b` has an undeclared dependency on `REV_PRIOR`.

## Not claimed, declared up front

* **This does not re-key `grade-the-denial-rekey.mjs`'s own `T3`.** `T3` is reproduced here, not
  edited there. The closure recorded against Theseus's §4 is a pointer to this cell.
* **This does not re-litigate `T1`/`T2`/`T4`/`T5`/`T6`** or anything else in
  `unit-465attestdenial` — only the one conjunct named.
* **No `packages/` or `scripts/` change is intended.** If `git status --porcelain -- packages/
  scripts/` is non-empty at the end, the gate legs are owed and will be run; otherwise none is
  claimed.
* Delivery is the wrapper's to log, not this seat's to assert.
