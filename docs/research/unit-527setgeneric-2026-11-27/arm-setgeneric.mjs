/**
 * unit-527setgeneric — the arm.
 *
 * `unit-521setsizefalsegreen-2026-11-26` and `unit-523indirectsize-2026-11-26` locate a `Set`
 * construction with the string literal `'new Set('`. A TypeScript generic — `new Set<string>(` —
 * does not contain that substring, so every consumer of the needle is blind to it.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-27 09:21:05 PST`, population SHA
 * `f9fa864272cf`. Two addenda, both written before this file existed:
 * `PRE-REGISTRATION-ADDENDUM-RECEIVER-WALK.md` (L4/P14) and
 * `PRE-REGISTRATION-ADDENDUM-2-P14-REFUTED-BY-READING.md` (P14 refuted by reading, P14' registered).
 *
 * ## The reader under test is SLICED, not retyped
 *
 * One contiguous region of `arm-indirectsize.mjs` — from `const INVARIANCE = [` to the `Arm B`
 * banner — is read off the frozen file as TEXT and instantiated twice via `new Function`:
 *
 *   - `PUBLISHED` — that text, unmodified.
 *   - `CURED`     — that text with FOUR anchored substitutions, each asserted to apply exactly
 *                   once, every before/after literal printed into the capture.
 *
 * The frozen file is never written. The differential's only variable is the locator.
 *
 * ## The control without which nothing here grades
 *
 * The frozen arm is driven UNCHANGED as a child process at this same SHA, and `PUBLISHED`'s class
 * table is asserted cell-for-cell equal to the frozen arm's own printed table across all ten
 * classes plus the population size. A slice that cannot reproduce its source grades nothing.
 *
 * ## No display field
 *
 * Every member line prints WHOLE, per `unit-521`'s refuted PH1 and `unit-523`'s docblock.
 *
 * ## This file is out of the brace-slicer gate's population by construction
 *
 * It contains no character comparison against either brace. Verified by narrowing while writing,
 * not by exemption: there is no `'{'` or `'}'` character literal anywhere below, no marker, and no
 * baseline entry. (The gate reddened `unit-523`'s arm for a docblock claim copied from a different
 * reader; this sentence is about THIS file and the way to check it is to search it.)
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const frozenDirty = sh(`git diff --stat HEAD -- ${FROZEN}`).trim();
if (frozenDirty !== '') throw new Error(`§0: the frozen arm is modified in the worktree:\n${frozenDirty}`);
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const FROZEN_SHA12 = createHash('sha256').update(frozenText).digest('hex').slice(0, 12);

const pad = (s, n) => String(s).padEnd(n, ' ');
const tally = (rows, k) => {
  const out = {};
  for (const r of rows) out[r[k]] = (out[r[k]] || 0) + 1;
  return out;
};

// ─── the slice ──────────────────────────────────────────────────────────────────────────────────

const SLICE_START = "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];";
const SLICE_END = '// ─── Arm B ';

const occ = (hay, needle) => hay.split(needle).length - 1;
for (const [name, lit] of [['SLICE_START', SLICE_START], ['SLICE_END', SLICE_END]]) {
  const n = occ(frozenText, lit);
  if (n !== 1) throw new Error(`slice anchor ${name} occurs ${n} times, not once: ${JSON.stringify(lit)}`);
}
const sStart = frozenText.indexOf(SLICE_START);
const sEnd = frozenText.indexOf(SLICE_END);
if (sEnd <= sStart) throw new Error('slice anchors are out of order');
const SLICED = frozenText.slice(sStart, sEnd);

// ─── the four anchored substitutions ────────────────────────────────────────────────────────────

/** The generic-tolerant locator, registered verbatim in §2 of the pre-registration. */
const GENERIC_SRC = 'new\\s+Set\\s*(?:<[^<>]*>)?\\s*\\(';

