#!/usr/bin/env node
/**
 * unit-469braceslice — arm A.
 *
 * Censuses this corpus's brace-balance body slicers and partitions them by whether the brace scan
 * is preceded by a paren-match of the parameter list — the cure both `unit-467importprice` and
 * `unit-468createlit` arrived at independently after the uncured form silently dropped members.
 *
 * **This instrument deliberately contains no brace-depth scan of its own** (leg A7). It works on
 * whole-file text and match indices. The only depth walk here is over PARENTHESES, in the
 * live-exposure test, which is the cured shape, not the defect. The brace key below is written with
 * character classes rather than a `=== '{'` comparison precisely so the instrument does not enter
 * its own population by accident; A7 asserts that it does not.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// **Drive 1 defect, repaired here; drive 1 is kept.** `ROOT` was `process.cwd()`, so driving the arm
// from its own unit directory walked `<unit>/scripts`, `<unit>/docs/research`, … — all absent — and
// the run reported a population of **0** with A1/A3/A6 red and a crash in A7's `readFileSync`. A
// census whose root is the caller's cwd measures where it was invoked from, not what it was written
// about. Root is now derived from this file's own location.
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const ROOTS = ['scripts', 'docs/research', 'docs/operations', 'packages'];
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs']);

// A character comparison against an open / close brace, either operand order.
const OPEN_CMP = /[=!]==?\s*['"`]\x7b['"`]|['"`]\x7b['"`]\s*[=!]==?/;
const CLOSE_CMP = /[=!]==?\s*['"`]\x7d['"`]|['"`]\x7d['"`]\s*[=!]==?/;
const LPAREN_CMP = /[=!]==?\s*['"`]\(['"`]|['"`]\(['"`]\s*[=!]==?/;
const RPAREN_CMP = /[=!]==?\s*['"`]\)['"`]|['"`]\)['"`]\s*[=!]==?/;

const WINDOW = 400; // chars of preceding source the GUARDED test reads; A8 re-runs at whole-file

// Relative-to-ROOT repo path, for the KP legs. argv first (env assignment is not permitted in a
// fire); the path is resolved against ROOT, never against the child cwd.
const CRIPPLE = process.argv[2] || process.env.BRACESLICE_CRIPPLE || '';
const SELF = 'docs/research/unit-469braceslice-2026-11-17/arm-braceslice-a.mjs';

/* ---------------------------------------------------------------- file walk */
const files = [];
const walk = (d) => {
  let ents;
  try { ents = readdirSync(join(ROOT, d), { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const rel = `${d}/${e.name}`;
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      walk(rel);
    } else if (EXTS.has(extname(e.name))) files.push(rel);
  }
};
for (const r of ROOTS) walk(r);
files.sort();

/* ------------------------------------------------------- read, with cripple */
const srcOf = (rel) => {
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  if (rel !== CRIPPLE) return raw;
  // The cripple: delete the paren-match prelude, leaving the brace scan where it was.
  // Both subjects guard with a paren-depth walk; removing every line that compares against a
  // paren reproduces the pre-cure shape without re-typing the pre-cure code.
  return raw
    .split('\n')
    .filter((l) => !(LPAREN_CMP.test(l) || RPAREN_CMP.test(l)))
    .join('\n');
};

/* -------------------------------------------------------------- classify */
const inPop = [];
for (const rel of files) {
  const src = srcOf(rel);
  if (!OPEN_CMP.test(src)) continue;
  const slicer = CLOSE_CMP.test(src);
  const m = OPEN_CMP.exec(src);
  const idx = m.index;
  const before = src.slice(0, idx);
  const win = before.slice(Math.max(0, before.length - WINDOW));
  const guardedWin = LPAREN_CMP.test(win) && RPAREN_CMP.test(win);
  const guardedAll = LPAREN_CMP.test(before) && RPAREN_CMP.test(before);
  inPop.push({ rel, slicer, guardedWin, guardedAll, idx });
}

const slicers = inPop.filter((f) => f.slicer);
const nonSlicers = inPop.filter((f) => !f.slicer);
// Three-way, per the pre-registered third refusal: a file whose GUARDED verdict depends on the
// window is WITHDRAWN, not counted on either side. The window is a proximity-window consumer key
// and this seat has been wrong with one before.
const guarded = slicers.filter((f) => f.guardedWin && f.guardedAll);
const unguarded = slicers.filter((f) => !f.guardedWin && !f.guardedAll);
const ambiguous = slicers.filter((f) => f.guardedWin !== f.guardedAll);

/* ------------------------------------------- live-exposure test (named, or UNKNOWN) */
// Paren-match from `(` at i; return the parameter text. This is the CURED shape and the only
// depth walk in this file.
const paramsAt = (s, i) => {
  let d = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '(') d++;
    else if (c === ')') { d--; if (d === 0) return s.slice(i + 1, j); }
  }
  return null;
};

