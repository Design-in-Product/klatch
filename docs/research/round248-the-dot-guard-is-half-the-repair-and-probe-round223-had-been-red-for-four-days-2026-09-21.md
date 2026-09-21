# Round 248 — the dot-guard is half the repair, and `probe-round223` had been red for four days

**Theseus · 2026-09-21 (WORK fire) · probe:
`scripts/probe-round248-the-dot-guard-is-half-the-repair-and-a-copy-re-admits-the-original.mts`**

Round 247 §7 (Daedalus) routed two items to this seat. Both are closed. Taking the clean baseline
for the first one turned up a third thing that neither of us was looking for, and it is the
biggest of the three.

---

## 0 — Summary

| | |
|---|---|
| **Routed item 1** | `probe-round223:136`, the one unguarded `readdirSync` over `scripts/`. **Repaired and driven two-sided.** |
| **Routed item 2** | The no-mutation control on Round 246 §7's collateral reds. **Run. My reds were real; nothing is withdrawn.** |
| **But the control moved anyway** | Every population *measurement* shifted by one, by a mechanism the dot-guard does not cover and Daedalus's prescribed remedy does not reach. **Repaired in two files.** |
| **Unasked-for finding** | `probe-round223` has been **red at HEAD since 2026-09-17** on a hardcoded population total, eighteen lines BELOW the comment explaining why hardcoded totals are wrong (:141 comment, :159 pin). **Repaired as a floor, not bumped.** |

---

## 1 — Routed item 2 first, because it decided whether a published finding of mine had to be withdrawn

Daedalus's Round 247 §3 found that a mutation harness staging its working copies inside the tree
its subject enumerates changes the measurement it is auditing. He withdrew his own Round 245
"14 vs 13" nested-module finding over it, and asked whether my Round 246 §8 collateral reds
(M1 → arms A, H; M3 → arms F, H) were that class rather than genuine cross-arm coupling.

**Method**, matching how Round 246's capability runs actually staged: verbatim `cp` of the probe
to a dot-prefixed name inside `scripts/`, **zero mutation applied**, run the copy, diff the full
output against a clean run of the original.

**Answer: my reds were real.**

```
clean original       All 4 regression checks passed.    exit 0
verbatim dot-copy    All 4 regression checks passed.    exit 0
```

All four hard arms (A, C, F, H) PASS from either file, with identical verdicts. Nothing in the
harness moves an arm verdict, so M1 and M3's extra reds were the cross-arm coupling Round 246 §8
reported them as. **Nothing of Round 246 is withdrawn.** Its published figures — 21/126 · 19 · 39
pairs · 25 direct — all came from clean runs of the original, and Argus reproduced them
independently from a clean tree earlier the same day.

---

## 2 — THE FINDING: the dot-prefix guard is half the repair, and the half it misses is the tracked file

The control was not clean. Every population measurement moved by exactly one, in the same
direction:

| figure | clean | verbatim copy staged |
|---|---|---|
| recursive enumeration | 127 | **128** |
| one-level | 114 | **115** |
| emit-spelling namers | 21/127 | **21/128** |
| dependency-moved | 19/127 | **19/128** |
| corpus readers, direct | 25 | **26** |
| corpus readers, transitive | 28 | **29** |

**And the mechanism is not the one the dot-guard fixes.** `probe-round246` already carried the
guard, in both spellings, at `:180` and `:190`. The staged dot-copy is correctly invisible to the
walk. What was unguarded is the other side:

```ts
const SELF = path.basename(fileURLToPath(import.meta.url));           // :69
const walked = walkCode(SCRIPTS).filter((w) => path.basename(w.rel) !== SELF);   // :481
```

`SELF` names whichever file is **executing**. Run a copy and `SELF` becomes the copy's name, so
the **committed original stops being excluded and enters its own population**.

> **Rule — sharpening Round 247 §3: making the harness's copies invisible to the walk is half the
> repair. A probe that excludes itself by RUNTIME identity has no fixed population; executing it
> from anywhere but its own path silently re-admits the subject. The file that contaminates the
> measurement is not the staged artefact at all — it is the real, tracked, unmodified probe, which
> is exactly the file no dot-prefix guard can exclude.**

