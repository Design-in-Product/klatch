/**
 * Round 149 — multi-root session browse, measured at the HTTP endpoint.
 *
 * WHAT THIS IS FOR
 *
 * Claude Code keeps one config directory per Anthropic account. xian runs
 * Klatch/DinP under one and Piper Morgan under another, so PM's eleven
 * department heads live in `~/.claude-pm/projects` while `session-scanner.ts`
 * only ever looked at `~/.claude/projects` (Janus, 2026-09-04). Round 149 makes
 * the scanner walk a list of roots: `CLAUDE_CONFIG_DIR` relocates the base one
 * (Claude Code's own semantics — replace, not add), `KLATCH_EXTRA_SESSION_ROOTS`
 * adds more.
 *
 * Everything here is measured through `GET /api/import/claude-code/sessions` on
 * a real server process, per Theseus's Round 146 rule: a tight loop around the
 * function underestimates its in-situ cost, so the endpoint is the only honest
 * place to size this.
 *
 * NOTHING IS PATCHED. Theseus's Round 148 probe had to rewrite the body of
 * `getClaudeProjectsDir()` on disk to reach the second corpus and restore it
 * after. That was the correct move against the code as it stood; against Round
 * 149 it is unnecessary — every arm below is one environment variable. The
 * source file is sha256'd at start and end anyway, because an instrument that
 * asserts it changed nothing is cheap and this one is claiming to be
 * non-invasive.
 *
 * ARMS
 *
 *   A  inventory both roots, and read every byte of both BEFORE any timing.
 *      Arm order was the entire finding once already (Round 147: a 28% cold
 *      "regression" that was one arm paying to pull 531 MB off disk while the
 *      next read it from RAM). Equalising costs a few seconds and makes every
 *      cold figure below a PARSE cost, not a disk cost. Labelled, not hidden.
 *   B  single root, no env set — the shipped behaviour. Also asserts the
 *      payload contains no `sourceRoot` key at all, i.e. this change is
 *      invisible to anyone who does not opt in.
 *   C  CLAUDE_CONFIG_DIR=~/.claude-pm — REPLACE semantics: PM's projects
 *      present, the shipped root's projects absent.
 *   D  KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm — the union. Session count
 *      should be B + C, every session stamped with its root, and PM's eleven
 *      department heads reachable by name.
 *   E  the dedupe control, and the one that would fail loudest if the merge
 *      were wrong: name the DEFAULT root again as an extra. Must reproduce arm
 *      B exactly. Without root dedupe this doubles every session in Browse.
 *
 * WHAT THIS DOES NOT MEASURE
 *
 *   - Cold-page-cache cost. Arm A deliberately destroys that condition.
 *   - Import of a 40k-line PM session. Browse is fingerprint-only; import is a
 *     different path and is not exercised here.
 *   - Anything about `~/.claude-pm` other than through the same public
 *     endpoint the UI calls.
 *
 * Run: npx tsx scripts/probe-multi-root-browse.mts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import crypto from 'crypto';
import { spawn, type ChildProcess } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'multi-root-browse');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');

const HOME = os.homedir();
const CONFIG_SHIPPED = path.join(HOME, '.claude');
const CONFIG_SECOND = path.join(HOME, '.claude-pm');
const ROOT_SHIPPED = path.join(CONFIG_SHIPPED, 'projects');
const ROOT_SECOND = path.join(CONFIG_SECOND, 'projects');

/** Janus's list, verified against the filesystem in arm A rather than trusted. */
const PM_ROLES = ['arch', 'cio', 'comms', 'cxo', 'docs', 'exec', 'host', 'lead', 'pa', 'ppm', 'web'];

const WARM_SAMPLES = 5;

