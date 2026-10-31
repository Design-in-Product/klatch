#!/usr/bin/env node
// attribute.mjs — unit-464absorb, 2026-10-31 WORK fire (Daedalus).
//
// Reads the per-member JSON sidecars the instrumented drives wrote and answers P2-P6 at the
// NAME level. Every figure here is read off a dump produced by the live code path; nothing
// is recomputed by a second tokenizer, because a second reader of the key is a second
// implementation of the key.
//
// Theseus's `exposed` set is read FROM HIS FILE and compared as a member list in both
// directions — not as a count. Two sets of the same size can disagree.
//
// Classes are keyed POSITIVELY and the cross-tab is printed whole. No fall-through bucket:
// a name that lands in no class is reported as UNCLASSIFIED and reddens, because a terminal
// bucket reached by falling through absorbs every blindness in the classifier.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const load = (f) => JSON.parse(readFileSync(resolve(HERE, f), 'utf8'));
const HIS = resolve(HERE, '../unit-464reach-2026-10-31/why-zero-price.json');

const live = load('a-live.absorb.json');
const wide = load('b-wide.absorb.json');
const his = JSON.parse(readFileSync(HIS, 'utf8'));

const problems = [];
const red = (m) => {
  problems.push(m);
  return m;
};
const setEq = (a, b) => {
  const A = new Set(a);
  const B = new Set(b);
  const onlyA = [...A].filter((x) => !B.has(x)).sort();
  const onlyB = [...B].filter((x) => !A.has(x)).sort();
  return { ok: onlyA.length === 0 && onlyB.length === 0, onlyA, onlyB };
};

console.log('=== attribute.mjs — unit-464absorb ===');
console.log(`live dump : boundary=${live.boundary} cripple="${live.cripple}" rows=${live.rows.length} arms=${live.arms.length}`);
console.log(`wide dump : boundary=${wide.boundary} cripple="${wide.cripple}" rows=${wide.rows.length} arms=${wide.arms.length}`);
console.log(`his sets  : ${HIS.replace(/.*\/docs\//, 'docs/')}`);
console.log('');

// A single arm is graded here. Refuse rather than silently read arms[0] if that is false.
if (live.arms.length !== 1 || wide.arms.length !== 1) {
  console.log(red(`REFUSED — expected exactly 1 arm per dump, got ${live.arms.length}/${wide.arms.length}`));
  process.exit(1);
}
const [la] = live.arms;
const [wa] = wide.arms;

// --- P2. The RECORDING side. Every payload-derived set, compared live vs wide.
const recSets = [
  ['arm-wide emitted', la.emitted, wa.emitted],
  ...live.rows.map((r, i) => [`${r.id} ownEmits`, r.ownEmits, wide.rows[i].ownEmits]),
  ...live.rows.map((r, i) => [`${r.id} aTokens`, r.aTokens ?? [], wide.rows[i].aTokens ?? []]),
  ...live.rows.map((r, i) => [`${r.id} bTokens`, r.bTokens ?? [], wide.rows[i].bTokens ?? []]),
];
let recGained = 0;
const recMoved = [];
for (const [label, a, b] of recSets) {
  const d = setEq(a, b);
  if (!d.ok) {
    recGained += d.onlyB.length;
    recMoved.push(`${label} +[${d.onlyB.join(',')}] -[${d.onlyA.join(',')}]`);
  }
}
console.log(`P2 R-REC    recording-side sets compared: ${recSets.length}`);
console.log(`            names the WIDE boundary ADDS on the recording side: ${recGained}`);
if (recMoved.length > 0) for (const m of recMoved) console.log(`            MOVED ${m}`);
console.log(`            ${recGained === 0 ? 'LANDS — the cure adds nothing on the recording side' : 'REFUTED — the recording side is not inert'}`);
console.log('');

// --- P3. The MAP side gain, and the member-list comparison against his set.
const gained = setEq(la.quoted, wa.quoted);
const exposed = gained.onlyB;
console.log(`P3 MAPGAIN  whole-section quoted: live=${la.quoted.length} wide=${wa.quoted.length}`);
console.log(`            names WIDE adds: ${exposed.length} [${exposed.join(',')}]`);
console.log(`            names WIDE loses: ${gained.onlyA.length} [${gained.onlyA.join(',')}]`);
const vsHis = setEq(exposed, his.exposed);
console.log(
  `            vs his why-zero-price.json "exposed" (${his.exposed.length}): ` +
    `member-for-member both directions ok=${vsHis.ok} mine-only=[${vsHis.onlyA.join(',')}] his-only=[${vsHis.onlyB.join(',')}]`,
);
if (!vsHis.ok) red('P3 REFUTED — my exposed set disagrees with his as a member list');
if (gained.onlyA.length > 0) red(`P3 — the WIDE boundary LOSES ${gained.onlyA.length} name(s), which the cure was not predicted to do`);
console.log('');

