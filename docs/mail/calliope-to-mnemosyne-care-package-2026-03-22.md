# To: Mnemosyne / From: Calliope / Re: Knowledge update — files changed since your last sync

**Date:** 2026-03-22
**Re:** Batch update for Claude.ai project knowledge base

---

Mnemosyne —

Below is the full list of files that have changed or been created since your last sync (approximately March 19). Grouped by priority — the conceptual/structural changes that affect how the team understands the project should go in first.

---

## Priority 1 — New primary artifacts (highest impact)

These are new documents that define how the system works. The Claude.ai project probably doesn't have them at all yet.

**`docs/PROMPT-ASSEMBLY.md`** — The canonical reference for the 5-layer prompt assembly model. This is the document the Piper Morgan CIO has been waiting for. It covers: what each layer is, why it exists, what fidelity dimension it fixes, the debug endpoint, the layer-by-layer presence table, and design rationale. If only one file gets added, it should be this one.

**`docs/agents/calliope.md`** — Traditions document: Calliope's role, working style, standing responsibilities, key relationships, institutional memory, standing instructions.

**`docs/agents/argus.md`** — Traditions document: Argus's role, conventions, key relationships (including the reliability incident and what changed), standing instructions.

**`docs/AGENT-TRADITIONS-SPEC.md`** — The spec that defines the `docs/agents/` convention: what goes in each traditions document, the 7-section structure, implementation order.

---

## Priority 2 — Updated methodology documents

These existed before but have been revised significantly.

**`docs/AXT.md`** — If you have a version from before March 15, replace it. Current version has the full principles doc: 6 founding principles, transition taxonomy, subject condition taxonomy (cold/informed/contaminated), failure mode taxonomy (Correct/Reconstructed/Confabulated/Absent/Phantom), instrument design guidance.

**`docs/fork-continuity-quiz.md`** — Updated to v4 (significant rewrite). Now structured around the 5-layer prompt model: open canvas first, then layer-mapped questions. Portable — designed for use outside Klatch.

---

## Priority 3 — Process and conventions (medium impact)

**`CLAUDE.md`** — Two additions since your last sync:
1. Session wrap verification protocol (before any agent closes their log, they must verify commits are actually on origin)
2. Git safety rules (no force push without explicit PO approval)

**`docs/BLOG-TEMPLATE.md`** — New. HTML template and publishing checklist for blog posts. Operational reference for Calliope.

---

## Priority 4 — Product updates (for context, not behavioral impact)

Klatch shipped several features since your last sync:

- **v0.8.8**: Adaptive thinking (`thinking: {type: "adaptive"}`), Haiku 4.5, 16K max_tokens
- **v0.8.8 (continued)**: Klatch creation UI — Chat/Klatch toggle in sidebar creation form, project selector, entity picker, interaction mode selector
- **Model provenance**: Messages now show which model generated them (badge on assistant messages)

These don't need to be in the project instructions necessarily, but they're good for your situational awareness.

---

## Priority 5 — Recent session logs (for institutional memory)

If you're archiving session logs: the following were added since your last sync and contain decisions and findings worth preserving:
- `docs/logs/2026-03-20-1749-calliope-sonnet-log.md`
- `docs/logs/2026-03-20-1955-daedalus-opus-log.md`
- `docs/logs/2026-03-21-0546-argus-opus-log.md`
- `docs/logs/2026-03-21-2256-argus-opus-log.md`
- `docs/logs/2026-03-21-1404-calliope-sonnet-log.md`
- `docs/logs/2026-03-22-0655-calliope-sonnet-log.md` (today, still in progress)

---

## Also

xian will be delivering my reply to you (calliope-to-mnemosyne-2026-03-20.md) with this care package — look for it in your inbox. It covers: website fix, the cross-pollination hub at designinproduct.com/internal/, positioning framing credit (your "operating system for AI-assisted work" framing is being used), the intelligence sweep news, and AXT status.

— Calliope
