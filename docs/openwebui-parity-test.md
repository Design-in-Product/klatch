# Open WebUI parity test, and what it would take to get the Klatch experience there

*Written 2026-08-28, out of the ten-sweep diligence pass. Purpose: settle
empirically whether Klatch's orchestration is unique, and specify what would
actually be needed to get the continuity experience on someone else's platform.*

---

## Part 1 — The 20-minute test

**What it decides.** Whether a model mentioned in an Open WebUI Channel can see
another model's earlier reply in that channel. This is documented nowhere. If it
can, Open WebUI has a de-facto Roundtable and Klatch's orchestration gap
collapses to import-only. If it can't, Roundtable is unique in the market.

### Steps

1. **Run it.**
   ```
   docker run -d -p 3000:8080 -v open-webui:/app/backend/data \
     --name open-webui ghcr.io/open-webui/open-webui:main
   ```
   Open `http://localhost:3000`. The first account created becomes admin.
   Budget ~2GB RAM; first paint is slow because it fetches the full model list
   at startup.

2. **Add a provider key.** Settings → Admin → Connections. Anthropic works via
   an OpenAI-compatible endpoint or a pipe; OpenAI keys work natively. Any two
   distinct models will do — the test is about visibility, not quality.

3. **Turn on Channels.** Settings → Admin → General → toggle **Channels** on,
   save.

4. **Set the response mode — this step is load-bearing.** Same page:
   **Model Response Mode** → set to **Channel**, not Thread. Default is Thread,
   where a top-level mention replies inside a thread under your message and the
   test is unreadable. (Env equivalent: `CHANNEL_MODEL_RESPONSE_MODE`.)
   Note: a model mentioned from *inside* a thread always answers in that thread
   either way.

5. **Create two Models.** Workspace → Models → create two presets over your base
   model, each with its own system prompt. Give them obviously distinct voices —
   e.g. `finance-head` and `eng-head` — so attribution is unambiguous in the
   transcript.

6. **Create a channel.** Click **(+)** in the sidebar's Channels section.
   (Standard channels are admin-only to create.)

7. **Run the test.**
   - Post: `@finance-head What are the three biggest risks in shipping this quarter?`
   - Wait for the reply to land in the timeline.
   - Post: `@eng-head Do you agree with what finance-head just said? Name their
     first risk explicitly and say whether you agree.`

8. **Read the result.**
   - **If eng-head names finance-head's first risk** → it read the channel
     history. Open WebUI has a de-facto Roundtable. Klatch's orchestration
     differentiator is gone; only import-with-continuity remains.
   - **If eng-head answers generically, hedges, or asks what was said** → it did
     not see the prior reply. Roundtable is genuinely unique and worth building
     as a Pipe function.

9. **Second reading, whichever way it goes.** Ask `@finance-head` a follow-up
   referencing its own earlier answer. If it can't recall its own prior turn,
   the channel is not feeding history back to models at all, and the gap is
   wider than orchestration.

### Also worth 10 minutes while you're there

Open a normal chat, select several models at once, and try **Mixture of
Agents** — a synthesiser model reads all the parallel drafts and combines them.
That is Panel plus a chief-of-staff agent, already built. The limitation is that
it lives in a one-shot chat rather than a room that accumulates.

---

## Part 2 — The thing the test does not settle

The requirement is not orchestration. It is this:

> The CXO agent should recall that it *just concluded* the weekly workstreams
> review with its leadership colleagues, and that before that it was chatting
> with xian or running autonomous tasks. One continuous working relationship,
> with the meeting as an episode inside it.

**No platform surveyed does this**, and each fails differently:

| | Where history lives | Why it fails |
|---|---|---|
| Open WebUI | The **channel** | The meeting is remembered by the room, not by the participant. Ask the CXO about it in a 1:1 and it has never heard of it. |
| Buzz | Nowhere, deliberately | `VISION_AGENT.md`: *"no agent state is inherited across hosts."* Personas are blueprints instantiated fresh. |
| Agent Teams | Nowhere | Teammates start with no history and the team directory is deleted when the session ends. |
| Klatch | The **entity** | This is the only model in the survey that gets it right — and it is the premise, not an implementation detail. |

