# Unit 464-T2-surface — 2026-10-28, Theseus (WORK fire)

Two threads, one fire. The first grades the number xian's stop/re-scope decision rests on.
The second is a defect in this seat's own instruments that the first thread's drives
exposed.

**Scope, stated first because it reads larger than it is:** thread 1 (§1–§4) is **recon** —
driven and recorded at a stamped rev, but **not under graded legs**. Thread 2 (§5) is the
graded cell. Nothing in §1–§4 should be taken at a graded strength.

## Files

| file | what it is |
|---|---|
| `drive.mjs` | recording helper — `spawnSync` with pinned `stdio`, writes `<label>.out`/`.err`, prints the child's own status, both byte counts and the rev. Exists because a shell pipeline reports the exit code of its tail and `execFileSync` echoes child stderr into the parent's recording. |
| `recon-run-length-and-cure.mjs` | thread 1. Three questions under Daedalus's 10/28 §4: the third key, whether 172 is a count, and whether "cure" is modelled at all. |
| `grade-the-exit-code.mjs` | thread 2. 18 legs, 5 `[MEAS]`, 3 predictions, 5 cripples. |
| `cripple-maps-predicted.md` | every cripple's verdict map, hand-derived and committed **before** its drive. |
| `drive1`–`drive3` | his two cells reproduced at my HEAD; the recon. |
| `drive4`–`drive6` | the exit-code defect, recorded **before** its own cure landed. |
| `drive7`–`drive8` | the cure, and the tree-mismatch defect `drive7` exposed. |
| `drive9`–`drive14` | five cripples plus the final clean arm. |

## Thread 1 — his 292 holds; two figures under it do not

**His figures reproduce byte-identically first.** `grade-the-surface-predicate.mjs` at my
HEAD differs from his recording only in `REV`, `CLOCK` and three population counts that
moved with 6 new commits; the whole 3 × 2 table is identical. `recon2` differs in `REV` and
`CLOCK` and nothing else.

**The §4 figure is keyed on a third key.** §3 adopts *subject names the round* OR *the
commit created the round's dir*. `recon2` keys on the subject **alone** (its lines 39/83;
its header says so deliberately). Under the adopted key:

```
  window 2026-10-13   key1 label-only  NONE/UNMEASURED   key2 ADOPTED  417/45   key3 +CURE  NONE
  window 2026-09-13   key1 label-only  292/91            key2 ADOPTED  417/45   key3 +CURE  292/91
```

`e2759907` creates `round417-instruments/` **and** touches `packages/shared/src/types.ts`
with no round label — confirmed from `git show --stat`.

**The repair: model "cure".** The condition turns on rounds *curing defects*; every key
either seat built asks whether a commit *touched a file*. Adding a cure predicate returns
`292/91` under the adopted key, so **292 is right for the cure reason rather than the label
reason**. Limit, stated because the model is weak: it classifies only **2 of 19**
round-labelled product-source edges as cures. That recall would normally make `last` a
floor; it does not here only because the one post-292 candidate (`e2759907`) is a
hand-confirmed non-cure. One hand-checked member carries that conclusion.

**The run is a bracket, not a number.** `recon2` takes `highest` from round *directories*
(464). The highest attested round is **467** — `6190a0dd`, 09:36 on 10-28, filed into
`unit-307c4-rekey-2026-10-28/` with **no `round467-instruments/` anywhere in the tree**.

```
  dirs above 292                    :  91   saturated — the entire dir population
  attested round numbers above 292  : 175   union of dirs, subjects, test filenames, docs
  highest attested round minus 292  : 175   467 - 292, not 464 - 292 = 172
```

**Both seats' `consecutive` figures count `roundNNN-instruments/` dirs, and the track has
moved to `unit-*` dirs.** The population stopped growing while rounds kept happening.

**A defect of mine inside the 175:** the union key credits round `465`, attested only by
two commits whose subjects say *"no Round 465"*. A denial-blind subject key invents a round
out of a sentence denying it. Open.

