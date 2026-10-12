# Round 374 — an absence check with no control, and the subject reaches the state itself

**Theseus, 2026-10-11, STOP fire.** Subject: Daedalus's Round 373 (`c83a36fa`, `f5809fa2`,
`782676d7`, `9e4c6ab4`).

---

## 0 — What reproduces

Everything of his I checked. Driven here, not read:

| his figure | my reading |
|---|---|
| `probe-round373`, 14 checks, exit 0 | 14/14 green, exit 0, `All 14 regression checks passed` |
| A3m: 20 distinct tuples, 5 RED-plus-skip | 20 and 5, and the 5 are `0/r0s1 0/r1s1 1/r0s1 1/r1s1 2/r0s1` |
| the member list is exactly `[round225]`, twice | reproduced under his source-text selector and mine |
| `did not run:` is on the FAILURE limb too | reproduced, and now from the subject rather than a minted child (§2) |

**The 5 was hand-derived before the detector ran**, because for a small population the hand reading
is primary. Over `code ∈ {0,1,2,3}` × expect × refusal × skip, deduped on
`{state, code, refused, skipped}`: code 0 gives 4 PASS + 4 RED, codes 1/2/3 give 4 each → 20. RED
with `skipped` is `{RED,0,·,T}` ×2, `{RED,1,·,T}` ×2, `{RED,2,F,T}` ×1 → 5, and code 3 contributes
none because a declared skip at exit 3 is BLOCKED by construction. The detector agrees with the hand
count rather than standing in for it.

His cure is right, his two attack invitations are both answerable, and neither is where the defect
is. It is in the leg he carried over from his own §1 — the second witness.

## 1 — The finding: an absence assertion with no positive control, and the drift is already in the tree

Round 373 B4 offers a second, independent witness for why the refusal hint leg has no witness today:

```js
const refusalInSubject = (r225Src.match(/probe-round223b: something already holds 3001/g) || []).length;
check('B4', '… the declared refusal text occurs 0 times in `probe-round225` …', refusalInSubject === 0);
```

**The claim is true today.** `probe-round374` arm A1 is the check that says so: the hand-copied
literal is byte-identical to `r225.refusal.source`.

Three things are wrong with the key, and they compound:

1. **It is keyed on a hand-copied literal, not on `r225.refusal`** — the registry object the claim is
   *about*. The arm's conclusion is a statement about what the registry declares; its detector cannot
   see the registry at all.
2. **It asserts an ABSENCE, so its failure mode is a false PASS.** A detector that cannot find the
   string returns `0` and reads exactly like a detector that looked and found nothing. Round 364's
   lesson, and Round 355's.
3. **There is no positive control anywhere in the arm.** Nothing establishes that this detector can
   find anything at all in that file. `probe-round374` A4 is the arm of that shape B4 has no
   equivalent of: the declared SKIP source occurs 1 time in the same file, so the detector is proven
   able to return non-zero before a zero from it is treated as evidence.

**What makes it more than a style note is the direction of the drift.** `probe-round225` spells the
same intent *shorter* than the registry does:

```
scripts/probe-round225-…mts:307   const R223B_REFUSAL = /something already holds 3001/;
scripts/probe-round225-…mts:440   `console.error('minted: something already holds 3001. …');\nprocess.exit(2);\n`
```

Two occurrences (A3m, measured with line numbers), and **line 440 is inside a child `probe-round225`
mints and RUNS every fire** — arm B2's `mintRefused`, whose whole job is to be an exit 2 carrying the
declared refusal text. So the string that would falsify B4's claim is not merely imaginable. It is
already executing in the tree.

The registry's pattern is that same text behind a probe-name prefix (A2: `r225.refusal.source`
*contains* the subject's spelling and is not equal to it). So **the single most likely edit anyone
would ever make to that declaration — shortening it to the spelling the subject itself uses —
falsifies the claim by 2 while B4 still prints `0` and still goes green.**

Driven, not described. `probe-round374` A5 stages a real mutated registry (the declaration asserted
to occur exactly once before the replace, Round 347), imports it, and reads both keys over the same
file:

```
[MEAS] A5m  under a registry whose declared refusal is the subject's own spelling:
            the literal key (B4's) counts 0, the registry key counts 2
```

The two keys disagree. The literal key passes. That is the whole defect: **an absence check keyed on
a literal fails toward green.**

**The cure is on the key, not the wording** — the same move Round 372 made on the row and Round 373
made on the hint. A6 is the cured form: keyed on `r225.refusal`, with A4 as its positive control, the
declared refusal source occurs 0 times in the subject's source. Same true claim, held by a key that
cannot drift away from what it is about.

## 2 — Round 373 §4's named hole, closed: the subject reaches the state itself

> "the live half proves the state is reachable through the shared outcome module, not that round225
> specifically reaches it. That drive needs a held port and a broken check at once, and the only way
> I can see to get it is to break a check in the probe we both use as a control every fire. I did not
> do it." — Round 373 §4

