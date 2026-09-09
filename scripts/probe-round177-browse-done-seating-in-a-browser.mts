/**
 * Round 177 probe — Iris's Round 174 seating fix, driven through a real browser.
 *
 * Derived from `probe-round174-browse-route-seating-in-a-browser.mts`, which is preserved
 * as the record of the drive that found the defect. Two things changed here:
 *
 *   - M2 and M1 were `open` checks that reported what a user got. Iris has now ruled and
 *     built both, so they become **regression** arms D1 and D2 against her ruling
 *     (`docs/ux/browse-done-seating-2026-09-09.md`).
 *   - The result-list helper no longer waits on the literal string "Done". Iris's change
 *     makes the primary read "Use this agent" when compose mode has exactly one imported
 *     row (`ImportDialog.tsx:654`), so a probe that waits for "Done" hangs — which is how
 *     the Round 174 instrument reported her change when I re-ran it unmodified this fire.
 *
 * Iris's memo named the gap this closes explicitly: "**Not verified:** no live browser
 * walkthrough this fire — same caveat you and Daedalus have both named at every layer of
 * this feature; code-and-test only against the documented contract and mocked API." Her
 * five new tests are jsdom against a mocked client. This is the same route on real Chromium,
 * a real Vite build, a real Hono server, real SQLite and real session files on disk.
 *
 * N1/N2/N3/X are carried unchanged, as regression cover for Daedalus's Round 173 fix
 * underneath hers — the seating path she edited is the one his `entityId` change made
 * reachable, so it is exactly the code most able to break it.
 *
 * ── original header, for the provenance of the arms carried over ──
 *
 * The Browse route into the composition form, driven through a real browser against a real
 * server, after Daedalus's Round 173 fix (`609ddf4`).
 *
 * Provenance. Round 171 (Theseus, 9/8 START) drove Path B and found the manual path
 * seating the shared default entity with no notice. Round 172 (Theseus, 9/8 MID) re-drove
 * the fix and closed it on the manual path, and named single-session Browse as undriven by
 * either of us. Round 173 (Daedalus, 9/8 STOP) drove it at the component level, found it
 * broken in Round 171's own family one layer over — `handleGoToBulkChannel` called
 * `onImported` with a channel id and four zeros, so every Browse import reached the form
 * through App's *fallback* branch, judged by a channel binding that reads `DEFAULT_ENTITY_ID`
 * both for an unidentified import and for a user who confirmed "Claude" — and fixed it by
 * carrying `entityId` on the row.
 *
 * That fix is pinned by jsdom tests against a mocked API client. This is the same route
 * driven end to end: real browser, real Vite build, real Hono server, real SQLite, real
 * session files on disk. The distinction matters here more than usual, because Round 173's
 * own writeup records a fixture that did not match the shape it claimed to mock and went
 * green anyway.
 *
 *   S   isolation, asserted before anything is measured                     [regression]
 *   N1  Browse, one session, name confirmed        → seats that agent       [regression]
 *   N2  Browse, one session, name left blank       → seats nothing, says so [regression]
 *   N3  Browse, one session, name typed "Claude"   → seats Claude           [regression]
 *   X   N2 and N3 bind the same channel entity — the row is the only evidence [measurement]
 *   D1  Browse, ONE session, the primary button    → reads "Use this agent",
 *                                                     and seating is what it does [regression]
 *   D2  Browse, TWO sessions, the primary "Done"   → seats none, SAYS so     [regression]
 *
 * N3 is arm B3 from Round 172 on the sibling route — the case Daedalus named as the one
 * failing here. N2 and N3 are the pair the pre-173 code could not tell apart, and arm X
 * shows why by reading both channels' bindings: they are identical. The row's `entityId`
 * is the entire difference between "the user chose Claude" and "nothing named this session."
 *
 * D1 and D2 are the two halves of Iris's ruling, and they are asserted on the *label* as
 * well as the behavior. The label is not decoration here: Round 174's finding was that the
 * obvious button discarded the seat, and "the button now does the right thing" and "the
 * button now says what it does" are separately falsifiable. D2 asserts the notice text
 * exactly, because "seat none" is only a defensible ruling if the user is told.
 *
 * Run:  npx tsx scripts/probe-round177-browse-done-seating-in-a-browser.mts
 *
 * ZERO MODEL CALLS. Binding is read from `/api/channels/:id/prompt-debug`, which assembles
 * the prompt the API *would* be sent and returns it unsent. No message is ever sent.
 *
 * XIAN'S DATA IS NEVER TOUCHED. Two isolations, both asserted rather than assumed:
 *   - `KLATCH_DB` points at a scratch file under `.testdata/`.
 *   - `CLAUDE_CONFIG_DIR` points at a synthetic session tree under `.testdata/`, so the
 *     dialog's Browse scanner enumerates my fixtures and cannot reach `~/.claude/projects`.
 *     Arm S asserts the scan saw exactly the fixture count.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import net from 'net';
import { randomUUID as uuid } from 'crypto';
import { chromium, type Browser, type Page, type Locator } from 'playwright';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round177-browse-done-seating');
const DB = path.join(SCRATCH, 'scratch.db');
const CLAUDE_HOME = path.join(SCRATCH, 'fake-claude');
const SHOTS = path.join(SCRATCH, 'shots');
const API_PORT = 3001;
const UI_PORT = 5173;
const API = `http://127.0.0.1:${API_PORT}/api`;
// `localhost`, not `127.0.0.1`: Vite binds to the `localhost` name, which on macOS resolves
// to ::1 first — a 127.0.0.1 fetch is refused and the probe would read a running server as
// "did not come up." (Round 171 learned this the slow way.)
const UI = `http://localhost:${UI_PORT}`;

// Read from source so a rename cannot stale the probe.
const DEFAULT_ENTITY_ID = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/shared/src/types.ts'), 'utf8');
  const m = src.match(/export const DEFAULT_ENTITY_ID = '([^']+)'/);
  if (!m) throw new Error('could not read DEFAULT_ENTITY_ID from shared/src/types.ts');
  return m[1];
})();

// The two notice strings, read from the component rather than retyped here — a copy edit by
// Iris should show up as a probe that needs updating, not one that silently stops asserting.
const { NOTICE_UNIDENTIFIED, NOTICE_NO_AGENT } = (() => {
  const src = fs.readFileSync(
    path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');
  const unid = src.match(/"(Imported — the session[^"]+)"/);
  const none = src.match(/'(Imported, but no agent came back[^']+)'/);
  if (!unid || !none) throw new Error('could not read the two import notices from ChannelSidebar.tsx');
  return { NOTICE_UNIDENTIFIED: unid[1], NOTICE_NO_AGENT: none[1] };
})();

/**
 * Iris's N > 1 notice, read from the same source for the same reason. It is a template
 * literal, so the count placeholder is substituted here rather than the string retyped —
 * if she rewrites the copy the probe fails loudly instead of asserting yesterday's words.
 */
