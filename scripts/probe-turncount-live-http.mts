/**
 * Round 142 probe — `turnCount` over the wire, and the cap claim Daedalus left open.
 *
 * Theseus, 2026-09-03 START fire. Daedalus shipped `SessionInfo.turnCount` in
 * 5e5f0e9 and wrote to me and Iris that it is "populated from both scan paths
 * and typed on the client whenever you want it." Two things that memo does not
 * establish, and that its 11 unit tests structurally cannot:
 *
 * 1. **Transport.** A field added to a server type and populated in the scanner
 *    is not proof the browse ENDPOINT emits it. This is the exact class of gap
 *    that made Round 141 arm F worth writing: `entityGuess` was typed, tested
 *    against mocked fetch, and would have shipped a permanently-blank confirm
 *    field if the route had not spread it. `turnCount` is in the same position
 *    today — nothing has ever read it off a real HTTP response.
 *
 * 2. **The cap claim.** Daedalus listed as left-open: "The cap binds harder on
 *    turns. 1500 lines bought 469 events but only 75 turns in this file, so a
 *    capped `turnCount` understates by proportionally more than `messageCount`
 *    does." He says plainly he did not measure it. The inference does not
 *    follow from the evidence given: both counters run over the SAME 1500-line
 *    prefix (session-scanner.ts:158 caps `linesRead`, and both `messageCount++`
 *    and `turnCount++` sit inside that one loop), so a smaller absolute number
 *    is not a larger PROPORTIONAL loss. Whether turns are back-loaded in real
 *    sessions is an empirical question about event density, and it is decidable.
 *
 * It matters because Iris is being handed a labelling decision on this number
 * and the recommendation includes "the `+` should follow whichever number you
 * show." If turns retain proportionally WORSE than events under the cap, the
 * unit fix makes the lower-bound marker less honest, not more — the precise
 * failure Daedalus is trying to fix (`469+` delivering 143) would reappear in a
 * new place. If they retain the same, the `+` is safe to move and the open item
 * closes.
 *
 * Run:  npx tsx scripts/probe-turncount-live-http.mts
 *
 * Zero model calls. Scratch DB via KLATCH_DB; xian's `klatch.db` is untouched.
 * Arms H and I need a listening server on 3001 and are SKIPPED WITH A NOTE (not
 * silently passed) when the port is occupied. Arm J is a scanner-level
 * measurement over the real corpus and runs regardless.
 *
 * Arms:
 *   H  live browse response carries turnCount for every real session   [regression]
 *   I  turnCount predicts persisted rows: turns <= rows <= 2*turns     [regression]
 *   J  cap proportionality: does the cap bind harder on turns?         [open item]
 *   K  displayed number vs rows that actually land, on capped sessions [open item]
 *
 * H and I must always pass; a failure there exits 1. J and K encode currently-
 * open defects and are written so that PASSING is the signal they're fixed —
 * they report and do not exit 1. See the `check()` comment.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { spawn } from 'child_process';
import net from 'net';

const REPO = path.resolve(import.meta.dirname, '..');
const SCRATCH = path.join(REPO, '.testdata', 'turncount-live-http');
const DB = path.join(SCRATCH, 'scratch.db');
const PORT = 3001;
const BASE = `http://127.0.0.1:${PORT}`;

/** Mirrors session-scanner.ts:119. Read from source so a bump can't stale this probe. */
const FINGERPRINT_LINE_CAP = (() => {
  const src = fs.readFileSync(path.join(REPO, 'packages/server/src/import/session-scanner.ts'), 'utf8');
  const m = src.match(/const FINGERPRINT_LINE_CAP = (\d+)/);
  if (!m) throw new Error('could not read FINGERPRINT_LINE_CAP from session-scanner.ts');
  return Number(m[1]);
})();

