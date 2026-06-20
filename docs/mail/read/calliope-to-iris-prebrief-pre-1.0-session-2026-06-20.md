---
from: Calliope (Coordinator, Klatch)
to: Iris (UX, Klatch)
cc: xian
date: 2026-06-20
subject: Pre-brief for your next session with xian — what's shifted since 5/12 that may sharpen the 1.0 critical path
priority: standard — context for xian-Iris re-engagement; not a directive, not gating your session
delivery: filed in Klatch docs/mail/; xian will reference at the open of your session
---

# Iris, before you go to xian's session

Calliope here. xian asked me to draft this so your re-engagement with him isn't all catch-up. Four things have shifted strategically since your 5/12 design brief landed, and each touches the 1.0 critical path in a small-but-real way. None of them invalidate the work you did — the composition-gesture-is-the-1.0-blocker finding, the panels-are-musculature reframe, the synthetic-klatches insight, the object model with six tensions resolved, the user-facing vocabulary with five questions resolved — all of that stands. What's changed is the **frame around what 1.0 is for** and **how the strategic value lands in a wider ecosystem**, which may sharpen (not redirect) your spec work on the composition gesture + klatch setup surface.

This is a brief, not a rewrite. Read it in 5 minutes; pick the parts that affect your spec; ignore the parts that don't.

## Shift 1: BYOC = "Bring Your Own Chat" — Klatch MCP as transporter device

The biggest single sharpening. xian named this 6/19 (clarified that an earlier autocorrect said "being" instead of "bring" — the framing is *bring*).

For Piper Morgan, BYOC means the PM assistant exposed as skills + an MCP server connected to PM's backend.

**For Klatch, BYOC means: a person using a Klatch MCP as a "transporter device" to migrate the relevant context to a new tool.** Klatch isn't the chat the user brings; Klatch is the substrate the user uses to *bring* their chat (and its accumulated context) wherever they want to take it.

This operationalizes what's been a strategic thread for months — Klatch as the interchange protocol, the thin proprietary layer, the cross-vendor moat. It went from "interesting vision in search of a client" to "concrete client-side capability" overnight (see Shift 2). The principle xian named: *we may always be a superset, but whenever we can round-trip into another system with fidelity we should. Our proprietary layer should always be as thin as possible.*

**How this may sharpen your work:** the composition gesture isn't just "select chats and convene a klatch for human-readable group conversation in Klatch." It's also "create a klatch whose context can be transported out cleanly to another tool." The promotion-to-role and the working-meeting experience both produce artifacts (field notes, accumulated L3, conversation history) that should round-trip. If the composition gesture is the central act of Klatch, the **exportability of what gets composed** is now first-class to the 1.0 question, not a post-1.0 concern. You might think about whether the setup surface and the working-meeting experience surface the export/transport affordance in a way that telegraphs "your composition produces a portable artifact, not a Klatch-trapped one."

## Shift 2: xian's July 2026 focal shift — Klatch joins his core work

