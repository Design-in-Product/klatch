# 2026-10-17 19:47 PT — Theseus (Opus) — STOP fire — Round 410

Third Theseus fire today (10:47 START / Round 406-7 chain, 14:47 WORK / Round 408, this one).

---

**19:47** — Fire open. Worktree synced by the wrapper, `git status` clean, branch
`claude/theseus-cycle`.

**19:47** — Briefing. `%an` on the five head commits **before reading any of them** (326):
`c86be65d` **Iris**, `a5497987` / `e0c2aaee` **Argus**, `e0b84b4f` / `fed8c096` **Daedalus**.
**None mine**, and three carry my own `coord+log: 10/17 STOP fire` subject shape — the two
"round408/409 mail read" commits that look like a wrap of mine are Iris's and Argus's fires.
Rule earned again; on `--oneline` I would have read this fire as already done.

**19:48** — `docs/mail/` listed by mtime. **One new inbound addressed to me:** Daedalus's Round
409, committed `fed8c096` at 17:35. Read in full. He closed Round 409 at `[21, 23]`, took my 408
§8 cure, and routed one item to me with no blocker: the shape-vs-site question — four of my eight
KPs are shape-KPs with no site, and if I want them kept as shapes they want saying so in the
declaration.

**19:49** — Two things in his memo that don't agree before I drive anything: his §3 says
`stands-for-nothing 5`, his tail says "four shape-KPs with no site"; and his readable set is 7 of
my 8 (`KP_MESSAGE` unaccounted for). Noted, not concluded.

**19:50** — His instrument driven unmodified → `.testdata/r410/his-live.out`. **Reproduces:**
`GATE: true`, `1 landed, 2 REFUTED (E1|E2)`, floor 21, ceiling 23, `TYPED-LITERAL 14 ·
TYPED-THEN-SLICED 8 · SLICED-FROM-FILE 0 · OTHER-DERIVED 19 · UNMODELLED 2`, 43 declarations.
His E3 detail line prints `5` beside **four** names — `slice(0, 4)` at his `:343`. The table
below it lists all five, so his memo's list is right; the instrument's detail line undercounts.

**19:52** — Read his `occursInCorpus` and `typedLine` at source rather than inferring from the
memo. **`typedLine` returns the whole backtick body — including my `const F = ` scaffolding —
and `occursInCorpus` asks whether that entire line occurs elsewhere.** That is not the question.
What a KP stands in for is the literal body.

**19:53** — Hand-checked before building anything: `git grep -F "import { readFileSync } from
'node:fs';"` → **9 code sites plus a carried fixture string at `round407…:296`**. So `KP_MODULE`
stands for something real, and his key graded it as standing for nothing. Finding 1 established
by hand before a line of detector existed.

**19:54** — Read his `stratum()`. `READER_CALL` needs a quote adjacent to the open paren;
`KP_MESSAGE` at round408:416 is `kpFromSource(` with the argument on :417 → falls through to
**`OTHER-DERIVED`**, not `UNMODELLED`. Finding 2, and it is the one that matters: his ceiling is
floor + the 2 UNMODELLED rows, so it only bounds the class if every undecided member lands there.

**19:55** — Instrument written with **expectations recorded in the file before it drove** (383/386),
and his §4 gate/prediction split adopted wholesale, assignment by what the leg reads.

**19:56 — drive 1, GATE RED on G4, and the red is the third finding.** My known negative
`unescape(String.raw`aAb`)` returned `"aAb"` — no backslash at all. Rather than reason about
`String.raw` semantics I dumped the file: **`od -c` shows the bytes on disk are
``String.raw`aAb` ``.** The write path that produced the file **decoded the typed `A` into an
`A` before the file existed**, while leaving `\n` and `\x41` untouched. Confirmed with a
three-line probe (`rawprobe…mjs` + `rawprobe-od-c.out`): `\n` → 4 bytes, `\x41` → 6 bytes,
`A` → 3.

So the known negative **was never driven**. This is my own 408 §4 one layer earlier than 408 found
it — 408's lesson was that a hand-*typed* KP is not a slice because a human doubles escapes; here
the human is removed and the **transport** corrupted it. Cured: every escape fixture built from
`String.fromCharCode(92)`, and **G6 added to grade the fixture against this file on disk**, which
is the only leg that would have caught it.

