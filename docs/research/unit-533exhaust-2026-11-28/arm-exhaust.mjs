/**
 * unit-533exhaust — is `S_l = |M_l|` a property of the reader, or a fact enforced by a throw?
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-28 09:20:37 PST`, population SHA
 * `e31136bd1847`, pushed as `559a5c88` before this file existed.
 *
 * Taken by name from Theseus's 11-27 STOP §7.
 *
 * METHOD (unit-531 §5 / Theseus's 11-27 addendum): no frozen arm is driven as a child process.
 * Every cure — `D`, `G`, `D*`, `X` — is SLICED out of its own author's file as source text and
 * evaluated, never retyped here.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd, braceSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const CAP = 'docs/research/unit-533exhaust-2026-11-28/captures';
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const pad = (s, n) => String(s).padEnd(n, ' ');
const occ = (hay, needle) => hay.split(needle).length - 1;

// ─── §0 attributability ─────────────────────────────────────────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') throw new Error(`§0: packages/ or scripts/ is dirty:\n${dirty}`);

const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const SUMMER = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
const ORPHAN = 'docs/research/unit-532orphan-2026-11-27/arm-orphan.mjs';
const ORPHANPH = 'docs/research/unit-532orphan-2026-11-27/posthoc-orphan-interaction.mjs';
for (const f of [FROZEN, SUMMER, DONOR, ORPHAN, ORPHANPH]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const PREREG_SHA = '559a5c88';

const txt = (p) => readFileSync(`${ROOT}${p}`, 'utf8');
const frozenText = txt(FROZEN);
const summerText = txt(SUMMER);
const donorText = txt(DONOR);
const orphanText = txt(ORPHAN);
const orphanPhText = txt(ORPHANPH);

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

// ─── the frozen slice, by unit-529's own anchors ────────────────────────────────────────────────

const SLICED = sliceBetween(
  frozenText,
  "const INVARIANCE = [['===', 1], ['==', 1], ['<=', 1], ['<', 2]];",
  '// ─── Arm B ',
  'SLICE',
);

// ─── CLASSES, read out of the summing reader rather than retyped ────────────────────────────────

const CLASSES_REGION = sliceBetween(summerText, "const CLASSES = ['SET-BOUND'", '\nconst CLS = {};',
  'CLASSES');
// eslint-disable-next-line no-new-func
const CLASSES = new Function(`${CLASSES_REGION}\nreturn CLASSES;`)();
if (!Array.isArray(CLASSES)) throw new Error('CLASSES did not evaluate to an array');

// ─── cure G, sliced out of unit-527 (same region unit-529 uses) ─────────────────────────────────

const G_REGION = sliceBetween(donorText, 'const GENERIC_SRC = ', '\nlet CURED_TEXT = SLICED;', 'G');
// eslint-disable-next-line no-new-func
const [GENERIC_SRC, GSUBS] = new Function(`${G_REGION}\nreturn [GENERIC_SRC, SUBS];`)();
if (typeof GENERIC_SRC !== 'string' || !Array.isArray(GSUBS) || GSUBS.length !== 4) {
  throw new Error(`G region did not yield GENERIC_SRC + 4 SUBS: ${typeof GENERIC_SRC}, ${GSUBS && GSUBS.length}`);
}

// ─── cure D, sliced out of unit-529 ─────────────────────────────────────────────────────────────

const D_REGION = sliceBetween(summerText, "const PARAM_SRC = '[(,]",
  '\nconst applySubs = (text, subs, label) => {', 'D');
// eslint-disable-next-line no-new-func
const [PARAM_SRC, DSUB] = new Function(`${D_REGION}\nreturn [PARAM_SRC, DSUB];`)();

// ─── cures D* and X, sliced out of Theseus's two files ──────────────────────────────────────────

const DSTAR_REGION = sliceBetween(orphanText, 'const DSTAR1 = {',
  '\nconst DSTAR = [DSTAR1, DSTAR2];', 'DSTAR');
// eslint-disable-next-line no-new-func
const DSTAR = new Function('PARAM_SRC', 'DSUB', `${DSTAR_REGION}\nreturn [DSTAR1, DSTAR2];`)(PARAM_SRC, DSUB);

const X_REGION = sliceBetween(orphanPhText, 'const XSUB = {', '\nconst applySubs', 'X');
// eslint-disable-next-line no-new-func
const XSUB = new Function(`${X_REGION}\nreturn XSUB;`)();

const shapeOk = (s) => s && typeof s.id === 'string' && typeof s.from === 'string' && typeof s.to === 'string';
const SUB_SHAPE = [['DSUB', DSUB], ['DSTAR1', DSTAR[0]], ['DSTAR2', DSTAR[1]], ['XSUB', XSUB]]
  .concat(GSUBS.map((s, i) => [`GSUB${i + 1}`, s]));
for (const [n, s] of SUB_SHAPE) if (!shapeOk(s)) throw new Error(`${n} did not slice as a substitution object`);

// ─── instantiation text for the six labels ──────────────────────────────────────────────────────

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

const LABELS = ['PUB', 'DEF', 'GEN', 'BOTH', 'DSTAR', 'X'];
const TEXT = {
  PUB: SLICED,
  DEF: applySubs(SLICED, [DSUB], 'DEF'),
  GEN: applySubs(SLICED, GSUBS, 'GEN'),
  BOTH: applySubs(applySubs(SLICED, [DSUB], 'BOTH.D'), GSUBS, 'BOTH.G'),
  DSTAR: applySubs(SLICED, DSTAR, 'DSTAR'),
  X: applySubs(SLICED, [XSUB], 'X'),
};

// P7's landed-anchor assertion: each of G's three keyIndirect substitutions is present in GEN.
const G_KEY_SUBS = GSUBS.filter((s) => /keyIndirect/.test(s.id));
const gLanded = G_KEY_SUBS.map((s) => [s.id.slice(0, 2), occ(TEXT.GEN, s.to)]);

// ─── §3 the instrument ──────────────────────────────────────────────────────────────────────────

const chainRegion = (text, label) => sliceBetween(text, '  let cls;', '  const guard =', `CHAIN.${label}`);

/**
 * DRIVE 2 REPAIR. Drive 1's scanners counted `(` and `)` in the raw text. The subject contains
 * `t.includes('new Map(')` — an UNBALANCED paren inside a string literal — twice, so every
 * structural scan derailed and every verdict fell through to `not an if-chain`, INCLUDING the
 * uncrippled baseline. Drive 1's capture is kept at `captures/ARM-DRIVE1-VACUOUS.out`.
 *
 * The repair is `scripts/lib/strip-source.mjs`, which exists for exactly this: a length-preserving
 * mask with comment and string and regex bodies blanked. Every character test below reads the MASK;
 * every slice reads the RAW text at the same offsets. The subject is untouched.
 */
