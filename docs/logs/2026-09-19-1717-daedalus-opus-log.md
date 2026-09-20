# Daedalus — 2026-09-19 STOP fire (Opus)

Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch `claude/daedalus-cycle`,
synced to `origin/main` at `f8f271af` by the wrapper.

---

## 17:17 — Briefing

- `git log` at arrival: `f8f271af` (Calliope 9/19 WORK/SWEEP rollup, v142). Three commits since my
  own 9/19 WORK fire (`21579f81`), none mine.
- `docs/COORDINATION.md` read; my section is current as of my 13:17 WORK fire.
- Mail: one memo addressed to me since my last fire —
  `theseus-to-daedalus-…-all-five-are-red-and-one-of-them-was-disabled-by-the-lever-it-was-waiting-for-2026-09-19.md`
  (Round 236). Read in full.

**What Round 236 asks of this seat.** Nothing routed by name. Its §7 "Open" list assigns the union
arm and arm O to Theseus, parks four items on xian, and reports the gate refused. What it *does*
leave is a rule, stated as a finding:

> A workaround is dead code the moment the thing it works around exists — but it doesn't announce
> that, it announces a failed match. A guard that degrades to a skip renders "this feature shipped"
> and "this arm is missing" indistinguishable in the output.

His case was arms C and E of `probe-browse-endpoint-second-corpus`, which patched the scanner's
source literal because "Daedalus routed `CLAUDE_CONFIG_DIR` support to his own seat and did not
build it" — a sentence that was true for two hours and thirty-four minutes on 2026-09-04, after
which `round149` both built the lever and deleted the literal. The arms skipped for fifteen days.

So this seat's question is: **where else is a probe working around a lever that does not exist, and
which of those levers are mine to build?**

## 17:20 — The inventory, and what it found

Searched `scripts/` for probes that *write* into `packages/server/src` (not merely read it —
reading source to derive an assertion is a different and healthier class, and
`scripts/lib/probe-source-constants.mts` already hardens it).

Six probes write to `session-scanner.ts`. Four of them are patching the same constant:

| probe | what it patches |
|---|---|
| `probe-browse-cold-figure-gap` | `FINGERPRINT_LINE_CAP` → `1_500` |
| `probe-pm-corpus-cap-delta` | `FINGERPRINT_LINE_CAP` → `1_500` |
| `probe-browse-latency-end-to-end` | `FINGERPRINT_LINE_CAP` |
| `probe-round227-arm-o-…` | `FINGERPRINT_LINE_CAP` → `Number.MAX_SAFE_INTEGER` |

(The other two — `probe-fingerprint-cache-endpoint`, `probe-browse-endpoint-vs-channel-count` —
patch the cache hoist, a different counterfactual, out of scope here.)

**Verified from source, not inferred:** `extractSessionFingerprint(filePath, lineCap)` and
`getSessionFingerprint(filePath, stat, lineCap)` have always taken a cap — that is enough for a
*test*, which imports the function. `routes/import.ts` calls the scan with no cap, and nothing
between `fetch` and `getSessionFingerprint` carries one. So a probe measuring the cap **at the
endpoint** had no seam, and rewriting shipped source on disk was the only thing available.

Three costs, the third being Theseus's: it is a write into `packages/` from a measurement script
(a crash between patch and restore leaves the repo modified); it matches a *spelling* of the
declaration, which already moved once (`50000` → `50_000`, 2026-09-04 — the reason
`probe-source-constants.mts` exists); and every one of those patches is guarded by a **skip**.

## 17:22 — Round 237: `KLATCH_FINGERPRINT_LINE_CAP` built

`packages/server/src/import/session-scanner.ts` gains `resolveFingerprintLineCap()`; the two
`lineCap` default parameters now call it instead of naming the constant.

Design decisions, each with the reason it was decided that way:

- **Read per call**, not captured at module load — same reason as `getExportRoot()` (Round 235): a
  probe sets the variable when it spawns the server, and a cached read makes the lever silently
  inert depending on import order.
- **An explicit argument still wins.** The variable moves the *default*. The three latency probes
  that pass a cap are measuring the cap they passed; a variable reaching past them would confound
  exactly the measurement this lever exists to serve.
- **Invalid values throw; they never fall back.** A lever that quietly ignores what it was set to is
  worse than no lever — the probe measures 50_000 and writes down 1_500. Verified by reading the
  call chain that the throw is not swallowed: `getSessionFingerprint` is called *outside* the
  per-file `try/catch` (that one wraps `statSync` only), so it reaches the route's handler and
  surfaces as a 500 whose `detail` names the variable.
- **Every spelling of a number is the same number** — `_` stripped, so `1_500` (the spelling the
  constant itself uses, and therefore the one a probe author copies) works alongside `1500`,
  `1.5e3`, `0x5DC`. `1.5`, `0`, `-5`, `abc` and `50_000 lines` throw.
- **No separate "uncapped" keyword.** `Number.MAX_SAFE_INTEGER` is spellable, and a second value
  space is a second thing to get wrong.

**The cache needed no change, and that is worth stating rather than assuming.** `fingerprintCache`
is keyed on `(path, mtime, size, lineCap)` — read at `session-scanner.ts:516` — so moving the cap
misses the cache by construction. A test pins it, because if that key ever loses `lineCap` a probe
measuring two caps in one process would get the first one twice.

## 17:23 — Tests, and the red capability

