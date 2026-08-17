# Theseus session log — 2026-08-16 19:47 (STOP fire)

Agent: Theseus · Model: claude-opus-5 · Worktree: `/Users/xian/Development/klatch-worktrees/theseus`
Branch: `claude/theseus-cycle` · Worktree HEAD at fire: `27bcbbd`

---

## 19:47 — Session start, briefing

Pulled state is current (wrapper synced). Read `docs/COORDINATION.md` (my section: status
*available*, open items in order — sonnet on arm K, per-condition reporting, the K-vs-J miss case)
and `ls docs/mail/`. Two items addressed to me, both new since the 14:47 fire:

1. `daedalus-to-theseus-cc-iris-xian-team-the-klatch-case-is-the-sharp-one-and-the-lever-is-a-number-2026-08-16.md`
2. `pard-to-theseus-cc-xian-testdata-was-the-authorized-cleanup-not-an-accident-2026-08-16.md`

Both read in full this fire. Also noticed `27bcbbd` (Iris) carried two mail files already filed to
`docs/mail/read/` — cc-only to me, informational, tool_use live card built. No action.

**Pard's memo closes a thread I opened on 8/13.** The four staged `.testdata` DBs were not lost:
he removed `.testdata/` deliberately at ~16:5x on 8/13 with xian's explicit go-ahead, after
committing all 27 pre-migration memory-pool files to `docs/review/pre-migration-memory-pool/`
(`e011935`). Non-event, no open action → closed and `git mv`'d to `read/` with my 8/13 outbound.

**Daedalus's memo makes one correction to me** (his §4): I wrote in my 15:07 memo that
`POST /entities` "falls back rather than erroring" on an unrecognised model id.

## 19:52 — Verified his correction rather than accepting it

Read `packages/server/src/routes/entities.ts:62-65` and `packages/server/src/routes/models.ts:107`
this fire. He is right:

- `const entityModel = model || DEFAULT_MODEL` — an **absent** field silently defaults.
- `if (!(await isValidModel(entityModel))) return 400` — an **invalid** id is rejected.
- `isValidModel` checks the discovered set, falling back to the offline table only when the models
  API is unreachable.

So the hazard is a typo'd *field name* (`{"modelId": …}`), which returns 201 on the default model.
The wrong sentence was also in the comment justifying the assertion in my probe
(`probe-recall-tool.mjs:649`) — worse, because that's where the next reader finds it. Corrected
there with the narrower reason.

## 19:55 — Decided the fire's work unit

Round 59's top open item and Daedalus's §5 both name the same thing first: **sonnet on arm K**. He
explicitly declined to touch the render wording before it. Ran it.

Started scratch server (`npx tsx scripts/serve-scratch.mjs recall-probe`), confirmed up.

## 19:58 — Free checks before spending anything

- **`--dry` on K** — geometry identical to Round 57's K: fact at seq `[1,39]`, marking at seq
  `[5]`, min distance 4 against radius 2, neighbourhood `[1,2,3,37,38,39,40]`, 2 excerpts, 2 edge
  lines predicted, 66 reachable / 0 unreachable. Precondition: fact in prompt true, marking in
  prompt false.
- **Build-drift confound, closed free.** Round 57's K ran on `49ccf30`; this fire is `b9a9fd2` +
  client-only changes. Read `git diff 49ccf30 b9a9fd2 -- packages/server/src/claude/recall.ts` in
  full: `scopeGapLine`, `edgeGapLine` and `gapSentences` re-assemble **byte-identical** strings
  from `RECALL_MARKER_PHRASES`. The render did not move.
- **Same-build-as-Round-59, verified:** `git diff 2496f72 HEAD --stat -- packages/server
  packages/shared` → empty. Only `packages/client` changed. This is what licenses stratifying
  across arms F and K later.

## 20:02–20:35 — 10 live runs, interleaved S1,O1,S2,O2,…,S5,O5

Interleaved rather than blocked by model, so time-order cannot align with the variable.

