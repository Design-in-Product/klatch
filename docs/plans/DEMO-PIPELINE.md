# Demo Recording Pipeline — Plan of Record

**Created:** 2026-03-27
**Status:** Blocked (needs execution, not more code)
**Owner:** xian + Calliope (coordination), Daedalus (landing page)

---

## Why This Keeps Drifting

The demo infrastructure is **code-complete but never executed**. The seed script, the Playwright recording script, the DEMO.md guide — all exist, all work structurally. But:

1. Playwright is not in `package.json` — `record-demo.ts` fails at runtime with MODULE_NOT_FOUND
2. No npm script alias — the recording isn't discoverable as a standard workflow
3. DEMO.md documents the seed workflow but not how to actually run the recording
4. The homepage (`index.html`) references `assets/0.6.0-01-roles-web.mp4` — a v0.6.0 panel-mode clip that predates roundtable mode, import, sidebar redesign, and the 5-layer model
5. No one has ever run the full pipeline end-to-end: seed → start servers → run recording → convert → integrate

Each session has focused on the code layer, assuming the next session would do the runtime steps. This is the "endless chain of deja vu."

### History

- **2026-03-19:** Calliope sends spec memo to Argus (seed fix, DEMO.md, record-demo.ts)
- **2026-03-20:** Argus claims completion in session log. Work is NOT in the repository (lost in failed rebase + force push). xian tries to run demo, finds nothing. Reliability incident.
- **2026-03-21:** Argus rebuilds from scratch, verifies all files present. Commit `4d2030f`. Merged to main 2026-03-22.
- **2026-03-22 → present:** Infrastructure sits idle. No recording has ever been made.

---

## What Exists

| File | Status | Notes |
|------|--------|-------|
| `scripts/seed-demo.sh` | Complete | Creates Mystery Menu project, 3 entities (Margaux, Sam, Julien), roundtable channel |
| `scripts/record-demo.ts` | Complete | Playwright recording with human typing simulation (variable delays, occasional backspace) |
| `docs/DEMO.md` | Complete | Workflow documentation |
| `docs/DEMO-PLAN.md` | Outdated | v0.6.0 multi-clip plan, lists clips 2-4 as "still needed" |
| `assets/0.6.0-01-roles-web.mp4` | Stale | Panel-mode clip from v0.6.0, currently on homepage |
| KLATCH_DB env var | Working | `packages/server/src/db/index.ts` lines 23-25 |

## What's Missing

| Item | Blocker |
|------|---------|
| Playwright in devDependencies | Not installed; script can't run |
| npm script alias (`npm run record:demo`) | Not in package.json |
| Recorded video file | Script never executed |
| ffmpeg conversion (webm → mp4) | No recording to convert |
| Homepage video swap | No new video to swap in |

---

## Execution Plan

### Phase 1: Make the Pipeline Runnable (Daedalus or Argus, ~1 hour)

```bash
# Add Playwright
npm install -D playwright
npx playwright install chromium

# Add to root package.json scripts:
# "demo:seed": "KLATCH_DB=demo.db ./scripts/seed-demo.sh",
# "demo:record": "npx tsx scripts/record-demo.ts"
```

Update DEMO.md with recording instructions including Playwright install step.

### Phase 2: Record the Demo (xian, ~30 min)

This requires a running Klatch instance with real Claude API responses — it cannot be done headlessly in CI.

```bash
# Terminal 1: Start server with demo database
KLATCH_DB=demo.db npm run dev:server

# Terminal 2: Start client
npm run dev:client

# Terminal 3: Seed the database
npm run demo:seed

# Terminal 4: Record
npm run demo:record
```

The script opens a browser, navigates to the demo channel, types the demo prompt with human-like pacing, and waits for all three roundtable responses before saving the recording.

**Output:** `assets/demo-mystery-menu-roundtable.webm` (or path per script config)

### Phase 3: Convert and Integrate (~30 min)

```bash
# Convert to web-optimized mp4
ffmpeg -i assets/demo-mystery-menu-roundtable.webm \
  -vf "scale=800:-2" \
  -c:v libx264 -crf 28 -preset slow -an \
  assets/demo-roundtable-web.mp4
```

Update `index.html` to reference the new video instead of `0.6.0-01-roles-web.mp4`.

### Phase 4: Verify and Ship

- [ ] Video file exists at expected path
- [ ] Video plays correctly in browser
- [ ] Homepage loads the new video
- [ ] Committed and pushed to main
- [ ] Old video removed or archived

---

## Verification Protocol

Before anyone claims this is done:

1. `ls -la assets/demo-roundtable-web.mp4` — file exists
2. Open `http://localhost:5173` — video plays on homepage
3. `git log --oneline -1` — commit includes the video
4. Paste the git log output into the session log

This is the protocol from the reliability incident memo. It exists because of this exact pipeline.

---

## Notes

- The recording script simulates human typing with variable delays and occasional backspace corrections — this was a feature Argus built, and it does exist in the code
- The seed script creates a good demo scenario (Mystery Menu Restaurant, three entities in roundtable mode)
- The demo prompt is: "I've been thinking about a new tasting menu concept. For $300, and just knowing guests' dietary restrictions, we create a completely custom meal — nothing from the regular menu, designed specifically for them. Thoughts?"
- Phase 2 is the bottleneck — it requires a human at the keyboard with a working Klatch instance and an API key