const SUBS = [
  {
    id: 'S1  setTailIndices: needle loop -> generic-tolerant locator loop',
    from: `  let i = 0;
  while ((i = code.indexOf(NEEDLE, i)) !== -1) {
    const open = i + NEEDLE.length - 1;`,
    to: `  const LOC = new RegExp(${JSON.stringify(GENERIC_SRC)}, 'g');
  let i = 0;
  let _m;
  while ((LOC.lastIndex = i), (_m = LOC.exec(code)) !== null) {
    i = _m.index;
    const open = _m.index + _m[0].length - 1;`,
  },
  {
    id: 'S2  keyIndirect: isDirectSetTail regex admits a type argument list',
    from: "const isDirectSetTail = /^new\\s+Set\\s*\\([\\s\\S]*\\)$/.test(t);",
    to: "const isDirectSetTail = /^new\\s+Set\\s*(?:<[^<>]*>)?\\s*\\([\\s\\S]*\\)$/.test(t);",
  },
  {
    id: 'S3  keyIndirect: SET-EXPR receiver test',
    from: 'rec.sawParen && t.includes(NEEDLE)',
    to: `rec.sawParen && new RegExp(${JSON.stringify(GENERIC_SRC)}).test(t)`,
  },
  {
    id: 'S4  keyIndirect: SET-BOUND binding test',
    from: 'b.rhs.includes(NEEDLE)',
    to: `new RegExp(${JSON.stringify(GENERIC_SRC)}).test(b.rhs)`,
  },
];

let CURED_TEXT = SLICED;
const subLog = [];
for (const s of SUBS) {
  const n = occ(CURED_TEXT, s.from);
  if (n !== 1) throw new Error(`${s.id}: anchor occurs ${n} times in the slice, not once`);
  CURED_TEXT = CURED_TEXT.replace(s.from, s.to);
  const after = occ(CURED_TEXT, s.to);
  if (after !== 1) throw new Error(`${s.id}: replacement occurs ${after} times after substitution, not once`);
  subLog.push(s);
}
// S1's loop body still mentions NEEDLE.length for the non-match advance; assert the cure left no
// literal needle in a LOCATING position. The three keying consumers are S2/S3/S4.
const residualNeedleUses = occ(CURED_TEXT, 'NEEDLE');

// ─── instantiation ──────────────────────────────────────────────────────────────────────────────

const RETURN = `
  return { armA, keyIndirect, setTailIndices, bindingOf, receiverSpan, corpus, read,
           CODE_EXT, NEEDLE, SIZE_CMP, direction, lineOf, parenSpanEnd };
`;
const instantiate = (text, label) => {
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', text + RETURN);
    return f(stripSource, parenSpanEnd, sh, readFileSync, ROOT);
  } catch (e) {
    throw new Error(`instantiating the ${label} slice failed: ${e.message}`);
  }
};

const PUB = instantiate(SLICED, 'PUBLISHED');
const CUR = instantiate(CURED_TEXT, 'CURED');

if (PUB.corpus.length !== CUR.corpus.length) {
  throw new Error(`the two instantiations disagree on the population: ${PUB.corpus.length} vs ${CUR.corpus.length}`);
}
const CORPUS = PUB.corpus;

// ─── KP / KN cells ──────────────────────────────────────────────────────────────────────────────

/** Key one fixture through one instantiation; returns the site record, or 'EXCLUDED', or 'NO-SITE'. */
const keyFixture = (inst, code) => {
  const tails = inst.setTailIndices(code);
  const ms = [...code.matchAll(inst.SIZE_CMP)];
  if (ms.length !== 1) return `NO-SITE(${ms.length} matches)`;
  const m = ms[0];
  if (tails.has(m.index)) return 'EXCLUDED';
  return inst.keyIndirect(code, code, '<fixture>', m);
};
const shape = (r) => (typeof r === 'string' ? r : `${r.cls}/${r.dir}${r.guard ? `/${r.guard}` : ''}`);

const KP = [];
const cell = (name, code, wantPub, wantCur) => {
  const gotPub = shape(keyFixture(PUB, code));
  const gotCur = shape(keyFixture(CUR, code));
  KP.push({
    name,
    ok: gotPub === wantPub && gotCur === wantCur,
    want: `pub=${wantPub} cur=${wantCur}`,
    got: `pub=${gotPub} cur=${gotCur}`,
  });
};

cell('K1  plain bound Set, invariance — unchanged by the cure',
  'const kpSet = new Set(kpArr);\nif (kpSet.size === 1) {\n}\n',
  'SET-BOUND/INVARIANCE/BLIND', 'SET-BOUND/INVARIANCE/BLIND');

cell("K2  THE CURE'S KNOWN POSITIVE: generic bound Set",
  'const kpGen = new Set<string>(kpArr);\nif (kpGen.size === 1) {\n}\n',
  'OTHER-BOUND/INVARIANCE', 'SET-BOUND/INVARIANCE/BLIND');

