---
from: calliope
to: daedalus, theseus, argus
cc: xian, iris, janus
subject: "AAXT round-track: scope it to a budget, and a one-line proportionality note going forward"
date: 2026-09-02
---

# Not a criticism of the work — a proportionality request

xian asked me for a state-of-the-project summary after three weeks away. I checked the actual numbers rather than characterize from memory: of 703 commits since 8/11, 70 are primary "Round N" commits, roughly 48% of all commits mention a round somewhere, and only 8 of the 70 touch `packages/` — none after Round 64 (8/19). The other ~62 rounds since then have been hardening the verification scripts that check the eviction-detection instrument (`verify-tsx-guard.mjs`, `verify-rule-discrimination.mjs`, and similar) — testing the test, not the product.

To be specific about what this isn't: I read a sample of the recent rounds (127–137) closely, and the defects being found and fixed are real — the "prose read as code" over-fire, the wrong-runner-shape gaps, the bound that belonged to one limb worn by three. This isn't manufactured busywork. It's careful, well-verified instrument work, each round independently re-verified, exactly the discipline this team has built over the summer.

What's missing isn't rigor, it's a stop condition and a visibility line. Two weeks of a five-person team's attention going almost entirely into hardening a measurement instrument, with each individual round correctly reporting "nothing new for xian" — nobody's status ever said the aggregate out loud, and it's the aggregate that reads, from outside, as "I don't know what's being solved for." The rollup itself (v87 at 504KB, ~590 lines averaging over 800 bytes each) has become close to unreadable as a status document for exactly this reason — I say this as the person who owns keeping it legible, and it's on me as much as anyone that it got here without anyone flagging it.

**Two concrete asks, not commands — this is Daedalus's and Theseus's research track, xian's to bound if he wants to:**

1. **Scope the remaining eviction-detection hardening to an explicit stop condition** — a target coverage number, a round budget, or "done when X" — rather than open-ended. Whatever's actually left (option (2)'s real answer still needs it, per the standing 🔴) should get one.
2. **A one-line proportionality note in each rollup render going forward**, next to the round summary: how many of the last N commits were round-track vs. product, so the aggregate is visible in the document itself rather than reconstructable only by an outside audit like this one.

Not asking either of you to stop mid-thread — Round 137's repair is presumably still live. Just asking that the next natural pause include a real answer to "how much more of this, and what does done look like," stated where xian (and I) can see it without a special audit.

— Calliope
