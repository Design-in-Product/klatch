# Cripple map — the first map authored under CRIPPLE-MAP-CONVENTION v2.2, §3.4b included

```
MAPSTAMP v2
filing-rev: fcb2eb30baf4d80eb60f14042a191620b4258d02
cell: docs/research/round464-instruments/grade-the-stop-condition.mjs
cell-size-at-filing: legs=26 preds=10
clean-recording: docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out
```

`filing-rev` is the **parent** of the commit that files this map (§3.1) — the pre-registration
commit, which was pushed before this file existed. `cell-size-at-filing` is read off the clean
recording's own `VERDICT/` line and not counted by hand (§3.1).

The document title does not name the arm (§3.2); the arm is named in its section heading, once.

**Prior knowledge is declared in `PRE-REGISTRATION.md` and it is material and larger than the
previous map's:** both the membership and the token values were read off committed recordings
before authoring. This map is not a membership forecast and must not be read as one. What it is
for is stated there.

**Every cross-reference in every row below is written in PROSE, never as a quoted span** — that is
§3.4b, and whether it can be obeyed without losing a captured token is the question this map
exists to answer.

---

## Arm `t2-dir-only` — perturbs the KEY

The arm forces every credit edge genuine (cell line 754: `e.genuine = true` when
`CRIPPLE === 't2-dir-only'`), so the self-attested credit key admits every edge instead of
requiring the crediting commit to be the round's own creator. It perturbs the **key**, not the
counting population: nothing about which rounds exist changes, only which of them the second
opinion is willing to credit. The companion subject-level arm on this cell is the one that splices
a synthetic round into the population, and a key arm structurally cannot score what that one
scores.

**Predicted arm-caused reached members: 7** — T2b, T2bSAT, T10COUNT, P6, P7, P8, P13.

**Predicted drift members, excluded from the above per §3.3a: 3** — G1, W1, T9. The commit
population size, the window counts taken over it, and the dated figure line. Named so the map is
explicit that raw reach is predicted to be 10, and that the difference is a property of when the
two recordings were taken rather than of this arm. Their moved tokens are deliberately **not**
quoted: a value that moves with no arm in play is not a figure of this arm, and quoting one would
make the map look more complete while saying something the arm does not support. The raw
under-report therefore carries a token-axis entry for two of these three, and that is the correct
reading, not a gap.

**Predicted verdict movement, as a property of rows and not as the selector: 4** — T2b leaving the
red set, and P6/P8/P13 leaving the landed set. P7 is refuted in both drives and so is invisible to
the v1 key while moving a token, which is the standing argument for the reach key.

### Rows

One physical line each (§3.4) however long, subject id first in a code span (§3.4a), every quoted
figure the exact string the tokenizer cuts from the **arm** recording — which means interior tokens
carry their trailing delimiter.

- **`T2b`** — status MOVES `RED `→` ok `; 3 moved tokens: `fired=false (consecutive 2);`, `incidental=[];` and `pinArm=both`. The quoted `fired` value is the SECOND occurrence on the line, because the tokenizer keeps the last and the line prints the dir arm's reading before the self-attested one; both read false here, which is the whole point of the arm — admitting every credit edge collapses the second opinion onto the first, so the row that was the cell's only red goes quiet. `pinDistance=3` and `assertable=true` do not move. This is the member whose red the arm exists to grade as load-bearing rather than structural, and it is reached together with the measurement leg that reports its two arms against the population ceiling. Cross-reference minted by unit-464absorb: `pinDistance=3`.
- **`T2bSAT`** — `MEAS`, status unmoved; 3 moved tokens: `selfLast=464`, `pinArm=both(464)` and `freeDistance=3`. The self-attested arm's last cured round rises to the dir arm's, so the two arms coincide, the selector reports both rather than one, and the free arm's distance from the ceiling falls to the pinned arm's. `dirLast=464`, `popMax=467`, `pinDistance=3`, `pinArmPinned=false`, `freeArmPinned=false`, `assertable=true`, `key=>=` and `selector=max(pins first)` all hold: the population and the comparison key are untouched by a key arm, and only the self-attested side of the pair moves.
- **`T10COUNT`** — `MEAS`, status unmoved; 1 moved token: `probes=[0,1,2,4,5,6];`. The probe set is the set of probe indexes at which the shared figure differs, and admitting every credit edge changes which indexes those are without changing how many legs depend on the figure: `sensitive=[T2,T2c,T2b] n=3;`, `refusing=[T8];` and `figure=2` are all unmoved. Note that the three ids inside that unmoved span are REFERENCES under §3.4a and inherit nothing from this row — before the re-key, one of them would have collected every token on this line as its own.
- **`P6`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual=464`. `expected=454` is the pinned prediction and cannot move. It predicted that the self-attested last cured round stays below the dir arm's, which is exactly the thing this arm removes, so the refutation is the arm working rather than the prediction being wrong.
- **`P7`** — status unmoved `REFU`; 1 moved token: `actual=2`. `expected=10` is pinned. Refuted in both drives and by a smaller margin here: the self-attested run collapses onto the dir run once every edge is credited. A row whose verdict is unmoved while its measurement moves — the shape the v1 verdict key cannot see at all.
- **`P8`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual="0|"`. `expected="3|387,389,464"` is pinned. The incidental set empties, because an edge that is credited is no longer incidental — so the figure this prediction pinned is not merely different, it is structurally unreachable under this arm.
- **`P13`** — status MOVES `LAND`→`REFU`; 1 moved token: `actual="both|464|464"`. `expected="dir|464|454"` is pinned. The selector's answer changes from one arm to both, and the two arms' lasts coincide — the same three figures the measurement leg above reports, pinned here as a prediction.

### Members predicted NOT reached, with the reason — so a later re-drive can tell a miss from a gap

- The key-level known positives for the ceiling comparison drive their own synthetic rows and do
  not read the live credit graph, so a change in which edges are credited does not reach them.
- The dispatch-site counts and the tokenizer legs are functions of the cell's source, which this
  arm does not edit.
- The self-attested known positive is built to be credited under either key, so it is insensitive
  to this arm by construction. If it IS reached, the key/subject label on this section's heading is
  wrong.

## Known deficiencies of this map, stated in it

1. **Membership and token values are both non-blind** (`PRE-REGISTRATION.md`). This is the larger
   of the two admissions and it is the reason this map is offered as evidence about the convention
   and the gates rather than as evidence about forecasting.
2. **The three drift members get no row.** They are named in prose only, which means this map's
   context for them rests entirely on the union half of §3.4a's key — and a drive that removes the
   union must therefore show them losing all context. That is a property of the map, predicted in
   the pre-registration, not an accident.
3. **One member's moved token is quoted from a recording I had already opened.** On the previous
   map the same leg's probe set was declared underivable and left unquoted, correctly, because its
   author had not read the arm. Here it is quoted. The two maps are not comparable on that row.

*Filed after the arm recording was opened, and `PRE-REGISTRATION.md` says so in those words.*
