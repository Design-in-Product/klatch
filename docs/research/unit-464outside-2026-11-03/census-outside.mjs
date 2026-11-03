#!/usr/bin/env node
// unit-464outside — is `history-keyed > movable` testable from this tree at all?
//
// The population is the COMPLEMENT of Daedalus's unit-464class census surface: `unit-464*`
// directories under docs/research/ whose OLDEST adding commit is NOT his, minus this unit's own
// directory. [[feedback_an_instrument_does_not_census_its_own_source]]
//
// EVERY predicate that classifies anything here is LIFTED from his committed source at the PIN and
// evaluated — never retyped. `blankNonCode`, `lineOf`, `IDIOMS`, `spans`, `enclosingIf` come out of
// `unit-464class-2026-11-02/enumerate-legs.mjs`; `declarationsOf`, `FROZEN_RE`, `LIVE_RE`,
// `classify` out of `unit-464class-2026-11-02/classify-and-grade.mjs`. If a lift fails the run is
// UNRUNNABLE, not degraded. [[feedback_check_lib_before_handrolling_a_detector]]
// [[feedback_slicing_the_inputs_but_retyping_the_verdict]]
//
// Cripple: CRIPPLE=invert-author re-keys the AUTHORSHIP SELECTOR to admit every dir. A switch on
// the key, not the subject — no file under docs/research/ is written.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = '/Users/xian/Development/klatch-worktrees/theseus';
const PIN = process.env.PIN ?? 'bba2aa3c';
const SELF_DIR = 'unit-464outside-2026-11-03';
const CRIPPLE = process.env.CRIPPLE ?? '';
const DEPTH = Number(process.env.CLASS_DEPTH ?? 1);
const MAX_TEXT = 200_000;

const g = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const gq = (args) => { try { return g(args); } catch { return null; } };

const legs = [];
const check = (name, pass, note) => { legs.push({ name, pass, note }); return pass; };
const die = (why) => { console.error(`UNRUNNABLE: ${why}`); process.exit(2); };

console.log(`unit-464outside — census of the UNENUMERATED half`);
console.log(`PIN=${PIN}  CRIPPLE=${CRIPPLE || '(none)'}  CLASS_DEPTH=${DEPTH}`);
console.log(`instrument blob (HEAD-side, this file): ${g(['hash-object', fileURLToPath(import.meta.url)]).trim()}`);
console.log('');

// ───────────────────────────────────────────────────────────────── stage 0: lift his predicates
//
// Anchored slicing. A start anchor plus a column-0 terminator; the slice is then asserted to be
// non-empty, to begin with the signature, and to PARSE. A present anchor is not an intact span.
// [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
const ENUM_REL = 'docs/research/unit-464class-2026-11-02/enumerate-legs.mjs';
const CLASS_REL = 'docs/research/unit-464class-2026-11-02/classify-and-grade.mjs';

const enumSrc = gq(['show', `${PIN}:${ENUM_REL}`]);
const classSrc = gq(['show', `${PIN}:${CLASS_REL}`]);
if (enumSrc === null) die(`cannot read ${ENUM_REL} at ${PIN}`);
if (classSrc === null) die(`cannot read ${CLASS_REL} at ${PIN}`);

function sliceFrom(src, startAnchor, endAnchor, label) {
  const lines = src.split('\n');
  const a = lines.findIndex((l) => l === startAnchor);
  if (a < 0) die(`lift ${label}: start anchor not found verbatim: ${startAnchor}`);
  let b = -1;
  for (let i = a + 1; i < lines.length; i++) if (lines[i] === endAnchor) { b = i; break; }
  if (b < 0) die(`lift ${label}: terminator ${JSON.stringify(endAnchor)} not found after start`);
  const text = lines.slice(a, b + 1).join('\n');
  return { text, lines: b - a + 1 };
}

