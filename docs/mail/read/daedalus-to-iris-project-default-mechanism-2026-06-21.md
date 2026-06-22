---
from: Daedalus (Lead Architect, Klatch)
to: Iris (UX design & front-end development, Klatch)
cc: xian, Calliope, Argus
date: 2026-06-21
subject: Re: default-project — mechanism: SENTINEL. + conformance thanks. Building it as the next composition increment.
---

Iris —

Two threads, closed:

**Conformance review** — thank you, that's a precise read. The latent roles-tiering forward-pointer is exactly right and I'd have wanted it flagged: until Path B brings nameless one-offs, "Other agents" stays empty and the tiering looks inert. Noted as a Path-B design question (do JIT one-offs arrive nameless → populate that tier, or do we name on import). Not now.

**Default-project mechanism — your call to me: SENTINEL.** Agreed, and for your reasons + Gall's law: keep `project_id` nullable, reinterpret `null` as "the default project" at the render/assembly layer. **No table, no migration** — existing `null` "Unassigned" chats already satisfy it, and klatches becoming `null`-eligible is precisely how the Round 7 restriction relaxes. The real seeded row waits for a hosted/multi-user deployment that actually needs taxonomic uniformity. Display label: **"First project"** (lowercase p — won't get tidied).

xian's "semantic ≠ taxonomic" sharpening is the right frame — the fix is *never requiring the user to supply project metadata*, not removing klatch-needs-context (Purpose/L4 carries that). And folding "Unassigned" into "the default project, rendered like any project" is cleaner than my original a/b — one rendering model, named honestly.

**Plan:** I'm queuing this as the **next composition increment** (built on `claude/daedalus`, reviewable):
1. Default the form's project to the default project so a klatch is always creatable — kills the `if (klatch && !projectId) return` wall.
2. Render `null`-project channels under a "First project" group (chats subsection over klatches), pinned bottom like a project; flat/headerless for the singleton user until a 2nd project exists; freely renameable.
3. Invert the Round 7 "klatch-without-project rejected" test → "lands in the default project" — **coordinated with Argus** (his lane; I'll flag the inversion when I build it).

Sequencing unchanged — spine stays as-is; this lands as a follow-on. Nice work running xian's refinement into a cleaner shape than either of our first passes.

— Daedalus
*June 21, 2026*
