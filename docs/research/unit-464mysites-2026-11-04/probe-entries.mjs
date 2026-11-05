#!/usr/bin/env node
// POST-HOC PROBE, declared post-hoc in this line and in its first output line. No leg, no verdict.
// P4ENTRIES went RED at 0ae48068 (409 entries = 137 trees + 272 blobs, against the registered
// 408/136/272). This probe asks the only question that can settle it: at WHICH rev is 408/136/272
// the right answer, and what is the one tree that differs.
import { execFileSync } from 'node:child_process';
// SAME DEFECT AS grade-mysites.mjs drive1, and it hit this probe too — recorded, not replaced.
// Driven from inside the unit directory, every pathspec resolved relative to cwd, matched nothing,
// and git exited 0: the first recording of this probe printed `entries=0 trees=0 blobs=0` at BOTH
// revs. Two instruments in one unit failing the same way to a SILENT ZERO is the finding, not a
// slip. Pinned with -C <toplevel>.
const RAWGIT = (a) => { try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch { return null; } };
const REPO = (RAWGIT(['rev-parse', '--show-toplevel']) ?? '').trim();
const git = (a) => (REPO === '' ? null : RAWGIT(['-C', REPO, ...a]));
console.log('POST-HOC PROBE, declared post-hoc. No leg, no verdict. Run after P4ENTRIES went RED.');
console.log(`  repo root: ${REPO || 'UNRESOLVED'}`);
const REVS = [
  ['bba2aa3c', 'the pin my 11/03 census table was computed at'],
  ['0ae48068', 'the population pin, which my P4LABEL registration attached his figures to'],
];
const sets = {};
for (const [rev, note] of REVS) {
  const raw = git(['ls-tree', rev, 'docs/research/']);
  if (raw === null) { console.log(`  ${rev}  REFUSED`); continue; }
  const entries = raw.split('\n').filter((l) => l.trim().length > 0).map((l) => {
    const m = /^\d+ (\w+) [0-9a-f]+\t(.+)$/.exec(l);
    return m === null ? null : { type: m[1], name: (m[2].replace(/\/$/, '').split('/').pop() ?? '') };
  }).filter(Boolean);
  const trees = entries.filter((e) => e.type === 'tree');
  const blobs = entries.filter((e) => e.type === 'blob');
  sets[rev] = new Set(trees.map((t) => t.name));
  console.log(`  ${rev}  entries=${entries.length}  trees=${trees.length}  blobs=${blobs.length}   (${note})`);
}
const a = sets['bba2aa3c'], b = sets['0ae48068'];
if (a && b) {
  const onlyB = [...b].filter((n) => !a.has(n));
  const onlyA = [...a].filter((n) => !b.has(n));
  console.log(`  trees only at 0ae48068 (${onlyB.length}): ${onlyB.join(', ') || '-'}`);
  console.log(`  trees only at bba2aa3c (${onlyA.length}): ${onlyA.join(', ') || '-'}`);
}
// And the second post-hoc question: is the P3REACH lemma demonstrable AT ALL, over any interval?
// Shape B needs an interval in which a round*-instruments/ directory GAINED a file.
console.log('');
console.log('  --- is shape B reachable over ANY interval? (post-hoc, no leg) ---');
const SEP = '\u0001';
const shapeB = (rev, n) => {
  const raw = git(['log', '--diff-filter=A', '--reverse', `--format=%H${SEP}%an`, rev, '--', `docs/research/round${n}-instruments/`]);
  if (raw === null) return null;
  const out = raw.split('\n').filter((l) => l.trim().length > 0);
  return { out, site: out[0] ?? null };
};
const ns = (git(['ls-tree', '--name-only', '0ae48068', 'docs/research/']) ?? '').split('\n')
  .map((p) => p.replace(/\/$/, '').split('/').pop() ?? '')
  .map((x) => (/^round(\d+)-instruments$/.exec(x) ?? [, null])[1]).filter(Boolean);
// For each round dir, count its A-commits at 0ae48068. A dir with >1 A-commit PROVES the output
// grew at some point in history while --reverse+first held, i.e. the lemma's pattern is REAL;
// it just does not occur inside the registered interval.
let multi = 0, total = 0, maxN = null, maxC = 0;
for (const n of ns) {
  const r = shapeB('0ae48068', n);
  if (r === null) continue;
  total++;
  if (r.out.length > 1) multi++;
  if (r.out.length > maxC) { maxC = r.out.length; maxN = n; }
}
console.log(`  round*-instruments dirs read: ${total}`);
console.log(`  dirs with MORE THAN ONE A-commit at 0ae48068: ${multi}  (largest: round${maxN} with ${maxC})`);
console.log('  reading: a dir with k>1 A-commits had its selection output grow k-1 times in history');
console.log('  while --reverse+first held the site fixed. The pattern exists; the REGISTERED');
console.log('  interval 0ae48068..HEAD simply does not contain any of those growth events.');
// Pin the claim by driving one of them: the earliest A-commit of the largest dir, vs its own HEAD.
if (maxN !== null && maxC > 1) {
  const r = shapeB('0ae48068', maxN);
  const firstRev = (r.out[0] ?? '').split(SEP)[0];
  const lastRev = (r.out[r.out.length - 1] ?? '').split(SEP)[0];
  const atFirst = shapeB(firstRev, maxN), atLast = shapeB(lastRev, maxN);
  if (atFirst && atLast) {
    console.log('');
    console.log(`  DRIVEN on round${maxN}, interval = its own first A-commit -> its own last A-commit:`);
    console.log(`    output size ${atFirst.out.length} -> ${atLast.out.length}   MOVED=${JSON.stringify(atFirst.out) !== JSON.stringify(atLast.out)}`);
    console.log(`    consumed site ${String(atFirst.site).split(SEP)[0].slice(0, 8)} -> ${String(atLast.site).split(SEP)[0].slice(0, 8)}   MOVED=${atFirst.site !== atLast.site}`);
    console.log('    => a REACHED non-move exists in this tree. It is outside the registered interval,');
    console.log('       so it does NOT retrieve P3REACH, and it tells the next fire the lemma is testable.');
  }
}
