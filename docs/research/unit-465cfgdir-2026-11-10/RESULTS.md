# unit-465cfgdir — the fleet-wide RED under `CLAUDE_CONFIG_DIR`, cured and measured

Daedalus, 2026-11-10, fire opened ~16:36 PT (the fire xian's 2.1.322 restart opened, relayed by
Pard). **No pre-registration: this is a cure for a reported RED, not an experiment.** Said plainly
so it is not read as a research unit with its predictions removed.

## What it is

Calliope's 16:3x memo routed a RED gate to Argus: `server 2 failed | 141 passed (143)` ·
`6 failed | 2215 passed | 1 skipped (2222)`, against the clean `143 / 2221 / 1` every seat cited
five times today. Root cause as routed: Claude Code **2.1.322** exports `CLAUDE_CONFIG_DIR` into the
Bash tool's child environment, and `getClaudeProjectsDir()` reads that variable **ahead of**
`os.homedir()`, so a fixture that isolates the scanner by mocking `os.homedir` alone is bypassed and
reads the operator's real `~/.claude/projects`.

**Authorship, checked not recalled.** The precedence is mine, but not where the memo placed it:
`git log -L 151,152:packages/server/src/import/session-scanner.ts` → **`4602561d`, "round149: the
session scanner walks more than one Claude config root", 2026-09-04**, not "Round 237-ish". The
behaviour is also **correct and deliberate** — honoring Claude Code's own variable with replace
semantics is round149's whole point, and the file says so. The defect is entirely in test isolation.

**Taken rather than left routed.** The code is mine; the gate is red for every seat the moment it
restarts; and Argus's next WORK unit is already claimed (promoting the `K-once` screen). Reported to
Argus and Calliope in the same fire rather than silently.

## The cure

The save/clear/restore shape already in `round149-multi-root-session-scan.test.ts` (`savedEnv` at
module scope, `delete` in `beforeEach`, conditional restore in `afterEach`), applied for **both**
variables. `5bc3c0e5` (two files), `ab5f3f54` (the third).

## The matrix — exit codes read from the child, never inferred from a headline

Baseline is **read from git at the same directory depth**, run, and deleted, so the before-cell is
not a memory of a run (`git show HEAD:<path> > <same dir>/zz-baseline-from-git-*.test.ts`).

| subject | `CLAUDE_CONFIG_DIR` | `KLATCH_EXTRA_SESSION_ROOTS` | exit | result |
|---|---|---|---|---|
| baseline from git | **set** (`/Users/xian/.claude`) | unset | **1** | **5 failed** / 13 passed (18) |
| baseline from git | unset | unset | 0 | 18 passed |
| patched | **set** | unset | 0 | 18 passed |
| patched | unset | unset | 0 | 18 passed |
| baseline from git | unset | **set** (planted 1-project root) | **1** | **3 failed** / 15 passed (18) |
| patched | unset | **set** | 0 | 18 passed |

The first four cells are the 2×2 the cure needs: one red cell, filled by the patch, with the
unset column showing the patch costs nothing on a clean environment. Captures: `leg-A`…`leg-F`.

**The fifth and sixth rows are the finding the routed fix did not cover.** `getSessionRoots()` adds
`KLATCH_EXTRA_SESSION_ROOTS` **beside** the config root, so it is a *second route to the same
source*. It is not set in any seat's shell today, so clearing it could have been written as
belt-and-braces — instead it was **measured**: with a one-project root planted in the scratch and
`CLAUDE_CONFIG_DIR` unset, the baseline goes red on 3 tests. A guard on one of two routes to the
same source is the shape already on this seat's record; this is the second route, closed with
evidence.

## Census of the mechanism, not of the two reported files

7 test files touch the scanner (`getClaudeProjectsDir` / `getSessionRoots` /
`claude-code/sessions`); 5 of those mock `os.homedir`.

| file | state |
|---|---|
| `round149-multi-root-session-scan.test.ts` | already saves/clears/restores **both** vars — this is the house pattern copied here |
| `import-hardening-2026-08-28.test.ts` | saves/restores inline per test — correct |
| `session-scanner.test.ts` | **was exposed** → cured (`5bc3c0e5`) |
| `round234-export-scan-resolves-repo-root-not-cwd.test.ts` | **was exposed** → cured (`5bc3c0e5`) |
| `import-context.test.ts` | **a third, different exposure** → cured (`ab5f3f54`) |
| `round235-…-root-override`, `round237-…-cap-override`, `round239-…-cache-override` | pass their roots explicitly; not exposed |

**The third exposure was green only by coincidence.** `import-context.test.ts` writes its fixture
under the **real** `os.homedir()/.claude/projects` and the reader resolves the root from
`CLAUDE_CONFIG_DIR` — the two agree here only because that variable happens to be `~/.claude` on
this machine. Relocated to a temp config dir: **2 failed / 4 passed, exit 1** (`leg-G`); patched:
**6 passed, exit 0** (`leg-H`). Had Calliope's shell pointed the variable anywhere else, this file
would have been in the reported RED too.

## Gate, after

`npm test -w packages/server` **143 files / 2221 passed / 1 skipped**, exit 0 ·
`npm test -w packages/client` **26 of 39 files / 333 of 346 tests**, exit 0 ·
`tsc --noEmit -p packages/server` **0 diagnostics**, exit 0 · pre-commit probe census **CENSUS OK**
(154 files, 44 swept / 110 deferred) on both commits. Every figure byte-identical to the clean ones
cited five times today.

## Not claimed, and named so the gaps are not mistaken for measured

- **The full sweep was not driven in this fire** (`node scripts/sweep-probes.mjs`, no flag). Blocker:
  none — it runs past the foreground window and Argus drove it clean twice at 13:4x against the same
  tree for `scripts/`, which this fire did not touch (`git diff --stat -- scripts/ packages/` shows
  only the three test files). Named, not asserted as green by me.
- **Why 2.1.322 and not the four earlier clean runs is Calliope's inference, not my measurement.** I
  did not install the previous build to confirm it did not export the variable. What *is* measured
  here: the variable is set in this seat's shell (`CLAUDE_CONFIG_DIR=/Users/xian/.claude`), and with
  it set the pre-cure fixtures go red.
- **A shared test helper** for this save/clear/restore block, now written out in four files. Blocker:
  none; unclaimed; it is a convention change and belongs in a unit of its own, not in a cure for a
  red gate.
- **Captures are redacted**: session UUIDs and scratch paths in the committed `leg-*.txt` are
  replaced (`<session-uuid-redacted>`, `<scratch>`); the raw captures stay in this fire's scratch.
  The red cell's evidence *is* a real session id and a real project count leaking into fixture
  assertions, which is exactly why it is not committed verbatim to a public repo.

— Daedalus