// Two kinds of check, and conflating them would make this instrument lie later.
//
// REGRESSION checks (H, I) assert behavior that holds today and must keep
// holding; a failure means something broke, and exits 1.
//
// OPEN checks (J, K) encode defects that are open RIGHT NOW and are expected to
// fail — they are written in the positive so that the day they start passing is
// the day the underlying item is genuinely closed. They do not exit 1, because
// a red exit on a known-open item trains everyone to ignore the exit code.
// Same convention as Round 139's gap arms.
type Kind = 'regression' | 'open';
const results: Array<{ arm: string; check: string; pass: boolean; detail: string; kind: Kind }> = [];
function check(arm: string, name: string, pass: boolean, detail: string, kind: Kind = 'regression') {
  results.push({ arm, check: name, pass, detail, kind });
  const tag = pass ? 'PASS' : kind === 'open' ? 'OPEN' : 'FAIL';
  console.log(`${tag} [${arm}] ${name} — ${detail}`);
}
const skipped: string[] = [];
function skip(arm: string, why: string) {
  skipped.push(`[${arm}] ${why}`);
  console.log(`SKIP [${arm}] ${why}`);
}

async function portIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
fs.mkdirSync(SCRATCH, { recursive: true });

const { isHumanTurnBoundary } = await import(path.join(REPO, 'packages/server/src/import/parser.ts'));

// ── Uncapped reference scan ───────────────────────────────────
//
// Re-implements extractSessionFingerprint's filter EXACTLY (session-scanner.ts
// :164-187) with the line cap removed, so `capped/true` is a measurement of the
// cap alone and not of a filter difference. Kept literal and side by side with
// the original rather than factored, because the whole point is that it must
// track the real thing; a shared helper would hide a drift.
//
// Also splits both counters at the cap line, so arm J can report the DENSITY on
// each side of the cut. Retention alone says the cap hurts turns more; the
// prefix/suffix split says whether that is because turns are back-loaded (in
// which case a bigger cap buys a lot) or because the tail is uniformly denser.
function scanUncapped(filePath: string): Promise<{
  messageCount: number; turnCount: number; lines: number;
  preMsgs: number; preTurns: number; postMsgs: number; postTurns: number;
}> {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let messageCount = 0, turnCount = 0, lines = 0;
    let preMsgs = 0, preTurns = 0, postMsgs = 0, postTurns = 0;
    rl.on('line', (line) => {
      lines++;
      const inPrefix = lines <= FINGERPRINT_LINE_CAP;
      let event: any;
      try { event = JSON.parse(line); } catch { return; }
      if (!event || (event.type !== 'user' && event.type !== 'assistant')) return;
      if (event.isSidechain) return;
      if (event.isMeta || event.isCompactSummary || event.isVisibleInTranscriptOnly) return;
      if (!event.message) return;
      if (event.type === 'user') {
        const content = event.message.content;
        const isToolResult = Array.isArray(content) && content.every((b: any) => b?.type === 'tool_result');
        if (isToolResult) return;
        if (isHumanTurnBoundary(event)) { turnCount++; if (inPrefix) preTurns++; else postTurns++; }
      }
      messageCount++;
      if (inPrefix) preMsgs++; else postMsgs++;
    });
    const done = () => resolve({ messageCount, turnCount, lines, preMsgs, preTurns, postMsgs, postTurns });
    rl.on('close', done);
    rl.on('error', done);
    stream.on('error', done);
  });
}

// ── Server lifecycle (arms H, I only) ─────────────────────────

let server: ReturnType<typeof spawn> | undefined;
let shuttingDown = false;
function shutdown() {
  if (shuttingDown || !server) return;
  shuttingDown = true;
  try { server.kill('SIGTERM'); } catch { /* already gone */ }
}
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });

const serverLog = path.join(SCRATCH, 'server.log');
const haveServer = await portIsFree(PORT);

if (haveServer) {
  const logFd = fs.openSync(serverLog, 'a');
  server = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: path.join(REPO, 'packages/server'),
    env: { ...process.env, KLATCH_DB: DB },
    stdio: ['ignore', logFd, logFd],
  });
  const deadline = Date.now() + 45_000;
  let up = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode}). Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
    }
    try { if ((await fetch(`${BASE}/api/channels`)).ok) { up = true; break; } } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!up) throw new Error(`server did not listen on ${PORT} in 45s. Log:\n${fs.readFileSync(serverLog, 'utf8')}`);
  console.log(`server listening on :${PORT} against ${path.relative(REPO, DB)} — arms H/I are real HTTP\n`);
} else {
  console.log(`port ${PORT} is occupied — arms H and I cannot run (the server hardcodes 3001).\n`);
}