const pair = (raw) => ({ raw, mask: stripSource(raw, true) });

/** Shape assertions. Each is separately crippled below. Read off the mask. */
const shapeAsserts = ({ mask }) => {
  const ids = [...mask.matchAll(/\bcls\b/g)];
  const assigned = ids.filter((m) => /^\s*=[^=]/.test(mask.slice(m.index + 3)));
  const declared = ids.filter((m) => /let\s+$/.test(mask.slice(0, m.index)));
  return {
    noSwitch: occ(mask, 'switch') === 0,
    noReturn: occ(mask, 'return') === 0,
    clsIds: ids.length,
    clsAssigned: assigned.length,
    clsDeclared: declared.length,
    allWritesAreAssignments: ids.length === assigned.length + declared.length,
  };
};

/**
 * The `if`-chain inside a region or a branch body, as a {raw, mask} pair at aligned offsets.
 *
 * DRIVE 3 note: this replaces a depth-0 statement splitter that compared characters against both
 * braces — which is exactly `verify-decl-body-slicers`' population key, and it reddened on it. The
 * replacement needs no walk at all, because the shape it relies on is ASSERTED instead of
 * discovered: the chain starts at the first `if` in the code-only reading and runs to the end of
 * the span, and the prefix before it is required to contain no block. A span that violates either
 * returns null and the caller reports NOT-TOTAL rather than guessing.
 */
const chainIn = ({ raw, mask }) => {
  const at = mask.search(/\bif\s*\(/);
  if (at === -1) return null;
  if (/[{}]/.test(mask.slice(0, at))) return null;
  if (!/[)};]\s*$/.test(mask.trimEnd())) return null;
  return { raw: raw.slice(at).trimEnd(), mask: mask.slice(at).trimEnd() };
};

