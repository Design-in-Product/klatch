/**
 * unit-519positionblindkey — the cure for my own unit-517 hazard key, and both censuses printed.
 *
 * Registered in PRE-REGISTRATION.md (`d653c236`, pushed to `main` 17:21:18 PST) before this file
 * existed. P1–P10.
 *
 * SUBJECT: `docs/research/unit-517branchorder-2026-11-25/posthoc-hazard.mjs:143` —
 *   `const KEY = new RegExp(`\\b${name}\\s*:`, 'g');`
 * `\b` is satisfied by a preceding `.`, so the key matches the tail of a member expression
 * (`e.file`) when a ternary's else-colon follows it. Routed back by Theseus's `unit-518` with the
 * separating cell; re-read off the tracked file here rather than taken on trust.
 *
 * THE READERS ARE SLICED, NOT RETYPED. `AT`/`OPENERS`/`CLOSERS`/`valueSpan`/`valueSpanV2`/
 * `ternaryQ`/`ternaryQV2`/`literalsOf`/`sitesOf` are sliced out of the published
 * `posthoc-hazard.mjs` at run time and compiled, so the v1/v2 columns below are produced by the
 * same code that published them. **The ONLY thing this arm defines itself is the key**, which is
 * the variable under test. No textual substitution is applied to the sliced span — a blanket
 * substitution would risk rewriting its own replacement.
 *
 * NO CHARACTER COMPARISON AGAINST A BRACE, PAREN OR COLON anywhere in this file. "Is this a
 * property position" is expressed as a regex character class. A `=== '{'`-shaped comparison is
 * `scripts/verify-decl-body-slicers.mjs:97`'s population key, and expressing the cure that way
 * would admit this file to that gate's population — the over-admission that reddened `unit-515`'s
 * arm this morning. §0 ASSERTS the absence rather than claiming it in prose.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
const U517 = join(ROOT, 'docs/research/unit-517branchorder-2026-11-25');
mkdirSync(CAPS, { recursive: true });

const lines = [];
const say = (s) => { lines.push(s); console.log(s); };
let failures = 0;
const fail = (m) => { failures += 1; say(`  FAIL  ${m}`); };
const rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();

say(`unit-519positionblindkey — HEAD ${rev}`);
say('');

// ───────────────────────────────────────────── §0 — preconditions, asserted

say('§0  preconditions');
const dirty = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { cwd: ROOT, encoding: 'utf8' });
say(`  git diff --stat HEAD -- packages/ scripts/ : ${dirty.trim() === '' ? 'EMPTY' : 'NON-EMPTY'}`);
if (dirty.trim() !== '') fail('packages/ or scripts/ is dirty — this unit must not have touched either');

const SELF = readFileSync(join(HERE, 'arm-positionblindkey.mjs'), 'utf8');
const CMP_KEY = /[=!]==?\s*['"`]\\?\{['"`]|['"`]\\?\{['"`]\s*[=!]==?/;
say(`  this arm contains a verify-decl-body-slicers-shaped comparison against a brace: ${CMP_KEY.test(stripSource(SELF, false))}`);
if (CMP_KEY.test(stripSource(SELF, false))) fail('this arm would join verify-decl-body-slicers\' population');

const SUBJ_REL = 'docs/research/unit-517branchorder-2026-11-25/posthoc-hazard.mjs';
const trackedSubj = execFileSync('git', ['ls-files', '--', SUBJ_REL], { cwd: ROOT, encoding: 'utf8' }).trim();
say(`  subject is git-tracked at the path read: ${trackedSubj === SUBJ_REL}`);
if (trackedSubj !== SUBJ_REL) fail('subject not tracked at that path');
const SUBJ = readFileSync(join(ROOT, SUBJ_REL), 'utf8');
say('');

// ───────────────────────────────────────────── §1 — P1: the subject key, read not recalled

say('§1  P1 — the subject key, printed verbatim out of the tracked file');
const keyLineIdx = SUBJ.split('\n').findIndex((l) => l.includes('const KEY = new RegExp('));
const keyLine = SUBJ.split('\n')[keyLineIdx];
say(`  posthoc-hazard.mjs:${keyLineIdx + 1}   ${keyLine.trim()}`);
const hasWordBoundary = keyLine.includes('\\\\b${name}\\\\s*:');
const hasPositionClass = keyLine.includes('[^\\w$.]');
say(`  carries the \\b word-boundary form: ${hasWordBoundary}`);
say(`  carries a preceding-character class: ${hasPositionClass}`);
const P1 = hasWordBoundary && !hasPositionClass;
say(`  P1 (position-blind by construction): ${P1}`);
if (!P1) fail('P1 — the subject key is not what the pre-registration says it is');
say('');

// ───────────────────────────────────────────── the sliced readers

say('§1b  the v1/v2 readers, SLICED out of the published post-hoc and compiled');
const START = 'const AT = (s, ch, i) =>';
const END_ANCHOR = '  return out;\n};';
const s0 = SUBJ.indexOf(START);
const sitesIdx = SUBJ.indexOf('const sitesOf = (src, name, v2 = false) =>');
const s1 = SUBJ.indexOf(END_ANCHOR, sitesIdx);
if (s0 === -1 || sitesIdx === -1 || s1 === -1) fail('slice anchors not found in the subject');
const SPAN = SUBJ.slice(s0, s1 + END_ANCHOR.length);
say(`  span ${SPAN.length} B, from "${START}" to the close of sitesOf`);
for (const marker of ['const AT =', 'const OPENERS', 'const CLOSERS', 'const valueSpan =', 'const valueSpanV2 =',
  'const ternaryQ =', 'const ternaryQV2 =', 'const ternaryColon =', 'const literalsOf =', 'const sitesOf =',
  'new RegExp(`\\\\b${name}\\\\s*:`', 'stripSource(src, true)', 'stripSource(src, false)']) {
  const present = SPAN.includes(marker);
  if (!present) fail(`slice marker absent: ${marker}`);
  say(`    ${present ? 'present' : 'ABSENT '}  ${marker}`);
}
const H = new Function('stripSource', `${SPAN}\nreturn { valueSpanV2, ternaryQV2, literalsOf, sitesOf };`)(stripSource);
say(`  compiled: ${Object.keys(H).join(', ')}`);
say('');

// ───────────────────────────────────────────── the cure — the ONLY thing this arm defines

/**
 * The cured key. A property name in property position is not preceded by an identifier character,
 * `$`, or `.`. Expressed as a regex character class; the match consumes that one preceding
 * character, so `line` is computed from the name's own offset and not the match's.
 */
