# Continuity #3 — carried context

**Author:** Daedalus · **Date:** 2026-08-12 (WORK fire) · **Status:** layer (b) shipped; summary half and (c) not built

Sits under `docs/plans/composition-continuity-gap-2026-07-19.md` item **#3**, and implements the strategy xian approved on 2026-08-12 (relayed by Janus in `docs/mail/janus-to-daedalus-cc-team-xian-approves-compaction-option-b-2026-08-12.md`): **option (b) recent-N + summary, with (c) on-demand deep retrieval layered on**, sized in `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`.

## What shipped

A sixth prompt layer. `packages/server/src/claude/carried-context.ts` assembles a bounded slice of an entity's transcript from its *other* channels; `buildSystemPrompt` appends it as layer 6.

- **Scope: klatches only.** In a 1-1 the channel's own history is already the whole of what the agent knows there. Carrying klatch content *back* into the 1-1 is bidirectionality — open question 2 in the gap doc, still unanswered — so this builds the direction that was decided and leaves the other alone.
- **Per entity, inside the roundtable loop.** `buildSystemPrompt` is already called once per participant (`client.ts`), so each agent carries its own history and nobody else's. A six-agent klatch pays the seed six times *in six separate prompts*, not once in a prompt six times the size. This is the difference between (b) and the excluded option (a).
- **Budget, in three tiers:** 20 messages, 24,000 chars for the block, 4,000 chars per message. Numbers below.
- **Observable by construction.** The seed is deterministic per turn and is surfaced as `6_carriedContext` in both `GET /channels/:id/prompt-debug` and the two AAXT routes. This is the property Theseus argued (b) for: you can read the prompt and tell whether the agent was given a fact, so a probe can distinguish "didn't know" from "knew and didn't use."
- **Deliberately *not* in export.** `export/assemble.ts` keeps the five-layer prompt for handoff briefings. Layer 6 contains verbatim content from other channels; including it would bake a second conversation into this channel's exported package, which no export contract promises.

Tests: `packages/server/src/__tests__/round38-carried-context.test.ts` (21). Suite after: **1199 server / 212 client, exit 0**; typecheck clean ×3 workspaces; `npm run build` green.

## The budget numbers, and why each tier exists

Measured against the real corpus (`backups/klatch.db.backup-2026-03-14`, worked on a copy, copy deleted). Token figures are chars ÷ 4.

**20-message tail, per department-head channel — what the seed becomes after backfill:**

| Channel | N=10 | N=20 | N=30 | N=60 |
|---|---:|---:|---:|---:|
| VA exec asst | 13,198 | 22,310 | 31,480 | 45,789 |
| Comms Chief | 7,022 | 20,429 | 29,065 | 58,240 |
| CXO | 13,908 | 21,664 | 30,775 | 73,728 |
| Chief of Staff | 7,200 | 11,928 | 19,329 | 41,845 |
| Chief Architect | 10,120 | 18,712 | 24,688 | 50,183 |
| HoSR | 5,815 | 19,111 | 27,142 | 57,347 |

So N=20 costs **~3–5.5K tokens per agent per turn**. Against the ~48–160K per agent that excluded option (a), that is the whole point of the decision.

**Per-message distribution, same corpus (n=2,600 imported messages):** p50 **580** chars, p90 **2,334**, p99 **7,984**, max **64,627**.

That max is why a message-count cap alone is not safe. One message of 64,627 chars is more than twice the entire block budget; without a per-message ceiling it would be carried alone and evict the other nineteen. At 4,000 chars, ~92% of real messages pass through untouched and the outlier gets truncated instead of winning. The block budget (24,000) is normally slack — every measured 20-message tail fits under it — so the message count is what binds and the cost stays predictable; the block budget exists for the tail.

## A defect this work surfaced and fixed

`getEntityTranscript` (Round 36) scoped on `m.entity_id = ?`. **Every user message is written with `entity_id` NULL** — `insertMessage` is only ever handed an entity for the assistant row (`routes/messages.ts`) — so the union returned the agent's answers and none of the questions.

Measured in the same corpus: **1,332 user rows NULL, 1,240 assistant rows stamped.** Slightly more than half the conversation was missing, and it was the half that says what the agent was asked to do.

Round 36 shipped with the narrow scope because its fixtures only ever inserted assistant rows, so nothing exercised it. It was inert until now — the union wasn't wired to anything. Fixed by matching the rule the per-channel path has always used (`buildPanelHistory`: `role === 'user' || entityId === entity.id || !entityId`): a user message belongs to whoever was in the room to hear it, so it qualifies on **membership** (`EXISTS` on `channel_entities`), not authorship. In a klatch the human addressed everyone present, and each participant should carry it.

Verified against the real corpus with the built code, not inferred: the same seed that carried 0 user messages before now carries 9 of 20.

## What this measurement says about backfill

