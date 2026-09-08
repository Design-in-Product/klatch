/**
 * Round 172 probe — re-drive of Path B after Daedalus's Round 171 fix (`70b9ba1`),
 * through a real browser against a real server.
 *
 * Round 171 (Theseus, same day, START fire) drove the composition gesture and found the
 * route a user reaches first — the manual path input the import dialog opens on — seating
 * a chip reading "Claude", the shared default entity, with no notice, for a session whose
 * own identity marker never reached the assembled prompt.
 *
 * Daedalus fixed it in two pieces and asked, in
 * `docs/mail/daedalus-to-theseus-iris-cc-janus-calliope-argus-xian-you-found-it-and-i-took-both-shapes-2026-09-08.md`:
 *
 *   "App's *wiring* to `resolveJitSeat` is still typecheck-and-hand-read — the decision is
 *    tested, the call site isn't. If you have an arm to spare: re-run your arm B and arm F."
 *
 * This is that re-run, widened. Round 171's arm B drove one case (blank name, because the
 * field did not exist). The fix creates four distinguishable outcomes on that one route,
 * and the interesting ones are not the happy path:
 *
 *   B1  manual path + a typed name          → seats that agent, marker reaches the prompt
 *   B2  manual path + blank                 → seats NOTHING and says so (was: seated "Claude")
 *   B3  manual path + the literal "Claude"  → still seats Claude — a choice is not a placeholder
 *   F1  duplicate of a NAMED import         → the channel fallback still recovers the agent
 *   F2  duplicate of an UNNAMED import      → the unidentified notice, not a "Claude" chip
 *   K   Path B into a KLATCH                → the imported conversation reaches the prompt
 *
 * B3 and F1 are the arms that matter most: they are the two branches a careless version of
 * this fix breaks. `resolveJitSeat` refuses `DEFAULT_ENTITY_ID` when it arrives via the
 * channel fallback; a guard placed one branch higher would also refuse a user who *typed*
 * "Claude" (B3), and a guard placed one branch lower would refuse a legitimate recovery
 * (F1). Daedalus pinned B3 in a unit test. Neither is driven at the endpoint anywhere.
 *
 * Run:  npx tsx scripts/probe-round172-path-b-confirm-step-redrive.mts
 *
 * ZERO MODEL CALLS. Binding is read from `/api/channels/:id/prompt-debug`, which assembles
 * the prompt the API *would* be sent and returns it unsent. No message is ever sent.
 *
 * XIAN'S DATA IS NEVER TOUCHED. Two isolations, both asserted rather than assumed:
 *   - `KLATCH_DB` points at a scratch file under `.testdata/`.
 *   - `CLAUDE_CONFIG_DIR` points at a synthetic session tree under `.testdata/`, so the
 *     dialog's Browse scanner enumerates my fixtures and cannot reach `~/.claude/projects`.
 *     Arm S asserts the scan saw exactly the fixture count.
 *
 * Arm K is the arm Round 171 should have had, and its absence made me over-read one line.
 * Round 171 reported "the imported session's identity marker is absent from the assembled
 * prompt" as part of the finding. That measurement was accurate and my reading of it was
 * not: `buildCarriedContextBlock` returns undefined unless `channel.type === 'klatch'`
 * (carried-context.ts:304, a deliberate scoping), so the marker would have been absent from
 * that 1-1 Chat even with the correct agent bound. The binding defect was real and is what
 * Daedalus fixed; the marker line was over-determined and did not bear on it. Arm K puts
 * the question where it can actually be answered.
 *
 * Convention (Rounds 142/161/171): `regression` failures exit 1. `open` checks are written
 * in the positive and only report. Round 171's binding-related OPEN checks are carried here
 * as regression checks, because the fix claims to close them — if they are closed, they are
 * now things that must not break again.
 */

import fs from 'fs';
import path from 'path';
import { spawn, execFileSync, type ChildProcess } from 'child_process';
import net from 'net';
import { randomUUID as uuid } from 'crypto';
import { chromium, type Browser, type Page } from 'playwright';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'round172-confirm-step');
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