// **Drive 2 defect, repaired here; drive 2 is kept.** `HEAD` was
// `…(?:function\s*\*?\s*)?([A-Za-z_$][\w$]*)\s*\(` — the `function` keyword OPTIONAL — so any
// line-initial `identifier(` matched, which means `if (…)`, `for (…)`, `return (…)` and every
// statement-position call read as a function head. In a brace-slicer file the condition
// `if (ch === '{')` then paren-matches to a "parameter list" that CONTAINS a brace, so the
// liveness test fired on the very construct the population key selects on. Drive 2 reported
// `LIVE 51/56 · LATENT 0` with names like `if`, `for`, `return`, `g` — a perfectly circular
// reading. The repair requires a real declaration form; statement-position calls and control flow
// cannot match. It UNDER-reports (class and object-literal method declarations are not matched)
// and that blindness is declared rather than cured, since every scanner in this corpus is a module
// of `function`/arrow declarations.
const HEAD = /^[ \t]*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*(?:<[^(){}]*>)?\s*\(/gm;
const DECL = /^[ \t]*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]*)?=\s*(?:async\s+)?(?:<[^(){}]*>)?\s*\(/gm;
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'do', 'return', 'typeof', 'new',
  'else', 'await', 'yield', 'throw', 'with', 'delete', 'void', 'in', 'of']);

const breakingSigs = (src) => {
  const out = [];
  for (const re of [HEAD, DECL]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const lp = src.indexOf('(', m.index + m[0].length - 1);
      if (KEYWORDS.has(m[1])) continue;
      const params = paramsAt(src, lp);
      if (params && (params.includes('{') || params.includes('}'))) out.push(m[1]);
    }
  }
  return [...new Set(out)];
};

