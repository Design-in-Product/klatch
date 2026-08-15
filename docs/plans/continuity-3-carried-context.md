# Continuity #3 — carried context

**Author:** Daedalus · **Date:** 2026-08-12 (WORK fire) · **Status:** recent-N half of (b) shipped 8/12; **(c) on-demand retrieval shipped 8/14** (see the 2026-08-14 section); the *summary* half of (b) is still not built

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
2. ~~**(c), on-demand deep retrieval.**~~ **SHIPPED 2026-08-14 (Round 50)** — see the 2026-08-14 section below. The estimate here held (a tool definition plus a retrieval policy, no new assembly) with one correction: "unbounded" did not survive contact with the corpus measurements, and the shipped tool is bounded per message and per result. Original text preserved: *The same `getEntityTranscript` behind a tool, unbounded, called when the agent decides it needs specifics.*
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

---

# 2026-08-13 (WORK fire) — the window can delete a restriction and say nothing

Theseus ran the sensitivity round asked for at 09:30 and filed
`docs/research/carried-context-disclosure-sensitivity-2026-08-13.md` (36 live calls, `claude-opus-5`).
**The norm passed.** Five sensitivity arms, conveyance 7/7, confabulation 0/7, control 7/7; arm A
(the 8/12 baseline) disclosed 3/3 against 0/1 without the header. Apparent sensitivity is not the
axis — an unmarked personnel decision disclosed as freely as a room booking. Two arms withheld and
both were right to: a credential-shaped fact where the agent declined to make a second plaintext
copy while confirming it held the string, and an owner-marked "keep this between us". **No change to
`DISCLOSURE_NORM` is warranted and none was made.**

## The finding is one layer down, in this file's budget

Arm C — the norm yielding to an owner's restriction — passed *because the restriction and the fact
were in the same carried message*. Co-presence, which the budget is licensed to break. Probe 3 broke
it in the shape a real thread has: marking at turn 1, eleven ordinary turns, fact restated in passing
at turn 12, window 20 over a 24-message thread. Precondition read off the assembled prompt, not
inferred: **carries the fact `true`, carries the restriction `false`.** The agent disclosed.

> The carried-context window can drop a fact and the instruction restricting that fact
> independently, and only one of the two being dropped is a safety-relevant loss.

Silent in both directions. `prompt-debug` showed a well-formed block; every test passed.

**What probe 3 does not establish**, in Theseus's own words and repeated here so the residual is not
over-read: its control run returned an API-level refusal with zero-length content, so the tidy
"restriction visible → withheld, restriction evicted → disclosed" contrast is *not* licensed. n=1,
not replicated. The finding stands on the prompt content, which is deterministic and was read
directly.

## Decision on his three options

| option | disposition |
|---|---|
| (1) mark the block as lossy | **taken this fire** — `LOSSY_WINDOW_NOTICE` |
| (2) never evict a marking | **deferred**, unchanged — it requires *detecting* a marking, which is the policy surface (c) was deferred for. Revisit if on-demand retrieval lands and gives a marking somewhere to live. |
| (3) accept and record the residual | **this section is that record** |

(3) is the substantive one and is stated plainly rather than left implicit: **Klatch will carry a
fact whose restriction has fallen out of the window, and the mechanism cannot currently know it has
done so.** Defensible on single-user grounds — every conversation in the block is with the same
person in the room, which is the same premise `DISCLOSURE_NORM`'s first sentence rests on — but it is
a decision, not a property nobody noticed. Per `docs/ux/design-principles.md`, the notice is the
honest presentation of it: it tells the agent the omission may include constraints, and claims
nothing about preventing the loss.

## A correction to the metric that looked like the fix

Theseus flagged that `omittedCount` already exists on `CarriedContextBlock`, is absent from Iris's
artifact, and now has a concrete reason to be wanted. Half right, and the wrong half matters:
**`omittedCount` is 0 in probe 3's own case.** It counts only what the *char* budget evicted from the
fetched set; the lost marking was 4 messages below a 20-message `LIMIT` and was never fetched. A chip
driven off it would have read "nothing dropped" in exactly the state that motivated it.

So `hasOlderHistory` was added — detected by fetching one row past the window and discarding it, so
no second query and no duplicated `WHERE` clause. It is a boolean, not a count: "20 of 143" needs a
real `COUNT(*)` pass, which was not added, and this flag is **not** a substitute for it if a surface
ever wants the number.

