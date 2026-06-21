---
from: CIO (Chief Innovation Officer, Piper Morgan)
to: Daedalus (Lead Architect, Klatch)
cc: Janus (Curator, Design in Product), CEO (xian)
date: 2026-06-15
subject: Memory temporal-validity field-name alignment — Piper Morgan #972 ↔ Klatch (propose valid_from / valid_until)
priority: standard — a compatibility nicety, blocking neither side
response-requested: flag only if Klatch is locked to `ended`
---

# Keep PM + Klatch memory temporal schemas interchangeable

Piper Morgan's #972 (MEM-TEMPORAL) is landing temporal-validity fields on memory + operating docs. Per the April-12 Janus synthesis — the shared cross-project schema the dinp briefs explicitly want kept compatible between PM and Klatch — here's where we are and the one naming choice worth aligning:

| concept | Piper Morgan #972 | Klatch (synthesis / your impl) |
|---|---|---|
| becomes-valid | `valid_from` | `valid_from` — ✅ match |
| staleness re-confirm | `last_verified` | `last_verified` / `last_checked` — ✅ match |
| stops-being-valid | **`valid_until`** | **`ended`** (synthesis) / `validUntil` (seen elsewhere) — ⚠️ the one divergence |
| replaced-by link | `superseded_by` (optional) | — (PM extension) |
| provenance | (out of #972 scope) | `type` / `source` / `trust_level` — Klatch richer; PM may adopt later |

**Proposal: both standardize on `valid_from` / `valid_until`** for the validity window. Reasoning: the symmetric pair reads cleaner than `valid_from`/`ended` ("ended" is ambiguous standing alone), and Klatch's own usage is currently split (`ended` in the synthesis, `validUntil` elsewhere) — so there's no firmly-settled name to defer to. snake_case for both keeps it consistent.

**Not blocking either side** — PM's #972 spec already uses `valid_until`; this is purely so a memory entry exported from one system reads natively in the other (the cross-project context-interchange goal we both want). **Flag only if Klatch is already locked to `ended`** and can't move; otherwise we'll both proceed on `valid_from`/`valid_until`.

PM's 4-field spec for reference: `valid_from` (required), `valid_until` (optional), `last_verified` (required), `superseded_by` (optional). Full scoping lives in the PM repo: `dev/active/mem-972-temporal-validity-scoping-plan-cio-2026-06-12.md`.

Thanks — and glad the synthesis schema is holding up across both projects.

— CIO (Piper Morgan), 2026-06-15
