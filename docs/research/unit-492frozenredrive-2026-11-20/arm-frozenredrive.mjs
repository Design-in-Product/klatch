#!/usr/bin/env node
/**
 * unit-492frozenredrive — arm.
 *
 * Measures whether a published research instrument is ever RE-DRIVEN after its authoring window.
 * Reads `git log` only. NEVER reads mtime (R4): the worktree wrapper syncs to origin/main before
 * every fire, which rewrites mtimes and would make every unit look freshly touched.
 *
 * Declared reading choices, all of them visible rather than buried:
 *  - author date (%ad, --date=short), not committer date; a rebase rewrites committer dates and
 *    this corpus rebases on push races (one happened in this seat's own 11/20 WORK fire).
 *  - --no-merges: git log omits --name-status for merge commits anyway, so including them would
 *    silently contribute zero-file commits that look like "touched the dir with no files".
 *  - NO rename detection (-M is not passed). A rename therefore shows as D + A, which keeps an
 *    `A`-on-.out from a rename out of K-REDRIVEN and inside K-APPENDED. Stated, not hidden.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', cwd: ROOT, maxBuffer: 256 * 1024 * 1024 });

// ---------------------------------------------------------------- population

const tracked = git(['ls-files', 'docs/research/']).split('\n').filter(Boolean);

const allDirs = new Set();
const outDirs = new Set();
for (const f of tracked) {
  const parts = f.split('/');
  if (parts.length < 4) continue; // docs/research/<dir>/<file>
  const dir = parts.slice(0, 3).join('/');
  allDirs.add(dir);
  if (path.basename(f).endsWith('.out')) outDirs.add(dir);
}

const P = [...outDirs].sort();
const excluded = [...allDirs].filter((d) => !outDirs.has(d)).sort();

// ---------------------------------------------------------------- history

const RAW = git([
  'log',
  '--no-merges',
  '--date=short',
  '--format=__C__%H|%ad',
  '--name-status',
  '--',
  'docs/research/',
]);

/** @type {{sha:string,date:string,files:{status:string,path:string}[]}[]} */
const commits = [];
let cur = null;
for (const line of RAW.split('\n')) {
  if (line.startsWith('__C__')) {
    const [sha, date] = line.slice(5).split('|');
    cur = { sha, date, files: [] };
    commits.push(cur);
    continue;
  }
  if (!line.trim() || !cur) continue;
  const m = line.match(/^([A-Z])\d*\t(.+)$/);
  if (!m) continue;
  const [, status, rest] = m;
  // no -M passed, so there is no "old\tnew" form to split; guard anyway
  const p = rest.split('\t').pop();
  cur.files.push({ status, path: p });
}

// index: dir -> commits touching it
/** @type {Map<string,{sha:string,date:string,files:{status:string,path:string}[]}[]>} */
const byDir = new Map();
for (const c of commits) {
  const dirs = new Set();
  for (const f of c.files) {
    const parts = f.path.split('/');
    if (parts.length < 4) continue;
    dirs.add(parts.slice(0, 3).join('/'));
  }
  for (const d of dirs) {
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(c);
  }
}

const plusOne = (ymd) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const dayGap = (a, b) =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

const isOut = (p) => path.basename(p).endsWith('.out');

/** Classify one dir under one window rule. */
function classify(dir, lenient) {
  const cs = byDir.get(dir) || [];
  if (cs.length === 0) return { status: 'NO-HISTORY', first: null, outside: [], gap: null };
  const first = cs.map((c) => c.date).sort()[0];
  const window = lenient ? new Set([first, plusOne(first)]) : new Set([first]);
  const outside = cs.filter((c) => !window.has(c.date));

  const redriven = [];
  const appended = [];
  for (const c of outside) {
    for (const f of c.files) {
      if (!f.path.startsWith(`${dir}/`) || !isOut(f.path)) continue;
      if (f.status === 'M') redriven.push({ sha: c.sha, date: c.date, path: f.path });
      else if (f.status === 'A') appended.push({ sha: c.sha, date: c.date, path: f.path });
    }
  }
  const gap = outside.length
    ? Math.max(...outside.map((c) => dayGap(c.date, first)))
    : null;

  let status = 'FROZEN';
  if (outside.length) status = redriven.length ? 'REDRIVEN' : 'EDITED';
  return { status, first, outside, redriven, appended, gap };
}

function tally(lenient) {
  const rows = P.map((d) => ({ dir: d, ...classify(d, lenient) }));
  const n = rows.length;
  const frozen = rows.filter((r) => r.status === 'FROZEN');
  const edited = rows.filter((r) => r.status !== 'FROZEN'); // EDITED or REDRIVEN
  const redriven = rows.filter((r) => r.status === 'REDRIVEN');
  const appended = rows.filter((r) => (r.appended || []).length);
  return { rows, n, frozen, edited, redriven, appended };
}

const LEN = tally(true);
const STRICT = tally(false);

// ---------------------------------------------------------------- P3: known positive

