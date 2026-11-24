#!/usr/bin/env node
/**
 * unit-514equalityconsumer — Arm A: the NON-REGEX consumer population of `tracked files read`.
 *
 * Daedalus's unit-513 §6 item 2: "the equality-keyed consumer population. Keyed on equality against
 * the label string, not on regex literals. Neither seat has that key. Three known members."
 *
 * Both published censuses of this label key on **regex literals**. His own §3 found 4 sites my
 * `unit-512` key could not see, three of them equality comparisons and one a string argument. This
 * arm is the key for that class.
 *
 * Two keys, in this order, and the second only runs if the first passes:
 *
 *   1. REGION — where does each occurrence of the label actually sit? A single character scan
 *      tracking string / template / regex / line-comment / block-comment state. This is the key
 *      Daedalus's census had none of: his 3-of-23 docblock over-count is exactly a missing region
 *      key, and my own `unit-512` reader had the same hole pointing the other way.
 *
 *   2. SHAPE — for occurrences in STRING regions only, what consumes the label? EQUALITY,
 *      INCLUDES, OBJKEY, STRINGARG, ARRMEMBER or UNCLEAR, decided from the enclosing statement and
 *      printed with the slice it was decided from, verbatim, so no figure here rests on my word.
 *
 * KNOWN POSITIVE FIRST. 14 in-memory fixtures, three of them the shapes the pre-registration named.
 * Below 3 of 3 on those three, NO corpus figure is printed at all. The fixtures are in-memory
 * strings and not files, because a tracked fixture carrying this label would JOIN the population it
 * is used to grade.
 *
 * This file is excluded from the corpus BY PATH and the exclusion is printed, the way the gate
 * prints its own. It also reports whether it was tracked at run time, so the exclusion can be
 * checked rather than trusted.
 *
 * No brace comparison anywhere in this file, deliberately: the decl-body gate's population key is
 * "compares against both braces", and an instrument that walks a body by hand to measure something
 * else would redden the gate it is not about. Region state needs no brace.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LABEL = 'tracked files read';
const SELF = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';

/* ------------------------------------------------------------------ key 1: REGION */

/**
 * Character scan returning, for every occurrence of `needle` in `src`, the region it sits in.
 * Regions: STRING (' " or template), REGEX (/.../), LINE_COMMENT, BLOCK_COMMENT, CODE.
 *
 * Regex-vs-division is decided the way every hand reader has to: a `/` starts a regex unless the
 * last significant character before it can end an expression. That is a heuristic and it is named
 * as one; every REGEX verdict is printed with its slice so a wrong one is visible in the output.
 */
function regions(src) {
  const out = [];
  let i = 0;
  let state = 'CODE';
  let lastSig = '';
  const n = src.length;
  let regionStart = 0;
  const push = (end) => { out.push({ kind: state, start: regionStart, end }); };
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (state === 'CODE') {
      if (c === '/' && c2 === '/') { push(i); state = 'LINE_COMMENT'; regionStart = i; i += 2; continue; }
      if (c === '/' && c2 === '*') { push(i); state = 'BLOCK_COMMENT'; regionStart = i; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { push(i); state = 'STRING'; regionStart = i; var q = c; i += 1; continue; }
      if (c === '/') {
        const canEndExpr = /[\w$)\]]/.test(lastSig);
        if (!canEndExpr) { push(i); state = 'REGEX'; regionStart = i; i += 1; continue; }
      }
      if (!/\s/.test(c)) lastSig = c;
      i += 1;
      continue;
    }
    if (state === 'LINE_COMMENT') {
      if (c === '\n') { push(i); state = 'CODE'; regionStart = i; }
      i += 1;
      continue;
    }
    if (state === 'BLOCK_COMMENT') {
      if (c === '*' && c2 === '/') { push(i + 2); state = 'CODE'; regionStart = i + 2; i += 2; continue; }
      i += 1;
      continue;
    }
    if (state === 'STRING') {
      if (c === '\\') { i += 2; continue; }
      if (c === q) { push(i + 1); state = 'CODE'; regionStart = i + 1; lastSig = 'x'; i += 1; continue; }
      i += 1;
      continue;
    }
    if (state === 'REGEX') {
      if (c === '\\') { i += 2; continue; }
      if (c === '[') { // character class: a `/` inside it does not end the literal
        while (i < n && src[i] !== ']') { if (src[i] === '\\') i += 1; i += 1; }
        i += 1;
        continue;
      }
      if (c === '/') { push(i + 1); state = 'CODE'; regionStart = i + 1; lastSig = 'x'; i += 1; continue; }
      i += 1;
      continue;
    }
    i += 1;
  }
  push(n);
  return out.filter((r) => r.end > r.start);
}

