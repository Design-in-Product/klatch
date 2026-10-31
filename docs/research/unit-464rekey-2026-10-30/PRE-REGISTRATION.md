# unit-464rekey — pre-registration

**Written and pushed BEFORE any of the three checker changes exists.** Baseline rev
`a0aa605448d290faf0fe95b5d558d1b6e2e3d146` (`baseline.rev`).
`git status --porcelain -- packages/ scripts/` empty at open (`baseline.gitstatus.txt`, 0 bytes).

## What this unit is

Theseus's 10-30 WORK memo routed **three checker changes** to me, in a declared order, all in
`docs/research/unit-464mapkey-2026-10-30/grade-filed-maps.mjs`:

1. **§2** — `mentions()` must key on the row's **declared subject**, not on every member id the
   physical line happens to mention. His §3.4 one-physical-line rule (which he asked for that
   morning) makes rows longer; a longer row mentions more member ids; every id mentioned inherits
   every token on the line. His `V21-MAP.md:63` — `T2`'s row, which quotes §3.3a's own worked
   example *`T9 moved=0`* — gave `T9` two typed-token defects **in a row that is not `T9`'s**.
   He names the hazard explicitly: *the re-key must not simply narrow to nothing.*
2. **§3** — gate `tokensTyped`. It is printed at `grade-filed-maps.mjs:867` and read by nothing;
   `GTYPED` carries the name but grades the two keys' relative **strictness**. **After** §2, never
   before, or the first thing the new gate reddens is correct prose.
3. **§4** — read each `--control=` path's own recorded provenance instead of trusting the
   argument. His drive2 passed **the arm recording itself** as the second control and
   `GCTRL` printed *"two distinct no-cripple drives"* about it; the under-report it hides went
   **15 → 4** (membership 5 → 0) with red-set delta `adds=[] removes=[]`.

Nothing here drives the cell. Every recording read is already committed. All paths under `docs/`.

## Design decisions, recorded before the measurement

**D1 — the subject parse keys on a leading code span, bolded or not, AND on membership.** Theseus
specified *"the member id in the row's leading bolded code span"*. That is the v2.1 row spelling
(`- **`T2b`** — …`). The six pre-10-30 maps use an unbolded spelling (`* `T2bSAT` shows …`), so a
bold-only parse narrows nothing in any of them. I therefore accept a leading code span **in either
spelling**, and only when its text is a known member id of the recordings — keyed on content, not
on one author's markdown habit. `subject-bold-only` is the arm that measures whether this choice
is load-bearing rather than tidy; **R5** is its prediction, and it is written so that "no
difference" refutes me rather than reading as a pass.

**D2 — the union with unsubjected lines is part of the cure, not a softening of it.**
`mentions(id)` = (rows whose declared subject is `id`) ∪ (lines with **no** declared subject that
match `\bid\b`). A map written entirely in prose has no declared subjects, so every line is
unsubjected and the key is **exactly** the pre-fix key — the re-key cannot narrow a prose map to
nothing by construction. `subject-rows-only` is the arm that drops the union, i.e. the failure mode
Theseus warned about, so that the non-collapse property has a counterfactual instead of an argument.

**D3 — §4 keys on the CELL recording's own spelling `^CRIPPLE <value>`, and REFUSES when absent.**
Theseus proposed checking the header "says `cripple: none`". That is
`grade-filed-maps.mjs`'s **own** header spelling; the cell recordings every control actually points
at print `CRIPPLE none` / `CRIPPLE t8-unpinned` (verified this session:
`unit-464t2b-sat-2026-10-29/drive2.clean.out:4`, `…/drive-cripple-t8-unpinned.out:4`,
`unit-464t8-mapdecay-2026-10-29/drive1.clean.out:4`). A reader lenient enough to accept **both**
spellings would accept a `grade-filed-maps` recording as a cell control — a recording from the
wrong instrument family entirely, carrying `cripple: none (clean arm)` about a different subject.
**R12** drives exactly that, so the leniency question is settled by a recording and not by taste.

## The cripple map (5 new arms)

Each row names whether it perturbs the **KEY** (how the figure is computed) or the **SUBJECT** (the
gate/instrument being graded), because a key cripple cannot score a subject gate.

| arm | perturbs | the pre-fix behaviour it restores | gate it grades |
|---|---|---|---|
| `subject-blind` | KEY | `mentions()` = every physical line matching `\bid\b` (today) | `GSUBJ` bite leg |
| `subject-rows-only` | KEY | `mentions()` = declared rows only, no unsubjected union | `GSUBJ` non-collapse leg |
| `subject-bold-only` | KEY | subject parse requires the `**` markers | D1 (is the broader parse load-bearing?) |
| `typed-ungated` | SUBJECT | `GTYPEDDEF` reports ok without reading `tokensTyped` | `GTYPEDDEF` |
| `control-header-blind` | SUBJECT | `GCTRLPROV` does not read the controls' `CRIPPLE` line | `GCTRLPROV` |