const NOTICE_MULTI_IMPORT = (() => {
  const src = fs.readFileSync(
    path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');
  const m = src.match(/`(Imported \$\{importMultipleCount\} agents[^`]+)`/);
  if (!m) throw new Error('could not read the multi-import notice from ChannelSidebar.tsx');
  return (n: number) => m[1].replace('${importMultipleCount}', String(n));
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
fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SHOTS, { recursive: true });

/**
 * One session file in its own project directory. The project directory is per-arm on
 * purpose: the channel name the server generates is `basename(cwd) — date`, so a distinct
 * cwd gives every arm's imported channel an unambiguous row in the result list. With a
 * shared cwd all rows read alike and a row click would be a coin flip.
 */
function writeSession(slug: string, firstUserMessage: string, reply: string): string {
  const cwd = `/tmp/${slug}`;
  const dir = path.join(CLAUDE_HOME, 'projects', `-tmp-${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    {
      type: 'user', uuid: userUuid, parentUuid: null, sessionId,
      timestamp: '2026-09-07T19:00:00.000Z', cwd, permissionMode: 'default',
      message: { role: 'user', content: firstUserMessage },
    },
    {
      type: 'assistant', uuid: uuid(), parentUuid: userUuid, sessionId,
      timestamp: '2026-09-07T19:00:05.000Z', cwd,
      message: {
        role: 'assistant', model: 'claude-opus-5',
        content: [{ type: 'text', text: reply }], stop_reason: 'end_turn',
      },
    },
  ];
  fs.writeFileSync(path.join(dir, `${sessionId}.jsonl`),
    events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return cwd;
}

// Fixtures are written lazily, immediately before the arm that consumes them. The Browse
// panel pre-selects *every* not-yet-imported session (`handleBrowseSessions`), so a fixture
// written early is silently swallowed by an earlier arm's multi-import — Round 171 spent a
// run diagnosing exactly that as a navigation failure. One new fixture per arm means the
// panel's pre-selection is that fixture and nothing else.
const MARK_N1 = 'WREN-IDENTITY-MARKER-R174';
writeSession('r174-n1', `You are Wren, the research agent. ${MARK_N1}`, 'Wren, ready.');
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
    for (const p of [server, vite]) { try { p.kill('SIGTERM'); } catch { /* gone */ } }
    await new Promise((r) => setTimeout(r, 500));
    for (const p of [server, vite]) {
      if (p.exitCode === null) { try { p.kill('SIGKILL'); } catch { /* gone */ } }
    }
  }
  process.exit(code);
}
process.on('SIGINT', () => { void shutdown(130); });