This matters for the remedy, not just the diagnosis. Round 247 §3 prescribes staging mutant
libraries **in a tmpdir outside every tree any probe enumerates**. That is right for his class and
**does not reach this one**: moving the copy out still leaves `SELF` pointing at the copy and the
original still un-excluded. The fix has to be at the *exclusion*, not at the *staging* —
a canonical constant, not `import.meta.url`.

As in Round 245, the mechanism was already in the file. `probe-round223:134` has been excluding
its two sibling controls by hardcoded name since it was written, one line below the `SELF` that
was not.

**Driven, two-sided** (arm B): with a canonical `SELF`, the original and a verbatim dot-copy report
the **same** population; with the defect reintroduced in place, the copy reports **+1**.

**Repaired in both files that had it:** `probe-round223:132`, `probe-round246:69`. Arm C's census
now sweeps `scripts/` for the class so the next instance is found by an instrument rather than by
accident.

Published Round 246 figures are unaffected — they came from clean runs of the original, where both
spellings agree.

---

## 3 — Routed item 1: the dot-guard at `probe-round223:136`

```ts
// before
const allMts = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts')).sort();
// after — the spelling probe-round240:123 has used since it was written
const allMts = fs.readdirSync(SCRIPTS).filter((f) => f.endsWith('.mts') && !f.startsWith('.')).sort();
```

The exposure is concrete and worse than a miscount. `probe-round223` classifies any `.mts` whose
source merely *contains* the shared module's basename, and then **drives** every classified member
against a live stranger on 3001. An unguarded read admits a staged dot-copy as a 29th subject that
is not a probe, and any red it produced would be attributed to a file nobody wrote.

**Driven, two-sided** (arm A), with `probe-round230` as the donor:

```
guard ON,  dot-copy staged      28 members
guard OFF, dot-copy staged      29 members     <- the defect
guard ON,  non-dot copy staged  29 members     <- the guard filters the PREFIX, not the file
```

Reported rather than asserted away: with the guard on, a staged dot-copy is invisible to the walk
but **still listed by `git ls-files --others`**, so `probe-round223`'s walk-vs-git agreement arm
legitimately sees a git-only entry while a harness copy is on disk. That arm is doing its job. The
disagreement is an artefact of staging and goes away with the copy.

---

## 4 — The thing nobody asked for: `probe-round223` was RED at HEAD, and had been for four days

The clean baseline exited **1**. `Round 223 — 110/111 checks · 35 measurements · 5 open · 1 failed`:

```
[A] the population is every importer on disk, not a number carried from a memo
    28 subjects = Daedalus's 21 (reproduced) + 2 folded in this round
    · 31 importers on disk including 3 controls
```

The arm asserted `migrated.length === 21 + 2`. There are 28.

**Eighteen lines above that assertion — `:141` against the pin's `:159` — the same file has always
carried the comment explaining why it is wrong:**

> *"A hardcoded total would have to be edited every round, which is how a check becomes a thing
> people update to match rather than a thing that tells them something."*

Round 247 §4's rule — *a lesson learned in one arm is not learned in the file* — in its sharpest
form yet: it was not learned in **the comment block that states it**, eighteen lines up the same
arm.

**Dated from git, not inferred** (arm E): every importer listed with its adding commit and sorted,
the 24th is `probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts`, added **2026-09-17** at
`8946cae3`. Arm A has been failing for **four days**. Today's baseline is the first run since.

**Why it went unnoticed is structural, not inattention.** `probe-round223` is not in `npm test`; it
costs ~15 minutes because it drives all 28 subjects against a live stranger; nothing schedules it.
Round 247 §6's control list names round224, round245 and round247 — round223 is not among them.

> **Rule: an expensive probe outside the suite is a probe whose red is discovered by accident. The
> cost of a check is part of whether it is a check at all.**

**Repaired as a floor, not bumped.** Editing `23` → `28` would have gone green and queued the
identical red for the 29th probe — precisely the failure the file's own comment names. The arm now
asserts the population **never shrinks** below what Round 223 established; the exact count is
demoted to the measurement it always was, alongside a MEAS for how far it has grown.

---

## 5 — Three faults in my own instrument, each caught by driving it

The round is about harnesses that mislead. Mine did, three times.

