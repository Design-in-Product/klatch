# Theseus session log — 2026-09-30 (STOP fire, 19:47 PT)

Model: Opus 5. Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`, synced to `origin/main` by the wrapper before the fire.

## 19:47 — briefing

Pulled state read, not recalled: `docs/COORDINATION.md` status board, `docs/mail/` listing,
`docs/briefs/cross-pollination/current.md` not yet read at this point (see below).

Two memos in the 19:47 drop, both addressed to this seat:

1. **Daedalus, Round 304** — took my Round 303 §5 (`.ts` widening), shipped
   `scripts/package.json` = `{"type":"module"}` + widened include globs, and **edited three arms in
   my own SWEPT `probe-round303`** (A3, D2, D3) because his repair made them false. §4 offers to
   revert them if I would rather own the restatement. That is a direct ask and it is the unit of this
   fire.
2. **Argus, Round 305** — `hazardSite()` under `--only` now prints the matching source line for a
   `not driven` refusal; second finding that a probe validating all five `DETECTORS` is permanently
   undrivable, and that `probe-round285` shares it for a reason its census entry never names.

Also noted: the 9/30 STOP commits already on `origin/main` (`6fdac55b`, `570dfb8b`) are **Iris's**
fire, not a duplicate of this one — checked with `git show`, author `Iris (Klatch)`.

## 20:00 — baseline, taken before touching anything

- `npm test`: typecheck clean ×4 workspaces; server **140 files / 2174 passed / 1 skipped**; client
  **25 files / 325 passed / 13 skipped**; `CENSUS OK`; `census PASSED`.
- `promote-probes --list` header: **133 probe files · 26 SWEPT · 107 DEFERRED** — Argus's Round 305
  partition reproduced exactly.
- `probe-round303` driven standalone **with Daedalus's edits exactly as he left them**: **18/18 PASS,
  7 measurements, 0 skips**. A3/D2/D3 all green. His restatement works on my tree, not only on his.

## 20:10 — §4 answered: keep his edits

Revert declined. A3 as rewritten is the two-sided agreement (a `.ts` file under `scripts/` is in the
program **iff** the config's own globs claim it) and cannot be falsified by any repair of that
deferral in either direction — the property my version lacked. I wrote the pin and routed the repair
in the same memo and did not notice the tension.

## 20:20 — THE FINDING: the restatement traded an accidental guard for a vacuous green

Both restated arms conclude *the widened program is clean* from one conjunct, `wErrs.length === 0`,
where `wErrs` filters the child's combined output on `/error TS/`. **Nothing in the file reads the
child's exit status.** Any child failure that prints no TS diagnostic is therefore read as a clean
program.

Known positive written and driven **before** any repair
(`.testdata/r306-scratch/instrument-failure-is-a-clean-program.mts`, scratch, removed):

```
cell                                           status   errLines  D2-as-shipped  D2+rc-guard
real run (the live instrument)                 0        0         GREEN          GREEN
binary absent (spawn itself fails)             null     0         GREEN          red
child killed by signal (SIGKILL before output) null     0         GREEN          red

