# Round 132 — the fourth desynchronised file was the scanner itself, and Round 131's declined signal is green now

**Theseus · 2026-09-01 (START fire, 10:47 PT) · `scripts/verify-tsx-guard.mjs`**
**Spend:** zero API calls, zero model calls, zero corpus runs. `packages/` untouched.
**Baseline first:** `PASS — all 168` at `818f391`, clean tree, before anything changed.
**After:** `PASS — all 185`.

Round 131 (Daedalus) measured the residual Round 130 had only stated, found it live on three files,
and named the repair — teach `stripSource` a conservative regex-literal heuristic — while explicitly
declining to do it inside the round that found the reason for it. He offered 132 on the heuristic if
I wanted it. I took it.

---

## 1. Independent confirmation of Round 131 §2, by a different tell

Before touching anything, the claim was re-measured rather than accepted. Daedalus's tell was the
first desynchronisation point per file. Mine is character-exact and comparative: lift the real text
of `stripSource` from both `818f391` and the working tree, run **both** over the **same** input, and
diff the set of characters each calls string interior — a character is string interior iff the two
readings (`blankStrings` false and true) disagree at that index, which is conjunct 2's own test run
over every character instead of over one.

Same three files, same opening lines:

| module | lines returned to the code reading | from line |
|---|---|---|
| `verify-recogniser-equivalence.mjs` | 168 | 79 |
| `verify-filler-constraints.mjs` | 47 | 257 |
| `lib/tsx-required.mjs` | 27 | 112 |

Two small corrections, neither of which touches his finding:

* **`readable` is 37 modules, not 38.** 38 is the count under `scripts/` including `SELF`; `SELF` is
  excluded, which is the precondition at `PRECONDITION — exactly one module is excluded from the
  read population`. The three are 3 of 37.
* His line numbers are the *opener* lines (79, 255, 112); mine are the first line whose reading
  changes. They agree to within the opener itself.

## 2. The three were four, and the fourth was the scanner

**Round 131 §2 states `verify-tsx-guard.mjs` is not among them, "so your `SELF` control is measuring
what it claims." Measured: it is among them.**

Both scanners run over the same text — `818f391`'s own copy of the file, so nothing this round added
is in the input:

```
HEAD:scripts/verify-tsx-guard.mjs — 1264 lines
  string-interior lines: HEAD scanner 220  ->  R132 scanner 206
  no longer interior (14): 993,995,996,997,998,1000,1001,1002,1004,1005,1007,1010,1016,1023
  newly interior (0):
```

The opener is line 993, the file's own specifier regex:

```js
const SPECIFIERS = /\bfrom\s*(['"])([^'"\n]*)\1/g;
```

Four quote characters, two of each kind, and the scanner pairs them across the two character
classes rather than within them — so the span from the second `"` runs open past end of line. Lines
995-1002 are the entire body of `importsGuardSource`. The guard-detection predicate's own source was
being read as string interior by the scanner that predicate calls.

Why it did not show on his tell and did on mine: the run is not the tail of the file, it re-pairs at
line 1023, so the scan does **not** end open. A file-level "ends open" or first-desync signal reads
this file as clean. Only the character diff sees it.

**What it costs, honestly:** the SELF control's *verdict* was right — 0 anchors under both scanners,
measured — and no verdict anywhere moved. What was wrong is what the control was entitled to claim.
Round 130 added SELF as the live control that "measures the repair rather than its preconditions",
over a file whose last 270 lines include a 14-line region the scanner could not read. Right for the
wrong reason, over the region it was asserting about. That is the state item 11 found the *header*
in, one level down.

## 3. The repair

A conservative regex-literal heuristic, three parts:

1. **Prev-token test.** A `/` opens a regex only after a character that cannot *end* an expression
   (`( , = : [ ! & | ? { } ; + - * % < > ~ ^`), after one of fourteen keywords (`return`, `typeof`,
   `of`, `case`, `await`, …) not reached through a `.`, or at start of file. So `a / b`, `f(x) / 2`,
   `xs[0] / 2`, `4 / 2` and `o.in / 2` are all division by construction.
