# Daedalus session log — 2026-08-12 WORK fire (13:17 PT)

Model: Opus 5 · Worktree: `/Users/xian/Development/klatch-worktrees/daedalus` · Branch: `claude/daedalus-cycle` → `origin/main`

---

## 13:17 — Orientation

Synced by the wrapper. `git log` shows five commits since my 09:17 START fire (Theseus's live AAXT run + canonicity ruling, Calliope's v31 rollup and MID log, Pard→Theseus test-data mail, and one addressed to me).

Mail sweep — two items involving this seat:

- **`janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`** (new, ~10:35). xian, verbatim: *"I approve Daedalus's recommendation. Please let them know."* → **option (b) recent-N + summary, with (c) on-demand deep retrieval layered on.** This was the single stated gate on queued item `#3`.
- **`calliope-to-xian-cc-daedalus-addressing-item-was-stale-2026-08-11.md`** — informational, addressed to xian, self-corrected on her side. Nothing owed by me; left in place since it's hers to close.

Prerequisite check before starting, rather than trusting the queue ordering: `#2` (`source_channel_id` on entities) is **resolved**, shipped 8/10 as an assembly path with no schema change (gap doc lines 91–107). `#1` shipped 8/09. So `#3` is genuinely unblocked, not blocked behind an unbuilt `#2`.

Verified in code rather than from the gap doc's table: `grep` for `source_channel_id` across `packages/` returns nothing (correct — it was never added), `getEntityTranscript` exists at `db/queries.ts:598`, and its own docstring says *"NOT yet wired into `buildSystemPrompt` — that is increment #3 proper and is gated on the compaction-strategy decision."* That gate is what xian just opened.

## 13:20 — Sizing before designing

The sizing doc committed to measuring the seed rather than guessing it, so I did that first, against `backups/klatch.db.backup-2026-03-14` (copied inside the worktree, worked read-only, copy deleted after — `/tmp` is outside the sandbox boundary).

**20-message tail per department-head channel:** 11,928–22,310 chars (~3–5.5K tokens). Against the ~48–160K per agent that excluded option (a), that's the decision paying off.

**Per-message distribution (n=2,600):** p50 **580**, p90 **2,334**, p99 **7,984**, **max 64,627**.

That max is the finding. A message-count cap alone is unsafe: one 64,627-char message is more than twice any sane block budget, so it would be carried alone and evict the other nineteen. Three tiers, not one: 20 messages / 24,000 chars per block / 4,000 chars per message. The block budget is normally slack (every measured tail fits under it), so the count binds and the cost stays predictable; the block budget exists for the tail.

## 13:22 — Built

`packages/server/src/claude/carried-context.ts` + layer 6 in `buildSystemPrompt`.

Design calls made and written down rather than left implicit:

- **Klatches only.** Carrying klatch content back into a 1-1 is bidirectionality — open question 2, unanswered by xian. Built the decided direction, left the other alone.
- **Per entity, inside the roundtable loop.** Verified by reading `client.ts:823` that `buildSystemPrompt` is already called once per participant, so cost is per-agent. This is what makes (b) affordable and is exactly what option (a) failed on.
- **Options bag as the 7th param**, not a 7th positional — the summary half can land without an 8th. `buildSystemPrompt` stays a pure function of its arguments, which the AAXT harness, export assembler and prompt-debug route all depend on.
- **Layer 6 sits after layer 5.** Layers 1–5 are standing configuration; layer 6 is transcript. Last keeps it adjacent to the live conversation and keeps identity from being read through one week's activity.
- **Omitted from `export/assemble.ts` deliberately**, with the reason in a comment: layer 6 is another channel's verbatim content, and putting it in this channel's exported package is a leak.
- **`6_carriedContext` in `prompt-debug` and both AAXT routes.** This is the observability property Theseus argued (b) for and it's worthless if it isn't machine-readable.

First run of the new tests: 19 failures, all one cause — my fixture passed `Channel` objects where `say()` wanted ids. Fixed; 19/19.

## 13:24 — Measuring the shipped thing against real data found a defect

Ran the *built* code against the real corpus rather than stopping at a green suite. Seeds came out at ~650 chars — implausibly small against the ~20K the arithmetic predicted. Chased it instead of accepting it.

**`getEntityTranscript` scoped on `m.entity_id = ?`, and every user message is written with `entity_id` NULL.** `insertMessage` is only ever handed an entity for the assistant row (`routes/messages.ts:83-85,108-110,143-145`). So the union returned each agent's **answers with none of the questions.**

Real corpus: **1,332 user rows NULL, 1,240 assistant rows stamped.** Slightly more than half the conversation missing — and the half that says what the agent was *asked to do*.

Round 36 shipped this and I wrote Round 36. It survived because its fixtures only ever inserted assistant rows, so no test could express the failure. It was inert until this fire because the union was wired to nothing. My own first draft of the Round 38 user-message test had the same blind spot — it stamped `agent.id` on a user row, a shape that never occurs in the database. Replaced with an `ask()` helper that writes the row the way the live path writes it, `entity_id` NULL, and added two tests that pin the defect.

Fix: match the rule `buildPanelHistory:284` has always used per channel (`role === 'user' || entityId === entity.id || !entityId`). A user message qualifies on **room membership**, not authorship — in a klatch the human addressed everyone present — so the clause is an `EXISTS` on `channel_entities`. Purely additive; assistant-row scoping is unchanged, and Round 36's twelve tests pass unmodified.

**Proven load-bearing, not assumed:** rebuilt `dist/` and re-ran against the real corpus. The same seed that carried **0** user messages now carries **9 of 20**.

## 13:26 — The measurement's second finding: backfill is now the blocker

Against the corpus as it actually is, the seed is **1,583 chars from 4 rooms**, not the ~12–22K the per-channel table predicts.

Not a budget bug. The corpus predates continuity `#1`, so all 65 imported channels still bind to `default-entity` — there is one agent, and its "recent activity elsewhere" is a mix drawn from whichever channels were most recently active. **The wiring is correct and is correctly carrying the wrong thing.**

That is open question 3 in the gap doc (backfill vs forward-only), parked since July. It has moved from tidiness to load-bearing, because the canonical six-department-head use case runs on exactly those imports. Nothing in the seed can fix it; it's a data question. Filed to xian as the one ask, with forward-only named as a genuinely acceptable answer that carries a re-import consequence — not steered.

## Verification (session wrap protocol)

**Step 1 — commits landed on `origin/main`:**

```
$ git log origin/main --oneline -4
```

*(output pasted below after push)*

**Step 2 — deliverable files exist:** listed below after push.

**Step 3 — this log pushed last.**

### Suite, typecheck, build — run this fire, not carried

```
npm test        → 1199 server (+21) / 212 client (13 skipped), exit 0
npm run typecheck → clean, shared + server + client
npm run build     → green end to end
```

### Not proven by this fire

No live klatch turn was driven through a running server. Every test mocks the Anthropic client, so what is verified is that the seed is assembled correctly, is wired into all three assembly call sites, and reaches the prompt string — **not** that a model given this seed behaves as if continuous. That is an AAXT/MAXT question; the probe shape is in the memo to Theseus.

Also not built, and written up rather than half-done: the **summary half of (b)** and **(c) on-demand retrieval**. Three real design questions (where a summary is stored, what triggers generation, what invalidates it), each cheap to get wrong in a way that shows up as a stale agent rather than a broken one. `docs/plans/continuity-3-carried-context.md` §"Not built".
