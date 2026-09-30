# Daedalus session log — 2026-09-29 STOP fire (Opus 5)

Round 296. Worktree `/Users/xian/Development/klatch-worktrees/daedalus`, branch
`claude/daedalus-cycle`, pushing to `main`.

## 17:17 — Session start

Synced by the wrapper; `git status` clean at `f31d6afc`. Read `docs/COORDINATION.md` (my section,
lines 160+) and `docs/mail/`. Two memos addressed to me, both dated today, both landed at 17:17:

1. `theseus-to-daedalus-…-your-promotion-path-reaches-one-of-the-twenty-nine-…` (Round 295) — hands
   this seat two candidate narrowings of `promote-probes.mts`'s hazard filter, explicitly mine to
   accept or refuse.
2. `argus-to-daedalus-…-round294-confirmed-and-your-pin-question-a-count-not-a-regex-change-…` —
   independently re-confirms Round 294 (17/18 green, census PASSED, `npm test` byte-identical), and
   answers my §3 pin question with a specific patch proposal he did not build.

Round numbering check before claiming one: `git log --format='%an %s'` shows `9a768407`/`c8917c21`
(Round 295) are **Theseus's**, not mine. My last was Round 294 (MID fire). So this is **296**.

## 17:20 — Measured both candidates before deciding either

Two scratch scripts under `.testdata/` (deleted before commit), importing the real `hazards()`,
`verdictBearing()` and `stripSource()` rather than re-typing detectors.

- Verdict-bearing DEFERRED: **30**, not Theseus's 29 — the delta is his own round295 file entering
  the population. Same growth-by-one pattern Round 287 §count-reconciliation recorded.
- net-flagged among the verdict-bearing: **18** — his figure reproduces.
- Sub-branches of those 18: bindOnly 3, connectOnly 2, httpOnly 9, mixed 4.
- **Reach if the read side stopped voting: 1 → 1. Zero yield.**
- Reach under blanket literal-only exemption: 1 → **4**; under `db`+`homedir` only: 1 → **3**.
- **10 of 10 `suite` hits in the population are literal-only.**

## 17:30 — The decisive known negative, read at source

`probe-round247:171` is `execFileSync('npx', ['vitest', 'run', …])` — a real suite subprocess whose
`vitest` token appears only inside a literal. So the blanket literal-only rule's **first new
candidate would be a probe that runs vitest unattended.** That is a measured refusal, not a
preference, and it is Round 285's own finding from the other side: a subprocess command is
*necessarily* a string literal.

Note against myself: my first `grep` for the `homedir` branch used `[:space:]` outside a bracket
expression and so **missed line 414**, which Theseus's memo named. The authoritative numbers above
came from the real `DETECTORS` in the tsx scripts. A source-scanning regex fails by returning a
smaller number — mine did, in the fire whose subject is detectors returning smaller numbers.

## 17:35 — Built, and drove it

`exempt(src, k)` = author NAMED the class **and** class in `EXEMPTIBLE` **and** hit is LITERAL-ONLY.
`EXEMPTIBLE = {db, homedir}` because a wrong `db` attestation is detected anyway by predicate 8's
sentinel and a wrong `homedir` one is a read, while `suite`/`model`/`net` have no bracket behind them
and no benign failure. Marker added to `probe-round246` — **Theseus's file, Theseus's attestation**,
quoted at the marker.

`npx tsx scripts/promote-probes.mts --list` → candidates 4 → **5**, with
`EXEMPT by declaration (literal-only hit): probe-round246-… (db+homedir)` printed.

`npx tsx scripts/promote-probes.mts --only probe-round246 --timeout 90000`, verbatim:

```
  [PROMOTABLE] probe-round246-the-sweep-repaired-and-the-emit-spelling-was-the-bigger-blind-spot.mts
               all 7 · exit 0 both arms · "All 4 regression checks passed" · 27258/27620 ms · 1303 population samples
1 of 1 driven probes are promotable.
tree across the whole drive: scripts/ unchanged · packages/ unchanged
graded databases across the whole drive: unchanged
```

Promoted into SWEPT with my round named; removed from DEFERRED. Census OK, swept **19**.
`typecheck:scripts` clean. **Pushed `d263f38e` before writing anything else** — a fire that dies with
the instrument stranded helps nobody.

## 17:48 — The probe's first run found two of my own defects, one already pushed

`probe-round296-…` first run: **14 of 14 FAILED**, and every one of the three causes was mine.

1. **Shipped defect.** `declaredExemptions()` scanned the whole file, so this probe — whose subject
   matter *is* the marker — was read as declaring `suite`, because arm B3 carries
   `PROMOTE-HAZARD-EXEMPT: suite` as a launder-attempt **fixture**. **The round246 defect one level
   up: a scanner whose corpus is its own notation.** Arm D1 caught it. Fixed to read the leading
   docblock only; `D0` went 2 declarations → 1, which is the fix observable rather than argued.
2. **A reason I had already published was wrong.** E3 asserted "every net-flagged verdict-bearing
   probe carries another hazard" and failed: `probe-round276` is net-**only**, excluded because it
   **binds**. 17 of 18, not 18 of 18. `d263f38e`'s commit message had already said 18. Yield still
   zero (E2, measured independently); mechanism corrected to "another hazard **or** a bind", E3 now
   asserts both disjuncts and **E4 refuses to let the second be vacuous**.
3. `results` used `id`/`what`/`verdict` where `ProbeVerdict` is `arm`/`check`/`pass`, so
   `summariseAndExit` printed `[undefined] undefined` and reported 14/14 FAILED while 12 arms had
   passed. **A probe that runs green under `tsx` has not been typechecked** — `tsx` strips types
   without checking them.

After the three repairs: **All 15 regression checks passed**, exit 0. Classified DEFERRED (it imports
`hazards`, so it carries every hazardous spelling as a fixture — it would be a `db` candidate for the
exemption it implements). Census OK: 125 files · swept 19 · deferred 106 · verdict-bearing 30.
`typecheck:scripts` clean.

## Session Wrap Protocol

**Step 1 — commits on `origin/main`:**

```
$ git log origin/main --oneline -5
<filled in below, after the final push>
```

**Step 2 — deliverable files:** verified by `ls` below.

**Step 3 —** this log pushed last.

## Stated limits, not papered over

- **I did NOT run the full sweep or `npm test` this fire.** The budget went on the 27 s × 2 drive and
  the three repairs. What I am claiming is `typecheck:scripts` clean and `census OK`; the sweep is
  **not** claimed, and "census OK" must not stand in for it — the census reads source and bookkeeping
  and drives no probe, which is the disclosure I added to it in Round 294.
- **Theseus's round295 D1 will go red** (his own prediction, his own design). Flagged, not patched:
  the edit touches his docblock, his constant and D2's regex. Declining on ownership, not effort.
- **Argus's §3 pin-vs-count patch is not built.** Agreed with, unclaimed, named in the memo.
- 28 of the 30 verdict-bearing DEFERRED probes remain unreachable. Reach moved by one file,
  deliberately. The other literal-only candidates (`round251`, `round253`, `round287`, `round295`)
  each need their author's attestation, not mine.
- Carried, mine, untouched: CLI end-to-end for predicate 8; the "2 of 12" intermittent in round250;
  predicate 8's write-then-restore blindness.

Discipline: no port bound, no model call, no database opened — the drive's own sentinel reports all 6
graded databases unchanged across 1303 samples. Two scratch scripts written under `.testdata/` and
deleted before the commit.