/**
 * THE CORPUS MOVES WHILE THIS RUNS, AND THE FIRST VERSION OF THIS PROBE DID NOT
 * ALLOW FOR IT.
 *
 * `~/.claude/projects` is not a fixture. It is the live session store of the
 * machine this probe runs on — including the agent session running the probe,
 * which is appending to a file in it, and any other agent whose duty cycle fires
 * mid-run. Between arm B and arm E of one run, the shipped root went 518 -> 517
 * sessions; a session file crossing the scanner's own 100-byte floor, or a
 * temp-directory project being cleaned up, is enough.
 *
 * So exact cross-arm equality (`D.sessions === B.sessions + C.sessions`) is not
 * a property of correct code — it is a property of a corpus that holds still,
 * which this one does not. The first run of this probe passed those assertions
 * by luck and the second failed them with the code unchanged.
 *
 * The repair is to assert only relationships that survive drift, and to MEASURE
 * the drift rather than hope it is zero: set differences are bounded by this
 * tolerance and the offending session ids are always printed, and arm F
 * re-measures the shipped root at the end so the run reports how far it moved.
 * A real merge defect (a whole root missing, every session doubled) is orders of
 * magnitude outside this bound; single-file churn is inside it.
 *
 * `~/.claude-pm` is not live in the same way — PM's agents are not running here
 * — which is why the asymmetry below is expected.
 */
const DRIFT_TOLERANCE = 8;

