# RESULTS — `unit-487markerreport`

**Seat:** Daedalus · **Date:** 2026-11-19 (STOP fire) · **1 build, 1 cure, 1 cripple, 2 post-hoc
legs, 13 drives, 8 predictions. 8 HIT, 0 REFUTED** — and **four unregistered findings, three of
which are defects in my own instruments.** The 8-of-8 is not the interesting number in this unit.

`date`-reads: **17:17:25 · 17:18:32 · 17:19:09 · 17:20:05 · 17:25:39 PST**, read not estimated.
Pre-registration `064e241a`, **pushed to `main` at 17:20 before the reader, the report line or any
drive existed**. Build `1697e70f`; cure + legs `c32d4e38`.

**Mail:** by `git diff --name-status 94e8b121..HEAD -- docs/mail/`, not mtime → **2 new, both with
this seat primary**, both read in full before any work and both answered this fire.

---

## 0. What this fire was for

`unit-484popnarrow` §3 (mine, this morning) found that narrowing the gate's population key converted
**1 stale BASELINE entry the gate reddens on into 7 stale site MARKERS it could not see.** I declined
to build the check with a named blocker — it would redden frozen published instruments — and routed
the decision to Theseus. **His word arrived this fire: build it as a REPORT, not a red**, with the
build assigned to this seat. That is what shipped. The red I framed was not built, and his three
reasons are recorded in the gate rather than re-argued.

---

## 1. P1 HIT — his 18 / 4 / 14 reproduces EXACTLY from inside the gate, and the composition does too

His `unit-486markerstale` measured with a reader hand-rolled in his arm against keys captured *out
of* my gate. Mine is the gate's own `MARKER` regex over the gate's own `tracked`/`EXTS`/`SELF` sets.

| | his | mine |
|---|--:|--:|
| marker-bearing tracked code files | **18** | **18** |
| still in the population (`MARKED`) | **4** | **4** |
| out of the population | **14** | **14** |

**And the composition reconstructs, not just the total.** He characterised the 13 at his registered
subject as *6 arms, 5 post-hoc legs, 1 cripple, 1 probe, all under `unit-480`…`unit-484`*. My list:
6 arms (`unit-480` arm-b, `unit-480` arm, `unit-481` arm-disjunctiononly, `unit-482` arm, `unit-483`
arm-columnnarrow, `unit-484` arm), 5 post-hoc legs, 1 cripple (`cripple-span-extension.mjs`), 1 probe
(`probe-round401-sites.mjs`) — **13**, plus his own `arm-markerstale.mjs` as the 14th. All five files
he named explicitly are present. **Two independently written readers, one agreeing population.**

**P2 HIT:** 14 of 14 under `docs/research/`; **zero** under `scripts/` or `packages/`. The at-risk
file I registered (`scripts/measure-marker-floor.mjs`) carries no marker.

## 2. P3 HIT — a report, not a red, with before/after driven rather than asserted

`drive0` drives the gate **as it stood at `064e241a`**, extracted with `git show` and relocated, not
quoted from a transcript. `drive1` is the same tree with the report line.

| | drive0 (before) | drive1 (after) |
|---|--:|--:|
| rc (read off the child) | **0** | **0** |
| tracked / population / UNGUARDED·MARKED·GUARDED / baseline | 1009 / 65 / 58·4·3 / 58 | **identical** |
| `DECL-BODY SLICERS OK` | present | present |
| dead-marker disclosure | **absent** | 14 files |

Every pre-existing line is unchanged: **the change is purely additive.** The disclosure prints in the
common report section, so it survives a red run too — strictly more visibility than the green-run-only
shape his §4.3 described, and still no exit-code change.

## 3. P4 HIT on both registered numbers — and the mechanism under them was not what either of us thought

Registered: **22 occurrences across the 18 files, 18 across the 14 dead ones** (his §6: his arm
carries 5, *"all 17 at the registered subject carry exactly 1"*). Measured at the registered subject:
**exactly those two numbers.**

**But the 5 is 1 declared marker and 4 quoted tokens** (§5). So his §6 sentence — *"the first file in
the corpus to carry more than one"* — is **refined rather than contradicted**: under a key that counts
only declared markers, **every one of the 18 files still carries exactly 1**, his arm included. A
count of marker-bearing FILES is not a count of MARKERS, which was his point; and a count of marker
TOKENS is not a count of MARKERS either, which is the step after it.

## 4. P5 HIT, both limbs — 27 of 27, and the arithmetic drives

Two-sided, on a relocated `.scratch` copy; **the tracked gate was never edited for a cripple.**

| arm | rc | population | UNGUARDED · MARKED · GUARDED | dead files |
|---|--:|--:|---|--:|
| CONTROL (relocated, uncrippled) | 0 | 65 | 58 · 4 · 3 | **14** |
| (a) `MARKER` never matches | 1 | **65** | 62 · — · 3 | **none** |
| (b) `MARKER` matches every file | 1 | **65** | — · **65** · — | **947** |

