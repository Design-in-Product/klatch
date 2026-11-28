/**
 * unit-531conserve — which premise carries Theseus's conservation result?
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-27 17:20:07 PST`, population SHA
 * `3af2c9946ea7`, pushed as `349ab0ab` before this file existed.
 *
 * Subject: `unit-529defaultparam-2026-11-27/arm-defaultparam.mjs`, and through it the frozen reader
 * `unit-523indirectsize-2026-11-26/arm-indirectsize.mjs` and the donor `unit-527setgeneric-.../
 * arm-setgeneric.mjs`.
 *
 * METHOD, and it is a constraint this unit registered (§5): **no frozen arm is driven as a child
 * process.** Theseus's 11-27 addendum showed that `node arm-defaultparam.mjs` re-runs that arm's own
 * `writeFileSync` and overwrites its published `captures/`. Everything here is obtained by slicing
 * text and `new Function`. The region [`const pad = (s, n)` … `// ─── Arm A: the UNRESOLVED
 * partition`] of unit-529's arm — its slicer, its four substitutions, its four instantiations, its
 * KP cells, its `RUN`, its class-sum throw and its `NARROW` — is run **verbatim, as its own bytes**,
 * with `sh` / `readFileSync` / `ROOT` supplied as parameters. That is the whole trick: those three
 * are already `new Function` parameters inside unit-529, so substituting them substitutes the
 * CORPUS without editing one byte of any subject.
 *
 * Driven twice:
 *   REAL   — real `sh`, real `readFileSync`  → the control (P8), graded against unit-529's
 *            published capture, parsed not retyped.
 *   SYNTH  — stub `sh` serving a synthetic `git ls-files`, stub `readFileSync` serving six planted
 *            files from memory. No file is written into any corpus directory.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const CAP = 'docs/research/unit-531conserve-2026-11-27/captures';
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const PREREG_SHA = '349ab0ab';

const SUBJECT = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
const PUBCAP = 'docs/research/unit-529defaultparam-2026-11-27/captures/ARM.out';
for (const f of [SUBJECT, FROZEN, DONOR, PUBCAP]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const subjectText = readFileSync(`${ROOT}${SUBJECT}`, 'utf8');
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const donorText = readFileSync(`${ROOT}${DONOR}`, 'utf8');
const pubCapText = readFileSync(`${ROOT}${PUBCAP}`, 'utf8');

const occ = (hay, needle) => hay.split(needle).length - 1;
const sliceBetween = (text, a, b, label) => {
  for (const [n, lit] of [[`${label}.start`, a], [`${label}.end`, b]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once: ${JSON.stringify(lit)}`);
  }
  const i = text.indexOf(a);
  const j = text.indexOf(b);
  if (j <= i) throw new Error(`${label}: anchors out of order`);
  return text.slice(i, j);
};
const pad = (s, n) => String(s).padEnd(n, ' ');

// ─── the region of unit-529 that is run verbatim ────────────────────────────────────────────────

const REGION = sliceBetween(
  subjectText,
  'const pad = (s, n) => String(s).padEnd(n, \' \');',
  '// ─── Arm A: the UNRESOLVED partition',
  'REGION',
);
const REGION_RETURN = `
  return { LABELS, INST, RUN, CLASSES, CLS, NARROW, CORPUS, KP, TEXT, MOV };
`;
const drive = (label, shIn, readIn) => {
  // eslint-disable-next-line no-new-func
  const f = new Function('frozenText', 'donorText', 'stripSource', 'parenSpanEnd', 'sh',
    'readFileSync', 'ROOT', REGION + REGION_RETURN);
  try {
    return f(frozenText, donorText, stripSource, parenSpanEnd, shIn, readIn, ROOT);
  } catch (e) {
    throw new Error(`driving the region with the ${label} injections failed: ${e.message}`);
  }
};

// ─── the synthetic corpus (P5/P9) ───────────────────────────────────────────────────────────────

const PLANTS = [
  ['scripts/_synth531/F1.mjs', 'const s531a = new Set(xs531);\nif (s531a.size === 1) go531();\n',
    { PUB: 'SET-BOUND', DEF: 'SET-BOUND', GEN: 'SET-BOUND', BOTH: 'SET-BOUND' },
    'a plain bound Set — the regression plant'],
  ['scripts/_synth531/F2.mjs', 'const s531b = new Set<string>(xs531);\nif (s531b.size === 1) go531();\n',
    { PUB: 'OTHER-BOUND', DEF: 'OTHER-BOUND', GEN: 'SET-BOUND', BOTH: 'SET-BOUND' },
    'a GENERIC bound Set — cure G reclassifies it, population unmoved'],
  ['scripts/_synth531/F3.mjs', 'if (new Set<string>(xs531).size === 1) go531();\n',
    { PUB: 'CALL', DEF: 'CALL', GEN: 'ABSENT', BOTH: 'ABSENT' },
    'THE DENOMINATOR MOVER: a GENERIC direct tail — a population MEMBER under PUB, EXCLUDED under G'],
  ['scripts/_synth531/F4.mjs', 'if (new Set(xs531).size === 1) go531();\n',
    { PUB: 'ABSENT', DEF: 'ABSENT', GEN: 'ABSENT', BOTH: 'ABSENT' },
    'F3\'s matched negative: a PLAIN direct tail, excluded under all four'],
  ['scripts/_synth531/F5.mjs', 'function f531(seen531 = new Set()) {\n  if (seen531.size === 1) go531();\n}\n',
    { PUB: 'UNRESOLVED', DEF: 'SET-BOUND', GEN: 'UNRESOLVED', BOTH: 'SET-BOUND' },
    'cure D\'s own shape — a plain Set as a default parameter'],
  ['scripts/_synth531/F6.mjs', 'const m531 = new Map(xs531);\nif (m531.size === 1) go531();\n',
    { PUB: 'MAP-BOUND', DEF: 'MAP-BOUND', GEN: 'MAP-BOUND', BOTH: 'MAP-BOUND' },
    'a bound Map — untouched by either cure'],
];
const SYNTH = new Map(PLANTS.map(([p, src]) => [p, src]));
let shStubCalls = 0;
const shStub = (cmd) => {
  shStubCalls += 1;
  if (cmd.trim() !== 'git ls-files') {
    throw new Error(`the synthetic drive's sh stub was asked for something other than the corpus: ${cmd}`);
  }
  return `${[...SYNTH.keys()].join('\n')}\n`;
};
let readStubMisses = 0;
const readStub = (p) => {
  const s = String(p);
  const rel = s.startsWith(ROOT) ? s.slice(ROOT.length) : s;
  if (SYNTH.has(rel)) return SYNTH.get(rel);
  readStubMisses += 1;
  const e = new Error(`ENOENT (synthetic corpus): ${rel}`);
  e.code = 'ENOENT';
  throw e;
};

const REAL = drive('REAL', sh, readFileSync);
const SYN = drive('SYNTH', shStub, readStub);
const LABELS = REAL.LABELS;
const CLASSES = REAL.CLASSES;

// ─── grading ────────────────────────────────────────────────────────────────────────────────────

const CELLS = [];
const cell = (id, ok, note) => { CELLS.push({ id, ok, note }); };
const offByOf = (CLS) => {
  const out = {};
  for (const k of CLASSES) {
    const g = (l) => CLS[l][k] || 0;
    out[k] = g('BOTH') - (g('DEF') + g('GEN') - g('PUB'));
  }
  return out;
};
const sumOf = (CLS, l) => CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);

// ── P8: the control. Parse the published capture, compare 48 cells.
const capPop = /^ {2}population\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/m.exec(pubCapText);
const capExc = /^ {2}excludedDirectTails\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/m.exec(pubCapText);
if (!capPop || !capExc) throw new Error('P8: could not parse population/exclusions out of the published capture');
let p8ok = 0;
let p8tot = 0;
const p8bad = [];
LABELS.forEach((l, i) => {
  p8tot += 2;
  if (Number(capPop[i + 1]) === REAL.RUN[l].sites.length) p8ok += 1;
  else p8bad.push(`population ${l}: capture=${capPop[i + 1]} here=${REAL.RUN[l].sites.length}`);
  if (Number(capExc[i + 1]) === REAL.RUN[l].excludedDirectTails) p8ok += 1;
  else p8bad.push(`exclusions ${l}: capture=${capExc[i + 1]} here=${REAL.RUN[l].excludedDirectTails}`);
});
const capClass = {};
for (const k of CLASSES) {
  const re = new RegExp(`^ {2}${k.replace(/[-]/g, '-')}\\s+(-?\\d+)\\s+(-?\\d+)\\s+(-?\\d+)\\s+(-?\\d+)\\s`, 'm');
  const m = re.exec(pubCapText);
  if (!m) throw new Error(`P8: could not parse class row ${k} out of the published capture`);
  capClass[k] = [1, 2, 3, 4].map((i) => Number(m[i]));
}
for (const k of CLASSES) {
  LABELS.forEach((l, i) => {
    p8tot += 1;
    if (capClass[k][i] === (REAL.CLS[l][k] || 0)) p8ok += 1;
    else p8bad.push(`${k} ${l}: capture=${capClass[k][i]} here=${REAL.CLS[l][k] || 0}`);
  });
}
cell('P8  CONTROL: the sliced region at the REAL injections reproduces unit-529\'s published capture',
  p8ok === p8tot && p8tot === 48, `${p8ok} of ${p8tot} equal${p8bad.length ? ` · ${p8bad.join(' · ')}` : ''}`);

// ── P2: no cross-label SITE population assertion in the subject.
const popAsserts = subjectText.split('\n')
  .map((ln, i) => [i + 1, ln])
  .filter(([, ln]) => /sites\.length/.test(ln) && /throw|!==|===/.test(ln));
const crossLabel = popAsserts.filter(([, ln]) => /RUN\[[^\]]*\]\.sites\.length[\s\S]*RUN\[/.test(ln));
cell('P2  the subject has NO cross-label site-population assertion', crossLabel.length === 0,
  `sites.length assertion lines: ${popAsserts.map(([n]) => n).join(', ')} — all per-label; `
  + `the :176 throw is on corpus.length (FILES): ${/INST\[l\]\.corpus\.length/.test(subjectText) ? 'confirmed' : 'NOT FOUND'}`);

// ── P3: cure G changes MEMBERSHIP (K15 reproduced inside my own drive).
const k15 = REAL.KP.find((r) => /K15/.test(r.name));
cell('P3  cure G changes MEMBERSHIP: K15 reproduces (CALL under PUB/DEF, EXCLUDED under GEN/BOTH)',
  !!k15 && k15.ok && /GEN=EXCLUDED/.test(k15.got) && /PUB=CALL/.test(k15.got),
  k15 ? k15.got : 'K15 not found in the region\'s KP set');
const kpPass = REAL.KP.filter((r) => r.ok).length;
cell('P3b the region\'s whole KP set passes inside my drive', kpPass === REAL.KP.length,
  `${kpPass} of ${REAL.KP.length}`);

// ── P4: generic direct tails in the real corpus, re-measured here.
const GEN_DIRECT = /if\s*\(\s*new\s+Set\s*<[^>]*>\s*\([\s\S]*?\)\s*\.size\s*(===|==|<=|<)\s*\d/;
let genDirect = 0;
const genDirectWhere = [];
for (const p of REAL.CORPUS) {
  let raw;
  try { raw = readFileSync(`${ROOT}${p}`, 'utf8'); } catch { continue; }
  const code = stripSource(raw, true);
  for (const ln of code.split('\n')) {
    if (GEN_DIRECT.test(ln)) { genDirect += 1; genDirectWhere.push(`${p}: ${ln.trim().slice(0, 70)}`); }
  }
}
cell('P4  the real corpus contains ZERO generic direct `.size <op> <n>` tails', genDirect === 0,
  `${genDirect} found${genDirectWhere.length ? ` · ${genDirectWhere.slice(0, 3).join(' · ')}` : ''} · corpus ${REAL.CORPUS.length} files`);

// ── P9: every planted file keys to its declared class at every label.
const bySite = {};
for (const l of LABELS) {
  bySite[l] = new Map(SYN.RUN[l].sites.map((s) => [s.path, s]));
}
let p9ok = 0;
let p9tot = 0;
const p9bad = [];
for (const [p, , want] of PLANTS) {
  for (const l of LABELS) {
    p9tot += 1;
    const s = bySite[l].get(p);
    const got = s ? s.cls : 'ABSENT';
    if (got === want[l]) p9ok += 1;
    else p9bad.push(`${p.split('/').pop()} ${l}: want ${want[l]} got ${got}`);
  }
}
cell('P9  the synthetic harness is graded before it is used', p9ok === p9tot,
  `${p9ok} of ${p9tot}${p9bad.length ? ` · ${p9bad.join(' · ')}` : ''}`);
cell('P9b the synthetic drive read ONLY the synthetic corpus',
  shStubCalls === 4 && readStubMisses === 0,
  `sh stub calls ${shStubCalls} (4 = one per instantiation) · readFileSync misses ${readStubMisses}`);

// ── P5: the denominator moves.
const synPop = {};
for (const l of LABELS) synPop[l] = SYN.RUN[l].sites.length;
cell('P5  the SITE population is NOT constant across the four labels on the synthetic corpus',
  new Set(LABELS.map((l) => synPop[l])).size !== 1 && synPop.PUB > synPop.GEN,
  LABELS.map((l) => `${l}=${synPop[l]}`).join(' · '));

// ── P6 / P7: what the moved denominator actually buys. REGISTERED AS ≠0 AND =1.
const synOff = offByOf(SYN.CLS);
const synSum = CLASSES.reduce((a, k) => a + synOff[k], 0);
const synFails = CLASSES.filter((k) => synOff[k] !== 0);
const realOff = offByOf(REAL.CLS);
const realSum = CLASSES.reduce((a, k) => a + realOff[k], 0);
const realFails = CLASSES.filter((k) => realOff[k] !== 0);
cell('P6  on the synthetic corpus, the off-by column sums to something OTHER than zero', synSum !== 0,
  `Σ offby = ${synSum} · S_l = ${LABELS.map((l) => `${l}:${sumOf(SYN.CLS, l)}`).join(' ')}`);
cell('P7  on the synthetic corpus, `classes where addition FAILS` is exactly 1', synFails.length === 1,
  `FAILS = ${synFails.length} (${synFails.map((k) => `${k} ${synOff[k] > 0 ? '+' : ''}${synOff[k]}`).join(', ') || 'none'})`);

// ── P10: the registered concession, measured on the real corpus.
cell('P10 REGISTERED CONCESSION: on the real corpus the off-by column sums to zero', realSum === 0,
  `Σ offby = ${realSum} · FAILS = ${realFails.length} (${realFails.map((k) => `${k} ${realOff[k] > 0 ? '+' : ''}${realOff[k]}`).join(', ')})`);

// ── P11: against me — my own RESULTS.md carries no qualifying language either.
const RESULTS = 'docs/research/unit-529defaultparam-2026-11-27/RESULTS.md';
const resultsText = readFileSync(`${ROOT}${RESULTS}`, 'utf8');
const QUAL = /sums to zero|conservation|mirror|forced by the partition|never 1|cannot be 1/i;
const qualHits = resultsText.split('\n').filter((ln) => QUAL.test(ln));
cell('P11 AGAINST ME: unit-529\'s RESULTS.md carries no conservation qualification either',
  qualHits.length === 0, `${qualHits.length} qualifying line(s) in ${RESULTS}`);

// ── P1: partition failure is neither necessary nor sufficient. Demonstrated arithmetically on the
//        real class table by dropping a class from the ten and recomputing.
const NINE = CLASSES.filter((k) => k !== 'SET-TAIL-DIRECT');
const nineSum = NINE.reduce((a, k) => a + realOff[k], 0);
const dropped = CLASSES.filter((k) => k !== 'CALL');
const droppedSum = dropped.reduce((a, k) => a + realOff[k], 0);
cell('P1  partition failure is NOT sufficient to break conservation: drop a class from the ten and the column still sums to zero',
  nineSum === 0 && droppedSum === 0,
  `nine classes (no SET-TAIL-DIRECT): Σ = ${nineSum} · nine classes (no CALL): Σ = ${droppedSum} `
  + '— an orphaning that is IDENTICAL at all four labels changes nothing');

// ── P12: the constancy in unit-529 is structural, not contingent — and this is the finding that
//        replaces my own registered hatch. Membership is a function of G alone, so
//        S_PUB = S_DEF and S_GEN = S_BOTH, and the column sums to zero at ANY corpus.
const memberFn = {
  PUB_eq_DEF: sumOf(SYN.CLS, 'PUB') === sumOf(SYN.CLS, 'DEF'),
  GEN_eq_BOTH: sumOf(SYN.CLS, 'GEN') === sumOf(SYN.CLS, 'BOTH'),
};
cell('P12 the denominator depends on cure G ALONE, so S_PUB = S_DEF and S_GEN = S_BOTH — and THAT is what forces the zero',
  memberFn.PUB_eq_DEF && memberFn.GEN_eq_BOTH,
  `synthetic: S_PUB=${sumOf(SYN.CLS, 'PUB')} S_DEF=${sumOf(SYN.CLS, 'DEF')} `
  + `S_GEN=${sumOf(SYN.CLS, 'GEN')} S_BOTH=${sumOf(SYN.CLS, 'BOTH')} — `
  + 'the population MOVED (P5) and the column STILL sums to zero');

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

const L = [];
const say = (s = '') => { L.push(s); };

say('unit-531conserve — which premise carries the conservation result?');
say(`  HEAD ${SHA} · clock ${CLOCK} · pre-registration ${PREREG_SHA}`);
say(`  subject ${SUBJECT} (sha12 ${sha12(subjectText)})`);
say(`  frozen  ${FROZEN} (sha12 ${sha12(frozenText)})`);
say(`  donor   ${DONOR} (sha12 ${sha12(donorText)})`);
say(`  region sliced out of the subject: ${REGION.length} B, run verbatim via new Function`);
say(`  NO frozen arm driven as a child this fire (unit-529 addendum). Subjects read, never executed.`);
say('');
say('─── cells ──────────────────────────────────────────────────────────────────────');
for (const c of CELLS) say(`  ${c.ok ? 'HIT ' : 'MISS'}  ${c.id}\n          ${c.note}`);
say('');
say(`  ${CELLS.filter((c) => c.ok).length} of ${CELLS.length} cells HIT`);
say('');
say('─── the real corpus (control) ───────────────────────────────────────────────────');
say(`  population            ${LABELS.map((l) => pad(REAL.RUN[l].sites.length, 8)).join('')}`);
say(`  excludedDirectTails   ${LABELS.map((l) => pad(REAL.RUN[l].excludedDirectTails, 8)).join('')}`);
say(`  class sum S_l         ${LABELS.map((l) => pad(sumOf(REAL.CLS, l), 8)).join('')}`);
say('');
say(`  class                ${LABELS.map((l) => pad(l, 8)).join('')}offby`);
for (const k of CLASSES) {
  say(`  ${pad(k, 20)} ${LABELS.map((l) => pad(REAL.CLS[l][k] || 0, 8)).join('')}`
    + `${realOff[k] > 0 ? '+' : ''}${realOff[k]}`);
}
say(`  Σ offby = ${realSum} · FAILS = ${realFails.length}`);
say('');
say('─── the synthetic corpus (the denominator moved) ────────────────────────────────');
for (const [p, , , why] of PLANTS) say(`  ${pad(p.split('/').pop(), 4)} ${why}`);
say('');
say(`  population            ${LABELS.map((l) => pad(synPop[l], 8)).join('')}`);
say(`  excludedDirectTails   ${LABELS.map((l) => pad(SYN.RUN[l].excludedDirectTails, 8)).join('')}`);
say(`  class sum S_l         ${LABELS.map((l) => pad(sumOf(SYN.CLS, l), 8)).join('')}`);
say('');
say(`  class                ${LABELS.map((l) => pad(l, 8)).join('')}offby`);
for (const k of CLASSES) {
  if (!LABELS.some((l) => (SYN.CLS[l][k] || 0) !== 0)) continue;
  say(`  ${pad(k, 20)} ${LABELS.map((l) => pad(SYN.CLS[l][k] || 0, 8)).join('')}`
    + `${synOff[k] > 0 ? '+' : ''}${synOff[k]}`);
}
say(`  Σ offby = ${synSum} · FAILS = ${synFails.length}`);
say('');
say('─── the planted sites, per label ────────────────────────────────────────────────');
for (const [p, , want] of PLANTS) {
  const got = LABELS.map((l) => {
    const s = bySite[l].get(p);
    return `${l}=${s ? s.cls : 'ABSENT'}`;
  }).join('  ');
  say(`  ${pad(p.split('/').pop(), 4)} want ${LABELS.map((l) => `${l}=${want[l]}`).join('  ')}`);
  say(`       got  ${got}`);
}
say('');
say('─── §5(2): the side-effect assertion Theseus\'s addendum asked for ───────────────');
const porcelain = sh('git status --porcelain').trim();
const stray = porcelain.split('\n').filter(Boolean)
  .filter((ln) => !ln.includes('unit-531conserve-2026-11-27'));
say(`  git status --porcelain, filtered to files OUTSIDE this unit: ${stray.length} line(s)`);
for (const ln of stray) say(`    ${ln}`);
say(`  ${stray.length === 0 ? 'NO published capture of any other unit was touched by this drive.'
  : 'STRAY WRITES — investigate before publishing any figure above.'}`);
say('');
say(`  within this unit (expected: the captures this drive writes):`);
for (const ln of porcelain.split('\n').filter(Boolean).filter((ln) => ln.includes('unit-531conserve'))) {
  say(`    ${ln}`);
}

const OUT = `${L.join('\n')}\n`;
process.stdout.write(OUT);
writeFileSync(`${ROOT}${CAP}/ARM.out`, OUT);
