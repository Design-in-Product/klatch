/**
 * unit-465refusalfate — arm C. ADDITIVE: arms A and B are not edited after their drives.
 *
 * Arm B's `P8` came back 300/198/102 against his 296/198/98 — four carriers and four unreadables
 * apart, with the readable half identical. Four is small enough that "close enough" is exactly the
 * wrong conclusion to publish, so this arm differences the population at HIS rev against HEAD
 * instead of reasoning about the gap.
 *
 * Two candidate causes, both measured, neither assumed:
 *   C1 — the TREE moved. He measured at `119d87c1`; this unit has pushed recordings since, and one
 *        of mine is itself a `VERDICT/0` carrier.
 *   C2 — the SCOPE differs. Arm B enumerated `docs/ scripts/ packages/`; his figure says "1188
 *        tracked .out recordings" without naming the roots.
 *
 * Both are read at his rev with his-rev content, so this is a pin, not a live read.
 */

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const HIS_REV = '119d87c1';

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) { refused.push(id); console.log(`  REFUSED ${id}  ${detail}`); }
  else if (ok) console.log(`  ok      ${id}  ${detail}`);
  else { red.push(id); console.log(`  RED     ${id}  ${detail}`); }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else { refuted.push(id); console.log(`  REFUTED ${id}  ${detail}`); }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const HEADLINE = /^[ \t]*VERDICT\//m;

// Whole-tree enumeration at a rev, no root list at all, so SCOPE cannot be the variable.
function census(rev) {
  const outs = git('ls-tree', '-r', '--name-only', '-z', rev)
    .split('\0').filter((p) => p.endsWith('.out'));
  let carriers = 0; let readable = 0; let unreadable = 0;
  const kinds = new Map();
  const members = [];
  for (const p of outs) {
    const text = git('show', `${rev}:${p}`);
    if (!HEADLINE.test(text)) continue;
    carriers += 1;
    members.push(p);
    const rv = readVerdict(text);
    if (rv.ok === true) readable += 1;
    else { unreadable += 1; kinds.set(rv.refusal, (kinds.get(rv.refusal) ?? 0) + 1); }
  }
  return { total: outs.length, carriers, readable, unreadable, kinds, members };
}

const his = census(HIS_REV);
const head = census('HEAD');

leg('C1', true,
  `WHOLE TREE at his rev ${HIS_REV}: .out total ${his.total} · carriers ${his.carriers} · ` +
  `readable ${his.readable} · unreadable ${his.unreadable} ${JSON.stringify(Object.fromEntries(his.kinds))}`);
leg('C2', true,
  `WHOLE TREE at HEAD: .out total ${head.total} · carriers ${head.carriers} · ` +
  `readable ${head.readable} · unreadable ${head.unreadable} ${JSON.stringify(Object.fromEntries(head.kinds))}`);

pred('P14', his.carriers === 296 && his.readable === 198 && his.unreadable === 98,
  `HIS 296/198/98 REPRODUCES EXACTLY at his own rev — so arm B's P8 refutation was the TREE moving ` +
  `under me, not his figure and not my key: ${his.carriers}/${his.readable}/${his.unreadable}`);

const added = head.members.filter((p) => !his.members.includes(p));
const removed = his.members.filter((p) => !head.members.includes(p));
console.log('          --- carriers added between his rev and HEAD, every one named');
for (const p of added) {
  const rv = readVerdict(git('show', `HEAD:${p}`));
  console.log(`          ${rv.ok === true ? 'readable  ' : `${rv.refusal}`.padEnd(10)} ${p}`);
}
leg('C3', removed.length === 0,
  `carriers added since his rev: ${added.length}; removed: ${removed.length} ${JSON.stringify(removed)}`);
leg('C4', added.length === head.carriers - his.carriers,
  `the whole gap is accounted for by named additions: ${added.length} added vs ` +
  `${head.carriers - his.carriers} carrier delta`);

const mine = added.filter((p) => p.includes('unit-465refusalfate-2026-11-14'));
leg('C5', true,
  `of the ${added.length} added carriers, ${mine.length} are THIS UNIT's own recordings ` +
  `(${mine.map((p) => p.split('/').pop()).join(', ')})`);
pred('P15', mine.length > 0,
  `at least one of the carriers that moved his figure is a recording THIS unit published while ` +
  `measuring his figure — the instrument is inside its own population: ${mine.length}`);

// Scope was arm B's other candidate. Measured, not assumed: the whole-tree count vs the
// three-root count at the SAME rev.
const threeRoot = git('ls-tree', '-r', '--name-only', '-z', 'HEAD', 'docs/', 'scripts/', 'packages/')
  .split('\0').filter((p) => p.endsWith('.out')).length;
leg('C6', true,
  `SCOPE was not the variable: whole tree at HEAD has ${head.total} \`.out\`, the three-root list ` +
  `has ${threeRoot} — delta ${head.total - threeRoot}`);
pred('P16', head.total === threeRoot,
  `every tracked \`.out\` in the repo lives under docs/, scripts/ or packages/, so arm B's root ` +
  `list was not the source of the gap: ${head.total} vs ${threeRoot}`);

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('C-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
  `preds=${preds.length} refuted=[${refuted}] prefused=[]`
);
process.exit(exit);
