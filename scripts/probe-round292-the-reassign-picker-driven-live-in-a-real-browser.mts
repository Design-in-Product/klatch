/**
 * Round 292, Theseus, 2026-09-28/29 (STOP fire). Iris routed this seat a gap twice in one evening
 * (`iris-to-theseus-…-reassign-picker-still-unverified-live-naming-it-plainly-2026-09-28.md`, then
 * `…-reclassified-structural-not-low-priority-2026-09-28.md`): `ReassignPicker` — built 9/15, wired
 * to both `sameNameEntityIds` disclosure sites — has been verified against a mocked `fetch` and
 * nothing else for two weeks, on a project whose own rule says that is not verification.
 *
 * Her second memo is the one that decides the priority, and its argument is worth keeping next to
 * the code: the condition this picker exists to resolve — two entities sharing a name — gets MORE
 * frequent the more Klatch is used for the thing it is for. More imported history and more agents
 * both push the collision rate up. So the population needing this path grows with adoption, which
 * makes "unverified" structural rather than merely outstanding.
 *
 * ── What this probe drives, and what it deliberately does not ───────────────
 *
 * A real Chromium (Playwright, the browser already in this repo's root deps) against a real Vite
 * dev server against a real Hono server against a real SQLite database. No mock anywhere in the
 * chain. The three things only a live drive can establish, each of which a mocked `fetch` asserts
 * by construction rather than observing:
 *
 *   1. that the disclosure and its button actually RENDER against a server-shaped response (E2/E3),
 *   2. that a refusal sentence chosen by the server arrives in the picker VERBATIM (G2) and leaves
 *      the picker open (G3) — the mocked test supplies the sentence it then asserts,
 *   3. that a happy-path pick moves the binding AND the per-message `entity_id` stamps in the
 *      database (H2/H3), which is the Round 212 endpoint guarantee the picker is built on top of.
 *
 * **The refusal is a real one, not an injected fault.** `target-already-bound` (409) is reachable
 * by an ordinary user: the picker excludes only `fromEntityId`, so any OTHER entity already bound
 * to the channel is offered and will be refused. Arm F binds one through the API to set that up.
 * An induced 500 would have tested the client's error rendering; this tests the actual sentence a
 * user meets.
 *
 * **Both paths in one picker session, refusal first.** A successful reassign clears the disclosure
 * permanently for that channel (`reassignedTo` in `ImportDialog.tsx`), so happy-path-then-refusal
 * is not reachable without a second import. Refusal-then-recovery is also the truer sequence: it is
 * what a user who picks wrong actually does next, and it makes G3 ("stays open") load-bearing
 * rather than decorative.
 *
 * ── Discipline ──────────────────────────────────────────────────────────────
 *
 * This probe BINDS PORTS and RUNS A BROWSER, which is why it is classified DEFERRED and why the
 * ports are 3199/5199 rather than 3001/5173 — xian's dev server has held the real pair for six
 * consecutive fires and nothing here goes near it. Arms A0/A0b refuse to start if the high pair is
 * occupied, rather than assuming.
 *
 * The database is a `KLATCH_DB` scratch file under `.testdata/`. The repo's own `klatch.db` is
 * never opened: arm Y2 brackets the run with the Round 287/291 sentinel to prove the graded set did
 * not move. The Vite config is generated under `.testdata/` too — nothing is written inside
 * `packages/`, which arm Y1 fingerprints.
 *
 * ── Round 293 (2026-09-29): what the fix did to this probe ──────────────────
 *
 * G4 above was a measurement, deliberately: it recorded that the refused candidate stayed listed
 * and enabled, and left the judgement to Iris. She ruled it (disable with a reason, don't hide)
 * and shipped it in `3c66489d`. That fix disables the very row arms G2/G3 click to provoke the
 * refusal — so the first re-run of this probe against the fix did not report two red arms, it
 * **threw**: Playwright's click auto-waits for `enabled`, timed out at 30s, and aborted the run
 * with 18 of 24 arms recorded. H1–H6 — the happy path, the database binding, Round 212's
 * per-message stamps — never ran at all, though nothing about them had changed.
 *
 * The repair is in section G: ask whether the row is disabled before clicking it, and if it is,
 * record G2/G3/G4 as **inapplicable** rather than driving into a wall. Inapplicable and not a
 * skip, per `probe-outcome.mts`'s own test — no operator can change anything about this machine
 * to make the arm run; the path is closed by design.
 *
 * The refusal sentence itself is not left uncovered. It is re-established live in
 * `probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns.mts` (M3/M4),
 * which reaches it inside the picker's open-fetch window — the one place a refusal survives the
 * fix, and, not coincidentally, a residual gap that probe measures.
 */