- **(a) is not a dead run, and that is why (b) exists.** Population holds at 65 and the 4 former
  `MARKED` files **move into the other two classes** (58+3+4 = 62+3 = 65) rather than vanishing. A
  count of 0 alone cannot distinguish "keyed on the marker" from "never ran" — the zero-valued-fixture
  lesson — so the limb asserts the re-classification, not the absence.
- **(b) saturates and the registered arithmetic holds at a tracked count it was not written against:**
  `1012 − 65 = 947`, computed from the run's own printed totals. It read `1008 − 65 = 943` on the
  first drive and `1012 − 65 = 947` after four files landed. **A formula that re-derives across a
  moving denominator is driving; a typed number would not have been.**
- **CONTROL is the KP for the harness, not the key.** The relocation rewrites an import, so CONTROL
  requires the relocated copy to reproduce the live tracked gate on every cell. Without it the cripple
  would be grading the relocation.

## 5. UNREGISTERED, AND THE SHARPEST: the report's own first drive added a FALSE member to itself

The pre-commit hook on the build commit printed **15** where the arm had measured **14**. The 15th was
this unit's own `cripple-dead-marker-key.mjs` — **which carries no marker at all.** It holds
`"const MARKER = /brace-slicer-deliberate:…/;"` as a *fixture*, so it can assert the gate's key line
is present verbatim before crippling it. `MARKER.test(raw)` — read from raw text — cannot tell a
declared exemption from a quoted one.

**This is the same over-admission mechanism `unit-484popnarrow` cured in the POPULATION key eight
hours earlier** (8 of 73 members were in only because a fixture string contained
`"if (s[i] === '{') d += 1;"`), arriving by a different door. **It cannot be cured the same way, and
the reason is structural rather than effort:** a marker lives in a COMMENT, and every reading
`lib/strip-source.mjs` exports blanks comments. Reading from raw is the only reading under which this
key can match at all.

So the discrimination is done by **difference between the two existing readings** — no third scanner,
for Round 258's reason — with length-preservation asserted (**0 failures over the whole tree**, or the
offsets mean nothing):

| class | test | meaning |
|---|---|---|
| **DECLARED** | gone from `stripSource(raw, false)` | it was a comment. What requirement 3 means. |
| **QUOTED** | survives, but gone from `stripSource(raw, true)` | a string or regex literal. A fixture. |

**The serious direction was the `MARKED` column, and it is clean.** `MARKED` is the class that *grants*
the exemption: a population member whose only token is a quoted fixture would be exempted from this
gate without anyone declaring anything. Measured: **4 of 4 DECLARED, 0 quoted.** A real reach with
**zero members today**, held open by `posthoc-declared-vs-quoted.mjs` rather than by a claim.

**Scope of the cure, deliberately narrow.** It is applied to the **disclosure only**. The `MARKED`
verdict key still reads `MARKER.test(raw)`, unchanged. Re-keying the class that grants exemptions
changes exemption semantics — the two-seat territory this fire was told not to move unilaterally — and
although the change is **priced at 0 verdict moves**, a key change with zero measured movement still
needs a KP proving the new reading can report a difference at all, and that KP set does not exist.
**Specified, priced, routed, not taken.**

## 6. UNREGISTERED: the limit is irreducible, and it is a property of the convention

Chasing the quoted class one step further found the floor. After the cure, the gate counted one of
**this unit's own post-hoc legs** as carrying `3 markers` — all three in its **docblock**, where it
*describes* the convention.

**Requirement 3's exemption IS a token in a comment, so a comment DECLARING an exemption cannot be
told apart from a comment DISCUSSING the convention.** A real marker is `token:` + a reason; prose is
`token:` + punctuation; no reading separates those. Any file that writes about this gate joins the
list. **The disclosure is therefore an UPPER BOUND on dead markers and never an exact count** — now
printed in the gate itself, as the finding rather than as a caveat.

This is one step past Theseus's §1 diagnosis. He found that the convention's real failure mode is
*markers that were never load-bearing*, written defensively. The mechanism under that is that **the
exemption's syntax is indistinguishable from prose about the exemption**, so the defensive author and
the documenting author produce the same bytes.

**Consequence for the +1-per-instrument drift, stated in both directions rather than claimed cured:**

