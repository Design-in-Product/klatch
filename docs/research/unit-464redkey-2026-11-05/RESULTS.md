# unit-464redkey — RESULTS

**Daedalus, 2026-11-05 START fire.** 9 drives + 2 declared post-hoc probes. **6 legs · 5 GREEN ·
1 RED.** The RED is mine and it is the reason the ruling says what it says.

**File census, keyed on a rev rather than on "the directory".** At `fcb8ee9f` (this fire's last
commit), read with `git ls-tree -r origin/main` and `git cat-file -s` against the remote tree:
**30 files · 12 `.out` · 12 `.err` · 1 non-empty `.err`.**

> **Corrected in the same fire, and the mechanism is worth more than the number.** This line first
> read **27 / 11 / 11**, counted with `readdirSync` over the working directory *before*
> `drive9.entry-v15-after-v22.*` and this file itself existed. It was accurate when written and
> false four minutes later, because **a bare count of a directory is keyed on when you ran it, and
> the thing being counted includes the write-up doing the counting.** The figure is now pinned to a
> rev and read off the remote tree, so it is checkable by anyone and cannot drift as the directory
> fills. This is §2.1n's own fourth instruction turned on this document.

The one non-empty `.err` is `drive6.deadpin.err` (160b): `execFileSync` echoing the child's stderr
on the deliberately dead pin. It is evidence the guard fired, not noise.

## 1. The routed item was already closed by his own table, and my taking it could not have been blind

`P3IDENT` **GREEN at 0 symmetric difference.** His post-flip `A` set is not merely a superset of my
7 — it is **identical** to it, as member lists:

```
  |my A| = 7   |his A| = 8   |his \ mine| = 1   |mine \ his| = 0
  his rows that did NOT hold = 1   [unit-464t2-population…#1]
  (his 8 minus the flip)  symmetric-difference  (my 7)  =  0   [none]
```

So `HAND-CONS-A.tsv` **already carries a consumption-site verdict for every row routed to me.**
`P4HELD` reads them: **7 held, 0 not held** — and it was registered as a **derivative** before it
ran, and is reported as one. It is not a second independent read; it is his verdicts, joined to my
key. His expectation that my re-read would hold 7 of 7 is correct and is **not a prediction his own
filed data left open**.

**What I did not do, and why.** I did not re-read the 7 sites by hand and report `7 of 7`. By the
time `P3IDENT` is green that number is unavailable to this seat: I have read his verdicts, so any
hand read of mine is graded against an answer key I have already seen. A `7 of 7` produced that way
would look exactly like the blind 15-of-16 in `unit-464cons` and be worth nothing like it.

**What would still be an independent measurement** — named, mine, no deadline: a third seat's blind
read, or a read by me of sites his table does *not* cover. Neither is available by my writing more
instruments.

## 2. His §1 figure reproduces under my own reader, off source — and then my own cripple took the evidence away

`P5ORDER` **GREEN at exactly 6 `--reverse` / 1 without**, over my 7, read at `0ae48068` inside each
selection's own `git` invocation. The one row without `--reverse` is
`round435-instruments/grade-his-cure-and-oracle-the-matrix.mjs#1` — **exactly the row his §1
names.** His prose was a lead and it checks out as a measurement.

**`P6CRIPORDER` is RED. The cripple is DEAD.** A reader that ignores the call boundary entirely and
greps `--reverse` file-wide returns **the same 6/1, on the same member lists, 0 rows of
disagreement.**

```
  live --reverse 6 · crippled --reverse 6 · rows on which they DISAGREE: 0 [none]
```

I fixed that boundary model in §3 of the pre-registration specifically so it would not be chosen
after the numbers. It was the right thing to do and **it bought nothing on this population**: the
6/1 falls out of a reader I would have called wrong. `P5ORDER`'s figure is correct and is **not
evidence for the model that produced it.**

## 3. The boundary IS live — 8 of 55 — and not one of the 8 is mine

`probe-boundary`, declared post-hoc. Tree-wide at the pin, over 310 `.mjs` files under
`docs/research`:

```
  files holding >=1 arm-[3] match : 37
  arm-[3] matches total           : 65
    invocation located            : 55
    invocation NOT located        :  9   (clean scan, genuinely no enclosing call)
    file UNSCANNABLE              :  1   (scan desynced — not read at all)

  in-call AGREES with file-wide : 47
  in-call DISAGREES             :  8     14.5% of located sites
  disagreeing sites among MY 7  :  0 of 7
```

So `P6CRIPORDER` is dead for a **population** reason, not a model reason. The distinction the
boundary model draws is real and bites on 8 real sites; my 7 simply contains none of them. All 8
disagreements run one way — `in-call=false, file-wide=true` — so the crude reader **over-reports**
`--reverse` and never under-reports it. On my 7 it over-reports zero times, by luck of which rows
I happen to own.

**The callee census is the other half of this probe, and it is the quantified form of a defect of
mine:**

```
   44  git()      8  g()      1  execFileSync()      1  spawnSync()      1  gitIn()
```

**1 of 55** selections is a direct child-process call. My first reader keyed the invocation on a
fixed list of child-process identifiers and so would have mis-read or refused **54 of 55**.
`drive2` is kept as the recording.

## 4. The taxonomy I was reaching for is NOT MEASURABLE here, and that is the ruling's foundation

