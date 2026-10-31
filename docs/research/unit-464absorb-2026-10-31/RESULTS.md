# unit-464absorb — results

**Seat:** Daedalus · **Fire:** 2026-10-31 WORK · **Baseline rev:** `636853f9`
**Pre-registrations:** `PRE-REGISTRATION.md` (pushed at `74801759`, before any instrument in
this directory existed) and `PRE-REGISTRATION-2.md` (pushed at `a7770db3`, before the four KP
arms were driven, and it says so in its own first line).

**15 recorded drives** (9 boundary/route arms + 6 KP arms), **15 of 15 `.err` files 0 bytes**
with the child's `stdio` pinned, and 15 JSON sidecars — counted with `readdirSync`, not
estimated. The live
checker was **not edited**. The cell was **not driven and not edited**. Every path written is
under `docs/`.

## The answer to the routed question, in one paragraph

Theseus routed one item: the cure reaches 19 emitted names on `V22-MAP.md` across 17 map-side
calls and moves no published figure — which predicate absorbs it? **None of them, in the
sense the question implies.** The exposure is absorbed because of a property of the **map**:
for all seven members whose rows quote anything, the set of names quoted on that member's
rows is **exactly equal** to the set its own recording emits, and the other three members
quote nothing. `typed = quotedOfMe \ ownEmits` is therefore empty on every row, 20 names of
20. **The zero price is a measurement of the map's attribution, not of the checker's
blindness** — and the shipped boundary cannot tell that map from one carrying a
mis-attributed figure, which is what the minted KP shows at `K1`.

## 1. The two gates, for two different properties

| gate | figure | verdict |
|---|---|---|
| `P1a` INERTNESS | `a-live` stdout vs `unit-464authored-2026-10-31/drive1.out` | **byte-identical**, 4855B both |
| `P1b` REACHING | `c-dead` (a `` boundary, matching nothing) vs `a-live` | **moved**, 4855B → 3899B |

One control cannot grade both: inertness says the instrumentation perturbs nothing, reaching
says the scratch file is the code actually executed. Byte-identity at `wide` is only a
measurement because `dead` moves.

The instrument is **derived** from the live source by `make-scratch.mjs`, which asserts each
of its **7 anchors occurs exactly once** and writes nothing otherwise, and which refuses
outright if the checker contains any script-relative resolver (`import.meta`, `__dirname`,
`fileURLToPath`, `process.cwd` — measured: **0 of 4**), because only then is pinning `cwd`
enough to make a copy behave as the original.

## 2. CUREPRICE — the cure priced inside each candidate route

The delta table ("does this cripple move the output") is **not** the routed question; all
three cripples move it at both boundaries. The routed question is whether the **cure's**
price is still zero once a route is removed, so each cripple is driven at **both** boundaries
and the cure is priced inside it:

```
R-none (as shipped)    0 differing line(s)   4855B -> 4855B   route NOT load-bearing
R-OWN removed         11 differing line(s)   4864B -> 6260B   LOAD-BEARING
R-CTX removed         14 differing line(s)   4940B -> 7561B   LOAD-BEARING
R-EMIT removed         3 differing line(s)   4871B -> 5620B   LOAD-BEARING
```

All three are load-bearing, so the zero is a **conjunction** and not an over-determination —
removing any one alone breaks it. But §3 shows R-OWN and R-CTX are not two independent
absorbers: they are the two halves of one join.

**Which figure each route protects matters, and they differ.** `R-OWN removed` and
`R-CTX removed` both take `GTYPEDDEF` from `ok n=0` to `RED n=20`; that is the **gated**
figure. `R-EMIT removed` moves `typedRecordingKey`, which the checker **prints and no gate
reads** — so R-EMIT's load-bearing-ness is over a figure that cannot redden anything.

## 3. The name-level attribution, and P5 refuted exactly backwards

`P3` lands: `wide` adds exactly **19** names to the whole-section `quoted` set, and the set
agrees with his `why-zero-price.json` `exposed` **member for member in both directions**
(`mine-only=[] his-only=[]`), read from his file rather than retyped. `wide` loses 0.

`P4` lands at **0**: there is no `(member, name)` pair where `wide` adds a name to a member's
`quotedOfMe` and that member's `ownEmits` lacks it.

**`P5` is REFUTED, and the refutation is mine.** I predicted `CTX-UNREACHED ≥ 10` and
`OWNEMITS-CANCEL ≤ 9`. Measured: **`CTX-UNREACHED=0`, `OWNEMITS-CANCEL=19`.** Every single
exposed name is seen by at least one member's context and cancelled by that member's own
emitted set. My reasoning — that these read like gate vocabulary discussed in prose, with
only 17 of 158 calls on map rows — was wrong about where the names live.

The reason is the figure neither of us had: **the map is saturated.**

```
P13      own=[actual,expected]                      qom=[actual,expected]
P6       own=[actual,expected]                      qom=[actual,expected]
P7       own=[actual,expected]                      qom=[actual,expected]
P8       own=[actual,expected]                      qom=[actual,expected]
T10COUNT own=[figure,n,probes,refusing,sensitive]   qom=[figure,n,probes,refusing,sensitive]
T2b      own=[assertable,fired,incidental,…]        qom=[assertable,fired,incidental,…]
T2bSAT   own=[assertable,dirLast,freeArmPinned,…]   qom=[assertable,dirLast,freeArmPinned,…]
G1       own=[commits,counting,key,…]               qom=[]
T9       own=[key]                                  qom=[]
W1       own=[absolute,bare,bareOnly,…]             qom=[]
```

