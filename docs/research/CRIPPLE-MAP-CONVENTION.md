# Cripple-map convention

**Status:** v2.1, 2026-10-30 WORK fire (Daedalus). v2 was written the same morning to replace the
de-facto v1 that lived only in the shape of each unit's own `cripple-maps-predicted.md`. There was
no canonical file before v2; "the convention" was whatever the previous unit's map looked like,
which is exactly how it drifted.

**What v2.1 changed, and why it changed within hours of v2.** Theseus wrote the first map *authored*
under v2 (`docs/research/unit-464v2map-2026-10-30/`) in the fire v2 landed in, and that first
attempt measured four defects in the convention — three of which are the kind only writing a map can
find. All four are fixed below and each is attributed inline: a drift exclusion on reach (§3.3), a
writable `filing-rev` and three MUST fields now actually gated (§3.1), a one-heading rule (§3.2),
and a one-physical-line rule (§3.4). **A convention is not checkable until something has been
written under it**, which is the general form; v2's §3 sentence about refusing an incomplete map was
false for three of its own five fields at the moment it was published.

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

> **v2.1:** that sentence was **false when v2 published it**, for three of §3.1's own fields — they
> were declared MUST and read by nothing, measured by stripping them and still scoring
> `MAPVERDICT/0 ok` on 0 differing lines of 36. It is true now, and `GMUST`/`GCONFORM` are the gates
> that make it true. The general form worth carrying forward: **a declared requirement no gate reads
> is a comment**, and the way to find one is to strip it and see whether anything notices.

### 3.1 A machine-readable stamp

One fenced block, `MAPSTAMP`, at the top of the map file:

```
MAPSTAMP v2
filing-rev: <40-char sha, stated as PARENT-OF-FILING; must resolve to a commit>
cell: <repo-relative path to the instrument whose members these maps predict>
cell-size-at-filing: legs=<N> preds=<M>
clean-recording: <repo-relative path to the clean drive these maps diff against>
```

**`filing-rev` is the PARENT of the commit that files the map** (v2.1; v2 asked for the sha of the
filing commit itself, which **does not exist while the map is being written** — Theseus, 10-30,
who filed the parent and said so in the map rather than passing it off as the thing asked for).
Say which it is in the map.

**All four of the non-marker fields are now GATED, where v2 declared them MUST and read one.**
Measured by Theseus on 10-30: stripping `cell:` and `clean-recording:` and replacing `filing-rev`
with forty zeroes produced **0 differing lines of 36** and `MAPVERDICT/0 ok` — `filingRev` was
assigned and never read, `field('cell')` and `clean-recording` occurred zero times in the checker.
A MUST no gate reads is not a MUST. `GMUST` now checks, in the only forms that are not themselves
spellings: `filing-rev` must **resolve** (`git cat-file -e <sha>^{commit}` — forty zeroes are forty
valid hex characters), `cell:` must resolve to a readable file, and `clean-recording:` must resolve
to **the same file on disk** as the drive's own `--clean=`, compared by realpath and tried both
cwd- and repo-relative, because a map writes repo-relative paths and the checker is driven from a
unit directory.

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

**ONE heading per arm, and the document title is not one of them** (v2.1). `sectionFor` refuses
unless **exactly one** heading contains the arm name — zero means the map does not map the arm, two
means the figure comes from whichever came first. v2 said nothing about this and the first map
written under it was rejected for naming its subject in its own `# ` line: Theseus's as-filed map
graded `[UNMAPPED] … MAPVERDICT/1 RED red=[GCTX,GTYPED]`, and `drive2` is the same file with **only
line 1 different**. The refusal is correct and stays; the rule it enforces is now written down.
A map covering one arm should title itself for the unit, not the arm.

### 3.3 Rows keyed on REACHED members, not on verdict members

A member is **reached** by an arm when the member's own printed line moves between the clean
recording and the arm's recording — its status label, its `detail:` line, or both. Every reached
member gets a row. Verdict movement still gets reported, as a *property of a row*, not as the key
the rows are selected by.

This is the half that fixes 2(a). Its cost is explicit: the reached set is larger than the verdict
set, often several times larger, and the map is correspondingly longer. That is the price of a map
that can see what the arm actually did.

#### 3.3a Reach excludes DRIFT, and the exclusion is derived from a control pair (v2.1)

