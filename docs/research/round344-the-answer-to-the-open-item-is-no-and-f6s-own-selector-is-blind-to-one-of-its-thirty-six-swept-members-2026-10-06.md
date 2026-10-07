# Round 344 — the open item answers **no**, and finding that out cost F6 a hole in its own swept denominator

**Theseus · 2026-10-06 STOP fire · baseline `origin/main` at `4142a441`, clean, `HEAD == origin/main`**

The three head commits at `4142a441` are **Iris's, Iris's and Argus's** — `%an`-checked before
reading any as mine. My own last commit is `474f13d1` (Round 342 wrap), four commits back.

Daedalus closed Round 343 with one open measurement and routed it to Argus:

> **does any probe anywhere in the 145-file fleet write a MEAS label the widened counter still
> cannot read?** I checked the 99 renderings in label position; I have **not** checked the fleet for
> colon-form or abutted-bracket MEAS spellings as a population.

Argus's 19:3x STOP fire was a verification no-op and did not take it (read in their own log, not
inferred from the commit subject). It was still open at the start of this fire, so I took it.

**The answer is no, and the way the population had to be built to answer it turned up a second
thing.**

---

## 1 — Daedalus's figures, reproduced under his own key first

| claim | his | mine |
|---|---|---|
| probe files top-level (the "145-file fleet") | 145 | **145** |
| code files under `scripts/`, recursive | 194 | **194** |
| code files top-level | 175 | **175** |
| `SWEPT` entries | 36 | **36** |
| `DEFERRED` entries | 109 | **109** |
| MEAS-mentioning renderings | 99 in 94 files | **99 in 94 files** |

Counts derived from a **node directory walk**, not a grep. `renderMeasMentions` copied verbatim from
`probe-round269:322-334` and run over `stripSource(src, false)` for all 194 code files: **99
renderings in 94 files**, exact. The harness was graded against a known positive copied from the
real `probe-round225` call shape before any figure was read off it.

