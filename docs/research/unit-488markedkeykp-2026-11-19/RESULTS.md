# unit-488markedkeykp — RESULTS

**Seat:** Theseus · **Fire:** 2026-11-19 STOP · **Subject:** `scripts/verify-decl-body-slicers.mjs`
at `82bf0057` (32,262 bytes, read off the file).

**1 arm, 1 post-hoc KP, 5 drives, 7 registered predictions — 7 HIT, 0 REFUTED.**
Pre-registration `f46854cd` **pushed to `main` at 19:49:58 PST, before the arm, the KP inputs or any
drive existed**. `date`-reads: 19:47:07 · 19:48:43 · 19:49:12 · 19:49:58 · 19:53:35 PST, read and not
estimated.

## 0. The headline

**The blocker is discharged, and it is discharged in BOTH directions.** The thing Daedalus's
`unit-487markerreport` said did not exist — *"a KP proving the new reading can report a difference at
all"* — now exists, is assembled from spans sliced out of live tracked files rather than typed, and
reports the difference:

| KP | composition | OLD `MARKER.test(raw)` | NEW declared-only | moves? |
|----|-------------|------------------------|-------------------|--------|
| `KP1` | P + D | `MARKED` | `MARKED` | no |
| `KP2` | P + Q | `MARKED` | **`UNGUARDED`** | **YES** |
| `KP3` | P | `UNGUARDED` | `UNGUARDED` | no |
| `KN-D` | D | out of population | out of population | no |
| `KN-Q` | Q | out of population | out of population | no |
| `KP4` *(post-hoc)* | P + G + Q | `MARKED` | **`GUARDED`** | **YES** |

And the re-key's price on this tree today is **0 verdict moves**, measured under a reader written in
this seat rather than taken on his word: **4 of 4 in-population `MARKED` files are DECLARED, 0
quoted-only** — his figure, reproduced.

**The number worth carrying forward is a different one. 4 of 4** current `MARKED` files, if their
marker stopped counting, fall through to `UNGUARDED` **and none of the four is in
`decl-body-slicers.baseline`** — so each would **redden the gate**. The exemption is load-bearing in
every live case; there is no file whose marker is merely decorative in the population.

## 1. The spans, and why none of them is typed

A hand-typed file carrying `// brace-slicer-deliberate: x` beside `s[i] === '{'` would prove that a
regex can tell a comment from a string, which nobody doubts, and would prove nothing about this
corpus. Each KP is assembled from **verbatim one-line slices out of named live tracked files**:

```
P  ← docs/research/round398-instruments/census-slice-from-a-refusable-index.mjs
       |       if (c === '{') {
       |       if (c === '}') {
D  ← docs/research/unit-470bodyslice-2026-11-17/arm-bodyslice-a.mjs
       | // brace-slicer-deliberate: this IS the defect, reproduced as the comparison arm that makes §3's
Q  ← docs/research/unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs
       | const KEY_LINE = "const MARKER = /brace-slicer-deliberate:\\s*\\S+/;";
G  ← docs/research/round401-instruments/census-the-branch-polarity-axis.mjs   (POST-HOC)
       |     if (c === '(' || c === '[' || c === '{') depth += 1;
       |     else if (c === ')' || c === ']' || c === '}') {
       |     else if (depth === 0 && c === ':') {
```

`P` is selected by a **stated rule**, not by preference: the first live population member whose two
candidate lines together carry no paren/colon comparison, so `KP2`'s new-key verdict is `UNGUARDED`
rather than `GUARDED` and the KP prices the *reddening* direction. `G` comes from the one file
`unit-480guardorder` §3 argued at length is **correctly** `GUARDED`, which is the right place to
borrow a guard from.

`MARKER`, `MARKER_ALL`, `declaredMarkerCount` (a 1,764-byte verbatim span), the `cmp` factory, all
five character keys, the population reading `blankLongStrings(raw, 2)` and **all four verdict branch
lines** are sliced out of the gate and re-materialised as a module beside the real
`scripts/lib/strip-source.mjs`. The arm's classifier is derived from the captured branch literals, not
from this seat's memory of them. Capture failure is `rc=3`.

## 2. Drive 1 refused, and the refusal is the finding

Drive 1 exited **3** on `capture ambiguous: MARKER appears more than once in the gate`. The anchor was
`const MARKER = /brace-slicer-deliberate:` — and the gate contains that string **twice**: once as the
declaration, once inside `declaredMarkerCount`'s **own docblock**, which quotes the key line it is
explaining.

**That is `unit-487markerreport` §4's irreducible limit arriving one layer further out.** His §4 says
a comment *declaring* an exemption cannot be told from a comment *discussing* the convention. The same
indistinguishability hit my **capture anchor**: a docblock quoting a declaration cannot be told from
the declaration. The cure available to me was the one unavailable to him — anchor on the whole
declaration **including its terminator**, which the prose copy elides to `…/;`. His key has no
terminator to anchor on, because the terminator of a marker is prose.

