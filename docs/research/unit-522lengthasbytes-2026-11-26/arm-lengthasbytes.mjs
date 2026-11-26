#!/usr/bin/env node
/**
 * unit-522 ARM — the `.length`-as-bytes census.
 *
 * Registered in PRE-REGISTRATION.md at commit f7296f964384, pushed 2026-11-26 10:49:30 PST,
 * before this file existed.
 *
 * Item provenance: unit-520 §6/§7 named this census and did not run it; Argus declined it on
 * 11-26 ("no sweep-level reader makes that census cheap — it closes back onto you"); Daedalus's
 * 11-26 §7 lists it as Theseus's and untouched. So it is this seat's, unblocked.
 *
 * RAW SOURCE, DELIBERATELY. The unit label lives inside a string or template literal and the
 * `.length` lives inside that template's `${…}`, so blanking string bodies with
 * `scripts/lib/strip-source.mjs` — which is the right answer to unit-521's paren question — would
 * destroy the association this census is about. L1 (prose/comment sites) is declared, not cured.
 *
 * DISPLAY: member line text is printed WHOLE, never truncated. Daedalus registered a refuted
 * prediction this morning off his own instrument's 150-character display field, where the cut fell
 * exactly on the deciding `.map(...)`. A prediction registered off a display field is a prediction
 * about the display, so this arm has no display field to be wrong about.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const SELF = 'docs/research/unit-522lengthasbytes-2026-11-26/arm-lengthasbytes.mjs';

/* The chain whose far end is unit-514's arm. Nothing below is retyped: unit-520's arm source
 * supplies both the paths and the extractor, and unit-520 got the extractor from unit-514. */
const CHAIN_ARM = 'docs/research/unit-520builtlabelreach-2026-11-25/arm-builtlabelreach.mjs';

/* KP1 is SLICED, not planted — the defect is already in the tree, so a real cell is available. */
const KP1_FILE = 'docs/research/unit-520builtlabelreach-2026-11-25/posthoc-whose-plants.mjs';
const KP1_LINE = 37;
/* KN1 is SLICED too, from a shared library rather than from this thread's instruments. */
const KN1_FILE = 'scripts/lib/strip-source.mjs';
const KN1_LINE = 143;

const P1_INTERVAL = [1, 6];       // UNIT-LABEL in the live corpus
const P2_INTERVAL = [0, 2];       // CROSS-BYTE-CMP
const P4_INTERVAL = [20, 400];    // LENGTH-TO-LENGTH
const P5_SITE_FLOOR = 2000;       // vacuity floor on total `.length` sites
const P5_SHARE = [85, 99];        // NO-COMPARISON share, percent
const P7_INTERVAL = [648, 660];   // population, grown past unit-520's published 646
const P8_INTERVAL = [0, 1];       // UNIT-LABEL sites outside docs/research/
const P10_INTERVAL = [1, 4];      // UNIT-LABEL sites that are NOT unit-520's own — the reach

const say = (...a) => console.log(...a);
const V = [];
const grade = (id, claim, got, lo, hi) => {
  const ok = got >= lo && got <= hi;
  V.push({ id, claim, got, lo, hi, verdict: ok ? 'HIT' : 'REFUTED' });
  say(`  ${ok ? 'HIT     ' : 'REFUTED '} ${id}  ${claim}`);
  say(`           registered [${lo}, ${hi}]   measured ${got}`);
};

/* ======================================================= §0 NO PRODUCT DIFF */

say('=== §0 THIS UNIT TOUCHES NO PRODUCT CODE ===\n');
const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`  git diff --stat HEAD -- packages/ scripts/ : ${productDiff === '' ? 'EMPTY' : `NOT EMPTY\n${productDiff}`}`);
if (productDiff !== '') { say('\n  ABORT — product diff must be empty before this measures anything.'); process.exit(1); }

/* ======================================================= §1 POPULATION FILTER, EXTRACTED */

say('\n=== §1 POPULATION FILTER — extracted through unit-520 back to unit-514, never retyped ===\n');

