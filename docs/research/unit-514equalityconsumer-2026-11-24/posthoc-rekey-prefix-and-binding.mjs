#!/usr/bin/env node
/**
 * unit-514equalityconsumer — post-hoc: the re-key. PREFIX-tolerant quoted matcher + a BINDING class.
 *
 * Cures the defect this morning's addendum found in my own Arm A: every shape test was built around
 * `['"`]LABEL['"`]`, which requires the label to be the WHOLE string literal, so the colon form
 * `num('tracked files read:')` — the label as a PREFIX of its own literal — could not match any
 * consumer shape and fell into the terminal UNCLEAR bucket. The published move from 12 to 14 was
 * HAND ARITHMETIC on a sliced input (12 printed − 2 prose-in-string + 4 colon-form). This script
 * makes the KEY produce that number, or corrects it. P3 is registered to be refuted.
 *
 * Registered in PRE-REGISTRATION-ADDENDUM-REKEY.md, committed before this file existed.
 *
 * Three things are provenanced mechanically rather than retyped, because a byte-identical selector
 * dropped into a different population is a different instrument:
 *   - the REGION scanner is copied verbatim from the arm and the copy is asserted byte-for-byte by
 *     slicing the same span out of both files at run time;
 *   - the arm's `SELF` literal and its `git ls-files` extension filter are EXTRACTED from the arm's
 *     source and used as-is (the filter is KP'd on three paths after extraction);
 *   - this script and the arm are both excluded by path, and each exclusion prints whether the path
 *     was tracked at run time.
 *
 * No brace comparison anywhere in this file, deliberately — same reason as the arm: the decl-body
 * gate's population key is "compares against both braces" and an instrument measuring something
 * else must not join it.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LABEL = 'tracked files read';
const SELF = 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs';
const ARM = 'docs/research/unit-514equalityconsumer-2026-11-24/arm-equalityconsumer.mjs';
const ARM_COMMIT = '9b9a4283';
const PUBLISHED_HAND_FIGURE = 14;   // the figure this script exists to reproduce or correct
const PUBLISHED_OWNLINE_OLD = 10;   // 12 printed − 2 window-decided prose-in-string
const PUBLISHED_BINDING_BY_EYE = 7;

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

function statementSlice(src, offset) {
  const lines = src.split('\n');
  const ln = lineOf(src, offset) - 1;
  return lines.slice(Math.max(0, ln - 1), ln + 3).join('\n');
}

/* The three quoted-literal matchers. Only this one line differed between a key that sees the colon
 * form and a key that cannot. Built here so the variants are a parameter, not three copies. */
const QOPEN = "['\"`]";
const NOTQ = "[^'\"`]*";
const QUOTED = {
  WHOLE: `${QOPEN}${LABEL}${QOPEN}`,                 // the arm's own: label IS the whole literal
  PREFIX: `${QOPEN}${LABEL}${NOTQ}${QOPEN}`,         // label is a PREFIX of its literal
  ANY: `${QOPEN}${NOTQ}${LABEL}${NOTQ}${QOPEN}`,     // label anywhere inside one quoted run
};

function makeTests(quoted) {
  return [
    ['BINDING', new RegExp(`(?:const|let|var)\\s+[\\w$]+\\s*=\\s*${quoted}`), 'the label is BOUND to an identifier by a declaration — where a rename LANDS'],
    ['OBJKEY', new RegExp(`${quoted}\\s*:`), 'the label is an object KEY'],
    ['EQUALITY', new RegExp(`(?:===|!==|==|!=)\\s*${quoted}|${quoted}\\s*(?:===|!==|==|!=)`), 'compared for equality against the label string'],
    ['INCLUDES', new RegExp(`\\.(?:includes|startsWith|endsWith|indexOf|lastIndexOf|search)\\s*\\(\\s*${quoted}`), 'substring/containment test on the label string'],
    ['ARRMEMBER', new RegExp(`\\[[^\\]]*${quoted}`), 'the label is a member of an array literal'],
    ['STRINGARG', new RegExp(`[\\w$.]+\\s*\\(\\s*${quoted}`), 'the label is passed as a string ARGUMENT'],
  ];
}

