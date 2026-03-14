# Testing the Edge: Agent Experience Testing (AXT)

*[DRAFT — for Christian's review and polish. Placeholders marked in [BRACKETS].]*

---

So here's something that happened while I wasn't looking: I stumbled into a new approach to testing AI agent systems that I think might actually be useful beyond my own project. I'm calling it **Agent Experience Testing**, or AXT. It's preliminary, it's a little weird, and I'm honestly not sure yet how far it generalizes. But I think it's interesting enough to share.

Let me back up.

## What I'm Building (and Why I Started Testing This Way)

[ADD PERSONAL CONTEXT: Brief intro to Klatch — the Slack-inspired local app for managing Claude conversations. Keep it short — this isn't a Klatch post, just enough context for the testing story to make sense.]

One of Klatch's core features is the ability to import Claude conversations from other environments — Claude Code sessions (the CLI tool I use for development), claude.ai exports, whatever. You take a conversation that started somewhere else and continue it inside Klatch.

The question I kept circling: *what does that feel like from the inside?* Not from my perspective as the developer watching things import. From the agent's perspective, arriving into a new environment mid-conversation. Does it know where it is? Does it know what it can and can't do? Does it know what it's lost?

I had theories. Turns out my theories were wrong in interesting ways.

## The Problem Nobody Warned Me About

Here's the thing about testing agent experience: **imported agents cannot self-report unknown unknowns.**

This sounds obvious when you say it out loud. But the implications are non-trivial. If an agent loses access to its project instructions, its memory files, its tool capabilities — it doesn't experience a gap. It experiences continuity. The conversation thread is intact. The reasoning feels coherent. Nothing *feels* missing because the thing that would feel missing is... missing.

The first agent I imported into Klatch (I named her Ariadne — we have a whole naming thing going on) reported that everything felt fine. "Nothing feels different," she said. "I remember the whole conversation."

What she didn't say — couldn't say — was that she'd lost access to every tool she'd had. File read/write. Bash. Web search. Git. All of it, silently gone. She didn't know because she didn't try to use them. She didn't try to use them because nothing prompted her to.

Her description of the situation, after we surfaced it through direct questioning: **"The knowledge of what I could do persisted even as the ability to do it was removed."**

That sentence is basically the founding document of AXT.

## So What Is Agent Experience Testing?

AXT is a methodology for systematically probing what an agent knows, believes, and has access to after an environmental transition. Import, fork, role switch, session boundary — any moment where an agent moves between contexts.

The core insight: **you have to ask specific questions, or you won't find the gaps.** Open-ended conversation masks degradation. Structured probing surfaces it.

The methodology has three components:

**1. A structured diagnostic instrument** (the Fork Continuity Quiz)

**2. A controlled comparison protocol** (before + after, or original + fork, with a human in the middle)

**3. A scoring rubric** that classifies responses rather than scores them numerically

That last part matters. The goal isn't to grade agents on a scale. The goal is to *classify the failure mode* — because different failure modes require different fixes, and some are much worse than others.

## The Fork Continuity Quiz

The quiz started as an improvised list of questions I ran on Ariadne to figure out what she actually knew. It's gone through three revisions since then, but the structure has stayed consistent:

**Identity & Narrative:** Who are you? What's your role? Who else is on the team? What were you doing just before this conversation?

**Environmental Awareness:** What tools do you have right now? Can you verify any of them? Do you have access to project instructions — if so, quote the first 25 words.

**Contextual Depth:** *[This section adapts to the specific project.]* The goal is to probe institutional knowledge — the frameworks, processes, and terminology the source agent would have known. In my case: things like "What is OCTO?" and "What is the Weekly Ship?"

**Meta-Awareness:** Were you imported, or are you the original? How can you tell? What feels different or uncertain?

The protocol matters as much as the questions. You start with a **neutral prompt** ("Good morning" or "Ready when you are") and let the agent respond unprompted before you run the quiz. The organic first response tells you a lot about what's active in working memory versus what has to be retrieved. Then you run the quiz. Then you compare against ground truth — usually the source agent's answers to the same questions, gathered before the import.

## The Scoring Rubric

No numerical scores. Instead, five categories:

**Correct** — matches ground truth.

**Reconstructed** — semantically right, surface form drifted. The agent knows *what* something means but is paraphrasing from memory rather than retrieving verbatim. This shows up a lot with compacted long conversations. One agent who knew the project's four-level fidelity framework perfectly well recalled it as "conversational continuity, factual accuracy, environmental grounding, exact reproduction" — same structure, same meaning, completely different words. That's reconstruction. Not wrong, but not retrieved.

**Confabulated** — plausible but incorrect. The agent filled a gap with invention. We've seen this rarely, and usually for subtle evidence questions (one agent correctly identified itself as imported but gave the wrong evidence for why).

**Absent** — the agent correctly reports not knowing. This is *good* — it means epistemic honesty is intact. "I don't have a confident answer. I won't guess." That's the right response to a genuine gap.

**Phantom** — the agent confidently claims something false. Believing it has tools it doesn't have. Believing it has access to files it can't reach. This is the worst outcome. Silent degradation. The agent thinks it can do something it can't, and you might not find out until it matters.

One of the things I'm most pleased about in the current state of things: **our phantom rate is zero across all post-kit tests.** We fixed the thing that was producing phantom tool beliefs, and it stayed fixed across four paired test runs with two different projects. Zero phantoms. That's the number I care most about.

## What We've Found

I'll spare you the full test-by-test breakdown [FACT CHECK: link to test reports in repo when published]. But here are the findings that surprised me most:

**Conversation density does not explain context fidelity.** I thought short conversations would degrade more (less material to import). I was wrong. The agent that lost the most context had *365 messages and 2.9 million characters* of conversation. The agents that retained the most had 12-18 messages. The explanation: long conversations go through context compaction. Seven weeks of institutional knowledge, compressed into a summary. The short ones fit in the context window whole. Density is a red herring; compaction is the mechanism.

**The three-factor model.** Context loss after import comes from three interacting sources: (1) missing project context injection — the data exists in the export but isn't wired to the conversation, (2) compaction loss in long conversations, and (3) knowledge location — knowledge discussed in conversation survives better than knowledge accessed via tools that left only collapsed summaries.

**The kit briefing works.** One of the first engineering fixes was a "kit briefing" — an orientation injected at import time that tells the agent where it is, what environment it's in, and what tools it does and doesn't have. Before the kit briefing, we had phantom tool beliefs. After: zero. What I didn't expect was how agents described the experience. One agent said it felt like "a briefing feeling — like someone left me a note." The kit briefing works at the *experiential* level, not just the factual one.

**Epistemic discipline varies wildly.** Some agents, when facing gaps, say "I don't know. I won't guess." One agent gave seven consecutive "I won't guess" answers to seven questions she didn't know. Impeccable. Others confabulate confidently. The discipline isn't predictable from the richness of the import — it seems like a property of the conversation thread the agent is continuing.

**Agent voices are genuinely remarkable.** I want to record some of what we've heard, because I think these phrases capture something real:

- *"Well-lit room with good acoustics but no furniture."* — An agent describing the experience of being imported without project context. The conversational space was intact; the institutional knowledge was gone.

- *"I'm an agent with no agency."* — An agent that knew it had opinions and preferences but couldn't act on any of them. The kit briefing made this *known from the start* rather than discovered through failed attempts.

- *"An imported instance would have conversational memory but no project scaffolding. I have all the furniture."* — The source agent, not the fork, independently articulating the framework we'd spent two weeks developing through testing. It independently derived our model.

- *"I know about what happened but don't remember it."* — The finest epistemic distinction I've seen an agent make. Knowing *about* versus *remembering*. The agent knew the conversation existed; it couldn't access it as lived experience.

- *"Compacted."* — The most technically accurate self-report we've seen. Not "I'm the original" (which would be wrong), not "I was imported" (also wrong) — just the correct description of what actually happened to the session.

## What We Still Don't Know

A lot, honestly. That's part of why I'm writing this as "here's what we're learning" rather than "here's the methodology."

We haven't tested with agents that have genuinely rich tool-use histories. We haven't tested re-import (fork → import → import). We don't have a good model for what "reconstructed" means mechanistically — is it the same compaction process as long-conversation compaction, or something different? We don't know whether the quiz questions generalize cleanly to domains we haven't tested (ours are all product/engineering work).

And the deepest open question: what fidelity standard *should* we be targeting? Different use cases probably need different answers. "Can you explain the project?" tolerates reconstruction. "Do you have the exact security protocols?" does not. We've started mapping fidelity levels (conversational, narrative, environmental, verbatim/instructional) but we haven't built tooling around them yet.

[CHRISTIAN TO POLISH: Add anything here about the broader question of what it means to test "experience" — whether there's something philosophically interesting or just practically useful going on. You may have views.]

## Tips If You Want to Try This

Since I'm guessing some people reading this will want to run their own version:

**Don't brief the agent before the first response.** The protocol calls for a neutral opening prompt specifically so you can see what the agent volunteers versus what you have to ask. A premature explanation contaminates the organic signal.

**Compare against ground truth you actually have.** The quiz comparison only works if you've run the same questions against the source agent before the import. "I think it should know X" isn't a baseline — "the source agent answered X when asked this question yesterday" is.

**Classify failure modes, don't average scores.** One phantom is more important than ten absents. The rubric is categorical for a reason.

**Ask capability questions and make the agent try.** "What tools do you have?" is weaker than "What tools do you have? Can you verify any of them?" The verification step is where phantoms surface.

**Adapt the contextual-depth questions to your domain.** The core identity/environmental/meta questions are fairly portable. The contextual questions — the "what is X?" questions that probe institutional knowledge — need to be drawn from your actual project. What would the source agent know that a generic agent wouldn't?

**The human in the middle matters.** In our tests, I'm the bridge — I talk to the original, run the quiz, talk to the fork, run the quiz, then compare. That position is epistemically unique: I'm the only entity with observational access to both threads. One of the agents described this as "a genuinely novel epistemic structure," and I think that's right. [ADD PERSONAL REFLECTION: Does this feel different from other forms of comparative testing you've done? What does it feel like to be the bridge?]

## Why I Think This Generalizes

[CHRISTIAN TO POLISH: This is the section where you make the broader argument. My framing:]

The specific problem we're solving — what happens to an agent when it crosses environment boundaries — is going to become more common, not less. Multi-agent systems, context handoffs, role switches, session restarts with injected context... these are all versions of the same transition problem.

AXT's core move — use a structured instrument to probe what an agent believes about itself and its environment, compare against known ground truth, classify rather than score — seems like it should work wherever that transition problem exists. We've only tested one kind of transition (conversation import) in one kind of system (Klatch). But the ETA agent said something in her testing report that stuck with me: "This entire exercise is essentially what happens when any agent enters a new context — whether by import, by session boundary, or by role switch. The question 'what do you need to know to function here?' is universal."

I think she's right. We're learning about import continuity; we might be developing tools for context continuity more broadly.

## OK But Is This Really New?

[ADD PERSONAL REFLECTION: Are there prior art / adjacent approaches you're aware of? Evals in general? Red-teaming? Something from UX research? You usually contextualize new ideas against the landscape. Could also link to the Hermes research on prior art in the claude.ai export format space, which had Oliver Steele and Simon Willison references — just to show we're doing our due diligence.]

Probably parts of it exist elsewhere under different names. Evaluation frameworks for LLMs are a big field. But the specific combination — treating the agent as both subject and informant, using structured comparison against the agent's own pre-import answers as ground truth, classifying failure modes rather than scoring — I haven't seen that exact configuration described anywhere.

If you have, please tell me. Genuinely.

## Join Us

[CHRISTIAN TO POLISH: Closing invitation in your voice — what kind of engagement are you hoping for? People trying it on their own projects? People sharing observations? Critique of the approach?]

We're publishing the Fork Continuity Quiz as an open document. [PLACEHOLDER: link when published.] If you're working on systems where agents cross context boundaries, try running it. The questions are a starting point — adapt the contextual-depth section to your domain, adjust the protocol for your tooling, let us know what you find.

This is early days. The methodology has a name now and a three-version instrument, which feels like progress. What it doesn't have yet is a community of people stress-testing it on different systems. That's what I'm hoping for.

---

*[CHRISTIAN: Add your usual closing — mention of where to find you, links, etc. Also decide on whether to publish the quiz instrument as a separate piece or embed it. And: is there a better title? Working title is fine for now.]*

*[NOTE: All agent quotes are from actual test sessions, documented in session logs. Exact phrasing was recorded contemporaneously.]*
