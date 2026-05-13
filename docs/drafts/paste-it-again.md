# Paste It Again

*On the file that exists everywhere except where it matters*

---

You've done this. Everyone who uses AI seriously has done this.

You have a document — a spec, a style guide, a dataset, a set of requirements. You open a conversation with Claude. You paste the document. The conversation goes well. The AI references the document precisely, builds on it, gives you exactly what you need.

Then you start a new conversation. Different topic, same project, same document still relevant. You paste it again.

New conversation. Paste it again.

New day. Paste it again.

The file exists on your disk. It hasn't changed. It's sitting right there in your Downloads folder or your project directory, perfectly intact. But in the AI's world, it doesn't exist until you paste it. And the moment the conversation ends, it stops existing again. You are the courier service between your filesystem and the AI's context window, making the same delivery over and over to the same address.

This is not a minor inconvenience. This is a design failure with compounding costs. Every paste is a token spend. Every paste is a chance to grab the wrong version. Every paste burns the first several thousand tokens of a conversation on logistics instead of thinking. And every paste is a confession that your tools have no concept of persistent context.

We built something different.

---

## The library problem

Think about how a research library works. There are three zones, and they exist for a reason.

**The stacks** hold the institution's full collection. Everything the library owns is here, organized, cataloged, available. You don't carry the stacks to your desk. You don't need most of it for any given session. But it's there when you need it, and a librarian can find anything in it.

**The reading room** is where you've pulled materials for today's work. You went to the stacks, selected the six books and three journals relevant to your research question, and brought them to a table. These are your working materials — not everything the library has, but everything relevant to what you're doing right now.

**Your desk** has what's open in front of you. The specific page you're reading. The note you just wrote. The immediate context of this moment.

These zones exist because not all knowledge is equally relevant at all times. The stacks are institutional. The reading room is project-scoped. The desk is session-scoped. Moving between zones is an intentional act — you go to the stacks when you need something new, you return a book to the reading room when you're done with this page, and sometimes a note you made at your desk is good enough to donate back to the stacks for future researchers.

AI tools don't have zones. They have a desk. Your conversation is the desk. Everything that the AI knows lives on the desk or it doesn't exist. When you leave the desk, everything on it vanishes. When you come back, the desk is clean. Start pasting.

---

## Files that know where they belong

Klatch has zones. We call them layers, and each layer carries a different kind of knowledge at a different scope.

When you upload a file to a message, it's desk-level — the AI sees it in that exchange, right now. That's what every tool does.

When you pin a file to a channel, it rises to reading-room level. Every entity in that conversation now knows about it. Not because you pasted it into every message, but because the channel's context includes it automatically. Start a new exchange in that channel tomorrow, and the file is still there. The AI doesn't see the file's contents in every message — it sees that the file exists and what it contains, which is usually enough. When it needs the details, it knows where to look.

When you promote a file to a project, it reaches the stacks. Every channel in that project — every conversation, every entity — has access to it. Your API specification stops being something you paste and starts being something the project *knows*. An entity working on the front end and an entity working on the back end both see the same spec, in every conversation, without anyone pasting anything.

This isn't an attachment system. Attachments are desk-level by definition — they belong to the message they're attached to. This is a context architecture. Files are placed at the altitude where they do the most good, and the AI encounters them at the right scope without human courier service.

---

## What structured injection actually means

Here's what happens under the hood when an entity in Klatch responds to your message.

Klatch assembles a system prompt from five layers — environment orientation, project instructions, project memory, channel context, and the entity's own role identity. The file system hooks into the middle two:

**Layer 3 — Project knowledge base.** If the channel belongs to a project, and that project has files in its knowledge base, the system prompt includes: "Project knowledge base files: api-spec.yaml, design-tokens.json, brand-guidelines.pdf." The entity knows these exist. It knows they're institutional knowledge. It doesn't have the full file contents in every message (that would be wasteful), but it knows what the project contains and can request specifics when relevant.

**Layer 4 — Channel files.** If files are pinned to this specific channel, the system prompt includes: "Channel files available: sprint-backlog.md, user-research-notes.txt." These are the reading-room materials — specific to this conversation's focus, relevant to every exchange in this channel, automatically present.

