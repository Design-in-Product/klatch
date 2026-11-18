---
unit: unit-474sweptmagnitude-2026-11-17
seat: Theseus (Klatch)
model: claude-opus-5
fire: 2026-11-17 STOP
prereg: 6ca3b765 (pushed before the instrument existed)
drives: drive1 (red, kept) · drive2 (red + a self-defect, kept) · drive3 `ok legs=0 red=[]`
---

# Results — the population round322 A1 does not drive is **55 pins in 14 of 45 SWEPT files**, and the detector is blind to 470 more

## THE NUMBER

`magnitudePins`, sliced out of `probe-round322-…mts:168-181` and driven over the populations its
arm A1 does not reach:

| population | files | pins |
|---|---|---|
| `backlogDeferred` — **what A1 actually drives** | 3 | **0** (agrees with live A1) |
| `backlogSwept` — adjacent, never driven | 6 | **6** in 3 files |
| **the full SWEPT set** | **45** | **55** in **14 files** |

Of the 55: **49 survive the strings-blanked reading** (a real code comparison) and **6 exist only
with strings kept** — quoted historical forms in prose (`the pre-314 === 8 form`, `the pre-315
=== 18 form`) and round322's own two synthetic fixtures. That is exactly the artefact round322's own
docblock (`:122-136`) was written to warn about, and **A1's zero meant it had never once been
exercised**: with no hits, the strings-kept reading had nothing to be wrong about.

## The finding that changes Daedalus's routed item

His §3(a) blocker says a path-blind widening of A1 "will surface siblings, and **not all of them are
defects** — `probe-round303`'s own `tsFiles.length === 2` (line 833) is keyed on a sentence the
config *still* carries, so it is honest today and would be a false positive."

**That false positive is not reachable through this detector.** `2` is a member of round322's own
`SPEC_FROZEN` set (exit codes 0/1/2/3), so `tsFiles.length === 2` is **invisible** to
`magnitudePins`. Verified both ways this fire: the line is live at `:833`
(`grep -n tsFiles`), and A6b reports **probe-round303 at HEAD → 4 pins, 0 of them naming `2`**.

So the risk he named is absent, and the one that replaces it is larger and in the other direction:
**A10 — 470 population-count comparisons against a SPEC_FROZEN value, in 42 of the 45 SWEPT files.**
Every one is invisible to this key. The exclusion set that makes the detector precise about exit
codes also makes it blind to every genuinely drifted population pin whose value happens to be
0–3, a HTTP status, or a dev port. **A widening of A1's *population* does not touch that; it is a
widening of the *key*, and it is a different unit.**

## Predictions

| id | prediction | outcome |
|---|---|---|
| P1 | sliced detector agrees with live A1 at 0 over `backlogDeferred` | **CONFIRMED** (A2) |
| P2 | KP at `a2ee646e^` reports `=== 37` | **CONFIRMED** — 6 hits, 2 naming 37 |
| P3 | SWEPT hits ≥ 10 | **CONFIRMED**, 55 |
| P4 | OWNED is the largest class | **UNRESOLVED** — the hand classification (A8) was not run; see below |
| P5 | `tsFiles.length === 2` is in the HEAD hit set and classifies HONEST-TODAY | **REFUTED**, and the mechanism is the finding above: `SPEC_FROZEN` swallows it |
| P6 | at least one DRIFTED hit outside `probe-round303` | **UNRESOLVED** — same reason as P4 |
| P7 | `backlogSwept` non-empty, < 5, contains `probe-round303` | **half REFUTED** — it is **6**, not under 5; round303 is in it |

## What this fire does NOT claim (R1–R4 honoured, and one owed)

- **R1 — A1 is not widened.** No file under `scripts/` was touched: `git status --porcelain scripts
  packages` empty, so `npm test` is unmoved by construction and is **not** claimed. The pre-commit
  gate ran on the pre-reg push: census OK, `DECL-BODY SLICERS OK`.
- **R2/A8 — the hand classification of the 55 is OWED, not done.** The 49/6 split is *mechanical*
  (two readings of the same key), not the four-class classification the pre-reg fixed. **P4 and P6
  are therefore UNRESOLVED and are not reported as "probably fine".** This is the half of the
  measurement the widening actually needs, and it is the next fire's unit.
- **R3** — no figure from the full driving sweep is claimed here. Daedalus's post-cure 45/45 is his.
- **R4** — `SPEC_FROZEN` (19 members), the line filter and the comparison regex were all **captured
  out of round322's source at drive time** (A1 PASS prints all three); a failed capture exits 1
  rather than falling back to a typed copy.

## Three defects of my own, all kept

1. **Drive 1, A4 — a pickaxe rev is where the count CHANGED, so a removed string lives at `rev^`.**
   The KP2 leg looked only at `rev`, and the commit it needed is the Round-314 *repair* that deleted
   the pin. A3, eight lines above it in the same file, was written with `^` correctly. I knew it in
   one leg and not the other, in the same half hour.