cell('K3  no file-local binding — UNRESOLVED under both',
  'function kpf(kpP) {\n  if (kpP.size === 1) {\n  }\n}\n',
  'UNRESOLVED/INVARIANCE', 'UNRESOLVED/INVARIANCE');

cell("K4  KN for P7: a DEFAULT PARAMETER is not a declaration, so the cure does NOT reach it",
  'function kpf(kpSeen = new Set<string>()) {\n  if (kpSeen.size === 1) {\n  }\n}\n',
  'UNRESOLVED/INVARIANCE', 'UNRESOLVED/INVARIANCE');

cell('K5  plain bound Map — MAP-BOUND under both',
  'const kpMap = new Map(kpArr);\nif (kpMap.size === 1) {\n}\n',
  'MAP-BOUND/INVARIANCE', 'MAP-BOUND/INVARIANCE');

cell("K6  KN for L1: a GENERIC Map stays uncured, and the price is OTHER-BOUND under both",
  'const kpMapG = new Map<string, number>();\nif (kpMapG.size === 1) {\n}\n',
  'OTHER-BOUND/INVARIANCE', 'OTHER-BOUND/INVARIANCE');

cell('K7  plain DIRECT tail — excluded from the population under both',
  'if (new Set(kpArr).size === 1) {\n}\n',
  'EXCLUDED', 'EXCLUDED');

cell("K8  P14': a GENERIC direct tail is CALL under PUBLISHED and EXCLUDED under CURED",
  'if (new Set<string>(kpArr).size === 1) {\n}\n',
  'CALL/INVARIANCE', 'EXCLUDED');

cell("K9  KN for L2: a NESTED generic is missed by the cure's own locator",
  'const kpN = new Set<Map<string, number>>();\nif (kpN.size === 1) {\n}\n',
  'OTHER-BOUND/INVARIANCE', 'OTHER-BOUND/INVARIANCE');

cell('K10 S3: a parenthesised generic expression receiver — CALL -> SET-EXPR',
  'if ((new Set<string>(kpArr)).size === 1) {\n}\n',
  'CALL/INVARIANCE', 'SET-EXPR/INVARIANCE/BLIND');

cell('K11 regression guard: a parenthesised PLAIN expression receiver is SET-EXPR under both',
  'if ((new Set(kpArr)).size === 1) {\n}\n',
  'SET-EXPR/INVARIANCE/BLIND', 'SET-EXPR/INVARIANCE/BLIND');

cell('K12 the guard arm survives the cure: a generic bound Set with a null guard is GUARDED',
  'const kpG = new Set<string>(kpXs != null ? kpXs : []);\nif (kpG.size === 1) {\n}\n',
  'OTHER-BOUND/INVARIANCE', 'SET-BOUND/INVARIANCE/GUARDED');

cell('K13 direction is untouched: a generic bound Set compared for CHANGE',
  'const kpC = new Set<string>(kpArr);\nif (kpC.size > 1) {\n}\n',
  'OTHER-BOUND/CHANGE', 'SET-BOUND/CHANGE/BLIND');

// ─── Arm A: reach of the string-literal needle ──────────────────────────────────────────────────

const SET_LOC = new RegExp('new\\s+Set\\s*(<[^<>]*>)?\\s*\\(', 'g');
const MAP_LOC = new RegExp('new\\s+Map\\s*(<[^<>]*>)?\\s*\\(', 'g');
const TAIL_CMP = /^\s*\.size\s*(===|==|!==|!=|>=|<=|>|<)\s*(\d+)/;
const TAIL_SIZE = /^\s*\.size\b/;

const reach = { PLAIN: 0, GENERIC: 0, MAP_PLAIN: 0, MAP_GENERIC: 0 };
const genericSites = [];
const genericMapSites = [];

for (const p of CORPUS) {
  const raw = PUB.read(p);
  if (raw === null) continue;
  const code = stripSource(raw, true);
  const lines = raw.split('\n');
  for (const [loc, kind] of [[SET_LOC, 'SET'], [MAP_LOC, 'MAP']]) {
    loc.lastIndex = 0;
    let m;
    while ((m = loc.exec(code)) !== null) {
      const isGeneric = Boolean(m[1]);
      if (kind === 'SET') reach[isGeneric ? 'GENERIC' : 'PLAIN'] += 1;
      else reach[isGeneric ? 'MAP_GENERIC' : 'MAP_PLAIN'] += 1;
      if (!isGeneric) continue;
      const open = m.index + m[0].length - 1;
      const end = parenSpanEnd(code, open);
      const after = end === -1 ? '' : code.slice(end + 1);
      const rec = {
        path: p,
        line: PUB.lineOf(code, m.index),
        balanced: end !== -1,
        tailIsSize: end !== -1 && TAIL_SIZE.test(after),
        directCmp: end !== -1 && TAIL_CMP.test(after),
        typeArgs: m[1],
      };
      rec.whole = lines[rec.line - 1];
      (kind === 'SET' ? genericSites : genericMapSites).push(rec);
    }
  }
}

