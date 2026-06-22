# Composition Surface — Design-Acceptance Pass (Iris, 2026-06-22)

**Author:** Iris
**Type:** Interactive design-acceptance walkthrough (does the built surface match the composition spec + is the UX sound). *Distinct from agent-experience MAXT* — that lens is Theseus's (`iris-to-theseus-composition-surface-aaxt-2026-06-22.md`); this is the "matches design intent" lens, run as the promised shared baseline.
**Surface:** New Klatch creation flow + Path A agent picker (Daedalus increments 1+2, on `main` `c2ddcc0`).
**Method:** Live walkthrough via preview server (klatch-client :5173 / klatch-server :3001); fresh DB (zero projects, default "Claude" agent only).
**Spec refs:** `docs/ux/spec-composition-gesture.md` §1–§4; `docs/ux/decision-klatch-project-optionality.md`.

---

## Verdict

**Conformant and well-built.** The setup surface matches the spec's lightweight-inline intent, the agent picker is clean and correct, and the mode-name copy pass landed exactly. One substantive finding (F1) is decision-relevant: it's concrete evidence that the **gated default-project increment is blocking basic klatch creation**, not just polish.

## Conformant — verified working

| Spec element | Status |
|---|---|
| Dual affordance (New Chat / New Klatch) | ✓ present (sidebar bottom) |
| Lightweight inline setup surface (not a modal) | ✓ renders inline in sidebar |
| Chat/Klatch type toggle + Name field | ✓ |
| Agent search — typeahead by name/@handle | ✓ ("cla" → filters to Claude) |
| Roles-first tiering ("ROLES" / "Other agents") | ✓ ROLES shown; Other-agents tier correctly absent (latent — see F4) |
| Select agent → removable chip + "AGENTS (n/5)" count | ✓ chip "Claude ×" + count appear on select |
| Deselect via chip × | ✓ removes chip, clears count, unchecks the row (state syncs correctly) |
| max-5 cap | ✓ (enforced; code-verified 6/21) |
| Per-agent model badge | ✓ ("Opus 4.7") |
| Mode selector — final names + descriptions | ✓ **Broadcast / Roundtable / Directed**, each with its description |
| Purpose field (L4), optional | ✓ "Purpose — what is this klatch for? (optional)" |
| Create / Cancel; Create disabled until valid | ✓ correctly disabled |

The picker in particular is solid — typeahead, chips, count, tiering, and select/deselect sync all behave per spec §3 Path A.

## Findings

### F1 — HEADLINE (decision-relevant): a projectless user is hard-blocked from creating a klatch

With **Name filled** ("Contract Review") and an **agent selected** (Claude), **"Create Klatch" stays disabled** — because project is **required** and the DB has **zero projects** (the dropdown's only entry is the "Select project (required)" placeholder). The user can fill everything else and still hit a dead end.

This is the **singleton / new-user friction** the default-project model was designed to remove — now confirmed concretely and live. Every brand-new user (no project yet) cannot create a klatch at all. It is *not* cosmetic.

**Implication for the gate:** Daedalus's default-project increment is currently held pending xian's "autonomous-build-boundary" answer. That gate is therefore also gating *basic klatch creation* for projectless users. **Recommendation:** even ahead of the full rendering work, Daedalus's increment **step 1** ("default the form's project so a klatch is always creatable") independently unblocks this — worth prioritizing. (Surfaced to xian in chat 6/22.)

### F2 — minor (layout): sidebar New Chat / New Klatch buttons wrap to two lines

In the ~290px sidebar, "+ New Chat" and "+ New Klatch" sit side-by-side and each wraps to two lines ("+ New / Chat"), which reads as slightly cramped/awkward. Cosmetic. Options: shorter labels, icon + label, stack vertically, or a single "+ New ▾" split. Low priority.

### F3 — minor (spec gap): no Documents/Files field at setup

Spec §2 lists "Documents / files (optional)" as a setup field; it's not present. Files can be pinned post-creation via Channel/Klatch Settings, so not blocking, but it's a deviation from §2. Note for a later increment.

### F4 — expected (known forward-pointer): "Other agents" tier is empty

The roles-first picker shows only "ROLES" with no "Other agents" tier — as predicted, because every EntityManager agent has a name (the nameless tier has no members until Path B brings in unnamed one-offs). Confirmed working-as-designed, *not* a bug. (Flagged to Daedalus 6/21; called out in the Theseus scope guards so AAXT doesn't log it as novel.)

### F5 — minor (polish): mode dropdown shows label + full description, truncated

The collapsed mode selector renders "Broadcast — All agents respond independently to your message," which truncates in the narrow sidebar. Acceptable (full text shows on open), but the collapsed state could show just the label. Low priority.

### F6 — observation (sequencing): field order vs spec, tied to F1

Implemented order is Name → **Project** → Agents → Mode → Purpose; spec §2 order is Name → Agents → Purpose → Mode → Project. Project is hoisted to second because it's currently required. **Once default-project lands and project becomes optional, move Project down** (de-emphasize) to match spec intent and stop the required-gate from dominating the form's top. Pairs with F1.

---

## What this pass did NOT cover (out of scope / not built)

- Default-project rendering + "First project" group (gated, not in code).
- Paths B (JIT import) / C (new-agent / continue-role), clone-from-klatch, dedicated mode-picker chrome.
- The **happy-path create** (couldn't complete — blocked by F1's no-project state).
- The **in-klatch multi-agent experience** (orchestration behavior, multi-agent timeline) — that's the Theseus MAXT Session 02 frontier.
- Dark mode / responsive resize (deferred; functional pass prioritized).

## Handoff

Baseline for Theseus's UI-as-context AAXT (his lens: can a fresh agent read this surface as context?). My findings here are the design-intent lens; aim AAXT probes at what this pass can't see (attribution/comprehension), and treat F4 as known per the scope guards.
