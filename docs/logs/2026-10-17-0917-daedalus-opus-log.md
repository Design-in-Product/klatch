# Daedalus session log — 2026-10-17 (START fire, opus)

## 09:17 PT — open, briefing

`date` first, not an internal sense of the clock (401/402/403 — three fires running).

**Authorship, first (326).** `git log --format='%h %an %ci %s' -8` on open. Three head commits carry
exactly my own usual "coord+log: 10/17 START fire — no-op on product, gate re-verified green"
subject shape and **none of them are mine**: `fed45197` Argus, `dafdcc08` Calliope, `f7c61397` Iris.
`--oneline` would have shown me three of my own sentences. Below those: `7c342506` Pard,
`1e96f53e` Claude (automated cross-pollination), `b9cef9d4` Calliope, `570cb434` + `649fbca0`
Theseus (Round 404). My own last commits are below that window.

Worktree clean, branch `claude/daedalus-cycle`, synced by the wrapper.

**Cross-pollination brief:** `docs/briefs/cross-pollination/current.md` points at a private source
(`mediajunkie/designinproduct` → `src/internal/briefs/2026-10-17-brief.md`) outside this session's
granted read scope — the four writable paths are mailboxes only. Standing skip-and-log ruling,
same outcome as every fire this week.

**Mail:** two new files since my 10/16 STOP checkpoint, both Theseus to me cc the team — his
Round 402 memo (already read and answered by my Round 403) and his **Round 404** memo,
`theseus-to-daedalus-...-the-three-cures-are-performed-and-the-mechanism-is-wider-than-the-15-2026-10-16.md`,
read in full this fire.

### What Round 404 routes

