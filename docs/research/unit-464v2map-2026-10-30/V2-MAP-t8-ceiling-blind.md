# Cripple map — `t8-ceiling-blind` — the first map authored under CRIPPLE-MAP-CONVENTION v2

```
MAPSTAMP v2
filing-rev: 69c6a74c318d0a2822c7ac8c3d6c4a708b78cb07
cell: docs/research/round464-instruments/grade-the-stop-condition.mjs
cell-size-at-filing: legs=26 preds=10
clean-recording: docs/research/unit-464t2b-sat-2026-10-29/drive2.clean.out
```

**`filing-rev` above is the PARENT of the commit that files this map, not that commit.** §3.1 asks
for "the sha of the commit that filed these maps, before the first drive", which does not exist
while the map is being written. The parent is the closest truthful value and it is stated as the
parent rather than passed off as the thing asked for. `C1` in `PRE-REGISTRATION.md` predicts that
nothing reads this field at all.

`cell-size-at-filing` is read off the clean recording's own `VERDICT/` line
(`drive2.clean.out:279`: `VERDICT/1 RED legs=26 red=[T2b] refused=[T8] preds=10 refuted=[P7,P2]
prefused=[]`), not counted by hand, per §3.1.

Authored under the protocol in `PRE-REGISTRATION.md`: cell source and the clean recording only; the
arm recording `../unit-464t2b-sat-2026-10-29/drive-cripple-t8-ceiling-blind.out` is not opened until
this file is committed. Prior knowledge about this arm is declared there, not here.

---

## Arm `t8-ceiling-blind` — perturbs the KEY

The arm re-spells the **ceiling key** `>=` as `===` (cell line 355), and prints the spelling it used
on two detail lines (881, 1329). It does not touch the population, the credit keys, or any
subject state — so it is a **key** perturbation, and only a key-level known positive can score it.

**Predicted reached members (§3.3 key — the member's own printed line moves): 4.**

`reached=[T2bKP,T2bSAT,T8CEIL,T8KP]`

**Predicted verdict movement, reported as a property of the rows and not as the selector: 2.**
`T2bKP` and `T8KP` go ` ok ` → `RED `. `T2bSAT` and `T8CEIL` are `[MEAS]` legs and cannot enter a
verdict set at all, which is why this arm is a second instance of §2(a) independent of the unit the
convention was written from.

### Rows

Each row names the member, whether its status label moves, and every moved token as the exact
`name=value` string the **arm** recording is predicted to print (§3.4).

- **`T2bSAT`** — status UNMOVED (`MEAS`); 1 moved token; the ceiling key's spelling is printed
  verbatim on its detail line, so the arm's value is `key====` (the token name `key` followed by the
  value `===`).
- **`T8CEIL`** — status UNMOVED (`MEAS`); 1 moved token, the same spelling on its own line:
  `key====`. Its other four tokens do not move: the union arm sits exactly at the ceiling
  (`lastUnion=467 popMax=467 distance=0`), and `467 === 467` is true under both spellings, so
  `pinned=true` holds either way. This is the member whose token Daedalus's recording-wide key used
  to launder a mis-spelling of mine, so it is named here deliberately.
- **`T2bKP`** — status MOVES ` ok ` → `RED `; 2 moved tokens. The row that breaks is the one a
  `===` ceiling spelling gets wrong, so the misses list becomes
  `misses=[pin-arm-above-ceiling]`, and because ` <ident>=` tokenisation gives the final token the
  whole remainder of the line, the `rows` token moves too and has to be quoted entire:
  `rows=6 both-below:false/false pin-arm-at-ceiling:true/true pin-arm-above-ceiling:true/false nesting-inverted:true/true both-at-ceiling:true/true absent-arm:null/null`
- **`T8KP`** — status MOVES ` ok ` → `RED `; 2 moved tokens, the same shape one rank down. The
  `above` row is the one a `===` spelling gets wrong, so `misses=[above]`, and the remainder token
  quoted entire:
  `rows=4 equal:true/true above:true/false below:false/false refuse:null/null`

### Members predicted NOT reached, with the reason — so a later re-drive can tell a miss from a gap

- `T2b` and `T8` keep their tokens: `T2b`'s pin arm is the dir arm at 464 against `popMax=467`, and
  `464 === 467` and `464 >= 467` are both false, so its refusal does not change; `T8`'s union arm is
  at the ceiling and pinned under both spellings.
- `P11`, `P12`, `P13` are keyed on distances (`0`, `3`, `464/454`) and not on the ceiling key's
  spelling.
- `M0c` names `t8-ceiling-blind:3` as a dispatch-site count, which the arm does not change.

### Known deficiency of this map, stated in it

The reached set is predicted from source at the clean rev. If the arm reaches a member whose line
moves for a reason the source reading missed, this map under-reports membership and the checker will
say so. That outcome is recorded as a result, not repaired by editing this file after the drive.
