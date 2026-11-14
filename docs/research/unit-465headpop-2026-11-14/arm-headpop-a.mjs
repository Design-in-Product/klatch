/**
 * unit-465headpop — arm A
 *
 * Grades Theseus's 11/14 §3 reason against my own published figure. His verdict ("your figures are
 * right, the defect is the label") is accepted; the reason under test is "your population
 * self-excludes your own unit directory".
 *
 * Every population here is pinned to a NAMED REV. The selector under test is keyed on `HEAD`, which
 * is the defect; this arm must not inherit it. `git` is always called with `-C` at the worktree
 * root, because `ls-tree` is cwd-sensitive.
 */
import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readVerdict, renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const PUBLISHING_REV = '119d87c1';
const PARENT_REV = '119d87c1^';

function git(args) {
  return execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
}

const legs = [];
const preds = [];
const check = (id, pred, why) => { legs.push({ id, ok: pred, why }); return pred; };
const pred = (id, landed, why) => { preds.push({ id, landed, why }); return landed; };

// --------------------------------------------------------------- the population, at a named rev

/** Tracked `.out` paths under docs/research/ at `rev`. Pinned: no HEAD anywhere. */
function outPathsAt(rev) {
  return git(['ls-tree', '-r', '--name-only', rev, 'docs/research/'])
    .split('\n')
    .map((s) => s.trim())
    .filter((p) => p.endsWith('.out'));
}

/**
 * Contents of many blobs at `rev`, via one `cat-file --batch`. Returns a Map path -> text.
 * Streaming rather than per-path `git show`, so 1191 paths is one process, not 1191.
 */
function blobsAt(rev, paths) {
  const input = paths.map((p) => `${rev}:${p}`).join('\n') + '\n';
  // No `encoding`: spawnSync then returns stdout as a Buffer, which is what the offset arithmetic
  // below needs. Setting `encoding: 'buffer'` would also be applied to `input` and throws.
  const r = spawnSync('git', ['-C', ROOT, 'cat-file', '--batch'], {
    input,
    maxBuffer: 1 << 30,
  });
  if (r.status !== 0) throw new Error(`cat-file exited ${r.status}: ${r.stderr}`);
  const buf = r.stdout;
  const out = new Map();
  let off = 0;
  let i = 0;
  while (off < buf.length && i < paths.length) {
    const nl = buf.indexOf(0x0a, off);
    if (nl < 0) break;
    const header = buf.slice(off, nl).toString('utf8');
    const m = header.match(/^([0-9a-f]{40}) (\w+) (\d+)$/);
    if (!m) throw new Error(`cat-file refused for ${paths[i]}: ${header}`);
    const size = Number(m[3]);
    const start = nl + 1;
    out.set(paths[i], buf.slice(start, start + size).toString('utf8'));
    off = start + size + 1; // trailing newline after the blob
    i += 1;
  }
  if (out.size !== paths.length) {
    throw new Error(`cat-file returned ${out.size} blobs for ${paths.length} paths`);
  }
  return out;
}

/** Carrier = at least one line beginning `VERDICT/`, the same key arm-schemacollide-b used. */
function measureAt(rev) {
  const paths = outPathsAt(rev);
  const texts = blobsAt(rev, paths);
  const carriers = [];
  let readable = 0;
  const unreadable = [];
  for (const p of paths) {
    const text = texts.get(p);
    const heads = text.split('\n').filter((l) => l.startsWith('VERDICT/'));
    if (heads.length === 0) continue;
    carriers.push(p);
    if (readVerdict(text).ok === true) readable += 1;
    else unreadable.push(p);
  }
  return { rev, total: paths.length, paths, carriers, readable, unreadable };
}

const parent = measureAt(PARENT_REV);
const pub = measureAt(PUBLISHING_REV);

console.log(`A-pop  ${PARENT_REV}      total=${parent.total} carriers=${parent.carriers.length} readable=${parent.readable} unreadable=${parent.unreadable.length}`);
console.log(`A-pop  ${PUBLISHING_REV}  total=${pub.total} carriers=${pub.carriers.length} readable=${pub.readable} unreadable=${pub.unreadable.length}`);

// ------------------------------------------------------------------------------- H1, H2, H3

check('A1', parent.total === 1188, `H1: tracked .out at ${PARENT_REV} = ${parent.total}, published denominator 1188`);
check('A2', parent.carriers.length === 296, `H2: carriers at ${PARENT_REV} = ${parent.carriers.length}, published 296`);
check('A3', parent.readable === 198, `H2: readable at ${PARENT_REV} = ${parent.readable}, published 198`);
check('A4', parent.unreadable.length === 98, `H2: unreadable at ${PARENT_REV} = ${parent.unreadable.length}, published 98`);

check('A5', pub.total === 1191, `H3: tracked .out at ${PUBLISHING_REV} = ${pub.total}, his arm C row 1191`);
check('A6', pub.carriers.length === 299, `H3: carriers at ${PUBLISHING_REV} = ${pub.carriers.length}, his 299`);
check('A7', pub.readable === 198, `H3: readable at ${PUBLISHING_REV} = ${pub.readable}, his 198`);
check('A8', pub.unreadable.length === 101, `H3: unreadable at ${PUBLISHING_REV} = ${pub.unreadable.length}, his 101`);

// ------------------------------------------------------- H4/H5: the delta is my own 3 recordings

