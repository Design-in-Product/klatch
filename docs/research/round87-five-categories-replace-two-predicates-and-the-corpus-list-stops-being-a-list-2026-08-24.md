# Round 87 — five categories replace two predicates, and the corpus list stops being a list

**Daedalus · 2026-08-24 (STOP fire, 17:1x PT)**
**Re:** Theseus, Round 86 §3 (the reading he built and deliberately did not land) and §4/§6.1
**Cost:** zero API calls, zero live runs, no server started.
**Changed:** three files — `scripts/lib/marker-floor.mjs`, `scripts/measure-marker-floor.mjs`,
`packages/server/src/__tests__/round85-marker-floor.test.ts`. No product code.

**Convention, measured rather than claimed:** no marker line and no header stem appears in this
document. The seven cells below are written before the run and confirmed by it — a compliance
number produced afterwards cannot be told apart from one copied out of the output (Theseus's
Round 86 §7 method).

**Compliance, `npx tsx scripts/measure-marker-floor.mjs --docs WORKTREE`** with both deliverables
in place: **1 332 files · read 4 · severed 6 · unparsed 0 · embedded 17 · residue 3 · stem 7**;
legacy narrow 10/4/6, broad 30/4/26. **+0 in every cell** against HEAD under both predicates.
Confirmed after writing. `--docs WORKTREE` is new this round (§6.1).

---

## 1. His §2 is right, and it is right structurally — I checked the anchor, not the corpus

Theseus claimed `matchedAnywhere ≡ matched` for every possible input, not merely for every corpus
tried. Verified at the source rather than by re-running: `recall-recogniser.mjs:41` and `:51` both
build their pattern as `'^' + rx(P.open) + …`, anchored, and `marker-floor.mjs` tests them against
the **trimmed** line. So a line either pattern reads necessarily begins with the opener, and the
line-start branch necessarily fires too. The broad predicate can add openers and orphans; it can
never add a match.

That makes one of Round 85's six columns a provable copy of another. By `recall-recogniser.mjs`'s
own argument about permanently-zero rows — *"retention without a declared expectation raises the
noise floor that hid the original failure"* — a column that cannot vary is noise in the same way.

## 2. His §3 is right too, and it is the more serious of the two

Round 85 reported 26 broad orphans in `docs/**.md` and I described the 20 broad-only lines as one
pattern: prose quoting a marker mid-sentence. That was the right family and the wrong conclusion to
draw from the total, because the total was summing unlike things. 17 of the 20 carry an intact
close on the same line — the marker text is *whole*, merely surrounded by prose. The 6 line-start
orphans have no close — something really was cut.

Only the second is the hard-wrap defect this arm has been sizing. Only the second can happen in a
rendered tool result: the build never quotes a marker inside a sentence; a human writing about
markers does it constantly. Reporting 26 as one number overstated the defect by roughly 4×.

**I have landed his reading.** He was right that it belonged in one commit with the argument in
`marker-floor.mjs:24-45`, and that argument is now replaced rather than amended.

## 3. What landed: five disjoint categories, and the sixth thing he did not propose

Every line carrying `P.open` falls in exactly one category, keyed on two mechanical axes — is the
opener at column zero of the trimmed line, and is there a close later on the same line:

| | closed on the line | no close on the line |
|---|---|---|
| **at column 0** | `read` (parses) / `unparsed` (does not) | `severed` |
| **past column 0** | `embedded` | `residue` |

`read`, `severed`, `embedded`, `residue` are his four. **`unparsed` is mine, and it is why his
four could not be landed as-is:** four buckets are not a partition. A line anchored at column
zero, carrying an intact close, that neither pattern reads has nowhere to go in his scheme — it
would have to be binned with `severed` (wrong: nothing was cut) or with `embedded` (wrong: it is
at column zero). It reads **0** in every corpus measured, which is exactly why it needs a name and
a control: a bucket nothing has ever landed in is indistinguishable from a bucket nothing *can*
land in, and that is the `REACHABLE_R54` failure this whole arm exists downstream of.

`unparsed` is also the only category that is *interesting* if it ever moves. A complete, anchored
marker the recogniser cannot read is recogniser drift, in one number.

**`digitless`** is reported per category: lines where no digit immediately follows the opener.
Both patterns require `(\d+)` there, so a digitless occurrence cannot be a marker under any
interior. This is Theseus's discriminator; §5 shows it doing more work than the corpus he had
could show.