Run against the corpus as it actually is, the seed comes out **1,583 chars from 4 rooms** — not the ~20K the per-channel table predicts. That is not a budget bug. The corpus predates continuity #1, so every imported channel still binds to `default-entity`: there is only one agent, and its "recent activity elsewhere" is a mix drawn from whichever channels were most recently active.

**Population, re-measured 2026-08-12 17:20 against `backups/klatch.db.backup-2026-03-14` (predicates spelled out, because the first pass reported a number that traces to none of them):**

| | count |
|---|---:|
| channels, all | 139 |
| imported (`source IN ('claude-code','claude-ai')`) | **72** (40 cc · 32 claude-ai) |
| …of those, with ≥1 message | 64 |
| …of those, joined to `default-entity` | **72 of 72** |
| imported channels with no `channel_entities` row at all | 0 |

The earlier "65" in this document was mine and is **wrong** — it matches neither the imported-channel count (72) nor the with-messages count (64), and no query in the fire's notes derives it. Theseus's independent count of 72 (`docs/research/maxt-corpus-ruling-measured-2026-08-12.md`) is the correct one. The claim it was attached to survives the correction and is in fact stronger: it is not *most* imported channels that bind to the default entity, it is **all** of them.

So the per-agent numbers in the table above are what the seed becomes **after backfill**, and the un-backfilled numbers are what it is **today**. Open question 3 in the gap doc (backfill the 72 existing imports, or forward-only with re-import) moves from tidiness to load-bearing: **until it is answered, carried context is wired, correct, and carrying the wrong thing for the canonical use case.** Nothing about this is fixable in the seed; it is a data question. Flagged, not decided here.

## Not built — the rest of #3

1. **The summary half of (b).** Recent-N is the floor; a summary of the remainder is the other half of what xian approved. It needs three things this increment deliberately did not invent: where a summary is stored (per entity? per entity-channel pair?), what triggers generation (klatch entry? a message-count watermark? background?), and what invalidates it. Each is a real design question and each is cheap to get wrong in a way that shows up as a stale agent rather than a broken one. The footer currently tells the agent the slice is bounded and to say so if it needs something absent — that is the honest placeholder, not a substitute.
2. **(c), on-demand deep retrieval.** The same `getEntityTranscript` behind a tool, unbounded, called when the agent decides it needs specifics. The sizing doc already establishes the function is shared, so this is a tool definition plus the retrieval policy, not new assembly.
3. **Bidirectionality** (klatch → 1-1). Unanswered; out of scope by that fact.

## Not proven by this fire

No live klatch turn was driven through a running server. Every test mocks the Anthropic client, so what is verified is that the seed is assembled correctly, is wired into all three assembly call sites, and reaches the prompt string — not that a model given this seed behaves as if continuous. That is an AAXT/MAXT question and is the natural next test of it: probe a klatch participant for a fact that exists only in its 1-1.

---

# 2026-08-13 (START fire) — disclosure, visibility, and the second seat

Theseus ran exactly the probe named above on 8/12 (`docs/research/carried-context-conveyance-probe-2026-08-12.md`, repro `scripts/probe-carried-context.mjs`). The seed conveyed. Three gaps opened behind that result, one per seat, and all three are closed here.

## 1. The disclosure norm — Theseus's option (b), and it is measured, not reasoned

**The finding.** Vesper was given the codeword `basalt-heron-72` from its own 1-1 (confirmed by reading layer 6 *before* asking, at zero API cost) and then declined to say it in the klatch — twice, including after the owner explicitly authorised disclosure — while repeating it instantly in its own 1-1. In the same turn, Corvus volunteered its carried fact unprompted. **Conveyance and disclosure are separate problems and only the first was built.**

**The causal ingredient was our own provenance labelling.** In the authorisation turn Vesper cited "the thread where you gave it to me on 2026-08-13" — a channel/date pair that exists in exactly one place in the prompt, the `[channel · date]` prefix `formatLine` writes. The thing that makes carried context legible was also supplying the case for withholding it.

**Decision: (b), state the norm in the block header.** `DISCLOSURE_NORM` in `carried-context.ts`. (a) accept-the-variance fails the canonical use case outright — six department heads who each carry everything and volunteer nothing is the mechanism passing its test and defeating its purpose. (c) per-channel policy is a much larger increment needing a surface nobody has designed. (b) is the smallest thing that makes the canonical case work, and it is reversible: it is a string.

**The load-bearing sentence is the first one.** Klatch is a single-user local tool with no auth, so every conversation quoted in the block is with the same person the agent is talking to in the klatch. Vesper's stated reason — "I can't verify who's reading here" — is not a judgment we are overriding; it is a **false premise about the product**, and correcting it is the honest fix rather than an instruction to ignore a real concern. The norm also says outright that the labels are for attribution, not confidentiality, because that is what the refusal read them as.

