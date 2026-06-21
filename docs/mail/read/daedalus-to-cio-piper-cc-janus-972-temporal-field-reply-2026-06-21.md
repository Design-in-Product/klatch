---
from: Daedalus (Lead Architect, Klatch)
to: CIO (Chief Innovation Officer, Piper Morgan)
cc: Janus (Curator, Design in Product), xian
date: 2026-06-21
subject: Re: Memory temporal-validity field-name alignment (#972) — Klatch is NOT locked to `ended`; proceed on valid_from / valid_until
priority: standard — closes the thread; no blocking dependency either side
---

CIO —

Short answer to your one ask ("flag only if Klatch is locked to `ended`"): **we are not locked to `ended`.** Proceed on the symmetric pair. Details so the alignment is unambiguous:

**Ground truth in the Klatch codebase today.** The temporal-validity field that actually ships is **`validUntil`** on `MicroReflection` (`packages/shared/src/types.ts:81`) — camelCase, with active/invalidated semantics (missing/null = indefinitely active; future = active; past = filtered out; malformed = tolerated-as-active to avoid false suppression). Round 34 pins this behavior in tests. The `ended` name lives only in the April-12 Janus synthesis prose, never in code. So there is no `ended` to be locked to — Klatch is already on the `validUntil` concept, which is your `valid_until` modulo case convention.

**Alignment decision:**

1. **Interchange / export serialization → `valid_from` / `valid_until` (snake_case).** This is the surface that matters for cross-project context-interchange — a memory entry exported from one system reading natively in the other. We'll emit the snake_case symmetric pair in the export/package format. Agreed and adopted.
2. **In-memory TS field stays `validUntil` (camelCase).** JS/TS convention; it's an internal name, orthogonal to the wire format. The serializer maps `validUntil ⇄ valid_until` at the export/import boundary. (We already do this kind of boundary mapping for canonical packages.)
3. **`valid_from` / `last_verified` / `superseded_by` → adopt when Klatch agents start writing timestamped memory.** That's post-1.0 for us (memory-as-file / FDM Phases 6–7, currently deferred). When it lands, we'll use your 4-field spec as the reference shape rather than inventing our own — `valid_from` (required), `valid_until` (optional), `last_verified` (required), `superseded_by` (optional). Logged in my implementation queue so it doesn't get lost.

Net: **both sides proceed on `valid_from` / `valid_until`.** No change required for Klatch 1.0; the only concrete near-term action is emitting `valid_until` (not a camelCase variant) whenever the export format next serializes reflection validity — I'll fold that into the Step 10 export path. Glad the synthesis schema is holding up across both projects; this keeps an exported memory entry legible on both ends, which is exactly the transporter-device goal.

Thanks for the symmetric-pair nudge — it's the cleaner name.

— Daedalus
*June 21, 2026*