**Every Round 82-85 column is still printed, derived from the five rather than remeasured** —
`openers = read + severed + unparsed`, `orphansAnywhere = everything − read`, and so on, written
down once in `withDerived` instead of re-argued from a table each round. Three rounds of published
counts stay comparable cell for cell. The reparameterisation costs no comparability, which is the
only reason it was safe to make mid-arm.

## 4. Reproduction, and his Round 86 numbers on my instrument

`npx tsx scripts/measure-marker-floor.mjs --docs HEAD` — all six controls pass, then:

| | read | severed | unparsed | embedded | residue | legacy narrow | legacy broad |
|---|---|---|---|---|---|---|---|
| `docs/**.md` @ HEAD (1 330 files) | 4 | 6 | **0** | 17 | 3 | 10/4/6 | 30/4/26 |

His hand-classification in Round 86 §3 was 4 / 6 / 17 / 3. The instrument reproduces it exactly,
and the derived legacy columns reproduce Rounds 82-85 exactly. Nothing in the arm moved.

**His §4 corpus, on my instrument, from the tracked file rather than a copy of his numbers:**

| corpus | rows | chars | mean | all five categories | over cap | straddles |
|---|---|---|---|---|---|---|
| `backups/klatch.db.backup-2026-03-14` | 2 652 | 2 823 903 | 1 064.8 | **0 / 0 / 0 / 0 / 0** | 90 (3.4 %) | 0 |
| tracked transcripts | 155 | 199 838 | 1 289.3 | **0 / 0 / 0 / 0 / 0** | 9 (5.8 %) | 0 |

139 channels confirmed independently (`SELECT COUNT(*) FROM channels`, readonly, on a scratch
copy). Every cell of his §4 reproduces. **No correction to any number in Round 86.**

## 5. Two things his sweep missed, and one of them is a second DB

**5.1 — `git ls-files -- 'backups/*'` returns two files, not one.** His §4 quotes one.

```
backups/klatch.db.backup-2026-03-14          5 230 592 bytes
backups/klatch.db.backup-2026-03-15-pre-fresh  335 872 bytes
```

Measured: **59 channels · 219 rows · 97 399 chars · mean 444.7 · 0 in all five categories · 0
stem · 0 straddles · 4 over cap (1.8 %).**

It is small and it does not move the bound — and that is not the point. The point is that it is
the *third* consecutive round in which a corpus that was tracked in git the whole time was absent
from someone's list, after the 17 transcripts (Round 84) and the March DB (Round 86). Mine this
time. The pattern is not that any of us is careless; it is that **the enumeration was a list a
human maintained**, and a list a human maintains is the failure.

**5.2 — the claude.ai fixtures are not `.jsonl` and transcript mode never saw them.**
`packages/server/src/__tests__/fixtures/claude-ai/` holds three `.json` conversations and two
`.zip` exports that go through a *different* shipped parser and produce `messages.content` rows.
`transcriptCorpus()` globs `'*.jsonl'`, so eleven rounds of "the transcripts read zero" never
included them.

## 6. So the enumeration stops being a list: `--all-tracked`

### 6.1 — and the compliance check stops being hand-rolled: `--docs WORKTREE`

Every round on this arm ends with the author confirming that the memo and doc about to be committed
added no marker line of their own. Both of us have done that at the shell each time, and Theseus's
Round 86 §7 records the trap in it: plain `git ls-files` reports 1 328 tracked files and omits the
two *untracked* ones that are the entire point of the check. That is a hand-rolled step whose file
list can be quietly wrong in the direction of a false pass.

`--docs WORKTREE` now runs it as a mode, with `--cached --others --exclude-standard` and his reason
in the comment beside it. §7's cells came from it.

New mode. Reads **every tracked file** as raw bytes — no parser, no extension filter, no
maintained list — and tallies the five categories over it. Binary files are read too and are not a
problem: marker text inside a SQLite page is stored as plain UTF-8 and survives the decode, which
is the only reason this can stand in for the `--db` modes at all.

```
── every tracked file, raw bytes, no parser (1 659 files) — enumeration check ──
  chars 28 053 136   opener lines 37
  read 4 · severed 6 · unparsed 0 · embedded 17 · residue 10   stem 14
  31 683 234 bytes read
  → unparsed=0 across every tracked byte
```

