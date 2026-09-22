/**
 * Mutation drive for Round 251. Green is not health (Round 247 §4): each mutation
 * below restores a specific defect this change removed, and names the arm that must
 * go red. A mutation nothing catches is reported as SURVIVED.
 *
 * Reads the vitest JSON reporter, never stdout text — Round 249's third fault was a
 * driver matching a regex against ANSI-coloured output and printing ALL GREEN for
 * four mutations that had all exited 1.
 */
import fs from 'fs';
import net from 'net';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(REPO, 'packages/server/src/index.ts');
const PORTTS = path.join(REPO, 'packages/server/src/port.ts');
const TEST = 'src/__tests__/round251-the-port-is-a-lever-not-a-literal.test.ts';
const OUT = path.join(REPO, '.testdata/round251-mutate-result.json');

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const before = { entry: sha(ENTRY), port: sha(PORTTS) };

const MUTATIONS = [
  {
    name: 'M1 revert the lever — the literal comes back',
    file: ENTRY,
    from: 'const port = resolvePort(fromEnv(portFromCaller) ?? fromEnv(process.env.PORT));',
    to: 'const port = 3001;',
    expect: 'the real entrypoint honours PORT',
  },
  {
    name: 'M2 resolve the port AFTER getDb(), as it was ordered before',
    file: ENTRY,
    from: 'const port = resolvePort(fromEnv(portFromCaller) ?? fromEnv(process.env.PORT));\n\n// Initialize database on startup\ngetDb();',
    to: '// Initialize database on startup\ngetDb();\n\nconst port = resolvePort(fromEnv(portFromCaller) ?? fromEnv(process.env.PORT));',
    expect: 'refuses, names PORT, and does NOT create the database',
  },
  {
    name: 'M3 drop the capture — read PORT after dotenv, as a naive one-liner would',
    file: ENTRY,
    from: 'const portFromCaller = process.env.PORT;',
    to: 'const portFromCaller = undefined as string | undefined;',
    expect: 'index.ts still captures PORT before dotenv can override it',
  },
  {
    name: 'M4 accept anything Number() accepts — hex and exponent slip through',
    file: PORTTS,
    from: 'const n = /^\\d+$/.test(raw) ? Number(raw) : NaN;',
    to: 'const n = Number(raw);',
    expect: 'Number() would silently accept it as a different number',
  },
  {
    name: 'M5 stop treating empty/whitespace as absent',
    file: PORTTS,
    from: '  const trimmed = raw?.trim();\n  return trimmed ? trimmed : undefined;',
    to: '  return raw;',
    expect: 'treats unset, empty and whitespace-only alike',
  },
];

function runSuite() {
  try {
    execFileSync('npx', ['vitest', 'run', TEST, '--root', 'packages/server', '--reporter=json', '--outputFile', OUT], {
      cwd: REPO, stdio: 'ignore', env: { ...process.env, NO_COLOR: '1' },
    });
  } catch { /* non-zero exit is the expected outcome for a caught mutation */ }
  const r = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const failed = [];
  for (const f of r.testResults ?? []) {
    for (const a of f.assertionResults ?? []) if (a.status === 'failed') failed.push(a.fullName ?? a.title);
  }
  return { ok: r.success === true, total: r.numTotalTests, failed };
}

/**
 * M1 restores the 3001 literal, which makes the suite's spawn arms bind 3001 for real.
 * That is the clobber the change exists to prevent, so refuse it rather than perform it
 * when something already owns the port. Measured 2026-09-22: 3001 was quiet, M1 ran.
 */
const occupied = await new Promise((r) => {
  const s = net.createConnection({ port: 3001, host: '127.0.0.1' });
  const t = setTimeout(() => { s.destroy(); r(false); }, 1500);
  s.on('connect', () => { clearTimeout(t); s.destroy(); r(true); });
  s.on('error', () => { clearTimeout(t); r(false); });
});
if (occupied) console.log('NOTE: 3001 is occupied — M1 will be SKIPPED (it binds 3001 for real)');

const baseline = runSuite();
console.log(`BASELINE: success=${baseline.ok} total=${baseline.total} failed=${baseline.failed.length}`);
if (!baseline.ok) { console.log('  baseline is not green — aborting'); process.exit(1); }

for (const m of MUTATIONS) {
  if (occupied && m.name.startsWith('M1')) { console.log(`${m.name}\n  SKIPPED — 3001 is occupied`); continue; }
  const original = fs.readFileSync(m.file, 'utf8');
  const hits = original.split(m.from).length - 1;
  if (hits !== 1) { console.log(`${m.name}\n  ANCHOR MISS (${hits} occurrences) — this mutation has stopped measuring`); continue; }
  fs.writeFileSync(m.file, original.replace(m.from, m.to));
  let res;
  try { res = runSuite(); } finally { fs.writeFileSync(m.file, original); }
  const aimed = res.failed.filter((n) => n.includes(m.expect));
  const verdict = res.ok ? 'SURVIVED — nothing caught it'
    : aimed.length ? `CAUGHT by the aimed arm (${aimed.length} of ${res.failed.length} reds)`
    : `CAUGHT, but NOT by the aimed arm — reds: ${res.failed.join(' | ')}`;
  console.log(`${m.name}\n  ${verdict}`);
  if (!res.ok && aimed.length) console.log(`  aimed red: ${aimed[0]}`);
}

const after = { entry: sha(ENTRY), port: sha(PORTTS) };
console.log(`RESTORED: index.ts ${before.entry === after.entry ? 'sha256 identical' : 'CHANGED — INVESTIGATE'}`);
console.log(`RESTORED: port.ts  ${before.port === after.port ? 'sha256 identical' : 'CHANGED — INVESTIGATE'}`);
console.log(`  index.ts ${before.entry.slice(0, 16)}…  port.ts ${before.port.slice(0, 16)}…`);
