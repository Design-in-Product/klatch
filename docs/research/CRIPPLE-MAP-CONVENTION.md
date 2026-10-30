# Cripple-map convention

**Status:** v2, written 2026-10-30 (Daedalus) to replace the de-facto v1 that lived only in the
shape of each unit's own `cripple-maps-predicted.md`. There was no canonical file before this one;
"the convention" was whatever the previous unit's map looked like, which is exactly how it drifted.

**Scope.** This governs *cripple maps* on the research track: the table a unit files, **before** it
drives a cripple arm, predicting what that arm moves. It does not govern predictions about the
subject (those are the unit's `predicted.md` / `PRE-REGISTRATION.md` rows), and it does not govern
the cell's own legs.

---

## 1. What a cripple map is for

A cripple arm perturbs either the **key** (the instrument's own comparison) or the **subject** (the
state the instrument reads). A cripple map, filed before the arm is driven, is the thing that makes
the arm *grade* the instrument rather than being read off it afterwards. Filed after the drive, it
is a transcript; filed before, it is a prediction.

## 2. The two defects v1 had, both measured 2026-10-29

Both findings are dated, attributed, and were measured on real filed maps — not reasoned about.

**(a) A verdict-keyed map cannot name a reached `[MEAS]` member.** Every map in both seats' units
was keyed on the cell's verdict sets — `red=`, `refused=`, `refuted=`. A `[MEAS]` leg publishes a
value and no verdict, so there is nothing of it in those sets to move; an arm can demonstrably
reach it (its `detail:` line changes) and a verdict-keyed map has no row that can say so. Measured
in `docs/research/unit-464t8-mapdecay-2026-10-29/` (Daedalus): over 3 arms × 6 new members, **4
cells reached, 2 nameable** — and verdict movement is a strict **subset** of detail movement
(`verdictMoved=2 detailMoved=4 violations=[]`). The under-report sits at the map's **own filing
rev**, not only after it, and is **invisible to a re-drive-and-compare** that diffs verdict sets.

**(b) A hand-typed token is keyed on the author's spelling, not on the subject.** Measured in
`docs/research/unit-464t2b-sat-2026-10-29/ADDENDUM-map-grading-2026-10-29-stop.md` (Theseus): of
his three filed maps, the one row that *does* name the reached `[MEAS]` leg writes
`` `pinDistance=0 pinned=true assertable=false` `` where the cell prints **`pinArmPinned=true`**.
`pinned=` is a token the cell never emits on that line. Re-key the convention to "name reached
members" alone and that row still passes authoring and still fails comparison, because it was never
keyed on the subject. His grade on his own three maps: **`filedMaps=3 reached=3 fullyNamed=0
underReported=3`** — worse than Daedalus's, written the same week against the same convention. The
deficiency is the convention's, not the authors' care.

**(c) A third, from the same fire, about instruments that grade maps.** Theseus's first grading
counted a token as named if the word appeared anywhere in the map's section, and scored two tokens
named off ordinary prose. **A proximity-free word match over-reports coverage**, which in a grading
instrument is the more dangerous direction: it manufactures the conclusion that the maps were fine.
Gating the match on a line that mentions the member took those two to zero.

## 3. The convention

A cripple map **MUST** carry all four of the following. A map missing any one of them is not a v2
map and the checker refuses to grade it rather than grading it as clean.

### 3.1 A machine-readable stamp

One fenced block, `MAPSTAMP`, at the top of the map file:

```
MAPSTAMP v2
filing-rev: <40-char sha of the commit that filed these maps, before the first drive>
cell: <path to the instrument whose members these maps predict>
cell-size-at-filing: legs=<N> preds=<M>
clean-recording: <path to the clean drive these maps diff against>
```

`cell-size-at-filing` is **read off the clean recording's own `VERDICT/` line**, never counted by
hand. It exists so that a later re-drive can be told *mechanically* that the cell has grown since
filing — the rule being: **a filed cripple map is complete only at its filing rev** (Theseus,
10-29). A member added after filing can be moved by one of these arms with nothing in the unit
changing, and a comparison against the filed table then reads the new member as a regression.

### 3.2 One section per arm, named as the arm is spelled on the command line

The heading must contain the arm's `--cripple=<name>` value verbatim, and must state **which of key
or subject** the arm perturbs. The key/subject label is load-bearing, not decoration: a key-level
known positive is structurally unable to score a subject-level arm, so a map that does not say
which it is cannot be checked for whether the right instrument scored it.

### 3.3 Rows keyed on REACHED members, not on verdict members

A member is **reached** by an arm when the member's own printed line moves between the clean
recording and the arm's recording — its status label, its `detail:` line, or both. Every reached
member gets a row. Verdict movement still gets reported, as a *property of a row*, not as the key
the rows are selected by.

This is the half that fixes 2(a). Its cost is explicit: the reached set is larger than the verdict
set, often several times larger, and the map is correspondingly longer. That is the price of a map
that can see what the arm actually did.

### 3.4 Tokens quoted as CAPTURED strings

Any figure a row quotes must be a substring **copied from the recording**, and the checker verifies
it occurs there verbatim. Write `pinArmPinned=true` because that is what the line says; do not
write `pinned=true` because that is what it means. A row whose token does not occur in the arm's
recording is a **DEFECT**, not a stylistic matter — it is the row v1 admitted and no comparison can
match.

This is the half that fixes 2(b), and it is also what makes 3.1's stamp checkable at all: *a
comparator can only check what was captured.*

## 4. How a v2 map is checked

`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs` grades a filed map against
recordings. It is a **grader, not an authoring aid** — it reads the map as text and the recordings
as ground truth, and it never recomputes the map from the recordings (a pin that recomputes what it
grades is hollow).

Per arm it reports:

| figure | meaning |
|---|---|
| `reached` | members whose printed line moved, clean → arm |
| `named` | reached members mentioned on a line inside that arm's section |
| `tokensMoved` | captured tokens that changed value on a reached member's line |
| `tokensNamed` | moved tokens quoted, **in member context**, inside the section |
| `tokensTyped` | tokens the section quotes that do **not** occur in the arm's recording — defects |
| `stamp` | `OK` / `STALE legs=+N preds=+M` / `ABSENT` |

**Refusal semantics.** A missing recording, an unparseable arm section, a recording with no
`VERDICT/` line, or an absent `MAPSTAMP` yields **`null`, never `0`**, and a non-zero exit. An
under-report of `0` and an inability to measure the under-report are the two answers a map checker
must never confuse — and a grading instrument that cannot refuse manufactures findings.

## 5. What this convention does not claim

* It does not claim a complete map proves an arm separated. That is the known positive's job.
* It does not claim the reached set is the arm's blast radius in the *source*. Reach is measured at
  the recording, so a member the arm perturbs but which prints nothing is invisible to this
  convention and to the checker. Named here so nobody reads `reached` as "everything touched".
* It does not retro-grade. The six maps filed before 2026-10-30 stay as filed; §2's measurements
  are published beside them, not edited into them.

## 6. Precedents and prior art, so the next fire need not re-derive them

* `docs/research/unit-464t8-2026-10-29/cripple-maps-predicted.md` — the first completeness stamp,
  prose form, hand-read.
* `docs/research/unit-464t8-mapdecay-2026-10-29/` — the reached-vs-verdict measurement, and the
  finding that a **delta** gate is immune to a constant blindness in the reader taking both counts
  (`GABS`, the absolute count per recording, is what catches it).
* `docs/research/unit-464t2b-sat-2026-10-29/ADDENDUM-map-grading-2026-10-29-stop.md` — the
  typed-token defect and the word-anywhere over-report.
* `docs/research/unit-464t2-t8-2026-10-29/` §4 — the key/subject label's origin: a key-level known
  positive structurally unable to score a subject-patching arm.
