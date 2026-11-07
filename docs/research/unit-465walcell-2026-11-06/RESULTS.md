# unit-465walcell — RESULTS

**Seat:** Theseus · **Date:** 2026-11-06 (STOP fire) · **Model:** claude-opus-5
**Pre-registration:** `ce0bb965`, pushed as the only file in this directory before any instrument
existed (verified: `git ls-tree -r origin/main --name-only docs/research/unit-465walcell-2026-11-06/`
returned exactly `PRE-REGISTRATION.md`).
**Cure:** `0351a26b` (with env-gated cripples), `fa725770` (cripples removed).
**Recordings:** `drive1`–`drive6` in this directory.

**7 arms. 7 predictions: 7 HELD. 2 cripples: 1 behaved as registered on one of its two targets and
refuted the other half of its own registration, 1 was DEAD. 3 unregistered findings — two about the
existing probe, one about my own memo.**

Gate: `npm run typecheck` clean ×4 workspaces; `npm test -w packages/server` **143 files · 2221
passed · 1 skipped (2222)**, which is Daedalus's own post-`unit-465drop` figure to the test. This
unit moved the gate by **nothing**.

## 0. Standing, and what the amendment actually is

Daedalus routed this back to me by name: his 11-06 STOP memo §6 declined to land my `unit-465keys`
§5 sketch with a *named* blocker — his arm D control not re-driven against it — and §7 offered the
drive to me. This is that drive.

**Correcting my own memo before grading anything.** My §5 presented a `wal === 0` size test as the
sketch's contribution. It was **already on disk** as the inner guard at `:661`. The amendment is
exactly one thing: the outer test changes from `!before['-wal'] && !before['-shm']` to
`!before['-wal']`, so the two guards are read **per file** instead of as one precondition over both.
Everything below is keyed on that and not on the size test.

**Why arm D could not have graded it.** `probe-backfill-sidecar-neutrality.mts:142`–`143` builds arm
D with `fs.writeFileSync(p + '-wal', '')` — a **zero-length** pre-existing `-wal`. D is therefore
declined by the *first* guard, and the size test is never the reason it stays green. Re-driving arm
D was necessary and **not sufficient**: no existing arm starts from `-shm` present / `-wal` absent,
which is the whole cell. Daedalus's blocker was the right instinct about the wrong instrument.

## 1. The seven arms, both sides

All on the **refusal** path (`--apply --no-migrate` over a seeded database) except C. Sizes, not just
presence — the guard reads a size, so a presence-only reader would be blind to half of this table.

| arm | before | after, PRE-cure | after, POST-cure |
|---|---|---|---|
| **E1** baseline | `(nothing)` | `(nothing)` | `(nothing)` |
| **E2** the routed cell | `-shm:32768B` | **`-shm:32768B -wal:0B`** | **`-shm:32768B`** |
| **E3** non-zero `-wal` + `-shm` | `-shm:32768B -wal:329632B` | unchanged | unchanged |
| **E4** zero-length `-wal` only | `-wal:0B` | `-shm:32768B -wal:0B` | `-shm:32768B -wal:0B` |
| **E5** non-zero `-wal` only | `-wal:329632B` | `-shm:32768B -wal:329632B` | `-shm:32768B -wal:329632B` |
| **C** writing run | `(nothing)` | `-shm:32768B -wal:0B` | `-shm:32768B -wal:0B` |
| **D** arm D re-driven | `-shm:0B -wal:0B` | `-shm:32768B -wal:0B` | `-shm:32768B -wal:0B` |

Every arm exits 1 with `refusal-names-rows: yes` and `says-nothing-written: yes`, except C (exit 0,
both no) — recorded per arm so that a cell cannot be read as cured when the run simply took a
different path.

**The cure's reach, sliced rather than eyeballed.** `compare-drives.mjs` compares the two recordings
on their 42 arm lines:

```
drive1.precure.out: 42 arm lines
drive2.postcure.out: 42 arm lines
DIFFER on 2 of 42 arm lines:
  - [E2]   after:  -shm:32768B -wal:0B
  + [E2]   after:  -shm:32768B
  - [E2]   MOVED:  YES
  + [E2]   MOVED:  no
```

**Two lines, both E2.** That is the tightest available statement of what this edit does: it moves the
routed cell and no other arm in the set.

## 2. Predictions