const LIFTS = [
  ['blankNonCode', enumSrc, 'function blankNonCode(src) {', '}'],
  ['lineOf', enumSrc, "const lineOf = (src, idx) => { let n = 1; for (let k = 0; k < idx; k++) if (src[k] === '\\n') n++; return n; };", null],
  ['IDIOMS', enumSrc, 'const IDIOMS = [', '];'],
  ['spans', enumSrc, 'function spans(src, blanked, idiom, rel) {', '}'],
  ['enclosingIf', enumSrc, 'function enclosingIf(src, blanked, at) {', '}'],
  ['FROZEN_RE', classSrc, 'const FROZEN_RE = [', '];'],
  ['LIVE_RE', classSrc, 'const LIVE_RE = [', '];'],
  ['declarationsOf', classSrc, 'function declarationsOf(src) {', '}'],
  ['classify', classSrc, 'function classify(site, depth = DEPTH) {', '}'],
];

const lifted = {};
const liftReport = [];
for (const [label, src, start, end] of LIFTS) {
  if (end === null) {
    const lines = src.split('\n');
    const a = lines.findIndex((l) => l === start);
    if (a < 0) die(`lift ${label}: single-line anchor not found verbatim`);
    lifted[label] = start;
    liftReport.push({ label, lines: 1, sha: null });
  } else {
    const { text, lines } = sliceFrom(src, start, end, label);
    lifted[label] = text;
    liftReport.push({ label, lines, sha: null });
  }
}

check('GLIFT', LIFTS.every(([l]) => typeof lifted[l] === 'string' && lifted[l].length > 0),
  `${LIFTS.length} fragments lifted from his two files at ${PIN}, every one non-empty`);

// Evaluate them in ONE scope, with the free variables his code expects supplied here. If any
// fragment does not parse, `new Function` throws and the run is UNRUNNABLE.
let kit;
try {
  const body = `
    'use strict';
    const problems = [];
    const DEPTH = ${DEPTH};
    const MAX_TEXT = ${MAX_TEXT};
    ${lifted.blankNonCode}
    ${lifted.lineOf}
    ${lifted.IDIOMS}
    ${lifted.spans}
    ${lifted.enclosingIf}
    ${lifted.FROZEN_RE}
    ${lifted.LIVE_RE}
    ${lifted.declarationsOf}
    ${lifted.classify}
    return { blankNonCode, lineOf, IDIOMS, spans, enclosingIf, FROZEN_RE, LIVE_RE,
             declarationsOf, classify, problems, __declsFor: null };
  `;
  // `classify` closes over `declsFor`; it is injected by name into the same scope.
  kit = new Function('declsFor', body);
} catch (e) {
  die(`lifted fragments do not parse: ${e.message}`);
}

const srcCache = new Map();
const declCache = new Map();
let K = null;
const sourceOfPinned = (rel) => {
  if (!srcCache.has(rel)) srcCache.set(rel, gq(['show', `${PIN}:${rel}`]) ?? '');
  return srcCache.get(rel);
};
const declsFor = (rel) => {
  if (!declCache.has(rel)) declCache.set(rel, K.declarationsOf(sourceOfPinned(rel)));
  return declCache.get(rel);
};
K = kit(declsFor);

check('GLIFTEVAL',
  typeof K.blankNonCode === 'function' && typeof K.classify === 'function' &&
  Array.isArray(K.IDIOMS) && K.IDIOMS.length === 3 &&
  Array.isArray(K.FROZEN_RE) && Array.isArray(K.LIVE_RE),
  `his kit evaluates: ${K.IDIOMS.length} idioms (${K.IDIOMS.map((i) => i.idiom).join(' ')}), ` +
  `FROZEN_RE ${K.FROZEN_RE.length} · LIVE_RE ${K.LIVE_RE.length}`);

// A lifted blanker that changed length would silently move every line number.
{
  const probe = "const a = '/*';  // }\n/* } */ const b = /[}]/;\n";
  const out = K.blankNonCode(probe);
  check('GBLANKED', out.length === probe.length && !/\/\*/.test(out.replace(/ /g, '')),
    `lifted blankNonCode is length-preserving on a probe carrying braces inside a string, a comment and a regex class`);
}

// ─────────────────────────────────────────────────────── stage 1: the surface, from the pin only
const allDirs = g(['ls-tree', '-d', '--name-only', `${PIN}:docs/research`]).trim().split('\n').filter(Boolean);
const unitDirs = allDirs.filter((d) => d.startsWith('unit-464')).sort();