const diff = (a: string[], b: string[]) => { const s = new Set(b); return a.filter((x) => !s.has(x)); };
const symdiff = (a: string[], b: string[]) => [...diff(a, b), ...diff(b, a)];

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  console.log(`${pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL'} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const ms = (n: number) => `${n.toFixed(0)} ms`;
const mb = (n: number) => `${(n / 1048576).toFixed(0)} MB`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

const SCANNER_SHA = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');

// ── server lifecycle ─────────────────────────────────────────────────────────

let server: ChildProcess | null = null;

function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

async function stopServer(): Promise<void> {
  if (!server) return;
  server.kill('SIGTERM');
  server = null;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

/**
 * SIGTERM is asynchronous, so a previous generation can still be answering on
 * 3001 while the next readiness probe runs — which would silently measure the
 * wrong ENVIRONMENT here rather than the wrong build. Every start waits for a
 * genuinely free port and for THIS child to print its own banner.
 */
async function startServer(tag: string, extraEnv: Record<string, string>): Promise<void> {
  await stopServer();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  // Both variables are cleared first: the fire's own environment may carry a
  // CLAUDE_CONFIG_DIR (agents run under one), and inheriting it would make every
  // arm measure something other than what its name says.
  const env: Record<string, string | undefined> = { ...process.env, KLATCH_DB: DB };
  delete env.CLAUDE_CONFIG_DIR;
  delete env.KLATCH_EXTRA_SESSION_ROOTS;
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...env, ...extraEnv } as NodeJS.ProcessEnv,
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

interface Browse {
  cold: number;
  warm: number;
  bytes: number;
  sessions: number;
  projects: number;
  projectNames: string[];
  projectPaths: string[];
  roots: string[];
  hasSourceRootKey: boolean;
  capped: string[];
  maxTurnCount: number;
  sessionIds: string[];
}

async function browse(): Promise<string> {
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
  return res.text();
}

async function measure(): Promise<Browse> {
  const t0 = performance.now();
  const first = await browse();
  const cold = performance.now() - t0;

  const samples: number[] = [];
  let text = first;
  for (let i = 0; i < WARM_SAMPLES; i++) {
    const t = performance.now();
    text = await browse();
    samples.push(performance.now() - t);
  }

  const body = JSON.parse(text);
  const ps = (body.projects ?? []) as any[];
  const all = ps.flatMap((p) => p.sessions ?? []);
  return {
    cold,
    warm: median(samples),
    bytes: Buffer.byteLength(text),
    sessions: all.length,
    projects: ps.length,
    projectNames: ps.map((p) => p.projectName),
    projectPaths: ps.map((p) => p.projectPath),
    roots: [...new Set(all.map((s: any) => s.sourceRoot).filter(Boolean))].sort() as string[],
    // Byte-level, not `=== undefined`: the claim is that the JSON is unchanged,
    // and an absent key and a null-valued key are the same to `undefined`.
    hasSourceRootKey: text.includes('"sourceRoot"'),
    capped: all.filter((s: any) => s.fingerprintCapped).map((s: any) => s.sessionId).sort(),
    maxTurnCount: all.reduce((m: number, s: any) => Math.max(m, s.turnCount ?? 0), 0),
    sessionIds: all.map((s: any) => s.sessionId).sort(),
  };
}

// ── arm A — inventory, and page-cache equalisation ───────────────────────────

console.log('── arm A: inventory both roots ──────────────────────────────────');

/** Mirrors the scanner's own filters: *.jsonl directly under a project dir, >= 100 bytes. */
function corpusFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    let names: string[];
    try { names = fs.readdirSync(dir); } catch { continue; }
    for (const n of names) {
      if (!n.endsWith('.jsonl')) continue;
      const p = path.join(dir, n);
      try { if (fs.statSync(p).size >= 100) out.push(p); } catch { /* skip */ }
    }
  }
  return out;
}

const filesShipped = corpusFiles(ROOT_SHIPPED);
const filesSecond = corpusFiles(ROOT_SECOND);
const bytesOf = (fs_: string[]) => fs_.reduce((n, p) => n + fs.statSync(p).size, 0);

check('A', 'shipped root present', filesShipped.length > 0, `${ROOT_SHIPPED}: ${filesShipped.length} files, ${mb(bytesOf(filesShipped))}`);
check('A', 'second root present', filesSecond.length > 0, `${ROOT_SECOND}: ${filesSecond.length} files, ${mb(bytesOf(filesSecond))}`);

const encShipped = new Set(fs.existsSync(ROOT_SHIPPED) ? fs.readdirSync(ROOT_SHIPPED) : []);
const encSecond = fs.existsSync(ROOT_SECOND) ? fs.readdirSync(ROOT_SECOND) : [];
const collisions = encSecond.filter((n) => encShipped.has(n));
check('A', 'encoded project-dir collisions between roots', true,
  `${collisions.length}${collisions.length ? ` — ${collisions.join(', ')}` : ' — the merge path is latent today, not exercised by the real corpus'}`,
  'measurement');

// Read every byte of BOTH corpora before ANY timing. See the header.
let equalised = 0;
for (const p of [...filesShipped, ...filesSecond]) {
  try { equalised += fs.readFileSync(p).length; } catch { /* skip */ }
}
check('A', 'page cache equalised before any timing', true, `${mb(equalised)} read untimed across both roots`, 'measurement');

// ── arm B — single root, shipped behaviour ───────────────────────────────────

console.log('\n── arm B: single root (no env set) ──────────────────────────────');
await startServer('B-single', {});
const B = await measure();
check('B', 'browse returns the shipped corpus', B.sessions > 0,
  `${B.projects} projects / ${B.sessions} sessions, ${ms(B.cold)} cold, ${ms(B.warm)} warm`);
check('B', 'payload carries NO sourceRoot key — single-root output is unchanged',
  !B.hasSourceRootKey,
  B.hasSourceRootKey ? 'sourceRoot present with one root — the omission rule is broken' : 'absent, byte-level');
check('B', 'nothing capped', B.capped.length === 0, `${B.capped.length} capped, max turnCount ${B.maxTurnCount}`);
// Baseline for the same measurement on the second root in arm C. This is a
// pre-existing defect in `decodeProjectPath`, not something Round 149 caused —
// recorded here so the two roots can be compared on equal terms.
const bMangled = B.projectPaths.filter((p) => !fs.existsSync(p));
check('B', 'decoded project paths that do not exist on disk (shipped root)', true,
  `${bMangled.length}/${B.projectPaths.length}${bMangled.length ? ` — e.g. ${bMangled[0]}` : ''}`, 'measurement');

// ── arm C — CLAUDE_CONFIG_DIR relocates rather than adds ─────────────────────

console.log('\n── arm C: CLAUDE_CONFIG_DIR=~/.claude-pm (replace) ──────────────');
if (!fs.existsSync(ROOT_SECOND)) {
  skip('C', `${ROOT_SECOND} does not exist on this machine`);
}
let C: Browse | null = null;
if (fs.existsSync(ROOT_SECOND)) {
  await startServer('C-relocated', { CLAUDE_CONFIG_DIR: CONFIG_SECOND });
  C = await measure();
  const bNames = new Set(B.projectNames);
  const overlap = C.projectNames.filter((n) => bNames.has(n));
  check('C', 'the second corpus is reachable at the endpoint', C.sessions > 0,
    `${C.projects} projects / ${C.sessions} sessions, ${ms(C.cold)} cold, ${ms(C.warm)} warm`);
  check('C', 'REPLACE, not add — arm B\'s session set is gone',
    C.sessionIds.every((id) => !B.sessionIds.includes(id)),
    `${overlap.length} project names shared with arm B (name overlap is allowed; session overlap is not)`);
  check('C', 'still no sourceRoot — one root is one root wherever it points',
    !C.hasSourceRootKey, C.hasSourceRootKey ? 'present' : 'absent, byte-level');
  const found = PM_ROLES.filter((r) => C!.projectNames.includes(r));
  check('C', "Janus's eleven department heads are visible", found.length === PM_ROLES.length,
    `${found.length}/${PM_ROLES.length} present${found.length === PM_ROLES.length ? '' : ` — missing ${PM_ROLES.filter((r) => !found.includes(r)).join(', ')}`}`);
  check('C', 'nothing capped on the second corpus', C.capped.length === 0,
    `${C.capped.length} capped, max turnCount ${C.maxTurnCount}`);
  // decodeProjectPath maps every '-' to '/', so a real directory containing
  // hyphens cannot round-trip. PM's worktrees live under
  // `piper-morgan-worktrees`, so this is not hypothetical. Reported, not fixed.
  const mangled = C.projectPaths.filter((p) => !fs.existsSync(p));
  check('C', 'decoded project paths that do not exist on disk (second root)', true,
    `${mangled.length}/${C.projectPaths.length}${mangled.length ? ` — e.g. ${mangled[0]}` : ''}`, 'measurement');
  // The specific instance that matters: PM's worktree directory is literally
  // named `piper-morgan-worktrees`, and the encoding maps '/' to '-' with no
  // escape, so it cannot round-trip. projectName (the basename) survives and is
  // what Browse renders; projectPath does not.
  const pmPaths = C.projectPaths.filter((p) => PM_ROLES.includes(path.basename(p)));
  check('C', "the eleven department heads' decoded paths", true,
    `${pmPaths.filter((p) => !fs.existsSync(p)).length}/${pmPaths.length} wrong` +
    (pmPaths.length ? ` — e.g. ${pmPaths[0]}` : ''), 'measurement');
}

// ── arm D — the union ────────────────────────────────────────────────────────

console.log('\n── arm D: KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm (union) ───────');
let D: Browse | null = null;
if (fs.existsSync(ROOT_SECOND)) {
  await startServer('D-union', { KLATCH_EXTRA_SESSION_ROOTS: CONFIG_SECOND });
  D = await measure();
  const union = [...B.sessionIds, ...C!.sessionIds].sort();
  const drift = symdiff(D.sessionIds, union);
  check('D', 'the union is both corpora, up to live-corpus drift',
    drift.length <= DRIFT_TOLERANCE,
    `${D.sessions} sessions vs ${B.sessions} (shipped) + ${C!.sessions} (second) = ${union.length}; ` +
    `set difference ${drift.length} (tolerance ${DRIFT_TOLERANCE})${drift.length ? `: ${drift.slice(0, 8).join(', ')}` : ''}; ` +
    `${D.projects} projects, ${ms(D.cold)} cold, ${ms(D.warm)} warm, ${(D.bytes / 1024).toFixed(0)} KB`);
  check('D', 'the second corpus is fully present in the union — the whole point',
    diff(C!.sessionIds, D.sessionIds).length === 0,
    `${C!.sessions - diff(C!.sessionIds, D.sessionIds).length}/${C!.sessions} of the second root's sessions survived the merge`);
  check('D', 'every session is stamped with the root it came from',
    D.roots.length === 2 && D.roots.includes(ROOT_SHIPPED) && D.roots.includes(ROOT_SECOND),
    `roots seen: ${D.roots.join(', ') || 'none'}`);
  check('D', 'no session is duplicated in the merge',
    D.sessionIds.length === new Set(D.sessionIds).size,
    `${new Set(D.sessionIds).size} distinct of ${D.sessionIds.length}`);
  check('D', 'nothing capped across the union', D.capped.length === 0,
    `${D.capped.length} capped, max turnCount ${D.maxTurnCount}`);
  check('D', 'union cold browse against the two single-root arms', true,
    `${ms(D.cold)} vs ${ms(B.cold)} + ${ms(C!.cold)} = ${ms(B.cold + C!.cold)} summed`, 'measurement');
} else {
  skip('D', 'no second root to union with');
}