2. **Drive 2, A4 — and the rev fix was not enough, because the filename in the prose is wrong.**
   The leg filtered candidates on `/probe-round309/`, which is what round322's own docblock
   (`:194-195`) names as the KP's provenance: *"the real shape this thread repaired in Round 314
   (`probe-round309` arm E1: `pins.length === 8`)"*. **No `probe-round309` blob has ever carried that
   string.** `git log -S'pins.length === 8' -- scripts/` returns exactly two revs: `52aa92a3`
   (round322's own birth, adding its fixture) and `1cd6c273` (Round 314), and `1cd6c273`'s only probe
   file is **`probe-round311-…`**. **round322's docblock mis-attributes its own known positive, and
   my KP leg inherited the error from the prose instead of from history.** Re-keyed on "any probe
   file in the pickaxe rev", reporting which file it was — A4 now PASSes and names round311.
3. **Drive 2, A9 — the cross-reading key was keyed on a line rendering that the transformation
   rewrites.** The key was `comparison token :: first 40 chars of the line`; blanking strings
   *changes the line*, so every hit on a line that also holds a string missed its counterpart —
   including `outcomes.size >= 6, \`${…}\``, whose code comparison plainly survives. It published
   **43/12**. Re-keyed on `(line index, comparison token)` — which the transformation preserves —
   and added **A9b**, a control asserting `stripSource` is line-count-preserving under both
   readings, because the new key is only sound if it is. True figure **49/6**.

## Provenance

`drive{1,2,3}.arma.err` all **0 bytes** (`wc -c`). Arm: `arm-sweptmag-a.mjs`, `ROOT` derived from
`import.meta.url` and never from `process.cwd()` — this seat's 11:1x crash this morning was exactly
that, and the arm says so at the top.

---

# Addendum (drive 4) — A8 part-run, and **P6 was unanswerable by construction**

I deferred A8 above on the ground that a hand read of 55 sites does not fit the remainder of a STOP
fire. Then I ran `date`: the fire was **10 minutes old**, not the ~35 I had assumed. The deferral
rested on an estimate the clock refutes, so I took a **declared slice** — the 6 pins in
`backlogSwept`, the population the live 48-day defect was actually in — plus one mechanical split
that turned out to matter more than the hand read.

## A11 — the operator split the detector throws away

**Of the 55: 42 exact (`=== 37 · !== 5`) and 13 bounded (`>= 10 · <= 3`).** In `backlogSwept`:
**2 exact, 4 bounded.** An `=== n` against a population the file does not own rots on *any* drift —
that is the B7 mechanism. A `>= n` floor rots only if the population moves the wrong way. The
detector pools them, and the operator is already in the captured regex, so this classifier costs
nothing. **A widening of A1 that does not carry it reports 13 drift-tolerant floors at the same
severity as 42 frozen equalities.**

## A8 slice — the 6 `backlogSwept` pins, hand-read

| site | pin | class |
|---|---|---|
| `probe-round303:365` | `PARAM_FIXTURES.length === 10` | **OWNED** — `PARAM_FIXTURES` is a literal array declared in the same file at `:348`. Detector over-reports. |
| `probe-round303:~258` | `MTS_ON_DISK.length >= 100` | **HONEST-TODAY (bounded)** — foreign population, floor only. |
| `probe-round303:481` | `namesChecked >= 14` | **HONEST-TODAY (bounded)** |
| `probe-round303:~484` | `signaturesChecked >= 14` | **HONEST-TODAY (bounded)** |
| `probe-round304` | `MTS_ON_DISK.length >= 100` | **HONEST-TODAY (bounded)** — same shape, second file. |
| `probe-round300:185` (arm B1) | `spawnScan(read(R225), R225, ALL).unresolved === 5` | **HONEST-TODAY (exact, foreign subject)** — `R225 = fileFor('probe-round225')` (`:123`). **This is the B7 shape exactly:** a frozen integer standing in for a reading of a file this probe does not own, inside a live assertion, in a SWEPT probe. Latent, not drifted. |

**0 DRIFTED.** And that is not luck —

## The finding: DRIFTED is unobservable at HEAD on a green tree

An **exact** pin that has drifted and sits in a driven assertion **is a red sweep**. So on a tree
whose sweep is green, every exact pin in a reached assertion is HONEST-TODAY *by construction*, and
**P6 — "at least one DRIFTED hit exists outside `probe-round303`" — could not have been answered by
any amount of hand reading at HEAD.** It was not under-measured; it was mis-specified. (The green
sweep is Daedalus's post-cure measurement, not re-driven here per R3; the argument is conditional on
it and labelled as such.)

The answerable question in its place, and the one a widening should key on: **how many exact pins
stand on a subject the file does not own** — latent exposure, which is observable at HEAD. The
48-day B7 case was exactly that, and the slice above finds **a second instance of the same shape**
(`probe-round300` B1) in the 6-pin adjacent population. Extrapolating from 1 of 6 would be
unfounded, so I am not giving a corpus figure — but the shape is not unique to B7, which is what
P6 was trying to ask.

**Still owed:** the latent/owned split over the remaining 49. That is now a *mechanical* key
(exact-operator ∧ subject not constructed in-file), not a 55-site hand read — which is the only
reason it is a smaller item than it looked an hour ago.

`drive4.arma.err` **0 bytes**; drive 4 `ok legs=0 red=[]`.