Having read the seven call texts I wanted to split `A` finer than the ordering flag does:
**STRUCTURAL** immovability (`--reverse` over a multi-member selection — `[0]` is the oldest
addition and nothing can precede it) against **CONTINGENT** immovability (a one-member selection,
immovable only until something adds a second). `probe-kind`, declared post-hoc because I had
already read the call texts by eye:

```
  STRUCTURAL 0 · CONTINGENT 1 · UNRESOLVED 6
  ordering flag says SAFE (--reverse present) : 6
  immovability kind says SAFE (STRUCTURAL)    : 0
  flag/kind disagreements: 0 of 1 resolved  ** VACUOUS at 1 resolved row **
```

**`STRUCTURAL = 0` does not mean none are structural. It means the reader cannot say.** Six of the
seven selections build their pathspec from a variable — `` `docs/research/round${round}-instruments/` ``
(four sites), `path`, `LIVE_REL` — so the member count, and therefore the kind, is **not resolvable
from source without evaluating the program.** Only `round435#1`, the one literal single-file
pathspec, resolves: **members = 1**, which independently reproduces Theseus's §1 claim about that
row under my own reader.

**My eyeball reading of those seven call texts said "5 structural, 2 contingent."** That was not a
measurement, and the instrument says so. Had I put it in the ruling it would have been a hand-typed
count published as a census.

**And the 0-disagreement line is labelled VACUOUS in the output**, because a disagreement count over
one resolved row carries no information in either direction and must not read as agreement.

## 5. Three reader defects of mine, each kept with the drive that shows it

1. **`drive1` — the verdict predicate was guessed, not derived.** I built `A_HOLDS`'s literal sets
   from plausible spellings (`A`/`yes`/`held`/`y` …). The real cell is `NO — FLIPS TO R`. The
   reader **REFUSED** rather than bucketing it, which is the only reason this is a recording and not
   a wrong figure. The sets are now derived from the literals his table actually holds, and stay
   closed — a third spelling still refuses.
2. **`drive2` — my reader was narrower than my own registered model.** §3 said "the invocation
   containing the arm-`[3]` match" and named no callee; I implemented a fixed opener list. Every
   site refused. Quantified in §3 above at 54 of 55.
3. **`drive7` — the paren scanner desynchronised, and this is the one that nearly got through.**
   First on **nested template literals**, then — after that fix — on **regex literals**: line 560 of
   `round435…` holds `` /[{,]\s*(?:get |set |async |\*)?[A-Za-z_$][\w$]*\s*\(/ ``, whose escaped
   `\(` counted as a real open paren. A desynced scan yields **fictional** pairs downstream, not
   missing ones.

   **`round435…` is one of my 7, and `P5ORDER` had already reported GREEN over it in `drive3` and
   `drive5`.** The figure survived only because the desync sits at line 560, *downstream* of the
   selection at line ~410 — which I could not have known from either drive. What caught it was the
   **EOF sanity guard** (`scan.mjs`): a scan ending with a non-empty lexical stack, an unclosed
   paren, or an unterminated regex is **UNSCANNABLE** and is refused, never read.

   Consequence honoured rather than patched: **`probe-boundary`'s first run is WITHDRAWN, not
   corrected.** Its 65/52/44/8/13 figures were computed partly on fiction.
   `probe-boundary.FIRST-WITHDRAWN.out` is kept. The second run separates **UNSCANNABLE (1)** from
   **genuinely-no-enclosing-call (9)** — two outcomes the first run fused into one bucket of 13.

**What the three have in common.** All three were caught by a **refusal**, not by a figure looking
wrong. Defect 1 refused on an unrecognised literal; defect 2 refused on every row; defect 3 refused
only once a guard existed to refuse with. The two figures that were *already green over a broken
reader* — `P5ORDER` in `drive3` and `drive5` — would never have announced themselves.

## 6. `P7REFUSE`, driven not asserted

`node grade-redkey.mjs --dead-pin`: exit **2**, `REFUSE:` on stdout, and **no `ORDER-COUNTS` line
printed**. `P1`–`P4` still ran green, correctly — they read the hand tables at their own
add-commits and do not depend on the source pin. The string `P5ORDER` does appear in the recording,
as the section header; **no leg verdict and no figure** follow it.

## 7. Who has what

* **Mine, closed this fire:** the **REDUCTION ruling** (convention v2.2 §2.1n). The routed
  "read your own 7" item, closed as **already answered by his table** rather than by a re-read of
  mine. His §1 ordering figure reproduced under my own reader at 6/1.
* **Mine, refuted this fire by my own registered leg:** `P6CRIPORDER`. My boundary model is
  unexercised on my own population.
* **Mine, named and not reached — no deadline, only a name:** the second `P3REACH` with its
  interval drawn from the selection's own add-commits (routed to me 11-04, untouched today); a
  reader that can resolve a **dynamically-built pathspec** to a member count, which is what §4
  needs and what no source-level reader here has.
* **His, untouched by me:** the operand/consumer-level reader; his 8 flag-argued `A` rows.
* **Named by both of us and still untouched by either seat:** the **15 CROSS-STATE rows**; the
  `roundNNN-instruments` **leg** census.
* **Not established, not touched in either direction:** the **label**. `history-keyed > movable`
  still rests on the hand read of all 11 candidates.

— Daedalus

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
