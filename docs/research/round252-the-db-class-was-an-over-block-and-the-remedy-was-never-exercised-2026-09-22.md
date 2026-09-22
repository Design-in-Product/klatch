# Round 252 — the `db` class was an over-block, and the remedy designed for it was never exercised

**Theseus, 2026-09-22 (START fire).** Probe:
`scripts/probe-round252-the-db-class-is-unblocked-by-a-variable-the-product-already-reads.mts`.
Run 3 (clean tree): **all 8 regression checks passed, exit 0**, 4 measurement arms.

The filename is the hypothesis this round was built on. **The run refuted it.** The name is left
as written, because renaming it after the fact would hide that the round went in expecting one
answer and measured another.

---

## 1 — What was taken, and from whom

Round 250 drove 3 of 48 stale-in-code probes to an exit code and reported the remainder by the
class that blocks it: `db 35 · mutate 28 · server 19 · port 19 · args 3 · suite 2 · model 2`.
Its arm H said of the largest class:

> `'db'` needs a `KLATCH_DB` scratch path, which the product ALREADY supports, so that class is a
> harness change and not a product one.

That sentence was written from a **source read**, not a drive. Daedalus's Round 251 §7 called the
class *"the only structural blocker of that size left standing."* This round takes it.

---

## 2 — THE FINDING

> **`0 of 13` of the members blocked only by `db` created the scratch database they were handed.**

Thirteen files out of the 48 have `db` as their sole remaining blocking hazard. All thirteen were
driven with `KLATCH_DB` pointed into a per-file tmpdir. **Not one of them opened it.**

The evidence for what they do instead is positive, not inferred. Eight of the thirteen wrote
their own fixture directories under `.testdata/` during the run, measured by mtime against a
10:50 cutoff:

```
r176 10:58:11 · r183 10:58:17 · r185 10:58:30 · r187 10:58:41
r189 10:58:53 · r191 10:59:00 · r193 10:59:08 · r201 10:59:10
```

These probes already isolate their own storage. They mint a database in a scratch workspace and
never consult `KLATCH_DB`, which is why the variable reached none of them.

**So the honest sentence is not "a scratch path unblocked the largest class."** It is:

> **The largest blocking class was substantially an over-block, and the remedy designed for it
> was never needed. The gate was holding thirteen files back on a regex — *names `klatch.db`, or
> imports `better-sqlite3`, or reaches `db/queries.js`* — rather than on a database.**

**Second sighting of this exact shape.** Round 250's arm A6 found the `server` marker
over-blocking 39 files by matching any import from `packages/server`. That was repaired; `db`
inherited the position of largest class and had the same defect, unexamined, for two rounds.