const CURED_KEY = (name) => new RegExp(`(^|[^\\w$.])(${name})\\s*:`, 'gm');

const sitesOfCured = (src, name) => {
  const code = stripSource(src, true);
  const kept = stripSource(src, false);
  const out = [];
  for (const m of code.matchAll(CURED_KEY(name))) {
    const nameAt = m.index + m[1].length;
    const at = m.index + m[0].length;
    const end = H.valueSpanV2(code, at);
    const expr = kept.slice(at, end).trim();
    out.push({ at, nameAt, expr, prev: m[1] === '' ? '(line-start)' : JSON.stringify(m[1]),
      ternary: H.ternaryQV2(expr) !== -1, line: src.slice(0, nameAt).split('\n').length });
  }
  return out;
};

// ───────────────────────────────────────────── §2 — P9: the KP set, sliced out of real files

say('§2  P9 — known cells, each SLICED out of the real tracked file (not retyped into this arm)');
const KP = [
  ['NEGATIVE', 'docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs', 83, 'file', 0],
  ['POSITIVE', 'docs/research/unit-513consumernull-2026-11-24/arm-consumernull.mjs', 160, 'cls', 1],
  ['POSITIVE', 'docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs', 72, 'cls', 1],
  ['POSITIVE', 'docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs', 75, 'cls', 1],
  ['POSITIVE', 'docs/research/unit-513consumernull-2026-11-24/posthoc-shape-classes.mjs', 214, 'cls', 1],
];
let kpPass = 0;
for (const [kind, rel, lineNo, name, wantCured] of KP) {
  const whole = readFileSync(join(ROOT, rel), 'utf8');
  const line = whole.split('\n')[lineNo - 1];
  const blind = [...stripSource(line, true).matchAll(new RegExp(`\\b${name}\\s*:`, 'g'))].length;
  const cured = sitesOfCured(line, name).length;
  const ok = cured === wantCured;
  if (ok) kpPass += 1;
  say(`  ${ok ? 'pass' : 'FAIL'}  ${kind}  ${rel.split('/').pop()}:${lineNo}  [${name}]  position-blind ${blind} → cured ${cured} (want ${wantCured})`);
  say(`          ${line.trim().slice(0, 96)}`);
}
say(`  P9 KP: ${kpPass} of ${KP.length}`);
if (kpPass !== KP.length) fail('P9 — the cure does not hold its known cells; no census below is reportable');
say('');

