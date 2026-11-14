/**
 * unit-465schemacollide — arm B
 *
 * ADDITIVE. Arm A is kept exactly as it ran, reds and all: 4 of its 9 predictions were refuted and
 * three of its own legs were wrong about their own measurement. This arm repairs the instrument
 * rather than the record, and re-asks the questions arm A could not answer:
 *
 *   A4  (Q2 refuted) — my emitter detector was ONE hand-typed pattern, `VERDICT/${exit}`.
 *                      `arm-chainfloor-a.mjs` spells the same quantity inline as
 *                      `VERDICT/${red.length || refused.length ? 1 : 0}` and also publishes a THIRD
 *                      spelling I had not accounted for at all: `VERDICT/2 CRASH`.
 *   A7  (Q5 refuted) — my FIXTURE was self-contradictory: token `REFUSED` with `refused=[]`. The
 *                      reader refused it as TOKEN_LIST_CONTRADICTION, which is the reader being
 *                      right. Re-driven here with a consistent fixture.
 *   A11 (Q6 refuted) — `MALFORMED_FIELDS` (69/296) is a code I did not predict, and it is the
 *                      largest refusal class.
 *   A13/A14          — my `handRolled` key was `token === 'GREEN' || number !== 'VERDICT/1'`, which
 *                      can only fire on a GREEN or a non-1 number. Every hand-rolled run that
 *                      exited 1 prints `VERDICT/1 RED`, so the key cannot see it, and the 28 it
 *                      found is a floor, not a count.
 *   A17 (Q9 refuted) — keyed on `readVerdict(` appearing in a file that also names `.out`. That
 *                      matches RECORDINGS (which contain the recorded text of instruments that
 *                      printed it), a README, and this unit's own PRE-REGISTRATION.md. 29 is junk.
 *
 * Nothing below re-keys a conjunct arm A's filter already made true; the census is rebuilt from the
 * headline text itself, so the vocabulary is whatever the corpus has rather than whatever I typed.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA, readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const THIS_UNIT = 'docs/research/unit-465schemacollide-2026-11-14/';

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

// ------------------------------------------------- B1: arm A's `A7` was my fixture, not the reader

const bad = readVerdict('VERDICT/1 REFUSED legs=1 red=[] refused=[] preds=0 refuted=[] prefused=[]');
const good = readVerdict('VERDICT/1 REFUSED legs=1 red=[] refused=[X] preds=0 refuted=[] prefused=[]');
leg('B1a', bad.ok !== true && bad.refusal === 'TOKEN_LIST_CONTRADICTION', `arm A's fixture: ok=${bad.ok} refusal=${bad.refusal} — token REFUSED with refused=[] is a contradiction`);
leg('B1b', good.ok === true && good.verdict.refused.length === 1, `a CONSISTENT REFUSED fixture: ok=${good.ok} refusal=${good.refusal} refused=${JSON.stringify(good.verdict && good.verdict.refused)}`);
pred('R1', bad.refusal === 'TOKEN_LIST_CONTRADICTION' && good.ok === true, "arm A's A7 red was its own fixture: the reader accepts REFUSED when the list agrees with the token");

// So the acceptance rule for a SYNTHETIC hand-rolled line, re-stated over all three outcomes with
// self-consistent fixtures this time.
const FIXTURES = [
  ['exit 0 / GREEN', 'VERDICT/0 GREEN legs=1 red=[] refused=[] preds=0 refuted=[] prefused=[]'],
  ['exit 1 / RED', 'VERDICT/1 RED legs=1 red=[X] refused=[] preds=0 refuted=[] prefused=[]'],
  ['exit 1 / REFUSED', 'VERDICT/1 REFUSED legs=1 red=[] refused=[X] preds=0 refuted=[] prefused=[]'],
  ['exit 2 / CRASH', 'VERDICT/2 CRASH legs=0 red=[] refused=[all]'],
];
const fxRows = FIXTURES.map(([n, l]) => {
  const r = readVerdict(l);
  return { n, ok: r.ok === true, refusal: r.ok === true ? null : r.refusal };
});
for (const f of fxRows) console.log(`          fixture ${f.n.padEnd(18)} accepted=${String(f.ok).padEnd(5)} ${f.refusal || ''}`);
const acceptedFx = fxRows.filter((f) => f.ok).map((f) => f.n);
leg(
  'B2',
  acceptedFx.length === 2 && !acceptedFx.includes('exit 0 / GREEN'),
  `with self-consistent fixtures the reader accepts ${JSON.stringify(acceptedFx)} and refuses the GREEN one`
);
pred('R2', acceptedFx.length === 2 && !acceptedFx.includes('exit 0 / GREEN'), 'the asymmetry is real AT THE LINE LEVEL: a full-field hand-rolled line is accepted iff the run failed');

// --------------------------------- B3: the vocabulary the corpus actually has, read off the lines

const tracked = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/')
  .split('\n')
  .filter((p) => p.endsWith('.out'));

const rows = [];
for (const p of tracked) {
  const text = readFileSync(join(ROOT, p), 'utf8');
  const heads = text.split('\n').filter((l) => l.startsWith('VERDICT/'));
  if (heads.length === 0) continue;
  const parts = heads[0].trim().split(/ +/);
  const fields = parts.slice(2).map((s) => s.split('=')[0]);
  const r = readVerdict(text);
  rows.push({
    p,
    number: parts[0],
    token: parts[1],
    fields: fields.join(','),
    nFields: fields.length,
    accepted: r.ok === true,
    refusal: r.ok === true ? null : r.refusal,
    heads: heads.length,
  });
}
leg('B3', rows.length === 296, `recordings carrying a VERDICT/ headline = ${rows.length} (arm A measured 296)`);

const tally = (key) => {
  const m = new Map();
  for (const r of rows) {
    const k = typeof key === 'function' ? key(r) : r[key];
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

console.log('          --- (number, token) vocabulary, every pair present, no fall-through');
for (const [k, v] of tally((r) => `${r.number} ${r.token}`)) {
  console.log(`          ${String(k).padEnd(22)} ${String(v).padStart(4)} / ${rows.length}`);
}
const numbers = [...new Set(rows.map((r) => r.number))].sort();
const tokens = [...new Set(rows.map((r) => r.token))].sort();
leg('B4', numbers.length >= 2, `distinct numbers in the corpus's headlines: ${JSON.stringify(numbers)}`);
leg('B5', tokens.length >= 2, `distinct tokens in the corpus's headlines: ${JSON.stringify(tokens)}`);
pred(
  'R3',
  numbers.includes('VERDICT/0') && numbers.includes('VERDICT/1') && tokens.includes('GREEN') && tokens.includes('ok'),
  'both spellings are present in the recordings, undistinguished: the number takes 0/1 (exit) and 1 (schema), the token takes GREEN and ok'
);

console.log('          --- refusal code x field count');
for (const [k, v] of tally((r) => `${r.accepted ? 'ACCEPTED' : r.refusal} nFields=${r.nFields}`)) {
  console.log(`          ${String(k).padEnd(34)} ${String(v).padStart(4)} / ${rows.length}`);
}

// ----------------------------- B6: the hand-rolled population, keyed on something that can see it
//
// A line is LIB-SHAPED iff it carries the schema prefix, a library token, and the library's exact
// six field names in order. Anything else is hand-rolled. This key does not depend on the outcome,
// which is the defect in arm A's `handRolled`.
const LIB_FIELDS = 'legs,red,refused,preds,refuted,prefused';
const libShaped = rows.filter((r) => r.number === SCHEMA && ['ok', 'RED', 'REFUSED'].includes(r.token) && r.fields === LIB_FIELDS);
const handRolled = rows.filter((r) => !libShaped.includes(r));
leg(
  'B6',
  libShaped.length + handRolled.length === rows.length,
  `partition: lib-shaped=${libShaped.length} hand-rolled=${handRolled.length} of ${rows.length}`
);
const handByOutcome = {
  green: handRolled.filter((r) => r.token === 'GREEN' || r.token === 'ok').length,
  failing: handRolled.filter((r) => ['RED', 'REFUSED', 'CRASH'].includes(r.token)).length,
};
const handAccepted = handRolled.filter((r) => r.accepted);
leg(
  'B7',
  true,
  `hand-rolled by outcome: green-ish=${handByOutcome.green} failing=${handByOutcome.failing}; ` +
    `accepted by the reader=${handAccepted.length}`
);
pred(
  'R4',
  handRolled.length > 28,
  `arm A's 28 was a floor: keyed on the FIELD LIST instead of the outcome, the hand-rolled population is ${handRolled.length}`
);
pred(
  'R5',
  handAccepted.length === 0,
  'THE CORRECTION TO MY OWN HYPOTHESIS: no hand-rolled recording in the corpus is accepted — green or failing. The reader does not filter to failures; it ignores the hand-rolled population entirely'
);

// Lib-shaped lines, by contrast, parse — otherwise `renderVerdict`'s round-trip closure is broken.
const libRefused = libShaped.filter((r) => !r.accepted);
leg(
  'B8',
  libRefused.length === 0,
  `lib-shaped recordings the reader refuses = ${libRefused.length}` +
    (libRefused.length ? ` e.g. ${libRefused[0].p} (${libRefused[0].refusal})` : ' — round-trip closure holds across the corpus')
);

// ------------------------------- B9: the emitter census, keyed on captured text not one pattern

const sources = git('ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/', 'scripts/')
  .split('\n')
  .filter((p) => p.endsWith('.mjs') && !p.startsWith(THIS_UNIT));
const emitters = [];
for (const p of sources) {
  const src = git('show', `HEAD:${p}`);
  // Capture every VERDICT/ template in the source, whatever follows the slash.
  const hits = [...src.matchAll(/VERDICT\/([^ `'"]*)/g)].map((m) => m[1]);
  if (hits.length === 0) continue;
  const kinds = new Set(
    hits.map((h) => {
      if (h === '' ) return 'bare';
      if (/^\d+$/.test(h)) return `literal:${h}`;
      return 'computed';
    })
  );
  emitters.push({ p, kinds: [...kinds].sort().join('+'), usesSchemaConst: /\bSCHEMA\b/.test(src) });
}
console.log('          --- emitter source kinds (what follows VERDICT/ in the source)');
for (const [k, v] of (() => {
  const m = new Map();
  for (const e of emitters) m.set(e.kinds, (m.get(e.kinds) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
})()) {
  console.log(`          ${String(k).padEnd(30)} ${String(v).padStart   (4)} / ${emitters.length}`);
}
const computed = emitters.filter((e) => e.kinds.includes('computed'));
const literal1 = emitters.filter((e) => e.kinds.includes('literal:1'));
const literal2 = emitters.filter((e) => e.kinds.includes('literal:2'));
leg(
  'B9',
  computed.length > 0 && literal2.length > 0,
  `sources computing the number (exit) = ${computed.length}; literal VERDICT/1 = ${literal1.length}; ` +
    `literal VERDICT/2 (the CRASH spelling arm A missed entirely) = ${literal2.length}; total emitting sources = ${emitters.length}`
);
pred(
  'R6',
  literal2.length > 0,
  'a THIRD spelling exists that arm A\'s one hand-typed pattern could not see: VERDICT/2 CRASH, a number that is neither a schema version nor 0/1'
);

// --------------------------- B10: the consumer census, with the three contaminants removed

const candidates = git('grep', '-rln', 'readVerdict', '--', 'docs/research', 'scripts', 'packages')
  .split('\n')
  .filter(Boolean)
  .filter((p) => p.endsWith('.mjs'))                       // a recording or a README is not a call site
  .filter((p) => !p.startsWith(THIS_UNIT))                 // an instrument does not census its own source
  .filter((p) => basename(dirname(p)) !== 'lib');          // verdict.mjs's own round-trip is not a consumer
const consumers = [];
for (const p of candidates) {
  const src = git('show', `HEAD:${p}`);
  if (!/readVerdict\s*\(/.test(src)) continue;             // an import is not a call site
  const readsRecording = /readFileSync\s*\(/.test(src) && /\.out\b/.test(src);
  consumers.push({ p, readsRecording });
}
const recordingConsumers = consumers.filter((c) => c.readsRecording);
console.log('          --- readVerdict call sites outside the lib and outside this unit');
for (const c of consumers) console.log(`          ${c.readsRecording ? 'READS-RECORDINGS' : 'line-level only  '} ${c.p}`);
leg(
  'B10',
  candidates.length < 54,
  `candidate files after removing recordings/README/own-source: ${candidates.length} (arm A's raw mention count was 54)`
);
leg(
  'B11',
  true,
  `real call sites = ${consumers.length}, of which read a .out recording = ${recordingConsumers.length}`
);
pred(
  'R7',
  recordingConsumers.length > 0,
  'consumers of recordings DO exist, so arm A\'s Q9 is refuted in direction as well as in count — the collision is not costless by construction'
);

// ------------------------------------------------------------------- gate

const dirty = git('status', '--porcelain', 'packages', 'scripts', 'docs/research/lib').trim();
leg('B-gate', dirty === '', `git status --porcelain packages scripts docs/research/lib → ${JSON.stringify(dirty)}`);

const state = red.length ? 'RED' : refused.length ? 'REFUSED' : 'GREEN';
const exit = red.length || refused.length ? 1 : 0;
console.log(
  `VERDICT/${exit} ${state} legs=${legs.length} red=[${red}] refused=[${refused}] ` +
    `preds=${preds.length} refuted=[${refuted}] prefused=[]`
);
process.exit(exit);