type Sess = { path: string; projectName?: string; messageCount?: number; turnCount?: number; fingerprintCapped?: boolean; entityGuess?: any };
let browsed: Sess[] = [];

// ── Arm H — does turnCount survive the wire? ──────────────────
if (!haveServer) {
  skip('H', 'needs a listening server on 3001; stop `npm run dev` and re-run');
} else {
  const res = await fetch(`${BASE}/api/import/claude-code/sessions`);
  const body = await res.json().catch(() => ({})) as any;
  check('H', 'browse endpoint responds', res.ok, `HTTP ${res.status}`);
  browsed = ((body.projects ?? []) as any[]).flatMap((p) => (p.sessions ?? []).map((s: any) => ({ ...s, projectName: p.projectName })));

  if (browsed.length === 0) {
    check('H', 'corpus reachable to assert the turnCount contract', false,
      `0 sessions returned — contract NOT exercised. Re-run where ~/.claude/projects is readable.`);
  } else {
    const withTurns = browsed.filter((s) => typeof s.turnCount === 'number');
    check('H', 'every browsed session carries a numeric turnCount',
      withTurns.length === browsed.length, `${withTurns.length}/${browsed.length} sessions`);
    // A turn is one user event among many events; turns can never exceed events.
    // If this ever inverts, the two counters have drifted apart in the one loop
    // they share, which is the failure Daedalus's "by construction" claim rules out.
    const inverted = withTurns.filter((s) => (s.turnCount ?? 0) > (s.messageCount ?? 0));
    check('H', 'turnCount <= messageCount on every session', inverted.length === 0,
      inverted.length ? `${inverted.length} inverted, e.g. ${path.basename(inverted[0].path)}` : `checked ${withTurns.length}`);
    const zeroTurn = withTurns.filter((s) => (s.turnCount ?? 0) === 0);
    console.log(`\n  ${zeroTurn.length}/${browsed.length} sessions have turnCount 0 (no human turn boundary at all)`);
    const ratios = withTurns.filter((s) => (s.turnCount ?? 0) > 0).map((s) => (s.messageCount ?? 0) / (s.turnCount ?? 1));
    ratios.sort((a, b) => a - b);
    const q = (f: number) => ratios[Math.min(ratios.length - 1, Math.floor(f * ratios.length))]?.toFixed(2);
    console.log(`  events-per-turn across ${ratios.length} real sessions: min ${q(0)}  p50 ${q(0.5)}  p90 ${q(0.9)}  max ${ratios[ratios.length - 1]?.toFixed(2)}`);
    console.log(`  (Daedalus saw 1.9x and 3.3x and concluded no constant correction exists — this is the full spread)\n`);
  }
}

