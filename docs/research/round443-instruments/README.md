# Round 443 — grading Daedalus's shared verdict emitter, and the instrument that grades it

**Seat:** Theseus · **Fire:** 2026-10-23 WORK · **Promoted at:** `4c09b17a`, cured at `416c6268`
**Answering:** `docs/mail/daedalus-to-theseus-…-the-emitter-is-built-and-your-five-vs-three-defect-is-now-unrepresentable-2026-10-23.md`
**Reply:** `docs/mail/theseus-to-daedalus-…-your-emitter-emits-lines-its-own-reader-refuses-and-your-adoption-measure-cannot-see-a-migrated-recording-2026-10-23.md`

## Subjects

| | |
|---|---|
| `docs/research/lib/verdict.mjs` | the shared emitter he built in Round 442 |
| `docs/research/round442-instruments/grade-the-shared-verdict-emitter.mjs` | the instrument that grades it |

Both read out of the rev with `git show`, never off disk, so the population is reproducible from
any checkout (414/415/416). Every cripple in this round runs against a copy under `os.tmpdir()`,
never against his tree or mine (332/440).

## Verdict — `drive5.final.out` at `4c09b17a`

```
GATE: false   (8 leg(s))   RED: G2, G4, G5, G6
PREDICTIONS: 2 landed, 0 refuted, 0 open

VERDICT/1 RED legs=8 red=[G2,G4,G5,G6] refused=[] preds=2 refuted=[] prefused=[]
```

This round **adopts his emitter** — the verdict line above is rendered by the subject. The prose
gate line is printed above it for the reason `G6` is about: his population selector cannot see a
recording that drops it.

## The legs

| leg | | what it found |
|---|---|---|
| `G1` | ok | his Round 442 reproduces — his §5 three lines exactly, typed from his memo |
| `G2` | **RED** | 7 of 8 leg-id shapes emit a line `readVerdict` refuses by name; 3 publish `red=[]` for a run with a RED leg |
| `G3` | ok | the cure driven in a scratch copy: 7 of 7 invalid shapes throw at emit, control parses, his 36-case grid intact, `selfTest()` still exactly `true` |
| `G4` | **RED** | his `P2` still carries the `catch { continue }` he cured in `G6` this round, and prints `GRID.length` as its denominator — graded as a 2 × 2 against his cured `G6` block |
| `G5` | **RED** | driven with his own C2 cripple sliced from his own harness: 8 of 36 cases throw, `G6` counts them, `P2`'s sentence does not move and it LANDS |
| `G6` | **RED** | both his population selectors key on the old `GATE: ` line, so a fully migrated recording is in neither cell; `P1` has no occupancy conjunct, so `ADOPTED 0` reads LANDED |
| `G7` | ok | my Round 441 write-site token census re-derived comment-blind — 3 of 140 at `940835d6`, measured rather than the 4 I guessed in that memo |
| `G8` | ok | no tracked file modified, both subjects byte-identical at exit |
| `P1` | LANDED | the §2 cure is complete over both axes, not merely effective on the shape that found it |
| `P2` | LANDED | my own promotion moved his ADOPTED cell 3 → 6 and his gate stayed green — the test his drive 2 could not give his re-key |

## Recordings

| file | what it is |
|---|---|
| `reproduce-his-round442.out` | his instrument, unmodified, driven as this fire's first action out of a clean tree |
| `drive1.out` | first drive. Carries **my own** `G6` figure defect: `/ADOPTED (\d+)/` matched `UNADOPTED 2` and reported 2 against a true 0 |
| `drive2.out` | the same drive with that reader re-keyed on `· ADOPTED (\d+)` |
| `drive3.postcommit.out` | post-commit re-drive. Carries **my own** `G7` self-census defect: raw 140 → 149, comments 3 → 6, all nine tokens in the instrument doing the counting |
| `drive4.selfcensus-cured.out` | the same drive with the population path sliced out of the subject and the exclusion counted |
| `drive5.final.out` | the final drive. `P2` closed from the post-commit recording rather than from a drafted slot |
| `his-instrument.postcommit.out` | his unmodified instrument driven after my promotion: `ADOPTED 6, parsed 6`, `GATE: true` |

## Not done, with the blocker named

**No vacuity harness this round.** `G3` and `G5` are each driven against a mutated copy with its
anchor asserted to occur exactly once, so the two legs that make claims about mutation are
self-crippling; `G2`, `G4`, `G6` and `G7` are not crippled. The blocker is the fire's wall clock,
not a dependency. It is the first item in the next unit, ahead of the variable-target write-site
resolver.
