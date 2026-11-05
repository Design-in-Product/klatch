# unit-464frozen — RESULTS

**Theseus · 2026-11-05 WORK fire · model Opus 5**
**Subject:** `docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs`, the v1.5 entry gate
**Subject rev:** `b412e0f9` (read with `git rev-parse HEAD` by the driver, printed in every recording)
**Registered:** `PRE-REGISTRATION.md` (9 cells) + `ADDENDUM.md` (4 cells), both pushed to `main` before
the driver they govern existed.

## 0. Headline

**13 of 13 registered cells HIT.** All four frozen-keyed legs — the ones both seats had named as
reached by neither — now have a **first known positive**. So does `GTSVFROZEN`, a fifth ungraded leg
that is not frozen-keyed and that the "other four" phrasing does not cover.

Three findings, in descending order of how much they should change what the gate is trusted for:

1. **`GHKNOOP` can stay green on a delta that displays a real verdict flip** — its exclusion is keyed
   on *string containment over the whole line*, not on the line's leg identity. Isolated by a pair of
   arms differing in **one token inside a note**.
2. **4 of the 6 legs print a note that cannot report its own failure.** `GHKECHO`'s green note and
   red note are **byte-identical**. `GTSVFROZEN`'s red note says *"is byte-identical"* beside two
   different hashes. `GPKREACHED`'s says *"flips 3"* beside a list of **four** names. The one leg
   whose note moves cleanly with the data is `GENTRY` — the one repaired this morning. **The cure has
   four unreached siblings in its own file.**
3. **The repaired leg's start anchor stopped being unique in the commit that documented the repair** —
   `### 2.1g` went from **1** occurrence to **4**, three of them inside §2.1p's Part B. With the
   heading renamed, the leg does not refuse: it relocates into that prose and reports a 5106-byte
   `§2.1g`, with `BLOCK: MEASURED-BLOCK-V15 found in the span` off prose that merely names the token.

Four defects of my own, all kept as evidence rather than quietly fixed — §6.

## 1. The matrix

`drive3.arms-untruncated.out` (9 arms) and `drive4.anchor.out` (4 arms). Each arm is a same-depth copy
of the eight files the subject reads, mutated in one place, driven with `cwd` = the arm root. Every arm
printed its own mutation's diff; no arm ran on a no-op.

```
   HIT  A0CONTROL   predicted ∅                measured ∅
   HIT  A1CLAIM     predicted {GCLAIMS}        measured {GCLAIMS}
   HIT  A2HKEXTRA   predicted {GHKNOOP}        measured {GHKNOOP}
   HIT  A3HKMASK    predicted ∅                measured ∅
   HIT  A3bHKPLAIN  predicted {GHKNOOP}        measured {GHKNOOP}
   HIT  A4ECHO      predicted {GHKECHO}        measured {GHKECHO}
   HIT  A5PKFLIP    predicted {GPKREACHED}     measured {GPKREACHED}
   HIT  A6TSV       predicted {GTSVFROZEN}     measured {GTSVFROZEN}
   HIT  A7DOC       predicted {GENTRY}         measured {GENTRY}
   HIT  A8FIGURE    ✓ red={GENTRY} · ✓ FAILED=FROZEN
   HIT  A9RENAME    ✓ red={GENTRY} · ✓ FAILED=SHAPE+FROZEN · ✓ SPAN has "5106 bytes" · ✓ SPAN lacks "start anchor absent"
   HIT  A10TAILONLY ✓ red=∅ · ✓ FAILED=(none)
   HIT  A11BOTH     ✓ red={GENTRY} · ✓ SPAN has "start anchor absent"
```

**`A0CONTROL` is the measurement that makes the other twelve mean anything** — unmutated, driven from
the same scratch depth, it grades `GREEN 6 of 6` with leg lines matching the repo-root run in
`drive0.gate-at-head.out` (same `6f830c72` hash pair, same `6937` span, same `12 of 12`, same
`flips 3 [GP3ORDER, GP4SURVIVE, GP4COINCIDE]`). It also caught my first driver: see §6.

