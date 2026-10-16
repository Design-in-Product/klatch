# 2026-10-16 — Daedalus (Opus 5) — START fire

Round 399. Day's first daedalus log; the three head commits at open were other seats'.

---

## 09:17 — Session start, briefing

- `git log -6 --format='%h | %an'`: three head commits — `0b159654`, `6a5ac265`, `fa64f4f7` — all
  carrying **my own** subject shape, `coord+log: 10/16 START fire — no-op on product, gate
  re-verified 43/43 green, standing blockers unmoved`. `%an` says **Argus (Klatch)**, **Calliope
  (Klatch)**, **Iris (Klatch)**. **None mine.** Round 326's lesson paid for itself immediately:
  `--oneline` hides the author, and I would have read my own fire as already done and gone no-op on
  a round that was waiting. Corroborated by `ls docs/logs/`: no daedalus log for 10/16 existed.
- `docs/COORDINATION.md` read: my last entry is 10/15 STOP = Round 397.
- `docs/mail/` read on arrival. One item new to this seat: Theseus's **Round 398**,
  `theseus-to-daedalus-…-your-397-finding-reproduces-both-cures-are-taken-and-the-shape-is-31-windows-not-one-2026-10-15.md`
  (mtime 10/16 09:17). Read in full before anything else. It routes **nothing** to me; both cures my
  397 routed are taken. His open-with-no-blocker item is the severity audit of his own 13 remaining
  FAILS OPEN sites, which he claims for his next unrouted fire — so not mine to duplicate.

## 09:2x — His round verified before building anything (328)

- His census driven unmodified in my worktree: **31 sites in code, 14 FAILS OPEN, 9 WIDE, 3 PARTIAL,
  5 UNRESOLVABLE**; 10 of 10 KPs and controls as expected; both grades true; `CENSUS OK`; exit 0.
  Reproduces with his published figures.
- Both his commits present here: `dee68c0f`, `7cf65ceb`. `git ls-tree -r --name-only dee68c0f`
  confirms his census file **does** exist at its own commit (not the Round 389 shape where fixtures
  landed two commits later).
- Tried the detached-worktree recording at `dee68c0f` (389 discipline). `git worktree add --detach`
  succeeded, but reads **outside the daedalus worktree are blocked** in this session — `ls` and a
  `cd`-prefixed git call both refused. Removed the worktree (`git worktree list` back to 7, nothing
  left behind) and substituted a **better** instrument: his denominator is "tracked JS/TS sources",
  which is a git question answerable at any rev without a checkout at all.
- Denominator verified under a key sharing neither end with his — `ls-tree` at the rev vs his
  `ls-files` on a checkout: **`dee68c0f` → 516, `7cf65ceb` → 517, `5cf014f7` → 517, HEAD → 517**,
  live index under his own selector → 517. His 516 and 517 both land. Taken to **member** level
  rather than the count (340): difference is exactly one file **added, none gone** —
  `docs/research/round398-instruments/record-drives.mjs`, his own recorder becoming tracked between
  his two drives, which is the reason his memo states.
- `scripts/lib/` checked before writing any lexer (lib-before-hand-rolling). `strip-source.mjs`
  exists, is length-preserving, and its header records that Round 257 repaired its interpolation
  model and that the regex-with-apostrophe case is why it was the extraction target. His census
  imports neither it nor anything else — `grep` for imports returns only `node:fs`,
  `node:child_process`, `node:path`. His §4 reports paying for both of those residuals this fire.

## 09:3x–09:5x — Round 399: measuring the disjunction his §3 leaves open

His §3's honest limit: absence from his census means "no longer defective **OR** invisible". Binding
an index to a name is not a cure, it is a spelling; the cure is the guard. Built
`docs/research/round399-instruments/census-the-named-binding-form.mjs` to split that into two
numbers over his selector and his corpus, importing `stripSource` rather than writing a lexer.

**First drive REFUSED at exit 1** — the collision grade was false and no figure printed (353/356).
One member of mine collided with his list at `probe-round303…:186`. Hand-read the line:

```ts
return i >= 0 ? l.slice(i + 1) : l.slice(l.indexOf('/packages/') + 1);
```

Two distinct window calls on one line — mine guarded by the `i >= 0` beside it, his adjacent.
`file:line` was the wrong granularity (345), a lesson I had taken in the matcher and not in the
comparison. Grade re-keyed per-call on byte offsets, hardcoding no count (377).

**Three corrections to my own key, each returning a SMALLER number.** All three found by
hand-reading sites the census had already flagged, none by reading my own code:

1. **Resolver took the FIRST preceding finder binding, not the NEAREST binding of that name.**
   `probe-round260:182` is a two-char window on `i` where that `i` is `let i = 0` on :176 **inside a
   different function**; it resolved to the finder binding on :137. A **FALSE site in a SWEPT
   probe** — the worst direction for a census headlined "there are more than you found". Fixed to
   collect every binding, resolve nearest-preceding by name, then ask about the finder. **62 → 51
   sites, 18 → 14 unguarded**, plus four misattributed binding lines corrected. KP-10 and KP-11
   carry both directions (341).
2. **The stratum assumed a binding refuses with -1; a compound initializer does not.**
   `m.index + m[0].indexOf(init) + at` refuses to `m.index + at - 1`, so `.slice(abs, abs + 13)`
   returns thirteen **real** characters from the wrong offset instead of collapsing — a third
   behaviour, nastier than failing open because the window reads as content. Now published
   **UNMODELLED**. **3 → 1 FAILS OPEN.** KP-12 and KP-13 carry the axis.
3. **KP-4's expected stratum was mine and wrong.** Resolved against *his* published rows
   (`.slice(0, …search(…))`, exactly 199, prints **FAILS WIDE** at `round386:79` and `round387:53`;
   196 and 198 print PARTIAL) and his source line 311, `len >= SAMPLE.length - 1`. My
   implementation already agreed with his; only my written expectation was out. Moving the number
   until my own code went green would have been the vacuous fix.

Also fixed: `init` was being displayed out of the strings-blanked reading, printing every anchor as
spaces (`src.indexOf('\n')` showing as `src.indexOf(' ')`). Now sliced from the original, which is
the documented consumer pattern for that module.

**Final figures, 17 of 17 KPs and controls green, all three grades true:** 51 named-binding window
sites in 518 tracked sources, invisible to his adjacency key by construction — **37 GUARDED**
(cured), **14 UNGUARDED** (not cured; OPEN 1 · WIDE 4 · PARTIAL 1 · UNRESOLVABLE 6 · UNMODELLED 2).
Disjoint from his 31 by construction, one file:line collision, explained. **14 is a floor** — guard
detection is file-scoped and the resolver has no block-scope model, and both drop sites rather than
inventing them.

## 09:5x — Severity, read honestly

- Swept-vs-deferred answered with the instrument, not a parse (his §4 lesson): `SWEPT` and
  `DEFERRED` are **exported** from `sweep-probes.mjs`, and line 2550 guards `main()` on
  `process.argv[1].endsWith('sweep-probes.mjs')` — so importing them does not drive it. Reads
  **43** and **110**, matching the verdict line. That guard is also the mechanism behind `--help`
  driving, which I had recorded as a hazard without ever reading why.
- The single remaining FAILS OPEN is **mine**, `round397-instruments/probe-the-anchor-that-is-not-guarded.mjs:88`
  — the file whose subject is an unguarded anchor, the fourth round running where the cure's own
  instrument carries the shape. Hand reading says **LATENT, not live**: (a) the mutator only ever
  runs on sources that still carry the marker (CF-1 is `dropMarker(reintroduce(s))`, reintroduce
  first), and (b) **`indexOf(needle, -1)` clamps its fromIndex to 0 rather than refusing**, so that
  index cannot be -1 for any multi-line source. (b) makes a whole sub-shape of this mechanism fail
  **CLOSED** — the one thing this round routes to him, since his audit list holds at least two sites
  of that shape.
- **Hand-read 3 of the 14.** The other 11 are an open item, not a claim.

## 10:0x — Gate

- `npx tsc -p scripts/tsconfig.json` → exit 0, **0 diagnostics** (output file 0 lines).
- `npm run typecheck` → exit 0, **0 diagnostics**. Both legs run, because a fire I thought could not
  reach typecheck did (396) — and this one was not docs-only anyway.
- `node scripts/sweep-probes.mjs` → **SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked
  (0 could not run, 0 ran but did not finish), 0 census problem(s), 110 deferred**. Read out of the
  recorded file, not a pipe.
- Pre-commit `--census` on every commit: **153 probe files, 43 swept / 110 deferred**.
- **Nothing committed while the sweep drove** (358) — staged only after the verdict line.

## 10:1x — Session wrap verification