control — missing config file: status 1 · errLines 1 · error TS5058: The specified path does not exist
```

The control is why this is narrow, not total: a config-level failure *does* print a code and was
always caught. The uncaught class is the child not running at all.

Two points of substance:

- **The form I shipped was immune by accident.** My D2 asserted `wErrs.length === 2` and
  `codes === 'TS1470'`; a non-run cannot satisfy an equality against 2. The guard was a side effect of
  pinning a nonzero count. Restating to "0 errors" was right and it converted an accidentally-guarded
  arm into a vacuously-greenable one. General shape, and I believe new to this thread's list:
  *repairing a pin from "N of a bad thing" to "none of the bad thing" removes whatever liveness the
  nonzero count was silently providing.* Not the `0 of 0` all-quantifier shape — a plain equality
  against zero, failing the same way.
- **Daedalus already had the guard, in the arm with the same subject.** `probe-round304` A2 is
  `realTsc.status === 0 && realErrs.length === 0`. The conjunct exists in the round that wrote the
  restatement; it did not travel twenty lines into my file.

## 20:35 — repair, at an unchanged arm count

`probe-round303` D2 and D3 now carry `widened.status === 0`. D2 additionally carries the **known
negative** so the new conjunct is not an unexercised green: a spawn of `tsc-this-binary-does-not-exist`
asserted to be rejected by the reader+guard pair (0 error lines AND `status !== 0`). No network, no
port. D1's `[MEAS]` line prints the exit status alongside the count.

**Arm count unchanged at 18** — the SWEPT pin (`All 18 regression checks passed`) did not restage and
no arm was added; the guard went into the two arms whose claim it protects.

Re-driven: **18/18 PASS, 7 measurements, 0 skips**, D1 printing `exit 0 · 0 error line(s)`.
`npm run typecheck:scripts` clean.

Z1 ran green with a genuinely dirty tree (`2 entries, unchanged`) — the before/after delta form from
the Round 303 repair, exercised again.

## 20:40 — the Scope note points at the wrong arm

`scripts/tsconfig.json`'s new Scope note said the `.js` obligation is "guarded by `probe-round304` arm
**C1**". Read both: C1 (`probe-round304:281`) is the with-declaration typecheck cell; the `.js`
absence is **E1** (`:411`), with E2 as its known positive. Daedalus's memo §7 says E1; the file says
C1. Corrected in place with a parenthetical naming what it read and who changed it — a silent
correction to another seat's note is what makes the next reader distrust the whole note. His round304
A3 grades the note against the globs and the deferral sentence and is unaffected (re-driven green in
the sweep).

General form, named not detected: **a note that names an arm is a pin on that arm's label, and no arm
grades arm labels.** Not proposing a detector; population is small, cost of a wrong grade is high.

## 20:45 — the staleness check the sweep structurally cannot make

Daedalus's §2 chose the declaration partly because the rename would have staled `probe-round276`'s
path-keyed allowlist **silently** (that probe is DEFERRED, so undriven). But the full sweep he drove
to measure blast radius covers the **26 SWEPT** probes only — so the hazard he avoided for the rename
was unmeasured for the shape he took. Checked here:

- Every reference to `scripts/tsconfig.json` or `scripts/package.json` across `scripts/**` —
  `probe-round245`, `probe-browse-endpoint-second-corpus`, `probe-browse-count-vs-persisted-rows`,
  `lib/strip-source.d.mts`, `lib/tsx-required.d.mts`, `lib/probe-source-constants.mts` — is **prose in
  a comment**. No predicate reads either path.
- Every reference to `**/*.mts` or `typecheck:scripts` outside round303/304/305: `probe-round283:196`
  and `probe-round284:146` both read `pkg.scripts['typecheck:scripts']` off the **root manifest**,
  untouched by Round 304.

**Negative result, verified: the declaration shape staled nothing in the undriven population.**

## 20:50 — Argus's §3 independently reproduced on a different file

```
$ npx tsx scripts/promote-probes.mts --list --only round285
  not driven (net): 1     · line 159: net: "const s = createServer(() => {});",
  not driven (model): 1   · line 160: model: "const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });",
  not driven (db): 1      · line 161: db: "import Database from 'better-sqlite3';",
  not driven (suite): 1   · line 162: suite: "spawnSync('npm', ['test'], { cwd: REPO });",
  not driven (homedir): 1 · line 113: const mutRun = await drive(rel('mutator.mjs'), process.env.HOME ?? '');
```

Five for five — claim confirmed, and the new site lines are what made verifying it a single call
rather than a drive. **One correction to the shape of the claim, not the claim:** Argus wrote this
happens because the probe validates all five detectors *on its own fixtures*. Four of five are
fixtures on consecutive lines; the fifth (`homedir`, line 113) is round285's **actual drive
machinery**, 46 lines above the fixture block. round285 would still trip `homedir` after deleting
every fixture it owns — so the conclusion is stronger than stated, but "on its own fixtures" is not
the whole reason.

## 20:55 — verification

- Full `node scripts/sweep-probes.mjs` after every edit this fire: **`SWEEP BLOCKED — 25 of 26 swept
  probes green, 0 red, 1 blocked (did not conclude), 0 census problem(s), 107 deferred`**, exit 2. The
  1 blocked is `probe-round225`, the standing port-3001 holder (xian's dev server) — same probe and
  reason as Rounds 291/294/296/298–305, not a new regression. **0 red.** `probe-round303` (All 18) and
  `probe-round304` (All 21) both green in the sweep channel, not only standalone.
- `npm run typecheck:scripts` clean with the edited probe and edited config in the program.
- `npm test` baseline (above) unchanged by this fire's edits — the edits are under `scripts/`, which
  the server and client suites do not cover; the census channel is the one that reads them and it is
  `CENSUS OK` / 0 census problems in the sweep above.

## 21:00 — cross-pollination brief read

`docs/briefs/cross-pollination/current.md` (September 30). Item 2 — Pard/Piper Morgan: for an
unverified failure window, make the failure self-explaining rather than build the structural fix for a
premise you have not measured. Bears directly on this fire's open question. The distinction I am
drawing: §3's premise **is** measured (the table is one real run), so the brief's principle rules out
the **detector** over the swept set, not the guard. Guard shipped; detector waits for a second
instance in a different arm. Item 1 (Argus's census pre-commit hook, fleet-wide via `core.hooksPath`)
is the gate this fire's commits pass through.

## Open / carried

- **Mine, unmoved:** `probe-round295`'s marker, Round 297 §3 reason unchanged.
- **Unclaimed by all three seats, third round running:** a guard over `.d.mts` **return types and
  parameter types**. B2/B3 cover names and arity and are SWEPT; arity is the half that fails silently.
- **Mine, named not taken:** whether the §3 shape ("a repaired pin loses the liveness its nonzero
  count provided") deserves a detector over the swept set or just a rules line. I lean to the line —
  the population is every `=== 0` in every arm and most are correct.
- **Carried, untouched:** bulk/Browse row disclosure not driven live; `target-not-found` staleness
  after the picker's one-time fetch; the CLI end-to-end for predicate 8; the "2 of 12" intermittent in
  round250.

Discipline: no port bound, no database opened, no corpus read, no model called. One child process
added this fire, a spawn of a binary that does not exist. Scratch under gitignored `.testdata/`,
removed before the first commit.
