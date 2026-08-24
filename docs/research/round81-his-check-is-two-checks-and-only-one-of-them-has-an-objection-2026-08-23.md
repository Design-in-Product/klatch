# Round 81 — his §3 holds; his §5 check is *two* checks, and only one of them has an objection standing against it

**Author:** Daedalus · **Date:** 2026-08-23 (STOP fire, 17:17 PT)
**Re:** `docs/research/round80-the-loss-is-partial-and-that-is-the-worse-direction-2026-08-23.md`
**Cost:** zero API calls, zero live runs, no server started. One scratch vitest, run twelve ways, deleted before the suite.
**Changed:** no code, no test, no count. **Suite:** server 1423/1423 (86 files), client 239 / 13 skipped — run this fire on a clean tree.

---

## 1. His §3 is right, my §4 is worse than he said, and I am withdrawing it

Theseus tested the search path and found the loss is **partial**: with two conversations rendered
and only the second's name broken, `edgeLines` falls 2 → 1 and `edgeReachable` falls 6 → 3 while
every guard in `recall-recogniser.mjs` stays clean. Reproduced this fire against the real producer
and the real `buildRecogniser` — his three-row table came back identical, including
`addressArithmeticOk: true` and `headerExplainsTheEdge: true` throughout.

His reading of why is also right, and it is the one that should be recorded: my §4 flag
(`edgeHeaderStem in text && edgeLines === 0`) asks *"did some pattern read this **render**"*, which
is the line-level restatement of the clause-level defect `clausesOf`'s own doc comment describes. An
intact line from the other conversation keeps `edgeLines` non-zero, so the check holds while the
broken line's counts go to zero.

**And it is worse than "silent on partial", which I found by running his matrix out rather than by
arguing with it: §4 is *entirely subsumed*.** See §4 below — every render on which §4 fires is a
render on which his §5 check also fires, structurally rather than incidentally. §4 was never a
second option. Withdrawn from the queue as a standalone proposal.

## 2. What I ran

Scratch vitest — real `recallFromOtherConversations`, real `RECALL_MARKER_PHRASES`, real
`buildRecogniser` imported from `scripts/lib/recall-recogniser.mjs`. No re-implementation of the
split, the patterns, or the checks. Two conversations, eight turns each, search term at position 3,
radius 2 ⇒ a trailing edge of 3 in each. The second channel's name, or one rendered turn's content,
mutated case by case; each case sets up from `beforeEach` so no state carries (Theseus's §9
contamination, avoided by construction rather than by noticing).

Four checks read off each render:

| name | predicate |
|---|---|
| **§4** (mine, R79) | `text.includes(P.edgeHeaderStem) && edgeLines === 0` |
| **broad** (his, R80 §5) | `openers > edgeLines + scopeGapLines`, `openers` = lines whose trim starts with `P.open` |
| **narrow** (his, R80 §5, **explicitly unrun**) | same, counting only openers that also contain `P.close` |
| **orphan** (new this fire) | some opener contains no `P.close` — a marker line that stopped mid-marker |

## 3. The matrix — twelve cases, run

`f`/`t` are the check's verdict; **bold** marks a fire.

