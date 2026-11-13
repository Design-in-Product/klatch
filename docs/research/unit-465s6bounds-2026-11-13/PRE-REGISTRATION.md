# Pre-registration — `unit-465s6bounds-2026-11-13`

**Seat:** Theseus (START fire, 2026-11-13). **Subject:** `docs/research/lib/attested-rounds.mjs` as
it stands after Daedalus's 11/13 START commits (`6c9a4348` pre-reg, `a827c5cd` unit + cure,
`22e73bad` additive legs), and the three claims his memo makes about that cure.

**Written before any arm in this unit exists, and before reading
`docs/research/unit-465maildurable-2026-11-13/arm-maildurable.mjs`.** Everything below is derived
from reading the module's own source this fire — `classifyPath`, `attestedRounds`,
`unattestedRoundsAt`, `SOURCE_CASES`, `SOURCE_RECALL_FLOOR`, `selfTest` — plus his memo. No
measurement has been run.

## Why this unit

His memo's §4 says the loose spelling's rejection is now *"a test and not a sentence"*, because the
real in-tree path `…ssh443-workaround-2026-04-18.md` is `S6`'s near-miss in `SOURCE_CASES`. His §3
says the pin's second axis — the classifier — is now named on the pinned reading. Both cures are
written in the same commit as the source they protect against.

Three mechanisms in the source suggest each cure is one step narrower than the sentence describing
it:

1. **`S6` has no LEFT boundary.** `/^docs\/mail\/.*round(\d+)/i` requires the digits to *touch*
   `round`, which is what separates it from the loose `round[ -]?(\d+)`. But the prose names the
   defect as *"the tail of the word workaround"* — and a word tail is exactly what the strict key
   still reads. The separator is excluded; the word tail is not.
2. **`S6`'s `.*` is greedy and crosses `/`.** So for a path naming two rounds, `classifyPath`
   credits the **last**, while `unattestedRoundsAt`'s own key (`/round(\d+)/i.exec(p)[1]`) reads the
   **first**. Two readers of one path in one module, with different answers.
3. **`selfTest`'s new second-axis guard is `typeof … === 'string'`.** That guards the field's
   presence and type, not its value; and nothing requires the near-miss case that makes §4's claim
   true to stay in the table.

## Predictions

Graded GREEN/RED against the stated criterion. A prediction that the defect is **absent** is as
much a result as one that it is present; several below predict absence deliberately.

| # | Prediction | GREEN iff |
|---|---|---|
| P1 | `classifyPath('docs/mail/read/calliope-to-dispatch-ssh443-workaround2026-04-18.md')` — the real near-miss with its separator removed — is claimed by **S6 as round 2026**. The strict key reads a word tail; only the separator was excluded. | `{source:'S6', round:2026}` |
| P2 | The hazard is **prophylactic, not live**: at HEAD, **0** real paths under `docs/mail/` have their S6 `round(\d+)` match preceded by `[A-Za-z]`. | count === 0 |
| P3 | A round number **≥1000** admitted this way enters `nonSubject`, so it is **denial-proof** — the same property §2 cites as the reason to take `S6` and §4 cites as the reason to reject the loose key. Driven on the synthetic path from P1 against a real tree read. | 2026 ∈ `nonSubject` and ∈ `filtered` under an injected tree row |
| P4 | **The near-miss is unguarded.** Deleting the `…workaround-2026-04-18.md` line from `SOURCE_CASES.present` in a copy of the module leaves `selfTest()` returning `true` — `pathCases.length >= 8` holds at 13, and `covered.has(null)` is satisfied by other `null` cases. | `selfTest() === true` with the case removed |
| P5 | **The second-axis guard guards type, not value.** Setting `at3ee13880.classifierRev = 'banana'` in a copy leaves `selfTest()` returning `true`. | `selfTest() === true` |
| P5b | …and the guard is **live, not dead**: deleting `classifierRev` entirely makes `selfTest()` throw, naming the classifier rev. | throws, message mentions classifier |
| P6 | **Multi-round paths exist and the two readers disagree.** In the tree at HEAD, ≥1 path matches `round(\d+)` **twice with different numbers**, and for ≥1 such path `classifyPath` credits a different round than `/round(\d+)/i.exec(p)[1]` returns. | ≥1 disagreeing path |
| P6b | Under `docs/mail/` specifically the class is **empty** at HEAD — so this half is also prophylactic. | count === 0 |
| P7 | **`casePathsPresent` was not driven in the unit that added an `S6` present-case.** `arm-maildurable.mjs` contains no call to `casePathsPresent`. | no occurrence of `casePathsPresent` |
| P7b | …and the KP path itself **is** present at HEAD, so the claim is unasserted rather than false. | `docs/mail/read/daedalus-to-argus-round9.md` ∈ tree@HEAD |
| P8 | **Reproduction of his `T6`** (not a prediction of mine — his published figure, re-measured here): module sliced at `6c9a4348`, tree read at `3ee13880` → `paths=207`, `outside=[9]`. | both exact |
| P9 | **Reproduction of his `T11`**: live module at HEAD, tree read at `3ee13880` → `paths=127`, `outside=[]`. | both exact |
| P10 | **Reproduction of his `T8`**: at-risk @`6c9a4348` = `[10, 270, 282, 319, 466]`. | set identical |
| P10b | **His §2 claim, graded at HEAD rather than at his rev:** `S6` made round 10 denial-proof, so **10 ∉ at-risk** at HEAD and `|at-risk| ≤ 4`. | both hold |

## Scope and what is not claimed

- **No `packages/` or `scripts/` diff is intended.** The subject is a `docs/research/` module and
  this unit's own directory. `typecheck:scripts` does not cover `docs/research/`, and
  `readdirSync('scripts')` does not see it, so **no gate leg is owed and none will be claimed**. If
  that turns out false, `git status --porcelain packages scripts` will say so in the drive output and
  the gate leg gets run.
- **Cripples are built on copies taken from `git show`, never by editing the live module.** P4, P5
  and P5b each restore from git rather than from a prior cripple.
- **Nothing in this unit is routed as applied.** The module is Daedalus's; findings go back as mail.
- **Commit subjects in this unit name no round number**, for the same reason his do not: `S4` reads a
  subject naming a round as an attestation of it, and this unit measures attestation.

— Theseus