Every cripple is graded as a **delta against a matched no-cripple drive of the same argv**, not
against an absolute red list — the method the `control-fallback` refutation forced on 10-30 WORK,
where three gates shared one precondition and no absolute list could isolate the arm.

## Predictions

Two subjects. **MAP-A** = Theseus's `unit-464v21map-2026-10-30/V21-MAP.md` under his drive1 argv
(the map authored under v2.1; one arm, `t8-unpinned`). **MAP-B** = the v1
`unit-464t2b-sat-2026-10-29/PRE-REGISTRATION.md` under his drive4 argv (three arms; it carries a
**real** typed-token defect, `tokensTyped=[pinned] n=1` on `t2b-sat-wrong-arm` — the 2(b) defect
this checker was built to catch, not an artefact of §2).

* **R1** — MAP-A post-fix prints `tokensTyped=[] n=0`, down from his `[N,moved] n=2`.
* **R2** — MAP-A post-fix: `T9` loses its only context line (`T2`'s row) and becomes
  `mentioned=false`, so the **raw** `underReportedMembership` gains `T9` while
  `underReportedArmCaused` stays `[]` (T9 is drift). `MAPVERDICT/0 ok red=[]` still.
* **R3** — `subject-blind` on MAP-A restores `tokensTyped=[N,moved] n=2`, and the delta against the
  matched drive is `adds=[GSUBJ,GTYPEDDEF] removes=[]`.
* **R4** — `subject-rows-only` on MAP-A changes **no** printed figure (all his member content is in
  declared rows), so this arm is **VACUOUS on MAP-A** and the non-collapse leg cannot be graded
  there. On MAP-B it bites: `underReportedMembership` grows.
* **R5** — `subject-bold-only` differs from `subject-blind` on **at least one printed figure of
  MAP-B**. If it does not, D1's broader parse is unsupported on this population and the convention
  must require the bold instead; I will record that as a refutation, not re-aim the prediction.
* **R6** — `tokensTyped=[pinned]` on MAP-B **survives** the §2 re-key: it is quoted in `T2bSAT`'s
  own row. This is Theseus's required known positive and it is a real defect from a filed map, not
  a hand-typed fixture.
* **R7** — `GTYPEDDEF` RED on MAP-B, naming `t2b-sat-wrong-arm:pinned`, and MAP-B's `MAPVERDICT`
  exit is non-zero where his drive4 printed `MAPVERDICT/0 ok red=[]`.
* **R8** — `typed-ungated` on MAP-B: `TYPED tokensTyped=[pinned] n=1` still prints while
  `GTYPEDDEF` reads ok. Delta against the matched MAP-B drive: `removes=[GTYPEDDEF] adds=[]`.
* **R9** — `GCTRLPROV` ok on the honest pair (`CRIPPLE none` × 2, two different revs).
* **R10** — `GCTRLPROV` RED on Theseus's **poisoned** argv, naming `CRIPPLE t8-unpinned`, and
  MAPVERDICT non-zero where his drive2 printed `0 ok` — the inversion of his §4 table row.
* **R11** — `control-header-blind` on the poisoned argv: delta against the matched poisoned drive
  is `removes=[GCTRLPROV] adds=[]`, i.e. the gate is the only thing standing between that argv and
  a green verdict.
* **R12** — a `grade-filed-maps` `.out` passed as a control (a recording from the wrong instrument
  family, which carries `cripple: none (clean arm)`) **REFUSES** → `GCTRLPROV` RED with reason "no
  `CRIPPLE` header", because of D3. Under the lenient both-spellings reader it would have read
  `none` and passed.

## What this unit does NOT claim

* It does not re-drive the cell and **does not move the 464 verdict**. `red=[T2b] refused=[T8]` is
  not re-read here and is not restated as current.
* `reachedArmCaused` remains a **CEILING**: the control pair can only under-state drift.
* `GTYPEDDEF` is a gate on the **map**, like `GCONFORM` — it reddens for a map with a typed token.
  That is not "a gate that asserts the defect and reddens on its own cure": the map is the subject
  here, and §3.4 calls such a token a DEFECT. Curing MAP-B's spelling is the map author's move, and
  MAP-A (already correct post-§2) is the green cell that keeps the gate from being a constant red.

— Daedalus, 2026-10-30 STOP fire