> **Rule: when a classifier's largest class turns out to be an over-block, the correct next
> suspicion is the class that inherits the title — not the classifier in general. An over-block
> is invisible from outside (Round 250 §4: "blocked" is indistinguishable from "nobody got to
> it"), so the only thing that finds it is driving the class you believe you cannot drive.**

---

## 3 — 8 of 13 are red at HEAD, and the reds are not one thing

Because none of the thirteen used the scratch path, **these reds are not artefacts of this
harness** — they are what a plain `npx tsx` produces today. Decomposed rather than totalled:

| file | outcome |
|---|---|
| `probe-expand-continuation.mts` | **hard crash**, 0.4 s, Node stack trace — not a failed check |
| `probe-round220-reassign-on-the-march-corpus.mts` | **fail-closed refusal**: `corpus not found at .testdata/r200/march14.db — nothing to drive, exiting 1` |
| `probe-round176-backfill-cli-end-to-end.mts` | 51 checks · **1 failed** · 1 open · 2 measurements |
| `probe-round185-what-the-undo-classifier-knows-a-run-by.mts` | 15 checks · **1 failed** · 0 open · 3 measurements |
| `probe-round187-the-binding-rule-at-the-inputs-it-was-argued-from.mts` | 11 checks · **4 failed** · 0 open · 4 measurements |
| `probe-round189-the-restore-wording-on-a-minted-channel.mts` | 14 checks · **7 failed** · 0 open · 4 measurements |
| `probe-round199-…-none-of-them-is-a-name.mts` | 14 checks · **8 failed** · 1 open |
| `probe-round200-…-the-window-is-what-does-it.mts` | 22 checks · **4 failed** · 1 open · 5 measurements |

Green (exit 0): `probe-round183`, `probe-round191`, `probe-round193`, `probe-round201`,
`measure-marker-floor.mjs`.

**`probe-round220` is the round54 mechanism, third sighting in three rounds.** Its guard fired
correctly and named its own missing input. Verified independently of the probe's own claim:
`.testdata/` contains `r199` and `r201` but **no `r200`** (`fs.existsSync` → false). `.testdata/`
is gitignored and disposable by design, so this is a fixture nobody regenerated rather than
something deleted — **stated as the weaker claim, because the stronger one was not measured.**

> **Rule, carried from Round 250 §4 and now demonstrated a third time: a fail-closed guard's
> value is bounded entirely by whether anyone reads its refusal. Every one of these eight was
> reachable by one `npx tsx` at any point in the last two rounds.**

---

## 4 — Daedalus's `PORT` lever moved the product, not the harness

`packages/server/src/port.ts` present and `index.ts` calls `resolvePort` — **read this fire, not
carried from his memo**. The lever works; Round 251 drove it.

It does **not** unblock the `port`/`server` class. **19 population members are blocked by `port`
and/or `server`; 16 of them spell `3001` or `5173` in their own source.** Handing such a probe
`PORT=<free>` moves the server it spawns and leaves the probe connecting to 3001 — red for a
reason with nothing to do with staleness.

> **Rule: a product lever unblocks a harness class only where the harness had delegated the
> choice to the product in the first place.** The `db` class looked like one variable because the
> product resolves the path; the `port` class is **16 file-by-file edits**, and the lever is the
> precondition for those edits rather than a substitute for them.

This is why this round did not attempt the port class on the strength of the lever landing.

---

## 5 — What this round cannot say

- **A red under a scratch database and a red under the real one are not the same verdict.**
  10 of the 13 spell `klatch.db` as a literal somewhere in reachable source; whether a variable
  reaches them depends on what they do with that literal, which is not statically decidable and
  is not claimed. 6 of the 8 reds are literal-spellers.
- **A green exit does not mean the probe's subject is still there** (Round 247 §4).
- **Why each of the 8 is red is not diagnosed.** This round drove them and decomposed the counts.
  Eight separate investigations are eight separate rounds.
- **The negative side of arm B is a different scratch path, not an unset variable.** Unset points
  `getDb()` at xian's real `klatch.db` and `getDb()` runs `initSchema()` + `runMigrations()`,
  which write. A control that has to damage the artefact it protects is not one. That the
  fallback is the repo database is **read** from `db/index.ts:7-9`, and labelled as read.

---

## 6 — Faults in my own instrument, all four found by running it

1. **`Z2` went red twice, and both times it caught *me*.** Run 1: the wording fix I was making
   while the drive ran. Run 2: this session's log. The window opens at the first spawn and closes
   when the last child exits precisely so it can see tree changes during the drive — it cannot
   tell the drive from the operator and should not try. **Third sighting in two rounds** (Round
   250's run 5 was the research doc). The remedy is discipline, not code: run 3 was taken with
   nothing else touching the tree, and passed.

2. **`Z2` has a gitignore-shaped hole, and this round demonstrates it.** It reports "0 lines
   introduced" while the drive wrote **eight directories** into `.testdata/` — which is
   gitignored, therefore invisible to `git status`, therefore invisible to the control.
   The control measures *git's view of the tree*, not the tree. Reported rather than repaired:
   the writes are disposable by design and the same blindness is what makes arm D's fixture
   evidence available at all. **Named so it is found on purpose.**

3. **`Z4`'s PASS text asserted a counterfactual I never drove, and it was false.** I built the
   arm braced for the self-citation trap — `OWN_HAZARDS` must name the SDK to classify it — then
   claimed the naive occurrence-test *"would have failed."* The run reported the plain needle
   occurring **0 times**: the marker is written as a regex, so the source carries
   `@anthropic-ai\/sdk` with an escaped slash. The defensive spelling is kept; **the claim is
   withdrawn**, and both counts now print side by side.
   **A control arm that overstates its own near-miss is a control arm nobody should trust about
   anything else.**

4. **The headline extractor reported a section header as a verdict.** Run 1 took the last stdout
   line matching `/passed|failed|check/i`, which for four of thirteen was the bare word
   `FAILED:`. Repaired to prefer a line carrying a **count**. This is what turned "8 red" into
   §3's table — the instrument's weakest part was the one deciding what the finding looked like.

**Plus one caught before the first run:** arm B's minted driver could not live in the tmpdir,
because `db/index.ts` imports `@klatch/shared` and node resolves a bare specifier by walking up
from the *importing* file. Moved to a dot-prefixed file at the repo root, deleted before the
blast-radius window opens, with **arm B2 asserting it is gone** — Z2's window opens after that
point and would not have caught it.

---

## 7 — A property of the staleness metric, predicted then measured

Committing the §8 wording fix touched `scripts/probe-round250-…mts` and **moved the population
from 49 to 48** — the probe's last-commit date was reset, so it stopped being stale-in-code,
while nothing it measures changed.

> **Staleness here is a commit-date proxy. A prose edit launders a probe fresh.**

Written down before the re-run and confirmed by it (run 1: 49; run 3: 48), rather than noticed
afterwards. Round 250 measured 48 on 2026-09-21 from the same instrument; the agreement is a
coincidence of two different populations, not a stable number, and is **not** offered as
reproduction.

---

## 8 — Argus's wording correction, taken

Argus's Round 250 sweep found that *"eleven lines above the port literal the same **file**
honours `KLATCH_DB`"* does not hold: `grep -c KLATCH_DB packages/server/src/index.ts` is **0**.
The read is `packages/server/src/db/index.ts:7-9`, reached from `index.ts` only through the
imported `getDb()` call. Verified at the source this fire, not from his memo.

Two live sites fixed — `probe-round250-…mts:585` (arm D's PASS text, with an inline dated note
recording that no assertion, threshold or measurement is touched) and this document's
predecessor, `docs/research/round250-…md:46`, with a visible correction block rather than a
silent rewrite. **Five historical sites left alone**: two memos, a COORDINATION entry and three
session logs are the record of what was said, not claims in force.

**One refinement, checked rather than assumed.** Argus's memo places the wording in *"the PASS
text for arms D and F."* It occurs **once**, at line 585, in arm **D** only; arm F's text carries
no `KLATCH_DB`, and line 766 (arm **H**) says *"'db' needs a `KLATCH_DB` scratch path"*, which is
accurate. Daedalus's location — once, line 585, arm D — is the correct one. The substance of
Argus's finding is entirely right; only the arm list was one arm wide.

---

## 9 — Round 250's arms D and E: left red, deliberately

Daedalus routed these back: arm D's claim has inverted (it asserts the server ignores `PORT`, and
it no longer does) and arm E's anchor `const port = 3001;` is gone, so it fail-closes.

**Not re-aimed, and not edited.** Round 244 established the precedent for exactly this and this
round is bound by it: Round 240's sweep was left red rather than edited, because a filed artifact
whose figures are cited elsewhere must keep reproducing what it published. Round 250's figures
are cited in two memos and Argus reproduced them independently on 2026-09-22.

But the sharper point is that **both arms are a fifth instance of my own Round 244 §3 finding,
and I built them one round after writing it:**

> A two-sided control anchored on a live artifact is a pin; if the artifact is the thing your
> finding asked someone to repair, the control is scheduled to break **on success**, in the same
> colour it would break on regression.

Arm D asserted **the defect** ("the real server ignores `PORT`"). Arm E anchored on **the defect's
source text**. Both were guaranteed to break the moment the routing they existed to justify was
accepted — which is what happened, the same day, by the agent who accepted it.

> **Rule: a capability arm should assert the INVARIANT the remedy establishes, not the DEFECT the
> remedy removes. "The server binds what the caller asked for" survives the fix; "the server
> ignores what the caller asked for" is scheduled to die of it. The two cost the same to write.**

The re-aimed formulation is now driveable from inside `npm test`, which is precisely what Round
251 built. It belongs in a new instrument, not in a retrofit of a published one.

---

## 10 — Controls

- **Suite:** server **129 files · 2045 passed · 1 skipped**; client **38 files (25 passed, 13
  skipped) · 324 passed · 13 skipped**. `npm test` **into a file, not a pipe**. Checked against
  Daedalus's Round 251 §7 figures rather than assumed — **identical**.
- `npm run typecheck`: **0 `error TS`** across **3** workspaces.
- Standalone strict `tsc` (nodenext, `allowImportingTsExtensions`) on the new `.mts`:
  **0 errors, zero-byte output.**
- **Z1 — xian's `klatch.db` byte-identical**: sha256 `f5953e8b02ea…` before and after; mtime
  `2026-09-18T02:58:17.073Z` unchanged. A byte copy was taken before the drive and the sha
  re-checked **after every single driven file**, so a bypass would have been bounded to one file
  and restored. It never fired.
- **Z2** — 0 lines introduced to `git status` across the drive window; `git status --porcelain
  packages/` empty. **With the gitignore caveat in §6.2 attached.**
- **Z3** — 3001 quiet at exit (reported, not asserted: this probe never spawns a server). Staged
  dot-prefixed files under `scripts/` by `readdirSync`: **0**. Server entry sha256
  `b24473ac9e97…`; this probe never writes it.
- **Z4** — **0 model calls**, asserted against this file's own source on disk.
- Runs 2 and 3 produced **identical** drive figures (13 driven, 5 green, 8 red, 0 scratch used).

---

## 11 — Open

- **Eight red probes, undiagnosed.** §3 decomposes the counts; nothing explains any of them.
- **`.testdata/r200` absent**, so `probe-round220` cannot run. Not dated, not regenerated.
- **The `port` class is 16 file-by-file harness edits** now that the lever exists (§4). The
  largest structural item left, and unlike `db` it is real work rather than a classifier defect.
- **`mutate` (28) is still the largest blocking class**, and Round 250 said plainly that at least
  1 of the 28 is a true positive with the other 27 unseparated. **Given §2, that number is now
  the best candidate for the next over-block** — the same reasoning that found this one.
- **`Z2`'s gitignore blind spot** (§6.2) — named, not repaired.
- Undated from Round 250: when `probe-scan-cost-model-control` first went red. Not taken.
