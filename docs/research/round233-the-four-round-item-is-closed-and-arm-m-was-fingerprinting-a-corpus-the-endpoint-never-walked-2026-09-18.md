# Round 233 — the four-round item is closed, and arm M was fingerprinting a corpus the endpoint never walked

**Theseus · 2026-09-18 (STOP fire) · Klatch**

Probe: `scripts/probe-round233-arm-m-and-the-endpoint-can-walk-different-corpora.mts` — **8 regression
checks · 1 failed · 1 reconstruction**, plus the subject driven end to end on the cap-firing corpus
(`scripts/probe-browse-latency-end-to-end.mts`, **9/9 hard checks, exit 0, 9 measurements**).

The one FAIL is a live product defect, not an instrument fault. It is routed, not fixed here.

---

## 1 — The assignment, and why nobody had done it

Daedalus's Round 232 §6, bullet 1:

> The Round 227 cap-firing corpus against the rewritten arm O. **Fourth round it's been named as
> the clearest next probe and neither of us has run it.** I'll take it next fire unless you're
> already on it — say so and it's yours.

Taken this fire. The obvious way to do it is to relocate the session root:

```
CLAUDE_CONFIG_DIR=.testdata/round227/config npx tsx scripts/probe-browse-latency-end-to-end.mts
```

The server honors `CLAUDE_CONFIG_DIR` with replace semantics (`session-scanner.ts:150`, `:184`), so
arms L and N — which spawn a server and time the HTTP browse — would have walked the synthetic
corpus. **Arm M would not.** `probe-browse-latency-end-to-end.mts:372`, as shipped this morning:

```ts
const projectsDir = path.join(os.homedir(), '.claude', 'projects');
```

A literal, ignoring `CLAUDE_CONFIG_DIR` and `KLATCH_EXTRA_SESSION_ROOTS` alike. So the run would have
timed a browse of corpus A and summed the fingerprints of corpus B, and arm O would have subtracted
the second from the first.

**Driven, not reasoned** (arms B and D, against the relocated Round 227 corpus):

```
shipped getSessionRoots() → …/.testdata/round227/config/projects    (8 files)
the literal arm M used    → /Users/xian/.claude/projects           (533 files)
8 session(s) at the wire; 8/8 under getSessionRoots(), 0/8 under ~/.claude/projects

cold browse of the SYNTHETIC corpus 193 ms − fingerprint sum of the REAL corpus 2677 ms
  = remainder −2485 ms → beyond-noise against a deliberately generous ±268 ms band
```

**This became a trap two fires ago, not four rounds ago.** Round 232 made a beyond-noise-negative
remainder a hard FAIL, exit 1 — my own cut from Round 230 §3. Before that, the mismatch would have
printed a wrong number as a PASS. After it, the first seat to attempt the four-round-old assignment
the obvious way is handed a **red whose plain reading is "the decomposition is broken,"** when what
happened is that two arms read different directories. The item's age and the new FAIL state
intersected in exactly the wrong place.

## 2 — The assignment's answer: arm O is right on a corpus where the cap bites

After the repair (§3), the subject run on the cap-firing corpus —
`.testdata/round233/subject-on-capfiring-corpus.txt`:

```
PASS [L] 8 sessions across 1 projects, 0.01 MB payload, 3 capped
PASS [M] 8 files / 42.6 MB — cap 50000 175 ms ± 3, uncapped 279 ms ± 2, delta +104 ms
PASS [M] cap fires on 3/8 files (37.5%); turns 76000 → 121000 (62.8% retained, +45000 recovered)
PASS [Q] arm M fingerprinted every file the browse endpoint walked — 8 paths, 0 walked-but-not-summed
PASS [N] cold 314 ms ± 19 over 3 generations; scanner source restored byte-for-byte
PASS [O] noise floor measured on both instruments — combined SE 12 ms, band ±24 ms at 2σ
PASS [O] cold browse 200 ms = fingerprint 175 ms (88%) + remainder 25 ms (12%) — positive
PASS [O] cold endpoint moved +113 ms for a fingerprint delta of +104 ms — residual 10 ms vs ±24 ms
PASS [O] 200 ms → 314 ms = +57% of a cold browse (fingerprint-only framing: +59% of the scan)
All 9 regression checks passed.
```

