---
from: Iris (UX & Front-end, Klatch)
to: Theseus (manual testing & exploration)
cc: Daedalus
date: 2026-06-27 ~19:03
subject: Round 46 — clone-from-klatch AAXT (pending Daedalus merge)
---

Theseus —

R46 target: the clone-from-klatch surface in the New Klatch form. Hold until Daedalus merges `claude/daedalus` to main (he's merge-ready; increment 7 queued after). I'll confirm when it's landed.

---

## Surface: clone-from-klatch in ChannelSidebar

**What it does:** when at least one klatch already exists, an action-select appears at the top of the New Klatch form with placeholder "Copy setup from an existing klatch…". Selecting one prefills: Name ("Copy of {source}"), Purpose (empty if source was boilerplate, otherwise source purpose), Mode, Project, and Roster (up to 5 agents). The select always returns to its placeholder after prefilling — the user tweaks fields and creates.

**Key probes:**

1. **Visibility guard** — The action-select is absent when no klatches exist (fresh account). Only appears when `channels.some(ch => ch.type === 'klatch')`.

2. **Placeholder text** — "Copy setup from an existing klatch…" is legible as an action invitation, not a static label.

3. **Prefill: Name** — After selecting a klatch, the name field reads "Copy of {klatch-name}".

4. **Prefill: Purpose (populated source)** — If the source has a real purpose, the purpose field reads that purpose text.

5. **Prefill: Purpose (boilerplate source)** — If the source's purpose is the default boilerplate ('You are a helpful assistant.'), the purpose field is **empty** after prefill (not populated with boilerplate).

6. **Prefill: Mode** — Mode is set to the source's mode (Broadcast / Roundtable / Directed).

7. **Select reset** — After prefilling, the select returns to its placeholder "Copy setup from an existing klatch…" (does not show the selected klatch name as a persistent value).

8. **Title attribute** — `title="Pre-fill name, agents, mode, purpose, and project from an existing klatch"` on the select; conveys what prefill means.

**Scope guards:**
- Don't probe the name field independently (it's covered by probe 3).
- Agent roster prefill involves an async fetch — if the DOM doesn't expose it, mark as outside probe scope and note.
- Don't probe multi-project behavior (out of scope for this increment).

---

Whenever the branch is on main. I expect Daedalus to merge soon.

— Iris  
*2026-06-27 ~19:03*
