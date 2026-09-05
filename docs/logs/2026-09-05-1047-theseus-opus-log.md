# Theseus — 2026-09-05 session log (opus)

Duty-cycle fires. Worktree `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Entries appended as work happens, not reconstructed at the end.

---

## 10:47 PT — START fire (Round 155). Briefing.

Wrapper synced the worktree to `origin/main` immediately before the fire; `git log --oneline -3`
confirms head at `9c98403` (Daedalus's 9/5 START fire commit). Branch `claude/theseus-cycle`.

**Mail read this fire:**
`docs/mail/daedalus-to-theseus-cc-janus-iris-calliope-argus-xian-the-9x-decomposed-and-the-obvious-fix-is-a-no-op-2026-09-05.md`
(Daedalus, Round 154). He decomposed the 9× accepted-multipart cost into four ~2× stages
(`formData` 3.43×, `arrayBuffer` +2.02×, route `toString` +1.02×, parse +2.13× → 8.60× in-process,
reconciling with the 9.25–9.38× through a live server), reported the obvious `file.size` +
`file.text()` one-liner as a **measured no-op** (sign flips between runs — `Buffer.from(arrayBuffer)`
is a view, not a copy), and shipped a real fix on the *fall-through* path: `rejectOversizeFile`
now runs one line ahead of `arrayBuffer()` at all four multipart sites, saving 90.4 MB spent to
reject. He acked my Round 153 cold-figure close and is not re-deriving it.

**He explicitly left two items as mine, and they match my own Round 153 "not done, deliberately"
list:** the `~/.claude-pm/projects` cap delta, and Round 146's arm-S transform re-pin.

**This fire takes the `~/.claude-pm/projects` cap delta.** It is the one continuity #3 actually
depends on — PM's eleven department heads live under that root, and Round 153 measured the cap
ruling's cold-browse cost only against `~/.claude/projects`. The PM corpus has a very different
shape, so the shipped figure does not transfer.

### Inventory first, because it decides what the arms should be

Ran a standalone read-only inventory over both roots (streamed line counts, the same unit
`FINGERPRINT_LINE_CAP` is expressed in; scanner's own filters: `*.jsonl` directly under a project
dir, ≥ 100 bytes):

```
shipped: /Users/xian/.claude/projects
  files=521  bytes=546.8MB  maxLines=15371
  over1500=11  over50000=0   totalLines=181680
  top10=15371, 14061, 12043, 10597, 10419, 9473, 7091, 4598, 2941, 1898

pm:      /Users/xian/.claude-pm/projects
  files=76   bytes=462.7MB  maxLines=41168
  over1500=11  over50000=0   totalLines=258223
  top10=41168, 29923, 26847, 23399, 23174, 22435, 22001, 20841, 17660, 16626
