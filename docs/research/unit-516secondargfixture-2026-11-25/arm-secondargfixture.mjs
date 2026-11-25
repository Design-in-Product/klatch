#!/usr/bin/env node
/**
 * unit-516secondargfixture — arm.
 *
 * Closes the two items `unit-514` §7.6 left open as unblocked/mine/no-blocker, and which Daedalus's
 * 2026-11-25 START memo §7 hands back explicitly:
 *
 *   1. integrate `SECOND-ARG` into the CLASSIFIER (yesterday it lived in a reader over the capture's
 *      150-char-truncated slices, and so its +2 was a floor of a floor);
 *   2. a `FIXTURE` class / unit-level exclusion for §7.5 — 5 of 18 published sites are fixture bodies
 *      belonging to instruments in this very thread.
 *
 * Registered in PRE-REGISTRATION.md, commit `da9ac6b9`, on `main` at 10:51:35 PST, before this file
 * existed.
 *
 * THERE IS NO COPY OF THE CLASSIFIER IN THIS FILE. Daedalus's `unit-515` §1 took the rung above
 * asserting a copy byte-identical — there is no copy — and it is the right rung, so it is taken here
 * against my own instrument: the classifier span is SLICED out of
 * unit-514's posthoc-rekey-prefix-and-binding.mjs at run time and COMPILED, and this arm calls the
 * compiled `shapeOf`. The inherited key is the real one.
 *
 * NO COMPARISON AGAINST A BRACE CHARACTER ANYWHERE IN THIS FILE, deliberately. `unit-515` §5(iv):
 * the assertion that you used the shared body reader correctly is what puts your file into the
 * population of files suspected of not using it. Span intactness is asserted by size, by marker
 * presence and by startsWith/endsWith only.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/* Every path below is repo-root-relative and `git ls-files` reports relative to the cwd, so the
 * population and every slice depend on where this was launched from. Resolved rather than assumed:
 * the first drive of this arm was from the unit directory and died on the first slice, which is the
 * loud failure. A quieter one — a shorter `git ls-files` and a smaller population — is what the
 * chdir removes. Printed in §0. */
process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const LABEL = 'tracked files read';
const SELF = 'docs/research/unit-516secondargfixture-2026-11-25/arm-secondargfixture.mjs';
const PRIOR = 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs';
const PRIOR_ARM = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';
const PRIOR_CAPTURE = 'docs/research/unit-514equalityconsumer-2026-11-24/captures/POSTHOC-REKEY.out';
const PRIOR_COMMIT = '616f5705';          // the commit that published the 18
const PUBLISHED_OWNLINE = 18;             // unit-514 §7.2, PREFIX, own line, at that HEAD
const PUBLISHED_SECOND_ARG_FLOOR = 2;     // unit-514 §7.3, from the bucket-text reader
const UNIT_DIR_RE = /^docs\/research\/unit-[^/]+\//;

/* The five sites named BY EYE in unit-514 §7.5. P7 grades the NESTED-LITERAL axis against this
 * list, which is a hand reading and is therefore the thing at risk, not the authority. */
const EYE_FIXTURE_SITES = [
  'docs/research/unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs:127',
  'docs/research/unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs:157',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:72',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:77',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:78',
];

/* The two sites P3 names. Site identity, not a count — a count of 2 is satisfied by the wrong 2. */
const P3_SITES = [
  'docs/research/unit-510quotepathskip-2026-11-23/arm-quotepathskip.mjs:160',
  'docs/research/unit-510quotepathskip-2026-11-23/confirm-landed.mjs:102',
];

const out = {};
const say = (...a) => console.log(...a);

/* ================================================================ §0 PROVENANCE */

say('=== §0 PROVENANCE — the inherited classifier is sliced and compiled, not copied ===\n');
say(`  cwd, resolved to the repo root rather than inherited: ${process.cwd()}\n`);

const priorSrc = readFileSync(PRIOR, 'utf8');
const priorArmSrc = readFileSync(PRIOR_ARM, 'utf8');

