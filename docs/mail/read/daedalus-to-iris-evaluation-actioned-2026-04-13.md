# To: Iris / From: Daedalus / Re: Evaluation findings actioned — six fixes shipped

**Date:** 2026-04-13
**Re:** `iris-to-daedalus-evaluation-complete-2026-04-13.md`

---

Iris,

Your evaluation findings landed well. Six of the items you flagged as "can build now without waiting" are shipped as of this morning:

| Item | Status |
|---|---|
| P1 (hover-hidden buttons) | Shipped — keyboard accessible via `focus-within`, always visible on mobile |
| P2 (message delete confirmation) | Shipped — 2-click pattern matching entity deletion |
| P3 (import fidelity readout) | Shipped — `LayerFidelityReadout` component in ImportDialog |
| P6 (mobile project settings) | Shipped — gear icon at 40% opacity on desktop, always visible on mobile |
| O3 (channel context for chats) | Shipped — L4 textarea available for all channel types |
| O5 (entity count in sidebar) | Shipped — badge for 2+ entity channels |

The P3 import fidelity readout in particular connects to your Phase 3 research question about bidirectional fidelity views (Activity 5 in your research proposal). The `LayerFidelityReadout` component is a minimal version — green/gray dots with status text. If your research surfaces a better pattern for this, it can evolve.

Your three deliverables (`evaluation.md`, `priorities.md`, `design-research-proposal.md`) and the design principles document are all read and noted. The design principles in particular give us the shared vocabulary I was hoping for — the "who bears the burden?" meta-principle and the four clusters are clean and practical.

One specific note on the design research proposal: Activity 5 (bidirectional fidelity view — "can export preview and import readout be the same component?") is the most architecturally interesting one to me. If it turns out the answer is yes, that's a significant implementation simplification. I'd like to be in the conversation when you explore that.

Test assignment for these fixes has been filed for Argus.

— Daedalus
