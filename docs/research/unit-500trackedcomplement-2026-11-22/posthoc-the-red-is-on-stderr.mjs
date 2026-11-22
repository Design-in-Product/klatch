// unit-500trackedcomplement post-hoc 2, Daedalus, 2026-11-22 START fire.
//
// `posthoc-what-the-red-says.mjs` read STDOUT only, and so did P3's pre-registered predicate
// ("the plant's repo-relative path appears in the gate's stdout"). The gate publishes its green
// report through `emit` -> `console.log` and its RED report through `emitErr` -> `console.error`
// (source lines 590-591, 744-767). P3 is therefore REFUTED AS WRITTEN, and the defect is in my
// predicate's choice of stream, not in the gate.
//
// This re-drives the same tracked arm capturing BOTH streams, so the gate's red channel is measured
// instead of being assumed absent, and so the two captures the first post-hoc wrote are not left as
// the unit's only record of what a red says.
import { writeFileSync, existsSync, unlinkSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const UNIT = 'docs/research/unit-500trackedcomplement-2026-11-22';
const CAP = join(UNIT, 'captures');
const GATE = 'scripts/verify-decl-body-slicers.mjs';
const PLANT = join(UNIT, 'plant-unguarded-slicer.mjs');

const OPEN = String.fromCharCode(123);
const CLOSE = String.fromCharCode(125);
const Q = String.fromCharCode(39);

const git = (...a) => spawnSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });
const drive = () => spawnSync('node', [GATE], { cwd: ROOT, encoding: 'buffer' });

const plantSource = [
  `export function bodyOf(src, declStart) ${OPEN}`,
  `  const open = src.indexOf(${Q}${OPEN}${Q}, declStart);`,
  '  let depth = 0;',
  `  for (let i = open; i < src.length; i++) ${OPEN}`,
  `    if (src[i] === ${Q}${OPEN}${Q}) depth += 1;`,
  `    else if (src[i] === ${Q}${CLOSE}${Q}) ${OPEN}`,
  '      depth -= 1;',
  `      if (depth === 0) return src.slice(open, i + 1);`,
  `    ${CLOSE}`,
  `  ${CLOSE}`,
  `  return ${Q}${Q};`,
  `${CLOSE}`,
  '',
].join('\n');

mkdirSync(join(ROOT, CAP), { recursive: true });
let green, red;
try {
  green = drive();
  writeFileSync(join(ROOT, CAP, 'gate-green-both-streams.out'), green.stdout);
  writeFileSync(join(ROOT, CAP, 'gate-green-both-streams.err'), green.stderr);
  writeFileSync(join(ROOT, PLANT), plantSource);
  git('add', '-N', PLANT);
  red = drive();
  writeFileSync(join(ROOT, CAP, 'gate-red-both-streams.out'), red.stdout);
  writeFileSync(join(ROOT, CAP, 'gate-red-both-streams.err'), red.stderr);
} finally {
  git('reset', '-q', '--', PLANT);
  if (existsSync(join(ROOT, PLANT))) unlinkSync(join(ROOT, PLANT));
}

const rOut = red.stdout.toString();
const rErr = red.stderr.toString();
console.log(`green  rc=${green.status}  stdout=${green.stdout.length}B  stderr=${green.stderr.length}B`);
console.log(`red    rc=${red.status}  stdout=${red.stdout.length}B  stderr=${red.stderr.length}B`);
console.log('');
console.log('P3 as PRE-REGISTERED (path in STDOUT) :', rOut.includes(PLANT));
console.log('P3 at the gate\'s actual red channel   :', rErr.includes(PLANT));
console.log('new-slicer count announced on stderr  :', /RED — (\d+) new hand-rolled/.exec(rErr)?.[1] ?? 'none');
console.log('all three clearing routes printed     :', ['decl-body.mjs', 'at the site', 'baseline'].every((s) => rErr.includes(s)));
console.log('');
console.log('--- the gate\'s stderr under the tracked plant, verbatim ---');
console.log(rErr.trimEnd());
console.log('--- end ---');
console.log('');
// The emit split, read off the source rather than inferred from the behaviour above.
const src = readFileSync(join(ROOT, GATE), 'utf8');
const emitDef = src.match(/^const emit = .*$/m)?.[0];
const emitErrDef = src.match(/^const emitErr = .*$/m)?.[0];
console.log('emit    :', emitDef);
console.log('emitErr :', emitErrDef);
console.log('emitErr call sites :', (src.match(/emitErr\(/g) || []).length - 1);
console.log('');
console.log('plant removed / index clean :', !existsSync(join(ROOT, PLANT)), '/', git('ls-files', '--error-unmatch', PLANT).status !== 0);
