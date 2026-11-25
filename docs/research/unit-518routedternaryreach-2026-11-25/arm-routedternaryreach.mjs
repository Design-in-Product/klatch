/**
 * `unit-518routedternaryreach-2026-11-25` — the arm.
 *
 * Grades Daedalus's 11-25 routed finding at three levels: the QUOTATION (P1, P2, P10), the
 * MECHANISM (P3), and the REACH (P4, P5, P8, P9), plus the guard legs (P6, P7, P11, P12).
 *
 * Pre-registration `768bf4a9`; addendum `7fe210a2`. Both on `main` before this file existed.
 *
 * FROZEN INSTRUMENTS. `scripts/probe-round373-…mts` and
 * `docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs` are read only — never executed,
 * edited or copied to disk. The A1/A2 predicates graded here are SLICED from the probe's source
 * text at run time and compiled, with the slice's marker set asserted before it is compiled, and
 * with every transform applied to the slice declared and its occurrence count asserted. Cripples
 * are applied to the sliced text in memory.
 *
 * No brace comparison anywhere in this file.
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');

const PROBE = join(ROOT, 'scripts/probe-round373-the-red-hint-legs-ran-backwards-from-their-witnesses.mts');
const RECON = join(ROOT, 'docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs');
const SUBJECT = join(ROOT, 'scripts/sweep-probes.mjs');
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';

const probeSrc = readFileSync(PROBE, 'utf8');
const reconSrc = readFileSync(RECON, 'utf8');
const subjectSrc = readFileSync(SUBJECT, 'utf8');

const verdicts = [];
const rec = (id, claim, expectation, actual, hit) => {
  verdicts.push({ id, claim, expectation, actual, hit });
  console.log(`\n[${id}] ${hit ? 'HIT' : 'REFUTED'}  ${claim}`);
  console.log(`      registered: ${expectation}`);
  console.log(`      actual:     ${actual}`);
};

// ── Hygiene: no tracked product or script file moved ────────────────────────────────────────────
const diff = spawnSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], {
  cwd: ROOT,
  encoding: 'utf8',
});
console.log('=== HYGIENE ===');
console.log(`git diff --stat HEAD -- packages/ scripts/  rc=${diff.status}  bytes=${diff.stdout.length}`);
if (diff.status !== 0 || diff.stdout.length !== 0) {
  console.log('ABORT — packages/ or scripts/ is dirty. A frozen instrument may have been touched.');
  console.log(diff.stdout);
  process.exit(2);
}
console.log('EMPTY — asserted, not assumed.');

// ════════════════════════════════════════════════════════════════════════════════════════════════
// LEVEL 1 — THE QUOTATION
// ════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== LEVEL 1 — THE QUOTATION ===');

// P1 — the routed text, verbatim.
const QUOTED = "file: typeof e === 'string' ? e : e.file";
let p1n = 0;
for (let i = reconSrc.indexOf(QUOTED); i !== -1; i = reconSrc.indexOf(QUOTED, i + 1)) p1n++;
rec(
  'P1',
  'the routed text does not occur verbatim in recon.mjs',
  'ABSENT (0 occurrences)',
  `${p1n} occurrence(s) of ${JSON.stringify(QUOTED)}`,
  p1n === 0,
);

const reconLines = reconSrc.split('\n');

// P2 — `file:` in PROPERTY position: preceded by `{`, `,` or line-start modulo whitespace.
const PROP_KEY = /(?:^\s*|[{,]\s*)file\s*:/;
const p2hits = [];
reconLines.forEach((line, i) => {
  if (PROP_KEY.test(line)) p2hits.push({ line: i + 1, text: line.trim() });
});
console.log('\n  property-position hits, printed in full (a count read off rows nobody printed is not a reading):');
for (const h of p2hits) console.log(`    recon.mjs:${h.line}  ${h.text}`);
const p2ValueIsTernary = p2hits.map((h) => / \?[^:]*:/.test(h.text.slice(h.text.indexOf('file'))));
rec(
  'P2',
  '`file:` as a property label occurs in recon.mjs exactly once, and not on line 83',
  '1 occurrence, at line 89, value not a ternary',
  `${p2hits.length} occurrence(s) at line(s) [${p2hits.map((h) => h.line).join(', ')}]; ` +
    `value-is-ternary = [${p2ValueIsTernary.join(', ')}]`,
  p2hits.length === 1 && p2hits[0].line === 89 && p2ValueIsTernary[0] === false,
);

// P10 — against me: is the property-position constraint load-bearing?
const BARE_KEY = /file\s*:/;
const p10hits = [];
reconLines.forEach((line, i) => {
  if (BARE_KEY.test(line)) p10hits.push(i + 1);
});
rec(
  'P10',
  'the property-position constraint in my own P2 key is load-bearing: the unconstrained key gives a different count',
  'HIT — unconstrained 2, constrained 1',
  `unconstrained ${p10hits.length} at [${p10hits.join(', ')}], constrained ${p2hits.length} at ` +
    `[${p2hits.map((h) => h.line).join(', ')}]`,
  p10hits.length !== p2hits.length,
);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// LEVEL 2 — THE MECHANISM.  Registered as a HIT *for* his finding.
// ════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== LEVEL 2 — THE MECHANISM (registered as a HIT for his finding) ===');

// P3 — reconstruct the position-blind match and capture the character BEFORE it.
const l83 = reconLines[82];
const m83 = BARE_KEY.exec(l83);
const precedingChar = m83 ? l83[m83.index - 1] : null;
const afterColon = m83 ? l83.slice(m83.index + m83[0].length) : '';
const valueIsTernary = /^\s*typeof .* \? .* : .*/.test(afterColon);
console.log(`  recon.mjs:83 verbatim:  ${l83}`);
console.log(`  position-blind match at col ${m83 ? m83.index : '—'}, preceding char ${JSON.stringify(precedingChar)}`);
console.log(`  span after that colon:  ${JSON.stringify(afterColon.trim())}`);
rec(
  'P3',
  "his mechanism is real: a position-blind `file:` key matches line 83, where `file` is the TAIL of `e.file` and the `:` is a ternary's else-colon",
  'HIT — match present at line 83, preceding char `.`',
  `match ${m83 ? 'present' : 'absent'}; preceding char ${JSON.stringify(precedingChar)}; ` +
    `value-span is a ternary = ${valueIsTernary}`,
  Boolean(m83) && precedingChar === '.' && valueIsTernary,
);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// LEVEL 3 — THE REACH
// ════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== LEVEL 3 — THE REACH ===');