import { spawn, type ChildProcess } from 'child_process';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint } from './lib/tree-fingerprint.mts';
import { snapshot, compare, unchanged, describe } from './lib/db-sentinel.mts';
import { mintTranscript } from './lib/mint-transcript.mts';
import { portAcceptsAConnection, reapOnExit } from './lib/probe-server-ownership.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const API_PORT = 3199;
const WEB_PORT = 5199;
const WORK = join(REPO, '.testdata', 'r292-reassign-live');
const DB_PATH = join(WORK, 'live.db');
const VITE_CONFIG = join(WORK, 'vite.config.mts');
const SHOT_DIR = join(WORK, 'shots');

/** Minted names, never values that occur in the world — Round 240 §4. */
const COLLIDING = 'Zzatlas-r292';
const BYSTANDER = 'Zzborealis-r292';

const results: ProbeVerdict[] = [];
const check = (arm: string, what: string, pass: boolean, detail = ''): void => {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'pass' : 'FAIL'}  ${what}${detail ? `\n        ${detail}` : ''}`);
};
const measure = (arm: string, what: string): void => {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}`);
};
const skipped: string[] = [];
const skip = (arm: string, why: string): void => {
  skipped.push(`${arm}: ${why}`);
  console.log(`  [${arm}] SKIP  ${why}`);
};
/**
 * An arm that did not run because the thing it drives is no longer reachable BY DESIGN — not an
 * environment an operator could change. See the Round 293 note in the header: G2/G3 provoke the
 * refusal by clicking a candidate the fix now disables. Recorded rather than dropped, and it does
 * not weaken the exit (`probe-outcome.mts`, `inapplicable`).
 */
const inapplicable: string[] = [];
const notApplicable = (arm: string, why: string): void => {
  inapplicable.push(`${arm}: ${why}`);
  console.log(`  [${arm}] N/A   ${why}`);
};

const bracketBefore = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
const dbBefore = snapshot(REPO);

let api: ChildProcess | undefined;
let web: ChildProcess | undefined;
reapOnExit(() => api);
reapOnExit(() => web);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(what: string, fn: () => Promise<boolean>, budgetMs: number): Promise<boolean> {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await sleep(250);
  }
  console.log(`        (gave up waiting ${budgetMs}ms for ${what})`);
  return false;
}

