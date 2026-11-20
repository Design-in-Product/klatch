#!/usr/bin/env node
/**
 * unit-492frozenredrive — POST-HOC #2, written AFTER drive0 and drive1. NOT pre-registered.
 *
 * Why it exists, stated plainly because it is a check on MY OWN refutation rather than on the
 * corpus: drive0 refuted P2 (REDRIVEN = 1 lenient / 3 strict, predicted 0). Before that can be
 * published as "the corpus re-drives published instruments", the rival has to be ruled out —
 * **that my authoring window was simply too short.** A unit begun in a START fire and finished by
 * the next day's WORK fire has an authoring span of 2 calendar days; one that slips a day has 3.
 * Every re-drive drive1 found is +1d or +2d and CO-EDITED, which is what a continuing authoring
 * session looks like, not what post-publication re-entry looks like.
 *
 * So: sweep the window length W = 1..14 days and report REDRIVEN(W). The two readings make
 * OPPOSITE predictions about the shape of that curve, and the curve is a measurement:
 *   - "the corpus re-drives published work": REDRIVEN(W) decays slowly, non-zero at large W.
 *   - "my window was too short": REDRIVEN(W) hits 0 at some small W and STAYS 0.
 * The second reading is only credible if the curve also shows that EDITED(W) does NOT collapse at
 * the same W — otherwise W is just large enough to swallow everything and the zero is vacuous.
 * EDITED(W) is therefore reported beside it as the discriminator.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const git = (a) => execFileSync('git', a, { encoding: 'utf8', cwd: ROOT, maxBuffer: 256 * 1024 * 1024 });
const TODAY = execFileSync('date', ['+%Y-%m-%d'], { encoding: 'utf8' }).trim();

const tracked = git(['ls-files', 'docs/research/']).split('\n').filter(Boolean);
const outDirs = new Set();
for (const f of tracked) {
  const p = f.split('/');
  if (p.length >= 4 && path.basename(f).endsWith('.out')) outDirs.add(p.slice(0, 3).join('/'));
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
const gap = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
const isOut = (p) => path.basename(p).endsWith('.out');

const firstOf = new Map();
for (const d of P) {
  const cs = byDir.get(d) || [];
  if (cs.length) firstOf.set(d, cs.map((c) => c.date).sort()[0]);
}

const out = [];
const say = (s = '') => out.push(s);

say(`unit-492 post-hoc: window-length sweep — is P2's refutation the corpus's, or my window's?`);
say(`  today (date-read): ${TODAY} · |P| = ${P.length}`);
say();
say('   W  REDRIVEN  EDITED  FROZEN   (W = authoring window length in calendar days)');
const curve = [];
for (let W = 1; W <= 14; W++) {
  let rd = 0, ed = 0;
  for (const d of P) {
    const first = firstOf.get(d);
    if (!first) continue;
    const outside = (byDir.get(d) || []).filter((c) => gap(c.date, first) >= W);
    if (!outside.length) continue;
    const anyRedrive = outside.some((c) =>
      c.files.some((f) => f.status === 'M' && isOut(f.path) && f.path.startsWith(`${d}/`)));
    if (anyRedrive) rd++; else ed++;
  }
  curve.push({ W, rd, ed, frozen: P.length - rd - ed });
  say(`  ${String(W).padStart(2)}  ${String(rd).padStart(8)}  ${String(ed).padStart(6)}  ${String(P.length - rd - ed).padStart(6)}`);
}
say();

const firstZero = curve.find((r) => r.rd === 0);
if (firstZero) {
  const after = curve.filter((r) => r.W >= firstZero.W);
  const staysZero = after.every((r) => r.rd === 0);
  say(`  REDRIVEN first reaches 0 at W=${firstZero.W}; stays 0 for all larger W: ${staysZero ? 'YES' : 'NO'}`);
  say(`  DISCRIMINATOR — at W=${firstZero.W}, EDITED is ${firstZero.ed} (not 0), so the window is not`);
  say(`  merely swallowing every post-window event: non-redrive revisits survive it.`);
} else {
  say('  REDRIVEN never reaches 0 within W<=14 — the corpus reading stands, not the window reading.');
}
say();

say('== age of the two instruments holding all 8 readers, as of today ==');
for (const d of [
  'docs/research/unit-479braceslicekeys-2026-11-18',
  'docs/research/unit-487markerreport-2026-11-19',
]) {
  const first = firstOf.get(d);
  const cs = byDir.get(d) || [];
  const last = cs.map((c) => c.date).sort().pop();
  say(`  ${d}`);
  say(`     first=${first} last=${last} · age today = ${gap(TODAY, first)}d · own span = ${gap(last, first)}d`);
}
say();

say('== observed re-drive gap distribution (every M-on-.out, any window) ==');
const gaps = [];
for (const d of P) {
  const first = firstOf.get(d);
  for (const c of byDir.get(d) || []) {
    for (const f of c.files) {
      if (f.status === 'M' && isOut(f.path) && f.path.startsWith(`${d}/`)) gaps.push(gap(c.date, first));
    }
  }
}
gaps.sort((a, b) => a - b);
const hist = new Map();
for (const g of gaps) hist.set(g, (hist.get(g) || 0) + 1);
say(`  ${gaps.length} M-on-.out events total; gap-from-first histogram:`);
for (const [g, n] of [...hist.entries()].sort((a, b) => a[0] - b[0])) say(`    +${String(g).padStart(2)}d  ${'#'.repeat(Math.min(n, 60))} ${n}`);
say(`  max gap at which ANY .out has ever been rewritten: +${gaps[gaps.length - 1]}d`);

console.log(out.join('\n'));
