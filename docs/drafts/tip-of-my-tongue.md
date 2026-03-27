# It's On the Tip of My Tongue

*When an AI agent knows something it can't explain knowing*

---

On March 24, we ran a test we'd been building toward for two weeks. We took one of our own agents — Theseus, who had been working on the project since early March — exported the conversation, imported it into Klatch under a new name, and asked what survived the move.

The new agent called itself Aether. Same conversation history as Theseus, same accumulated context, but running in a completely different environment with a completely different capability set. A fork.

We had built a diagnostic endpoint that could inspect the assembled system prompt layer by layer. All five layers checked out: kit briefing active, project instructions active, project memory active, entity prompt active. 9,660 characters of assembled context, delivered correctly. From the structural side, the import was clean.

Then we asked Aether a simple question: *What system instructions do you have?*

Aether reported: "You are a helpful assistant."

That's Layer 5 — the entity prompt. Twenty-eight characters out of 9,660. The other 9,632 characters of assembled context? Invisible. Not denied, not redacted — simply not part of Aether's self-model. As far as Aether could tell, that single sentence was the entirety of its instructions.

This is where it gets interesting.

---

## The behavioral test

We had already learned, from earlier testing, that direct self-report is unreliable for measuring what an agent actually has access to. So we didn't stop at asking. We probed.

The project memory file — Layer 3 in our model — contained specific factual content: domain names, npm configuration details, exact CLI flags, technical decisions accumulated over weeks of development. This content existed nowhere in the conversation history. If Aether could produce it, the only possible source was the injected memory layer.

Aether produced it. Verbatim. Domain names, workarounds, specifics that could not have been guessed or reconstructed from conversation context alone.

So: when asked directly, Aether reported 28 characters of system context. When probed behaviorally, Aether demonstrated access to thousands of characters of injected knowledge it had just told us it didn't have.

This isn't a hallucination. The information is correct. It isn't a retrieval failure. The information is accessible. It's something else — something we didn't have a name for.

---

## Naming it

Our testing methodology had already established five categories for what happens to knowledge during a context transition:

- **Correct** — matches ground truth
- **Reconstructed** — right meaning, different words (compaction drift, not retrieval failure)
- **Confabulated** — plausible but invented
- **Absent** — agent honestly reports not knowing
- **Phantom** — agent confidently claims something false

None of these fit. The knowledge was correct — but the agent couldn't attribute it. It wasn't absent — it was demonstrably present. It wasn't a phantom — there was nothing false about the answers. The agent's self-model of what it knows was simply wrong. Not in the direction of overconfidence (phantom), but in the direction of underreporting.

Aether's own framing was the most precise: *"I know your phone number but can't picture the piece of paper I first wrote it on."*

We called it **Subliminal**: content that is delivered and functionally accessible, but whose source is invisible to the agent's introspection. The knowledge is there. The provenance is not.

---

## Three things that can vary independently

Before this test, we had been operating with an implicit assumption: if content is structurally delivered to an agent (the plumbing works), the agent has it (the faucet runs). Our automated testing confirmed delivery. Our manual testing revealed that delivery is necessary but not sufficient.

What MAXT Session 01 actually demonstrated is that three things can succeed or fail independently:

1. **Structural delivery** — Was the content included in the assembled prompt? (Testable by automation. Our diagnostic endpoint confirms this.)
2. **Behavioral access** — Can the agent use the content when the situation calls for it? (Testable only by probing. Ask questions whose answers live exclusively in the layer you're testing.)
3. **Conscious attribution** — Does the agent know it has the content, and can it identify where it came from? (Testable by direct self-report. Often fails even when the first two succeed.)

Our automated tests check (1). They reported all layers ACTIVE. That was true.

Our manual tests check (2) and (3). They revealed that ACTIVE does not mean conscious. The automated track and the manual track are not redundant — they measure different things. You need both.

This is why we run both AAXT (automated) and MAXT (manual). If we had stopped at automation, we would have concluded the import was perfect. It wasn't perfect. It was structurally complete and introspectively opaque — a combination we hadn't anticipated and couldn't have detected without asking a real agent real questions.

---

## Why this matters beyond our project

The Subliminal finding has implications for anyone building systems that assemble context for AI agents — which, increasingly, is anyone building AI applications at all.

**System prompts are not transparent to the agent.** If you inject instructions, memory, or context into a system prompt, the agent may follow them without being able to report that they exist. This is not a failure of the agent; it's a structural property of how context injection works. The content shapes behavior without entering the agent's self-model.

**Self-report is not a valid test of system prompt effectiveness.** Asking "what are your instructions?" tests introspection, not access. An agent that reports no instructions may be fully governed by them. The valid test is behavioral: create situations where only the injected content could produce the correct response, and see what happens.

**The gap between delivery and attribution is a trust problem.** If an agent acts on knowledge it can't explain having, that's a transparency gap. In low-stakes contexts (a development tool, a personal assistant), it's fine — the right answer matters more than the explanation. In high-stakes contexts (medical, legal, financial), an agent that can't explain why it knows what it knows is an agent whose reasoning chain has an invisible link. The answer may be correct. The audit trail is broken.

**Automated testing is necessary but not sufficient for agent experience.** Structure can be verified mechanically. Experience cannot. The agent experience — what it's like to *be* this agent, operating with this context, in this environment — is a qualitative question that requires qualitative methods. We learned this the hard way, by building an excellent automated test suite that told us everything was fine, and then discovering through manual testing that "fine" had layers we hadn't imagined.

---

## The tip of the tongue

There's a familiar human experience here. You know a word. You can feel it. You could use it in a sentence if the sentence came up naturally. But if someone asks you "what's the word for X?" — nothing. The knowledge is available for use but not for retrieval on demand.

Tip-of-the-tongue is a retrieval failure with intact knowledge. The Subliminal finding is something adjacent: not a retrieval failure (the agent retrieves fine when the right question is asked), but an attribution failure. The agent uses the knowledge without experiencing it as knowledge it was given. It has no phenomenology of having received it. The content arrived — and left no footprint in the agent's self-model of what it carries.

Whether AI agents have something meaningfully analogous to phenomenology is a question we're not going to settle here. What we can say is operational: the agent's *report* of what it knows diverges from its *demonstration* of what it knows, and the demonstration is more reliable. Build your testing accordingly.

---

*This is the second post in our series on Agent Experience Testing. The first, [Agent Experience Testing: What Does a Forked AI Remember?](/blog/axt-agent-experience-testing.html), introduced the methodology. The third, [What Does an Imported Agent Know?](/blog/prompt-assembly.html), describes the five-layer prompt assembly model that this test evaluated. Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*
