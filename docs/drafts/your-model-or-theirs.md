# Your Model or Theirs

*On irreducible complexity, data portability, and who decides what your AI context is*

---

Larry Tesler spent his career on a single idea. He articulated it so clearly that it bears his name: Tesler's Law, the Law of Conservation of Complexity. Every application has an inherent amount of complexity that cannot be removed or hidden. It can only be moved — from the user to the system, or from the system to the user.

Tesler worked on it at Xerox PARC, at Apple (where he led the Lisa and Newton teams), at Amazon, and at Yahoo, where one of us had the good fortune to work with him. He died in 2020. The law outlived him, as good laws do.

We've been thinking about Tesler's Law a lot lately, because we're building a tool that manages AI conversations — and the complexity we're grappling with turns out to be a textbook case.

---

## The sprawl

If you use Claude seriously, you probably use it in more than one place. Claude.ai for conversations and projects. Claude Code for development work. Cowork (the desktop app) for tasks that need local file access. Maybe the API directly for specialized applications.

Each surface has its own model of what a "project" is:

- **Claude.ai** stores projects in the cloud — a knowledge base, a system prompt, conversation history, and accumulated memories. Persistent, but only accessible through the web interface.
- **Claude Code** treats the repository as the project — CLAUDE.md is the system prompt, the codebase is the context, and session memory accumulates in a git-adjacent directory. Local, versioned, but scoped to development.
- **Cowork** binds projects to local folders — files, instructions, and project-scoped memory on your machine. Local, cross-domain, but not portable beyond the app.

Three surfaces, three storage models, three memory systems. You can import a Claude.ai project into Cowork. You can point Cowork at a Claude Code repository. But there is no unified view. There is no export that carries everything. There is no standard for what "everything" even means.

This is a specific instance of a general problem, and the general problem is the one worth talking about.

---

## The general problem

Every AI platform stores your context in its own format, optimized for its own surface. This is natural — each surface has different capabilities, different persistence models, different assumptions about what you're doing. The format serves the platform.

But your context doesn't belong to a platform. Your context is yours: the accumulated decisions, preferences, institutional knowledge, working patterns, and project state that make your AI interactions useful rather than generic. It's the difference between an assistant that knows your project and one that's meeting you for the first time.

When you work across multiple surfaces — and increasingly, serious AI users do — you face a choice that most people don't realize they're making:

**Option A: Let each platform own its slice.** Your Claude.ai project knows one version of reality. Your Code sessions know another. Your Cowork tasks know a third. They don't synchronize. They drift independently. When you switch surfaces, you start over, or you manually carry context across, which means you become the synchronization layer. The complexity lands on you.

**Option B: Establish your own model.** Define what your context *is* — not in any platform's terms, but in yours. Then treat each platform's format as an import/export target, not as the source of truth. The complexity lands on your system.

Option A is the default. It's what happens when you don't choose. Option B requires building or adopting something — a schema, a tool, a discipline — that can normalize across surfaces and serve as the canonical representation of your work.

This is Tesler's Law in action. The complexity of managing context across multiple AI environments is irreducible. *Someone* grapples with it. The only question is who: you, or your tools.

---

## Three clocks

A recent experiment made this concrete for us. We imported a mature Claude.ai project — one with years of accumulated context, dozens of documents, thousands of lines of project memory — into a Cowork session. The import was faithful: every document, every instruction, every memory item arrived intact.

But the experiment also revealed something structural. After the import, the project's knowledge existed in three physically distinct locations:

1. **The Chat project snapshot** — a read-only copy of the source project, frozen at import time, stored in the new session's local directory. It contains everything the source project had on the day of import. It will never update.

2. **The Code repository memory** — if this project also has a Claude Code presence, there's a separate memory store in a git-adjacent directory, shared across Code sessions but invisible to Chat or Cowork.

3. **The repository itself** — CLAUDE.md, documentation files, source code. The actual source of truth for anyone who knows to look there.

Three locations. Three representations of "what this project knows." No automatic synchronization between them.

