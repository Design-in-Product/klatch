// unit-500trackedcomplement post-hoc, Daedalus, 2026-11-22 START fire.
//
// P3 came back FALSE: the complement arm reddens (rc=1) but the plant's path is NOT in the gate's
// stdout, and the red report is SHORTER than the green one (3935 bytes / 38 lines vs 4160 / 41).
// A gate that reddens without naming the file it reddened on is the finding, so this re-drives the
// tracked arm, saves the red capture, and diffs it against the green one line by line to establish
// the mechanism rather than guess at it.
//
// Same hazard discipline as the arm: no quoted one-character brace comparison in this file, and the
// exemption token is assembled from parts.
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
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
  writeFileSync(join(ROOT, CAP, 'gate-green-no-plant.out'), green.stdout);
  writeFileSync(join(ROOT, PLANT), plantSource);
  git('add', '-N', PLANT);
  red = drive();
  writeFileSync(join(ROOT, CAP, 'gate-red-tracked-plant.out'), red.stdout);
} finally {
  git('reset', '-q', '--', PLANT);
  if (existsSync(join(ROOT, PLANT))) unlinkSync(join(ROOT, PLANT));
}

const g = green.stdout.toString().split('\n');
const r = red.stdout.toString().split('\n');
console.log(`green rc=${green.status} bytes=${green.stdout.length} lines=${g.length - 1}`);
console.log(`red   rc=${red.status} bytes=${red.stdout.length} lines=${r.length - 1}`);
console.log(`\nplant path anywhere in the RED stdout : ${red.stdout.toString().includes(PLANT)}`);
console.log(`plant BASENAME anywhere in the RED    : ${red.stdout.toString().includes('plant-unguarded-slicer')}`);
console.log(`the word "unit-500" in the RED        : ${red.stdout.toString().includes('unit-500')}`);

const gs = new Set(g);
const rs = new Set(r);
console.log('\nlines present in RED and absent from GREEN:');
for (const l of r) if (!gs.has(l)) console.log('  +', JSON.stringify(l));
console.log('\nlines present in GREEN and absent from RED:');
for (const l of g) if (!rs.has(l)) console.log('  -', JSON.stringify(l));

// How many of the gate's own emit sites can print a population member's path at all?
const src = readFileSync(join(ROOT, GATE), 'utf8');
const emits = [...src.matchAll(/^\s*(console\.log|console\.error|out\w*\(|say\(|print\w*\()/gm)].length;
console.log(`\nemit-shaped sites in the gate source  : ${emits}`);
console.log(`captures written                      : ${CAP}/gate-green-no-plant.out, ${CAP}/gate-red-tracked-plant.out`);
console.log(`plant removed / index clean           : ${!existsSync(join(ROOT, PLANT))} / ${git('ls-files', '--error-unmatch', PLANT).status !== 0}`);