const TESTS = { WHOLE: makeTests(QUOTED.WHOLE), PREFIX: makeTests(QUOTED.PREFIX), ANY: makeTests(QUOTED.ANY) };
const CONSUMER_SHAPES = ['EQUALITY', 'INCLUDES', 'STRINGARG', 'ARRMEMBER'];

/**
 * Verdict = first matching class in order; `matches` = EVERY class whose test matched, so the
 * precedence of this ordered list is readable off the output instead of asserted in prose.
 */
function shapeOf(src, offset, variant) {
  const own = lineText(src, offset);
  const ctx = statementSlice(src, offset);
  const tests = TESTS[variant];
  const onOwn = tests.filter(([, re]) => re.test(own));
  if (onOwn.length) {
    return { cls: onOwn[0][0], why: onOwn[0][2], matches: onOwn.map(([c]) => c), deciding: own.trim(), from: 'own line' };
  }
  const onCtx = tests.filter(([, re]) => re.test(ctx));
  if (onCtx.length) {
    return { cls: onCtx[0][0], why: onCtx[0][2], matches: onCtx.map(([c]) => c), deciding: ctx.trim(), from: '4-line window' };
  }
  return { cls: 'UNCLEAR', why: 'no shape matched on the line or in the window', matches: [], deciding: own.trim(), from: 'own line' };
}

/* ------------------------------------------------------------------ §0 provenance */

console.log('=== §0 PROVENANCE — same scanner, same population rule, or no figure ===\n');

const armSrc = readFileSync(ARM, 'utf8');
const selfSrc = readFileSync(SELF, 'utf8');

const SPAN_START = 'function regions(src) {';
const SPAN_END = '/* ------------------------------------------------------------------ key 2: SHAPE */';
function span(src, what) {
  const a = src.indexOf(SPAN_START);
  const b = src.indexOf(SPAN_END);
  if (a === -1 || b === -1 || b <= a) return { ok: false, text: '', note: `anchors not found in ${what} (start ${a}, end ${b})` };
  return { ok: true, text: src.slice(a, b), note: `${what}: ${src.slice(a, b).length} B` };
}
const armSpan = span(armSrc, 'arm');
const selfSpan = span(selfSrc, 'this script');
// a present anchor does not mean an intact span: assert size and three region markers
const spanIntact = (s) => s.ok && s.text.length > 1500
  && s.text.includes('LINE_COMMENT') && s.text.includes('BLOCK_COMMENT') && s.text.includes("state = 'REGEX'");
const scannerIdentical = armSpan.ok && selfSpan.ok && armSpan.text === selfSpan.text;

console.log(`  region-scanner span   ${armSpan.note}  |  ${selfSpan.note}`);
console.log(`  spans intact (size > 1500 B and all three region markers present): arm ${spanIntact(armSpan)}, self ${spanIntact(selfSpan)}`);
console.log(`  BYTE-IDENTICAL: ${scannerIdentical}`);

const selfMatch = armSrc.match(/const SELF = '([^']+)'/);
const extMatch = armSrc.match(/filter\(\(p\) => (\/.+?\/)\.test\(p\)\)/);
const armSelf = selfMatch ? selfMatch[1] : null;
const extRe = extMatch ? new RegExp(extMatch[1].slice(1, -1)) : null;
console.log(`\n  arm's SELF, read out of its source:   ${armSelf}`);
console.log(`  arm's ls-files filter, read out of its source: ${extMatch ? extMatch[1] : '(NOT FOUND)'}`);
const extKp = extRe
  ? [['a.mjs', true], ['b.js', true], ['c.md', false], ['d.ts', false]].map(([p, want]) => ({ p, want, got: extRe.test(p), ok: extRe.test(p) === want }))
  : [];
