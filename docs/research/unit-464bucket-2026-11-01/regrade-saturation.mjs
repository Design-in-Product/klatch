// unit-464bucket — axis 2: is Daedalus's word `saturated` carried by a figure that tracks the
// property, or by one that only says the two trees differ?
//
// His predicate, `unit-464steal/drive-the-steal.mjs:234-245`:
//
//   const movedOn = (field) => rows.filter((r) => … r.trueRev[field] !== r.keyedRev[field]);
//   const moved = movedOn('value');
//   const upstreamMoved = [...new Set([...movedOn('raw'), ...movedOn('comments'), ...movedOn('bytes')])];
//   const saturated = moved.length === 0 && upstreamMoved.length > 0 && !loudlyFailed;
//
// `raw` and `comments` are the SAME needle (`DECL_FRAGMENT`) counted with weaker blanking — they
// are genuinely upstream of the verdict figure. `bytes` is `src.length`: a different quantity,
// which moves whenever the two revs hold different file content at all. If `bytes` is what
// satisfies the leg for a file, then "the steal reached the read and the read could not express
// it" is published for that file on no evidence about the property.
//
// The figures are SLICED out of his recording, not retyped, and the slice is gated. The
// predicate is parameterised on the field set and nothing else; before any variant figure is
// printed, the re-derivation must reproduce the words his recording published.
//
// Run from the repo root:
//   node docs/research/unit-464bucket-2026-11-01/regrade-saturation.mjs
import { readFileSync } from 'node:fs';

const REC = 'docs/research/unit-464steal-2026-11-01/drive4.steal-identity.out';
const SRC = 'docs/research/unit-464steal-2026-11-01/drive-the-steal.mjs';
const rec = readFileSync(REC, 'utf8');
const src = readFileSync(SRC, 'utf8');

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };

// ---------------------------------------------------------------- the predicate, lifted not typed
// The one thing I must not do is grade a predicate I retyped from his memo. Lift the three field
// names out of the `upstreamMoved` line in his source; if that line has been re-spelled, this
// instrument refuses rather than grading a field set nobody uses.
const upstreamM = src.match(/^const upstreamMoved = \[\.\.\.new Set\(\[(.+?)\]\)\];$/m);
const satM = src.match(/^const saturated = (.+);$/m);
const movedM = src.match(/^const moved = movedOn\('(\w+)'\);$/m);
if (!upstreamM || !satM || !movedM) {
  console.log('REFUSED — his predicate could not be lifted from ' + SRC + ':');
  if (!upstreamM) console.log('   no `const upstreamMoved = [...new Set([…])];` line');
  if (!satM) console.log('   no `const saturated = …;` line');
  if (!movedM) console.log('   no `const moved = movedOn(\'…\');` line');
  process.exit(2);
}
const HIS_FIELDS = [...upstreamM[1].matchAll(/movedOn\('(\w+)'\)/g)].map((m) => m[1]);
const VERDICT_FIELD = movedM[1];
check('GLIFT', HIS_FIELDS.length === 3 && VERDICT_FIELD === 'value',
  `his upstream set is [${HIS_FIELDS.join(', ')}] and the verdict figure is \`${VERDICT_FIELD}\``);

// -------------------------------------------------------------------- the figures, sliced not typed
// His table, verbatim from the recording:
//    file            rev         verdict-figure  comments-blanked  raw  bytes
//    probe-round374  PIN^              0                 0    2  19726
const HEADER = '   file            rev         verdict-figure  comments-blanked  raw  bytes';
const headerAt = rec.indexOf(HEADER);
const ROW = /^ {3}(probe-round\d+) +(PIN\^|KEYED\^) +(-?\d+) +(-?\d+) +(-?\d+) +(-?\d+)$/;
const parsed = [];
if (headerAt >= 0) {
  for (const line of rec.slice(headerAt + HEADER.length).split('\n')) {
    const m = line.match(ROW);
    if (!m) { if (parsed.length) break; else continue; }
    parsed.push({ label: m[1], which: m[2], value: +m[3], comments: +m[4], raw: +m[5], bytes: +m[6] });
  }
}
check('GSLICE', headerAt >= 0 && parsed.length === 4,
  `his table header found at ${headerAt} and ${parsed.length} data rows parsed (4 expected)`);