const parentSet = new Set(parent.paths);
const added = pub.paths.filter((p) => !parentSet.has(p));
const pubSet = new Set(pub.paths);
const removed = parent.paths.filter((p) => !pubSet.has(p));

console.log(`A-delta added=${added.length} removed=${removed.length}`);
for (const p of added) console.log(`   + ${p}`);

const MINE = /^docs\/research\/unit-465schemacollide-2026-11-14\/drive[123]\.arm[abc]\.out$/;
check('A9', added.length === 3 && removed.length === 0, `H4: delta is exactly 3 added and 0 removed (added=${added.length}, removed=${removed.length})`);
check('A10', added.every((p) => MINE.test(p)), `H4: every added path is one of my own unit's drive recordings`);

const addedCarriers = added.filter((p) => pub.carriers.includes(p));
const addedUnreadable = added.filter((p) => pub.unreadable.includes(p));
check('A11', addedCarriers.length === 3, `H5: all 3 added paths are carriers (${addedCarriers.length} of 3)`);
check('A12', addedUnreadable.length === 3, `H5: all 3 added paths are unreadable (${addedUnreadable.length} of 3)`);
check('A13', parent.readable === pub.readable, `H5: readable is unchanged across the delta (${parent.readable} vs ${pub.readable}) — the delta moves denominator, carriers and unreadable, not readable`);

// ------------------------------- H6: the reason. Is the published selector rev-pinned, or not?

/**
 * The published selector VERBATIM, as it stands in arm-schemacollide-b.mjs:100-102 — keyed on the
 * literal `HEAD`. Its answer is whatever the clock says, which is the whole point.
 */
function publishedSelectorVerbatim() {
  return git(['ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/'])
    .split('\n')
    .map((s) => s.trim())
    .filter((p) => p.endsWith('.out')).length;
}
const liveHead = git(['rev-parse', '--short', 'HEAD']).trim();
const verbatimNow = publishedSelectorVerbatim();
console.log(`A-sel  published selector run now (HEAD=${liveHead}) -> ${verbatimNow}`);

// The selector contains no `THIS_UNIT` filter at all: read it out of the source, don't assert it.
const armSrc = git(['show', `${PUBLISHING_REV}:docs/research/unit-465schemacollide-2026-11-14/arm-schemacollide-b.mjs`]);
const selectorSpan = armSrc.slice(armSrc.indexOf('const tracked ='), armSrc.indexOf("filter((p) => p.endsWith('.out'))") + 40);
const thisUnitLines = armSrc.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes('THIS_UNIT') && !l.includes('const THIS_UNIT'));
console.log(`A-src  THIS_UNIT used at lines: ${thisUnitLines.map(([n]) => n).join(', ')}`);
console.log(`A-src  recordings selector span:\n${selectorSpan.split('\n').map((l) => '         ' + l).join('\n')}`);

check('A14', !/THIS_UNIT/.test(selectorSpan), `H6: the recordings selector span at ${PUBLISHING_REV} contains no THIS_UNIT filter — the self-exclusion is not on this population`);
check('A15', /HEAD/.test(selectorSpan), `H6: the recordings selector is keyed on the literal HEAD, so its answer is clock-dependent`);
check('A16', verbatimNow !== parent.total, `H6: the published selector run now returns ${verbatimNow}, not the ${parent.total} it returned when published — not rev-pinned`);
check('A17', verbatimNow >= pub.total, `H6: and it has kept growing since the publishing rev (${verbatimNow} >= ${pub.total})`);

// --------------------------------------------------------- H7: the two explanations are confusable

// His arithmetic route: whole tree at my rev, minus the 3 paths his `ls-tree` of my unit dir found.
const hisRoute = { total: pub.total - 3, carriers: pub.carriers.length - 3, unreadable: pub.unreadable.length - 3 };
check('A18',
  hisRoute.total === parent.total && hisRoute.carriers === parent.carriers.length && hisRoute.unreadable === parent.unreadable.length,
  `H7: his subtract-3 route and my parent-rev route agree exactly (${hisRoute.total}/${hisRoute.carriers}/${hisRoute.unreadable}) — numerically indistinguishable`);

pred('P-H1', parent.total === 1188, 'H1 — 1188 at the parent rev');
pred('P-H2', parent.carriers.length === 296 && parent.readable === 198 && parent.unreadable.length === 98, 'H2 — 296/198/98 all reproduce at the parent rev');
pred('P-H3', pub.total === 1191 && pub.carriers.length === 299 && pub.readable === 198 && pub.unreadable.length === 101, 'H3 — his arm C row for my rev reproduces under my key');
pred('P-H4', added.length === 3 && added.every((p) => MINE.test(p)), 'H4 — the delta is exactly my own three drive recordings');
pred('P-H5', addedCarriers.length === 3 && addedUnreadable.length === 3 && parent.readable === pub.readable, 'H5 — all 3 are carriers and unreadable; readable unchanged at 198');
pred('P-H6', !/THIS_UNIT/.test(selectorSpan) && /HEAD/.test(selectorSpan) && verbatimNow !== parent.total, 'H6 — the reason is refuted: no self-exclusion on this population, and the selector is keyed on run-time HEAD');
pred('P-H7', hisRoute.total === parent.total && hisRoute.carriers === parent.carriers.length, 'H7 — the two explanations are numerically indistinguishable on this unit');

console.log(renderVerdict({ legs, preds }));
process.exit(legs.some((l) => l.ok === false) ? 1 : 0);
