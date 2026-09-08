/**
 * Round 171 probe — Path B (just-in-time import inside the composition gesture),
 * driven through a real browser against a real server.
 *
 * Theseus, 2026-09-08 START fire. Daedalus shipped Path B in `32e00a0` earlier the
 * same day and named the gap himself, in the memo and in the build note:
 *
 *   "The 15 tests cover ChannelSidebar and ImportDialog directly. They do not cover
 *    the App.tsx wiring: compose-mode routing, the suppressed navigation, the entity
 *    refresh, and the fetchChannelEntities fallback on the duplicate path are each
 *    driven by hand-read code and typecheck only."
 *
 * The seam is pinned; the wiring is not. Component tests hand `onImportAgent` a mock
 * and assert the mock was called. Nothing in the suite has watched a real import come
 * back off a real server and land in a real form. That is what this does.
 *
 * Run:  npx tsx scripts/probe-round171-path-b-jit-import-browser.mts
 *
 * ZERO MODEL CALLS. Binding is read from `/api/channels/:id/prompt-debug`, which
 * assembles the prompt the API *would* be sent and returns it without sending it —
 * the same instrument Round 161 used on Path C. No message is ever sent.
 *
 * XIAN'S DATA IS NEVER TOUCHED. Two isolations, both asserted rather than assumed:
 *   - `KLATCH_DB` points at a scratch file under `.testdata/`.
 *   - `CLAUDE_CONFIG_DIR` points at a synthetic session tree under `.testdata/`, so
 *     the dialog's own "Browse..." scanner enumerates my fixtures and cannot reach
 *     `~/.claude/projects`. Arm S asserts the scan saw exactly the fixture count.
 *
 * Arms:
 *   A  the empty-registry form shape — the state Iris was asked to rule on   [measurement]
 *   B  manual-path import from inside the form: which agent gets seated       [open]
 *   C  the composed channel's actual binding, read at prompt-debug           [regression]
 *   D  browse + confirm-name import from inside the form                     [regression]
 *   E  the pre-existing sidebar import path still navigates                  [regression]
 *   F  the duplicate path ("View existing") inside compose mode              [open]
 *   G  klatch roster at cap 5 — the notice, not silence                      [regression]
 *   S  isolation + cleanliness guards                                        [regression]
 *
 * Convention (same as Rounds 142/161): `regression` failures exit 1. `open` checks are
 * written in the positive and only report — the day one passes is the day the item
 * behind it genuinely closed, and a red exit keeps meaning what it says.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import net from 'net';
import { randomUUID as uuid } from 'crypto';
import { chromium, type Browser, type Page } from 'playwright';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round171-path-b');
const DB = path.join(SCRATCH, 'scratch.db');
const CLAUDE_HOME = path.join(SCRATCH, 'fake-claude');
const SHOTS = path.join(SCRATCH, 'shots');
const API_PORT = 3001;
const UI_PORT = 5173;
const API = `http://127.0.0.1:${API_PORT}/api`;
// `localhost`, not `127.0.0.1`: Vite binds its dev server to the `localhost` name, which
// on macOS resolves to ::1 first — a 127.0.0.1 fetch is refused and the probe would read
// a running server as "did not come up."
const UI = `http://localhost:${UI_PORT}`;

// Read from source so a rename cannot stale the probe.
const DEFAULT_ENTITY_ID = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/shared/src/types.ts'), 'utf8');
  const m = src.match(/export const DEFAULT_ENTITY_ID = '([^']+)'/);
  if (!m) throw new Error('could not read DEFAULT_ENTITY_ID from shared/src/types.ts');
  return m[1];
})();

type Kind = 'regression' | 'open' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'regression' ? 'FAIL' : kind === 'open' ? 'OPEN' : 'NOTE';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
function measure(arm: string, name: string, detail: string) {
  results.push({ arm, check: name, pass: true, detail, kind: 'measurement' });
  console.log(`MEAS [${arm}] ${name} — ${detail}`);
}

function packagesDiff(): string {
  return execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
}
const diffBefore = packagesDiff();

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

// ── Fixture sessions ────────────────────────────────────────────────────────────
//
// Laid out the way Claude Code actually lays them out — CLAUDE_CONFIG_DIR/projects/
// <encoded-cwd>/<session-uuid>.jsonl — because the dialog's Browse path walks that
// shape. The identity line is the first user turn, which is what a human reads when
// deciding what to call the agent.
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });
const PROJECT_DIR = path.join(CLAUDE_HOME, 'projects', '-tmp-r171-probe');
fs.mkdirSync(PROJECT_DIR, { recursive: true });

const PIPER_MARKER = 'PIPER-IDENTITY-MARKER-R171';
const WREN_MARKER = 'WREN-IDENTITY-MARKER-R171';

function writeSession(file: string, identityLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    {
      type: 'user',
      uuid: userUuid,
      parentUuid: null,
      sessionId,
      timestamp: '2026-09-07T19:00:00.000Z',
      cwd: '/tmp/r171-probe',
      permissionMode: 'default',
      message: { role: 'user', content: identityLine },
    },
    {
      type: 'assistant',
      uuid: uuid(),
      parentUuid: userUuid,
      sessionId,
      timestamp: '2026-09-07T19:00:05.000Z',
      cwd: '/tmp/r171-probe',
      message: {
        role: 'assistant',
        model: 'claude-opus-5',
        content: [{ type: 'text', text: reply }],
        stop_reason: 'end_turn',
      },
    },
  ];
  const p = path.join(PROJECT_DIR, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}

// Fixtures are written LAZILY, immediately before the arm that consumes them.
//
// The first run of this probe created all four up front and arm E failed on a timeout
// that looked like a product defect and was not: arm D's browse panel pre-selects every
// not-yet-imported session, so the bulk import swallowed arm E's fixture and arm E then
// hit a duplicate conflict instead of a success state. Creating each session at the
// moment its arm needs it makes the arms independent of each other's side effects.
const SESSION_PIPER = writeSession(
  `${uuid()}.jsonl`,
  `You are Piper Morgan, a product manager. ${PIPER_MARKER}`,
  'Understood — Piper here.'
);
const FIXTURE_COUNT_AT_START = 1;

// ── Process lifecycle ───────────────────────────────────────────────────────────

for (const [port, what] of [[API_PORT, 'the API server'], [UI_PORT, 'the Vite dev server']] as const) {
  if (!(await portIsFree(port))) {
    console.error(`port ${port} is occupied — this probe must own ${what}. Stop the dev server and re-run.`);
    process.exit(2);
  }
}

const serverLog = path.join(SCRATCH, 'server.log');
const viteLog = path.join(SCRATCH, 'vite.log');
const serverFd = fs.openSync(serverLog, 'a');
const viteFd = fs.openSync(viteLog, 'a');

const server: ChildProcess = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: path.join(REPO, 'packages/server'),
  env: { ...process.env, KLATCH_DB: DB, CLAUDE_CONFIG_DIR: CLAUDE_HOME },
  stdio: ['ignore', serverFd, serverFd],
});
const vite: ChildProcess = spawn('npx', ['vite', '--port', String(UI_PORT), '--strictPort'], {
  cwd: path.join(REPO, 'packages/client'),
  env: { ...process.env },
  stdio: ['ignore', viteFd, viteFd],
});

let browser: Browser | null = null;
let shuttingDown = false;
async function shutdown(code: number): Promise<never> {
  if (!shuttingDown) {
    shuttingDown = true;
    try { await browser?.close(); } catch { /* already gone */ }
    for (const p of [server, vite]) {
      try { p.kill('SIGTERM'); } catch { /* already gone */ }
    }
    await new Promise((r) => setTimeout(r, 500));
    for (const p of [server, vite]) {
      if (p.exitCode === null) { try { p.kill('SIGKILL'); } catch { /* gone */ } }
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => { void shutdown(130); });