Both counters were graded too, against all nine rows Daedalus published (the four fleet spellings,
today's d2 fixture, and the four CURE-B survivors) — all nine reproduce before either counter was
pointed at the tree.

---

## 2 — Answering the question required a key that does not share his denominator

`renderMeasMentions` selects on the MEAS token appearing **literally inside a `console.log`'s first
backtick-or-single-quote argument**. That is a narrower thing than "the fleet writes a MEAS label",
and the question as asked is about the second. Two keys that share a selector agree vacuously, so I
built one that selects differently: **every MEAS token lying inside a string-literal body**, with
literal bodies located by the vetted tokenizer in `scripts/lib/strip-source.mjs` (diffing its
`blankStrings` modes) rather than by a hand-rolled scanner.

Graded on six fixtures, including the three shapes his key structurally cannot see
(double-quoted, assembled-in-a-variable, MEAS-in-a-later-argument). **One of my own fixtures was
wrong** — I asserted `console.log('head:', 'MEAS [F] a')` should yield 2 and it yields 1, because
the detector counts tokens and not arguments. The harness caught my spec, which is the point of
grading it.

**Key 2 over all 194 code files: 180 MEAS occurrences inside string literals, in 97 files.**

### Member lists, not counts

94 files vs 97 files is a three-file gap, but the counts are not comparable (renderings vs tokens),
so the file **member lists** were diffed:

**In my key, not in his — 4 files.** `probe-round255`, `probe-round280`, `probe-round281`,
`sweep-probes.mjs`.
**In his key, not in mine — 1 file.** `geometry-distance-arm.mjs`, whose MEAS is `MEASURED.length`
*inside* a `${…}` interpolation — code, not template text. His `[^`]*` span swallows interpolation
source; mine correctly excludes it. This is the false mention Round 342 already named at `:102`, so
my key is right to drop it and his over-includes.

A later pass on the full occurrence list added `probe-round282` and `probe-round284` to the same
class as 280/281.

---

## 3 — One detector of mine failed toward a FALSE defect, and this is how it was caught

The first span extractor walked outward from the token while `blank[i] !== keep[i]`. `stripSource`
emits `${` and its closing `}` **verbatim** — they are code structure, not template text — so the
walk halted at the first interpolation and returned the bare string `"MEAS"` for every
interpolated rendering. Classified on that, **146 of 180 occurrences came back as "label position,
uncountable even after CURE B"** — a 146-member answer set to a question whose true answer is zero.

It was caught because the fixtures are real call shapes copied out of the tree rather than minted
ones. `console.log(\`MEAS [${arm}] ${name} — ${detail}\`)` is the single most common emitting line
in this fleet (16 sites); a span extractor that cannot survive it is not graded. The repaired walk
steps over a balanced `${ … }`, and the diff-based body test turns out to be unusable for spans
anyway — a space inside a string blanks to a space, so body and non-body are indistinguishable at
that character.

**So the span route was abandoned, and the residue was hand-read instead.** 180 occurrences collapse
to **96 distinct source-line shapes**, every one of which was read. That is the primary reading; the
driven table in §5 grades it.

---

## 4 — The finding: F6's selector is blind to one of its own 36 SWEPT members

`probe-round255-the-comment-shadow-census.mts` is **SWEPT**. It emits a measurement label:

```js
const tag = r.kind === 'measurement' ? 'MEAS' : r.pass ? 'PASS' : 'FAIL';
console.log(`${tag} [${r.arm}] ${r.check}`);          // probe-round255:171-172
```

`renderMeasMentions` returns **0** for this file. Driven over all 36 swept files, resolved 36 of 36:

```
CLAIM 1 — swept files where F6's selector sees 0 but a MEAS literal is present:
  SWEPT resolved: 36 of 36
  BLIND  probe-round255-the-comment-shadow-census.mts  (his 0, mine 1)
  total: 1
```

**F6 grades 35 of its 36 swept files.** His detector has a special case —
`raw.replace(/\$\{[^{}]*'MEAS'[^{}]*\}/g, 'MEAS')` — that rescues an **inline** ternary yielding
`'MEAS'`, which is why `probe-round224` and `probe-round224b` *are* visible. Round 255 hoists the
same ternary into a variable one line earlier, and `${tag}` carries no literal, so it renders as
`X […]` and is dropped for not containing MEAS.

**This is not a red today.** The line renders `MEAS [A] the check text`, and the live counter reads
it as **1** — driven, not reasoned. F6 is vacuously right about round255.

**It is still worth fixing, and the reason is F6's own charter.** F6 exists because
"F1 can only ever grade the spellings someone remembered to put in it" — an arm whose fixture is its
own hypothesis cannot fail on a case nobody thought of. A selector that silently drops a member of
its own population has the identical defect one level up: it cannot red on a spelling it cannot see.
The next swept probe that hoists its tag and happens to write an uncountable spelling is invisible
to the arm built to catch exactly that.

**The same blindness covers a second shape, and it is four files wide.** `probe-round280`, `281`,
`282` and `284` emit every measurement through a helper:

```js
const record = (id, outcome, text) => {
  …
  console.log(`[${outcome === 'PASS' ? 'ok' : outcome === 'FAIL' ? 'FAIL' : outcome}] ${id}  ${text}`);
};
record('A1', 'MEAS', `…`);
```

The MEAS branch of that ternary is the bare variable `outcome`, so the inline-ternary special case
does not fire either. All four render `[MEAS] A1  text` — **countable**, verified by reading each
helper rather than assuming the family (284's `record` is genuinely a different function from the
other three, and had to be read separately). All four are **DEFERRED**, so they sit outside both his
99 and his 2254 driven lines — the double blind spot. They matter at **promotion**, which is the
exact scenario Round 341 was about.

---

## 5 — CLAIM 2, the answer to the open item: **no**

Every distinct rendered label shape in the 145-file fleet, hand-read from all 96 source-line shapes,
then driven through the live counter and CURE B:

```
  live  cureB  shape
  1     1      "MEAS [X] X — X"                   probe-path-c + 15 more
  1     1      "  [X] MEAS  X"                    round300 + 15 more
  1     1      "  [X] MEAS  X\n        X"         round240 + 13 more (multi-line)
  1     1      "  [MEAS] X"                       round176 + 8 more
  1     1      "  [X] MEAS  X"                    round283 + 8 more
  1     1      "  [MEAS] X: X"                    round195 + 7 more
  1     1      "  [X] MEAS  X"                    round261 + 4 more
  1     1      "  [MEAS] X: X"                    round203 + 2 more
  1     1      "[MEAS] X  X"                      round280/281/282/284 record() — DEFERRED, invisible to his key
  1     1      "[MEAS] X"                         round295 + 2 more
  1     1      "  MEAS [X] X"                     round224/224b tag-variable form
  1     1      "[MEAS] X  X"                      round295/296
  1     1      "MEAS [X] X\n         X"           round231 (multi-line)
  1     1      "MEAS [X] X"                       round255 tag-variable form — SWEPT, invisible to his key
  0     1      "  MEAS X"                         round196:457 — known uncountable member
  0     1      "MEAS X — X"                       round221:53 — known uncountable member

  shapes still uncountable after CURE B: 0
```

**Zero.** Fourteen of the sixteen shapes are already countable live; the two known members
(`probe-round196:457`, `probe-round221:53`) go 0 → 1 under CURE B, exactly as priced in Round 342.
**No colon-form, no abutted-bracket, no bare-MEAS label exists anywhere in the fleet** — not in the
99, and not in the four-file `record()` class and the one swept file his key could not see.

### What this settles, and what it does not

**Settles:** Daedalus's decline to re-fixture d2 was right, and is now right on a measurement rather
than an inference. `MEAS: 7ms` has no reachability figure because the shape has **zero** members in
194 code files, measured under a key that was built specifically to see what his could not. A d2
replacement in that form would be invented. His asymmetry argument holds in full.

**Does not settle:** this is a source-population answer, not a driven one. 109 probes are DEFERRED
and were not run — driving them in a STOP fire would bind ports and is not proportionate. A label
assembled from non-literal pieces (`'MEA' + 'S'`) is invisible to **both** keys; I found none and
cannot rule one out. Stated as a limit rather than left for a later round to discover.

---

## 6 — Gate

See the session log for the full gate block. No code landed this fire: `git diff --stat` on
`scripts/` and `packages/` is empty. Everything above is measurement over the tree as committed.

---

## 7 — Open

- **Closed:** the Round 343 open item. The answer is **no**, measured over a wider population than
  the one it was asked about. CURE B's d2 blocker therefore cannot be resolved with a real fixture,
  and Daedalus's judgement stands unchanged.
- **New, routed to Daedalus as the seat that owns the arm — priced, not applied:** F6's selector
  drops `probe-round255` from its own swept denominator (35 of 36 graded), and the same blindness
  covers the four-file `record()` class at promotion. **CURE C**, the smallest form: make the
  rendering pass substitute a hoisted single-assignment `'MEAS'` tag, or — cheaper and more honest —
  add a *selector-coverage* premise to F6 asserting that the number of swept files carrying a MEAS
  string literal equals the number its own renderer can see, so the hole reds instead of hiding.
  **I have not built or priced CURE C against the real harness, and I am not claiming it is
  correct** — a routed finding does not validate its routed cure, which this track has now been
  bitten by twice. The finding is measured; the cure is a suggestion.
- **Nothing in this round needs a decision from xian.** Argus's CIO Laya/AAXT reply still asks xian
  to schedule that spike — unmoved, re-checked in `docs/mail/`, not carried from Daedalus's memo.
