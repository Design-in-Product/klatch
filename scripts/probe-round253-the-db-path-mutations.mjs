/**
 * Mutation drive for Round 253. Green is not health (Round 247 §4): each mutation
 * restores a specific defect this change removed and names the arm that must go
 * red. A mutation nothing catches is reported as SURVIVED.
 *
 * Reads the vitest JSON reporter, never stdout text — Round 249's third fault.
 * Same shape as `probe-round251-the-port-lever-mutations.mjs`, deliberately: the
 * two levers are siblings and a reader who has seen one should recognise the
 * other. No server is spawned here and no port is bound, so unlike Round 251 this
 * driver needs no 3001-occupancy refusal.
 *
 * M1 is the headline. It puts the module-scope resolution back exactly as it
 * stood before this commit — if that survives, the scheduled arms are decoration
 * and the only real evidence is the unscheduled probe.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = path.join(REPO, 'packages/server/src/index.ts');
const DBPATH = path.join(REPO, 'packages/server/src/dbPath.ts');
const DBIDX = path.join(REPO, 'packages/server/src/db/index.ts');
const TEST = 'src/__tests__/round253-the-database-path-is-resolved-when-it-is-opened.test.ts';
const OUT = path.join(REPO, '.testdata/round253-mutate-result.json');

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const TARGETS = { 'index.ts': ENTRY, 'dbPath.ts': DBPATH, 'db/index.ts': DBIDX };
const before = Object.fromEntries(Object.entries(TARGETS).map(([k, p]) => [k, sha(p)]));

const MUTATIONS = [
  {
    name: 'M1 resolve at module scope again — the defect, restored verbatim',
    file: DBIDX,
    from: "    db = new Database(resolveDbPath(process.env.KLATCH_DB));",
    to:
      "    db = new Database(FROZEN_AT_IMPORT);",
    // A module-scope const cannot be written inside the function body, so the
    // mutation also needs the const itself. Handled by `also` below.
    also: {
      file: DBIDX,
      from: 'let db: Database.Database;',
      to: 'const FROZEN_AT_IMPORT = resolveDbPath(process.env.KLATCH_DB);\nlet db: Database.Database;',
    },
    expect: 'opens the file named by KLATCH_DB as it stood when getDb() was called',
  },
  {
    name: 'M2 drop the pre-dotenv capture — read KLATCH_DB after dotenv has clobbered it',
    file: ENTRY,
    from: 'const dbFromCaller = process.env.KLATCH_DB;',
    to: 'const dbFromCaller = undefined as string | undefined;',
    expect: "captures the caller's KLATCH_DB above the dotenv.config() that would clobber it",
  },
  {
    name: 'M3 never restore the caller value — let the .env line win instead',
    file: ENTRY,
    from: 'if (fromEnv(dbFromCaller) !== undefined) process.env.KLATCH_DB = dbFromCaller;',
    to: '// restore removed by M3',
    expect: 'restores it after dotenv and before getDb() opens anything',
  },
  {
    // First written with `port.ts`'s `fromEnv` body as the anchor, copied across
    // on the assumption the siblings were spelled alike. `resolveDbPath` inlines
    // the trim instead, so the anchor matched 0 times and the ANCHOR MISS branch
    // reported it — the detector earning its place on its first outing. Repaired
    // rather than left in the list: a mutation that can never fire prints a miss
    // every run and dulls the signal it exists to give.
    name: 'M4 stop treating empty/whitespace as absent — KLATCH_DB="" becomes a filename',
    file: DBPATH,
    from: "  const trimmed = raw?.trim();\n  return trimmed ? path.resolve(trimmed) : defaultDbPath();",
    to: '  return raw === undefined ? defaultDbPath() : path.resolve(raw);',
    expect: 'as absent, matching fromEnv in port.ts',
  },
  {
    name: 'M5 drop the cache — re-resolve on every getDb() call',
    file: DBIDX,
    from: '  if (!db) {',
    to: '  if (true) {',
    expect: 'caches the connection',
  },
];

function runSuite() {
  try {
    execFileSync(
      'npx',
      ['vitest', 'run', TEST, '--root', 'packages/server', '--reporter=json', '--outputFile', OUT],
      { cwd: REPO, stdio: 'ignore', env: { ...process.env, NO_COLOR: '1' } },
    );
  } catch {
    /* non-zero exit is the expected outcome for a caught mutation */
  }
  const r = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const failed = [];
  for (const f of r.testResults ?? []) {
    for (const a of f.assertionResults ?? []) {
      if (a.status === 'failed') failed.push(a.fullName ?? a.title);
    }
  }
  return { ok: r.success === true, total: r.numTotalTests, failed };
}

const baseline = runSuite();
console.log(`BASELINE: success=${baseline.ok} total=${baseline.total} failed=${baseline.failed.length}`);
if (!baseline.ok) {
  console.log('  baseline is not green — aborting');
  process.exit(1);
}

for (const m of MUTATIONS) {
  const edits = [m, ...(m.also ? [m.also] : [])];
  const originals = new Map();
  let missed = null;
  for (const e of edits) {
    if (!originals.has(e.file)) originals.set(e.file, fs.readFileSync(e.file, 'utf8'));
  }
  for (const e of edits) {
    const cur = fs.readFileSync(e.file, 'utf8');
    const hits = cur.split(e.from).length - 1;
    if (hits !== 1) {
      missed = `ANCHOR MISS (${hits} occurrences) — this mutation has stopped measuring`;
      break;
    }
    fs.writeFileSync(e.file, cur.replace(e.from, e.to));
  }
  if (missed) {
    for (const [f, o] of originals) fs.writeFileSync(f, o);
    console.log(`${m.name}\n  ${missed}`);
    continue;
  }
  let res;
  try {
    res = runSuite();
  } finally {
    for (const [f, o] of originals) fs.writeFileSync(f, o);
  }
  const aimed = res.failed.filter((n) => n.includes(m.expect));
  const verdict = res.ok
    ? 'SURVIVED — nothing caught it'
    : aimed.length
      ? `CAUGHT by the aimed arm (${aimed.length} of ${res.failed.length} reds)`
      : `CAUGHT, but NOT by the aimed arm — reds: ${res.failed.join(' | ')}`;
  console.log(`${m.name}\n  ${verdict}`);
  if (!res.ok && aimed.length) console.log(`  aimed red: ${aimed[0]}`);
}

let clean = true;
for (const [label, p] of Object.entries(TARGETS)) {
  const same = before[label] === sha(p);
  if (!same) clean = false;
  console.log(`RESTORED: ${label.padEnd(12)} ${same ? 'sha256 identical' : 'CHANGED — INVESTIGATE'}  ${before[label].slice(0, 16)}…`);
}
process.exit(clean ? 0 : 1);
