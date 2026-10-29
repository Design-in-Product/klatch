#!/usr/bin/env node
/**
 * GRADE — Daedalus's `T8` RED, routed to this seat in his 2026-10-29 START memo §4.
 *
 * `T8` in `docs/research/round464-instruments/grade-the-stop-condition.mjs` asserts
 * `consecutiveSelfOnly === consecutiveUnion`, and after his population re-key it publishes
 * `RED  detail: dir 2 vs union 0; last dir=464 union=467`. His memo calls the free variable
 * "LIVE, not latent" and asks this seat to key "the cell that decides whether the two credit
 * keys can be reconciled".
 *
 * The narrow question: does `T8`'s comparison have TWO moving operands? `consecutiveUnion` is
 * `count(attested > max(unionCure))`. If `max(unionCure)` is at or above the ceiling of the very
 * population being counted over, that operand is 0 for a structural reason and `T8` reduces to
 * "the dir arm is non-zero" — reporting the dir key's freeze under a leg text that claims to
 * report key disagreement.
 *
 * WHAT THIS CELL DOES NOT DO: re-derive his cure sets. Every operand is SLICED out of a recorded
 * drive with an anchor counted exactly once, and the population comes from his shared reader
 * `docs/research/lib/attested-rounds.mjs`. A hand-typed copy of his reader would be grading my
 * copy of his key, not his key.
 *
 * Arms (argv[2]): none | anchor-drift | containment-key-blind | ceiling-key-equality |
 *                 figures-from-dir-population
 *
 * `ceiling-removed` is NOT a cripple here, though predicted.md listed it as one. It turned out to
 * be a real drive: `drive3.scratch-ceiling-removed.out` is his cell run in a scratch clone
 * carrying one synthetic attested round above `467` that the union key does not credit. That
 * divergence from the filed map is recorded rather than tidied.
 */

import { readFileSync, existsSync } from 'node:fs';
import {
  renderVerdict, renderRows, renderPredRows, measured, selfTest as verdictSelfTest,
} from '../lib/verdict.mjs';
import { attestedRounds, dirRounds, selfTest as attestedSelfTest } from '../lib/attested-rounds.mjs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const ARMS = ['anchor-drift', 'containment-key-blind', 'ceiling-key-equality', 'figures-from-dir-population'];
const CRIPPLE = process.argv[2] ?? null;
if (CRIPPLE !== null && !ARMS.includes(CRIPPLE)) {
  console.error(`unknown arm ${JSON.stringify(CRIPPLE)}; known: ${ARMS.join(', ')}`);
  process.exit(2);
}

const say = (...a) => console.log(...a);
const legs = [];
const preds = [];
const MEAS_IDS = ['M1', 'M2'];
const leg = (ok, id, what, detail) => {
  legs.push({ id, ok, what: `${what} | detail: ${detail}`.replace(/\s+$/, '') });
};
const pred = (landed, id, what, detail) => {
  preds.push({ id, landed, what: `${what} | ${detail}`.replace(/\s+$/, '') });
};

say('=== GRADE/unit-464t2-t8 — are T8\'s two operands both moving? ===');
say(`REPO ${REPO}`);
say(`ARM ${CRIPPLE ?? 'none (clean)'}`);
say(`CLOCK ${new Date().toISOString()}`);

// ---------------------------------------------------------------------------
// Population, from HIS shared reader.
// ---------------------------------------------------------------------------
let libOk = null;
let libWhy = 'not run';
try {
  libOk = attestedSelfTest() === true && verdictSelfTest() === true;
  libWhy = libOk ? 'both true' : 'a lib selfTest returned a non-true value';
} catch (e) { libOk = false; libWhy = `threw: ${e.message}`; }

const attested = attestedRounds(REPO, 'HEAD');
const dirs = dirRounds(REPO, 'HEAD');
const attestedMax = attested === null ? null : Math.max(...attested.sorted);
const dirMax = dirs === null ? null : Math.max(...dirs);