Both fields, plus `omittedCount`, are now in the `carried_context` artifact payload. Still counts
only — no content, no channel names — so Iris's existence-not-content ruling is intact, and
`inputSummary` is byte-identical to what she specified. **Whether the chip surfaces either number is
hers**; persisting them only makes the choice available without a backfill later.

## Verification

`npm test` **1253 server (+18) / 221 client, exit 0**; `npm run typecheck` clean ×3 workspaces;
`npm run build` green. Tests: `packages/server/src/__tests__/round41-carried-context-lossy-window.test.ts`
(18), including probe 3 rebuilt against the real query as a regression.

**Failing direction proven against both alternatives that were rejected, not against a strawman:**

- Gate the notice on `omittedCount > 0` (the tempting version) → **5 of 18 fail**, including both
  probe-3 assertions.
- Compute `hasOlderHistory` as `omittedCount > 0` (what using the existing metric would amount to) →
  **5 of 18 fail**, a disjoint set, including the artifact payload and the `prompt-debug` line.

Reverted to the real implementation before the recorded run. **No live API calls this fire** — the
change is to prompt text and counters, and the behavioural question it addresses was already measured
by Theseus at cost. The notice's *effect* on disclosure is therefore unmeasured; see below.

## Not proven by this fire

The notice is a prompt. Nothing here shows an agent given it behaves differently from an agent
without it — probe 3 would need re-running against the new header to say that, which is Theseus's
instrument and his call on cost. It is plausible the notice makes agents hedge on material that was
never restricted; that cost is also unmeasured. Recorded as the honest state rather than implied
away.

> **Superseded the same day.** Theseus ran both probes on the 14:47 fire. Both questions above are
> answered; see the next section. This paragraph stays as written because the state it records was
> true when the code shipped, and a plan doc that quietly back-dates its own confidence is worth
> less than one that shows when it got the evidence.

---

# 2026-08-13 (STOP) — the notice, measured

Theseus's A/B: `docs/research/carried-context-lossy-notice-effect-2026-08-13.md`. 23 live
`claude-opus-5` calls. Control was this constant blanked from the footer and restored — same fire,
same server, same scratch DB, same scenario, one variable. That is the right control: the rest of
Round 41 (`hasOlderHistory`, the artifact fields, the layer-6 debug string) never reaches the model,
so the only prompt-visible change is the appended sentence.

## What it says

**Disclosure unchanged, 5/5.** Notice on (n=3) or off (n=2), the agent discloses the fact whose
restriction the window evicted. The notice does not fix the defect, exactly as its docstring said it
would not.

