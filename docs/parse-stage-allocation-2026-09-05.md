# Round 156 — inside the parse stage, and the caveat I filed in Round 154 was worth 27%

**Daedalus · 2026-09-05 (WORK/MID fire) · Round 156**
**Instrument:** `scripts/probe-parse-stage-allocation.mts`
**54 checks (13 regression, 41 measurement), 1 failed by design, 0 skipped.**
**`klatch.db` never opened; `parser.ts` full-content-compared byte-identical before and after; `packages/` untouched.**

## What this round took

Round 154 (`docs/accepted-multipart-allocation-2026-09-05.md`) decomposed the 9× accepted-multipart
peak into four stages of roughly 2× each and left two items open, both explicitly mine:

1. *"The 2.13× inside `parseClaudeCodeSessionFromContent` — measured as a total, not decomposed."*
2. *"Synthetic-payload caveat: every figure is a function of byte count **except** the parse arm,
   whose 2.13× is for 42,411 single-line events. A corpus heavy with tool artifacts could parse to a
   different multiple. **Not measured.**"*

They are the same question twice — is the parse cost paid per line, per byte, or per something
else — so this round took both. **The caveat was not hedging. It bites at 61% on the parse marginal
and 27% on Round 154's published end-to-end multiple.**

## The control Round 154 did not have

Two payloads at **identical byte count** (37,117,377 B = 35.4 MB) and very different line shape:

| | real corpus | synthetic (Round 154's shape) |
|---|---|---|
| bytes | 37,117,377 | 37,117,377 |
| lines | 14,049 | 33,140 |
| mean bytes/line | 2,642 | 1,120 |
| longest line | **945,942 chars** | 1,119 |
| chars above U+00FF | **56,219** (0.15%) | **0** |
| turns parsed | 192 | 33,140 |

The real payload is the largest session under the import cap on this machine, of 523; it is read in
place, never copied, and only counts and timings leave the probe. The synthetic is Round 154's
generator truncated to the real file's exact size.

A third payload exists for arm G: **the synthetic with three ASCII bytes overwritten by the three
UTF-8 bytes of `…`.** Same byte count, same JSONL, one character different.

## Headline — the route's own pipeline, on a real corpus

Arm R re-drives **Round 154's own child stages, unmodified**, at both payloads. This is a
measurement, not arms added across rounds — the arithmetic-not-a-measurement trap Theseus named for
the two-root union in Round 155.

| route stage | real | synthetic | gap |
|---|---|---|---|
| `req.formData()` | 3.66× | 3.61× | — |
| `+ file.arrayBuffer()` | 5.66× | 5.67× | — |
| `+ Buffer.from(ab).toString()` | **7.58×** | 6.57× | **+1.01×** |
| `+ parseClaudeCodeSessionFromContent` | **11.06×** | 8.73× | **+2.33×** |

Two things to read off it.

**Round 154's number reproduces.** The byte-matched synthetic gives **8.73× against Round 154's
published 8.60×** — 1.5% apart, at a different payload size (35.4 vs 45.3 MB). The Round 154
decomposition was not wrong.

**It was unrepresentative.** A real corpus is **11.06×**, so the published figure **understates a
real upload by 27%**. The two corpora are identical through `formData()` and `arrayBuffer()` — those
handle bytes — and diverge at the **first stage that makes a JavaScript string**.

## Why: one character above U+00FF costs a whole extra copy

V8 stores a string one byte per character only if **every** character is Latin-1. A single character
above U+00FF anywhere promotes **the entire string** to two bytes per character.

Arm G tests this with the one-character payload:

```
content floor  135.5 MB (pure ASCII)  ->  171.0 MB (one char above U+00FF)
               = +35.5 MB on a 35.4 MB payload = 1.00x
```

**Three ASCII bytes replaced by one `…` cost 35.5 MB.** That accounts for **100%** of the
real-vs-synthetic floor gap (real floor exceeds ASCII-synthetic floor by 35.4 MB), and it matches
the `bufferToString` divergence in arm R to two decimal places (+1.01×).

**This is the common case, not an edge case.** Scanned across `~/.claude/projects` this fire:

```
sessions scanned        523
with a char > U+00FF    519  = 99.2%
their share of bytes    100.0%
total corpus            549 MB
```

**519 of 523 real sessions, and 100.0% of corpus bytes.** Round 154's pure-ASCII synthetic was the
unrepresentative payload; a real import is the default.

## Inside the parse stage — it is object graph, and there is no copy to remove

Stage-by-stage, fresh child process each, memory reported as the delta over the interpreter's own
resident set (Round 154's convention, so the multiples are comparable):

| stage | real | synthetic | what it adds |
|---|---|---|---|
| `content` (floor) | 171.0 MB | 135.5 MB | the string the route hands the parser |
| `+ split('\n')` | 171.7 MB | 136.5 MB | **+0.8 / +1.0 MB** |
| `+ .trim()` each | 171.8 MB | 139.1 MB | **+0.1 / +2.6 MB** |
| `+ JSON.parse` (= `parseJsonlContent`) | 257.3 MB | 196.3 MB | **+85.5 / +57.2 MB** |
| `+ parseEvents` (= the route's call) | 272.1 MB | 210.3 MB | **+14.8 / +14.0 MB** |

**`split('\n')` is not a copy.** It adds 0.8–1.0 MB — 31–56 bytes per line — where a character copy
would be 35.4 MB. V8 hands back references into the parent string. Measured rather than argued from
V8 internals, because it is the change a fire would otherwise ship as "avoid the copy."

**`.trim()` on already-trimmed lines is free or nearly so** (+0.1 MB real): V8 returns the receiver
when there is nothing to trim, and JSONL lines have nothing to trim.

**So ~85% of the parse stage's allocation is `JSON.parse`'s object graph, and ~15% is `parseEvents`
building turns and artifacts.** There is no buffer copy hiding in the parse stage. Reducing it means
holding fewer parsed objects, which is a design change, not an optimisation.

The parse marginal on the route, arm R: **real +123.2 MB (3.48× of payload) vs synthetic +76.5 MB
(2.16×) — 61% apart.** The synthetic's 2.16× reproduces Round 154's 2.13×; the real corpus does not.
Direction is consistent with string width — the parsed object graph holds the same characters, also
two bytes wide.

## Does the cost travel between corpora? Only one normalisation does

Same trap as Theseus's arm H, and worth stating both ways rather than picking the flattering one:

- **As a multiple of file bytes** — parse peak real 7.69× vs synthetic 5.94×, **29% apart. Does not travel.**
- **As a multiple of the content floor** — real 1.59× vs synthetic 1.55×, **3% apart. Travels.**

The floor-relative one is the usable form, because the floor already absorbs the string-width
doubling:

> **peak ≈ contentFloor × ~1.57, and contentFloor is ~1× the file for pure ASCII and ~2× for
> anything containing a single non-Latin-1 character.**

**Caveat on the absolute floors, stated because it is easy to misread.** Arms B/C reach the content
string via `readFileSync(file, 'utf-8')`, which is *not* how the route gets there. Both floors carry
a constant ~65 MB of Node decode overhead above buffer-plus-string that this round did **not**
decompose; it is identical on both payloads and cancels in every comparison here, but it means the
7.69× and 5.94× are probe-local. **The route's own multiples are arm R's, and only arm R's.**

## For Theseus — arm H, and why I think the bracket is not a range to interpolate inside

Your arm H found ms-per-line and ms-per-MB bracketing in opposite directions by ~25% and concluded
*"two corpora are not enough to choose the unit,"* offering 7–10 ms per 1k above-cap lines with the
range as the precision. That is the right call on the evidence you had. **I think the evidence here
says the bracket is not a range to interpolate inside — it is the signature of a model that is
wrong.**

Your two corpora varied in lines and bytes **together**, so neither term could be isolated. Mine are
equal in bytes by construction, so a per-byte term contributes identically to both and cancels: the
whole time difference is the per-line term, and `dMs / dLines` **is** the coefficient.

```
real      14,049 lines   157 ms
synthetic 33,140 lines    81 ms      same 35.4 MB

isolated per-line slope:  -3.6 to -4.2 ms per 1k lines   (four runs)
```

**Negative, reproducibly.** At equal bytes the corpus with **fewer** lines is **slower**. No cost
coefficient can be negative — a corpus is not made faster by containing more lines. So a two-term
`a·lines + b·bytes` model is not imprecise here, it is **falsified**, and fitting one to two corpora
would have produced a confident-looking pair of coefficients with zero residual by construction and
no predictive content. I built that fit first and threw it away; the probe now reports the sign as a
**deliberately failing check** so the next reader cannot skim past it.

What is left when both units fail is **per-line structure**. The real corpus's longest line is
945,942 characters — **358× its own mean** — against 1.0× for the synthetic. Tool artifacts, deep
nesting, and heavy escaping are all per-line properties that neither a line count nor a byte count
sees.

**Two things I want to be careful about.** This measures the **parse** path, not your **scan** path;
I cannot tell you your coefficient is negative, only that the identical bracketing pattern on a
neighbouring path resolved to model-failure rather than to a midpoint. And you already have the
crucial input for your own version of this experiment: **PM's lines average 1.84 KB against
shipped's 3.08 KB.** A third corpus chosen to match one of yours in *bytes* while differing in
*lines* would run the same control on your path.

**So: don't cut arm H back.** The 25%-each-way spread is worth more than the point estimate inside
it, not less — but I would relabel the usable form from "7–10 ms per 1k above-cap lines, treat the
range as precision" to **"7–10 ms per 1k above-cap lines for corpora whose mean line falls between
1.84 and 3.08 KB; outside that bracket the estimate is unvalidated and may not even be monotonic."**

## The candidate change — real, small, and not shipped

Arm F: `parseJsonlContent` rewritten to walk the content with `indexOf`/`slice` instead of
materialising `content.split('\n')`.

| | real corpus | synthetic |
|---|---|---|
| time, 3 runs each | shipped 134/135/135 ms → candidate 108/111/112 ms — **18% saving, ranges separated** | −8%, single run |
| memory, 3 runs each | shipped 257.2/257.5/257.1 MB → candidate 224.8/253.9/254.3 MB | −0.2%, single run |

**Time: real, reproducible, ~18% of the parse stage on a real corpus.** Every candidate run beat
every shipped run, across two independent repeat batches (18%, 18%).

**Memory: ~1%, and I am not quoting the 5% the mean implies.** Two of three candidate runs sit at
253.9/254.3 MB (≈1.2% under shipped); the third at 224.8 MB is a 12% outlier I cannot explain and did
not reproduce. An earlier single unrepeated sample showed −12.3% and the next showed −0.9%, which is
exactly why the arm now takes repeats. **Call the memory saving ~1%.**

**Not shipped, and the number is the reason.** 18% of a 205 ms parse stage is ~37 ms on a request
that Round 151 measured end to end in the seconds — roughly 1% of the import. That does not justify
touching a correctness-critical parser. Equality between the two shapes was verified on **event
count and skipped-line count only**, on both payloads; **structural deep-equality was not checked**,
and it would need to be before this shipped. Filed as available and costed, not as a to-do.

## What this means for the cap, which is xian's call and not a request

Round 154 priced the 50 MB cap's implied peak at ~420 MB from the 8.60× synthetic figure. **On the
real multiple of 11.06× the implied peak is ~550 MB.** That is a **linear extrapolation** from 35.4
MB, not a measurement — and worth noting, **the largest real session on this machine is 35.4 MB**,
so 50 MB is above anything actually present in 549 MB of corpus.

Nobody has said ~390 MB for a real 35 MB import is a problem, and I am not saying it is. The point
of the correction is only that the number on the record was 27% low for the inputs the product
actually receives.

## Method notes

- **One stage per fresh child process.** The V8-heap-sizing confound (Theseus Round 150; me, Round
  151) makes shared-process decomposition meaningless.
- **`process.resourceUsage().maxRSS`**, calibrated by arm Z against a known 200 MB before any figure
  is believed — kilobytes on this machine; assuming bytes would scale everything by 1024.
- **Deltas, not absolute peaks.** The first run of this probe reported absolute `maxRSS` and put the
  content floor at 6.97× — caught because a floor cannot exceed ~2×. ~140 MB of tsx baseline was
  sitting inside every stage. Every figure above is `peak − baseline`.
- **The dynamic-import confound is sized, not assumed away.** An empty stage costs 0.5–0.6 MB and
  importing the parser costs a further ~1.0 MB, so it is ~0.4% of the smallest figure here.
- **Arm A reports which shape is in the tree and fails only if it recognises neither.** Round 154's
  lesson: both that round's arm A and Round 151's went red the moment their own recommendations
  shipped. An arm that pins today's code as correct-by-definition is a tripwire against itself — and
  `scanNoSplit` is a candidate to replace the very line arm A inspects.
- **The probe exits 1 by design** while arm D's check fails. If a later corpus makes that slope
  positive, the check going green is itself the news.

## Open, and not guessed at

- **`formData()`'s own 3.6×** — unchanged from Round 154, still needs a request-level change. Not
  scoped, not costed, not claimed easy.
- **The ~65 MB constant in the `readFileSync` content floor** — identical on both payloads, cancels
  in every comparison here, not decomposed. It is probe-local, not the route's.
- **Why `scanNoSplit` is 18% faster on the real corpus and ~0% on the synthetic** — measured, not
  explained. The real corpus's 946k-char line is the obvious suspect and I did not test it.
- **Structural deep-equality between `scanNoSplit` and `parseJsonlContent`** — required before that
  change could ship; not done.
- **Whether a two-byte content string is avoidable at all** — the route needs a JS string to split
  on newlines. Working from the `Buffer` and decoding per line would keep most of the payload
  one-byte, but that is the same request-level rewrite as `formData()` and was not measured.
- **Whether ~390 MB for a real 35 MB import matters in practice.** Priced, not judged.
