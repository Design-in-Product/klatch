/**
 * unit-465schemacollide — arm A
 *
 * Two spellings of the same published headline live in this corpus:
 *
 *   docs/research/lib/verdict.mjs   `VERDICT/1 ok …`     — the number is a SCHEMA VERSION
 *   the hand-rolled arms            `VERDICT/0 GREEN …`  — the number is a PROCESS EXIT CODE
 *
 * The reader in the same module checks the schema BEFORE the token, so the question this arm drives
 * is whether `readVerdict` accepts exactly the hand-rolled runs that FAILED.
 *
 * Nothing here is taken from a comment: both emitters are read from source, the reader is driven on
 * literal headlines, and the census population comes from `git ls-tree` with `-C` pinned.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA, topToken, readVerdict, renderVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');

const legs = [];
const red = [];
const refused = [];
const preds = [];
const refuted = [];

function leg(id, ok, detail) {
  legs.push(id);
  if (ok === null) {
    refused.push(id);
    console.log(`  REFUSED ${id}  ${detail}`);
  } else if (ok) {
    console.log(`  ok      ${id}  ${detail}`);
  } else {
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

// ------------------------------------------------- Q1: what the library's number and token mean

leg('A1', SCHEMA === 'VERDICT/1', `verdict.mjs SCHEMA = ${JSON.stringify(SCHEMA)}`);
const tokens = [topToken([], []), topToken(['x'], []), topToken([], ['y'])];
leg(
  'A2',
  JSON.stringify(tokens) === JSON.stringify(['ok', 'RED', 'REFUSED']) && !tokens.includes('GREEN'),
  `topToken over its three branches = ${JSON.stringify(tokens)} ; emits GREEN = ${tokens.includes('GREEN')}`
);
// The schema number does not move with the run's outcome — that is what makes it a version.
const greenLine = renderVerdict({ legs: [{ id: 'X', ok: true }], preds: [] });
const redLine = renderVerdict({ legs: [{ id: 'X', ok: false }], preds: [] });
const schemaConstant = greenLine.split(' ')[0] === redLine.split(' ')[0];
leg(
  'A3',
  schemaConstant && greenLine.startsWith('VERDICT/1 ok') && redLine.startsWith('VERDICT/1 RED'),
  `the number is invariant across outcome: green="${greenLine.split(' ').slice(0, 2).join(' ')}" ` +
    `red="${redLine.split(' ').slice(0, 2).join(' ')}" constant=${schemaConstant}`
);
pred('Q1', SCHEMA === 'VERDICT/1' && !tokens.includes('GREEN') && schemaConstant, 'the library number is a schema version and its green token is `ok`, never GREEN');

// ------------------------------------------- Q2: what the hand-rolled arms' number and token mean

// Read from the emitting SOURCE, so this is not an inference from the recordings.
const EMITTERS = [
  'docs/research/unit-465floorstates-2026-11-14/arm-floorstates-b.mjs',
  'docs/research/unit-465chainfloor-2026-11-13/arm-chainfloor-a.mjs',
  'docs/research/unit-465byteslabel-2026-11-13/arm-byteslabel-a.mjs',
];
const emitterFindings = EMITTERS.map((p) => {
  const src = git('show', `HEAD:${p}`);
  return {
    p,
    exitInterp: /VERDICT\/\$\{exit\d?\}/.test(src),
    greenToken: /'GREEN'/.test(src) || /"GREEN"/.test(src),
    derivesExit: /red\.length \|\| refused\.length \? 1 : 0/.test(src),
  };
});
for (const f of emitterFindings) {
  console.log(`          emitter ${f.p.replace('docs/research/', '')}: VERDICT/\${exit}=${f.exitInterp} GREEN=${f.greenToken} exitDerived=${f.derivesExit}`);
}
const allExitSpelled = emitterFindings.every((f) => f.exitInterp && f.greenToken && f.derivesExit);
leg('A4', allExitSpelled, `all ${emitterFindings.length} sampled hand-rolled emitters put the EXIT CODE in the number and spell green GREEN = ${allExitSpelled}`);
pred('Q2', allExitSpelled, 'the hand-rolled number is a process exit code and its green token is GREEN — the same prefix, a different quantity');

// ---------------------------------------- Q3/Q4/Q5: what the reader does with each hand-rolled line

const FIELDS_TAIL = 'legs=1 red=[] refused=[] preds=0 refuted=[] prefused=[]';
const FIELDS_RED = 'legs=1 red=[X] refused=[] preds=0 refuted=[] prefused=[]';

const rGreen = readVerdict(`VERDICT/0 GREEN ${FIELDS_TAIL}`);
leg(
  'A5',
  rGreen.ok !== true && rGreen.refusal === 'UNKNOWN_SCHEMA',
  `readVerdict('VERDICT/0 GREEN …') → ok=${rGreen.ok} refusal=${rGreen.refusal}`
);
pred('Q3', rGreen.ok !== true && rGreen.refusal === 'UNKNOWN_SCHEMA', 'a hand-rolled GREEN headline is refused, and refused on the SCHEMA — the token is never reached');

const rRed = readVerdict(`VERDICT/1 RED ${FIELDS_RED}`);
const redListBack = rRed.ok === true ? rRed.verdict.red : null;
leg(
  'A6',
  rRed.ok === true && Array.isArray(redListBack) && redListBack.length === 1 && redListBack[0] === 'X',
  `readVerdict('VERDICT/1 RED …') → ok=${rRed.ok} refusal=${rRed.refusal} red=${JSON.stringify(redListBack)}`
);
pred('Q4', rRed.ok === true && redListBack && redListBack[0] === 'X', 'a hand-rolled RED headline is ACCEPTED — exit 1 collides with schema 1 and RED is a valid token');

const rRefused = readVerdict(`VERDICT/1 REFUSED ${FIELDS_TAIL}`);
leg('A7', rRefused.ok === true, `readVerdict('VERDICT/1 REFUSED …') → ok=${rRefused.ok} refusal=${rRefused.refusal}`);
pred('Q5', rRefused.ok === true, 'a hand-rolled REFUSED headline is accepted too');

// The asymmetry, stated as the predicate it is: acceptance of a hand-rolled line is keyed on the
// run having FAILED. Driven over the three outcomes a hand-rolled arm can publish.
const outcomes = [
  ['exit 0 / GREEN', `VERDICT/0 GREEN ${FIELDS_TAIL}`],
  ['exit 1 / RED', `VERDICT/1 RED ${FIELDS_RED}`],
  ['exit 1 / REFUSED', `VERDICT/1 REFUSED ${FIELDS_TAIL}`],
];
const accepted = outcomes.filter(([, l]) => readVerdict(l).ok === true).map(([n]) => n);
leg(
  'A8',
  accepted.length === 2 && !accepted.includes('exit 0 / GREEN'),
  `of the three outcomes a hand-rolled arm publishes, the reader accepts: ${JSON.stringify(accepted)}`
);

// ------------------------------------------------------------------ Q6/Q7/Q8: the census

const tracked = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/')
  .split('\n')
  .filter((p) => p.endsWith('.out'));
leg('A9', tracked.length > 0, `tracked *.out recordings under docs/research/ = ${tracked.length}`);

const rows = [];
for (const p of tracked) {
  const text = readFileSync(join(ROOT, p), 'utf8');
  const headline = text.split('\n').filter((l) => l.startsWith('VERDICT/'));
  if (headline.length === 0) continue;
  const r = readVerdict(text);
  const first = headline[0].trim().split(/ +/);
  rows.push({
    p,
    n: headline.length,
    number: first[0],
    token: first[1],
    accepted: r.ok === true,
    refusal: r.ok === true ? null : r.refusal,
  });
}
leg('A10', rows.length > 0, `recordings carrying a VERDICT/ headline = ${rows.length} of ${tracked.length} tracked *.out`);

// Every refusal code seen, printed in full — a fall-through bucket would hide the surprise.
const byCode = {};
for (const r of rows) {
  const k = r.accepted ? 'ACCEPTED' : r.refusal;
  byCode[k] = (byCode[k] || 0) + 1;
}
for (const [k, v] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
  console.log(`          census ${String(k).padEnd(24)} ${v} / ${rows.length}`);
}
const codes = Object.keys(byCode).filter((k) => k !== 'ACCEPTED');
leg(
  'A11',
  codes.every((c) => c === 'UNKNOWN_SCHEMA' || c === 'UNKNOWN_TOP_TOKEN' || c === 'MULTIPLE_VERDICT_LINES'),
  `refusal codes present: ${JSON.stringify(codes)}`
);
pred(
  'Q6',
  codes.every((c) => c === 'UNKNOWN_SCHEMA' || c === 'UNKNOWN_TOP_TOKEN'),
  'every refusal is UNKNOWN_SCHEMA or UNKNOWN_TOP_TOKEN and no other code appears'
);

// Hand-rolled := token GREEN, or a number that is not the schema prefix.
const handRolled = rows.filter((r) => r.token === 'GREEN' || r.number !== 'VERDICT/1');
const handGreen = handRolled.filter((r) => r.token === 'GREEN');
const handRefusedByReader = handRolled.filter((r) => !r.accepted);
leg(
  'A12',
  handRolled.length > 0,
  `hand-rolled recordings = ${handRolled.length} / ${rows.length}; of those, GREEN = ${handGreen.length}, ` +
    `refused by the corpus's own reader = ${handRefusedByReader.length}`
);
const halfOrMoreGreen = handGreen.length * 2 > handRolled.length;
leg(
  'A13',
  handGreen.length === handRefusedByReader.length,
  `the refused set IS the green set: green=${handGreen.length} refused=${handRefusedByReader.length} equal=${handGreen.length === handRefusedByReader.length}`
);
pred('Q7', halfOrMoreGreen, `more than half of hand-rolled recordings are green and therefore refused: ${handGreen.length} of ${handRolled.length}`);

// The accepted-hand-rolled set: runs that FAILED, read as schema-v1 by a reader that has no idea
// the number meant something else.
const acceptedHand = handRolled.filter((r) => r.accepted);
leg(
  'A14',
  acceptedHand.length > 0,
  `hand-rolled recordings the reader ACCEPTS (all of them failing runs) = ${acceptedHand.length}` +
    (acceptedHand.length ? ` e.g. ${acceptedHand[0].p.replace('docs/research/', '')} (${acceptedHand[0].number} ${acceptedHand[0].token})` : '')
);
const acceptedHandAllFailing = acceptedHand.every((r) => r.token === 'RED' || r.token === 'REFUSED');
leg('A15', acceptedHandAllFailing, `every accepted hand-rolled recording is a FAILING run = ${acceptedHandAllFailing}`);

const mine = rows.filter((r) => r.p.includes('unit-465floorstates-2026-11-14'));
leg(
  'A16',
  mine.length === 4 && mine.every((r) => !r.accepted),
  `this morning's unit-465floorstates recordings: ${mine.length} found, refused=${mine.filter((r) => !r.accepted).length} ` +
    `(${mine.map((r) => r.refusal).join(',')})`
);
pred('Q8', mine.length === 4 && mine.every((r) => !r.accepted), 'all four recordings I published an hour ago are invisible to the corpus\'s own reader');

// ------------------------------------------------------- Q9: is there any consumer at all?

const callers = git('grep', '-rln', 'readVerdict', '--', 'docs/research', 'scripts', 'packages')
  .split('\n')
  .filter(Boolean);
const outsideLib = callers.filter((p) => p !== 'docs/research/lib/verdict.mjs');
console.log(`          readVerdict mentioned in ${callers.length} tracked files; outside verdict.mjs: ${outsideLib.length}`);
for (const p of outsideLib) console.log(`            ${p}`);
// A consumer that reads a RECORDING is the thing that would have reddened. Keyed on the file both
// reading a .out path and calling readVerdict, not on the mention alone — an import is not a call site.
const recordingConsumers = outsideLib.filter((p) => {
  const src = git('show', `HEAD:${p}`);
  return /readVerdict\s*\(/.test(src) && /\.out\b/.test(src);
});
leg(
  'A17',
  true,
  `files that both call readVerdict( and name a .out path = ${recordingConsumers.length} ${JSON.stringify(recordingConsumers)}`
);
pred(
  'Q9',
  recordingConsumers.length === 0,
  'no consumer reads recordings through readVerdict, which is why the collision has cost nothing yet (Argus, 2026-11-10: no sweep-level reader exists)'
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('A-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}]`
);
process.exit(exit);
