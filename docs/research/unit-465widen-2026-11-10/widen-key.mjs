#!/usr/bin/env node
/**
 * unit-465widen — `K-onceR`, the widened restricted key, and its HEAD-only legs.
 *
 * Takes Theseus's 11/10 §5.3: `K-once` (mine, `unit-465plant`) cannot see a declaration consumed by
 * `once()` through a FUNCTION PARAMETER, so a gate leg keyed on it would re-introduce the blindness
 * v2 cured at census level with W1. `K-onceR` walks the FORWARD direction of W1: declaration → bare
 * identifier argument at position p of a call f(…) → f's parameter p → `once(`, depth ≤ 4.
 *
 * Legs here: P5 (the two anchors at HEAD), P6 (graded against v2's own capture, parsed not typed),
 * P7 (the plant and its two controls). P1–P4, the 403-commit population legs, are NOT in this file;
 * they are a second instrument in this unit and are named as unbuilt rather than implied.
 *
 * R9: the reusable parts are SLICED by marker with each marker asserted to occur exactly once.
 * The forward walker below is new code, which is why P6 grades it instead of trusting it.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
if (!existsSync(join(REPO, 'scripts', 'sweep-probes.mjs'))) { console.log('REFUSED — repo root not found'); process.exit(2); }

const V2 = join(REPO, 'docs/research/unit-465census-v2-2026-11-10/census-anchors-v2.mjs');
const PLANT = join(REPO, 'docs/research/unit-465plant-2026-11-10/posthoc-v2-repaired-population.mjs');
const V2CAP = join(REPO, 'docs/research/unit-465census-v2-2026-11-10/census-v2-run-1.txt');

/** Slice [start, end) out of `file`, refusing unless BOTH markers occur exactly once. */
function slice(file, startMarker, endMarker, label) {
  const src = readFileSync(file, 'utf8');
  for (const [m, which] of [[startMarker, 'start'], [endMarker, 'end']]) {
    const n = src.split(m).length - 1;
    if (n !== 1) { console.log(`REFUSED — ${label}: ${which} marker occurs ${n} times, not once`); process.exit(2); }
  }
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker);
  if (b <= a) { console.log(`REFUSED — ${label}: end marker precedes start marker`); process.exit(2); }
  const text = src.slice(a, b);
  console.log(`sliced ${label}: ${text.split('\n').length} lines, both markers unique`);
  return text;
}

const helpersV2 = slice(V2,
  '// ---- helpers: top-level argument split, and the call sites of a named function',
  '// The RHS classifier, shared by the top-level route and W1\'s call-site route.',
  'v2 helpers (argsAt / lineOf / callSites / FNDECL / enclosingFnFor)');
const keyPlant = slice(PLANT,
  'const occ = (hay, needle)',
  "console.log('unit-465plant — POST-HOC v2",
  'unit-465plant key span (occ / git / blob / parseLiteral / literalDecls / keysFor)');

const SCRATCH = join(HERE, 'scratch');
mkdirSync(SCRATCH, { recursive: true });
const composed = `import { execFileSync } from 'node:child_process';
const REPO = ${JSON.stringify(REPO)};
${helpersV2}
${keyPlant}
export { occ, git, blob, parseLiteral, literalDecls, keysFor, argsAt, lineOf, callSites, enclosingFnFor, FNDECL };
`;
const composedPath = join(SCRATCH, 'composed-slices.mjs');
writeFileSync(composedPath, composed);
const S = await import(composedPath);
for (const n of ['occ', 'parseLiteral', 'literalDecls', 'keysFor', 'argsAt', 'callSites', 'enclosingFnFor', 'FNDECL']) {
  if (S[n] === undefined) { console.log(`REFUSED — slice did not yield ${n}`); process.exit(2); }
}
console.log(`slices composed and type-checked: ${Object.keys(S).length} bindings recovered`);

// ---------------------------------------------------------------------------------------------
// NEW CODE — the forward walker. Graded by P6, not trusted.
// ---------------------------------------------------------------------------------------------

/** The body span of function `fname`: its declaration line to the first line matching ^} or ^};  (R11) */
function bodyOf(src, fname) {
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = S.FNDECL.exec(lines[i]);
    if (!m) continue;
    if ((m[1] ?? m[2]) !== fname) continue;
    const openIdx = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0) + lines[i].indexOf('(', lines[i].indexOf(fname));
    const parsed = S.argsAt(src, openIdx);
    if (!parsed) continue;
    const params = parsed.args.map((p) => p.split(':')[0].trim().replace(/^\.\.\./, ''));
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) if (/^\};?\s*$/.test(lines[j])) { end = j + 1; break; }
    return { declLine: i + 1, endLine: end, params, body: lines.slice(i, end).join('\n'), bodyOffset: i };
  }
  return null;
}

