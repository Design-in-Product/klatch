/**
 * unit-530compose — the arm.
 *
 * Subject: `unit-529defaultparam`'s §2(c) keeper and the cell that licenses it
 * (`arm-defaultparam.mjs:425–434`), which iterates `CLASSES` and nothing else.
 *
 * Pre-registration: `PRE-REGISTRATION.md`, clock `2026-11-27 14:49:54 PST`, population SHA
 * `0d81d567a79e`, committed and pushed as `d9f67716` BEFORE this file existed. 12 predictions.
 *
 * ## His machinery is EXECUTED, not retyped
 *
 * `arm-defaultparam.mjs` is read as text, cut at the `Arm A` banner, stripped of its `import`
 * lines and its `import.meta`-dependent `ROOT`, and run through `new Function` with those bindings
 * passed in. So `RUN`, `CLS`, `CORPUS`, `INST`, `NARROW` and his whole KP set here ARE his bytes:
 * this unit cannot drift from the unit it audits, and his §0 attributability checks and 15 KP cells
 * re-run as a precondition of my own measurement.
 *
 * ## Why no key
 *
 * His own §2(d) measured `keyOf = path:line:receiver` hiding 4 population members behind 4
 * colliding keys. Every member-level figure below is therefore POSITIONAL — the four runs aligned
 * at identical indices — and the arm asserts the alignment is legitimate before using it.
 *
 * ## No display field
 *
 * Every member line prints whole. No single-quoted brace character literal appears in this file, so
 * it is out of the brace-slicer gate's population by construction — and this sentence is worded
 * WITHOUT quoting either brace, because a docblock that quotes the characters it claims are absent
 * falsifies itself and joins the gate's own irreducible-limit list. Verified by searching this file.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parenSpanEnd } from '../../../scripts/lib/decl-body.mjs';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = new URL('../../../', import.meta.url).pathname;
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const pad = (s, n) => String(s).padEnd(n, ' ');
const occ = (hay, needle) => hay.split(needle).length - 1;

// ─── §0 attributability, re-asserted here and not inherited ─────────────────────────────────────

const dirty = sh('git diff --stat HEAD -- packages/ scripts/').trim();
if (dirty !== '') {
  throw new Error(`§0: packages/ or scripts/ is dirty, so no figure here is attributable:\n${dirty}`);
}
const SHA = sh('git rev-parse --short=12 HEAD').trim();
const CLOCK = sh('TZ=America/Los_Angeles date "+%Y-%m-%d %H:%M:%S %Z"').trim();
const PREREG_SHA = '0d81d567a79e';

const SUBJ = 'docs/research/unit-529defaultparam-2026-11-27/arm-defaultparam.mjs';
const FROZEN = 'docs/research/unit-523indirectsize-2026-11-26/arm-indirectsize.mjs';
const DONOR = 'docs/research/unit-527setgeneric-2026-11-27/arm-setgeneric.mjs';
for (const f of [SUBJ, FROZEN, DONOR]) {
  const d = sh(`git diff --stat HEAD -- ${f}`).trim();
  if (d !== '') throw new Error(`§0: ${f} is modified in the worktree:\n${d}`);
}
const subjText = readFileSync(`${ROOT}${SUBJ}`, 'utf8');
const frozenText = readFileSync(`${ROOT}${FROZEN}`, 'utf8');

const CAP = 'docs/research/unit-530compose-2026-11-27/captures';
const results = [];
const ck = (name, ok, got) => { results.push({ name, ok, got }); };

// ─── executing his machinery ────────────────────────────────────────────────────────────────────

const CUT = '// ─── Arm A: the UNRESOLVED partition ─';
const cutAt = subjText.indexOf(CUT);
if (cutAt < 0) throw new Error('cut anchor not found in the subject');
const prefix = subjText.slice(0, cutAt);
const stripped = prefix
  .split('\n')
  .filter((l) => !/^import\s/.test(l) && !/^const ROOT = new URL\(/.test(l))
  .join('\n');
ck('S1  the subject prefix was cut and stripped, and the strip removed exactly 6 lines',
  prefix.split('\n').length - stripped.split('\n').length === 6,
  `${prefix.split('\n').length} -> ${stripped.split('\n').length} lines`);

const RETURN = `
  return { LABELS, CLASSES, RUN, CLS, CORPUS, INST, KP, NARROW, MOV, MAPS, keyOf,
           GSUBS, DSUB, PARAM_SRC, TEXT, SLICED, GENERIC_SRC };
`;
// eslint-disable-next-line no-new-func
const run = new Function('execSync', 'readFileSync', 'writeFileSync', 'createHash',
  'stripSource', 'parenSpanEnd', 'ROOT', stripped + RETURN);
const S = run(execSync, readFileSync, writeFileSync, createHash, stripSource, parenSpanEnd, ROOT);

const { LABELS, CLASSES, RUN, CLS, CORPUS, INST, KP, NARROW } = S;
ck('S2  his 15 KP cells re-ran here and all pass, so his machinery is live not merely parsed',
  KP.length === 15 && KP.every((k) => k.ok), `${KP.filter((k) => k.ok).length} of ${KP.length} ok`);

// ─── P1: do the ten CLASSES partition the population? ───────────────────────────────────────────

const POP = {};
for (const l of LABELS) POP[l] = RUN[l].sites.length;
const colSum = {};
for (const l of LABELS) colSum[l] = CLASSES.reduce((a, k) => a + (CLS[l][k] || 0), 0);
const partitions = LABELS.every((l) => colSum[l] === POP[l]);
const popConstant = new Set(LABELS.map((l) => POP[l])).size === 1;
ck('P1  the ten CLASSES partition the population, and the population is constant across all four',
  partitions && popConstant,
  `pop ${LABELS.map((l) => `${l}=${POP[l]}`).join(' ')} · colsums ${LABELS.map((l) => colSum[l]).join('/')}`);

// Every site in exactly one class, asserted directly rather than inferred from the sum.
let multiClass = 0;
for (const l of LABELS) {
  for (const s of RUN[l].sites) {
    if (CLASSES.filter((k) => s.cls === k).length !== 1) multiClass += 1;
  }
}
ck('P1b every site carries exactly one of the ten class names', multiClass === 0,
  `${multiClass} site(s) in zero or multiple classes`);

// ─── the additive model, recomputed here ────────────────────────────────────────────────────────

const additiveOf = (p, d, g) => d + g - p;
const ADD = {};
const OFF = {};
for (const k of CLASSES) {
  ADD[k] = additiveOf(CLS.PUB[k] || 0, CLS.DEF[k] || 0, CLS.GEN[k] || 0);
  OFF[k] = (CLS.BOTH[k] || 0) - ADD[k];
}
const failing = CLASSES.filter((k) => OFF[k] !== 0);

// ─── P2: the zero is FORCED, so a single-class failure is impossible ────────────────────────────

const offSum = CLASSES.reduce((a, k) => a + OFF[k], 0);
ck('P2a the off-by column sums to zero', offSum === 0, `Σ off-by = ${offSum}`);
// The identity, shown rather than asserted: Σ BOTH − Σ(DEF+GEN−PUB) = N − (N+N−N) = 0.
const identity = colSum.BOTH - (colSum.DEF + colSum.GEN - colSum.PUB);
ck('P2b the zero is FORCED by the partition, not observed: ΣBOTH − (ΣDEF+ΣGEN−ΣPUB) ≡ 0 at constant population',
  identity === 0 && partitions && popConstant,
  `${colSum.BOTH} − (${colSum.DEF} + ${colSum.GEN} − ${colSum.PUB}) = ${identity}`);
ck('P2c therefore the count of failing classes can never be 1',
  failing.length !== 1, `failing classes = ${failing.length} (${failing.join(', ') || 'none'})`);
// Does HIS report qualify the 2? Searched in his arm text.
const qualifies = /sums? to zero|conservation|mirror|forced by the partition|never 1|cannot be 1/i.test(subjText);
ck('P2d his arm contains NO cell asserting the conservation that makes his 2 one movement',
  qualifies === false, `qualifying language present in subject: ${qualifies}`);

// ─── P3: positional member census, NO key ───────────────────────────────────────────────────────

// The alignment is asserted before it is used: same length, and identical (path, line) at every
// index in all four runs. Without this the tuple census would be comparing different sites.
let misaligned = 0;
for (let i = 0; i < RUN.PUB.sites.length; i += 1) {
  const a = RUN.PUB.sites[i];
  for (const l of LABELS) {
    const b = RUN[l].sites[i];
    if (!b || b.path !== a.path || b.line !== a.line) misaligned += 1;
  }
}
ck('P3a the four runs are positionally aligned at every index, so a keyless tuple census is legitimate',
  misaligned === 0, `${misaligned} index/label pair(s) misaligned`);

const tupleOf = (i) => LABELS.map((l) => RUN[l].sites[i].cls);
const isConstant = (t) => new Set(t).size === 1;
const patterns = new Map();
const movers = [];
for (let i = 0; i < RUN.PUB.sites.length; i += 1) {
  const t = tupleOf(i);
  if (isConstant(t)) continue;
  const key = t.join(' | ');
  if (!patterns.has(key)) patterns.set(key, []);
  patterns.get(key).push(i);
  movers.push({ i, t, site: RUN.PUB.sites[i] });
}
ck('P3b exactly 6 sites are non-constant across the tuple, in exactly 2 distinct patterns',
  movers.length === 6 && patterns.size === 2,
  `${movers.length} non-constant site(s) in ${patterns.size} pattern(s)`);
const wantA = 'OTHER-BOUND | OTHER-BOUND | SET-BOUND | SET-BOUND';
const wantB = 'UNRESOLVED | OTHER-BOUND | UNRESOLVED | SET-BOUND';
ck('P3c the two patterns and their counts are the registered ones (4 generic-only, 2 needing both)',
  (patterns.get(wantA) || []).length === 4 && (patterns.get(wantB) || []).length === 2,
  `A=${(patterns.get(wantA) || []).length} B=${(patterns.get(wantB) || []).length}`);

// ─── P4: is there a per-site additive predicate? ────────────────────────────────────────────────

// Additivity is defined on counts. A per-site referent would have to say, of a single site, "this
// is the one addition got wrong" — which requires a per-site additive PREDICTION. For each site the
// single-cure outcomes are classes, not counts; the only defensible per-site statement is the tuple.
// Operationalised: a site whose BOTH class differs from BOTH single-cure classes AND from PUB is a
// "jointly-routed" site; the arm reports whether the ±2 is attributable to such sites UNIQUELY.
const jointlyRouted = movers.filter((m) => {
  const [p, d, g, b] = m.t;
  return b !== p && b !== d && b !== g;
});
const destinationShift = movers.filter((m) => {
  const [p, d, g, b] = m.t;
  return d !== p && b !== d;
});
ck('P4a the ±2 is attributable only through the tuple: exactly 2 sites are jointly routed (BOTH differs from PUB, DEF and GEN alike)',
  jointlyRouted.length === 2, `${jointlyRouted.length} jointly-routed site(s)`);
ck('P4b and those same 2 are the destination-shifted ones — one movement, not two',
  destinationShift.length === 2
  && jointlyRouted.every((m) => destinationShift.some((n) => n.i === m.i)),
  `jointly-routed ${jointlyRouted.length} · destination-shifted ${destinationShift.length}`);

// ─── P5: did his cell ever run at the hazard's granularity? ─────────────────────────────────────

// Structural, not just textual: find his additivity block and ask what it iterates; then ask
// whether the token NARROW appears anywhere in it.
const p9start = subjText.indexOf('// ─── P9: additivity');
const p9end = subjText.indexOf('// ─── the two named members');
const p9block = p9start >= 0 && p9end > p9start ? subjText.slice(p9start, p9end) : '';
ck('P5a his additivity block was located', p9block.length > 0, `${p9block.length} B`);
const mentionsNarrow = /NARROW/.test(p9block);
const iteratesClasses = /CLASSES/.test(p9block);
ck('P5b his additivity block iterates CLASSES and never mentions NARROW',
  iteratesClasses && !mentionsNarrow,
  `iterates CLASSES: ${iteratesClasses} · mentions NARROW: ${mentionsNarrow}`);
// And nowhere else in the whole subject is an additive hazard compared to the measured one.
const addLines = subjText.split('\n')
  .map((l, n) => ({ l, n: n + 1 }))
  .filter(({ l }) => /additive/i.test(l) && /NARROW|hazard/i.test(l));
ck('P5c NOWHERE in the subject is an additive hazard prediction compared to the measured BOTH hazard',
  addLines.length === 0,
  addLines.length === 0 ? 'no such line' : addLines.map((x) => `${x.n}: ${x.l.trim()}`).join(' ;; '));

// ─── P6: run it there ───────────────────────────────────────────────────────────────────────────

const HAZ = {};
for (const l of LABELS) HAZ[l] = NARROW[l].length;
const hazAdd = additiveOf(HAZ.PUB, HAZ.DEF, HAZ.GEN);
const hazOff = HAZ.BOTH - hazAdd;
ck('P6  additive hazard 5 vs measured 7, off by +2 — a third non-additive figure, and not a class',
  hazAdd === 5 && HAZ.BOTH === 7 && hazOff === 2,
  `PUB ${HAZ.PUB} DEF ${HAZ.DEF} GEN ${HAZ.GEN} BOTH ${HAZ.BOTH} · additive ${hazAdd} · off ${hazOff > 0 ? '+' : ''}${hazOff}`);

// ─── P7: direction tally over every non-additive figure ─────────────────────────────────────────

const FIGS = [
  ...failing.map((k) => ({ name: k, kind: 'class', off: OFF[k], vacated: (CLS.BOTH[k] || 0) < (CLS.PUB[k] || 0) })),
  { name: 'NARROWED-HAZARD', kind: 'derived', off: hazOff, vacated: HAZ.BOTH < HAZ.PUB },
];
const under = FIGS.filter((f) => f.off > 0);
const over = FIGS.filter((f) => f.off < 0);
ck('P7a of every non-additive figure, the additive model UNDER-counts 2 and OVER-counts 1',
  under.length === 2 && over.length === 1,
  `under ${under.map((f) => f.name).join('+')} · over ${over.map((f) => f.name).join('+')}`);
ck('P7b and every over-count is at a VACATED figure, which no roadmap prices',
  over.length > 0 && over.every((f) => f.vacated) && under.every((f) => !f.vacated),
  `over-counts vacated: ${over.map((f) => `${f.name}=${f.vacated}`).join(' ')}`);

// ─── P8: are the cures in SERIES? ───────────────────────────────────────────────────────────────

// The frozen subject's SET-BOUND branch, and whether a GSUB widens that very test.
const { GSUBS, GENERIC_SRC, SLICED } = S;
const sbTest = /'new Set\('/.test(SLICED);
const widened = GSUBS.some((s) => /new Set\(/.test(s.from) && s.to.includes(GENERIC_SRC.slice(0, 8)))
  || GSUBS.some((s) => /new Set\(/.test(s.from));
ck('P8a the frozen subject tests the rhs against the NON-GENERIC literal \'new Set(\'',
  sbTest, `literal present in the sliced subject: ${sbTest}`);
ck('P8b and one of the four GSUBS widens that very test',
  widened, `a GSUB anchors on 'new Set(': ${widened}`);
// The series claim at fixture granularity, read out of HIS OWN KP set rather than re-planted:
const k2 = KP.find((k) => /cure G alone/.test(k.name));
ck('P8c his own K2 already encodes the series: a GENERIC bound Set is OTHER-BOUND until G is present',
  k2 !== undefined && k2.ok && /PUB=OTHER-BOUND/.test(k2.got) && /GEN=SET-BOUND/.test(k2.got),
  k2 ? k2.got : 'K2 not found');
// D produces a bound rhs; G's widened test consumes it. Measured on the 2 jointly-routed sites.
const seriesSites = jointlyRouted.map((m) => {
  const d = RUN.DEF.sites[m.i];
  const b = RUN.BOTH.sites[m.i];
  return { path: d.path, line: d.line, defBind: d.bindLine, bothBind: b.bindLine, defCls: d.cls, bothCls: b.cls };
});
ck('P8d on both jointly-routed sites D supplies the binding (bindLine non-null under DEF) and G re-routes it',
  seriesSites.length === 2 && seriesSites.every((s) => s.defBind !== null && s.defCls === 'OTHER-BOUND' && s.bothCls === 'SET-BOUND'),
  seriesSites.map((s) => `${s.defCls}@${s.defBind} -> ${s.bothCls}`).join(' · '));

// ─── P9: a series pair cannot cancel ────────────────────────────────────────────────────────────

let cancelled = 0;
const cancelRows = [];
for (let i = 0; i < RUN.PUB.sites.length; i += 1) {
  const [p, d, g, b] = tupleOf(i);
  if (b === p && (d !== p || g !== p)) { cancelled += 1; cancelRows.push({ i, t: [p, d, g, b] }); }
}
ck('P9  no site is returned to its PUB class by adding the second cure, so the only negative off-by is a vacated class',
  cancelled === 0, `${cancelled} cancelled site(s)`);

// ─── P10: control — his arm driven UNCHANGED as a child ─────────────────────────────────────────

let ctrlText = '';
let ctrlRc = -1;
try {
  ctrlText = sh(`node ${SUBJ} 2>${CAP}/CONTROL-529.err`);
  ctrlRc = 0;
} catch (e) {
  ctrlText = (e.stdout || '') + (e.stderr || '');
  ctrlRc = e.status === undefined ? -1 : e.status;
}
writeFileSync(`${ROOT}${CAP}/CONTROL-529.out`, ctrlText);
const grab = (re) => { const m = re.exec(ctrlText); return m ? m[1] : null; };
const cOff = /SET-BOUND\s+40\s+42\s+\+2/.test(ctrlText) && /OTHER-BOUND\s+32\s+30\s+-2/.test(ctrlText);
const cFails = grab(/classes where addition FAILS: (\d+)/);
const cHaz = ['PUB', 'DEF', 'GEN', 'BOTH']
  .map((l) => grab(new RegExp(`${l}\\s+(\\d+)\\s+guard \\{"BLIND"`)));
ck('P10a his arm drove unchanged at my pin, exit 0', ctrlRc === 0, `rc=${ctrlRc}, ${ctrlText.length} B`);
ck('P10b it reproduces its published off-by +2 / −2 and "FAILS: 2"',
  cOff && cFails === '2', `off-by rows match: ${cOff} · FAILS: ${cFails}`);
ck('P10c it reproduces the published hazard 4/4/5/7',
  cHaz.join('/') === '4/4/5/7', `hazard ${cHaz.join('/')}`);
ck('P10d and my sliced reading of the same four cells agrees with his child process',
  (CLS.BOTH['SET-BOUND'] || 0) === 42 && ADD['SET-BOUND'] === 40
  && (CLS.BOTH['OTHER-BOUND'] || 0) === 30 && ADD['OTHER-BOUND'] === 32,
  `sliced SET-BOUND add ${ADD['SET-BOUND']} meas ${CLS.BOTH['SET-BOUND']} · OTHER-BOUND add ${ADD['OTHER-BOUND']} meas ${CLS.BOTH['OTHER-BOUND']}`);

// ─── P11: corpus drift, reported not laundered ──────────────────────────────────────────────────

ck('P11 the corpus is ≥ 861 at my pin, and the class figures still reproduce',
  CORPUS.length >= 861 && (CLS.PUB['SET-BOUND'] || 0) === 36 && (CLS.PUB['OTHER-BOUND'] || 0) === 34,
  `corpus ${CORPUS.length} (his 861) · PUB SET-BOUND ${CLS.PUB['SET-BOUND']} OTHER-BOUND ${CLS.PUB['OTHER-BOUND']}`);

// ─── P12: KP/KN for MY OWN detectors, on planted tuples ─────────────────────────────────────────

const KPME = [];
const mcell = (name, got, want) => { KPME.push({ name, ok: got === want, got: `${got}`, want: `${want}` }); };

// (a) the constant/non-constant classifier
mcell('M1  KN: an all-same tuple is constant', isConstant(['A', 'A', 'A', 'A']), true);
mcell('M2  KP: a tuple differing only in the last cell is NOT constant', isConstant(['A', 'A', 'A', 'B']), false);
mcell('M3  KP: a tuple differing only in the middle is NOT constant', isConstant(['A', 'B', 'A', 'A']), false);

// (b) the jointly-routed detector, as a pure function of a tuple
const jr = ([p, d, g, b]) => b !== p && b !== d && b !== g;
mcell('M4  KP: the registered pattern B is jointly routed', jr(['UNRESOLVED', 'OTHER-BOUND', 'UNRESOLVED', 'SET-BOUND']), true);
mcell('M5  KN: pattern A (G alone suffices) is NOT jointly routed', jr(['OTHER-BOUND', 'OTHER-BOUND', 'SET-BOUND', 'SET-BOUND']), false);
mcell('M6  KN: a site D alone moves to its final class is NOT jointly routed', jr(['UNRESOLVED', 'SET-BOUND', 'UNRESOLVED', 'SET-BOUND']), false);
mcell('M7  KN: an unmoved site is NOT jointly routed', jr(['A', 'A', 'A', 'A']), false);

// (c) the cancellation detector
const cn = ([p, d, g, b]) => b === p && (d !== p || g !== p);
mcell('M8  KP: a cure cancelled by the other IS detected', cn(['A', 'B', 'A', 'A']), true);
mcell('M9  KP: both cures moving it and BOTH returning it IS detected', cn(['A', 'B', 'C', 'A']), true);
mcell('M10 KN: an unmoved site is not a cancellation', cn(['A', 'A', 'A', 'A']), false);
mcell('M11 KN: a site that moves and stays moved is not a cancellation', cn(['A', 'B', 'A', 'B']), false);

// (d) the additive arithmetic itself
mcell('M12 KP: additive model on a known triple', additiveOf(10, 12, 14), 16);
mcell('M13 KN: additive model is exact when only one cure moves anything', additiveOf(10, 12, 10), 12);

// ─── report ─────────────────────────────────────────────────────────────────────────────────────

console.log('═══ unit-530compose — arm ═══════════════════════════════════════════════════════');
console.log(`SHA ${SHA} · clock ${CLOCK}`);
console.log(`pre-registration SHA ${PREREG_SHA}; this drive is at ${SHA}`);
console.log(`§0 packages/ + scripts/ diff: EMPTY (asserted before any measurement)`);
console.log(`subject ${SUBJ}`);
console.log(`  cut at ${JSON.stringify(CUT)} -> prefix ${prefix.length} B, stripped ${stripped.length} B`);
console.log(`corpus ${CORPUS.length} files · population ${POP.PUB} sites`);
console.log('');

console.log('─── the 2×2 as HIS machinery reports it, recomputed here ────────────────────────');
console.log(`  ${pad('class', 20)}${pad('PUB', 7)}${pad('DEF', 7)}${pad('GEN', 7)}${pad('BOTH', 8)}${pad('additive', 10)}off-by`);
for (const k of CLASSES) {
  const off = OFF[k];
  console.log(`  ${pad(k, 20)}${pad(CLS.PUB[k] || 0, 7)}${pad(CLS.DEF[k] || 0, 7)}${pad(CLS.GEN[k] || 0, 7)}${pad(CLS.BOTH[k] || 0, 8)}${pad(ADD[k], 10)}${off > 0 ? '+' : ''}${off}`);
}
console.log(`  ${pad('— column total —', 20)}${pad(colSum.PUB, 7)}${pad(colSum.DEF, 7)}${pad(colSum.GEN, 7)}${pad(colSum.BOTH, 8)}${pad('', 10)}Σ off-by = ${offSum}`);
console.log(`  classes where addition FAILS: ${failing.length} (${failing.join(', ')})`);
console.log('');

console.log('─── the figure his cell never visited ───────────────────────────────────────────');
console.log(`  NARROWED HAZARD   PUB ${HAZ.PUB}   DEF ${HAZ.DEF}   GEN ${HAZ.GEN}   BOTH ${HAZ.BOTH}`);
console.log(`    additive = DEF + GEN − PUB = ${HAZ.DEF} + ${HAZ.GEN} − ${HAZ.PUB} = ${hazAdd}`);
console.log(`    measured BOTH = ${HAZ.BOTH} · off by ${hazOff > 0 ? '+' : ''}${hazOff}  — the additive model UNDER-counts`);
console.log('');

console.log('─── direction of every non-additive figure ──────────────────────────────────────');
console.log(`  ${pad('figure', 22)}${pad('kind', 10)}${pad('off-by', 9)}${pad('vacated?', 10)}direction`);
for (const f of FIGS) {
  console.log(`  ${pad(f.name, 22)}${pad(f.kind, 10)}${pad(`${f.off > 0 ? '+' : ''}${f.off}`, 9)}${pad(String(f.vacated), 10)}${f.off > 0 ? 'additive UNDER-counts' : 'additive OVER-counts'}`);
}
console.log('');

console.log('─── the positional tuple census, NO key ─────────────────────────────────────────');
console.log(`  aligned at ${RUN.PUB.sites.length} indices · ${misaligned} misaligned`);
console.log(`  non-constant sites: ${movers.length} in ${patterns.size} pattern(s)`);
for (const [p, idx] of patterns) {
  console.log(`    ${pad(idx.length, 4)} × ${p}`);
  for (const i of idx) {
    console.log(`           ${RUN.PUB.sites[i].path}:${RUN.PUB.sites[i].line}`);
  }
}
console.log(`  jointly routed (BOTH differs from PUB, DEF and GEN): ${jointlyRouted.length}`);
console.log(`  destination-shifted (D moved it, then G moved it again): ${destinationShift.length}`);
console.log(`  cancelled (returned to PUB by adding the second cure): ${cancelled}`);
console.log('');

console.log('─── the series account, measured ────────────────────────────────────────────────');
for (const s of seriesSites) {
  console.log(`  ${s.path}:${s.line}`);
  console.log(`      DEF: ${s.defCls} bindLine ${s.defBind}    BOTH: ${s.bothCls} bindLine ${s.bothBind}`);
}
console.log('');

console.log('─── control: his arm, driven unchanged as a child at my pin ─────────────────────');
console.log(`  rc ${ctrlRc} · ${ctrlText.length} B captured to ${CAP}/CONTROL-529.out`);
console.log(`  its hazard row: ${cHaz.join(' / ')} · its "FAILS": ${cFails}`);
console.log('');

console.log('─── MY OWN detectors, KP/KN ─────────────────────────────────────────────────────');
for (const k of KPME) {
  console.log(`  ${k.ok ? 'ok  ' : 'FAIL'} ${pad(k.name, 70)} got ${k.got} want ${k.want}`);
}
console.log(`  KP/KN: ${KPME.filter((k) => k.ok).length} of ${KPME.length}`);
console.log('');

console.log('─── predictions ─────────────────────────────────────────────────────────────────');
for (const r of results) {
  console.log(`  ${r.ok ? 'HIT    ' : 'REFUTED'} ${pad(r.name, 104)} ${r.got}`);
}
const hit = results.filter((r) => r.ok).length;
console.log('');
console.log(`GRADED: ${hit} HIT / ${results.length - hit} REFUTED of ${results.length}`);
console.log(`MY KP/KN: ${KPME.filter((k) => k.ok).length} of ${KPME.length}`);
console.log(`HIS KP re-run here: ${KP.filter((k) => k.ok).length} of ${KP.length}`);
