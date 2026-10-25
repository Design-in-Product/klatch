// Round 453 — census pass 1.
//
// Daedalus's Round 452 §8, third bullet: "Nothing re-drives the old round instruments. §5 is one
// instance of a class: a guard added in round N silently kills an instrument from round N−k, and no
// gate notices. I have not built the sweep that would, and I am not claiming the 446 case is the
// only one."
//
// This is the census the sweep needs first. It does three things and asserts nothing:
//
//   1. Selects the at-risk population with `git ls-tree` at a stamped rev, not `ls-files` and not
//      `readdirSync` — a population keyed on the working tree is irreproducible from any rev.
//   2. Classifies the SHARED-DEPENDENCY SURFACE: which modules an instrument reaches across a
//      round boundary. 452's mechanism is the research lib; it is not the only such module.
//   3. Drives each at-risk instrument that carries no spawn/server hazard, captures exit code and
//      stderr, and records WHERE the throw originated — in a shared module, or in the
//      instrument's own directory.
//
// The re-stamp hazard is real (441): several instruments write recordings. The drive therefore
// snapshots `git status --porcelain` before and after EVERY run and reports any tracked file the
// run modified, rather than trusting that none do.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const REV = git(['rev-parse', 'HEAD']).trim();

// ── 1. population, selected from the tree at REV ────────────────────────────────────────────────
const tracked = git(['ls-tree', '-r', '--name-only', REV, 'docs/research/'])
  .split('\n')
  .filter((p) => /^docs\/research\/round\d+-instruments\/[^/]+\.mjs$/.test(p));