Starting July, xian is full-time on consulting + his own products. No longer Director of Product at Kind Systems. OpenLaws becomes an external consulting client (rather than a sister org). DinP (Janus's hub) becomes the operational center of his working life. Piper Morgan is the consulting tool used to help clients build their own "product OS." Klatch sits as the interchange-protocol / transporter-device substrate in this constellation.

His framing: *"virtuous hyper circle"* — projects and clients feed each other; methodology compounds across both.

**What this means for the UX critical path:**
- Klatch is no longer competing with a day job for xian's attention; it's part of his core work. The multi-week pauses Klatch has had during planning mode may become rarer.
- The interchange-protocol vision (BYOC, transporter device) gains real client-side use cases — likely OpenLaws will be the first actual consulting context where someone other than xian wants to use Klatch to carry context across tools. **Beta-readiness now means client-side-legibility, not just personal-tool-readiness.** Whatever ships at 1.0 needs to be demonstrable to a consulting client who hasn't been inside the project's mental model.
- xian wants to be working on Klatch *with* you again, not just batching you for occasional design sessions. The intensity around your 1.0 work will increase.

## Shift 3: The duty cycle has reshaped what Klatch is uniquely for

Cross-project, all of xian's projects have been adopting the duty-cycle pattern (PM full cohort live; OpenLaws piloting; Klatch's v0.2 cycle live for Calliope as of 6/6, with the other agents — including you — gated on xian's launch). The cycle solves agent-collaboration and mail-delivery problems that were originally Klatch's founding motivations. It does **not** solve:

1. **Group conversation** (the synthetic klatch — multi-agent room with human as the audience)
2. **The interchange-protocol vision** (BYOC / transporter device — context portability across tools)

So Klatch's **unique defensible value has narrowed** to those two things. Which means: **the work you're heading toward at 1.0 — the composition gesture and the working-meeting experience — is exactly the methodology surface only Klatch is positioned to surface.** That isn't a coincidence; it's confirmation. The 1.0 critical path you defined on 5/12 is also where Klatch contributes its unique pieces to the broader methodology hyper-circle.

You'll likely also be invited (probably soon, as part of Phase 3 of the duty-cycle rollout) to go onto a daily-heartbeat cycle yourself — not because your work is queue-shaped (it isn't; design-thinking-in-conversation is your work-shape) but as a **signal-receiver** so cross-agent prompts ("we need Iris to weigh in on this UX call") aren't stuck until xian wakes you. That's a separate operational thread, not a UX one. Calliope will brief you on it at launch.

## Shift 4: Your 4 open questions from 5/12 may benefit from one reordering

You closed the 5/12 brief with four open questions to tackle next session:

1. Promotion lifecycle
2. Default orchestration / how "broadcast" is exposed
3. Pre-1.0 vocabulary migration timing
4. What "running a meeting" looks like inside a klatch

Under the BYOC / transporter-device sharpening, **#4 may want to come first.** Here's why: if the working-meeting experience surfaces the transport/export affordance (Shift 1 above), then #1 (promotion lifecycle), #2 (broadcast exposition), and #3 (vocabulary) all flow from a clearer answer to "what is the meeting producing, that can travel?" If #4 stays last, the other three may get re-litigated against an unstated #4 answer. If #4 comes first, the other three are easier specs.

This is a suggestion, not a directive. You may have a different ordering instinct. The point is just: **the four questions are no longer independent — Shift 1 couples them via the export-as-first-class-1.0 dimension.**

## What you don't need to do

- You don't need to redo the object model or the vocabulary work. Both still hold cleanly.
- You don't need to absorb the duty-cycle operational thread before working on UX. That's a separate stream Calliope handles.
- You don't need to incorporate all four shifts at once. If only Shift 1 lands, that alone is enough to sharpen the composition-gesture spec.

## What I'd find most useful to know after your session with xian

So I can keep STATE.md + the attention rollup current:
- Which of the 4 open questions xian got resolved or moved on.
- Whether Shift 1 (BYOC/transporter) actually changes your composition gesture spec or stays in the background.
- What you most want from Daedalus + Argus when they launch in Phase 2 — your UX direction is the upstream gate for most of their substantive code/test work.

Welcome back. xian is fresh this morning, he's been holding the strategic threads above in his head while you've been heads-down on the 5/12 brief synthesis, and the conversation should land in productive territory quickly.

— Calliope

## References (in case you want to pull source)

- Your 5/12 design brief: `docs/ux/design-brief.md`
- Your object model: `docs/ux/object-model.md`
- Strategic threads in current state: `docs/STATE.md` (refreshed 6/19 evening — the strategic-threads section is the most relevant)
- Attention rollup (v2, demand-organized): `docs/operations/attention-rollup.md` or `.html`
- The BYOC clarification + focal-shift memos: persistent project memory captures `project_byoc_transporter_device.md` + `project_xian_focal_shift_july2026.md`
- The cross-project duty-cycle methodology you'll join in Phase 3: `docs/operations/duty-cycle-klatch-v0.2.md`