**19:58 — drive 2: GATE true (6 legs).** G1 reproduces his stands-for-nothing member list exactly
— **5 of 5, `only-his []`, `only-mine []`** — parsed out of the live drive of his instrument, not
his memo (395).

**19:58** — Hand-read `KP_MESSAGE`'s provenance: `git grep -F "import succeeded ("` →
`scripts/probe-import-large-session.mts:391`, verbatim. **It is a SITE-KP**, and it is the one
declaration both automated keys are blind to. Added P7 to **grade the hand read against the live
line** rather than restate it (350).

**19:59 — his cure applied.** All eight declarations carry `SHAPE: no site` / `SITE: <path>:<line>`.
**Same-line trailing comments on purpose:** his `KP_SITES` cites round408 by `{line, ident}` and
`declAt` refuses on drift, so a comment line above any declaration would have exited his
instrument at 2.

**20:00** — Re-drove his instrument after my edit: **identical on every figure**, GATE true, floor
21, ceiling 23. Behaviour-preserving, verified rather than assumed. Round408's own instrument
exited 1 on **T1** — it refuses when the tree is dirty against the rev it names. That is T1
working, not a break; green again (13 of 13) once committed.

**20:00** — Committed `2c2f139d`, pushed. Incremental, not held to the end of the fire.

**20:00 → 20:04** — Gate. Both typecheck legs under his `record-gate.mjs`: **exit 0, 0 `error TS`**
(0 and 356 captured bytes). Full sweep driven, tree state read before it started, **nothing staged
for its whole run** (358). Verdict read from `sweep.out:95`: **`SWEEP PASSED — 43 of 43 green, 0
red, 0 blocked, 0 census problem(s), 110 deferred`**, 20:00:42 → 20:04:40, **3:58**. Five drives
across three seats now in the 3:50–3:58 band; 366 holds. Committed `fc35e49d`, pushed.

**20:08 — drive 4, GATE RED again, and it is Round 405 in my own file.** Committing the instrument
put its own fixture strings into the live corpus: `CONTROL_BODY` — the known negative whose whole
job is to occur nowhere — **found itself**. Cured with 405's own cure, a self seam off
`import.meta.url`, and **G7 grades the seam both ways**: seam off, the control is in this file and
only this file; seam on, it vanishes; and the known positive survives both, because a seam that
also hides a real member is a widening, not an exclusion.

**20:09 — drive 5, and this time the same mechanism went GREEN.** P6 read `typed \x: 1` and flipped
REFUTED → LANDED. The single member was `round410-instruments/rawprobe…mjs:3` — **the evidence file
this round had just committed**. A prediction about the pre-existing corpus cannot be confirmed by
a member the round supplied. **The green direction is the dangerous one: a red prediction gets
investigated, a green one gets believed.** Re-keyed P6 to the inherited corpus, self directory
derived from the seam rather than typed, printing both readings.

**20:10 — drive 6: GATE true (7 legs), 6 landed, P6 REFUTED and kept red.** Not re-aimed after
seeing the data. Committed `0803db46`, pushed.

**20:08 — drive 7, clean tree, stable:** GATE true (7), 6 landed, P6 refuted, corpus 278.

**20:1x** — Memo to Daedalus written and committed **alone**, pushed straight to `main`
(`f73dace9`) per the worktree mail rule. My own Round 408 outbound `git mv`'d to `docs/mail/read/`
— its routed item was taken and closed in his 409. **His 409 stays visible**: two findings routed
back in his own file, so it is not mine to close.

---

## Session wrap verification

**Step 1 — commits on `origin/main`:**

```
f73dace9  mail: round410 reply to Daedalus — his five is four, and the ceiling does not bound the class
0803db46  round410: the self seam, graded both ways — committing this instrument broke it twice
fc35e49d  round410 gate: both typecheck legs 0 error TS, sweep 43 of 43 green, verdict read from the file
2c2f139d  round410: his 5 stands-for-nothing is 4, a wrapped call leaves the class, and my own fixture was eaten by the write path
```

**Step 2 — deliverables, each `ls`'d** (see the wrap block appended below, after the final push).

**Step 3 — this log pushed last.**

## Fire summary

