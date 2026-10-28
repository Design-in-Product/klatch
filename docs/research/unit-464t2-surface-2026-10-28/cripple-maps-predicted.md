# Hand-derived cripple verdict maps — written BEFORE each drive

Daedalus's 10/28 §5 recommends deriving each cripple's verdict map by hand before driving
it rather than driving first and writing down what came out; two of his four defects were
caught that way. Doing the same here. This file is committed in the same commit as the
drives it predicts, so the ordering claim is checkable: if a map here disagrees with its
drive, the disagreement is recorded rather than quietly matched.

Baseline (clean, `drive8.exitcode-postcure-same-tree.out`):
`VERDICT/0 ok legs=18 red=[] refused=[] preds=3 refuted=[] prefused=[]`

| cripple | predicted verdict map | why |
|---|---|---|
| `kp-drop` | `REFUSED refused=[K1]` | `kp` and `knSynthetic` both become `null`, so `K1` cannot reach a value. It must REFUSE rather than go green — a key with no known positive cannot be told from one that recognises nothing. `K2`/`K3` are independent of the synthetic pair and stay green. |
| `population-empty` | `RED red=[G1,S1] refused=[K2,E1,E2,E3,E4,S2]` | `DRIVEABLE=[]` → `G1` reddens on `declared=0` (a gate leg is the one site where a refusal must stay a RED). Everything keyed on the drive refuses. `S1` goes **RED, not refused**: `preSourceSilent` is empty while the ground truth parsed from drive6 still names 2, so `fp=0` and `fn=2` — the leg's conjunct "at least one false positive and no false negatives" is *false*, not unmeasurable. |
| `token-blind` | `RED red=[E3,E4] refused=[]`, `Q4` refuted | the drive key stops reading the printed `/N`, so `tokenAgrees` is `null` everywhere. `E4` asserts `tokenWrong.length === 0` — with every `tokenAgrees` null, `tokenWrong` (which filters on `=== false`) is also 0, so **`E4` stays green**. Correcting the derivation before driving: `E3` conjoins `d.tokenAgrees === true` and so goes **RED**; `Q4`'s second half counts `tokenAgrees === true` and drops to 0, so `Q4` is **refuted** (`5\|0` vs `5\|5`). Predicted map therefore `RED red=[E3]`, `refuted=[Q4]`. |
| `drive-blind` | `ok` — predicted **NOT** to separate | it synthesises the exit status from the printed word, which is exactly what every cell now does correctly, so post-cure the arm is indistinguishable from clean. Recorded as a negative result rather than dropped: it is the same fact `S1` reports, that a key-choice cripple cannot separate once the positive class is empty. It WOULD have separated against the pre-repair tree. |
| `source-as-truth` | `ok` — predicted **NOT** to separate | same reason. `silentSet` switches from the drive key to the source key, and post-cure both are empty, so `E1` is green either way. The arm is kept so that the vacuity is on the record; following only the reds would never show it. |

Two of the five are predicted non-separating, and both for the same structural reason.
That is the argument for `S1`/`S2`/`S3` being keyed on the pinned pre-repair rev instead of
on HEAD: the only tree where this unit's positive class is non-empty is the one before its
own cure landed.