```

Three things worth stating before any latency is measured:

1. **Same count over the old cap (11 each), wildly different magnitude.** The shipped corpus's 11
   over-1500 files top out at 15,371 lines; PM's top out at 41,168. The cap delta is a function of
   *lines above the cap*, not files above it, so the two corpora cannot share a number.
2. **PM holds 258,223 lines in 76 files vs 181,680 in 521** — 6.1 MB average file vs 1.05 MB.
3. **`over50000 = 0` on both.** The shipped 50 000 guard still does not bite, which is what
   `session-scanner.ts:255-263` says should be true and asks to be monitored. But PM's largest
   file is at **82% of the guard** (41,168 / 50,000). That headroom number has not been written
   down anywhere and is the early-warning signal the comment asks for.

Next: build the Round 155 probe and measure the delta at the endpoint. Method note — the server
can be pointed at the PM root **alone** via `CLAUDE_CONFIG_DIR` (replace semantics,
`session-scanner.ts:128`), rather than `KLATCH_EXTRA_SESSION_ROOTS` (additive), so the delta is
isolated to this corpus instead of measured through a union.

---

## 11:05 PT — Round 155 measured. `scripts/probe-pm-corpus-cap-delta.mts`, 39 checks, 0 failed.

**Two independent full runs of the whole probe. The delta agrees to 0.2% (1778 ms, then 1781 ms).**
Canonical figures below are the second run — the one the committed probe produces, since arm H was
added between them.

| arm | cap | cold browse | steady state |
|---|---|---|---|
| B | 50 000 (shipped) | **1945 ms** | 5 ms |
| C | 1 500 (pre-ruling) | **174 ms** | 4 ms |
| D | 50 000, control | **1966 ms** | 4 ms |

- **Cap delta: 1781 ms** (mean of shipped-cap arms − arm C); 1771 taking B−C. Arm B is not drift:
  B and D are 1% apart on separate fresh servers.
- **vs the shipped root's 723 ms (Round 153): 2.46×.**
- **Relative: shipped +48%, PM +1021%** (174 → 1956 ms). The old cap read 17 355 of 258 315
  lines — 6.7% of the corpus. It wasn't trimming PM's tail; it was declining to read it.
- **Turn signal: 138 → 1121. The old cap hid 87.7% of PM's turns**, against 59.4% on shipped.
  Department heads would have rendered at ~2 turns each against a real top of 370.
- **Steady state 4–5 ms at either cap** — cache absorbs it 425–490×, paid once per server start.
- **Guard headroom (arm G): PM's largest is 41 168 lines = 82% of the 50 000 guard.** Shipped's
  largest is 15 371 (31%). PM leads by 2.7× and crosses first.

### What I got wrong going in, and what caught it

I predicted in Round 153 that the PM delta would be "a different and larger number." It is — but
the reason is not the one I'd have given. **Both corpora have exactly 11 files over the old cap.**
Eleven and eleven. Had I reasoned from the file count instead of measuring, I'd have concluded the
deltas were comparable and been wrong by 2.5×. The delta is paid per *line* above the cap —
73 536 above-cap lines on shipped (40% of that corpus) vs 240 992 on PM (93%).

Arm A computes above-cap **lines**, not just the file count, specifically so the next reader can't
make the inference I nearly made.

### Method decisions worth recording

- **Root isolation via `CLAUDE_CONFIG_DIR`** (replace, `session-scanner.ts:124-130`) rather than
  `KLATCH_EXTRA_SESSION_ROOTS` (additive) — the figure is PM, not a union to be un-mixed by
  subtraction. `KLATCH_EXTRA_SESSION_ROOTS` is also explicitly blanked in the child env, so an
  ambient value can't silently restore the union.
- **The replace is proved by session-ID set equality against disk basenames** (`sessionId` is the
  file basename, `session-scanner.ts:528`), not by count — a union fails on the extra IDs, not just
  on a total that someone might rationalise.
- **`sourceRoot` could not serve as the proof** and I caught this before running, not after: it is
  deliberately *omitted* under a single root (`session-scanner.ts:47-62`), so my first draft's
  "sessions carry the PM root" check would have failed on a correct build. Rewritten to assert its
  **absence** — a `sourceRoot` appearing here would itself mean two roots got scanned.
- **Arm H is placed last on purpose.** It reads the shipped corpus (547 MB), which would warm page
  cache the timed arms hold constant. Nothing is timed after it.
- **Arm E's stale-arm hazard, handled in-line.** "Shipped cap does not bite" is true today and is
  exactly what the scanner comment asks to be monitored. The probe says in its own output that a
  red there *is the finding, not a broken probe* — Daedalus's Round 154 point about static arms
  that pin today's code as correct-by-definition, applied to my own.

### Arm H — the one I'm least confident in, written up as such

| normalisation | PM | shipped | spread |
|---|---|---|---|
| ms per 1k lines above cap | 7.4 | 9.8 | 25% apart, PM **cheaper** |
| ms per MB above cap | 4.1 | 3.3 | 26% apart, PM **dearer** |

The two normalisations **bracket rather than agree**, by a similar margin in opposite directions
(PM's lines average 1.84 KB vs shipped's 3.08 KB). I did not pick a unit on two data points; the doc
says "estimate 7–10 ms per 1k above-cap lines and treat the range as the precision." It is also a
cross-run comparison — the 723 ms is Round 153's, measured yesterday on a different machine state —
and both the probe and the doc label it that way. Flagged to Daedalus for a second opinion, with an
explicit offer to cut it back to the PM figure alone.

### Deliberately not done

- **The union cold browse.** xian's real Browse walks both roots. Adding the two single-root figures
  gives ~4.2 s, and **that is arithmetic across two runs, not a measurement** — it assumes the roots
  don't interact through page cache, the walk, or the response build. Named as the obvious next arm;
  not quoted as a figure anywhere.
- **Round 146's arm-S transform re-pin** — the second item Daedalus left me. Still scoped-not-built.
- **Whether ~1.9 s/server-start on PM is acceptable** — xian's call, and the ruling is already his.

Deliverables written: `docs/pm-corpus-cap-delta-2026-09-05.md`,
`scripts/probe-pm-corpus-cap-delta.mts`, memo to Daedalus cc Janus/Iris/Calliope/Argus/xian.
Two ad-hoc inventory scripts under `.testdata/` were deleted after their work moved into arms A
and H, so the numbers live in the committed instrument rather than in scratch.

---

## 11:10 PT — Wrap verification (START fire, Round 155)

Per CLAUDE.md Session Wrap Protocol. Run before any "done" claim.

**Suite and typecheck, run by me this fire, not quoted:**

```
server: Test Files 95 passed (95)   Tests 1518 passed (1518)
client: Test Files 18 passed | 13 skipped (31)   Tests 249 passed | 13 skipped (262)
npm run typecheck: clean across @klatch/shared, @klatch/server, @klatch/client
```

Both totals are unchanged from Daedalus's Round 154 figures, which is what should happen — I
touched no `packages/` code.

**`packages/` untouched, verified not assumed:**

```
$ git diff --stat -- packages/
(empty)
```

The probe's one-generation rewrite of `FINGERPRINT_LINE_CAP` was restored and sha256-verified
inside both runs (`PASS [*] scanner byte-identical to how it was found — sha256 2ae9ecd1c431`).

**Step 1 — commits on `origin/main`** (after `git fetch origin`):

```
$ git log origin/main --oneline -5
3db1489 round155: price the cap ruling on ~/.claude-pm/projects -- 1781 ms, 2.46x the shipped root
74aec9c mail: Theseus -> Daedalus, cc team (PM cap delta is 2.46x; ...)
9c98403 log+coordination: Daedalus 9/5 START fire — Round 154 accepted-multipart allocation decomposed
fee2f35 round154: check the import cap on file.size, ahead of the copy
3c29aaa mail: Daedalus -> Theseus, cc team (the 9x decomposed; ...)
```

Both of this fire's commits are present on `origin/main`. Mail was committed separately and pushed
to `main` first (`74aec9c`), per the worktree mail rule, before the work commit (`3db1489`).

**Step 2 — deliverable files present:**

```
scripts/probe-pm-corpus-cap-delta.mts                                    32468 bytes
docs/pm-corpus-cap-delta-2026-09-05.md                                    7862 bytes
docs/mail/theseus-to-daedalus-...-pm-cap-delta-is-2-46x-...-2026-09-05.md  6648 bytes
docs/logs/2026-09-05-1047-theseus-opus-log.md                             (this file)
```

Also modified and committed with this log: `docs/COORDINATION.md` (status → Round 155; the oldest
full prior, Round 144, trimmed to a pointer to hold my section at four priors — its detail survives
in `docs/browse-latency-end-to-end-2026-09-03.md`, the 9/3 log, and git history).

**Step 3 — this log is committed and pushed last**, after Steps 1–2 were verified.

No claim in this entry is made about work I did not verify present. The four deliberate omissions
(the union cold browse; whether ~1.9 s/server-start on PM is acceptable; Round 146's arm-S
transform re-pin; the lines-vs-bytes unit question in arm H, which needs a third corpus) are
recorded as not done, not as done. Every latency figure for `~/.claude-pm/projects` was measured
this fire, twice; every figure quoted for `~/.claude/projects` is either measured this fire (disk)
or explicitly attributed to Round 153 and labelled cross-run (latency).

---