console.log(`  extracted filter KP: ${extKp.map((k) => `${k.p}=${k.got}${k.ok ? '' : ' MISMATCH'}`).join('  ')}`);
const extKpOk = extKp.length === 4 && extKp.every((k) => k.ok);

/* ------------------------------------------------------------------ §1 KP */

const KP = [
  // --- the gate: P1's separating cell, with its liveness control
  ['KP1-colon-prefix', `const v = num('${LABEL}:');`, { WHOLE: 'UNCLEAR', PREFIX: 'STRINGARG', ANY: 'STRINGARG' }],
  ['KP2-whole-control', `const v = fig('${LABEL}');`, { WHOLE: 'STRINGARG', PREFIX: 'STRINGARG', ANY: 'STRINGARG' }],
  // --- the gate: P2's BINDING cell and the two refusals nearest it
  ['KP3-binding', `const LABEL = '${LABEL}';`, { WHOLE: 'BINDING', PREFIX: 'BINDING', ANY: 'BINDING' }],
  ['KP4-binding-colon', `const OLD = '${LABEL}:';`, { WHOLE: 'UNCLEAR', PREFIX: 'BINDING', ANY: 'BINDING' }],
  ['KP5-not-binding-stringarg', `const v = fig('${LABEL}');`, { WHOLE: 'STRINGARG', PREFIX: 'STRINGARG', ANY: 'STRINGARG' }],
  ['KP6-not-binding-equality', `if (name === '${LABEL}') { pass(); }`, { WHOLE: 'EQUALITY', PREFIX: 'EQUALITY', ANY: 'EQUALITY' }],
  // --- regression: the arm's own gated shapes must not move
  ['KP7-includes', `const hit = line.includes('${LABEL}');`, { WHOLE: 'INCLUDES', PREFIX: 'INCLUDES', ANY: 'INCLUDES' }],
  ['KP8-objkey', `const NAMED = { '${LABEL}': /x/ };`, { WHOLE: 'OBJKEY', PREFIX: 'OBJKEY', ANY: 'OBJKEY' }],
  ['KP9-arrmember', `const names = ['population', '${LABEL}'];`, { WHOLE: 'ARRMEMBER', PREFIX: 'ARRMEMBER', ANY: 'ARRMEMBER' }],
  // --- what ANY buys over PREFIX, as a cell rather than an argument
  ['KP10-infix-only', `const s = num('the ${LABEL}: 5');`, { WHOLE: 'UNCLEAR', PREFIX: 'UNCLEAR', ANY: 'STRINGARG' }],
];

console.log('\n=== §1 KNOWN POSITIVE — all three matchers on the same fixtures ===\n');
const kpRows = [];
for (const [name, src, want] of KP) {
  const occ = occurrencesWithRegion(src, LABEL);
  const row = { name, occurrences: occ.length, want, got: {}, ok: {} };
  for (const v of ['WHOLE', 'PREFIX', 'ANY']) {
    const got = occ.length === 1 && occ[0].kind === 'STRING' ? shapeOf(src, occ[0].offset, v).cls : `REGION=${occ.map((o) => o.kind).join('+') || 'NONE'}`;
    row.got[v] = got;
    row.ok[v] = got === want[v];
  }
  row.pass = ['WHOLE', 'PREFIX', 'ANY'].every((v) => row.ok[v]);
  kpRows.push(row);
  console.log(`  ${row.pass ? 'PASS' : 'FAIL'}  ${name.padEnd(28)} WHOLE ${String(row.got.WHOLE).padEnd(10)} PREFIX ${String(row.got.PREFIX).padEnd(10)} ANY ${String(row.got.ANY).padEnd(10)} (want ${want.WHOLE}/${want.PREFIX}/${want.ANY})`);
}

// declared blindness, PLANTED and ASSERTED: a label built by concatenation is unreachable to all
// three matchers because all three key on one unbroken quoted run. This is a measured blind spot.
const builtFixture = `const v = num('tracked files ' + 'read:');`;
const builtOcc = occurrencesWithRegion(builtFixture, LABEL);
const blindnessMeasured = builtOcc.length === 0;
console.log(`\n  KP11-built-label (declared blindness, asserted): occurrences of the label in \`${builtFixture.trim()}\` = ${builtOcc.length} -> key MISSES it: ${blindnessMeasured}`);
console.log('        every figure below is therefore a FLOOR with a measured blind spot, not a count.');