// A slice that parsed four rows can still have mis-assigned columns. Round-trip each parsed row
// back into his exact padding and require the reconstructed line to be present in the recording
// byte-for-byte. A column swap cannot survive this.
const rebuild = (r) => '   ' + r.label.padEnd(15) + ' ' + r.which.padEnd(11) + ' ' +
  String(r.value).padStart(7) + String(r.comments).padStart(18) +
  String(r.raw).padStart(5) + String(r.bytes).padStart(7);
const roundTripped = parsed.filter((r) => rec.includes(rebuild(r)));
check('GROUNDTRIP', parsed.length > 0 && roundTripped.length === parsed.length,
  `${roundTripped.length}/${parsed.length} parsed rows rebuild to a line present in the recording`);

const gatesOk = legs.every((l) => l.ok);
console.log('unit-464bucket — regrading `saturated` on his own recording');
console.log(`  recording: ${REC}`);
console.log(`  predicate: ${SRC}`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(11)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) {
  console.log('REFUSED — a gate is RED, so nothing below is published.');
  process.exit(1);
}

// ------------------------------------------------------------------------------ his shape, rebuilt
const byLabel = new Map();
for (const r of parsed) {
  const e = byLabel.get(r.label) ?? { label: r.label };
  e[r.which === 'PIN^' ? 'trueRev' : 'keyedRev'] = r;
  byLabel.set(r.label, e);
}
const rows = [...byLabel.values()].filter((e) => e.trueRev && e.keyedRev);

// His `movedOn`, with the field set as the only free variable. `loudlyFailed` is false in this
// recording (it printed `reads that THREW at the keyed rev: false`), asserted rather than assumed.
const loudlyFailed = /reads that THREW at the keyed rev: +true/.test(rec);
const movedOn = (field, set = rows) => set.filter((r) => r.trueRev[field] !== r.keyedRev[field]);
const derive = (fields, set = rows) => {
  const moved = movedOn(VERDICT_FIELD, set);
  const upstream = [...new Set(fields.flatMap((f) => movedOn(f, set)))];
  return {
    moved, upstream,
    saturated: moved.length === 0 && upstream.length > 0 && !loudlyFailed,
  };
};

// ---------------------------------------------------------------- GREPRO: reproduce his published words
const his = derive(HIS_FIELDS);
const hisUpstreamNames = new Set(his.upstream.map((r) => r.label));
const recUpstreamLine = rec.split('\n').find((l) => l.includes('UPSTREAM figures (raw/comments/bytes) that moved:'));
const recNames = new Set([...String(recUpstreamLine).matchAll(/probe-round\d+/g)].map((m) => m[0]));
const recSaysSaturated = /P4 +REFUTED \(saturated\)/.test(rec);
const repro = his.saturated === recSaysSaturated
  && hisUpstreamNames.size === recNames.size
  && [...hisUpstreamNames].every((n) => recNames.has(n));
console.log('GREPRO — my re-derivation under HIS field set, against what his recording printed');
console.log(`  his recording:   P4 REFUTED (saturated) = ${recSaysSaturated}; upstream moved = {${[...recNames].join(', ')}}`);
console.log(`  my re-derivation: saturated = ${his.saturated}; upstream moved = {${[...hisUpstreamNames].join(', ')}}`);
console.log(`  GREPRO ${repro ? 'ok ' : 'RED'} — the re-derivation ${repro ? 'reproduces' : 'does NOT reproduce'} his published words`);
console.log('');
if (!repro) {
  console.log('REFUSED — a re-derivation that cannot reproduce his figure under his own key cannot');
  console.log('          correct it under a different one.');
  process.exit(1);
}