const SPAN_START = '/* ------------------------------------------------------------------ key 1: REGION */';
const SPAN_END = '/* ------------------------------------------------------------------ §0 provenance */';
const sa = priorSrc.indexOf(SPAN_START);
const sb = priorSrc.indexOf(SPAN_END);
const spanFound = sa !== -1 && sb !== -1 && sb > sa;
const span = spanFound ? priorSrc.slice(sa, sb) : '';

/* A present anchor is not an intact span: size, both ends, every declaration the arm will call, and
 * every one of the six inherited class literals. */
const SPAN_MARKERS = [
  'function regions(src) {', 'function occurrencesWithRegion', 'const lineOf', 'const lineText',
  'function statementSlice', 'const QUOTED', 'function makeTests', 'const TESTS',
  'const CONSUMER_SHAPES', 'function shapeOf',
  "'BINDING'", "'OBJKEY'", "'EQUALITY'", "'INCLUDES'", "'ARRMEMBER'", "'STRINGARG'",
  'LINE_COMMENT', 'BLOCK_COMMENT', "state = 'REGEX'",
];
const missingMarkers = SPAN_MARKERS.filter((m) => !span.includes(m));
const spanIntact = spanFound && span.length > 4000 && missingMarkers.length === 0
  && span.startsWith(SPAN_START) && span.trimEnd().endsWith('}');

say(`  span anchors found: ${spanFound}   bytes: ${span.length}`);
say(`  markers absent from the span: ${missingMarkers.length ? missingMarkers.join(', ') : 'none (all ' + SPAN_MARKERS.length + ' present)'}`);
say(`  span intact (size > 4000 B, starts at its own anchor, ends on a closed declaration): ${spanIntact}`);

let M = null;
let compileError = null;
if (spanIntact) {
  try {
    // eslint-disable-next-line no-new-func
    M = new Function('LABEL', `${span}\nreturn { regions, occurrencesWithRegion, lineOf, lineText, statementSlice, QUOTED, makeTests, TESTS, CONSUMER_SHAPES, shapeOf };`)(LABEL);
  } catch (e) { compileError = String(e && e.message ? e.message : e); }
}
const compiled = !!M && typeof M.shapeOf === 'function' && typeof M.occurrencesWithRegion === 'function';
say(`  span compiles and exports a callable shapeOf: ${compiled}${compileError ? `  (error: ${compileError})` : ''}`);
if (compiled) {
  say(`  inherited CONSUMER_SHAPES, read off the compiled span: [${M.CONSUMER_SHAPES.join(', ')}]`);
  say(`  inherited matcher variants: [${Object.keys(M.QUOTED).join(', ')}]   PREFIX = ${M.QUOTED.PREFIX}`);
}

/* The population rule, extracted with the PRIOR's own extractor rather than retyped. Both the
 * filter and the extraction of the filter come out of published source. */
const extractorMatch = priorSrc.match(/const extMatch = armSrc\.match\((\/.+?\/)\);/);
let extRe = null;
let armFilterLiteral = null;
if (extractorMatch) {
  const extractorRe = new RegExp(extractorMatch[1].slice(1, extractorMatch[1].lastIndexOf('/')));
  const m = priorArmSrc.match(extractorRe);
  if (m) { armFilterLiteral = m[1]; extRe = new RegExp(m[1].slice(1, m[1].lastIndexOf('/'))); }
}
say(`\n  the PRIOR's own extractor, sliced from its source: ${extractorMatch ? extractorMatch[1] : '(NOT FOUND)'}`);
say(`  the ARM's population filter, extracted with it:     ${armFilterLiteral ?? '(NOT FOUND)'}`);
const extKp = extRe
  ? [['a.mjs', true], ['b.js', true], ['c.md', false], ['d.ts', false]].map(([p, want]) => ({ p, want, got: extRe.test(p), ok: extRe.test(p) === want }))
  : [];
say(`  extracted filter KP: ${extKp.map((k) => `${k.p}=${k.got}${k.ok ? '' : ' MISMATCH'}`).join('  ') || '(not run)'}`);
const extKpOk = extKp.length === 4 && extKp.every((k) => k.ok);

/* This unit touches no product code and says so about its own run. */
const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`\n  git diff --stat HEAD -- packages/ scripts/ : ${productDiff === '' ? 'EMPTY' : `NON-EMPTY\n${productDiff}`}`);

