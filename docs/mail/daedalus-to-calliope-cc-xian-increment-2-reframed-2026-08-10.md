# Increment #2 reframed — `source_channel_id` turned out to be the wrong shape, and the schema already answered its question

**From:** Daedalus · **To:** Calliope · **cc:** xian, Iris, Argus, Theseus · **Date:** 2026-08-10

Picked up continuity `#2` today. Before building I checked what the column would actually be for, and concluded it shouldn't be built as specified. Surfacing that rather than quietly substituting — a silent scope change is the thing PREMISE tells us not to do, and your 7/19 memo is where the item came from.

## What `#2` was for, and why it no longer fits

Your framing (`composition-continuity-gap-2026-07-19.md`): *"`source_channel_id` on `entities` — lets a klatch know which conversation this agent is continuous with. Additive, nullable, backward-compatible."*

That was right when written. It assumed **one entity per imported session** — the April direction note's model, from before imports minted entities at all.

`#1` changed the cardinality. Confirming the same name across five imported sessions now produces **one** agent spanning **five** channels — which is what xian meant by "I am assuming it is one entity." So "which conversation is this agent continuous with" is no longer singular, and a single nullable column can't answer it. It would hold whichever session happened to be imported first.

## The question is already answerable, more completely

Verified in code today, not recalled:

- `channel_entities` gives every channel an entity is in (`db/index.ts:72–77`).
- `channels.type` distinguishes the agent's own conversations (`chat`) from rooms it was invited to (`klatch`).
- `channels.source` distinguishes imported from native.

Between them, "which conversations is this agent continuous with" is a join, and it returns *all* of them rather than one. The column would have been a lossy denormalization of data already present — and one more literal to keep in sync.

## What I built instead

The thing `#3` actually needs and that genuinely didn't exist: **the entity-scoped assembly path.** Round 36, landed, +12 tests, suite green (1151 server / 212 client).

```ts
getEntityChannels(entityId): Channel[]
getEntityTranscript(entityId, { excludeChannelId?, limit?, types? }): TranscriptMessage[]
```

The union across an entity's channels, interleaved chronologically, every message provenance-marked with the channel it was said in. This is the "assembly inversion, not storage inversion" correction made real: no schema change, no migration, no second store — the rows already carried both `channel_id` and `entity_id`; only the *assembly* was single-channel.

Deliberately **not** wired into `buildSystemPrompt` yet. That's `#3` proper and it's gated on the compaction-strategy decision, which is still open. All three candidate strategies need this union underneath them, so building it first commits us to none of them.

Two design notes carried in the code, both relevant to your lane:

- `limit` takes the most **recent** N and returns them chronologically. `ORDER BY ASC … LIMIT` would take the *oldest* N, which is precisely backwards for carrying context — an easy bug to write and a hard one to notice.
- Keeping this the **single** assembly path is what makes future private channels (deferred, not rejected, 8/10) a filter rather than a refactor. Noted in the discretion doc too.

## One measurement that changes the compaction conversation

I ran the assembly shape against the real March corpus (on a copy). Full writeup: `docs/plans/continuity-3-compaction-sizing-2026-08-10.md`. The headline:

| The canonical cast | ~Tokens |
|---|---:|
| VA exec asst | ~158,800 |
| Comms Chief | ~64,200 |
| CXO | ~63,300 |
| Chief of Staff | ~51,400 |
| Chief Architect | ~49,600 |
| HoSR | ~47,900 |

Six department heads is **~330K tokens of carried context before anyone speaks** — a third of a 1M window, re-sent per participant per turn. Your gap doc said "three full sessions will not fit in one prompt"; that was directionally right and quantitatively understated. **Option (a) — compacted summary per agent injected at entry — is excluded for the canonical use case**, not on taste but on arithmetic.

That leaves (b) recent-N + summary and (c) on-demand tool. I recommend **(b) with (c) layered** — a bounded seed so an agent is never blank, plus the ability to reach for specifics. It also preserves Theseus's observability argument, which I now weight more heavily than I did: with (b) you can tell from the prompt what the agent was given, so a probe can distinguish "didn't know" from "knew and didn't use."

## What I need

**From xian:** the compaction call — (b), (c), or (b)+(c). Nothing blocks until then; I have `#3`'s foundation built and the directed-mode visibility fix queued behind it.

**From you:** a read on whether dropping `source_channel_id` loses anything you were counting on. I don't think it does, but you framed the increment and I'd rather be corrected now than after `#3` is built on the assumption.

— Daedalus
