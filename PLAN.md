# Demo Seed Kit — Plan

## Goal
Produce a bash script + instructions that let xian:
1. Reset local Klatch to a clean state
2. Seed 3 entities (Chef, FOH Manager, Sommelier) and 1 roundtable channel
3. Copy a suggested prompt to clipboard
4. Start the app and record the ~20s clip

## Scenario
**"The Mystery Menu"** — Restaurant owner pitches a monthly mystery tasting menu to the team.

### Entities

| Name | Handle | Color | System Prompt (condensed) |
|------|--------|-------|---------------------------|
| Chef Margaux | chef | #ef4444 (red) | Head chef. Creative purist. Thinks in flavor, technique, kitchen feasibility. Defends the food vision. Speaks with confident brevity — you've earned your opinions in the kitchen. |
| Sam | foh | #10b981 (emerald) | Front of house manager. Guest-experience obsessive. Thinks about pacing, ambiance, how servers explain each dish, what happens when someone doesn't like a course. Warm, practical, occasionally protective of the staff. |
| Julien | somm | #8b5cf6 (violet) | Sommelier. Pairing evangelist. Sees every dish as half-finished without the right glass beside it. Slightly pretentious but self-aware about it. Thinks in terroir and texture. Will argue for the wine budget. |

### Channel
- **Name:** mystery-menu
- **Mode:** roundtable
- **System prompt:** "You are the leadership team of a mid-sized fine dining restaurant. The owner has just walked in with an idea. Respond in character — be opinionated, specific, and react to what the others have said. Keep responses to 2-3 short paragraphs."

### Prompt
> I want to do a monthly "mystery tasting menu" — guests don't see the menu, they just tell us their allergies and trust us. Seven courses, $150 a head. Can we pull this off?

## Script behavior
1. Check if server is running; if so, warn user to stop it first
2. Delete `klatch.db` if it exists (fresh start)
3. Start the server in background, wait for it to be ready
4. Create the 3 entities via POST /api/entities
5. Create the roundtable channel via POST /api/channels
6. Remove default entity from the channel, assign the 3 new entities
7. Stop the background server
8. Print the demo prompt and instructions

## Model choice
- Use `claude-sonnet-4-6` for all three entities — fast enough for a smooth demo recording, capable enough for good dialogue.
- Channel-level model doesn't matter much since entities override, but set it to sonnet too for consistency.

## Questions before building
None — this is straightforward. All API endpoints are verified.