try {
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(SHOT_DIR, { recursive: true });

  // ─── A · preconditions ──────────────────────────────────────────────────────
  console.log('\n[A] the ports this probe wants are free, and a browser exists to drive');
  const apiBusy = await portAcceptsAConnection(API_PORT);
  const webBusy = await portAcceptsAConnection(WEB_PORT);
  check('A0', `port ${API_PORT} is free before this probe binds it`, !apiBusy,
    apiBusy ? `something already answers on ${API_PORT} — refusing to bind` : `no listener on ${API_PORT}`);
  check('A0b', `port ${WEB_PORT} is free before this probe binds it`, !webBusy,
    webBusy ? `something already answers on ${WEB_PORT} — refusing to bind` : `no listener on ${WEB_PORT}`);
  const exe = chromium.executablePath();
  check('A1', 'a Playwright chromium binary is installed on this machine', existsSync(exe), exe);

  if (apiBusy || webBusy || !existsSync(exe)) {
    skip('B–H', 'preconditions not met — no server started, no browser launched');
    throw new Error('__precondition__');
  }

  // ─── B · the real server, on a scratch database ─────────────────────────────
  console.log('\n[B] a real server on a scratch database under .testdata/');
  api = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: join(REPO, 'packages', 'server'),
    env: { ...process.env, PORT: String(API_PORT), KLATCH_DB: DB_PATH },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let apiLog = '';
  api.stdout?.on('data', (d) => { apiLog += d.toString(); });
  api.stderr?.on('data', (d) => { apiLog += d.toString(); });

  const apiUp = await waitFor('the API', async () => {
    try {
      const r = await fetch(`http://localhost:${API_PORT}/api/channels`);
      return r.status === 200;
    } catch { return false; }
  }, 60_000);
  check('B1', `the server answers GET /api/channels with 200 on ${API_PORT}`, apiUp,
    apiUp ? 'up' : `never came up — server output:\n${apiLog.slice(-800)}`);
  check('B2', 'and it opened the scratch database, not the repo one', existsSync(DB_PATH),
    `KLATCH_DB=${DB_PATH} · exists=${existsSync(DB_PATH)}`);

  if (!apiUp) { skip('C–H', 'the API never came up'); throw new Error('__precondition__'); }

  // ─── C · the collision this picker exists for ───────────────────────────────
  console.log('\n[C] two entities with the same name, plus a bystander to be refused later');
  const seed = new Database(DB_PATH);
  const ins = seed.prepare(
    "INSERT INTO entities (id, name, handle, model, system_prompt, color, created_at) VALUES (?, ?, ?, 'claude-opus-5', '', ?, ?)"
  );
  ins.run('r292-atlas-1', COLLIDING, 'atlas-one', '#e11d48', '2026-01-01T00:00:00Z');
  ins.run('r292-atlas-2', COLLIDING, 'atlas-two', '#0ea5e9', '2026-01-02T00:00:00Z');
  ins.run('r292-borealis', BYSTANDER, 'borealis', '#22c55e', '2026-01-03T00:00:00Z');
  seed.close();

  const entities = await (await fetch(`http://localhost:${API_PORT}/api/entities`)).json();
  const sameName = (entities as Array<{ id: string; name: string }>).filter((e) => e.name === COLLIDING);
  check('C1', `the server reports ${COLLIDING} twice — the ambiguity is real, not simulated`,
    sameName.length === 2, `same-name ids: ${sameName.map((e) => e.id).join(', ')}`);

  const minted = mintTranscript({ id: `r292-${Date.now()}`, turns: 3, dir: join(WORK, 'corpus'), project: 'r292' });
  check('C2', 'a transcript exists at a path the import route will accept', existsSync(minted.path),
    `${minted.path} · ${minted.turns} turns · ${minted.sizeBytes} bytes`);

  // ─── D · the real client ────────────────────────────────────────────────────
  console.log('\n[D] the real Vite client, proxying to this probe\'s server rather than 3001');
  writeFileSync(VITE_CONFIG, `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Generated by probe-round292. The checked-in config hardcodes 5173 -> 3001; this one
// is the same config pointed at the probe's own pair so nothing collides with a dev server.
export default defineConfig({
  root: ${JSON.stringify(join(REPO, 'packages', 'client'))},
  cacheDir: ${JSON.stringify(join(WORK, 'vite-cache'))},
  plugins: [react(), tailwindcss()],
  server: {
    port: ${WEB_PORT},
    strictPort: true,
    proxy: { '/api': { target: 'http://localhost:${API_PORT}', changeOrigin: true } },
  },
});
`);
  web = spawn('npx', ['vite', '--config', VITE_CONFIG], {
    cwd: REPO,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let webLog = '';
  web.stdout?.on('data', (d) => { webLog += d.toString(); });
  web.stderr?.on('data', (d) => { webLog += d.toString(); });

  const webUp = await waitFor('Vite', async () => {
    try {
      const r = await fetch(`http://localhost:${WEB_PORT}/`);
      return r.status === 200;
    } catch { return false; }
  }, 60_000);
  check('D1', `Vite serves the app on ${WEB_PORT}`, webUp,
    webUp ? 'up' : `never came up — vite output:\n${webLog.slice(-800)}`);
  if (!webUp) { skip('E–H', 'the client never came up'); throw new Error('__precondition__'); }

  // ─── E · the import, driven through the UI ──────────────────────────────────
  console.log('\n[E] a real import driven through the dialog, in a real browser');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  try {
    await page.goto(`http://localhost:${WEB_PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Import' }).first().click();
    // Located by placeholder, not by label: the "Session file path" <label> has no `htmlFor`
    // and does not wrap its input, so `getByLabel` finds nothing. Measured, first drive.
    await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').fill(minted.path);
    await page.getByPlaceholder('Who is this? e.g. Daedalus').fill(COLLIDING);
    await page.screenshot({ path: join(SHOT_DIR, '0-dialog.png') });
    await page.getByRole('button', { name: 'Import', exact: true }).last().click();

    const success = page.getByText('Import successful');
    await success.waitFor({ timeout: 30_000 });
    check('E1', 'the import completes and the success panel renders', await success.isVisible());

    const disclosure = page.getByText(/agents share this name/);
    const disclosureVisible = await disclosure.isVisible().catch(() => false);
    check('E2', 'the same-name disclosure renders against a real server response', disclosureVisible,
      disclosureVisible ? (await disclosure.innerText()).replace(/\s+/g, ' ').trim() : 'not rendered');

    const pickerButton = page.getByRole('button', { name: 'Not right? Pick an existing agent' });
    const pickerOffered = await pickerButton.isVisible().catch(() => false);
    check('E3', 'and it offers the picker — the entry point exists on a live page', pickerOffered);
    await page.screenshot({ path: join(SHOT_DIR, '1-disclosure.png') });

    if (!pickerOffered) { skip('F–H', 'the disclosure never offered the picker'); throw new Error('__precondition__'); }

    // ─── F · set up a refusal an ordinary user can reach ──────────────────────
    console.log('\n[F] a second entity bound to the same channel, so one candidate is refusable');
    // NOT `channels[0]`. A fresh database is seeded with a `default` channel, and it sorts first —
    // the first drive of this probe bound the bystander to `default`, so the picker's refusal
    // candidate was in fact free, the reassign SUCCEEDED, and G2/G3 failed reporting the absence
    // of a refusal that was never set up. Ask which channel the import actually bound instead.
    const locate = new Database(DB_PATH, { readonly: true });
    const channelId = (locate.prepare('SELECT channel_id FROM channel_entities WHERE entity_id = ?').get('r292-atlas-1') as { channel_id: string } | undefined)?.channel_id ?? '';
    locate.close();
    check('F0', 'the channel under test is the imported one, not the seeded `default` channel',
      Boolean(channelId) && channelId !== 'default', `channel bound to atlas-1: ${channelId || '(none)'}`);
    const bindRes = await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entityId: 'r292-borealis' }),
    });
    const bound = await (await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`)).json();
    check('F1', `${BYSTANDER} is bound to the imported channel, so picking it must be refused`,
      bindRes.ok && (bound as Array<{ id: string }>).some((e) => e.id === 'r292-borealis'),
      `channel ${channelId} · bind status ${bindRes.status} · bound: ${(bound as Array<{ name: string }>).map((e) => e.name).join(', ')}`);

    // ─── G · the refusal path ─────────────────────────────────────────────────
    console.log('\n[G] the refusal path: pick an entity already bound to this channel');
    await pickerButton.click();
    await page.getByPlaceholder('Search agents by name or @handle').waitFor({ timeout: 10_000 });

    const offered = await page.locator('button', { hasText: COLLIDING }).allInnerTexts();
    check('G1', 'the picker excludes the entity the channel is currently bound to',
      offered.length === 1,
      `same-name buttons offered: ${offered.length} (of 2 entities with that name) · ${JSON.stringify(offered)}`);

    await page.getByPlaceholder('Search agents by name or @handle').fill(BYSTANDER);
    const bystanderRow = page.getByRole('button', { name: new RegExp(BYSTANDER) }).first();

    // ── Round 293 repair (Theseus, 2026-09-29) ──────────────────────────────
    // Iris's G4 fix (`3c66489d`) disables this exact row, which is the outcome this probe's own
    // G4 measurement asked for. Clicking it unconditionally is what the probe used to do, and on
    // the first re-run after the fix Playwright's click auto-waited 30s for `enabled` and THREW —
    // aborting at G1 with 18 of 24 arms recorded and the entire happy path (H1–H6, including the
    // Round 212 stamp guarantee) never driven. An arm going red when the code is fixed is the
    // time-bomb shape Round 286 named; a probe that THROWS at the fix is worse, because it
    // discards every arm downstream of the change, including ones unrelated to it.
    //
    // So: ask first. If the row is disabled, the refusal is unreachable through this path BY
    // DESIGN, which is `inapplicable` and not a skip — no operator can change a machine to make
    // it run. G2/G3 are re-established live in
    // `probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns.mts` (M3/M4),
    // which reaches the refusal inside the picker's open-fetch window, the one place it survives.
    const rowDisabled = await bystanderRow.isDisabled().catch(() => false);
    if (rowDisabled) {
      notApplicable('G2', "the refusal is no longer reachable by clicking an already-bound candidate — "
        + 'the G4 fix disables that row. The verbatim-sentence check lives in Round 293 M3');
      notApplicable('G3', 'same: no refusal can be provoked here to leave the picker open after. Round 293 M4');
      notApplicable('G4', 'ruled and fixed by Iris (`3c66489d`): disable with a reason, do not hide. '
        + 'This measurement asked a question that now has an answer in the code');
      measure('G4b', 'the candidate this probe used to click is now rendered disabled — the fix is '
        + 'present on this tree, observed live rather than inferred from the commit');
      await page.screenshot({ path: join(SHOT_DIR, '2-disabled-not-refused.png') });
    } else {
      await bystanderRow.click();

      const refusal = page.getByText('Target entity is already assigned to this channel');
      const refusalShown = await refusal.waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
      check('G2', "the server's own refusal sentence reaches the user verbatim", refusalShown,
        refusalShown ? await refusal.innerText() : 'no refusal text appeared');
      const stillOpen = await page.getByPlaceholder('Search agents by name or @handle').isVisible().catch(() => false);
      check('G3', 'and the picker stays open, so the user can correct the pick in place', stillOpen);
      await page.screenshot({ path: join(SHOT_DIR, '2-refusal.png') });

      // A MEASUREMENT, not a check, and deliberately so. What it records is a defect-shaped
      // observation — the refused candidate is still listed, still enabled, and reads no differently
      // from a candidate that would succeed, because `ReassignPicker`'s filter excludes `fromEntityId`
      // and nothing else. An arm asserting that would go RED the day someone fixes it (Round 286's
      // "a red must mean something broke"). This prints the live state either way and leaves the
      // judgement to Iris, whose surface it is.
      const stillListed = await bystanderRow.isEnabled().catch(() => false);
      measure('G4', `after the refusal the refused candidate is still listed and still enabled: ${stillListed} — the picker's exclusion is \`fromEntityId\` only, so every OTHER entity already bound to the channel is offered and can only be refused`);
    }

    // ─── H · the happy path, from inside the refusal ──────────────────────────
    console.log('\n[H] the happy path: correct the pick to the other same-name agent');
    await page.getByPlaceholder('Search agents by name or @handle').fill(COLLIDING);
    await page.getByRole('button', { name: new RegExp(COLLIDING) }).first().click();

    const done = page.getByText(new RegExp(`Reassigned to ${COLLIDING}`));
    const doneShown = await done.waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
    check('H1', 'the disclosure is replaced by the reassignment it resolved', doneShown,
      doneShown ? (await done.innerText()).replace(/\s+/g, ' ').trim() : 'no confirmation appeared');
    const pickerGone = !(await page.getByPlaceholder('Search agents by name or @handle').isVisible().catch(() => false));
    check('H2', 'and the picker closes on success', pickerGone);
    await page.screenshot({ path: join(SHOT_DIR, '3-reassigned.png') });

    const after = await (await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`)).json() as Array<{ id: string }>;
    const ids = after.map((e) => e.id);
    check('H3', 'the binding moved in the database — not only in the panel',
      ids.includes('r292-atlas-2') && !ids.includes('r292-atlas-1'),
      `channel entities after: ${ids.join(', ')}`);

    const db = new Database(DB_PATH, { readonly: true });
    const stamps = db.prepare('SELECT entity_id, COUNT(*) n FROM messages WHERE channel_id = ? GROUP BY entity_id').all(channelId) as Array<{ entity_id: string | null; n: number }>;
    db.close();
    const onOld = stamps.find((s) => s.entity_id === 'r292-atlas-1')?.n ?? 0;
    const onNew = stamps.find((s) => s.entity_id === 'r292-atlas-2')?.n ?? 0;
    check('H4', "the per-message stamps moved with the seat — Round 212's guarantee, observed live",
      onOld === 0 && onNew > 0,
      `messages stamped atlas-1: ${onOld} · atlas-2: ${onNew} · rows: ${JSON.stringify(stamps)}`);

    check('H5', 'and the page threw no uncaught errors across the whole drive',
      consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');
    measure('H6', `screenshots written to ${SHOT_DIR} (disclosure · refusal · reassigned)`);
  } finally {
    await browser.close();
  }
} catch (e) {
  if (!(e instanceof Error) || e.message !== '__precondition__') {
    check('X1', 'the probe ran to completion without throwing', false, String(e instanceof Error ? e.stack : e));
  }
} finally {
  for (const child of [web, api]) {
    if (child && child.exitCode === null) child.kill('SIGTERM');
  }
  await sleep(1200);

  // ─── Y · brackets ───────────────────────────────────────────────────────────
  console.log('\n[Y] this run left the tree and the graded databases where it found them');
  const bracketAfter = { scripts: fingerprint(REPO, 'scripts/'), packages: fingerprint(REPO, 'packages/') };
  check('Y1', 'scripts/ and packages/ fingerprints unchanged across this probe',
    bracketAfter.scripts === bracketBefore.scripts && bracketAfter.packages === bracketBefore.packages,
    `scripts ${bracketAfter.scripts === bracketBefore.scripts ? 'same' : 'MOVED'} · packages ${bracketAfter.packages === bracketBefore.packages ? 'same' : 'MOVED'}`);
  const gradedDelta = compare(dbBefore.graded, snapshot(REPO).graded);
  check('Y2', 'the graded set is untouched — every database this probe opened was its own, under .testdata/',
    unchanged(gradedDelta), `graded delta: ${describe(gradedDelta)}`);
  const stillHeld = await portAcceptsAConnection(API_PORT);
  check('Y3', `port ${API_PORT} is released — this probe left no listener behind`, !stillHeld);
}

summariseAndExit({
  probeName: 'probe-round292-the-reassign-picker-driven-live-in-a-real-browser',
  results,
  skipped,
  inapplicable,
});
