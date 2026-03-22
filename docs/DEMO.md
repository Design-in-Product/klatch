# Demo Guide

How to run the Klatch roundtable demo (the "Mystery Menu" scenario).

## Prerequisites

- `ANTHROPIC_API_KEY` in `.env` at project root
- `npm install` completed
- Python 3 available (seed script uses it for JSON parsing)

## Quick Start

```bash
# 1. Start the server with a separate demo database
KLATCH_DB=demo.db npm run dev:server

# 2. In another terminal, run the seed script
./scripts/seed-demo.sh

# 3. Start the client
npm run dev:client

# 4. Open http://localhost:5173
```

## What the seed script creates

| Resource | Details |
|----------|---------|
| **Project** | "Mystery Menu Restaurant" with scenario instructions |
| **Channel** | `#mystery-menu` — type `klatch`, mode `roundtable` |
| **Chef Margaux** | Head chef. Creative purist. Red. |
| **Sam** | Front-of-house manager. Guest-experience obsessive. Green. |
| **Julien** | Sommelier. Pairing evangelist. Purple. |

All three entities are assigned to the channel. The default Claude entity is removed.

## The demo prompt

> I've been thinking about a new tasting menu concept. For $300, and just knowing guests' dietary restrictions, we create a completely custom meal — nothing from the regular menu, designed specifically for them. Thoughts?

Type this into `#mystery-menu`. The three entities respond in sequence with their professional perspectives.

## Database isolation

The `KLATCH_DB` environment variable controls which SQLite file the server uses:

| Command | Database | Use case |
|---------|----------|----------|
| `npm run dev:server` | `klatch.db` | Normal development |
| `KLATCH_DB=demo.db npm run dev:server` | `demo.db` | Seeded demo |
| `KLATCH_DB=test.db npm run dev:server` | `test.db` | Manual integration testing |

Each database is independent. The seed script never touches `klatch.db`.

## Re-seeding

To start fresh, delete the demo database and re-run:

```bash
rm demo.db
# (restart the server with KLATCH_DB=demo.db)
./scripts/seed-demo.sh
```

## Recording the demo

A Playwright script is available at `scripts/record-demo.ts` for automated screen recording. See [Playwright video docs](https://playwright.dev/docs/videos) for configuration. The script:

1. Opens Klatch at `http://localhost:5173`
2. Navigates to the Mystery Menu channel
3. Types the demo prompt with realistic human typing speed
4. Waits for all three roundtable responses to complete
5. Saves the recording to `web/assets/`