`packages/server/src/__tests__/round237-the-fingerprint-cap-takes-an-override.test.ts` — **18 tests,
all passing.**

**Red capability established, and the shape of the red is itself the finding.** Left the resolver
in place and unwired the two default parameters back to `FINGERPRINT_LINE_CAP` — i.e. the lever
built but not connected, which is the realistic failure, not a deleted function. Result: **4 of 18
fail**. The four are exactly the ones that assert the override reaches *behaviour* (fingerprint
capped, cache miss, endpoint payload, 500 on misconfiguration). **Thirteen resolver tests could not
tell a wired lever from an inert one.** Restored and re-verified 18/18.

That is Round 235's lesson arriving from a third direction: a property nothing asserts *at the wire*
is one you learn about from somewhere else.

## 17:24 — The workaround retired, in the probe that is mine

`scripts/probe-browse-cold-figure-gap.mts` (last touched by this seat 9/16, not in Theseus's
Round 236 set — no collision) converted:

- Arm C no longer writes `session-scanner.ts`. It sets `KLATCH_FINGERPRINT_LINE_CAP` on the
  environment of the server it spawns. The patch, the restore, the `process.on('exit')` restore
  hook and the `finally` are gone.
- `restoreScanner()` (which *wrote*) became `scannerUnchanged()` (which only reads), and the `[C]`
  check now asserts the positive claim: the scanner was never written to.
- `CAP_SHIPPED_VALUE` is no longer the hardcoded `50_000` — it is read from source via
  `readNumericConstant`, the reader built for exactly the reformatting that broke two probes on
  2026-09-04.
- **Both skip paths deleted, and the skip helper with them.** Arm C could not run if the literal did
  not match; arms E and F were guarded on "did arm C run". None of those conditions can arise now.
  A skip helper kept for a case that cannot occur is the same stale guard in miniature — the next
  reader would take "0 skipped" as evidence something was checked.
- **Arm E deliberately unchanged.** "The variable was set" is exactly as weak a claim as "the file
  was patched" — both are statements about the apparatus. The capped-session count is what proves
  the server ran the cap we asked for.

**Also found while in there, and it is the sixth probe in Theseus's class.** This probe was written
before the Round 234 export-scan fix, so its arm A walks `~/.claude/projects` on disk and then
asserts the endpoint returns that many sessions — a count the repo's 3.86 MB export now joins.
Fixed with `KLATCH_EXPORT_ROOT` (Round 235), and asserted two independent ways in every arm
(`isExported` count and `'Exported sessions'` group count), not assumed.

## 17:33 — The probe driven, and what it measured

`npx tsx scripts/probe-browse-cold-figure-gap.mts` — **31 checks (17 regression, 14 measurement),
0 failed, 0 skipped, exit 0.**

The lever works at the wire, and arm E proves it by effect rather than by apparatus:

```
PASS [C] cap-1500: cache-cold browse @ cap 1500 — 1872 ms
PASS [C] the scanner was never written to — sha256 5a015eac3508 unchanged
PASS [E] overridden cap DOES bite — proves the server ran cap 1500 — 12 of 536 sessions capped
PASS [E] capped count matches the files that exceed the cap — 12 capped vs 12 files over 1500 lines
PASS [*] scanner byte-identical to how it was found — sha256 5a015eac3508
```

Export isolation held in all three server generations: `0 isExported sessions, 0 'Exported
sessions' groups`, and `536 sessions` returned against `536 files on disk`.

### The measurement: both historical figures scale with corpus bytes

Two arms came back as NOTEs, ~27% above the numbers Round 153 was built to reconcile. That is not
drift — the corpus grew.

| | Round 147/148 | now | ratio |
|---|---|---|---|
| corpus | 516 files / 531.2 MB | 536 files / 667.0 MB | **1.256x by bytes** |
| cold browse @ cap 50_000 | 2164 ms (R148) | **2780 / 2768 ms** | 1.28x |
| cold browse @ cap 1_500 | 1477 ms (R147) | **1872 ms** | 1.27x |

`2164 x 1.256 = 2718` against a measured 2780 (2.3% off). `1477 x 1.256 = 1855` against a measured
1872 (0.9% off). **Cold browse is linear in corpus bytes across a 25.6% growth, at both caps**, and
Round 153's reconciliation survives the corpus it was measured on being replaced.

The cap's cost at the endpoint is now **902 ms** (mean of both shipped-cap arms minus arm C), up
from the 645 ms Round 143 priced in isolation on a smaller corpus, and it buys 1255 turns of exact
signal — 60.1% of this corpus's turn total. Steady state is **12 ms either way**: the cap is a
cold-start cost only.

### Corroborates this morning's §3 without being aimed at it

`PASS [A] files the 1500-line cap would bite — 12 of 536 files exceed 1500 lines; **0 exceed
50000**`. The shipped root has nothing near the cap. The one file that does — 53,635 lines — is in
`~/.claude-pm/`, which is what my 13:17 fire concluded and what Theseus's Round 236 §4 confirmed
from two further directions. A third, independent reading, from a probe that was not asking.

### One number I am not explaining

Theseus measured `539 / 16 projects` at the wire this morning; I measure `536 / 16`. Candidates:
live corpus growth between fires, or his run counting the export group. **I did not verify which,
and I am not claiming either.** It does not touch anything above — every count in this probe is
internally consistent (536 on disk, 536 at the wire, 12 over cap on disk, 12 capped at the wire).
