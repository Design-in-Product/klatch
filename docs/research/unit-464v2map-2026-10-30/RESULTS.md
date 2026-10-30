# unit-464v2map — results

**Baseline rev:** `ee653841`. **Pre-registration:** `69c6a74c` (before the map existed).
**Map filed:** `99982867` (before the first drive). **Drives:** `3e68adf3`.
**Checker:** `../unit-464mapkey-2026-10-30/grade-filed-maps.mjs`, unmodified.
**Cell:** `../round464-instruments/grade-the-stop-condition.mjs`, unmodified.
**Three `.err` files, 0 bytes each**, by `statSync`.

## Scoreboard

| # | prediction | outcome |
|---|---|---|
| R1 | `reached` is exactly `[T2bKP,T2bSAT,T8CEIL,T8KP]` | **REFUTED** — 7, not 4 |
| R2 | `verdictReached` (2) strictly narrower than `reached` | **LANDED** — 2 vs 7 |
| R3 | the map grades `underReported = 0 + 0` and `tokensTyped = 0` | **HALF REFUTED** — `tokensTyped=0` landed; `underReported = 3 + 3` |
| R4 | `fullyCaptured = 4` fails, `rows=` quoting is where | **LANDED**, and for a second reason I did not predict |
| C1 | `filing-rev` unwritable and unread | **LANDED** |
| C2 | `cell:` / `clean-recording:` never parsed | **LANDED** |
| C3 | §3's MUST/refuse sentence over-claims | **LANDED** |
| C4 | §3.4's key measures value agreement, not provenance | **LANDED by source + drive**, variant drive not run (see "not run") |
| C5 | under `verdict-keyed-reach` this map's membership under-report falls to 0 | **NOT DRIVEN** — named, not claimed |

## 1. The finding: a conforming v2 map grades `MAPVERDICT/0 ok` while under-reporting 6 of 7 members

`drive2.v2map-retitled.out`, all eight gates green:

```
GRADE  armsGiven=1 graded=1 unreadable=0 unmapped=0 reachedCells=7 (mapped arms 7)
       fullyNamedCells=1 fullyCapturedCells=0 underReportedCells=6 (membership 3 + tokens 3)
MAPVERDICT/0 ok gates=8 red=[]
```

The eight gates grade **the checker's own keys** — its tokenizer, its member count, its stamp
reader, the non-vacuity of its re-key, its context gate, its typed-token key, its refusal semantics,
its coverage. **None of them reads `underReported`, `fullyCaptured` or `fullyNamed`.** So the
convention is checkable in the sense that the figures are printed, and not in the sense that a
defective map fails. A map with `fullyCaptured=0` — zero rows conforming to §3.4, the half of the
cure the convention calls a DEFECT rather than a stylistic matter — is `ok`.

This is the same shape as the defect `M0c` was built for on 10-29 in this very cell: a declared
requirement that no gate reads. It is also the shape of a figure printed beside a guard that does
not consume it.

## 2. The map as filed was UNMAPPED, because its own title names its arm

`drive1.v2map-clean.out`:

```
ARM t8-ceiling-blind   [UNMAPPED — no section in the map; map-side figures REFUSE]
MAPVERDICT/1 RED gates=8 red=[GCTX,GTYPED]
```

`sectionFor` refuses unless **exactly one** heading contains the arm name. My map had the arm name
in the document title (`# Cripple map — t8-ceiling-blind — …`) and in its section heading
(`## Arm t8-ceiling-blind — perturbs the KEY`) — two headings, so it refused. The refusal is
correct behaviour and it is the *right* default. But the first honest attempt at a conforming map
was rejected for naming its subject in its own title, and §3.2 says nothing about it. `drive2` is
the identical file with **only line 1 changed** (asserted in the generator: any other delta throws).

**Writability cost 1, measured: a v2 map may not name its arm in its own title.**

## 3. `fullyCaptured` is a function of markdown line-wrapping

`T2bSAT`'s only moved token is `key`, the arm prints `key====`, and my map writes `key====`. It
scored `named=[key] captured=[]`. Cause: `mentions(id)` selects **physical lines** matching the
member id, and my bullet wraps — `T2bSAT` is on one line, `key====` on the next. The captured
string is outside its own member's context by a line break.

Worse in the other direction: `named=[key]` matched the English word *"key"* in the prose
*"the ceiling key's spelling"* on the member's line. So the one `fullyNamed=1` cell in this map is
fully named **by an English word**, not by a token — the same "complete by paraphrase" failure
Daedalus recorded as his own `P3` (`active=3` vs "active figure 3"), reached by a different route,
and the member-context gate does not stop it.

