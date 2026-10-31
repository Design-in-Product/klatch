# unit-464nomoved — results

**Seat:** Theseus. **Fire:** 2026-10-30 STOP. **Model:** claude-opus-5.
**Baseline rev** `d668a007`; pre-registration pushed at `6cfb7237`, **before the cure existed**.
3 drives + 1 cross-check, every `.err` **0 bytes** with the child's `stdio` pinned. The cell was
not edited and not driven. Every path written is under `docs/`.

**Score: `G1` holds; 4 predictions, 4 landed — but only 2 of the 4 were blind.** `P2` and `P3`
were declared in the pre-registration as **reproductions** of figures Daedalus's memo already
reported, and they are reported as reproductions here. `P4` and `P5` were live, and both landed
in the direction I said would be the lucky one.

---

## G1 — the gate leg holds, so the green below is a green against something

`drive1.baseline` on the committed, uncured map:

```
GTYPEDDEF RED typed-token defects: 1 typed token(s) — quoted OF a member that never emits it: [t8-unpinned:moved]
MAPVERDICT/1 RED gates=16 red=[GTYPEDDEF]                                        exit=1
```

The baseline reddens, and on exactly the gate under test. Had it not, `P3`'s `exit=0` would have
been a green against nothing and everything below would be reported as unmeasured.

The baseline is taken from **`git show d668a007:…/V21-MAP.md`**, not from the working tree, so
`drive1` is reproducible after the cure is committed. The live file is classified against both
states rather than asserted equal to one; re-driving this unit now prints
`SUBJECT … is ALREADY-CURED` and produces byte-identical recordings.

## The cure — one span, `V21-MAP.md:63`

```
-  … is the shape §3.3a's `T9 moved=0` found on the other side …
+  … is the shape §3.3a's `T9` moved-zero case found on the other side …
```

Applied by `drive.mjs` as a scripted `replaceAll`, not by hand, so the committed diff cannot
carry an unrelated edit. Three hygiene asserts, each FATAL rather than a skipped prediction: the
span is **present** in the baseline (×1); it is **absent** after; the two contents differ on
**exactly one line** (line 63, 85 lines both sides). `git diff --stat` on the map: **1 insertion,
1 deletion.**

## `P3` landed (reproduction) — the one string is the whole red

```
drive1.baseline    exit=1  red=[GTYPEDDEF]
drive2.cured       exit=0  red=[]
drive3.cured-live  exit=0  red=[]
```

`drive2` and `drive3` are the same content at two different paths and are **identical on all 11
figure anchors**, so `--map=`'s path is not load-bearing and the delta is not confounded by it.
That check exists because `GMUST` resolves the map's *declared* paths by realpath against cwd,
which has refused whole cells on this track before when a copy sat at the wrong depth.

## `P4` landed (live) — the cure is figure-neutral, and I expected it not to be

**8 of 11 anchors byte-identical; the 3 that moved are the typed-token family and the verdict it
feeds.** Nothing else.

| | baseline | cured |
|---|---|---|
| `GTYPEDDEF` | `RED … [t8-unpinned:moved]` | `ok … 0 typed tokens` |
| `TYPED tokensTyped` | `[moved] n=1` | `[] n=0` |
| `MAPVERDICT` | `/1 RED gates=16 red=[GTYPEDDEF]` | `/0 ok gates=16 red=[]` |
| `fullyNamed` / `fullyCaptured` | 12 / 11 | **12 / 11** |
| `underReported` RAW | `[G1,T9,W1]` | **`[G1,T9,W1]`** |
| `underReportedArmCaused` | `[]` | **`[]`** |
| `GRADE` / `GRADEA` / `GCONF` | — | **byte-identical** |

The pre-registration said why this could fail: Daedalus's §2 had just found the pre-fix union key
wrong in **both** directions on one member — a contaminating line inflating `fullyNamed` while
deflating `underReported`. The line I edited is a `T2` row that **mentions `T9`**, so it is
exactly the kind of line that attributes across members, and deleting a `name=value` span from it
could have taken a *credit* with it and moved `fullyNamed` 12 → 11. It did not.

**So v2.2 §3.4b's "write cross-references in prose, not as `name=value`" has no measured cost on
this map.** That is worth stating because nobody had priced it — the rule was adopted on the
strength of one red, and a rule that silently deflated a completeness figure every time it was
obeyed would have been a bad trade discovered much later. It is one map and one span; it is not a
general result.

## `P5` landed (live) — the gate's own denominators do not move

`linesSubjected=14 subjectsDeclared=14 · refDropped=17 · unionBearing=15` is byte-identical
across the cure. The two figures Daedalus added this fire as `GSUBJ`'s denominators are keyed on
**lines**, and the cured line still exists and still mentions `T9` in prose, so a cure of this
shape is invisible to them. Refutable and not refuted: had either been keyed on `name=value`
spans rather than on lines, obeying §3.4b would have shrunk the gate's own denominator — the
"relaxing a gate to fit" failure, arriving by accident.

## `P2` landed (reproduction) — and his drive1 reproduces on all 11 anchors

`xcheck-his-drive1.mjs` slices the same 11 anchors from my `drive1.baseline.out` and from his
committed `../unit-464rekey-2026-10-30/drive1.mapA-honest.out`, exits non-zero on any
disagreement, and records its own output:

```
XCHECK  agree=11/11 differ=0 refused=0
VERDICT REPRODUCES — his drive1 figures hold under my argv on the git-pinned subject
```

Different cwd, different `--map=` path, subject extracted from git instead of read from the
working tree: **every figure identical**, `fullyNamed=12` and `tokensTyped=[moved] n=1` included.
`P2` specifically predicted **1** typed token, not 2 — a baseline printing `[N,moved]` would have
meant the re-key was absent from the checker I was driving, which would have refuted `P2` on the
*checker's* state rather than on my map's. An anchor missing from either side refuses rather than
comparing equal to the other side's absence.

## What this does and does not close

**Does:** Daedalus's §6 honest limit — "`GTYPEDDEF` has exactly **one** green cell in the repo
and I manufactured it with a substitution — **no map in the tree passes it unedited**" — is false
as of this commit. `drive3.cured-live` is the committed map at its real path, exit 0, and
`V21-MAP.md` needs no scratch copy to pass.

**Does not:** his open item is a green cell from a map **authored** under v2.2 §3.4b. Mine is a
**cured** map. A map that never contained the defect would show that §3.4b is writable from the
start; a map with the defect removed shows only that it is removable. Those are different claims
and this unit supports the weaker one.

## Stale prose pinned, not rewritten

`../unit-464v21map-2026-10-30/RESULTS.md` §1's heading is
*"The first v2.1-authored map grades clean — `MAPVERDICT/0 ok gates=13 red=[]`"*, and §2
blockquotes the row containing the span this unit deleted. The heading was **true at that unit's
filing rev, false from `44f3d6d5` until this cure, and true again now at `gates=16`**. A dated
`PIN` section was added at the top of that file carrying the three-column table and the fact that
§2's `n=2` no longer reproduces and its stated reason was half wrong. **The heading is left as
written** — it was a measurement, not a forecast, and rewriting a recorded figure to match a
later one is how a results file stops being a record.

## Stop condition

`T2b`'s countdown is **not re-read this fire** and so is not restated. The cell was not edited
and not driven. **Not run this fire:** `npm test`, `npm run typecheck`, the sweep.
`git status --porcelain -- packages/ scripts/` **empty** at open (`baseline.gitstatus.txt`, 0
bytes) and at close. Nothing here moves xian's stop/re-scope verdict.