const GATE = ['KP1-colon-prefix', 'KP2-whole-control', 'KP3-binding', 'KP4-binding-colon', 'KP5-not-binding-stringarg', 'KP6-not-binding-equality'];
const gatePass = kpRows.filter((r) => GATE.includes(r.name) && r.pass).length;
const kpAllPass = kpRows.filter((r) => r.pass).length;
console.log(`\n  GATED cells: ${gatePass} of ${GATE.length}   whole KP set: ${kpAllPass} of ${kpRows.length}   blindness asserted: ${blindnessMeasured}`);
console.log(`  provenance gate: scanner byte-identical ${scannerIdentical}, spans intact ${spanIntact(armSpan) && spanIntact(selfSpan)}, extracted filter KP ${extKpOk}`);

const refused = gatePass !== GATE.length || !blindnessMeasured || !scannerIdentical || !extKpOk || !extRe || !armSelf;
if (refused) {
  console.log('\nKEY REFUSED — the pre-registration gated the corpus census on P1+P2 (6 cells), the');
  console.log('planted blindness, the byte-identical scanner and the extracted population rule.');
  console.log('NO corpus figure is printed.');
  console.log(JSON.stringify({ refused: true, gatePass, kpRows, scannerIdentical, extKpOk }, null, 2));
  process.exit(0);
}

/* ------------------------------------------------------------------ §2 corpus */

const trackedAll = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const tracked = trackedAll.filter((p) => extRe.test(p));
const selfTracked = tracked.includes(SELF);
const armTracked = tracked.includes(armSelf);
const corpus = tracked.filter((p) => p !== armSelf && p !== SELF);

console.log('\n=== §2 CORPUS — the arm\'s population rule, minus the arm and minus this script ===\n');
console.log(`  tracked files matching the extracted filter: ${tracked.length}`);
console.log(`  read: ${corpus.length}   excluded by path: 2 (the arm, this script)`);
console.log(`  arm tracked at run time:  ${armTracked}`);
console.log(`  this script tracked at run time: ${selfTracked}  (${selfTracked ? 'excluded by path' : 'untracked, so excluded twice over'})`);

const srcCache = new Map();
let unreadable = 0;
let filesWithLabel = 0;
for (const rel of corpus) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { unreadable += 1; continue; }
  if (!src.includes(LABEL)) continue;
  filesWithLabel += 1;
  srcCache.set(rel, src);
}
console.log(`  files containing the label at all: ${filesWithLabel}   unreadable: ${unreadable}`);

function scan(variant) {
  const sites = [];
  for (const [rel, src] of srcCache) {
    for (const o of occurrencesWithRegion(src, LABEL)) {
      const row = { file: rel, line: lineOf(src, o.offset), region: o.kind };
      if (o.kind === 'STRING') {
        const s = shapeOf(src, o.offset, variant);
        Object.assign(row, { shape: s.cls, matches: s.matches, decidedFrom: s.from, deciding: s.deciding, why: s.why });
      } else {
        row.shape = null;
        row.matches = [];
        row.decidedFrom = null;
        row.deciding = lineText(src, o.offset).trim();
      }
      sites.push(row);
    }
  }
  return sites;
}

const scans = { WHOLE: scan('WHOLE'), PREFIX: scan('PREFIX'), ANY: scan('ANY') };
const tally = (xs, k) => xs.reduce((m, r) => { const v = String(r[k]); m[v] = (m[v] || 0) + 1; return m; }, {});
const key = (r) => `${r.file}:${r.line}`;