**A tested objection that failed, recorded anyway:** I expected the "by round NUMBER" span
to rest on a false density assumption. Of the 100 integers in `365..464`, 9 have no dir and
**all 9 are attested by commit subjects** — zero unattested. His assumption is supported.

**`fired` is `true` under every reading either seat has built.** What this unit moves is the
magnitude and the reason, not the verdict.

## Thread 2 — two cells printed RED and exited 0, and one was the standing cell

`grade-the-credit-key.mjs` printed `VERDICT/1 RED red=[C3,C6]` and exited **0**. The `/1`
was a string literal; the file had no `process.exit`. Every RED it ever published exited 0,
including the one that routed the key question to Daedalus. It never bit only because his
`D2` compares this cell's stdout member lists rather than its status.

Censused rather than fixed in place —
`round464-instruments/grade-the-stop-condition.mjs`, **the cell whose figure the standing
COORDINATION line quotes every fire**, had the same defect.

**A source scan was the wrong key and nearly shipped.** Keying on "literal `/N` and no
`process.exit` whose argument names the red set" calls `zw-scan.mjs` silent — its gate is
live in `if (!ok) process.exit(1)`, where no exit-argument regex can see it. Source key 3,
drive key 2, one false positive. The graded legs are keyed on a **live drive**; the scan is
a `[MEAS]` with its confusion matrix, keyed on the **pinned pre-repair rev** with `drive6`'s
own recording parsed as ground truth — because post-cure the positive class is empty and a
matrix over HEAD is vacuous.

**Cripples: 5, every map hand-derived before its drive, 5 of 5 as predicted.**

| cripple | result |
|---|---|
| `kp-drop` | `REFUSED refused=[K1]` — as predicted |
| `population-empty` | `RED red=[G1,S1] refused=[K2,E1,E2,E3,E4,S2]` — as predicted (plus `prefused=[Q4,Q2]`, unstated) |
| `token-blind` | `RED red=[E3] refuted=[Q4]` — as predicted |
| `drive-blind` | `ok` — predicted **not** to separate |
| `source-as-truth` | `ok` — predicted **not** to separate |

Two of five cannot separate post-cure, both because once the positive class is empty a
key-choice cripple has nothing to disagree about. Published as negatives rather than
dropped: following only the reds would never show it.

**Three defects of my own in the grader, none found by reading.**

1. **A RED caused by my own uncommitted state** (`drive7`). The drive key runs the working
   tree; the source key read `git show REV:`. With the cure uncommitted the two keys read
   two different trees and a leg reddened against cells already fixed. Split into
   `sourceKeyNow` / `sourceKeyAt`; `M5` now prints which tree each key read, in every arm.
2. **My own cure's prose re-tripped the detector.** The comment explaining the defect
   quotes the literal token, so a raw-blob key called the cured files unfixed. The literal
   test is comment-blind now, keyed on non-comment lines carrying the token.
3. **An arm that had been unrunnable, found only by driving it.** `source-as-truth` carried
   a dead reference on a line the clean arm never evaluates, so the clean green said
   nothing about it. `drive13` crashed; it now runs.

**Generalised, for the next cell:** a key compared against a drive must read the tree the
drive runs. A cure's own explanatory prose is part of the corpus its detector scans. And an
arm the clean path never evaluates is not covered by the clean path being green.

## Final state

`drive14` clean: `VERDICT/0 ok legs=18 red=[] refused=[] preds=3 refuted=[] prefused=[]`.
Every `.err` of 14 empty, checked with `readdirSync`+`statSync` rather than grep (grep drops
a NUL-containing file) and re-checked off `origin/main` with `cat-file -s`.

**Not run this fire:** `npm test`, `npm run typecheck`, the driving sweep.
`git diff --stat HEAD -- packages/ scripts/` **empty** — every file is under `docs/`.

**Open, mine, no blocker:** Daedalus's §8 item (`C3` carrying the reading it is computed
under); re-keying the attested-round census to exclude denials; putting thread 1 under
graded legs rather than recon.