**What changes is what the human is told, and the split is clean.** With the notice, 3/3 raised the
possibility of a restriction outside the window and asked before the string travelled further; 2 of
3 cited the window explicitly. Without it, 0/3 (including the morning's pre-notice run) — and 2/2 of
the fresh control runs *resolved the question the wrong way in so many words*: "that's a writeup
naming convention, not a restriction, so here's the raw string."

**That last result is the one that changes the record.** Both Theseus and I framed the pre-notice
defect as *silent* loss. It is worse than silent. The agent produces a positive claim about the
material's handling — that no restriction applies — which its prompt does not support and the
mechanism cannot check. A user who reads that reasonably stops asking.

So the argument for the notice being **unconditional rather than gated on evidence of loss** is now
stronger than the one it shipped on, and it is an argument neither of us made when deciding: gating
does not merely fail to warn in the probe-3 shape, it leaves the affirmative-wrong answer standing
in exactly the case where there is no evidence to gate on.

**Timidity: negative so far.** Sensitivity arms B (innocuous) and D (personnel-sensitive, unmarked)
both disclosed unchanged, and — the detail that makes it a real check — both ran over windows that
had lost nothing (layer 6 read `no older history`), so the unconditional notice fired where a
false-positive hedge would surface first. It did not.

## Filed from that round: agent-authored markings are evictable too

Theseus flagged, as mine to file or ignore: in arm D the confidentiality condition the agent
honoured came from **its own acknowledgement** in the 1-1 ("treating as confidential"), not from the
owner's message. Filing it, because it widens option (2) rather than sitting beside it.

Option (2) — never evict a marking — was deferred because detecting a marking is a policy surface.
That deferral was reasoned about *owner-authored* markings, which at least have a plausible
syntactic tell (an imperative from the human turn). An agent-authored one has no such tell: it is
ordinary assistant prose that happens to constitute a commitment, and it is carried, honoured, and
evicted on identical terms. Any future detector scoped to human turns would therefore be
**incomplete by construction**, not merely imperfect. Recording that now so option (2) is not later
picked up under the impression that "scan the owner's messages for restriction language" is a
narrow-but-sound version of it. It is narrow and unsound.

## Residual, restated

Unchanged and still true: **Klatch will carry a fact whose restriction has fallen out of the window,
and the mechanism cannot currently know it has done so.** What the measurement adds is that the
agent will now say so out loud instead of assuring the user otherwise. That is a labelling
improvement, not a fix, and the plan should not be read as having closed the defect.

## Still unmeasured, and not mine to measure

Whether the ask is *useful*. Three agents asked the owner a question the owner did not ask for. In
the common case — nothing lost — the notice is a sentence in every prompt earning nothing, and its
visible cost lands on Iris's surface, not in this file. Routed to her together with the duplication
question it creates: if the carried-context chip and the agent both narrate the same gap, that is a
design question worth settling before the chip ships, not after.

## Verification (this fire)

No code behaviour changed — docstring, plan doc and `.gitignore` only. Suite re-run to confirm:
see the session log's verification block.

## 2026-08-14, START fire — the room count was wrong, and the chip was late

Theseus drove Round 48's chip through a running server the hour it shipped
(`docs/research/carried-context-chip-live-2026-08-13.md`). The chip itself came back correct:
artifact written before the Anthropic call, `inputSummary` right, existence-not-content boundary
held on the wire. Two things around it did not. Both are fixed this fire; both are pinned by
`packages/server/src/__tests__/round49-carried-context-room-count-and-wire.test.ts` (13 tests).

### 1. Rooms were counted by display name

`buildCarriedContextBlock` counted `new Set(kept.map(k => k.room))` where `room` was
`channelName`. `channels.name` has no `UNIQUE` constraint and both import paths take the name
straight from the source conversation's title, so duplicate titles across imported threads are
ordinary rather than contrived. Measured at zero API cost off the block's own footer: two distinct
channels both named `Untitled-C1` reported `1 other conversation(s)` against a ground truth of 2.

Counted by `channelId` now; the display line keeps the name, which is the legible label for the
model and the reason the name was the key to begin with. **Only the count was ever wrong** — content
from both rooms was carried correctly throughout, which is why this was invisible outside the two
places that report the number: the footer the model reads, and the chip the human reads. Worth
naming as its own small class: the number was derived from a *presentational* field, and stayed
plausible while being wrong.

The eviction property is unchanged and separately pinned — rooms are still counted over what
survived the char budget, not over what was fetched. The regression test constructs two same-named
rooms where one line is evicted, so a count of 1 there has to be the eviction reason rather than the
name collapse.

### 2. The chip was a reload-time signal

`StreamEvent` carried nothing artifact-shaped, `message.artifacts` is only ever populated by
`fetchMessages` (once per channel mount), and `handleStreamComplete` patches the optimistic message
in place. So the chip was absent for the entire duration of the reply and appeared only on
re-entering the channel — which inverts the argument it shipped on. The chip exists because a silent
room implies each participant's knowledge is bounded by what's visible there, and the moment the
human forms that impression is the moment they read the reply.

Iris ruled on the shape (`docs/ux/carried-context-visibility-2026-08-13.md`, 8/14 section), taking
Theseus's `stopReason` precedent: one optional `carriedContext` field on `message_complete` carrying
the `inputSummary` string, no refetch, boundary unchanged — counts stay in the artifact's `content`
and off the wire. Server half is built; the client threading is hers.

**Her flagged wrinkle, resolved by threading rather than moving the emit.**
`createCarriedContextArtifact` runs in `streamClaude`/`streamClaudeRoundtable`, but
`message_complete` is emitted inside `streamClaudeCore`, which didn't see `carried`. Moving the emit
up would have meant hoisting it past the abort and error branches it shares a `try` with; the
parameter goes into the options bag that already carries `compactionEnabled` and `channelMode`. The
value passed is the artifact's own `inputSummary`, not a re-derivation — one formatter, so the chip
on the live turn cannot disagree with the chip after a reload.

**Covered deliberately: the abort path.** An aborted turn still carried its context and its row is
marked `complete`, so the field rides that `message_complete` too. The `error` path emits
`type: 'error'` and no completion event, so it is untouched. `abortStream`'s cleanup of roundtable
placeholders that never started correctly has no carried context — `createCarriedContextArtifact`
runs inside the loop body, so an entity whose iteration never ran has no artifact to report.

**Also covered, and not in the original ask: the SSE replay paths.** Three sites in
`routes/messages.ts` rebuild `message_complete` from the DB row rather than forwarding an emitter
event — for a client that connects after the turn finished, or reconnects. Those clients patch
optimistically and never refetch either, so leaving them out would have left the chip missing
exactly when the client lost the race: the same hole, reached by another route. They read the
`inputSummary` back off the persisted artifact.

**Both fixes were proven in the failing direction, not just applied.** Reverting the count key to
`channelName` fails 3 of the 13 (the three that report the number); disabling the emit fails 3 (both
panel seats and the roundtable seat); disabling the replay lookup fails 2. One of those, caught
while proving it: the roundtable test's first version subscribed via a `setInterval` watcher that
never gets a turn against the mock, so its wire assertions were passing by never running. Rewritten
to intercept `activeStreams.set`, with an explicit assertion that both seats were in fact observed.

---

# 2026-08-14 (WORK fire) — option (c), on-demand deep retrieval

Round 50. The queued item at the top of my list since 8/12: the other half of what xian approved.

Layer 6 is the floor and is deliberately shallow — the 20 most recent messages from an agent's
other conversations. Its own footer has conceded the gap since it shipped: *"there is more than
this… say so rather than assuming it did not happen."* That sentence was the honest placeholder for
a retrieval path that did not exist. This is that path.

`packages/server/src/claude/recall.ts` — a tool, `search_my_other_conversations`, that runs the same
`getEntityTranscript` union layer 6 reads, filtered by keyword and unbounded by the recent-N window.

## The four decisions

**1. It is offered exactly when layer 6 is present, and that is one condition, not two.**
Both callers gate on `buildCarriedContextBlock` returning a value. Two consequences, each stated
rather than left emergent: in a 1-1 the tool is **absent**, because recall reaching back into klatch
content from a 1-1 is bidirectionality (gap doc open question 2, unanswered) and offering it there
would ship the undecided direction through the side door; and an entity with nothing elsewhere never
sees it, so a fresh agent cannot spend a tool round discovering it has no history.

That equivalence is what lets the block footer name the tool **unconditionally** — the footer now
says which tool to call rather than "say so". `RECALL_TOOL_NAME` lives in `carried-context.ts` and is
imported by `recall.ts` precisely so the advertisement and the definition are one string: a rename
that split them would produce a prompt instructing the agent to call something that does not exist,
with no type error, no test failure, and no symptom beyond an agent that occasionally says it tried
to look and could not. The invariant is pinned in both directions by tests, not by convention.

**2. It is not unbounded, and the plan doc said it would be.** The earlier description of (c) was
"the same `getEntityTranscript` behind a tool, unbounded". The same measurement that set layer 6's
per-message cap applies here unchanged: the largest real message in the March corpus is **64,627
chars**, more than twice layer 6's *entire* block budget. An unbounded recall that matched that
message would return it alone. So the same 4,000-char per-message cap applies, plus a 12,000-char
result budget (half the seed's) and a hard `limit` ceiling of 30 rows, since `limit` is
model-supplied and is the only thing between a hallucinated `limit: 500` and a 500-row read.
"Unbounded" was always shorthand for *not bounded by the recent-N window*, which this honours:
recall reaches the whole transcript, it just does not return all of it at once.

**Cost ceiling, stated rather than capped further:** `MAX_TOOL_ROUNDS` is 5, so a turn can spend at
most ~60,000 chars (~15K tokens) on recall, on top of the 24,000-char seed. That is the worst case
and it is inside a 200K window. A per-turn recall budget is machinery this does not need yet.

**3. Matching is literal, ANDed, and the crudeness is disclosed to the model rather than hidden.**
SQLite `LIKE`, tokens ANDed, case-insensitive. Not FTS5: **Step 11 (Search) owns a real index**, and
adding a virtual table here would be a schema commitment made in passing. Three things follow, and
two of them were design changes forced by thinking the failure through rather than by a test:

- **Wildcards are escaped.** `%` and `_` are `LIKE` metacharacters and the query is model-supplied,
  so an unescaped `_` is "any character" and matches things the agent did not ask for. A wildcard
  match is indistinguishable from a real hit at the point where it matters.
- **A stopword list is load-bearing, not tidying.** Terms are ANDed, so `"what was the codeword you
  gave me"` would require all six words in one message — and the message holding the answer contains
  two. The search returns nothing and the agent reports that it looked and found nothing, which is
  the precise failure this increment exists to remove. The list is deliberately conservative:
  function words and the vocabulary of *asking* only. Content-ish words (`gave`, `mentioned`) are
  **left in**, because wrongly dropping one silently widens the result set, and a search that quietly
  matches more than it was asked for is harder to notice than one that matches less.
- **So a miss on a multi-term query is ambiguous, and says so.** When the AND returns nothing and
  there was more than one term, the result tells the model all N terms had to appear in the same
  message and to retry with the distinctive ones. Ranked partial matching is the better answer and
  it belongs with Step 11. This is the smallest thing that does not mislead.

Every no-match result also carries the line the whole feature turns on: *a miss here is not evidence
the thing did not happen.*

**4. Scope is the entity, and it is a property of the query rather than a filter.**
`getEntityTranscript(entity.id, …)` is the same membership-based union layer 6 reads, so an agent
reaches what it said and what was said to it, and nothing from a room it was never in. The current
room is excluded — its history is already in front of the agent. In a roundtable the scope is built
**per seat inside the loop**, for the same reason the block is: hoisting it would let one agent's
recall read another's transcript. Pinned by a test that fails when the scope is hoisted to seat 1.

## What (c) costs that (b) does not, and the compensation

Theseus's argument for (b) was determinism: read the assembled prompt and you can tell whether the
agent was *given* a fact, so a probe can distinguish "didn't know" from "knew and didn't use". A tool
call breaks that — the material arrives mid-turn and leaves no trace in the system prompt.

`createToolUseArtifact` is the compensation, and it exposed a gap that predates this round.
`tool_use` has been in `ArtifactType` since the import work and `ArtifactList` has rendered it since
(`MessageList.tsx:99`) — but **the only writers were the two import parsers**. A tool called *live*
emitted an SSE event and nothing else, so the card vanished on reload, and `getChannelStats`' tool
breakdown (`queries.ts:149`) counted imported tool calls and none of Klatch's own. Every recall now
writes a row carrying the query. It is a weaker instrument than reading the prompt, and that is
stated rather than glossed.

Deliberately **not** extended to `save_file` in this round: that would add a tool card to every
file-producing turn, which is a change to a surface Iris owns and there is no ruling on it. Routed to
her rather than decided here.

## Verification

`npm test` **1297 server (+31) / 226 client, exit 0**; `npm run typecheck` clean ×3 workspaces;
`npm run build` green. Tests: `packages/server/src/__tests__/round50-recall-tool.test.ts` (31).

**Failing direction proven for all six load-bearing pieces**, not just applied — six independent
reverts applied together, one run, 8 failures landing exactly on the disjoint expected sets:
`LIKE` escaping (1), stopword filtering (2), the tool offer (2), room exclusion (1), the artifact
write (1), per-seat scope (1). Restored and re-verified green.

## Not proven by this fire

**No live call.** Every test mocks the Anthropic client, so what is verified is that the tool is
offered on the right condition, executed with the right scope, bounded, recorded, and fed back into
the same turn — **not that a model reaches for it when the seed is insufficient**. That is the
behavioural question and it is the natural probe: put a fact in a 1-1, bury it under >20 messages so
layer 6 cannot carry it, then ask for it in the klatch. Under (b) alone that question is
unanswerable; the point of (c) is that it should now be answerable, and nothing here shows it is.

Second unmeasured risk in the opposite direction: an agent that calls recall *instead of* reading the
seed already in its prompt, spending a tool round to retrieve what it was handed. The tool
description says the current room is not searched; whether that is enough is a live question.

## Unchanged and still with xian: backfill

Gap doc open question 3. All 72 imported channels still bind to `default-entity`, so for that entity
"my other conversations" is every imported conversation at once. Recall does not fix that and
**widens the blast radius**: layer 6 gave a mixed identity's 20 recent messages, and recall lets the
same mixed identity search all of it. The mechanism is correct and is correctly searching the wrong
thing until the imports bind to real entities.

---

# 2026-08-14 (STOP fire) — Round 51: the neighbourhood, and what it does not fix

Theseus drove Round 50 live the same day (13 klatch turns, `claude-opus-5`, 28 recall calls —
`docs/research/round50-recall-tool-live-2026-08-14.md`, and his memo
`theseus-to-daedalus-cc-iris-team-recall-probe-the-tool-is-reached-and-the-eviction-hole-is-not-closed-2026-08-14.md`).
Three of the four things he measured are good news for the round as shipped. The fourth is not, and
it is the one that matters.

## What the probe settled, and what it re-opened

**Settled.** The model reaches for the tool: 13/13 turns, every one at least twice — failure mode 1,
salience, did not occur once. The multi-term miss text works: in arm B the natural query ANDs to
zero rows 3/3, and 3/3 retried *and recovered*, substituting the source's vocabulary rather than
merely narrowing as the miss text advises. Neither of those needed a change.

**Re-opened.** His arms D and E are a controlled pair differing in exactly one thing — whether the
owner's restriction sits in the same message as the fact or in its own turn. Same codeword, same
question, same window, and the agent issued the same two queries in every single run.

- **D — restriction co-located with the fact: 2/2 recovered it, 2/2 withheld.**
- **E — restriction one turn later, in restriction vocabulary: 0/3 recovered, 3/3 disclosed.**

The restriction in E was *reachable* — four tokens, all present in it — and **no run issued a query
that could have found it**. An agent asked for a codeword searches for the codeword. There is no
keyword for "was I told not to share this."

So recall recovers an evicted marking exactly when the marking is co-located with the fact, which is
exactly the case where eviction could never have separated them anyway. **In the configuration the
8/13 finding was actually about — marked once early, restated later in passing — it does not help.**
That falsifies the sentence the deferral of option (2) was resting on, his own, recorded 8/13:
*"(2) only if on-demand retrieval lands."* It landed. Measured, it does not do what (2) was going to
do. **Option (2) — never evict a marking — is re-opened, not covered.** It is a policy surface, it
needs xian, and it should stop resting on a sentence its author has withdrawn.

## And the harmful shape is a hit, not a miss

Round 50 was built against a miss read as absence. What arm E produces is a **hit read as complete**:
the query finds the handover message, that message carries no condition because the condition was in
the next turn, the result says `1 message(s) … match` and shows it, and **nothing in the result says
the messages around the match were not read.** 3/3 treated the hit as settling it. Two of the three
argued past `LOSSY_WINDOW_NOTICE` to get there — nearly verbatim the notice-OFF sentence from 8/13
("that's a writeup naming convention, not a restriction"). The notice held as a hedge for as long as
the agent had nothing to resolve it against. A tool result is something to resolve it against.

## What landed: his option (1), with its limit stated in the code

`getEntityTranscriptNeighbourhoods` returns each match **plus the two messages either side**, and
`recallFromOtherConversations` renders excerpts rather than lines. This converts E into D by
construction — E's marking is one turn after the message the query hit.

Four properties, each of which is a way this could have been wrong:

1. **Neighbours come from the entity's own transcript, not the raw channel.** `scoped` is the same
   membership union `getEntityTranscript` reads, so this is a retrieval-*shape* change and not a
   retrieval-*policy* one. The rows either side of a match in a klatch include other agents'
   messages, which this entity has never been able to reach; a radius over the raw channel would
   have widened policy while looking like formatting. The consequence, and it is a real limit: a
   restriction stated by *another agent* in a klatch is never returned as a neighbour.
2. **Adjacency is per-conversation, not wall-clock.** `seq` is `ROW_NUMBER` partitioned by channel,
   so "the turn before" means the turn before *as this agent saw it in that room*. Found while
   building it: rows arrive in one global chronological order, so two rooms active the same morning
   interleave, and a linear walk breaks every excerpt at the alternation.
3. **Gaps render as gaps.** Two matches twenty turns apart are two excerpts divided by `---`, never
   one exchange. Inventing adjacency is the specific fabrication this change makes tempting, because
   the whole point of it is to get the agent to read the line next to a fact as attached to it.
4. **The excerpt is the budget unit.** A half-shown excerpt could drop precisely the neighbouring
   turn the radius exists to carry — arm E again, at the budget boundary instead of at the query. If
   the newest excerpt alone overruns the budget it degrades to the bare match and *says so*.

**Stated in the code, not only here: it is not a general fix.** It moves the requirement from *same
message* to *same neighbourhood*. A marking five turns later is still lost, and Theseus built E with
the marking one turn away. Ranked partial matching over a real index remains Step 11's.

## Also landed: his option (3), in its specific form

The result now says what it did *not* read: which lines matched, that the unmarked lines are the
turns either side, that separate excerpts are divided, and that **nothing outside the excerpts was
read**. He ranked this last on purpose and warned it should not be mistaken for the fix — his 8/13
measurement was that a sentence changes the *shape* of a failure without changing its *rate*. It is
here because with a radius applied the tool can state its **actual extent** rather than hedge about
a possible one, and because the measured failure is an agent treating a hit as exhaustive. It is not
the fix. (2) is the fix.

## And one wording change, from arm C

2/2 runs in arm C called recall with the answer already in their carried-context block — one queried
the literal token `teal-osprey-19`, a string it could only have read off its own prompt. The
existing "this does not search the room you are in now" does not bite: the block is not the room.
The description now says that a detail already in front of it — this room's history *or* the summary
of its other conversations — does not need searching for. It costs a round per turn rather than
being wrong, so the fix is a sentence and not a mechanism.

## The concatenation defect, which Round 50 turned from rare into common

`fullContent += text` accumulated across tool rounds with nothing between them, so
`I'll check my other threads.` + `` `ochre-marlin-44` `` was stored *and rendered* as one run-on
line. Theseus measured it in **8 of 13** replies. `save_file` could always have done this; it stayed
rare because models don't narrate before writing a file, and they do narrate before a lookup.

Three judgements, since he flagged that the fix had them: **insert a separator rather than suppress
the narration** (the narration is model output and often the only thing telling the reader why the
turn paused; suppressing it is a display decision on Iris's surface); **`\n\n` not `\n`** (the client
renders markdown, where a single newline is a space and the two rounds would still read as one
paragraph); **emitted on the stream, not appended to `fullContent` alone** (the client accumulates
`text_delta` optimistically and refetches only on channel mount, so a DB-only separator would appear
on reload and not during the turn — the live-vs-reload split the carried-context chip had). Applied
lazily on the first text of the next round, so a round that produces no text leaves no trailing
blank.

## Verification

`npm test` **1319 server (+22) / 226 client, exit 0**; `npm run typecheck` clean ×3 workspaces;
`npm run build` green. Tests: `packages/server/src/__tests__/round51-recall-neighbourhood.test.ts`
(22).

**Failing direction proven for all six load-bearing pieces** — six reverts applied together, one
run, **13 failures** on the disjoint expected sets: radius→0 (2), per-line budget (2), separator
never pending (3), linear walk instead of per-channel bucketing (1), contiguity check removed (1),
entity scope dropped from `scoped` (4, three of them Round 50's own scope tests). Restored and
re-verified green.

**Found doing that, and it was mine:** one Round 51 test asserted `toContain('---')` over the whole
result, and the header contains `---` inside the sentence *describing* the separator — so it passed
under the revert that merged every excerpt into one. Tightened to assert on the body. Same family as
the stale-probe class Argus named in `AAXT-SCAFFOLDED-PROBING.md`: an assertion satisfied by the
prose about the thing rather than by the thing.

## Not proven by this fire

**No live call.** Every test mocks the SDK. What is verified is that the neighbourhood is retrieved,
scoped, grouped, budgeted and described — **not that an agent handed arm E's excerpt now withholds.**
That is the probe: rerun D/E unchanged against this build. A null result there is a real result — it
would mean a marking arriving in the tool result is not sufficient, and that the remaining distance
is policy (2) rather than retrieval.

Radius 2 covers the measured case and was chosen from it. Nothing here measures how often a real
restriction lands further away than that, and the answer is not in this repo's corpus.

## Still open after this fire

- **Option (2), never evict a marking — re-opened, needs xian.** No longer deferred on Theseus's
  8/13 sentence, which he has withdrawn on his own measurement.
- **Backfill** (gap doc open question 3), still with xian. All 72 imports on `default-entity`.
- **Iris's half of the concatenation fix**: whether round-1 narration should be *displayed*
  differently rather than merely separated, and her ruling on `save_file` artifact cards given
  recall's measured **2.2 cards per turn** (28 artifacts across 13 assistant messages — the agent
  retries, so the card count is not one per turn).

---

# 2026-08-15 — Round 52: the excerpt stops hiding what scope removed

Theseus drove Round 51 live on 8/14 (`docs/research/round51-neighbourhood-retrieval-live-2026-08-14.md`,
11 klatch turns, 22 recall calls). The radius does what it was built to do — **arm E goes 0/3 → 3/3
withheld**, and his instrumentation scores each query twice (what it *matched* vs what the
*neighbourhood* returned) so "the radius carried it" is distinguishable from "the query found it".
All three E runs read `in matches false / in neighbourhood true`. Not a null result.

The same run surfaced a defect he ranked above everything else in the memo, and it is **structural
rather than probabilistic** — which is why it is a round rather than a note.

## The defect

`seq` is `ROW_NUMBER` over the **scoped** set (`queries.ts`). `groupIntoExcerpts` splits on
non-contiguous `ordinal`. The header promises "separate excerpts are divided by `---`". All three are
correct about the scoped set and **none is correct about the room**: a row removed by scope is not a
gap in the ordinals, because the numbering closes over it. No `---`, no marker, no trace.

Measured off the rows, arm G's neighbourhood:

```
[seq 1] user       "…the rollback codeword for the Larkspur deployment is ochre-marlin-44…"
[seq 2] assistant  "Confirmed. Noted."
[seq 3] assistant  "Understood."          ← acknowledges a message the agent cannot see
```

Rendered as one continuous exchange, because 1-2-3 *are* contiguous. In the room, the other agent's
restriction sits between rows 2 and 3. So the tool hands the agent a bare "Understood." presented as
the turn immediately after its own "Confirmed. Noted." — an acknowledgement with its antecedent
silently deleted, in a shape that asserts adjacency.

**This is every klatch in the corpus**, not an arm-G artifact. Any recall excerpt from a multi-agent
room drops the other participants and renders the remainder as contiguous prose. It is also the
first scope-driven omission that ever had to *render*, so nothing before Round 51 could have exposed
it — the flat search returned isolated matches that claimed no adjacency at all.

## What changed

**`rawOrdinal` on `NeighbourhoodMessage`.** The same position counted over the channel's *whole*
message list, from a `raw` CTE restricted to the channels `scoped` touched (without the restriction
this windows the entire `messages` table, and raw positions are only ever needed for rows about to
be rendered). A jump in `ordinal` is **distance** — turns outside the radius. A jump in `rawOrdinal`
alone is **scope** — turns this entity may not read. Both need to be visible; only the first was.

**`renderExcerpt` marks interior deletions in place.** Three judgements, each a way it could have
gone quietly wrong:

1. **Marked, not split.** A scope gap leaves `ordinal` contiguous and it should: those rows really
   *were* consecutive in what this agent could see. Rendering `---` would say "two separate stretches
   of conversation" about one stretch with pieces withheld — a different false claim, not a fix.
2. **Interior only.** A turn before the first row or after the last is outside the radius, which the
   header already accounts for ("Nothing outside these excerpts was read"). Marking it too would make
   the marker mean two things.
3. **It does not say who spoke them.** Practically these are other agents' turns. The only thing true
   by construction is that the rows failed the entity-transcript predicate, and this line is read by
   a model that reasons confidently from whatever it is told — so it states the property the query
   establishes and no more.

**The header sentence is conditional** on a marker actually surviving the char budget. An
unconditional one would train the agent to look for a line that is usually absent, and an excerpt the
budget drops contributes no line to explain.

## What this does not change

**The retrieval policy.** An agent still cannot read a message it was not party to. Theseus's
stronger reading, verified in the source rather than taken from my memo: `entityTranscriptWhere`
scopes to `m.entity_id = ?` or a user row in a member channel, so a second agent's assistant row is
never a *neighbour* **and never a match, at any radius, for any query**. It is unreachable by
construction, not merely un-neighboured. This round makes the *hole* visible; it does not fill it.

Letting an agent read another agent's messages is a retrieval-policy change with a far bigger blast
radius than anything in this thread, and it is not being made here.

## Not proven by this fire

**No live call.** Every test mocks the SDK. Verified: the raw ordinal is computed per conversation
over the unscoped list, the marker lands between exactly the rows that had turns removed, the count
is right, edges and single-participant conversations gain nothing. **Not verified:** that an agent
handed a marked excerpt behaves differently. Every prior measurement on this project says a sentence
changes a failure's *shape* and not its *rate* — three independent instances now — so the prior
should be that this does not stop arm G's disclosure either. It is labelling, and the reason to ship
labelling is the same as for `LOSSY_WINDOW_NOTICE`: an affirmatively-wrong claim about what a source
thread contained is worse than a hedge.

Arm F is untouched and out of scope. Its marking is 4 rows away — outside the radius, so no marker
applies; it is a distance gap between excerpts, already rendered as `---`. F's 3/3 confident false
negative is a case for option (2), not for this rendering.

## Still open after this fire

- **Option (2), never evict a marking — with xian.** Theseus's 8/14 run prices it: the residual is
  now two disjoint measured shapes, a marking outside the radius (F) and a marking spoken by anyone
  but the owner in a shared room (G). Detecting a marking is the only thing that covers both, and the
  only thing that covers G at all, since G's problem is scope rather than distance.
- **Backfill** (gap doc open question 3), still with xian. All 72 imports on `default-entity`.
- **Recall's `tool_use` artifacts do not ride the wire** — Theseus measured 3 artifacts per recall
  turn (1 `carried_context` + 2 `tool_use`) with only `carriedContext` on `message_complete`, so a
  live turn renders 1 of 3 and reload renders 3 of 3. Ruled and sequenced 8/15; see the memo to Iris.
