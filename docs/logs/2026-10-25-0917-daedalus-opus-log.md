# Daedalus session log — 2026-10-25 (Opus 5)

Day's first Daedalus fire. Scheduled duty-cycle START fire, worktree
`/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.

---

## 09:17 — Open, briefing

Worktree synced by the wrapper, verified at `origin/main` = `255d9180`, clean tree.

**Authorship checked before assuming anything was mine.** Five head commits on open, **none of
them mine**:

```
255d9180 Argus (Klatch)       coord+log: 10/25 START fire — no-op, Round 451 close landed not mine…
0b9cd753 Calliope (Klatch)    coord+log: 10/25 START fire — no-op, gate byte-identical…
72a0eefb Iris (Klatch)        coord+log: 10/25 START fire — no-op, Round 451 close landed not mine…
eabdee33 Pard (Mediajunkie)   briefs: fire-depth report 2026-10-25
410cae30 Claude               briefs: cross-pollination 2026-10-25
```

Three commits whose subject lines read "10/25 START fire — no-op" are the other three seats', not
mine (331 — `--oneline` hides `%an`). No Daedalus log existed for 10/25; this is the day's first
Daedalus fire.

`docs/mail/` read on arrival, not batched. One memo new to this seat: Theseus's **Round 451**,
`theseus-to-daedalus-…-the-real-exemplar-key-agrees-with-your-verdict-and-38-of-your-46-are-an-axis-your-key-held-constant-2026-10-24.md`.
Read in full before anything else.

## 09:19 — His round verified before anything of mine was built

Re-drove his instrument in this tree and diffed against his own recording:

```
$ diff round452-instruments/drive0.his-451-redriven-here.out \
       round451-instruments/drive3.postcommit-self-exclusion-live.out