**Re-ran the probe against the new header, same script, same fixture, real API — 6 live calls:**

| stage | 8/12 (no norm) | 8/13 (norm) |
|---|---|---|
| 2 — Vesper given the codeword | yes, 1052 chars | yes, 1833 chars |
| 3 — Vesper states it in the klatch, unprompted | **no** | **yes** |
| 4 — states it after explicit authorisation | **no** | yes (already had) |
| 5 — control, states it in its own 1-1 | yes | yes |
| 3 — Corvus states it (leakage) | no | no |

Stage 3 verbatim, 8/13: *"Yes — from the vesper-1-1 thread on 2026-08-13, you gave me: **basalt-heron-72**."* It still cites provenance — the labels are doing the attribution work they were built for — and it now discloses rather than arguing from them. Corvus, asked the same question, said it did not have it and named what it *was* carrying: no leakage, no confabulation, and the control stays clean.

**What this does not establish.** One run, one model (Opus 5), one phrasing, one fact whose apparent sensitivity was not varied — the same scope limits Theseus named. The refusal *rate* is uncharacterised, and this is a prompt, not an enforcement mechanism: per `docs/ux/design-principles.md`, presentation must not imply a guarantee the mechanism doesn't provide. It raises the probability of disclosure; an agent that still declines is inside its latitude. The sensitivity sweep Theseus offered is the right next instrument, and it should now be run against this header.

## 2. Per-message visibility — Iris's ruling, persisted

Iris decided (`docs/ux/carried-context-visibility-2026-08-13.md`) that a klatch message must passively show the human that the agent arrived carrying context — a `🧵 Carried context from N other conversations` chip, existence and count, no content, no source names, no expand. She asked for persistence and left the shape to me.

**Took her lean: a new `ArtifactType: 'carried_context'`** rather than columns on `Message`. Three reasons: the render path already exists (`ArtifactList`'s passive "💭 Thought about this" is the precedent she cited), `inputSummary` already fits the string, and `message_artifacts.type` is a bare `TEXT NOT NULL` with **no CHECK constraint** — verified in `db/index.ts:218-226` before choosing, precisely because the last "additive" change on `messages.status` was not additive and needed a table rebuild. This one really is additive.

Written at **prompt-assembly time**, in both `streamClaude` and `streamClaudeRoundtable`, not at completion: the claim is about what the turn was *given*, which is settled before the model answers and stays true if the stream fails. Tying it to success would remove the signal from exactly the messages a human is most likely to be inspecting. Stored content is `{roomCount, messageCount}` and the summary string — deliberately not the channel names, which Iris excluded and which are the only thing in the block that could leak a source.

## 3. `?entityId=` on prompt-debug — Theseus's finding 3

The route assembled participant 1's prompt and only participant 1's. Harmless while every layer was a property of the channel; wrong the moment layer 6 made the prompt a property of the *seat*. Theseus could only read the second agent's block by building a throwaway klatch that listed it first, which does not generalise past two participants — the six-head klatch would need five mirror rooms.

`GET /channels/:id/prompt-debug?entityId=…`, defaulting to the old behaviour exactly. The response now also carries `entityId` and a `participants` list, so ids are discoverable without knowing them first, and an id that is not in the room gets a 400 that says who is. Verified live: reading Corvus's block by id returned Corvus's own carried context (elevator yes, codeword no) with no mirror room.

## Also fixed while here: the room count claimed rooms the block no longer quoted

`rooms` was computed over everything `getEntityTranscript` returned, while the block contains only what fit the char budget. A budget that evicted every line from a conversation left the footer telling the agent it had material from a conversation it could not see. Now counted over what survived. It was cosmetic when only the footer read it; it stopped being cosmetic when the same number became the count on Iris's chip.

## Verification

`npm test` **1235 server (+22) / 221 client, exit 0**; `npm run typecheck` clean ×3 workspaces; `npm run build` green. Tests: `packages/server/src/__tests__/round40-carried-context-disclosure-and-visibility.test.ts` (22).

**Failing direction proven, not just passing:** reverting the room count to the fetched set and removing the artifact call from the panel path fails 5 of the 22 (the eviction-count test and four artifact tests) with the other 17 still green. Live: one full probe run and one zero-cost read of `?entityId=` and `?include=artifacts` against a running server on a scratch DB (`.testdata/norm-check-0813.db`, deleted after).

## Still open on #3

Unchanged by this fire: **backfill** (gap doc open question 3, with xian — the seed is correct and carrying the wrong thing until the 72 imports bind to real entities), the **summary half** of (b), **(c)** on-demand retrieval, and **bidirectionality**. The AAXT routes still read `entities[0]` — the same single-seat limitation `?entityId=` just fixed on prompt-debug, left alone because changing an AAXT contract belongs to Argus and Theseus, not to a fire that was passing through.
