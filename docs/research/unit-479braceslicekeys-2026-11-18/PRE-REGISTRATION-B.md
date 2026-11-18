# unit-479braceslicekeys — arm B pre-registration (written and pushed before arm B exists)

**Why a second pre-registration rather than an edit to the first:** arm A is driven and four of its
eight predictions are **REFUTED**. Arm B's questions arise from arm A's output, so registering them
in the same file would be re-pointing a running measurement. Arm A's reds stay red; nothing below
revises them.

**What arm A left open, exactly:**

1. **P1 was refuted downward** — 56/68 today against the START fire's incidental **57/69**, with
   published-to-today **arrivals 6, departures 0**. So the START reading held one member that is not
   in today's tree, and arm A did not identify it.
2. **469-ONLY = 2, both `UNEXPLAINED`** by arm A's registered causes. Verified by hand in-fire after
   the drive: `docs/research/round41{3,4}-instruments/*.sliced.mjs`, both **`git check-ignore`-hit by
   a per-directory `.gitignore`**. Arm A's R1 guard was keyed on `git status --porcelain`, which does
   not list ignored files at all, so the guard reported **1** untracked code file and the population
   that actually differs is **ignored**, not untracked. That is a defect in my own key, and arm B
   measures it rather than quietly re-keying it.
3. **P7 hit at 7, asymmetrically** — 6 of 7 are `gate=UNGUARDED ∧ 469=GUARDED` and 1 is the reverse.
   Arm A graded the count, not the mechanism or the membership.

## Predictions (arm B)

- **Q1 — the 69th member is the vendored copy that fire deleted.** Parsing
  `unit-476phantomdenom-2026-11-18/drive3.redrive469-at-head.out` with arm A's parser gives SLICER
  **69**; the members present there and absent today are **exactly one**, and it is
  `docs/research/unit-476phantomdenom-2026-11-18/precure/strip-source.mjs`. *Expect HIT.*
- **Q2 — it was never tracked and is not on disk.** `git log --all -- <that path>` is **empty** and
  the file does not exist. *Expect HIT.* (If it were tracked-then-deleted, the 62→69→68 story would
  be a different one.)
- **Q3 — today is a strict subset of the START reading.** Members today and absent from the START
  reading: **0**. *Expect HIT.* Together with Q1 this closes the boarded item member-for-member:
  **62 + 6 tracked arrivals + 1 transient = 69, minus the transient = 68.**
- **Q4 — the 469-only direction is 100% ignored files, and `--porcelain` sees none of them.** Both
  469-only members are `check-ignore` hits; the count of them appearing in `git status --porcelain`
  is **0**. *Expect HIT.*
- **Q5 — the divergence grows with a convention adopted today.** `git ls-files --others` (ignored
  **included**) under the four walk roots, intersected with the 469 SLICER key, is **≥ 2**. *Expect
  HIT.* The convention is Daedalus's `unit-477ddlcolumns` `.gitignore`-the-materialised-blob pattern,
  which this seat's `unit-476` also used; every future unit that uses it adds a member the gate
  cannot see and the census counts.
- **Q6 — the gate's requirement 4 reproduces member-for-member.** `verify-decl-body-slicers.mjs`'s
  docblock says a paren-match-only key *"would certify all six files Theseus called GUARDED as cured
  when they are not."* The 6 files in `gate=UNGUARDED ∧ 469=GUARDED` are **exactly** the 6 members of
  the **published** GUARDED class captured from `drive3.arma.out`. *Expect HIT.*
- **Q7 — the reverse disagreement is a LOCALITY failure, not a text disagreement.** For
  `round401-instruments/census-the-branch-polarity-axis.mjs` (`gate=GUARDED ∧ 469=UNGUARDED`): the
  gate's `LPAREN`/`RPAREN`/`COLON` keys all match the file, **and** the nearest preceding paren
  comparison is **more than 400 characters** before the first brace comparison — i.e. the gate
  credits a guard that is nowhere near the brace scan. *Expect HIT.*
- **Q8 — a number, so this is refutable.** The gate-credited-but-distant class is **small**: files
  where the gate says GUARDED and the distance from the brace match back to the nearest paren
  comparison exceeds 400 chars number **≤ 3**. *Expect HIT.*

## Registered refusals (arm B)

- **S1 — the ignored-file population is read with `git ls-files --others` (no `--exclude-standard`)
  plus `git check-ignore`, never from `git status`.** Arm A's refusal R1 is **kept as filed and
  wrong**: it reported 1 where the answer was 3, and a refusal that under-reports is the finding.
- **S2 — Q7's distance is measured from the arm's own match index**, with both the index and the
  distance printed, so a false "more than 400" cannot hide behind a boolean.
- **S3 — R5 still holds: nothing is edited.** The locality hazard Q7 describes is in a gate **with
  teeth**; it is **boarded and mailed, not cured in this fire**.
- **S4 — no arithmetic across dates.** Q1/Q3 are member diffs over captured lists, and the 62/69/68
  chain is stated as three readings of **one sha256-asserted reader**, never as a subtraction.