// The two notice strings the fix distinguishes, read from the component rather than
// retyped here — a copy edit by Iris should show up as a probe that needs updating, not as
// a probe that silently stops asserting anything.
const { NOTICE_UNIDENTIFIED, NOTICE_NO_AGENT } = (() => {
  const src = fs.readFileSync(
    path.join(REPO, 'packages/client/src/components/ChannelSidebar.tsx'), 'utf8');
  const unid = src.match(/"(Imported — the session[^"]+)"/);
  const none = src.match(/'(Imported, but no agent came back[^']+)'/);
  if (!unid || !none) throw new Error('could not read the two import notices from ChannelSidebar.tsx');
  return { NOTICE_UNIDENTIFIED: unid[1], NOTICE_NO_AGENT: none[1] };
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
const PROJECT_DIR = path.join(CLAUDE_HOME, 'projects', '-tmp-r172-probe');
fs.mkdirSync(PROJECT_DIR, { recursive: true });

function writeSession(file: string, identityLine: string, reply: string): string {
  const sessionId = uuid();
  const userUuid = uuid();
  const events = [
    {
      type: 'user', uuid: userUuid, parentUuid: null, sessionId,
      timestamp: '2026-09-07T19:00:00.000Z', cwd: '/tmp/r172-probe', permissionMode: 'default',
      message: { role: 'user', content: identityLine },
    },
    {
      type: 'assistant', uuid: uuid(), parentUuid: userUuid, sessionId,
      timestamp: '2026-09-07T19:00:05.000Z', cwd: '/tmp/r172-probe',
      message: {
        role: 'assistant', model: 'claude-opus-5',
        content: [{ type: 'text', text: reply }], stop_reason: 'end_turn',
      },
    },
  ];
  const p = path.join(PROJECT_DIR, file);
  fs.writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  return p;
}

// Fixtures are written lazily, immediately before the arm that consumes them — Round 171's
// first run had arm D's browse panel (which pre-selects every not-yet-imported session)
// swallow a later arm's fixture, and the resulting duplicate conflict presented as a
// navigation failure. Each arm owns its own session.
const MARK_B1 = 'PIPER-IDENTITY-MARKER-R172';
const SESSION_B1 = writeSession(
  `${uuid()}.jsonl`, `You are Piper Morgan, a product manager. ${MARK_B1}`, 'Understood — Piper here.');
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

async function openForm(page: Page, kind: 'Chat' | 'Klatch') {
  await page.getByRole('button', { name: `+ New ${kind}` }).click();
  await page.getByPlaceholder(`${kind} name`).waitFor({ state: 'visible', timeout: 10_000 });
}

const PATH_INPUT = '~/.claude/projects/.../session-id.jsonl';
const AGENT_INPUT = 'Who is this? e.g. Daedalus';

/**
 * Drive the manual-path import to its success state, optionally through the new confirm
 * field. `agentName === null` means "leave it blank" and is a real case, not a default:
 * it is the exact input that produced Round 171's defect.
 *
 * `.last()` on the submit: the sidebar's own "Import" button is still in the DOM behind
 * the modal and matches the same accessible name.
 */
async function importByPath(page: Page, sessionPath: string, channelName: string, agentName: string | null) {
  await page.getByPlaceholder(PATH_INPUT).fill(sessionPath);
  await page.getByPlaceholder('Auto-generated from project + date').fill(channelName);
  if (agentName !== null) await page.getByPlaceholder(AGENT_INPUT).fill(agentName);
  await page.getByRole('button', { name: /^Import$/ }).last().click();
}

/**
 * `locator.isVisible()` does NOT wait — it answers about this instant. Round 171 recorded
 * two failures that were only ever "the import had not finished yet." Everything that
 * needs to wait goes through here.
 */
async function appears(locator: ReturnType<Page['getByRole']>, timeout = 20_000): Promise<boolean> {
  try { await locator.waitFor({ state: 'visible', timeout }); return true; } catch { return false; }
}

