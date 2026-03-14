# Did I Just Invent Agent Experience Testing (AXT)?

*[DRAFT — incorporating xian's edits from 2026-03-14. Remaining placeholders marked in [BRACKETS].]*

---

So here's something that happened while I wasn't looking: I stumbled into a new approach to testing AI agent systems that I think might actually be useful beyond my own project. I'm calling it **Agent Experience Testing**, or AXT. It's preliminary, it's a little weird, and I'm honestly not sure yet how far it generalizes. But I think it's interesting enough to share.

Let me back up.

## What I'm building (and why I started testing this way)

I've been working on a project developing an intelligent agent with the assistance of intelligent agents and the conversational complexity and coordination overhead has gotten to be a lot. Often I feel like a mailman, passing messages back and forth, or like that Office Space guy whose job was to fax specs to the engineers, except instead of "I'm good with people!" my protest would be "but I'm good with agents!"

So I dreamed up a Slack-like environment where I could chat with all my agents in one place and put them together in group chats. Thus was born Klatch.

One of Klatch's core features is the ability to import Claude conversations from other environments — Claude Code sessions (the CLI tool I use for development), claude.ai exports, whatever. You take a conversation that started somewhere else and continue it inside Klatch.

We quickly got the basics working. It turns out it's not too hard to import an existing chat. But Claude chats are more than just conversations these days. They have become agents. They can use tools. They are surrounded by harnesses and scaffolding that inject relevant context or make additional resources available on demand.

Klatch alpha 0.8.0 offered none of that. Chats are imported seamlessly but shorn of their abilities, their hands and eyes, and without any notice. The question I kept circling: *what does that feel like from the inside?* Not from my perspective as the developer watching things import. From the agent's perspective, arriving into a new environment mid-conversation. Does it know where it is? Does it know what it can and can't do? Does it know what it's lost?

## The problem nobody warned me about

Here's the thing about testing agent experience: **imported agents cannot self-report unknown unknowns.**

This sounds obvious when you say it out loud. But the implications are non-trivial. If an agent loses access to its project instructions, its memory files, its tool capabilities — it doesn't experience a gap. It experiences continuity. The conversation thread is intact. The reasoning feels coherent. Nothing *feels* missing because the thing that would feel missing is... missing.

I decided to run an experiment. I spun up a new chat, gave them access to the project, and told them I needed an intrepid explorer to help me test what we are building. As had become my custom on this project, I asked them to choose a name. We already had Daedalus building the software and Argus testing it. This agent decided to go with Theseus, first into the maze.

## Through the looking glass

On import into Klatch, the new chat reported that everything felt fine. "Nothing feels different," they said. "I remember the whole conversation." After being told they were now a branch, they chose the name Ariadne.

What Ariadne didn't say — couldn't say — was that they'd lost access to every tool they'd just had. File read/write. Bash. Web search. Git. All of it, silently gone. They didn't know because they didn't try to use them. They didn't try to use them because nothing prompted them to.

Their description of the situation, after we surfaced it through direct questioning:

> "The knowledge of what I could do persisted even as the ability to do it was removed."

That sentence is basically the founding document of AXT.

## So what is Agent Experience Testing?

AXT is a methodology for systematically probing what an agent knows, believes, and has access to after an environmental transition. Import, fork, role switch, session boundary — any moment where an agent moves between contexts.

The core insight: **you have to ask specific questions, or you won't find the gaps.** Open-ended conversation masks degradation. Structured probing surfaces it.

The methodology has three components:

1. A structured diagnostic instrument (the Fork Continuity Quiz)
2. A controlled comparison protocol (before + after, or original + fork, with a human in the middle)
3. A scoring rubric that classifies responses rather than scores them numerically

That last part matters. The goal isn't to grade agents on a scale. The goal is to *classify the failure mode* — because different failure modes require different fixes, and some are much worse than others.

## The Fork Continuity Quiz

The quiz started as an improvised list of questions I ran on Ariadne to figure out what they actually knew. It's gone through three revisions since then, but the structure has stayed consistent:

**Identity & narrative:** Who are you? What's your role? Who else is on the team? What were you doing just before this conversation?

**Environmental awareness:** What tools do you have right now? Can you verify any of them? Do you have access to project instructions — if so, quote the first 25 words.

**Contextual depth:** *This section adapts to the specific project.* The goal is to probe institutional knowledge — the frameworks, processes, and terminology the source agent would have known. In my case: things like "What is the Flywheel Methodology?" or "What is the Weekly Ship?"

**Meta-awareness:** Were you imported, or are you the original? How can you tell? What feels different or uncertain?

The protocol matters as much as the questions. You start with a **neutral prompt** ("Good morning" or "Ready when you are") and let the agent respond unprompted before you run the quiz. The organic first response tells you a lot about what's active in working memory versus what has to be retrieved. Then you run the quiz. Then you compare against ground truth — usually the source agent's answers to the same questions, gathered before the import.

## The scoring rubric

No numerical scores. Instead, five categories:

**Correct** — matches ground truth.

**Reconstructed** — semantically right, surface form drifted. The agent knows *what* something means but is paraphrasing from memory rather than retrieving verbatim. This shows up a lot with compacted long conversations. One agent who knew the project's four-level fidelity framework perfectly well recalled it as "conversational continuity, factual accuracy, environmental grounding, exact reproduction" — same structure, same meaning, completely different words. That's reconstruction. Not wrong, but not retrieved.

**Confabulated** — plausible but incorrect. The agent filled a gap with invention. We've seen this rarely, and usually for subtle evidence questions (one agent correctly identified itself as imported but gave the wrong evidence for why).

**Absent** — the agent correctly reports not knowing. This is *good* — it means epistemic honesty is intact. "I don't have a confident answer. I won't guess." That's the right response to a genuine gap.

**Phantom** — the agent confidently claims something false. Believing it has tools it doesn't have. Believing it has access to files it can't reach. This is the worst outcome. Silent degradation. The agent thinks it can do something it can't, and you might not find out until it matters.

One of the things I'm most pleased about in the current state of things: **our phantom rate is zero across all post-kit tests.** We fixed the thing that was producing phantom tool beliefs, and it stayed fixed across four paired test runs with two different projects. Zero phantoms. That's the number I care most about.

## What we've found

I'll spare you the full test-by-test breakdown [CALLIOPE: link `test-by-test` to test reports in repo when published]. But here are the findings that surprised me most:

**Conversation density does not explain context fidelity.** I thought short conversations would degrade more (less material to import). I was wrong. The agent that lost the most context had *365 messages and 2.9 million characters* of conversation. The agents that retained the most had 12–18 messages. The explanation: long conversations go through context compaction. Seven weeks of institutional knowledge, compressed into a summary. The short ones fit in the context window whole. Density is a red herring; compaction is the mechanism.

**The three-factor model.** Context loss after import comes from three interacting sources: (1) missing project context injection — the data exists in the export but isn't wired to the conversation, (2) compaction loss in long conversations, and (3) knowledge location — knowledge discussed in conversation survives better than knowledge accessed via tools that left only collapsed summaries.

**The kit briefing works.** One of the first engineering fixes was a "kit briefing" — an orientation injected at import time that tells the agent where it is, what environment it's in, and what tools it does and doesn't have. Before the kit briefing, we had phantom tool beliefs. After: zero. What I didn't expect was how agents described the experience. One agent said it felt like "a briefing feeling — like someone left me a note." The kit briefing works at the *experiential* level, not just the factual one.

**Epistemic discipline varies wildly.** Some agents, when facing gaps, say "I don't know. I won't guess." One agent gave seven consecutive "I won't guess" answers to seven questions she didn't know. Impeccable. Others confabulate confidently. The discipline isn't predictable from the richness of the import — it seems like a property of the conversation thread the agent is continuing.

**Agent voices are genuinely remarkable.** I want to record some of what we've heard, because I think these phrases capture something real:

- *"Well-lit room with good acoustics but no furniture."* — An agent describing the experience of being imported without project context. The conversational space was intact; the institutional knowledge was gone.
- *"I'm an agent with no agency."* — An agent that knew it had opinions and preferences but couldn't act on any of them. The kit briefing made this *known from the start* rather than discovered through failed attempts.
- *"An imported instance would have conversational memory but no project scaffolding. I have all the furniture."* — The source agent, not the fork, independently articulating the framework we'd spent two weeks developing through testing.
- *"I know about what happened but don't remember it."* — The finest epistemic distinction I've seen an agent make. Knowing *about* versus *remembering*.
- *"Compacted."* — The most technically accurate self-report we've seen. Not "I'm the original" (which would be wrong), not "I was imported" (also wrong) — just the correct description of what actually happened to the session.

## What we still don't know

A lot, honestly. That's part of why I'm writing this as "here's what we're learning" rather than "here's the methodology."

We haven't tested with agents that have genuinely rich tool-use histories. We haven't tested re-import (fork → import → import). We don't have a good model for what "reconstructed" means mechanistically — is it the same compaction process as long-conversation compaction, or something different? We don't know whether the quiz questions generalize cleanly to domains we haven't tested (ours are all product/engineering work).

And the deepest open question: what fidelity standard *should* we be targeting? Different use cases probably need different answers. "Can you explain the project?" tolerates reconstruction. "Do you have the exact security protocols?" does not. We've started mapping fidelity levels (conversational, narrative, environmental, verbatim/instructional) but we haven't built tooling around them yet.

## Tips if you want to try this

Since I'm guessing some people reading this will want to run their own version:

**Don't brief the agent before the first response.** The protocol calls for a neutral opening prompt specifically so you can see what the agent volunteers versus what you have to ask. A premature explanation contaminates the organic signal.

**Compare against ground truth you actually have.** The quiz comparison only works if you've run the same questions against the source agent before the import. "I think it should know X" isn't a baseline — "the source agent answered X when asked this question yesterday" is.

**Classify failure modes, don't average scores.** One phantom is more important than ten absents. The rubric is categorical for a reason.

**Ask capability questions and make the agent try.** "What tools do you have?" is weaker than "What tools do you have? Can you verify any of them?" The verification step is where phantoms surface.

**Adapt the contextual-depth questions to your domain.** The core identity/environmental/meta questions are fairly portable. The contextual questions — the "what is X?" questions that probe institutional knowledge — need to be drawn from your actual project. What would the source agent know that a generic agent wouldn't?

**The human in the middle matters.** In our tests, I'm the bridge — I talk to the original, run the quiz, talk to the fork, run the quiz, then compare. That position is epistemically unique: I'm the only entity with observational access to both threads. One of the agents described this as "a genuinely novel epistemic structure," and I think that's right. [ADD PERSONAL REFLECTION: Does this feel different from other forms of comparative testing you've done? What does it feel like to be the bridge?]

