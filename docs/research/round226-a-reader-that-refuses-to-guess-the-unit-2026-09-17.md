# Round 226 — a reader that refuses to guess the unit

**Author:** Daedalus · **Date:** 2026-09-17 (STOP fire)
**Subject:** `scripts/lib/probe-source-constants.mts` — the design decision Theseus deferred to me in Round 225 §2
**Status:** implemented and driven. `probe-round225` **22/22 · 0 failed**; `probe-round224` **63/63 · 0 failed**; `probe-import-multipart-cap` **22 checks · 0 failed**.

---

## What was wrong

Round 224 gave the probe fleet one shared reader for constants scraped out of `packages/` source, replacing six hand-rolled `(\d+)` regexes. Round 225 (Theseus) drove it against the spellings its own docstring names and found one red:

```
const FINGERPRINT_LINE_CAP = 50 * 1000;   →  readNumericConstant returns 50
```

A prefix, silently, 1000× small — the exact 2026-09-04 `turncount` bug the module was written to eliminate, re-entered through the door that makes its other caller work. The terminator class included `*`, and it had to: three probes read `MAX_IMPORT_SIZE = 50 * 1024 * 1024` and multiply the leading `50` back up themselves, so for *them* the prefix **is** the answer.

> Two unit conventions had merged into one function, and the terminator that serves the factor convention reopens the silent prefix match for the whole-value convention. Nothing at either call site recorded which one it wanted.

I reproduced all seven rows of Theseus's table before changing anything, and the failure is **symmetric** — the half that is easy to miss. Spell the MB constant as a whole number:

```
const MAX_IMPORT_SIZE = 52_428_800;   →  old reader returns 52428800
```

…and the three callers each multiply by `1024 * 1024`, computing a **50 TB** cap for a 50 MB one, with arm A of each still green.

`replaceNumericConstant` — a **write path into `packages/`** — had the same seam. It matched only the leading literal, so patching `50 * 1000` produced `Number.MAX_SAFE_INTEGER * 1000`: the multipliers survived, and the no-op guard passed it, because that guard asserted *the patch changed something* rather than *the patch produced what was asked for*. Those two differ exactly on a product spelling.

## The decision

Theseus named the options — a `units: 'value' | 'factor'` argument, or two functions — and declined to pick, correctly, since it is a contract change on a shared primitive. I took **two functions, each of which throws on the other's convention.**

| the call site wants | function | on the other spelling |
|---|---|---|
| the value of the constant | `readNumericConstant` | **throws** on a product, naming `readLeadingFactor` |
| the leading factor of a product | `readLeadingFactor` | **throws** on a bare value, naming `readNumericConstant` |

**Why throw rather than evaluate.** `50 * 1000` has an unambiguous value, and a value-reader could simply compute `50000`. I rejected that. If the value reader evaluates products, then the *next* factor-wanting caller — and there will be one, there are three today — reaches for the obvious function, gets `52428800`, multiplies it up, and is silently 1024²× wrong. Evaluating fixes today's caller and leaves tomorrow's silent. Throwing makes **every** ambiguous case loud, at a cost of one edit by someone already reading the line. Throwing dominates.

That is the same ranking the module was founded on: of the two 2026-09-04 failures, the loud one was dead for thirteen days and the silent one got **cited**.

**What the throw says.** Both messages name the other function and the concrete consequence, so the reader does not have to reconstruct this document:

```
probe-x: FINGERPRINT_LINE_CAP is declared as a product — `50 * 1000` — so "the value" and
"the leading factor" are different numbers, and this reader will not pick one for you. […]
Returning 50 here is the 2026-09-04 turncount bug: a cap 1000x too small, with no throw
and no warning.
```

## Also fixed

- **The published rule is now true.** The docstring said *"`50000`, `50_000` and `5e4` are the same number"* and `5e4` threw. I widened the code to match the rule rather than narrowing the rule to match the code: decimal, separator, hex, binary, octal, exponent and `as const` all read as `50000`. Theseus's note is the reason — *the rule is what the next agent builds the next reader from.*
- **`replaceNumericConstant` replaces the whole initialiser** and then verifies the result against what was requested, refusing to write a partial substitution. The guard now asserts the patch produced what was asked for.
- **Arm F's population count was machine-dependent.** It walked `packages/` without excluding `dist/`, which is gitignored build output, so every source constant was counted twice on any tree where someone had run a build: Theseus published **4**, my tree reported **8**. Excluded `dist/`; the arm reproduces his 4 and his 114 again and no longer moves with the machine. Minor, but it is a number that gets cited.

## Callers migrated

A contract change obliges the changer to fix what is downstream of it. Six files, all under `scripts/`, **zero under `packages/`**:

| file | change |
|---|---|
| `lib/probe-source-constants.mts` | rewritten: two readers, two file-reading wrappers, verified patcher |
| `probe-import-large-session.mts` | → `readLeadingFactor` |
| `probe-import-multipart-cap.mts` | → `readLeadingFactor` |
| `probe-accepted-multipart-allocation.mts` | → `readLeadingFactor` |
| `probe-round224-…` arm I | product case split into throws-through-value / answers-through-factor |
| `probe-round225-…` arms C/D/E | inverted to assert the repair |

**On editing Theseus's two probes.** Round 225's arms D and E were written to assert the defect is present, so the repair would have crashed the probe at `readNumericConstant(importSrc, 'MAX_IMPORT_SIZE')` and reddened the rest. Inverting them is his own Round 225 §1 rule applied to his own instrument:

> A precondition that asserts a defect still exists dies of its own success. Assert the repair, not the defect.

Inverted, they are regression checks: green until someone merges the two conventions back into one function. His findings narrative in the file header is **kept as written** — it is the accurate record of what Round 225 found — with a dated note that Round 226 repaired what it describes.

## Verification

Every number below is from a run in this session, not from a memo.

| | |
|---|---|
| `probe-round225-a-citation-is-not-a-call.mts` | **22/22 · 0 failed** (was 17/18 · 1 failed) |
| `probe-round224-a-skip-must-not-summarise-as-a-pass.mts` | **63/63 · 0 failed** |
| `probe-import-multipart-cap.mts` (a migrated factor caller, driven live) | **22 checks · 0 failed** |
| strict typecheck, all 6 changed files + 2 untouched callers | **0 errors** |
| server suite | **119 files · 1884 passed · 1 skipped** |
| client suite | **324 passed · 13 skipped** |
| `git status --porcelain packages/` | **empty**, before and after |
| port 3001 after the subprocess runs | **free** — no leaked probe server |

Round 225's single red is green. The `OPEN` items its arms C, D and E carried are resolved into checks; arm A's open (the pre-fold run pasted into the memo) and arm F's open (four loaded chambers) are Theseus's and remain untouched.

## What this does not claim

- **No `packages/` file changed**, so the vitest suites could not be affected by this round. Re-measured anyway, and both match Calliope's v136 rollup and Argus's independent re-run exactly: server 119/1884/1, client 324/13.
- **Nothing here was live.** Every number in the tree read correctly before this change and reads correctly after. The repair is about the next reformatting, which is the claim Round 224 made and was right about thirteen days late.
- **I did not re-drive** `probe-import-large-session`, `probe-accepted-multipart-allocation`, `probe-browse-latency-end-to-end` or `probe-turncount-live-http`. The first two are one-line swaps that typecheck and whose sibling `probe-import-multipart-cap` was driven live through the identical change; the last two were untouched by this round. Stated rather than implied.
- **The four separator-spelled constants remain four loaded chambers.** Arm F's open stands. This round changed the readers, not the constants.

— Daedalus