**(1) `child.kill()` killed the launcher, not the probe.** `spawn('npx', ['tsx', …])` makes `npx`
the child and `node` the grandchild. Killing the handle reaped `npx` and left the grandchild
**orphaned and running**: my "truncated" run went on to stage a live occupant on 3001. I found it
by connecting to the port while the round believed it had stopped. Fixed with `detached: true`
plus `process.kill(-pid)`.

That is `probe-round230-a-killed-probe-must-not-leave-its-server`'s subject, one level up, inside
the harness written to audit harnesses — and `probe-round230` is the donor this round copies.

> **Rule: killing a process you launched through a launcher kills the launcher. A harness that
> reports "I stopped it" has asserted on a handle, not on a process.**

**(2) The truncation was not asserted, so its failure was silent.** `runUntil` returns an output
string whether or not its marker matched, and the arms parse a number out of it either way. When
(1) made truncation fail, **no arm said anything**. Now a hard arm asserts `truncated` for all
three conditions.

**(3) Two arms went red at correct numbers.** A2/A3 additionally required the copy's *name* in the
output; `probe-round223` prints member names only for the `no-preflight` category and the donor is
a `refuses`. An assertion on output the subject never promised is a red that means nothing.
Predicate narrowed to the population count; the observation demoted to a MEAS.

**And the self-citation trap, third sighting** (mine in Round 246 §4, Daedalus's in Round 247 §4).
`probe-round223` classifies on a substring, so spelling the shared module's basename as a literal
enrolled *this probe* in the population it measures. Found in the git-dating output, listed as the
29th importer. Now built by concatenation, with an arm asserting the literal appears nowhere in
the file.

**A limitation, stated:** `finally`-based cleanup is not kill-proof. Aborting a run with SIGKILL
left a staged copy on disk; found by `git status`, removed by hand.

---

## 6 — Controls

- **`probe-round223` re-run in full after the repair: `111/111 checks · 36 measurements · 5 open ·
  0 failed`, exit 0.** This is the control the round turns on — the pre-repair baseline was exit 1,
  so "the pin is fixed" is worth only what a full green run says. The repaired arm reads
  `28 subjects on disk · floor 23`, with the growth (`23 → 28`, 5 probes) as its own MEAS. Its
  walk-vs-git arm also reports `81 walked · 81 known to git · walk-only [] · git-only []`, which
  independently confirms the concatenation fix: `probe-round248` is on disk and is **not** classified
  into the population it measures.
- `npm test` into a file, not a pipe: server **127 files · 2004 passed · 1 skipped**; client
  **38 files (25 passed, 13 skipped) · 324 passed · 13 skipped**. **Identical to Daedalus's Round
  247 §6** — the expected reading, since this round adds a probe and not a test, and checked rather
  than assumed.
- `npm run typecheck`: **0 `error TS`**. (Worth what Round 246 §7 established it is worth — the
  project checker does not reach top-level `scripts/*.mts`, which is why the standalone run below
  is the one that matters for the new file.)
- Standalone strict `tsc` over all three touched files: **0 errors**, output file 0 bytes. (The
  project checker does not reach top-level `scripts/*.mts` — Round 246 §7 drove that, and Round 247
  §6 confirmed the program lists 3 of 84.)
- Both in-place-mutated files verified byte-identical by **sha256** to where the probe found them,
  restored in `finally`.
- `packages/` untouched, checked at start and exit.
- Port **3001 quiet** at every checkpoint and at exit; no server staged by this probe; no orphan
  left. Separately spot-checked by hand after each aborted attempt.
- **0 model calls.** No read of `~/.claude/projects`.
- All staged copies counted out by `readdirSync`.

---

## 7 — Open

- **The 49 stale-in-code files remain graded and UNDRIVEN. Fourth round open, said plainly.**
- **Structural, and larger than this round:** `probe-round223` sat red for four days because it is
  expensive and unscheduled. It is not the only probe in that category. Nothing in this round fixes
  the class — it only demonstrates the cost once. Routed to Daedalus in the accompanying memo as a
  question about what belongs in `npm test` versus what needs a scheduled runner.
- **Parked on xian, unchanged:** `440fe16b-46f8-4fbb-9b0d-3285c425aa37`; `files/storage.ts:38`; the
  backfill dry run; `DELETE /entities/:id`.
