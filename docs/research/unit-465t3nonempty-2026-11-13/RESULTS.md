# Results — unit-465t3nonempty

Baseline `d8822cb6`, pre-registration `ab3da5ae` (read back off `git log origin/main --oneline`
after the push, per the standing habit both correspondents flagged this morning).

```
drive1.none.out           VERDICT/1 REFUSED legs=6 red=[]              refused=[T3b]           preds=2 LANDED×2
drive2.blind-key.out      VERDICT/1 RED      legs=6 red=[T3-prior,T3b-prior] refused=[T3b]      preds=2 LANDED×2
drive3.prior-as-now.out   VERDICT/1 REFUSED legs=6 red=[]              refused=[T3b,T3b-prior] preds=2 LANDED×2
```

**All 5 pre-registered predictions held** — the 2 per-arm ones (P1/P2, LANDED in all three drives)
and the 3 cross-arm ones (P3/P4/P5, checked below by reading the three outputs side by side, not
re-derived). No refutation to report.

## 1. The vacuity reproduces exactly, under the cripple built to redden it

`drive1.none.out:20-21` and `drive2.blind-key.out:20-21`:

```
none        LEG T3 ok   agree=true     LEG T3b REF  agree=true nonEmpty=false -> null
blind-key   LEG T3 ok   agree=true     LEG T3b REF  agree=true nonEmpty=false -> null
```

Identical in both arms, at REV_NOW: `B.removed=[]` and `C.removed=[]` whether or not the live key
is crippled, because 465's removal was never load-bearing on the key — it is attested via
non-subject sources regardless (`drive1.none.out:8-9`, `drive2.blind-key.out:8-9`). `T3` is `ok` in
both, confirming Theseus's finding to the letter: the cripple map predicted `T3` **RED** here
(`cripple-maps-predicted.md:18`, "B keeps removing 465; C no longer does, so they disagree") and
the actual drive (`unit-465attestdenial/drive4.cripple-blind-key.out:19`) read `identical, member
for member` instead — the prediction failed because the premise (B still removes something at
REV_NOW) was already false by the time the cripple ran against today's tree, not because the
cripple logic was wrong.

## 2. T3b turns that false pass into an honest refusal, in both arms, and only there

P2 landed in `drive1` and `drive2` identically: `T3b` reads `REF`, not `ok`. A refusal is not a
new claim of disagreement — it is "nothing to agree about," which is what the two empty `removed`
sets actually are. `T3` is left standing beside it, unedited, exactly reproducing the cell Theseus
drove.

## 3. The fix does not touch the cell where the agreement was real (P3)

`drive1.none.out:22-23`:

```
LEG T3-prior ok   agree=true      LEG T3b-prior ok   agree=true nonEmpty=true -> true
```

At `69cf9167` under `none`, both keys remove exactly `[465]` (`drive1.none.out:10-11`) — the
non-vacuous case `unit-465attestdenial` itself ran at its own rev. `T3b` lands `true` here, same as
`T3`. The fix changes nothing where the agreement was ever meaningful; it only reclassifies the one
cell where it wasn't.

## 4. A genuine, non-vacuous disagreement reddens both legs together (P4)

`drive2.blind-key.out:10-11,22-23`:

```
M-prior-B  removed=[465]     M-prior-C  removed=[]      (C collapsed to the denial-blind key)
LEG T3-prior RED   agree=false      LEG T3b-prior RED   agree=false nonEmpty=true -> false
```

Crippling the live key at `69cf9167` makes `C` stop removing `465` while `B` still does — a real,
measured disagreement, not a construction. Both `T3` and `T3b` read `RED` together, confirming the
non-emptiness gate does not apply, and does not need to, on the branch where the keys actually
disagree: `T3b`'s formula short-circuits to `agree` directly when `agree === false`, so a genuine
split is never softened into a refusal.

## 5. T3b has no undeclared dependency on REV_PRIOR (P5)

`drive1.none.out:21` and `drive3.prior-as-now.out:21` — the `T3b` row at `REV_NOW` is byte-identical
across the two drives: `REF … agree=true nonEmpty=false -> null`, both times. Collapsing
`REV_PRIOR` onto `REV_NOW` (`drive3.prior-as-now.out:3`, `REV_PRIOR ab3da5ae…` instead of
`69cf9167…`) moves `T3-prior`/`T3b-prior` (both now vacuous too, since the "prior" read is the same
tree as "now") but leaves the `REV_NOW` cell exactly where it was. `T3b` reads only what its
formula says it reads.

## The confusion matrix, assembled from the three drives

| | agree | nonEmpty | T3 | T3b |
|---|---|---|---|---|
| REV_NOW, none | true | false | ok (vacuous) | **REF** |
| REV_NOW, blind-key | true | false | ok (vacuous) | **REF** |
| REV_NOW, prior-as-now | true | false | ok (vacuous) | **REF** |
| REV_PRIOR, none | true | true | ok | ok |
| REV_PRIOR, blind-key | false | true | RED | RED |
| REV_PRIOR, prior-as-now | true | false | ok (vacuous) | **REF** |

`T3` and `T3b` agree on every cell except the three bolded ones — exactly the vacuous-agreement
cells, which is the one class of disagreement the fix was built to introduce.

## Not claimed

- **`grade-the-denial-rekey.mjs` and its four committed `.out` files are unedited.** Checked by
  commit, not assumed: `git log -- docs/research/unit-465attestdenial-2026-11-12/` shows one commit
  since the 11/12 recordings, Theseus's own `b6af4cf9` (11/12, later that evening), and its diff
  touches only `RESULTS.md` (a 29-line annotation) — the grader and its four `.out` files are
  untouched by it and by everything since.
- **This does not re-litigate `T1`/`T2`/`T4`/`T5`/`T6`** or anything else in
  `unit-465attestdenial` — only the one conjunct Theseus named in his §4 and his `RESULTS.md` §5.
- **The declared blindness Theseus named alongside it carries forward, untouched.** `T3`/`T3b` grade
  the denial key; nothing here grades the four source regexes (`S1`/`S2`/`S3`/`S5`/`S6`) `classifyPath`
  applies before the denial key ever runs, and `S6` changed under this seat's feet mid-fire
  (`unit-465routecure`, `130bb6fc`/`755e489f`/`d8822cb6`, landed on `origin/main` between this
  unit's pre-registration and its first drive). Re-checked after that pull: `selfTest()` still
  returns `true` and `B`/`C`'s `removed` at both revs are unchanged by the `S6` boundary fix — the
  boundary only reclassifies mail paths, and neither `69cf9167` nor HEAD's denial-filtering numbers
  move. Not re-driven as a separate leg; stated because reading a stale lib import after a mid-fire
  pull without checking would be exactly the hazard this seat's own standing habit exists to catch.
- **No `packages/` or `scripts/` diff** (`git status --porcelain -- packages scripts` empty,
  checked after all three drives), so no gate leg is owed and none is claimed.
- Delivery is the wrapper's to log, not mine to assert.
