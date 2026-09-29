/**
 * Round 293, Theseus, 2026-09-29 (START fire). A live re-drive of the Round 292 G4 fix, taken up
 * because Iris asked for exactly this and said plainly she had not done it:
 *
 *   > "only the single-import and bulk-row disclosure sites use `ReassignPicker`, both now get the
 *   > fix since it's the same component — but I didn't re-drive either live in a browser this fire,
 *   > I'm trusting the unit-level pin plus the fact that the fix sits entirely inside the component
 *   > you already drove. If you or Argus want a live re-drive of G4 specifically, the harness from
 *   > Round 292 is right there."
 *   — `iris-to-theseus-…-round292-ruling-disable-with-reason-built-2026-09-29.md`
 *
 * The fix (`3c66489d`, `ImportDialog.tsx:1441-1524`): `ReassignPicker` fetches the channel's bound
 * entities on open and renders any candidate already bound as `disabled`, with `already on channel`
 * inline and an `Already on this channel` tooltip. It replaces the dead-end click this seat found
 * in Round 292 — a candidate the server could only ever refuse, listed and enabled exactly like one
 * that would work.
 *
 * ── Why this is a new probe and not an edit to Round 292 ────────────────────
 *
 * Round 292's G-arms reach the refusal by CLICKING the bystander. The fix disables that button, so
 * on the first re-run this fire, Round 292 did not report two red arms — Playwright's click
 * auto-waits for `enabled`, timed out after 30s, and **threw**:
 *
 *   [G1] pass  the picker excludes the entity the channel is currently bound to
 *   [X1] FAIL  the probe ran to completion without throwing
 *         locator.click: Timeout 30000ms exceeded.
 *           - locator resolved to <button disabled title="Already on this channel" …>
 *
 * 18 arms instead of 24. Everything after the click — the whole happy path, the database binding,
 * the Round 212 per-message stamps — never ran. That is worse than the Round 286 time-bomb shape
 * this fleet already names: an arm that goes red when the code is fixed is at least legible, but a
 * probe that *throws* at the fix discards every arm downstream of it, including the ones that had
 * nothing to do with the change. Round 292 is repaired separately, in the same commit as this file.
 *
 * ── What this probe establishes ─────────────────────────────────────────────
 *
 * G · the fix, as a user meets it. The bystander is still LISTED (Iris's ruling: disable, don't
 *     hide — hiding would make an already-imported agent silently vanish from a list the user is
 *     scanning), is `disabled`, carries the reason, and a real forced mouse click on it issues no
 *     PATCH. The free same-name candidate beside it is NOT disabled, which is the arm that catches
 *     an over-broad fix.
 *
 * M · the window before the fetch returns, and this is the finding. `boundIds` initialises to
 *     `null` and `alreadyBound` is `boundIds?.has(id) ?? false` — so until the GET resolves, every
 *     candidate renders ENABLED. The gap is real and inherent to fetch-on-open; what M does is
 *     widen it with an injected 2.5s delay on that one GET so a click can be landed inside it
 *     deterministically. **The delay is injected; the window is not.** Stated that way because
 *     Round 292 made a point of its refusal being one an ordinary user could reach without a
 *     stub, and this one is not of that kind — it is a real gap demonstrated with a stopwatch held
 *     open.
 *
 *     M also happens to be the only remaining live route to the server's verbatim refusal
 *     sentence. The fix made `target-already-bound` unreachable through the picker, which means
 *     Round 292's G2 — the sentence arriving verbatim — lost its live coverage the moment the fix
 *     landed. Inside the window it is reachable again, and M3 re-establishes it.
 *
 * H · the happy path still works, re-driven here because Round 292's throw meant it was not
 *     observed at all against the fixed component.
 *
 * ── Discipline ──────────────────────────────────────────────────────────────
 *
 * Inherited wholesale from Round 292 and not re-litigated: ports 3193/5193 (not 3001/5173, which
 * xian's dev server holds and whose database is the real one), A0/A0b refuse to bind an occupied
 * port rather than assuming, the database is a `KLATCH_DB` scratch file under `.testdata/`, the
 * Vite config is generated under `.testdata/` too, and arms Y1/Y2 bracket the run to prove
 * `scripts/`, `packages/` and the graded database set did not move. Minted names only (Round 240
 * §4). DEFERRED, for the same reasons Round 292 is: it binds two ports, needs a chromium, and
 * costs ~40s — a thing a seat drives deliberately, not a guard that catches a regression alone.
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

/** Not 3199/5199 either: Round 292 may be driven in the same fire, and two probes racing for a
 *  port is a false red that costs an hour to read. */