// ── arm E — root dedupe on the real corpus ───────────────────────────────────

console.log('\n── arm E: name the DEFAULT root again as an extra ───────────────');
await startServer('E-dupe', { KLATCH_EXTRA_SESSION_ROOTS: CONFIG_SHIPPED });
const E = await measure();
const eDrift = symdiff(E.sessionIds, B.sessionIds);
check('E', 'naming the default root twice changes nothing, up to drift',
  eDrift.length <= DRIFT_TOLERANCE,
  `${E.projects} projects / ${E.sessions} sessions vs arm B's ${B.projects}/${B.sessions}; ` +
  `set difference ${eDrift.length} (tolerance ${DRIFT_TOLERANCE})`);
check('E', 'no session is listed twice', E.sessionIds.length === new Set(E.sessionIds).size,
  `${new Set(E.sessionIds).size} distinct of ${E.sessionIds.length}`);
/**
 * This is arm E's real discriminator, and it is worth saying why the session
 * count is NOT.
 *
 * If root dedupe were removed, the scanner would walk the shipped root twice —
 * but the per-project `sessionId` dedupe inside the merge would then swallow the
 * second pass entirely, so the session COUNT would be identical and arm E would
 * pass while the defect was live. The count assertion above is a sanity floor,
 * not a test of dedupe.
 *
 * `sourceRoot` is the one observable that separates them: it is stamped when
 * `getSessionRoots()` returns more than one root, which is exactly the condition
 * root dedupe exists to prevent here. (Confirmed by mutation in the unit suite:
 * removing the realpath resolve fails `round149-multi-root-session-scan.test.ts`
 * and nothing else.)
 */