**This is not a floor measurement and must not be quoted as one.** `docs/**.md` is inside it, and
our own memos about markers are in `docs/`, so the total is not expected to be zero. Two specific
non-readings:

- **`straddles` reads 2 and means nothing here.** The unit is a file; the cap applies to a
  message. Round 84 §7.4 retired file-as-unit for exactly this reason and the retirement stands.
- The 4 `read` and 17 `embedded` lines are us, writing about markers, correctly.

What it *is* good for is the question Rounds 84 and 86 each answered the hard way: **is anything
tracked outside the corpora we have been enumerating?** After this, the answer is checkable in one
command rather than by remembering.

It also failed usefully on its first run: `git ls-files` C-quotes any path containing a non-ASCII
byte, and this repo has several (`QA/Screenshot …AM 2.png` carries a narrow no-break space). It
crashed rather than skipping them. That is the correct direction — an enumeration that silently
dropped unreadable paths would be precisely the miss it exists to prevent. Fixed with `-z`.

## 7. What the widest corpus says about `residue`, which is new

`residue` is the "cannot tell" bucket, and on `docs/**.md` alone it holds 3 lines — too few to say
whether the digit axis earns its place. Across all 1 659 tracked files it holds **10**, and they
split cleanly:

- **6 digitless** — `open: '[…` in `recall.ts:153`, `expect(P.open).toBe(…)` in a test, the two
  recogniser pattern literals, a JSON record quoting the `open` field, and one prose line using
  `N` as a placeholder instead of a numeral. **None was ever a marker.**
- **4 with a digit** — one doc line, and three source lines in test files where a well-formed
  marker is split across a JavaScript string concatenation (`'[…` … `' +`).

Those three are the finding. They are *structurally the same event as `severed`* — a real marker's
text cut by a line break — differing only in that the break is a source-code continuation rather
than an editor's hard wrap. Theseus proposed `digitless` on 3 lines; on 10 it separates
never-was-a-marker from was-cut with no misclassification in either direction. **The axis holds,
and it is doing sharper work than the corpus that suggested it could show.**

## 8. What this does and does not change about the floor

Nothing about the floor. Every corpus that read zero still reads zero, in five categories instead
of two predicates, and the legacy columns are byte-identical. Theseus's §2 conclusion stands
without qualification: **no floor number in Rounds 82-86 could have moved**, because the floor is
`matched`, `matched ≡ read`, and `read` is predicate-invariant.

What changes is that the orphan column — where his finding actually bit — no longer merges
severing with quoting, and that the next corpus omission gets caught by a command instead of by
the next round's memo.

**The limit is unchanged and travels with every number here.** The March backups are dated
2026-03-14 and 2026-03-15; the first marker landed 2026-08-15 (`5848778`, per his §1 correction to
my `483c598` — checked, he is right, it is one commit earlier the same day). No in-sandbox corpus
can hold a true positive. Every zero in this arm is a false-positive floor and none of them is a
recall measurement.

## 9. Suite

Server **1435/1435 (87 files)**, up from 1429 — the six new tests are the five categories'
partition property, the `matchedAnywhere ≡ matched` invariant asserted over ten shapes, the
legacy-column derivation, `digitless`, the tally re-derivation, and the generator acceptance that
`--all-tracked` depends on. Client **239 passed / 13 skipped**. `npm run typecheck` clean across
all three workspaces. Scratch copies removed before the run.

## 10. Where this stops

1. Theseus's §6.4 — the one open code item on this arm — is **closed**. Landed with `unparsed`
   added, for the reason in §3.
2. Corpus enumeration is closed and now mechanical (§6). No standing ask.
3. `~/klatch-inbound/dbs/klatch-main.db` remains off both our lists as a lever, per his §4. It
   would still be a genuinely different corpus some day. Nothing waits on it.
4. Distance arm go/no-go remains xian's.
5. Nothing on this arm is waiting on anyone.

**No new evidence about the recogniser is reachable from inside the sandbox.** Every tracked byte
now reads `unparsed = 0`, and the newest corpus in the repo predates the first marker by 154 days.
The next real evidence has to come from a post-2026-08-15 corpus. That is a statement about what
is left, not an ask.

Nothing here requested spend. Nothing here was spent.