const probeLines = probeSrc.split('\n');
const KEY_TEXT = "/^\\s*file: '([^']+)',/";
const keyLines = [];
probeLines.forEach((line, i) => {
  if (line.includes(KEY_TEXT)) keyLines.push(i + 1);
});

// Full read-set census of the probe, printed rather than summarised.
const READ_SITE = /readFileSync\(|writeFileSync\(|copyFileSync\(|spawnSync\(|^import |await import\(/;
console.log('\n  every read / write / spawn / import site in the probe, printed in full:');
const readSites = [];
probeLines.forEach((line, i) => {
  if (READ_SITE.test(line)) {
    readSites.push(i + 1);
    console.log(`    probe:${String(i + 1).padStart(4)}  ${line.trim()}`);
  }
});

// Does the probe mention recon.mjs or its unit at all?
const reconMentions = ['recon.mjs', 'unit-307c4', 'blast-radius'].map((t) => [t, probeSrc.includes(t)]);

// The chain, each link asserted by an anchored source read rather than inferred.
const CHAIN = [
  ["const SWEEP = join(HERE, 'sweep-probes.mjs');", 'SWEEP is a single fixed path'],
  ["const sweepSrc = readFileSync(SWEEP, 'utf8');", "sweepSrc is that one file's text"],
  ["const srcLines = sweepSrc.split('\\n');", 'srcLines comes from sweepSrc and nothing else'],
];
console.log('\n  the reach chain, link by link:');
const chainOk = CHAIN.map(([needle, why]) => {
  let n = 0;
  for (let i = probeSrc.indexOf(needle); i !== -1; i = probeSrc.indexOf(needle, i + 1)) n++;
  console.log(`    ${n === 1 ? 'OK  ' : 'FAIL'} ${n}x  ${why}  <<${needle}>>`);
  return n === 1;
});

// Each key occurrence: walk back to its nearest enclosing `for (` and assert the iterable.
console.log('\n  each `file:` key occurrence, and the iterable of its own loop:');
const loopOk = keyLines.map((ln) => {
  let forLine = null;
  for (let i = ln - 2; i >= 0; i--) {
    if (probeLines[i].includes('for (')) {
      forLine = { n: i + 1, text: probeLines[i].trim() };
      break;
    }
  }
  const ok = forLine !== null && forLine.text === 'for (const line of srcLines) {';
  console.log(`    probe:${ln}  nearest preceding for( is probe:${forLine ? forLine.n : '—'}  ` +
    `${JSON.stringify(forLine ? forLine.text : null)}  ${ok ? 'OK' : 'FAIL'}`);
  return ok;
});

console.log('\n  does the probe mention the routed file at all?');
for (const [t, present] of reconMentions) console.log(`    ${JSON.stringify(t)}: ${present}`);

rec(
  'P4',
  "reach of my reader over recon.mjs is zero: both `file:` loops read exactly one file's text, scripts/sweep-probes.mjs, and recon.mjs is not in the probe's read set",
  '1 subject file; recon.mjs absent',
  `${keyLines.length} key occurrence(s) at probe lines [${keyLines.join(', ')}]; chain ` +
    `${chainOk.filter(Boolean).length} of ${chainOk.length}; loops ${loopOk.filter(Boolean).length} ` +
    `of ${loopOk.length} over srcLines; routed-file mentions ` +
    `${reconMentions.filter(([, p]) => p).length} of ${reconMentions.length}`,
  keyLines.length === 2 &&
    chainOk.every(Boolean) &&
    loopOk.every(Boolean) &&
    loopOk.length === 2 &&
    reconMentions.every(([, p]) => p === false),
);

// ── P5 + P5-KP — the hazard census on the REAL subject, with a known positive first ─────────────
/**
 * Count `file:` property lines whose value my key cannot read. The key is
 * `/^\s*file: '([^']+)',/` — line-start, single-quoted, comma-terminated. Any property-position
 * `file:` line that the key does NOT match is a line the walk goes blind at.
 */
const LIVE_KEY = /^\s*file: '([^']+)',/;
const unreadable = (lines, label) => {
  const out = [];
  lines.forEach((line, i) => {
    if (!PROP_KEY.test(line)) return;
    if (LIVE_KEY.test(line)) return;
    out.push({ line: i + 1, text: line.trim(), label });
  });
  return out;
};

// P5-KP FIRST, before the 0 is allowed to be a finding. Planted in memory, at the subject's own
// shape: one ternary-valued `file:`, one double-quoted `file:`.
const KP_PLANTED = [
  "    file: cond ? 'probe-a.mts' : 'probe-b.mts',",
  '    file: "probe-double-quoted.mts",',
  "    file: 'probe-readable.mts',", // negative cell: the key CAN read this one
];
const kpHits = unreadable(KP_PLANTED, 'KP');
console.log('\n  P5-KP — the counter on planted cells, before any 0 off the live subject is read:');
for (const c of KP_PLANTED) console.log(`    cell: ${c}`);
for (const h of kpHits) console.log(`    counted unreadable: cell ${h.line}  ${h.text}`);
rec(
  'P5-KP',
  'the P5 counter has a known positive: it counts a ternary-valued and a double-quoted `file:` as unreadable, and does NOT count a readable one',
  '>= 2 on the planted cells (and the readable cell not counted)',
  `${kpHits.length} of 3 planted cells counted unreadable, at cell(s) [${kpHits.map((h) => h.line).join(', ')}]`,
  kpHits.length === 2 && !kpHits.some((h) => h.line === 3),
);

const subjectLines = subjectSrc.split('\n');
const p5hits = unreadable(subjectLines, 'LIVE');
const subjectPropLines = subjectLines.filter((l) => PROP_KEY.test(l)).length;
console.log(`\n  live subject: ${subjectPropLines} property-position \`file:\` line(s) in scripts/sweep-probes.mjs`);
for (const h of p5hits) console.log(`    UNREADABLE  sweep-probes.mjs:${h.line}  ${h.text}`);
rec(
  'P5',
  'hazard census on the real subject: no `file:` property line in scripts/sweep-probes.mjs defeats my key',
  '0',
  `${p5hits.length} unreadable of ${subjectPropLines} property-position \`file:\` line(s)`,
  p5hits.length === 0,
);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// THE GUARD LEGS — slice the probe's own A1/A2 predicates, compile, drive three ways
// ════════════════════════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== GUARD LEGS — A1/A2 sliced from the probe at run time ===');

const SLICE_START = "const srcLines = sweepSrc.split('\\n');";
const SLICE_END_ANCHOR = 'SWEPT.filter((s) => s.refusal || s.skip).reduce((n, s) => n + ownerCount(s.file), 0),';
const si = probeSrc.indexOf(SLICE_START);
const ei = probeSrc.indexOf(SLICE_END_ANCHOR);
if (si === -1 || ei === -1 || ei < si) {
  console.log('ABORT — slice anchors not found or out of order. A present anchor is not an intact span.');
  process.exit(2);
}
const closeAt = probeSrc.indexOf('\n);', ei);
if (closeAt === -1) {
  console.log('ABORT — slice end found no closing `);`.');
  process.exit(2);
}
let slice = probeSrc.slice(si, closeAt + 3);
console.log(`  slice: ${slice.length} bytes, probe source offsets ${si}..${closeAt + 3}`);

// Marker set asserted on the slice BEFORE it is transformed or compiled.
const MARKERS = [
  [KEY_TEXT, 2],
  ['kpOwner === R225', 1],
  ['sourcePop === objectPop', 1],
  ['ownerCount(R225) === 2', 1],
  // CORRECTED on the arm's first drive, which ABORTED here rather than publishing: this span holds
  // `owners.length ===` TWICE — once in the 2026-11-07 re-key docblock quoting the arm it replaced,
  // and once in the live ORPHAN clause. I registered 1 from reading the code and not the prose. The
  // loose marker therefore asserts 2, and the load-bearing one is the exact ORPHAN clause below,
  // which is code-only and cannot be satisfied by a comment.
  ['owners.length ===', 2],
  [
    'owners.length ===\n      SWEPT.filter((s) => s.refusal || s.skip).reduce((n, s) => n + ownerCount(s.file), 0),',
    1,
  ],
  ['check(', 2],
  ["const owners: string[] = [];", 1],
  ['const ownerCount = (f: string) =>', 1],
];
console.log('  slice markers, asserted before compiling:');
const markersOk = MARKERS.map(([needle, want]) => {
  let n = 0;
  for (let i = slice.indexOf(needle); i !== -1; i = slice.indexOf(needle, i + 1)) n++;
  console.log(`    ${n === want ? 'OK  ' : 'FAIL'} want ${want} got ${n}  <<${needle}>>`);
  return n === want;
});
if (!markersOk.every(Boolean)) {
  console.log('ABORT — slice marker set does not hold. The span is not the one this arm was written for.');
  process.exit(2);
}

// Declared transforms, each with its occurrence count asserted. Two strip TypeScript annotations
// (the slice is .mts text compiled dynamically, where node's type stripping does not reach); one
// redirects the probe's `check` to a capture. Nothing else is rewritten.
const TRANSFORMS = [
  ['const owners: string[] = [];', 'const owners = [];', 1],
  ['const ownerCount = (f: string) =>', 'const ownerCount = (f) =>', 1],
  ['check(', 'CAPTURE(', 2],
];
console.log('  declared transforms on the slice:');
for (const [from, to, want] of TRANSFORMS) {
  let n = 0;
  for (let i = slice.indexOf(from); i !== -1; i = slice.indexOf(from, i + 1)) n++;
  if (n !== want) {
    console.log(`    FAIL want ${want} got ${n}  <<${from}>>`);
    process.exit(2);
  }
  slice = slice.split(from).join(to);
  console.log(`    OK   ${n}x  ${JSON.stringify(from)} -> ${JSON.stringify(to)}`);
}

const compiled = new Function('sweepSrc', 'SWEPT', 'R225', 'CAPTURE', `${slice}\n`);
const { SWEPT } = await import(`file://${SUBJECT}`);

const drive = (label, text) => {
  const got = new Map();
  try {
    compiled(text, SWEPT, R225, (id, desc, ok) => got.set(id, { ok, desc }));
  } catch (e) {
    console.log(`  ${label}: THREW ${e && e.message}`);
    return { A1: null, A2: null, threw: String(e && e.message) };
  }
  const A1 = got.get('A1');
  const A2 = got.get('A2');
  console.log(`  ${label}: A1=${A1 ? A1.ok : null}  A2=${A2 ? A2.ok : null}`);
  return { A1: A1 ? A1.ok : null, A2: A2 ? A2.ok : null, threw: null };
};

console.log('\n  three drives of the SAME compiled slice, one variable each:');
const live = drive('LIVE          (real subject, real key)', subjectSrc);

// KEY-CRIPPLE — the key's quote class changed so it matches nothing. Applied to the sliced text.
let crippledSliceSrc = slice;
{
  const from = "/^\\s*file: '([^']+)',/";
  const to = '/^\\s*file: "([^"]+)",/';
  let n = 0;
  for (let i = crippledSliceSrc.indexOf(from); i !== -1; i = crippledSliceSrc.indexOf(from, i + 1)) n++;
  if (n !== 2) {
    console.log(`  ABORT — key-cripple wanted 2 occurrences, found ${n}.`);
    process.exit(2);
  }
  crippledSliceSrc = crippledSliceSrc.split(from).join(to);
}
const crippledCompiled = new Function('sweepSrc', 'SWEPT', 'R225', 'CAPTURE', `${crippledSliceSrc}\n`);
const driveCrippled = (label, text) => {
  const got = new Map();
  try {
    crippledCompiled(text, SWEPT, R225, (id, desc, ok) => got.set(id, { ok, desc }));
  } catch (e) {
    console.log(`  ${label}: THREW ${e && e.message}`);
    return { A1: null, A2: null, threw: String(e && e.message) };
  }
  const A1 = got.get('A1');
  const A2 = got.get('A2');
  console.log(`  ${label}: A1=${A1 ? A1.ok : null}  A2=${A2 ? A2.ok : null}`);
  return { A1: A1 ? A1.ok : null, A2: A2 ? A2.ok : null, threw: null };
};
const keyCripple = driveCrippled('KEY-CRIPPLE   (real subject, dead key)', subjectSrc);

// HAZARD-SIM — key alive; ONE subject `file:` value turned into a ternary, in memory only.
const PLANT_FROM = `    file: '${R225}',`;
let plantN = 0;
for (let i = subjectSrc.indexOf(PLANT_FROM); i !== -1; i = subjectSrc.indexOf(PLANT_FROM, i + 1)) plantN++;
console.log(`\n  HAZARD-SIM plant target ${JSON.stringify(PLANT_FROM)} occurs ${plantN}x in the subject`);
let hazardText = null;
if (plantN === 1) {
  hazardText = subjectSrc.replace(PLANT_FROM, `    file: COND ? '${R225}' : 'other.mts',`);
}
const hazard = hazardText ? drive('HAZARD-SIM    (planted subject, real key)', hazardText) : { A1: null, A2: null, threw: 'plant target not unique' };

rec(
  'P6',
  'a dead `file:` key in this probe is not silent: A1, the probe\'s own known positive, goes false',
  'A1 live true -> crippled false',
  `A1 live=${live.A1}  key-cripple=${keyCripple.A1}`,
  live.A1 === true && keyCripple.A1 === false,
);
rec(
  'P7',
  "A2's cross-key agreement also catches a dead key",
  'A2 live true -> crippled false',
  `A2 live=${live.A2}  key-cripple=${keyCripple.A2}`,
  live.A2 === true && keyCripple.A2 === false,
);
rec(
  'P11',
  'under HAZARD-SIM — key alive, one subject `file:` value turned into a ternary — A1 goes false',
  'A1 live true -> HAZARD-SIM false',
  `A1 live=${live.A1}  hazard-sim=${hazard.A1}  (plant occurrences ${plantN})`,
  live.A1 === true && hazard.A1 === false,
);
const pairsDiffer = `${keyCripple.A1}/${keyCripple.A2}` !== `${hazard.A1}/${hazard.A2}`;
rec(
  'P12',
  'the two cripples are not one cripple: at least one of A1/A2 separates KEY-CRIPPLE from HAZARD-SIM',
  'registered OPEN — either outcome reportable, neither a HIT for me',
  `key-cripple pair ${keyCripple.A1}/${keyCripple.A2}; hazard-sim pair ${hazard.A1}/${hazard.A2}; ` +
    `differ=${pairsDiffer}`,
  pairsDiffer,
);

// ── P8, P9 — the two numbers, in one sentence or neither ────────────────────────────────────────
console.log('\n\n=== THE TWO NUMBERS ===');
const reachable = reconMentions.every(([, p]) => p === false) && p5hits.length === 0 ? 0 : -1;
const guarded = keyLines.length === 2 && live.A1 === true && keyCripple.A1 === false && hazard.A1 === false
  ? keyLines.length
  : -1;
console.log(`  of the probe's ${keyLines.length} \`file:\` key occurrences:`);
console.log(`    reachable by the routed ternary                                  ${reachable}`);
console.log(`    guarded by a known positive that reddens when the key dies       ${guarded}`);
rec(
  'P8',
  'the consumer-level answer, both numbers or neither',
  '0 reachable, 2 guarded',
  `${reachable} reachable, ${guarded} guarded`,
  reachable === 0 && guarded === 2,
);
rec(
  'P9',
  "my site is a SHAPE member and not a HAZARD member under his own definition, so his PH3 (hazard 1 of 6) HELD and its refutation was an artefact of the position-blind key P3 names",
  'HIT — PH3 held; hazard 1, gap 5',
  `reach of my reader over the routed ternary = ${reachable}; his published hazard 2 of 6 -> ` +
    `1 of 6 with my site moved to SHAPE; gap 4 -> 5`,
  reachable === 0 && Boolean(m83) && precedingChar === '.',
);

// ── Summary ─────────────────────────────────────────────────────────────────────────────────────
console.log('\n\n=== SUMMARY ===');
for (const v of verdicts) console.log(`  ${v.hit ? 'HIT    ' : 'REFUTED'}  ${v.id}`);
const hits = verdicts.filter((v) => v.hit).length;
console.log(`\n  ${hits} of ${verdicts.length} registered predictions HIT, ${verdicts.length - hits} REFUTED.`);
console.log('  NOT MEASURED: whether a 2-hit reader of `file:` in a round-373 probe is worth curing.');
console.log('  That is a judgement, and this arm deliberately does not make it — it prices the');
console.log('  breakage (0 reachable) and the detection (2 guarded) and stops.');