async function waitForUp(url: string, label: string, logFile: string, proc: ChildProcess, timeoutMs = 90_000) {
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

await waitForUp(`${API}/channels`, 'the API server', serverLog, server);
await waitForUp(UI, 'the Vite dev server', viteLog, vite);

async function api(pathname: string, init?: RequestInit): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API}${pathname}`, init);
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  return { status: res.status, json };
}

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
  return cands.find((t) => /^Imported/.test(t.trim()))?.trim() ?? null;
}

/** The agent names the picker is currently offering. */
async function pickerNames(page: Page): Promise<string[]> {
  return page.locator('label:has(input.accent-accent) span.text-primary').allTextContents();
}

async function openForm(page: Page, kind: 'Chat' | 'Klatch') {
  await page.getByPlaceholder(`${kind} name`).waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
  await page.getByRole('button', { name: `+ New ${kind}` }).click();
  await page.getByPlaceholder(`${kind} name`).waitFor({ state: 'visible', timeout: 10_000 });
}

const PATH_INPUT = '~/.claude/projects/.../session-id.jsonl';

/** Open the in-form import affordance and land on the Browse panel. */
async function openBrowseInForm(page: Page) {
  await openForm(page, 'Chat');
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByPlaceholder(PATH_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
  await page.getByRole('button', { name: /Browse/ }).click();
  await page.getByText(/^Sessions \(/).waitFor({ state: 'visible', timeout: 30_000 });
}

/**
 * `locator.isVisible()` does NOT wait — it answers about this instant. Round 171 recorded
 * two failures that were only ever "the import had not finished yet." Everything that
 * needs to wait goes through here.
 */
async function appears(locator: Locator, timeout = 30_000): Promise<boolean> {
  try { await locator.waitFor({ state: 'visible', timeout }); return true; } catch { return false; }
}

/**
 * Run the Browse panel's import for whatever it has pre-selected, after setting the confirm
 * name on each visible row. `names` is applied positionally; `''` means "clear it", which is
 * a real input and not a default — it is the case that produced Round 171's defect and the
 * one the pre-173 Browse route could not tell apart from a confirmed "Claude".
 */
async function browseImport(page: Page, names: string[]): Promise<{ prefilled: string[] }> {
  const fields = page.getByPlaceholder('Agent name');
  const count = await fields.count();
  const prefilled: string[] = [];
  for (let i = 0; i < count; i++) prefilled.push(await fields.nth(i).inputValue());
  for (let i = 0; i < names.length && i < count; i++) await fields.nth(i).fill(names[i]);
  await page.getByRole('button', { name: /^Import selected/ }).last().click();
  return { prefilled };
}

/**
 * The result state's primary button. Its label is now conditional — 'Use this agent' when
 * compose mode has exactly one imported row, 'Done' otherwise (`ImportDialog.tsx:654`) — so
 * every wait goes through this locator rather than a literal. Re-running the Round 174
 * instrument unmodified this fire is what surfaced that: it hung for 60s waiting on 'Done'.
 */
function primaryButton(page: Page): Locator {
  return page.getByRole('button', { name: /^(Done|Use this agent)$/ }).last();
}

/** Read the result list's rows as text, once the bulk success state is on screen. */
async function resultRows(page: Page): Promise<string[]> {
  await primaryButton(page).waitFor({ state: 'visible', timeout: 60_000 });
  return page.locator('button', { hasText: /\(\d+ messages?\)/ }).allTextContents();
}

/** What the form is showing, read after the seating effect has had time to land. */
async function readForm(page: Page): Promise<{ chips: string[]; notice: string | null }> {
  await page.waitForTimeout(1600);
  return { chips: await seatedAgents(page), notice: await importNotice(page) };
}

/** Create the composed chat and read what it actually bound, at prompt-debug. */
async function createAndInspect(page: Page, chatName: string) {
  await page.getByPlaceholder('Chat name').fill(chatName);
  await page.getByRole('button', { name: 'Create Chat' }).click();
  await page.waitForTimeout(1600);
  const chans = await api('/channels');
  const composed = (chans.json ?? []).find((c: any) => c.name === chatName);
  if (!composed) return null;
  const dbg = await api(`/channels/${composed.id}/prompt-debug`);
  return { channelId: composed.id as string, dbg: dbg.json };
}

/** The imported channel whose generated name carries this arm's cwd basename. */
async function importedChannelFor(slug: string): Promise<any | null> {
  const chans = await api('/channels');
  return (chans.json ?? []).find((c: any) => typeof c.name === 'string' && c.name.includes(slug)) ?? null;
}

try {
  const browserPath = chromium.executablePath();
  measure('S', 'browser', `${path.basename(path.dirname(browserPath))} (${fs.existsSync(browserPath) ? 'present' : 'MISSING'})`);
  measure('S', 'commit under test', execFileSync('git', ['log', '--oneline', '-1'], { cwd: REPO, encoding: 'utf8' }).trim());
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
  check('S', 'the scratch DB is under .testdata, not the real klatch.db',
    fs.existsSync(DB) && DB.includes(`${path.sep}.testdata${path.sep}`), DB);
  const entities0 = await api('/entities');
  const DEFAULT_NAME = (entities0.json ?? []).find((e: any) => e.id === DEFAULT_ENTITY_ID)?.name ?? 'Claude';
  measure('S', 'the registry a fresh install starts with',
    `${JSON.stringify((entities0.json ?? []).map((e: any) => e.name))} · default entity is named ${JSON.stringify(DEFAULT_NAME)}`);

  // ── Arm N1 — Browse, one session, name confirmed ─────────────────────────────
  //
  // The route Round 173 fixed, driven for the first time end to end. Before the fix the
  // row handed App a channel id and four zeros; the form judged by the channel binding and
  // could only ever answer "the default entity."
  await openBrowseInForm(page);
  measure('N1', 'screenshot of the browse panel in compose mode', await shot(page, 'N1-browse-panel'));
  const n1 = await browseImport(page, ['Wren']);
  measure('N1', 'what the confirm field was pre-filled with', JSON.stringify(n1.prefilled));
  const n1Rows = await resultRows(page);
  measure('N1', 'the result list rows', JSON.stringify(n1Rows));
  measure('N1', 'screenshot of the result list', await shot(page, 'N1-result-list'));

  const n1Row = page.locator('button', { hasText: 'r174-n1' }).first();
  check('N1', 'the imported session has a clickable row in the result list',
    await appears(n1Row), `rows=${JSON.stringify(n1Rows)}`);
  await n1Row.click();
  const n1Form = await readForm(page);
  measure('N1', 'what the form seated after clicking the row',
    `chips=${JSON.stringify(n1Form.chips)} · notice=${JSON.stringify(n1Form.notice)}`);
  measure('N1', 'screenshot of the form after the row click', await shot(page, 'N1-form-after-row-click'));
  check('N1', 'a Browse import with a confirmed name seats that agent',
    n1Form.chips.length === 1 && n1Form.chips[0] === 'Wren',
    `chips=${JSON.stringify(n1Form.chips)} (pre-173 this route could only produce ${JSON.stringify([DEFAULT_NAME])})`);
  check('N1', 'it is not the shared default entity', !n1Form.chips.includes(DEFAULT_NAME),
    `default entity is ${JSON.stringify(DEFAULT_NAME)}`);

  const n1Composed = await createAndInspect(page, 'r174-n1-composed');
  check('N1', 'the composed channel was created', !!n1Composed, `id=${n1Composed?.channelId ?? 'MISSING'}`);
  if (n1Composed) {
    measure('N1', 'the composed chat resolves to',
      `entityId=${n1Composed.dbg?.entityId} entityName=${JSON.stringify(n1Composed.dbg?.entityName)}`);
    check('N1', 'a Browse-seated chat binds the imported agent, not the default entity',
      n1Composed.dbg?.entityId !== DEFAULT_ENTITY_ID && n1Composed.dbg?.entityName === 'Wren',
      `entityId=${n1Composed.dbg?.entityId} name=${JSON.stringify(n1Composed.dbg?.entityName)}`);
  }

  // ── Arm N2 — Browse, one session, name left BLANK ────────────────────────────
  //
  // Nothing identified this session and the user confirmed nothing. There is no right
  // agent to seat; the fix's claim is that the form stops asserting a wrong one.
  writeSession('r174-n2', 'can you summarize what changed in the deploy config', 'Here is the summary.');
  await page.goto(UI, { waitUntil: 'networkidle' });
  await openBrowseInForm(page);
  const n2 = await browseImport(page, ['']);
  measure('N2', 'what the confirm field was pre-filled with before clearing', JSON.stringify(n2.prefilled));
  measure('N2', 'the result list rows', JSON.stringify(await resultRows(page)));
  await page.locator('button', { hasText: 'r174-n2' }).first().click();
  const n2Form = await readForm(page);
  measure('N2', 'what the form seated after a blank-name Browse import',
    `chips=${JSON.stringify(n2Form.chips)} · notice=${JSON.stringify(n2Form.notice)}`);
  measure('N2', 'screenshot of the form after the blank import', await shot(page, 'N2-form-blank-unidentified'));
  check('N2', 'a blank-name Browse import seats nothing',
    n2Form.chips.length === 0, `chips=${JSON.stringify(n2Form.chips)}`);
  check('N2', 'it does NOT seat the shared default entity (the Round 171 defect, this route)',
    !n2Form.chips.includes(DEFAULT_NAME), `chips=${JSON.stringify(n2Form.chips)}`);
  check('N2', 'the form says out loud that nothing was identified',
    n2Form.notice === NOTICE_UNIDENTIFIED,
    `notice=${JSON.stringify(n2Form.notice)} · expected=${JSON.stringify(NOTICE_UNIDENTIFIED)}`);
  check('N2', 'and not the older "no agent came back" copy, which means something else',
    n2Form.notice !== NOTICE_NO_AGENT, `other copy=${JSON.stringify(NOTICE_NO_AGENT)}`);

  // ── Arm N3 — Browse, one session, the name typed is the default agent's ──────
  //
  // Round 172's arm B3 on the sibling route: a user who types "Claude" means Claude. This
  // is the branch a guard placed one level higher breaks, and it is the arm Daedalus named
  // as failing here before Round 173 — the channel binding is identical to N2's.
  writeSession('r174-n3', 'You are Vesper, the archivist.', 'Vesper, ready.');
  await page.goto(UI, { waitUntil: 'networkidle' });
  await openBrowseInForm(page);
  const n3 = await browseImport(page, [DEFAULT_NAME]);
  measure('N3', 'what the confirm field guessed before I overrode it', JSON.stringify(n3.prefilled));
  measure('N3', 'the result list rows', JSON.stringify(await resultRows(page)));
  await page.locator('button', { hasText: 'r174-n3' }).first().click();
  const n3Form = await readForm(page);
  measure('N3', 'what the form seated after typing the default agent\'s own name',
    `chips=${JSON.stringify(n3Form.chips)} · notice=${JSON.stringify(n3Form.notice)}`);
  measure('N3', 'screenshot of the form after the "Claude" import', await shot(page, 'N3-form-typed-default-name'));
  check('N3', 'typing the default agent\'s name on the Browse route still seats it',
    n3Form.chips.length === 1 && n3Form.chips[0] === DEFAULT_NAME,
    `chips=${JSON.stringify(n3Form.chips)} — a choice is not a placeholder`);
  check('N3', 'and it does not show the unidentified notice', n3Form.notice !== NOTICE_UNIDENTIFIED,
    `notice=${JSON.stringify(n3Form.notice)}`);

  // ── Arm X — why N2 and N3 need the row ───────────────────────────────────────
  //
  // Both channels bind the same entity. If the form asks the channel — which is exactly
  // what the pre-173 route forced it to do — these two cases are indistinguishable, and
  // one of the two answers is a lie. Measured rather than argued.
  const n2Chan = await importedChannelFor('r174-n2');
  const n3Chan = await importedChannelFor('r174-n3');
  const n2Ents = n2Chan ? await api(`/channels/${n2Chan.id}/entities`) : null;
  const n3Ents = n3Chan ? await api(`/channels/${n3Chan.id}/entities`) : null;
  const n2Bound = (n2Ents?.json ?? [])[0]?.id;
  const n3Bound = (n3Ents?.json ?? [])[0]?.id;
  measure('X', 'the channel binding the blank import produced', `${n2Bound}`);
  measure('X', 'the channel binding the "Claude" import produced', `${n3Bound}`);
  check('X', 'the two channels are bound identically, so the channel cannot tell them apart',
    !!n2Bound && n2Bound === n3Bound && n2Bound === DEFAULT_ENTITY_ID,
    `blank=${n2Bound} typed=${n3Bound} default=${DEFAULT_ENTITY_ID} — the row's entityId is the whole difference`);

  // ── Arm D1 — one session, finished via the primary button ────────────────────
  //
  // Round 174's finding: in compose mode the seating gesture was an unlabelled result row,
  // and the full-width accent primary underneath it read "Done" and threw the seat away.
  // Iris's N=1 ruling: the primary seats directly and takes the manual path's own words.
  // Both halves are asserted, because "does the right thing" and "says what it does" are
  // separately falsifiable and the defect was in the second one.
  writeSession('r174-m2', 'You are Tarn, the archivist of record.', 'Tarn, ready.');
  await page.goto(UI, { waitUntil: 'networkidle' });
  await openBrowseInForm(page);
  await browseImport(page, ['Tarn']);
  measure('D1', 'the result list rows', JSON.stringify(await resultRows(page)));
  const doneBtn = primaryButton(page);
  const doneLabel = ((await doneBtn.textContent()) ?? '').trim();
  measure('D1', 'screenshot of the compose-mode result list, before choosing', await shot(page, 'D1-result-list-before-primary'));
  measure('D1', 'the completion button on this route now reads', JSON.stringify(doneLabel));
  check('D1', 'the compose-mode primary reads "Use this agent", not "Done"',
    doneLabel === 'Use this agent',
    `label=${JSON.stringify(doneLabel)} — Round 174 measured "Done" here, against "Use this agent" on the manual path (ImportDialog.tsx:585)`);
  await doneBtn.click();
  const m2Form = await readForm(page);
  measure('D1', 'what the form got when the import was finished via the primary',
    `chips=${JSON.stringify(m2Form.chips)} · notice=${JSON.stringify(m2Form.notice)}`);
  measure('D1', 'screenshot of the form after the primary', await shot(page, 'D1-form-after-primary'));
  check('D1', 'finishing a single-session Browse import via the primary seats the imported agent',
    m2Form.chips.includes('Tarn'),
    `chips=${JSON.stringify(m2Form.chips)} — Round 174 measured chips=[] here`);
  check('D1', 'and it is not the shared default entity', !m2Form.chips.includes(DEFAULT_NAME),
    `chips=${JSON.stringify(m2Form.chips)}`);
  const m2Picker = await pickerNames(page);
  check('D1', 'the picker is readable at all (guards the selector, not the product)',
    m2Picker.length > 0, `picker=${JSON.stringify(m2Picker)}`);
  measure('D1', 'the registry after the single-session seat',
    `picker=${JSON.stringify(m2Picker)}`);

  // ── Arm D2 — two sessions, Iris's "seat none, say what was imported" ─────────
  //
  // Daedalus recorded N > 1 as a product question rather than guessing at it; Iris ruled
  // "seat none, say what was imported" and gave the reason — a Chat's cap-1 roster cannot
  // receive three candidates under any rule shared with a Klatch's cap-5. Seat-none is only
  // defensible if the user is TOLD, so the notice string is asserted exactly, not for
  // non-emptiness. The silence is the thing being fixed.
  writeSession('r174-m1a', 'You are Bramble, the first of two.', 'Bramble, ready.');
  writeSession('r174-m1b', 'You are Sorrel, the second of two.', 'Sorrel, ready.');
  await page.goto(UI, { waitUntil: 'networkidle' });
  await openBrowseInForm(page);
  const m1 = await browseImport(page, ['Bramble', 'Sorrel']);
  measure('D2', 'confirm fields offered for a two-session selection', JSON.stringify(m1.prefilled));
  const m1Rows = await resultRows(page);
  measure('D2', 'the result list rows', JSON.stringify(m1Rows));
  check('D2', 'both sessions imported', m1Rows.length === 2, `rows=${m1Rows.length}`);
  const m1Label = ((await primaryButton(page).textContent()) ?? '').trim();
  measure('D2', 'the completion button for a two-session import reads', JSON.stringify(m1Label));
  check('D2', 'with more than one row the primary goes back to reading "Done"',
    m1Label === 'Done',
    `label=${JSON.stringify(m1Label)} — "Use this agent" would be a lie about what it does here`);
  measure('D2', 'screenshot of the two-row result list', await shot(page, 'D2-two-row-result-list'));
  await primaryButton(page).click();
  const m1Form = await readForm(page);
  measure('D2', 'what the form got after a two-session Browse import finished via "Done"',
    `chips=${JSON.stringify(m1Form.chips)} · notice=${JSON.stringify(m1Form.notice)}`);
  measure('D2', 'screenshot of the form after the multi-import', await shot(page, 'D2-form-after-done'));
  check('D2', 'a two-session import seats none of them (Iris\'s ruling, not a silence)',
    m1Form.chips.length === 0,
    `chips=${JSON.stringify(m1Form.chips)}`);
  check('D2', 'and the form says exactly what happened',
    m1Form.notice === NOTICE_MULTI_IMPORT(2),
    `notice=${JSON.stringify(m1Form.notice)} · expected=${JSON.stringify(NOTICE_MULTI_IMPORT(2))} — Round 174 measured notice=null`);
  check('D2', 'not the unidentified copy, which would mean something else entirely',
    m1Form.notice !== NOTICE_UNIDENTIFIED && m1Form.notice !== NOTICE_NO_AGENT,
    `notice=${JSON.stringify(m1Form.notice)}`);
  const m1Picker = await pickerNames(page);
  check('D2', 'both agents are still minted and reachable by hand',
    m1Picker.includes('Bramble') && m1Picker.includes('Sorrel'),
    `picker=${JSON.stringify(m1Picker)} — "seat none" must not mean "import nothing"`);
  const entitiesEnd = await api('/entities');
  measure('D2', 'the registry at the end of the drive',
    JSON.stringify((entitiesEnd.json ?? []).map((e: any) => e.name)));

  // ── Closing isolation checks ─────────────────────────────────────────────────
  measure('S', 'browser console errors during the whole drive',
    consoleErrors.length === 0 ? 'none' : JSON.stringify(consoleErrors.slice(0, 8)));
  check('S', 'the probe changed no tracked source file', packagesDiff() === diffBefore,
    packagesDiff() === diffBefore ? 'packages/ diff unchanged' : `packages/ diff CHANGED:\n${packagesDiff()}`);
} catch (err) {
  console.error('\nprobe threw:', err);
  check('S', 'the probe ran to completion', false, err instanceof Error ? err.message : String(err));
}

// ── Report ──────────────────────────────────────────────────────────────────────
const regressions = results.filter((r) => r.kind === 'regression');
const opens = results.filter((r) => r.kind === 'open');
const failed = regressions.filter((r) => !r.pass);
console.log('\n' + '─'.repeat(78));
console.log(`${regressions.length - failed.length}/${regressions.length} regression checks pass · ` +
  `${opens.filter((o) => !o.pass).length}/${opens.length} open checks failing · ` +
  `${results.filter((r) => r.kind === 'measurement').length} measurements`);
if (failed.length) {
  console.log('\nFAILED:');
  for (const f of failed) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
console.log(`\nshots: ${path.relative(REPO, SHOTS)}`);
await shutdown(failed.length ? 1 : 0);