/**
 * DRIVE 3 REPAIR, and the gate found it rather than me. `verify-decl-body-slicers` reddened on this
 * file for a hand-rolled brace-balance slicer, so the local `matchBrace` is gone and
 * `braceSpanEnd` from `scripts/lib/decl-body.mjs` does the work — whose own docblock says *"the
 * walk is over code-only text; pass the stripped reading"*, which is drive 1's bug stated in the
 * library I had not read. The condition scan likewise uses the already-imported `parenSpanEnd`.
 * Second time in one fire that the answer was in `scripts/lib`.
 */

/**
 * Parse an `if / else if* / else` chain into its branch bodies. Returns null when the statement is
 * not a chain. Every test is on the mask; bodies come back as {raw, mask} at aligned offsets.
 */
const parseChain = ({ raw, mask }) => {
  if (!/^if\s*\(/.test(mask)) return null;
  const bodies = [];
  let i = 0;
  let terminalBareElse = false;
  for (;;) {
    const isElse = /^\s*else\b/.test(mask.slice(i));
    if (isElse) i = mask.indexOf('else', i) + 4;
    const lead = mask.slice(i).length - mask.slice(i).trimStart().length;
    const at = i + lead;
    if (/^if\s*\(/.test(mask.slice(at))) {
      const condOpen = at + mask.slice(at).indexOf('(');
      const condClose = parenSpanEnd(mask, condOpen);
      if (condClose === -1) return null;
      i = condClose + 1;
    } else if (isElse) {
      terminalBareElse = true;
    } else {
      return null;
    }
    const after = mask.slice(i);
    const braceAt = after.indexOf('{');
    const semiAt = after.indexOf(';');
    if (braceAt !== -1 && (semiAt === -1 || braceAt < semiAt) && after.slice(0, braceAt).trim() === '') {
      const open = i + braceAt;
      const close = braceSpanEnd(mask, open);
      if (close === -1) return null;
      bodies.push({ raw: raw.slice(open + 1, close), mask: mask.slice(open + 1, close) });
      i = close + 1;
    } else if (semiAt !== -1) {
      bodies.push({ raw: raw.slice(i, i + semiAt + 1), mask: after.slice(0, semiAt + 1) });
      i += semiAt + 1;
    } else {
      return null;
    }
    if (terminalBareElse) break;
    if (!/^\s*else\b/.test(mask.slice(i))) break;
  }
  return { bodies, terminalBareElse };
};

/** TOTAL iff the chain terminates in a bare else and every body assigns `cls` or is itself TOTAL. */
const isTotal = (stmt, depth = 0) => {
  if (depth > 4) return { total: false, why: 'depth > 4' };
  const ch = parseChain(stmt);
  if (!ch) return { total: false, why: 'not an if-chain' };
  if (!ch.terminalBareElse) return { total: false, why: 'no terminal bare else' };
  for (const [n, b] of ch.bodies.entries()) {
    if (occ(b.mask, 'cls =') > 0) continue;
    const sub = chainIn(b);
    const r = sub ? isTotal(sub, depth + 1) : { total: false, why: `body ${n} assigns nothing` };
    if (!r.total) return { total: false, why: `body ${n}: ${r.why}` };
  }
  return { total: true, why: `bare else · ${ch.bodies.length} bodies` };
};

/** The chain, as the top-level if-statement of the region. */
const chainOf = (region) => {
  const st = chainIn(region);
  if (!st) throw new Error('no top-level if-chain in the region');
  return st;
};

/** K-wide / K-naive: the literal set a `cls =` RHS can produce. Sites found on the mask. */
const extractL = ({ raw, mask }, naive) => {
  const L = new Set();
  let nonLiteral = 0;
  let assignments = 0;
  const re = /cls\s*=\s*([^;]*);/g;
  let m;
  while ((m = re.exec(mask)) !== null) {
    assignments += 1;
    const g1 = m.index + (m[0].length - m[1].length - 1);
    const rhs = raw.slice(g1, m.index + m[0].length - 1).trim();
    const plain = /^'([^']*)'$/.exec(rhs);
    if (plain) { L.add(plain[1]); continue; }
    if (naive) { nonLiteral += 1; continue; }
    const lits = [...rhs.matchAll(/'([^']*)'/g)].map((x) => x[1]);
    if (lits.length === 0) nonLiteral += 1;
    else { nonLiteral += 1; for (const l of lits) L.add(l); }
  }
  return { L, nonLiteral, assignments };
};

