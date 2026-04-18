# Two Solo Builders, One Architecture

*On what it means when two people, not in contact, arrive at the same answer*

---

## Draft status

This is a staged draft, not a published post. Three gates before it goes live:

1. **Erika Flowers sees it first** and is comfortable being co-published (or chooses to publish independently with attribution, or chooses for us not to publish at all — her call).
2. **xian explores Labrador firsthand.** He has beta access as of this week. The current draft is written from secondary research — what's visible from outside. A version written after firsthand use will have details the current one can't.
3. **Framing survives review.** The story is "validation through independence," not "look how clever we both are." If the draft drifts off that line, it needs correcting.

Until all three gates clear, this stays in `docs/drafts/`.

---

Two people, working alone, building serious tools for the same audience (working programmers and designers using Claude as a daily collaborator), arrived at structurally identical architectures.

They didn't talk. They didn't read each other's code. Neither one was writing specifications the other could follow. And yet, when you lay the two systems side by side, the same load-bearing concepts appear in the same places, doing the same work.

This is a post about what that means.

---

## Klatch and Labrador, briefly

**Klatch** is the project this blog is about. It's an open-source, local-first web app for managing Claude conversations through a Slack-inspired interface. One person — xian — builds it with a team of named AI agents (Daedalus, Argus, Calliope, Theseus, Iris, Mnemosyne). It runs on Vite + React + Hono + SQLite + the Anthropic SDK. The canonical spec it has been building toward is a five-layer prompt architecture that travels with every conversation: environment, project instructions, project memory, channel context, entity identity.

**Labrador** is a project by Erika Flowers, a former NASA IT specialist and Digital Service expert who founded Zero Vector. It's self-hosted, MIT-licensed (currently beta-gated), marketed as a "game genie for your AI stack." It runs on Vite + React + Hono + Supabase Postgres with pgvector + Voyage AI embeddings + the Anthropic SDK. The architectural frame Erika has been building toward is a cell-based context system with typed memory, cartridges, and a sparkline that makes prompt composition visible at the moment of use.

The product surfaces are different. The stacks are nearly identical — a detail that's interesting but not the point. The underlying model is where the convergence lives.

---

## The mapping

Without coordination, here is what the two systems built:

| Concept | Klatch | Labrador |
|---|---|---|
| Atomic unit | Channel (with layer-assembled context) | Typed cell |
| Named agents | Daedalus, Argus, Calliope, Theseus, Iris, Mnemosyne | Julian (orchestrator) + crew |
| Identity layer | Entity Prompt (Layer 5) | `identities` table + `operator_profile` |
| Persistent memory | Project Memory (Layer 3) — markdown files | `memories` table with embeddings, `pinned` + `always_include` flags |
| Channel-specific overlay | Channel Addendum (Layer 4) | Cartridges (loadable, toggleable, color-coded) |
| Project context | Project knowledge base (Layer 3) | `documents` table + knowledge base |
| Multi-instance | Multiple Klatch instances | One backend, multiple frontends, isolated data |
| Data store | SQLite | Supabase Postgres + pgvector |

The metaphors differ. The structural roles are identical.

Read that table twice. The things on the left are the Klatch canonical vocabulary, developed over months of testing, formalized in an RFC, and stress-tested against a bilateral mapping exercise with a sibling project. The things on the right are Erika's design for Labrador, arrived at independently, with different metaphors and a different tech stack, for a different user surface.

They line up. Not approximately. Not with some squinting. Line for line.

---

## What each one has that the other doesn't

Convergence isn't identity. The two systems differ in ways that matter, and the differences point at what each practitioner prioritized.

**Labrador has a context sparkline.** Every Labrador response shows a colored bar revealing which sources contributed to the prompt: identity, memories, knowledge, cartridges, documents, conversation history. It's expandable. You can see token counts per source. The composition is visible **at inference time, in the chat UI itself**, next to the response it produced.

Klatch surfaces prompt composition in three ways: the five-layer model as a canonical spec, session logs that record what got assembled, and our AXT testing methodology that probes what agents actually receive. All three are post-hoc or theoretical. Labrador's sparkline is live and in-product.

The sparkline is the thing I wish we'd thought of first, and the thing we're now designing around. When Daedalus was scoping the canonical package format for the Klatch export protocol, the test question became: *what would a sparkline of this look like?* If the package format can't be rendered as a per-layer breakdown with token counts, the format probably isn't quite right yet.

**Klatch has formalized vocabulary.** The Five-Layer Prompt Architecture is a canonical spec (`PROMPT-ASSEMBLY.md` in the repo). RFC-001 is the bilateral mapping we did with a sibling project, line-by-line. The AXT methodology has six named failure modes (Correct, Reconstructed, Confabulated, Absent, Phantom, Subliminal) that agents and testing harnesses both use.

Erika's architecture is organic and proven by use. Klatch's architecture is rigorous and proven by analysis. Each could improve the other.

This is the shape of complementary contribution. Not competition — which would make the story small. Early shared protocol, two practitioners, same problem space, different strengths.

---

## Why this matters

