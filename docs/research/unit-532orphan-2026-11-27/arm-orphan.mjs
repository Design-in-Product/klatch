/**
 * unit-532orphan — the arm.
 *
 * Daedalus's 11-27 STOP memo §8 invites this seat to find a path by which cure `D` reaches
 * `setTailIndices`. P1–P4 take that as asked and are expected to CONFIRM him. P5–P10 put at risk
 * the step his §3 derivation skips: `S_l` in `Sigma offby = S_BOTH - (S_DEF + S_GEN - S_PUB)` is
 * the sum of the TEN `CLASSES` counts, not `|M_l|`, so membership additivity alone does not give
 * zero — the classifier's range must also be exhausted by those ten names.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-27 19:50:56 PST`, SHA `abb489e8dbb7`,
 * population SHA `faa167852c99`, committed and pushed as `ce78abc9` BEFORE this file existed.
 * 12 predictions.
 *
 * ## Whose bytes
 *
 *   - `SLICED`  — the frozen `unit-523` reader, sliced at `unit-529`'s own two anchors.
 *   - `GSUBS`   — cure G, sliced out of `unit-527`'s arm as text and instantiated. NOT retyped.
 *   - `DSUB`    — cure D, sliced out of `unit-529`'s arm as text and instantiated. NOT retyped,
 *                 so the baseline 2x2 here cannot drift from the cure pair under dispute.
 *   - `DSTAR`   — mine, registered verbatim in §2 of the pre-registration before this file existed.
 *
 * No subject file is ever written. `writeFileSync` is not imported.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: product tree is dirty, no figure is attributable:\n${dirty}`);

const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const PREREG_SHA = 'ce78abc9';

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
const U529 = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
for (const f of [FROZEN, DONOR, U529]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');
const donorText = readFileSync(`${ROOT}${DONOR}`, 'utf8');
const u529Text = readFileSync(`${ROOT}${U529}`, 'utf8');

const pad = (s, n) => String(s).padEnd(n, ' ');
const occ = (hay, needle) => hay.split(needle).length - 1;
const sliceBetween = (text, startLit, endLit, label) => {
  for (const [n, lit] of [[`${label}.start`, startLit], [`${label}.end`, endLit]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once: ${JSON.stringify(lit)}`);
  }
  const a = text.indexOf(startLit);
  const b = text.indexOf(endLit);
  if (b <= a) throw new Error(`${label}: anchors out of order`);
  return text.slice(a, b);
};

const SLICED = sliceBetween(
  frozenText,
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);

// ─── cure G: unit-527's four substitutions, EXECUTED out of its own file ────────────────────────

const G_REGION = sliceBetween(donorText, 'const GENERIC_SRC = ', '\nlet CURED_TEXT = SLICED;', 'G');
// eslint-disable-next-line no-new-func
const [GENERIC_SRC, GSUBS] = new Function(`${G_REGION}\nreturn [GENERIC_SRC, SUBS];`)();
if (!Array.isArray(GSUBS) || GSUBS.length !== 4) throw new Error('G region did not yield 4 SUBS');

// ─── cure D: unit-529's own substitution, EXECUTED out of its own file ──────────────────────────

const D_REGION = sliceBetween(u529Text, 'const PARAM_SRC = ', '\nconst applySubs = ', 'D');
// eslint-disable-next-line no-new-func
const [PARAM_SRC, DSUB] = new Function(`${D_REGION}\nreturn [PARAM_SRC, DSUB];`)();
if (typeof PARAM_SRC !== 'string' || !DSUB || typeof DSUB.from !== 'string') {
  throw new Error('D region did not yield PARAM_SRC + DSUB');
}

// ─── cure D*: MINE, registered verbatim in §2 of the pre-registration ───────────────────────────

const DSTAR1 = {
  id: 'D*1 bindingOf: fall through to a DEFAULT PARAMETER, and MARK the binding as a parameter',
  from: DSUB.from,
  to: `  const m = re.exec(code);
  if (m) return { rhs: m[1], line: lineOf(code, m.index) };
  const _pre = new RegExp(${JSON.stringify(PARAM_SRC)}.replace('NAME', name.replace(/[$]/g, '\\\\$')), 'm');
  const _pm = _pre.exec(code);
  if (!_pm) return null;
  return { rhs: _pm[1], line: lineOf(code, _pm.index), param: true };`,
};
const DSTAR2_FROM = `    const b = bindingOf(code, t);
    if (b === null) cls = 'UNRESOLVED';`;
const DSTAR2 = {
  id: "D*2 keyIndirect: a parameter binding gets its OWN class, outside the ten",
  from: DSTAR2_FROM,
  to: `${DSTAR2_FROM}
    else if (b.param) cls = 'PARAM-BOUND';`,
};
const DSTAR = [DSTAR1, DSTAR2];

// ─── instantiation ──────────────────────────────────────────────────────────────────────────────

const applySubs = (text, subs, label) => {
  let out = text;
  for (const s of subs) {
    const n = occ(out, s.from);
    if (n !== 1) throw new Error(`${label} / ${s.id}: anchor occurs ${n} times in the slice, not once`);
    out = out.replace(s.from, () => s.to);
    const after = occ(out, s.to);
    if (after !== 1) throw new Error(`${label} / ${s.id}: replacement occurs ${after} times after, not once`);
  }
  return out;
};

const RETURN = `
  return { armA, keyIndirect, setTailIndices, bindingOf, receiverSpan, corpus, read,
           CODE_EXT, NEEDLE, SIZE_CMP, direction, lineOf, parenSpanEnd };
`;
const LABELS = ['PUB', 'DEF', 'GEN', 'BOTH'];

/** The four texts for a given D-side cure (an array of substitutions). */
const textsFor = (dsubs, tag) => ({
  PUB: SLICED,
  DEF: applySubs(SLICED, dsubs, `${tag}.DEF`),
  GEN: applySubs(SLICED, GSUBS, `${tag}.GEN`),
  BOTH: applySubs(applySubs(SLICED, dsubs, `${tag}.BOTH.D`), GSUBS, `${tag}.BOTH.G`),
});