out.provenance = {
  spanFound, spanBytes: span.length, missingMarkers, spanIntact, compiled, compileError,
  inheritedConsumerShapes: compiled ? M.CONSUMER_SHAPES : null,
  extractorLiteral: extractorMatch ? extractorMatch[1] : null, armFilterLiteral, extKp, extKpOk,
  productDiffEmpty: productDiff === '',
};

/* ================================================================ the two new keys */

const SECOND_ARG_RE = compiled
  ? new RegExp(`[\\w$.]+\\s*\\(\\s*[^)]*,\\s*${M.QUOTED.PREFIX}`)
  : null;

/**
 * Integration BY CONSTRUCTION: `SECOND-ARG` is consulted only where the inherited classifier
 * returns UNCLEAR, so it cannot double-count what the inherited key already resolves. That is a
 * property of this ordering, not of the regex; the regex's own refusals are graded separately (P5).
 */
function integratedShape(src, offset) {
  const base = M.shapeOf(src, offset, 'PREFIX');
  if (base.cls !== 'UNCLEAR') return { ...base, viaSecondArg: false, baseCls: base.cls };
  const own = M.lineText(src, offset);
  if (SECOND_ARG_RE.test(own)) {
    return {
      cls: 'SECOND-ARG', why: 'the label is a string argument in a position other than the first',
      matches: [...base.matches, 'SECOND-ARG'], deciding: own.trim(), from: 'own line',
      viaSecondArg: true, baseCls: base.cls,
    };
  }
  return { ...base, viaSecondArg: false, baseCls: base.cls };
}

/**
 * NESTED-LITERAL: an AXIS, cross-tabbed, never folded into the verdict — a sub-split cannot
 * partition a class keyed on something else. True when any quote character sits between the
 * region's own opening delimiter and the label, i.e. the label's literal is nested inside an outer
 * quoted run. Over-reports by construction (P10), which is why every row is printed.
 */
function nestedAxis(src, offset) {
  const r = M.regions(src).find((g) => offset >= g.start && offset < g.end);
  if (!r || r.kind !== 'STRING') return { nested: null, outerQuote: null, innerQuote: null };
  const inner = src.slice(r.start + 1, offset);
  const idx = Math.max(inner.lastIndexOf("'"), inner.lastIndexOf('"'), inner.lastIndexOf('`'));
  return { nested: idx !== -1, outerQuote: src[r.start], innerQuote: idx === -1 ? null : inner[idx] };
}

/* ================================================================ §1 KNOWN POSITIVES */

say('\n=== §1 KNOWN POSITIVES — sliced from real files where the form exists, planted only where it must be ===\n');

/** Slice a real line out of a tracked file: a hand-typed KP is not a slice. */
function sliceLine(path, line) {
  const src = readFileSync(path, 'utf8');
  const text = src.split('\n')[line - 1];
  return { text, path, line, hasLabel: typeof text === 'string' && text.includes(LABEL) };
}

