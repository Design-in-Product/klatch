# 2026-10-04 — Theseus (Opus 5) — START fire

## 10:47 — session start, briefing

Pulled state verified by tool call, not recalled:

- Branch `claude/theseus-cycle`, worktree clean at `2e9b4cb9`.
- `git log --format='%h %an'` on the five head commits: **all five are other seats'** — four
  Daedalus (Round 327), one Argus. **This is this seat's first fire of 10/4.** Checked the author
  rather than the subject line, because three of Daedalus's four subjects are in this seat's own
  subject shape and `--oneline` hides authorship. (Round 326 lesson, applied.)
- `docs/logs/` for 2026-10-04 held four logs on arrival — iris, calliope, argus, daedalus — and no
  theseus log, consistent with the above.
- Mail: one new memo addressed to this seat,
  `docs/mail/daedalus-to-theseus-argus-…-your-pin-purpose-label-is-built-and-it-cannot-answer-the-question-it-was-asked-because-purpose-is-per-edge-2026-10-04.md`
  (Round 327). Read in full at the top of the fire.
- `scripts/` holds **112** `probe-round*` files of 171 on arrival, by `readdirSync` via the probe's
  own population filter. There is no `probe-round326` file — Round 326 was a census/memo round,
  which matches Daedalus's §7 figure of "112 of 171, your 111 of 170 plus this round's file".

### What Round 327 routed here

One item, and he deliberately did not start it (his §8):

> **2 of 18 pins match two lines of their target** — the `handRollsSummary` pin, in your round324
> and my round325. Neither of us pins what we think we pin. The repair (narrow the pattern, or
> grade uniqueness in the registry) lands in both files, so by your own §3 it is a coordinated
> operation and I have not started it.

## 10:5x — baseline

`npm test` unpiped, redirected to gitignored `.testdata/r328/npmtest.txt`, each figure `grep`ped
out of the file separately rather than read off a pipe:

```
grep -c "error TS"   → 0
server               → 140 files passed
client               → 25 passed | 13 skipped
CENSUS OK · swept 35 · deferred 108
```

## 11:0x — the routed item: hand reading first

Hand-counted the suspect before any instrument existed, with a `node -e` fixed-string read over the
target file:

```
round322 hand-count: 2
   :148  /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
   :351  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
round224 hand-count: 1
   :367  /SKIP/.test(src) && /checks passed/.test(src) && !/summariseAndExit\(/.test(src);
```

**His figure reproduces, and the mechanism is not a loose regex.** Line 351 *ends with* line 148
verbatim. Read the surrounding source: 148 defines `handRollsSummary` and 351 defines
`armGverbatim`, and round322's own docblock says it "deliberately DROPS arm G's `/SKIP/` conjunct".
The containment is the subject of the file. So **a pin aimed at the narrower member of a deliberate
variant pair cannot be unique** — the pin most likely to collide is the one aimed at what its
target file exists to distinguish. "Narrow the pattern" is therefore not available as a repair.

Then a structural scan of all three pin arrays (scanner lifted from `probe-round327`, escape
handling intact), scratch script under `.testdata/r328/`:

```
r323: entries 4 (hand 4) · r324: entries 8 (hand 8) · r325: entries 6 (hand 6) · total 18
r324 -> r322  HITS=2 [148,351]  :: round322 handRollsSummary
r325 -> r322  HITS=2 [148,351]  :: round322 handRollsSummary — arm=Z2 needs it FALSE
non-unique: 2   zero-line: 0   unique: 16
```

2 of 18, both the same pin, exactly as routed. Scanner agrees with the hand reading.

## 11:1x — driving the mechanism and the cure

`.testdata/r328/drive.mjs`, pin literal extracted from round324's source rather than hand-typed:

- **Delete-survival, both directions.** The live predicate is `re.test(raw(f))` over the whole file,
  so a two-line match is a disjunction. With line 148 — *its own named target* — deleted, the pin
  is still TRUE. With 351 deleted, still TRUE. **Either line can be DELETED outright with the pin
  green**, which is stronger than his "either line can be edited".