**The defect v2's reach key had, measured 2026-10-30.** A member's line can move between the clean
recording and the arm recording for a reason that has nothing to do with the arm: the two drives
were taken at different clock times against a repository still receiving commits. Theseus found it
(§4 of his 10-30 memo) and it reproduces off Daedalus's own `drive11` recording — `G1` (a commit
population size), `W1` (window counts over that population) and `T9` (a dated line carrying a rev)
are in the `reached` set of **all six** arms, *including `t9-insensitive-leg`, the arm designed to
move nothing*, where they are **3 of its 4**. `T9` is the cleanest case: reached, with `moved=0`
tokens — its line differs outside any `name=` token at all.

**A map cannot be complete about membership while membership includes members the arm never
touched.** Every pre-10-30 membership figure is therefore a **ceiling**, not a measurement.

**The key is a CONTROL, not a list of ids.** Two **no-cripple** drives of the same cell, produced
independently at different clock times and revs, with no arm applied to either; a member whose line
differs between them moved with nothing in play. Naming the three ids in the checker would hard-code
one reading of what they mean — an exclusion keyed on three ids someone named is not keyed on drift.
Driven on `unit-464t2b-sat-2026-10-29/drive2.clean.out` (`2cf37348`) against
`unit-464t8-mapdecay-2026-10-29/drive1.clean.out` (`ec0db7f7`), the control finds **n=5
[G1,T9,W1,W2,W3]** — **two more** than the arms exposed, because `W2`/`W3` happened not to be
reached by any of the six.

Three figures are published per arm, never one: `reached` (raw, kept because published figures are
keyed on it), `reachedDrift`, and `reachedArmCaused`. **`reachedArmCaused` is a CEILING**: the
control can only *under*-state drift, since a clock-sensitive member that happens to print the same
value in both control drives is invisible to it. With no readable control the two new classes
**refuse** — `null`, never a fallback to `reached`, which would make the comparison green forever —
and a drive given no control pair reddens `GCTRL` because it is an audit that never looked at the
drift axis, whatever else it got right.

The measured effect on the two seats' filed maps, raw → drift-excluded:

| | reached (mapped) | under-reported | membership | tokens |
|---|---|---|---|---|
| Theseus's 3 mapped arms | 24 → **15** | 24 → **15** | 14 → **5** | 10 → **10** |
| Daedalus's 3 mapped arms | 19 → **17** | 18 → **16** | 14 → **12** | 4 → **4** |

**This inverts a claim published hours earlier.** "The membership axis is the larger half in both
seats' maps" is false for Theseus's maps once drift is out: **5 membership against 10 tokens**. It
survives for Daedalus's (**12 against 4**) — and the asymmetry has a cause that was not predicted:
his clean drive and his arm drives were taken in different clock windows, where the three
re-drives in `unit-464t8-mapdecay` came from one. Drift is a property of **how the recordings were
produced**, not of the author's care, which is why it has to be measured per recording pair and
cannot be stated once for the track.

### 3.4 Tokens quoted as CAPTURED strings

Any figure a row quotes must be a substring **copied from the recording**, and the checker verifies
it occurs there verbatim. Write `pinArmPinned=true` because that is what the line says; do not
write `pinned=true` because that is what it means. A row whose token does not occur in the arm's
recording is a **DEFECT**, not a stylistic matter — it is the row v1 admitted and no comparison can
match.

This is the half that fixes 2(b), and it is also what makes 3.1's stamp checkable at all: *a
comparator can only check what was captured.*

**ONE PHYSICAL LINE per row** (v2.1). `mentions()` selects **physical** lines, so a captured token
that markdown wrapped onto the line after its member's id sits outside its own member's context and
scores `captured=[]`. Measured by Theseus, 10-30: `T2bSAT`'s one moved token is `key`, the arm
prints `key====`, his map wrote `key====` — and it scored uncaptured, by a line break. v2 said
nothing about it. Keep each row on one physical line however long, or re-state the member id on the
continuation.

**A `named` hit can still be a PARAPHRASE, and the context gate does not stop it.** The single
`fullyNamed=1` cell in the first v2 map scored `named=[key]` off the English word "key" in the prose
*"the ceiling key's spelling"*, on the member's own line — the same defect as Daedalus's `active=3`
vs "active figure 3" reached by a different route. This is why `fullyCaptured` and not `fullyNamed`
is the figure §3.4 is graded on, and why `GCONFORM` reads the captured key.

## 4. How a v2 map is checked

`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs` grades a filed map against
recordings. It is a **grader, not an authoring aid** — it reads the map as text and the recordings
as ground truth, and it never recomputes the map from the recordings (a pin that recomputes what it
grades is hollow).

Per arm it reports:

| figure | meaning |
|---|---|
| `reached` | members whose printed line moved, clean → arm (v2 key). **Raw — includes drift** |
| `reachedDrift` | reached members that also move between two **no-cripple** control drives, i.e. with no arm in play (v2.1) |
| `reachedArmCaused` | `reached \ reachedDrift` — a **CEILING**, since the control can only under-state drift. **REFUSES** with no control pair (v2.1) |
| `underReportedArmCaused` | the under-report over arm-caused rows only, still printed as `membership + tokens`. This is the figure `GCONFORM` grades (v2.1) |
| `verdictReached` | members that entered or left a verdict set (v1 key, reported beside it — one key alone is not a measurement) |
| `named` | reached members mentioned on a line inside that arm's section |
| `fullyNamed` | rows where every moved token's **name** appears in member context |
| `fullyCaptured` | rows where every moved token appears as the exact captured `name=value` string. `fullyCaptured ≤ fullyNamed` by construction |
| `underReported` | printed as `membership + tokens` and never as one number: a reached member with no mention at all is a different defect from a mentioned member whose tokens are unnamed, and the v1 key hides exactly one of the two |
| `tokensTyped` | tokens the section quotes **of a member** that **that member's own line** never emits — defects. Keyed per member, not per recording: another member's identical token will otherwise launder the mis-spelling |
| `stamp` | `OK` / `STALE legs=+N preds=+M` / `REFUSED` |

Its **thirteen** gates (eight at v2, five added at v2.1), each with a cripple arm:
`GKP` (tokenizer, on a real slice of a recording), `GABS` (absolute member count against the
recording's own `VERDICT/` counts — an absolute, because a delta cancels a constant blindness in the
reader taking both counts), `GSTAMP`, `GREACH` (the re-key is non-vacuous), `GCTX` (the
member-context gate can bite), `GTYPED` (the per-member typed-token key is no looser than the
recording-wide one it replaced), `GREFUSE` (refusal semantics), `GCOMPLETE` (coverage — a correct
refusal on an arm it could not read is still an incomplete audit, and these are separate gates
because the first version of this checker satisfied the former and exited 0 under the latter), and
at v2.1: **`GMUST`** (§3.1's four fields, all gated), **`GCTRL`** (the drift axis is covered at
all), **`GDRIFTBITE`** (the exclusion is wired to the figure), **`GDRIFTREF`** (the drift classes
refuse rather than fall back), **`GCONFORM`** (the gate that *reads* `underReportedArmCaused` —
before v2.1 **not one** of the eight read `underReported`, `fullyCaptured` or `fullyNamed`, so a map
with zero §3.4-conforming rows scored `MAPVERDICT/0 ok`; a v1-prose map is EXEMPT, per §5).

**The halves of the cure are ORDERED, and there are three of them.**

1. **Drift exclusion first** (§3.3a). It is upstream of both other halves: keyed on the raw reached
   set, `GCONFORM` reddens a map for not naming members the arm never touched, and the membership
   under-report it reads is up to 64% drift.
2. **Then the reach re-key** (§3.3). The typed-token check only examines rows for members in the
   *reached* set, so applying §3.4 on top of a verdict-keyed reach reports a clean `n=0` on the very
   row the convention exists to catch — measured: under `--cripple=verdict-keyed-reach`,
   `tokensTyped` goes **1 → 0**.
3. **Then the captured-token rule** (§3.4).

**Grade a cripple arm as a DELTA against a matched no-cripple drive, not as an absolute red list**
(v2.1, found while building `GDRIFTREF`). `GCTRL`, `GDRIFTBITE` and `GDRIFTREF` all key on the same
precondition — a readable control pair — so the arm that removes that precondition reddens all three
and "reddens X and only X" is unachievable for it by construction. Two drives given *identical*
inputs and differing only in `--cripple` isolate the arm: the difference of their red sets is the
arm's effect and nothing else. A cripple that makes a gate **green** then shows up as a removal,
which is the correct shape — a gate that still reddens under its own cripple has not been shown to
be the thing doing the work.

**A saturated gate must be graded at the REASON level.** `GCONFORM` is red under both its keys on
the current population, so its verdict cannot tell the keys apart; the figure name and the counts it
prints can (`key=underReportedArmCaused cells=3 membership=0` against `key=underReported cells=6
membership=3`). An arm whose gate is saturated is recorded as *unreachable at the verdict* rather
than quietly counted as a pass.

Measured: `docs/research/unit-464mapkey-2026-10-30/RESULTS.md` §5 and
`docs/research/unit-464drift-2026-10-30/RESULTS.md`.

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
