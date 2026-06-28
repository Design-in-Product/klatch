# Klatch — Composition Gesture Beta — release notes (DRAFT)

**Status:** draft for the morning release cut. The composition gesture is fully implemented, merged to main, and QA-passed (Iris MAXT-03 15/15; Theseus R46+R47 AAXT green — beta gate clear). **Version:** `v0.10.0` (minor) or `v1.0.0` (your call) — `v0.9.0` is already taken by the April Step-9 release.

---

## Headline: the klatch composition gesture

Klatch can now compose multi-agent conversations — **klatches** — through a fluid creation surface: assemble a roster, choose how the agents interact, and start a group conversation, without ceremony.

### What's new for users

- **Create a klatch without a project.** Klatches no longer require a project up front. Channels with no project land in a "First project" group, and the project picker only appears once real projects exist — a solo user never sees project chrome.
- **Agent picker.** Compose a klatch's roster with a searchable picker: type-ahead filter, selected-agent chips with a live count (e.g. 2/5), roles surfaced first.
- **Interaction modes.** *Panel* (all agents respond in parallel), *Roundtable* (sequential — each sees the prior responses), *Directed* (@-mention routing). Switchable per klatch.
- **@mention — address one agent in any mode.** Typing `@` in a klatch shows an autocomplete of its agents; an `@mention` routes that message **only** to the addressed agent(s), overriding the channel's default mode for that message. A message with no `@` still reaches everyone as before.
- **Clone a klatch.** "Copy setup from an existing klatch" prefills a new klatch's name, purpose, mode, project, and roster from one you already have — built for recurring setups (e.g. a weekly review).
- **Cross-reference in 1:1 chats.** A 1:1 chat with an agent shows the klatches that agent also participates in ("Also in: #…"), so you can move between an agent's solo and group contexts.

---

## Quality

- **Iris — MAXT Session 03** (live, real API, fresh user state): **15/15 probes pass**, including @mention override routing confirmed end-to-end ("only the addressed agent responds").
- **Theseus — AAXT R46** (clone-from-klatch) **+ R47** (@mention override): **green — beta gate passes.**
- Automated: server suite **1120** + client suite **212** green; tsc clean on the changed code.

---

## Notes for the cut

- **The one open decision is the version** — `v0.10.0` (minor bump) vs `v1.0.0` (declaring 1.0).
- This summarizes the **composition gesture** — the beta's defining feature. If you want a fuller categorized changelog of *all* changes since `v0.9.0` (623 commits, mostly internal agent-coordination + docs), say the word and I'll generate one at the cut.
- Public-facing **announcement framing** is Calliope's domain — this is the factual "what shipped" raw material for her and the release notes.
- Not in this release (tracked post-beta): New-Chat form agent picker; New-Klatch form-state-reset-on-reopen polish.

*— Drafted by Daedalus overnight, ready for the morning release cut. Edit freely.*