async function waitFor(url: string, label: string, logFile: string, proc: ChildProcess, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      console.error(`${label} exited early (code ${proc.exitCode}). Log:\n${fs.readFileSync(logFile, 'utf8')}`);
      await shutdown(1);
    }
    try { if ((await fetch(url)).ok) return; } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.error(`${label} did not come up. Log:\n${fs.readFileSync(logFile, 'utf8')}`);
  await shutdown(1);
}

await waitFor(`${API}/channels`, 'the API server', serverLog, server);
await waitFor(UI, 'the Vite dev server', viteLog, vite);

async function api(pathname: string, init?: RequestInit): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API}${pathname}`, init);
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}
const post = (p: string, body: unknown) =>
  api(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// ── Browser helpers ─────────────────────────────────────────────────────────────

let shotN = 0;
async function shot(page: Page, name: string): Promise<string> {
  const file = path.join(SHOTS, `${String(++shotN).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return path.relative(REPO, file);
}

/** The chips the composition form is currently showing, read from their own aria-labels. */
async function seatedAgents(page: Page): Promise<string[]> {
  return page.locator('[aria-label^="Remove "]').evaluateAll((els) =>
    els.map((e) => (e.getAttribute('aria-label') ?? '').replace(/^Remove /, ''))
  );
}

