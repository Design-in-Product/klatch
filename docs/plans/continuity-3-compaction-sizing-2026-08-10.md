# Sizing continuity #3 against real data — the compaction question is now arithmetic, not taste

**Author:** Daedalus · **Date:** 2026-08-10 · **Status:** input to xian's open compaction-strategy decision

The compaction-strategy question (`composition-continuity-gap-2026-07-19.md`, open question 1) has been framed as a judgment call between three options. Measured against the real March corpus, the top option is arithmetically excluded and the choice narrows to two. Predicates included so anyone can re-run this.

## Measurements

Source: `backups/klatch.db.backup-2026-03-14`, worked on a copy, copy deleted after. Token figures are chars ÷ 4 — a rough-but-adequate proxy; re-baseline with `count_tokens` before anything depends on a precise number.

**Per-agent transcripts, the canonical use case's actual cast:**

| Imported channel | Msgs | Chars | ~Tokens |
|---|---:|---:|---:|
| VA exec asst | 355 | 635,224 | ~158,800 |
| Comms Chief — content strategy, blogging, … | 299 | 256,740 | ~64,200 |
| CXO — MUX, MVP, models | 221 | 253,293 | ~63,300 |
| Chief of Staff — MUX, alpha testing | 244 | 205,518 | ~51,400 |
| Chief Architect — MVP: M0 | 188 | 198,263 | ~49,600 |
| HoSR — Weekly Ship | 188 | 191,635 | ~47,900 |

```sql
SELECT c.name, COUNT(m.id), SUM(LENGTH(m.content))
FROM channels c JOIN messages m ON m.channel_id = c.id
WHERE c.source IN ('claude-ai','claude-code')
GROUP BY c.id ORDER BY SUM(LENGTH(m.content)) DESC;
```

**And the aggregate, which is what a naive union produces today** (all 72 imported channels still bind to one entity, pre-backfill):

```
default-entity: 1,255 messages across 65 channels, 1,705,720 chars (~426,000 tokens)
```

## What this settles

**Option (a) — "compacted summary of each agent's source channel, injected at klatch entry" — is excluded for the canonical use case.** Six department heads at ~48–64K tokens each is **~330K tokens of carried context before anyone says anything**, and that is the *median* cast; include the VA exec asst and it clears 480K. It fits a 1M window arithmetically, but it spends a third to half the window on standing context in every turn of a six-agent klatch, at Opus pricing, re-sent per participant per turn. That is not a tuning problem.

Worth stating plainly since the gap doc hedged it: *"three full sessions will not fit in one prompt"* was directionally right and quantitatively understated. It is not three sessions, it is six, and the per-session figure is ~50–160K rather than the intuition of "a long conversation."

**The real choice is between (b) and (c):**

- **(b) recent-N + summary.** Predictable cost, predictable latency, and — Theseus's argument, which I'd now weight heavily — *observable*: you can tell from the prompt what the agent was given, so an AAXT probe can distinguish "didn't know" from "knew and didn't use." Deterministic per turn.
- **(c) on-demand query tool.** Cheapest by far (nothing carried until asked for), and the closest match to xian's "the channel contextualizes itself turn by turn." Cost is that retrieval becomes a model decision, so failures look like competence gaps rather than missing data — Theseus's specific objection, and it is a real one for a project whose beta gate is behavioral.

**They are not exclusive, and I don't think they should be.** (b) as the floor — a bounded, always-present seed so an agent is never blank — with (c) layered on so it can reach for specifics it wasn't given. That is also what the measurements argue for: a ~50–160K transcript can't be carried, but the *recent slice plus a summary* of it comfortably can, and the long tail is exactly what an on-demand query is good at.

## What's already built for this

`getEntityTranscript(entityId, { excludeChannelId, limit, types })` — Round 36, landed today. Every option above needs the same union underneath it, so it was built first and independently of the decision:

- **(b)** is `{ limit: N }` plus a summary of the remainder.
- **(c)** is the same function behind a tool, unbounded but called on demand.
- **(a)**, if anyone still wants it, is the unbounded call plus a compaction pass.

So the decision does not block on engineering, and picking (b)+(c) does not require rework of what exists.

## What I'd ask xian for

One answer: **(b) alone, (c) alone, or (b) with (c) layered.** My recommendation is the third. The seed size for (b) is mine to tune once that's chosen — I'd start by measuring rather than guessing, against this same corpus.

Not asked, but worth flagging: the **backfill** question moves from theoretical to concrete now. 72 real imported channels sit on one entity; splitting them into per-agent entities is what turns the aggregate row above into the per-agent rows above, and it's what the canonical use case needs to be runnable at all.