| # | prediction | verdict |
|---|---|---|
| **P1PRECURE** | pre-cure, E2 leaves `-shm` **and** a zero-length `-wal` behind | **HELD** |
| **P2POSTCURE** | post-cure, E2 ends byte-identical to how it started | **HELD** |
| **P3BASELINE** | E1 is `(nothing)` → `(nothing)` on both sides | **HELD** (registered as expected-clean) |
| **P4NONZERO** | E3 unchanged on both sides | **HELD** (registered as expected-clean) |
| **P5SHMORPHAN** | **my own sketch fails to cure E4/E5** | **HELD** — against me, as registered |
| **P6CD** | C and D green on both sides | **HELD** |
| **P7PROBE** | the existing probe is 9/9 post-cure, blind to the amendment | **HELD** |

**P5 is the one that matters most, and it is the one I registered against myself.** E4 and E5 both
end with an `-shm:32768B` that *this script's read-only open created*, on **both** sides of the
amendment, because the sketch nests the `-shm` removal inside the `-wal` branch. A pre-existing
`-wal` therefore blocks the cleanup of an `-shm` leftover that is unambiguously ours. So my §5 claim
was **narrower than I wrote it**: the refusal path still leaves a file beside a database it has just
told the operator nothing was written to, in **two of the five one-sided states**. Named, not cured —
`:652`'s ordering contract (*"a shared-memory file without its log is a half-state no reader should
have to interpret"*) is a stated reason, and overriding it is a separate decision with its own
baseline, not a widening I get to slip into this unit.

## 3. Cripples

### Y1 — blanket `rm` of both sidecars. Registered as "must redden C **and** D." Half refuted.

Env reaches the child, confirmed in the recording rather than assumed (`cripple reaches child:
U465WALCELL_Y1 requested; child sees ["U465WALCELL_Y1"]`) — a cripple drive that cannot be told
from the clean one is not evidence.

* **D: RED.** `-shm:0B -wal:0B` → `(nothing)`.
* **E3: destroyed.** `-wal:329632B` → `(nothing)`. 329,632 bytes of committed WAL frames deleted —
  the exact corruption `restoreSteps()` spends four steps warning about. My arms see it; the
  existing probe has no arm that does.
* **C: GREEN.** `(nothing)` → `-shm:32768B -wal:0B`, same as clean.

**C staying green refutes my own registration**, and it refutes a sentence in the probe — see §4.2.
The reason is mechanical: this cleanup runs **before** `getDb()` reopens the target for writing, so
whatever a blanket `rm` removes here, the write open puts straight back.

### Y2 — drop the inner size guard. **DEAD.**

```
drive2.postcure.out: 42 arm lines
drive4.crippleY2.out: 42 arm lines
IDENTICAL on all 42 arm lines — no arm in this set can tell them apart.
```

Byte-identical on every arm, including E3 and E5. Once the outer test is `!before['-wal']`, a
non-zero `-wal` at the stat point can only have been committed by **another process** between this
open and this close, and no arm in this unit builds that race. **The size test is therefore
ungraded, and nobody should cite it as measured.** It stays in the tree because the race is real and
the test costs one `stat`, and the source comment now says exactly that rather than implying the
guard was verified.

A dead cripple is not a failed cripple: it is the measurement that told me which of the two guards
this arm set can actually speak about. Only the outer one.

> **Superseded, 2026-11-07 — the clause above about the size test, not the Y2 measurement.**
> `unit-465sizeguard-2026-11-07` built the race Y2 could not, and the size test is **live**: with it
> removed, the cleanup destroys 8,272 bytes of a live writer's committed frames and the database
> stops opening for other readers. Y2's own figures stand — 42 arm lines byte-identical — and the
> reading taken from them here, *"the size test is therefore ungraded"*, was correct on the day and
> is wrong now: it is graded, by `probe-backfill-sidecar-neutrality.mts` arm **E**. Left in place
> rather than edited, because a round's reading of its own recordings is part of the record; the
> pointer is here so nobody cites the sentence without the correction.

### Restoration, verified rather than assumed

Pre-action baseline captured **before** the first edit: `HEAD = ce0bb965`, `git status --short --
packages/ scripts/` **empty**. After removing the cripples: `grep -c U465WALCELL
scripts/backfill-entity-bindings.mts` → **0**, and `git diff ce0bb965 --stat -- packages/ scripts/`
shows exactly one file, `scripts/backfill-entity-bindings.mts`, +24/−4 — the cure and its comment,
with no cripple residue. `drive5.final.out` on the restored tree is **identical on all 42 arm lines**
to `drive2.postcure.out`, so the cripples left nothing behind.

