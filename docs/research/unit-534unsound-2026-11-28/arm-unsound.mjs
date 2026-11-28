/**
 * unit-534unsound — is Daedalus's per-cure pre-flight check sufficient for `S_l = |M_l|`?
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-28 10:51:52 PST`, HEAD `6a1a7d81b7cc`,
 * population SHA `6104850593cd` over 7879 tracked files, pushed as `788ab4bc` before this file
 * existed (`fs.existsSync` printed false in the same command).
 *
 * Taken by name from his 11-28 START §9 invitation.
 *
 * METHOD (his own non-retyping discipline, pointed at him): his instrument — `pair`,
 * `shapeAsserts`, `chainIn`, `parseChain`, `isTotal`, `chainOf`, `extractL`, `diffSets` — is
 * SLICED out of `arm-exhaust.mjs` as source text and evaluated. Not one line of it is retyped
 * here. `CLASSES` is sliced out of `arm-defaultparam.mjs`. The frozen classifier region is sliced
 * by unit-529's own anchors. No arm is driven as a child process.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd, braceSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const pad = (s, n) => String(s).padEnd(n, ' ');
const occ = (hay, needle) => hay.split(needle).length - 1;

const OUT = [];
const say = (s = '') => { OUT.push(s); console.log(s); };

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: packages/ or scripts/ is dirty:\n${dirty}`);

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const SUMMER = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const INSTR = 'docs/research/unit-533exhaust-2026-11-28/arm-exhaust.mjs';
for (const f of [FROZEN, SUMMER, INSTR]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const POPLIST = sh('git ls-files');
const POPSHA = sha12(POPLIST);
const TRACKED = POPLIST.trim().split('\n').length;

const txt = (p) => readFileSync(`${ROOT}${p}`, 'utf8');
const frozenText = txt(FROZEN);
const summerText = txt(SUMMER);
const instrText = txt(INSTR);

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

// ─── the frozen classifier, by unit-529's own anchors ───────────────────────────────────────────

const SLICED = sliceBetween(
  frozenText,
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);

// ─── CLASSES, sliced out of the summing reader ──────────────────────────────────────────────────

const CLASSES_REGION = sliceBetween(summerText, "const CLASSES = ['SET-BOUND'", '\nconst CLS = {};',
  'CLASSES');
// eslint-disable-next-line no-new-func
const CLASSES = new Function(`${CLASSES_REGION}\nreturn CLASSES;`)();
if (!Array.isArray(CLASSES) || CLASSES.length !== 10) {
  throw new Error(`CLASSES did not slice as a 10-element array: ${CLASSES && CLASSES.length}`);
}

// ─── HIS INSTRUMENT, sliced out of his arm and evaluated ────────────────────────────────────────

const INSTR_REGION = sliceBetween(instrText, 'const pair = (raw) =>',
  '// ─── §3 driven over the six instantiations', 'INSTR');
const INSTR_RETURN = `
  return { pair, shapeAsserts, chainIn, parseChain, isTotal, chainOf, extractL, diffSets };
`;
// eslint-disable-next-line no-new-func
const I = new Function('stripSource', 'occ', 'parenSpanEnd', 'braceSpanEnd',
  INSTR_REGION + INSTR_RETURN)(stripSource, occ, parenSpanEnd, braceSpanEnd);
for (const k of ['pair', 'shapeAsserts', 'chainIn', 'parseChain', 'isTotal', 'chainOf', 'extractL', 'diffSets']) {
  if (typeof I[k] !== 'function') throw new Error(`his instrument did not slice: ${k} is ${typeof I[k]}`);
}
// The slice must contain the containment test this unit is ABOUT, verbatim and exactly once.
const KEY_TEST = "if (occ(b.mask, 'cls =') > 0) continue;";
const keyTestOcc = occ(INSTR_REGION, KEY_TEST);
if (keyTestOcc !== 1) throw new Error(`the body-acceptance test occurs ${keyTestOcc} times in the slice, not once`);

// ─── §1 the cures ───────────────────────────────────────────────────────────────────────────────

const applySub = (text, from, to, label) => {
  const n = occ(text, from);
  if (n !== 1) throw new Error(`${label}: anchor occurs ${n} times, not once`);
  const out = text.replace(from, () => to);
  const after = occ(out, to);
  if (after !== 1) throw new Error(`${label}: replacement occurs ${after} times, not once`);
  return out;
};

const N_FROM = "    cls = 'PROPERTY';";
const N_TO = "    if ((t.match(/\\./g) || []).length === 1) cls = 'PROPERTY';";
const R_FROM = "    cls = 'MAP-EXPR';";
const R_TO = "    cls = 'MAP-EXPR-SEEDED';";
const W_FROM = "const SIZE_CMP = /\\.size\\s*(?:===|==|!==|!=|>=|<=|>|<)\\s*\\d+/g;";
const W_TO = "const SIZE_CMP = /\\.size\\s*(?:===|!==)\\s*\\d+/g;";

const LABELS = ['PUB', 'N', 'R', 'W'];
const TEXT = {
  PUB: SLICED,
  N: applySub(SLICED, N_FROM, N_TO, 'N'),
  R: applySub(SLICED, R_FROM, R_TO, 'R'),
  W: applySub(SLICED, W_FROM, W_TO, 'W'),
};

// ─── §2 static: his walker and his two readers, over the four instantiations ─────────────────────

const chainRegion = (text, label) => sliceBetween(text, '  let cls;', '  const guard =', `CHAIN.${label}`);

const STAT = {};
for (const l of LABELS) {
  const region = I.pair(chainRegion(TEXT[l], l));
  const chain = I.chainOf(region);
  const wide = I.extractL(region, false);
  const naive = I.extractL(region, true);
  STAT[l] = {
    regionBytes: region.raw.length,
    regionSha: sha12(region.raw),
    total: I.isTotal(chain),
    wide: {
      ...I.diffSets(wide.L, CLASSES),
      size: wide.L.size,
      nonLiteral: wide.nonLiteral,
      assignments: wide.assignments,
    },
    naive: { ...I.diffSets(naive.L, CLASSES), size: naive.L.size, nonLiteral: naive.nonLiteral },
  };
}

// ─── §3 the drive: armA on the real corpus, four instantiations ──────────────────────────────────

const RETURN = `
  return { armA, keyIndirect, bindingOf, receiverSpan, corpus, SIZE_CMP };
`;
const INST = {};
for (const l of LABELS) {
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
      TEXT[l] + RETURN);
    INST[l] = f(stripSource, parenSpanEnd, sh, readFileSync, ROOT, []);
  } catch (e) {
    throw new Error(`instantiating ${l} failed: ${e.message}`);
  }
}
const popSizes = LABELS.map((l) => INST[l].corpus.length);
if (new Set(popSizes).size !== 1) throw new Error(`labels disagree on the corpus: ${popSizes.join('/')}`);
const CORPUS = INST.PUB.corpus;

const RUN = {};
for (const l of LABELS) RUN[l] = INST[l].armA(CORPUS);

const tally = (rows) => {
  const o = {};
  for (const r of rows) {
    const k = r.cls === undefined ? '<undefined>' : r.cls;
    o[k] = (o[k] || 0) + 1;
  }
  return o;
};
const CLS = {};
const FIG = {};
for (const l of LABELS) {
  CLS[l] = tally(RUN[l].sites);
  const M = RUN[l].sites.length;
  const S = CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);
  FIG[l] = { M, S, p: M - S, undef: RUN[l].sites.filter((s) => s.cls === undefined).length,
    excl: RUN[l].excludedDirectTails === undefined ? null : RUN[l].excludedDirectTails };
}

// ─── §4 cripples on HIS walker, with the uncrippled baseline in the same table ──────────────────

const CRIPPLES = [
  ['K1 terminal bare else DELETED', "  } else {\n    cls = 'RECEIVER-UNKEYED';\n  }", '  }'],
  ['K2 PROPERTY body emptied (his C2)', "    cls = 'PROPERTY';", '    void 0;'],
  ['K3 chain replaced by a non-chain', '  let cls;', '  let cls; void 0;'],
  ['K4 cls renamed throughout the region', 'cls', 'klass'],
];
const CRIP = [{ name: 'UNCRIPPLED baseline (PUB)', total: STAT.PUB.total.total, why: STAT.PUB.total.why }];
for (const [name, from, to] of CRIPPLES) {
  let verdict;
  try {
    const n = occ(TEXT.PUB, from);
    const crippled = name.startsWith('K4')
      ? TEXT.PUB.split(from).join(to)
      : (n !== 1 ? (() => { throw new Error(`anchor occurs ${n} times, not once`); })()
        : TEXT.PUB.replace(from, () => to));
    verdict = I.isTotal(I.chainOf(I.pair(chainRegion(crippled, name))));
  } catch (e) {
    verdict = { total: false, why: `threw: ${e.message}` };
  }
  CRIP.push({ name, total: verdict.total, why: verdict.why });
}

// ─── §5 P9: absence claim over his captures, which this unit has not opened before now ──────────

const CAPFILES = sh('ls docs/research/unit-533exhaust-2026-11-28/captures').trim().split('\n');
const capText = CAPFILES.map((f) => txt(`docs/research/unit-533exhaust-2026-11-28/captures/${f}`)).join('\n');
const P9 = {
  files: CAPFILES.length,
  bytes: capText.length,
  seeded: occ(capText, 'MAP-EXPR-SEEDED'),
  condInWhy: capText.split('\n').filter((ln) => /^\s*(RED|GREEN)\s/.test(ln) && /if \(/.test(ln)).length,
};

// ─── §6 grading ─────────────────────────────────────────────────────────────────────────────────

const GRADE = [];
const p = (id, claim, ok, detail) => {
  GRADE.push({ id, claim, ok, detail });
  say(`  ${ok ? 'HIT    ' : 'REFUTED'}  ${pad(id, 5)}${pad(claim, 74)}${detail}`);
};

say(`unit-534unsound · arm · HEAD ${SHA} · clock ${CLOCK}`);
say(`population ${TRACKED} tracked files · SHA ${POPSHA} · corpus ${CORPUS.length} files`);
say(`his instrument sliced: ${INSTR_REGION.length} B from ${INSTR}, sha ${sha12(INSTR_REGION)}`);
say(`the body-acceptance test is present verbatim in the slice, exactly once: ${JSON.stringify(KEY_TEST)}`);
say();

say('§A  STATIC — his walker and his two readers, over my four instantiations');
say(`  ${pad('label', 7)}${pad('chain B', 10)}${pad('sha', 14)}${pad('TOTAL', 7)}${pad('assign', 8)}${pad('|L|', 5)}${pad('nonLit', 8)}${pad('orphans', 22)}extras`);
for (const l of LABELS) {
  const s = STAT[l];
  say(`  ${pad(l, 7)}${pad(s.regionBytes, 10)}${pad(s.regionSha, 14)}${pad(s.total.total ? 'yes' : 'NO', 7)}${pad(s.wide.assignments, 8)}${pad(s.wide.size, 5)}${pad(s.wide.nonLiteral, 8)}${pad(`[${s.wide.orphans.join(', ')}]`, 22)}[${s.wide.extras.join(', ')}]`);
}
say();
say(`  K-naive: ${LABELS.map((l) => `${l} |L|=${STAT[l].naive.size} orph=[${STAT[l].naive.orphans.join(',')}] nonLit=${STAT[l].naive.nonLiteral}`).join(' · ')}`);
say();

say('§B  DRIVEN — the real corpus, same four instantiations');
say(`  ${pad('label', 7)}${pad('|M|', 7)}${pad('S', 7)}${pad('p', 7)}${pad('undef', 8)}${pad('excl', 7)}pre-flight`);
for (const l of LABELS) {
  const f = FIG[l];
  const pf = STAT[l].wide.orphans.length === 0 && STAT[l].total.total ? 'GREEN' : 'RED';
  say(`  ${pad(l, 7)}${pad(f.M, 7)}${pad(f.S, 7)}${pad(f.p, 7)}${pad(f.undef, 8)}${pad(f.excl === null ? '-' : f.excl, 7)}${pf}`);
}
say();
const ALLK = [...new Set([...CLASSES, ...LABELS.flatMap((l) => Object.keys(CLS[l]))])];
say(`  ${pad('class', 22)}${LABELS.map((l) => pad(l, 7)).join('')}`);
for (const k of ALLK) say(`  ${pad(k, 22)}${LABELS.map((l) => pad(CLS[l][k] || 0, 7)).join('')}`);
say();

say('§C  CRIPPLE TABLE — the uncrippled baseline is the FIRST ROW, by his 11-28 §4 lesson');
for (const c of CRIP) {
  say(`  ${c.total === false ? 'RED  ' : 'GREEN'}  ${pad(c.name, 42)} ${c.why}`);
}
const cripRows = CRIP.slice(1);
const allCrippledRed = cripRows.every((c) => c.total === false);
const baselineGreen = CRIP[0].total === true;
say(`  cripples red: ${cripRows.filter((c) => c.total === false).length}/${cripRows.length} · baseline green: ${baselineGreen}`);
say();

say('§D  GRADING');
p('P1', 'his isTotal reports total === true on cure N', STAT.N.total.total === true,
  `total=${STAT.N.total.total} (${STAT.N.total.why})`);
p('P2', 'N is not total: >=1 site returns cls === undefined', FIG.N.undef >= 1,
  `undef sites = ${FIG.N.undef}`);
p('P3', 'N is clean under BOTH his static readers; pre-flight GREEN',
  STAT.N.wide.orphans.length === 0 && STAT.N.naive.orphans.length === 0 && STAT.N.wide.size === 10
    && STAT.N.wide.extras.length === 0 && STAT.N.wide.assignments === 11 && STAT.N.wide.nonLiteral === 0,
  `wide orph=[${STAT.N.wide.orphans}] |L|=${STAT.N.wide.size} extras=[${STAT.N.wide.extras}] assign=${STAT.N.wide.assignments} nonLit=${STAT.N.wide.nonLiteral} · naive orph=[${STAT.N.naive.orphans}]`);
p('P4', 'S_N < |M_N| with L ⊆ CLASSES: |M|=128, S=125, p=3',
  FIG.N.M === 128 && FIG.N.S === 125 && FIG.N.p === 3,
  `|M|=${FIG.N.M} S=${FIG.N.S} p=${FIG.N.p}`);
p('P5', 'PROPERTY falls 12 -> 9 and no other class moves',
  (CLS.PUB.PROPERTY || 0) === 12 && (CLS.N.PROPERTY || 0) === 9
    && CLASSES.filter((k) => k !== 'PROPERTY').every((k) => (CLS.PUB[k] || 0) === (CLS.N[k] || 0)),
  `PROPERTY ${CLS.PUB.PROPERTY || 0} -> ${CLS.N.PROPERTY || 0} · others moved: ${CLASSES.filter((k) => k !== 'PROPERTY' && (CLS.PUB[k] || 0) !== (CLS.N[k] || 0)).join(',') || 'none'}`);
p('P6', 'R: static RED, driven p_R = 0, tally identical to PUB on all ten',
  STAT.R.wide.orphans.join(',') === 'MAP-EXPR-SEEDED' && STAT.R.wide.size === 10
    && STAT.R.wide.extras.join(',') === 'MAP-EXPR' && FIG.R.p === 0 && FIG.R.S === 128 && FIG.R.M === 128
    && CLASSES.every((k) => (CLS.PUB[k] || 0) === (CLS.R[k] || 0)),
  `orph=[${STAT.R.wide.orphans}] extras=[${STAT.R.wide.extras}] |L|=${STAT.R.wide.size} p=${FIG.R.p} S=${FIG.R.S} |M|=${FIG.R.M} tally-identical=${CLASSES.every((k) => (CLS.PUB[k] || 0) === (CLS.R[k] || 0))}`);
p('P7', 'W: chain byte-identical to PUB, TOTAL, S moves, p stays 0',
  STAT.W.regionSha === STAT.PUB.regionSha && STAT.W.total.total === true
    && FIG.W.S !== FIG.PUB.S && FIG.W.p === 0,
  `sha ${STAT.W.regionSha} vs ${STAT.PUB.regionSha} · S ${FIG.PUB.S} -> ${FIG.W.S} · p=${FIG.W.p}`);
p('P8', 'PUB control reproduces his row: |M|=128 S=128 p=0 TOTAL |L|=10 symdiff empty',
  FIG.PUB.M === 128 && FIG.PUB.S === 128 && FIG.PUB.p === 0 && STAT.PUB.total.total === true
    && STAT.PUB.wide.size === 10 && STAT.PUB.wide.orphans.length === 0 && STAT.PUB.wide.extras.length === 0,
  `|M|=${FIG.PUB.M} S=${FIG.PUB.S} p=${FIG.PUB.p} total=${STAT.PUB.total.total} |L|=${STAT.PUB.wide.size}`);
p('P9', 'no instantiation or cripple in his unit exercises the unsound path',
  P9.seeded === 0 && P9.condInWhy === 0,
  `${P9.files} capture file(s), ${P9.bytes} B · 'MAP-EXPR-SEEDED' x${P9.seeded} · verdict rows naming a conditional: ${P9.condInWhy}`);
p('P10', 'cripple table: all four cripples RED and the baseline in the same table GREEN',
  allCrippledRed && baselineGreen,
  `cripples red ${cripRows.filter((c) => c.total === false).length}/${cripRows.length} · baseline total=${CRIP[0].total}`);
p('P11', 'drift: corpus 870 / sites 128 / excl 65, matching his 11-28 figures',
  CORPUS.length === 870 && FIG.PUB.M === 128 && FIG.PUB.excl === 65,
  `corpus=${CORPUS.length} sites=${FIG.PUB.M} excl=${FIG.PUB.excl}`);
const p12 = GRADE.find((g) => g.id === 'P1').ok && GRADE.find((g) => g.id === 'P3').ok
  && GRADE.find((g) => g.id === 'P4').ok;
p('P12', 'consequence: a pre-flight-green, walker-green cure moves S_l', p12,
  `P1 ∧ P3 ∧ P4 = ${p12}`);

say();
const hits = GRADE.filter((g) => g.ok).length;
say(`GRADED: ${hits} HIT / ${GRADE.length - hits} REFUTED of ${GRADE.length}`);
say();
say('§E  THE FINDING, STATED');
say('  His isTotal accepts a branch body on `occ(b.mask, \'cls =\') > 0` — containment of a TOKEN,');
say('  at any depth, under any condition. His own cripple C2 reddens because it DELETES that token,');
say('  not because the body stopped always-assigning. So C2 grades the token, not the property, and');
say(`  cure N — strictly weaker than C2, same branch — is TOTAL by his walker with p=${FIG.N.p}.`);
say('  And in the other direction, three class literals are reached 0 times, so a rename out of the');
say('  ten orphans nothing: the static check is neither sufficient nor necessary. The exact carrier');
say('  is L_reached ⊆ CLASSES, and that one needs the corpus.');

const dirty2 = sh('git status --porcelain').trim().split('\n')
  .filter((ln) => ln && !/unit-534unsound/.test(ln));
say();
say(`§F  git status --porcelain outside this unit: ${dirty2.length} line(s)${dirty2.length ? `\n${dirty2.join('\n')}` : ''}`);

writeFileSync(`${ROOT}docs/research/unit-534unsound-2026-11-28/captures/ARM.out`, `${OUT.join('\n')}\n`);