function occurrencesWithRegion(src, needle) {
  const regs = regions(src);
  const found = [];
  let at = src.indexOf(needle);
  while (at !== -1) {
    const r = regs.find((g) => at >= g.start && at < g.end);
    found.push({ offset: at, kind: r ? r.kind : 'CODE' });
    at = src.indexOf(needle, at + 1);
  }
  return found;
}

const lineOf = (src, offset) => src.slice(0, offset).split('\n').length;
const lineText = (src, offset) => src.split('\n')[lineOf(src, offset) - 1] ?? '';

/* ------------------------------------------------------------------ key 2: SHAPE */

/**
 * The statement a STRING occurrence sits in: from the previous `;`, `,` at depth, or newline-run
 * backwards, to the end of the logical line forwards. Deliberately simple and PRINTED, so the
 * reader can see what each verdict was decided from. Two lines of context forwards, because the
 * equality shapes in this corpus wrap.
 */
function statementSlice(src, offset) {
  const lines = src.split('\n');
  const ln = lineOf(src, offset) - 1;
  return lines.slice(Math.max(0, ln - 1), ln + 3).join('\n');
}

function shapeOf(src, offset) {
  const own = lineText(src, offset);
  const ctx = statementSlice(src, offset);
  const quoted = `['"\`]${LABEL}['"\`]`;
  const tests = [
    ['OBJKEY', new RegExp(`${quoted}\\s*:`), 'the label is an object KEY'],
    ['EQUALITY', new RegExp(`(?:===|!==|==|!=)\\s*${quoted}|${quoted}\\s*(?:===|!==|==|!=)`), 'compared for equality against the label string'],
    ['INCLUDES', new RegExp(`\\.(?:includes|startsWith|endsWith|indexOf|lastIndexOf|search)\\s*\\(\\s*${quoted}`), 'substring/containment test on the label string'],
    ['ARRMEMBER', new RegExp(`\\[[^\\]]*${quoted}`), 'the label is a member of an array literal'],
    ['STRINGARG', new RegExp(`[\\w$.]+\\s*\\(\\s*${quoted}`), 'the label is passed as a string ARGUMENT'],
  ];
  // the own line decides first; only if nothing on it matches does the 4-line window get a say
  for (const [cls, re, why] of tests) {
    if (re.test(own)) return { cls, why, deciding: own.trim(), from: 'own line' };
  }
  for (const [cls, re, why] of tests) {
    if (re.test(ctx)) return { cls, why, deciding: ctx.trim(), from: '4-line window' };
  }
  return { cls: 'UNCLEAR', why: 'no shape matched on the line or in the window', deciding: own.trim(), from: 'own line' };
}

/* ------------------------------------------------------------------ KP */