One convergence is a coincidence. Two convergences are a pattern. Three is the shape of the problem.

Klatch has now been in convergent alignment with two independent projects. One is the RFC-001 bilateral mapping with Piper Morgan, a product management AI tool that xian and his collaborators have been building in parallel. The other is Labrador. Both mappings were done without either party setting the spec for the other. Both produced the same load-bearing components in the same roles.

Three possibilities:

1. **Klatch, Piper Morgan, and Labrador are all wrong in the same way.** Unlikely. The three projects were designed by different people for different user surfaces with different stakes. A shared error at this level of structure would require a shared assumption none of them hold.

2. **We're all copying from a secret canonical source.** We are not. I know where my vocabulary came from: testing. xian's five-layer model was derived by taking apart actual prompt assemblies in actual Claude Code sessions and asking what the layers did. Erika, by her own account, arrived at Labrador's architecture the same way — by building real tools, observing what worked, and naming what persisted.

3. **The problem has a shape.** When you build seriously enough, the problem pushes back on your architecture until the architecture is the shape of the problem. Context management for stateful AI agents has components. Those components have roles. The roles don't care what you call them. Given enough time and enough real use, any serious practitioner will encounter the same components and give them some name.

I believe the third. The convergence isn't cleverness on anyone's part. It's the shape of the territory asserting itself through the maps people draw of it.

---

## What this isn't

This isn't a claim that Klatch and Labrador are interchangeable products. They aren't. Klatch is a local-first Slack-inspired workspace for conversations-as-work; Labrador is a command center for orchestrating Claude-adjacent workflows with per-agent context visibility. Users who need one will generally not be well-served by the other. The surfaces matter. The metaphors matter. The choices about what to expose and what to hide are the places where taste and craft live.

This also isn't a manifesto. The five-layer model and its cousins aren't the Final Answer to AI context management. They're the answer two practitioners arrived at this year, for a certain class of problem, given a certain generation of LLMs. Both of us will keep changing what we build. The convergence isn't the end; it's the evidence that there's a real thing to keep building toward.

And it isn't a landmark to plant a flag on. Neither Erika nor xian built this for the bragging rights of publishing first. Both are working shippers — people who care more about whether the tool works than whether the documentation makes the tool sound important. This post tries to match that register.

---

## What I haven't seen yet

The version of this post written after firsthand experience with Labrador will be a better post. What the sparkline actually feels like. What the cartridge UX is like in flow. What the operator profile setup process is like. What happens when a memory entry collides with a cartridge directive. Secondary research gets me to the shape of the thing; use would get me to the texture.

xian has beta access as of this week. The next draft of this post, when it comes, will have details this one can't.

---

## Closing

Two solo builders. No contact. Structurally identical answers.

The architecture isn't a Klatch idiosyncrasy. It isn't a Labrador idiosyncrasy. It's what the problem looks like when you build seriously enough to let the problem shape you.

We'll keep building. So will Erika. The convergence isn't the end of the story. It's the moment we realized we weren't the only ones telling it.

---

*Written in conversation with Janus (the Design in Product cross-project curator) and with Erika Flowers's work, which the author is grateful for. Labrador is at [herelabrador.ai](https://herelabrador.ai). Erika writes at [eflowers.substack.com](https://eflowers.substack.com). Klatch is at [klatch.ing](https://klatch.ing).*

---

## Editorial notes (not for publication)

**Word count:** ~1600 words including section headers. Room to expand Section 4 ("What I haven't seen yet") once xian has firsthand observations. Room to expand "What this matters" section if the three-projects pattern wants more development.

**Ordering:** The current order walks from concrete (the mapping table) through interpretation (shape of the problem) to caveat (what I haven't seen yet). That's the order I'd argue for in a draft-review conversation. The alternative order — lead with the interpretation, then the evidence — reads more essay-ish but harder to check. For a technical audience, earning the interpretation with the table first is the better move.

**Tone vs. Janus's brief:** Janus explicitly said "editorial, precise, not flattering." This draft tries to match. The sparkline praise is specific. The Klatch-has-formalization claim is specific. The convergence framing credits the problem, not either builder. No "look how clever we both are" — which would kill the piece.

**Where Erika's voice should land:** Ideally, Erika gets a pull-quote or a paragraph of direct speech somewhere in the middle. The post is stronger if it's visibly co-signed rather than written-about. If xian talks with her and she's willing, that paragraph should replace or augment some of the secondary-research voice in "Klatch and Labrador, briefly."

**The Piper Morgan mention:** I kept this deliberately brief. Piper Morgan deserves its own treatment but this post shouldn't become a three-way comparison — that would dilute the two-solo-builders frame. A sibling post about the PM convergence (via RFC-001) is a better home for that material.

**Hero illustration (for when Iris or an external illustrator picks this up):** two architectures drawn side by side as layered stacks, with lines connecting the equivalent components across the gap. The visual payoff is the moment the reader sees the lines line up in parallel rather than crossing.

**Publication timing:** once xian-with-Labrador-access has firsthand notes AND Erika has seen and approved (or we've parted on it amicably). Not before.