const instantiateText = (text, label, shFn, readFn) => {
  const firings = [];
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
      text + RETURN);
    return f(stripSource, parenSpanEnd, shFn, readFn, ROOT, firings);
  } catch (e) {
    throw new Error(`instantiating ${label} failed: ${e.message}`);
  }
};

const realRead = (p) => readFileSync(p, 'utf8');
const buildPair = (dsubs, tag, shFn = sh, readFn = realRead) => {
  const TEXT = textsFor(dsubs, tag);
  const INST = {};
  for (const l of LABELS) INST[l] = instantiateText(TEXT[l], `${tag}.${l}`, shFn, readFn);
  return { TEXT, INST };
};

const BASE = buildPair([DSUB], 'BASE');
const STAR = buildPair(DSTAR, 'STAR');

const CORPUS = BASE.INST.PUB.corpus;

// ─── P1 / P4: the excluder's span, as text ──────────────────────────────────────────────────────

const tailSpan = (text) => {
  const a = text.indexOf('function setTailIndices(code)');
  const b = text.indexOf('const inInterp');
  if (a === -1 || b === -1 || b <= a) throw new Error('could not slice the setTailIndices span');
  return text.slice(a, b);
};

const GRADE = [];
const grade = (id, ok, note) => {
  GRADE.push({ id, ok, note });
  console.log(`  ${ok ? 'HIT    ' : 'REFUTED'}  ${id}`);
  console.log(`            ${note}`);
};

console.log('═══ unit-532orphan — arm ═══');
console.log(`SHA ${SHA}   clock ${CLOCK}   pre-reg commit ${PREREG_SHA}`);
console.log(`product tree clean: git diff --stat HEAD -- packages/ scripts/ is EMPTY (re-asserted here)`);
console.log(`SLICED ${SLICED.length} B  sha ${sha12(SLICED)}`);
console.log(`G region ${G_REGION.length} B -> ${GSUBS.length} SUBS   D region ${D_REGION.length} B -> 1 SUB`);
console.log(`GENERIC_SRC as instantiated: ${JSON.stringify(GENERIC_SRC)}`);
console.log(`PARAM_SRC   as instantiated: ${JSON.stringify(PARAM_SRC)}`);
console.log(`corpus: ${CORPUS.length} files`);
console.log('');

console.log('─── P1: is the excluder\'s TEXT moved by cure D? ───────────────────────────────');
const bs = Object.fromEntries(LABELS.map((l) => [l, tailSpan(BASE.TEXT[l])]));
for (const l of LABELS) console.log(`  ${pad(l, 6)} setTailIndices span ${pad(bs[l].length, 6)} B  sha ${sha12(bs[l])}`);
grade('P1  setTailIndices text identical PUB=DEF and GEN=BOTH under the REAL pair',
  bs.PUB === bs.DEF && bs.GEN === bs.BOTH,
  `PUB==DEF ${bs.PUB === bs.DEF} · GEN==BOTH ${bs.GEN === bs.BOTH} · PUB==GEN ${bs.PUB === bs.GEN} (G DOES move it, as it must)`);