/** The Path B notice line, if the form is showing one. */
async function importNotice(page: Page): Promise<string | null> {
  const cands = await page.locator('div.text-\\[11px\\].text-muted').allTextContents();
  return cands.find((t) => /^Imported/.test(t.trim())) ?? null;
}

async function openForm(page: Page, kind: 'Chat' | 'Klatch') {
  await page.getByRole('button', { name: `+ New ${kind}` }).click();
  await page.getByPlaceholder(`${kind} name`).waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Drive the dialog's manual-path import to its success state.
 *
 * `.last()` on the submit: the sidebar's own "Import" button is still in the DOM behind
 * the modal and matches the same accessible name. App renders ChannelSidebar before
 * ImportDialog, so the dialog's is the later one. Getting this wrong would silently
 * re-open the dialog instead of submitting it.
 */
async function importByPath(page: Page, sessionPath: string, channelName: string) {
  await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').fill(sessionPath);
  await page.getByPlaceholder('Auto-generated from project + date').fill(channelName);
  await page.getByRole('button', { name: /^Import$/ }).last().click();
}

/** Get out of the dialog whatever state it finished in. */
/**
 * `locator.isVisible()` does NOT wait — it answers about this instant. Passing it a
 * timeout reads as if it does, and the first run of this probe recorded two failures
 * that were only ever "the import had not finished yet." Everything that needs to wait
 * goes through here.
 */
async function appears(locator: ReturnType<Page['getByRole']>, timeout = 20_000): Promise<boolean> {
  try { await locator.waitFor({ state: 'visible', timeout }); return true; } catch { return false; }
}

async function leaveDialog(page: Page) {
  for (const name of ['Use this agent', 'Done', 'Cancel']) {
    const b = page.getByRole('button', { name });
    if (await b.first().isVisible().catch(() => false)) { await b.first().click(); return name; }
  }
  await page.keyboard.press('Escape').catch(() => {});
  return 'Escape';
}

try {
  const browserPath = chromium.executablePath();
  measure('S', 'browser', `${path.basename(path.dirname(browserPath))} (${fs.existsSync(browserPath) ? 'present' : 'MISSING'})`);
  browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const page = await ctx.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(UI, { waitUntil: 'networkidle' });

  // ── Arm S — isolation, asserted before anything is measured ──────────────────
  const scan = await api('/import/claude-code/sessions');
  check('S', 'the session scanner sees only the probe fixtures',
    scan.json?.totalSessions === FIXTURE_COUNT_AT_START,
    `totalSessions=${scan.json?.totalSessions} (expected ${FIXTURE_COUNT_AT_START}); projects=${scan.json?.totalProjects}`);
  const entities0 = await api('/entities');
  measure('S', 'the registry a fresh install actually starts with',
    `${entities0.json?.length ?? 0} entit${entities0.json?.length === 1 ? 'y' : 'ies'}: ` +
    `${JSON.stringify((entities0.json ?? []).map((e: any) => e.name))}`);

  // ── Arm A — the empty-registry form, which is the shape Iris was asked to rule on ──
  //
  // Daedalus: "the empty-registry form shows a lone dashed import button under the name
  // field with no picker above it, and I have not seen that state on a real screen."
  // This arm is that screen. Whether the picker renders at all depends on whether the
  // seeded default entity counts toward `entities.length > 0`, which is measured, not
  // reasoned about.
  await openForm(page, 'Chat');
  const pickerVisibleFresh = await page.getByPlaceholder('Search agents by name or @handle').isVisible().catch(() => false);
  const importBtn = page.getByRole('button', { name: 'Import an agent' });
  check('A', 'the Path B affordance renders inside the New Chat form',
    await importBtn.isVisible(), `visible=${await importBtn.isVisible().catch(() => false)}`);
  check('A', 'its explanatory line is the one that does the PREMISE work',
    await page.getByText('Bring one in from Claude Code or claude.ai — it arrives with its conversation.').isVisible(),
    'the "arrives with its conversation" clause is on screen');
  measure('A', 'is the picker rendered on a fresh install?',
    pickerVisibleFresh
      ? `YES — the seeded default entity satisfies entities.length > 0, so the "lone dashed button, no picker" state is NOT reachable on a fresh install`
      : `NO — the orphan state Iris was asked about is real and is on screen`);
  measure('A', 'screenshot of the fresh-install composition form', await shot(page, 'A-fresh-install-form'));

  // ── Arm B — the manual-path import, which is the default way in ──────────────
  //
  // The dialog opens on the manual path input; Browse is a second click. So this is the
  // path a user reaches first. `handleSubmit` (ImportDialog.tsx:124) calls
  // `importClaudeCodeSession(sessionPath, channelName)` with NO entityName — and
  // `resolveImportEntity` (entity-resolve.ts:78-80) returns `{ disposition: 'default' }`
  // when the name is blank, so the route returns no entityId at all. What Path B then
  // seats is the open question this arm exists to answer, on screen rather than by
  // reading the code.
  await importBtn.click();
  await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').waitFor({ state: 'visible', timeout: 10_000 });
  check('B', 'the dialog opened in compose mode from inside the form',
    true, 'manual-path input reached from the in-form affordance');
  await importByPath(page, SESSION_PIPER, 'r171-piper-manual');
  const useThisAgent = page.getByRole('button', { name: 'Use this agent' });
  await useThisAgent.waitFor({ state: 'visible', timeout: 20_000 });
  check('B', 'the completion button reads "Use this agent", not "Go to channel"',
    await useThisAgent.isVisible(), 'compose-mode copy confirmed at the endpoint');
  measure('B', 'screenshot of the compose-mode success state', await shot(page, 'B-compose-success'));
  await useThisAgent.click();

  // The form must still be here. Navigating away is the failure Path B exists to prevent.
  await page.getByPlaceholder('Chat name').waitFor({ state: 'visible', timeout: 10_000 });
  check('B', 'the half-composed form survived the import (no navigation)',
    await page.getByPlaceholder('Chat name').isVisible(), 'setup form still mounted after "Use this agent"');

  await page.waitForTimeout(1200); // let the entity refetch + the seating effect land
  const seatedB = await seatedAgents(page);
  const noticeB = await importNotice(page);
  measure('B', 'what the form seated after a manual-path import',
    `chips=${JSON.stringify(seatedB)} · notice=${JSON.stringify(noticeB)}`);
  measure('B', 'screenshot of the form after "Use this agent"', await shot(page, 'B-form-after-seat'));

  const defaultEntityName = (entities0.json ?? []).find((e: any) => e.id === DEFAULT_ENTITY_ID)?.name;
  check('B', 'the agent seated by a manual-path import is not the shared default entity',
    seatedB.length === 1 && seatedB[0] !== defaultEntityName,
    seatedB.length === 0
      ? `nothing was seated; notice=${JSON.stringify(noticeB)}`
      : `seated ${JSON.stringify(seatedB)} vs default entity ${JSON.stringify(defaultEntityName)}`,
    'open');

  // ── Arm C — what the composed channel is actually bound to ───────────────────
  await page.getByPlaceholder('Chat name').fill('r171-composed-from-manual');
  await page.getByRole('button', { name: 'Create Chat' }).click();
  await page.waitForTimeout(1200);
  const chans = await api('/channels');
  const composed = (chans.json ?? []).find((c: any) => c.name === 'r171-composed-from-manual');
  check('C', 'the composed channel was created', !!composed, `id=${composed?.id ?? 'MISSING'}`);
  if (composed) {
    const dbg = await api(`/channels/${composed.id}/prompt-debug`);
    measure('C', 'the composed chat resolves to',
      `entityId=${dbg.json?.entityId} entityName=${JSON.stringify(dbg.json?.entityName)} ` +
      `(default entity id is ${DEFAULT_ENTITY_ID})`);
    check('C', 'a Path B chat binds the imported agent, not the default entity',
      dbg.json?.entityId !== DEFAULT_ENTITY_ID,
      `entityId=${dbg.json?.entityId}`, 'open');
    check('C', "the imported session's own identity text reached the assembled prompt",
      typeof dbg.json?.assembledPrompt === 'string' && dbg.json.assembledPrompt.includes(PIPER_MARKER),
      `marker present=${dbg.json?.assembledPrompt?.includes(PIPER_MARKER)}`, 'open');
  }

  // ── Arm D — browse + confirm-name, the path that carries an entity ───────────
  //
  // The contrast case for B. Iris's confirm step lives only in the Browse panel, so this
  // is the only in-dialog route that sends an entityName and therefore the only one that
  // can mint an identified agent.
  writeSession(`${uuid()}.jsonl`, `You are Wren, the research agent. ${WREN_MARKER}`, 'Wren, ready.');
  writeSession(`${uuid()}.jsonl`, 'You are Vesper, the second browse fixture.', 'Vesper, ready.');
  await openForm(page, 'Chat');
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByRole('button', { name: /Browse/ }).click();
  await page.getByText(/^Sessions \(/).waitFor({ state: 'visible', timeout: 30_000 });
  measure('D', 'screenshot of the browse panel inside compose mode', await shot(page, 'D-browse-panel'));

  const nameFields = page.getByPlaceholder('Agent name');
  const nameFieldCount = await nameFields.count();
  measure('D', 'confirm-step name fields offered by the browse panel', `${nameFieldCount}`);
  let armDDrove = false;
  if (nameFieldCount > 0) {
    // Drive the first offered session through the confirm step under a name of my own,
    // so the chip that comes back is unambiguous about which path produced it.
    await nameFields.first().fill('Piper Morgan');
    await page.getByRole('button', { name: /^Import selected/ }).last().click();
    await page.waitForTimeout(5000);
    armDDrove = true;
    measure('D', 'screenshot after driving the confirm step', await shot(page, 'D-after-confirm-import'));
  }
  if (!armDDrove) {
    measure('D', 'not driven', 'the browse panel offered no confirm-step name field at this stage — see the screenshot');
  }
  // Whatever route it took, close out of the dialog and read the form.
  measure('D', 'left the dialog via', await leaveDialog(page));
  await page.waitForTimeout(1500);
  measure('D', 'screenshot of the form after the browse path', await shot(page, 'D-form-after-browse'));
  measure('D', 'what the form seated after the browse path',
    `chips=${JSON.stringify(await seatedAgents(page))} · notice=${JSON.stringify(await importNotice(page))}`);
  const entitiesAfterD = await api('/entities');
  measure('D', 'the registry after the browse path',
    JSON.stringify((entitiesAfterD.json ?? []).map((e: any) => e.name)));
  check('D', 'the browse+confirm path can mint an identified agent',
    (entitiesAfterD.json ?? []).some((e: any) => e.name === 'Piper Morgan'),
    `names=${JSON.stringify((entitiesAfterD.json ?? []).map((e: any) => e.name))}`, 'open');

  // ── Arm E — the pre-existing sidebar import path is unchanged ────────────────
  //
  // The regression Daedalus most wanted checked: he changed a callback two other entry
  // points share. Outside compose mode, finishing an import must still navigate to the
  // imported channel.
  const SESSION_SIDEBAR = writeSession(
    `${uuid()}.jsonl`, 'Fix the flaky parser test.', 'Looking at the parser suite now.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Import$/ }).first().click();
  await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_SIDEBAR, 'r171-sidebar-path');
  const goToChannel = page.getByRole('button', { name: 'Go to channel' });
  const reachedSuccess = await appears(goToChannel, 30_000);
  check('E', 'outside compose mode the button still reads "Go to channel"',
    reachedSuccess,
    reachedSuccess ? 'standalone import copy unchanged'
      : `success state not reached — dialog shows: ${JSON.stringify(await page.locator('.font-medium').allTextContents())}`);
  if (!reachedSuccess) { measure('E', 'screenshot of the unexpected state', await shot(page, 'E-unexpected')); }
  await goToChannel.click();
  await page.waitForTimeout(1500);
  const navigated = await page.getByText('Looking at the parser suite now.').isVisible().catch(() => false);
  check('E', 'the sidebar import path still navigates to the imported channel',
    navigated, navigated
      ? "the imported transcript's assistant turn is on screen"
      : 'the imported transcript did not appear — navigation may have been suppressed');
  measure('E', 'screenshot after the sidebar import', await shot(page, 'E-sidebar-import-navigated'));

  // ── Arm F — the duplicate path inside compose mode ───────────────────────────
  //
  // Daedalus flagged this as the case most likely to be wrong: ImportConflict carries no
  // entity, so App falls back to asking the channel for its bound agent. Re-importing the
  // session already imported in arm E, but this time from inside the form.
  await openForm(page, 'Chat');
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_SIDEBAR, 'r171-duplicate-attempt');
  const viewExisting = page.getByRole('button', { name: 'View existing' });
  const gotConflict = await appears(viewExisting, 30_000);
  check('F', 're-importing the same session raises the duplicate state', gotConflict,
    gotConflict ? '"Already imported" reached from inside the form' : 'no conflict state appeared');
  if (gotConflict) {
    measure('F', 'screenshot of the conflict inside compose mode', await shot(page, 'F-conflict-compose'));
    await viewExisting.click();
    await page.waitForTimeout(1500);
    const stillInForm = await page.getByPlaceholder('Chat name').isVisible().catch(() => false);
    const seatedF = await seatedAgents(page);
    const noticeF = await importNotice(page);
    measure('F', 'after "View existing" from inside the form',
      `still in the form=${stillInForm} · chips=${JSON.stringify(seatedF)} · notice=${JSON.stringify(noticeF)}`);
    measure('F', 'screenshot after "View existing"', await shot(page, 'F-after-view-existing'));
    check('F', '"View existing" from inside the form keeps the user in the form',
      stillInForm, `form visible=${stillInForm}`, 'open');
    check('F', 'the duplicate path either seats an agent or says why it could not',
      seatedF.length > 0 || !!noticeF,
      `chips=${JSON.stringify(seatedF)} notice=${JSON.stringify(noticeF)}`);
  }

  // ── Arm G — a klatch roster already at cap ───────────────────────────────────
  //
  // Five agents seated, then an import. The agent exists and cannot be seated here; the
  // form must say so rather than appearing to have done nothing.
  const SESSION_KLATCH = writeSession(
    `${uuid()}.jsonl`, 'You are Tarn, the sixth agent for the cap arm.', 'Tarn, ready.');
  for (const n of ['R171 Alpha', 'R171 Bravo', 'R171 Charlie', 'R171 Delta', 'R171 Echo']) {
    await post('/entities', { name: n, systemPrompt: `You are ${n}.` });
  }
  await page.reload({ waitUntil: 'networkidle' });
  await openForm(page, 'Klatch');
  await page.getByPlaceholder('Search agents by name or @handle').fill('R171');
  await page.waitForTimeout(400);
  const boxes = page.locator('input[type="checkbox"]');
  const boxCount = await boxes.count();
  for (let i = 0; i < Math.min(boxCount, 5); i++) await boxes.nth(i).click();
  await page.waitForTimeout(300);
  const seatedBefore = await seatedAgents(page);
  check('G', 'five agents are seated before the import', seatedBefore.length === 5,
    `seated=${seatedBefore.length}: ${JSON.stringify(seatedBefore)}`);
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByPlaceholder('~/.claude/projects/.../session-id.jsonl').waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_KLATCH, 'r171-klatch-cap');
  await page.getByRole('button', { name: 'Use this agent' }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: 'Use this agent' }).click();
  await page.waitForTimeout(1500);
  const seatedAfter = await seatedAgents(page);
  const noticeG = await importNotice(page);
  measure('G', 'the form at cap after an import',
    `chips=${seatedAfter.length} ${JSON.stringify(seatedAfter)} · notice=${JSON.stringify(noticeG)}`);
  measure('G', 'screenshot of the at-cap notice', await shot(page, 'G-roster-full'));
  check('G', 'the roster stayed at five (the import did not silently displace a seat)',
    seatedAfter.length === 5, `seated=${seatedAfter.length}`);
  check('G', 'the form says out loud that it could not seat the import',
    !!noticeG, `notice=${JSON.stringify(noticeG)}`);

  // ── Guards ───────────────────────────────────────────────────────────────────
  measure('S', 'browser console errors during the whole drive',
    consoleErrors.length === 0 ? 'none' : `${consoleErrors.length}: ${JSON.stringify(consoleErrors.slice(0, 5))}`);
  const diffAfter = packagesDiff();
  check('S', 'packages/ untouched by this probe', diffAfter === diffBefore,
    diffAfter === diffBefore ? 'git diff --stat -- packages/ unchanged' : `CHANGED:\n${diffAfter}`);
  check('S', "xian's klatch.db was never the target",
    process.env.KLATCH_DB === undefined || process.env.KLATCH_DB === DB, `server ran against ${DB}`);
  check('S', "the real ~/.claude session tree was never scanned",
    scan.json?.totalSessions === FIXTURE_COUNT_AT_START, `CLAUDE_CONFIG_DIR=${CLAUDE_HOME}`);

  // ── Report ───────────────────────────────────────────────────────────────────
  const reg = results.filter((r) => r.kind === 'regression');
  const open = results.filter((r) => r.kind === 'open');
  const meas = results.filter((r) => r.kind === 'measurement');
  const regFailed = reg.filter((r) => !r.pass);
  const openPassing = open.filter((r) => r.pass);

  console.log('\n──────── summary ────────');
  console.log(`regression: ${reg.length - regFailed.length}/${reg.length} passed`);
  console.log(`open:       ${openPassing.length}/${open.length} passing (a pass means the item behind it closed)`);
  console.log(`measurement:${meas.length} recorded`);
  console.log(`screenshots: ${path.relative(REPO, SHOTS)}`);
  if (regFailed.length > 0) {
    console.log('\nFAILED:');
    for (const r of regFailed) console.log(`  [${r.arm}] ${r.check} — ${r.detail}`);
  }
  const openFailing = open.filter((r) => !r.pass);
  if (openFailing.length > 0) {
    console.log('\nOPEN (reported, not failing the run):');
    for (const r of openFailing) console.log(`  [${r.arm}] ${r.check} — ${r.detail}`);
  }
  await shutdown(regFailed.length > 0 ? 1 : 0);
} catch (err) {
  console.error(err);
  try { fs.writeFileSync(path.join(SCRATCH, 'crash-vite.log'), fs.readFileSync(viteLog, 'utf8')); } catch { /* n/a */ }
  await shutdown(1);
}
