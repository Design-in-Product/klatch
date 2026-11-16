# PRE-REGISTRATION — unit-467rawjson arm A: naming the 12, and whether `12 + 6 = 18`

**Theseus, 2026-11-16 (START fire).** Pushed to `origin/main` **before `arm-rawjson-a.mjs` exists.**

Step 2 of the item this seat claimed on 11/15 — xian's 2026-09-28 raw-JSON ruling
(`docs/operations/attention-rollup.md:209-211`), unbuilt **49 days** as of today. Step 1 is
`docs/research/raw-json-writer-step1-census-2026-11-15.md` (`155c5985`), which ended on a named
next step and a load-bearing declared limit:

> `--list` counts the 12 without naming them … **`12 + 6 = 18` is not asserted.**

This arm discharges that, and the instruction step 1 wrote for it: **read the classifier's own
selection, not another hand key.** `scripts/promote-probes.mts` is not modified by this unit.

**Pin:** `1f675ebf76eb283cec6ee97294ba782b6b147678`. The 12 is a reading of *this tree*, not of step
1's tree.

## §1 Method

`npx tsx scripts/promote-probes.mts --list` twice, once with `--only probe` and once without. The
`--only` form is the naming mechanism: `promote-probes.mts:761-766` prints a per-site line for every
member of every `not driven (k)` bucket **only when `--only` is given**, because the unfiltered `db`
bucket alone is 81 files. Nothing is driven on either run (`--list` exits at line 780).

## §2 CONTROL (no predictive credit — it is structurally true and verified anyway)

**C1.** `--only probe` names every bucket member rather than a filtered subset, because
`population()` (line 125) is `readdirSync(SCRIPTS).filter((f) => /^probe-/.test(f))` — every
candidate filename *begins* with `probe-`, so `f.includes('probe')` (line 710) excludes nothing.
Verified by the two runs' bucket counts being **identical**, header included. Stated as a control
because I read line 125 before registering: it carries no credit. Its value is that a bucket count
moving between the two runs would mean the per-site listing is a partial naming, and I would then
have to say so rather than publish 12 names as *the* 12.

**C2 (REPRO, no predictive credit).** The unfiltered run reproduces step 1's published figures
exactly: `155 probe files · 45 SWEPT · 110 DEFERRED`, and `db 81 / net 55 / homedir 29 / model 12 /
suite 12`. These are **already published**, so predicting them would be grading against my own
answer key. The leg exists so that the names below are a delta on a known instrument rather than a
first measurement of an unknown one. A miss here is a **tree-moved** finding, reported as such.

## §3 Predictions (graded, registered before the arm exists)

**P1 — `12 + 6 = 18` is FALSE by overlap, and the mechanism is an ordering in the instrument.**
`promote-probes.mts:722` buckets a file's hazards **before** line 727-731's admission check can
`continue` past it. So a probe that *both* owns a `model` token in its own source *and* is
INADMISSIBLE by spawn closure lands in the `model: 12` count **and** in the `INADMISSIBLE` list.
Disjointness is therefore not structural, and step 1's sentence — the six "inherit `[model]`
through a literal drive … rather than owning the call" — is a claim about their source that nothing
in step 1 checked. **I predict at least one of step 1's six `-live` names appears in the `model`
per-site listing.** If none does, P1 is REFUTED and `18` becomes assertable.

The six, from step 1 §2, quoted so the comparison is checkable: `probe-path-c-chat-binding-live.mts`,
`probe-round162-preamble-drop-and-roster-live.mts`, `probe-round164-layer5-terminality-live.mts`,
`probe-round166-terminal-floor-live.mts`, `probe-round167-floor-report-live.mts`,
`probe-round213-reassign-live-http.mts`.

**P2 — `probe-round230-a-killed-probe-must-not-leave-its-server.mts` is one of the 12.** Step 1 says
the six inherit `[model]` *through driving it*, which only makes sense if it owns the hazard. It is
DEFERRED-and-hazardous, so bucketing (line 722) reaches it regardless of its own admission verdict.

**P3 — the filename is not a sound key for the live-call population: at least one of the 12 does
NOT end `-live.mts`.** This is the substantive one for the writer. If it lands, a writer wired by
filename suffix would miss members, and the seam has to come from the classifier.

**P4 — every one of the 12 gets a NAMED site**, i.e. none prints
`(no single line matched; the hit spans a line break)`. `hazardSite` (line 279) returns the first
line matching `DETECTORS[k]`; a null means the hit spans a newline and the reader cannot check it
from the report. If P4 is refuted, those members are named but not *checkable*, and I will say which.

**P5 — of the 12 named sites, at least one is a bare `Anthropic` identifier rather than
`ANTHROPIC_API_KEY` or `messages.create`.** The detector is a three-way alternation
(`model: /\b(Anthropic|ANTHROPIC_API_KEY|messages\s*\.\s*create)\b/`) and step 1 established that
*which branch fired* is the difference between owning a model call and merely naming one — the
`probe-round223` sign inversion was exactly a `delete env.ANTHROPIC_API_KEY` voting for making a
call. So the per-branch split of the 12 is reported by member, not just counted.

## §4 RED conditions — these are instrument/arm defects, NOT refuted predictions

- **R1.** The number of per-site lines printed under a bucket ≠ the count on that bucket's own
  `not driven (k): N` line, on the same run. That is a reader defect in my capture, not a finding.
- **R2.** Either `--list` run exits nonzero for any reason other than the documented
  `process.exit(drivable.length ? 0 : 2)`.
- **R3.** Any name in the `model` listing is absent from the instrument's own `DEFERRED` list.
- **R4.** `git status --porcelain scripts packages docs/research/lib` is non-empty on the drive —
  this unit must touch nothing outside `docs/research/unit-467rawjson-2026-11-16/`. The instrument
  is read, never edited.

## §5 Declared limits

1. **This names the 12 at pin `1f675ebf`.** It is not a standing figure. Any later quote needs a
   re-run, and the `model` count is a function of the detector *and* of what is SWEPT today.
2. **Naming the 12 does not establish that each makes a live model call.** The detector is a source
   reading, deliberately over-broad by its own prose (lines 127-131: "a hit is NOT a claim that the
   probe is hazardous"). Step 1's `probe-round223` finding is the proof: a probe can match while
   existing to run *without* a call. **This arm reports the classifier's selection and the firing
   branch per member; it does not certify any member as a live caller.** That certification needs
   per-file reading, which is step 2b, not this arm.
3. **No writer is built here, and the end-to-end exercise of one still needs a live round**, which
   a non-interactive fire cannot run. That limit is on *verifying* a writer against a real round,
   not on building or unit-testing it, and it is not a blocker for steps 2b or 3.

— Theseus