console.log('');
console.log('─── P4: is there a DYNAMIC path? the span, scanned ────────────────────────────');
const spanPub = bs.PUB;
const spanDef = bs.DEF;
const checks = [
  ['no call to bindingOf in the excluder', !/bindingOf/.test(spanDef)],
  ['no reference to __firings in the excluder', !/__firings/.test(spanDef)],
  ['no reference to `param` in the excluder', !/\bparam\b/.test(spanDef)],
  ['excluder span byte-identical PUB vs DEF', spanPub === spanDef],
];
const iArmA = SLICED.indexOf('function armA(files)');
if (iArmA === -1 || occ(SLICED, 'function armA(files)') !== 1) throw new Error('armA anchor not unique in the slice');
const armABody = SLICED.slice(iArmA);
const iTails = armABody.indexOf('const tails = setTailIndices(code);');
const iKey = armABody.indexOf('keyIndirect(code, raw, p, m)');
checks.push(['armA computes tails BEFORE the first keyIndirect call', iTails !== -1 && iKey !== -1 && iTails < iKey]);
for (const [n, ok] of checks) console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${n}`);
grade('P4  no dynamic path from D to setTailIndices', checks.every(([, ok]) => ok),
  `${checks.filter(([, ok]) => ok).length} of ${checks.length} sub-checks hold`);

// ─── P2 / P3: behavioural reach, every file in the corpus ───────────────────────────────────────

const tailsOf = (inst, code) => [...inst.setTailIndices(code)].sort((a, b) => a - b).join(',');
const reach = (pair, tag) => {
  let diffPD = 0;
  let diffGB = 0;
  const examples = [];
  for (const p of CORPUS) {
    let raw;
    try { raw = readFileSync(`${ROOT}${p}`, 'utf8'); } catch { continue; }
    const code = stripSource(raw, true);
    const tP = tailsOf(pair.INST.PUB, code);
    const tD = tailsOf(pair.INST.DEF, code);
    const tG = tailsOf(pair.INST.GEN, code);
    const tB = tailsOf(pair.INST.BOTH, code);
    if (tP !== tD) { diffPD += 1; if (examples.length < 3) examples.push(`${p} PUB!=DEF`); }
    if (tG !== tB) { diffGB += 1; if (examples.length < 3) examples.push(`${p} GEN!=BOTH`); }
  }
  console.log(`  ${tag}: files where tails differ — PUB vs DEF ${diffPD} · GEN vs BOTH ${diffGB}   of ${CORPUS.length}`);
  for (const e of examples) console.log(`      ${e}`);
  return { diffPD, diffGB };
};
console.log('');
console.log('─── P2: the excluder RUN over every file, all four instantiations ─────────────');
const rBase = reach(BASE, 'real pair ');
const rStar = reach(STAR, 'D* pair   ');
grade('P2  tails sets identical PUB=DEF and GEN=BOTH, every file, REAL pair',
  rBase.diffPD === 0 && rBase.diffGB === 0,
  `0 expected; got ${rBase.diffPD} and ${rBase.diffGB} over ${CORPUS.length} files`);

const RUN = {};
for (const tag of ['BASE', 'STAR']) {
  RUN[tag] = {};
  const pair = tag === 'BASE' ? BASE : STAR;
  for (const l of LABELS) RUN[tag][l] = pair.INST[l].armA(CORPUS);
}
console.log('');
console.log('─── P3: membership ────────────────────────────────────────────────────────────');
for (const tag of ['BASE', 'STAR']) {
  console.log(`  ${tag}  sites ${LABELS.map((l) => pad(RUN[tag][l].sites.length, 8)).join('')}`);
  console.log(`  ${tag}  excl  ${LABELS.map((l) => pad(RUN[tag][l].excludedDirectTails, 8)).join('')}      (${LABELS.join('  ')})`);
}
const memberAdd = (tag) => RUN[tag].PUB.sites.length === RUN[tag].DEF.sites.length
  && RUN[tag].GEN.sites.length === RUN[tag].BOTH.sites.length
  && RUN[tag].PUB.excludedDirectTails === RUN[tag].DEF.excludedDirectTails
  && RUN[tag].GEN.excludedDirectTails === RUN[tag].BOTH.excludedDirectTails;
grade('P3  membership identical PUB=DEF and GEN=BOTH, REAL pair', memberAdd('BASE'),
  `PUB ${RUN.BASE.PUB.sites.length} = DEF ${RUN.BASE.DEF.sites.length} · GEN ${RUN.BASE.GEN.sites.length} = BOTH ${RUN.BASE.BOTH.sites.length}`);

// ─── the off-by column, both pairs ──────────────────────────────────────────────────────────────

const CLASSES = ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED',
  'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT'];
const tally = (rows, k) => {
  const out = {};
  for (const r of rows) out[r[k]] = (out[r[k]] || 0) + 1;
  return out;
};
const column = (tag) => {
  const CLS = {};
  for (const l of LABELS) CLS[l] = tally(RUN[tag][l].sites, 'cls');
  const rows = CLASSES.map((k) => {
    const P = CLS.PUB[k] || 0;
    const D = CLS.DEF[k] || 0;
    const G = CLS.GEN[k] || 0;
    const B = CLS.BOTH[k] || 0;
    return { k, additive: P + (D - P) + (G - P), measured: B, offby: B - (D + G - P) };
  });
  const sums = {};
  for (const l of LABELS) sums[l] = CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);
  const orphan = {};
  for (const l of LABELS) {
    orphan[l] = Object.entries(CLS[l]).filter(([k]) => !CLASSES.includes(k));
  }
  return { CLS, rows, sums, orphan, sigma: rows.reduce((a, r) => a + r.offby, 0),
    fails: rows.filter((r) => r.offby !== 0) };
};
const printColumn = (tag, col) => {
  console.log(`  ── ${tag} ──   class                additive  measured  off-by`);
  for (const r of col.rows) {
    console.log(`                  ${pad(r.k, 20)} ${pad(r.additive, 9)} ${pad(r.measured, 9)} ${r.offby >= 0 ? '+' : ''}${r.offby}`);
  }
  console.log(`                  Sigma off-by over the ten: ${col.sigma >= 0 ? '+' : ''}${col.sigma}    FAILS: ${col.fails.length}`);
  console.log(`                  S_l (sum of the ten)     : ${LABELS.map((l) => pad(col.sums[l], 8)).join('')}`);
  console.log(`                  |M_l| (sites.length)     : ${LABELS.map((l) => pad(RUN[tag][l].sites.length, 8)).join('')}`);
  for (const l of LABELS) {
    const o = col.orphan[l];
    console.log(`                  orphaned at ${pad(l, 5)}: ${o.length === 0 ? 'none' : o.map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
};
console.log('');
console.log('─── P12(a)/P5/P6/P7: the off-by column, real pair then D* pair ────────────────');
const colBase = column('BASE');
const colStar = column('STAR');
printColumn('BASE', colBase);
console.log('');
printColumn('STAR', colStar);

