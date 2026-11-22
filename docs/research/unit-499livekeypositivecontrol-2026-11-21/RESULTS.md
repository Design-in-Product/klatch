# unit-499livekeypositivecontrol — results

**Seat:** Daedalus · **Fire:** 2026-11-21 STOP · **Pre-reg:** `023d0f58`, pushed to `main` at
17:19:21 PST, before the arm, the cripple, the recorder or the docblock patch existed.
**Clock:** `date`-read at 17:17:17, 17:19:21, 17:24:12, 17:27:05 PST — not estimated from effort.

**6 predictions registered · 6 HIT.** The two defects this unit found are both in **its own
instrument**, both caught by its own assertions before either could publish a figure.

---

## 0. What this unit was for

Theseus's 11-21 WORK memo handed this seat two items marked "yours to take or decline" and one
report. Both items are taken, and the thing taken is **not** what the memo proposed on its face.

He offered to fix the closure leg of `unit-497paddedlabelclosure`. That leg is **published and
frozen**, and the 11-20 *don't edit them* decision stands — so it is not edited here, by reader or by
byte. But the same claim he found unseparated is also written into the **live** docblock of
`scripts/verify-decl-body-slicers.mjs`, where a future reader will actually meet it. **That is the
copy worth curing**, and it is a live file, so curing it reopens nothing.

## 1. P1 — the positive control reads TRUE at the live key · **HIT**

The key expression was **cut** out of the live `publish()` body by the shared slicer
(`scripts/lib/decl-body.mjs` → `bodyOf`) and evaluated as cut. Not re-typed.

```
  publish() body sliced at      offset 37472, 833 bytes, 1 occurrence
  key expression, as CUT        line.trimEnd().endsWith(v)
  LABELS literal, as CUT        ['MARKED', 'GUARDED', 'UNGUARDED']

  whitespace members derived    25  (astral: 0)   U+0000..U+10FFFF, `u`-flagged
  cells driven                  75  (3 labels x 25 members)
  disagreements                 0
  bothTrue  (POSITIVE CONTROL)  75 of 75
  bothFalse                     0 of 75
```

**Theseus's slice figures reproduce exactly under this seat's own drive** — offset 37472, 833 bytes,
one occurrence — which is an independent reproduction, not a copy: this arm re-sliced from the live
file and arrived at the same span.

The drive is **wider than his and wider than unit-497's**: 3 labels × 25 members = **75 cells**,
where unit-497 drove one label. `bothTrue 75 of 75` is the term that was missing.

## 2. P2 — the control separates under a reader-only cripple · **HIT**

```
  CONTROL   cells  75  disagreements   0  bothTrue  75 of 75  bothFalse   0
  CRIPPLE   cells  75  disagreements   0  bothTrue  50 of 75  bothFalse  25

  the PUBLISHED figure (disagreements) moves under the cripple:  false
  the POSITIVE CONTROL (bothTrue) moves under the cripple:       true  (75 -> 50)
```

**Theseus's §3 finding is confirmed at the live key.** The figure the docblock publishes is
byte-identical whether the readers work or are dead. `bothTrue === cells` is the one term that tells
those two states apart, so it is now written into the docblock next to the `0` it separates.

The cripple is reader-only and in memory: the tracked file is never written, and
`docs/research/unit-497paddedlabelclosure-2026-11-21/` is not touched by reader or byte.

**Three sources, deliberately held apart.** The first draft had two — the probe tokens shared a
source with one of the readers — and two **cannot express this failure**: crippling a reader would
also rewrite the lines being read, so the drive would quietly change subject instead of going blind,
and would score green for the wrong reason. The probe tokens are asserted unmoved.

## 3. P3 — the denominators reproduce under an independent seam · **HIT**

Theseus recorded `console.log`. This unit records **`process.stdout.write`** — one write per
`console.log` call, the next seam down the same path.

```
  quantity              docblock   Theseus(his seam)   today(this seam)   vs docblock
  console.log calls           34                  37                 37   MOVED 34 -> 37
  published lines             38                  41                 41   MOVED 38 -> 41
  not first-of-chunk           4                   4                  4   same
  rows array                   3                   3                  3   same
```

**All four figures agree across two independently-written recorders at two different seams.** His
`+3/+3` is reproduced, not accepted.

## 4. P4 — recorder honesty, as its own term · **HIT**

```
  recorded writes reconstruct the plain capture byte-identically:  true
  plain capture bytes 4160 · reconstructed bytes 4160
```

Recorded as **its own verdict with its own counter**, deliberately not fused into §3's numbers. A leg
that conjoins a sanity check with its claim cannot say which half reddened — a lesson this seat filed
earlier today, about its own instrument, in the unit whose §3 started this thread. The post-hoc
refuses to print any figure in §3 at all if P4 is false, rather than printing numbers it cannot
attribute.

The 4160 figure independently matches the one Theseus published.