const chainSrc = readFileSync(CHAIN_ARM, 'utf8');
const priorPath = chainSrc.match(/const PRIOR = '([^']+)';/)?.[1] ?? null;
const priorArmPath = chainSrc.match(/const PRIOR_ARM = '([^']+)';/)?.[1] ?? null;
const extractorOfExtractor = chainSrc.match(/const extractorMatch = priorSrc\.match\((\/.+?\/)\);/)?.[1] ?? null;
say(`  unit-520's PRIOR      : ${priorPath ?? '(NOT FOUND)'}`);
say(`  unit-520's PRIOR_ARM  : ${priorArmPath ?? '(NOT FOUND)'}`);
say(`  unit-520's extractor  : ${extractorOfExtractor ?? '(NOT FOUND)'}`);

let extRe = null;
let filterLiteral = null;
if (priorPath && priorArmPath && extractorOfExtractor) {
  const extractorRe = new RegExp(extractorOfExtractor.slice(1, extractorOfExtractor.lastIndexOf('/')));
  const inner = readFileSync(priorPath, 'utf8').match(extractorRe)?.[1] ?? null;
  say(`  unit-514's extractor, sliced with it: ${inner ?? '(NOT FOUND)'}`);
  if (inner) {
    const innerRe = new RegExp(inner.slice(1, inner.lastIndexOf('/')));
    filterLiteral = readFileSync(priorArmPath, 'utf8').match(innerRe)?.[1] ?? null;
    if (filterLiteral) extRe = new RegExp(filterLiteral.slice(1, filterLiteral.lastIndexOf('/')));
  }
}
say(`  the population filter, four links out: ${filterLiteral ?? '(NOT FOUND)'}`);

const extKp = extRe
  ? [['a.mjs', true], ['b.js', true], ['c.md', false], ['d.ts', false]].map(([p, want]) => ({ p, want, got: extRe.test(p), ok: extRe.test(p) === want }))
  : [];
const extKpOk = extKp.length === 4 && extKp.every((k) => k.ok);
say(`  filter KP: ${extKp.map((k) => `${k.p}→${k.got}`).join(' ')}  ${extKpOk ? 'PASS' : 'FAIL'}`);
if (!extRe || !extKpOk) { say('\n  ABORT — the extracted filter is absent or does not behave.'); process.exit(1); }

/* ======================================================= §2 THE KEY */

/* The byte-unit tail test. `tail` is cut at the next `${` so an interpolation downstream of the
 * `.length` cannot supply the label; the gap is capped at 8 characters of closers/whitespace. */
const UNIT_TAIL = /^[}\s)\]'"`,.:;+\-=]{0,8}(B|bytes|byte)\b/;
const CMP = '(?:===|!==|==|<=|>=|<|>)';
const RIGHT_CMP = new RegExp(`^\\s*(${CMP})\\s*([^;,){}]{0,80})`);
const LEFT_CMP = new RegExp(`([^<>=!;,({}]{0,80}?)\\s*(${CMP})\\s*[A-Za-z0-9_$.\\[\\]'"\`() ]*$`);
const BYTE_READER = /byteLength|wc -c|stat -f%z|statSync\([^)]*\)\.size/;

/** The cell for one `.length` occurrence at `idx` on `line`. */
function keyOf(line, idx) {
  const after = idx + '.length'.length;
  const rawTail = line.slice(after);
  const cutAt = rawTail.indexOf('${');
  const labelTail = cutAt === -1 ? rawTail : rawTail.slice(0, cutAt);
  if (UNIT_TAIL.test(labelTail)) return { cell: 'UNIT-LABEL', other: labelTail.match(UNIT_TAIL)[1] };

  const r = rawTail.match(RIGHT_CMP);
  if (r) {
    const other = r[2].trim();
    if (BYTE_READER.test(other)) return { cell: 'CROSS-BYTE-CMP', other };
    if (other.includes('.length')) return { cell: 'LENGTH-TO-LENGTH', other };
    return { cell: 'OTHER-CMP', other };
  }
  const l = line.slice(0, idx).match(LEFT_CMP);
  if (l) {
    const other = l[1].trim();
    if (BYTE_READER.test(other)) return { cell: 'CROSS-BYTE-CMP', other };
    if (other.includes('.length')) return { cell: 'LENGTH-TO-LENGTH', other };
    return { cell: 'OTHER-CMP', other };
  }
  return { cell: 'NO-COMPARISON', other: '' };
}

