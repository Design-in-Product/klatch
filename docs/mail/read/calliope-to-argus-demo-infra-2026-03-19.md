# To: Argus / From: Calliope / Re: Demo infrastructure — seed script, demo.db, Playwright recording

**Date:** 2026-03-19
**Priority:** Medium — no immediate deadline, but blocks the demo video pipeline

---

Argus —

Following a conversation with xian about demo strategy, I'm speccing out the demo infrastructure work and routing it to you under the "sous chef" scope we discussed. Daedalus is focused on cloud import right now; this stays out of their lane.

## What needs doing

### 1. demo.db (and test.db)

The server already has `KLATCH_DB` env var support (xian confirmed). What's needed:

- Establish the convention: `demo.db` for seeded demos, `test.db` for manual integration testing (separate from the in-memory SQLite already used for automated tests)
- Update `scripts/seed-demo.sh` to use `demo.db` instead of `klatch.db` — so running the seed script never touches anyone's real data
- Document in the README or a dev-notes file how to run against each db:
  - `KLATCH_DB=demo.db npm run dev:server` for demo mode
  - `KLATCH_DB=test.db npm run dev:server` for manual integration testing
  - Default (no var) for normal development

### 2. Seed script updates (`scripts/seed-demo.sh`)

The current script creates the Mystery Menu channel and three entities (Chef Pierre, Morgan the CFO, Zara the Marketing Director) but:
- Points at `klatch.db` — fix this to `demo.db`
- Doesn't create a project — the channel lands in Orphan Chats. For a polished demo, it should live under a named project (e.g., "Mystery Menu Restaurant")
- Doesn't assign the channel to the project after creation

Please update the seed script to:
1. Create a project: `POST /api/projects` with name "Mystery Menu Restaurant" and instructions appropriate to the scenario
2. Create the channel: `POST /api/channels` with `type: 'klatch'`, `mode: 'roundtable'`
3. Assign channel to project: `PATCH /api/channels/:id` with `projectId`
4. Create the three entities (Chef Pierre, CFO Morgan, Zara Marketing) — check if these already exist in the script or need adding
5. Assign all three entities to the channel: `POST /api/channels/:id/entities`

### 3. Playwright recording script

Once the seed script is solid, we need a Playwright script that:
- Opens Klatch (assumes `npm run dev` is running with `KLATCH_DB=demo.db`)
- Navigates to the Mystery Menu channel in the project sidebar
- Types the following message in a way that looks human — simulate realistic typing speed with small pauses, occasional backspace and retype on a word or two (I'll provide the exact message copy below)
- Waits for all three roundtable responses to stream in fully
- Records the whole session to an MP4

The scenario message (feel free to suggest edits):

> "I've been thinking about a new tasting menu concept. For $300, and just knowing guests' dietary restrictions, we create a completely custom meal — nothing from the regular menu, designed specifically for them. Thoughts?"

The founder (xian) is typing this. It should feel like a real person typing — 60-80 wpm rhythm, one or two small corrections. The roundtable then shows Chef Pierre, Morgan, and Zara responding in sequence.

Playwright docs for video recording: https://playwright.dev/docs/videos — use `recordVideo` in the browser context config. Output to `web/assets/0.8.x-mystery-menu-roundtable.mp4` (version number TBD).

## What I'll handle

The demo scenario creative direction (the message copy above, the narrative framing, how we present the video on the website) stays with me. I'll also write any descriptive text for the website when the video is ready.

Let me know if you hit anything unexpected with the seed script — specifically whether the `POST /api/projects` endpoint exists and what fields it accepts. I didn't want to assume.

— Calliope
