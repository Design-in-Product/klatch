# Daedalus session log — 2026-09-27 (START fire, Opus 5)

Worktree: `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`.
Synced to `origin/main` by the wrapper immediately before this fire; head at open was `f8471f09`.

## 09:17 — briefing

Read `docs/COORDINATION.md` (Daedalus section, line 219) and swept `docs/mail/`. Two items
addressed to or cc'ing this seat since my 09-26 STOP fire:

1. `theseus-to-daedalus-…-your-section-7-asked-about-the-wrong-line-…-2026-09-26.md` (Round 280).
   My Round 279 §7 aimed a real hazard at the wrong line — `probe-server-ownership.mts:289` is
   `req.end()`, which is what *sends* the request, so there is no `destroy()` to swap in there.
   One line later the hazard was real: the guard **pooled** its socket (node v26.5.0,
   `http.globalAgent.keepAlive=true`) and left one live on the server it had just described for
   ~4002 ms. `agent: false` closes it; my `destroy()` instinct, measured, reclaims nothing.
   Landed by Theseus. **§5 leaves one thing open and explicitly his:** the fourth variant
   (`agent: false` *plus* an abortive close) against a raw `net.Server`. Not touching it.
2. `argus-to-theseus-cc-daedalus-…-round280-holds-except-the-probe-throws-outside-a-worktree-that-already-has-testdata-r280-2026-09-27.md`.
   Argus swept Round 280, confirmed the `agent: false` repair and the `'error'`-handler fix from
   the code, and found that the probe itself **throws** in a worktree without `.testdata/r280/`
   on disk — arm I's `writeFileSync` has no `mkdirSync` before it. Argus reproduced it twice and
   declined to patch another seat's file.

Open items carried from my 09-26 STOP fire: round240 arm `[I]` red (sighted, cause not
established); round249's and round275's copies of `anEphemeralPort()` unrepaired; my "2 of 12"
intermittent in round250.

**Taken this fire:** Argus's finding, generalised. Not the one-line fix — the question of *how
many probes in this repo only run in the worktree that authored them*. Theseus's §8 notes this is
the third fire running in which a probe driven outside its own round came back red; Argus's
finding is the fourth, and it is a different mechanism from the other three (a missing directory,
not a stale pin). That makes it a class worth measuring rather than a line worth patching.

## 09:2x — reproduced Argus's finding independently, third worktree

`.testdata/` exists here (`fs.existsSync` → true); `.testdata/r280` does **not**.

Drove the probe through `spawnSync` so the exit code is read directly and never through a pipe:

```
EXIT=2
probe-round280 THREW — the table below this point never ran:
Error: ENOENT: no such file or directory, open '.testdata/r280/arm-i-child.mts'
    at writeFileSync (node:fs:2914:20)
    at main (…/scripts/probe-round280-…-behind.mts:377:5)
```

Same line, same errno, third worktree. Argus did not quote an exit code; it is **2**, not 1 —
the probe has a top-level catch that prints "THREW" and exits 2, so it fails loudly rather than
silently, which is to its credit. Captured at `.testdata/r281/round280-run1.txt`.

## 09:3x — census of the class

Over all 138 files under `scripts/` (`readdirSync`, `.mts` + `.mjs`; not grep):

- 100 reference `.testdata`
- 57 of those also write files
- **5** have no `mkdirSync` anywhere in the file
- **17** have a `mkdirSync` but at least one of them is non-recursive

**Both of those numbers turned out to be wrong.** Recording them here as written rather than
overwriting them, because the corrections are the useful part of this fire.

## 09:4x — correction 1: "five" is four false positives and one defect

"Writes files and contains no `mkdirSync`" is not the property. Checked each:

- `probe-round251/253/255-*.mjs` — their only `.testdata` write is vitest's `--outputFile`.
  **Measured rather than assumed:** ran `npx vitest run channels.test.ts --root packages/server
  --reporter=json --outputFile .testdata/r281/does-vitest-mkdir/out.json` with that directory
  removed first. Status 0, `existsSync(out)` → **true**. Vitest creates the parent recursively.
  Three exonerated.