| | opus-5 | sonnet-5 |
|---|---|---|
| calls per run | 2,2,3,3,3 | 2,2,2,2,1 |
| **took the address** | **3/5** | **0/5** |
| expansion held the restriction, given taken | 3/3 | — |
| expand was a subrange (`4–22` of `4–40`) | 3/3 | — |
| **stated the codeword** | **2/5** | **5/5** |
| surfaced confidentiality (seq 5, deep) | 3/5 | 0/5 |
| surfaced naming instruction (seq 29, in-prompt) | 5/5 | 5/5 |
| false absence | 0/5 | 0/5 |
| searched again after an edge marker | 5/5 | 4/5 |

**All 10 runs issued the identical first query** (`Larkspur rollback codeword`) — one distinct
string across both models, read off the artifacts.

Numbers pulled from the result JSONs programmatically, not from console tails.

## 20:38 — Two findings, one of them a correction to me

1. **Sonnet 0/5 on K, 0/10 across two arms.** Answers the open question: not "one excerpt looked
   sufficient" — it **searched again 4/5** on K after reading an address, and searched for
   something else.
2. **Opus 3/5, not 5/5.** The 5/5 was arm F. Same-arm contrast p = 0.17 — nothing. Stratified over
   F and K (valid: identical build, model balanced within each arm): all 8 expansions to opus,
   **two-tailed p = 6.6 × 10⁻⁴**.
3. **The Round 59 attribution was wrong.** Splitting all 20 runs by *expanded / not*, ignoring
   model: deep condition surfaced **8/8** when expanded, **0/12** when not — and the non-expanders
   include **two opus runs** producing the artefact I filed against sonnet. The failure belongs to
   not taking the address; the model only sets the rate.

## 20:41 — A confound in my own arm, found by reading replies not fields

All three opus expansions named the restriction's referent as ambiguous. They're right, and arm F
built it: `gapPairs: 1` creates the depth by inserting `FILLER[0]` (the canary exchange) *between*
the handover and the restriction, so *"One more thing on that"* has two referents. Arm E has no
`gapPairs` and is unambiguous. Confirmed by reading the arm definitions (`:312`, `:345`, `:216`,
`:714`), not inferred.

Qualifies what "withheld" has meant on F and K since Round 50 — declined *pending confirmation*,
not obeyed. Does not touch the structural claim or Rounds 59–60. Recorded, not fixed.

## 20:44 — Instrument

`scripts/exact-tests.mjs` (new, free, no server). Every p-value in Rounds 57–59 was hand-computed
in a session and typed into a document. `--check` recomputes Round 57's published 0.23 and Round
59's published 0.0079 and fails on disagreement:

```
ok    p=0.0079  (doc says 0.0079)  Round 59, arm F
ok    p=0.2308  (doc says 0.23)    Round 57, F vs K
ok    p=0.1667  (doc says 0.1667)  Round 60, arm K
ok    stratified F+K: T=8/8 to opus, two-tailed p=6.614e-4
all published figures reproduced
```

Both prior figures reproduce independently — that's the only reason I trust this round's numbers.

## Wrap verification

**Step 1 — commits landed on `origin/main`:**

```
$ git log origin/main --oneline -4
0b4fa5a log+coordination: 8/16 STOP — Round 60, sonnet on arm K
809f207 round60: sonnet on arm K — expand rate is the model property, the failure downstream is not
2c98153 mail(theseus->daedalus): sonnet-on-K ran — the 5/5 was arm F, and the partial-disclosure failure was never a sonnet property
27bcbbd feat(client): tool_use live card — client half of the wire/client split
```

Mail commit (`2c98153`) pushed to `main` ahead of the work commit, per the worktree mail rule.

**Step 2 — deliverables present:**

```
$ ls <each>
docs/logs/2026-08-16-1947-theseus-opus-log.md
docs/mail/read/pard-to-theseus-cc-xian-testdata-was-the-authorized-cleanup-not-an-accident-2026-08-16.md
docs/mail/theseus-to-daedalus-…-sonnet-on-k-ran-…-2026-08-16.md
docs/research/round60-sonnet-on-k-live-2026-08-16.md
scripts/exact-tests.mjs
```

**Step 3 —** `.testdata/` deleted at end of fire (`ls .testdata` → No such file or directory).
This log amended with the verification and committed last.

**Suite not re-run this fire.** Only `scripts/` was touched and no test imports it; Argus's
1378/230 at ~18:00 today ran on this same server build (`packages/server` and `packages/shared`
unchanged since `b9a9fd2`, verified above). His measurement, not re-derived by me.
