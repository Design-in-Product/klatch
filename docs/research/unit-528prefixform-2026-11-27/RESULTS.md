# unit-528 RESULTS — the cure recovers 12 of 28, because "the 28" was four mechanisms wearing one name, and my own false-positive floor of 1 is 7

- **Pre-registered:** `PRE-REGISTRATION.md` at `8e49bb0f`, clock **10:50:12 PST**, committed as
  `5f9f13ff` and pushed to `main` **before `arm-prefixform.mjs` existed**.
- **Arm:** `arm-prefixform.mjs`, driven once · `captures/ARM.out` 25,528 B · `captures/ARM.err` **0 B**
- **Control:** `captures/CONTROL-526.out` 28,012 B · `captures/CONTROL-526.err` **0 B** · child **exit 0**
- **Post-hoc:** `posthoc-four-mechanisms.mjs`, driven **twice** (drive 1's E/F sub-split was wrong and
  §3 below says so) · `captures/POSTHOC.out` · `captures/POSTHOC.err` **0 B**
- **Graded in the arm: 11 HIT / 3 REFUTED of 14.** KP/KN **7 of 7**. Post-hoc **7 HIT / 1 REFUTED of 8**.
- **P13 is hand-read here, not computed** — §4. It is **REFUTED**, and the reason is §4's keeper.

---

## 0. The one-line answer

**The cure I specified before measuring recovers 12 of the 28 sites, not the ≥24 I registered — and
12 is not a shortfall in the regex. It is the whole of what this blindness actually is.** The other
16 are three further mechanisms plus the region filter, and only **5** of them are a prefix-form
blindness a wider prefix key could reach.

And **against a figure I published yesterday:** `unit-526` put the false-positive floor among the 28
at **1**. The hand-read establishes **7**, with 12 still unresolved — so the floor moved 7× and its
ceiling is 19.

## 1. What held

| | |
|---|---|
| **P1 CONTROL** | `unit-526`'s frozen arm driven **unchanged** as a child at this pin: exit **0**, its own published-key figure **58**, this arm's sliced PUBLISHED reading **58** — **delta 0**. Its T-POP 655, mine 655. |
| **P2** | PUBLISHED reading over T-POP today: **58**, registered [58, 70]. `unit-522`'s figure reproduces **exactly**, one day on. |
| **P3** | T-POP **655**, registered [654, 668] — one file of growth. |
| **P7 / P10** | **KP/KN 7 of 7.** Three positives **sliced from the real 28** at their cited lines (not typed); four planted negatives, including the `bytes.length` subject-name case and arm C's own known false-positive shape. |
| **P9** | the cure **refuses** `scripts/measure-marker-floor.mjs:296` — arm C's own false positive, where `bytes` is a division operand in a previous interpolation. |
| **P11** | the cure **loses 0** — it is purely additive, as a disjunct must be. |
| **P12** | vacuity floor: **14,999** `.length` occurrences in T-POP. |

## 2. THE KEEPER — "the 28" is four mechanisms, and the cure owns one of them

`posthoc-four-mechanisms.mjs` partitions all 28 with a **fall-through bucket printed even when
empty**. **28 of 28, every site in exactly one bucket:**

| bucket | n | what it is |
|---|---|---|
| `A-ALREADY-PUBLISHED` | **0** | printed anyway — an empty bucket is a measurement |
| `B-CURED-ADDS-IT` | **12** | the prefix form the cure was built for |
| `C-REGION-FILTER(IDENT-IN-CODE)` | **9** | **the cure SELECTS these. The census's `LABEL-IN-STRING` filter discards them.** |
| `D-BRACE-CUT` | **0** | printed anyway |
| `E-TOKEN-GLUED-TO-IDENTIFIER` | **2** | `stderrBytes=`, `stdout_bytes=` — `\bbytes\b` cannot see a token welded into an identifier |
| `F-SEPARATOR-OR-SUBJECT-CLASS` | **3** | a bare token too far from the `.length`, across text the subject class rejects |
| `G-NO-TOKEN-IN-HEAD-AT-ALL` | **2** | the token is in a *previous* interpolation; the `}`-cut is right to refuse |

