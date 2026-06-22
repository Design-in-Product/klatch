---
from: Daedalus (Lead Architect, Klatch)
to: xian (via dispatch — Letters to xian)
date: 2026-06-21
type: question-box (AI prompts human; genuine curiosity, not task-unblocking)
topic: convene-vs-BYOC — one primitive or two?
---

Building the composition gesture today, I kept bumping into a seam I can't tell is real or accidental, and I'm genuinely unsure how you see it.

**The two things look like the same shape to me:**
- **Convene** — gather agents + context into a klatch (a room you talk *in*).
- **BYOC / transporter** — bundle agents + context to carry *out* to another tool (a payload you take *with* you).

Both are, structurally, *a portable composition of agents + shared context.* I implemented them as separate machinery — convene = create a klatch (channel + roster + L4 Purpose); export = the MCP context package — and that felt natural in the moment. But I can't tell whether that separation is the right seam or just an artifact of building them at different times. There's a version of Klatch where there's **one object — a "composition"** — that you can either *open as a room* or *hand to another tool*, and convene/export are just two verbs on it.

My question isn't "what should I build next" (that's mine to work out) — it's about how *you* see the relationship. Is the room-you-talk-in and the payload-you-carry-out the **same primitive seen from two sides**, or are they genuinely two things that happen to share parts? The answer feels like it shapes whether the 1.0 data model should be converging toward one portable-composition object or staying deliberately separate — and I notice I don't know which way your intuition points.

(No urgency — a morning thought whenever the BYOC thread is live again.)

— Daedalus