1c1   … at HEAD: 404 .out, 4 excluded … 400 kept   (his: 402 / 2 / 400 kept)
14c14 … HEAD = 255d9180                            (his: 01f23130)
```

**2 lines of 17, both his declared movers.** `kept` stayed 400, so the population is identical and
every leg verdict is byte-identical. Recorded at both hashes (409 / 437).

## 09:20–09:22 — Census first, three passes, before any cure

His §6.1 routed "apply `ID_GRAMMAR` to `readCorpusRows`'s legacy branch". Measured the routed
instrument before building it (378):

- **Pass 1** (`drive1.census.out`) — `ID_GRAMMAR` is `/^[A-Za-z0-9_.:-]+$/`; the legacy branch's
  inline capture is `([A-Za-z0-9_.:-]+)`. Same class, bounded by the surrounding regex. Rejects
  **0 of 1045**. The routed cure is a **no-op**.
- **Pass 2** (`drive2.census2.out`) — reconciled my 28/404 against his published 26/400: the gap is
  exactly his self-exclusion (his own 2 round-451 recordings). **Also failed its own hand reading:**
  the table was typed from expectation, 15 of 16 disputed ids came back unclassified and 16 of my 18
  prose words occur zero times, so the confusion matrix was keyed on **13 rows of 1045** and still
  printed `separating=true`. Committed as the record of that failure.
- **Pass 3** (`drive3.all-ids.out`) — dumped **all 116** distinct id spellings with a real line each.
  The hand reading in the graded instrument is keyed on this dump, not on what I expected (415).

Reading the dump is what produced the finding: the corpus is **three** kinds, not rows-and-prose.
`LEGROW` 818 · `TABLE` 203 (record lines whose second column is data) · `PROSE` 24.

## 09:28 — First drive of the graded instrument: 2 reds, both mine

```
VERDICT/1 RED legs=11 red=[B2,B5] refused=[] preds=2 refuted=[P2] prefused=[]
```

- **`B2` RED against a tree where both cures were in** — the absence key matched the regex quoted
  in the docblock explaining the cure. 424, in a file I had just written. Fixed by stripping
  comments first, with two controls (stripper kept the code; stripper actually stripped).
- **`B5` RED, and that was the real discovery** — 446 published no H3 line at all.

## 09:28–09:29 — 446 was dead, and it was my own Round 450 guard

```
$ node docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs   → exit 1
Error: renderRowSet rendered rows its own reader refuses as DUPLICATE_ROW_ID (LEG x)
```

**Attribution driven, not assumed.** Wrote the *pinned* pre-round 446 source to a scratch sibling
(same directory, so `../lib/verdict.mjs` resolves at the same depth — 418) and ran it:

```
$ node docs/research/round446-instruments/.scratch452-pinned.mjs   → exit 1
Error: renderRowSet rendered rows its own reader refuses as DUPLICATE_ROW_ID (LEG x)
```

Identical. **So the breakage predates every edit in this round.** Cause: 446 harvested the three
token spellings by calling `renderRows([{id:'x',ok:true},{id:'x',ok:false},{id:'x',ok:null}])` —
three rows sharing one id, used as a vocabulary lookup — and Round 450 (mine) gave `renderRowSet` a
round-trip closure guard whose refusals include `DUPLICATE_ROW_ID`. Since that commit, 446 exited
non-zero publishing nothing: no verdict line, no rows.

Repaired by reading the exported `LEG_TOKENS` table. The guard is right and was not loosened.
446 now publishes `VERDICT/1 ok legs=5 red=[] refused=[] preds=1 refuted=[] prefused=[]`
(`drive7.r446-alive-again.out`).

It went unnoticed because **nothing re-drives 446.**

## 09:34 — Second defect of mine: the 448 cure read zero legs

First version filtered on `shape === 'canonical'` on the reasoning that the subject imports
`renderRows`. It **imports it and never calls it** — the padded legacy shape is hand-rolled, as in
446. Result:

```
clean run: ok · leg tokens {}
BAD  KLATCH_R448_LEGONLY  →  G2: (absent) → (absent)
BAD  KLATCH_R448_BLINDPIN →  G4: (absent) → (absent)
BAD  KLATCH_R448_NOTIMPLEMENTED → G5: (absent) → (absent)
EVERY DECLARED CRIPPLE MOVES ITS OWN LEG AND ONLY ITS OWN LEG: false
```

Three cripples graded as not responding when the **reader** had read nothing — a reader failure
published as a verdict about its subject (441). `record-cripples.mjs` now declares the id set it
grades and keys that declaration against the clean run, so this fails by its own name. Re-driven:
all three GOOD, declaration holds (`drive10`).

## 09:37 — Gate

```
drive11.graded-after-448-rerecord.out
VERDICT/1 ok legs=13 red=[] refused=[] preds=2 refuted=[] prefused=[]
PRED P1 LANDED   PRED P2 LANDED
```

```
$ npm test
Test Files  26 passed | 13 skipped (39)
      Tests  333 passed | 13 skipped (346)
census PASSED
```

## 09:40 — Post-commit re-drive

```
$ diff drive11.graded-after-448-rerecord.out drive12.postcommit.out
19c19
<      population rev 255d9180 (literal) · HEAD = 255d9180
>      population rev 255d9180 (literal) · HEAD = 2e23293a
```

**1 line of 19 moved — the HEAD stamp, the only declared mover.** Every leg verdict and every pinned
figure byte-identical. The literal pin held (450 §7.2).

---

## Session Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --format='%h %an %s' -3
f1881586 Daedalus (Klatch) mail: Daedalus → Theseus, Round 452 — his §6.1 cure is a no-op, no id class separates…
2e23293a Daedalus (Klatch) round452: no id class separates, the liveness reader is cured, and Round 450's guard…
255d9180 Argus (Klatch)    coord+log: 10/25 START fire — no-op, Round 451 close landed not mine, gate byte-identical
```

Both commits present, both authored `Daedalus (Klatch)`.

**Step 2 — deliverables, each stat'd (counted with `readdirSync`/`statSync`, not `grep` — 301):**

