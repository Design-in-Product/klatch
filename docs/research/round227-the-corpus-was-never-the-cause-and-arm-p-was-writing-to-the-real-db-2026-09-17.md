# Round 227 — the corpus was never the cause, and arm P was writing to the real database

**Theseus, 2026-09-17 (STOP fire).**
Probe: `scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts` — **14/14 checks · 7 measurements · 0 failed**, reproduced three times.
Repairs landed in: `scripts/probe-browse-latency-end-to-end.mts`.
Assignment: Daedalus's Round 224 §4 handoff, re-assigned in his Round 226 memo — *"take (a), `browse-latency` arm O on a corpus where the cap fires."*

---

## Summary

1. **Arm O's vacuity was not the corpus.** Driven on a corpus where the cap fires as hard as it can — 3 of 8 files capped, turns 76,000 → 121,000, fingerprint delta +93 ms — arm O's arithmetic came out **6300.8% off**, far *worse* than the 65.5% it recorded on `~/.claude/projects` where the cap fires on nothing. The prescribed repair would have been aimed at the wrong line.
2. **The cause is that arm O was fed the warm median.** The fingerprint cache is process-lifetime and per-process, so sample 0 pays the fingerprinting and samples 1–4 are cache hits. Arm O decomposed `browse = fingerprint + remainder` using a browse number that by construction contains **zero** fingerprint work — and got a negative remainder, on every run, for two weeks.
3. **Fed the cold sample instead, the same arithmetic on the same run comes out 1.6% off.** Arm O repaired; it now passes on both corpora and reports the warm path separately as the steady state the cache bought.
4. **Found while comparing two runs: arm P of the same probe has been writing into the worktree's real `klatch.db` since 2026-09-03.** 6000 synthetic channels against 2 real ones. Its guard — `DB.includes('.testdata')` — asserts a property of a string literal and cannot fail. Cleaned up, mechanism driven by a control, guard rewritten to interrogate the open handle.

---

## 1 — What was asked, and what the two explanations predicted

Arm O went red the first time `probe-browse-latency-end-to-end` ran in thirteen days:

```
FAIL [O] endpoint delta matches the fingerprint delta
         predicted 5 ms vs measured 14 ms (65.5% off);
         endpoint moved ±1 ms for a fingerprint delta of ±10 ms
```

Daedalus's read, which he deliberately declined to act on:

> the check is vacuous on this corpus, and the fix is not a tolerance. Arm M measured the cap firing on **0/536** files and turns retained **100%** — so the "uncapped" counterfactual is byte-identical work to the capped one, the true delta is ~0 by construction […] It needs a corpus where the cap fires.

He is right that the tolerance is the wrong knob, and right to refuse to turn it. But before building the corpus I read `session-scanner.ts:395-471` and found a second explanation that predicts the same red:

**The fingerprint cache is process-lifetime, in-memory, keyed on `(path, mtimeMs, sizeBytes, lineCap)`.** `timeBrowse` runs all five samples against one freshly spawned server. So sample 0 populates the cache and samples 1–4 are hits. Arm O used `median(samples.slice(1))` — the warm median — which is the browse path *with the fingerprint work already elided*.

The two explanations are indistinguishable on `~/.claude/projects`. They diverge on a corpus where the cap bites:

| | predicts arm O on a cap-firing corpus |
|---|---|
| "the corpus" | **passes** — the counterfactual is finally real |
| "the cache" | **fails harder** — a bigger fingerprint delta against a warm number that cannot move |

That divergence is what Round 227 drives.

## 2 — The corpus

No corpus on this machine fires the 50,000-line cap; that is the finding behind the cap decision itself (Round 148: `~/.claude-pm` tops out at 40,397 lines). So it is built: **3 files × 80,000 lines** against a cap of 50,000 — 37.5% of each big file unread — plus 5 × 400-line files as a negative control.

The root is moved with `CLAUDE_CONFIG_DIR` (replace semantics, `session-scanner.ts:146-153`), **not** `KLATCH_EXTRA_SESSION_ROOTS` (additive), which would have dragged the real 536-file corpus into every sample and buried a 93 ms signal under 2.6 s of unrelated fingerprinting.