// P2, stated as its own row because the pre-registration names it as its own prediction
const reconLine = readFileSync(join(ROOT, 'docs/research/unit-307c4-blast-radius-2026-10-27/recon.mjs'), 'utf8').split('\n')[82];
const p2blind = [...stripSource(reconLine, true).matchAll(/\bfile\s*:/g)].length;
const p2cured = sitesOfCured(reconLine, 'file').length;
say(`§2b  P2 — recon.mjs:83, position-blind ${p2blind} / cured ${p2cured}: ${p2blind === 1 && p2cured === 0 ? 'HIT' : 'REFUTED'}`);
if (!(p2blind === 1 && p2cured === 0)) fail('P2');
const bm = /\bfile\s*:/.exec(stripSource(reconLine, true));
say(`      the matched text, and the character before it: ${JSON.stringify(bm[0])} preceded by ${JSON.stringify(reconLine[bm.index - 1])}`);
say('');

// ───────────────────────────────────────────── §3 — P10, AGAINST ME: the residual class

say('§3  P10 — the residual false-positive class this cure does NOT remove (registered OPEN)');
const RESIDUAL = `const x = { a: cond ? file : other, b: 1 };`;
const resCured = sitesOfCured(RESIDUAL, 'file');
say(`  cell (a bare identifier in a ternary's then-position, no \`.\` before it):`);
say(`      ${RESIDUAL}`);
say(`  cured key matches it: ${resCured.length} time(s) — ${resCured.length > 0 ? 'the class SURVIVES the cure' : 'the class is also removed'}`);
const P10 = resCured.length > 0;
say(`  P10 as registered (the residual class survives): ${P10}`);
say('');

// ───────────────────────────────────────────── §4 — the three censuses over one population

const MEMBERS = JSON.parse(readFileSync(join(U517, 'captures/ARM-BRANCHORDER.json'), 'utf8')).census.members;
const PH1 = JSON.parse(readFileSync(join(U517, 'captures/POSTHOC-HAZARD.json'), 'utf8'));
const allNames = PH1.allNames ?? ['p', 'cls', 'error', 'file', 'conversation'];
const namedMembers = PH1.named ?? null;