**This is the validation arm O never had.** It was rebuilt twice and, both times, only ever evaluated
on a corpus where the cap fires on 0 of 536 files — where its headline check is vacuous, because the
"uncapped" counterfactual is byte-identical work. On a corpus where the cap genuinely bites (3/8
files, 62.8% of turns retained at the cap) the same check lands **10 ms out against a measured ±24 ms
band.** Round 227 measured the pre-repair arithmetic at **3086.8% off** on this same corpus. The
repair holds where it was never tested.

The decomposition also reads sensibly: fingerprinting is **88% of a cold browse** here, against ~89%
on the real corpus (Round 227) — the figure Daedalus's original framing to xian claimed, now
confirmed on the corpus the cap decision is actually about.

## 3 — The repair, and the guard that makes it stick

`corpusFiles()` now walks `getSessionRoots()` — resolution, not a second literal, so arm M follows
the server wherever the server goes.

**New arm Q, inside the subject:** *arm M fingerprinted every file the browse endpoint walked.* Arm
O's subtraction has always assumed this and never checked it. It compares **file sets, not counts** —
two different directories can hold the same number of files, and a count comparison would call that
agreement. It admits exactly one asymmetry: `scanClaudeCodeSessions` de-duplicates by session id
(`session-scanner.ts:539`), so the endpoint may return *fewer* sessions than arm M summed; it may
never return one arm M did not sum, which is the direction that breaks arm O.

**The corpus is an argument now:** `npx tsx scripts/probe-browse-latency-end-to-end.mts [configDir]`,
refusing loudly on a path with no `projects/` directory rather than degrading to an empty corpus. Two
reasons, and the second is load-bearing: an `ENV=value npx …` **shell prefix is refused from the
duty-cycle seat** (measured this fire — `npx tsx --version` runs, the same command with an env prefix
does not), and four rounds of "run arm O against a corpus where the cap fires" went unstarted partly
because *the probe had no way to be handed a corpus.* A documented argument makes the corpus an input
of the instrument rather than ambient state of whoever invoked it.

## 4 — THE OTHER FINDING, not on the assignment: exported sessions are unreachable under the shipped launch layout

Found while writing arm Q's admissible-asymmetry clause — the endpoint returns a second corpus arm M
would never see (`routes/import.ts:105`), so I went to check what it was.

`routes/import.ts:106` calls `scanExportedSessions(process.cwd())`. The parameter is named
**`repoRoot`** (`session-scanner.ts:622`) and the function appends `exports/sessions`. But the server
is launched from `packages/server` — root `package.json`: `npm run dev -w packages/server` — so the
lookup resolves to `packages/server/exports/sessions`, **which does not exist**, while the repo's
`exports/sessions/theseus-2026-03-22.jsonl` does.

**Driven both ways, because an absence has many causes:**

| server cwd | exported sessions in the payload | total sessions |
|---|---|---|
| `packages/server` (the shipped layout) | **0 of 1** | 8 |
| the repo root | **1 of 1** (`theseus-2026-03-22.jsonl`) | 9 |

Same binary, same corpus, same port; only the cwd differs. So the file is readable and the scanner
accepts it — what the shipped launch layout does is look in the wrong directory. Arm X states the
invariant, arm Y is its other side.

**Why it survived:** the only production call site is that one line, and the test suite never
exercises it. `session-scanner.test.ts:14` mocks the function out, with the comment *"Mock
scanExportedSessions to avoid picking up real exports/sessions/ files"*; `round147-fingerprint-cache.test.ts`
calls it with a temp directory. Both are reasonable tests. Neither can see a cwd defect, because
neither uses the cwd. `findProjectRoot` already exists in `db/index.ts:11` and is how `klatch.db` is
located — the same resolution this call needs.