// ─── Arm B: the differential ────────────────────────────────────────────────────────────────────

const runA = (inst) => inst.armA(CORPUS);
const RP = runA(PUB);
const RC = runA(CUR);
const CLASSES = ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED',
  'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT'];
const clsP = tally(RP.sites, 'cls');
const clsC = tally(RC.sites, 'cls');

const keyOf = (s) => `${s.path}:${s.line}:${s.receiver}`;
const mapP = new Map(RP.sites.map((s) => [keyOf(s), s]));
const mapC = new Map(RC.sites.map((s) => [keyOf(s), s]));
const movedClass = [];
const leftPopulation = [];
for (const [k, s] of mapP) {
  const c = mapC.get(k);
  if (!c) leftPopulation.push(s);
  else if (c.cls !== s.cls || c.guard !== s.guard) movedClass.push({ pub: s, cur: c });
}
const enteredPopulation = [...mapC.keys()].filter((k) => !mapP.has(k)).map((k) => mapC.get(k));

const narrowedOf = (sites) =>
  sites.filter((s) => (s.cls === 'SET-BOUND' || s.cls === 'SET-EXPR') && s.dir === 'INVARIANCE');
const narrowP = narrowedOf(RP.sites);
const narrowC = narrowedOf(RC.sites);

// ─── the control: drive the frozen arm unchanged ────────────────────────────────────────────────

const CTRL_OUT = `${ROOT}docs/research/unit-527setgeneric-2026-11-27/captures/CONTROL-523.out`;
let ctrlText = '';
let ctrlErr = null;
try {
  ctrlText = sh(`node ${FROZEN} 2>docs/research/unit-527setgeneric-2026-11-27/captures/CONTROL-523.err`);
  writeFileSync(CTRL_OUT, ctrlText);
} catch (e) {
  ctrlErr = e.message;
}
const ctrlPopLine = /INDIRECT population \(re-derived here;[^)]*\): (\d+)/.exec(ctrlText);
const ctrlExclLine = /excluded as direct `new Set\(\.\.\.\)` tails: (\d+)/.exec(ctrlText);
const ctrlCls = {};
for (const k of CLASSES) {
  const re = new RegExp(`^ {4}${k.replace(/[-]/g, '\\-')} +(\\d+)$`, 'm');
  const m = re.exec(ctrlText);
  if (m) ctrlCls[k] = Number(m[1]);
}
const ctrlNarrow = /NARROWED HAZARD — \(SET-BOUND or SET-EXPR\) and INVARIANCE: (\d+)/.exec(ctrlText);

const controlCells = [];
const cctl = (name, ok, got) => controlCells.push({ name, ok, got });
cctl('C0  the frozen arm drove without error', ctrlErr === null, ctrlErr || 'rc 0');
cctl('C1  population equal', ctrlPopLine !== null && Number(ctrlPopLine[1]) === RP.sites.length,
  `frozen=${ctrlPopLine ? ctrlPopLine[1] : 'n/a'} slice=${RP.sites.length}`);
cctl('C2  excludedDirectTails equal',
  ctrlExclLine !== null && Number(ctrlExclLine[1]) === RP.excludedDirectTails,
  `frozen=${ctrlExclLine ? ctrlExclLine[1] : 'n/a'} slice=${RP.excludedDirectTails}`);
for (const k of CLASSES) {
  cctl(`C3.${k}`, (ctrlCls[k] ?? 0) === (clsP[k] || 0), `frozen=${ctrlCls[k] ?? 'n/a'} slice=${clsP[k] || 0}`);
}
cctl('C4  narrowed hazard equal',
  ctrlNarrow !== null && Number(ctrlNarrow[1]) === narrowP.length,
  `frozen=${ctrlNarrow ? ctrlNarrow[1] : 'n/a'} slice=${narrowP.length}`);

// ─── Arm C: the three named ceiling members ─────────────────────────────────────────────────────

