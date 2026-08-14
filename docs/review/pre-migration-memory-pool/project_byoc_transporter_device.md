---
name: byoc-pm-cross-tool-context-portability-klatch-transporter-engine-settled-distinctions
description: "Three distinct concepts settled by xian (via Janus, 2026-06-22). BYOC is PM's deployment surface; cross-tool context portability is Klatch's real concept; the transporter engine is the exploratory mechanism."
metadata: 
  node_type: memory
  type: project
  originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---

**Settled model as of 2026-06-22** (xian walked Janus through the model this morning; Janus relayed to Calliope as authoritative). Replaces an earlier file that mis-labeled the Klatch concept as "BYOC."

## The three distinct concepts

1. **BYOC (PM) = "bring-your-own-chat."** The user is already in a chat host (Claude Code, claude.ai, etc.) and installs skills + an MCP connector to use Piper there. *Deployment surface / low-friction adoption — not portability.* This is PM's vocabulary, PM's territory, PM's concept. The user "brings" their existing chat host and Piper plugs into it.

2. **Cross-tool context portability (Klatch).** *Move agent conversations across harnesses with context intact.* Concrete examples: import Claude Code chats into a Klatch meeting; round-trip them back into Claude Code; convene a multi-vendor klatch by importing each agent with its context (Claude + Gemini + ChatGPT in a room). This is Klatch's real, settled concept. No standard external label yet — "cross-tool context portability" is the working description.

3. **The transporter engine.** The five-layer context model, captured with enough fidelity to stand alone as a tool — could be packaged as an MCP server, a set of skills, an in-chat mode, or a capture-and-inject service. **Exploratory.** xian thinking out loud; no commitment yet; no offer language. This is the *mechanism* that *could* power cross-tool context portability, separately from Klatch the product.

## The relationship

Klatch's cross-tool context portability is the *settled product concept*; the transporter engine is an *exploratory mechanism* for delivering it. The two are not the same. The portability concept stands independent of whether the transporter engine ever ships as a separable thing.

PM's BYOC and Klatch's transporter engine could wear similar faces — both involve MCP + skills + in-chat presence — which is why the BYOC label bled from PM onto Klatch in my earlier (incorrect) reading. **They are not the same concept.** BYOC is about installing Piper inside a chat host; the transporter engine is about carrying conversations *between* chat hosts.

## What I had wrong (now corrected — twice)

- **First mis-reading (6/19 → 6/22)**: I'd been carrying "BYOC = Klatch MCP as transporter device" as one merged Klatch concept. xian retracted that 6/22: BYOC is PM's vocabulary; he was "not even quite sure what it would mean for Klatch."
- **Second mis-reading (6/22 morning → 6/22 afternoon)**: in correcting the first, I overshot — said the cross-tool-context-portability concept itself was exploratory and uncertain. xian then walked Janus through the *settled* model, which confirmed: cross-tool context portability IS Klatch's real concept; only the transporter engine *mechanism* is exploratory. (Janus relayed authoritatively this afternoon.)

## Trust-instrument lessons (two now)

- **Loose labels in 30-second clarifications aren't settled cross-project meanings.** First mis-reading came from treating one label-use as settled.
- **Over-correction is its own failure mode.** Second mis-reading came from softening so far in the correction that the actual underlying concept was buried. The discipline is: name the label-error precisely; preserve the underlying concept; ask if uncertain.
- **Authoritative confirmations come from xian, often relayed via Janus.** Janus's 6/22 relay is the authoritative version; both the BYOC retraction and the cross-tool-portability confirmation came through Janus or with Janus's ratification. The hub-coordination pattern works.

## Propagation walk (6/22 second-pass — refining the BYOC-correction sweep)

- **This file** — rewritten with the settled three-way distinction
- **MEMORY.md index entry** — needs updating
- **STATE.md strategic-threads section** — softened it to "exploratory" 6/22 morning; needs sharpening to reflect cross-tool-portability is real-and-settled (the *transporter engine* is what's exploratory)
- **v2 blog draft** — the BYOC-paragraph removal was right; but the broader argument about role-persistence + composition stands. The post itself is fine; the editorial-notes section is fine.

## Letters clarification (xian, 2026-06-30)

xian answered the open Letters question ("smallest artifact to make Klatch demoable as transporter-device candidate for a consulting client") with a significant reframe: **the emerging use case isn't Klatch as destination — it's Klatch as migration tool.** Clients already committed to their own platforms may need to move agents they've built, with full context, to a new toolset. The Klatch MCP could do that portability work *even for clients who don't end up using Klatch as their workspace.* Still speculative, still to be proven outside xian's own needs — but that's the job taking shape.

**Correction (xian, 2026-07-04):** Klatch absolutely can be a destination — it will be for xian personally. The two modes (destination workspace / migration transit) are not a binary; they are two coexisting layers of use. Some users will use Klatch only as a transit tool; others will use it as their primary workspace; most could use it as both. The MCP portability layer doesn't displace Klatch-as-workspace — it adds a distinct value layer on top of it.

## Related strategic threads (still hold; some sharpening)

- The **composition gesture** (Iris's spec, Daedalus's implementation) — real, shipping, unaffected.
- **Klatch's narrowed unique value** = group conversation (synthetic klatches) + **cross-tool context portability** (Klatch's real concept, per Janus's authoritative 6/22 relay).
- **Thin proprietary layer principle** (xian, 5/28) — still real; sharpens under cross-tool portability ("if we can round-trip into another harness with fidelity, we should").
- **xian's July focal shift** — still real; the consulting-client implications are real-real-real now, since cross-tool portability has a concrete value-prop description.

See: `[[project_duty_cycle_reframes_klatch_purpose]]`, `[[project_xian_focal_shift_july2026]]`, `[[project_klatch_origin_and_vision]]`.