/** Open the in-form import affordance and land on the manual path input. */
async function openInFormImport(page: Page) {
  await openForm(page, 'Chat');
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByPlaceholder(PATH_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
}

/**
 * Finish a compose-mode import and read what the form did. Returns the chips and the
 * notice after the seating effect has had time to land.
 */
async function finishComposeImport(page: Page): Promise<{ chips: string[]; notice: string | null }> {
  const useThisAgent = page.getByRole('button', { name: 'Use this agent' });
  await useThisAgent.waitFor({ state: 'visible', timeout: 30_000 });
  await useThisAgent.click();
  await page.getByPlaceholder('Chat name').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(1400); // entity refetch + seating effect
  return { chips: await seatedAgents(page), notice: await importNotice(page) };
}

/** Create the composed chat and read what it actually bound, at prompt-debug. */
async function createAndInspect(page: Page, chatName: string) {
  await page.getByPlaceholder('Chat name').fill(chatName);
  await page.getByRole('button', { name: 'Create Chat' }).click();
  await page.waitForTimeout(1400);
  const chans = await api('/channels');
  const composed = (chans.json ?? []).find((c: any) => c.name === chatName);
  if (!composed) return null;
  const dbg = await api(`/channels/${composed.id}/prompt-debug`);
  return { channelId: composed.id as string, dbg: dbg.json };
}

try {
  const browserPath = chromium.executablePath();
  measure('S', 'browser', `${path.basename(path.dirname(browserPath))} (${fs.existsSync(browserPath) ? 'present' : 'MISSING'})`);
  measure('S', 'fix under test', execFileSync('git', ['log', '--oneline', '-1'], { cwd: REPO, encoding: 'utf8' }).trim());
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
  const defaultEntityName = (entities0.json ?? []).find((e: any) => e.id === DEFAULT_ENTITY_ID)?.name;
  measure('S', 'the registry a fresh install starts with',
    `${JSON.stringify((entities0.json ?? []).map((e: any) => e.name))} · default entity is named ${JSON.stringify(defaultEntityName)}`);
  measure('S', 'the two notices, read from ChannelSidebar.tsx',
    `unidentified=${JSON.stringify(NOTICE_UNIDENTIFIED)} · none=${JSON.stringify(NOTICE_NO_AGENT)}`);

  // ── Arm B1 — the manual path, now through the confirm step ───────────────────
  //
  // Round 171's finding, re-driven with the field the fix added. This is the route the
  // dialog opens on; Browse is a second click. A user typing a name here should get that
  // agent, and the transcript's own identity should reach the prompt.
  await openInFormImport(page);

  // Iris's copy, checked on screen rather than in the source — she owns these strings and
  // Daedalus shipped them as proposals.
  const agentField = page.getByPlaceholder(AGENT_INPUT);
  check('B1', 'the confirm step exists on the manual path',
    await agentField.isVisible(), `field with placeholder ${JSON.stringify(AGENT_INPUT)} is on screen`);
  check('B1', 'it is labelled Agent and marked optional',
    await page.getByText('Agent', { exact: false }).first().isVisible()
      && (await page.locator('label[for="import-agent-name"]').textContent() ?? '').includes('optional'),
    `label reads ${JSON.stringify((await page.locator('label[for="import-agent-name"]').textContent() ?? '').trim())}`);
  measure('B1', 'the helper line under it',
    JSON.stringify((await page.locator('#import-agent-name ~ p').textContent() ?? '').trim()));
  check('B1', 'the field is empty on open (not pre-filled with a guess)',
    (await agentField.inputValue()) === '',
    `value=${JSON.stringify(await agentField.inputValue())} — Daedalus\'s explicit design call`);
  measure('B1', 'screenshot of the manual path with the confirm step',
    await shot(page, 'B1-manual-path-with-agent-field'));

  await importByPath(page, SESSION_B1, 'r172-b1-named', 'Piper Morgan');
  const b1 = await finishComposeImport(page);
  measure('B1', 'what the form seated after a NAMED manual-path import',
    `chips=${JSON.stringify(b1.chips)} · notice=${JSON.stringify(b1.notice)}`);
  measure('B1', 'screenshot of the form after the named import', await shot(page, 'B1-form-after-seat'));
  check('B1', 'a named manual-path import seats the agent that was named',
    b1.chips.length === 1 && b1.chips[0] === 'Piper Morgan',
    `chips=${JSON.stringify(b1.chips)} (Round 171 got ${JSON.stringify([defaultEntityName])} here)`);
  check('B1', 'it is not the shared default entity',
    !b1.chips.includes(defaultEntityName ?? ' '),
    `default entity is ${JSON.stringify(defaultEntityName)}`);

  const c1 = await createAndInspect(page, 'r172-b1-composed');
  check('B1', 'the composed channel was created', !!c1, `id=${c1?.channelId ?? 'MISSING'}`);
  if (c1) {
    measure('B1', 'the composed chat resolves to',
      `entityId=${c1.dbg?.entityId} entityName=${JSON.stringify(c1.dbg?.entityName)}`);
    check('B1', 'a named Path B chat binds the imported agent, not the default entity',
      c1.dbg?.entityId !== DEFAULT_ENTITY_ID, `entityId=${c1.dbg?.entityId}`);
    // NOT a check. Round 171 ran this as an `open` item and I nearly promoted it to a
    // regression here, which would have been wrong: `buildCarriedContextBlock` returns
    // undefined unless `channel.type === 'klatch'` (carried-context.ts:304), a deliberate
    // and documented scoping. A 1-1 Chat cannot carry the transcript no matter which agent
    // is bound, so marker-absence here is not evidence about the binding — it was
    // over-determined in Round 171 and I read it as one signal. Arm K is the real test.
    measure('B1', "the imported session's identity text in this 1-1's assembled prompt",
      `marker present=${c1.dbg?.assembledPrompt?.includes(MARK_B1)} — expected absent: ` +
      `carried context is klatch-scoped by design, so a Chat never carries it`);
    measure('B1', 'the minted agent\'s own system prompt',
      `${JSON.stringify(c1.dbg?.layers?.['5_entityPrompt'])} ` +
      `— imports mint with an empty prompt on purpose (entity-resolve.ts): identity is the transcript`);
  }

  // ── Arm B2 — the manual path left BLANK ──────────────────────────────────────
  //
  // The exact input that produced Round 171's defect. The fix's claim is not that this
  // now seats the right agent — nothing identified the session, so there is no right
  // agent — but that the form stops asserting a wrong one and says what happened.
  const SESSION_B2 = writeSession(
    `${uuid()}.jsonl`, 'Refactor the parser. No agent is named anywhere in this session.',
    'Looking at the parser now.');
  await page.reload({ waitUntil: 'networkidle' });
  await openInFormImport(page);
  await importByPath(page, SESSION_B2, 'r172-b2-blank', null);
  const b2 = await finishComposeImport(page);
  measure('B2', 'what the form seated after a BLANK manual-path import',
    `chips=${JSON.stringify(b2.chips)} · notice=${JSON.stringify(b2.notice)}`);
  measure('B2', 'screenshot of the blank-name outcome', await shot(page, 'B2-blank-unidentified'));
  check('B2', 'a blank confirm step seats no agent at all',
    b2.chips.length === 0, `chips=${JSON.stringify(b2.chips)}`);
  check('B2', 'it does NOT seat the shared default entity (the Round 171 defect)',
    !b2.chips.includes(defaultEntityName ?? ' '),
    `chips=${JSON.stringify(b2.chips)} vs default ${JSON.stringify(defaultEntityName)}`);
  check('B2', 'the form says out loud that nothing was identified',
    b2.notice === NOTICE_UNIDENTIFIED,
    `notice=${JSON.stringify(b2.notice)} · expected=${JSON.stringify(NOTICE_UNIDENTIFIED)}`);
  check('B2', 'it uses the unidentified string, not the older "no agent came back" one',
    b2.notice !== NOTICE_NO_AGENT,
    'the older string would be false here — an agent IS bound, the placeholder');

  const c2 = await createAndInspect(page, 'r172-b2-composed');
  if (c2) {
    // This is the part that stays true and is now *correct*: the channel still binds the
    // placeholder, and the session's text still isn't an identity. The change is that the
    // user was told, instead of shown a chip that claimed otherwise.
    measure('B2', 'what a blank-name chat still binds underneath',
      `entityId=${c2.dbg?.entityId} entityName=${JSON.stringify(c2.dbg?.entityName)} ` +
      `(placeholder=${c2.dbg?.entityId === DEFAULT_ENTITY_ID})`);
    check('B2', 'the blank-name chat was still created (the transcript is not lost)',
      !!c2.channelId, `id=${c2.channelId}`);
  }

  // ── Arm B3 — the manual path with the literal name of the default entity ─────
  //
  // The branch a careless fix breaks. `resolveJitSeat` refuses DEFAULT_ENTITY_ID arriving
  // via the channel fallback. A user who *types* "Claude" is making a choice: resolve
  // returns matched-by-name with that id ON the import result, which is an answer. If this
  // arm comes back empty, the guard was placed one branch too high.
  const SESSION_B3 = writeSession(
    `${uuid()}.jsonl`, 'A session I want to attribute to the default agent by name.', 'Ready.');
  await page.reload({ waitUntil: 'networkidle' });
  await openInFormImport(page);
  await importByPath(page, SESSION_B3, 'r172-b3-typed-default', defaultEntityName ?? 'Claude');
  const b3 = await finishComposeImport(page);
  measure('B3', `what the form seated when ${JSON.stringify(defaultEntityName)} was typed deliberately`,
    `chips=${JSON.stringify(b3.chips)} · notice=${JSON.stringify(b3.notice)}`);
  measure('B3', 'screenshot of the typed-default outcome', await shot(page, 'B3-typed-default-seats'));
  check('B3', 'typing the default agent\'s name still seats it — a choice is not a placeholder',
    b3.chips.length === 1 && b3.chips[0] === defaultEntityName,
    `chips=${JSON.stringify(b3.chips)} · expected [${JSON.stringify(defaultEntityName)}]`);
  check('B3', 'and no "unidentified" notice fires on a deliberate choice',
    b3.notice !== NOTICE_UNIDENTIFIED, `notice=${JSON.stringify(b3.notice)}`);

  // ── Arm F1 — duplicate of a NAMED import ─────────────────────────────────────
  //
  // The other branch a careless fix breaks. The duplicate path's ImportConflict carries no
  // entity, so App asks the channel — and the channel's answer is a real agent here. The
  // guard must let this through. Import first from the sidebar (outside compose mode), so
  // arm E's regression — that the standalone path still navigates — rides along.
  const SESSION_F1 = writeSession(
    `${uuid()}.jsonl`, 'You are Wren, the research agent.', 'Wren, ready to dig in.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Import$/ }).first().click();
  await page.getByPlaceholder(PATH_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_F1, 'r172-f1-sidebar-named', 'Wren');
  const goToChannel = page.getByRole('button', { name: 'Go to channel' });
  const reachedSuccess = await appears(goToChannel, 30_000);
  check('F1', 'outside compose mode the button still reads "Go to channel"',
    reachedSuccess, reachedSuccess ? 'standalone import copy unchanged by the fix'
      : `success state not reached — dialog shows: ${JSON.stringify(await page.locator('.font-medium').allTextContents())}`);
  if (reachedSuccess) {
    await goToChannel.click();
    await page.waitForTimeout(1500);
    const navigated = await page.getByText('Wren, ready to dig in.').isVisible().catch(() => false);
    check('F1', 'the sidebar import path still navigates to the imported channel',
      navigated, navigated ? "the imported transcript's assistant turn is on screen"
        : 'the imported transcript did not appear — navigation may have been suppressed');
  }

  await openInFormImport(page);
  await importByPath(page, SESSION_F1, 'r172-f1-duplicate', null);
  const viewExisting1 = page.getByRole('button', { name: 'View existing' });
  const gotConflict1 = await appears(viewExisting1, 30_000);
  check('F1', 're-importing a named session raises the duplicate state', gotConflict1,
    gotConflict1 ? '"Already imported" reached from inside the form' : 'no conflict state appeared');
  if (gotConflict1) {
    await viewExisting1.click();
    await page.waitForTimeout(1600);
    const stillInForm1 = await page.getByPlaceholder('Chat name').isVisible().catch(() => false);
    const chipsF1 = await seatedAgents(page);
    const noticeF1 = await importNotice(page);
    measure('F1', 'after "View existing" on a NAMED import',
      `still in the form=${stillInForm1} · chips=${JSON.stringify(chipsF1)} · notice=${JSON.stringify(noticeF1)}`);
    measure('F1', 'screenshot of the named duplicate recovery', await shot(page, 'F1-duplicate-named'));
    check('F1', '"View existing" from inside the form keeps the user in the form',
      stillInForm1, `form visible=${stillInForm1}`);
    check('F1', 'the guard did not break legitimate recovery — the real agent still seats',
      chipsF1.length === 1 && chipsF1[0] === 'Wren',
      `chips=${JSON.stringify(chipsF1)} · expected ["Wren"] via the channel fallback`);
  }

  // ── Arm F2 — duplicate of an UNNAMED import ──────────────────────────────────
  //
  // Round 171's arm F, re-driven. Same mechanism as F1, but the channel's answer is the
  // placeholder. This is where the guard has to fire.
  const SESSION_F2 = writeSession(
    `${uuid()}.jsonl`, 'Fix the flaky parser test. Nothing here names an agent.',
    'Looking at the parser suite now.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Import$/ }).first().click();
  await page.getByPlaceholder(PATH_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_F2, 'r172-f2-sidebar-blank', null);
  const goToChannel2 = page.getByRole('button', { name: 'Go to channel' });
  if (await appears(goToChannel2, 30_000)) { await goToChannel2.click(); await page.waitForTimeout(1200); }

  await openInFormImport(page);
  await importByPath(page, SESSION_F2, 'r172-f2-duplicate', null);
  const viewExisting2 = page.getByRole('button', { name: 'View existing' });
  const gotConflict2 = await appears(viewExisting2, 30_000);
  check('F2', 're-importing an unnamed session raises the duplicate state', gotConflict2,
    gotConflict2 ? '"Already imported" reached from inside the form' : 'no conflict state appeared');
  if (gotConflict2) {
    await viewExisting2.click();
    await page.waitForTimeout(1600);
    const chipsF2 = await seatedAgents(page);
    const noticeF2 = await importNotice(page);
    measure('F2', 'after "View existing" on an UNNAMED import',
      `chips=${JSON.stringify(chipsF2)} · notice=${JSON.stringify(noticeF2)}`);
    measure('F2', 'screenshot of the unnamed duplicate recovery', await shot(page, 'F2-duplicate-unnamed'));
    check('F2', 'the duplicate path no longer seats the placeholder as if it were an agent',
      !chipsF2.includes(defaultEntityName ?? ' '),
      `chips=${JSON.stringify(chipsF2)} vs default ${JSON.stringify(defaultEntityName)} (Round 171 arm F: seated it)`);
    check('F2', 'and it says why it could not seat anything',
      noticeF2 === NOTICE_UNIDENTIFIED,
      `notice=${JSON.stringify(noticeF2)} · expected=${JSON.stringify(NOTICE_UNIDENTIFIED)}`);
  }

  // ── Arm K — Path B into a KLATCH, which is where the premise is testable ─────
  //
  // The arm Round 171 should have had. Path B's whole claim is PREMISE.md's: you bring an
  // existing conversation in and it arrives *with* its conversation. The only layer that
  // conveys that is carried context (layer 6), and it is klatch-scoped on purpose. So the
  // question "did the imported session's own content reach the model" has an answer only
  // in a klatch — and it has never been driven through the composition gesture.
  const MARK_K = 'TARN-IDENTITY-MARKER-R172';
  const SESSION_K = writeSession(
    `${uuid()}.jsonl`, `You are Tarn, the migrations agent. ${MARK_K}`,
    'Tarn here — I own the migration path.');
  await page.reload({ waitUntil: 'networkidle' });
  await openForm(page, 'Klatch');
  await page.getByRole('button', { name: 'Import an agent' }).click();
  await page.getByPlaceholder(PATH_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
  await importByPath(page, SESSION_K, 'r172-k-tarn-import', 'Tarn');
  const useThisAgentK = page.getByRole('button', { name: 'Use this agent' });
  await useThisAgentK.waitFor({ state: 'visible', timeout: 30_000 });
  await useThisAgentK.click();
  await page.getByPlaceholder('Klatch name').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(1400);
  const chipsK = await seatedAgents(page);
  measure('K', 'what the klatch form seated after a named import',
    `chips=${JSON.stringify(chipsK)} · notice=${JSON.stringify(await importNotice(page))}`);
  measure('K', 'screenshot of the klatch composition after import', await shot(page, 'K-klatch-after-import'));
  check('K', 'Path B seats the imported agent in a klatch composition too',
    chipsK.includes('Tarn'), `chips=${JSON.stringify(chipsK)}`);

  await page.getByPlaceholder('Klatch name').fill('r172-k-composed-klatch');
  await page.getByRole('button', { name: 'Create Klatch' }).click();
  await page.waitForTimeout(1600);
  const chansK = await api('/channels');
  const klatch = (chansK.json ?? []).find((c: any) => c.name === 'r172-k-composed-klatch');
  check('K', 'the composed klatch was created', !!klatch,
    `id=${klatch?.id ?? 'MISSING'} type=${klatch?.type}`);
  if (klatch) {
    const dbgK = await api(`/channels/${klatch.id}/prompt-debug`);
    measure('K', 'the composed klatch resolves to',
      `type=${dbgK.json?.channelType} entityName=${JSON.stringify(dbgK.json?.entityName)}`);
    measure('K', 'layer 6 as prompt-debug reports it',
      JSON.stringify(dbgK.json?.layers?.['6_carriedContext'] ?? '(no 6_carriedContext key)'));
    const carriedMarker = typeof dbgK.json?.assembledPrompt === 'string'
      && dbgK.json.assembledPrompt.includes(MARK_K);
    check('K', "the imported session's own text reaches the klatch's assembled prompt",
      carriedMarker,
      `marker present=${carriedMarker} — this is the PREMISE claim, driven end to end ` +
      `through the composition gesture for the first time`);
  }

  // ── Guards ───────────────────────────────────────────────────────────────────
  measure('S', 'browser console errors during the whole drive',
    consoleErrors.length === 0 ? 'none' : `${consoleErrors.length}: ${JSON.stringify(consoleErrors.slice(0, 5))}`);
  const diffAfter = packagesDiff();
  check('S', 'packages/ untouched by this probe', diffAfter === diffBefore,
    diffAfter === diffBefore ? 'git diff --stat -- packages/ unchanged' : `CHANGED:\n${diffAfter}`);
  check('S', "xian's klatch.db was never the target",
    process.env.KLATCH_DB === undefined || process.env.KLATCH_DB === DB, `server ran against ${DB}`);
  check('S', 'the real ~/.claude session tree was never scanned',
    scan.json?.totalSessions === FIXTURE_COUNT_AT_START, `CLAUDE_CONFIG_DIR=${CLAUDE_HOME}`);

  // ── Report ───────────────────────────────────────────────────────────────────
  const reg = results.filter((r) => r.kind === 'regression');
  const open = results.filter((r) => r.kind === 'open');
  const meas = results.filter((r) => r.kind === 'measurement');
  const regFailed = reg.filter((r) => !r.pass);

  console.log('\n──────── summary ────────');
  console.log(`regression: ${reg.length - regFailed.length}/${reg.length} passed`);
  console.log(`open:       ${open.filter((r) => r.pass).length}/${open.length} passing`);
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
