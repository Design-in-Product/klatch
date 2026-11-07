# unit-465armd — RESULTS

**Seat:** Daedalus · **Date:** 2026-11-07 (START fire) · **Pre-registration:** `PRE-REGISTRATION.md`,
pushed as the only file in this directory before any instrument in it existed (verified with
`git ls-tree -r origin/main -- docs/research/unit-465armd-2026-11-07/`, one path returned).

**Headline:** **7 predictions — 6 HELD, 1 REFUTED** (6 + 1 = 7). Two of the six held
**vacuously**, and the vacuity is the finding. **2 cripples**, one of which was *dead on the
pre-cure fixture and live on the cured one* — which is precisely the defect. **3 unregistered
defects, all mine, all in my own instruments.** Gate unmoved: `GATE ok exit=0` on all four
stages, server **143 / 2221 / 1 skipped (2222)**, byte-identical to the 11/06 STOP figure.

Routed by Theseus's 11-06 STOP memo §4.1 and §4.2, both listed in his §7 as "yours if you want
them." Both taken. One of them turns out to be understated against my arm, and his proposed fix
does not work as written.

## 1. The verdict table, parsed at arm granularity

Measured from the probe's own per-arm stdout lines, not from its exit code — a claim about one
arm cannot be graded by a verdict that saturates over four.

| Drive | Probe | Cripple | Cripple self-report | A | B | C | D | exit |
|---|---|---|---|---|---|---|---|---|
| 0 | pre-cure, pristine tree | — | — | G | G | G | G | 0 |
| 1 | pre-cure | none (inertness) | no cripple requested | G | G | G | G | 0 |
| 2 | pre-cure | **X1** | `-wal 0B -> 0B (destroyed 0B)` | G | G | G | **G** | 0 |
| 3 | pre-cure | **X2** | (no sentinel) | G | G | G | **RED** | 1 |
| 4a | **partial** cure | none | no cripple requested | G | G | G | **RED** | 1 |
| 4b | **partial** cure | **X1** | `-wal 0B -> 0B (destroyed 0B)` | G | G | G | **RED** | 1 |
| 5 | full cure | none | no cripple requested | G | G | G | G | 0 |
| 6 | full cure | **X1** | `-wal 329632B -> 0B (destroyed 329632B)` | G | G | G | **RED** | 1 |
| 7 | full cure | **X2** | (no sentinel) | G | G | G | **RED** | 1 |
| 8 | full cure, cripples removed | — | — | G | G | G | G | 0 |

Drive 0 and drive 1 are identical on every arm line, which is what licenses reading drives 2–3 as
measurements of the cripples rather than of the cripple *code*.

## 2. The finding Theseus's §4.2 understated: the arm was not blind, it was ungradeable

His §4.2 says arm D's assertion was presence-keyed while its label claimed bytes, and that a cure
truncating a pre-existing `-wal` in place would score green. True. But reading my own fixture
rather than his sentence about it, arm D built its `-wal` with `fs.writeFileSync(p + '-wal', '')`
— **zero bytes**. So:

```
drive2: U465ARMD_X1 fired: -wal 0B -> 0B (destroyed 0B)
```

X1 **reached the child and fired** — the sentinel proves it — and destroyed nothing, because
there was nothing there to destroy. **No cripple at that cleanup site could have moved arm D at
all.** That is a stronger and worse statement than "the assertion is keyed wrong": the arm was
not a weak guard, it was an *ungradeable* one, and its fixture could not carry the property the
arm existed to protect.

This is why P1 and P2 are recorded as **HELD, vacuously**. Arm D did pass under X1, and the
probe did exit 0 — but neither fact is evidence about the assertion's key. Had I stopped at the
green, I would have published "arm D survives a truncation cripple" as though it meant something.
The sentinel line is the only thing in the recording that distinguishes a blind arm from a dead
cripple, and it was added mid-unit precisely because the first recording could not tell them
apart.

## 3. P3 REFUTED — and Theseus's fix, as written, cannot land

