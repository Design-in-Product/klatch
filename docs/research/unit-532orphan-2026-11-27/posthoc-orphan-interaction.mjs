/**
 * unit-532orphan — post-hoc: the orphan count has to be NON-ADDITIVE, and `D*`'s cannot be.
 *
 * STATUS, up front: this file is a POST-HOC. Its cure `X` was designed AFTER the arm's algebra
 * refuted my own `P5`/`P6`, so nothing here is a registered prediction and nothing here is graded
 * HIT/REFUTED. It is labelled `H1…H6` and every cell says what it measures.
 *
 * ## Why the arm's D* could not break the identity, and what does
 *
 * With `p_l` the number of members at label `l` classified outside the ten `CLASSES`,
 *
 *     Sigma_ten offby = (p_DEF + p_GEN) - (p_BOTH + p_PUB)
 *
 * at exactly additive membership. `D*` orphans the DEFAULT-PARAMETER path, whose firing condition
 * cure `G` cannot reach, so `p_DEF = p_BOTH` and the column still summed to zero — measured in the
 * arm: `p_D 2 · p_B 2 · Sigma 0`. Breaking the identity needs an orphan count with an INTERACTION
 * term, not merely an orphan class.
 *
 * Cure `X`, below, carves a class out of `SET-BOUND` — and `SET-BOUND` membership is exactly what
 * `G`'s `S4` widens. So `X` catches sites under `BOTH` that it cannot catch under `X` alone, and
 * `p_DEF != p_BOTH`. `X` touches `keyIndirect` only: it has ZERO reach to `setTailIndices`, so
 * membership stays exactly additive, and that is asserted in the same drive rather than argued.
 *
 * Driven twice: on the real pinned corpus, and on a corpus served from memory with nothing written
 * to disk anywhere (Daedalus's §5 discipline, `git status --porcelain` printed below).
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: product tree is dirty:\n${dirty}`);
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const occ = (hay, needle) => hay.split(needle).length - 1;
const pad = (s, n) => String(s).padEnd(n, ' ');
const sliceBetween = (text, startLit, endLit, label) => {
  for (const [n, lit] of [[`${label}.start`, startLit], [`${label}.end`, endLit]]) {
    const c = occ(text, lit);
    if (c !== 1) throw new Error(`anchor ${n} occurs ${c} times, not once: ${JSON.stringify(lit)}`);
  }
  return text.slice(text.indexOf(startLit), text.indexOf(endLit));
};

const SLICED = sliceBetween(
  readFileSync(`${ROOT}${FROZEN}`, 'utf8'),
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);
const G_REGION = sliceBetween(readFileSync(`${ROOT}${DONOR}`, 'utf8'),
  'const GENERIC_SRC = ', '\nlet CURED_TEXT = SLICED;', 'G');
// eslint-disable-next-line no-new-func
const [GENERIC_SRC, GSUBS] = new Function(`${G_REGION}\nreturn [GENERIC_SRC, SUBS];`)();

// ─── cure X: a SEEDED Set binding gets its own class, outside the ten ───────────────────────────

const XSUB = {
  id: "X  keyIndirect: a SET-BOUND whose binding is SEEDED (non-empty argument) gets its own class",
  from: "cls = 'SET-BOUND'; argSpan = b.rhs;",
  to: "cls = b.rhs.includes('()') ? 'SET-BOUND' : 'SET-BOUND-SEEDED'; argSpan = b.rhs;",
};

const applySubs = (text, subs, label) => {
  let out = text;
  for (const s of subs) {
    const n = occ(out, s.from);
    if (n !== 1) throw new Error(`${label} / ${s.id}: anchor occurs ${n} times, not once`);
    out = out.replace(s.from, () => s.to);
    const after = occ(out, s.to);
    if (after !== 1) throw new Error(`${label} / ${s.id}: replacement occurs ${after} times, not once`);
  }
  return out;
};

const RETURN = `
  return { armA, keyIndirect, setTailIndices, bindingOf, receiverSpan, corpus, read,
           CODE_EXT, NEEDLE, SIZE_CMP, direction, lineOf, parenSpanEnd };
`;
const LABELS = ['PUB', 'DEF', 'GEN', 'BOTH'];
const TEXT = {
  PUB: SLICED,
  DEF: applySubs(SLICED, [XSUB], 'DEF'),
  GEN: applySubs(SLICED, GSUBS, 'GEN'),
  BOTH: applySubs(applySubs(SLICED, [XSUB], 'BOTH.X'), GSUBS, 'BOTH.G'),
};

const instantiate = (text, label, shFn, readFn) => {
  // eslint-disable-next-line no-new-func
  const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
    text + RETURN);
  try { return f(stripSource, parenSpanEnd, shFn, readFn, ROOT, []); } catch (e) {
    throw new Error(`instantiating ${label} failed: ${e.message}`);
  }
};

const CLASSES = ['SET-BOUND', 'SET-EXPR', 'MAP-BOUND', 'MAP-EXPR', 'OTHER-BOUND', 'UNRESOLVED',
  'PROPERTY', 'CALL', 'RECEIVER-UNKEYED', 'SET-TAIL-DIRECT'];
const tally = (rows) => {
  const out = {};
  for (const r of rows) out[r.cls] = (out[r.cls] || 0) + 1;
  return out;
};

const drive = (tag, shFn, readFn, files) => {
  const INST = {};
  for (const l of LABELS) INST[l] = instantiate(TEXT[l], `${tag}.${l}`, shFn, readFn);
  const CORPUS = files || INST.PUB.corpus;
  const RUN = {};
  for (const l of LABELS) RUN[l] = INST[l].armA(CORPUS);
  const CLS = {};
  for (const l of LABELS) CLS[l] = tally(RUN[l].sites);

  // membership, measured not argued
  let tailDiffPD = 0;
  let tailDiffGB = 0;
  const tailsOf = (inst, code) => [...inst.setTailIndices(code)].sort((a, b) => a - b).join(',');
  for (const p of CORPUS) {
    const raw = INST.PUB.read(p);
    if (raw === null) continue;
    const code = stripSource(raw, true);
    if (tailsOf(INST.PUB, code) !== tailsOf(INST.DEF, code)) tailDiffPD += 1;
    if (tailsOf(INST.GEN, code) !== tailsOf(INST.BOTH, code)) tailDiffGB += 1;
  }

  const rows = CLASSES.map((k) => {
    const P = CLS.PUB[k] || 0;
    const D = CLS.DEF[k] || 0;
    const G = CLS.GEN[k] || 0;
    const B = CLS.BOTH[k] || 0;
    return { k, P, D, G, B, additive: D + G - P, measured: B, offby: B - (D + G - P) };
  });
  const sums = {};
  const orphan = {};
  for (const l of LABELS) {
    sums[l] = CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);
    orphan[l] = Object.entries(CLS[l]).filter(([k]) => !CLASSES.includes(k));
  }
  const sigma = rows.reduce((a, r) => a + r.offby, 0);
  const fails = rows.filter((r) => r.offby !== 0);

  console.log('');
  console.log(`══ ${tag} ══  corpus ${CORPUS.length} files`);
  console.log(`  class                PUB     X       G       BOTH    additive measured off-by`);
  for (const r of rows) {
    console.log(`  ${pad(r.k, 20)} ${pad(r.P, 8)}${pad(r.D, 8)}${pad(r.G, 8)}${pad(r.B, 8)}${pad(r.additive, 9)}${pad(r.measured, 9)}${r.offby >= 0 ? '+' : ''}${r.offby}`);
  }
  console.log(`  ${pad('Sigma off-by over the ten', 20)} ${sigma >= 0 ? '+' : ''}${sigma}      FAILS: ${fails.length}${fails.length ? `  at ${fails.map((r) => `${r.k} ${r.offby >= 0 ? '+' : ''}${r.offby}`).join(', ')}` : ''}`);
  console.log(`  ${pad('S_l  (sum of the ten)', 20)} ${LABELS.map((l) => pad(sums[l], 8)).join('')}`);
  console.log(`  ${pad('|M_l| (sites.length)', 20)} ${LABELS.map((l) => pad(RUN[l].sites.length, 8)).join('')}`);
  console.log(`  ${pad('excludedDirectTails', 20)} ${LABELS.map((l) => pad(RUN[l].excludedDirectTails, 8)).join('')}`);
  for (const l of LABELS) {
    console.log(`  orphaned at ${pad(l, 5)}      ${orphan[l].length === 0 ? 'none' : orphan[l].map(([k, v]) => `${k}=${v}`).join(' ')}`);
  }
  const pOf = (l) => orphan[l].reduce((a, [, v]) => a + v, 0);
  const memberAdd = RUN.PUB.sites.length === RUN.DEF.sites.length
    && RUN.GEN.sites.length === RUN.BOTH.sites.length
    && RUN.PUB.excludedDirectTails === RUN.DEF.excludedDirectTails
    && RUN.GEN.excludedDirectTails === RUN.BOTH.excludedDirectTails
    && tailDiffPD === 0 && tailDiffGB === 0;
  console.log(`  membership EXACTLY additive: ${memberAdd}   (tails differing: PUB/X ${tailDiffPD} · G/BOTH ${tailDiffGB} of ${CORPUS.length})`);
  console.log(`  p_PUB ${pOf('PUB')} · p_X ${pOf('DEF')} · p_G ${pOf('GEN')} · p_BOTH ${pOf('BOTH')}`);
  console.log(`  identity check: (p_X + p_G) - (p_BOTH + p_PUB) = ${(pOf('DEF') + pOf('GEN')) - (pOf('BOTH') + pOf('PUB'))}   vs Sigma off-by ${sigma}   MATCH ${((pOf('DEF') + pOf('GEN')) - (pOf('BOTH') + pOf('PUB'))) === sigma}`);
  const trips = LABELS.filter((l) => sums[l] !== RUN[l].sites.length);
  console.log(`  unit-529's class-sum guard would THROW at: ${trips.length ? trips.join(', ') : 'no label'}`);
  return { sigma, fails, memberAdd, pOf, sums, RUN, trips, CORPUS };
};

console.log('═══ unit-532orphan — post-hoc: an orphan count with an INTERACTION term ═══');
console.log(`SHA ${SHA}   clock ${CLOCK}`);
console.log(`SLICED ${SLICED.length} B sha ${sha12(SLICED)}   GENERIC_SRC ${JSON.stringify(GENERIC_SRC)}`);
console.log(`cure X: ${XSUB.id}`);
console.log(`   FROM ${JSON.stringify(XSUB.from)}`);
console.log(`   TO   ${JSON.stringify(XSUB.to)}`);
console.log('');
console.log('H1/H2 — the REAL pinned corpus');
const real = drive('H1/H2  real corpus', sh, (p) => readFileSync(p, 'utf8'), null);

// ─── the synthetic corpus: served from memory, written nowhere ──────────────────────────────────

const SYN = {
  'docs/research/unit-532orphan-2026-11-27/synthetic/f1.mts':
    'const s = new Set<string>(xs);\nif (s.size === 1) go();\n',
  'docs/research/unit-532orphan-2026-11-27/synthetic/f2.mts':
    'const t = new Set(ys);\nif (t.size === 1) go();\n',
  'docs/research/unit-532orphan-2026-11-27/synthetic/f3.mts':
    'const u = new Set();\nif (u.size === 1) go();\n',
};
let shCalls = 0;
let readMisses = 0;
const synSh = (cmd) => {
  shCalls += 1;
  if (cmd === 'git ls-files') return `${Object.keys(SYN).join('\n')}\n`;
  throw new Error(`the synthetic drive made an unexpected shell call: ${cmd}`);
};
const synRead = (abs) => {
  const rel = abs.startsWith(ROOT) ? abs.slice(ROOT.length) : abs;
  if (Object.prototype.hasOwnProperty.call(SYN, rel)) return SYN[rel];
  readMisses += 1;
  throw new Error(`synthetic corpus miss: ${rel}`);
};
console.log('');
console.log('H3/H4/H5 — a corpus served from MEMORY. Each planted file, declared before the drive:');
for (const [p, body] of Object.entries(SYN)) {
  console.log(`  ${p}`);
  for (const ln of body.split('\n').filter(Boolean)) console.log(`      ${ln}`);
}
const syn = drive('H3/H4  synthetic corpus', synSh, synRead, null);
console.log('');
console.log(`H5  sh calls in the synthetic drive: ${shCalls} (4 expected, one per instantiation) · readFileSync misses: ${readMisses}`);
const porcelain = sh('git status --porcelain').split('\n').filter(Boolean)
  .filter((l) => !l.includes('unit-532orphan'));
console.log(`H5  git status --porcelain outside this unit: ${porcelain.length} line(s)`);
for (const l of porcelain) console.log(`      ${l}`);
console.log(`H5  the three synthetic paths exist on disk? ${Object.keys(SYN).map((p) => {
  try { readFileSync(`${ROOT}${p}`, 'utf8'); return `${p} EXISTS`; } catch { return 'no'; }
}).filter((s) => s !== 'no').join(', ') || 'none — written nowhere, as declared'}`);

// ─── H6: the finding, stated against what it refutes ───────────────────────────────────────────

console.log('');
console.log('─── H6: what this settles ─────────────────────────────────────────────────────');
console.log(`  real corpus     : Sigma ${real.sigma >= 0 ? '+' : ''}${real.sigma}  FAILS ${real.fails.length}  membership additive ${real.memberAdd}  guard throws at [${real.trips.join(', ')}]`);
console.log(`  synthetic corpus: Sigma ${syn.sigma >= 0 ? '+' : ''}${syn.sigma}  FAILS ${syn.fails.length}  membership additive ${syn.memberAdd}  guard throws at [${syn.trips.join(', ')}]`);
console.log('');
console.log('  Daedalus\'s P12 says membership is a function of cure G alone, and the arm confirms');
console.log('  that over 867 files with 0 differing tails sets. His §3 then concludes Sigma off-by = 0');
console.log('  "at any corpus, at any denominator". The step from M_PUB = M_DEF to S_PUB = S_DEF is');
console.log('  where a second premise sits, and the cell above is the measurement of whether it is');
console.log('  load-bearing: membership EXACTLY additive, and Sigma off-by not zero.');
console.log('');
console.log(`POSTHOC DONE   ${sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim()}`);