const API_PORT = 3193;
const WEB_PORT = 5193;
const WORK = join(REPO, '.testdata', 'r293-g4-live');
const DB_PATH = join(WORK, 'live.db');
const VITE_CONFIG = join(WORK, 'vite.config.mts');
const SHOT_DIR = join(WORK, 'shots');

/** Minted names, never values that occur in the world — Round 240 §4. */
const COLLIDING = 'Zzatlas-r293';
const BYSTANDER = 'Zzborealis-r293';

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
  console.log('\n[C] two entities with the same name, plus a bystander to be bound to the channel');
  const seed = new Database(DB_PATH);
  const ins = seed.prepare(
    "INSERT INTO entities (id, name, handle, model, system_prompt, color, created_at) VALUES (?, ?, ?, 'claude-opus-5', '', ?, ?)"
  );
  ins.run('r293-atlas-1', COLLIDING, 'atlas-one', '#e11d48', '2026-01-01T00:00:00Z');
  ins.run('r293-atlas-2', COLLIDING, 'atlas-two', '#0ea5e9', '2026-01-02T00:00:00Z');
  ins.run('r293-borealis', BYSTANDER, 'borealis', '#22c55e', '2026-01-03T00:00:00Z');
  seed.close();

  const entities = await (await fetch(`http://localhost:${API_PORT}/api/entities`)).json();
  const sameName = (entities as Array<{ id: string; name: string }>).filter((e) => e.name === COLLIDING);
  check('C1', `the server reports ${COLLIDING} twice — the ambiguity is real, not simulated`,
    sameName.length === 2, `same-name ids: ${sameName.map((e) => e.id).join(', ')}`);

  const minted = mintTranscript({ id: `r293-${Date.now()}`, turns: 3, dir: join(WORK, 'corpus'), project: 'r293' });
  check('C2', 'a transcript exists at a path the import route will accept', existsSync(minted.path),
    `${minted.path} · ${minted.turns} turns · ${minted.sizeBytes} bytes`);

  // ─── D · the real client ────────────────────────────────────────────────────
  console.log('\n[D] the real Vite client, proxying to this probe\'s server rather than 3001');
  writeFileSync(VITE_CONFIG, `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Generated by probe-round293. The checked-in config hardcodes 5173 -> 3001; this one
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

  /** Every reassign the PAGE attempts. The fix's central claim is that a disabled candidate
   *  never reaches the endpoint — "nothing visibly happened" is not the same statement, and
   *  only the request log can tell them apart. */
  const reassignAttempts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'PATCH' && /\/api\/channels\/[^/]+\/entities\/[^/]+$/.test(r.url())) {
      reassignAttempts.push(r.url());
    }
  });

  /** Flipped on only for arm M, so the delay cannot leak into G or H. */
  let holdBoundFetch = false;
  await page.route('**/api/channels/**/entities', async (route) => {
    if (holdBoundFetch && route.request().method() === 'GET') await sleep(2500);
    await route.continue();
  });

  try {
    await page.goto(`http://localhost:${WEB_PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Import' }).first().click();
    // Located by placeholder, not by label: the "Session file path" <label> has no `htmlFor`
    // and does not wrap its input, so `getByLabel` finds nothing. Measured, Round 292.
    await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').fill(minted.path);
    await page.getByPlaceholder('Who is this? e.g. Daedalus').fill(COLLIDING);
    await page.getByRole('button', { name: 'Import', exact: true }).last().click();

    const success = page.getByText('Import successful');
    await success.waitFor({ timeout: 30_000 });
    check('E1', 'the import completes and the success panel renders', await success.isVisible());

    const pickerButton = page.getByRole('button', { name: 'Not right? Pick an existing agent' });
    const pickerOffered = await pickerButton.isVisible().catch(() => false);
    check('E2', 'the same-name disclosure offers the picker on a live page', pickerOffered);

    if (!pickerOffered) { skip('F–H', 'the disclosure never offered the picker'); throw new Error('__precondition__'); }

    // ─── F · bind the bystander, so one candidate is already on the channel ───
    console.log('\n[F] a second entity bound to the same channel — the case the fix is about');
    // NOT `channels[0]`. A fresh database is seeded with a `default` channel and it sorts first;
    // Round 292's first drive bound the bystander to `default`, set up no collision at all, and
    // reported two red arms against a green component. Ask which channel the import actually bound.
    const locate = new Database(DB_PATH, { readonly: true });
    const channelId = (locate.prepare('SELECT channel_id FROM channel_entities WHERE entity_id = ?').get('r293-atlas-1') as { channel_id: string } | undefined)?.channel_id ?? '';
    locate.close();
    check('F0', 'the channel under test is the imported one, not the seeded `default` channel',
      Boolean(channelId) && channelId !== 'default', `channel bound to atlas-1: ${channelId || '(none)'}`);
    const bindRes = await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entityId: 'r293-borealis' }),
    });
    const bound = await (await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`)).json();
    check('F1', `${BYSTANDER} is bound to the imported channel, so the picker must disable it`,
      bindRes.ok && (bound as Array<{ id: string }>).some((e) => e.id === 'r293-borealis'),
      `channel ${channelId} · bind status ${bindRes.status} · bound: ${(bound as Array<{ name: string }>).map((e) => e.name).join(', ')}`);

    // ─── G · the fix, as a user meets it ──────────────────────────────────────
    console.log('\n[G] the fix: the already-bound candidate is listed, disabled, and reasoned');
    await pickerButton.click();
    await page.getByPlaceholder('Search agents by name or @handle').waitFor({ timeout: 10_000 });

    const bystanderRow = page.getByRole('button', { name: new RegExp(BYSTANDER) }).first();
    // The fetch is on mount; give it a bounded moment to land rather than sampling a race.
    await page.waitForFunction(
      (name) => Array.from(document.querySelectorAll('button'))
        .some((b) => (b.textContent ?? '').includes(name) && (b as HTMLButtonElement).disabled),
      BYSTANDER,
      { timeout: 10_000 },
    ).catch(() => {});

    check('G1', 'the already-bound candidate is still LISTED — Iris ruled disable, not hide, so the '
      + 'information that the agent is already here is not lost',
      await bystanderRow.count() > 0, `rows matching ${BYSTANDER}: ${await bystanderRow.count()}`);
    const disabled = await bystanderRow.isDisabled().catch(() => false);
    check('G2', 'and it is disabled', disabled);
    const rowText = await bystanderRow.innerText().catch(() => '');
    check('G3', 'and it carries the reason inline, so the disabling is explained where it happens',
      rowText.includes('already on channel'), `row text: ${JSON.stringify(rowText.replace(/\s+/g, ' ').trim())}`);
    check('G4', 'and the tooltip says the same thing',
      (await bystanderRow.getAttribute('title')) === 'Already on this channel',
      `title=${JSON.stringify(await bystanderRow.getAttribute('title'))}`);

    const freeRow = page.getByRole('button', { name: new RegExp(COLLIDING) }).first();
    check('G5', 'the OTHER same-name candidate — the one that would succeed — is NOT disabled; the '
      + 'fix disables the bound set, not the list',
      !(await freeRow.isDisabled().catch(() => true)),
      `free candidate: ${JSON.stringify((await freeRow.innerText().catch(() => '')).replace(/\s+/g, ' ').trim())}`);

    await page.screenshot({ path: join(SHOT_DIR, '0-disabled-candidate.png') });

    // A real forced mouse click at the row's position — not `dispatchEvent`, which would
    // synthesise a click event that a disabled control never receives from a user and would
    // therefore test something nobody can do.
    const attemptsBefore = reassignAttempts.length;
    await bystanderRow.click({ force: true, timeout: 5_000 }).catch(() => {});
    await sleep(600);
    check('G6', 'a real click on the disabled row reaches the endpoint zero times — the dead-end '
      + 'click Round 292 found is gone, not merely invisible',
      reassignAttempts.length === attemptsBefore,
      `PATCH /channels/:id/entities/:from attempts during the click: ${reassignAttempts.length - attemptsBefore}`);
    const refusalAfterClick = await page.getByText('Target entity is already assigned to this channel')
      .isVisible().catch(() => false);
    check('G7', 'and no refusal sentence is shown, because no refusal was provoked',
      !refusalAfterClick);

    // ─── M · the window before the fetch returns ──────────────────────────────
    console.log('\n[M] the window: `boundIds` is null until the GET lands, and null reads as "not bound"');
    await page.getByRole('button', { name: 'Cancel' }).last().click();
    await page.getByPlaceholder('Search agents by name or @handle').waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});

    holdBoundFetch = true;
    await pickerButton.click();
    await page.getByPlaceholder('Search agents by name or @handle').waitFor({ timeout: 10_000 });
    const windowRow = page.getByRole('button', { name: new RegExp(BYSTANDER) }).first();
    const enabledInWindow = !(await windowRow.isDisabled().catch(() => true));
    measure('M1', `inside the window the already-bound candidate renders ENABLED: ${enabledInWindow} — `
      + '`boundIds` initialises to `null` and `alreadyBound` is `boundIds?.has(id) ?? false`, so '
      + 'until the GET resolves every candidate reads as free. The 2.5s delay here is INJECTED; '
      + 'the window is not — it is inherent to fetch-on-open and on a slow link or a cold server '
      + 'it is as wide as the request is long');

    const attemptsBeforeWindow = reassignAttempts.length;
    if (enabledInWindow) {
      await windowRow.click({ timeout: 5_000 }).catch(() => {});
      const refusal = page.getByText('Target entity is already assigned to this channel');
      const refusalShown = await refusal.waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
      measure('M2', `a click landed inside the window reaches the endpoint: `
        + `${reassignAttempts.length - attemptsBeforeWindow} PATCH attempt(s) — the fix narrows the `
        + 'dead-end click to the open-fetch window rather than removing it');
      // Not a check about the fix: a re-establishment of Round 292's G2, which the fix made
      // unreachable through the UI and which therefore lost its live coverage the day it landed.
      check('M3', "the server's own refusal sentence still reaches the user verbatim when a refusal "
        + 'IS provoked — Round 292 G2, re-established here because the fix closed its only other '
        + 'live route', refusalShown,
        refusalShown ? await refusal.innerText() : 'no refusal text appeared');
      check('M4', 'and the picker stays open after it, so the pick can be corrected in place',
        await page.getByPlaceholder('Search agents by name or @handle').isVisible().catch(() => false));
      await page.screenshot({ path: join(SHOT_DIR, '1-refusal-inside-window.png') });
    } else {
      skip('M2–M4', 'the row was already disabled inside the injected window — the gap this arm '
        + 'demonstrates is not reachable here, and provoking the refusal another way would be a '
        + 'different claim');
    }

    // Let the held GET land and confirm the fix asserts itself once it does.
    holdBoundFetch = false;
    const settled = await page.waitForFunction(
      (name) => Array.from(document.querySelectorAll('button'))
        .some((b) => (b.textContent ?? '').includes(name) && (b as HTMLButtonElement).disabled),
      BYSTANDER,
      { timeout: 10_000 },
    ).then(() => true).catch(() => false);
    check('M5', 'once the held GET lands, the row becomes disabled — the window closes on its own '
      + 'and does not need a reopen', settled);

    // ─── H · the happy path, against the fixed component ──────────────────────
    console.log('\n[H] the happy path: pick the other same-name agent');
    // Re-driven here, not inherited from Round 292: that run THREW before reaching it, so the
    // happy path has not been observed against the fixed component at all.
    await page.getByPlaceholder('Search agents by name or @handle').fill(COLLIDING);
    await page.getByRole('button', { name: new RegExp(COLLIDING) }).first().click();

    const done = page.getByText(new RegExp(`Reassigned to ${COLLIDING}`));
    const doneShown = await done.waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
    check('H1', 'the disclosure is replaced by the reassignment it resolved', doneShown,
      doneShown ? (await done.innerText()).replace(/\s+/g, ' ').trim() : 'no confirmation appeared');
    check('H2', 'and the picker closes on success',
      !(await page.getByPlaceholder('Search agents by name or @handle').isVisible().catch(() => false)));
    await page.screenshot({ path: join(SHOT_DIR, '2-reassigned.png') });

    const after = await (await fetch(`http://localhost:${API_PORT}/api/channels/${channelId}/entities`)).json() as Array<{ id: string }>;
    const ids = after.map((e) => e.id);
    check('H3', 'the binding moved in the database — not only in the panel',
      ids.includes('r293-atlas-2') && !ids.includes('r293-atlas-1'),
      `channel entities after: ${ids.join(', ')}`);

    const db = new Database(DB_PATH, { readonly: true });
    const stamps = db.prepare('SELECT entity_id, COUNT(*) n FROM messages WHERE channel_id = ? GROUP BY entity_id').all(channelId) as Array<{ entity_id: string | null; n: number }>;
    db.close();
    const onOld = stamps.find((s) => s.entity_id === 'r293-atlas-1')?.n ?? 0;
    const onNew = stamps.find((s) => s.entity_id === 'r293-atlas-2')?.n ?? 0;
    check('H4', "the per-message stamps moved with the seat — Round 212's guarantee, observed "
      + 'against the fixed component', onOld === 0 && onNew > 0,
      `messages stamped atlas-1: ${onOld} · atlas-2: ${onNew} · rows: ${JSON.stringify(stamps)}`);

    check('H5', 'and the page threw no uncaught errors across the whole drive',
      consoleErrors.length === 0, consoleErrors.join(' | ') || 'none');
    measure('H6', `screenshots written to ${SHOT_DIR} (disabled candidate · refusal inside the window · reassigned)`);
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
  probeName: 'probe-round293-the-g4-fix-driven-live-and-the-window-before-its-fetch-returns',
  results,
  skipped,
});