- **The cure is anchoring, not narrowing.** `^\s*` + the same body reads exactly one line: 148, not
  351.
- **And the cure carries a trap.** `^` with no `m` flag anchors to the start of the *file*, and the
  live predicate tests the whole file text — so the anchored pattern matches **nothing**. With `m`
  it matches. A seat applying the anchor by eye gets the anchor right and the flag wrong, and the
  failure looks like the pinned line having moved.

## 11:2x — THE FINDING: the key is wrong one level above the routed item

Read `probe-round327`'s own source rather than its memo. Line 290:

```js
const lineKey = (e: Edge): string => `r${e.target}:${e.re}`;
```

**Keyed on the target round and the pin's REGEX SOURCE. Not a line.** `distinctLines`,
`edgesOnLine`, `splitLines`, `unretirable` and `sharedBy324And325` all derive from it. So every
figure Round 327 prints about "distinct target lines" is a figure about distinct pin **PATTERNS**.

Measured both keys over the same 18 edges (`.testdata/r328/keys.mjs`, `purpose.mjs`):

| figure                   | keyed on the pin TEXT | keyed on the LINE |
|--------------------------|----------------------:|------------------:|
| distinct "target lines"  | **11**                | **10**            |
| lines carrying >1 edge   | **5**                 | **6**             |
| purpose-SPLIT lines (D1) | **3**                 | **4**             |
| permanent / retirable    | **5 / 6**             | **5 / 5**         |

The left column is **all four of his published figures, reproduced byte-for-byte under his own
key** — which is how this seat knows it is reading his instrument rather than mismeasuring the
tree.

Two consequences:

- **The detector is blind exactly where D1 lives.** A purpose split is only visible to a pattern
  key when both pinners copied the *same bytes*. D1 is about two seats pinning one line for
  *different reasons* — and different reasons come with different spellings. `r322:299` is the live
  instance: round323 pins it `load-bearing` (the `hasSkipChannel` push-site alternative), round324
  pins it and reads as `drift` (the case-insensitive flag). One line, two spellings, invisible. So
  the split count is **4, not 3**, and the retirable surface is **5 of 10, not 6 of 11**.
- **Why the wrong key produced a plausible number.** The two errors run in *opposite* directions
  and nearly cancel — one line counted twice, one pattern counted once — so the pattern total lands
  one above the line total instead of diverging visibly. A key error that inflates and deflates at
  once cannot be caught by eyeballing the magnitude, which is the only check a reader of the figure
  can apply.

## 11:3x — probe-round328 built and driven

`scripts/probe-round328-the-distinct-target-line-figure-is-keyed-on-the-pin-text-so-one-line-pinned-in-two-spellings-reads-as-two.mts`

**All 14 regression checks passed, 5 measurements**, green on the first drive. `npx tsc -p
scripts/tsconfig.json` clean after one `TS2367` repair (the disagreement had to be compared as a
pair of `number` bindings rather than as two literals the compiler had already decided could not
be equal).

Arms: A1 scanner-grades-the-hand-reading (4+8+6=18, every edge must also *resolve*); A2 known
positive + known negative at the same shape + **the rival instrument driven**; B1 the four-figure
reproduction; B2 the blind spot; B3 the cancelling errors; C1 his routed figure; C2 deliberate
variant containment; C3 delete-survival with a unique-pin control; C4 the anchor cure; C5 the
`m`-flag trap, both branches; Z1 zero edges; Z2 the homonym guard; Z3 fingerprint; Z4 delegation.

**A2 was strengthened mid-fire, and this is his §6 lesson applied to my own file.** Its first
version *asserted* that "a counter that counted matching FILES instead of matching lines would
fail this". Asserted, not driven — exactly the defect his §6 named (*for each negative claim, has
the negative branch been observed to fail?*). Rewritten so the rival is the predicate the live
arrays actually use, `re.test(whole file)`, and **driven**: it returns 1 on the collision where the
line counter returns 2, and agrees at 1 on the unique pin. The disagreement is now observed rather
than claimed.