We called this the "three clocks" problem: independent timekeepers that started together and immediately begin to drift. Update the project memory in Chat — Code doesn't see it. Add a decision to CLAUDE.md — the Chat project snapshot is frozen. Accumulate context in Cowork — it stays local.

This isn't a bug in any individual platform. Each surface is working correctly, within its own scope. The problem is that your project doesn't live in one scope. You do things in Claude.ai on Monday, in Code on Tuesday, in Cowork on Wednesday. By Thursday, you have three partial views of the same project, each internally consistent and mutually out of sync.

The person who notices the drift — the person who has to reconcile it — is you.

---

## What a model needs to do

If you're going to build or adopt your own context model (Option B), what does it need to handle?

At minimum, it needs to answer five questions about any piece of your AI context:

1. **Where does the agent orient itself?** (Environmental context — what capabilities exist here, what don't, what's the current situation?)
2. **What are the project's rules?** (Instructions — conventions, constraints, behavioral guidance)
3. **What does the project know?** (Memory — accumulated facts, decisions, state)
4. **What's specific to this conversation?** (Session context — the particular focus or agenda)
5. **Who is the agent?** (Identity — the persona, role, and behavioral calibration of the specific agent involved)

These five questions correspond to five kinds of knowledge, and they have very different portability characteristics. The first four can be serialized and transferred between environments with high fidelity — they're information, and information travels well. The fifth is behavioral. It's built through interaction, not through documents. When you move an agent to a new environment, everything it *knows* can come along. Everything it's *learned to do* — the judgment, the calibration, the implicit understanding of how you work — stays behind.

This asymmetry is important because it means a model isn't just a schema for data. It's also a map of what survives transit and what doesn't. A good model tells you: here's what we can carry automatically, here's what needs explicit attention, and here's what will have to be rebuilt through use. The honest acknowledgment of what doesn't transfer is as valuable as the successful transfer of what does.

---

## The portability imperative

None of this matters if you use one AI surface for one thing and never switch. But the trend is clearly toward multi-surface work — not because users prefer complexity, but because different tasks genuinely benefit from different environments. Coding is better in Code. Conversation is better in Chat. File-heavy work is better in Cowork. Specialization is real and valuable.

The trap is that specialization creates silos, and silos create the synchronization burden. The user who works across three surfaces isn't getting three times the value — they're getting three partial views and an unpaid job as the integration layer.

This is where the tool opportunity lives. Not in replacing any surface — they're each good at what they do — but in being the place where context is unified, normalized, and owned. Import from anywhere. Export to anywhere. Maintain one model that each surface's format maps onto, rather than maintaining three models that happen to overlap.

The alternative — the default — is that your AI context is whatever each platform says it is, in whatever format that platform prefers, accessible only through that platform's interface. Your data, their model. Your work, their portability story (or lack of one).

Tesler would recognize this. The complexity is real. The only question is where it lives. If the tools don't absorb it, you do — manually, repeatedly, and with increasing friction as the number of surfaces grows.

---

## The choice

We're building Klatch because we believe the tools should absorb it. That's a design conviction, not just a product pitch. The five-layer model we developed isn't Klatch-specific — it's a general framework for thinking about what AI context is, how it transfers, and where the gaps live. We use it to structure our import pipeline, our testing methodology, and our export planning. Someone building a different tool could adopt the same framework and reach different implementation decisions. The model is the contribution; the tool is one instance.

But you don't need our tool, or anyone's tool, to make the choice. You can start by deciding that your AI context belongs to you, not to any platform — and then organizing accordingly. Keep your project instructions in a file you control. Maintain your memory in a format that isn't locked to one surface. When you switch environments, be explicit about what came with you and what didn't.

The complexity doesn't go away. But it moves to where it belongs: into the system, not into your head.

---

*This is the fourth post from the Klatch project. Previous posts: [Agent Experience Testing](/blog/axt-agent-experience-testing.html), [It's On the Tip of My Tongue](/blog/tip-of-my-tongue.html), [What Does an Imported Agent Know?](/blog/prompt-assembly.html). Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*