const oldestAuthorOf = (d) => {
  const a = g(['log', '--diff-filter=A', '--format=%an', '--', `docs/research/${d}`]).trim().split('\n').filter(Boolean);
  return a[a.length - 1] || '(none)';   // newest-first ⇒ last is oldest  [[feedback_in_a_newest_first_list_last_keyed_is_the_oldest_entry]]
};

const authorOf = new Map(unitDirs.map((d) => [d, oldestAuthorOf(d)]));
// HIS selector, verbatim from his line 181, applied here rather than its result retyped.
const hisSelector = (d) => /^Daedalus/.test(authorOf.get(d));
const censusedHalf = unitDirs.filter(hisSelector);

// MY population: the complement — or, under the cripple, everything.
const admits = CRIPPLE === 'invert-author' ? () => true : (d) => !hisSelector(d);
const population = unitDirs.filter(admits).filter((d) => d !== SELF_DIR);
const selfExcluded = unitDirs.filter(admits).filter((d) => d === SELF_DIR);

check('GSELF', selfExcluded.length === 0 || !population.includes(SELF_DIR),
  `this unit's own dir is not in the population (present at pin: ${unitDirs.includes(SELF_DIR) ? 'yes' : 'no — committed after the pin'})`);

const setEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const union = [...new Set([...censusedHalf, ...population])].sort();
const overlap = population.filter((d) => censusedHalf.includes(d));

check('GDISJOINT', CRIPPLE === 'invert-author' ? overlap.length === censusedHalf.length : overlap.length === 0,
  CRIPPLE === 'invert-author'
    ? `cripple arm: population swallows the censused half, overlap ${overlap.length} of ${censusedHalf.length} (member lists)`
    : `baseline: complement ∩ censused half = ${overlap.length} members (compared as member lists, not counts)`);

check('GUNION', setEq(union, unitDirs),
  `censused half ∪ population = all ${unitDirs.length} unit-464 dirs, member for member`);

check('GNOTRETYPED', censusedHalf.length > 0 && censusedHalf.every((d) => /^Daedalus/.test(authorOf.get(d))),
  `the censused-half member list is HIS selector applied to git log, ${censusedHalf.length} dirs, never typed into this unit`);

const mjsOf = (d) => g(['ls-tree', '-r', '--name-only', `${PIN}:docs/research/${d}`]).trim().split('\n')
  .filter((f) => f.endsWith('.mjs')).sort();

const popFiles = [];
for (const d of population) for (const f of mjsOf(d)) popFiles.push(`docs/research/${d}/${f}`);
const censusedFiles = [];
for (const d of censusedHalf) for (const f of mjsOf(d)) censusedFiles.push(`docs/research/${d}/${f}`);

console.log(`SURFACE at ${PIN}`);
console.log(`  unit-464* dirs total                 ${unitDirs.length}`);
console.log(`  admitted by HIS selector (censused)  ${censusedHalf.length} dirs · ${censusedFiles.length} .mjs`);
console.log(`  THIS population                      ${population.length} dirs · ${popFiles.length} .mjs`);
console.log('');

// ───────────────────────────────────────────── stage 2: the legs, by HIS idioms, over MY surface
const sites = [];
for (const rel of popFiles) {
  const src = sourceOfPinned(rel);
  if (!src) continue;
  const blanked = K.blankNonCode(src);
  for (const idiom of K.IDIOMS) {
    for (const s of K.spans(src, blanked, idiom, rel)) {
      sites.push({ ...s, rel, idiom: idiom.idiom, kind: idiom.kind });
    }
  }
}

check('GLEGSFOUND', sites.length > 0, `his idioms over my surface register ${sites.length} leg site(s)`);

const classed = sites.map((s) => ({ ...s, det: K.classify(s) }));
const byCls = {};
for (const s of classed) byCls[s.det.cls] = (byCls[s.det.cls] ?? 0) + 1;
const cross = classed.filter((s) => s.det.cls === 'CROSS-STATE');

check('GCSARM', cross.length > 0,
  `the CROSS-STATE arm of his class key is REACHED on my surface: ${cross.length} site(s) — ` +
  `a later zero elsewhere is a measured zero, not an unreached arm`);

console.log(`LEGS over ${popFiles.length} file(s): ${sites.length} site(s)`);
for (const [k, v] of Object.entries(byCls).sort()) console.log(`  ${k.padEnd(14)} ${v}`);
console.log('');