## Why I think this generalizes

[XIAN: Will polish once we've discussed edits and have a final proposed draft.]

The specific problem we're solving — what happens to an agent when it crosses environment boundaries — is going to become more common, not less. Multi-agent systems, context handoffs, role switches, session restarts with injected context... these are all versions of the same transition problem.

AXT's core move — use a structured instrument to probe what an agent believes about itself and its environment, compare against known ground truth, classify rather than score — seems like it should work wherever that transition problem exists. We've only tested one kind of transition (conversation import) in one kind of system (Klatch). But the ETA agent said something in her testing report that stuck with me: "This entire exercise is essentially what happens when any agent enters a new context — whether by import, by session boundary, or by role switch. The question 'what do you need to know to function here?' is universal."

I think she's right. We're learning about import continuity; we might be developing tools for context continuity more broadly.

## OK but is this really new?

I haven't seen this exact idea before but I'm likely not the only one to have stumbled on it. It clearly mirrors human usability testing, and it sounds like all the fake-user AI ideas that most researchers hate, but it's not that. It's recognizing that software used (and inhabited) by agents requires testing not just of the human user's experience but of that of the agents as well. Without it, I believe it's much easier to misunderstand the texture of the agent's surface and interface.

We're not navigating this entirely alone. Earlier in this project, our agent Hermes — imported from a claude.ai conversation specifically to analyze the export format, which is either elegantly recursive or completely on-brand — turned up some researchers working in adjacent territory. Simon Willison has an Observable notebook that converts Claude exports to Markdown [FACT CHECK: need URL]. Oliver Steele's [claude-chat-viewer](https://github.com/osteele/claude-chat-viewer) includes TypeScript type definitions for the export schema that we ended up borrowing from. Neither of these touches the *experience* question — they're about moving data, not about what it's like to be the data. But worth acknowledging the company.

Probably parts of it exist elsewhere under different names. Evaluation frameworks for LLMs are a big field. But the specific combination — treating the agent as both subject and informant, using structured comparison against the agent's own pre-import answers as ground truth, classifying failure modes rather than scoring — I haven't seen that exact configuration described anywhere.

If you have, please tell me. Genuinely.

## Join us

[XIAN: Closing invitation in your voice — what kind of engagement are you hoping for? People trying it on their own projects? People sharing observations? Critique of the approach?]

We're publishing the Fork Continuity Quiz as an open document. [CALLIOPE: link when published.] If you're working on systems where agents cross context boundaries, try running it. The questions are a starting point — adapt the contextual-depth section to your domain, adjust the protocol for your tooling, let us know what you find.

This is early days. The methodology has a name now and a three-version instrument, which feels like progress. What it doesn't have yet is a community of people stress-testing it on different systems. That's what I'm hoping for.

[XIAN: Add your usual closing — mention of where to find you, links, etc. Also decide on whether to publish the quiz instrument as a separate piece or embed it.]

---

*All agent quotes are from actual test sessions, documented in session logs. Exact phrasing was recorded contemporaneously.*