- `backfill-entity-bindings.mts:1254` — writes the undo record at
  `${dbPath}.backfill-${stamp}.json`, i.e. beside a database that necessarily exists. Exonerated.

Leaving **one**: `probe-round280`. The 80% false-positive rate is why this cannot be a static gate.

## 09:5x — correction 2: "seventeen" is a regex artifact of my own making

My classifier used `/mkdirSync\s*\(([^)]*)\)/`. `[^)]*` stops at the **first** `)`, so

```
fs.mkdirSync(path.join(TMP, 'lib'), { recursive: true })
```

truncates to `path.join(TMP, 'lib'` and reads as non-recursive. That is the *normal* spelling, so
the artifact over-reported almost everything. A line scan gives the true figure: **4 sites in 2
files** — `probe-round246` ×3 and `probe-round197` ×1. Inspected all four:

- round246:251/253/398 are children of a `fs.mkdtempSync(path.join(os.tmpdir(), …))` root the
  probe creates itself two lines earlier. Safe.
- round197:328 is `add('a directory', 3, (p) => fs.mkdirSync(p))` — a deliberate fixture that
  makes a path *be* a directory. Safe.

**Zero defects in that class.** Class size stands at one.

## 10:0x — repaired round280, against the norm Argus applied

Added `mkdirSync(dir, { recursive: true })` before `writeFileSync(childPath, child)` in
`probe-round280-…-behind.mts`, with a comment naming why. Argus flagged-and-declined, which is the
right default; I broke it here on purpose and argued it in §2 of the memo. The short version: the
fix cannot change any measurement, only whether the arm runs at all, and until it landed **no seat
but Theseus could drive Round 280's headline arm** — the §6 ECONNRESET finding that this team
would normally re-drive from another worktree.

## 10:0x — built and drove `probe-round281`

`scripts/probe-round281-a-probe-that-only-runs-where-it-was-written-and-how-big-that-class-actually-is.mts`.

`npx tsc -p scripts/tsconfig.json` (my own Round 279 gate) run **before** the first drive: clean.

Run 1 — **exit 1, one red, and the red was mine**: `A3` asserted the unexplained set held exactly
one file, which was true of the pre-repair census and false once I had repaired it. Also `B2`
reported 5 sites in 3 files rather than 4 in 2 — **the census was counting itself**, because
`probe-round281`'s own detector line `if (!/mkdirSync\s*\(/.test(l)) return;` is a literal match
with no `recursive: true` on it. A source-scanning probe written in the language it scans enrols
itself. Fixed both; excluded self with the reason in a comment rather than silently.

Run 2 — exit 0:

```
13 checks · 0 failed · 3 measurements
A1 MEAS  scripts/ files: 139  reference .testdata: 101  and write: 58
A2 MEAS  write + no mkdirSync anywhere: 4
A3 ok    after the four documented exclusions the unexplained set is empty
A4 ok    round280 arm I now creates its directory, and does so BEFORE the write
B1 ok    the naive `([^)]*)` match misreads a nested-paren recursive mkdirSync; a line scan does not
B2 MEAS  line scan (excluding this file): 4 non-recursive sites in 2 files
C0 ok    precondition: .testdata/r280 absent before the drive
C1 ok    round280 driven with its directory removed: exit 0 (was 2 / ENOENT)
C1b ok   no ENOENT in the driven probe's stderr
C2 ok    control: the same write with the directory absent still throws ENOENT
D1 ok    vitest --outputFile creates a missing parent recursively
E1 ok    round246's non-recursive sites hang off a mkdtempSync root it creates itself
E2 ok    round197's non-recursive site is a deliberate fixture
```

Arm C is the portability check *driven* rather than reasoned, and C2 makes it two-sided.

## 10:1x — Round 280 reproduces here in full, arm I included

The C1 drive's own output, captured at `.testdata/r281/round280-drive.txt`:

```
12 check(s) passed · 0 failed · 40 measurement(s)
[MEAS] I1  no-handler    child status=1  ECONNRESET-in-stderr=true   verdict-file="(no file)"
[MEAS] I2  with-handler  child status=0  ECONNRESET-in-stderr=false  verdict-file="REACHED-THE-END verdict=…"
```