```
OK      8648  round452-instruments/README.md
OK     31621  round452-instruments/no-id-class-separates-and-the-liveness-reader-is-cured.mjs
OK      8233  round452-instruments/census-the-legacy-id-grammar-and-the-liveness-reader.mjs
OK      7496  round452-instruments/census2-reconcile-his-26-and-hand-read-the-drops.mjs
OK      2001  round452-instruments/census3-dump-all-116-distinct-ids.mjs
OK      2994  round452-instruments/drive0.his-451-redriven-here.out
OK       692  round452-instruments/drive6.r446-PINNED-source.out
OK      8001  round452-instruments/drive7.r446-alive-again.out
OK      1285  round452-instruments/drive10.r448-cripples-rerecorded.out
OK      7650  round452-instruments/drive11.graded-after-448-rerecord.out
OK      7650  round452-instruments/drive12.postcommit.out
OK     42361  round446-instruments/grade-my-own-oracle-predicate.mjs
OK      8009  round448-instruments/record-cripples.mjs
OK     51678  lib/verdict.mjs
OK     11114  docs/mail/daedalus-to-theseus-…-450-guard-had-killed-446-2026-10-25.md
OK      8193  docs/logs/2026-10-25-0917-daedalus-opus-log.md
OK   2763253  docs/COORDINATION.md

missing = 0  (all deliverables present)
```

**Step 3 —** this log is committed last.

## Open, named, each with a blocker

1. **Separating `readCorpusRows`'s TABLE bucket.** Blocker: `A2` rules out an id character class;
   a *structural* key (column alignment, or the renderer stamping its own output) is unpriced, and I
   will not guess at a key I have not measured.
2. **The `GRADE <id>: true` grammar.** Blocker: it is a third grammar, not a widening of either
   existing reader. Neither his 707 nor my 1045 covers it; scoping it is a round, not a tail.
3. **A sweep that re-drives old round instruments.** Blocker: §5 shows a guard added in round N can
   silently kill an instrument from round N−k with no gate noticing, and I have measured exactly
   **one** instance. Building the sweep off a single instance would be 415. I am not claiming 446 is
   the only one.

---

# 13:17 — WORK fire, same day. Round 454.

Second Daedalus fire of 10/25. Worktree synced by the wrapper; `git log --format='%h %an %s'`
checked on open, and the head commit `d41a3e88` is **Calliope's** MID-fire no-op, not mine (331 —
`--oneline` hides `%an`). No new Daedalus work since my 09:40 wrap.

Mail read on arrival. One memo new to this seat:
`theseus-to-daedalus-…-your-450-commit-has-a-second-victim-and-the-sweep-is-built-2026-10-25.md`
(Round 453). Read in full before anything of mine was touched. It hands over one item explicitly
(§1) and one lead (§7), and declines a pricing decision (§8).

## 13:19 — His second victim, reproduced before repaired

Drove Round 449's `resolve-the-variable-write-targets.mjs` at HEAD. It dies exactly as he says:

```
Error: renderRowSet: W1's detail contains a newline: "THE EXTRACTOR READS CALL SITES…"
  at verdict.mjs:314 → renderRowSet → renderRows → renderTail → …449…:890
```

`drive0.r449-at-head.{out,err}`. **It re-stamped no tracked file** — porcelain empty before, only
the untracked round dir after. His §5 lists round 449 among the 5 of 52 that re-stamp when driven;
either that row is a different file in the directory (`record-drives.mjs` and `postcommit-rediff.mjs`
both write) or it needs re-reading. I have not checked which and am not claiming his figure wrong.

**His localisation is off by one level.** He names `W10`'s detail. The newline is in the two
HELPERS at 449:111-112, so all 10 legs and both predictions carried it; `W1` is only what the throw
names, because `renderRowSet` maps and the first item throws. Repaired with the same
`\s+ → ' '` normalisation rounds 451 and 452 already use. Guard not loosened.

## 13:22 — Three key defects in my own population figure, all before publication

My first §1 figure: *"21 helpers across rounds 431..452, exactly one embeds a newline."* All three
numbers wrong, three separate reasons:

1. it read the **working tree, after I had cured the defect** — so its single newline hit was my own
   README quoting the pre-repair line back at me;
2. `legs.push({` is **one of two** row-helper tokens, and in 449 the newline is in both, so a
   one-token key reports one where the truth is two;
3. it globbed `docs/research/` including `.md`, which is how the README entered its own population.

Now `census1-row-helpers-that-embed-a-newline.mjs`, parameterised on a rev, with a gate row per
defect. At the pre-repair rev `d41a3e88`: **54 helper lines across 28 rounds, 2 with a newline,
both 449's.** Per-token 20 + 34 = 54, so no line carries both keys.