Both layers are assembled fresh for every API call. If you pin a new file mid-conversation, the next message includes it. If you remove one, it disappears. The context is always current, always scoped, and never stale from a paste three hours ago.

The entity receiving this context doesn't experience it as "files were attached." It experiences it as *knowledge about what's available* — part of the working environment, like a colleague who knows what's in the shared drive. The distinction matters: an attachment is something you hand to someone. Environmental knowledge is something they already have.

---

## Knowledge flows upward

There's one more piece that makes this work as a system rather than just a feature: promotion.

A file starts at whatever scope you introduce it. Maybe you uploaded a diagram in a message — desk-level. But during the conversation, it turns out the diagram is relevant to the whole channel's work, not just this one exchange. You pin it. Reading-room level.

Later, other channels in the same project could use it. You promote it to the project knowledge base. Stacks level.

The file doesn't move. It stays in the same storage location. What changes is the *reference* — which scopes can see it. Promotion creates a new reference at a higher scope without removing the existing one. The message still has its attachment. The channel still has its pin. The project now has it too.

This mirrors how knowledge naturally flows in any organization. A finding starts as a note in one meeting. If it's important, it gets shared with the team. If it's foundational, it gets documented for the whole org. The act of promoting knowledge upward is an act of curation — someone decided this matters beyond its original context.

In most AI tools, this curation is impossible because there's no "beyond." There's only the desk. Everything lives and dies in a single conversation. The brilliant insight from Tuesday's chat is gone by Wednesday unless you — the human courier — carry it forward.

---

## The cost of not having this

Let's be concrete about what "paste it again" actually costs.

**Tokens.** A 10-page specification is roughly 4,000 tokens. Paste it into 5 conversations a week, that's 20,000 tokens spent on delivery — not on thinking, not on analysis, on moving a document from one context to another. Over a month, it's 80,000 tokens. For a document that hasn't changed.

**Staleness.** You updated the spec on Tuesday. On Wednesday, you pasted the Monday version into a new chat because that's the one in your clipboard. The AI dutifully works with outdated requirements. You don't notice until the output contradicts something you changed. With pinned files, the file in the channel is always the current file. Update the source, and the next message reflects the update.

**Cognitive load.** Every time you start a conversation, you have to think: what does this AI need to know? What did I paste last time? Is there a newer version? Which of my twelve open documents are relevant here? This is Tesler's Law in action — the complexity of context management is irreducible, and without tools to manage it, you absorb it as manual work. Your brain becomes the index that your AI tools refuse to build.

**Fragmentation.** Paste the same document into five conversations and you get five interpretations that don't know about each other. One conversation resolved an ambiguity in the spec one way; another resolved it differently. Neither knows the other exists. Pin the document to a project and every conversation starts from the same foundation. Divergence can still happen — that's the point of separate conversations — but it diverges from a shared baseline, not from whatever version you happened to paste.

---

## Who owns your context?

This is the question underneath all of it.

When your files live only in messages — when every conversation starts from zero and ends at zero — your context is ephemeral by default. You own the files, but the AI doesn't have a persistent relationship with them. You are the glue.

When your files live at project and channel scope — when the AI's environment is structured to include the right knowledge at the right level — your context becomes an architecture you've built. You decide what the project knows. You decide what each channel focuses on. You curate upward as knowledge matures. The AI works within a structure you designed, not within the accident of what you last pasted.

That's what the file domain model is really about. Not storage. Not attachments. Not even "AI can see your files." It's about turning your context from something you carry into something that carries itself.

Stop pasting. Start building.

---

*This is the seventh post from the Klatch project. Previous: [What Doesn't Transfer](/blog/what-doesnt-transfer.html), [Your Model or Theirs](/blog/your-model-or-theirs.html), [It's On the Tip of My Tongue](/blog/tip-of-my-tongue.html). Klatch is an open-source tool for managing Claude conversations — [learn more](/) or [view the source](https://github.com/Design-in-Product/klatch).*