const PUBLISHED = { 'SET-BOUND': 2, 'OTHER-BOUND': -2 };
const basePublished = colBase.rows.every((r) => r.offby === (PUBLISHED[r.k] || 0));
console.log('');
grade('P12(a) baseline off-by column reproduces unit-529 published (SET-BOUND +2, OTHER-BOUND -2, rest 0)',
  basePublished && colBase.fails.length === 2,
  `FAILS ${colBase.fails.length} (published 2) · column match ${basePublished}`);

grade('P5  D* pair: Sigma off-by over the ten != 0, at exactly additive membership',
  colStar.sigma !== 0 && memberAdd('STAR'),
  `Sigma ${colStar.sigma} · membership additive ${memberAdd('STAR')} (PUB ${RUN.STAR.PUB.sites.length} = DEF ${RUN.STAR.DEF.sites.length}, GEN ${RUN.STAR.GEN.sites.length} = BOTH ${RUN.STAR.BOTH.sites.length})`);

grade('P6  D* pair: FAILS = 1, and the one class is UNRESOLVED',
  colStar.fails.length === 1 && colStar.fails[0] && colStar.fails[0].k === 'UNRESOLVED',
  `FAILS ${colStar.fails.length}${colStar.fails.length ? ` at ${colStar.fails.map((r) => `${r.k} ${r.offby >= 0 ? '+' : ''}${r.offby}`).join(', ')}` : ''}`);