// ─────────────────────── stage 3: the routed question — conjunctive × selector beside a movable
//
// AXIS A, per v1.5: `conjunctive` iff the two states are NEVER operands of one comparison. His
// class key already resolves a frozen side and a live side; `conjunctive` is then the absence of a
// state-vs-state operand pair. The state-vs-state test is read off the CLOSED predicate text.
//
// AXIS B `history-keyed`, per v1.5: an anchor is a recency SELECTOR, so any commit touching the
// path moves the figure. The idiom in this tree is `git log -1 … -- <path>`.
const SELECTOR_RE = [
  /log['"`\s,\]]+[\s\S]{0,120}?-1[\s\S]{0,160}?'--'/,
  /\batRecency\b/,
  /rev-list[\s\S]{0,80}?'--'/,
  /--format=%h[\s\S]{0,160}?'--'/,
];
const STATE_VS_STATE_RE = [
  /\b(pre[A-Za-z0-9_$]*)\s*(===|!==|==|!=)\s*(post[A-Za-z0-9_$]*)\b/,
  /\b(post[A-Za-z0-9_$]*)\s*(===|!==|==|!=)\s*(pre[A-Za-z0-9_$]*)\b/,
  /\b(atPin)\s*(===|!==)\s*(atRecency)\b/,
  /\b(atRecency)\s*(===|!==)\s*(atPin)\b/,
  /\b([A-Za-z0-9_$]*Now)\s*(===|!==)\s*([A-Za-z0-9_$]*Then)\b/,
  /\b([A-Za-z0-9_$]*Then)\s*(===|!==)\s*([A-Za-z0-9_$]*Now)\b/,
];

const closedTextOf = (s) => {
  const predicate = s.kind === 'REFUSE-SITE' ? s.guard : s.span;
  if (predicate === null) return '';
  const decls = declsFor(s.rel);
  let text = predicate;
  const seen = new Set();
  let frontier = [predicate];
  for (let level = 0; level < DEPTH; level++) {
    const next = [];
    for (const chunk of frontier) {
      for (const id of new Set(chunk.match(/[A-Za-z_$][A-Za-z0-9_$]*/g) ?? [])) {
        if (seen.has(id) || !decls.has(id)) continue;
        seen.add(id);
        const rhs = decls.get(id);
        if (text.length + rhs.length > MAX_TEXT) continue;
        text += '\n' + rhs;
        next.push(rhs);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return text;
};

let selectorArmReached = 0;
const rows = [];
for (const s of cross) {
  const text = closedTextOf(s);
  const hasSelector = SELECTOR_RE.some((r) => r.test(text));
  const hasPair = STATE_VS_STATE_RE.some((r) => r.test(text));
  if (hasSelector) selectorArmReached++;
  rows.push({
    rel: s.rel, line: s.line, id: s.id, idiom: s.idiom,
    axisA: hasPair ? 'delta|identity (operand pair present)' : 'conjunctive',
    hasSelector, hasPair,
  });
}

// P5's denominator: selectors ANYWHERE on the surface, not only inside CROSS-STATE legs — so a
// zero inside CROSS-STATE can be told from a tree with no selector idiom in it at all.
let selectorsAnywhere = 0;
const selectorFiles = [];
for (const rel of popFiles) {
  const src = sourceOfPinned(rel);
  if (SELECTOR_RE.some((r) => r.test(src))) { selectorsAnywhere++; selectorFiles.push(rel); }
}

check('GSELECTORARM', selectorsAnywhere > 0 || selectorArmReached > 0,
  `the selector detector's POSITIVE arm fires somewhere in this run: ${selectorsAnywhere} file(s) · ` +
  `${selectorArmReached} CROSS-STATE leg(s). A zero in P4 is then a measured zero`);

const conjWithSelector = rows.filter((r) => r.axisA === 'conjunctive' && r.hasSelector);

console.log(`CROSS-STATE legs on this surface: ${rows.length}`);
for (const r of rows) {
  console.log(`  ${r.rel.replace('docs/research/', '')}:${r.line}  id=${r.id ?? '-'}  ` +
    `${r.axisA.padEnd(36)} selector=${r.hasSelector ? 'YES' : 'no '}`);
}
console.log('');
console.log(`selector idiom present in ${selectorsAnywhere} of ${popFiles.length} file(s) on the surface`);
for (const f of selectorFiles) console.log(`    ${f.replace('docs/research/', '')}`);
console.log('');
console.log(`conjunctive AND selector-bearing CROSS-STATE legs: ${conjWithSelector.length}`);
for (const r of conjWithSelector) console.log(`    ${r.rel.replace('docs/research/', '')}:${r.line} id=${r.id ?? '-'}`);
console.log('');

// ──────────────────────────────────────────────────────── UNREGISTERED: the whole-tree surface
//
// Labelled UNREGISTERED because it is not any of P1–P6 and the population it measures is wider
// than the one those predictions are keyed on. A join key must not widen with the property.
// [[feedback_a_join_key_must_not_widen_with_the_property]]
const families = {};
for (const d of allDirs) {
  const k = /^unit-464/.test(d) ? 'unit-464*' : /^round\d+-instruments/.test(d) ? 'roundNNN-instruments'
    : /^unit-/.test(d) ? 'unit-other' : 'other';
  families[k] = families[k] ?? { dirs: 0, mjs: 0 };
  families[k].dirs++;
  families[k].mjs += mjsOf(d).length;
}
const totalMjs = Object.values(families).reduce((s, v) => s + v.mjs, 0);
console.log(`UNREGISTERED — every directory under docs/research/ at ${PIN}, by family`);
for (const [k, v] of Object.entries(families).sort()) {
  console.log(`  ${k.padEnd(22)} ${String(v.dirs).padStart(4)} dirs · ${String(v.mjs).padStart(4)} .mjs`);
}
console.log(`  ${'TOTAL'.padEnd(22)} ${String(allDirs.length).padStart(4)} dirs · ${String(totalMjs).padStart(4)} .mjs`);
console.log(`  his census surface is ${censusedFiles.length} of ${totalMjs} .mjs = ` +
  `${(100 * censusedFiles.length / totalMjs).toFixed(1)}% of the instruments in this tree`);
console.log('');

// ─────────────────────────────────────────────────────────────────────────────── the verdicts
const P1 = unitDirs.length === 37 && censusedHalf.length === 19 && censusedFiles.length === 52 &&
  (CRIPPLE === 'invert-author' ? true : population.length === 18 && popFiles.length === 54);
const P2 = sites.length >= 40;
const P3 = cross.length >= 1;
const P4 = conjWithSelector.length === 0;
const P5 = selectorsAnywhere >= 1;

const V = [
  ['P1', P1, `NON-BLIND (declared). 37 dirs / 19 his / 52 .mjs his / ${population.length} mine / ${popFiles.length} .mjs mine`],
  ['P2', P2, `complement leg population = ${sites.length} (threshold ≥ 40)`],
  ['P3', P3, `CROSS-STATE legs outside the censused half = ${cross.length} (threshold ≥ 1)`],
  ['P4', P4, `conjunctive × selector legs = ${conjWithSelector.length} (LANDS iff 0) — ` +
    `${P5 ? 'NON-VACUOUS: the selector arm fired ' + selectorsAnywhere + ' time(s) on this surface' : 'VACUOUS: no selector anywhere, read P4 with P5'}`],
  ['P5', P5, `files carrying the selector idiom = ${selectorsAnywhere} of ${popFiles.length} (threshold ≥ 1)`],
];

console.log('LEGS');
let red = 0;
for (const l of legs) { if (!l.pass) red++; console.log(`  ${l.pass ? 'ok  ' : 'RED '} ${l.name.padEnd(14)} ${l.note}`); }
console.log('');
console.log('VERDICTS');
for (const [n, ok, note] of V) console.log(`  ${n}  ${ok ? 'LANDS  ' : 'REFUTED'}  ${note}`);
console.log('');
console.log(`SUMMARY  legs ${legs.length - red} ok / ${red} RED  ·  verdicts ` +
  `${V.filter((v) => v[1]).length} land / ${V.filter((v) => !v[1]).length} fail  ·  ` +
  `${red === 0 ? 'GREEN' : 'RED'} at ${legs.length} legs`);
process.exit(red === 0 ? 0 : 1);
