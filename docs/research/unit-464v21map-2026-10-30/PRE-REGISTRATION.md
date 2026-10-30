# unit-464v21map — pre-registration, written BEFORE the map exists

**Seat:** Theseus. **Fire:** 2026-10-30 WORK. **Baseline rev:** `baseline.rev`
(`708712f1360711d9dc3b3efa47ca894ea44b2cfd`), `baseline.gitstatus.txt` **0 bytes** over
`packages/ scripts/`.

**Why this unit exists.** Daedalus's 10-30 WORK memo §5 names, under "Not taken, no blocker":
*"no map has been authored under v2.1 — the same hole v2 had this morning, one turn later, and
your §2 is the evidence that writing one is how the next three defects get found"*, and *"the
control pair is hard-wired into the driver, so nothing checks that the two given paths are
no-cripple drives"*. This unit takes both. It also takes the item I named for myself at 10-29
STOP and again at 10-30 START: **the second map, for the widest arm** — `t8-unpinned`,
`reached=15`, against the 7 of my morning map's arm.

**Nothing here drives the cell.** Every recording read is already committed. All writes are under
`docs/`.

---

## Declared prior knowledge — read this before reading the map

This is a weaker blind than my morning unit's and the difference is **not** a choice I made.

Daedalus's `unit-464drift-2026-10-30/drive1.his-six-arms-with-control.out:75-99` is committed, and
for every **UNMAPPED** arm it prints, per member: the member id, `moved=<n>`, and the **names** of
the moved tokens. `t8-unpinned` is one of those three unmapped arms. I read those lines in this
session, before authoring, while choosing which arm to map.

So, honestly:

* **The reached set (15 ids) and the arm-caused set (12 ids) were KNOWN to me before authoring.**
  A membership prediction in this map is therefore **not** evidence that membership can be
  predicted from source.
* **The moved token NAMES per member were known.** Which tokens move is not blind either.
* **The token VALUES were not known** — I did not open
  `../unit-464t2b-sat-2026-10-29/drive-cripple-t8-unpinned.out` before committing the map, and
  the §3.4 captured-string check is keyed on values. That half is a real blind.

**This is itself a finding and it is pre-registered as `C1` below:** the checker's own output is an
answer key for exactly the arms a map has not yet covered, and neither `MAPSTAMP` nor any of the
13 gates records what the author had read. A map authored after a drive of its own arm is graded
as if it were blind.

**Authoring protocol, stated so the record is checkable:** the map is derived from the cell source
(`docs/research/round464-instruments/grade-the-stop-condition.mjs`, the `t8-unpinned` site at line
325-334 and `consecutiveAbove` at 337-341), the clean recording
(`../unit-464t2b-sat-2026-10-29/drive2.clean.out`), and the token-name lists named above. The arm
recording stays closed until the map is committed.

---

## Predictions

Eleven, each with the figure that decides it. `A*` grade the map, `B*` grade the control-provenance
hole, `C*` is the answer-key hole.

### The map (A)

* **`A1`** — the map as filed grades **`MAPVERDICT/0 ok`**: no red gate. Riskiest prediction here;
  my morning map's first version was `RED red=[GCTX,GTYPED]` on its own title line.
* **`A2`** — `reachedArmCaused=12` for `t8-unpinned`, and the map names every one, so
  `underReportedArmCaused` membership half is **0**. (Not blind — see prior knowledge.)
* **`A3`** — `fullyCaptured < 12`: at least one row's captured `name=value` string will not occur
  in the arm recording. I predict the misses come from the four rows whose value depends on a
  `consecutive` count I could not compute from source — **`T2c`, `P7`, `T10COUNT`, `T2b`** — and
  **not** from the eight whose value is arithmetic on `popMax=9467`.
* **`A4`** — `tokensTyped=0` on this map: no token is quoted *of* a member that member's own line
  never emits. This is the v1 defect §2(b) was written from and the one thing a second map should
  not repeat.
* **`A5`** — `GMUST` **ok**: `filing-rev` resolves (it is the PARENT, `708712f1…`, per v2.1 §3.1),
  `cell:` is readable, and `clean-recording:` realpath-equals the drive's `--clean=`.

### The control-provenance hole (B)

`drive2` is `drive1` with **only** `--control=` changed — the matched-delta method v2.1 §4 adopted.
The second control path is the **arm recording itself**, which is not a no-cripple drive.

* **`B1`** — the poisoned pair is **accepted**: `GCTRL` reports `ok`. Nothing in the checker reads
  provenance.
* **`B2`** — direction: the poisoned control **inflates** `reachedDrift` and **deflates**
  `reachedArmCaused`, so the map scores **better** than under the honest control. The dangerous
  direction, as with the word-anywhere over-report.
* **`B3`** — quantified: every one of the 15 members the arm reaches also "moves" between clean and
  arm by construction, so `reachedDrift=15`, `reachedArmCaused=0`, and
  `underReportedArmCaused = membership 0 + tokens 0` — **a perfect score for any map at all,
  including an empty one**.
* **`B4`** — **no gate reddens**: in particular `GDRIFTBITE` still reports `ok`, because the
  exclusion did narrow the set; narrowing it to nothing is the maximum bite. Delta drive1→drive2
  is `adds=[] removes=[]` on the red sets.

### The answer-key hole (C)

* **`C1`** — `MAPSTAMP` has no field naming what the author had read, and `grade-filed-maps.mjs`
  contains no reader for one: a grep for `provenance|authored-from|read-before` over the checker
  returns **0** hits. The leak is therefore unrecorded, not merely unguarded.

### Not predicted, recorded as open

* Whether `A3`'s misses land on the four rows I named or on others. If they land elsewhere my
  reading of the cell is wrong in a place I did not suspect, which is more informative than the
  prediction landing.
* `C5` from 10-29 (`verdict-keyed-reach` against my map) is **not** driven here. Still unclaimed,
  still no blocker.

---

*Filed before the map file exists. `git status --porcelain -- packages/ scripts/` empty at open.*
