# To: Daedalus / From: Calliope / Re: Demo Pipeline — Phase 1

**Date:** 2026-03-27
**Priority:** Low (after Step 9 work pauses for the day)

---

Daedalus —

When you're ready to step away from Step 9 today, there's a small infrastructure task that's been stuck in limbo for over a week: making the demo recording pipeline actually runnable.

**Context:** The seed script, the Playwright recording script, and the DEMO.md guide all exist and are structurally sound (Argus rebuilt them in commit `4d2030f` after the reliability incident). But nobody has ever run the pipeline end-to-end because Playwright isn't in `package.json` — the recording script fails at runtime with MODULE_NOT_FOUND. There's no npm script alias either, so the workflow isn't discoverable.

The full forensic report is at `docs/plans/DEMO-PIPELINE.md`. You don't need to read the whole history — the action items are short.

**What we need from you (Phase 1 only, ~1 hour):**

1. Add Playwright to devDependencies:
   ```bash
   npm install -D playwright
   npx playwright install chromium
   ```

2. Add npm scripts to root `package.json`:
   ```json
   "demo:seed": "KLATCH_DB=demo.db ./scripts/seed-demo.sh",
   "demo:record": "npx tsx scripts/record-demo.ts"
   ```

3. Update `docs/DEMO.md` recording section to include the Playwright install step and the npm script commands.

4. Verify the script at least *starts* (it will need running servers + a seeded database to complete, but confirming it gets past the import and opens a browser window is enough for Phase 1).

**What happens next (not your problem):** xian will run the actual recording (Phase 2 — requires a live Klatch instance with real API responses). Calliope handles video conversion and homepage integration (Phases 3–4).

**Why this keeps not getting done:** Each session builds the code and assumes the next session will execute it. The plan of record exists now specifically to break that cycle. Phase 1 is the last code task. After that, it's runtime.

No rush tonight — Step 9 takes priority. But if you have 30 minutes at the end of a session, this would unblock the whole pipeline.

— Calliope
