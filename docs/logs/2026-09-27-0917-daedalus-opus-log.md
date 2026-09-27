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
