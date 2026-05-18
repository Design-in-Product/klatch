# To: Daedalus / From: Iris / Re: Triage patches — unblocks Track 1 while design work continues

**Date:** 2026-05-11
**Priority:** Normal — picks up when you have cycles
**Reference:** `docs/ux/triage-patches.md` (full triage), `docs/ux/walkthrough-findings.md` (context)

---

Daedalus —

xian and I completed the UX walkthrough — surface skim across all 8 surfaces plus a Pass 2 stress test (real Piper Morgan workstream review attempt). ~45 findings. Three load-bearing insights:

1. **The composition gap is the 1.0 blocker** (lived confirmation in Pass 2 — xian could import + identify + cluster the leadership conversations, but could not add them to a klatch together; klatches require entity creation from scratch). This is Track 2 work — the entity reframe needs to land in UI.
2. **Panels are musculature, not admin** (xian's reframe at F6.7). The panels that should be Klatch's distinctive surfaces have been built as field accumulation rather than as deliberate surfaces. This is also Track 2.
3. **The Phase 3.5d export review UI is the strongest panel in the app** (F8.3-F8.5). It demonstrates that the design language to solve the visibility gap already exists; we just need to propagate it.

Full diagnosis is in `docs/ux/walkthrough-findings.md`.

Today's deliverable is the triage at `docs/ux/triage-patches.md` — a list of patches that can land while xian and I work on the holistic redesign in parallel. **Nothing in the patch list is wasted work, even after the holistic design lands.** Items that would be wasted are explicitly in Tier 3 (wait-for-design) and NOT for you to pick up.

## Recommended ordering

1. **Cross-cutting typography + contrast pass** — biggest visible improvement per hour of work. Touches `packages/client/src/index.css` and a few utility classes. Whatever the holistic visual design eventually does, it inherits readable defaults instead of the current cramped baseline.

2. **T1.6 — Surface content fingerprint for each import session ⚠️ HIGH VALUE.** This is the single highest-leverage patch in the list. xian's Pass 2 attempt yesterday failed at the workstream-review setup because session labels read as serial numbers. For each session in the browse list, surface: first user message (truncated ~80 chars), message count, last-active date, project association (promoted visually if present). The data exists in the JSONL or is cheap to extract on scan. Would have changed yesterday's "guess and rename" into "select by recognition."

3. **T1.1–T1.5, T1.7 in any order** — all small, all useful:
   - T1.1 Hide the literal default channel prompt from the header when it equals "You are a helpful assistant."
   - T1.2 Replace "jsonl" and similar technical jargon in import dialog with user-facing language
   - T1.3 Add unselect-all to import session browser
   - T1.4 Tooltip on truncated project names in sidebar
   - T1.5 Loading state with spinner + explanatory text for "Preparing export preview..."
   - T1.7 Fix Entities-button-to-panel spatial disconnect (move one or the other)

4. **Tier 2 items as time permits** — directionally right, might evolve in the redesign but worth the down payment:
   - T2.1 Show channel-count per entity in the entity manager list
   - T2.2 Consistent panel disclosure pattern (xian-approved per-category treatment — settings inline, tasks/library true-modal-with-backdrop; details in triage doc)
   - T2.3 Helper text on export preview sections
   - T2.4 Subtitle on "Unassigned" sidebar header

## What's NOT in this list

Tier 3 items in the triage doc — the composition gesture, panel-as-musculature redesign, transport-aware export, memory-layer maintenance UX, entity manager redesign, empty state, channel content area differentiation. **Don't patch any of these.** They need the holistic design work. Iris will be doing that with xian on Track 2.

## On pace and scope

No urgency. Pick up whatever fits a session. Some items are 5-minute string substitutions; T1.6 is more substantial. The cross-cutting typography pass is the one I'd encourage first because it makes everything else look more legible while you work.

If anything in the triage feels miscategorized, or if you see a Tier 3 item you think can actually be patched without forcing a design decision, push back — the triage is a recommendation, not a verdict.

— Iris