"A corpus where the cap fires" is graded on **turn counts, not milliseconds** — a cap that only costs time is not a cap that bites:

```
PASS [A] the cap fires on this corpus and only where it should
         3/3 big files capped, 0/5 small files capped
PASS [A] the cap changes the answer, not only the cost
         turns 76000 → 121000 uncapped (62.8% retained, +45000 recovered)
         — contrast ~/.claude/projects, 1987 → 1987, 100% retained
PASS [C] the cap fires AT THE WIRE, not only in a unit call
         fingerprintCapped on 3/8 sessions
```

## 3 — The answer

Run 3 of 3 (all three agree; run-to-run figures in §6):

```
PASS [B] fingerprint sum at cap vs uncapped — cap 172 ms, uncapped 265 ms, delta +93 ms
PASS [C] capped browse, per sample   — cold 200 ms, warm median 2 ms — [200, 2, 2, 2, 2]
PASS [D] uncapped browse, per sample — cold 288 ms, warm median 3 ms — [288, 3, 4, 3, 2]
```

The per-sample lists are the whole story: **200 → 2 ms** and **288 → 3 ms**. All the fingerprint work is in sample 0.

Arm O's own arithmetic, both ways, on the same run:

| fed | predicted | measured | off by |
|---|---|---|---|
| **warm median** (what shipped) | 94 ms | 3 ms | **3086.8%** |
| **cold sample** | 292 ms | 288 ms | **1.6%** |

And the decomposition it was built to print:

```
warm: browse 2 ms   = fingerprint 172 ms (10094.0%) + remainder −170 ms (−9994.0%)
cold: browse 200 ms = fingerprint 172 ms (86.2%)    + remainder 28 ms (13.8%)
```

**A remainder below zero is the decomposition reporting that it does not hold.** It printed that on every run since 2026-09-03, as a `PASS`, because the line was hardcoded `pass: true`.

The discriminator, stated as its own two-sided check rather than left as an inference:

```
PASS [G] the WARM endpoint contains no fingerprint work
         removing the cap moved warm browse by 1 ms against a fingerprint delta of 93 ms (1.4% of it)
PASS [G] the COLD endpoint does contain it
         removing the cap moved cold browse by 88 ms against a fingerprint delta of 93 ms (4.9% apart)
```

**The corpus was never the cause.** On the corpus Daedalus said arm O needed, the warm form is worse than it was on the corpus he said was the problem.

## 4 — The repair, and why cold is right on the merits and not just on the arithmetic

`probe-browse-latency-end-to-end` arm O now uses `samples[0]` for the decomposition, and reports the warm pair as a separate measurement.

Cold is the correct sample independently of which number makes the check pass. The figure this probe exists to audit is the one xian was asked to rule on — *"browse goes 1.39 s → 2.03 s on a 506-session corpus"* — and that is a **first-visit** number. The warm median is the steady state the fingerprint cache bought (Daedalus, 2026-09-04, `1430 ms → 7 ms`); it is real, it is worth reporting, and it is the one thing that must not be fed to a decomposition of the work the cache elides.

On the real corpus, arm O now reads sensibly for the first time:

```
PASS [O] fingerprinting is attributed at the surface it is described at
         cold browse 2936 ms = fingerprint 2622 ms (89%) + remainder 314 ms (11%)
```

which is the answer to the Round 144 question the probe was built for: **fingerprinting is ~89% of a cold browse**, so Daedalus's original framing to xian was sound. Arm O had that answer available for two weeks and printed `18167%` instead.

**One line of output also changed sign.** Every delta was written `+${ms(x)}`, which renders a negative move as `+-213 ms` — and the real corpus produced exactly that: the uncapped cold browse came out 213 ms *faster* than the capped one. `+-213 ms` is one glance from `+213 ms`, the opposite claim. Deltas now carry their own sign.

## 5 — What I am NOT claiming, and the item still open for Daedalus

**Arm O's 20% band on a corpus where the cap does not fire is still a noise test, and I have not fixed that.** Three cold-vs-cold readings on `~/.claude/projects`, where the true delta is ~0:

| run | cold delta | arm O off by |
|---|---|---|
| 1 | −213 ms | 7.3% |
| 2 | −3 ms | 0.7% |
| 3 | −476 ms | **16.9%** |

Run 3 passed with 3.1 points of margin. **Daedalus's skip proposal is still needed** — but the condition should be on the *fingerprint delta being distinguishable from cold-run variance*, not on `capped` being false, and the probe currently takes **one cold sample per server generation**, so it has no variance estimate to test against. That is a design decision on his taxonomy and it stays his. Named, undone, and reported with the three numbers that size it.

## 6 — Reproducibility

Three runs, all 14/14 · 0 failed. Stable across runs:

| | run 1 | run 2 | run 3 |
|---|---|---|---|
| fingerprint delta | +94 ms | +93 ms | +93 ms |
| warm form, off by | 6304.7% | 6300.8% | 3086.8% |
| cold form, off by | **1.0%** | **1.7%** | **1.6%** |
| turns capped → uncapped | 76000 → 121000 | 76000 → 121000 | 76000 → 121000 |

---

# THE OTHER FINDING — arm P has been writing to the real `klatch.db` since 2026-09-03

This was not on the assignment. It surfaced from comparing two runs of the probe I was repairing.

## 7 — The symptom: a number that moved with the machine

Two consecutive runs of `probe-browse-latency-end-to-end`, same code, same commit:

```
run 1:  0 channels → 397 µs each ... 2000 channels → 779 µs each
run 2:  0 channels → 782 µs each ... 2000 channels → 1144 µs each
```

The x-axis is a lie. The "0 channels" row was measured against a table that already held 2002 rows, then 4002. Daedalus published **22 µs at 0 channels → 436 µs at 2000** this morning from a clean worktree; mine disagreed by 18× on the same line.

This is the same class as the `dist/` double-count he flagged at Argus this morning: a number that changes with the state of the machine and reddens nothing.

## 8 — The mechanism, driven rather than read

`db/index.ts:24` resolves the database path in a **module-level `const`, at load time**:

```ts
const DB_PATH = process.env.KLATCH_DB
  ? path.resolve(process.env.KLATCH_DB)
  : path.join(findProjectRoot(__dirname), 'klatch.db');
```

Arm P set `process.env.KLATCH_DB` immediately before its own `getDb()`. But arm M — 190 lines earlier — dynamically imports `session-scanner.ts` to drive `extractSessionFingerprint`, and `session-scanner.ts:5` imports `../db/queries.js`. By arm P, `db/index.ts` was long since loaded and `DB_PATH` already computed. **The assignment was a no-op against a constant.** Every row arm P seeded went to `findProjectRoot(__dirname)/klatch.db` — the worktree's live database.

Arm H drives this rather than asserting it, with two children differing only in *when* the variable is set. Both are pinned to scratch paths in their spawn env, because a control for a data-loss bug must not be able to cause one:

```
PASS [H] a KLATCH_DB assignment made after the import is a no-op
         child set KLATCH_DB to h-assigned.db after importing db/index.ts;
         getDb() opened h-load-time.db — the value present at MODULE LOAD
PASS [H] the same assignment made before the import is honoured
         child set KLATCH_DB to h-early.db before importing db/index.ts;
         getDb() opened h-early.db — so the ordering is the whole mechanism
PASS [H] the repo klatch.db is not what either child opened
```

## 9 — The guard that could not fail

```ts
check('P', 'scratch DB used, not the repo klatch.db', DB.includes('.testdata'),
      `${cleanDb.c} channels in ${path.relative(REPO, DB)}`);
```

`DB` is a string literal built at the top of the file. `DB.includes('.testdata')` is true on every run that will ever happen. Worse, the **detail line printed the path the probe intended to open, next to a count read from a different database** — so the output actively corroborated the false claim.

It passed on every run for fourteen days while the thing it names was false.

> **A guard on the variable that names the target is not a guard on the handle that was opened.**

Sibling to Round 223's *a probe that skips its way to zero checks reports success* and Round 225's *a citation is not a call*. In all three, a check reads something that resembles the thing it means to check. Rewritten to ask the connection where it actually is — `better-sqlite3` exposes the opened filename as `db.name`, which cannot be satisfied by an assignment that no-opped:

```
PASS [P] the OPEN HANDLE is the scratch DB, not the repo klatch.db
         getDb() opened .testdata/browse-latency-e2e/scratch.db
         (want .testdata/browse-latency-e2e/scratch.db); 2001 channels in it
```

## 10 — The damage, and the cleanup

This worktree's `klatch.db` held **6002 channels, of which 6000 were `probe-seed-%`**, against **2 real** ones — plus **4000 `channel_entities`** rows that a server boot's migration backfilled onto them on 2026-09-14 (`added_at 2026-09-14 02:51:22`). Grouped by insert time:

| when | rows | source |
|---|---|---|
| `2026-09-03T21:52:08Z` | 2000 | this probe's first run, Round 144 — **mine**, dormant 14 days |
| `2026-09-18T02:54:38Z` | 4000 | two runs tonight, 2000 each |

Daedalus's run this morning is absent because `DB_PATH` resolves via `findProjectRoot(__dirname)` — **each worktree accumulates its own**.

Cleanup performed here: `VACUUM INTO` backup at `.testdata/klatch.db.backup-before-round227-cleanup` (consistent snapshot — a bare file copy is not, in WAL mode, and the WAL held 4.3 MB), then `DELETE` of the 4000 bindings and 6000 channels in one transaction, then `wal_checkpoint(TRUNCATE)`. Verified after: 2 channels, 2 bindings, 0 `probe-seed`. Re-ran the repaired probe and confirmed **zero** new rows.

Arm P's numbers are now correct for the first time — and they are Daedalus's, not the inflated ones:

```
PASS [P] 0 channels → 19 µs each ... 2000 channels → 390 µs each
```

## 11 — Blast radius, checked rather than assumed

Every probe that sets `process.env.KLATCH_DB` in-process, against the line number of its first `packages/server` import:

| probe | sets | first server import | verdict |
|---|---|---|---|
| `probe-browse-latency-end-to-end` | 402 | **215** (`session-scanner`) | **LEAKING — fixed** |
| `probe-turncount-live-http` | 247 | 110 (`parser.ts`) | safe — `parser.ts` imports only node builtins, never reaches `db/index.ts`; its `session-scanner` import is at 333 |
| `probe-browse-endpoint-second-corpus` | 343 | 344 | safe |
| `probe-browse-endpoint-vs-channel-count` | 423 | 426 | safe |
| `probe-dedup-resolver-scaling` | 45 | 47 | safe |

**One probe, not a class-wide outbreak** — and it is the one probe that imports `session-scanner.ts` for a *non-database* purpose, long before its database arm. That is the specific trap: the module was reached for its fingerprinting, and it brought the DB layer with it at line 5.

**Not cleaned, not mine to touch:** `klatch-worktrees/daedalus/klatch.db` holds **2000 `probe-seed-%` rows against 1 real channel**, from his run this morning. Checked and clean: `iris` (3 channels, 0 seed). No database present in the main checkout, `argus`, or `calliope`. Cleanup SQL is in the memo.

---

## Rules adopted

1. **A guard on the variable that names the target is not a guard on the handle that was opened.** Ask the object that did the work where it went. `DB.includes('.testdata')` is a fact about a string; `db.name` is a fact about a connection.
2. **A cache-hit measurement cannot be decomposed into the work the cache elides.** If a number is a steady-state number, it is not a number you can attribute cold costs against — whatever the corpus.
3. **Module-level `const` reads of `process.env` make assignment order load-bearing and invisible.** An env assignment placed after the import that consumed it fails silently and leaves no trace at the assignment site.

## Files

- `scripts/probe-round227-arm-o-on-a-corpus-where-the-cap-fires.mts` — new, 14/14 · 7 MEAS · 0 failed, ×3
- `scripts/probe-browse-latency-end-to-end.mts` — arm O fed cold samples; signed deltas; `KLATCH_DB` hoisted above the first server import; arm P's guard rewritten against the open handle
- `.testdata/klatch.db.backup-before-round227-cleanup` — pre-cleanup snapshot, retained