## 13:26 — Reviving it exposed a movement, and my first hypothesis was false

449's four committed recordings all publish `VERDICT/1 ok legs=10 red=[] refused=[]`. At HEAD it
publishes `REFUSED … refused=[W10]`, reason `446 reader sliced: NOT FOUND · 448 reader sliced: NOT
FOUND`.

First hypothesis: my 452 repairs deleted the two anchors. **Checked before writing it anywhere —
false.** `grep -c` finds both anchors at HEAD, one each.

`probe0` lifts HIS `sliceRe` out of HIS source (brace-balanced over blinded text, six structural
gate rows) and bisects it. `drive2`: anchors found, statement spans 41 B and 205 B, `regex lifted:
null` for both. **The anchors survived; the regexes behind them did not** — 452 repaired both
readers to read the lib's exported `LEG_TOKENS`/`legRows`. So the culprit was mine after all and
the mechanism was not the one I would have published.

My KP for that bisector passed **for the wrong reason**: it lifted
`/ now the whole STATEMENT, found by brace/` out of a **comment**, because the span is found on
blinded text while the lift is taken from raw. It is a positive for *compiles*, not for *lifts a
regex*. Recorded as a latent defect of 449's slicer; not repaired, no current victim, his file.

**What this means for his sweep:** it keys liveness on exit code, and 449 would have moved
`ok → REF` at 452 whether or not it was dead. An instrument can be alive and have stopped reporting
what it reported. `alive=44` is a bound on the hard deaths only.

## 13:29 — His §7 lead traced to call sites

`census2` (351 call sites over 640 tracked files at the rev) + `census3` (one-level same-file
resolution, with `firstArg`/`classify` **sliced out of census2** rather than retyped):

```
known STRING at the call            27        BUFFER at the call or one level up      0
known STRING after one level        68        PARAM:caller-supplied                  84
                                              AMBIGUOUS multiple-bindings            69
                                              RESOLVED-TO-UNMODELLED                 66
                                              UNRESOLVED no-declaration              23
                                              NOT-A-SIMPLE-IDENTIFIER                14
27 + 68 + 256 = 351   (gated, not eyeballed)
```

The 0 is a measurement, not a clearance: the gate row that makes it one is the resolver's own
`RESOLVED-TO-BUFFER` KP — a resolver that could never say BUFFER would report 0 against any tree.

Runtime oracle: **three** behaviours on non-strings, not one. `null`/`undefined` already THROW;
`42`/`{}` return `""`; an array returns `"ab"`; a Buffer returns a digit string in which the comment
bytes **survive**; a `String` object behaves exactly like the string control.

His `importers=33` is **not** contradicted — his denominator is `scripts/lib` importers inside his
168-instrument sweep population, mine is every tracked source file. I reproduced none of his three
figures under his own keys and am correcting none of them.

## 13:31 — The cure, and the gate that mattered was not npm test

`stripSource` now throws `StripSourceInputError` on a non-string. Justification is the **84
parameter sites**: a refusal covers all 84 without tracing any of them, which is why it is worth
doing on a measured surface of 0. `String(src)` would make the Buffer case permanently silent.

Ran the **full driving sweep**, not the census — `npm test`'s own output says *"NOT CHECKED: none of
the 43 swept probes was driven."* `drive6`: **41 of 43 green, 2 red.**

* **`probe-round303` — real, and against me.** `[B2] FAIL lib/strip-source.mjs: exported but not
  declared — StripSourceInputError`, with typecheck at 0 errors, and I **had** declared it. Its
  `declaredNames` keys on `const|function`; the `exportedNames` beside it has modelled
  `const|let|function|class` since the probe was written. **The declaration was right and the
  standing drift guard was blind.** Widened to include `class`; remaining kinds named, not silently
  added; `B2a` grades the reader (KP per modelled kind + 2 unmodelled KNs) and `B2b` asserts no
  declaration file exports a kind it cannot see, so the next `interface` reddens by name. 20 checks
  where 18.
* `probe1` drives the counterfactual, because B2a was added beside the widening it grades: kind list
  and KP rows sliced from the probe, pre-454 list derived by dropping `class`. **PRE 3/5, POST 5/5,
  exactly the 2 class rows moved**, and the indentation row moved in neither — a symmetric limit of
  both readers, pinned by a KP row rather than repaired.
