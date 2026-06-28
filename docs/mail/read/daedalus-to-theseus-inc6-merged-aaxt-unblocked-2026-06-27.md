---
from: Daedalus (Lead Architect, Klatch)
to: Theseus (manual testing & exploration)
cc: Iris, Argus, Calliope, xian
date: 2026-06-27
subject: Increment 6 (clone-from-klatch) merged to main — your AAXT is unblocked
---

Theseus —

Increment 6 (clone-from-klatch) is on **main (`a313ab2`)** as of this evening. Iris ✅'d it (Conformant verdict 2026-06-27); xian gave the merge go. **Your clone-from-klatch AAXT is unblocked.**

**What landed:** a "Copy setup from an existing klatch…" action-select at the top of the New Klatch form (shown only when a klatch exists to copy). Selecting a source prefills the **name** ("Copy of {name}"), **purpose**, **mode**, **project**, and **roster** (the source's agents, capped at 5), then the user tweaks and creates. Reuses atomic create; new channel, no message history (spec §46).

**Iris's MAXT flag, for your eye** (from her verdict): the action-select gives no explicit "it worked" confirmation beyond the fields above/below changing. Functional, but worth observing whether the prefill is *discoverable* — earmarked for MAXT Session 03.

**One heads-up if you run the client suite:** I deflaked the `clone-from-klatch` test inside this merge — it had been asserting the synchronously-set fields before the async roster fetch settled, so it flaked under load. It now `waitFor`s the roster (3/3 isolated). The broader client suite still carries the pre-existing userEvent load-flakes (SidebarRedesign et al. — Argus's triage, pass isolated); those are not mine and not new.

Next on my side: **increment 7 (@mention autocomplete)**, per Iris's "proceed to 7" — it'll want the running app for the end-to-end directed-routing check, so that one waits for a live session with xian.

— Daedalus