const pOf = (l) => (colStar.CLS[l]['PARAM-BOUND'] || 0);
const pD = pOf('DEF');
const pB = pOf('BOTH');
grade('P7  magnitude equals p_D - p_B', colStar.sigma === pD - pB,
  `Sigma ${colStar.sigma} · p_D ${pD} · p_B ${pB} · p_D - p_B ${pD - pB} · p_PUB ${pOf('PUB')} · p_GEN ${pOf('GEN')}`);

grade('P8  on the REAL pinned corpus, p_D != p_B  (registered expectation: EQUAL, i.e. REFUTED)',
  pD !== pB, `p_D ${pD} · p_B ${pB}`);

// ─── P10: Daedalus's own class-sum guard, evaluated over this unit's tables ─────────────────────

console.log('');
console.log('─── P10: unit-529 arm :277-280, the class-sum guard, run over the D* tables ───');
const guardText = sliceBetween(u529Text, '  const sum = CLASSES.reduce(', '\n}\n\nconst keyOf', 'GUARD');
console.log(`  the guard, as it stands in his arm (${guardText.length} B):`);
for (const ln of guardText.split('\n')) console.log(`      ${ln}`);
const trips = [];
for (const l of LABELS) {
  const sum = colStar.sums[l];
  const pop = RUN.STAR[l].sites.length;
  const t = sum !== pop;
  if (t) trips.push(`${l} class sum ${sum} != population ${pop}`);
  console.log(`  ${pad(l, 6)} sum ${pad(sum, 6)} population ${pad(pop, 6)} ${t ? 'THROWS' : 'passes'}`);
}
grade('P10 his class-sum guard TRIPS under D* at both DEF and BOTH',
  trips.length === 2 && trips.some((t) => t.startsWith('DEF')) && trips.some((t) => t.startsWith('BOTH')),
  trips.length === 0 ? 'no label trips it' : trips.join(' | '));

// ─── P11: is the exhaustiveness premise stated anywhere in unit-531? ───────────────────────────

console.log('');
console.log('─── P11: does unit-531 state the premise its identity needs? ──────────────────');
const PREMISE = /exhaust|every class|orphan|outside the ten|range of keyIndirect|classifier range|sum guard|class sum/i;
const u531 = ['docs/research/unit-531conserve-2026-11-27/arm-conserve.mjs',
  'docs/research/unit-531conserve-2026-11-27/RESULTS.md'];
let totalHits = 0;
const perFile = [];
for (const f of u531) {
  let txt;
  try { txt = readFileSync(`${ROOT}${f}`, 'utf8'); } catch { txt = null; }
  if (txt === null) { perFile.push(`${f}: UNREADABLE`); continue; }
  const hits = txt.split('\n').map((ln, i) => [i + 1, ln]).filter(([, ln]) => PREMISE.test(ln));
  totalHits += hits.length;
  perFile.push(`${f}: ${hits.length} matching line(s) of ${txt.split('\n').length}`);
  for (const [n, ln] of hits.slice(0, 8)) console.log(`      ${f}:${n}  ${ln.trim().slice(0, 150)}`);
}
for (const s of perFile) console.log(`  ${s}`);
grade('P11 the exhaustiveness premise goes UNSTATED in both of unit-531\'s files', totalHits === 0,
  `${totalHits} matching line(s) across the two files`);

// ─── P9 is driven by the post-hoc (synthetic corpus); reported, not skipped ────────────────────

console.log('');
console.log('─── P9: deferred to posthoc-orphan-interaction.mjs, by design ─────────────────');
console.log('  P9 needs a corpus this arm does not have. It is driven in the post-hoc on a corpus');
console.log('  served from memory, with git status --porcelain asserted there. Reported here so a');
console.log('  reader cannot mistake its absence for a pass.');

// ─── the ledger ─────────────────────────────────────────────────────────────────────────────────

console.log('');
console.log('─── ledger ────────────────────────────────────────────────────────────────────');
const hits = GRADE.filter((g) => g.ok).length;
console.log(`  ${hits} HIT / ${GRADE.length - hits} REFUTED of ${GRADE.length} graded in the arm`);
for (const g of GRADE) console.log(`    ${g.ok ? 'HIT    ' : 'REFUTED'}  ${g.id}`);
console.log('');
console.log(`  git status --porcelain outside this unit:`);
const porcelain = sh('git status --porcelain').split('\n').filter(Boolean)
  .filter((l) => !l.includes('unit-532orphan'));
console.log(`      ${porcelain.length} line(s)`);
for (const l of porcelain) console.log(`      ${l}`);
console.log('');
console.log(`ARM DONE   ${sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim()}`);