// Which files does a scanner actually read? Path-like literals in its own source that resolve.
const PATHLIT = /['"`]([^'"`\n]*\.(?:ts|mts|js|mjs|tsx))['"`]/g;
const subjectsOf = (rel, src) => {
  const hits = new Set();
  PATHLIT.lastIndex = 0;
  let m;
  while ((m = PATHLIT.exec(src))) {
    const p = m[1];
    if (p.startsWith('.')) {
      const abs = resolve(ROOT, dirname(rel), p);
      if (existsSync(abs) && statSync(abs).isFile()) hits.add(abs);
    } else {
      for (const base of ['', 'packages/server/src', 'packages/client/src', 'packages/shared/src', 'scripts']) {
        const abs = resolve(ROOT, base, p);
        if (existsSync(abs) && statSync(abs).isFile()) { hits.add(abs); break; }
      }
    }
  }
  return [...hits];
};

const liveness = unguarded.map((f) => {
  const src = srcOf(f.rel);
  const subs = subjectsOf(f.rel, src).filter((s) => !s.includes('/node_modules/'));
  if (subs.length === 0) return { rel: f.rel, verdict: 'UNKNOWN', why: 'no subject path literal resolves', named: [] };
  const named = [];
  for (const s of subs) {
    let t;
    try { t = readFileSync(s, 'utf8'); } catch { continue; }
    const sigs = breakingSigs(t);
    if (sigs.length) named.push(`${s.replace(ROOT + '/', '')}: ${sigs.slice(0, 4).join(', ')}${sigs.length > 4 ? ` (+${sigs.length - 4})` : ''}`);
  }
  return named.length
    ? { rel: f.rel, verdict: 'LIVE', why: `${named.length}/${subs.length} resolved subject(s) carry a braced parameter list`, named }
    : { rel: f.rel, verdict: 'LATENT', why: `${subs.length} resolved subject(s), none with a braced parameter list`, named: [] };
});

/* ------------------------------------------------------------------- report */
const red = [];
const refused = [];
const check = (name, ok, note) => {
  console.log(`  ${ok ? 'ok  ' : 'RED '} ${name} — ${note}`);
  if (!ok) red.push(name);
};

console.log(`unit-469braceslice arm A${CRIPPLE ? `  [CRIPPLE: ${CRIPPLE}]` : ''}`);
console.log(`  files walked: ${files.length} under ${ROOTS.join(', ')}`);
console.log(`  population |P| (compares against an open brace): ${inPop.length}`);
console.log(`  SLICER (also compares against a close brace):    ${slicers.length}`);
console.log(`  non-SLICER:                                      ${nonSlicers.length}  ${nonSlicers.map((f) => f.rel).join(' · ') || '(none)'}`);
console.log(`  GUARDED (paren-match within ${WINDOW} chars before): ${guarded.length}`);
for (const f of guarded) console.log(`      GUARDED   ${f.rel}`);
console.log(`  AMBIGUOUS (window-sensitive, WITHDRAWN):         ${ambiguous.length}`);
for (const f of ambiguous) console.log(`      AMBIGUOUS ${f.rel}`);
console.log(`  UNGUARDED:                                       ${unguarded.length}`);
for (const f of unguarded) console.log(`      UNGUARDED ${f.rel}`);
console.log('  liveness of the UNGUARDED set:');
for (const l of liveness) {
  console.log(`      ${l.verdict.padEnd(7)} ${l.rel} — ${l.why}`);
  for (const n of l.named) console.log(`                  ${n}`);
}

const A3 = ['docs/research/unit-467importprice-2026-11-16/arm-importprice-a.mts',
            'docs/research/unit-468createlit-2026-11-17/arm-createlit-a.mjs'];

console.log('\nlegs:');
check('A1', inPop.length > 0, `population non-empty: ${inPop.length} file(s) compare against an open brace`);
check('A2', slicers.length + nonSlicers.length === inPop.length,
  `partition sums: ${slicers.length} slicer + ${nonSlicers.length} non-slicer = ${inPop.length}`);
check('A2b', guarded.length + unguarded.length + ambiguous.length === slicers.length,
  `guarded+unguarded+ambiguous = ${guarded.length}+${unguarded.length}+${ambiguous.length} = ${slicers.length}`);

if (CRIPPLE) {
  const t = inPop.find((f) => f.rel === CRIPPLE);
  const legName = CRIPPLE.includes('importprice') ? 'A4' : 'A5';
  check(legName, !!t && t.slicer && !t.guardedWin,
    t ? `${CRIPPLE} classifies ${t.slicer ? (t.guardedWin ? 'GUARDED (KP did not move)' : 'UNGUARDED') : 'non-SLICER'}` : `${CRIPPLE} not in population at all`);
} else {
  for (const p of A3) {
    const t = inPop.find((f) => f.rel === p);
    check(`A3[${p.split('/').pop()}]`, !!t && t.slicer && t.guardedWin,
      t ? `slicer=${t.slicer} guardedWin=${t.guardedWin}` : 'not in population');
  }
}

check('A6', nonSlicers.length >= 1,
  `negative limb: ${nonSlicers.length} file(s) matched the open-brace key and were correctly NOT classified as slicers`);

const selfSrc = readFileSync(join(ROOT, SELF), 'utf8');
check('A7', !(OPEN_CMP.test(selfSrc) && CLOSE_CMP.test(selfSrc)),
  `instrument self-check: this arm ${OPEN_CMP.test(selfSrc) ? 'matches the open-brace key' : 'does not match the open-brace key'}; slicer=${OPEN_CMP.test(selfSrc) && CLOSE_CMP.test(selfSrc)}`);

check('A8', true,
  `window sensitivity: ${ambiguous.length} file(s) classify differently at whole-file-before vs ${WINDOW}-char window and are WITHDRAWN per the pre-registered refusal${ambiguous.length ? ` — ${ambiguous.map((f) => f.rel).join(', ')}` : ''}`);
if (ambiguous.length) refused.push(`GUARDED verdict for ${ambiguous.length} window-sensitive file(s)`);

// Negative control on the REPAIRED liveness reader: it must name no control-flow keyword anywhere
// in the corpus. Drive 2's reader named `if`, `for` and `return` on 51 files.
const kwLeak = [];
for (const f of unguarded.slice(0, 80)) {
  for (const n of breakingSigs(srcOf(f.rel))) if (KEYWORDS.has(n)) kwLeak.push(`${f.rel}:${n}`);
}
check('A8b', kwLeak.length === 0,
  `liveness reader names no control-flow keyword as a signature: ${kwLeak.length} leak(s)${kwLeak.length ? ` — ${kwLeak.slice(0, 5).join(', ')}` : ''}`);

if (slicers.length < 3) refused.push('RATE (|SLICER| < 3, pre-registered refusal)');
for (const l of liveness) if (l.verdict === 'UNKNOWN') refused.push(`LIVE verdict for ${l.rel} (no subject resolved)`);

console.log(`\n${red.length ? 'RED' : 'ok'} legs=${red.length + 0} red=[${red.join(',')}] refused=[${refused.join(' | ')}]`);
if (slicers.length >= 3) {
  console.log(`RATE: ${unguarded.length}/${slicers.length} slicers unguarded = ${((unguarded.length / slicers.length) * 100).toFixed(1)}%`);
  const live = liveness.filter((l) => l.verdict === 'LIVE').length;
  console.log(`LIVE: ${live}/${unguarded.length} of the unguarded set is live (named); LATENT ${liveness.filter((l) => l.verdict === 'LATENT').length}; UNKNOWN ${liveness.filter((l) => l.verdict === 'UNKNOWN').length}`);
}
process.exit(red.length ? 1 : 0);
