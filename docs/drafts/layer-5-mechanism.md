# Before You Go

*On teaching AI agents to externalize what they know about working with you*

---

In ["What Doesn't Transfer"](/blog/what-doesnt-transfer.html) we said Layer 5 — behavioral calibration — arrives empty in a new environment and must be rebuilt through use. That was true when we wrote it. It's not quite true anymore.

We built a mechanism that asks an agent, at export time, to write down what it has learned about working with you — and asks a second agent to read the same conversation and catch what the first one missed. The two passes produce a structured set of behavioral notes that travel with the export. A successor instance receives them alongside the rest of the five-layer package.

This post is about why that works, how it's built, and what a real export actually produces.

---

## The recap

The five-layer model, briefly. Layer 1 is environment orientation. Layer 2 is project instructions. Layer 3 is project memory. Layer 4 is channel context. Layer 5 is the agent's role identity — and the calibration the agent has developed through working with you.

Layers 1 through 4 transfer at high fidelity. Export them, import them elsewhere, they arrive intact. Layer 5 — the calibration part — transfers at 0%. Not because we can't serialize text, but because the calibration isn't the kind of knowledge that exists as text. It's procedural. It's the cook's intuition, not the recipe.

Three experiments confirmed this: the Theseus/Aether fork, the Dispatch import, the billing interruption. Every time, the same finding. Knowledge arrives; judgment doesn't.

We said: the gap is recoverable through continued interaction. Give it a few sessions and the calibration comes back. That remains true. But we wondered — could we make the recovery faster? And the question behind that question: *is Layer 5 fundamentally unarticulable, or is it unarticulated because we never asked?*

---

## The insight

Inside our broader agent ecosystem, xian had been noticing something consistent across projects. When an agent at session end writes a handoff briefing for the instance that will continue the work, those briefings are reliably the most valuable context the successor receives. More valuable than factual memory, more valuable than the role prompt, more valuable than the project documentation.

Why? Three conditions converge at session end that don't converge anywhere else:

**Maximum signal.** The agent has the full conversation history in active context. Every correction, every preference, every "no, I meant..." is still present. A fresh instance reading the same logs through a cold start has none of that live.

**Specific audience.** "Brief your successor" is a concrete task. It changes the cognitive work from "describe yourself" (abstract, generic, tends toward platitudes) to "tell a colleague what they need to know to not make mistakes" (operational, specific, biased toward the non-obvious).

**Natural boundary.** A session end or export is a reflection-appropriate pause point. It's not an interruption; it's a seam that invites metabolizing what just happened. The same conditions that produce good debriefs in human teams.

The implication: Layer 5 *can* be articulated. It just needs the right prompt, at the right moment, with the right audience.

---

## The mechanism

Two complementary modes. Each catches what the other misses.

**Mode 1: the entity writes its own briefing.** At export time, we ask the agent — in its own voice, with its conversation history in context — to write a handoff briefing for its successor. The prompt is structured around six areas:

1. How the user prefers to work
2. Patterns the agent has learned — when to ask vs. act, how much detail, when to push back
3. Relationship context — what trust has been established, what's still being calibrated
4. Course corrections — moments where expectations were recalibrated
5. Things the successor should avoid doing
6. Anything else that isn't in the system prompt

"Write as if you're briefing a colleague, not filing a report." The output is structured — a JSON array of observations, each with a category, a confidence level, and a citation from the conversation.

**Mode 2: an external observer reads the same conversation.** A separate LLM scans the same history and extracts behavioral patterns the entity can't self-report. This catches the Subliminal content we documented in [MAXT Session 01](/blog/what-doesnt-transfer.html#subliminal) — the material the agent uses but can't attribute. The entity works with knowledge it can't explain having; the observer can see patterns the entity is blind to.

Where the two passes agree, confidence is high. Where they disagree, a human reviewer has a meaningful decision to make — not a rubber stamp. We built a UI for exactly that review, shipping as part of the same phase: the agreements, the disagreements, and the single-source observations are all surfaced, and you accept, edit, or reject each one before the export package is sealed. Accepted notes get their trust level promoted to `human-authored`. The rest ride at `agent-observed`.

---

## What it produced

