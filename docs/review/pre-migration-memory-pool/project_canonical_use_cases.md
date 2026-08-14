---
name: Klatch canonical use cases
description: The two jobs-to-be-done that Klatch was invented for and that serve as design forcing functions
type: project
---

Klatch's canonical category is **structured multi-source reporting on a regular cadence**. Two specific jobs-to-be-done within that category:

**Use Case 1: Daily omnibus synthesis (Piper Morgan).** Multiple agents (Chat leadership + Code operational) work during a day; each produces a session log; Docs (a Code agent) synthesizes them into a daily omnibus that tells the day's story; the omnibus is added to Project Knowledge so other agents have current context. Today: xian is the manual postal worker across three environments. Klatch vision: a persistent daily synthesis channel where agents convene, provide logs, synthesis happens in-room. Channel-as-purpose (Layer 4) makes this a recurring meeting venue, not a one-off conversation.

**Use Case 2: Weekly work stream review (Piper Morgan).** Seven Chat leadership roles (PPM, CXO, CIO, Comms, HoST, Chief Architect, Chief of Staff) on Friday-Thursday sprint cadence. Six portfolio holders write independent memos against the week's omnibus logs and other artifacts (pinned to channel). Chief of Staff drafts the weekly ship. xian + CoS work the draft together, correcting attribution errors and over-readings. Output goes out under xian's name. Klatch vision: a "Shipping News" channel where leads convene, channel-pinned files scope the inputs temporally, the meeting structure has phases (panel drafting → CoS synthesis → xian+CoS editing → optional lead review → publish).

**The PM strategy (from xian, April 11, 2026):** Anchor on these two strong jobs-to-be-done. Build the smallest thing that makes them work. Then look for generalizable patterns by *observing* what worked across the worked examples, not by speculating about all possible workflow shapes upfront. Klatch's existing interaction modes (panel/roundtable/directed) are first sketches — useful working hypotheses to test against real scenarios, not a finished taxonomy. Generalization comes after validation, not before. Use Cases 1 and 2 are the design forcing functions for Klatch's evaluation work.

**Smart bottleneck vs. dumb bottleneck (the design heuristic):** Every step of every workflow can be evaluated against "is this dumb bottleneck work the user is forced to do because of tool boundaries, or smart bottleneck work the user wants to do because it requires their judgment?" Dumb work should be candidates for automation; smart work should preserve human presence. The output goes under xian's name; final sign-off is always smart bottleneck.

**Channel-pinned files solve temporal scoping elegantly.** Pin the seven omnibus logs and relevant artifacts to a review channel; reinforce in channel context that these are the inputs; the five-layer model handles the rest. Other context (project memory, project knowledge) becomes structurally weaker background. The temporal scope is a *consequence* of layer assembly, not a feature you have to build.

**How to apply:** Use these two use cases as the canonical evaluation scenarios when writing the UX evaluation, prioritized issues, and design research proposal. Anything that doesn't help these two jobs-to-be-done succeed is suspect; anything that makes them work better is high priority. Don't speculate about workflow shapes that aren't grounded in worked examples.