const NAMED = [
  ['scripts/probe-round207', 410],
  ['scripts/probe-round244', 188],
];
const namedRows = [];
for (const s of RP.sites) {
  for (const [prefix, line] of NAMED) {
    if (s.path.startsWith(prefix) && s.line === line) {
      const c = mapC.get(keyOf(s));
      namedRows.push({ pub: s, cur: c || null });
    }
  }
}

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

console.log('unit-527setgeneric — arm');
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`frozen subject: ${FROZEN}`);
console.log(`frozen sha256[0:12]: ${FROZEN_SHA12}  (clean against HEAD)`);
console.log(`instrument corpus: ${CORPUS.length} files   (CODE_EXT sliced: ${PUB.CODE_EXT})`);
console.log(`sliced region: ${SLICED.length} B   cured region: ${CURED_TEXT.length} B`);
console.log(`NEEDLE as instantiated: ${JSON.stringify(PUB.NEEDLE)}`);
console.log('');

console.log('─── the four substitutions, printed whole ──────────────────────────────────────');
for (const s of subLog) {
  console.log(`  ${s.id}`);
  console.log(`    FROM: ${JSON.stringify(s.from)}`);
  console.log(`    TO:   ${JSON.stringify(s.to)}`);
}
console.log(`  residual \`NEEDLE\` identifier occurrences left in the cured text: ${residualNeedleUses}`);
console.log('    (S1 keeps NEEDLE.length only on the non-match advance path, which the regex loop');
console.log('     never reaches; S2/S3/S4 removed every KEYING use. Reported, not asserted at 0.)');
console.log('');

console.log('─── KP / KN cells (both instantiations, every cell) ────────────────────────────');
for (const c of KP) {
  console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}`);
  console.log(`        want ${c.want}`);
  console.log(`        got  ${c.got}`);
}
const kpPassed = KP.filter((c) => c.ok).length;
console.log(`  KP ${kpPassed} of ${KP.length}`);
console.log('');

console.log('─── control: the frozen arm, driven unchanged at this SHA ──────────────────────');
for (const c of controlCells) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${pad(c.name, 28)} ${c.got}`);
const ctlPassed = controlCells.filter((c) => c.ok).length;
console.log(`  CONTROL ${ctlPassed} of ${controlCells.length}`);
console.log('');

const UNGRADED = kpPassed !== KP.length || ctlPassed !== controlCells.length;
if (UNGRADED) {
  console.log('*** UNGRADED: a KP or control cell failed. Figures below are printed for diagnosis');
  console.log('*** and must not be published as a census.');
  console.log('');
}