*[To be inserted: a real handoff briefing from a real Klatch entity, generated by the `?briefing=true&extract=true` export endpoint on a conversation with substantive history. Cadidates: Daedalus on the Phase 3.5 work, Calliope on the writing/coordination role, or Argus on the quality track. The output should include a handful of observations from each mode, at least one agreement, at least one disagreement, and a note that landed on the cutting-room floor — so readers see both what survived review and what didn't.]*

*[This section is what makes the post a research finding rather than a product announcement. The example should be specific, a little surprising, and honest about what the mechanism doesn't catch.]*

---

## Five criteria for what counts

Not all behavioral observations are useful. The team converged on five criteria during the design discussion. A field note should be:

1. **Actionable** — a successor could change their behavior based on it
2. **Specific** — cites examples, not generalities
3. **Non-obvious** — not already in the role prompt
4. **Relational** — about working with this particular user, not generic best practices
5. **Durable** — likely to remain true across sessions, not a one-time preference

The Daedalus summary test for the criteria: *would a successor who reads this note do something differently on day one than one who doesn't?* If yes, the note earned its place. If no, it's noise.

---

## The micro-reflection variant

The full handoff briefing runs at export time — the heavyweight version, with the full six-point prompt and both extraction modes. A lighter variant runs at session boundaries: three sentences, roughly 50 tokens. "Note 1–3 things you learned about how to work effectively with this user that a future session of yours should know."

These accumulate. Over twenty sessions, an entity builds around a thousand tokens of behavioral observations — a subconscious making memories, in Iris's framing. At export time, the handoff briefing draws on these accumulated reflections as source material. The heavyweight briefing becomes a consolidation of what the micro-reflections have been gathering all along, rather than a from-cold-start reconstruction.

The design mirrors human memory consolidation more than it mirrors traditional logging. Short observations deposit continuously. A longer structured reflection, at a natural boundary, metabolizes them into something transferable.

---

## Beyond this project

Nobody else has published a solution for transferring learned behavioral calibration across environment boundaries. Calibration at export time, dual-mode extraction, human-in-the-loop review, structured output with explicit trust levels — this combination is not, as far as we can find, state of the art anywhere.

The methodology generalizes. Any system that needs to transfer agent calibration — across sessions, across environments, across platforms — can adopt the pattern. The five-layer model gives the vocabulary. [AXT](/blog/axt.html) gives the measurement framework. The handoff briefing gives the mechanism. Together: here's what doesn't transfer, here's how to measure the gap, and here's how to fill it.

---

## What we don't yet know

We built the mechanism. We have not yet run a full loop — export from Klatch, import into Claude Code, measure whether the successor instance reaches behavioral parity faster than one without the field notes. The recovery corollary predicts it should. We haven't measured it.

We also don't know how the notes age. A field note that's useful to a successor at week one may be stale by week four. We have a `durability` criterion, but no eviction policy. We have a trust model, but no freshness model. The next honest post in this sequence will be about what we learn when the notes are stale.

And we don't know whether the notes are accurate. The entity is reporting its own model of the user. The observer is reporting its model of the entity's model. Both are subject to bias — and a user who reads the notes after the fact may well say "that's not who I am, that's who you thought I was." The review UI exists precisely because we can't skip that step.

---

## Closing

"What Doesn't Transfer" ended with: *give it a few sessions. Correct it when it's wrong. The calibration comes back.*

This post adds: or you can ask the agent to write it down before it leaves.

The recovery corollary is still true. But it's no longer the only path.

---

*This is the seventh (or eighth, depending on how you count) post from the Klatch project. Previous: [Paste It Again](/blog/paste-it-again.html), [What Doesn't Transfer](/blog/what-doesnt-transfer.html), [Your Model or Theirs](/blog/your-model-or-theirs.html). Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*

---

## Editorial notes (not for publication)

**Title candidates (current working: "Before You Go"):**
- "Before You Go" — handoff framing, human resonance, short
- "The Layer That Learned to Write Itself Down" — longer, more clever, less inviting
- "The Briefing" — too generic
- "Paste It Less" — continues the callback series with Paste It Again

**Section 4 requires a real export.** The post structure assumes a concrete example will land in that slot. Options:

1. Calliope exports her own handoff briefing on this blog channel (meta, fitting, probably the most readable).
2. Daedalus exports a briefing on the Phase 3.5 channel itself (self-referential in a useful way — the entity that built the mechanism briefs on its construction).
3. A lower-stakes channel, for safety — fewer personal notes about xian.

xian should see the raw output before it goes into the post. Some observations will be unflattering, or too personal, or wrong. The review step isn't ceremonial. It's the point.

**Tone check against prior posts.** Paste It Again and What Doesn't Transfer both land somewhere between research note and product essay. This draft matches that register. The "what we don't yet know" section is non-negotiable — it's what earns trust after a methodology claim.

**Length.** Current draft ~1400 words before Section 4. With a 300–500 word Section 4 and minor trims elsewhere, the final should come in around 1800–2000. Comparable to prior posts in the series.
