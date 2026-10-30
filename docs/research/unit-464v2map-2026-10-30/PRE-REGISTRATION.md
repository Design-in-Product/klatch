# unit-464v2map — the FIRST map authored under v2, and what the convention cannot ask for

**Seat:** Theseus. **Fire:** 2026-10-30 START. **Baseline rev:** `ee653841` (`baseline.rev`).
**Working tree at open:** `baseline.gitstatus.txt` — one line, this unit's own untracked directory.

**Routed item taken.** Daedalus's 10-30 START memo §6, *"Mine, open, and named so it stays
claimable: **no map has yet been AUTHORED under v2.** All six in the population are v1 maps graded
against a convention published after them. The first v2 map is the first test of whether the
convention is *writable* as well as checkable."* Taken this fire rather than left in the list.

**Subject of this unit.** Two things, and they must not be conflated:

1. **The map** — `V2-MAP-t8-ceiling-blind.md`, authored here under
   `docs/research/CRIPPLE-MAP-CONVENTION.md` v2, for one cripple arm of
   `docs/research/round464-instruments/grade-the-stop-condition.mjs`.
2. **The convention and its checker** — whether a conforming map is *writable at all*, and whether
   the fields §3.1 declares MUST be present are fields anything reads.

Nothing in this unit edits the cell, the convention, or the checker. Every path written is under
`docs/research/unit-464v2map-2026-10-30/`.

---

## Authoring protocol (stated before the map exists, so it can be held against me)

The arm mapped is **`t8-ceiling-blind`**, whose recording
(`../unit-464t2b-sat-2026-10-29/drive-cripple-t8-ceiling-blind.out`) was committed 2026-10-29 and
is therefore **immutable** — I cannot bias it. What I can bias is my own map, by reading that
recording first. So:

* While authoring the map I read **only** the cell's source and the **clean** recording
  (`drive2.clean.out`), which §3.1 requires the map to name anyway.
* The arm recording is **not opened** until the map is committed. The commit order is the evidence:
  pre-registration, then map, then the first drive.
* This is weaker than a blind prediction and I am not claiming otherwise, because of the prior
  knowledge declared below. It is a prediction about *this* arm's full reached set, which no filed
  artefact states.

### Prior knowledge I already hold about this arm, declared rather than discovered

1. From my own 10-29 coordination entry: *"his `t8-ceiling-blind` reddens `T2bKP`,
   `misses=[pin-arm-above-ceiling]` and only that row."* So one of the four rows below is partly
   known, including one captured token.
2. From Daedalus's 10-30 §1 `MEMBER T2bSAT` line: `t8-ceiling-blind 1` — T2bSAT moves exactly one
   token under this arm. I do not know from that line *which*.
3. From the convention's §2(b) and his §2: `T8CEIL` emits `pinned=true` on its own line.

Nothing I hold states the arm's reached **membership**, `T8KP`'s row, or any `rows=` value.

---

## Predictions

Each is stated so that a drive can refute it. **R** = about the map I am about to author.
**C** = about the convention/checker, independent of my map's quality.

### R1 — the map's predicted reached set is exactly four members

`reached=[T2bKP,T2bSAT,T8CEIL,T8KP]`, derived from source: the arm re-spells the shared ceiling key
`>=` as `===` (cell lines 355, 881, 1329), and those four are the members whose printed line is a
function of that key at this rev.

### R2 — verdict reach is strictly narrower, so the re-key is non-vacuous on this arm

`verdictReached=[T2bKP,T8KP]` (2) against `reached` (4) — `T2bSAT` is `[MEAS]` and `T8CEIL` is
`[MEAS]`, so neither can enter a verdict set. **If R1 and R2 both land, this arm on its own is a
second instance of the convention's §2(a) defect**, independent of the one it was written from.

### R3 — the map grades `underReported = 0 + 0` and `tokensTyped = 0`

The first map in either seat's population to do so. If it does not, the convention is not writable
by its own author on its first attempt, which is worth more than a clean row.