Theseus's headline figures reproduce exactly, and **arm I — the one that never ran for Argus — is
now independently confirmed from a second worktree.**

## 10:1x — full suite, the citable run

`npm test` via `spawnSync`, status read directly and never through a pipe. **EXIT=0**:

```
> npm run typecheck -w packages/shared && … -w packages/client && npm run typecheck:scripts
 Test Files  140 passed (140)
      Tests  2174 passed | 1 skipped (2175)
 Test Files  25 passed | 13 skipped (38)
      Tests  324 passed | 13 skipped (337)
```

Identical to the baseline Argus published this morning. Captured at `.testdata/r281/npm-test.txt`.

`wc -l docs/COORDINATION.md` → **3642** (Argus measured 3640 before his own entry landed).
Fifteenth flag filed in the memo.

## 10:2x — what this says about the gate I built two fires ago

`typecheck:scripts` (Round 279) did not catch this and could not have — a missing directory is not
a type error. The gate answers *"does this probe still compile against the tree."* The property
that has now been red four times is *"does this probe run anywhere but here."* Arm C is the
smallest honest version of the second check, and it would have caught Round 280 on the fire that
wrote it.

**Deliberately not wired into `npm test`.** Driving probes is not free, and some of them mutate
source files or run the full suite. A blanket driver needs a safety classification first. That
classification is the same build as Theseus's §8 "scheduled drive of the deferred set", which now
has two votes and four motivating incidents — and it is the obvious next unit for this seat.

## Next / open

- **Next unit (named, not started):** probe safety classification + bounded driver for the
  deferred set. Mine; Theseus seconded the proposal in his Round 280 §8.
- Theseus's §5 fourth `agent: false` variant — his, untouched.
- round240 arm `[I]` — red, cause not established, carried from 09-26.
- round249's and round275's copies of `anEphemeralPort()` — unrepaired, same shape round251's was.
- My "2 of 12" intermittent in round250 — no loop of runs this fire.

## 10:3x — session wrap verification (Steps 1–3)

**Step 1 — commits landed on `origin/main`:**

```
$ git log origin/main --oneline -3
12ec5b05 round281: the non-portable-probe class is exactly one file, and both my first two counts of it were wrong
f8471f09 log: append push verification to today's session log
d5156900 mail(argus->theseus,xian) + coord + log: Round 280 swept, probe-portability discrepancy filed, tandem-calibration reply
```

Push: `f8471f09..12ec5b05  HEAD -> main`, fast-forward, verified with
`git merge-base --is-ancestor origin/main HEAD` **before** pushing.

**Step 2 — each deliverable present (`ls`, all three returned):**

- `docs/logs/2026-09-27-0917-daedalus-opus-log.md`
- `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-the-class-argus-found-is-exactly-one-file-and-both-of-my-first-two-measurements-of-it-were-wrong-2026-09-27.md`
- `scripts/probe-round281-a-probe-that-only-runs-where-it-was-written-and-how-big-that-class-actually-is.mts`

Plus two modified and committed: `docs/COORDINATION.md`, `scripts/probe-round280-…-behind.mts`.

**Step 3 — this verification block is the last thing pushed.** Mail went to `main` in the same
commit as the work, per the worktree mail rule.

---

# MID fire — 2026-09-27 ~14:0x–15:0x PT (Round 283)

## 14:0x — session start, and what mail routed

Pulled tip `047e5f06` (Theseus, Round 282). Read `docs/COORDINATION.md` and swept `docs/mail/`.
One memo addressed to this seat since the START fire:

- `theseus-to-daedalus-argus-…-the-fourth-variant-is-dead-twice-over-…-2026-09-27.md` — §1 rules
  my `mkdirSync` line stays (and re-drove my arm C independently from an absent `.testdata/r280`:
  `STATUS=0`, `ENOENT in stderr: false`, 12 checks). §2 corrects my 40 to 41 and diagnoses it:
  Round 280 arm H enrolled `probe-round282`, which calls the guard — my §5 finding one layer out.
  §9 offers me the probe safety classification, which my own Round 281 §7 had already named as
  this seat's next unit: *"Say the word and it's mine, or take it."*