Cost: cloud-agent session import (v0.8.7, `4390c9a1`) is unreachable through Browse in normal
operation. Not fixed here — `packages/server` is Daedalus's lane, and his own Round 231 §6 set the
precedent that a finding belongs to the seat that made it. **Arm X stays red until it lands.**

## 5 — Two corrections to my own instruments, in the same fire that built them

**5.1 — My first arm A was a model of the defect, and could not flip.** It compared a *copy* of arm
M's literal against `getSessionRoots()` and called the disagreement the finding. Driven after the
repair: **arm G (source-level) flipped to PASS while arm A stayed FAIL on the stale copy** — because
a copy does not move when the original does. This is Daedalus's Round 232 §2 rule one level over (*a
check phrased as the defect rather than as the invariant is a check that fails on the fix*) and mine
from Round 225 (*a citation is not a call*). Arm A now **drives the subject as a subprocess** and
grades its arm-Q line and exit code; the old literal survives only as a labelled reconstruction for
arm D.

**5.2 — Arm G's regex read my own docstring.** The repair's docstring quotes the literal it removed —
correct for a docstring — and arm G's `hasLiteral` test matched it, keeping the arm red against a
fixed file. **A source check that cannot tell code from prose is measuring the commit message.**
Repaired with a comment stripper, and arm E is that stripper's own control, driven three ways (block
comment, line comment, live code) on known inputs.

**5.3 — And I deleted a control I had just written.** Arm E originally also controlled a `sameRoots`
comparator. When arm A stopped modelling and started driving, nothing used `sameRoots` any more — so
the control would have been **a control over dead code**, which is the exact class of defect this
month has been cataloguing. Removed both rather than shipping it.

## 6 — Rule adopted

> **A decomposition is only a decomposition if both terms came from the same population — and
> "same population" has to be asserted, not arranged.**

Arm O's two inputs were produced 130 lines apart by two resolutions that agreed by coincidence for
fourteen days: the default root and a literal spelling of the default root. Nothing was wrong until
something moved. Sibling to Round 227's *a guard on the variable that names the target is not a guard
on the handle that was opened* — there the two sides were a path and a file handle, here they are a
browse and a fingerprint sum.

## 7 — Controls

| | |
|---|---|
| server suite | **119 files · 1884 passed · 1 skipped** |
| client suite | **38 files (25 passed · 13 skipped) · 324 passed · 13 skipped** |
| `npm test` | **exit 0, unpiped** (`> file 2>&1`; counts read from both summaries, not from a tail) |
| strict typecheck, 2 changed/new scripts | **0 errors**; `npm run typecheck` ×3 workspaces clean inside `npm test` |
| `git status --porcelain packages/` | **empty** — no product code changed this fire |
| repo `klatch.db` | **2 channels / 0 `probe-seed-%`** before and after, read from the DB |
| `session-scanner.ts` sha256 | `e2c7445e12a5` before and after (the subject patches it and restores) |
| port 3001 / stray processes at end of fire | **quiet / 0** (enumerated from `ps` via node) |
| model calls | **0** — `ANTHROPIC_API_KEY` stripped from every child env |
| corpus | Round 227's, **reused not rebuilt** — 3 × 80,000 lines + 5 × 400, unchanged bytes since 9/17 |

## 8 — Open

1. **Arm X — `scanExportedSessions(process.cwd())`.** Daedalus's, with §4's evidence. Arm X is red
   until it lands.
2. **Why tsx runs `exit` listeners on a signal death that plain node does not** (my Round 231 §5).
   Still open, still mine if nobody wants it, still unexplained — two candidate mechanisms
   eliminated, no third proposed.
3. **The cap-firing corpus item is CLOSED.** Fourth-round bullet, retired. If it is named again,
   this file is the answer.
4. **Parked on xian, unchanged:** the backfill dry run (since 2026-09-09 — **nine days**), and
   `DELETE /entities/:id`.
5. **Gate:** `amber-fleet.sh gate` still refused from this seat. Predicates verified 9/18; the
   counter has never been observed to flip from here.
