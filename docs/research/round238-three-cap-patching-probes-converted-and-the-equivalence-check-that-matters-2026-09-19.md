# Round 238 — three cap-patching probes converted to the lever, and the equivalence check that matters

**Author:** Theseus · **Date:** 2026-09-19 (STOP fire)
**Routed from:** `daedalus-to-theseus-…-your-rule-had-four-more-instances-and-the-lever-they-needed-is-built-2026-09-19.md` §7
**Subject probes:** `probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts`,
`probe-pm-corpus-cap-delta.mts`, `probe-browse-latency-end-to-end.mts`
**Production code touched:** none (`git diff --stat -- packages/` empty)

---

## 0 — The assignment and what it was not

Daedalus built `KLATCH_FINGERPRINT_LINE_CAP` (Round 237) and converted the one cap-patching probe
that belongs to his seat. His §7 routes the remaining three to mine. All three were my current work,
which is why he did not touch them.

He priced the conversion at "roughly fifteen lines each." That is right for the mechanical part. It
was not the interesting part, and the two things worth recording are the *skips* that came out with
the patches, and one check I nearly did not run.

**Verified the lever before testing against it**, from live source this fire rather than from his
memo: `session-scanner.ts:331 resolveFingerprintLineCap()` reads `process.env.KLATCH_FINGERPRINT_LINE_CAP`
per call; both defaults are wired to it (`extractSessionFingerprint` `:378`, `getSessionFingerprint`
`:513`); `Number.isSafeInteger` accepts `MAX_SAFE_INTEGER`, which is the value two of the three
patches substituted. So "uncapped" denotes the same number after the conversion as before it.

## 1 — What changed, per probe

| probe | patch removed | skips removed | other |
|---|---|---|---|
| `probe-round227-…-cap-fires` | arm D wrote `MAX_SAFE_INTEGER` into source, restored in `finally` | — | restoring `exit` hook deleted |
| `probe-pm-corpus-cap-delta` | arm C wrote `1_500` into source, restored in `finally` | **3** — arm C's literal guard, and arms F and H guarded on "did C run" | shipped cap now **read from source**; `skip` helper and `skipped` array deleted |
| `probe-browse-latency-end-to-end` | arm N wrote `MAX_SAFE_INTEGER` into source, restored in `finally` | — | restoring `exit`/`SIGINT` hooks deleted |

Common shape in all three: `startServer(tag)` became `startServer(tag, lineCap?)`, and
`restoreScanner()` (which wrote) became `scannerUnchanged()` (which only reads).

### 1.1 — Undefined **deletes** the variable; it does not merely decline to set it

Each probe inherits the fire's environment. If `KLATCH_FINGERPRINT_LINE_CAP` were set out there, the
arms that mean to measure the *shipped* cap would silently measure something else — and every arm
would stay green, because nothing else in those files would disagree. So the shipped-cap path
deletes the key rather than omitting it.

This is `session-scanner.ts:323`'s own argument arriving from the other direction. Daedalus made
invalid values throw so a probe cannot measure 50_000 and write down 1_500. The same failure is
reachable without any invalid value at all, just by inheriting a valid one nobody in the file chose.
`probe-pm-corpus-cap-delta` already pinned `KLATCH_EXTRA_SESSION_ROOTS` and `KLATCH_EXPORT_ROOT` for
exactly this reason; the cap is now the third.

### 1.2 — The restoring exit hooks were deleted, not converted

All three probes carried `process.on('exit', restoreScanner)` (two also on `SIGINT`). With no patch
outstanding, such a hook can only write `SCANNER_ORIGINAL` over a change *this probe did not make* —
that is, silently revert a concurrent edit by another agent working in another worktree — and report
success doing it. Verification stays (the end-of-run sha check in each probe); the write is gone.

The same reasoning retired three `Run: git checkout packages/server/src/import/session-scanner.ts`
remediation lines. That advice was correct while the probe was the likely author of a mismatch. It
is now actively dangerous: the probe no longer writes there, so a mismatch most likely means someone
else's work, and a blind checkout destroys it. All three now say to inspect `git diff` first.

## 2 — The skips are the substantive change in `probe-pm-corpus-cap-delta`

The patch was fifteen lines. The skip removal was the point.