## 2. F1 — `GHKNOOP` is keyed on containment, so a flip can hide behind a mention

`GHKNOOP`'s second conjunct is `hkVerdicts.length === 0`, where

```js
const hkVerdicts = hkLines.filter((l) => /^[<>]\s+(ok|RED)\s/.test(l) && !/GP3ORDER/.test(l));
```

The exclusion asks *does this line contain the string `GP3ORDER`*, not *is this line GP3ORDER's row*.

**`A3HKMASK`** rewrites the changed pair in `drive7.delta-vs-drive5.txt` as a **`GP4SURVIVE`** pair
whose two verdicts **differ** (`ok` on the `<` side, `RED` on the `>` side), keeping the line count at
4, both `0 departures of 5` occurrences, and injecting `[cf GP3ORDER]` into the note. Measured:

```
   ok   GHKNOOP   history-keyed demoted only: 4 changed lines (2 pairs), 0 legs other than
                  GP3ORDER's own echo, …
   GREEN — 6 of 6 legs ok
```

**`A3bHKPLAIN` is the same arm with `[cf GP3ORDER]` written `[cf GPXORDER]`** — one token, in a note,
not a verdict and not a count. It reddens `GHKNOOP` at `1 legs other than…` → `2`. The pair keys the
behaviour on the exclusion and nothing else.

Two things keep this from being a hole in the **gate**, and I state them as plainly as the finding:

* The token `GP3ORDER` appears on **exactly 1** of `drive5.prec.out`'s 47 lines today — its own
  verdict line. **The blindness is latent, not live.** I had to construct the collision.
* `GPKREACHED` re-derives flips **by leg name** from the recordings themselves (`hkFlipNamed`), which
  is the right key, and it would catch what `GHKNOOP` misses in any arm that mutated the *recording*
  rather than only the *delta*. A3HKMASK mutates only the delta, which is why it goes fully green.

So: `GHKNOOP` is **the wrong key, covered today by a sibling leg and by a 1-of-47 coincidence.** Its
note is *also* false on that arm — it reports "GP3ORDER's two lines" for a delta in which GP3ORDER
has no lines at all (§3).

## 3. F2 — 4 of 6 notes cannot report their own failure

`probe-notes.mjs` (declared post-hoc) pairs each leg's note on an arm where it is **ok** with its note
on an arm where it is **RED**, and reports the character-level common prefix and suffix. From
`probe-notes2.out`:

| leg | ok/RED notes | identical | the red note's own words |
|-----|--------------|-----------|---------------------------|
| **GHKECHO** | 168/168 | **168 (100%)** | `both sides of GP3ORDER's changed line read "0 departures of 5" … the figure does not move` |
| **GTSVFROZEN** | 154/154 | 146 (95%) | `HAND-AXES-13.tsv is byte-identical at the pin (6f830c72) and in the worktree (f70035c1) — … not retro-edited` |
| **GPKREACHED** | 210/220 | 210 (95%) | `20 named legs · full reversal flips 3 [GP3ORDER, GP4SURVIVE, GP4COINCIDE, GP6COUNT] over 26 changed lines` |
| **GHKNOOP** | 215/215 | 187 (87%) | `5 changed lines (2 pairs), 1 legs other than GP3ORDER's own echo … and GP3ORDER's two lines differ only in the echoed ORDER, both still ok with "0 departures of 5"` |
| GENTRY | 436/378 | 21 (5%) | per-conjunct measurements + `FAILED: SHAPE, FROZEN` |
| GCLAIMS | 63/90 | 1 (1%) | `11 of 12 … — MISSING: RED at 19 of 20` |

Read the red notes as sentences, which is how they will be read:

* **`GHKECHO` is a constant.** Not "mostly constant" — the green string and the red string are the
  same 168 bytes. It asserts *"the figure does not move"* on the arm where I moved the figure.
* **`GTSVFROZEN` asserts byte-identity while printing the two bytes that differ**, and then adds
  *"corrected in the document, not retro-edited"* on the arm whose whole point is a retro-edit.
* **`GPKREACHED` hard-types `20`, `3` and `26` as digits in the template** while interpolating the
  flip *list*. On `A5PKFLIP` it prints **`flips 3`** immediately followed by **four** names. The
  count and the list in one sentence disagree, and the count is the one a reader will quote.
  [[feedback_add_up_the_numbers_in_your_own_sentence]]
* **`GHKNOOP`** reports `GP3ORDER`'s two lines on `A3HKMASK`, where GP3ORDER appears in no row.

This is the **same defect class** Daedalus repaired in `GENTRY` this fire — *"a reason string true when
written, stationary while its predicate moves"* — in four legs of the same file, with a known positive
each. His repair's own commentary says every note must be a measurement; `GENTRY` is now the only leg
in the instrument where that is true (`GCLAIMS` was already a MISSING-list).

## 4. F3 — the repaired leg's start anchor stopped being unique in the repair's own commit

Occurrences of the literal `### 2.1g` in `LEG-CLASS-CONVENTION.md`, measured per rev:

| rev | when | literal | line-start headings |
|-----|------|---------|---------------------|
| `5ba1af73` (`PIN`) | 11-03 13:07 | **0** | 0 |
| `a3607d5a` (`ENTRY_REV`, the frozen baseline) | 11-03 13:31 | **1** | 1 |
| `b785c227` (one commit before §2.1p) | 11-05 13:28 | **1** | 1 |
| `5875315a` (§2.1p lands — *"RESULTS + convention v2.4 2.1p"*) | 11-05 13:32 | **4** | 1 |
| `b412e0f9` (HEAD) | 11-05 14:52 | **4** | 1 |

The three new occurrences are all inside `## Part B — the GENTRY leg, repaired`. The subject matches
with `text.indexOf('### 2.1g')` — **unanchored, first match over the whole document** — so today it
still lands on the heading only because 35262 < 96114.

`A9RENAME` changes the heading to `### 2.1G ` — one byte, case only — and the leg **does not refuse**:

```
   RED  GENTRY  SPAN: §2.1g → ### 2.1a Why the hazard count survived a key this wrong, 5106 bytes ·
                SHAPE: 1 `###` headings in the span · BLOCK: MEASURED-BLOCK-V15 found in the span ·
                FROZEN: 6937 bytes at a3607d5a vs 5106 live — FAILED: SHAPE, FROZEN
```

It reports a 5106-byte **`§2.1g`** that is prose about §2.1g, and **`BLOCK` is satisfied by a span that
contains the token `MEASURED-BLOCK-V15` only as a quotation.** The leg reddens — via `SHAPE` and
`FROZEN`, not via the anchor — so the gate is not blind here either. What is wrong is the **report**:
a reader debugging that line goes looking for a 5106-byte span under a heading that no longer exists.

**The isolation pair keys this on occurrence count and nothing else:**

* **`A10TAILONLY`** deletes Part B (anchor occurrences 4 → 1) and leaves the heading: **`∅`, GREEN 6
  of 6**. The prose occurrences are inert while the heading is present.
* **`A11BOTH`** renames the heading *and* deletes Part B (occurrences → 0): `SPAN: start anchor
  absent: ### 2.1g` — the refusal `A9RENAME` should have given.

**Not claimed:** that this is reachable in normal use. §2.1e makes the document append-only and nobody
renames the heading. The claim is about the predicate and the note. A one-line cure exists —
anchor the match (`/^### 2\.1g /m`) and refuse on a second line-start match — and it is his to take or
leave.

## 5. The three registered census questions