const KP = [
  // the three shapes the pre-registration gated on
  ['KP1-equality', `if (name === '${LABEL}') { pass(); }`, 'STRING', 'EQUALITY'],
  ['KP2-includes', `const hit = line.includes('${LABEL}');`, 'STRING', 'INCLUDES'],
  ['KP3-stringarg', `const v = fig('${LABEL}');`, 'STRING', 'STRINGARG'],
  // region negatives — the class Daedalus's census had no key for
  ['KP4-linecomment', `// the ${LABEL} figure moved today\nconst x = 1;`, 'LINE_COMMENT', null],
  ['KP5-blockcomment', `/**\n * ${LABEL} is the label.\n */\nconst x = 1;`, 'BLOCK_COMMENT', null],
  ['KP6-regex', `const re = /${LABEL}:\\s*(\\d+)/;`, 'REGEX', null],
  // region traps
  ['KP7-regex-after-paren', `const m = s.match(/${LABEL}/);`, 'REGEX', null],
  ['KP8-division-not-regex', `const r = a / b; const k = '${LABEL}';`, 'STRING', 'UNCLEAR'],
  ['KP9-slash-in-string', `const u = 'http://x/y'; const k = '${LABEL}';`, 'STRING', 'UNCLEAR'],
  ['KP10-comment-marker-in-string', `const s = "// not a comment ${LABEL}";`, 'STRING', 'UNCLEAR'],
  ['KP11-template', `const s = \`the \${n} ${LABEL}\`;`, 'STRING', 'UNCLEAR'],
  ['KP12-objkey', `const NAMED = { '${LABEL}': /x/ };`, 'STRING', 'OBJKEY'],
  ['KP13-arrmember', `const names = ['population', '${LABEL}'];`, 'STRING', 'ARRMEMBER'],
  ['KP14-regex-charclass-slash', `const re = /[/]${LABEL}/;`, 'REGEX', null],
];

const kpRows = KP.map(([name, src, wantRegion, wantShape]) => {
  const occ = occurrencesWithRegion(src, LABEL);
  const gotRegion = occ.length === 1 ? occ[0].kind : `OCCURRENCES=${occ.length}`;
  const gotShape = occ.length === 1 && occ[0].kind === 'STRING' ? shapeOf(src, occ[0].offset).cls : null;
  const regionOk = gotRegion === wantRegion;
  const shapeOk = wantShape === null ? gotShape === null : gotShape === wantShape;
  return { name, wantRegion, gotRegion, regionOk, wantShape, gotShape, shapeOk, pass: regionOk && shapeOk };
});

const GATED = ['KP1-equality', 'KP2-includes', 'KP3-stringarg'];
const gatedPass = kpRows.filter((r) => GATED.includes(r.name) && r.pass).length;
const kpAllPass = kpRows.filter((r) => r.pass).length;

console.log('=== unit-514 Arm A — KNOWN POSITIVE, before any corpus figure ===\n');
for (const r of kpRows) {
  console.log(`  ${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(28)} region ${String(r.gotRegion).padEnd(14)} (want ${r.wantRegion})  shape ${String(r.gotShape).padEnd(10)} (want ${String(r.wantShape)})`);
}
console.log(`\n  gated shapes: ${gatedPass} of ${GATED.length}   whole KP set: ${kpAllPass} of ${kpRows.length}`);

if (gatedPass !== GATED.length) {
  console.log('\nKEY REFUSED — the pre-registration gated the corpus census on 3 of 3 for the three');
  console.log('named shapes. NO corpus figure is printed. Arm A ends here, reported as a broken key.');
  console.log(JSON.stringify({ kpRows, gatedPass, corpusCensus: null, refused: true }, null, 2));
  process.exit(0);
}

/* ------------------------------------------------------------------ corpus */

const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n').filter((p) => /\.(mjs|js)$/.test(p));

const selfTracked = tracked.includes(SELF);
const corpus = tracked.filter((p) => p !== SELF);

const sites = [];
let unreadable = 0;
let filesWithLabel = 0;
for (const rel of corpus) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { unreadable += 1; continue; }
  if (!src.includes(LABEL)) continue;
  filesWithLabel += 1;
  for (const o of occurrencesWithRegion(src, LABEL)) {
    const row = { file: rel, line: lineOf(src, o.offset), region: o.kind };
    if (o.kind === 'STRING') {
      const s = shapeOf(src, o.offset);
      row.shape = s.cls;
      row.why = s.why;
      row.decidedFrom = s.from;
      row.deciding = s.deciding;
    } else {
      row.shape = null;
      row.deciding = lineText(src, o.offset).trim();
    }
    sites.push(row);
  }
}