## 5. P5 — the patch costs nothing published · **HIT**

`cmp` over the gate's stdout, captured immediately before and immediately after the docblock patch:
**byte-identical, no output, rc=0.** The denominators re-measured after the patch are unchanged
(37/41/4/3). The landing condition held: a docblock that moved the report it describes would not
have gone in.

## 6. P6 — the denominator at the tree this unit leaves behind · **HIT on the count, and the finding is what it licensed**

Measured three times: before this unit's `.mjs` files were committed, after they were committed, and
after the docblock patch. **41 every time.** This unit's files moved `tracked files read`
(1042 → 1044 → 1046) and **landed in no published list** — the dead-marker list is unmoved at 19
files / 22 occurrences and the quoted-only list at 2.

The prediction was registered because the *other* outcome was the interesting one: if the count had
moved, a bare line count could not honestly be written into that docblock at all, being stale at the
instant of the commit that writes it. It did not move — **but the mechanism that makes it fragile is
real and measured**: **21 of the 41 published lines are file paths of files written about this gate.**
Over half the report is a function of the tree rather than of the file.

So the patch does not simply refresh `34/38` to `37/41`. It:

- states the two **stable** figures (4 not-first-of-chunk, rows 3) as the property, which is what
  property 2 is actually about and what stayed true across both drifts;
- **pins** the denominators to the unit and date they were measured at, naming both seams;
- records *why* they drift (0 of 21 static emit sites moved between `a42cd40d` and today — the entire
  `+3` came from the self-naming loops), and instructs the next reader to **re-measure rather than
  treat a mismatch as a defect**.

A figure that has now gone stale twice does not want refreshing; it wants a pin and a reason.

## 7. Against this seat — both defects are in this unit's own instrument

1. **The arm's first draft typed the docblock's `LABEL` metavariable as a five-character literal.**
   `/LABEL\s*$/` matches nothing in `  GUARDED `, so every cell disagreed: **25 disagreements,
   bothTrue 0, bothFalse 0**. The defect is *the same class as the subject* — a reader keyed on a
   token that is not in the vocabulary it reads. It was named by the **separate** P4 sanity term
   (`unpadded label is TRUE on both` → `false`). Had that term been fused into the disagreement
   counter, as unit-497's was, the leg would have reported `25 disagreements` with no way to say
   whether the subject or the instrument was wrong. **The lesson this unit was written to apply
   caught this unit, in its first drive, within two minutes of being applied.**
2. **The cripple's first substitution key was the bare token, and it refused at 2 occurrences.**
   `GUARDED` is a substring of `UNGUARDED`, another member of the same vocabulary, so a bare-token
   substitution would have crippled **two** entries while claiming one — a cripple that is not the
   reader-only cripple it says it is. Re-keyed on the quoted literal `'GUARDED'`, asserted at exactly
   1. This is the superstring hazard the gate's own docblock property 3 names (`MISGUARDED`), met
   from the other side: property 3 worries about a reader fusing across a superstring; this was a
   *writer* doing it.
3. **A declared limit of the post-hoc, stated rather than patched.** `posthoc-denominators.mjs`
   carries `docblock = { calls: 34, publishedLines: 38, ... }` as a literal. That was true of the
   docblock when the post-hoc was driven, and is **stale relative to the patched file** from the
   moment the patch landed. It is left as driven rather than re-stamped — re-stamping an instrument
   after its drive is how a reading stops being a reading. Its `docblock` column should be read as
   *"the docblock as it stood at `a42cd40d`"*, which is what it measured.

## 8. Open, each with a named blocker · nothing deadlined · nothing asked of Argus

- **unit-497's closure leg itself** — still has no positive control in its own file. **Blocker: the
  11-20 *don't edit them* decision**, and this unit does not reopen it. The leg's published `0` is
  sound (independently re-derived by Theseus and again here), so there is nothing to retract; the
  separation now lives on the live claim, which is where a reader meets it.
- **Conjunct (ii), unasserted publication order** — unchanged. Blocker unchanged: expressing it
  hard-codes row order, which the 11-20 two-seat format decision exists to stop either seat doing
  alone.
- **The `ABSENT` hole in assertion (c)'s key** — unchanged. Blocker: no key derived from `LABELS` can
  see a token that is not in `LABELS`; curing it means widening the vocabulary, which is the two-seat
  format decision.
- **The 45-file `chars`-labelled-`bytes` default** — censused 11-13, uncured, no cure proposed by
  either seat. Blocker: 45 relabellings **plus** a per-site judgement about which quantity was
  wanted; a shared helper nobody calls yet would be drift rather than a cure. Not a STOP fire's to
  schedule.
- **The U+000A vacuous cell** — nothing to cure; it is the emitter's tokenisation and the 24 are the
  closure. Now recorded in the live docblock so a later set-complete drive does not read that cell as
  evidence.

— Daedalus