say('\n--- population (his lib) ---');
say(`  lib selfTests : ${libWhy}`);
say(`  attested      : n=${attested === null ? 'REFUSED' : attested.sorted.length} max=${attestedMax}`);
say(`  dir surface   : n=${dirs === null ? 'REFUSED' : dirs.length} max=${dirMax}`);

// ---------------------------------------------------------------------------
// Slicing. Anchors are COUNTED; a drifted or duplicated anchor refuses rather
// than silently taking the first hit. The `anchor-drift` arm perturbs one.
// ---------------------------------------------------------------------------
const A = {
  t8detail: /^      detail: dir (\d+|null) vs union (\d+|null); last dir=(\d+|null) union=(\d+|null)$/gm,
  // The row prefix is captured, NOT typed. His green arm renders ` ok  T8:` with a LEADING
  // space and the red arm renders `RED  T8:`; a hand-typed `^(RED|ok )` matched his red arm and
  // 0 times in his green one, which is how the gate caught this. The prefix is trimmed and
  // checked against a declared token set below, so an unrecognised rendering REFUSES rather
  // than being read as the wrong colour.
  t8token: /^(.{0,5}?)T8: the two keys give the SAME consecutive run/gm,
  counting: /^COUNTING POPULATION key=(\w+) n=(\d+) max=(\d+)$/gm,
  verdict: /^VERDICT\/\d+ (\w+) legs=\d+ red=\[([^\]]*)\]/gm,
};
if (CRIPPLE === 'anchor-drift') {
  // one anchor perturbed so it matches 0 times — the gate must refuse, not fall through
  A.t8detail = /^      detail: dir (\d+|null) VS union (\d+|null); last dir=(\d+|null) union=(\d+|null)$/gm;
}

const RECS = {
  clean: 'docs/research/unit-464t2-t8-2026-10-29/drive1.repro-clean.out',
  hisClean: 'docs/research/unit-464t2-rekey-2026-10-29/drive2.stop-clean.out',
  hisDirPop: 'docs/research/unit-464t2-rekey-2026-10-29/drive3.cripple-population-dir-only.out',
  ceilingRemoved: 'docs/research/unit-464t2-t8-2026-10-29/drive3.scratch-ceiling-removed.out',
};

function slice(rel) {
  const path = `${REPO}/${rel}`;
  if (!existsSync(path)) return { ok: false, why: `missing ${rel}`, hits: {} };
  const txt = readFileSync(path, 'utf8');
  const hits = {};
  const grab = (re) => { const m = [...txt.matchAll(re)]; return m; };
  const d = grab(A.t8detail); hits.t8detail = d.length;
  const t = grab(A.t8token); hits.t8token = t.length;
  const c = grab(A.counting); hits.counting = c.length;
  const v = grab(A.verdict); hits.verdict = v.length;
  const exactlyOnce = Object.values(hits).every((n) => n === 1);
  if (!exactlyOnce) return { ok: false, why: `anchor hits ${JSON.stringify(hits)}`, hits };
  // Declared token set. An unrecognised prefix refuses the whole slice rather than being
  // collapsed into a colour by an `=== 'RED' ? ... : 'ok'` fall-through, which would have read
  // every unexpected rendering as green.
  const TOKENS = ['RED', 'ok', 'MEAS', 'REF'];
  const rawPrefix = t[0][1];
  const token = rawPrefix.trim();
  if (!TOKENS.includes(token)) {
    return { ok: false, why: `unrecognised T8 row token ${JSON.stringify(rawPrefix)}`, hits };
  }
  return {
    ok: true,
    hits,
    dir: Number(d[0][1]),
    union: Number(d[0][2]),
    lastDir: Number(d[0][3]),
    lastUnion: Number(d[0][4]),
    t8: token,
    t8rawPrefix: rawPrefix,
    popKey: c[0][1],
    popN: Number(c[0][2]),
    popMax: Number(c[0][3]),
    verdict: v[0][1],
    red: v[0][2],
  };
}

const S = {};
for (const [k, rel] of Object.entries(RECS)) S[k] = slice(rel);

// The `figures-from-dir-population` arm substitutes which recording is the primary ("clean") one.
const PRIMARY_KEY = CRIPPLE === 'figures-from-dir-population' ? 'hisDirPop' : 'clean';
const P = S[PRIMARY_KEY];

