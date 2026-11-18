/**
 * unit-477ddlcolumns — arm C: pin the published figures at their OWN rev.
 *
 * Arm B re-measured the cure's movement at HEAD and got `block +252`,
 * `concise +288`, `refused −540`, which **balances exactly** (252 + 288 = 540).
 * My published figures were `+254`, `+289`, `−539`, which do not (543 vs 539).
 * So the excess of 4 that P8 predicted was non-additivity is arithmetic in at
 * least one of those three published numbers — but arm B cannot say WHICH,
 * because the tracked tree has grown from 975 files to 984 underneath it and a
 * figure measured over a different population is not a check on the first one.
 *
 * This arm removes that confound: both readers run over the tree **as it was at
 * `7e8b4ab1`**, the commit that published the figures. File list from
 * `git ls-tree`, contents from `git show <rev>:<path>` — nothing is read from the
 * working tree, so the population is the published one by construction.
 *
 * This is the "reproduce their figures under their own key" discipline applied
 * to my own figures, which is where it is least comfortable and most needed.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const PUBLISHED_REV = '7e8b4ab1';
const PRECURE_REV = `${PUBLISHED_REV}^`;
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);

let fails = 0;
const check = (/** @type {string} */ l, /** @type {boolean} */ ok, /** @type {string} */ n = '') => {
  console.log(`  ${ok ? 'green' : 'RED  '}  ${l}${n ? ` — ${n}` : ''}`);
  if (!ok) fails++;
};

const git = (/** @type {string[]} */ args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/* --- both readers, each materialised from git, both untracked --- */

const stripAbs = resolve(ROOT, 'scripts/lib/strip-source.mjs');
const materialise = (/** @type {string} */ rev, /** @type {string} */ tag) => {
  const raw = git(['show', `${rev}:scripts/lib/decl-body.mjs`]);
  const out = raw.replace(
    "import { stripSource } from './strip-source.mjs';",
    `import { stripSource } from ${JSON.stringify(stripAbs)};`
  );
  const p = resolve(HERE, `.tmp-precure-decl-body.mjs.${tag}.mjs`);
  writeFileSync(p, out);
  return { path: p, raw, rewritten: raw !== out };
};

// NOTE: the CURED reader is taken from `7e8b4ab1` too, not from HEAD. HEAD's
// copy happens to be identical (`git log -1 -- scripts/lib/decl-body.mjs` is
// 7e8b4ab1), but taking it from the rev means this arm does not depend on that
// staying true tomorrow.
const preMod = materialise(PRECURE_REV, 'pre');
const curMod = materialise(PUBLISHED_REV, 'cur');
const pre = await import(preMod.path);
const cur = await import(curMod.path);

console.log(`unit-477 arm C — the published figures, re-measured over the tree at ${PUBLISHED_REV}`);
check('both readers were rewritten at their single strip-source import', preMod.rewritten && curMod.rewritten);
check('the two readers differ', preMod.raw !== curMod.raw);
check(
  'HEAD`s decl-body.mjs is still the published one, so arm B and arm C read the same cure',
  git(['log', '-1', '--format=%h', '--', 'scripts/lib/decl-body.mjs']).trim() === PUBLISHED_REV,
  git(['log', '-1', '--format=%h', '--', 'scripts/lib/decl-body.mjs']).trim()
);

/* --- the tree AT THE REV, not the working tree --- */

const files = git(['ls-tree', '-r', '--name-only', PUBLISHED_REV])
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
  .filter((f) => EXTS.has(extname(f)));

console.log(`\npopulation at ${PUBLISHED_REV}: ${files.length} files of the tracked extensions`);
check('the population is the published 975, not HEAD`s 984', files.length === 975, `measured ${files.length}`);

const cells = new Map();
const classAfter = new Map();
let heads = 0;
let unreadable = 0;
for (const rel of files) {
  const r = spawnSync('git', ['-C', ROOT, 'show', `${PUBLISHED_REV}:${rel}`], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.status !== 0 || typeof r.stdout !== 'string') {
    unreadable++;
    continue;
  }
  const src = r.stdout;
  for (const h of cur.declHeads(src)) {
    heads++;
    const b = pre.declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    const a = cur.declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    cells.set(`${b.kind}→${a.kind}`, (cells.get(`${b.kind}→${a.kind}`) ?? 0) + 1);
    if (b.kind === 'refused' && b.reason === 'return-type-annotation-on-an-arrow-declaration') {
      classAfter.set(a.kind, (classAfter.get(a.kind) ?? 0) + 1);
    }
  }
}
check('every file in the population was readable at the rev', unreadable === 0, `${unreadable} unreadable`);

const total = (/** @type {string} */ side, /** @type {string} */ kind) => {
  let n = 0;
  for (const [k, v] of cells) {
    const [b, a] = k.split('→');
    if ((side === 'before' ? b : a) === kind) n += v;
  }
  return n;
};

console.log(`\nCROSS-TAB at ${PUBLISHED_REV} (${heads} heads)`);
for (const [k, n] of [...cells.entries()].sort((x, y) => y[1] - x[1])) {
  console.log(`  ${String(n).padStart(5)}  ${k}`);
}

console.log(`\nTHE THREE PUBLISHED FIGURES, each against its own rev`);
const published = [
  ['refused', 1510, 971],
  ['block', 4013, 4267],
  ['concise', 1828, 2117],
];
const wrong = [];
for (const [kind, pb, pa] of published) {
  const mb = total('before', kind);
  const ma = total('after', kind);
  const ok = mb === pb && ma === pa;
  if (!ok) wrong.push(`${kind}: published ${pb}→${pa}, measured ${mb}→${ma}`);
  console.log(
    `  ${kind.padEnd(8)} published ${pb} → ${pa}  ·  measured ${mb} → ${ma}  ·  ${ok ? 'EXACT' : `OFF BY ${mb - pb} / ${ma - pa}`}`
  );
}

const dBlock = total('after', 'block') - total('before', 'block');
const dConcise = total('after', 'concise') - total('before', 'concise');
const dRefused = total('before', 'refused') - total('after', 'refused');
console.log(`\nDOES IT BALANCE AT THE REV?`);
console.log(`  block +${dBlock} · concise +${dConcise} · sum ${dBlock + dConcise} · refusals cleared ${dRefused} · excess ${dBlock + dConcise - dRefused}`);
check(
  'the cure is purely additive at its own rev (block + concise gained == refusals cleared)',
  dBlock + dConcise === dRefused,
  `excess ${dBlock + dConcise - dRefused}`
);
console.log(`\nTHE CLASS AT THE REV: ${[...classAfter.entries()].map(([k, n]) => `${k}=${n}`).join(' · ')}`);

if (wrong.length) {
  console.log(`\nMIS-PUBLISHED FIGURES (${wrong.length} of 3):`);
  for (const w of wrong) console.log(`  ${w}`);
} else {
  console.log(`\nAll three published figures are exact at their own rev.`);
}

console.log(`\n${fails === 0 ? 'ARM C GREEN' : `ARM C — ${fails} RED leg(s)`}`);
process.exitCode = fails === 0 ? 0 : 1;
