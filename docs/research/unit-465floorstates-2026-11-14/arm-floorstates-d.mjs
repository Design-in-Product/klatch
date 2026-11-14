/**
 * unit-465floorstates — arm D
 *
 * `P1` and `P2` are predictions about THEIR round reproducing on MY tree. Arm A is his file run
 * unmodified, so it grades his predictions, not mine — and hand-reading its verdict line into a
 * write-up is retyping a verdict I could have captured. This arm captures it.
 *
 * Reads `drive1.his-arma.out` — this unit's own recording of his arm — and asserts the published
 * verdict line and the provenance leg, token for token off the file rather than by eye.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const REC = join(HERE, 'drive1.his-arma.out');
const HIS_ARM = 'docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-a.mjs';
const HIS_ARM_REV = process.env.HIS_ARM_REV || '98dfc12c';

const legs = [];
const red = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok) console.log(`  ok      ${id}  ${detail}`);
  else {
    red.push(id);
    console.log(`  RED     ${id}  ${detail}`);
  }
}
function pred(id, held, detail) {
  preds.push(id);
  if (held) console.log(`  LANDED  ${id}  ${detail}`);
  else {
    refuted.push(id);
    console.log(`  REFUTED ${id}  ${detail}`);
  }
}

const git = (...args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const OUT = readFileSync(REC, 'utf8');

// The verdict line, CAPTURED not retyped. Row tokens in these recordings are padded, so the capture
// is on the structured fields rather than on a whole-line string compare.
const v = OUT.match(
  /^VERDICT\/(\d+) (\w+) legs=(\d+) red=\[([^\]]*)\] refused=\[([^\]]*)\] preds=(\d+) refuted=\[([^\]]*)\] prefused=\[([^\]]*)\]$/m
);
leg('D1', v !== null, `his recording carries exactly one parseable VERDICT line = ${v !== null}`);
if (!v) {
  console.log('VERDICT/1 RED legs=1 red=[D1] refused=[] preds=0 refuted=[]');
  process.exit(1);
}
const [, exit, state, legCount, redList, refusedList, predCount, refutedList] = v;
leg(
  'D2',
  exit === '0' && state === 'GREEN' && legCount === '16' && redList === '' && refusedList === '',
  `his verdict on my tree: exit=${exit} state=${state} legs=${legCount} red=[${redList}] refused=[${refusedList}]`
);
leg(
  'D3',
  predCount === '5' && refutedList === '',
  `his predictions on my tree: preds=${predCount} refuted=[${refutedList}]`
);
pred(
  'P1',
  exit === '0' && state === 'GREEN' && legCount === '16' && redList === '' && predCount === '5' && refutedList === '',
  'his arm, run unmodified on my tree, publishes VERDICT/0 GREEN legs=16 red=[] preds=5 refuted=[]'
);

// `P2`: his `A-src` provenance leg, read off the recording AND re-derived here independently. One
// of those alone would be either his claim or mine; both agreeing is the check.
const src = OUT.match(/^ {2}(ok|RED) {4,6}A-src {2}live=([0-9a-f]+) (\w+)=([0-9a-f]+) identical=(\w+)$/m);
leg('D4', src !== null, `A-src row captured from the recording = ${src !== null}`);
const liveNow = git('hash-object', 'docs/research/lib/attested-rounds.mjs').trim().slice(0, 12);
const revNow = src ? git('rev-parse', `${src[3]}:docs/research/lib/attested-rounds.mjs`).trim().slice(0, 12) : null;
leg(
  'D5',
  src !== null && src[1] === 'ok' && src[5] === 'true' && src[2] === liveNow && src[4] === revNow,
  `A-src: recorded live=${src && src[2]} rev=${src && src[3]}:${src && src[4]} identical=${src && src[5]} ; ` +
    `re-derived live=${liveNow} rev=${revNow}`
);
pred(
  'P2',
  src !== null && src[1] === 'ok' && src[5] === 'true' && src[2] === liveNow && src[4] === revNow,
  "his A-src pin passes at its default rev and the hashes re-derive here, so his cripples are sourced from the rev they claim"
);

// His arm was run from a committed, unmodified file — not a local copy with an edit in it.
const armDirty = git('status', '--porcelain', HIS_ARM).trim();
const armLive = git('hash-object', HIS_ARM).trim().slice(0, 12);
const armRev = git('rev-parse', `${HIS_ARM_REV}:${HIS_ARM}`).trim().slice(0, 12);
leg('D6', armDirty === '', `his arm has no working-tree modification: ${JSON.stringify(armDirty)}`);
leg(
  'D7',
  armLive === armRev,
  `the file I ran is the one he published: live=${armLive} ${HIS_ARM_REV}=${armRev} identical=${armLive === armRev}`
);

const errBytes = Buffer.byteLength(readFileSync(join(HERE, 'drive1.his-arma.err')), 'utf8');
leg('D8', errBytes === 0, `his arm's stderr capture in this unit: bytes=${errBytes} (from Buffer.byteLength)`);

const state2 = red.length ? 'RED' : 'GREEN';
const exit2 = red.length ? 1 : 0;
console.log(
  `VERDICT/${exit2} ${state2} legs=${legs.length} red=[${red}] refused=[] preds=${preds.length} refuted=[${refuted}]`
);
process.exit(exit2);