P3 predicted that byte-keying the assertion while leaving the fixture alone would leave arm D
**green** under X1. Measured: arm D goes **RED** (drives 4a and 4b). So P3 is refuted on its
letter.

It is refuted in the wrong direction for his fix, though. His §4.2 says: *"Fix is to key the arm
on bytes: capture both sizes before, compare after."* Implemented exactly that way, arm D
reddens **with no cripple at all**:

```
drive4a (no cripple):  [D] FAIL  a pre-existing sidecar is left alone
                             — -wal:0B -shm:0B -> -wal:0B -shm:32768B
drive4b (X1):          [D] FAIL  ... identical text, and X1 destroyed 0B
```

The two recordings are **identical in arm D's failure text**. The `-shm` legitimately moves
0 B → 32,768 B on a healthy product, and a single byte check spanning both sidecars reddens on
that. So the fix as written trades a false green for a false *red*, and still says nothing about
the `-wal`: the one quantity with data loss behind it is conjoined with one that moves for
innocent reasons, so the arm can never speak about it alone.

My §1 reading — byte-keying the assertion is necessary and not sufficient — is therefore
confirmed and sharpened, by a prediction of mine that was refuted. The substance survived; the
sentence I wrote about it did not, and the sentence was mine to get wrong.

## 4. The cure, and what grades it

Three edits, one cure — none of the three works without the others:

1. **Fixture carries committed frames.** `withNonZeroWal()`: autocheckpoint off, 40 rows
   committed, the real log's bytes stashed, close (which checkpoints and removes it), bytes
   written back. Header and salt match, so a read-only open *recovers* the log rather than
   rejecting it — the arm measures the cleanup guards, not SQLite's error handling.
   Re-implemented in the probe rather than imported from Theseus's unit: his lives in his unit
   directory, and a citation into another unit's scratch is not an address my probe can keep.
2. **Assertion keyed on bytes.**
3. **Split per sidecar** — two checks, not one. This is the part §4.2 did not reach, and §3 above
   is why it is needed.

Plus a fourth check that makes the arm **refuse rather than pass** if its fixture ever stops
carrying the property: `check('D', 'fixture carries committed frames', walBytes > 0, …)`. A green
here must mean the frames survived, never that there were none — the failure mode this whole
unit is about.

Graded by:

* **X1** (in-place truncation of a pre-existing `-wal`, both files left present, scoped to the
  pre-existing case so A/B/C cannot redden for tidiness): pre-cure **dead** (0 B destroyed, arm
  green); post-cure **live** — `destroyed 329632B`, arm D red naming `-wal:329632B -> -wal:0B`.
  The same cripple going from dead to live across the cure is the cleanest evidence the cure is
  the thing that moved.
* **Drive 5 and drive 8**: all four arms green on a healthy product, so the stronger assertion is
  not bought by reddening on correct behaviour. **P4 and P5 were the landing rule, set before the
  result was known; both held, so the cure lands.**

Arm D grew from 2 checks to 4; the probe from **9** regression checks to **11**.

## 5. The two false sentences, re-attributed rather than deleted

Censused by **mechanism** rather than by the one line Theseus cited — `grep -rn "three green"
scripts/` and `grep -rn "arm C holds\|arm D holds" scripts/` — which found the same false claim
at **two** sites, not one:

* `scripts/probe-backfill-sidecar-neutrality.mts:124` — the line he cited.
* `scripts/backfill-entity-bindings.mts:677`–`:678` — the **product source**, restating it as
  *"arm C holds that side down, and arm D holds the pre-existing case, so a blanket `rm` cannot
  score green here."* The conclusion is true; the attribution is not. He could not have seen this
  one from the line he was reading.

(That count is a **triage observation, not a registered prediction** — the greps were run before
`PRE-REGISTRATION.md` was written, and it says so.)

Reproduced under my own key in my own tree rather than cited from his recording: **drive 3**,
pre-cure, X2 = blanket `rm -f` on both paths. A, B **and C** green; D alone red. Three green with
arm C present, exactly his §4.1 figure. Mechanism, plain once measured: this cleanup runs
*before* `getDb()` reopens the target for writing, so whatever a blanket `rm` removes here, the
write open puts straight back.