/**
 * Is `name` consumed by `once(` in `src`, directly or through a function parameter?
 * Returns { key: boolean, via: 'direct'|'param'|null, chain: string[], unread: string|null }.
 */
function consumedByOnce(src, name, declLine, depth = 0, seen = new Set(), scope = null) {
  const lines = (scope ? scope.body : src).split('\n');
  const lineBase = scope ? scope.bodyOffset : 0;
  const re = new RegExp(`\\b${name}\\b`);
  // 1. direct — K-once exactly
  for (let i = 0; i < lines.length; i++) {
    const absolute = lineBase + i + 1;
    if (absolute === declLine) continue;
    if (!re.test(lines[i])) continue;
    if (/\bonce\s*\(/.test(lines[i])) {
      return { key: true, via: depth === 0 ? 'direct' : 'param', chain: [`once(… ${name} …) :${absolute}`], unread: null };
    }
  }
  if (depth >= 4) return { key: false, via: null, chain: [], unread: 'depth limit 4 reached' };
  // 2. indirect — `name` as a bare identifier argument of a call in the same source
  const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  const text = scope ? scope.body : src;
  let m;
  const tried = [];
  while ((m = callRe.exec(text)) !== null) {
    const fname = m[1];
    if (fname === 'once' || fname === 'if' || fname === 'for' || fname === 'while' || fname === 'return') continue;
    const open = m.index + m[0].length - 1;
    const parsed = S.argsAt(text, open);
    if (!parsed) continue;
    const pos = parsed.args.findIndex((a) => a.trim() === name);
    if (pos === -1) continue;
    const callLine = lineBase + S.lineOf(text, open);
    const fn = bodyOf(src, fname);
    if (!fn) { tried.push(`${fname}() :${callLine} — no declaration found in this source`); continue; }
    const param = fn.params[pos];
    if (param === undefined) { tried.push(`${fname}() :${callLine} — no parameter at position ${pos}`); continue; }
    const cycleKey = `${fname}#${param}`;
    if (seen.has(cycleKey)) { tried.push(`${fname}(${param}) — cycle`); continue; }
    seen.add(cycleKey);
    const inner = consumedByOnce(src, param, fn.declLine, depth + 1, seen, fn);
    const hop = `${fname}(…) :${callLine} arg${pos}=${name} → ${fname} declared :${fn.declLine} param${pos}=${param}`;
    if (inner.key) return { key: true, via: 'param', chain: [...inner.chain, hop], unread: null };
    tried.push(`${hop} — parameter not consumed by once()`);
  }
  return { key: false, via: null, chain: [], unread: tried.length ? `no route: ${tried.join(' | ')}` : null };
}

console.log('\nunit-465widen — K-onceR, HEAD-only legs (P5, P6, P7). P1–P4 are a second instrument, not built.');

// ---- P5: the two anchors Theseus named, at HEAD ------------------------------------------------
const r377rel = execFileSync('git', ['-C', REPO, 'ls-files', 'scripts/probe-round377*.mts'], { encoding: 'utf8' }).trim().split('\n')[0];
if (!r377rel) { console.log('REFUSED — probe-round377 not found under git'); process.exit(2); }
const r377 = readFileSync(join(REPO, r377rel), 'utf8');
console.log(`\nP5 — subject: ${r377rel}`);
const decls377 = S.literalDecls(r377);
const p5 = [];
for (const name of ['SB374', 'SB375']) {
  const d = decls377.get(name);
  if (!d) { console.log(`  ${name}: REFUSED — no literal declaration found`); process.exit(2); }
  const kOld = S.keysFor(r377, name, d.line);
  const kNew = consumedByOnce(r377, name, d.line);
  const o = S.occ(r377, d.value);
  console.log(`  ${name} :${d.line}  occ(value)=${o}  K-once=${kOld.kOnce}  K-used=${kOld.kUsed}  K-onceR=${kNew.key} (${kNew.via})`);
  for (const hop of kNew.chain) console.log(`      chain: ${hop}`);
  p5.push({ name, declLine: d.line, occ: o, kOnce: kOld.kOnce, kUsed: kOld.kUsed, kOnceR: kNew.key, chain: kNew.chain });
}
const p5true = p5.every((r) => r.kOnce === false && r.kOnceR === true);
console.log(`  P5 ${p5true ? 'TRUE' : 'FALSE'} — both key-false under K-once and key-true under K-onceR`);

// ---- P6: graded against v2's own recording, parsed out of the capture file ----------------------
console.log('\nP6 — graded against v2\'s capture, parsed not typed');
const cap = readFileSync(V2CAP, 'utf8');
const want = new Map();
for (const line of cap.split('\n')) {
  const m = /via W1: once\(…, (\w+), …\) :(\d+) → (\w+)\(…\) :(\d+) arg(\d+)=(\w+)/.exec(line);
  if (m) want.set(m[6], { param: m[1], onceLine: Number(m[2]), fn: m[3], callLine: Number(m[4]), pos: Number(m[5]) });
}
console.log(`  parsed ${want.size} W1 chain(s) out of ${V2CAP.split('/').pop()}: ${[...want.keys()].join(', ')}`);
if (want.size === 0) { console.log('  REFUSED — no W1 chain parsed; P6 cannot be graded'); process.exit(2); }
let p6true = true;
for (const r of p5) {
  const w = want.get(r.name);
  if (!w) { console.log(`  ${r.name}: REFUSED — v2's capture has no chain for it`); p6true = false; continue; }
  const mineOnce = Number(/:(\d+)$/.exec(r.chain[0])?.[1]);
  const hop = r.chain[1] ?? '';
  const mineCall = Number(/:(\d+) arg/.exec(hop)?.[1]);
  const minePos = Number(/arg(\d+)=/.exec(hop)?.[1]);
  const mineParam = /param\d+=(\w+)/.exec(hop)?.[1];
  const agree = mineOnce === w.onceLine && mineCall === w.callLine && minePos === w.pos && mineParam === w.param;
  console.log(`  ${r.name}: v2 once:${w.onceLine} call:${w.callLine} arg${w.pos} param=${w.param}  |  mine once:${mineOnce} call:${mineCall} arg${minePos} param=${mineParam}  → ${agree ? 'AGREE' : 'DIVERGE'}`);
  if (!agree) p6true = false;
}
console.log(`  P6 ${p6true ? 'TRUE' : 'FALSE'} — the forward walker recovers v2's own printed chain`);

// ---- P7: the plant and its two controls --------------------------------------------------------
console.log('\nP7 — the plant carries the property: a PARAMETER-BOUND declaration whose value is non-unique');
const PLANTS = {
  'PLANT-param (dup, parameter route)': `const SB = "const SANDBOX = 'dup';";\nconst ECHO = "const SANDBOX = 'dup';";\nconst copy = (file, decl) => {\n  let s = readFileSync(file, 'utf8');\n  s = once(s, decl, 'replacement');\n  return s;\n};\ncopy('f.mts', SB);\n`,
  'CTRL-unique (parameter route, unique value)': `const SB = "const SANDBOX = 'uniq';";\nconst copy = (file, decl) => {\n  let s = readFileSync(file, 'utf8');\n  s = once(s, decl, 'replacement');\n  return s;\n};\ncopy('f.mts', SB);\n`,
  'CTRL-direct (dup, direct route)': `const DD = "const SANDBOX = 'dup';";\nconst ECHO = "const SANDBOX = 'dup';";\nlet s = readFileSync('f.mts', 'utf8');\ns = once(s, DD, 'replacement');\n`,
};
const p7rows = [];
for (const [label, src] of Object.entries(PLANTS)) {
  const name = label.startsWith('CTRL-direct') ? 'DD' : 'SB';
  const d = S.literalDecls(src).get(name);
  if (!d) { console.log(`  ${label}: REFUSED — plant's own declaration did not parse`); process.exit(2); }
  const o = S.occ(src, d.value);
  const kOld = S.keysFor(src, name, d.line);
  const kNew = consumedByOnce(src, name, d.line);
  const flagOld = o >= 2 && kOld.kOnce;
  const flagNew = o >= 2 && kNew.key;
  console.log(`  ${label}\n      occ=${o}  K-once=${kOld.kOnce} → flag ${flagOld}  |  K-onceR=${kNew.key} (${kNew.via}) → flag ${flagNew}`);
  for (const hop of kNew.chain) console.log(`      chain: ${hop}`);
  p7rows.push({ label, occ: o, flagOld, flagNew });
}
const plant = p7rows[0], ctrlU = p7rows[1], ctrlD = p7rows[2];
const p7true = plant.flagOld === false && plant.flagNew === true
  && ctrlU.flagOld === false && ctrlU.flagNew === false
  && ctrlD.flagOld === true && ctrlD.flagNew === true;
console.log(`  P7 ${p7true ? 'TRUE' : 'FALSE'} — plant flags only under K-onceR; unique control flags under neither; direct control flags under both`);

console.log('\n---- verdicts ----');
console.log(`P5 ${p5true ? 'TRUE' : 'FALSE'} · P6 ${p6true ? 'TRUE' : 'FALSE'} · P7 ${p7true ? 'TRUE' : 'FALSE'}`);
console.log('P1 P2 P3 P4 NOT RUN — the 403-commit population legs are a second instrument in this unit, not built in this fire.');
process.exit(p5true && p6true && p7true ? 0 : 1);
