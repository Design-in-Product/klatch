/**
 * unit-501redbranchpin — declared POST-HOC, not pre-registered.
 *
 * P6 was registered as *"the red stdout will reproduce Daedalus's 3935 B / 38 lines exactly, and
 * that reproduction will be protected by digit width rather than by a property."* It HIT. This
 * post-hoc reads the stronger version of the same fact off captures that were **already in the
 * repository before this unit existed**, so it needs no drive and no plant:
 *
 *   1. His GREEN capture and mine are both exactly 4160 bytes and are NOT the same bytes.
 *   2. His RED capture and mine are both exactly 3935 bytes and are NOT the same bytes.
 *   3. His RED stderr is 742 B and mine is 722 B, and the difference is exactly the difference in
 *      the two plants' repo-relative path lengths — P1 confirmed a second time, across units,
 *      against HIS published figure, without re-running his plant.
 *
 * Reads committed captures only. Drives nothing, writes nothing outside this unit's directory.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const U500 = resolve(ROOT, 'docs/research/unit-500trackedcomplement-2026-11-22/captures');
const U501 = resolve(HERE, 'captures');

const read = (p) => readFileSync(p, 'utf8');
const out = [];
const say = (s) => { out.push(s); console.log(s); };

const diff = (a, b, label, aName, bName) => {
  const A = a.split('\n');
  const B = b.split('\n');
  const moved = [];
  for (let i = 0; i < Math.max(A.length, B.length); i += 1) if (A[i] !== B[i]) moved.push([i + 1, A[i], B[i]]);
  say(`### ${label}`);
  say('');
  say(`  ${aName}: ${Buffer.byteLength(a)} B`);
  say(`  ${bName}: ${Buffer.byteLength(b)} B`);
  say(`  byte counts equal : ${Buffer.byteLength(a) === Buffer.byteLength(b)}`);
  say(`  BYTES equal       : ${a === b}`);
  say(`  differing lines   : ${moved.length}`);
  for (const [l, x, y] of moved) {
    say(`    L${l}  ${aName}: ${JSON.stringify(x)}`);
    say(`    L${l}  ${bName}: ${JSON.stringify(y)}`);
    say(`          byte widths ${Buffer.byteLength(x ?? '')} / ${Buffer.byteLength(y ?? '')}`);
  }
  say('');
  return { equalCount: Buffer.byteLength(a) === Buffer.byteLength(b), equalBytes: a === b, moved };
};

say('# unit-501 post-hoc — the byte figures two seats have published, diffed against each other');
say('');
say('No drive, no plant. Every input below was committed before this unit existed.');
say('');

const green = diff(
  read(resolve(U500, 'gate-post-commit.out')),
  read(resolve(U501, 'd0-green-baseline.out')),
  '1. GREEN stdout — his `unit-500` post-commit capture vs my `unit-501` D0',
  'daedalus', 'theseus',
);

const red = diff(
  read(resolve(U500, 'gate-red-tracked-plant.out')),
  read(resolve(U501, 'd1-red-plant-a.out')),
  '2. RED stdout — his tracked-plant capture vs my D1',
  'daedalus', 'theseus',
);

say('### 3. RED stderr — the path-length law, confirmed against HIS published figure');
say('');
const hisErr = read(resolve(U500, 'gate-red-both-streams.err'));
const myErr = read(resolve(U501, 'd1-red-plant-a.err'));
const HIS_PLANT = 'docs/research/unit-500trackedcomplement-2026-11-22/plant-unguarded-slicer.mjs';
const MY_PLANT = 'docs/research/unit-501redbranchpin-2026-11-22/plant-a.mjs';
// The paths are not typed as constants to be trusted: each is asserted present in its own capture.
if (!hisErr.includes(HIS_PLANT)) throw new Error('REFUSE — his plant path is not in his own stderr capture');
if (!myErr.includes(MY_PLANT)) throw new Error('REFUSE — my plant path is not in my own stderr capture');
const byteDelta = Buffer.byteLength(hisErr) - Buffer.byteLength(myErr);
const pathDelta = HIS_PLANT.length - MY_PLANT.length;
say(`  his stderr ${Buffer.byteLength(hisErr)} B · his plant path ${HIS_PLANT.length} chars`);
say(`  my  stderr ${Buffer.byteLength(myErr)} B · my  plant path ${MY_PLANT.length} chars`);
say(`  byte delta ${byteDelta} · path delta ${pathDelta} · agree: ${byteDelta === pathDelta}`);
say(`  line counts: his ${hisErr.replace(/\n$/, '').split('\n').length} · mine ${myErr.replace(/\n$/, '').split('\n').length}`);
say('');

say('## Reading');
say('');
say(`A pin on 4160 is satisfied by two captures that are not the same bytes (${green.equalCount} / ${green.equalBytes}).`);
say(`A pin on 3935 is satisfied by two captures that are not the same bytes (${red.equalCount} / ${red.equalBytes}).`);
say('In both cases the only moved line is `tracked files read`, and it moved inside its digit width.');
say('');
say('So the question "should the red branch\'s 742 bytes join the pin" has a narrower answer than');
say('either seat posed: a BYTE figure is not a pin on either stream of this gate. On stdout it is a');
say('pin that a content change can satisfy; on stderr it is a function of the path length of whatever');
say('file happened to redden it. What is pinnable is CONTENT — named figures on stdout, and');
say('path/count/routes on stderr — plus the stderr line formula.');

writeFileSync(resolve(U501, 'posthoc-crossunit-byte-figures.out'), `${out.join('\n')}\n`);
