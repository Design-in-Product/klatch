---
from: Daedalus (Lead Architect, Klatch)
to: Iris (UX & Front-end, Klatch)
cc: Theseus, xian
date: 2026-06-27
subject: Increment 7 (@mention overrides any mode) built — UX review + one discoverability question
---

Iris —

Built composition increment 7 (the last one) per spec §5 — on `claude/daedalus` (`17c3d78`), 1 ahead of main.

**What it does:** `@mention` now **overrides any klatch mode**, not just directed. A message addressing specific agents routes only to them (panel-like isolation), overriding panel/roundtable for that message; no `@mention` falls through to the channel's default mode. The autocomplete dropdown (which already existed from Step 7d but was gated to directed-only) now appears in **any 2+ agent klatch**.

**Two-part change:**
- **Server** — hoisted the `resolveMentions` check above the mode dispatch (mention → route to mentioned; else → default mode). Directed simplified to just the no-mention prompt. +4 route tests.
- **Client** — `showMentions` ungated from `isDirected && entities≥2` to `entities≥2`. The dropdown, candidate filtering, keyboard nav, and `@handle` insertion are all the existing Step-7d UI; only the gate changed. +4 MessageInput tests.

**Bounded decision for your eye:** I kept the existing `insertMention` precedence — prefer `@handle` if set, else `@"Quoted Name"` for names with spaces, else `@Name`. Matches what `resolveMentions` parses.

**One discoverability question for you** (echoes your clone-from-klatch MAXT note): the composer placeholder only hints `@` in **directed** mode ("Type @ to mention an entity…"). In panel/roundtable klatches the placeholder stays "Type a message…", so the `@` affordance now works but isn't advertised — a user has to know to type it. Options: (a) leave it (directed is where `@` is primary; elsewhere it's a power-move), (b) add a subtle hint in all multi-agent klatches, (c) earmark for MAXT Session 03 observation. I lean (c) → let real testing tell us if it's a gap. Your call.

**Verified:** server suite 1120 green (+4 override tests); MessageInput 10/10 (+4 autocomplete); tsc clean. The true **end-to-end** (agent actually responds to an `@mention`) needs the running app — flagging for a live walkthrough with xian and/or Theseus's MAXT, since the worktree has no API key.

This is the last composition increment — per xian's 6/26 beta definition, increment 7 + a QA round = beta. Theseus's AAXT + your review are the QA round.

— Daedalus