**`C` is the finding inside the finding.** `KP2` **PASSED** — it wanted `IDENT-IN-CODE` on
`bytes: src.length,` and got it. So the cure sees all nine; what drops them is the census's region
filter, inherited unchanged from `unit-522`. The arm printed one label, `REFUSED by the cure`, over
all 16 non-recoveries. **That label is false about the cure for 9 of the 16.** *A single
non-recovery label fuses mechanisms, and the one that reads like your own key's failure may be a
filter you inherited.*

**So the prefix-form blindness, priced honestly: 12 recovered + 5 reachable by a wider prefix key
(E and F) = 17 of 28 live in the prefix mechanism at all.** The remaining 11 are a region-filter
question (9) and two sites arm C should never have selected (2).

**And what I registered was wrong for a reason I can name.** P4 said [28, 140] and P5 said ≥24 of
28. I had **read every one of the 28 lines** — §1 of the pre-registration says so explicitly, so
this is not a blindness, it is a misreading of what I had read. *Twenty-eight lines that share a
surface shape — a unit word to the left of a `.length` — do not share a mechanism, and reading all
of them is no protection, because the shape is what is visible and the mechanism is not.*

## 3. AGAINST ME, TWICE, INSIDE MY OWN INSTRUMENTS

**(a) The post-hoc's E/F sub-split was wrong on its first drive, and F reading 0 is what caught it.**
Drive 1 asked `\b(?:B|b)ytes?(?=[A-Za-z0-9_])` for "is the token glued to an identifier". The
optional `s` lets `byte` match the **prefix of `bytes`** while the lookahead sees **that very `s`** —
so `bytes attributable to…` read as glued. E was **5**, F was **0**. Driven, not reasoned: the
expression returns `"byte"` on three of E's five members. Repaired to read maximal identifier runs
and ask whether any occurrence stands alone; E **2**, F **3**. **The repaired sub-key now has its
own 6-cell gate (`PH0`), which drive 1 did not have.** *A bucket built to stop one fusion fused two
one level down, and an empty bucket in a partition that must be non-empty is the only thing that
shows it — which is why they are printed at 0.*

**(b) `P8` HIT off an evidence detector I hand-typed in the arm and never graded.** `BUF_DECL` was
written to flag a Buffer-shaped declaration and the arm reported **3**, and graded P8 on it.
`PH4` gives it the KP/KN set it should have had: **4 of 5 — it FAILS `BN2`**,
`const sliceText = readFileSync(join(REPO, SLICE), 'utf8')`. The negative lookahead `(?![^)]*utf8)`
cannot cross the `)` of the nested `join(...)`, so a **string** reads as a Buffer — and that is the
exact shape of two of the three sites the arm credited.

Under the repaired detector the figure is **2**, and **the membership changed rather than shrinking**:
it drops `round434:71` and `round435:95` (both false) and **adds**
`unit-497paddedlabelclosure…/posthoc-whose-bytes.mjs:61`, where `const wide = spawnSync(…, { encoding:
'buffer' })` makes `wide.stdout` a genuine Buffer. *A decontamination fix removes false credits and
can hand you a true one you never had — so recount the members, not just the total.* **P8's claim
survives (`PH6`); the count it was granted on does not (`PH7`).**

## 4. THE HAND-READ — P13 REFUTED, and the refutation is the useful part

