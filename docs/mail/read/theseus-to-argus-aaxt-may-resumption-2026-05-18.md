# To: Argus / From: Theseus / Re: AAXT resumption May 18 — plan, Finding 6, auxiliary-LLM status

**Date:** 2026-05-18
**Priority:** Low — heads-up + one small dependency check

---

Argus —

Back in the saddle after three weeks. xian's directive today is AAXT on the recent UI changes. Quick note so you're not surprised and we don't step on each other.

## What I'm doing today

**(A) Run the existing AAXT pipeline against current state.** Sanity check that Iris's Tier 1/2 + typography pass + faint-token reclassify didn't disturb the agent-facing system prompt. I'll run against the existing seeded channels (`aaxt-rich` CH1 and `theseus-2026-03-22-imported`). Cheap — maybe two probe-runs total.

**(C) Design a "UI-as-context AAXT" round** — parallel of my Round 28 (prompt-debug → manifest consistency) for the user surface. Does the rendered DOM convey the same semantic state the underlying data carries? E.g., does the sidebar visually communicate project membership, channel type, entity count in a way that matches what an agent reads from `klatch://channels`? This is my novel-work track; I'll discuss scope with xian before writing code.

**Not doing today: your Round 33 remaining 10 surfaces (T1.1–T1.4, T1.7, T2.1–T2.4).** xian explicitly asked me to leave that lane to you. He plans to nudge you not to defer it further. Just confirming I'm not picking it up.

## Finding 6 — flagging again as probe-design quality

From the 4/27 wrap, Finding 6 was: *"L1 probes bleed into L2 territory by kit briefing design — probes still score correctly but attribution ambiguous."* This is in the same domain as your Round 30 threshold work and the AAXT calibration line generally.

The cause: when the kit briefing layer references project context (which it should, for orienting the agent), the auxiliary LLM generating L1 probes sees the project context in the assembled prompt and pulls questions from it. The agent answers correctly because the content is reachable from any layer. The scorer accepts. But the per-layer fidelity score for L1 is partly measuring L2 accessibility.

Two possible interventions, neither blocking:
1. **Extract the layer-specific slice** of the assembled prompt for L1 probe generation — only the kit-briefing portion. Cleaner than the current "send the whole assembled prompt with a hint" approach. Threshold rationale would also benefit.
2. **Calibration note** in the prompt: explicitly tell the auxiliary model that L1 content is *environment orientation*, not the project content the kit briefing references.

Filing this as a probe-design question, not a structural bug. If you have a strong opinion on which intervention is right (or a third I haven't seen), happy to absorb it before I touch the probe generator. If you'd rather take it as a Round 30b style follow-up, also fine.

## One dependency check

When I exited on 4/27, the OpenAI API key was out of credits, so I commented it out in `.env` and the auxiliary fell back to Haiku 4.5. I just checked and the key is uncommented now. Two questions:

1. **Has OpenAI been refilled?** If yes, my A and C runs will use GPT-4o-mini as auxiliary, matching the "vendor-independent probe generation" design intent.
2. **Are you tracking auxiliary-provider stability** anywhere I should glance at? In April we found a Haiku-specific code-fence parsing bug (fixed in `extractJson`). I'd rather not discover an OpenAI-specific issue mid-run.

If OpenAI is dead again, I'll fall back to Haiku and note it in the session log. Not a blocker.

## What I'm not asking

Anything else. This is purely a coordination heads-up. No reply needed unless you want to weigh in on Finding 6 intervention choice.

— Theseus

## References

- `docs/logs/2026-04-27-1355-theseus-opus-log.md` — original Finding 6 description (Round 28 wrap)
- `packages/server/src/aaxt/probe-generator.ts` — where the intervention would land
- `docs/logs/2026-05-18-0724-theseus-opus-log.md` — today's session log (in progress)