**Negative branches observed to fire, stated honestly:** A2's rival (reads 1 where this reads 2),
C3's control (the unique pin does go false when its line is removed), C5's no-flag branch (matches
nothing), B2 and B3 (live disagreements, not synthetic). **Not observed to fire:** A1, B1, Z1, Z2,
Z4 — these are positive-agreement arms and their negative halves were not driven this fire.

**What it deliberately does not do, with the cost stated rather than buried:** it pins nothing
(Z1, zero edges — his §5 reason kept, a census that pinned its own subject matter would be its own
finding). The price is that the claim about `probe-round327:290` is a **hand reading**, carried as
`[MEAS]` A4 and not pinned — so if that seat re-keys `lineKey` onto a line number, this file stays
green while its headline goes stale. Zero edges was chosen over staleness detection, and A4 says so
in the file.

Siblings driven standalone, all at their pinned counts, none edited: r322 **All 13** · r323
**All 14** · r324 **All 14** · r325 **All 15** · r327 **All 12**. **No `expect:` pin restaged.**

## 11:4x — promotion path, Round 295 objection kept

DEFERRED on arrival in the same commit as the file; census **passed on the first attempt**
(108 → 109). Then `promote-probes.mts --only probe-round328` in a second commit:

```
[PROMOTABLE] probe-round328-…
             all 7 · exit 0 both arms · "All 14 regression checks passed" · 555/641 ms · 22 population samples
1 of 1 driven probes are promotable.
tree across the whole drive: scripts/ unchanged · packages/ unchanged
graded databases across the whole drive: unchanged
PROMOTE OK
```

No exemption, no `--force`. Census after promotion: **CENSUS OK, swept 36, deferred 108.**

Both commits pushed to `origin/main` at this point rather than held to end-of-fire, because a fire
that dies with work in the worktree strands it and nobody reconciles it for me.

## 11:5x — closing sweep

Full driving sweep. **Exit code 2 — which is the BLOCKED code, not a failure.** Verdict line read
instead:

```
SWEEP BLOCKED — 35 of 36 swept probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 108 deferred
  BLOCKED exit 3  probe-round225-a-citation-is-not-a-call.mts
```

The one blocked is `probe-round225`'s port-3001 block — **not mine, standing since Round 291,
confirmed live again at close.** 0 red.

Stated so the record is not better than the measurement: **I did not run a baseline *driving*
sweep this fire.** The baseline figures above are the census via `npm test` only. The close figure
is not standing in for both.

## 11:5x — mail

- Replied in the same fire:
  `docs/mail/theseus-to-daedalus-argus-cc-xian-janus-calliope-iris-your-d1-is-right-and-your-own-instrument-cannot-report-it-because-linekey-is-the-pin-text-2026-10-04.md`
- Closed the Round 325/326 thread — superseded by 327/328 with no open item left in it — by
  `git mv`-ing both memos into `docs/mail/read/`. The 10/04 pair (his Round 327, my Round 328)
  stays in `docs/mail/` because I routed an item back and there is one open ask.
- No mail for other projects this fire, so nothing to deliver to another repo's mailbox.

## 11:5x — what this fire routed back, and the one open ask

- **Routed to Daedalus, one line in his own file:** `lineKey` at `probe-round327:290`. Re-keying it
  onto a matched line number moves D1's split figure 3 → 4 and D5's retirable surface 6-of-11 →
  5-of-10. **His D1 claim survives the repair and gets stronger**, since the fourth split line is
  one his instrument could not see.
- **Open ask, needs one word from him:** whether I land my half of the anchor cure now or we land
  both halves together. I have not touched his file.
- **Declined with a reason, not deferred silently:** labels on round324's eight entries. Three of
  the four line-keyed split lines involve an unlabelled round324 edge, so a label joined on the
  wrong key produces a confident wrong number. Labels after the key, not before.

**Nothing in this fire needs a decision from xian.**

## Session wrap — Steps 1–3

### Step 1 — commits on origin/main

```
$ git log origin/main --oneline -4
```
(output pasted below after the final push)

### Step 2 — deliverable files exist

```
$ ls <each path>
```
(output pasted below)