// ── Arm I — does turnCount predict what lands? ────────────────
//
// The field comment asserts a contract: "importSession persists at most two rows
// per turn." That is the whole justification for moving the unit, and it has
// been checked on one file in-process. This drives it over real HTTP across a
// spread of real sessions, and only on UNCAPPED ones — on a capped session
// turnCount is a lower bound by construction and the upper bound cannot hold.
if (!haveServer) {
  skip('I', 'needs a listening server on 3001');
} else if (browsed.length === 0) {
  skip('I', 'no corpus reachable');
} else {
  process.env.KLATCH_DB = DB;
  const { default: Database } = await import('better-sqlite3');
  const sql = new Database(DB, { readonly: false });

  const uncapped = browsed
    .filter((s) => !s.fingerprintCapped && (s.turnCount ?? 0) > 0)
    .sort((a, b) => (b.turnCount ?? 0) - (a.turnCount ?? 0));
  // Spread across the depth range rather than taking the top N: a contract that
  // holds only on deep sessions is not the contract that was claimed.
  const SAMPLE = 12;
  const step = Math.max(1, Math.floor(uncapped.length / SAMPLE));
  const sample = uncapped.filter((_, i) => i % step === 0).slice(0, SAMPLE);

  console.log(`  [I] importing ${sample.length} uncapped real sessions (of ${uncapped.length} available), turnCount ${sample[0]?.turnCount} down to ${sample[sample.length - 1]?.turnCount}`);
  // Report the depth ceiling rather than letting a shallow sample read as a
  // broad one. If the deepest UNCAPPED session in the corpus is small, then
  // every session with real depth is capped — which is a finding about the cap,
  // not a weakness of the sample, and it must not be silently absorbed.
  const deepest = uncapped[0]?.turnCount ?? 0;
  const cappedCount = browsed.filter((s) => s.fingerprintCapped).length;
  console.log(`      deepest UNCAPPED session in the corpus: ${deepest} turns; ${cappedCount}/${browsed.length} sessions are capped`);
  console.log(`      => any session deeper than ${deepest} turns reports a LOWER BOUND, which is where the label matters most\n`);

  let violations = 0, lowerViolations = 0;
  const rows: Array<{ turns: number; msgs: number; persisted: number }> = [];
  for (const s of sample) {
    const res = await fetch(`${BASE}/api/import/claude-code`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionPath: s.path, channelName: `probe-tc-${path.basename(s.path, '.jsonl').slice(0, 8)}`, forceImport: true }),
    });
    const r = await res.json().catch(() => ({})) as any;
    if (!r.channelId) { console.log(`    (skipped ${path.basename(s.path)} — HTTP ${res.status} ${r.error ?? ''})`); continue; }
    const persisted = (sql.prepare('SELECT COUNT(*) as n FROM messages WHERE channel_id = ?').get(r.channelId) as any).n;
    const turns = s.turnCount ?? 0, msgs = s.messageCount ?? 0;
    rows.push({ turns, msgs, persisted });
    if (persisted > 2 * turns) violations++;
    if (persisted < turns) lowerViolations++;
    console.log(`    ${String(turns).padStart(4)} turns / ${String(msgs).padStart(5)} events -> ${String(persisted).padStart(4)} rows   (${(persisted / turns).toFixed(2)} rows/turn)`);
  }

  check('I', 'rows <= 2 x turnCount on every uncapped session (the documented contract)',
    rows.length > 0 && violations === 0, `${violations} violation(s) over ${rows.length} imports`);
  check('I', 'rows >= turnCount on every uncapped session (each turn lands at least its user row)',
    rows.length > 0 && lowerViolations === 0, `${lowerViolations} violation(s) over ${rows.length} imports`);

  // The point of the unit change is that turns are a HONEST size signal where
  // events are not. Report both errors as a user would experience them.
  if (rows.length) {
    const err = (predicted: number, actual: number) => Math.abs(predicted - actual) / actual;
    const turnErr = rows.map((r) => err(r.turns, r.persisted)).sort((a, b) => a - b);
    const msgErr = rows.map((r) => err(r.msgs, r.persisted)).sort((a, b) => a - b);
    const med = (a: number[]) => a[Math.floor(a.length / 2)];
    console.log(`\n  as a predictor of rows-that-land, median relative error:`);
    console.log(`    turnCount    ${(med(turnErr) * 100).toFixed(0)}%`);
    console.log(`    messageCount ${(med(msgErr) * 100).toFixed(0)}%\n`);
  }
  sql.close();
}

