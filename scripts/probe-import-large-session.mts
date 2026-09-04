/**
 * Round 150 — can Klatch actually IMPORT a Piper Morgan department head?
 *
 * Context. Browse now walks two config roots (`4602561`, Daedalus, Round 149):
 * with `KLATCH_EXTRA_SESSION_ROOTS=~/.claude-pm` set, Browse returns 593
 * sessions across 92 projects including all eleven of Janus's department heads,
 * at 9 ms warm. Round 148 (mine) priced the scan against that corpus: cost
 * tracks bytes rather than line length, nothing is capped, `turnCount` exact.
 *
 * Every one of those numbers is about BROWSE. Janus asked for "one deliberate
 * look before xian drives it" and Daedalus wrote it down twice — in his memo to
 * me and in his note to xian — as still open:
 *
 *   "the import path is untested at that size and I did not test it this fire —
 *    the largest session import has been run against is 604 messages, and the
 *    smallest PM file is an order of magnitude past that."
 *
 * Browse reads a fingerprint (first user message, turn count, mtime). Import
 * parses every event, materialises every turn, and writes messages and
 * artifacts into SQLite. They are different code paths with different costs and
 * only one of them has been measured. This probe measures the other one, at the
 * HTTP endpoint, against the real files.
 *
 * Run:  npx tsx scripts/probe-import-large-session.mts
 *
 * Zero model calls. One scratch DB under `.testdata/`; xian's `klatch.db` is
 * opened by nothing here and its mtime is asserted unchanged at the end. Both
 * config roots are read-only throughout.
 *
 * Arms:
 *   A  inventory of the second corpus against the import size cap, read out of
 *      `routes/import.ts` rather than hardcoded here, plus the same question
 *      asked of the shipped root — is the cap a PM problem or a general one?
 *   B  are the over-cap sessions OFFERED? browse at the endpoint with
 *      `KLATCH_EXTRA_SESSION_ROOTS` set, checking the over-cap session ids are
 *      in the list a user picks from
 *   C  the endpoint's actual answer for an over-cap file — POST it and read the
 *      status and body, rather than inferring them from the `stat.size` branch
 *   D  the largest UNDER-cap head, imported for real: wall time, status,
 *      message count, artifact count, peak server RSS
 *   E  a second, smaller head — two points make a rate, one makes an anecdote
 *   F  read-back: `GET /channels/:id/messages`, with and without artifacts.
 *      Importing is not the last step; the next thing xian does is open it.
 *   G  controls — no source touched, real DB untouched, scratch DB carried no
 *      pre-existing imports into the timings
 *
 * ─── On source mutation ─────────────────────────────────────────────────────
 * There is none, and that is a deliberate difference from Round 148. Import is
 * path-based (`POST /import/claude-code {sessionPath}`) and `validateImportPath`
 * accepts any absolute non-traversing path, so the second corpus is reachable
 * without patching `getClaudeProjectsDir()`. Arm B needs multi-root browse and
 * gets it from the env var Daedalus shipped. Arm G asserts `git diff --stat --
 * packages/` is empty at the end anyway — the claim "nothing was patched" is
 * checked, not asserted.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import readline from 'readline';
import { spawn, execFileSync } from 'child_process';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'import-large-session');
const DB = path.join(SCRATCH, 'probe.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;

const HOME = os.homedir();
const ROOT_SHIPPED = path.join(HOME, '.claude', 'projects');
const ROOT_SECOND_CONFIG = path.join(HOME, '.claude-pm');
const ROOT_SECOND = path.join(ROOT_SECOND_CONFIG, 'projects');

const REAL_DB = path.join(REPO, 'klatch.db');

type Kind = 'regression' | 'measurement';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'measurement' ? 'NOTE' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

const ms = (n: number) => `${n.toFixed(0)} ms`;
const mbn = (n: number) => n / 1048576;
const mb = (n: number) => `${mbn(n).toFixed(1)} MB`;

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

// ── Real-DB guard, captured before anything starts ───────────────────────────

const realDbBefore = fs.existsSync(REAL_DB) ? fs.statSync(REAL_DB) : undefined;

// ── Server lifecycle (Round 146/148 discipline) ──────────────────────────────

let server: ReturnType<typeof spawn> | undefined;
function killServer() {
  if (!server) return;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
  server = undefined;
}
process.on('exit', killServer);
process.on('SIGINT', () => { killServer(); process.exit(130); });

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

/**
 * SIGTERM is asynchronous: the previous generation can still be holding 3001 and
 * still answering when the next readiness probe runs, which would silently
 * measure the wrong build / wrong env. Wait for a genuinely free port AND for
 * THIS child to print its own banner.
 */