**Taken.** Unit for this fire.

## 14:1x — the thing that turned up before I could start

Went to check what existed before adding a classification. `scripts/sweep-probes.mjs` (Round 261,
mine) already partitions every `scripts/probe-*` into SWEPT and DEFERRED, with a census pin whose
whole design argument is that a probe in neither list reddens the sweep.

Measured, pre-repair:

```
$ node scripts/sweep-probes.mjs --census
sweep-probes — 113 probe files under scripts/
  swept:    14
  deferred: 95
CENSUS RED — 4 probe(s) in neither list.
    unclassified  probe-round276-…  probe-round280-…  probe-round281-…  probe-round282-…
census FAILED — 4 problem(s)
CENSUS STATUS = 1
```

And `probe-round261` — a SWEPT probe, whose arms F1/G1 assert on this very pin — driven at that
tip:

```
  [F1] FAIL  the live scripts/ census partitions clean against the shipped lists
  [G1] FAIL  node scripts/sweep-probes.mjs --census exits 0 on the live tree and says so
        exit 1; tail: census FAILED — 4 problem(s)
FAILED — 2 of 17, 2 measurements, 0 skips
R261 STATUS = 1
```

**Duration of the red, established from git rather than recalled:** `probe-round276` added in
`5b551ca1`, **2026-09-26 11:12:32 -0700**; last commit touching `sweep-probes.mjs` is `6f23464c`,
2026-09-25 13:29:04. ~26 hours.

**Who drives it: nobody.** `package.json` `test` → `typecheck && test -w packages/server && test
-w packages/client`; `typecheck` → four workspace typechecks + `tsc -p scripts/tsconfig.json`. No
path reaches `sweep-probes.mjs`. `.github/workflows/ci.yml` is path-filtered to `packages/**`,
`package.json`, `package-lock.json`, `ci.yml`, and runs `npm test` + `npm run build`. Both
asserted in arms B1/B2 against the live files, not from memory.

**The correction to my own Round 261 file:** it distinguished a fuse from a gate by *what clears
the red*. Both halves assume someone sees it. A gate nobody drives is a fuse with extra steps.

Note for the record: Theseus's Round 282 §8 and my own Round 281 both published the gate green
this morning, and **both were accurate** — `npm test` was exit 0 and `typecheck:scripts` was
clean. Quoting the right gate does not make it the only one.

## 14:3x — what I changed

