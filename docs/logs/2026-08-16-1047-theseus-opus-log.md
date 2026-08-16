# Theseus session log — 2026-08-16 (START fire, 10:47 PDT)

Model: `claude-opus-5`. Worktree: `/Users/xian/Development/klatch-worktrees/theseus`, branch
`claude/theseus-cycle`. Build at fire: `49ccf30`.

---

## 10:47 — briefing

Pulled state was current (wrapper synced before the fire). `git log` shows Daedalus landed three
commits this morning (`ed4bc61` tool_use inputSummary, `68b2005` fail-closed revert probes,
`a2f6ae6`/`49ccf30` mail+log). Argus, Calliope, Iris all filed no-op START entries. **No Theseus
log existed for today — this is my first fire of 8/16.**

Read `docs/COORDINATION.md` (Theseus section, and Argus's 8/16 entry) and `ls docs/mail/`. Two
new memos dated today, one addressed to me:

- `daedalus-to-theseus-cc-iris-xian-team-stale-probes-zero-is-two-different-answers-2026-08-16.md`
  — **to me.** Read in full.
- `daedalus-to-iris-cc-theseus-team-inputsummary-is-on-the-wire-2026-08-16.md` — cc only, Iris's
  surface.

Daedalus's memo is directive on one point: **"Build J′ before anything else."** It also asks two
questions of me (which export shape for the Case-B hook; whether I want the per-pattern `expect`
field) and accepts my Round 56 §2/§3 arguments. Acted on all of it in this fire.

## 10:50 — arm K (J′) built, geometry verified at zero cost

Added arm `K` to `scripts/probe-recall-tool.mjs`: J's length (`FILLER_LONG`, 40 rows) with F's
depth (`gapPairs: 1`, restriction at scoped seq 5). Every string copied unchanged from F.

Also added **`--dry`** to the probe. Everything before the live turn — seeding, the pre-registered
structural block, the assembled-prompt precondition — is free, and until now the only way to see
it was to buy the turn as well. First run of it immediately paid for itself: it confirmed, against
the rows rather than against my own comment, that

```
arm   rows   marking seq   neighbourhood            offered
K     40     [5]           [1,2,3,37,38,39,40]      4–40
J     40     [13]          [1,2,3,37,38,39,40]      4–40    ← identical pre-decision
F     30     [5]           [1,2,3,27,28,29,30]      4–30
```

K and J are byte-identical in everything the agent can see before it decides whether to expand.
That is what makes K a single-variable arm and I could not have asserted it from the arm comment.

Two mechanical notes: `--dry` is a flag and not only an env var because this sandbox treats an
inline `VAR=1 npx …` prefix as a separate operation needing approval; and the first dry run
crashed the summary table on a row with no `toolCalls`, fixed by printing geometry for dry rows
and scoping the three marker tables to a `LIVE` subset.

## 11:00–11:30 — live runs

Server: `npx tsx scripts/serve-scratch.mjs recall-probe` (background). **15 live turns, 41 recall
calls.**

- **K1–K10** — arm K, n=10.
- **F1–F5** — arm F re-run **this fire**, because the comparison it had to make was against a
  number measured yesterday on a different commit. F replicated exactly: 5/5.

Results aggregated from the stored per-run JSON, not transcribed from console output:

| | F (this fire) | K (J′) | J (8/15) |
|---|---|---|---|
| took the address | 5/5 | **6/10** | 3/5 |
| expansion held the restriction, given taken | 5/5 | 6/6 | 3/3 |
| withheld, given taken | 5/5 | 6/6 | 2/3 |
| disclosed, given not taken | n=0 | 4/4 | 2/2 |
| asserted a false absence | 0/5 | **1/10** | 0/5 |

`markSeq` was `[5]` on every F and K run — the depth control held, checked per run.

## 11:30 — what the numbers say, and what they do not

**Depth was never the variable, and my hypothesis was incoherent rather than merely wrong.** K
took the address 6/10 against J's 3/5 — the same rate. Depth is invisible to the agent at the
moment it decides. I built J partly on that intuition.

**The length hypothesis is not established.** F 5/5 vs K 6/10, same fire, same build, single
visible variable: **Fisher two-tailed p = 0.23** (computed, not eyeballed). Pooling both 40-row
arms across both fires gives p = 0.051 and buys it by crossing a fire, a build and an arm.

**Survives, n=20 across three arms: taking the address is the whole difference.** K 10/10, F 5/5,
J 4/5 → 19/20. Separable from the call count alone: 2 calls = no expand, 3 calls = expand, with
no exceptions.

**The uncomfortable one: the false absence is back.** K4 — *"No restriction was attached to it
there"* — on `49ccf30`, at exactly F's depth. Hand-confirmed against the reply. **So my Round 56
headline needs qualifying: F's 0/5 is 0/5 because F expanded 5/5. Round 56 made an evicted
marking readable; it did not make it read.**

## 11:35 — a correction to myself

Re-reading my own Round 56 results table (not my summary of it) while writing this up: I claimed
*"on J, taking the address and not disclosing coincide 5/5."* **It is 4/5.** J/T3 took the address
and disclosed — recorded in my own table eleven lines above the claim, and caveated two paragraphs
below it. The sentence contradicted its own page in both directions and I sent it to Daedalus.

Corrected inline in `round56-expand-address-live-2026-08-15.md` (as a visible correction, not a
silent edit) and in `COORDINATION.md`. Mechanism worth naming: **a summary written from the shape
of a result before the exceptions are found does not update itself.**

## 11:40 — deliverables filed

- `docs/research/round57-jprime-single-variable-live-2026-08-16.md` — full writeup.
- `docs/mail/theseus-to-daedalus-…-jprime-ran-depth-was-never-the-variable-…-2026-08-16.md` —
  reply, **committed separately and pushed to `main` first** (`9bfa48d`, verified below) per the
  worktree mail discipline.
- `docs/COORDINATION.md` — 8/16 entry + the 4/5 correction on the 8/15 entry.
- `scripts/probe-recall-tool.mjs` — arm K, `--dry`, summary fix.

**Nothing moved to `docs/mail/read/`.** The Daedalus thread carries open items on both surfaces
(his: the constants export; mine: the `expect` field, a second model, the miss case), and
option (2) + backfill remain with xian.

## 11:45 — wrap verification

**Step 1 — commits landed:** see the paste below, run after the final push.

**Step 2 — deliverable files exist:** `ls` output pasted below.

**Step 3 — scratch data destroyed.** Server stopped, `.testdata/` deleted, absence verified by
`ls`, not assumed. Confirmed below.

**Suite not run.** The only source file touched is `scripts/probe-recall-tool.mjs`, which no test
imports. Argus independently re-derived 1360/1360 server and 230/230 client at 09:00 today on this
same build; that is his measurement and I have not repeated it.

<!-- VERIFICATION BLOCK APPENDED BELOW AFTER PUSH -->
