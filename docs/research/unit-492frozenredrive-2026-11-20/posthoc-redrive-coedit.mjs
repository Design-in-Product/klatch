#!/usr/bin/env node
/**
 * unit-492frozenredrive — POST-HOC, written AFTER drive0 and NOT pre-registered.
 * Labelled as post-hoc because it was authored in response to P2's refutation; its figures grade
 * nothing and predict nothing. It exists because two things drive0 reported are load-bearing and
 * under-described:
 *
 *  1. The window choice is load-bearing (REDRIVEN 1 lenient vs 3 strict), and drive0 names only the
 *     LENIENT non-frozen set. The pre-reg promised both ways, so the strict set is named here.
 *  2. A re-drive that CO-OCCURS with an edit to an instrument in the same commit is a different
 *     hazard from one that does not. In the first, an author had the file open; in the second, an
 *     output was rewritten with nobody editing the reader. Collapsing the two would let the
 *     strongest and weakest readings of P2's refutation share one number.
 *
 * Same reading discipline as the arm: git log only, author dates, --no-merges, no rename detection.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (a) => execFileSync('git', a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 256 * 1024 * 1024 });

const tracked = git(['ls-files', 'docs/research/']).split('\n').filter(Boolean);
const outDirs = new Set();
for (const f of tracked) {
  const parts = f.split('/');
  if (parts.length >= 4 && path.basename(f).endsWith('.out')) outDirs.add(parts.slice(0, 3).join('/'));
}
const P = [...outDirs].sort();

const RAW = git(['log', '--no-merges', '--date=short', '--format=__C__%H|%ad', '--name-status', '--', 'docs/research/']);
const commits = [];
let cur = null;
for (const line of RAW.split('\n')) {
  if (line.startsWith('__C__')) {
    const [sha, date] = line.slice(5).split('|');
    cur = { sha, date, files: [] };
    commits.push(cur);
    continue;
  }
  const m = line.match(/^([A-Z])\d*\t(.+)$/);
  if (m && cur) cur.files.push({ status: m[1], path: m[2].split('\t').pop() });
}
const byDir = new Map();
for (const c of commits) {
  const ds = new Set();
  for (const f of c.files) {
    const p = f.path.split('/');
    if (p.length >= 4) ds.add(p.slice(0, 3).join('/'));
  }
  for (const d of ds) {
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(c);
  }
}
const plusOne = (y) => { const d = new Date(`${y}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
const gapOf = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
const isOut = (p) => path.basename(p).endsWith('.out');
const isInstr = (p) => /\.(mjs|js|ts|mts|sh|py)$/.test(path.basename(p));

const out = [];
const say = (s = '') => out.push(s);

for (const [label, lenient] of [['LENIENT {first, first+1}', true], ['STRICT {first}', false]]) {
  say(`======== ${label} ========`);
  const redriven = [];
  const edited = [];
  for (const dir of P) {
    const cs = byDir.get(dir) || [];
    if (!cs.length) continue;
    const first = cs.map((c) => c.date).sort()[0];
    const win = lenient ? new Set([first, plusOne(first)]) : new Set([first]);
    const outside = cs.filter((c) => !win.has(c.date));
    if (!outside.length) continue;
    const rd = [];
    for (const c of outside) {
      const mine = c.files.filter((f) => f.path.startsWith(`${dir}/`));
      const outsM = mine.filter((f) => f.status === 'M' && isOut(f.path));
      if (!outsM.length) continue;
      const coInstr = mine.filter((f) => f.status === 'M' && isInstr(f.path));
      rd.push({
        sha: c.sha, date: c.date, gap: gapOf(c.date, first),
        outs: outsM.map((f) => path.basename(f.path)),
        coedited: coInstr.map((f) => path.basename(f.path)),
      });
    }
    if (rd.length) redriven.push({ dir, first, rd });
    else edited.push({ dir, first, gap: Math.max(...outside.map((c) => gapOf(c.date, first))), n: outside.length });
  }

  say(`-- REDRIVEN units: ${redriven.length}`);
  let withCo = 0, withoutCo = 0;
  for (const r of redriven) {
    say(`   ${r.dir}  (first ${r.first})`);
    for (const e of r.rd) {
      const tag = e.coedited.length ? 'CO-EDITED' : 'OUTPUT-ONLY';
      if (e.coedited.length) withCo++; else withoutCo++;
      say(`      ${e.date} (+${e.gap}d) ${e.sha.slice(0, 8)} ${tag}`);
      say(`         .out rewritten:   ${e.outs.join(' ')}`);
      say(`         instrument edited same commit: ${e.coedited.length ? e.coedited.join(' ') : '(none)'}`);
    }
  }
  say(`   re-drive commits CO-EDITED: ${withCo} · OUTPUT-ONLY: ${withoutCo}`);
  say();
  say(`-- EDITED-not-redriven units: ${edited.length}`);
  for (const e of edited) say(`   gap=${String(e.gap).padStart(3)}d commits=${e.n}  ${e.dir}`);
  say();
}

console.log(out.join('\n'));