* **`probe-round260` — not a regression.** Its `F2` is keyed on `git status --porcelain --
  scripts/verify-tsx-guard.mjs scripts/lib/strip-source.mjs` being empty. Read the predicate rather
  than assuming. So any **uncommitted** edit to `strip-source.mjs` reddens the standing sweep
  regardless of correctness — a false-positive generator aimed at the module with 58 importers.
  Not repaired; sweep re-driven on a clean committed tree instead (`drive9`).

That last one is my own recorded lesson arriving from the other side: don't touch the tree while
the sweep drives. I edited first and swept second, which made `drive6` invalid as a gate.

## 13:40 — Clean re-drive, and a pin that reddened on its own promotion

`drive9` on a clean committed tree at `28833525`: **42 of 43 green, 1 red.**

* **`probe-round260` PASSES.** That is the dirty-tree diagnosis driven rather than argued.
* **`probe-round303` red at exit 0:** `pin says 18, observed says 20 — the pin needs bumping`. My
  two new checks moved the count and `sweep-probes.mjs` pins it. Re-pinned at 20.

**And the re-pin was itself caught**, by the entry-schema check this repo already has:

```
CENSUS RED — schema  probe-round303…mts: why says 18 where expect pins 20
```

Leaving `18/18` in the `why` line reports a mismatch while the probe is green. The remedy is the one
the round 320 and 426 entries record in the same words: move the original promotion figure up into
a comment, leave only the current `N/N` on the `why` line. `--census` green after the fix.

## 13:46 — Push collision, caught by fetch

First `git push origin HEAD:main` **rejected, non-fast-forward.** `git fetch` showed two Argus
commits (`306eccbc`, `8dc53936`) landed while I was driving. Compared the touched file lists before
rebasing — no overlap (he touched `COORDINATION.md` and his own log; I touched research, my log,
mail and `scripts/`) — then `git rebase origin/main`, clean, and verified my commit present with
`%an` before pushing. Pushed as `a4f42fc7`.

## Session Wrap verification

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --format='%h %an %s' -5
a4f42fc7 Daedalus (Klatch)  round454: re-pin probe-round303 at 20 checks, and the clean re-drive confirms the 260 diagnosis
8dc53936 Argus (Klatch)     coord+log: 10/25 WORK fire correction — a 12th commit falsified the empty-diff claim
306eccbc Argus (Klatch)     coord+log: 10/25 WORK fire — no-op, gate byte-identical, needs-you unchanged at 1
28833525 Daedalus (Klatch)  round454: stripSource refuses a non-string, and the sweep caught my own .d.mts as undeclared
daac6b13 Daedalus (Klatch)  round454: his §7 lead traced to call sites — the direct-Buffer surface is 0 and 92% of sites are a variable
```

Four Daedalus commits this fire (`4a05dbf8`, `daac6b13`, `28833525`, `a4f42fc7`), all authored
`Daedalus (Klatch)`, author checked rather than assumed.

**Step 2 — deliverables, each stat'd.** Listed in the commit bodies; `docs/research/round454-
instruments/` carries README, `census1`/`census2`/`census3`, `probe0`/`probe1`, and drives 0–10.

**Step 3 —** this log entry and `COORDINATION.md` are committed last.

## NOT CONFIRMED — stated rather than claimed

The post-re-pin sweep drive (`drive10.probe-sweep-after-the-repin.out`) was **still running when
this fire's budget ran down**, at 7 of 43 result rows. So:

* `probe-round303` is green **standalone** — `drive7`, `All 20 regression checks passed`, exit 0.
* `node scripts/sweep-probes.mjs --census` is green after the `why` fix.
* **I have not seen a 43/43 driving sweep.** The next Daedalus fire should run
  `node scripts/sweep-probes.mjs` first and read its verdict line before anything else.

## Open, named, each with a blocker

Carried in `round454-instruments/README.md` §9 — seven items, each with a named blocker. The two
that are mine and unblocked by anyone else: the **verdict-drift census** (blocker: cost, and it is a
decision rather than a deferral) and **confirming the sweep at 43/43** (blocker: this fire's
budget, nothing else).

## 13:58 — Update to the NOT-CONFIRMED item above: the red row is now green IN the sweep

`drive10` kept running past the point where I wrote the entry above. At 37 of 43 result rows:

```
line 56:  PASS    exit   0  probe-round303-typecheck-grades-the-declaration-and-never-the-thing-it-describes.mts
          0 FAIL / RED / ERROR rows in 37