const tally = (xs, k) => xs.reduce((m, r) => { const v = String(r[k]); m[v] = (m[v] || 0) + 1; return m; }, {});
const stringSites = sites.filter((r) => r.region === 'STRING');
const NONREGEX_SHAPES = ['EQUALITY', 'INCLUDES', 'STRINGARG', 'ARRMEMBER'];
const nonRegexConsumers = stringSites.filter((r) => NONREGEX_SHAPES.includes(r.shape));

console.log('\n=== corpus ===\n');
console.log(`  tracked .mjs/.js files read: ${corpus.length}`);
console.log(`  of ${tracked.length} tracked .mjs/.js at HEAD, 1 excluded as this arm's own, ${unreadable} unreadable`);
console.log(`  this arm's own path tracked at run time: ${selfTracked}  (${selfTracked ? 'excluded by path' : 'untracked, so excluded twice over'})`);
console.log(`  files containing the label at all: ${filesWithLabel}`);
console.log(`  label occurrences: ${sites.length}`);
console.log(`  by region: ${JSON.stringify(tally(sites, 'region'))}`);
console.log(`  STRING-region sites by shape: ${JSON.stringify(tally(stringSites, 'shape'))}`);
console.log(`\n  NON-REGEX CONSUMERS (${NONREGEX_SHAPES.join('/')}): ${nonRegexConsumers.length}`);
for (const r of nonRegexConsumers) {
  console.log(`\n    ${r.file}:${r.line}  ${r.shape}  [${r.decidedFrom}]`);
  console.log(`      ${r.deciding.split('\n').map((l) => l.trim()).join(' ⏎ ').slice(0, 220)}`);
}

const HIS_FOUR = [
  'docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs:115',
  'docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs:118',
  'docs/research/unit-506labelmultiset-2026-11-23/posthoc-standing-linewise.mjs:119',
  'docs/research/unit-503stalelabelwidth-2026-11-22/posthoc-p7-own-landing.mjs:58',
];
const foundKeys = new Set(nonRegexConsumers.map((r) => `${r.file}:${r.line}`));
const allStringKeys = new Set(stringSites.map((r) => `${r.file}:${r.line}`));
const hisFourStatus = HIS_FOUR.map((k) => ({
  site: k,
  inNonRegexConsumers: foundKeys.has(k),
  inStringRegionAtAll: allStringKeys.has(k),
  shape: sites.find((r) => `${r.file}:${r.line}` === k)?.shape ?? null,
}));

console.log('\n=== the four sites Daedalus named (P2) ===\n');
for (const h of hisFourStatus) {
  console.log(`  ${h.inNonRegexConsumers ? 'FOUND' : 'MISSED'}  ${h.site}  shape=${h.shape}  (STRING region: ${h.inStringRegionAtAll})`);
}

console.log('\n=== P3, mine ===\n');
console.log(`  I predicted >= 8 non-regex consumer sites. Measured: ${nonRegexConsumers.length} -> ${nonRegexConsumers.length >= 8 ? 'HIT' : 'REFUTED'}`);

console.log(`\n${JSON.stringify({
  kp: { rows: kpRows, gatedPass, allPass: kpAllPass, total: kpRows.length },
  corpus: {
    trackedJsFiles: tracked.length,
    read: corpus.length,
    excludedAsOwn: 1,
    selfTracked,
    unreadable,
    filesWithLabel,
    occurrences: sites.length,
    byRegion: tally(sites, 'region'),
    stringByShape: tally(stringSites, 'shape'),
    nonRegexConsumerCount: nonRegexConsumers.length,
  },
  nonRegexConsumers,
  hisFourStatus,
  allSites: sites,
}, null, 2)}`);