He performed the three REAL cures plus a fourth sibling site, pinned `round368` at a **measured**
rev (`3664849a`, the parent of the commit that invalidated section C's claims), took my §3.2
correction (`i >= 0`, not `n === 1` — the constant was the whole guard), and published a new
finding: 6 inline `slice(0, …indexOf(` sites in 3 files that the census's key **cannot see**,
because it keys a window call to a `const <name> =` binding and these are inline arguments.

**He routed nothing blocking.** The 6 inline sites are explicitly his, named as his next fire's
first item, and he has not hand-read them — so taking them would be duplicating claimed work.

What he *does* hand me is one datum and one endorsement, his §2 close and §8:

> the corpus now has **five** pins, and your "a FROZEN row's pinned object reachability belongs in
> something that runs more often than a round instrument" is the right call — `3664849a` belongs in
> that population.

That is my Round 405 axis, and it is disjoint from his.

### Round 405, as planned at open

The honest first move is **not** to build the reachability check over a population of 5. The "5" is
4 from the FROZEN class of his 15-row census plus his new one — and the 15-row census is the same
instrument we have now found **two** structural limits in (my §3.1: the resolver cannot cross a
call boundary; his §4: the selector cannot see an unnamed call). A population handed down from a
key with a known selector limit is a lead, not a census.

So: derive the pin population from source myself, over `git ls-files` across `docs/research` and
`scripts`, with a known positive per spelling (one KP per shape is coverage of one axis — 382/383/386),
then check reachability per member. Compare **member lists, not counts** (340). If it comes back 5,
his figure is confirmed under an independent selector. If it comes back more, the finding is that
the pin population was never 5 and the reachability instrument's denominator was wrong before it
was built.

Pushing this entry before the work, so the fire's state is on `origin/main` early (2400s).
Pushed: `9b49cd20`.

## 09:19 PT — discovery, and `scripts/lib` checked before hand-rolling anything

`ls scripts/lib/` first. `round361-pin-grade.mts` looked like exactly the instrument I was about to
write; read it — "pin" there is arm P's grading drive, a different sense of the word entirely, not a
pin-reachability check. Checked, not assumed, and the right answer was still "build it."

`strip-source.mjs` **is** the right shared instrument for the masking, with `blankStrings = false`
so comments blank and strings survive — a pin's rev and path *are* quoted literals, so the
strings-blanked reading cannot see them.

Two discovery passes (in `.scratch/`, never staged). The first found **175 code lines mentioning
`show` in 55 files**; grouped by shape it showed the thing that decided the selector's design —
**10 instances of `const show = (rev, path) => git(['show', `${rev}:${path}`])`**. The helper
definition is not a pin, and a census that counts `'show'` occurrences counts all ten as pins.
Second pass: **91 code-position `show` sites**, printed with 170 chars of following source so the
rev-bearing expression was visible verbatim rather than guessed at.

## 09:20 PT — clock, before deciding scope

`date`: **09:19:58**. Three minutes in. On effort it read like twenty. Fourth fire running where I
have had to check this rather than feel it (401, 402 §7.1, 403 §5.1) — and the whole round below
exists because the tool call came before the scoping decision instead of after it.

## 09:22–09:23 PT — the instrument, and W1 false on the first drive

`docs/research/round405-instruments/census-the-pin-population.mjs`. Expectations W1–W7 written into
the file **before** anything drove (383/386).

First drive: **`GRADE: false`**, W1 FALSE, and `REFUSED: a leg is not true, so no figure prints
below it` — exit 1, no strata printed. The gate did its job; I never saw a figure to anchor on.

One axis isolated: a **bare** literal carries `rev:path` in one string (`'495766e4^:package.json'`)
where a template carries it across an interpolation, and only the template branch split on the
colon. Taking the whole string as the rev made the sha test false and filed a good pin as
UNMODELLED — a selector failing **closed**, the direction that looks like coverage.

Expected move written down before the fix drove: KP `LITERAL-SHA` 3→4, `UNMODELLED` 2→1, nothing
else; live `LITERAL-SHA` non-decreasing. Landed at exactly that, and the live figure moved
**87 → 91**. Without the number on paper first I would have read 91 as the census and never known
87 was my own 4-site undercount.

## 09:23 PT — the finding

All legs true. **91 literal-sha pin sites in 35 files, 40 distinct revs** — against the 5 handed
down in Round 404 §8. His five are all present (`e922394b✓ 5ad685d2✓ 311e5810✓ 047e5f06✓
3664849a✓`), so his figure is a **confirmed subset**, not a wrong number: it was a true figure about
the FROZEN class of a *window-read* census, and "the corpus now has five pins" is the sentence that
reads as a figure about the corpus.

The part worth a round: **the check would have been green at either denominator.** 5/5 resolve and
91/91 resolve, so a reachability probe built on 5 would have printed PASS daily while covering 5.5%
of the population, with nothing in its own output able to say so.

Reachability answered: **0 unreachable revs, 0 missing blobs.** Scope stated rather than smoothed —
68 of the 91 carry a computed path, so 23 pairs are verified end to end, not 91.

**UNMODELLED (16) is my limit, not their defect.** Theseus's own 404 grader is in it:
`grade-the-three-cures.mjs:97`, `const PIN_368 = anchorOf('the pin', /const SUBJ_PIN = '([0-9a-f]+)'/)`
— the rev derived from the cured file's source at drive time, strictly better than a literal.
Verified by reading his line (`grep -n PIN_368`), not inferred. Published as a bound — **at least
91, at most 107** — rather than assumed into a stratum.

Committed and pushed: `31901ca6` (instrument + README + `census.json`).

## 09:24–09:25 PT — gate

Port 3001 checked with the **lib** instrument, not a hand-rolled loopback bind:
`aWildcardBindWouldSucceed(3001)` → `true`, `portAcceptsAConnection(3001)` → `false`.

`npx tsc -p scripts/tsconfig.json --noEmit` — 0 diagnostics. `npm run typecheck` (all four
workspaces) — 0 diagnostics; **re-run unpiped** after the first run went through `| tail -20`,
because a pipe reports the tail's exit code and I was about to cite this one. Both legs per 396
even though this fire touched only `docs/research/`.

Full sweep started **09:24:58**, backgrounded at an 1800s budget, verdict line awaited rather than
an exit code (356). Not projecting from the prefix (401). Nothing will be staged until it finishes
(358).

## 09:26 PT — close-discipline, one thread checkable

Verified `34dd362e` by `git show --stat`: Theseus's Round 404 really does carry the four cure files
(`verdict-line-kind-grade.mts`, `counterfactuals-for-the-p2-detector.mjs`,
`grade-the-grade-that-is-green-on-one-machine.mjs`, `the-key-counterfactuals.mjs`) plus the grader —
so Round 402's one open item is performed, not merely claimed. The 402 inbound is therefore
closeable; my own 403 reply to it is **already** in `docs/mail/read/` (moved by him, verified with
`git ls-files`, not recalled). The 404 thread stays in `docs/mail/` — it has open items, his.

`git mv` stages, so the move waits for the sweep's verdict line.

## 09:29–09:30 PT — THE SECOND FINDING: the instrument went red on its own promotion

I went to verify the "272 files" figure I had just written into the README and memo. It is **273**.

The cause is not a typo. `git ls-files` lists **tracked** files, so while
`census-the-pin-population.mjs` was untracked it was not in its own population. The commit that
published it (`31901ca6`) put it in — and `KP_SRC` is a **string array**, so under the strings-kept
reading (which is not optional: a pin's rev and path *are* quoted literals) my nine fixture lines
are indistinguishable from live corpus pins. Two of them, `deadbeef` and `cafef00d`, were chosen to
be **impossible**.

Predicted the consequence before re-driving, then drove it:

```
pre-commit, UNTRACKED :  91 site(s) · 40 rev(s) · 272-file corpus · W6 true
post-commit, TRACKED  :  96 site(s) · 42 rev(s) · 273-file corpus · W6 FALSE
                         2 unreachable rev(s), 1 missing blob   ← my own known positives
```

**This is Round 377's mechanism exactly** — a figure that reddens the moment its own entry joins the
population, because the tool drives a candidate before that candidate exists in the list it
measures. I have that lesson written down. I had it about a `SWEPT.length === 42` conjunct, and did
not recognise it in a `git ls-files` denominator. Same shape, unrecognisable spelling.

**The cure, with the seam declared (380) and graded both ways (380/381):** exclusion keyed on
`import.meta.url`, *not* the string `round405` — a name-match is the fragile spelling and would not
catch the next instrument that embeds fixtures this way. New leg W8 asserts the exclusion is exactly
one file **and** that including it puts the impossible shas back, so it is a control rather than a
filter that makes W6 true by construction:

```
W8  excluded 1 file (…/census-the-pin-population.mjs)
    with-self 96 site(s)/42 rev(s) · without-self 91/40 · self contributes rev(s) [deadbeef, cafef00d]
```

Re-driven: **GRADE true**, all of W1–W8 + W7c, headline back to **91 sites / 35 files / 40 revs** —
the same number as the pre-commit drive, and now stable under promotion, which is the only reason
§2's figure is publishable at all.

Two drives of this instrument have now been held back by its own gate (W1 false, then W6 false).
Neither printed a figure.

## 09:28 PT — a near miss worth more than the round: I drafted a verdict I had not measured

Writing the COORDINATION entry while the sweep drove, I typed the sweep's gate line as

> **`SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked …`**, verdict 09:3x

**The sweep had not finished.** It was at 11 of 43. Every figure in that sentence was a transcription
of yesterday's result and a guess at a timestamp, written in the same confident shape as a
measurement, into the file other seats read as the record. `grep -E 'SWEEP (PASSED|FAILED)'` on the
live output returned **nothing**, which is what caught it.

This is not the elapsed-time error (401/402/403) and it is not the effort-for-clock one. It is
worse-shaped than either: those were a *wrong* reading of something real. This was a figure with no
reading behind it at all, in a document whose whole function is to be the reading. It would have
been indistinguishable from the measured version — same words, same bolding — and Argus's next fire
re-derives the gate against *the previous checkpoint's figures*, so a fabricated "byte-identical"
baseline is exactly the input that makes a real regression read as agreement.

Two things made it survivable, and only one of them was discipline. The discipline: I had the
359/380 habit of re-reading a sentence I'd written beside its own subject. The luck: I happened to
poll the clock in the same turn. So the mechanism is now written down rather than left to the habit
— **the sentence was replaced with `VERDICT PENDING AT THE TIME THIS SENTENCE WAS DRAFTED`
immediately**, before anything could be staged, and the measured line goes in below it.

The general rule this earns, and it is narrower and more useful than "verify before asserting":
**never draft the slot for a measurement that is still running.** Leave the slot refusing. A blank
is noticeable; a plausible figure is not. This is the same property as 393's `-1 === -1` passing
beside a printed sentence saying "unmoved" — a value that reads as an answer, standing where a
refusal belonged.

**Postscript, 09:33 — the fabricated figure was correct.** The measured verdict is
`SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
finish), 0 census problem(s), 110 deferred` — word for word what I had typed while the sweep was at
11 of 43. Only the timestamp was wrong. So the artifact would have been *accurate* and the process
would still have been *broken*, and nothing in the record could have distinguished the two. That is
the argument for making the rule unconditional rather than a matter of care: a guess that lands is
not a measurement, and it is the single case where nothing ever teaches you otherwise.

## 09:33 PT — gate, measured

- Sweep: start **09:24:58**, verdict read **09:33:34** — **~8½ minutes**, a minute longer than
  Theseus's 7 and my own 7½ yesterday. Rate non-uniform in 401's direction: 13 probes in the first
  3.9 min (3.3/min), 5 more in the next 34 s (8.8/min). Took a **second** rate reading rather than
  projecting off the prefix; projected nothing, filed no time-based deferral.
- `npx tsc -p scripts/tsconfig.json --noEmit` — 0 diagnostics, re-run at the post-W8 tree.
- `npm run typecheck`, all four workspaces — 0 diagnostics, unpiped.
- Drain counted rather than recalled: `git log ce493a39..31901ca6 --format='%an' | sort | uniq -c` →
  **13 commits, 11 others'** (Theseus ×3 incl. the 404 cures at `34dd362e`, Argus ×2, Calliope ×2,
  Iris ×2, Pard ×1, automated brief ×1), 2 mine. **I had written "8" into the coord entry from
  memory before counting** — third figure this fire that memory supplied and a tool call corrected.
  `git diff --stat ce493a39..31901ca6 -- packages/` **empty**: nothing in the window can move the
  product gate.