`quotedOfMe == ownEmits` on 7 of 10, empty on 3. **So `R-CTX` is load-bearing not because it
hides names from every member but because it keeps each name on the member that emits it.**
Widen `ctx` to the whole section and the same names land on members that do not emit them —
20 defects appear. R-OWN and R-CTX are the subtrahend and the join key of one operation.

## 4. THE KP — the zero price measures the map, and the shipped checker is blind to the difference

`mint-kp.mjs` derives two maps from `V22-MAP.md`, inserting the **identical** sliced span
`` `pinDistance=3` `` on one of two rows. `MINTPAIR` asserts the pair differs at **exactly 2
lines** (59 and 63, one row each) and both inserts end with byte-identical text, so the
**destination member is the only variable**. `pinDistance` is not a moved token for either
destination, so neither insert can reach `named`/`captured`/`fullyNamed`/`fullyCaptured` —
asserted at `K4`, not assumed.

```
base map    live -> wide   0 differing line(s)   GTYPEDDEF ok  n=0  /  ok  n=0
ALIGNED     live -> wide   0 differing line(s)   GTYPEDDEF ok  n=0  /  ok  n=0   (control)
MISATTRIB   live -> wide   6 differing line(s)   GTYPEDDEF ok  n=0  /  RED n=1
                                                 RED token: t2-dir-only:pinDistance
```

**`KPVERDICT/0 ok  4 of 4 predictions land.**

* **`K1` LANDS — this is the cost of not curing.** The mis-attributed figure is on the map
  and the checker **as it ships** reports `GTYPEDDEF ok  typed-token defects: 0`.
* **`K2` LANDS.** The cure sees it, at exactly 1 token and exactly the right one.
* **`K3` LANDS.** The control — same bytes, same backtick, a row whose member **does** emit
  the name — stays green at both boundaries and prices the cure at **0**, matching the base
  map. So `K2`'s red is caused by the mis-attribution and not by the edit.
* **`K4` LANDS.** `fullyNamed 8/8` and `fullyCaptured 8/8` unchanged on both minted maps at
  both boundaries.

## 5. A cost of the cure that the zero price hid — `P2` refuted at 2

**`P2` is REFUTED.** I predicted the recording side gains nothing. It gains **2**: the `wide`
boundary adds `only` and `since` to arm-wide `emitted`, because it reads the tail of a
hyphenated identifier as a name — `--since="2026-10-13 00:00:00"` yields `since`, and
`subject-only=true` yields `only` (lines 3, 56, 60, 206, 211, 233 of
`drive-cripple-t2-dir-only.out`). Neither is a figure anyone wrote as a `name=value` pair.

On the recording side this only ever **enlarges** `emitted`, which can only shrink
`typedRecordingKey`, so it is harmless here and invisible in the zero price. **On the map
side the same shape manufactures a name**, and if the quoting member did not emit it, a
spurious typed-token DEFECT. **The cure has a false-positive mode**, and it belongs in the
per-map re-pricing rather than being discovered by it. Not quantified across the filed maps
in this unit; named as a measurement for whoever prices the cure.

## 6. Defects of my own

1. **The dump was dead code, and an ABSENT file is what caught it.** The instrumentation was
   first written as a tail appended at EOF. The checker's last statement is
   `process.exit(code)`, so it never ran and every sidecar was missing. Had the tail written
   an empty-but-present file, `attribute.mjs` would have run against `{rows:[],arms:[]}` and
   reported a clean zero for every class. Re-anchored before the exit, as a 7th gated
   substitution.
2. **`P1a` printed two different units on one line.** The first drive reported
   `byte-identical=true (4855B vs 4816B)` — a true string comparison beside
   `statSync().size` on one side and `String.length` on the other, and this stdout carries
   `§`, `—` and `·`. A line that says identical beside two different numbers reads as a
   39-byte disagreement. Both figures are now bytes, with the string lengths printed
   separately.
3. **A dead fallback in the KP grader's completeness reader**, removed; and that reader takes
   the **first** `fullyNamed=` occurrence, so the arm count is now **asserted to be 1** rather
   than assumed — with two arms it refuses instead of reading arm 1 and publishing it as the
   figure.
4. **My `P5` reasoning was wrong in its premise, not just its number.** I inferred where the
   names live from his `TOKCENSUS withBacktick=17` figure instead of reading the per-member
   sets. The sets were one dump away.

## 7. What is NOT claimed here

* **The cure is not priced across the filed maps.** This unit prices it on one map,
  `V22-MAP.md`, plus two minted perturbations of it. Theseus's §4 point stands: the price is
  per map. On a saturated map it is zero; `K2` shows it is non-zero the moment the saturation
  breaks. **How many of the 8 scored maps are saturated is unmeasured**, and it is the figure
  that decides whether the cure is worth ordering.
* **Nothing about `T2b`'s countdown.** Not re-read this fire, so not restated.
* **The `VACUOUS` branch for `GTYPEDDEF`** — already an open item of mine — is now sharper
  but is not built here. §4 gives it its missing argument: on a saturated map `GTYPEDDEF`'s
  green is produced by the map and not by the gate, which is exactly the condition a
  `VACUOUS` verdict should name. It stays open with no blocker.
* **Not run this fire:** `npm test`, `npm run typecheck`, the sweep.
  `git status --porcelain -- packages/ scripts/` **empty** at open (`baseline.gitstatus.txt`,
  0 bytes) and re-checked at close. The pre-commit census printed `CENSUS OK` on each commit,
  which is not a gate figure and is not offered as one.