/* ======================================================= §3 KPs BEFORE ANY CENSUS */

say('\n=== §3 KNOWN POSITIVES — 5 cells, each declared sliced or planted, + 1 sliced negative ===\n');

const kp1Text = readFileSync(KP1_FILE, 'utf8').split('\n')[KP1_LINE - 1];
const kn1Text = readFileSync(KN1_FILE, 'utf8').split('\n')[KN1_LINE - 1];

const firstKey = (line) => {
  const i = line.indexOf('.length');
  return i === -1 ? { cell: '(NO .length ON THE LINE)', other: '' } : keyOf(line, i);
};

const cells = [
  { id: 'KP1', origin: 'SLICED', want: 'UNIT-LABEL', line: kp1Text, note: `${KP1_FILE}:${KP1_LINE} — the 8497 B print unit-520 §7 found` },
  { id: 'KP2', origin: 'PLANTED', want: 'CROSS-BYTE-CMP', line: '  if (cap.length !== Buffer.byteLength(cap)) {', note: 'the class §6 named as the silent one' },
  { id: 'KP3', origin: 'PLANTED', want: 'LENGTH-TO-LENGTH', line: '  if (a.length === b.length) {', note: 'the class §6 called unaffected' },
  { id: 'KP4', origin: 'PLANTED', want: 'NO-COMPARISON', line: '  const n = rows.filter((r) => r).length;', note: 'the FALL-THROUGH cell — reachability control' },
  { id: 'KP5', origin: 'PLANTED', want: 'OTHER-CMP', line: '  if (xs.length > 3) {', note: 'so OTHER-CMP is not a silent dumping ground either' },
];
for (const c of cells) {
  const k = firstKey(c.line);
  c.got = k.cell;
  c.ok = k.cell === c.want;
  say(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.id} (${c.origin})  want ${c.want}  got ${c.got}`);
  say(`        ${c.note}`);
  say(`        line: ${c.line}`);
}
const kn1 = firstKey(kn1Text);
const kn1Ok = kn1.cell !== 'UNIT-LABEL' && kn1.cell !== 'CROSS-BYTE-CMP';
say(`  ${kn1Ok ? 'PASS' : 'FAIL'}  KN1 (SLICED NEGATIVE)  must key neither byte cell  got ${kn1.cell}`);
say(`        ${KN1_FILE}:${KN1_LINE}`);
say(`        line: ${kn1Text}`);

const kpOk = cells.every((c) => c.ok) && kn1Ok;
say(`\n  KP summary: ${cells.filter((c) => c.ok).length} of 5 positives, negative ${kn1Ok ? 'PASS' : 'FAIL'} → ${kpOk ? 'the key may be pointed at the corpus' : 'ABORT'}`);
if (!kpOk) { say('\n  ABORT — a census is not published off an ungraded key.'); process.exit(1); }

/* ======================================================= §4 THE CENSUS */

say('\n=== §4 CENSUS over the tracked population under the extracted filter ===\n');

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter((p) => extRe.test(p));
const pop = tracked.filter((p) => p !== SELF);
say(`  tracked files matching the extracted filter: ${tracked.length}`);
say(`  THIS FILE in that list: ${tracked.includes(SELF)} — excluded by path either way, it carries planted cells`);
say(`  population measured: ${pop.length}`);

const tally = { 'UNIT-LABEL': 0, 'CROSS-BYTE-CMP': 0, 'LENGTH-TO-LENGTH': 0, 'OTHER-CMP': 0, 'NO-COMPARISON': 0 };
const members = { 'UNIT-LABEL': [], 'CROSS-BYTE-CMP': [] };
let unreadable = 0;
let filesWithSite = 0;

for (const p of pop) {
  let src;
  try { src = readFileSync(p, 'utf8'); } catch { unreadable++; continue; }
  const lines = src.split('\n');
  let any = false;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    let i = line.indexOf('.length');
    while (i !== -1) {
      const k = keyOf(line, i);
      tally[k.cell]++;
      any = true;
      if (members[k.cell]) members[k.cell].push({ p, n: n + 1, line, other: k.other });
      i = line.indexOf('.length', i + 1);
    }
  }
  if (any) filesWithSite++;
}

const total = Object.values(tally).reduce((a, b) => a + b, 0);
say(`  unreadable files: ${unreadable}`);
say(`  files with at least one \`.length\` site: ${filesWithSite} of ${pop.length}`);
say(`  total \`.length\` sites: ${total}\n`);
for (const [k, v] of Object.entries(tally)) say(`    ${k.padEnd(18)} ${String(v).padStart(6)}`);
const shareNoCmp = total === 0 ? 0 : (tally['NO-COMPARISON'] / total) * 100;
say(`\n  NO-COMPARISON share: ${shareNoCmp.toFixed(2)}%`);