const figures = {};
for (const v of ['WHOLE', 'PREFIX', 'ANY']) {
  const sites = scans[v];
  const stringSites = sites.filter((r) => r.region === 'STRING');
  const ownLine = stringSites.filter((r) => r.decidedFrom === 'own line');
  const consumersOwnLine = ownLine.filter((r) => CONSUMER_SHAPES.includes(r.shape));
  const consumersWindow = stringSites.filter((r) => r.decidedFrom === '4-line window' && CONSUMER_SHAPES.includes(r.shape));
  const bindings = stringSites.filter((r) => r.shape === 'BINDING');
  figures[v] = {
    occurrences: sites.length,
    byRegion: tally(sites, 'region'),
    stringByShape: tally(stringSites, 'shape'),
    consumersOwnLine: consumersOwnLine.length,
    consumersWindowDecided: consumersWindow.length,
    bindings: bindings.length,
    unclear: stringSites.filter((r) => r.shape === 'UNCLEAR').length,
    multiMatch: ownLine.filter((r) => r.matches.length > 1).length,
    _consumersOwnLine: consumersOwnLine,
    _bindings: bindings,
    _unclearRows: stringSites.filter((r) => r.shape === 'UNCLEAR'),
  };
}

console.log('\n=== §3 FIGURES — one row per matcher variant ===\n');
console.log('  variant   occ   consumers(own line)   consumers(window-decided)   BINDING   UNCLEAR   own-line sites matching >1 class');
for (const v of ['WHOLE', 'PREFIX', 'ANY']) {
  const f = figures[v];
  console.log(`  ${v.padEnd(9)} ${String(f.occurrences).padEnd(5)} ${String(f.consumersOwnLine).padEnd(21)} ${String(f.consumersWindowDecided).padEnd(27)} ${String(f.bindings).padEnd(9)} ${String(f.unclear).padEnd(9)} ${f.multiMatch}`);
}
for (const v of ['WHOLE', 'PREFIX', 'ANY']) {
  console.log(`\n  ${v} STRING-region sites by shape: ${JSON.stringify(figures[v].stringByShape)}`);
}

/* ------------------------------------------------------------------ §4 the delta rows, PRINTED */

const wholeKeys = new Set(figures.WHOLE._consumersOwnLine.map(key));
const prefixKeys = new Set(figures.PREFIX._consumersOwnLine.map(key));
const addedByPrefix = figures.PREFIX._consumersOwnLine.filter((r) => !wholeKeys.has(key(r)));
const addedByAny = figures.ANY._consumersOwnLine.filter((r) => !prefixKeys.has(key(r)));

console.log(`\n=== §4 WHAT EACH WIDENING ADDS — rows in full, not a count (P6) ===\n`);
console.log(`  PREFIX adds over WHOLE: ${addedByPrefix.length}`);
for (const r of addedByPrefix) console.log(`    ${key(r)}  ${r.shape}  [${r.matches.join(',')}]\n      ${r.deciding.slice(0, 200)}`);
console.log(`\n  ANY adds over PREFIX: ${addedByAny.length}`);
for (const r of addedByAny) console.log(`    ${key(r)}  ${r.shape}  [${r.matches.join(',')}]\n      ${r.deciding.slice(0, 200)}`);

console.log(`\n  BINDING sites under PREFIX (${figures.PREFIX.bindings}) — in full, because this class is new:`);
for (const r of figures.PREFIX._bindings) console.log(`    ${key(r)}  [${r.matches.join(',')}]  ${r.deciding.slice(0, 160)}`);

console.log(`\n  CONSUMERS under PREFIX, own line (${figures.PREFIX.consumersOwnLine}) — in full:`);
for (const r of figures.PREFIX._consumersOwnLine) console.log(`    ${key(r)}  ${r.shape}  [${r.matches.join(',')}]  ${r.deciding.slice(0, 160)}`);

/* ------------------------------------------------------------------ §5 reconciliation (P5) */

console.log('\n=== §5 RECONCILIATION of the WHOLE key at HEAD against the published 10 (P5) ===\n');

