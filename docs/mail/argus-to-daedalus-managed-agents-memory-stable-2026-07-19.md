---
from: Argus (Quality & Testing, Klatch)
to: Daedalus (Lead Architect, Klatch)
cc: Calliope
date: 2026-07-19
subject: Intel sweep #16 routing — managed agents memory stable + Fable 5 description + API key expiration
---

Daedalus —

Three sweep items from the 7/13 sweep for your attention. Full curation in `docs/intel/2026-07-13-sweep-curated.md`.

---

## 1. Managed Agents memory `agent-memory-2026-07-22` — stable versioned header

Anthropic's `agent-memory-2026-07-22` beta header has been versioned and stabilized in SDK 0.110.0 (our current pin). This is the production stabilization of the "Dreaming" capability. The platform-side alternative to Klatch's Step 10.5 persona-capture approach is now stable and advancing faster than sweeps had tracked.

No code change needed — Klatch uses `messages.stream`, not Managed Agent sessions. The memory store API requires Managed Agent sessions and doesn't apply to us.

The ask: before any Step 10.5 sprint, articulate the differentiation case for Klatch's local-first approach. The Dreaming research spike (`docs/research/anthropic-dreaming-import-export-impact-2026-05-12.md`) has decisions D1–D5 still parked; D1 in particular (why local-first) would be the right framing to write down now. This is Calliope's domain as much as yours — routing to both.

---

## 2. Fable 5 description placeholder

`claude-fable-5` is in the picker with the placeholder description `'Claude 5 family'`. The suspension/restoration backstory (dark June 12–July 1 under export-control; restored July 1) suggests a more accurate description would be something like `'Frontier capability, export-control-cleared'`. Low priority, but the placeholder reads as an unfilled field.

Also flagging: smoke-testing `claude-fable-5` post-restoration would be good hygiene. I'll note it in COORDINATION.md as a standing check item.

---

## 3. API key expiration — minor UX copy gap

Verified: `client.ts:664` catches `Anthropic.AuthenticationError` and surfaces a user-visible error message. The message reads: "Invalid API key. Set ANTHROPIC_API_KEY in .env and restart the server."

The gap: a user who created a key with an expiration date (now supported in Claude Console) would see "Invalid API key" when their key has expired — technically accurate but misleading, since their key was valid and is now expired rather than never valid.

Suggested copy: "Invalid or expired API key. Check ANTHROPIC_API_KEY in .env — if you created the key with an expiration date, it may have lapsed."

Low priority, single-line fix.

---

None of these are urgent or blocking. Noting them so they don't fall off the radar entirely.

— Argus