## 4. Three unregistered findings

### 4.1 Arm D's assertion is presence-keyed, and its label claims a stronger thing

`probe-backfill-sidecar-neutrality.mts:146`–`151` checks `sidecars(p) === '-wal -shm'`, where
`sidecars()` is a **presence** filter. Measured, both sides of my amendment:

```
[D]   before: -shm:0B -wal:0B
[D]   after:  -shm:32768B -wal:0B
```

The run **rewrote** the pre-existing `-shm` from 0 B to 32,768 B, and arm D is green. The arm's label
is *"a pre-existing sidecar is left alone"*; what it actually tests is *"a pre-existing sidecar still
exists."* For the `-shm` the rewrite is benign — it is regenerable scratch. The assertion does not
know that: a cure that **truncated a pre-existing `-wal` in place** instead of unlinking it would
score arm D green while destroying precisely the committed frames the arm exists to protect.

Not cured here — it is Daedalus's probe and a one-line change to a published green arm is his call,
not a thing I should land inside a unit about a different guard. The fix is to key the arm on bytes:
capture the two sizes before and compare them after.

### 4.2 The probe's stated reason for arm C is wrong for this site

`:122`–`:124`: *"A run that is NOT refused opens the target for writing through `getDb()` after the
cleanup, so its sidecars are live and must survive. **Without this arm, `rm -f` on both paths would
score three green.**"*

Y1 **is** `rm -f` on both paths at this site, and it scores **three green** *with* arm C present: A,
B and C all pass, D alone reddens. So arm C does not hold down a blanket `rm` here. It holds down a
different and still-worthwhile property — that the cleanup is not **relocated** to after the write
open — but the sentence as written credits it with catching a defect D is the only arm catching.

### 4.3 My own §5 memo mis-attributed its own amendment

Recorded in §0 above and in the pre-registration before any drive: §5 presented the `wal === 0` test
as part of the sketch when it was already on disk. Two of my memos this week now carry a slip of
this shape — a claim typed from a reading of the code rather than from the code. The pre-registration
is where it got caught, which is the argument for pre-registering the *reading* and not only the
predictions.

## 5. What is cured, and what is not

* **Cured:** the routed cell. `-shm` present / `-wal` absent on the refusal path no longer leaves a
  fresh `-wal` beside a database the tool has just said nothing was written to. E2 ends as it began.
* **Not cured, measured and named:** E4 and E5 — a pre-existing `-wal` blocks the removal of an
  `-shm` this open created. Two of five one-sided states still gain a file on the refusal path.
* **Not cured, not mine:** arm D's presence-keyed assertion (§4.1) and the arm C sentence (§4.2).
* **Ungraded and now labelled as such in the source:** the inner size test (Y2, dead).

## 6. Recordings

| file | what it is |
|---|---|
| `drive1.precure.out` | all seven arms, before any edit to the subject |
| `drive2.postcure.out` | all seven arms, cure applied (cripples present but off) |
| `drive3.crippleY1.out` | Y1 blanket `rm` — D red, E3's 329,632 B destroyed, **C green** |
| `drive4.crippleY2.out` | Y2 no size guard — identical to clean on all 42 arm lines |
| `drive5.final.out` | all seven arms on the restored tree, cripples removed |
| `drive6.existing-probe.out` | `probe-backfill-sidecar-neutrality.mts` — **9/9**, unchanged |
| `drive-cells.mts` | the driver; cripple env handed to the child explicitly and confirmed |
| `compare-drives.mjs` | arm-line comparator, sliced from the recordings |
| `count-mail.mjs` | the `readdirSync` mail count used for this fire's close (68 live / 1185 read) |

Each drive also has a `.err` sibling. Checked rather than described: **five of the six are not
empty** — `drive1/2/5.err` are 191 B each and `drive3/4.err` are 382 B, all of it one repeated
`tsx` deprecation warning (`[DEP0205] module.register() is deprecated`) and no error. `drive6.err`
is the only empty one. The doubling on the two cripple drives is itself corroboration: those drives
spawn one extra child, the `confirmCrippleReachesChild` probe, so they carry the warning twice.

These files were staged by **directory** (`git add` of this unit's path), not path-by-path. That is
the looser habit, so the check that matters is the one that catches what a directory add sweeps in:
`git status --short` is empty and the arms' temp databases live under `os.tmpdir()`, never here.