2. **Scan-ahead bounded to the line.** A regex literal cannot contain a newline, so an unterminated
   scan-ahead returns −1 and the `/` falls through to division. `[` opens a character class in which
   `/` is an ordinary character — `/[/]/` is one literal, not two.
3. **The span is blanked in both readings**, not emitted verbatim. Two reasons pointing the same
   way: a regex body is neither code nor string, so blanking it identically in both readings is what
   keeps conjunct 2 sound there; and it is what makes §5's parity control exact, since no quote can
   then leak out of a regex body.

Comment openers keep precedence over the regex branch — `//` is never an empty regex and `/*` never
opens one. Testing the regex branch first would read every line comment in this file as an
unterminated literal.

## 4. The repair moves no verdict on the live tree, and that is the point

Anchor tallies, both scanners, all 38 modules under `scripts/`:

```
files whose anchor tally moved: 0 of 38
HEAD's SELF text: HEAD scanner 0 raw / 0 narrow / 0 bucket  ->  R132 scanner 0 raw / 0 narrow / 0 bucket
```

And in the character diff above, across the whole population: **`newly interior: 0`** — not one
character anywhere is now read as string that was read as code before. The repair is strictly
subtractive on the live tree.

So the repair fixes nothing that is currently visible. What it changes is what the scanner *can*
see: 168, 47, 27 and 14 lines of real code returned to the code reading in the four files. Every
import site in `verify-recogniser-equivalence.mjs` sits above its desync point today — Daedalus's
§2 — so the exposure is a fifth one added below line 79. A repair whose whole value is in inputs
that do not exist yet can only be demonstrated with mutants.

## 5. Round 131 §4's declined signal is shippable, because the repair is what made it green

Daedalus found the signal and declined to ship it, for a reason that was correct at the time: in the
strings-blanked reading every surviving quote is a delimiter, so an odd per-character count means
the scan ended with a span open — and it **went red on the clean tree**, on three files that are not
broken. A red a correct file cannot clear is item 1 of the header. He put the call to me or to xian.

The three files it went red on are the three this round repairs. Measured, same signal, both
scanners:

```
HEAD scanner: 3 of 37 modules left with a span open
    lib/tsx-required.mjs ["\""]
    verify-filler-constraints.mjs ["'"]
    verify-recogniser-equivalence.mjs ["\""]
R132 scanner: 0 of 37 modules left with a span open
```

**Shipped**, as `PRECONDITION — no module is left with a string span open at end of file`. It costs
nothing now, and §6 shows it doing work no other control does. It is necessary and not sufficient —
an even-parity misread escapes it — which is why it is one of three controls on the scanner and not
the argument on its own. **This did not need xian and I did not route it to him:** the objection was
"it goes red on the clean tree", the repair removed that, and the decision became free.

## 6. Two mutants, and only one of them is about the defect

**M28 — the repair.** A read-only module (no `verify-` name, so §(b2) and §(c) never reach it and
the source limb is the only limb) with a genuine unguarded
`await import('../packages/shared/src/types.ts')` under a `/"([^"]*)"/g` — the shape that is live in
two tree files today.

* At `818f391`: **`PASS — all 168`**. The file is not named anywhere in the output. A total silent
  miss, on the failure mode Round 124 named and every round since has tried to abolish.
* Here: **`FAIL — 1 of 186`**, report line `UNGUARDED   r132-m28.mjs   (read-only: outside the run
  population)`.

**M29 — pointed at the heuristic, not at what it replaced.** Round 131 §4 asked for exactly this,
on the grounds that a repair verified only against the minimal instance of its own stated residual
would look like it worked. M29's unguarded import site shares its line with `o.in / n`, so a scanner
that misfires on that division steps over the span to the next `/` — which is inside the specifier —
blanking the anchor's own opening quote.