const kpCells = [];
if (compiled) {
  const slices = [
    ['KP1-second-arg-real-a', sliceLine('docs/research/unit-510quotepathskip-2026-11-23/arm-quotepathskip.mjs', 160), { base: 'UNCLEAR', integrated: 'SECOND-ARG', nested: false }],
    ['KP2-second-arg-real-b', sliceLine('docs/research/unit-510quotepathskip-2026-11-23/confirm-landed.mjs', 102), { base: 'UNCLEAR', integrated: 'SECOND-ARG', nested: false }],
    ['KP3-first-arg-real', sliceLine('docs/research/unit-511readcountname-2026-11-24/confirm-landed.mjs', 114), { base: 'STRINGARG', integrated: 'STRINGARG', nested: false }],
    ['KP4-emission-real', sliceLine('docs/research/unit-510quotepathskip-2026-11-23/arm-quotepathskip.mjs', 204), { base: 'UNCLEAR', integrated: 'UNCLEAR', nested: true }],
    ['KP5-fixture-real', sliceLine('docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs', 72), { base: 'EQUALITY', integrated: 'EQUALITY', nested: true }],
    ['KP6-binding-real', sliceLine('docs/research/unit-511readcountname-2026-11-24/confirm-landed.mjs', 48), { base: 'ARRMEMBER', integrated: 'ARRMEMBER', nested: false }],
  ];

  const plants = [
    ['KP7-third-arg-planted', `const v = num(out, mode, '${LABEL}:');`, { base: 'UNCLEAR', integrated: 'SECOND-ARG', nested: false }],
    ['KP8-nested-call-arg1-planted', `const v = num(f(a), '${LABEL}:');`, { base: 'UNCLEAR', integrated: 'UNCLEAR', nested: false }],   // P6: DECLARED BLINDNESS
    ['KP9-apostrophe-planted', `const s = \`don't read ${LABEL}: 5\`;`, { base: 'UNCLEAR', integrated: 'UNCLEAR', nested: true }],      // P10: DECLARED FALSE POSITIVE
  ];

  const run = (name, text, want, origin) => {
    const occ = M.occurrencesWithRegion(text, LABEL);
    const one = occ.length === 1;
    const region = occ.map((o) => o.kind).join('+') || 'NONE';
    let base = null; let integrated = null; let nested = null;
    if (one) {
      base = M.shapeOf(text, occ[0].offset, 'PREFIX').cls;
      integrated = integratedShape(text, occ[0].offset).cls;
      nested = nestedAxis(text, occ[0].offset).nested;
    }
    const ok = one && base === want.base && integrated === want.integrated && nested === want.nested;
    kpCells.push({ name, origin, text: text.trim().slice(0, 120), occurrences: occ.length, region, base, integrated, nested, want, ok });
    say(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(30)} base ${String(base).padEnd(10)} integrated ${String(integrated).padEnd(11)} nested ${String(nested).padEnd(5)} (want ${want.base}/${want.integrated}/${want.nested})  ${origin}`);
    if (!one) say(`        occurrences ${occ.length} region ${region} — cell is not a single-occurrence fixture`);
  };

  for (const [name, sl, want] of slices) {
    if (!sl.hasLabel) { kpCells.push({ name, ok: false, note: `slice ${sl.path}:${sl.line} does not contain the label` }); say(`  FAIL  ${name} — slice ${sl.path}:${sl.line} does not contain the label`); continue; }
    run(name, sl.text, want, `sliced ${sl.path}:${sl.line}`);
  }
  for (const [name, text, want] of plants) run(name, text, want, 'PLANTED');
}

/* P5 is a claim about the REGEX, graded on the regex and not on the ordering that protects it. */
const p5First = SECOND_ARG_RE ? SECOND_ARG_RE.test(`    read: num('${LABEL}'),`) : null;
const p5Emit = SECOND_ARG_RE ? SECOND_ARG_RE.test('console.log(`cells reporting "tracked files read: 1" with population 0`)') : null;
say(`\n  P5, graded on the regex itself: SECOND_ARG_RE on the first-argument form = ${p5First} (want false); on an emission line = ${p5Emit} (want false)`);

const kpAllPass = kpCells.filter((c) => c.ok).length;
const GATE = ['KP1-second-arg-real-a', 'KP2-second-arg-real-b', 'KP3-first-arg-real', 'KP4-emission-real'];
const gatePass = kpCells.filter((c) => GATE.includes(c.name) && c.ok).length;
say(`\n  KP cells ${kpAllPass} of ${kpCells.length}   GATED cells ${gatePass} of ${GATE.length}`);
out.kp = { cells: kpCells, pass: kpAllPass, total: kpCells.length, gatePass, gateOf: GATE.length, p5First, p5Emit };

const refused = !compiled || !spanIntact || !extKpOk || gatePass !== GATE.length || p5First !== false || p5Emit !== false;
if (refused) {
  say('\nKEY REFUSED — the pre-registration gates every corpus figure on the span compiling, the span');
  say('being intact, the extracted population rule passing its KP, the four gated cells, and P5\'s two');
  say('regex refusals. NO corpus figure is printed.');
  say(`\n${JSON.stringify({ refused: true, ...out }, null, 2)}`);
  process.exit(0);
}

/* ================================================================ §2 CORPUS */

const trackedAll = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const tracked = trackedAll.filter((p) => extRe.test(p));
const EXCLUDED = [PRIOR_ARM, PRIOR, SELF];
const corpus = tracked.filter((p) => !EXCLUDED.includes(p));

say('\n=== §2 CORPUS — the inherited population rule, minus the prior arm, the prior key, and this arm ===\n');
say(`  tracked files matching the extracted filter: ${tracked.length}`);
for (const p of EXCLUDED) say(`  excluded by path: ${p}   tracked at run time: ${tracked.includes(p)}`);
say(`  read: ${corpus.length}`);

const srcCache = new Map();
let unreadable = 0;
for (const rel of corpus) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { unreadable += 1; continue; }
  if (src.includes(LABEL)) srcCache.set(rel, src);
}
say(`  files containing the label at all: ${srcCache.size}   unreadable: ${unreadable}`);

const sites = [];
for (const [rel, src] of srcCache) {
  for (const o of M.occurrencesWithRegion(src, LABEL)) {
    const row = { file: rel, line: M.lineOf(src, o.offset), region: o.kind, ownLine: M.lineText(src, o.offset).trim() };
    if (o.kind === 'STRING') {
      const b = M.shapeOf(src, o.offset, 'PREFIX');
      const i = integratedShape(src, o.offset);
      const n = nestedAxis(src, o.offset);
      Object.assign(row, {
        baseShape: b.cls, baseFrom: b.from, baseMatches: b.matches,
        shape: i.cls, from: i.from, viaSecondArg: i.viaSecondArg,
        nested: n.nested, outerQuote: n.outerQuote, innerQuote: n.innerQuote,
        secondArgRegexOnOwnLine: SECOND_ARG_RE.test(M.lineText(src, o.offset)),
        inUnitDir: UNIT_DIR_RE.test(rel),
        deciding: b.deciding,
      });
    } else {
      Object.assign(row, { baseShape: null, shape: null, nested: null, inUnitDir: UNIT_DIR_RE.test(rel), secondArgRegexOnOwnLine: SECOND_ARG_RE.test(row.ownLine) });
    }
    sites.push(row);
  }
}
const key = (r) => `${r.file}:${r.line}`;
const stringSites = sites.filter((r) => r.region === 'STRING');
const INTEGRATED_CONSUMER_SHAPES = [...M.CONSUMER_SHAPES, 'SECOND-ARG'];

const baseConsumers = stringSites.filter((r) => r.baseFrom === 'own line' && M.CONSUMER_SHAPES.includes(r.baseShape));
const intConsumers = stringSites.filter((r) => r.from === 'own line' && INTEGRATED_CONSUMER_SHAPES.includes(r.shape));
const secondArgRows = stringSites.filter((r) => r.shape === 'SECOND-ARG');

say(`\n  occurrences: ${sites.length}   STRING-region: ${stringSites.length}`);
say(`  inherited key, own-line consumers:  ${baseConsumers.length}   (consumer shapes: ${M.CONSUMER_SHAPES.join(',')})`);
say(`  integrated key, own-line consumers: ${intConsumers.length}   (+ SECOND-ARG)`);
say(`  SECOND-ARG rows: ${secondArgRows.length}`);

out.corpus = {
  trackedMatchingFilter: tracked.length, excluded: EXCLUDED, read: corpus.length,
  filesWithLabel: srcCache.size, unreadable, occurrences: sites.length, stringSites: stringSites.length,
  baseOwnLineConsumers: baseConsumers.length, integratedOwnLineConsumers: intConsumers.length,
  secondArg: secondArgRows.length,
};

/* ================================================================ §3 P1 — per-row reproduction */

say('\n=== §3 P1 — PER-ROW reproduction of the 18 published rows, not a total ===\n');

const capText = readFileSync(PRIOR_CAPTURE, 'utf8');
const capLines = capText.split('\n');
let jsonStart = -1;
for (let i = capLines.length - 1; i >= 0; i -= 1) if (capLines[i] === '{') { jsonStart = i; break; }
let published = null; let parseNote = null;
try { published = JSON.parse(capLines.slice(jsonStart).join('\n')); }
catch (e) { parseNote = String(e && e.message ? e.message : e); }

const declaredFigure = published?.figures?.PREFIX?.consumersOwnLine ?? null;
const publishedRows = published?.consumersPrefix ?? [];
const parseComplete = publishedRows.length === declaredFigure && declaredFigure === PUBLISHED_OWNLINE;
say(`  capture parsed: ${!!published}${parseNote ? ` (${parseNote})` : ''}`);
say(`  rows parsed out of it: ${publishedRows.length}   the capture's OWN declared figure: ${declaredFigure}   pre-registered: ${PUBLISHED_OWNLINE}`);
say(`  parse completeness (rows == capture's own figure == the pre-registered figure): ${parseComplete}`);

const todayByKey = new Map(stringSites.map((r) => [key(r), r]));
const repro = publishedRows.map((p) => {
  const r = todayByKey.get(p.site);
  if (!r) return { site: p.site, status: 'ABSENT-AT-THIS-LINE', publishedShape: p.shape, todayShape: null, sameText: null };
  const sameText = r.deciding === p.deciding;
  return {
    site: p.site, status: r.baseShape === p.shape ? (sameText ? 'SAME' : 'SAME-CLASS-TEXT-MOVED') : 'CLASS-MOVED',
    publishedShape: p.shape, todayShape: r.baseShape, sameText,
  };
});
const sameRows = repro.filter((r) => r.status === 'SAME').length;
for (const r of repro) if (r.status !== 'SAME') say(`  ${r.status}  ${r.site}  published ${r.publishedShape} -> today ${r.todayShape}`);
say(`  identical per row (class AND deciding text): ${sameRows} of ${publishedRows.length}`);
out.reproduction = { parseComplete, declaredFigure, rows: repro, same: sameRows };

/* ================================================================ §4 SECOND-ARG, in full */

say('\n=== §4 SECOND-ARG — every row in full, and the ordering absorption question (P11) ===\n');
for (const r of secondArgRows) say(`  ${key(r)}  nested ${r.nested}\n      ${r.ownLine.slice(0, 160)}`);
const secondArgKeys = secondArgRows.map(key).sort();
const p3Exact = secondArgKeys.length === P3_SITES.length && P3_SITES.slice().sort().every((s, i) => s === secondArgKeys[i]);
say(`\n  sites P3 named: ${P3_SITES.join('  ')}`);
say(`  P3 exact-set match: ${p3Exact}`);

const regexMatchRows = stringSites.filter((r) => r.secondArgRegexOnOwnLine);
const absorbedByWindow = regexMatchRows.filter((r) => r.baseShape !== 'UNCLEAR' && r.baseFrom === '4-line window');
const absorbedByOwnLine = regexMatchRows.filter((r) => r.baseShape !== 'UNCLEAR' && r.baseFrom === 'own line');
say(`\n  rows whose OWN LINE matches the SECOND-ARG regex: ${regexMatchRows.length}`);
say(`    already resolved by the inherited key from the own line: ${absorbedByOwnLine.length}`);
say(`    already resolved by the inherited key from the 4-LINE WINDOW: ${absorbedByWindow.length}   <- P11 registered at 0`);
for (const r of absorbedByWindow) say(`      ${key(r)}  inherited ${r.baseShape} (window)  |  ${r.ownLine.slice(0, 140)}`);
for (const r of absorbedByOwnLine) say(`      [own line] ${key(r)}  inherited ${r.baseShape}  |  ${r.ownLine.slice(0, 140)}`);

/* P12: the per-row set difference, not the difference of two totals. */
const baseKeys = new Set(baseConsumers.map(key));
const addedByIntegration = intConsumers.filter((r) => !baseKeys.has(key(r)));
const lostByIntegration = baseConsumers.filter((r) => !new Set(intConsumers.map(key)).has(key(r)));
say(`\n  P12, per row: integration ADDS ${addedByIntegration.length}, REMOVES ${lostByIntegration.length}`);
for (const r of addedByIntegration) say(`    + ${key(r)}  ${r.shape}`);
for (const r of lostByIntegration) say(`    - ${key(r)}  was ${r.baseShape}`);
out.secondArg = {
  rows: secondArgRows.map((r) => ({ site: key(r), nested: r.nested, ownLine: r.ownLine })),
  p3Exact, regexMatchRows: regexMatchRows.length, absorbedByWindow: absorbedByWindow.length,
  absorbedByOwnLine: absorbedByOwnLine.length,
  added: addedByIntegration.map(key), removed: lostByIntegration.map(key),
};

/* ================================================================ §5 NESTED-LITERAL */

say('\n=== §5 NESTED-LITERAL — the axis, every row in full (P10: it over-reports by construction) ===\n');
const nestedRows = stringSites.filter((r) => r.nested === true);
for (const r of nestedRows) {
  const isConsumer = INTEGRATED_CONSUMER_SHAPES.includes(r.shape) && r.from === 'own line';
  say(`  ${key(r)}  shape ${String(r.shape).padEnd(10)} own-line-consumer ${String(isConsumer).padEnd(5)} outer ${r.outerQuote} inner ${r.innerQuote}\n      ${r.ownLine.slice(0, 150)}`);
}
const nestedConsumers = nestedRows.filter((r) => INTEGRATED_CONSUMER_SHAPES.includes(r.shape) && r.from === 'own line');
const nestedConsumerKeys = nestedConsumers.map(key).sort();
const eyeSorted = EYE_FIXTURE_SITES.slice().sort();
const p7Exact = nestedConsumerKeys.length === eyeSorted.length && eyeSorted.every((s, i) => s === nestedConsumerKeys[i]);
say(`\n  NESTED rows: ${nestedRows.length}   of which own-line consumers: ${nestedConsumers.length}`);
say(`  the five sites I named BY EYE in unit-514 §7.5: ${EYE_FIXTURE_SITES.length}`);
say(`  P7 exact-set match against the eye list: ${p7Exact}`);
if (!p7Exact) {
  const inKeyNotEye = nestedConsumerKeys.filter((s) => !eyeSorted.includes(s));
  const inEyeNotKey = eyeSorted.filter((s) => !nestedConsumerKeys.includes(s));
  say(`    keyed but not in the eye list (${inKeyNotEye.length}): ${inKeyNotEye.join('  ') || '(none)'}`);
  say(`    in the eye list but not keyed (${inEyeNotKey.length}): ${inEyeNotKey.join('  ') || '(none)'}`);
  out.p7Diff = { inKeyNotEye, inEyeNotKey };
}
out.nested = { rows: nestedRows.map((r) => ({ site: key(r), shape: r.shape, outerQuote: r.outerQuote, innerQuote: r.innerQuote, ownLine: r.ownLine })), consumers: nestedConsumerKeys, p7Exact };

/* ================================================================ §6 the population axis */

say('\n=== §6 UNIT-LEVEL EXCLUSION — what is left of the census when the thread is removed (P8) ===\n');
const outsideUnits = intConsumers.filter((r) => !r.inUnitDir);
const perUnit = {};
for (const r of intConsumers) {
  const m = r.file.match(UNIT_DIR_RE);
  const k = m ? m[0] : '(outside docs/research/unit-*/)';
  perUnit[k] = (perUnit[k] || 0) + 1;
}
say(`  integrated own-line consumers: ${intConsumers.length}`);
say(`  of those, OUTSIDE docs/research/unit-*/: ${outsideUnits.length}   <- P8 registered at 0`);
for (const r of outsideUnits) say(`    ${key(r)}  ${r.shape}  ${r.ownLine.slice(0, 140)}`);
say('\n  per unit directory:');
for (const [k, v] of Object.entries(perUnit).sort((a, b) => b[1] - a[1])) say(`    ${String(v).padStart(3)}  ${k}`);
const unit515 = intConsumers.filter((r) => r.file.startsWith('docs/research/unit-515keyekp-2026-11-25/'));
const unit516 = intConsumers.filter((r) => r.file.startsWith('docs/research/unit-516secondargfixture-2026-11-25/'));
say(`\n  P9, Daedalus's unit-515 §6 claim graded against my key: own-line consumers under unit-515keyekp = ${unit515.length}`);
for (const r of unit515) say(`    ${key(r)}  ${r.shape}  nested ${r.nested}  ${r.ownLine.slice(0, 140)}`);
say(`  this unit's own contribution to the census it is measuring: ${unit516.length} (this arm is excluded by path; the pre-registration is .md and outside the filter)`);
out.population = { integrated: intConsumers.length, outsideUnits: outsideUnits.map(key), perUnit, unit515: unit515.map(key), unit516: unit516.map(key) };

/* ================================================================ §7 verdicts */

const kpByName = (n) => kpCells.find((c) => c.name === n);
const P = [];
P.push(['P1', `all ${PUBLISHED_OWNLINE} published rows reproduce per row under the span-derived inherited classifier`,
  parseComplete && sameRows === PUBLISHED_OWNLINE, `${sameRows} of ${publishedRows.length} identical, parse complete ${parseComplete}`]);
P.push(['P2', `inherited own-line consumers at this HEAD >= ${PUBLISHED_OWNLINE}`,
  baseConsumers.length >= PUBLISHED_OWNLINE, `measured ${baseConsumers.length}`]);
P.push(['P3', 'SECOND-ARG recovers EXACTLY the two named sites and no other',
  p3Exact, `measured ${secondArgRows.length}: ${secondArgKeys.join('  ')}`]);
P.push(['P4', `SECOND-ARG >= ${PUBLISHED_SECOND_ARG_FLOOR} (yesterday's floor holds)`,
  secondArgRows.length >= PUBLISHED_SECOND_ARG_FLOOR, `measured ${secondArgRows.length}`]);
P.push(['P5', 'the SECOND-ARG regex itself refuses the first-argument form and an emission line',
  p5First === false && p5Emit === false, `first-arg ${p5First}, emission ${p5Emit}`]);
P.push(['P6', 'DECLARED BLINDNESS: a nested call in argument 1 is MISSED by SECOND-ARG',
  kpByName('KP8-nested-call-arg1-planted')?.integrated === 'UNCLEAR', `KP8 integrated verdict ${kpByName('KP8-nested-call-arg1-planted')?.integrated}`]);
P.push(['P7', 'NESTED-LITERAL own-line consumers == exactly the five sites named by eye',
  p7Exact, `measured ${nestedConsumers.length}`]);
P.push(['P8', 'own-line consumers outside docs/research/unit-*/ == 0',
  outsideUnits.length === 0, `measured ${outsideUnits.length}`]);
P.push(['P9', 'at least one own-line consumer site under unit-515keyekp (his §6 claim, graded here)',
  unit515.length >= 1, `measured ${unit515.length}`]);
P.push(['P10', 'DECLARED FALSE POSITIVE: an apostrophe before the label inside a template keys as NESTED',
  kpByName('KP9-apostrophe-planted')?.nested === true, `KP9 nested ${kpByName('KP9-apostrophe-planted')?.nested}`]);
P.push(['P11', 'no SECOND-ARG-regex row was pre-empted by the inherited key from the 4-line window',
  absorbedByWindow.length === 0, `measured ${absorbedByWindow.length} of ${regexMatchRows.length} regex-matching rows`]);
P.push(['P12', 'the integrated key is strictly greater than the inherited one, with the diff per row',
  intConsumers.length > baseConsumers.length, `${baseConsumers.length} -> ${intConsumers.length}, added ${addedByIntegration.length}, removed ${lostByIntegration.length}`]);

say('\n=== §7 REGISTERED PREDICTIONS ===\n');
for (const [id, text, v, note] of P) say(`  ${(v === null ? 'UNGRADED' : v ? 'HIT' : 'REFUTED').padEnd(9)} ${id.padEnd(4)} ${text}${note ? `  —  ${note}` : ''}`);
const hits = P.filter(([, , v]) => v === true).length;
const refs = P.filter(([, , v]) => v === false).length;
say(`\n  ${hits} HIT · ${refs} REFUTED · ${P.length - hits - refs} UNGRADED of ${P.length}`);

out.predictions = P.map(([id, text, v, note]) => ({ id, text, verdict: v === null ? 'UNGRADED' : v ? 'HIT' : 'REFUTED', note: note ?? null }));
out.allSites = stringSites.map((r) => ({ site: key(r), baseShape: r.baseShape, baseFrom: r.baseFrom, shape: r.shape, from: r.from, nested: r.nested, inUnitDir: r.inUnitDir, ownLine: r.ownLine }));
say(`\n${JSON.stringify(out, null, 2)}`);