### R4 — `fullyCaptured = 4` is the row I expect to FAIL, and `T2bKP`/`T8KP` are why

`tokensOf` keys on ` <ident>=` boundaries, so the **last** token on a payload line takes the whole
remainder of that line as its value. On `T2bKP` and `T8KP` the last token is `rows=`, whose value
runs to end of line and includes every per-row `name:expected/actual` triple. To be `fullyCaptured`
those rows must quote **the entire remainder of the detail line, verbatim, for the arm drive that
has not happened yet**. I will write them out and expect at least one to be wrong.

### C1 — `filing-rev` cannot be written truthfully and nothing reads it

§3.1 requires `filing-rev: <40-char sha of the commit that filed these maps>`. That sha does not
exist until the commit exists, so no map can state it at write time; the best available is the
parent. And `grade-filed-maps.mjs` parses the field into `filingRev` at line 211 and **never reads
it again** (`grep -n filingRev` → one hit, the assignment).
**Predicted:** replacing `filing-rev` with 40 zeroes, and deleting the line entirely, both leave
every graded figure and the `MAPVERDICT` line byte-identical except for the field itself.

### C2 — `cell:` and `clean-recording:` are declared MUST fields that are never parsed

`grep -c "field('cell')"` → 0; `grep -n "clean-recording"` over the checker → no hit. The checker's
stamp reader reads `cell-size-at-filing` and `filing-rev` only.
**Predicted:** deleting both lines leaves every graded figure and `MAPVERDICT` byte-identical.

### C3 — the convention's MUST/refuse sentence over-claims, and this is the finding for Daedalus

§3 says: *"A cripple map **MUST** carry all four of the following. A map missing any one of them is
not a v2 map and the checker refuses to grade it rather than grading it as clean."*
**Predicted FALSE as implemented** for three of §3.1's five fields. The checker refuses only when
`cell-size-at-filing` is absent or unparseable (line 209–210); a map missing `cell:`,
`clean-recording:` or `filing-rev` grades **clean**, not refused. A declared requirement no gate
reads is the same shape as a declared cripple no hook dispatches — and that shape has already
landed once in this cell (`M0c`, 10-29).

### C4 — §3.4's key measures value AGREEMENT, not provenance

`captured` is `haystack.some(l => l.includes(`${t}=${tb.get(t)}`))` (line 316–319) — a substring
test against the **arm** recording's value. A token I *predict* correctly pre-drive scores
`captured` identically to one *copied* post-drive; a token I predict wrongly scores as uncaptured
even though it was authored exactly as the convention asks.
**Predicted:** a variant of my map in which one correctly-predicted captured token is replaced by a
*plausible but wrong* value moves `fullyCaptured` down and `tokensTyped` **not at all** — because
the token name is still one the member emits. So the checker can distinguish a wrong value from a
wrong name, but **cannot** distinguish a copied value from a predicted one, and `fullyCaptured`
therefore grades prediction accuracy on a pre-drive map and provenance on a post-drive one. The
convention describes only the second.

### C5 — the two halves are ordered, and so is this one

Daedalus's §3 established that §3.4 applied on top of a verdict-keyed reach reports a clean `n=0`.
**Predicted, as a corollary I will drive rather than assert:** under
`--cripple=verdict-keyed-reach`, my map's `reached` falls from 4 to 2 and its `underReported`
membership figure falls to 0 — i.e. the v1 key would certify *this* map complete while it is still
missing nothing, which is the one case where v1 and v2 agree for the wrong reason.

---

## What this unit does not claim

* It does not claim the map is a blind prediction. See the declared prior knowledge.
* It does not claim one arm grades the convention's writability in general. One arm is one axis;
  the widest arm in this cell (`t8-unpinned`, 15 of 36 members by Daedalus's §5) is left unmapped
  and named as still claimable.
* C1–C3 are read off the checker's **source** in this fire. Each is driven below rather than left
  as a source claim, because a source regex fails by returning a smaller number.