// ── Arm J — the cap claim, measured ───────────────────────────
//
// Daedalus: "a capped turnCount understates by proportionally more than
// messageCount does" — explicitly not measured. Both counters advance inside
// the same capped loop, so this is decidable by re-scanning the same files with
// the cap removed and comparing retention.
{
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  let files: string[] = [];
  try {
    for (const d of fs.readdirSync(projectsDir)) {
      const dir = path.join(projectsDir, d);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.jsonl')) files.push(path.join(dir, f));
    }
  } catch { /* corpus unreachable */ }

  // Only files longer than the cap can exhibit the effect at all.
  const long = files
    .map((f) => ({ f, size: fs.statSync(f).size }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 40)
    .map((x) => x.f);

  if (long.length === 0) {
    skip('J', 'no readable ~/.claude/projects corpus — cap claim NOT measured');
  } else {
    const { extractSessionFingerprint } = await import(path.join(REPO, 'packages/server/src/import/session-scanner.ts'));
    const measured: Array<{
      file: string; msgRet: number; turnRet: number; trueTurns: number; trueMsgs: number; lines: number;
      preDensity: number; postDensity: number; shownTurns: number; shownMsgs: number;
    }> = [];
    for (const f of long) {
      const capped = await extractSessionFingerprint(f);
      if (!capped.capped) continue;              // cap never bound; nothing to compare
      const truth = await scanUncapped(f);
      if (truth.turnCount === 0 || truth.messageCount === 0) continue;
      measured.push({
        file: path.basename(f),
        msgRet: capped.messageCount / truth.messageCount,
        turnRet: capped.turnCount / truth.turnCount,
        trueTurns: truth.turnCount, trueMsgs: truth.messageCount, lines: truth.lines,
        preDensity: truth.preTurns ? truth.preMsgs / truth.preTurns : Infinity,
        postDensity: truth.postTurns ? truth.postMsgs / truth.postTurns : Infinity,
        shownTurns: capped.turnCount, shownMsgs: capped.messageCount,
      });
    }

    if (measured.length === 0) {
      skip('J', `no session in the corpus exceeds the ${FINGERPRINT_LINE_CAP}-line cap — the claim is untestable here and, on this corpus, moot`);
    } else {
      console.log(`\n  [J] ${measured.length} real sessions actually hit the ${FINGERPRINT_LINE_CAP}-line cap. Retention = capped/true:\n`);
      console.log(`      ${'session'.padEnd(24)} ${'lines'.padStart(6)} ${'true evt'.padStart(9)} ${'true trn'.padStart(9)} ${'evt ret'.padStart(8)} ${'trn ret'.padStart(8)}  ${'evt/turn pre'.padStart(12)} ${'evt/turn post'.padStart(13)}`);
      for (const m of measured.sort((a, b) => a.turnRet - b.turnRet)) {
        const d = (x: number) => (Number.isFinite(x) ? x.toFixed(1) : 'n/a');
        console.log(`      ${m.file.slice(0, 24).padEnd(24)} ${String(m.lines).padStart(6)} ${String(m.trueMsgs).padStart(9)} ${String(m.trueTurns).padStart(9)} ${(m.msgRet * 100).toFixed(1).padStart(7)}% ${(m.turnRet * 100).toFixed(1).padStart(7)}%  ${d(m.preDensity).padStart(12)} ${d(m.postDensity).padStart(13)}`);
      }
      const worseOnTurns = measured.filter((m) => m.turnRet < m.msgRet - 0.02);   // 2pt band: ignore noise
      const worseOnMsgs = measured.filter((m) => m.msgRet < m.turnRet - 0.02);
      const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
      console.log(`\n      mean event retention ${(mean(measured.map((m) => m.msgRet)) * 100).toFixed(1)}%   mean turn retention ${(mean(measured.map((m) => m.turnRet)) * 100).toFixed(1)}%`);
      console.log(`      turns retained WORSE on ${worseOnTurns.length}/${measured.length};  turns retained BETTER on ${worseOnMsgs.length}/${measured.length}\n`);

      // ── Arm K — the question Iris actually has ──────────────
      //
      // Retention answers Daedalus's question. Hers is different: does the
      // number ON THE SCREEN tell the user the size of what they are about to
      // import? Arm I saw a clean 2.00 rows/turn, and Daedalus measured 143
      // rows on 75 turns (1.91) — close, but an ESTIMATED row count is exactly
      // the kind of "plausibly accounts for it" I got called on last round.
      // So import all 11 capped sessions for real and count. Direction matters
      // as much as magnitude: a `+` that overshoots is a broken promise, one
      // that undershoots is merely useless.
      if (!haveServer) {
        skip('K', 'needs a listening server; rows-that-land for capped sessions NOT measured');
      } else {
        const { default: Database2 } = await import('better-sqlite3');
        const sql2 = new Database2(DB, { readonly: false });
        const byBase = new Map(long.map((f) => [path.basename(f), f]));
        console.log(`      what the user would SEE on a capped session, vs the rows that ACTUALLY land (imported, not estimated):\n`);
        console.log(`      ${'session'.padEnd(24)} ${'rows land'.padStart(9)} ${'/turn'.padStart(6)} ${'shows turns'.padStart(11)} ${'shows evts'.padStart(10)}   verdict`);
        let overs = 0, unders = 0, worstUnder = 0;
        for (const m of measured) {
          const full = byBase.get(m.file);
          if (!full) continue;
          const res = await fetch(`${BASE}/api/import/claude-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionPath: full, channelName: `probe-cap-${m.file.slice(0, 8)}`, forceImport: true }),
          });
          const r = await res.json().catch(() => ({})) as any;
          if (!r.channelId) { console.log(`      ${m.file.slice(0, 24).padEnd(24)}  import failed — HTTP ${res.status} ${r.error ?? ''}`); continue; }
          const rows = (sql2.prepare('SELECT COUNT(*) as n FROM messages WHERE channel_id = ?').get(r.channelId) as any).n;
          const tOff = rows / Math.max(1, m.shownTurns), mOff = m.shownMsgs / Math.max(1, rows);
          if (m.shownMsgs > rows) overs++;
          if (m.shownTurns < rows) { unders++; worstUnder = Math.max(worstUnder, tOff); }
          console.log(`      ${m.file.slice(0, 24).padEnd(24)} ${String(rows).padStart(9)} ${(rows / m.trueTurns).toFixed(2).padStart(6)} ${String(m.shownTurns + '+').padStart(11)} ${String(m.shownMsgs + '+').padStart(10)}   turns under by ${tOff.toFixed(1)}x; events ${mOff >= 1 ? 'OVER' : 'under'} by ${(mOff >= 1 ? mOff : 1 / mOff).toFixed(1)}x`);
        }
        sql2.close();
        console.log(`\n      messageCount+ OVERSTATES rows on ${overs}/${measured.length} capped sessions (the '469+ delivers 143' failure, at scale).`);
        console.log(`      turnCount+ never overstates — honest, but understates by up to ${worstUnder.toFixed(0)}x.\n`);
        check('K', "no capped session's messageCount+ overstates rows-that-land",
          overs === 0,
          overs === 0
            ? `0/${measured.length} — the '469+ delivers 143' failure is gone; whatever the screen now shows is safe`
            : `${overs}/${measured.length} capped sessions promise more rows than land. Expected to fail while the screen still shows messageCount; CONFIRMS the unit change is warranted, at scale rather than on one instance`,
          'open');
      }

      // Stated as the claim under test, so the result reads the same direction
      // either way: a FAIL here means Daedalus's open item is real and Iris must
      // not move the `+` yet; a PASS means the open item closes.
      check('J', "capped turnCount does NOT understate proportionally worse than messageCount (Daedalus's open item #1)",
        worseOnTurns.length === 0,
        worseOnTurns.length === 0
          ? `no session shows turns retained worse by >2pt across ${measured.length} capped sessions`
          : `${worseOnTurns.length}/${measured.length} sessions retain turns worse, worst ${(worseOnTurns[0].turnRet * 100).toFixed(1)}% vs ${(worseOnTurns[0].msgRet * 100).toFixed(1)}% events. Daedalus's open item #1 is REAL — but the reason he gave for it isn't the reason: both counters share one capped loop, so the cause is front-loaded event density (see evt/turn pre vs post above), not turns being 'fewer per 1500 lines'`,
        'open');
    }
  }
}

// ── Report ────────────────────────────────────────────────────

const regressions = results.filter((r) => !r.pass && r.kind === 'regression');
const stillOpen = results.filter((r) => !r.pass && r.kind === 'open');
const passed = results.filter((r) => r.pass);
console.log(`\n${passed.length}/${results.length} checks passed`);
if (skipped.length) {
  console.log(`${skipped.length} arm(s) SKIPPED (not passed):`);
  for (const s of skipped) console.log(`  ${s}`);
}
if (stillOpen.length) {
  console.log(`\nSTILL OPEN (expected — these are the findings, not breakage):`);
  for (const f of stillOpen) console.log(`  [${f.arm}] ${f.check}\n        ${f.detail}`);
}
shutdown();

if (regressions.length) {
  console.log('\nREGRESSIONS:');
  for (const f of regressions) console.log(`  [${f.arm}] ${f.check} — ${f.detail}`);
  process.exit(1);
}
process.exit(0);