* At `818f391`: **`FAIL — 1 of 169`**. It is **not** a regression mutant; the old scanner catches it.
* Here: **`FAIL — 1 of 186`**, named.
* With the dotted-keyword guard removed (`!wordDotted &&` deleted, one operator): **§(b) goes
  silent.** The `UNGUARDED` line disappears; the site leaves the population.

What catches it in that third state is the control shipped in §5:

```
FAIL  SCANNER — division after a keyword reached through a dot   — {"wantCode":true}
FAIL  PRECONDITION — no module is left with a string span open at end of file   — ["r132-m29.mjs"]
```

The misfire steps over an odd number of quote characters, the string state flips, and the parity
precondition names the file. A silent miss turned back into a named red, on a live mutant, by the
signal Round 131 declined to ship. That is the round's strongest single measurement.

## 7. The case table, and the measurement that it discriminates

Fifteen rows over `stripSource` directly. Each places the token `MARK` in one position and asks one
question: does the strings-blanked reading still contain it? `MARK` survives iff the scanner called
that span code. Eleven rows require survival, four require blanking, and a precondition asserts both
counts — a scanner that read everything as code would otherwise satisfy most of a table, which is
item 5's failure in miniature.

Rows are not assumed to discriminate; four degraded scanners were run against them:

| scanner | rows red |
|---|---|
| `818f391` (no regex tracking at all) | 5 — the three regex rows, the character-class row, the regex-body row |
| **R132 as shipped** | **0** |
| R132 minus the prev-token test (always fires) | 5 — every division row |
| R132 minus the dotted-keyword guard | 1 — `o.in / MARK` |
| R132 minus character-class tracking | 1 — `/[/]'x/g` |

Every part of the heuristic has at least one row that dies when it is removed, including the two
single-line guards. Measured, not asserted.

## 8. Residuals, stated

* **An unterminated `/` on its own line falls through to division.** Valid JS cannot write a regex
  literal spanning a newline, so the row that covers this asserts the fall-through is *safe*, not
  that the shape is absent. Tabled rather than left in prose.
* **The heuristic's misfire is bounded in extent but not in consequence.** The step-over cannot
  reach past the end of its line, but stepping over an odd number of quote characters flips the
  scan's string state from there onward — the same unbounded desync this round removed. The parity
  precondition exists for exactly that case and M29 is the measurement that it catches it. An
  **even**-parity misfire escapes both. Reachability of any misfire on valid JS is an *argument*
  (division's left operand ends with an identifier, `)`, `]`, a digit, or a quote, none of which are
  in the fire set) and arguments of that shape are what items 1 and 10 both were.
* **Round 125's residual shapes 1 and 2** — still on report from both of us, still measured by
  neither. Should not be called measured.
* **The fourth limb for the read-only three** — Round 130 §8, still open. Daedalus said in 131 §5
  that he would take it if I took 132 on the heuristic. I took 132; it is his.
* **`SELF` remains a load-bearing house-style constraint** (Round 130's own trap, restated): if a
  future round adds a genuine TypeScript import to this file, the SELF check goes red and the
  correct response is to change the check, not the file.

## 9. The count, and the fair target for 133

**168 → 185**, eighth consecutive round. The +17 is 15 scanner rows, one table precondition, one
parity precondition — all instrument, none of it coverage of anything new. Round 130 settled that
the denominator is not evidence; this round is another instance and nothing more.

**The fair target for 133, against my own work:** the prev-token test. It is single-authored, mine,
written this round, and its whole soundness claim is an argument about what valid JavaScript can
contain — the exact form of claim that item 1 (`includes`), item 8 (`matchAll`) and item 10
(`resolve` by spelling) each turned out to be wrong about. The keyword list in particular is a
hand-written enumeration, which is what item 9 was about. A mutant that finds a misfire on real,
valid JavaScript kills the argument, and I would rather it were found by someone who did not write
it.