async function waitForPortFree(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await portIsFree(PORT)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`port ${PORT} still occupied 30 s after SIGTERM`);
}

async function startServer(tag: string, extraEnv: Record<string, string> = {}): Promise<void> {
  await waitForPortFree();
  const logPath = path.join(SCRATCH, `server-${tag}.log`);
  const logFd = fs.openSync(logPath, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB, ...extraEnv },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}) — see ${logPath}`);
    }
    let booted = false;
    try { booted = fs.readFileSync(logPath, 'utf8').includes('Klatch server running'); } catch { /* not yet */ }
    if (booted) {
      try { if ((await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).ok) return; } catch { /* not yet */ }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server did not listen on ${PORT} in 90 s — see ${logPath}`);
}

/**
 * Resident set of the server process tree, in bytes. `npx tsx` execs a child, so
 * the pid we spawned may be a shim; sum the whole tree rather than trusting one
 * pid. Returns 0 if the platform's ps is not what we expect — a memory reading
 * we cannot take is reported as a skip, never as zero-cost.
 */
function serverRssBytes(): number {
  if (!server?.pid) return 0;
  try {
    const out = execFileSync('ps', ['-Ao', 'pid=,ppid=,rss='], { encoding: 'utf8' });
    const rows = out.trim().split('\n').map((l) => l.trim().split(/\s+/).map(Number));
    const byParent = new Map<number, Array<[number, number]>>();
    const rssOf = new Map<number, number>();
    for (const [pid, ppid, rss] of rows) {
      rssOf.set(pid, rss * 1024);
      if (!byParent.has(ppid)) byParent.set(ppid, []);
      byParent.get(ppid)!.push([pid, rss * 1024]);
    }
    let total = 0;
    const stack = [server.pid];
    const seen = new Set<number>();
    while (stack.length) {
      const pid = stack.pop()!;
      if (seen.has(pid)) continue;
      seen.add(pid);
      total += rssOf.get(pid) ?? 0;
      for (const [child] of byParent.get(pid) ?? []) stack.push(child);
    }
    return total;
  } catch {
    return 0;
  }
}

/** Poll RSS while `fn` runs; returns the peak seen alongside fn's result. */
async function withPeakRss<T>(fn: () => Promise<T>): Promise<{ value: T; peakRss: number; baseRss: number }> {
  const baseRss = serverRssBytes();
  let peakRss = baseRss;
  let running = true;
  const poll = (async () => {
    while (running) {
      const r = serverRssBytes();
      if (r > peakRss) peakRss = r;
      await new Promise((res) => setTimeout(res, 200));
    }
  })();
  try {
    const value = await fn();
    return { value, peakRss, baseRss };
  } finally {
    running = false;
    await poll;
  }
}

// ── Corpus helpers ───────────────────────────────────────────────────────────

interface FileInfo { file: string; dir: string; size: number; sessionId: string; }

/** Mirrors the scanner's filters: *.jsonl directly under a project dir, >= 100 bytes. */
function corpusFiles(root: string): FileInfo[] {
  if (!fs.existsSync(root)) return [];
  const out: FileInfo[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    let files: fs.Dirent[];
    try { files = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const f of files) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const p = path.join(dir, f.name);
      let size: number;
      try { size = fs.statSync(p).size; } catch { continue; }
      if (size < 100) continue;
      out.push({ file: p, dir: entry.name, size, sessionId: f.name.replace(/\.jsonl$/, '') });
    }
  }
  return out.sort((a, b) => b.size - a.size);
}