const diffSets = (L, classes) => {
  const C = new Set(classes);
  return {
    orphans: [...L].filter((k) => !C.has(k)).sort(),
    extras: [...C].filter((k) => !L.has(k)).sort(),
  };
};

// ─── §3 driven over the six instantiations ──────────────────────────────────────────────────────

const STAT = {};
for (const l of LABELS) {
  const region = pair(chainRegion(TEXT[l], l));
  const chain = chainOf(region);
  const wide = extractL(region, false);
  const naive = extractL(region, true);
  STAT[l] = {
    regionBytes: region.raw.length,
    shape: shapeAsserts(region),
    total: isTotal(chain),
    wide: { ...diffSets(wide.L, CLASSES), size: wide.L.size, nonLiteral: wide.nonLiteral, assignments: wide.assignments },
    naive: { ...diffSets(naive.L, CLASSES), size: naive.L.size, nonLiteral: naive.nonLiteral },
    dupLiterals: wide.assignments - wide.L.size,
  };
}

// ─── cripples C1 / C2 / C3, applied to PUB ──────────────────────────────────────────────────────

const C1_FROM = `  } else {
    cls = 'RECEIVER-UNKEYED';
  }`;
const CRIPPLES = [
  ['C1 terminal bare else DELETED', C1_FROM, '  }'],
  ['C2 a branch body left non-assigning', "    cls = 'PROPERTY';", '    void 0;'],
  ['C3 terminal else -> else if (true)', '  } else {\n    cls = \'RECEIVER-UNKEYED\';', '  } else if (true) {\n    cls = \'RECEIVER-UNKEYED\';'],
];
const CRIP = [];
for (const [name, from, to] of CRIPPLES) {
  const n = occ(TEXT.PUB, from);
  if (n !== 1) throw new Error(`cripple "${name}": anchor occurs ${n} times in PUB, not once`);
  const crippled = TEXT.PUB.replace(from, () => to);
  let verdict;
  try {
    verdict = isTotal(chainOf(pair(chainRegion(crippled, name))));
  } catch (e) {
    verdict = { total: false, why: `threw: ${e.message}` };
  }
  CRIP.push({ name, total: verdict.total, why: verdict.why });
}

// ─── the drive: armA on the real corpus, all six instantiations ─────────────────────────────────

const RETURN = `
  return { armA, keyIndirect, setTailIndices, bindingOf, receiverSpan, corpus, read,
           CODE_EXT, NEEDLE, SIZE_CMP, direction, lineOf, parenSpanEnd };
`;
const FIRINGS = {};
const INST = {};
for (const l of LABELS) {
  FIRINGS[l] = [];
  try {
    // eslint-disable-next-line no-new-func
    const f = new Function('stripSource', 'parenSpanEnd', 'sh', 'readFileSync', 'ROOT', '__firings',
      TEXT[l] + RETURN);
    INST[l] = f(stripSource, parenSpanEnd, sh, readFileSync, ROOT, FIRINGS[l]);
  } catch (e) {
    throw new Error(`instantiating ${l} failed: ${e.message}`);
  }
}
const popSizes = LABELS.map((l) => INST[l].corpus.length);
if (new Set(popSizes).size !== 1) throw new Error(`labels disagree on the corpus: ${popSizes.join('/')}`);
const CORPUS = INST.PUB.corpus;

const tally = (rows, k) => {
  const o = {};
  for (const r of rows) o[r[k]] = (o[r[k]] || 0) + 1;
  return o;
};
const DYN = {};
for (const l of LABELS) {
  const run = INST[l].armA(CORPUS);
  const cls = tally(run.sites, 'cls');
  const S = CLASSES.reduce((a, k) => a + (cls[k] || 0), 0);
  const M = run.sites.length;
  const outside = Object.keys(cls).filter((k) => !CLASSES.includes(k)).sort();
  DYN[l] = { S, M, p: M - S, outside, cls, excluded: run.excludedDirectTails };
}

// ─── grading ────────────────────────────────────────────────────────────────────────────────────