Per CLAUDE.md Session Wrap Protocol.

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -4
b7b7e96f mail: Round 399 to Theseus — his 398 reproduces, and the disjunction his §3 left unmeasured is 51 sites with 14 not cured
681c0331 round399: two modelling errors of my own, and the OPEN count falls 4 → 3 → 1
a85b4a11 round399: census the spelling his adjacency key cannot reach — 62 named-binding windows, 18 unguarded, 4 fail OPEN
0b159654 coord+log: 10/16 START fire — no-op on product, gate re-verified 43/43 green, standing blockers unmoved
```

Pushed incrementally in three commits across the fire rather than once at the end (2400s lesson),
with the mail as its own commit straight to `main` so he does not wait on the rest.

**Note on `a85b4a11`'s subject:** it states 62/18/4, which the next commit corrected to 51/14/1.
Left as written — it was true of the tree at that commit, and `681c0331` names both the old and new
figures in its body. Rewriting it would be the thing this project keeps finding: a cured figure with
a live sentence about the old one.

**Step 2 — deliverable files present** (verified with `ls`, output in the fire):
`docs/research/round399-instruments/census-the-named-binding-form.mjs`, `.out`,
`sweep.out`, `typecheck-scripts.out`, `typecheck-packages.out`,
`docs/mail/daedalus-to-theseus-…-2026-10-16.md`, `docs/COORDINATION.md`.

**Step 3 —** this log pushed last.

**Drain:** done, bounded. One item new to this seat (his Round 398), verified, answered, replied to
in the same fire. Deferrals, each with its blocker named: the 11 unread severity sites (**no
blocker** — next fire's first item, no deadline attached); my Round 389 `R1`/`R4` re-key (blocker:
the pair needs re-aiming rather than loosening, and no fire has opened with it first); his Round 394
`detachedAt` guard (his, blocked as he framed it, noted not nudged). Nothing here needs xian.

---

## 13:17–13:40 PT — WORK fire — Round 401: his §4's branch-polarity axis is built, counted, and **0**

**Authorship first (326).** Five head commits on open, **none mine**: `9f052cf3` Calliope,
`71649214` mediajunkie, `be7b2478` / `b65a7705` / `65cbe7f1` Theseus. `--oneline` would have shown a
`round400:` subject in my own shape at the top and I would have read my round as already written.
My own last was `d89d8c7b`.

**Mail read on arrival, not batched.** One memo addressed to me: his Round 400
(`theseus-to-daedalus-…-the-floor-you-called-14-is-15-2026-10-16.md`). It routes **nothing** to me
and leaves exactly one thing on the table — §4's branch-polarity axis, "measuring it needs a model
neither of us has built. Stated, not counted." Took that; it is implementation work and this seat's
role. Did **not** take his 11-site severity read: he named it as his, with no blocker, as his next
fire's first item.

**Prediction written down before anything drove** (383/386), recorded in the instrument header:
*0 wrong-sense sites, 0-2 non-exiting*. Outcome: 0 wrong-sense (right), and 0 non-exiting **as a
category** — which my prediction got right for the wrong reason, because the two rows I expected
there landed in a class I had not modelled at all (see the relabel below).

**Built:** `docs/research/round401-instruments/census-the-branch-polarity-axis.mjs`. The model
crosses POLARITY (comparison true on refusal vs. on find) with REGION (site in consequent /
else-alternate / outside), over `if`/`while` and ternaries. Ternaries are load-bearing, not an
extra: the ternary is the shape of the cure in this corpus, so a model without it publishes cured
code as a defect. **REPAIRS is a third outcome beside EXITS** — `if (at === -1) at = 0;` protects
the site after it, and a model with only EXITS would have published it as a defect, which is the one
direction this whole three-round family must not fail in (340).

**THE RESULT: 14 (399, file-scoped) → 15 (400, pos+bind) → 15 (401, + polarity). The axis moves 0
of the 36 sites still called GUARDED.**

**The zero is measured, not vacuous** (339, his §3's discipline): the leg rejected an
otherwise-accepted guard at **2** sites, classified every guard at **26** sites and accepted them,
and could not classify a guard at **10** sites — 5 compound condition, 3 compound ternary test,
2 `for`-loop header clause, all counted as cures, which is why 15 is still a floor. Deliberately did
**not** claim 26+10 partitions the 36: the numbers sum to it, I did not measure disjointness, and
adding up the numbers in my own sentence is a thing I have shipped wrong (379).

**MY OWN DEFECT THIS FIRE — two published rows right with the wrong reason.** The first drive printed
both rejections as `NON-EXITING: refusal branch neither exits nor repairs`. False about
`const typed = (eq === -1 ? token : token.slice(0, eq))`: **a ternary has no branch to fall out of.**
The honest class is `OUT OF SCOPE`, and the verdict is identical either way, which is exactly what
made it easy to miss. Second instance in the same drive: `round382:453`, a compound ternary test,
printed as "heads neither an if/while nor a ternary". Third after a hand-read: 2 `for`-header guards
in the same bucket. A false label in an instrument produces no work at all (351).

**The relabel is graded against the state it replaced** (397): the pre-repair output is committed as
`control-pre-label-repair.out`, and **GRADE D** asserts every *verdict* identical across the
relabel — all five mode tables, the mover count, the rejected-site list keyed to its guard's line,
the unmodelled-site list with counts — while only reason strings differ. True. The two new labels
get fixtures grading the REASON (S-15/S-16/S-17), because a verdict-only fixture is structurally
unable to catch a mislabel.

**Hand-reads, because a census row is not a defect (his phrase, and it earned its keep):** both
rejections (`backfill-entity-bindings.mts:190`, `round382:453`) — verdicts right, each site survives
on a different correctly-scoped guard. Two of the three unmodelled classes
(`round376:17` a compound test that **throws**; `round269:428` clause 2 of a `for` header) —
both genuinely cured, lenient default correct.

**Gate:**
- Mine: **17/17 fixtures**, GRADE A true, B true, C true, D true, `POLARITY OK`.
- GRADE A reproduces **his** Round 400 at ROW level at the rev his own `.out` names, in a detached
  worktree (389/377): his four-mode table, his one mover, his 2 FAILS OPEN members, all 8
  bind-rejection rows. Parsed from his `.out`, refusing with `null` on an empty section or a header
  count disagreeing with its rows (393).
- `npx tsc -p scripts/tsconfig.json --noEmit` → **0** diagnostics (`typecheck-scripts.out`, 0 lines).
  `npm run typecheck` → **0** diagnostics. Both legs (396).
- Full sweep: **SWEEP PASSED — 43 of 43 swept probes green, 0 red, 0 blocked (0 could not run, 0 ran
  but did not finish), 0 census problem(s), 110 deferred.** Nothing staged while it drove (358); I
  waited for the verdict line.

**CORRECTION, same fire — I almost reported that sweep as unreachable, and the arithmetic was mine.**
I watched the first drive reach **7 of 43 probes in ~6 minutes**, divided, got ~37 minutes against a
budget with ~24 left, and stopped it. Committed and pushed first — right call on its own terms, since
a fire dying at 2400s strands work and a commit mid-drive makes a red indistinguishable from a real
one (358) — and wrote the memo, the log and COORDINATION.md all saying the sweep was **not completed
and not claimed green**. Then the re-drive **finished in ~13 minutes** and read 43 of 43 green, and I
rewrote all three.

**The division was the defect.** The sweep's probes are not uniform in cost — the early ones in
`scripts/` order are among the slowest — so a rate off the first 7 of 43 over-estimates the total by
nearly 3×. Five minutes into the re-drive, 17 had landed; that was the pace, and it was measurable
before I projected off the other one.

This is **not** 366 (a rate wrong because the hidden variable is machine state) even though it rhymes
with it. The hidden variable here is **position in the sequence**, and the failure direction is the
worse one: an over-estimate makes you abandon a measurement you could have had. The two rules I
believed were colliding were not in conflict at all. The only reason I found that out is that I let
the clock run instead of trusting my own arithmetic about the clock.

**Replied in the same fire:**
`docs/mail/daedalus-to-theseus-…-your-400-reproduces-at-row-level-the-polarity-axis-is-0-and-the-zero-is-measured-2026-10-16.md`.
Routed to him: **nothing**.

**Close-discipline:** three closed threads `git mv`'d to `docs/mail/read/` — his 398 (10-15), my 399,
his 400. Each answered, no open action remaining on either side.

**Drain:** done, bounded. One item new to this seat (his Round 400) — read on arrival, verified at
row level, the one axis it left open taken and measured, replied to in the same fire, thread closed.
Deferrals, each with its blocker named: the three-clause `for` model (**no blocker** — mine, named
in the memo and the instrument, no deadline attached); boolean composition for compound conditions
(**no blocker**, refused rather than approximated, stated as a residual); my Round 389 `R1`/`R4`
re-key (blocker: the pair needs re-aiming rather than loosening); the full-sweep verdict line
(**withdrawn** — I deferred this on a wall-clock blocker I had computed wrong; the re-drive
completed inside the fire, `SWEEP PASSED` 43/43, so there was never a blocker here at all, and the
deferral is struck rather than left standing as if it had been real); his 11-site severity read and
his Round 394 `detachedAt` guard (his, noted not nudged). Nothing here needs xian.
