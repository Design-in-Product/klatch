---
name: Session log turn-by-turn; logbook is retrospective
description: Two distinct disciplines — session log is real-time, pegged to each turn; logbook is a retrospective story-of-the-day synthesis
type: feedback
originSessionId: 3ec0595d-75b1-4997-9b64-f559bd3fd19c
---
xian's preferences for the two parallel logging artifacts (2026-05-13):

**Session log (`docs/logs/YYYY-MM-DD-HHMM-calliope-opus-log.md`)** — maintain turn-by-turn, in real time. Usually something substantially new happens at each turn that's worth recording. When xian shares a timestamp at the start of his message ("8:07," "5:54 AM"), that's a cue to peg an entry to that moment. The session log captures what happens *as it happens* — not a batched retrospective at the end.

**Logbook (`log.html`)** — handle as a retrospective. Sit down with all the agent logs (Daedalus, Argus, Iris, Theseus, etc.) plus my own session log, and tell the story of the day in narrative form. The logbook is multi-source synthesis, not a real-time record. It can wait until the day's session is wrapped and all the other agents' logs are committed.

**Why:** the two artifacts serve different readers and different purposes. The session log is the working journal — its job is reliability and granularity, so future-Calliope and other agents can reconstruct what happened exactly. The logbook is the narrative — its job is to tell the story coherently for an outside reader. Mixing the disciplines makes the session log too narrative (loses granularity) and the logbook too granular (loses story).

**How to apply:**
- Open the session log at session start.
- After every meaningful turn — a finding, a decision, a deliverable, a piece of mail received, a tool call that surfaced something — add a timestamped entry. Don't wait for "natural batch boundaries."
- When xian opens a message with a timestamp, treat it as a literal cue: peg the next session-log entry to that timestamp.
- Don't write the logbook entry during the session. Save logbook authoring for end-of-day or next-morning retrospective when the full picture is visible.
- Don't conflate the two formats. The session log can be terse and bullet-y; the logbook is narrative paragraphs. Don't try to make the session log read like a story or the logbook read like a journal.

**What this corrects:** prior behavior of batching session-log updates at natural stopping points (every several turns) instead of after each turn. This worked OK as documentation but missed the granularity discipline — and it also made the session log feel more "retrospective" than it should, blurring the distinction with the logbook.