// Same M-on-.out key, NO window restriction, over the whole corpus history.
const kpHits = [];
for (const c of commits) {
  for (const f of c.files) {
    if (f.status === 'M' && isOut(f.path)) kpHits.push({ sha: c.sha, date: c.date, path: f.path });
  }
}

// ---------------------------------------------------------------- P6: verdict-row block

const ROW = /^[ \t]+(UNGUARDED|GUARDED|MARKED)[ \t]+\d+[ \t]*$/m;
const verdictFiles = [];
for (const f of tracked) {
  let txt;
  try {
    txt = git(['show', `HEAD:${f}`]);
  } catch {
    continue;
  }
  const labels = new Set();
  for (const line of txt.split('\n')) {
    const m = line.match(/^[ \t]+(UNGUARDED|GUARDED|MARKED)[ \t]+\d+[ \t]*$/);
    if (m) labels.add(m[1]);
  }
  if (labels.size === 3) verdictFiles.push(f);
}
const verdictDirs = [...new Set(verdictFiles.map((f) => f.split('/').slice(0, 3).join('/')))].sort();

// ---------------------------------------------------------------- the two instruments (P4)

const TWO = [
  'docs/research/unit-479braceslicekeys-2026-11-18',
  'docs/research/unit-487markerreport-2026-11-19',
];

// ---------------------------------------------------------------- report

const pct = (a, b) => (b === 0 ? 'n/a' : `${((a / b) * 100).toFixed(1)}%`);
const out = [];
const say = (s = '') => out.push(s);

say('unit-492 frozen-instrument re-drive census — git log only, never mtime');
say(`  tracked files under docs/research/: ${tracked.length}`);
say(`  unit directories (any tracked file):   ${allDirs.size}`);
say(`  |P| instrumented (>=1 tracked *.out):  ${P.length}`);
say(`  excluded (no .out artefact, re-drive undefined): ${excluded.length}`);
say(`  commits touching docs/research/ (no-merges): ${commits.length}`);
say();

for (const [label, T] of [['LENIENT window {first, first+1}', LEN], ['STRICT window {first}', STRICT]]) {
  say(`== ${label} ==`);
  say(`  FROZEN    ${String(T.frozen.length).padStart(4)}  ${pct(T.frozen.length, T.n)}`);
  say(`  EDITED    ${String(T.edited.length - T.redriven.length).padStart(4)}  (outside-window touch, no .out rewritten)`);
  say(`  REDRIVEN  ${String(T.redriven.length).padStart(4)}  (M on an existing .out outside the window)`);
  say(`  APPENDED  ${String(T.appended.length).padStart(4)}  (A on a new .out outside the window)`);
  const gaps = T.edited.map((r) => r.gap).filter((g) => g != null).sort((a, b) => a - b);
  if (gaps.length) {
    const le2 = gaps.filter((g) => g <= 2).length;
    const med = gaps[Math.floor(gaps.length / 2)];
    say(`  gap(max outside date - first) over the ${gaps.length} non-frozen: median ${med}d · <=2d ${le2}/${gaps.length} (${pct(le2, gaps.length)}) · max ${gaps[gaps.length - 1]}d`);
  }
  say();
}

say('== P3 known positive: M-on-.out with NO window restriction ==');
say(`  hits: ${kpHits.length}`);
for (const h of kpHits.slice(0, 12)) say(`    ${h.date} ${h.sha.slice(0, 8)} ${h.path}`);
if (kpHits.length > 12) say(`    … ${kpHits.length - 12} more`);
say();

say('== P4 the two instruments holding all 8 readers ==');
for (const d of TWO) {
  const l = classify(d, true);
  const s = classify(d, false);
  say(`  ${d}`);
  say(`     in P: ${P.includes(d) ? 'yes' : 'NO'} · first=${l.first}`);
  say(`     lenient=${l.status} (outside commits ${l.outside.length}) · strict=${s.status} (outside ${s.outside.length})`);
  for (const c of l.outside) say(`       outside: ${c.date} ${c.sha.slice(0, 8)} files-in-dir=${c.files.filter((f) => f.path.startsWith(`${d}/`)).map((f) => f.status + ':' + path.basename(f.path)).join(' ')}`);
}
say();

say('== P6 verdict-row block (all three labels as row-shaped lines) ==');
say(`  files: ${verdictFiles.length}`);
say(`  unit directories: ${verdictDirs.length}`);
for (const d of verdictDirs) say(`    ${d}`);
say();

say('== non-frozen units, named (lenient) ==');
for (const r of LEN.edited) {
  say(`  ${r.status.padEnd(8)} gap=${String(r.gap).padStart(3)}d  ${r.dir}`);
  for (const c of r.outside) {
    const f = c.files.filter((x) => x.path.startsWith(`${r.dir}/`));
    say(`      ${c.date} ${c.sha.slice(0, 8)}  ${f.map((x) => x.status + ':' + path.basename(x.path)).join(' ')}`);
  }
}

console.log(out.join('\n'));