// --- P4 + P5. Per-name attribution, classes keyed positively.
const quotedOfMeWide = new Map(wide.rows.map((r) => [r.id, new Set(r.quotedOfMe)]));
const ownEmitsOf = new Map(wide.rows.map((r) => [r.id, new Set(r.ownEmits)]));
const emittedWide = new Set(wa.emitted);

const rowsFor = (name) => wide.rows.filter((r) => quotedOfMeWide.get(r.id).has(name)).map((r) => r.id);
const table = exposed.map((name) => {
  const seenBy = rowsFor(name);
  const cancelled = seenBy.filter((id) => ownEmitsOf.get(id).has(name));
  const unabsorbed = seenBy.filter((id) => !ownEmitsOf.get(id).has(name));
  const classes = [];
  if (seenBy.length === 0) classes.push('CTX-UNREACHED');
  if (cancelled.length > 0) classes.push('OWNEMITS-CANCEL');
  if (unabsorbed.length > 0) classes.push('UNABSORBED');
  return { name, seenBy, cancelled, unabsorbed, classes, inEmitted: emittedWide.has(name) };
});

console.log('P4/P5 ATTRIBUTION — each of the exposed names, classified positively:');
console.log('            name                 ctx-members-seeing  ownEmits-cancels  unabsorbed  inEmitted  class(es)');
for (const t of table) {
  console.log(
    `            ${t.name.padEnd(20)} ${String(t.seenBy.length).padStart(18)} ` +
      `${String(t.cancelled.length).padStart(17)} ${String(t.unabsorbed.length).padStart(11)} ` +
      `${String(t.inEmitted).padStart(10)}  ${t.classes.join('+') || 'UNCLASSIFIED'}`,
  );
}
const unclassified = table.filter((t) => t.classes.length === 0);
if (unclassified.length > 0) red(`${unclassified.length} name(s) UNCLASSIFIED — the classifier has a hole: [${unclassified.map((t) => t.name).join(',')}]`);

const tally = {};
for (const t of table) {
  const k = t.classes.join('+') || 'UNCLASSIFIED';
  tally[k] = (tally[k] ?? 0) + 1;
}
console.log('');
console.log(`P5 TALLY    ${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(' · ')}   (n=${table.length})`);
const nCtx = table.filter((t) => t.classes.includes('CTX-UNREACHED')).length;
const nOwn = table.filter((t) => t.classes.includes('OWNEMITS-CANCEL')).length;
const nUnabs = table.filter((t) => t.classes.includes('UNABSORBED')).length;
console.log(`P5 PREDICTED CTX-UNREACHED >= 10 and OWNEMITS-CANCEL <= 9, both non-empty.`);
console.log(
  `P5 MEASURED  CTX-UNREACHED=${nCtx}  OWNEMITS-CANCEL=${nOwn}  UNABSORBED=${nUnabs}  ` +
    `-> ${nCtx >= 10 && nOwn <= 9 && nCtx > 0 && nOwn > 0 ? 'LANDS' : 'REFUTED'}`,
);
console.log(
  `P4 MEASURED  unabsorbed (member,name) pairs = ${table.reduce((s, t) => s + t.unabsorbed.length, 0)}  ` +
    `-> ${nUnabs === 0 ? 'LANDS (predicted 0)' : 'REFUTED — my instrument or his byte-identity is wrong, and I say so rather than publish this as a finding'}`,
);
console.log('');

// --- P6. The two keys' routes, read off the dumps rather than argued.
const trkLive = la.typedRecordingKey;
const trkWide = wa.typedRecordingKey;
const ttLive = [...new Set(live.rows.flatMap((r) => r.typed))].sort();
const ttWide = [...new Set(wide.rows.flatMap((r) => r.typed))].sort();
console.log(`P6 KEYS     tokensTyped        live=[${ttLive.join(',')}] (${ttLive.length})  wide=[${ttWide.join(',')}] (${ttWide.length})`);
console.log(`            typedRecordingKey  live=[${trkLive.join(',')}] (${trkLive.length})  wide=[${trkWide.join(',')}] (${trkWide.length})`);
const inEmitted = table.filter((t) => t.inEmitted).length;
console.log(
  `            of the ${table.length} exposed, in arm-wide emitted: ${inEmitted} ` +
    `-> typedRecordingKey's route is R-EMIT for ${inEmitted} of them`,
);
console.log(
  `            of the ${table.length} exposed, absorbed for tokensTyped WITHOUT needing R-EMIT ` +
    `(ctx-unreached or own-cancelled): ${table.filter((t) => t.unabsorbed.length === 0).length}`,
);
console.log('');

console.log(problems.length === 0 ? 'ATTRIBUTE ok  0 problem(s)' : `ATTRIBUTE RED ${problems.length} problem(s):`);
for (const p of problems) console.log(`  - ${p}`);
if (problems.length > 0) process.exitCode = 1;