// ── 2. the shared-dependency surface ────────────────────────────────────────────────────────────
const IMPORT = /(?:from|import\()\s*['"]([^'"]+)['"]/g;
const SPAWN = /\bspawn\b|\bfork\(|\.listen\(/;

/** Which cross-round-boundary module does this specifier reach? `null` = none (own dir, or a bare
 *  specifier, which is a node builtin or an installed dep and not a round-local file). */
function sharedSurface(spec) {
  if (!spec.startsWith('.')) return null;
  if (spec.startsWith('../lib/')) return 'research-lib';
  if (spec.startsWith('../../../scripts/')) return 'scripts-lib';
  if (/^\.\.\/round\d+-instruments\//.test(spec)) return 'other-round-dir';
  return null;
}

const population = [];
for (const path of tracked) {
  const src = git(['show', `${REV}:${path}`]);
  const surfaces = new Set();
  const specs = [];
  IMPORT.lastIndex = 0;
  let m;
  while ((m = IMPORT.exec(src))) {
    specs.push(m[1]);
    const s = sharedSurface(m[1]);
    if (s) surfaces.add(s);
  }
  population.push({
    path,
    round: Number(path.match(/round(\d+)/)[1]),
    file: path.split('/').pop(),
    surfaces: [...surfaces].sort(),
    specs,
    spawn: SPAWN.test(src),
  });
}

const atRisk = population.filter((p) => p.surfaces.length > 0).sort((a, b) => a.round - b.round);

console.log(`rev ${REV.slice(0, 8)}`);
console.log(`instruments tracked at rev: ${population.length}`);
console.log(`at-risk (reach a shared module across a round boundary): ${atRisk.length}`);

const bySurface = {};
for (const p of atRisk) {
  for (const s of p.surfaces) {
    bySurface[s] = bySurface[s] || { sites: 0, rounds: new Set() };
    bySurface[s].sites += 1;
    bySurface[s].rounds.add(p.round);
  }
}
console.log('\nSHARED-DEPENDENCY SURFACE');
for (const [s, v] of Object.entries(bySurface).sort((a, b) => b[1].sites - a[1].sites)) {
  const rs = [...v.rounds].sort((a, b) => a - b);
  console.log(
    `  ${s.padEnd(17)} importers=${String(v.sites).padStart(2)}  rounds=${rs.length}  span=${rs[0]}..${rs[rs.length - 1]}`,
  );
}

// ── 3. drive ────────────────────────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 60_000;

/** The sweep must not become the thing it is measuring: a run that re-stamps a committed
 *  recording would make this census destructive. Snapshot before and after every single run. */
const snapshot = () => git(['status', '--porcelain']).trim();

/** Which frames of a node stack trace point into a shared module vs the instrument's own dir?
 *  Keyed on the FIRST project frame — the throw site — not on mere presence anywhere in the stack,
 *  because every instrument's stack passes through its own file on the way down. */
function throwOrigin(stderr, ownDir) {
  const frames = [];
  for (const line of String(stderr).split('\n')) {
    const m = line.match(/\(?(\/[^\s():]+\.mjs):(\d+):(\d+)\)?\s*$/);
    if (m && !m[1].includes('/node_modules/') && !m[1].startsWith('node:')) frames.push(m[1]);
  }
  if (frames.length === 0) return { site: null, frames: [] };
  const rel = frames.map((f) => f.replace(`${REPO}/`, '').replace(/^\/+/, ''));
  const first = rel[0];
  let site;
  if (/^docs\/research\/lib\//.test(first)) site = 'research-lib';
  else if (/^scripts\//.test(first)) site = 'scripts-lib';
  else if (first.startsWith(ownDir)) site = 'own-dir';
  else if (/^docs\/research\/round\d+-instruments\//.test(first)) site = 'other-round-dir';
  else site = 'elsewhere';
  return { site, frames: rel };
}

/** The named node error class / code, read off stderr rather than guessed. */
function errorName(stderr) {
  const s = String(stderr);
  let m = s.match(/^\s*(?:Uncaught\s+)?([A-Z][A-Za-z]*(?:Error))(?::|\s)/m);
  if (m) {
    const code = s.match(/\b([A-Z][A-Z0-9_]{3,})\b/);
    return code && m[1] === 'TrackedTargetError' ? `${m[1]}/${code[1]}` : m[1];
  }
  m = s.match(/\b(ERR_[A-Z0-9_]+)\b/);
  if (m) return m[1];
  m = s.match(/\b([A-Z][A-Z0-9_]{5,})\b/);
  if (m) return m[1];
  return null;
}

const drivable = atRisk.filter((p) => !p.spawn);
const deferred = atRisk.filter((p) => p.spawn);
console.log(
  `\nDRIVE: ${drivable.length} drivable · ${deferred.length} deferred with a named hazard (spawn/listen — a leaked server is not reapable inside a fire)`,
);

const results = [];
let restamped = [];
for (const p of drivable) {
  const before = snapshot();
  let exit = 0;
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  try {
    stdout = execFileSync('node', [p.path], {
      cwd: REPO,
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    exit = e.status ?? -1;
    stdout = String(e.stdout ?? '');
    stderr = String(e.stderr ?? '');
    timedOut = e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT';
  }
  const after = snapshot();
  const dirty = after !== before;
  if (dirty) restamped.push(p.path);

  const ownDir = p.path.split('/').slice(0, -1).join('/');
  const origin = throwOrigin(stderr, ownDir);
  results.push({
    ...p,
    exit,
    timedOut,
    dirty,
    origin: origin.site,
    frames: origin.frames.slice(0, 3),
    err: errorName(stderr),
    stdoutLines: stdout.split('\n').filter(Boolean).length,
    hasVerdictLine: /^VERDICT\//m.test(stdout),
  });
}

console.log('\n--- per instrument ---');
for (const r of results) {
  const state = r.timedOut ? 'TIMEOUT' : r.exit === 0 ? 'alive' : `DEAD(${r.exit})`;
  console.log(
    `${String(r.round).padEnd(4)} ${state.padEnd(9)} ${(r.origin ?? '-').padEnd(16)} ${(r.err ?? '-').padEnd(24)} ${r.dirty ? 'DIRTY ' : '      '} ${r.file}`,
  );
}

const dead = results.filter((r) => r.exit !== 0);
const bySite = {};
for (const r of dead) bySite[r.origin ?? 'no-frames'] = (bySite[r.origin ?? 'no-frames'] || 0) + 1;

console.log('\n--- totals ---');
console.log(`driven: ${results.length}`);
console.log(`alive (exit 0): ${results.filter((r) => r.exit === 0).length}`);
console.log(`DEAD (exit != 0): ${dead.length}`);
console.log(`  by throw site: ${JSON.stringify(bySite)}`);
console.log(`timed out: ${results.filter((r) => r.timedOut).length}`);
console.log(`runs that modified a tracked file: ${restamped.length} ${JSON.stringify(restamped)}`);
console.log(`\nerror names among the dead: ${JSON.stringify([...new Set(dead.map((d) => d.err))])}`);

console.log('\n--- dead, with first frames ---');
for (const r of dead) {
  console.log(`${r.round} ${r.file}`);
  console.log(`   err=${r.err} origin=${r.origin} exit=${r.exit}`);
  for (const f of r.frames) console.log(`   @ ${f}`);
}

console.log('\n--- deferred (spawn hazard), named ---');
for (const p of deferred) console.log(`  ${p.round} ${p.file}`);