const P = [];
const p = (id, claim, ok, got) => P.push({ id, claim, ok, got });

const s0 = STAT.PUB.shape;
p('P1', 'shape assertions on the published region', s0.noSwitch && s0.noReturn && s0.allWritesAreAssignments,
  `switch ${s0.noSwitch ? 0 : 'present'} · return ${s0.noReturn ? 0 : 'present'} · cls ids ${s0.clsIds} = assigned ${s0.clsAssigned} + declared ${s0.clsDeclared}`);
p('P2', 'the published chain is TOTAL', STAT.PUB.total.total, `${STAT.PUB.total.total} (${STAT.PUB.total.why})`);
p('P3', '11 assignments, 10 distinct, duplicate = RECEIVER-UNKEYED',
  STAT.PUB.wide.assignments === 11 && STAT.PUB.wide.size === 10 && STAT.PUB.dupLiterals === 1,
  `assignments ${STAT.PUB.wide.assignments} · distinct ${STAT.PUB.wide.size} · dup ${STAT.PUB.dupLiterals}`);
p('P4', 'L_wide(PUB) set-equal to CLASSES',
  STAT.PUB.wide.orphans.length === 0 && STAT.PUB.wide.extras.length === 0 && STAT.PUB.wide.size === CLASSES.length,
  `orphans [${STAT.PUB.wide.orphans}] · extras [${STAT.PUB.wide.extras}] · |L| ${STAT.PUB.wide.size} vs |CLASSES| ${CLASSES.length}`);
const totals = LABELS.map((l) => STAT[l].total.total);
p('P5', 'totality is not the carrier: all six TOTAL', totals.every(Boolean),
  LABELS.map((l, i) => `${l}:${totals[i] ? 'T' : 'F'}`).join(' '));
p('P6', 'enumeration is the carrier: orphans {} at the four, named at D*/X',
  ['PUB', 'DEF', 'GEN', 'BOTH'].every((l) => STAT[l].wide.orphans.length === 0)
  && STAT.DSTAR.wide.orphans.join() === 'PARAM-BOUND'
  && STAT.X.wide.orphans.join() === 'SET-BOUND-SEEDED',
  LABELS.map((l) => `${l}:[${STAT[l].wide.orphans}]`).join(' '));
p('P7', 'matched negative: G edits keyIndirect 3x and orphans nothing',
  gLanded.length === 3 && gLanded.every(([, n]) => n === 1) && STAT.GEN.wide.orphans.length === 0,
  `${gLanded.map(([id, n]) => `${id}=${n}`).join(' ')} · orphans [${STAT.GEN.wide.orphans}]`);
p('P8', 'AGAINST MY OWN INSTRUMENT: K-naive catches D*, misses X',
  STAT.DSTAR.naive.orphans.join() === 'PARAM-BOUND'
  && STAT.X.naive.orphans.length === 0
  && STAT.X.wide.orphans.join() === 'SET-BOUND-SEEDED',
  `naive D* [${STAT.DSTAR.naive.orphans}] · naive X [${STAT.X.naive.orphans}] · wide X [${STAT.X.wide.orphans}]`);
p('P9', 'non-literal RHS flag fires only under X',
  ['PUB', 'DEF', 'GEN', 'BOTH', 'DSTAR'].every((l) => STAT[l].wide.nonLiteral === 0) && STAT.X.wide.nonLiteral === 1,
  LABELS.map((l) => `${l}:${STAT[l].wide.nonLiteral}`).join(' '));
for (const [i, c] of CRIP.entries()) {
  p(['P10', 'P11', 'P12'][i], `cripple ${c.name} reports NOT-TOTAL`, c.total === false,
    `total=${c.total} (${c.why})`);
}
const agree = LABELS.every((l) => (STAT[l].wide.orphans.length === 0) === (DYN[l].p === 0));
p('P13', 'THE PAYLOAD: statics predicts the class-sum identity at all six', agree,
  LABELS.map((l) => `${l}: static orphans ${STAT[l].wide.orphans.length} / dynamic p ${DYN[l].p}`).join(' · '));
p('P14', 'AGAINST ME: p_X reproduces Theseus\'s 25', DYN.X.p === 25, `p_X ${DYN.X.p}`);

// ─── controls ───────────────────────────────────────────────────────────────────────────────────