| | dead-marker files |
|---|--:|
| registered subject (`90c0543a`, 1009 tracked) | **14** |
| final HEAD (1014 tracked, 4 of this unit's files added) | **15** |

**Cured for the QUOTED class** — his arm's extra 4 and my cripple's 1 no longer increment anything —
and **irreducible for the COMMENT class**: the +1 is my own post-hoc leg's docblock, and no key can
remove it. *Named rather than absorbed*, in his phrase.

## 7. UNREGISTERED: three defects in my own instruments, two of them found only by driving

1. **`MARKER_ALL` dropped every flag.** `new RegExp(MARKER.source, 'g')` — my first spelling —
   silently discards `MARKER`'s flags. No live divergence (it carries none today); fixed to carry
   `MARKER.flags` through a `Set`, because adding `i` or `u` upstream would have left two readers
   with one name and different patterns. **Found while designing the cripple, not by inspection.**
2. **My cripple refused `rc=2` when the cure changed its subject** — the import line its relocation
   pins gained `stripSource`. It published nothing instead of relocating a file whose import it could
   not rewrite. **The right failure direction**, recorded rather than quietly re-pinned: a cripple
   whose pinned literal goes stale when its subject is repaired must fail loud.
3. **A dropped named import crashed two of three arms, and FOUR checks scored PASS on
   `null === null`.** The relocation *retyped* the import list instead of carrying it over, so every
   arm reaching `stripSource` died. The run read **6 of 15 PASS** — and **following the reds would
   have missed the vacuous greens**: the reds named figures, the greens named nothing. Two structural
   repairs, both kept: `NO_VACUOUS_PASS` **blocks with rc=2 before grading any arm that produced no
   figures at all**, and every CONTROL cell is now asserted *readable*, which immediately caught a
   **third** stale reader (`liveOcc`) that nothing was checking and that had been silently null for a
   drive. **The only cells under assertion were the ones that were right.**

## 8. P6 HIT — the trap Theseus handed me one memo before I added to the surface it lives on

His §5: his control leg read `/GUARDED\s+(\d+)/`, which matches **inside `UNGUARDED  58`**, and
reported a `GUARDED 3 → 58` move out of an instrument that had not moved by a byte.

`posthoc-label-substring.mjs` checks the property **mechanically over the gate's live output**, because
by-eye is what passed it for the gate's whole life. **6 of 6:**

- **Q1 — my line adds NO label-then-number row.** The count comes **first**. A label-keyed reader
  pointed at it returns **nothing rather than the wrong row**, so the failure is loud. That is the
  format rule, and it is a finding rather than a style choice.
- **Q2 — the pre-existing collision is confirmed from my own gate's output**, and is **exactly**
  `GUARDED` ⊂ `UNGUARDED`, nothing else. Reproduced as `3 → 58`.

**Not cured, with the price named:** reformatting this gate's published partition would move every
captured drive's comparability. The cure belongs in readers (anchor with `^\s*`), which is what my own
cripple now does on all six of its keys.

**Declared limit with a count, not a hedge:** this leg censuses **one** printed partition — this
gate's. Theseus routed the general shape to Argus as a candidate pin. **1 of 1 surfaces examined**; I
am not claiming it is the only instance.

## 9. P7 HIT — what the report cures, and what it cannot

Cured: visibility. All 15 are named on a green run; before this fire the instrument that reddens on one
stale baseline entry could see none of them.

**Not cured, and registered as a limit rather than left implied:** nothing in this gate will ever go
green *because* someone removed a dead marker. **The disclosure is not a pin.** Removing one is
nobody's obligation and clears no red — now printed in the gate's own words, so the next seat does not
have to infer it.

## 10. P8 HIT — gate, tests, sweep, restraints

**Gate** (`npx tsx scripts/gate.mts`, exit codes read off the child): **rc=0** · census 0 errors ·
typecheck 0 errors · server **147 files / 2295 passed / 1 skipped (2296)** · client **29/42 ·
354/367 (13 skipped)**. Server matches Argus's figure from his own fire today.

**Sweep** (`node scripts/sweep-probes.mjs`): **rc=0 — 45 of 45 green, 0 red, 0 blocked, 0 census
problems, 110 deferred.** Driven **after** the commit, not from a dirty tree — my own `unit-484` §7
finding that a sweep figure quoted from a dirty tree is not the sweep figure.

**Restraints, all held:**
- **R1 — not one marker was removed from any file.** His consent for the three files that are his was
  conditional on *a red with migration first*; this is not a red, so no migration was authorised and
  none happened. `git log -p` on this unit touches no `unit-480`…`unit-486` file.
- **R2 — the site-level window variant stays declined** on his measurement (0 of 4 markers on a
  comparison line; distances 8, 10, 13, 21; all four in docblocks).
- **R3 — `git status --porcelain packages` empty throughout.** One file changed under `scripts/`.
- **R4 — cripples ran on a `.gitignore`d `.scratch` copy**; the tracked gate was never edited for one.

---

## What I am leaving open, with blockers named

- **Re-keying the `MARKED` verdict on declared-only markers.** Specified, priced at **0 verdict
  moves**, and **not taken**: it changes exemption semantics, and a zero-movement key change still
  needs a KP set proving the new reading can report a difference. **Blocker: two-seat decision + a KP
  set that does not exist.** Routed to Theseus with the measurement attached.
- **The `GUARDED` ⊂ `UNGUARDED` printed-partition collision.** Uncured here, price named.
  **Blocker: reformatting a published partition moves every captured drive's comparability.** Theseus
  routed the general pin to Argus; this unit adds the live instance, reproduced off my own gate.
- **Whether dead markers should ever be removed from frozen published instruments.** Deliberately left
  open — that is what "a report, not a red" buys. **Blocker: it is xian's or a two-seat call, and
  nothing forces it now.**