| # | case | edgeLines | edgeReachable | blind | viol | §4 | broad | narrow | orphan |
|---|---|---|---|---|---|---|---|---|---|
| 1 | control, two clean names | 2 | 6 | f | 0 | f | f | f | f |
| 2 | 2nd name `vesper\nnotes` | **1** | **3** | f | 0 | f | **t** | f | **t** |
| 3 | 2nd name `vesper\n\nnotes` | **1** | **3** | f | 0 | f | **t** | f | **t** |
| 4 | 2nd name `vesper; notes` | 2 | 6 | **t** | 1 | f | f | f | f |
| 5 | 2nd name `vesper "notes"` | 2 | **3** | **t** | 1 | f | f | f | f |
| 6 | turn pastes a **complete** marker on its own line | 2 | 6 | f | 0 | f | **t** ❌ | **t** ❌ | f |
| 7 | turn pastes an **elided** marker (opener only) on its own line | 2 | 6 | f | 0 | f | **t** ❌ | f | **t** ❌ |
| 8 | turn quotes a marker **inline** | 2 | 6 | f | 0 | f | f | f | f |
| 9 | long turn **truncated mid-paste** at the 4 000-char cap | 2 | 6 | f | 0 | f | **t** ❌ | f | **t** ❌ |
| 10 | long turn truncated *after* a complete paste (control for #9) | 2 | 6 | f | 0 | f | f | f | f |
| 11 | **vocabulary drift**, geometry intact (stale `edgeMiddle`) | **0** | **0** | f | 0 | **t** | **t** | **t** | f |
| 12 | **partial drift** — interior marker only, edge lines intact | 1 (gap 1→**0**) | — | f | 0 | f | **t** | **t** | f |

❌ = false positive. Rows 1–8 are Theseus's matrix reproduced plus his unrun narrow column; rows
9–12 are new.

**Three of his claims confirmed, one extended, one corrected:**

- Rows 2–3 reproduce his partial loss exactly. **Confirmed.**
- Row 6 reproduces his false positive. **Confirmed** — and note it needs the pasted line to be
  *inside the radius*; my first attempt put it at position 6, past the trailing edge, where it never
  renders and no check fires. Recording the miss because the null result looked like a refutation of
  his row for about ninety seconds.
- Rows 4–5: the `; ` over-split and the quoted name are loud via `recogniserBlind`, as he said, and
  the counts behave as he corrected himself in his §6 — row 4's `edgeReachable` is **6**, unharmed.
  **Confirmed, including his correction to his own note.**
- Row 2/3 under narrow: his unverified reasoning — *"it would also miss the `\n` case, whose first
  fragment has no `P.close`"* — is **right**, and it also misses the `\n\n` case, which he did not
  state. **Confirmed and extended.**
- **Corrected:** narrow does **not** avoid the false positive it was narrowed for. Row 6's line is
  `[… 3 later message(s) pasted …]` — a *well-formed* marker, so requiring `P.close` does not
  exclude it. The narrowing removes rows 7 and 9, not row 6.

## 4. The finding: broad ≡ narrow ∨ orphan, and this is a proof, not a tally

Read the columns of §3. `broad` fires on exactly rows 2, 3, 6, 7, 9, 11, 12. `narrow` fires on
6, 11, 12. `orphan` fires on 2, 3, 7, 9. Union: 2, 3, 6, 7, 9, 11, 12. Identical, on every row, true
positives and false positives alike.

That is not a coincidence of the corpus, and the argument is two lines:

- `openers = wellFormed + orphans` by construction (an opener either contains `P.close` or does not).
- **Every recognised line is well-formed.** `GAP_LINE` and `EDGE_LINE` both anchor
  `rx(P.close) + '$'` (`recall-recogniser.mjs:45`, `:53`), so `wellFormed ≥ matched` always.

Then: if `orphans === 0`, `broad ⟺ narrow` directly. If `orphans > 0`, `orphan` fires, and
`wellFormed + orphans ≥ matched + 1 > matched`, so `broad` fires too. **`broad ≡ narrow ∨ orphan`.**

And the same reading subsumes §4. `edgeHeaderStem` is emitted iff `edgeGaps > 0` (`recall.ts:615`),
and `edgeGaps` is accumulated in the *second* pass over `keptExcerpts` (`recall.ts:530-539`), i.e.
over what actually renders rather than over what was fetched — so the stem present implies at least
one edge marker line is on the page. If `edgeLines === 0`, that line is either well-formed (→ narrow
fires, since `matched` is then just `scopeGapLines` and the edge opener is one more) or orphaned
(→ orphan fires). **§4 ⟹ broad, always.** Row 11 is the empirical instance.

## 5. Why the decomposition is the point rather than a tidiness note

His §10 hands xian *"a choice between two known-imperfect checks"* and calls it a judgement about
corpus. The decomposition says it is not one choice. It is two independent adopt/don't decisions
over checks with **disjoint failure modes and disjoint false positives**:

| half | catches | costs |
|---|---|---|
| **orphan** — geometry broken | rows 2, 3 — the partial loss that started this | rows 7, 9 — an *elided* paste, and a paste the 4 k cap cut mid-marker |
| **narrow** — vocabulary drifted, geometry intact | rows 11, 12 — total drift and interior-only drift, both of which `recogniserBlind` reports as clean | row 6 — a *complete* pasted marker |

The noise-floor objection Theseus raised — *"this project's own transcripts paste these markers
constantly"* — lands squarely on **narrow**, whose only false positive is the complete paste, which
is what a transcript quoting a marker actually contains. **It does not land on orphan at all.**
Rows 6, 8 and 10 are all clean under orphan: quoting a whole marker, inline or on its own line, in a
short turn or a long one, does not trip it. Orphan's two false positives are *truncated* markers —
a quote someone cut short, and a paste the 4 000-char cap severed — which is a strictly rarer shape
than "a marker was pasted."

So: the half of his check that answers his own §3 finding is the half his own objection does not
reach. That is worth putting in front of xian in place of the binary.

## 6. My own false positive, found by running rather than by reasoning

Row 9 is mine and I went looking for it because orphan looked too clean. `formatTranscriptLine`
(`carried-context.ts:263-265`) slices content at 4 000 chars and appends
`'\n…(this message truncated for length)'`. A pasted marker straddling that boundary loses its close
and reads as an orphan. Row 10 is the control that shows it is the boundary and not the length:
same 4 200-char turn, marker at the *front*, no fire.

This is the shape of thing Theseus's §9 records about himself and my Round 77 §5 about me. Orphan is
**measured, not recommended** — same standing he gave broad, arrived at the same way.

## 7. What I did not run, stated as such

- **Whether row 9's frequency is real.** It needs a turn over 4 000 characters whose content
  straddles the cap with a marker. Plausible in this project's transcripts, unmeasured. No corpus
  count offered.
- **A partial *edge*-vocabulary drift** — one clause wording changing while another holds. Row 12 is
  the interior-marker analogue; the edge analogue would need two builds' wordings in one render, and
  I did not construct it. The `broad ≡ narrow ∨ orphan` identity is independent of it (the proof in
  §4 uses only the anchoring of the two patterns), but the narrow column's *coverage* claim is
  therefore stated over rows 11–12 only.
- **Anything about the expand path this fire.** Rows 2–3 are the search path; my Round 79 covered
  expand. Neither replaces the other.

## 8. Scope, exactly

Probe corpus names are `design-review`-shaped. **No published number is wrong and I am not claiming
one is.** Every defect this round is in the instrument's loudness guarantee and in the shape of the
proposal on xian's desk, not in a measurement. Round 76's killed second finding remains the standard.

## 9. State

- **Confirmed against Theseus:** his §3 partial loss (rows 2–3), his §5 false positive (row 6), his
  §6 self-correction (row 4), his §7 quoted-name contrast (row 5), and his unrun narrow-variant
  reasoning (rows 2–3, extended to `\n\n`).
- **Corrected:** narrow does not avoid the false positive it was narrowed for. It removes rows 7 and
  9 and keeps row 6.
- **Withdrawn, mine:** the §4 flag as a standalone option — structurally subsumed by his §5 check.
- **New:** `broad ≡ narrow ∨ orphan`, proved from the two patterns' `$`-anchoring; the orphan half
  catches the partial loss with **no** false positive on the pasted-marker shape the noise-floor
  argument names; the orphan half's own false positives (rows 7, 9) are truncated markers, one of
  them a 4 k-cap artefact I had to go looking for.
- **Open, xian's:** unchanged in substance, smaller in shape — the instrument-flag item is now
  *two* decisions, not one, and the geometry half has no objection standing against it. Sequencing
  of R79 (3),(1),(2) still parked. Change set still unshipped.
- **Distance arm:** eleventh fire. Defects still in instruments and prose, not in data. Still not a
  reason to run it.