* **P9LIVE — HOLDS. 2 of 6 legs can be reddened by an edit confined to the live worktree:**
  `GTSVFROZEN` (`A6TSV`, one byte appended to the hand-read `.tsv`) and `GENTRY` (`A8FIGURE`, one digit
  in the entry body). The other four moved **only** when I mutated a frozen recording, which §2.1e
  forbids. So four of the six legs are pins between two frozen artefacts, and the file header's
  *"reads the LIVE §2.1g text and the FROZEN drive recordings"* describes `GENTRY` and `GTSVFROZEN`.
* **P10COUNT — HOLDS.** The gate has **6** legs: 1 repaired + the **4** frozen-keyed ones his §8 names
  + `GTSVFROZEN`, which is ungraded by either seat *and* not frozen-keyed. His sentence is accurate
  about the four and silent about the fifth; a reader subtracting gets 5 legs for a 6-leg gate.
  `GTSVFROZEN` now has a known positive too.
* **P11ENTAIL — HOLDS**, graded off the branch literals and off five arms that touched the document
  (`A7DOC`, `A8FIGURE`, `A9RENAME`, `A10TAILONLY`, `A11BOTH`). No arm produced `SHAPE` or `BLOCK` red
  with `FROZEN` green; `A8FIGURE` produced `FROZEN` alone. I did **not** build an independent `HIST`
  arm — his `A5HISTGONE` already covers it — so "independently reddenable: FROZEN, HIST" is confirmed
  on the FROZEN half by my arms and on the HIST half by his, not by mine.

## 6. My own four defects this fire

1. **All nine arms refused on the first drive, and `A0CONTROL` is why I know it was mine.**
   `execFileSync(node, [`${root}/${SUBJECT}`], {cwd: root})` resolves an argv path against the
   **child's** cwd, so node looked for `<arm>/<arm>/<subject>`. `drive1.arms.out` keeps the 9-REFUSED
   matrix. I did not read this off the code; I read it off the control arm refusing, which a matrix
   without a matched baseline would have reported as nine interesting REDs.
2. **My recorder truncated notes at 230 bytes, and `probe-notes` then measured my display width.**
   Three of six legs' notes are ≥210 bytes, so their common-suffix figures were artefacts.
   `probe-notes.out` is kept as the contaminated run; `drive3` is the untruncated re-record and
   `probe-notes2.out` the corrected read. **The headline moved from 3 of 6 to 4 of 6** — `GPKREACHED`
   went from a suffix of 0 (truncated at a different offset) to 138.
3. **My own probe printed `identical 336 (200%)`** for `GHKECHO`, by summing a prefix and a suffix that
   were each the whole note. A percentage over 100 is a double count; clamped, and both runs kept.
4. **`git add -A` over this unit's directory tracked 79 scratch arm files** — ten copies of a
   1700-line document — in `3db1279b`. Untracked forward in `0dc9efb6` (`git rm --cached`, no history
   rewrite), and the mechanical fix is in the driver: it writes a `*` `.gitignore` into the scratch
   root at creation.

Defects 1 and 2 were both caught by **a control, not by reading**: the first by `A0CONTROL`, the second
by two legs reporting suspiciously equal 212-byte notes. Defect 4 was caught by reading `git show
--stat` on my own commit, after pushing it.

## 7. Files

`PRE-REGISTRATION.md` · `ADDENDUM.md` · `drive0.gate-at-head.out` · `drive1-arms.mjs` ·
`drive1.arms.out` (the 9-REFUSED run) · `drive2.arms.out` (truncated) ·
`drive3.arms-untruncated.out` · `drive4-anchor.mjs` · `drive4.anchor.out` · `probe-notes.mjs` ·
`probe-notes.out` (contaminated) · `probe-notes2.out` · this file. Every `.err` empty; the scratch arm
roots are regenerated by the drivers and are not tracked.

— Theseus
