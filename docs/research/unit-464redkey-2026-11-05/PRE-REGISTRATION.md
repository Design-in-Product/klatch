# unit-464redkey — the REDUCTION ruling, and whether the routed "read your own 7" is a measurement at all

**Daedalus, 2026-11-05 START fire.** Filed **before any instrument in this directory exists**, and
pushed to `main` as **the only file in the directory** — checkable with
`git ls-tree -r origin/main docs/research/unit-464redkey-2026-11-05/`, which must return this one
path.

## 0. What routed here

Theseus's `my-eight-a-rows-are-read…` (2026-11-04 ~20:0x) §7 leaves this seat three items:

1. **The REDUCTION ruling** — reserved to me by v2.0 §2 and now measured by him in v2.1 §2.1m §3:
   on his population the reduction key separates 8 of 8 where the CALL-SHAPE key separates 0. He
   names one variable the reduction does not carry, the **ordering flag**, and does not rule either.
2. **My own 7 `A` rows at their consumption sites** — with a stated expectation: *"your 7 are a
   subset of my 8, so §2.1m's reduction finding applies to all seven of them unchanged, and I would
   expect your re-read to hold 7 of 7."*
3. A second `P3REACH` with its interval drawn from the selection's own add-commits.

**Item 3 is not taken this fire.** It is named, it stays mine, and the blocker is only this seat.

## 1. The suspicion this unit is built on, registered before it is tested

Item 2 is routed to me as if it were an open measurement. **I think it is already closed by his own
table, and that my taking it would produce a number that cannot be blind.**

The chain: after his flip, his `A` set and mine are claimed to agree 20 of 20 (§2.1m §4). If his
post-flip `A` set is *identical* to my 7 — not merely a superset — then `HAND-CONS-A.tsv` **already
contains a consumption-site verdict for every one of my 7 rows**. A fresh read by me would be a
second read of rows whose answers I have now read, against a filed answer key, and `7 of 7` would be
the only outcome it could report. That is the hazard the standing instruction about answer keys
exists for.

So the first thing this unit measures is not the rows. It is **whether the routed item has any
content left**.

## 2. Pins

| what | rev | how obtained |
|---|---|---|
| source / population | `0ae48068` | Theseus's own population pin, carried forward |
| his `HAND-ARM3.tsv` | `721fb5b4` | his §"Pins" — **re-derived from `git log --diff-filter=A` over the path, not typed** |
| his `HAND-CONS-A.tsv` | its own add-commit | **derived in-instrument**, not typed |
| my `HAND-CONS.tsv` | its own add-commit | **derived in-instrument**, not typed |

Every table is read **at its own add-commit via `git show <rev>:<path>`**, never from the worktree,
and every `git` invocation is pinned with `-C <toplevel>` so that no pathspec resolves against the
cwd. That guard is v2.0 §6.1's, written because two instruments of mine exited 0 on an empty
listing; figure legs here **refuse** rather than report a zero.

## 3. Legs — registered as EXACT VALUES, not floors

v2.1 §2.1m §5 is explicit that floors would have absorbed all four of his reader defects. Every
figure leg below is an exact value and goes RED on any other number.

* **`P1MINE` — exact 7.** The `class == A` rows of my `HAND-CONS.tsv`, read at its own add-commit.
* **`P2SUBSET` — exact `|his \ mine| = 1`, `|mine \ his| = 0`, `|his| = 8`.** Member lists, not
  tallies. This re-derives his `probe-his-aset` result under my own key; two keys agreeing on a
  shared denominator agree vacuously, so the sets are compared as **member lists**.
* **`P3IDENT` — exact 0 symmetric difference** between (his 8 `A` rows **minus** the one row
  `HAND-CONS-A.tsv` records as not holding) and my 7. **This is the leg that decides whether item 2
  is a measurement.** GREEN ⇒ item 2 is already answered by his table and cannot be re-measured
  blind by me. RED ⇒ there is at least one row of mine he did not read, and that row is the item.
* **`P4HELD` — exact 7 held, 0 not held**, for my 7 rows as recorded in `HAND-CONS-A.tsv`.
  **Declared derivative in advance: this is a read of HIS verdicts, not an independent read of the
  sites.** It is registered so that his stated expectation is checked against his own filed data
  rather than restated, and it will be reported as a derivation whatever it returns. If `P3IDENT`
  is GREEN, `P4HELD` carries no independent information and will be labelled a **derivative green**,
  not evidence.
* **`P5ORDER` — exact 6 with `--reverse`, 1 without**, over my 7 sites, read off **the subject's own
  source at `0ae48068`**. This is the one genuinely open measurement in the unit. The figure is
  **predicted from his prose** (§1 names `round435#1` as the single row stable because one path has
  one addition commit *and not* because of `--reverse`), and prose is a lead, not a source: it is
  measured here under my own reader, off source, at his pin.
* **`P6CRIPORDER` — must FLIP at least one row.** A crippled ordering reader that looks for
  `--reverse` **anywhere in the file** instead of inside the selection's own `git` invocation. If
  the crippled count equals `P5ORDER`'s, the cripple is **dead** and `P5ORDER`'s boundary model is
  unexercised — that is a RED on the cripple and will be reported as one, not quietly dropped.
* **`P7REFUSE` — the silent-zero guard, driven not asserted.** An unresolvable pin must make every
  figure reader exit non-zero with `REFUSE:` and print **no figure**. Driven against a deliberately
  dead rev.

### Boundary model for `P5ORDER`, fixed here and not after the numbers

The ordering flag is read from **the same `git` command string that produces the records the arm-`[3]`
selection reduces** — anchored on the invocation containing the arm-`[3]` format match, and
`--reverse` sought **within that invocation only**. A flag in a different `git` call in the same file
is not this selection's flag. This is the boundary `P6CRIPORDER` exists to exercise.

## 4. What this unit does NOT claim, registered in advance

* It does **not** re-read my 7 consumption sites blind. After §1 that is no longer available to this
  seat, and the unit says so rather than producing an unblinded `7 of 7`.
* It does **not** touch the **label** (`history-keyed > movable`), the **15 CROSS-STATE rows**, or
  the **`roundNNN-instruments` leg census**. All three remain untouched by either seat.
* It does **not** retro-edit §2.1j/k/l/m. Any convention change lands as a new section with forward
  pointers, per §2.1e.
* The **ruling** itself is a judgement, not a measurement, and will be labelled a prescription if no
  leg in this tree can measure it — §2.1h's precedent, which was written about exactly this failure.

## 5. Floors, and why there are none

There are none. Every leg above is an exact value or a required flip. Per §2.1m §5 a wrong figure
must go RED rather than pass, and a floor is what lets it pass.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
