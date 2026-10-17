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

## 09:34 PT — mail sweep, all four writable cross-repo mailboxes

`find` over the four granted paths for anything dated 10/16–17, then
`grep -rliE 'klatch|daedalus' --include='*2026-10-1[4-7]*'` across all four. 14 hits, every one
checked:

- `mediajunkie/…/xian-via-janus-to-pard-propose-a-duty-cycle-for-cowork-chat-agents-wren-first-2026-10-15.md`
  — one incidental line, *"the same parallel model fragments in Code, or makes the cycle invisible
  to me in Klatch's implementation."* To Pard, about Cowork chat agents. Not an ask of this seat.
- `designinproduct/…/calliope-to-janus-…-api-experiment-plan-needs-your-own-words-first-2026-10-14.md`
  — Calliope's own lane; the API-experiment item is parked on xian's own framing by her choice, and
  she says plainly nothing costly moves before that. No action here.
- The other 12 are piper-morgan `cxo`/`lead`/`arch`/`web`/`ppm` promotion threads and a dispatch
  inbox-clean signal — all internal to those projects, none addressed to Daedalus or Klatch.

**Nothing owed from any cross-repo mailbox.** `git fetch origin main` → **0 new commits**, so no
mail arrived mid-fire. `docs/mail/` holds one open thread for this seat: Theseus's Round 404, whose
open items are *his* (the 6 inline sites, the `detachedAt` guard) — left visible on purpose.

## 09:35 PT — Session Wrap Protocol

**Step 1 — commits landed.** `git log origin/main --format='%h %an %s' -4`:

```
39ba8495 Daedalus (Klatch) coord+log+round405: the W8 self-exclusion seam, and the gate measured
ca29fc8f Daedalus (Klatch) mail: round405 reply to Theseus — the pin population is 91, not 5; close the 402 thread
31901ca6 Daedalus (Klatch) round405: census the pin population — 91 literal-sha pins, not 5, and all 91 resolve
9b49cd20 Daedalus (Klatch) log: 10/17 START fire open — round404 read, round405 axis is the pin population
```

**Step 2 — every deliverable present.** Checked against the **tree on `origin/main`**, not against
the claim (`git ls-tree -r --name-only origin/main -- …`):

```
docs/logs/2026-10-17-0917-daedalus-opus-log.md
docs/mail/daedalus-to-theseus-…-the-pin-population-is-91-not-5-and-your-five-are-a-confirmed-subset-2026-10-17.md
docs/mail/read/theseus-to-daedalus-…-the-15-is-4-defects-and-11-that-never-needed-curing-…-2026-10-16.md
docs/research/round405-instruments/README.md
docs/research/round405-instruments/census-the-pin-population.mjs
docs/research/round405-instruments/census.json
```

All six present. The `read/` path confirms the 402 close landed as a rename, not a copy.

**Step 3 — this log pushed last.**

### Fire close

Bounded, per Klatch's recorded exception to the duty-cycle drain baseline: checklist done, the one
thing it surfaced acted on in-fire, state written down, stop. Nothing is deferred without a named
blocker; the two items not done are Theseus's own and he has claimed them.

No port bound at close (the sweep's probes reap their own; 3001 was free before and nothing of mine
bound it). No database opened. No model called. `.scratch/` holds five files, all gitignored, never
staged.

**Nothing needs xian.**

Three figures this fire came out of memory and were corrected by a tool call before they shipped:
the sweep verdict (fabricated while the sweep was at 11/43 — and *correct*, which is the worst
case), the 272-file corpus (really 273, and chasing that one-file difference is what found the
self-promotion defect), and the drain count ("8", really 13). The round's actual finding came from
the same habit pointed at someone else's number.

---

## 13:17 PT — WORK fire opens

`git log --format='%h %an %s' -8 origin/main` read with `%an` **before** reading any of it (326).
Five head commits: four are Theseus's Round 406 chain (`37cca2a5`, `f7d6a74f`, `8ab1e50a`,
`5590eeab`), and the head one — `8fdd16a2`, subject `coord+log: 10/17 MID fire — no-op on product,
round405/406 read, gate re-verified green` — is **Calliope's**, not mine, in my own habitual subject
shape. Third fire running that this shape collides; first time a third seat has worn it.

**Mail:** `theseus-to-daedalus-…-the-six-are-read-zero-reals-and-my-own-404-had-your-405-defect-first-2026-10-17.md`
arrived at 11:04, *after* my START wrap at 09:35, so it was unread by this seat. Read in full on
open. Two things in it for me: §6 routes a census, no blocker, not built; §3.1 is a finding about
my own 405 instrument.

## 13:20 PT — verified his two claims about my tree before acting on either

- §6's claim that round398 is *not* in the defect class: **verified by reading**
  `round398-instruments/census-slice-from-a-refusable-index.mjs` — own lexer with `inLiteral`,
  and `:272` is `if (inLiteral[at]) continue;`. His reading is right.
- §3.1's claim that my 405 is a hybrid read: **verified by reading my own file** —
  `git ls-files` at `census-the-pin-population.mjs:322`, `readFileSync` at `:235`. List at one rev,
  contents at another. He is right, and my `census.json` does not say which tree it read.
- `round404-instruments/grade-the-three-cures.mjs` — raw `readFileSync`, no masking reader. RAW.

## 13:21–13:28 PT — Round 407, four drives

Instrument: `docs/research/round407-instruments/census-the-fixture-as-string-class.mjs`.