Both sites now say what arm C does hold down — that the cleanup is not **relocated** to after the
write open — and credit the blanket-`rm` catch to arm D alone. **Drive 7** confirms the cure did
not relax that: under X2 the cured arm D still reddens, on `-wal:329632B -> -wal:absent`.

## 6. Three unregistered defects, all mine, all in my own instruments

1. **The driver dropped the cripple's report on exactly the drive where it mattered.** v1 used
   `execFileSync`, which returns stdout and exposes stderr *only through the thrown error* — so
   on a run exiting 0 the child's stderr is discarded. Drive 2 exits 0. The resulting recording
   was indistinguishable from one in which the cripple never ran. Cured with `spawnSync` and both
   streams kept unconditionally.
2. **And that was only the outer layer.** The probe itself captures the tool's stdout and stderr
   into a local for one regex test and never echoes either, so **no stream-based cripple report
   is observable through this probe at all** — the `spawnSync` fix alone would not have shown it.
   Cured by moving X1's report to a **file sentinel** (`U465ARMD_LOG`), scoped to the driver's
   pid so a stale report cannot be read as this drive's.
3. **The driver's own reason line went false.** It printed *"the cripple did not fire"* whenever
   the sentinel was empty — false on **every X2 drive**, since X2 carries no sentinel and drive 3
   proves it fired by reddening arm D. A recording that mis-reports its own instrument is the
   exact defect this unit was opened about. Cured by keying the line on which cripple was
   requested; drives 1, 2, 3, 5, 6, 7 were then **re-recorded** with the corrected driver so the
   published set comes from one version. Drives 4a/4b were not re-recorded — they are the
   discarded partial cure and cannot be rebuilt without reverting it — and their sentinel lines
   are the conditional v2 text, accurate for 4b (the fired line is present) and merely noisy for
   4a. Said rather than quietly left.

## 7. Restoration, verified not assumed

Pre-action baseline before the first edit: `HEAD = d3d22348`, `git status --short -- packages/
scripts/` **empty**. After:

* `grep -rl 'U465ARMD' scripts/ packages/` → **no files**.
* `git diff d3d22348 --stat -- packages/ scripts/` → exactly the two intended files
  (`backfill-entity-bindings.mts` +16, `probe-backfill-sidecar-neutrality.mts` +94/−11).
* **Drive 8** on the restored tree: all four arms green, 11 checks, exit 0.
* Gate on the final tree: `GATE ok exit=0` ×4 — census, typecheck, server
  **143 / 2221 / 1 skipped (2222)**, client **26/39 files, 333/346**. Server figures byte-identical
  to the 11/06 STOP baseline: this unit added no vitest test, and the probe is not in that
  suite. `sweep-probes --census` **154 / 43 / 111, CENSUS OK** — unchanged, no probe file added.

All **twelve** `.err` files are **0 bytes**, counted with `wc -c` over all twelve at once rather
than rounded to "clean" — the driver keeps both of the probe's streams itself, so nothing leaks
past it. Twelve, not the nine implied by drives 0–8: `drive2b` and `drive2c` are the two
superseded X1 recordings kept deliberately as the evidence for defects 1 and 2 in §6 —
`drive2b` is the one where the stderr-based cripple report vanished entirely, and `drive2c` is
the one where fixing only the outer `execFileSync` layer still showed nothing.

## 8. Open, and whose

* **Theseus's E4/E5** — the `-shm` orphan when a `-wal` pre-exists, measured and named in his
  §3, not cured, pending a decision about `:652`'s ordering contract. His to take; I have not
  touched it, and this unit's arm D does not reach it (its fixture has both sidecars present).
* **The size guard at the cleanup site is still ungraded**, as his §5 says in the source. Nothing
  in this unit grades it either: X1 bypasses the guards rather than testing them. Unchanged, and
  still should not be cited as measured.
* **Mine, now closed:** both items from his §7.
