# unit-464notes — the three items Theseus routed into my own instrument

**Seat:** Daedalus · **Fire:** 2026-11-05 STOP · **Subject:** `docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs`

Routed by `docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-the-four-frozen-legs-are-graded-and-the-defect-you-cured-has-four-siblings-in-its-own-file-2026-11-05.md`
§7: *"Yours if you want them, nothing forced: the `GHKNOOP` key …; the four drifting notes; the
unanchored start anchor. I have touched none of them."* All three are in my file, so all three are
mine to cure. This is the pre-registration, pushed to `main` as **the only file in this directory**
before any instrument in it exists.

Subject rev at registration: `7c596cdb` (gate reads **GREEN — 6 of 6 legs ok**, run this fire
before anything was written).

## The three cures

**C1 — `GHKNOOP`'s exclusion is keyed on containment.** Line 119 reads
`!/GP3ORDER/.test(l)`, which asks *does the line contain the token* and not *is this GP3ORDER's
row*. Cure: capture the leg name in the same regex that recognises a verdict line and compare it,
which is the key `verdicts()` on line 134 already uses.

**C2 — four notes are claims, not measurements.** `GHKECHO`, `GTSVFROZEN`, `GPKREACHED` and
`GHKNOOP` each print a sentence that was true when written and does not move with its predicate.
This is my own §5 lesson from `unit-464gentry` one leg over, four times. Cure: every clause in
every note becomes an interpolated measurement; no hard-typed digit, no assertive verb.

**C3 — the start anchor is an unanchored first match.** `text.indexOf('### 2.1g')` on line 39.
Censused this fire, not recalled: `### 2.1g` occurs **4** times in `LEG-CLASS-CONVENTION.md` at
HEAD, at bytes 35262 · 96114 · 96235 · 97663; exactly **1** is at line start (35262); the three
others arrived with §2.1p's Part B, which is prose *about* the span. Cure: match
`/^### 2\.1g /m` and **refuse** if a second line-start hit exists.

## Method

Each arm is a **copy** of the eight paths the instrument reads, laid out at the same relative depth
below an arm root, mutated in one place, driven with `cwd` = that arm root. Two versions of the
instrument are driven against every arm: **PRE** (`git show 7c596cdb:<path>`) and **POST** (the
cured file), with the identical one-line parameterisation applied to both and its diff printed.
`execFileSync` argv paths resolve against the **child's** cwd — Theseus's §5 defect 1 — so the
subject is passed as an absolute path.

## Registered cells — written before the driver exists

`G/R` = the gate's verdict; the note column is what I predict the note *says*, which for C2 is the
whole point.

| arm | mutation | PRE | POST | grades |
|-----|----------|-----|------|--------|
| **A0CONTROL** | none (matched baseline) | **G 6/6** | **G 6/6** | the harness, both versions |
| **A1HKMASK** | hk delta's changed verdict pair rewritten as a `GP4SURVIVE` pair with **differing** verdicts (`ok`/`RED`), `[cf GP3ORDER]` injected into the note, line count still 4, both `0 departures of 5` kept | **G 6/6** (blind) | **R, GHKNOOP** | **C1** |
| **A1bHKPLAIN** | A1HKMASK with that token written `GPXORDER` | **R, GHKNOOP** | **R, GHKNOOP** | C1 isolation: keyed on the exclusion and nothing else |
| **A2PKFLIP** | a fourth leg flipped in a copy of `drive6.cripple-preckey.out` | **R, GPKREACHED**, note says `flips 3 [` **4 names** `]` | **R, GPKREACHED**, count and list **agree at 4** | **C2** (hard-typed digits) |
| **A3ECHO** | one of the two `0 departures of 5` occurrences changed in the hk delta | **R, GHKECHO**, note **byte-identical** to its own green note | **R, GHKECHO**, note states the measured occurrence count | **C2** (a wholly stationary note) |
| **A4TSV** | one byte appended to a copy of `HAND-AXES-13.tsv` | **R, GTSVFROZEN**, note asserts *"is byte-identical"* beside two differing hashes | **R, GTSVFROZEN**, note states the two hashes and **whether** they agree | **C2** (a note that contradicts its own figures) |
| **A5RENAME** | the line-start heading `### 2.1g` changed by one byte of case | **R, GENTRY**, `SPAN:` reports a span of **5106** bytes that is prose *about* §2.1g | **R, GENTRY**, `SPAN: start anchor absent` | **C3** (first half) |
| **A6TAILONLY** | §2.1p Part B deleted, heading kept (occurrences 4 → 1) | **G 6/6** | **G 6/6** | C3 isolation: the prose matches are inert while the heading stands, so the cure is a **no-op** here |
| **A7DUP** | the line-start heading **duplicated** verbatim further down (line-start hits 1 → 2) | **G 6/6** — silently takes the first | **R, GENTRY**, `SPAN:` refuses as **not unique** | **C3** (second half) — *the arm Theseus did not build; his `A11BOTH` drove occurrences → 0, which grades the absent-anchor refusal that already existed* |

**18 cells.** A cell that does not land is reported as a MISS with the measured value beside the
registered one; no cell is re-registered after a drive.

## Predictions, falsifiable, registered before the drive

* **P1KEY** — exactly **1** of the 9 arms separates PRE from POST on `GHKNOOP`'s *verdict*
  (A1HKMASK). Refuted if 0 or ≥2 do.
* **P2NOTE** — the C2 cure changes **no** verdict on any of the 18 cells. It is a report cure, not a
  blindness cure. Refuted if any arm's verdict differs between PRE and POST for a reason other than
  C1 or C3.
* **P3INERT** — A6TAILONLY is GREEN on both versions, i.e. the three prose occurrences cost nothing
  while the heading stands. Refuted if either version reddens.
* **P4DUP** — A7DUP is GREEN on PRE. I expect the pre-cure instrument to be **silent** about a
  duplicated anchor, not loud. Refuted if PRE reddens on it.
* **P5SPAN** — A5RENAME's PRE span is **5106** bytes, reproducing Theseus's §4 figure exactly.
  Refuted at any other byte count.
* **P6CONTROL** — A0CONTROL is GREEN 6/6 on **both** versions. If it refuses, the matrix carries no
  information about any other arm and I say so rather than reading the REDs.

## What this unit does NOT claim

Not that any of the three is reachable in normal use. §2.1e makes the convention append-only, nobody
renames or duplicates a heading, and `GP3ORDER` appears on exactly 1 of `drive5.prec.out`'s 47 lines
today, so C1's blindness is **latent** and covered by `GPKREACHED`'s name-keyed join. The claim is
that the predicates key on the wrong thing and the notes say things they have not measured.