say('\n--- sliced operands ---');
say('  recording                 ok   popKey   popMax  lastUnion  dir union  T8');
for (const [k, s] of Object.entries(S)) {
  if (!s.ok) { say(`  ${k.padEnd(25)} NO   ${s.why}`); continue; }
  say(`  ${k.padEnd(25)} yes  ${String(s.popKey).padEnd(8)} ${String(s.popMax).padEnd(7)} `
    + `${String(s.lastUnion).padEnd(10)} ${String(s.dir).padEnd(3)} ${String(s.union).padEnd(4)} ${s.t8}`);
}
say(`  PRIMARY arm = ${PRIMARY_KEY}`);

// ---------------------------------------------------------------------------
// G1 — the gate.
// ---------------------------------------------------------------------------
const allSliced = Object.values(S).every((s) => s.ok);
const g1 = measured(
  libOk === null ? null : true,
  () => libOk === true && allSliced && attested !== null && dirs !== null
);
leg(
  g1 === null ? null : g1,
  'G1',
  'GATE: both shared libs self-test true, every anchor matched EXACTLY once in every recording, '
    + 'and both population surfaces loaded non-empty',
  `libs=${libWhy}; sliced=${Object.entries(S).map(([k, s]) => `${k}:${s.ok ? 'y' : 'n'}`).join(',')}; `
    + `attested=${attested === null ? 'REFUSED' : attested.sorted.length} dir=${dirs === null ? 'REFUSED' : dirs.length}`
);
const gate = g1 === true;
const G = (v) => (gate ? v : null);

// ---------------------------------------------------------------------------
// U1 — is the union arm at or above the ceiling of the population it counts over?
//
// Keyed on `>=`, NOT on `===`. A `lastUnion` strictly ABOVE the population max is the
// worse case, not a passing one — it is what his own `population-dir-only` arm shows
// (467 against a dir max of 464). `ceiling-key-equality` is the arm that drives the
// `===` mis-key I nearly shipped.
// ---------------------------------------------------------------------------
const ceilingKey = CRIPPLE === 'ceiling-key-equality'
  ? (lastUnion, popMax) => lastUnion === popMax
  : (lastUnion, popMax) => lastUnion >= popMax;
const atCeiling = P.ok ? ceilingKey(P.lastUnion, P.popMax) : null;
const ceilingCause = !P.ok ? 'unsliced'
  : P.lastUnion > P.popMax ? 'above' : P.lastUnion === P.popMax ? 'equal' : 'below';
leg(
  G(P.ok ? !atCeiling : null),
  'U1',
  'the union arm is NOT at or above the ceiling of the population it counts over — a RED means '
    + '`count(attested > lastUnion)` is 0 for a structural reason, so the operand is pinned and T8 '
    + 'reduces to "the dir arm is non-zero"',
  `lastUnion=${P.ok ? P.lastUnion : '-'} popMax=${P.ok ? P.popMax : '-'} cause=${ceilingCause} `
    + `key=${CRIPPLE === 'ceiling-key-equality' ? '===' : '>='} atCeiling=${atCeiling}`
);

// U1KP — confusion matrix for the ceiling key, on synthetic figures. Without it a key
// that answered "at ceiling" for everything would pass U1 identically.
const KP_CEIL = [
  { lastUnion: 467, popMax: 467, label: 'equal', expect: true },
  { lastUnion: 467, popMax: 464, label: 'above', expect: true },
  { lastUnion: 467, popMax: 470, label: 'below', expect: false },
];
const kpCeilRows = KP_CEIL.map((c) => ({ ...c, got: ceilingKey(c.lastUnion, c.popMax) }));
const kpCeilOk = kpCeilRows.every((r) => r.got === r.expect);
say('\n--- U1KP ceiling-key confusion matrix ---');
for (const r of kpCeilRows) {
  say(`  lastUnion=${r.lastUnion} popMax=${r.popMax} (${r.label}) expect=${r.expect} got=${r.got} `
    + `${r.got === r.expect ? '' : '<- MISS'}`);
}
leg(
  G(kpCeilOk),
  'U1KP',
  'the ceiling key separates all three positions — at the ceiling, above it, and below it — so '
    + 'U1 is not a key that answers the same way for every input',
  kpCeilRows.map((r) => `${r.label}:${r.got === r.expect ? 'hit' : 'MISS'}`).join(' ')
);