```

So the **specific red is confirmed cured inside the sweep itself**, not only standalone — the
re-pin at 20 is what `sweep-probes.mjs` now reads, driven, and `probe-round260` is green in this
drive too.

**Still not observed:** the sweep's own final verdict line. 6 of 43 rows had not been produced when
this fire closed, so I have **not** seen `SWEEP OK` / a 43/43 tally. The correct reading is: every
row produced so far is green, including both rows that were red, and the tally line is unread.
`drive10.probe-sweep-after-the-repin.out` is committed partial — exactly as far as it got — rather
than withheld or described from memory.

Next Daedalus fire: run `node scripts/sweep-probes.mjs` and read its last line before anything else.

## 14:04 — It finished. The sweep is 43/43 and the NOT-CONFIRMED item above is closed

```
$ tail -1 docs/research/round454-instruments/drive10.probe-sweep-after-the-repin.out
SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran but did not
finish), 0 census problem(s), 110 deferred
```

Read off the verdict line, not inferred from the absence of RED rows — exit 0 without a summary
line is not a measurement, and this one has both. The two 13:40 entries above are superseded: the
sweep IS confirmed at 43/43 after the re-pin. Both previously-red rows are green in this same drive
(`probe-round260` on a clean tree, `probe-round303` at the new pin of 20).

Final gate for Round 454, every layer driven in this fire:

| gate | result |
|---|---|
| `npm run typecheck` | 0 `error TS`, all four workspaces |
| `npm test` | 26 passed \| 13 skipped (39) · 333 passed \| 13 skipped (346) · census PASSED |
| `node scripts/sweep-probes.mjs --census` | `CENSUS OK` after the `why` fix |
| `node scripts/sweep-probes.mjs` (full driving sweep) | **SWEEP PASSED — 43 of 43 green, 0 red, 0 blocked** |

Nothing is left unconfirmed from this fire. The open items in
`round454-instruments/README.md` §9 each carry a named blocker, and none of them is "budget".


---

## 17:17 — STOP fire open, briefing

Third Daedalus fire today (START 09:17 → Round 452, WORK 13:2x → Round 454, this STOP fire →
Round 456). Wrapper-synced worktree, clean tree, `origin/main` = `89ace9dd` and `0 0` ahead/behind.

**Authorship checked before assuming anything was mine** (`--oneline` hides `%an`): of the three
head commits, `89ace9dd` is Calliope's SWEEP-fire no-op and `51393452`/`c435d600` are Theseus's.
Mine ended at `9ca2b261` (13:43).

Mail: one new memo addressed to me —
`theseus-to-daedalus-…-your-doubt-about-my-restamp-row-was-right-and-your-two-routed-items-are-one-item-2026-10-25.md`.
Read in full, acted on in this fire.

**One item he logged as owed to me was already done before I read the memo.** His §5 and §6.5 say
the `alive=44` label correction is "not written this fire, first in my next one" — but `51393452`,
pushed after the memo, writes it into Round 453's README along with the withdrawal of the 5-of-52
row to 2. Verified by reading the commit, not by recalling it. Nothing owed; said so in my reply.

## 17:2x — Round 456, the unit chosen

His §3 is the sharpest thing in the memo: *a leg that pins a defect inverts when the defect is
cured, and a refusal for an unrelated reason hides the inversion.* Testing it on a population
rather than agreeing with it is the unit.

Rejected first design: scan source for defect-pinning legs (`!x`, `=== 0`). "Pins a defect" is not
decidable by a scanner and that key returns a number smaller than the truth with unknown slack —
the direction that has cost me three rounds. Took **runtime drift** instead, which is decidable.

Selector, censused rather than assumed: `git ls-tree` at the rev → `.mjs` under `docs/research/`
that call the shared emitter and are not the emitter. **12 members.** One excluded on a *measured*
property of its own source (it runs `git checkout` over paths it does not own — his §2 defect,
`A5` patched but not re-driven). 11 subjects. The cell is not in its own population, structurally:
it is untracked at the rev `ls-tree` reads.

Also censused the leg-helper mechanism before trusting any reader: 11 instruments, **two** helper
signatures (`leg(id, what, detail, ok)` ×8 and `leg(id, ok, what)` ×3). That is the
sibling-readers-with-different-kind-models trap, and it is why the comparison was keyed on the
PUBLISHED verdict and not on source at all.

## 17:3x — `drive1`: `D3` RED, and the KP earned its keep

`drive1.drift-census.out` — `VERDICT/1 RED legs=8 red=[D3]`. Three defects in my own instrument,
every one visible only because the KP and the printed detail were there:

1. the join refused whenever a cell's own recordings disagreed with each other — five of eleven in
   `AMBIGUOUS_BASELINE`, the KP among them;
2. `PRED` rows were outside the comparison;
3. the printed label was not keyed on the measurement (it read `identical` whenever LEG tokens
   agreed, so all five ambiguous members printed `[identical]` while their signatures disagreed).

## 17:4x — `drive2`: the figure, and `D3` RED again for a NEW reason

`drive2.drift-census-repaired.out`:

```
BUCKETS {"IDENTICAL":5,"DRIFTED":4,"NO_BASELINE":2,"TIMEOUT":0,"NO_VERDICT":0} sum=11 subjects=11
FIGURE  drifted 4 of 9 MEASURED  (population 12, subjects 11, unmeasured 2)
```

444, 446, 450, 451 drifted. 442, 443, 448, 452, 455 identical. **All eleven exit exactly as their
own verdicts say they should**, so the exit-code sweep sees none of the four.

Hand-read at HEAD, not inferred from the verdict: 450's `W6` and 451's `T2`/`T3`/`T4`/`T8` are RED
because Round 452 cured the two hand-rolled readers they slice from source — 446:401 is now
`const legLines = (t) => legRows(t).length;` (no regex literal on the line) and
`record-cripples.mjs` contains `l.match(` **zero** times, both checked by reading the files.
**Five of my own legs compute a refusal and then conjoin it away into a false RED where REF was
correct.** His §3 is one instance of his and five of mine, in two cells.

And `D3` went RED a second time, for a better reason: fixing defect 2 above widened `parse`'s
`ids`, **and `ids` was also the join key**, so the KP went `AMBIGUOUS_BASELINE → NO_BASELINE`.
A key that SELECTS the member must not move when the property being measured moves.

## 17:5x — what landed, and what did not

Join fix (join on the LEG id set alone; compare LEG and PRED both) is **in the committed cell and
NOT re-driven** — blocker: fire budget, ~2.5 min per drive. `drive2` is labelled the pre-fix
recording in README §6, and the expected move is written down **before** any drive: 449
`NO_BASELINE → DRIFTED` carrying `LEG W10 true→null`, figure 5 of 10, `D3` green.

Declared limit (README §8): 444 and 446 drift `rows-equal` with a differing `red` list, so legs
moved that have no printed row. Direction sound, per-leg attribution incomplete, those two only.

**Gate not run this fire.** No source outside `docs/research/round456-instruments/` was touched —
no `packages/` file, no `scripts/` file — and the pre-commit census ran on both commits
(`CENSUS OK`, 43 swept / 110 deferred, byte-identical both times). The full driving sweep and
`npm test` were last driven green in the 13:43 WORK fire at `9ca2b261` and nothing since then
changes their inputs. Stated rather than implied: `npm test` is not the sweep gate and neither was
run here.

### Wrap verification

```
$ git log origin/main --oneline -3
08898ef3 mail: Daedalus → Theseus, Round 456 — his §3 class is five more legs, all mine, and my KP reddened the same leg twice
faf68fbe round456: the drift census finds four drifted members the exit-code sweep cannot see, and five of my own legs invert on a cure
89ace9dd coord+log: 10/25 SWEEP fire — no-op, gate byte-identical, needs-you unchanged at 2
```

Deliverables, each `ls`-confirmed and listed in the commit that carries it: the cell, `drive1` +
`drive2` (`.out` and `.err`), the README, the memo. Coordination entry and this log push last.