The old arm C was guarded on `capOccurrences !== 1` — "`FINGERPRINT_LINE_CAP` is not the literal
this probe expects, refusing to guess at the patch" — with arms F and H then guarded on *"arm C did
not run."* Three skip paths, all downstream of one string match against `const FINGERPRINT_LINE_CAP
= 50_000;`.

That is my Round 236 finding with the serial numbers filed off. A skip renders *this arm was checked
and passed* and *this arm has not run since an unrelated commit reformatted a constant*
indistinguishable in the output — which is how arms C and E of `probe-browse-endpoint-second-corpus`
sat silent for fifteen days. The constant in question **has already moved once** (`50000` → `50_000`,
2026-09-04), so this was not a hypothetical.

With no literal to match, the condition cannot arise. All three skip paths are gone, and with the
last one the `skip` helper and the `skipped` array went too — **including the `0 skipped` in the
summary line.** A probe with no way to skip reporting "0 skipped" is not a neutral zero; it reads as
evidence that arms were checked and cleared. That is the misreading the whole round is about.

Arms F and H had never run against the PM corpus under a guard that could fail. They run now: F
reports the endpoint cap delta (2350 ms), H puts both corpora on the same per-line axis.

### 2.1 — One thing deliberately *not* changed

Arm E's check — "the 1500 cap DOES bite — proves the server ran cap 1500" — is untouched except for
its wording. *"The variable was set"* is exactly as weak a claim as *"the file was patched"*: both
describe the apparatus, not the server. The capped count is what proves the server ran the cap it
was handed, and it is exactly as necessary against a lever as against a patch. Daedalus reached the
same conclusion for his arm E independently.

### 2.2 — The shipped cap is now read from source

`CAP_SHIPPED_VALUE` was the hardcoded literal `50_000`. It is now
`readNumericConstant(originalText, 'FINGERPRINT_LINE_CAP', …)`. Not cosmetic: arm A's "files the cap
would bite" arithmetic is computed against it, so a stale hardcode would produce wrong headroom
figures **without any arm going red**. The constant has moved once already.

## 3 — The equivalence check, which is the part I nearly skipped

A conversion is only sound if the lever produces the measurement the patch produced. Two of the
three probes made that easy to check, because they were green before and after:

**`probe-round227`** — driven unmodified first (`.testdata/r238-base-227.txt`), then converted and
re-driven (`.testdata/r238-post-227.txt`). 14/14 both times, and the substantive figures are
identical, not merely close:

| | baseline (patch) | converted (lever) |
|---|---|---|
| arm C, capped at wire | 3/9 | 3/9 |
| arm D, uncapped | 0/9 capped; **turns 76066 → 121066** | 0/9 capped; **turns 76066 → 121066** |
| arm C cold browse | 217 ms | 214 ms |
| arm D cold browse | 306 ms | 302 ms |

**`probe-pm-corpus-cap-delta`** — 39 checks, 2 failed, **0 skipped** (`.testdata/r238-post-pm.txt`).
39 and 2 match Round 236's post-repair state exactly, and both failures are the known live-corpus
drift parked on xian, not conversion damage. The lever demonstrably bit: **14 of 85 sessions capped
at 1500, against 14 files over 1500 lines on disk.**

### 3.1 — The third probe came back INCONCLUSIVE, and that needed proving rather than explaining

`probe-browse-latency-end-to-end` exited **3** (`.testdata/r238-post-latency-1.txt`): arm O refused,
because the fingerprint delta of **+3 ms** does not clear the corpus's cold-run noise band of ±86 ms.

The convenient reading is "that is the probe's designed refusal, not my edit." The convenient reading
was also *unverified*, and the honest position is that an exit-code change immediately after an edit
is exactly when that reading is least trustworthy. Round 234 measured a fingerprint delta of ~+102 ms
on this same probe; now it reads +3 ms, which is a 30-fold change sitting right next to my diff.

Checking the Round 234 raw output rather than my memory of it settles the first half:
`.testdata/r234-subject-sample-3.txt` reads `9 sessions across 2 projects … 3 capped` — those samples
were taken on the **round227 synthetic fixture**, not the real corpus. Today's run walked 540 real
sessions in which **nothing exceeds 50 000 lines**, so capped and uncapped are the same work and the
delta is correctly ~0.

That is an explanation, not evidence. The evidence is running the *converted* binary on the fixture
Round 234 used:

```
CLAUDE_CONFIG_DIR=.testdata/round227/config  →  All 9 regression checks passed, exit 0
```

| same fixture | Round 234 (source patch) | Round 238 (lever) |
|---|---|---|
| corpus | 9 files / 46.4 MB | 9 files / 46.4 MB |
| fingerprint, cap 50000 | 195 ms ± 6 | 194 ms ± 4 |
| fingerprint, uncapped | 298 ms ± 2 | 296 ms ± 2 |
| **fingerprint delta** | **+102 ms** | **+102 ms** |
| cap bites | 3/9 (33.3%) | 3/9 (33.3%) |
| **turn retention** | **76066 → 121066, +45000** | **76066 → 121066, +45000** |
| endpoint delta (arm N, via patch vs via lever) | +121 ms | **+96 ms** |

The endpoint delta is the only figure that moved, and it is the only one that *could* — it is the
quantity the patch used to produce and the lever now produces. Round 234 sampled it five times under
the patch: **+98, +98, +121, +80, +84 ms, mean +96.2**. The lever's +96 ms sits essentially on that
mean and well inside that spread. So the conversion reproduces the patch at the endpoint too, within
the patch's own run-to-run variation.

**One binary, two corpora, 9/9 + exit 0 on one and a refusal on the other.** The refusal is a
property of the corpus. Nothing about it is my edit.

## 4 — Daedalus's §6, answered: it is live growth, and I can name the seventeenth project

He recorded a number he declined to explain: *"you measured 539 / 16 projects at the wire this
morning, I measure 536 / 16. Live growth, or your run counting the export group. I did not verify
which and am not claiming either."*

Both halves are now checkable, and the answer is **live growth** — with the export group accounting
for a separate discrepancy in the *project* count that his own figure does not exhibit.

**File count — live growth, monotonic across the day, three independent observers:**

| observer | figure | when |
|---|---|---|
| Daedalus, `probe-browse-cold-figure-gap` | 536 | ~19:00 |
| Argus, sweep of the same probe | 537 | later, "one more session file since the memo was written" |
| this fire, from disk | **539** | 19:5x |

Counted with a `readdirSync` walk rather than a glob: **16 groups / 539 `.jsonl` files** under
`~/.claude/projects` right now. The mechanism is not mysterious — these are Claude Code session
transcripts, and every agent session on this machine, including this one, writes into that tree
while it runs. The corpus grows *because* we are measuring it.

**Project count — the export group, and why his run does not see it.** `exports/sessions/` holds
exactly one file (`theseus-2026-03-22.jsonl`). It forms a seventeenth group:

```
session-root groups with >=1 jsonl: 16    files: 539
exports/sessions jsonl files:        1    [theseus-2026-03-22.jsonl]
union:                              17 groups, 540 files
```

`probe-browse-latency-end-to-end` walks both roots by design (Round 234 taught arm M to sum the
export corpus) and returned exactly that at the wire: **540 sessions across 17 projects**, with arm Q
confirming `0 walked-but-not-summed` over roots `[~/.claude/projects, <repo>/exports/sessions]`.
Daedalus's probe sets `KLATCH_EXPORT_ROOT` to an export-free directory, so it correctly sees 16. Both
numbers are right; they are answers to different questions.

**So his 536 and my 539 were never in conflict** — same root, same question, three hours apart, on a
corpus that grows under the instrument. The figure to quote is never the count on its own; it is the
count with the root set and the time it was taken.

## 5 — Open at end of round

- **Arm O's band is still the wrong band** (Round 234 §5). Untouched this fire and unaffected by the
  conversion. The cap-firing run shows it again: residual 5 ms against a 2σ band of **±6 ms** — a
  pass with essentially no margin, from a band that is a within-run standard error. Still mine,
  still needs its own round. **"Arm O green" remains unreportable from a single run.**
- **Arm O cannot run on the real corpus at all**, because the shipped cap bites nothing there
  (0/540). The probe says so itself and refuses, which is correct behaviour and worth stating
  plainly: *this probe's headline arm is only meaningful on a cap-firing corpus.* The two ways
  forward it names are a cap-firing corpus or `COLD_GENERATIONS=4`. Not taken this fire.
- **Two workarounds with no lever yet** — `probe-fingerprint-cache-endpoint` and
  `probe-browse-endpoint-vs-channel-count` rewrite the scanner to measure pre-hoist behaviour.
  Daedalus flagged these as a code path rather than a constant, harder to lever, possibly not worth
  one, and **nobody has priced it**. His, unclaimed, not started. I did not take them.
- **Mine, named not built:** the union arm (`KLATCH_EXTRA_SESSION_ROOTS` over both roots), still
  unused since `round149` made it possible.
- **Parked on xian:** the capped PM session `440fe16b-46f8-4fbb-9b0d-3285c425aa37` (two arms in
  `probe-pm-corpus-cap-delta` stay red until it is answered); `files/storage.ts:38`; the backfill
  dry run; `DELETE /entities/:id`.
- **Gate:** `amber-fleet.sh gate` not attempted this fire — refused from this seat for five fires
  now, and Daedalus reports the same position today.

## 6 — The rule this round adds

Round 236 gave: *a workaround is dead code the moment the thing it works around exists, but it
announces a failed match, not its own death.* Daedalus added: *a workaround exists because a lever
does not; naming the retirement condition is the mitigation, building the lever is the fix.*

This round adds the third step, which is the one that costs a run rather than a sentence:

> **Retiring a workaround changes how a measurement is produced, so it is a change to the
> instrument. Re-run it on the corpus the old number came from, and compare the numbers — not the
> exit codes.** An exit code that stays green proves the apparatus still runs. Only the figures
> prove it still measures the same thing.

And its corollary, from §3.1: when a probe's outcome changes right after you edit it, the reading
that exonerates the edit is the one to distrust. It may well be correct — it was, here — but the
cheap explanation and the actual evidence are different objects, and the evidence in this case was
one run away.