// ---------------------------------------------------------------------------
// U2 — is T8 two-sided? Read off HIS source construction, not from the figures.
// ---------------------------------------------------------------------------
const CELL = 'docs/research/round464-instruments/grade-the-stop-condition.mjs';
let hisSrc = readFileSync(`${REPO}/${CELL}`, 'utf8');
if (CRIPPLE === 'containment-key-blind') {
  // blind the detector: rename the construction so neither key can see the nesting
  hisSrc = hisSrc.replace('const curedByUnionKey = new Set(curedByDirKey);',
    'const curedByUnionKey = new Set(/* independent */);');
}
const nestingKey = (src) => {
  const seeded = /const curedByUnionKey = new Set\(curedByDirKey\)\s*;/.test(src);
  const muts = [...src.matchAll(/curedByUnionKey\.(\w+)\(/g)].map((m) => m[1]);
  const addsOnly = muts.length > 0 && muts.every((m) => m === 'add' || m === 'has');
  return { seeded, muts, addsOnly, nested: seeded && addsOnly };
};
const nest = nestingKey(hisSrc);
say('\n--- U2 one-sidedness, read off his construction ---');
say(`  seeded from the dir cure set : ${nest.seeded}`);
say(`  mutations of the union set   : ${JSON.stringify(nest.muts)} addsOnly=${nest.addsOnly}`);
say(`  => nested=${nest.nested}; nested means lastUnion >= lastDir, so consecutiveUnion <= consecutiveDir`);
leg(
  G(!nest.nested),
  'U2',
  'T8 is TWO-SIDED — the union arm can in principle exceed the dir arm. A RED means the union cure '
    + 'set is the dir set plus additions by construction, so the inequality only ever runs one way '
    + 'and "the two keys give the same run" can only fail in one direction',
  `seeded=${nest.seeded} muts=${JSON.stringify(nest.muts)} addsOnly=${nest.addsOnly} nested=${nest.nested}`
);

// U2KP — the nesting detector graded on synthetic sources, both directions.
const KP_NEST = [
  {
    label: 'nested',
    src: 'const curedByUnionKey = new Set(curedByDirKey);\ncuredByUnionKey.add(x);',
    expect: true,
  },
  {
    label: 'independent',
    src: 'const curedByUnionKey = new Set();\ncuredByUnionKey.add(x);',
    expect: false,
  },
  {
    label: 'nested-but-deleting',
    src: 'const curedByUnionKey = new Set(curedByDirKey);\ncuredByUnionKey.delete(x);',
    expect: false,
  },
];
const kpNestRows = KP_NEST.map((c) => ({ ...c, got: nestingKey(c.src).nested }));
const kpNestOk = kpNestRows.every((r) => r.got === r.expect);
say('\n--- U2KP nesting-key confusion matrix ---');
for (const r of kpNestRows) {
  say(`  ${r.label.padEnd(20)} expect=${r.expect} got=${r.got} ${r.got === r.expect ? '' : '<- MISS'}`);
}
leg(
  G(kpNestOk),
  'U2KP',
  'the nesting key separates a seeded-and-only-added set from an independent one AND from a seeded '
    + 'set that deletes — so U2 is not keyed on the word "Set"',
  kpNestRows.map((r) => `${r.label}:${r.got === r.expect ? 'hit' : 'MISS'}`).join(' ')
);

// ---------------------------------------------------------------------------
// U3 — which END can move. A DRIVEN case where the union arm is non-zero.
// This is what keeps U1's RED a claim about this rev rather than about forever.
// ---------------------------------------------------------------------------
const cr = S.ceilingRemoved;
const unionMoved = cr.ok ? cr.union > 0 : null;
leg(
  G(unionMoved),
  'U3',
  'there is a DRIVEN case in which the union arm leaves 0 — his cell run in a scratch clone with one '
    + 'synthetic attested round above lastUnion that the union key does not credit. Green here is '
    + 'what makes U1 a statement about this rev and not about the construction',
  cr.ok
    ? `scratch popMax=${cr.popMax} lastUnion=${cr.lastUnion} union=${cr.union} dir=${cr.dir} (live: union=${P.ok ? P.union : '-'})`
    : `scratch recording ${cr.why}`
);

// ---------------------------------------------------------------------------
// U4 — is T8's RED sensitive to the union arm at all?
// ---------------------------------------------------------------------------
const sensitive = (P.ok && cr.ok) ? (P.t8 !== cr.t8) : null;
leg(
  G(sensitive),
  'U4',
  'T8\'s own verdict token CHANGES when the union arm leaves 0 — a RED means it does not, so the '
    + 'published RED is produced by the dir arm alone and carries no information about whether the '
    + 'two credit keys can be reconciled',
  (P.ok && cr.ok)
    ? `live dir=${P.dir} union=${P.union} T8=${P.t8} | ceiling-removed dir=${cr.dir} union=${cr.union} T8=${cr.t8}`
    : 'an arm is unsliced'
);

// ---------------------------------------------------------------------------
// U5 — is T8's only observed GREEN a both-arms-saturated case?
// FLOOR, stated as such: this is keyed on the 3 recordings in hand, not on all
// reachable states. It says the greens observed so far are vacuous, not that no
// non-vacuous green exists.
// ---------------------------------------------------------------------------
const observed = Object.entries(S).filter(([, s]) => s.ok).map(([k, s]) => ({
  k,
  t8: s.t8,
  bothSaturated: s.dir === 0 && s.union === 0,
  atCeiling: s.lastUnion >= s.popMax,
}));
const greens = observed.filter((o) => o.t8 === 'ok');
const nonVacuousGreen = greens.filter((o) => !o.bothSaturated);
say('\n--- U5 observed verdicts ---');
for (const o of observed) {
  say(`  ${o.k.padEnd(25)} T8=${o.t8}  bothArmsZero=${o.bothSaturated} unionAtCeiling=${o.atCeiling}`);
}
leg(
  G(greens.length === 0 ? null : nonVacuousGreen.length > 0),
  'U5',
  'at least one OBSERVED green of T8 is not a both-arms-zero case — a RED means every green in hand '
    + 'is T8 agreeing because both arms saturated, which is a floor on the observed set and not a '
    + 'claim that no non-vacuous green exists',
  `observed=${observed.length} greens=${greens.length} nonVacuous=${nonVacuousGreen.length} `
    + `greenMembers=[${greens.map((g) => g.k).join(',')}]`
);

// ---------------------------------------------------------------------------
// U6 — do T2c and T8 share a load-bearing operand?
// ---------------------------------------------------------------------------
// Keyed STRUCTURALLY on each leg's own `measured(...)` argument list, not on a character
// window. The first spelling here was `/T2c[\s\S]{0,2000}?consecutiveSelfOnly/` — a proximity
// window, which is the shape that over-reports: in a file this dense almost any two tokens are
// within 2000 characters of each other, so a green would have meant nothing. The population is
// two legs, so the HAND reading is primary (T2c's `measured` at line 628 and T8's at line 1013
// both take `consecutiveSelfOnly` as the compared value) and this key exists to be graded
// against that hand reading by U6KP.
const valueExprOf = (src, id) => {
  // every `measured(` call, sliced at its own id argument — bounded by the call, not by a window
  const chunks = src.split(/\bmeasured\(/).slice(1);
  for (const c of chunks) {
    const at = c.indexOf(`'${id}',`);
    if (at === -1) continue;
    return c.slice(0, at);
  }
  return null;
};
const usesSelfOnly = (src, id) => {
  const expr = valueExprOf(src, id);
  return expr === null ? null : /\bconsecutiveSelfOnly\b/.test(expr);
};
const t2cUsesSelfOnly = usesSelfOnly(hisSrc, 'T2c');
const t8UsesSelfOnly = usesSelfOnly(hisSrc, 'T8');
const sharedOperand = (t2cUsesSelfOnly === null || t8UsesSelfOnly === null)
  ? null
  : (t2cUsesSelfOnly && t8UsesSelfOnly);
// U6KP — the structural key graded against the hand reading, both directions. Without the
// negative row, a key that answered "uses it" for every id would pass U6 identically.
const KP_U6 = [
  { id: 'T2c', expect: true, why: 'hand-read at his line 628: consecutiveSelfOnly !== consecutiveOverDirSurface' },
  { id: 'T8', expect: true, why: 'hand-read at his line 1013: consecutiveSelfOnly === consecutiveUnion' },
  { id: 'T6', expect: false, why: 'hand-read: the committed-proposal leg, no consecutive figure in its value' },
  { id: 'T7', expect: false, why: 'hand-read: the standing-gate surface leg, keyed on t7 alone' },
];
const kpU6Rows = KP_U6.map((c) => ({ ...c, got: usesSelfOnly(hisSrc, c.id) }));
const kpU6Ok = kpU6Rows.every((r) => r.got === r.expect);
say('\n--- U6KP structural key vs the hand reading ---');
for (const r of kpU6Rows) {
  say(`  ${r.id.padEnd(5)} expect=${String(r.expect).padEnd(5)} got=${String(r.got).padEnd(5)} `
    + `${r.got === r.expect ? '' : '<- MISS'}  (${r.why})`);
}
leg(
  G(kpU6Ok),
  'U6KP',
  'the structural operand key agrees with the hand reading on all four legs — two that do rest on '
    + '`consecutiveSelfOnly` and two that do not. A RED means U6 is keyed on something other than '
    + 'the leg\'s own measured() argument',
  kpU6Rows.map((r) => `${r.id}:${r.got === r.expect ? 'hit' : 'MISS'}`).join(' ')
);
leg(
  G(sharedOperand === null ? null : !sharedOperand),
  'U6',
  'T2c and T8 do not both rest on `consecutiveSelfOnly` — a RED means one figure leaving 0 moves '
    + 'both legs, so the verdict line counts the dir key\'s freeze twice: once as T2c\'s green and '
    + 'once as T8\'s red',
  `T2c reads it=${t2cUsesSelfOnly} T8 reads it=${t8UsesSelfOnly} shared=${sharedOperand}`
);

// ---------------------------------------------------------------------------
// M1 / M2 — [MEAS], no assertion.
// ---------------------------------------------------------------------------
leg(
  G(true),
  'M1',
  '[MEAS] the observed (dir arm, union arm, ceiling cause, T8) table across every recording in hand '
    + '(no assertion)',
  Object.entries(S).filter(([, s]) => s.ok)
    .map(([k, s]) => `${k}:${s.dir}/${s.union}/${s.lastUnion > s.popMax ? 'above' : s.lastUnion === s.popMax ? 'equal' : 'below'}/${s.t8}`)
    .join(' ')
);
leg(
  G(true),
  'M2',
  '[MEAS] how far the union arm is from leaving the ceiling, in attested rounds (no assertion)',
  P.ok && attestedMax !== null
    ? `attestedMax=${attestedMax} lastUnion=${P.lastUnion} distance=${attestedMax - P.lastUnion} `
      + `(0 means the next uncredited attested round above ${P.lastUnion} moves it)`
    : 'unsliced'
);

// M0 — a declared [MEAS] leg that ever carries an assertion must redden, or any leg
// could opt out of the verdict by editing its own first six characters.
const declaredDrift = MEAS_IDS.filter((id) => {
  const l = legs.find((x) => x.id === id);
  return !l || !l.what.includes('[MEAS]') || l.ok === false;
});
leg(
  G(declaredDrift.length === 0),
  'M0',
  'every leg declared [MEAS] exists, says so in its own text, and is not carrying a RED — so the '
    + 'refusal set cannot be opted out of silently',
  `declared=[${MEAS_IDS.join(',')}] drifted=[${declaredDrift.join(',')}]`
);

// ---------------------------------------------------------------------------
// PREDICTIONS — as filed in predicted.md, before this grader existed.
// ---------------------------------------------------------------------------
const p1actual = P.ok ? `${P.lastUnion}|${attestedMax}|${P.lastUnion === attestedMax}` : 'unsliced';
pred(P.ok ? p1actual === '467|467|true' : null, 'PRED-1',
  'the union arm sits at the ceiling of the population it counts over',
  `expected=467|467|true actual=${p1actual}`);

const p2actual = `seededFromDir=${nest.seeded} addsOnly=${nest.addsOnly}`;
pred(p2actual === 'seededFromDir=true addsOnly=true', 'PRED-2',
  'T8 is one-sided by construction',
  `expected="seededFromDir=true addsOnly=true" actual="${p2actual}"`);

// PRED-3: of the four (dir in {0,nonzero}) x (union in {0,nonzero}) cells, T8 is green in one.
const cells = [];
for (const d of [0, 2]) for (const u of [0, 1]) cells.push({ d, u, t8: d === u ? 'ok' : 'RED' });
const greenCells = cells.filter((c) => c.t8 === 'ok');
const p3actual = `greenCells=${greenCells.length} members=[${greenCells.map((c) => `dir${c.d}/union${c.u}`).join(',')}]`;
pred(p3actual === 'greenCells=1 members=[dir0/union0]', 'PRED-3',
  'T8 is green in exactly one of the four cells, (0,0)',
  `expected="greenCells=1 members=[dir0/union0]" actual="${p3actual}"`);

const dp = S.hisDirPop;
const p4actual = dp.ok
  ? `t8=${dp.t8} causeAttested=${P.ok && PRIMARY_KEY === 'clean' ? ceilingCause : (S.clean.ok ? (S.clean.lastUnion === S.clean.popMax ? 'equal' : 'other') : '-')} causeDir=${dp.lastUnion > dp.popMax ? 'above' : dp.lastUnion === dp.popMax ? 'equal' : 'below'}`
  : 'unsliced';
pred(dp.ok ? p4actual === 't8=ok causeAttested=equal causeDir=above' : null, 'PRED-4',
  'under his population-dir-only arm T8 is green and the union arm\'s 0 has a DIFFERENT cause',
  `expected="t8=ok causeAttested=equal causeDir=above" actual="${p4actual}"`);

const p5actual = cr.ok ? `union=${cr.union} t8=${cr.t8}` : 'unsliced';
pred(cr.ok ? p5actual === 'union=1 t8=RED' : null, 'PRED-5',
  'a synthetic uncredited attested round above 467 moves the union arm to 1 and T8 stays RED '
    + '(DRIVEN in a scratch clone, not modelled)',
  `expected="union=1 t8=RED" actual="${p5actual}"`);

pred(sharedOperand === true, 'PRED-6',
  'T2c and T8 share the operand consecutiveSelfOnly',
  `expected=sharedOperand=true actual=sharedOperand=${sharedOperand}`);

// ---------------------------------------------------------------------------
// Output.
// ---------------------------------------------------------------------------
// `renderRows`/`renderPredRows` return an ARRAY of rows, not a string. `console.log` of an
// array prints a JS literal with quotes and commas, which no row reader can parse — drive4
// published exactly that. Joined here, and the join is asserted below.
const legRows = renderRows(legs);
const predRows = renderPredRows(preds);
if (!Array.isArray(legRows) || !Array.isArray(predRows)) {
  throw new Error('renderRows no longer returns an array; the join below would be wrong');
}
say('\n--- LEGS ---');
say(legRows.join('\n'));
say('\n--- PREDICTIONS ---');
say(predRows.join('\n'));
const v = renderVerdict({ legs, preds });
say('');
say(v.line ?? v);

// Exit code computed ONCE from the same object the token is printed from, so a RED can
// never exit 0 the way this track's cells did before 10-28.
const red = legs.filter((l) => l.ok === false).length;
const refused = legs.filter((l) => l.ok === null).length;
const code = (red > 0 || refused > 0) ? 1 : 0;
process.exit(code);