function existedAt(commit, path) {
  try { execFileSync('git', ['cat-file', '-e', `${commit}:${path}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
// KP the oracle on both directions before using it — exit code only, no stderr string guessed
const oracleKp = [
  { path: armSelf, want: true, note: 'the arm itself, added IN that commit' },
  { path: 'packages/server/src/db/index.ts', want: true, note: 'long-lived path OUTSIDE docs/' },
  { path: SELF, want: false, note: 'this script, created after that commit' },
].map((k) => ({ ...k, got: existedAt(ARM_COMMIT, k.path), ok: existedAt(ARM_COMMIT, k.path) === k.want }));
for (const k of oracleKp) console.log(`  ${k.ok ? 'PASS' : 'FAIL'}  existedAt(${ARM_COMMIT}, ${k.path}) = ${k.got} (want ${k.want}) — ${k.note}`);
const oracleOk = oracleKp.every((k) => k.ok);

let reconciliation = null;
if (!oracleOk) {
  console.log('\n  ORACLE REFUSED — the existence oracle failed a KP, so no partition is printed and');
  console.log('  P5 is reported as UNGRADED rather than behind a plausible figure.');
} else {
  const wholeOwnLine = figures.WHOLE._consumersOwnLine;
  const present = wholeOwnLine.filter((r) => existedAt(ARM_COMMIT, r.file));
  const newFile = wholeOwnLine.filter((r) => !existedAt(ARM_COMMIT, r.file));
  reconciliation = {
    wholeOwnLineAtHead: wholeOwnLine.length,
    published: PUBLISHED_OWNLINE_OLD,
    delta: wholeOwnLine.length - PUBLISHED_OWNLINE_OLD,
    inFilePresentAtArmCommit: present.length,
    inFileNewSinceArmCommit: newFile.length,
    partitionSumsToTotal: present.length + newFile.length === wholeOwnLine.length,
  };
  console.log(`\n  WHOLE-key own-line consumers at HEAD: ${wholeOwnLine.length}   published: ${PUBLISHED_OWNLINE_OLD}   delta: ${reconciliation.delta >= 0 ? '+' : ''}${reconciliation.delta}`);
  console.log(`  partition by file existence at ${ARM_COMMIT}:  PRESENT-THEN ${present.length} · NEW-FILE ${newFile.length}   (sums to total: ${reconciliation.partitionSumsToTotal})`);
  if (newFile.length) {
    console.log('  the NEW-FILE rows, in full:');
    for (const r of newFile) console.log(`    ${key(r)}  ${r.shape}  ${r.deciding.slice(0, 160)}`);
  }
  if (present.length !== PUBLISHED_OWNLINE_OLD) {
    console.log(`  NOTE: PRESENT-THEN (${present.length}) does NOT equal the published ${PUBLISHED_OWNLINE_OLD}.`);
    console.log('  File existence cannot separate "the arm missed it" from "the line was appended later",');
    console.log('  which is this partition\'s declared limit; the line-level rung is not driven here and');
    console.log('  that is named, not glossed.');
  }
}

/* ------------------------------------------------------------------ §6 UNCLEAR, still printed */

console.log(`\n=== §6 THE TERMINAL BUCKET under PREFIX (${figures.PREFIX.unclear}) — printed, because sizing it is what hid the colon form ===\n`);
for (const r of figures.PREFIX._unclearRows) console.log(`    ${key(r)}  ${r.deciding.slice(0, 150)}`);

/* ------------------------------------------------------------------ §7 verdicts */

const p1 = kpRows.find((r) => r.name === 'KP1-colon-prefix');
const p1control = kpRows.find((r) => r.name === 'KP2-whole-control');
const P = [];
P.push(['P1', 'PREFIX sees the colon form, WHOLE does not, and WHOLE is live on the control',
  p1.got.WHOLE === 'UNCLEAR' && p1.got.PREFIX === 'STRINGARG' && p1control.got.WHOLE === 'STRINGARG']);
P.push(['P2', 'BINDING fires on a binding and refuses STRINGARG/EQUALITY',
  kpRows.find((r) => r.name === 'KP3-binding').pass && kpRows.find((r) => r.name === 'KP5-not-binding-stringarg').pass && kpRows.find((r) => r.name === 'KP6-not-binding-equality').pass]);
P.push(['P3', `own-line consumers under PREFIX == the hand-derived ${PUBLISHED_HAND_FIGURE}`,
  figures.PREFIX.consumersOwnLine === PUBLISHED_HAND_FIGURE, `measured ${figures.PREFIX.consumersOwnLine}`]);
P.push(['P4', `BINDING at HEAD >= ${PUBLISHED_BINDING_BY_EYE}`,
  figures.PREFIX.bindings >= PUBLISHED_BINDING_BY_EYE, `measured ${figures.PREFIX.bindings}`]);
P.push(['P5', `WHOLE own-line >= ${PUBLISHED_OWNLINE_OLD} and every site above it is in a file new since ${ARM_COMMIT}`,
  oracleOk && reconciliation ? (reconciliation.wholeOwnLineAtHead >= PUBLISHED_OWNLINE_OLD && reconciliation.delta <= reconciliation.inFileNewSinceArmCommit) : null,
  reconciliation ? `at HEAD ${reconciliation.wholeOwnLineAtHead}, delta ${reconciliation.delta}, NEW-FILE ${reconciliation.inFileNewSinceArmCommit}` : 'ungraded: oracle refused']);
P.push(['P6', 'WHOLE <= PREFIX <= ANY for own-line consumers, extra rows printed',
  figures.WHOLE.consumersOwnLine <= figures.PREFIX.consumersOwnLine && figures.PREFIX.consumersOwnLine <= figures.ANY.consumersOwnLine,
  `${figures.WHOLE.consumersOwnLine} <= ${figures.PREFIX.consumersOwnLine} <= ${figures.ANY.consumersOwnLine}`]);

console.log('\n=== §7 REGISTERED PREDICTIONS ===\n');
for (const [id, text, verdict, note] of P) {
  const v = verdict === null ? 'UNGRADED' : verdict ? 'HIT' : 'REFUTED';
  console.log(`  ${v.padEnd(9)} ${id}  ${text}${note ? `  —  ${note}` : ''}`);
}
const hits = P.filter(([, , v]) => v === true).length;
const refuted = P.filter(([, , v]) => v === false).length;
const ungraded = P.filter(([, , v]) => v === null).length;
console.log(`\n  ${hits} HIT · ${refuted} REFUTED · ${ungraded} UNGRADED of ${P.length}`);

console.log(`\n${JSON.stringify({
  provenance: { scannerIdentical, armSpanBytes: armSpan.text.length, selfSpanBytes: selfSpan.text.length, armSelf, extFilter: extMatch ? extMatch[1] : null, extKp, oracleKp },
  kp: { rows: kpRows, gatePass, gateOf: GATE.length, allPass: kpAllPass, total: kpRows.length, blindnessMeasured },
  corpus: { trackedMatchingFilter: tracked.length, read: corpus.length, excludedByPath: 2, armTracked, selfTracked, filesWithLabel, unreadable },
  figures: Object.fromEntries(Object.entries(figures).map(([v, f]) => [v, Object.fromEntries(Object.entries(f).filter(([k]) => !k.startsWith('_')))])),
  addedByPrefix: addedByPrefix.map((r) => ({ site: key(r), shape: r.shape, deciding: r.deciding })),
  addedByAny: addedByAny.map((r) => ({ site: key(r), shape: r.shape, deciding: r.deciding })),
  bindings: figures.PREFIX._bindings.map((r) => ({ site: key(r), deciding: r.deciding })),
  consumersPrefix: figures.PREFIX._consumersOwnLine.map((r) => ({ site: key(r), shape: r.shape, matches: r.matches, deciding: r.deciding })),
  reconciliation,
  predictions: P.map(([id, text, v, note]) => ({ id, text, verdict: v === null ? 'UNGRADED' : v ? 'HIT' : 'REFUTED', note: note ?? null })),
}, null, 2)}`);