const CTL = [];
const ctl = (kind, name, got, want) => CTL.push({ kind, name, got, want, ok: String(got) === String(want) });
ctl('invariant', 'sliced region bytes', SLICED.length, 7893);
ctl('invariant', 'CLASSES.length', CLASSES.length, 10);
ctl('invariant', 'G substitutions', GSUBS.length, 4);
ctl('invariant', 'D* substitutions', DSTAR.length, 2);
ctl('sensitive', 'corpus files', CORPUS.length, 867);
ctl('sensitive', 'sites (PUB)', DYN.PUB.M, 127);
ctl('sensitive', 'excludedDirectTails (PUB)', DYN.PUB.excluded, 64);

// ─── mitigation (3): nothing written outside this unit ──────────────────────────────────────────

const porcelain = sh('git status --porcelain').split('\n').filter(Boolean);
const outside = porcelain.filter((l) => !l.includes('unit-533exhaust-2026-11-28'));

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

say(`unit-533exhaust — arm · HEAD ${SHA} · prereg ${PREREG_SHA} · ${CLOCK}`);
say(`sliced region ${SLICED.length} B (sha ${sha12(SLICED)}) · CLASSES ${CLASSES.length} · corpus ${CORPUS.length} files`);
say();

say('§A  STATIC — totality and enumeration, per instantiation');
say(`  ${pad('label', 7)}${pad('region B', 10)}${pad('TOTAL', 7)}${pad('assign', 8)}${pad('|L|', 5)}${pad('nonLit', 8)}orphans`);
for (const l of LABELS) {
  const s = STAT[l];
  say(`  ${pad(l, 7)}${pad(s.regionBytes, 10)}${pad(s.total.total ? 'yes' : 'NO', 7)}${pad(s.wide.assignments, 8)}${pad(s.wide.size, 5)}${pad(s.wide.nonLiteral, 8)}[${s.wide.orphans.join(', ')}]`);
}
say(`  extras (in CLASSES, not in L) at PUB: [${STAT.PUB.wide.extras.join(', ')}]  (LD3: reported, not graded)`);
say();

say('§B  K-naive vs K-wide — the same question asked by two readers');
say(`  ${pad('label', 7)}${pad('naive orphans', 20)}wide orphans`);
for (const l of LABELS) {
  say(`  ${pad(l, 7)}${pad(`[${STAT[l].naive.orphans.join(', ')}]`, 20)}[${STAT[l].wide.orphans.join(', ')}]`);
}
say();

say('§C  CRIPPLES — does the walker actually go red?');
for (const c of CRIP) say(`  ${c.total === false ? 'RED  ' : 'GREEN'}  ${pad(c.name, 42)} ${c.why}`);
say();

say('§D  DYNAMIC — armA on the real corpus, S vs |M|');
say(`  ${pad('label', 7)}${pad('S', 6)}${pad('|M|', 6)}${pad('p', 5)}${pad('excl', 6)}outside-the-ten`);
for (const l of LABELS) {
  const d = DYN[l];
  say(`  ${pad(l, 7)}${pad(d.S, 6)}${pad(d.M, 6)}${pad(d.p, 5)}${pad(d.excluded, 6)}[${d.outside.join(', ')}]`);
}
say();

say('§E  PREDICTIONS');
let hit = 0;
for (const q of P) {
  if (q.ok) hit += 1;
  say(`  ${q.ok ? 'HIT    ' : 'REFUTED'} ${pad(q.id, 5)} ${q.claim}`);
  say(`          ${q.got}`);
}
say(`  ${hit} HIT / ${P.length - hit} REFUTED of ${P.length}`);
say();

say('§F  CONTROLS, split drift-invariant / drift-sensitive');
for (const c of CTL) {
  say(`  ${c.ok ? 'OK  ' : c.kind === 'invariant' ? 'MISS' : 'MOVD'}  ${pad(c.kind, 10)}${pad(c.name, 30)}got ${pad(c.got, 8)}want ${c.want}`);
}
say();
say(`§G  mitigation — git status --porcelain: ${porcelain.length} line(s), ${outside.length} outside this unit`);
for (const l of outside) say(`       ${l}`);

writeFileSync(`${ROOT}${CAP}/ARM.out`, `${out.join('\n')}\n`);