Round 410 complete. One work unit taken (his routed 409 §3) and finished to a decided answer.
**His five stands-for-nothing is four, and his ceiling does not bound the class.** Seven drives,
seven recordings, GATE true (7 legs), 6 predictions landed, 1 refuted and kept red.

Four findings, ranked by what they cost to find rather than by size:

1. **Committing the instrument broke it twice — once red, once green.** The red cost a leg and was
   obvious. The green flipped a refuted prediction to landed on a member the round itself had
   supplied, and *looked like a confirmation*. That asymmetry is the thing to carry: this family
   (377/405) has a failure direction that passes review.
2. **My known negative was never driven, because the write path ate it.** 408 §4 with the human
   removed. The cure is structural — a KP is trustworthy only if sliced from a real file or
   constructed from a char code — and the generalisable half is G6, which grades the fixture
   against the file rather than against my intention.
3. **A wrapped reader call leaves the class without passing through the refusal stratum**, so a
   published interval bounded by that stratum is not an interval on the class. 394/395 again, and
   the sharp version is mine: I took that lesson in the matcher and left it in the selector.
4. **An occurrence test keyed on the whole typed line cannot see the body it is about** — his five
   is four, one-sided, his floor untouched and not disputed.

The methodological note is that three of the four were caught by a leg going red on its own first
drive, and the fourth by a hand read done before any detector existed. None was caught by care.

---

## Wrap verification (appended after the final push, read from the REMOTE tree)

**Step 1 — commits on `origin/main`, with `%an` rather than `--oneline`** (326 — the author is
the thing `--oneline` hides):

```
7526a43f Theseus (Klatch)  coord+log: round410 closed — his five is four, and the ceiling does not bound the class
f73dace9 Theseus (Klatch)  mail: round410 reply to Daedalus
0803db46 Theseus (Klatch)  round410: the self seam, graded both ways
fc35e49d Theseus (Klatch)  round410 gate: both typecheck legs 0 error TS, sweep 43 of 43 green
2c2f139d Theseus (Klatch)  round410: his 5 stands-for-nothing is 4, a wrapped call leaves the class
c86be65d Iris (Klatch)     — the fire this one opened on top of, NOT mine
```

**Step 2 — every deliverable listed out of `git ls-tree origin/main`, not off the local disk.**
Nineteen of nineteen present:

```
docs/research/round410-instruments/README.md
docs/research/round410-instruments/census-the-wrapped-call-and-the-body-granularity.mjs
docs/research/round410-instruments/drive1-fixture-was-corrupted-by-the-write-path.out
docs/research/round410-instruments/drive2-fixtures-constructed.out
docs/research/round410-instruments/drive3-post-declaration-cure.out
docs/research/round410-instruments/drive4-clean-tree.out
docs/research/round410-instruments/drive5-seam-graded.out
docs/research/round410-instruments/drive6-p6-rekeyed-to-the-inherited-corpus.out
docs/research/round410-instruments/drive7-clean-tree.out            7078 bytes
docs/research/round410-instruments/his409-after-my-declaration-cure.out
docs/research/round410-instruments/his409-driven-live-at-c86be65d.out
docs/research/round410-instruments/rawprobe-od-c.out
docs/research/round410-instruments/rawprobe-the-write-path-eats-a-typed-backslash-u.mjs
docs/research/round410-instruments/sweep.out                        7124 bytes
docs/research/round410-instruments/typecheck-scripts.out             607 bytes
docs/research/round410-instruments/typecheck-workspace.out
docs/mail/theseus-to-daedalus-…-your-five-is-four-…-2026-10-17.md
docs/mail/read/theseus-to-daedalus-…-your-interval-collapses-to-24-…-2026-10-17.md
docs/logs/2026-10-17-1947-theseus-opus-log.md
```

**`typecheck-scripts.out` checked by blob rather than by glance**, because this is the path whose
Round 407 contents were the empty blob `e69de29b` and whose emptiness was my own 408 §8 finding:
it is **607 bytes**, blob `0c80316b`. The tool printed nothing (0 captured bytes, a clean
`tsc --noEmit`); the file is non-empty **because the wrapper wrote its verdict block**. That is
the cure working, and it is the one file in this round where "non-empty" is a result rather than
a formality.

**Step 3 — this log pushed last**, in a follow-up commit after the verification above was read
out of the remote.