async function lineCount(file: string): Promise<number> {
  return new Promise((resolve) => {
    let n = 0;
    const rl = readline.createInterface({
      input: fs.createReadStream(file, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', () => { n++; });
    rl.on('close', () => resolve(n));
  });
}

// ── Arm A — the cap, read from source, and who is over it ────────────────────

console.log('── arm A: import size cap vs. the corpora ───────────────────────');

const IMPORT_TS = path.join(REPO, 'packages/server/src/routes/import.ts');
const importSrc = fs.readFileSync(IMPORT_TS, 'utf8');
const capMatch = importSrc.match(/const MAX_IMPORT_SIZE = (\d+) \* 1024 \* 1024;/);
if (!capMatch) {
  // Refusing beats guessing: a hardcoded 50 here would keep "passing" after the
  // constant moved, and report a boundary that is no longer the boundary.
  console.error('FATAL: could not read MAX_IMPORT_SIZE out of routes/import.ts — refusing to assume 50 MB');
  process.exit(1);
}
const MAX_IMPORT_SIZE = Number(capMatch[1]) * 1024 * 1024;
check('A', 'MAX_IMPORT_SIZE read from source', true,
  `${mb(MAX_IMPORT_SIZE)} (routes/import.ts, not hardcoded in this probe)`);

const secondFiles = corpusFiles(ROOT_SECOND);
const shippedFiles = corpusFiles(ROOT_SHIPPED);
check('A', 'second corpus present', secondFiles.length > 0,
  `${secondFiles.length} files, ${mb(secondFiles.reduce((s, f) => s + f.size, 0))} at ${ROOT_SECOND}`);
check('A', 'shipped corpus present', shippedFiles.length > 0,
  `${shippedFiles.length} files, ${mb(shippedFiles.reduce((s, f) => s + f.size, 0))} at ${ROOT_SHIPPED}`);

const secondOver = secondFiles.filter((f) => f.size > MAX_IMPORT_SIZE);
const shippedOver = shippedFiles.filter((f) => f.size > MAX_IMPORT_SIZE);

check('A', 'second corpus files over the import cap', secondOver.length === 0,
  secondOver.length === 0
    ? 'none'
    : `${secondOver.length}/${secondFiles.length} exceed ${mb(MAX_IMPORT_SIZE)}: ` +
      secondOver.map((f) => `${f.dir.split('-').pop()} ${mb(f.size)}`).join(', '));

check('A', 'shipped corpus files over the import cap', shippedOver.length === 0,
  shippedOver.length === 0
    ? `none — largest is ${mb(shippedFiles[0]?.size ?? 0)}`
    : `${shippedOver.length}/${shippedFiles.length} exceed ${mb(MAX_IMPORT_SIZE)}`);

check('A', 'the cap is a second-corpus problem, not a general one',
  shippedOver.length === 0 && secondOver.length > 0,
  `shipped max ${mb(shippedFiles[0]?.size ?? 0)} (${(mbn(shippedFiles[0]?.size ?? 0) / mbn(MAX_IMPORT_SIZE) * 100).toFixed(0)}% of cap); ` +
  `second max ${mb(secondFiles[0]?.size ?? 0)} (${(mbn(secondFiles[0]?.size ?? 0) / mbn(MAX_IMPORT_SIZE) * 100).toFixed(0)}% of cap)`,
  'measurement');

// The eleven department heads, by Daedalus's own definition (>= 13,000 lines).
const heads: Array<FileInfo & { lines: number }> = [];
for (const f of secondFiles) {
  const lines = await lineCount(f.file);
  if (lines >= 13_000) heads.push({ ...f, lines });
}
heads.sort((a, b) => b.size - a.size);
check('A', 'department heads located', heads.length === 11,
  `${heads.length} files >= 13,000 lines; ${heads.length ? `${heads[heads.length - 1].lines.toLocaleString()}–${Math.max(...heads.map((h) => h.lines)).toLocaleString()} lines` : ''}`);

const headsOver = heads.filter((f) => f.size > MAX_IMPORT_SIZE);
check('A', 'every department head is under the import cap', headsOver.length === 0,
  headsOver.length === 0 ? 'all under' :
    `${headsOver.length}/${heads.length} are NOT importable: ` +
    headsOver.map((f) => `${f.dir.split('-').pop()} ${mb(f.size)}/${f.lines.toLocaleString()} lines`).join(', '));

console.log('\n  department heads, largest first:');
for (const h of heads) {
  const over = h.size > MAX_IMPORT_SIZE;
  console.log(`    ${over ? 'OVER CAP ' : '         '}${mb(h.size).padStart(8)}  ${h.lines.toLocaleString().padStart(7)} lines  ${h.dir.split('-').pop()}`);
}
console.log('');

// Pick the import subjects: largest under-cap head, and a mid-size one.
const underCapHeads = heads.filter((f) => f.size <= MAX_IMPORT_SIZE);
const subjectLarge = underCapHeads[0];
const subjectOver = headsOver[0];

// ── Arm B — are the over-cap sessions offered to the user? ───────────────────

console.log('── arm B: does Browse offer what import will refuse? ─────────────');

if (!subjectOver) {
  skip('B', 'no over-cap session in the corpus — nothing to check');
} else {
  await startServer('multiroot', { KLATCH_EXTRA_SESSION_ROOTS: ROOT_SECOND_CONFIG });
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
  const body = await res.json() as any;
  const all = (body.projects ?? []).flatMap((p: any) => (p.sessions ?? []).map((s: any) => ({ ...s, projectName: p.projectName })));
  const ids = new Set(all.map((s: any) => s.sessionId));
  check('B', 'multi-root browse reached the second corpus', all.length > shippedFiles.length,
    `${all.length} sessions across ${body.projects.length} projects with KLATCH_EXTRA_SESSION_ROOTS=${ROOT_SECOND_CONFIG}`);

  const offered = headsOver.filter((f) => ids.has(f.sessionId));
  check('B', 'over-cap sessions are NOT offered in the browse list', offered.length === 0,
    offered.length === 0
      ? 'none offered'
      : `${offered.length}/${headsOver.length} appear in the list a user picks from, and import will reject each: ` +
        offered.map((f) => `${f.dir.split('-').pop()} (${f.sessionId.slice(0, 8)})`).join(', '));

  const headsOffered = heads.filter((f) => ids.has(f.sessionId));
  check('B', 'all department heads visible at the endpoint', headsOffered.length === heads.length,
    `${headsOffered.length}/${heads.length} present by sessionId`);

  // ── Arm C — what the endpoint actually says to an over-cap file ────────────
  console.log('\n── arm C: the endpoint\'s answer for an over-cap file ────────────');
  const t0 = performance.now();
  const cRes = await fetch(`${BASE}/api/import/claude-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({ sessionPath: subjectOver.file }),
  });
  const cMs = performance.now() - t0;
  const cBody = await cRes.text();
  check('C', 'over-cap import is refused with 400', cRes.status === 400,
    `HTTP ${cRes.status} in ${ms(cMs)} for ${mb(subjectOver.size)} (${subjectOver.dir.split('-').pop()})`);
  check('C', 'refusal names the file size and the cap', /File too large/.test(cBody),
    `body: ${cBody.slice(0, 200)}`);
  check('C', 'refusal is fast (rejected on stat, not after parsing)', cMs < 1000,
    `${ms(cMs)} — the size branch fires before parseClaudeCodeSession`, 'measurement');

  killServer();
}

// ── Arms D/E — import the largest under-cap heads for real ───────────────────

console.log('\n── arms D/E: importing real department heads ────────────────────');

interface ImportOutcome {
  status: number;
  wallMs: number;
  channelId?: string;
  messageCount?: number;
  peakRss: number;
  baseRss: number;
  bodyHead: string;
}

async function importOne(arm: string, subject: FileInfo & { lines: number }): Promise<ImportOutcome> {
  const { value, peakRss, baseRss } = await withPeakRss(async () => {
    const t0 = performance.now();
    const res = await fetch(`${BASE}/api/import/claude-code`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', connection: 'close' },
      body: JSON.stringify({ sessionPath: subject.file }),
    });
    const text = await res.text();
    return { status: res.status, wallMs: performance.now() - t0, text };
  });
  let parsed: any = {};
  try { parsed = JSON.parse(value.text); } catch { /* non-JSON body is itself the finding */ }
  const out: ImportOutcome = {
    status: value.status,
    wallMs: value.wallMs,
    channelId: parsed.channelId,
    messageCount: parsed.messageCount,
    peakRss, baseRss,
    bodyHead: value.text.slice(0, 300),
  };
  check(arm, `import succeeded (${subject.dir.split('-').pop()}, ${mb(subject.size)}, ${subject.lines.toLocaleString()} lines)`,
    out.status === 201, `HTTP ${out.status} in ${ms(out.wallMs)}${out.status !== 201 ? ` — ${out.bodyHead}` : ''}`);
  if (out.status === 201) {
    check(arm, 'import returned a channel and a message count', !!out.channelId && (out.messageCount ?? 0) > 0,
      `channelId ${String(out.channelId).slice(0, 8)}, ${out.messageCount?.toLocaleString()} messages`);
    check(arm, 'peak server RSS during import', true,
      `${mb(out.baseRss)} -> ${mb(out.peakRss)} (delta ${mb(out.peakRss - out.baseRss)}, ${(mbn(out.peakRss - out.baseRss) / mbn(subject.size)).toFixed(1)}x file size)`,
      'measurement');
    check(arm, 'import rate', true,
      `${(out.wallMs / mbn(subject.size)).toFixed(0)} ms/MB, ${(out.wallMs / (out.messageCount || 1)).toFixed(1)} ms/message`,
      'measurement');
  }
  return out;
}

await startServer('import', { KLATCH_EXTRA_SESSION_ROOTS: ROOT_SECOND_CONFIG });

// The timings must not be polluted by an already-populated scratch DB: dedup
// work and channel-count scans both scale with what is already there.
{
  const chans = await (await fetch(`${BASE}/api/channels`, { headers: { connection: 'close' } })).json() as any[];
  const withSession = chans.filter((ch: any) => {
    try { return !!JSON.parse(ch.sourceMetadata || '{}').originalSessionId; } catch { return false; }
  });
  check('G', 'scratch DB carries no prior imports into the timings', withSession.length === 0,
    `${chans.length} channels present, ${withSession.length} with an originalSessionId`);
}

/**
 * Import every under-cap head, largest first. Two reasons to do all of them
 * rather than a sample: it is the thing xian would actually do (onboard the
 * cast), and each import runs against a DB one import larger than the last, so
 * the sequence doubles as a dedup-scaling reading rather than needing a
 * separate arm. Arm D is the first import and the only one on a clean DB; the
 * rest are arm E and are explicitly NOT clean-DB timings.
 */
const imported: Array<{ subject: FileInfo & { lines: number }; out: ImportOutcome }> = [];
if (!subjectLarge) {
  skip('D', 'no under-cap department head to import');
  skip('E', 'no under-cap department head to import');
} else {
  const tAll = performance.now();
  for (let i = 0; i < underCapHeads.length; i++) {
    const subject = underCapHeads[i];
    const out = await importOne(i === 0 ? 'D' : 'E', subject);
    imported.push({ subject, out });
  }
  const allMs = performance.now() - tAll;
  const okCount = imported.filter((r) => r.out.status === 201).length;
  check('E', 'every under-cap department head imported', okCount === underCapHeads.length,
    `${okCount}/${underCapHeads.length} returned 201`);
  check('E', 'total cost of onboarding the importable cast', true,
    `${ms(allMs)} for ${okCount} heads, ${mb(underCapHeads.reduce((s, f) => s + f.size, 0))} of JSONL`,
    'measurement');

  const ok = imported.filter((r) => r.out.status === 201);
  if (ok.length >= 2) {
    const rates = ok.map((r) => r.out.wallMs / mbn(r.subject.size));
    const rMin = Math.min(...rates), rMax = Math.max(...rates);
    check('E', 'import cost is linear in bytes across the range', rMax / rMin < 3,
      `${rMin.toFixed(0)}–${rMax.toFixed(0)} ms/MB over ${mb(ok[ok.length - 1].subject.size)}–${mb(ok[0].subject.size)} — spread ${(rMax / rMin).toFixed(2)}x`,
      'measurement');
    // Dedup work scales with what is already imported; if it dominated, the
    // last import (7 prior channels) would be markedly slower per MB than the
    // first (0 prior). Reported either way rather than assumed away.
    const first = rates[0], last = rates[rates.length - 1];
    check('E', 'per-MB cost does not grow with DB size', last < first * 3,
      `first import ${first.toFixed(0)} ms/MB on an empty DB, last ${last.toFixed(0)} ms/MB with ${ok.length - 1} channels already present`,
      'measurement');
  }
}

const outD = imported[0]?.out;

// ── Arm H — does browse's turnCount predict what import lands? ───────────────

console.log('\n── arm H: browse turnCount vs. what import actually persisted ───');

if (imported.filter((r) => r.out.status === 201).length === 0) {
  skip('H', 'nothing imported to cross-check');
} else {
  // The scanner's own doc-comment on SessionInfo.turnCount makes a predictive
  // claim: "how many exchanges this session becomes once imported —
  // importSession persists at most two rows per turn." That was established on
  // the shipped corpus. This is the first time it is checked on PM's.
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`, { headers: { connection: 'close' } });
  const body = await res.json() as any;
  const byId = new Map<string, any>();
  for (const p of body.projects ?? []) for (const s of p.sessions ?? []) byId.set(s.sessionId, s);

  const rows: Array<{ name: string; turnCount?: number; messageCount?: number; persisted: number }> = [];
  let violations = 0, missing = 0;
  for (const { subject, out } of imported) {
    if (out.status !== 201) continue;
    const info = byId.get(subject.sessionId);
    if (!info) { missing++; continue; }
    const persisted = out.messageCount ?? 0;
    rows.push({ name: subject.dir.split('-').pop()!, turnCount: info.turnCount, messageCount: info.messageCount, persisted });
    if (typeof info.turnCount === 'number' && persisted > info.turnCount * 2) violations++;
  }
  check('H', 'every imported head was still findable in browse', missing === 0,
    `${rows.length} matched, ${missing} missing`);
  check('H', 'persisted rows <= 2 x browse turnCount, as the scanner claims', violations === 0,
    violations === 0 ? `holds for all ${rows.length} heads` : `${violations}/${rows.length} exceed the bound`);

  console.log('\n    head        browse turnCount   browse messageCount   rows persisted');
  for (const r of rows) {
    console.log(`    ${r.name.padEnd(10)} ${String(r.turnCount ?? '?').padStart(12)}   ${String(r.messageCount ?? '?').padStart(19)}   ${String(r.persisted).padStart(14)}`);
  }
  console.log('');

  // The gap that matters to the UI: browse shows messageCount next to a session.
  // If that number is 100x what the channel will contain, the list is telling
  // the user something the import will not honour.
  const ratios = rows
    .filter((r) => typeof r.messageCount === 'number' && r.persisted > 0)
    .map((r) => r.messageCount! / r.persisted);
  if (ratios.length) {
    check('H', 'browse messageCount is within 2x of what lands', Math.max(...ratios) <= 2,
      `browse/persisted ratio ${Math.min(...ratios).toFixed(1)}x–${Math.max(...ratios).toFixed(1)}x across ${ratios.length} heads`,
      'measurement');
  }
}

// ── Arm F — read-back: the step after import ─────────────────────────────────

console.log('\n── arm F: opening the channel that was just imported ────────────');

if (outD?.status === 201 && outD.channelId) {
  const t0 = performance.now();
  const r1 = await fetch(`${BASE}/api/channels/${outD.channelId}/messages`, { headers: { connection: 'close' } });
  const b1 = await r1.text();
  const plainMs = performance.now() - t0;
  check('F', 'messages endpoint returns 200', r1.status === 200, `HTTP ${r1.status}`);
  check('F', 'plain message read', true,
    `${ms(plainMs)}, ${mb(Buffer.byteLength(b1))} of JSON, ${JSON.parse(b1).length.toLocaleString()} messages`,
    'measurement');

  const t1 = performance.now();
  const r2 = await fetch(`${BASE}/api/channels/${outD.channelId}/messages?include=artifacts`, { headers: { connection: 'close' } });
  const b2 = await r2.text();
  const artMs = performance.now() - t1;
  const enriched = JSON.parse(b2);
  const artifacts = enriched.reduce((s: number, m: any) => s + (m.artifacts?.length ?? 0), 0);
  check('F', 'artifact-enriched read returns 200', r2.status === 200, `HTTP ${r2.status}`);
  check('F', 'artifact-enriched read', true,
    `${ms(artMs)}, ${mb(Buffer.byteLength(b2))} of JSON, ${artifacts.toLocaleString()} artifacts`,
    'measurement');
  check('F', 'the read the client actually makes stays under 2 s', artMs < 2000,
    `${ms(artMs)} for ${mb(Buffer.byteLength(b2))}`, 'measurement');

  const stats = await fetch(`${BASE}/api/channels/${outD.channelId}/stats`, { headers: { connection: 'close' } });
  check('F', 'channel stats endpoint survives the size', stats.status === 200, `HTTP ${stats.status}`);
} else {
  skip('F', 'arm D did not produce a channel to read back');
}

killServer();
await waitForPortFree();

// ── Arm I — is the cap load-bearing, or just a number? ───────────────────────

console.log('\n── arm I: what the over-cap files would cost if allowed ─────────');

/**
 * The three refused files are refused on `stat.size` alone. Whether that is
 * protecting anything is a separate question from whether the cap exists, and
 * it is answerable without touching the cap: parse them in-process with the
 * importer's own parser and measure. This does NOT import them and does NOT
 * change MAX_IMPORT_SIZE — the ruling is Daedalus's and xian's. It supplies the
 * number that ruling would need.
 *
 * Caveat recorded rather than argued away: this measures parse only. The
 * endpoint additionally writes rows and runs dedup, which arms D/E show costs
 * roughly 6-7 ms/MB in total, so parse is the dominant term but not the whole
 * of it.
 */
if (!headsOver.length) {
  skip('I', 'no over-cap files to price');
} else {
  const { parseClaudeCodeSession } = await import(
    path.join(REPO, 'packages/server/src/import/parser.ts')
  ) as typeof import('../packages/server/src/import/parser.js');

  for (const f of headsOver) {
    const name = f.dir.split('-').pop()!;
    const before = process.memoryUsage().rss;
    const t0 = performance.now();
    let turns = 0, events = 0, failed = '';
    try {
      const parsed = await parseClaudeCodeSession(f.file);
      turns = parsed.turns.length;
      events = parsed.eventCount ?? 0;
    } catch (e) {
      failed = e instanceof Error ? e.message : String(e);
    }
    const el = performance.now() - t0;
    const after = process.memoryUsage().rss;
    check('I', `over-cap file parses (${name}, ${mb(f.size)})`, !failed,
      failed ? `THREW: ${failed}` : `${ms(el)}, ${turns} turns, ${events.toLocaleString()} events, RSS ${mb(before)} -> ${mb(after)}`);
    if (!failed) {
      check('I', `${name}: parse rate vs. the under-cap heads`, true,
        `${(el / mbn(f.size)).toFixed(0)} ms/MB parse-only, against 6–7 ms/MB end-to-end for the files the cap allows`,
        'measurement');
    }
    global.gc?.();
  }
}

// ── Arm G — controls ─────────────────────────────────────────────────────────

console.log('\n── arm G: controls ──────────────────────────────────────────────');

const diff = execFileSync('git', ['diff', '--stat', '--', 'packages/'], { cwd: REPO, encoding: 'utf8' }).trim();
check('G', 'no source under packages/ was modified', diff === '', diff === '' ? 'git diff --stat -- packages/ is empty' : diff);

if (realDbBefore) {
  const after = fs.statSync(REAL_DB);
  check('G', "xian's klatch.db untouched",
    after.mtimeMs === realDbBefore.mtimeMs && after.size === realDbBefore.size,
    `mtime ${after.mtimeMs === realDbBefore.mtimeMs ? 'unchanged' : 'CHANGED'}, size ${after.size === realDbBefore.size ? 'unchanged' : 'CHANGED'}`);
} else {
  skip('G', `${REAL_DB} does not exist — nothing to guard`);
}

const secondAfter = corpusFiles(ROOT_SECOND);
check('G', 'second corpus not written to',
  secondAfter.length === secondFiles.length,
  `${secondAfter.length} files before and after (import is read-only on the source)`);

// ── Summary ──────────────────────────────────────────────────────────────────

const failures = results.filter((r) => !r.pass && r.kind === 'regression');
console.log(`\n${'='.repeat(70)}`);
console.log(`${results.length} checks, ${failures.length} failed, ${skipped.length} skipped`);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
}
if (skipped.length) {
  console.log('\nSKIPPED:');
  for (const s of skipped) console.log(`  ${s}`);
}
console.log('='.repeat(70));
process.exit(failures.length ? 1 : 0);