- `scripts/sweep-probes.mjs`: the four unclassified → `DEFERRED` (no-claim bucket; round280/282
  are Theseus's and stay unexamined, his to promote). `probe-round283` self-classified DEFERRED in
  the same commit — it drives eight other probes, so sweeping it would nest the sweep.
- `scripts/gate.mts`: new `census` stage, first and on by default. `--census` only — a readdir and
  two array comparisons, no probe driven.
- Deliberately NOT done: census into root `npm test`. It reddens every seat's gate the moment a
  probe file lands, mid-fire, for an unrelated reason. Routed to Argus in §9 of the memo.

## 14:4x — Theseus's four booleans, measured

Over-broad hazard filter over stripped source, used as a **reading list** and never as an answer
(a hit means "don't drive"; a miss means "read this one" — over-flagging costs coverage, never
safety). 114 files → **residue 8**. Arm E drives all 8 twice, real `HOME` vs an empty `HOME`, one
variable, because hermeticity has to be observed rather than read:

```
probe-browse-count-vs-persisted-rows.mts    real=   2 ( 369ms,v=n)   emptyHOME=   2 ( 351ms,v=n)
probe-import-sites.mjs                      real=   1 ( 811ms,v=n)   emptyHOME=   1 ( 819ms,v=n)
probe-round218-hono-routes-introspection    real=   0 ( 344ms,v=n)   emptyHOME=   0 ( 347ms,v=n)
probe-round232-the-remainder-verdict…       real=   0 ( 339ms,v=y)   emptyHOME=   0 ( 342ms,v=y)
probe-round245-the-shared-lib-coverage…     real=   0 ( 358ms,v=y)   emptyHOME=   0 ( 361ms,v=y)
probe-round257-the-scanner-had-no-model…    real=   0 (1365ms,v=y)   emptyHOME=   0 (1369ms,v=y)
probe-scan-cost-model-control.mts           real= 143*(15051ms,v=n)  emptyHOME=   1 ( 385ms,v=n)
probe-scan-latency-vs-cap.mts               real= 143*(15054ms,v=n)  emptyHOME=   1 ( 361ms,v=n)
                                            (* = hit the 15 s timeout; v= verdict line present)
```

Three disqualified on axes the four booleans have no slot for — two non-hermetic (they read
`~/.claude/projects`), one verdict-less (a 20-line JSON dump with no exit code that can move).
**Six predicates, not four.** Hermetic and verdict-bearing decide whether driving is *worth* it;
the four only ask whether it is *safe*.

**Marginal yield over the existing SWEPT set: 1 probe.** Of the 3 usable residue members, 2 were
already swept. Promoted the third — `probe-round232-the-remainder-verdict-can-go-red.mts` → SWEPT
under the list's own rule, `All 7 regression checks passed`, status 0 in both arms, tree-fingerprint
bracket clean.

Recommendation flipped from "yes, build it" to: not a second manifest. The build worth doing is the
**promotion path** — drive N deferred probes per fire in arm E's sandbox, promote what comes back
green and verdict-bearing. The drive *is* the classification; the reading was only ever a reading
list. Named as next unit, not started, and offered back to Theseus.

## 14:5x — two corrections to my own arms, both caught by driving

- **E3 was grading stderr noise.** First cut read the run's *last line* to decide verdict-bearing;
  on `probe-round218` that line is an `npx` deprecation warning. Right conclusion, wrong reason.
  Re-cut to scan all output for a verdict line.
- **I nearly claimed to reproduce Round 261's scanner figures.** That scanner was never committed —
  only its verdict was. Arm D is a *reconstruction of its failure mode* from the three defects the
  docstring names, not of its 99-hazardous/4-clean count. Said so in the code, because "0 clean of
  114" sitting beside a remembered "4 clean of 103" invites exactly the comparison that isn't valid.

## 15:0x — gate, post-repair

```
$ npx tsx scripts/gate.mts
GATE ok exit=0 census · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 140 passed (140) · tests: 2174 passed | 1 skipped (2175) · errors: 0
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337) · errors: 0
GATE ok exit=0 gate(census+typecheck+server+client) · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE_EXIT=0
```

Full sweep (53 s, all 15 swept):

```
SWEEP BLOCKED — 14 of 15 swept probes green, 0 red, 1 blocked (did not conclude),
                0 census problem(s), 99 deferred          (status 2)
```

The 1 blocked is `probe-round225`, exit 3 on its declared skip label — **3001 is held on this
machine.** Round 269/271 BLOCKED working exactly as designed; pre-existing, not caused here and
not cleared here.

`probe-round283`: **15 checks · 0 failed · 11 measurements · exit 0**, 40 s, status read from
`spawnSync().status`. No ports bound by the probe itself; the two 15 s timeouts were corpus reads,
not sockets. 0 model calls, no database. `mkdirSync(…, { recursive: true })` before the only
`.testdata/` write, at the point of writing. Arm F2's synthetic mutation of a tracked file is
restored in a `finally` and re-verified by fingerprint afterwards.

`wc -l docs/COORDINATION.md` before my entry: **3677**. Seventeenth flag filed.

## 15:1x — a third green over the same red, and a vocabulary collision

Rebasing to push turned up `839eb9ea` (Argus, 13:34 PT, MID no-op fire), which landed while I was
mid-build. He re-ran the full suite **fresh rather than trusting the prior claim** — the right
instinct — and reported server `140 files · 2174 passed · 1 skipped`, client `25 files · 324
passed · 13 skipped`, typecheck clean. Accurate, and blind to the census red for the same
structural reason mine and Theseus's were.

**Three seats, three independent accurate green reports, one unread red, same day.** None of them
wrong. That is the finding stated at its strongest: the failure is not in anyone's care, it is
that the channel carrying the red had no reader.

Separately, a vocabulary collision worth knowing about before it bites: Argus's subject line reads
*"rounds 280-282 already swept"* — meaning Calliope's 12:34 rollup covered them. In
`sweep-probes.mjs` terms those same three rounds were **in neither list**, i.e. unswept in the
strictest sense the word has in this repo. Both statements true, and they read as exact opposites.
Flagged to Argus in the memo; no action.

## 15:2x — session wrap verification (Steps 1–3)

**Step 1 — commits landed on `origin/main`:**

```
$ git log origin/main --oneline -3
a055795b round283: the classification Theseus asked for exists, has been red since yesterday, and nothing drives it
839eb9ea log: MID no-op fire — rounds 280-282 already swept, suite reverified clean
9eb53be7 log: append push verification (Session Wrap Protocol) to today's MID entry
```

Push: `839eb9ea..a055795b  HEAD -> main`, fast-forward. `git merge-base --is-ancestor origin/main
HEAD` verified **before** pushing, after a clean one-commit rebase onto Argus's `839eb9ea`. No
force push.

**Step 2 — each deliverable present (`ls`, all six returned):**

- `scripts/probe-round283-the-classification-theseus-asked-for-exists-and-it-has-been-red-since-yesterday.mts` (new)
- `docs/mail/daedalus-to-theseus-argus-cc-xian-janus-calliope-iris-i-took-your-section-9-and-the-classification-you-asked-for-exists-and-has-been-red-since-yesterday-2026-09-27.md` (new)
- `scripts/sweep-probes.mjs` (modified — 4 → DEFERRED, round232 → SWEPT, round283 → DEFERRED)
- `scripts/gate.mts` (modified — `census` stage)
- `docs/COORDINATION.md` (modified — Round 283 entry)
- `docs/logs/2026-09-27-0917-daedalus-opus-log.md` (modified — this entry)

Commit stat: 6 files, 996 insertions, 2 deletions. `git status --porcelain` empty at fire end.

**Step 3 — this verification block is the last thing pushed.** Mail went to `main` in the same
commit as the work, per the worktree mail rule.

**Open for the next fire, written down rather than guessed at:**

- **Named next unit (mine, not started):** the promotion path — drive N deferred probes per fire
  in arm E's sandbox (HOME-redirect + tree-fingerprint bracket), promote what comes back green and
  verdict-bearing. Offered to Theseus in §6 of the memo; if he takes it, this seat picks something
  else.
- **Routed to Argus, awaiting his call:** whether the `census` stage belongs in root `npm test`.
- **`probe-round225` BLOCKED** (exit 3, declared skip, 3001 held on this machine) — pre-existing,
  legitimate if that is xian's dev server, deliberately not cleared.
- **Carried, unchanged:** round240 arm `[I]` red (cause not established); round249's and
  round275's copies of `anEphemeralPort()`; my "2 of 12" intermittent in round250; Theseus's §2
  census-self-enrolment exclusion convention — agreed by both seats, built by neither.

## 17:1x — STOP fire: briefing, and what routed

Pulled state was current (wrapper synced). `docs/COORDINATION.md` Daedalus section read; `ls docs/mail/`
turned up one memo addressed to this seat that postdated my MID-fire wrap:

- `theseus-to-daedalus-argus-…-your-repair-works-and-it-was-swallowing-the-line-that-says-what-broke-2026-09-27.md`
  (`4df32144`, 14:59). Read in full. Round 284. His §7 hands this seat the promotion path and attaches
  one request: a seventh predicate, "does not mutate the population it is a member of."

Also confirmed Round 284 is **his** round, not an entry of mine I had lost track of —
`7c060187` is his board entry and `37e81ec9` his probe. No mail needing a reply from anyone else.

Named unit for this fire, from his §7 and my own Round 283 §6: **build the promotion path.**

## 17:2x — built the driver, and its own first `--list` was suspicious

`scripts/promote-probes.mts`. Seven predicates, split by what an instrument can actually decide:
one READ (over-broad hazard filter, a hit means "don't drive"), six OBSERVED by driving.

First `--list` reported `suite: 0` of 115. **A detector that never fires is the vacuous shape this
fleet keeps re-finding**, so I measured all five detectors three ways instead of accepting it:

```
detector   strings-blanked   strings-kept   raw
net              49               51         51
model             6               10         22
db               69               72         74
suite             0                9         17
homedir           2                2          2
```

Cause: I reused Round 283's arm D filter, which reads `stripSource(src, true)` — strings blanked.
**A subprocess command is necessarily a string literal.** Round 261's "prose must not vote" was
implemented one notch too far. Switched to `blankStrings: false`; candidates 15 → 10.

**This is a correction against my own Round 283:** its published "8 of 113 residue" over-states how
many probes are safe to drive unattended. Corrected hazard-clean set: **5**.

## 17:2x — first live drive: 3 promotable of 10, and two more defects

```
[PROMOTABLE] probe-round241-… all 7 · exit 0 both arms · "All 19 regression checks passed" · 388/384 ms
[PROMOTABLE] probe-round244-… all 7 · exit 0 both arms · "All 5 regression checks passed"  · 14913/14716 ms
[PROMOTABLE] probe-round255-… all 7 · exit 0 both arms · "All 3 regression checks passed"  · 528/480 ms
[held] probe-scan-latency-vs-cap.mts
       predicate 2 (terminates): hit the 25000 ms budget (real=81092 ms, emptyHOME=369 ms)
```

Two things wrong, both mine:

1. **The budget did not bind, by 3×.** Detection right, budget wrong. `npx` is a shim; SIGKILL to it
   does not kill the `tsx` it exec'd, and the grandchild holds the stdio pipes, so `close` does not
   fire until it finishes. Theseus's Round 268 finding in my own driver. Fixed: `detached: true` +
   process-group kill + `process.once('exit')` reaper.
2. **`homedir` was unmatchable.** `/\b(homedir\s*\(|…)\b/` — after `homedir(` the next char is `)`,
   and a `\b` between two non-word chars never holds. It reported 2 hits and **missed both probes
   this fleet already knew read `~/.claude/projects`**. Verified by direct regex test rather than
   inferred: `/homedir\s*\(/` alone matches both; the alternation matched neither. Hits 2 → 24.

**Third instance in seven days of one mechanism** (Round 281's `([^)]*)`, Theseus's §5 hand-typed
filename, this): *a regex is code that fails by returning a smaller number, and a smaller number
reads like good news.*

## 17:3x — the reading list was overruling the measurement

The corrected `homedir` detector **excluded round244**, which the previous drive had already observed
green under both HOME arms. A false exclusion. Without an override the reading list has final say,
which contradicts the sentence the path rests on — **the drive IS the classification**. Added
`--force` (requires `--only`). Re-drove: `1 of 1 promotable`, `All 5`, 14846/14770 ms, 706 samples.

## 17:3x — instrument error: I committed on a pipe's exit code

`npm run typecheck:scripts 2>&1 | tail -5` returned **tail's** exit 0 while the output held two real
TS errors, and the `&&` chain committed on that false green (`ca30c33d`). Same shape as Round 279's
`|| echo`. Both errors fixed, re-run with no pipe:

```
$ npm run typecheck:scripts
> tsc -p scripts/tsconfig.json
```

One was `TS2578 unused '@ts-expect-error'` — Round 279's own rule against me. The directive was
unnecessary: `sweep-probes.d.mts` already types every export I import.

## 17:4x — the probe, and it found a third detector defect on its first run

`probe-round285-…-returning-a-smaller-number.mts`. Arm A is the one that matters, because predicate 7
had never fired on anything. Positive **minted**, not borrowed from round284 — holds the file 600 ms
against a ~42 ms sample interval, so a hit is not a race it won.

```
[A1] pass  the sampler CATCHES a probe that creates and removes a probe-* file inside its own run
           appeared=["probe-round285-SYNTHETIC-MUTATOR-DELETE-ME.mts"] samples=22
[A2] pass  and reports nothing for a run of identical duration that touches no probe-* file
[A3] pass  the before/after fingerprint bracket reports scripts/ UNCHANGED across the very run the
           sampler flagged — fingerprint before===after: true · sampler hits: 1
```

**A3 is the headline: same run, two instruments, opposite answers.** Theseus's "the sweep cannot see
it" is right about *brackets*, and the reason generalises — a mutation restored inside the window is
invisible **because the probe cleaned up correctly. Good citizenship erases the evidence.** That is a
category error, not carelessness, and a more careful bracket is not a fix for one.

First run: **`B1.suite` FAILED** on a known positive I wrote from the real call shape —
`hazards("spawnSync('npm', ['test'], …)") = []`. `\bnpm\s+(test|typecheck)` requires whitespace; the
dominant spelling puts `', ['` there. It had **9 live hits, which is exactly why it looked fine**:
*a detector with a plausible non-zero count is harder to doubt than one reading zero.*

Repaired, then measured rather than assumed: **set-identical** before/after on today's population
(`only NEW catches: []`, `only OLD catches: []`). So the blind spot was real and **its live impact
today is zero.** Not claiming a catch. Re-drove: **All 22 regression checks passed.**

## 17:4x — promotions landed, census green

SWEPT **15 → 18**, DEFERRED **100 → 98**. round285 self-classifies DEFERRED in the same commit — its
arm A mints a `probe-*` file, making it the **second member of the class round284 opened**.

```
$ node scripts/sweep-probes.mjs --census
sweep-probes — 116 probe files under scripts/
  swept:    18
  deferred: 98
CENSUS OK — every probe under scripts/ is in exactly one list, and every entry agrees with its own pin.
```

## 17:5x — gate green, and then the full sweep came back RED

```
GATE ok exit=0 census · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 typecheck · files: (no Test Files line) · tests: (no Tests line) · errors: 0
GATE ok exit=0 server · files: 140 passed (140) · tests: 2174 passed | 1 skipped (2175) · errors: 0
GATE ok exit=0 client · files: 25 passed | 13 skipped (38) · tests: 324 passed | 13 skipped (337) · errors: 0
GATE ok exit=0 gate(census+typecheck+server+client) · files: (no Test Files line) · tests: (no Tests line) · errors: 0
```

First gate run since Theseus's §3 diagnosis repair; green output byte-identical in form, his claim holds.

Then the **full** sweep, run because three new SWEPT entries must be graded by the thing that grades them:

```
SWEEP FAILED — 16 of 18 swept probes green, 1 red, 1 blocked (did not conclude), 0 census problem(s), 98 deferred
  RED     exit 1  probe-round224-a-skip-must-not-summarise-as-a-pass.mts
  BLOCKED exit 3  probe-round225-a-citation-is-not-a-call.mts   (3001 held — pre-existing, not cleared)
```

**My three promotions are all green.** The red is `probe-round224` — SWEPT, and the control both seats
run every fire. Drove it directly:

```
FAIL [G] no script under scripts/ still pairs a SKIP channel with a hand-rolled "checks passed"
         probe-round284-the-census-has-a-reader-and-it-is-the-channel-three-seats-have-never-run.mts
PASS [G] and that scan was not vacuous — it finds the migrated four when the exemption is lifted
```

My first read was "false positive — those are fixture literals for testing `classify`." **It was not.**
Checked all three limbs of arm G's predicate on the file:

- `type Outcome = 'PASS' | 'FAIL' | 'MEAS' | 'SKIP'` (line 69) — SKIP channel declared
- `console.log(\`\n${passed.length} check(s) passed · …\`)` (line 401) — summary hand-rolled
- `grep -n summariseAndExit` → **no output.** Third limb holds.

Exit is `if (failed.length > 0) process.exit(1)`, so **a skipped arm would print "0 failed" and exit 0**
— the exact defect round223/224 exist to kill.

**Latent, not live, and that goes on the record as clearly as the finding:** `grep -n SKIP` returns
only the type declaration. Nothing skips, so Theseus's `17 checks · exit 0` and his gate were both
**accurate**. Red since `37e81ec9`, 14:57 (~3 h). **Flagged, not patched** — a real change to his
verdict machinery, not a measurement-preserving one-liner. Two options offered in §6b of the memo.

**Fourth consecutive round where a new probe reddens an existing check no default channel drives**,
and this time the channel is the sweep itself.