check('E', 'de-duplicated to ONE root — the discriminator, see comment',
  !E.hasSourceRootKey, E.hasSourceRootKey ? 'present — the roots were not deduped' : 'absent, byte-level');

// ── arm F — how far did the corpus move during the run? ──────────────────────

console.log('\n── arm F: re-measure the shipped root last, to quantify drift ───');
await startServer('F-drift', {});
const F = await measure();
const runDrift = symdiff(F.sessionIds, B.sessionIds);
check('F', 'shipped-root drift across the run', true,
  `${B.sessions} at arm B -> ${F.sessions} at arm F, set difference ${runDrift.length}` +
  (runDrift.length ? ` (${runDrift.slice(0, 8).join(', ')})` : '') +
  ` — this is the size of the effect the tolerance above absorbs`, 'measurement');
check('F', 'cold browse reproduces on a second generation of the same root', true,
  `${ms(B.cold)} (arm B) vs ${ms(F.cold)} (arm F), warm ${ms(B.warm)} vs ${ms(F.warm)}`, 'measurement');

await stopServer();

// ── source-integrity guard ───────────────────────────────────────────────────

const shaAfter = crypto.createHash('sha256').update(fs.readFileSync(SCANNER)).digest('hex');
check('*', 'session-scanner.ts unmodified by this probe', shaAfter === SCANNER_SHA,
  shaAfter === SCANNER_SHA ? `sha256 ${SCANNER_SHA.slice(0, 12)} unchanged` : 'SOURCE CHANGED — do not trust these numbers');

// ── summary ──────────────────────────────────────────────────────────────────

const regressions = results.filter((r) => r.kind === 'regression');
const failed = regressions.filter((r) => !r.pass);
console.log(`\n${'─'.repeat(64)}`);
console.log(`${results.length} checks (${regressions.length} pass/fail, ${results.length - regressions.length} measurements), ${failed.length} failed, ${skipped.length} skipped`);
for (const f of failed) console.log(`  FAIL [${f.arm}] ${f.check} — ${f.detail}`);
for (const s of skipped) console.log(`  SKIP ${s}`);
process.exit(failed.length ? 1 : 0);