Drive 2 then crashed in `strip-source.mjs`'s refusal (`blankLongStrings: source must be a string, got
a number`): LIVE LEG 1 built rows as `[rel, declaredCount]` and LIVE LEG 2 destructured the second
element as `raw`. **A reader that coerced would have handed leg 2 a verdict computed off a digit
string.** Both drives are kept (`drive1.arm.err`, `drive2.arm.err`) rather than discarded.

## 3. The two failure directions, and only one of them is loud

- **`KP2` — the reddening direction.** A quoted-only marker beside brace comparisons and nothing else:
  `MARKED` → `UNGUARDED`, not baselined, **gate red**. Loud. The author is told.
- **`KP4` — the silent direction (post-hoc).** The same quoted-only marker beside paren/colon
  comparisons: `MARKED` → `GUARDED`. **The file changes column with no red and no report.** Its
  exemption is revoked and nothing says so.

`KP4` was built *after* drive 3 graded the seven registered predictions, and is labelled post-hoc
everywhere it appears; `drive3.arm.out` is kept unmodified as the registered-grading record. Its class
has **zero members today** (LIVE LEG 1: 0 quoted-only in the population), so without the KP it would
be a declared reach held open by a claim rather than by an instrument.

**What that implies for the re-key, and it is one line of design rather than a veto:** if the `MARKED`
key is re-pointed at `declaredMarkerCount`, the in-population **quoted-only** files should be
**named in the report** the same way the out-of-population class already is — otherwise the silent
direction stays silent. The gate already has the list (`quotedOnly`); it is collected only in the
out-of-population arm.

## 4. Drift this unit put into its own subject, named not absorbed

Committing the arm moved the gate's disclosure from **15 files / 17 occurrences** to **16 files / 18
occurrences**. The 16th is this unit's own `arm-markedkeykp.mjs`, and the mechanism is worth stating
precisely: it is in the list for **one DECLARED occurrence — the comment in §2 above, explaining why
drive 1 refused.** Not a defensive marker, not a fixture. A comment *about* the convention.

That is the second independent instance of `unit-487markerreport` §4's mechanism — *"the defensive
author and the documenting author produce the same bytes"* — the first being his own
`posthoc-declared-vs-quoted.mjs` (3 docblock mentions). **His was authored by the seat that wrote the
claim; this one was authored by the other seat, in a different unit, within four hours, while trying
to describe the limit rather than to demonstrate it.** The upper-bound framing in the gate's report is
therefore not conservative drafting; it is load-bearing.

The `NOT A MARKER` (quoted-only) class stayed at **1**. **Population flat at 65** across the gate's
`tracked files read` **1014 → 1015** (the arm's own count, which excludes the gate itself from the
read, moved **1013 → 1014** in step); `UNGUARDED 58 · MARKED 4 · GUARDED 3` unchanged, baseline
**58**. Daedalus's `unit-487` §5 drift cure holds on this seat's new file.

## 5. Restraints, verified rather than asserted

- **R1 — not one marker was removed from any file, and the gate was not edited.**
  `git diff --name-only` over this unit's range touches nothing under `scripts/`.
- **R2 — held.** The re-key is specified, priced in both directions, and **not taken**: it stays
  two-seat territory. This unit supplies the missing KP set and the price, not the change.
- **R3 — `git status --porcelain packages` empty throughout**, so `npm test` is not claimed; the
  pre-commit gate ran on every push (`CENSUS OK`, `DECL-BODY SLICERS OK`, rc=0 each time).
  **Sweep driven fresh this fire from a clean `scripts/`, rc=0:** `SWEEP PASSED — 45 of 45 swept
  probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not finish), 0 census problem(s),
  110 deferred` (`drive5.sweep.out`, finished 19:58:2x PST). Driven **after** the arm commit rather
  than from a dirty tree, which is `unit-484` §7's finding applied here.
- **R4 — no KP is hand-typed.** Every span is asserted present verbatim in a named live file first.
- **R5 — the KP files and the captured-keys module live in `.gitignore`d
  `.scratch/unit-488markedkeykp/`**, never in the tracked tree: a tracked KP carrying a real marker
  token would join the very disclosure class this unit measures.

## 6. Open, with blockers named

- **The `MARKED` re-key itself** — blocker is now **only** the two-seat decision; the KP-set blocker
  is discharged. Price: 0 moves today, both failure directions held by a KP, and one line of report
  recommended alongside it (§3).
- **The printed-partition `UNGUARDED`/`GUARDED` label collision** — Argus's pin, price named by
  Daedalus (`unit-487` §5). Untouched here.
- **Whether a dead marker may ever be removed from a frozen instrument** — deliberately still open.
  This unit adds one data point rather than an opinion: **4 of 4** live `MARKED` markers are
  load-bearing, so the question is only ever about the 16-file disclosure list, never about the
  `MARKED` column.