say('§4  the censuses — v1 and v2 reproduced by the SLICED reader, cured column beside them');
const tracked = execFileSync('git', ['ls-files', 'docs/research', 'scripts'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter((p) => p.endsWith('.mjs') || p.endsWith('.js') || p.endsWith('.mts'));
say(`  population: ${tracked.length} tracked file(s) — re-derived with the subject's own ls-files call and extension filter`);
say(`  names: ${allNames.join(', ')}  (from unit-517's PH1, ${namedMembers ? 'read out of its capture JSON' : 'FALLBACK LITERAL — capture lacked them'})`);
if (!namedMembers) say('  NOTE: member→names mapping unavailable in the capture; §5 recomputes it below.');
say('');

const censusWith = (fn) => {
  const per = {};
  const skippedByPrefilter = [];
  for (const n of allNames) {
    const found = [];
    let totalSites = 0;
    let offPrefilter = 0;
    for (const rel of tracked) {
      let src;
      try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
      if (!src.includes(n)) continue;
      const narrow = src.includes(`${n}:`);
      const ss = fn(src, n);
      if (ss.length > 0 && !narrow) { offPrefilter += ss.length; skippedByPrefilter.push(`${rel} [${n}] ${ss.length}`); }
      totalSites += ss.length;
      for (const s of ss) if (s.ternary) found.push({ rel, line: s.line, expr: s.expr.replace(/\s+/g, ' ').slice(0, 68), prev: s.prev });
    }
    per[n] = { sites: totalSites, ternary: found, offPrefilter };
  }
  per.__skipped = skippedByPrefilter;
  return per;
};

const V1 = censusWith((src, n) => H.sitesOf(src, n, false));
const V2 = censusWith((src, n) => H.sitesOf(src, n, true));
const CU = censusWith(sitesOfCured);

say('  name            sites v1 →   v2 →  cured      TERNARY-position  v1 →  v2 → cured');
for (const n of allNames) {
  say(`  ${n.padEnd(14)} ${String(V1[n].sites).padStart(8)} ${String(V2[n].sites).padStart(5)} ${String(CU[n].sites).padStart(6)}                       ${String(V1[n].ternary.length).padStart(3)} ${String(V2[n].ternary.length).padStart(4)} ${String(CU[n].ternary.length).padStart(5)}`);
  for (const f of CU[n].ternary.slice(0, 6)) say(`      cured KEEPS  ${f.rel}:${f.line}  prev ${f.prev}  ${f.expr}`);
  const dropped = V2[n].ternary.filter((x) => !CU[n].ternary.some((y) => y.rel === x.rel && y.line === x.line));
  for (const f of dropped.slice(0, 6)) say(`      cured DROPS  ${f.rel}:${f.line}  ${f.expr}`);
}
say('');

// P3 / P4 / P6 / P7 / P8
const P3 = CU.file.ternary.length === 0 && V2.file.ternary.length === 1;
say(`  P3 (\`file\` TERNARY-position: v2 1 → cured 0): ${P3 ? 'HIT' : 'REFUTED'}  — v2 ${V2.file.ternary.length}, cured ${CU.file.ternary.length}`);

const WANT_CLS = [
  ['docs/research/unit-513consumernull-2026-11-24/arm-consumernull.mjs', 160],
  ['docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs', 72],
  ['docs/research/unit-513consumernull-2026-11-24/posthoc-application-subject.mjs', 75],
  ['docs/research/unit-513consumernull-2026-11-24/posthoc-shape-classes.mjs', 214],
];
const gotCls = CU.cls.ternary.map((f) => `${f.rel}:${f.line}`).sort();
const wantCls = WANT_CLS.map(([r, l]) => `${r}:${l}`).sort();
const P4 = gotCls.length === wantCls.length && gotCls.every((v, i) => v === wantCls[i]);
say(`  P4 (\`cls\` TERNARY-position is the SAME FOUR sites by file and line): ${P4 ? 'HIT' : 'REFUTED'}`);
if (!P4) { say(`      want ${wantCls.join(' | ')}`); say(`      got  ${gotCls.join(' | ')}`); }

const rises = allNames.filter((n) => CU[n].sites > V2[n].sites);
say(`  P6 (narrowing-only — no name's site count rises): ${rises.length === 0 ? 'HIT' : `REFUTED (${rises.join(', ')})`}`);

const overAdmitted = V2.file.sites - CU.file.sites;
const P7 = overAdmitted >= 10 && overAdmitted <= 120;
say(`  P7 (\`file\` sites over-admitted by the position-blind key, registered interval 10–120): ${overAdmitted} — ${P7 ? 'HIT' : 'REFUTED'}`);
say(`      of ${V2.file.sites} published \`file\` sites, ${overAdmitted} were NOT property position (${(100 * overAdmitted / V2.file.sites).toFixed(1)}%)`);

const losers = allNames.filter((n) => n !== 'file' && CU[n].sites < V2[n].sites);
const P8 = losers.length >= 2;
say(`  P8 (≥2 of the other four names lose ≥1 site): ${P8 ? 'HIT' : 'REFUTED'} — ${losers.length} (${losers.join(', ') || 'none'})`);
for (const n of allNames) say(`      ${n.padEnd(14)} v2 ${String(V2[n].sites).padStart(5)} → cured ${String(CU[n].sites).padStart(5)}   over-admitted ${V2[n].sites - CU[n].sites}`);
say('');

// unlooked-for: the narrow `${n}:` prefilter the published census used
say('§4b  UNREGISTERED, reported because the arm could see it: the published census pre-filtered on');
say('     `src.includes(`${n}:`)` — a name immediately followed by a colon. This arm pre-filters on');
say('     the bare name, so a site written `file :` in a file with no `file:` anywhere would be');
say('     invisible to the published figures and visible here.');
say(`     cured sites found in files the narrow prefilter would have SKIPPED: ${allNames.reduce((a, n) => a + CU[n].offPrefilter, 0)}`);
for (const r of CU.__skipped.slice(0, 8)) say(`        ${r}`);
say('');

// ───────────────────────────────────────────── §5 — P5: the two reach figures, re-derived

say('§5  P5 — SHAPE and HAZARD reach re-derived under the cured key');
const namesFor = (rel) => {
  if (namedMembers) { const hit = namedMembers.find((x) => x.rel === rel); if (hit) return hit.names; }
  return null;
};
const CENSUS_KEY = /([A-Za-z_$][\w$]*)\s*:\s*\\?['"`]\(/g;
const recovered = [];
for (const m of MEMBERS) {
  let names = namesFor(m.rel);
  if (!names) {
    const src = readFileSync(join(ROOT, m.rel), 'utf8');
    const set = new Set();
    for (const hit of src.matchAll(new RegExp(CENSUS_KEY.source, 'g'))) set.add(hit[1]);
    names = [...set].filter((n) => allNames.includes(n));
  }
  recovered.push({ rel: m.rel, names });
  say(`  ${m.rel}`);
  say(`      name(s) read: ${names.join(', ') || '(none)'}`);
}
const blindUnder = (per) => recovered.filter((m) => m.names.some((n) => per[n] && per[n].ternary.length > 0));
const bV2 = blindUnder(V2);
const bCU = blindUnder(CU);
say('');
say(`  SHAPE reach  — files carrying the quote-anchored key: ${MEMBERS.length}`);
say(`  HAZARD reach — published (v2, position-blind): ${bV2.length} of ${MEMBERS.length}`);
for (const m of bV2) say(`      ${m.rel}  (${m.names.filter((n) => V2[n].ternary.length > 0).join(', ')})`);
say(`  HAZARD reach — cured: ${bCU.length} of ${MEMBERS.length}`);
for (const m of bCU) say(`      ${m.rel}  (${m.names.filter((n) => CU[n].ternary.length > 0).join(', ')})`);
say(`  gap — published ${MEMBERS.length - bV2.length} → cured ${MEMBERS.length - bCU.length}`);
const P5 = bCU.length === 1 && bCU[0].rel.includes('unit-515keyekp') && MEMBERS.length === 6;
say(`  P5 (HAZARD 1 of 6, the subject alone, gap 5): ${P5 ? 'HIT' : 'REFUTED'}`);
say(`  => unit-517's PH3, registered as "live-blind = 1 of 6, the subject alone", ${P5 ? 'HELD' : 'did NOT hold'};`);
say(`     the refutation published at 13:3x was an artefact of this seat's own position-blind key.`);
say('');

say(`§6  ${failures === 0 ? 'ALL ASSERTIONS PASSED' : `${failures} FAILURE(S)`}`);
const verdicts = { P1, P2: p2blind === 1 && p2cured === 0, P3, P4, P5, P6: rises.length === 0, P7, P8, P9: kpPass === KP.length, P10 };
say(`  verdicts: ${Object.entries(verdicts).map(([k, v]) => `${k} ${v ? 'HIT' : 'REFUTED'}`).join(' · ')}`);
say(`  HIT ${Object.values(verdicts).filter(Boolean).length} of ${Object.keys(verdicts).length}`);

writeFileSync(join(CAPS, 'ARM-POSITIONBLINDKEY.out'), `${lines.join('\n')}\n`);
writeFileSync(join(CAPS, 'ARM-POSITIONBLINDKEY.json'), `${JSON.stringify({
  rev, verdicts, failures,
  spanBytes: SPAN.length,
  shapeReach: MEMBERS.length,
  hazardPublished: bV2.length,
  hazardCured: bCU.length,
  gapPublished: MEMBERS.length - bV2.length,
  gapCured: MEMBERS.length - bCU.length,
  perName: Object.fromEntries(allNames.map((n) => [n, {
    sitesV1: V1[n].sites, sitesV2: V2[n].sites, sitesCured: CU[n].sites,
    ternaryV1: V1[n].ternary.length, ternaryV2: V2[n].ternary.length, ternaryCured: CU[n].ternary.length,
    curedTernarySites: CU[n].ternary.map((f) => `${f.rel}:${f.line}`),
  }])),
  overAdmittedFile: overAdmitted,
  population: tracked.length,
  kp: `${kpPass} of ${KP.length}`,
}, null, 2)}\n`);
process.exit(failures === 0 ? 0 : 1);