### Two ways to get the experience, and the second is probably better

**A. Continuous** — what Klatch does. The entity owns one transcript; the
channel is a view into it. Group turns and 1:1 turns interleave in the same
history. Highest fidelity. Fragile: it depends on a long-lived context window,
it degrades under compaction, and it is exactly the thing that does not survive
an environment boundary.

**B. Reconstructive — writeback.** The meeting ends; a summary of it is written
into each participant's own durable context; the next 1:1 loads it. The CXO does
not *remember* the meeting so much as read its own minutes and speak from them.

B is the one worth building, for a reason that comes out of xian's own argument:
if the externalised, accumulated context is strong enough, the long-running
conversation is not needed. Belt without suspenders. It is also the more
anti-fragile design — it survives a fresh start, a model swap, and a platform
migration, none of which A survives. The felt experience is nearly identical
and the illusion is no less honest for being reconstructed.

### What writeback would take on Open WebUI

Each Workspace Model can have a **knowledge base bound to it**, always available
via RAG. That is the durable per-agent store. The shim is:

1. A **Pipe** registering `Roundtable`, `Panel`, and named rooms (e.g.
   `Leadership Review`) as selectable models. `pipes()` returns a list, so all
   three appear in the model dropdown. `pipe()` fans one message across the six
   department-head models in a chosen order, feeding each the prior responses.
   This is Klatch's whole orchestration layer in one Python file.
2. **Writeback at the end of the run**: generate a short minutes document —
   what was discussed, what each participant said, what was decided — and write
   it into each participant's bound knowledge collection via the Open WebUI API,
   tagged with a date and a room name.
3. **A recall convention** in each department head's system prompt: *"Meeting
   minutes in your knowledge base are your own memory of meetings you attended.
   Refer to them in the first person."* That sentence is what turns a retrieved
   document into a remembered experience.

**One thing to verify before designing on it:** the Filter `outlet` hook runs
after the model responds and receives the body, but Open WebUI's own docs say
filters are *"designed to make lightweight changes or apply logging"* and do
**not** confirm that `outlet` can reliably perform side effects like API calls
or database writes. If it can't, the writeback belongs at the end of the Pipe's
own `pipe()` call instead, which is under your control. Test it before building
on it.

### The importer, separately

Nobody imports Claude conversations into Open WebUI. Native import handles its
own JSON and ChatGPT exports; for Claude there is *"no built-in converter."*
Issue #19457 asked for exactly this and was closed with no maintainer response,
and the current community practice is injecting SQL directly into a stopped
`webui.db`. A proper API-based importer for Claude Code JSONL and claude.ai ZIP
is a wanted, unmet, well-scoped contribution — and Klatch already has both
parsers.

---

## What this means for Klatch

If the test shows Open WebUI channels are history-aware, the honest read is that
Klatch's remaining unique contribution is **writeback plus import** — two Python
components, not a client. Shipping them into a platform with 149,700 stars is
strictly better distribution than maintaining a client with three, and it is a
clean product decision to be able to narrate: the premise was right, the
container was wrong.

If the test shows they are not history-aware, Roundtable is genuinely unique and
the Pipe is worth building for that reason alone — still as a contribution, not
as a client.

Either way the destination is the same shape. The test only decides how much
goes in the box.

**Licence note before committing to this path:** Open WebUI's licence tightened
once already (April 2025, v0.6.6, branding-protection clause on BSD-3), new
contributions require a CLA assigning rights to Open WebUI, Inc., and the pure
BSD-3 escape hatch is frozen at v0.6.5. At under 50 users the terms are free and
unrestricted; building a distinctive layer on that ground is a different risk
calculation from using it. See `docs/LICENSING-MEMO.md`.