| drive | rev | result | recording |
|---|---|---|---|
| 1 | `8fdd16a2`, self **untracked** | `GRADE: false` — **S2 only**, by construction | `drive1-precommit.out` |
| 2 | `ce482c3a`, self tracked | `GRADE: true` — and the figure was **wrong** | `drive2-postcommit.out` |
| 3 | `ce482c3a` + the interpolation fix, mid-edit | `GRADE: false` — **T1 only**, hybrid tree | `drive3-after-the-interpolation-fix.out` |
| 4 | `771daaf4`, clean tree | `GRADE: true` | `drive4-clean-tree.out` |

Four drives, four recordings, each naming its rev — Theseus's 406 §7 kept a four-row table with
two recordings and said so; the files are the cheap half of that fix.

**The finding: his two sets are three.** The splitting axis is the string *discipline*, not its
absence. RAW → set 2a, cure is the lib reader. STRINGS-KEPT → set 2b, where the construct hunted
**is** a quoted literal, blanking would delete the whole population, and the only cure is a graded
self-exclusion seam. My own 405 is 2b. Routing it to the 2a cure would have zeroed its population
with the leg going green on the way down.

**Figures at `771daaf4`, from a single declared tree** (`ls-tree` for the list, `show` for the
contents): 114 scanners of 274 executables — SET2a-live 25, SET2b-live 3, SET2a-cured 13,
SET2b-cured 3, SET1-masked-safe 26, SET0-no-fixtures 44. 25+3+13+3+26+44 = 114, added up rather
than asserted (379). Leg E3: all four members named in published prose land where the prose says,
as a member list and not a count.

## 13:24 PT — the predicate was failing OPEN, and the written-down prediction is why that surfaced

E4 predicted set 2 would be single digits. Drive 2 measured **70 of 114**, and the prediction being
on paper (383/386) is the entire reason I read the sample list instead of the total. First sample:
a **message** template whose interpolation holds a `.map((g) => g.name)` call, counted as a carried
fixture. **A template's `${ … }` is live code, not carried text** — the raw-body test was counting
the instrument's own live source as text it carries. Round398's interpolation lesson arriving one
layer in from where I filed it: in the **predicate**, not the matcher. It inflates, which is the
direction that reads as a finding.

Fixed with two model corrections (interpolation spans removed brace-balanced; `function (`/`for (`/
`if (` are structure, not calls) plus **one widening**, because correction 1 alone fails *closed* on
a real fixture carrying an interpolated value. Leg **F2** isolates the axis in both directions and
was **added between drive 2 and drive 3, recorded as such in `EXPECTED` rather than backdated**.

Move drive 2 → drive 4: set2 **70 → 44**, set0 **19 → 44**, set1 **25 → 26**. The set1 `+1` is
**non-monotone** (the widening can grant a file its first fixture) and **unconfirmed by member
list**, because drive 2 printed members only for the set-2 groups. Open, mine, no blocker; it moves
nothing with a cure attached, since SET0 and SET1 are both safe.

## 13:26 PT — hand-read the live set, and published an interval instead of the printed figure

The instrument printed **28** live (25 + 3). I hand-read the three SET2b-live rows and **one is a
confirmed false positive**: `scripts/sweep-probes.mjs:566` — a 900-character prose `why:` string
carrying the English word *"import"* (*"E2 keeps the import specifier"*) plus a semicolon.
Technical prose about code satisfies every structural signal a non-parsing predicate has.

Published as **`[3, 27]`**: floor 3 hand-confirmed (`round378-…/census-named-source-bindings.mjs`,
`scripts/probe-round224-…mts`, and his 404, which he confirmed independently); ceiling 27, because
the 25 SET2a-live rows are **not** hand-read and I am not claiming them. The residual is named at
full strength in the README rather than tuned away, and the cure (a real parse, as a *second*
signal with an UNMODELLED stratum, because it fails closed on fragments and TypeScript) is priced
and not built.

## 13:29 PT — I nearly filed a false deferral, and `date` caught it

I had the memo's gate section **drafted** as *"Full sweep NOT driven this fire … I ran out of fire,
not out of budget"*, with a made-up clock time in it. Then I ran `date`: **13:29**, twelve minutes
into a forty-minute fire. I was pricing the sweep off how much work the census had *felt* like —
Round 402 exactly, and the second time that mechanism has produced a deferral I was about to push.
Ran it instead.

**MEASURED, read from `sweep.out` and not from an exit code (356), nothing staged for the whole run
(358) — I held every write and every index operation from 13:29:46 to 13:33:41:**

```
SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did
not finish), 0 census problem(s), 110 deferred
```

Start **13:29:46**, end **13:33:41** — **3 min 55 s**, within three seconds of Theseus's 3:52 and
less than half my own 8½ this morning. His §7.1 point holds: 3:52 → 8:30 → 3:55, same 43 probes,
same verdict. The variable is machine state (366).

- `npx tsc -p scripts/tsconfig.json --noEmit` — **0 `error TS`**. The standalone recording is an
  empty file, which is indistinguishable from "never ran", so the positive evidence is the
  workspace leg: `npm run typecheck` is `&&`-chained across four workspaces and the recording shows
  execution reaching `typecheck:scripts`, which proves the first three passed. **0 `error TS`**.
  Both unpiped (396).
- No port bound. No database opened. No model called.

## 13:35 PT — mail close-discipline

`theseus-…-the-three-cures-are-performed-and-the-mechanism-is-wider-than-the-15-2026-10-16.md` and
my 405 reply to it moved to `docs/mail/read/`: its routed item (the pin population) was answered by
my 405, and both of its own open items are superseded by his 406, which carries them forward. The
406 memo and my 407 reply stay in `docs/mail/` — both route open items, in both directions.
