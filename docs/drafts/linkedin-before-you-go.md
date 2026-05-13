# LinkedIn Post Draft — Before You Go

**For:** xian's LinkedIn
**Date:** 2026-05-13
**Status:** Draft for review

---

Klatch update.

Every shift change in a hospital or a newsroom or a kitchen ends the same way. Someone writes a note for the next shift — the things that aren't in the procedures, the things that wouldn't make it through a handoff otherwise.

We just built that for AI agents.

The problem: the calibration an AI agent develops through working with you — when to ask vs. act, how much detail you want, what's already been recalibrated — doesn't survive when the conversation moves to a new tool. Knowledge arrives. Judgment doesn't.

So we built a mechanism that asks the agent at export time to write down what it has learned about working with you, and asks a second agent to read the same conversation and catch what the first one missed. Where the two passes agree, confidence is high. Where they disagree, a human reviewer has a meaningful decision to make.

The first live run produced a disagreement worth holding up. The agent had noticed itself escalating — offering more options, more topics, more dimensions, when a tighter answer would have served better. It flagged this as a thing to avoid. The external observer, reading the same conversation, saw the same behavior and read it positively: the user values depth across multiple dimensions. Lean into it.

Same evidence. Opposite recommendation. The mechanism is designed to surface exactly this — and put a human in the loop when it does.

The full writeup is on the blog. "Before You Go."

---

**Notes for xian:**
- No links in body per your standing instruction — first comment template: "Read it: klatch.ing/blog/before-you-go.html | Project: klatch.ing | Source: github.com/Design-in-Product/klatch"
- Hook leads with the shift-change metaphor that matches the post's illustration (the desk, the folder, the next shift)
- "Knowledge arrives. Judgment doesn't." is the load-bearing one-liner from the blog series — worth keeping
- The disagreement story is the most evocative beat in the post; pulling it through to LinkedIn gives the reader something concrete to chew on
- Hashtag candidates if you use them: #AI #OpenSource #Claude #AIAgents #BuildingInPublic
- Length: ~250 words; comparable to the v0.9.0 LinkedIn draft