// ------------------------------------------------------------------------------------- the variants
const PROPERTY_FIELDS = HIS_FIELDS.filter((f) => f !== 'bytes');
const variants = [
  ['his field set', HIS_FIELDS],
  ['property-tracking only', PROPERTY_FIELDS],
  ['bytes alone', ['bytes']],
];
console.log('1. THE SAME PREDICATE, UNDER THREE UPSTREAM FIELD SETS (all four rows)');
console.log('   field set                  saturated  witnessing files');
for (const [name, fields] of variants) {
  const d = derive(fields);
  console.log(`   ${name.padEnd(26)} ${String(d.saturated).padEnd(10)} ` +
    `${d.upstream.length ? d.upstream.map((r) => r.label).join(', ') : '(none)'}`);
}
console.log('');

console.log('2. PER FILE — which figure actually witnesses the claim for each');
console.log('   file            value  raw    comments  bytes   witnesses under');
for (const r of rows) {
  const mv = (f) => `${r.trueRev[f]}→${r.keyedRev[f]}`;
  const under = variants.filter(([, fields]) => derive(fields, [r]).saturated).map(([n]) => n);
  console.log(`   ${r.label.padEnd(15)} ${mv('value').padEnd(6)} ${mv('raw').padEnd(6)} ` +
    `${mv('comments').padEnd(9)} ${mv('bytes').padEnd(15)} ${under.length ? under.join(' / ') : '(none)'}`);
}
console.log('');

// ------------------------------------------------------------------------------------- the readings
const propertyWitnesses = derive(PROPERTY_FIELDS).upstream.map((r) => r.label);
const bytesOnly = rows.filter((r) => derive(['bytes'], [r]).saturated
  && !derive(PROPERTY_FIELDS, [r]).saturated).map((r) => r.label);
console.log('READINGS');
console.log(`  his published witness set:                      ${his.upstream.map((r) => r.label).join(', ')} (${his.upstream.length} files)`);
console.log(`  witnesses once \`bytes\` is dropped:              ${propertyWitnesses.join(', ') || '(none)'} (${propertyWitnesses.length} files)`);
console.log(`  files witnessing ONLY via \`bytes\`:              ${bytesOnly.join(', ') || '(none)'}`);
console.log('');
console.log('PREDICTIONS settled by this drive');
const p2 = derive(PROPERTY_FIELDS).saturated === true && propertyWitnesses.length === 1
  && propertyWitnesses[0] === 'probe-round375';
console.log(`  P2  ${p2 ? 'LANDS  ' : 'REFUTED'}  dropping bytes: saturated=${derive(PROPERTY_FIELDS).saturated}, ` +
  `witnesses ${his.upstream.length} → ${propertyWitnesses.length} (${propertyWitnesses.join(',') || 'none'})`);
const r374 = rows.find((r) => r.label === 'probe-round374');
const p3 = !!r374 && derive(HIS_FIELDS, [r374]).saturated === true
  && r374.trueRev.raw === r374.keyedRev.raw && r374.trueRev.comments === r374.keyedRev.comments;
console.log(`  P3  ${p3 ? 'LANDS  ' : 'REFUTED'}  probe-round374 alone: saturated=` +
  `${r374 ? derive(HIS_FIELDS, [r374]).saturated : 'n/a'} while raw ` +
  `${r374 ? r374.trueRev.raw + '→' + r374.keyedRev.raw : '?'} and comments ` +
  `${r374 ? r374.trueRev.comments + '→' + r374.keyedRev.comments : '?'} are unchanged`);
console.log('');
console.log(`SATVERDICT/${gatesOk && repro ? 0 : 1}  ${legs.length} gates ok + GREPRO ok; ` +
  `P2 ${p2 ? 'LANDS' : 'REFUTED'}, P3 ${p3 ? 'LANDS' : 'REFUTED'}`);
process.exit(0);
