/**
 * P1 / P2 — the declaring population as a MEMBER LIST, read off the parsed registry object, at two
 * revs: the live tree and the parent of Daedalus's promotion commit.
 *
 * Object-level on purpose: the declarations are regex properties on the entry, and `unit-465declpop`
 * §2 established that a literal `skip:` grep cannot see what these arms key on. Member lists are
 * printed, never only counts — two keys sharing a denominator agree vacuously.
 *
 * The old rev is materialised into a scratch directory OUTSIDE the repo (`/tmp`), with its own copy
 * of `lib/strip-source.mjs` so the module's relative import resolves, so that nothing is written
 * into `scripts/` while the full sweep's census is live.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRATCH = join('/tmp', `u465declprose-${process.pid}`);

const git = (args) =>
  execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** `[file, declares a refusal, declares a skip]` per declaring entry, in list order. */
const pop = (SWEPT) =>
  SWEPT.filter((s) => s.refusal || s.skip).map((s) => [s.file, Boolean(s.refusal), Boolean(s.skip)]);

const report = (label, rev, SWEPT) => {
  const p = pop(SWEPT);
  console.log(`\n── ${label} (${rev}) ──`);
  console.log(`  SWEPT entries:        ${SWEPT.length}`);
  console.log(`  refusals:             ${SWEPT.filter((s) => s.refusal).length}`);
  console.log(`  skips:                ${SWEPT.filter((s) => s.skip).length}`);
  console.log(`  declaring either:     ${p.length}`);
  console.log(`  declaring both:       ${p.filter(([, r, s]) => r && s).length}`);
  console.log('  MEMBER LIST:');
  for (const [f, r, s] of p) console.log(`    ${f}  refusal=${r} skip=${s}`);
  return p;
};

// ── live ──
const live = await import(pathToFileURL(join(REPO, 'scripts', 'sweep-probes.mjs')).href);
const liveHead = git(['rev-parse', '--short', 'HEAD']).trim();
const livePop = report('LIVE TREE', liveHead, live.SWEPT);

// ── the parent of the promotion commit ──
const PROMOTION = '5063b5ae';
const parent = git(['rev-parse', '--short', `${PROMOTION}^`]).trim();
const promoSubject = git(['log', '--format=%s', '-1', PROMOTION]).trim();
console.log(`\npromotion commit ${PROMOTION}: ${promoSubject}`);
mkdirSync(join(SCRATCH, 'lib'), { recursive: true });
writeFileSync(
  join(SCRATCH, 'sweep-old.mjs'),
  git(['show', `${PROMOTION}^:scripts/sweep-probes.mjs`]),
  'utf8',
);
writeFileSync(
  join(SCRATCH, 'lib', 'strip-source.mjs'),
  git(['show', `${PROMOTION}^:scripts/lib/strip-source.mjs`]),
  'utf8',
);
const old = await import(pathToFileURL(join(SCRATCH, 'sweep-old.mjs')).href);
const oldPop = report('BEFORE THE PROMOTION', parent, old.SWEPT);
rmSync(SCRATCH, { recursive: true, force: true });

// ── landing ──
const expectedLive = [
  ['probe-round225-a-declared-refusal-is-not-a-skip.mts', true, true],
  ['probe-backfill-sidecar-neutrality.mts', false, true],
];
const matchesLoose = (p, names) =>
  p.length === names.length && p.every(([f], i) => f.includes(names[i][0]) && p[i][1] === names[i][1] && p[i][2] === names[i][2]);
const liveNames = [
  ['probe-round225', true, true],
  ['probe-backfill-sidecar-neutrality', false, true],
];
console.log('\n── landing ──');
console.log(`P1 live population is exactly [round225 (both), backfill-sidecar-neutrality (skip only)]: ${matchesLoose(livePop, liveNames)}`);
console.log(`P1 counts are SWEPT 44 / refusals 1 / skips 2 / either 2 / both 1: ${
  live.SWEPT.length === 44 &&
  live.SWEPT.filter((s) => s.refusal).length === 1 &&
  live.SWEPT.filter((s) => s.skip).length === 2 &&
  livePop.length === 2 &&
  livePop.filter(([, r, s]) => r && s).length === 1
}`);
console.log(`P2 pre-promotion population is a SINGLE member carrying BOTH patterns: ${
  oldPop.length === 1 && oldPop[0][1] === true && oldPop[0][2] === true
}`);
console.log(`P2 so "one refusal and one skip" never described two members: ${
  oldPop.length === 1 && oldPop[0][1] && oldPop[0][2]
}`);
void expectedLive;