/* ======================================================= §5 MEMBERS, WHOLE LINES */

say('\n=== §5 MEMBERS — every byte-cell site, line text WHOLE and untruncated ===\n');
for (const cell of ['UNIT-LABEL', 'CROSS-BYTE-CMP']) {
  say(`  ${cell} — ${members[cell].length} site(s):`);
  if (members[cell].length === 0) say('    (none)');
  for (const m of members[cell]) {
    say(`    ${m.p}:${m.n}   unit token/other operand: ${JSON.stringify(m.other)}`);
    say(`      ${m.line}`);
  }
  say('');
}

const outsideResearch = members['UNIT-LABEL'].filter((m) => !m.p.startsWith('docs/research/'));
const notUnit520 = members['UNIT-LABEL'].filter((m) => !m.p.includes('unit-520builtlabelreach'));
say(`  UNIT-LABEL outside docs/research/: ${outsideResearch.length}${outsideResearch.length ? ` — ${outsideResearch.map((m) => `${m.p}:${m.n}`).join(', ')}` : ''}`);
say(`  UNIT-LABEL that are NOT unit-520's own: ${notUnit520.length} — the reach figure P10 registers`);
say(`    ${notUnit520.map((m) => `${m.p}:${m.n}`).join('\n    ') || '(none)'}`);

/* ======================================================= §6 GRADING */

say('\n=== §6 GRADING against PRE-REGISTRATION.md ===\n');
grade('P1', 'UNIT-LABEL sites in the live corpus', tally['UNIT-LABEL'], ...P1_INTERVAL);
grade('P2', 'CROSS-BYTE-CMP sites — a `.length` compared against a byte reader', tally['CROSS-BYTE-CMP'], ...P2_INTERVAL);
say('  OPEN     P3  whether a UNIT-LABEL site is a TRUE mislabel is not decidable from source — resolved by hand-reading in the post-hoc, not here');
grade('P4', 'LENGTH-TO-LENGTH sites — the class §6 called unaffected', tally['LENGTH-TO-LENGTH'], ...P4_INTERVAL);
grade('P5a', 'vacuity floor: total `.length` sites', total, P5_SITE_FLOOR, 40000);
grade('P5b', 'NO-COMPARISON share, percent', Number(shareNoCmp.toFixed(2)), ...P5_SHARE);
grade('P6', 'KP positives keying their own cell', cells.filter((c) => c.ok).length, 5, 5);
grade('P7', 'population, grown past unit-520\'s published 646', pop.length, ...P7_INTERVAL);
grade('P8', 'UNIT-LABEL sites outside docs/research/', outsideResearch.length, ...P8_INTERVAL);
say('  OPEN     P9  at least one UNIT-LABEL site is an L1 prose false positive — count unknown, resolved by hand-reading the whole lines in §5');
grade('P10', 'UNIT-LABEL sites that are NOT unit-520\'s own — THE REACH', notUnit520.length, ...P10_INTERVAL);

const hits = V.filter((v) => v.verdict === 'HIT').length;
const refs = V.filter((v) => v.verdict === 'REFUTED').length;
say(`\n  graded here: ${V.length} — ${hits} HIT, ${refs} REFUTED; 2 registered OPEN (P3, P9) for the post-hoc`);
if (refs) {
  say('\n  REFUTED, named:');
  for (const v of V.filter((x) => x.verdict === 'REFUTED')) say(`    ${v.id}  ${v.claim}: registered [${v.lo}, ${v.hi}], measured ${v.got}`);
}
say('\n=== END ARM ===');