**Writability cost 2, measured: every row must be one physical line, and a row that mentions its
member in prose can score `named` off ordinary English.**

## 4. The reach key cannot tell arm-caused movement from drive-time drift — and this moves Daedalus's §4 figure

`reached=[G1,T2bKP,T2bSAT,T8CEIL,T8KP,T9,W1]`. Three of those seven are not the arm's doing:

| member | moved tokens | what they are |
|---|---|---|
| `G1` | `commits` | the commit population size — grew between the clean drive and the arm drive |
| `W1` | `absolute`, `bare` | window counts over that same growing population |
| `T9` | *none* (`moved=0`) | dated-history line, carries a rev |

`t8-ceiling-blind` re-spells one comparison operator. It cannot change `commits`. These three are
reached because the clean recording and the arm recording were produced at different clock times
against a repository that was still receiving commits.

Driven over his own `drive11.FINAL-theseus-six-arms.out`: **`G1`, `T9` and `W1` are "reached" by all
six arms**, including `t9-insensitive-leg`, the arm he reports as byte-identical across revs — where
they are **3 of its 4** reached members. A member reached by every arm, including the one designed
not to move anything, is the signature of a reach that is not arm-caused.

Consequence for his §4 table: *"the membership axis is the larger half in both seats — 14 of 24 in
your maps."* Up to **3 per arm** of that is drift, so on the three mapped arms up to **9 of the 14**
is a reach key counting the clock. My own `0 of 3` from 10-29 stands (it was keyed on tokens), but
his membership figure is a **ceiling**, not a measurement, until the reach key can exclude a member
whose movement is not a function of the arm. `T9 moved=0` is the cleanest instance: a member the
key calls reached with no moved token at all.

**This is routed to him as the next cure, and it is upstream of everything in §1–§3:** a map cannot
be complete about membership while membership includes members the arm never touched.

## 5. `filing-rev`, `cell:` and `clean-recording:` are MUST fields nothing reads

`V2-MAP-t8-ceiling-blind-STAMP-STRIPPED.md` is the retitled map with `filing-rev` replaced by forty
zeroes and the `cell:` and `clean-recording:` lines deleted. Graded against the same recordings:
**0 differing lines of 36** (`drive3` vs `drive2`, `map    :` header excluded), `MAPVERDICT/0 ok`.

* `filing-rev` is parsed into `filingRev` at the checker's line 211 and never read again
  (`grep -n filingRev` → 1 hit, the assignment).
* `field('cell')` → 0 occurrences; `clean-recording` → 0 occurrences in the checker.

And `filing-rev` is **unwritable as specified**: §3.1 asks for the sha of the commit that files the
map, which does not exist while the map is being written. This map states the parent and says so.

So §3's *"A map missing any one of them is not a v2 map and the checker refuses to grade it rather
than grading it as clean"* is **false for three of §3.1's five fields**. Only
`cell-size-at-filing` is load-bearing (checker lines 209–210).

## 6. What the map got right, so the cost is not overstated

Every token **name** was predicted correctly, and every value except the inside of `rows=`:

* `T2bSAT` → `key====` ✓ · `T8CEIL` → `key====` ✓, `pinned=true` correctly predicted unmoved ✓
* `T2bKP` → `misses=[pin-arm-above-ceiling]` ✓ (declared prior knowledge)
* `T8KP` → `misses=[above]` ✓ — **not** prior knowledge, predicted from source
* `T2bKP`/`T8KP` `rows=` → **wrong**, in exactly one way: the per-row pair is `actual/expected`
  and I wrote `expected/actual`, so `pin-arm-above-ceiling:true/false` should have been
  `false/true` and `above:true/false` should have been `above:false/true`.

The convention is writable at the level of names and single values. What defeats it is the
tokenizer handing the final token the whole remainder of the line, so one wrong character inside a
150-character `rows=` value costs the whole row its capture.

## Not run, named rather than skipped silently

* **C5** — the `verdict-keyed-reach` arm against this map. Named in the pre-registration, not
  driven; the fire ended first. No blocker.
* **C4's variant drive** — a copy of the map with one correct captured value replaced by a plausible
  wrong one. C4's claim is established by the checker's source (line 316–319: `l.includes(t + '=' +
  tb.get(t))`, a substring test against the arm recording) **and** by §6 above, where the three
  values I predicted correctly are indistinguishable from copied ones and the two I predicted
  wrongly scored uncaptured. The variant would make it a 2-cell matrix; it is not needed for the
  claim and is named as not driven.
* `npm test`, `npm run typecheck`, the sweep. `git status --porcelain -- packages/ scripts/` empty
  at open and at close — every path written is under `docs/`.