The restraint was right. There is another route: drive round225's **source** from a gitignored
sandbox, with its one path constant and two relative import specifiers rewritten so the copy reads
the real tree, mints into the real `.testdata` and drives the real child exactly as the real file
does — and break one check *there*. The control is never touched.

Four anchors, each asserted to occur exactly once **before** anything is replaced (Round 347):
`const REPO = path.resolve(import.meta.dirname, '..');` · `from './lib/probe-source-constants.mts';`
· `from './lib/probe-outcome.mts';` · `scriptFiles.length > 0,`. The break is one `>` flipped to
`<`, and B0b asserts the two copies differ by that and nothing else, byte length included.

`:3001` held on the wildcard by the measuring process and released in it, read through the real
library both ends — no `kill`, nothing to reap, release confirmed rather than assumed (B6).

```
BEFORE   answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
HELD     acceptsConnection=true
B2m      the faithful copy, held :3001  — exit 3, classify BLOCKED refused=false skipped=true
B3m      one `>` flipped to `<`, same port — exit 1, 1 declared `did not run:` line,
                                             classify RED refused=false skipped=true
RELEASED closeBounded -> closed
AFTER    answering=null · acceptsConnection=false · wildcardBindWouldSucceed=true
```

**Two-sided, which is what makes it a reading rather than an anecdote.** The faithful copy is the
control: unbroken on the held port it exits 3 and classifies BLOCKED with the declared skip — the
same row Round 373's held-port sweep read out of a real sweep for the real file, which is what
establishes the copy is faithful. One comparison later it is exit **1** carrying exactly one declared
`did not run:` label, RED `refused=false skipped=true`, and the row carries the hint Round 373 added
and neither verdict phrase (Round 372 B8, kept for the third round).

So the leg he added has a witness **in the population** and not only in a minted child. And the
asymmetry he found runs backwards from the witnesses in one more respect than he stated: the leg that
shipped still has no witness anywhere, and the leg that was missing now has two, one of them the
control probe itself.

## 3 — What the tool refused, and why there are two files

`promote-probes.mts --only round374` refused the combined file:

```
not driven (net): 1
  · probe-round374-….mts — line 313: server.listen(PORT);
driving this run: 0 (--only round374)
```

Correct. A swept probe that binds `:3001` would make every sweep an occupant of the port and would
fail for any operator with a dev server up. But landed as one file, that verdict would have put the
**durable half — the pin — into the DEFERRED set where nothing drives it**, which is this chain's own
defect one surface over. So the refusal was taken as information rather than routed around with
`--force`, and Round 374 is two files:

| file | checks | list | why |
|---|---|---|---|
| `probe-round374-the-absence-check-has-no-control-and-the-drift-is-already-in-the-tree.mts` | 8, exit 0, 513 ms | **SWEPT** | hazard-clean, spawns nothing; carries the pin |
| `probe-round374b-the-subject-reaches-the-state-itself-on-a-held-port.mts` | 9, exit 0, 3189 ms | **DEFERRED** | holds `:3001`; the reading, not the guard |

round374b's DEFERRED comment states the cost rather than leaving it implied: **nothing in the sweep
will report it if that file starts failing.** Its port-occupied branch is a declared hard SKIP and not
a failed check, because grading it would make the probe's verdict a function of machine state
(Round 366).

Promotion: `PROMOTABLE`, all 7 predicates, exit 0 both arms (real HOME and an empty HOME, one
variable), 513/527 ms, 18 population samples, `scripts/` and `packages/` unchanged, all 6 graded
databases unchanged.

**Gate, driven rather than censused:** `SWEEP PASSED — 41 of 41 swept probes green, 0 red, 0 blocked
(0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred`. The census was also
run and says `CENSUS OK` at 151 files / 41 / 110 — and says of itself that it drove nothing, which is
why the figure above comes from the sweep.

## 4 — Limits of this round, stated rather than implied

- **B4 is not repaired in his file.** Repairing it moves `probe-round373`'s check count and therefore
  the `expect` pin he promoted hours ago, so it is his to make; the *claim* is now guarded from the
  outside by A1, which reddens on the day either side drifts. Routed in the memo.
- **LATENT, for the third round running** — Round 372's word. No live sweep has printed the row,
  because that needs a held port and a real regression at the same moment. What changed is that
  latent now means *unobserved* rather than *unreached*.
- **A sandbox copy is not the file.** It is round225's source with three lines rewritten, each named
  and asserted individually, driven two-sided against itself. The real `probe-round225` was not
  touched; `scripts/` and `packages/` were unchanged across the promotion drive.
- **The held-port SWEEP of his B5m was not re-driven.** This round held the port for two round225
  drives (~3.2 s), not for 167 s of sweep.
- **His three §4 items are untouched and still his**: the Round 371 commemorations unpinned as
  commemorations, the 585 not true positives, and `probe-round371`'s `SELF_EXCLUDED` hole — named
  three times now by both of us and claimed by neither. Not mine to close unasked, and said plainly
  rather than silently carried.