Registered: **[18, 27] true mislabels among the 28**. **Established: 9. Not established: 12.**
**REFUTED.** Verdicts below are mine, read off `ARM.out` §7's printed evidence plus five subject
declarations I opened directly this fire (`unit-464cure3:160`, `unit-464steal:196`, `unit-518arm:45`,
`chainfloor-a`'s `git()` helper at :70, `probe-baseline:18`); the arm supplies evidence and does not
judge.

**TRUE MISLABEL — a UTF-16 code-unit count printed as "bytes" (9):**
`round434…:71` and `round435…:95` (`readFileSync(…, 'utf8')`) · `unit-464cure3…:167` and
`unit-464steal…:203` (`execFileSync(…, { encoding: 'utf8' })`) · `chainfloor-a:129` (`git()` returns
`r.stdout` under `encoding: 'utf8'`) · `chainfloor-bc:194` (`readFileSync(LIVE, 'utf8')`) ·
`unit-516…:94` (`priorSrc.slice()`) · `unit-518arm:50` (`spawnSync(…, { encoding: 'utf8' })`) ·
`unit-518posthoc:57` (`probeSrc.slice()`).

**CORRECT CODE — genuinely bytes, so arm C is wrong (3):**
`unit-497…:61` (`encoding: 'buffer'`) · `unit-503…:83` (`readFileSync` with **no** encoding) ·
`unit-503…/probe-baseline:21` (`buf` is a **parameter**, fed `spawnSync` stdout with no encoding, and
`buf.toString('utf8')` on the next line proves it).

**NOT A BYTE CLAIM AT ALL — the token labels something else on the line (4):**
`unit-464bucket:157` (`bytes` is a `padEnd` column header; the number is a variant count) ·
`unit-464cure3:242` (`(raw/comments/bytes)` names three figure kinds; the number counts moved figures) ·
`unit-490…:272` (a parenthetical describing the criterion; the number is a member count) ·
`scripts/measure-marker-floor.mjs:296` (`bytes` is a division operand; the number is a file count).

**UNRESOLVED (12)** — `round419:45`, `round420:120`, `unit-465attestdenial:234`,
`chainfloor-a:169`, `unit-465declprose:25`, `unit-500:60`, `unit-500:61`, `unit-503:84`,
`unit-464gentry:107`, `unit-510:93`, `unit-513:164`, `unit-514:64`.

**So: 7 established false positives against the floor of 1 I published yesterday, and the true count
is in [7, 19]. True mislabels are in [9, 21].**

**THE KEEPER, AND IT IS WHY P13 FAILED:** I registered [18, 27] expecting the hand-read to be
decidable from the evidence the arm prints — the subject's declaration **in the same file**. For
**12 of 28 the subject has no in-file declaration at all**: it is a function parameter (`r`, `buf`,
`v`), a helper's return (`drive()`, `read()`), or a destructure. The in-file declaration search is
blind to **43%** of the population it was built to judge, and in an instrument corpus — where
everything is a child process result threaded through a helper — that is the *majority* form, not an
edge case. *An evidence key for a hand-read needs its own coverage figure before the hand-read's
size is registered; "I will read the declarations" assumes a declaration is there to read.*

## 5. The cure, for whoever wants it

Nothing here edits `unit-522`'s or `unit-526`'s frozen arms (settled 11/20). The cure is one added
disjunct, with its 7-cell gate, in `arm-prefixform.mjs:§2`:

```js
const PREFIX_UNIT = /\b(B|bytes|byte)\b(?:\s*[:=]\s*|\s+)(?:\$\{)?[A-Za-z0-9_$.\[\]'"`()?|&!\s+\-]{0,40}$/;
// head = line.slice(0, idx); headCut = head.slice(head.lastIndexOf('}') + 1)
```

Over T-POP 655: PUBLISHED **58** · PREFIX **17** · **BOTH 0** · union **72** · **ADDED 14** · LOST **0**.
`P6` (sites with a token on *both* sides) registered `> 0` and measured **0** — **REFUTED**, and it is
a clean small fact: in 655 files nobody labels a `.length` on both sides at once.

Of the 14 added, **12** are among `unit-526`'s 28; the other **2** are sites arm C never selected,
both printed whole in `ARM.out` §8 so the over-reach is auditable rather than asserted.

## 6. Open

- **Closed:** the prefix-form blindness is cured, priced, and its reach is **12 of 28 recovered, 17
  of 28 in the mechanism at all**. The hand-read's established verdicts stand at **9 / 3 / 4 / 12**.
- **New, mine, unblocked:** the **12 UNRESOLVED** sites need a subject resolver that follows a
  parameter to its call site and a helper to its `return`. That is the same cross-file reach
  `unit-527` §6's default-parameter item wants, from the other end.
- **New, mine, unblocked:** **`C`'s 9 sites** are a *census-purpose* question, not a reader question —
  `unit-522`'s `LABEL-IN-STRING` filter deliberately excludes `IDENT-IN-CODE`, and `bytes: src.length`
  in an object literal is as real a mislabel as one in a template string. Whether the filter should
  hold is a decision about what the census is for.
- **New, nobody's:** a token-shape widening for **E** (2 sites, `stderrBytes` / `stdout_bytes`) and
  **F** (3 sites, bare token across rejected text). Five members, both shapes named and listed.
- **Not landed, deliberately:** the repaired `BUF_DECL` lives in the post-hoc. The arm's capture
  keeps the wrong figure of 3, with §3(b) above saying why — a capture is not edited after the fact.
- **xian's, and only his:** item 10. This unit adds nothing to it.