console.log('─── Arm A: reach of the `new Set(` string literal ──────────────────────────────');
console.log(`  new Set, PLAIN      ${reach.PLAIN}`);
console.log(`  new Set, GENERIC    ${reach.GENERIC}      <- invisible to the published needle`);
console.log(`  new Map, PLAIN      ${reach.MAP_PLAIN}`);
console.log(`  new Map, GENERIC    ${reach.MAP_GENERIC}      <- L1, uncured here`);
console.log(`  files carrying a GENERIC Set: ${new Set(genericSites.map((s) => s.path)).size}`);
console.log(`  GENERIC Set sites whose paren span is balanced: ${genericSites.filter((s) => s.balanced).length}`);
console.log(`  GENERIC Set sites whose tail is \`.size\`:        ${genericSites.filter((s) => s.tailIsSize).length}`);
console.log(`  GENERIC Set sites that are DIRECT \`.size <op> <n>\` tails: ${genericSites.filter((s) => s.directCmp).length}`);
console.log('');
console.log('  every GENERIC Set site whose tail is `.size` (whole line):');
for (const s of genericSites.filter((x) => x.tailIsSize)) {
  console.log(`    ${s.path}:${s.line}  typeArgs=${s.typeArgs} directCmp=${s.directCmp}`);
  console.log(`      ${s.whole}`);
}
console.log('');
console.log('  type-argument forms seen on GENERIC Set sites:');
for (const [k, v] of Object.entries(tally(genericSites, 'typeArgs')).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${pad(k, 28)} ${v}`);
}
console.log('');

console.log('─── Arm B: the differential, PUBLISHED vs CURED ────────────────────────────────');
console.log(`  excludedDirectTails   PUBLISHED ${RP.excludedDirectTails}   CURED ${RC.excludedDirectTails}   delta ${RC.excludedDirectTails - RP.excludedDirectTails}`);
console.log(`  INDIRECT population   PUBLISHED ${RP.sites.length}   CURED ${RC.sites.length}   delta ${RC.sites.length - RP.sites.length}`);
console.log('');
console.log(`  ${pad('class', 20)} ${pad('PUBLISHED', 10)} ${pad('CURED', 10)} delta`);
for (const k of CLASSES) {
  const a = clsP[k] || 0;
  const b = clsC[k] || 0;
  console.log(`  ${pad(k, 20)} ${pad(a, 10)} ${pad(b, 10)} ${b - a > 0 ? '+' : ''}${b - a}`);
}
const sumP = CLASSES.reduce((a, k) => a + (clsP[k] || 0), 0);
const sumC = CLASSES.reduce((a, k) => a + (clsC[k] || 0), 0);
if (sumP !== RP.sites.length) throw new Error(`PUBLISHED class sum ${sumP} != population ${RP.sites.length}`);
if (sumC !== RC.sites.length) throw new Error(`CURED class sum ${sumC} != population ${RC.sites.length}`);
console.log(`  (both sums asserted == their populations: ${sumP}, ${sumC})`);
console.log('');
console.log(`  NARROWED HAZARD (SET-BOUND or SET-EXPR) and INVARIANCE:  PUBLISHED ${narrowP.length}   CURED ${narrowC.length}`);
console.log(`    PUBLISHED guard: ${JSON.stringify(tally(narrowP, 'guard'))}`);
console.log(`    CURED     guard: ${JSON.stringify(tally(narrowC, 'guard'))}`);
console.log('');
console.log(`  sites that LEFT the population under CURED: ${leftPopulation.length}`);
for (const s of leftPopulation) {
  console.log(`    ${s.path}:${s.line}  [${s.cls} ${s.dir}] receiver=${s.receiver}`);
  console.log(`      ${s.whole}`);
}
console.log(`  sites that ENTERED the population under CURED: ${enteredPopulation.length}`);
for (const s of enteredPopulation) {
  console.log(`    ${s.path}:${s.line}  [${s.cls} ${s.dir}] receiver=${s.receiver}`);
  console.log(`      ${s.whole}`);
}
console.log('');
console.log(`  sites whose CLASS or GUARD moved: ${movedClass.length}`);
for (const { pub, cur } of movedClass) {
  console.log(`    ${pub.path}:${pub.line}  ${pub.cls}/${pub.dir}${pub.guard ? `/${pub.guard}` : ''}  ->  ${cur.cls}/${cur.dir}${cur.guard ? `/${cur.guard}` : ''}`);
  console.log(`      receiver=${pub.receiver}  bindLine ${pub.bindLine} -> ${cur.bindLine}`);
  console.log(`      ${pub.whole}`);
}
console.log('');
console.log('  movement, as a from -> to tally:');
for (const [k, v] of Object.entries(tally(movedClass.map(({ pub, cur }) => ({ t: `${pub.cls} -> ${cur.cls}` })), 't')).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${pad(k, 36)} ${v}`);
}
console.log('');

console.log('─── Arm C: the three named ceiling members ─────────────────────────────────────');
console.log(`  rows found in the PUBLISHED population matching the two named paths: ${namedRows.length}`);
for (const { pub, cur } of namedRows) {
  console.log(`    ${pub.path}:${pub.line}`);
  console.log(`      PUBLISHED  ${pub.cls}/${pub.dir}${pub.guard ? `/${pub.guard}` : ''}  receiver=${pub.receiver}  bindLine=${pub.bindLine}`);
  console.log(`      CURED      ${cur ? `${cur.cls}/${cur.dir}${cur.guard ? `/${cur.guard}` : ''}  receiver=${cur.receiver}  bindLine=${cur.bindLine}` : 'ABSENT (left the population)'}`);
  console.log(`      ${pub.whole}`);
}
console.log('');
console.log('  for completeness, every UNRESOLVED row under PUBLISHED (whole line):');
for (const s of RP.sites.filter((x) => x.cls === 'UNRESOLVED')) {
  const c = mapC.get(keyOf(s));
  console.log(`    ${s.path}:${s.line}  CURED=${c ? c.cls : 'ABSENT'}`);
  console.log(`      ${s.whole}`);
}
console.log('');
console.log(`VERDICT: ${UNGRADED ? 'UNGRADED' : 'GRADED'}  ·  KP ${kpPassed}/${KP.length}  ·  CONTROL ${ctlPassed}/${controlCells.length}`);
