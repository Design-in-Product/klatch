// unit-464class — stage 1: enumerate the leg population and census the registration idioms.
//
// This stage deliberately prints NO class for any leg. The hand read of §4 of the
// pre-registration is the verdict, and a detector's class printed here would be an answer key
// for that read. Classes come from `classify-and-grade.mjs`, after `HAND-READ.tsv` is committed.
//
// Surface: the `unit-464*` directories under docs/research/ whose OLDEST adding commit is mine,
// EXCLUDING this unit's own directory — an instrument does not census its own source. drive1
// (kept) is the recording of that defect: it read 29 dirs / 42 .mjs because this directory is
// itself a `unit-464*` directory created in this fire, which is the same defect Theseus's §5.2
// found in his own pre-registration's corpus scan.
//
// drive1 also reddened GSPANOK on 8 problems, all one cause: a raw /\bcheck\s*\(/ matches the
// PROSE `cross-check (design note 2)` inside a comment, and comment prose carries unbalanced
// parens. So the matcher now runs over a BLANKED copy of each file — line comments, block
// comments, string literals, template literals and regex literals replaced by spaces of the same
// length, so offsets and line numbers stay exact — while the span text is sliced from the
// ORIGINAL source.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = '/Users/xian/Development/klatch-worktrees/daedalus';
const RES = join(ROOT, 'docs/research');
const SELF = 'unit-464class-2026-11-02';
const OUT = join(RES, SELF);
const g = (args) =>
  execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const REV = g(['rev-parse', 'HEAD']).trim();
const legs = [];
const nonLiteralIds = [];
const fileRows = [];
const problems = [];

// ───────────────────────────────────────────────────────── blank out everything that is not code
//
// Index-based, writing spaces into a char array — never a regex replace, which would rewrite its
// own replacements. Returns a string of identical length to the input.
function blankNonCode(src) {
  const out = src.split('');
  const blank = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; };
  let i = 0;
  // Tracks the last significant code character, to disambiguate division from a regex literal.
  let prevSig = '';
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const end = e < 0 ? src.length : e; blank(i, end); i = end; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const end = e < 0 ? src.length : e + 2; blank(i, end); i = end; continue; }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1, esc = false, depth = 0;
      while (j < src.length) {
        const x = src[j];
        if (esc) { esc = false; j++; continue; }
        if (x === '\\') { esc = true; j++; continue; }
        // `${ … }` inside a template holds real code; blank the literal parts only.
        if (c === '`' && x === '$' && src[j + 1] === '{') { depth++; j += 2; continue; }
        if (c === '`' && depth > 0 && x === '}') { depth--; j++; continue; }
        if (x === c && depth === 0) break;
        j++;
      }
      blank(i, Math.min(j + 1, src.length));
      prevSig = 'x';
      i = Math.min(j + 1, src.length);
      continue;
    }
    if (c === '/') {
      // Regex literal iff the previous significant char cannot end an expression.
      const canPrecedeRegex = prevSig === '' || '(,=:[!&|?{};+-*%~^<>'.includes(prevSig);
      if (canPrecedeRegex) {
        let j = i + 1, esc = false, inClass = false;
        while (j < src.length) {
          const x = src[j];
          if (esc) { esc = false; j++; continue; }
          if (x === '\\') { esc = true; j++; continue; }
          if (x === '[') inClass = true;
          else if (x === ']') inClass = false;
          else if (x === '/' && !inClass) break;
          else if (x === '\n') break;           // unterminated ⇒ it was division after all
          j++;
        }
        if (src[j] === '/') {
          while (j + 1 < src.length && /[gimsuyd]/.test(src[j + 1])) j++;
          blank(i, j + 1);
          prevSig = 'x';
          i = j + 1;
          continue;
        }
      }
    }
    if (!/\s/.test(c)) prevSig = c;
    i++;
  }
  return out.join('');
}

const lineOf = (src, idx) => { let n = 1; for (let k = 0; k < idx; k++) if (src[k] === '\n') n++; return n; };

// ─────────────────────────────────────────────────────────────────────── the declared idioms
//
// `kind` is the part drive2 got wrong by fusing two mechanisms under one count:
//
//   REGISTER     — the predicate is INSIDE the sliced span (check(name, pred, note),
//                  g(id, claim, pass)). Classifying it means reading the span.
//   REFUSE-SITE  — refuse(id, why) is the ACTION taken when a guard fails; the predicate is the
//                  ENCLOSING `if (…)` and is not in the span at all. A classifier that read the
//                  span would be reading the message string, not the predicate. Its ids also
//                  repeat across sites, so call sites and distinct legs are different units.
//
// The `g(` matcher must not require a quote after `(` in the BLANKED copy — blanking removes the
// quote, which is why drive2 reported `g( 0 legs` while 7 call sites existed. It matches on the
// blanked copy and then requires the quote in the ORIGINAL at the same offset, which is what
// distinguishes `g('C0', …)` (a leg) from `g(['log','-1'], …)` (my git helper).
const IDIOMS = [
  { idiom: 'check(',  kind: 'REGISTER',    re: /(?<![A-Za-z0-9_.$-])check\s*\(/g },
  { idiom: 'g(',      kind: 'REGISTER',    re: /(?<![A-Za-z0-9_.$])g\s*\(/g, firstArgIsString: true },
  { idiom: 'refuse(', kind: 'REFUSE-SITE', re: /(?<![A-Za-z0-9_.$-])refuse\s*\(/g },
];

const VERDICT_VOCAB = /\b(RED|REFUSED|GREEN)\b/;
const G_LITERAL = /['"`]G[A-Z][A-Z0-9]+['"`]/;

// Balanced-paren slicer. Parens are counted on the BLANKED copy (so a paren inside a comment or a
// string cannot move the depth); the returned text is cut from the ORIGINAL.
function spans(src, blanked, idiom, rel) {
  const found = [];
  const re = idiom.re;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(blanked))) {
    const open = blanked.indexOf('(', m.index);
    if (open < 0) { problems.push(`${rel}:${lineOf(src, m.index)} no open paren after match`); continue; }
    if (idiom.firstArgIsString && !/^\(\s*['"`]/.test(src.slice(open))) continue;
    let i = open + 1, depth = 1;
    while (i < blanked.length && depth > 0) {
      if (blanked[i] === '(') depth++;
      else if (blanked[i] === ')') depth--;
      i++;
    }
    if (depth !== 0) { problems.push(`${rel}:${lineOf(src, m.index)} unbalanced span`); continue; }
    const span = src.slice(m.index, i);
    const id = span.match(/^[A-Za-z0-9_]+\s*\(\s*['"`]([A-Za-z0-9_]+)['"`]/);
    const guard = idiom.kind === 'REFUSE-SITE' ? enclosingIf(src, blanked, m.index) : null;
    found.push({ id: id ? id[1] : null, span, line: lineOf(src, m.index), guard });
  }
  return found;
}

// For a REFUSE-SITE, the predicate is the enclosing `if (…)`. Walk back over the blanked copy:
// whitespace, then an optional `{`, then a `)` whose matching `(` is preceded by `if` (or
// `else if`). Anything else is published as null ⇒ UNMODELLED-PREDICATE, never as "no guard".
function enclosingIf(src, blanked, at) {
  let i = at - 1;
  while (i >= 0 && /\s/.test(blanked[i])) i--;
  if (blanked[i] === '{') { i--; while (i >= 0 && /\s/.test(blanked[i])) i--; }
  if (blanked[i] !== ')') return null;
  let depth = 1; let j = i - 1;
  while (j >= 0 && depth > 0) {
    if (blanked[j] === ')') depth++;
    else if (blanked[j] === '(') depth--;
    if (depth === 0) break;
    j--;
  }
  if (depth !== 0) return null;
  const before = blanked.slice(Math.max(0, j - 10), j).replace(/\s+$/, '');
  if (!/(?:^|[^A-Za-z0-9_$])if$/.test(before)) return null;
  return src.slice(j, i + 1);
}

// ──────────────────────────────────────────────────────────────────── walk the owned surface
const dirs = readdirSync(RES)
  .filter((d) => d.startsWith('unit-464') && statSync(join(RES, d)).isDirectory())
  .sort();

const mineAll = [];
for (const d of dirs) {
  const authors = g(['log', '--diff-filter=A', '--format=%an', '--', `docs/research/${d}`])
    .trim().split('\n').filter(Boolean);
  const oldest = authors[authors.length - 1] || '(none)';   // newest-first list ⇒ last is oldest
  if (/^Daedalus/.test(oldest)) mineAll.push(d);
}
const excluded = mineAll.filter((d) => d === SELF);
const mineDirs = mineAll.filter((d) => d !== SELF);

let nFiles = 0, blankWarn = [];
for (const dir of mineDirs) {
  const files = readdirSync(join(RES, dir)).filter((f) => f.endsWith('.mjs')).sort();
  for (const f of files) {
    nFiles++;
    const rel = `docs/research/${dir}/${f}`;
    const src = readFileSync(join(RES, dir, f), 'utf8');
    const blanked = blankNonCode(src);
    if (blanked.length !== src.length) blankWarn.push(`${rel}: length changed`);
    let bal = 0;
    for (const ch of blanked) { if (ch === '(') bal++; else if (ch === ')') bal--; }
    if (bal !== 0) blankWarn.push(`${rel}: blanked paren balance ${bal}`);
    const perIdiom = {};
    let total = 0;
    for (const id of IDIOMS) {
      const hits = spans(src, blanked, id, rel);
      perIdiom[id.idiom] = hits.length;
      total += hits.length;
      for (const h of hits) {
        if (h.id === null) { nonLiteralIds.push({ rel, line: h.line, idiom: id.idiom, span: h.span }); continue; }
        legs.push({ dir, file: f, rel, idiom: id.idiom, kind: id.kind, id: h.id, line: h.line, span: h.span, guard: h.guard });
      }
    }
    const hasSignal = VERDICT_VOCAB.test(src) || G_LITERAL.test(src);
    const kind = total > 0 ? 'MODELLED' : hasSignal ? 'UNMODELLED-FILE' : 'NON-HARNESS';
    fileRows.push({ rel, total, perIdiom, kind, hasSignal });
  }
}

// P1's comparison arm, out of the SAME walker: the naive line-based single-idiom selector, and the
// same selector with comments and literals blanked.
const lineBased = (() => {
  let naiveLegs = 0, blankedLegs = 0;
  const naiveFiles = new Set(), blankedFiles = new Set();
  for (const dir of mineDirs) {
    for (const f of readdirSync(join(RES, dir)).filter((x) => x.endsWith('.mjs'))) {
      const src = readFileSync(join(RES, dir, f), 'utf8');
      const nv = src.split('\n').filter((l) => /\bcheck\s*\(/.test(l)).length;
      const bl = blankNonCode(src).split('\n').filter((l) => /(?<![A-Za-z0-9_.$-])check\s*\(/.test(l)).length;
      if (nv > 0) naiveFiles.add(`${dir}/${f}`);
      if (bl > 0) blankedFiles.add(`${dir}/${f}`);
      naiveLegs += nv; blankedLegs += bl;
    }
  }
  return { naiveLegs, blankedLegs, naiveFiles: naiveFiles.size, blankedFiles: blankedFiles.size };
})();

const checkOnly = legs.filter((l) => l.idiom === 'check(');
const idiomTotals = {};
for (const { idiom } of IDIOMS) idiomTotals[idiom] = legs.filter((l) => l.idiom === idiom).length;
const legFiles = new Set(legs.map((l) => l.rel)).size;

// Call sites and distinct legs are different units: a REFUSE-SITE id repeats across sites.
const distinctKey = (l) => `${l.rel}#${l.id}`;
const distinct = [...new Set(legs.map(distinctKey))];
const distinctCheck = [...new Set(checkOnly.map(distinctKey))];
const unmodelledPredicate = legs.filter((l) => l.kind === 'REFUSE-SITE' && l.guard === null);

// ───────────────────────────────────────────────────────────────────────────────────── gates
const gates = [];
const check = (name, ok, note) => { gates.push({ name, ok: !!ok, note }); };

const porcelain = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
check('GLIVECLEAN', porcelain.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${porcelain.length} bytes`);

const idiomSum = Object.values(idiomTotals).reduce((a, b) => a + b, 0);
check('GIDIOM', idiomSum === legs.length && legs.length > 0,
  `per-idiom counts sum to the population: ${Object.entries(idiomTotals).map(([k, v]) => `${k}${v}`).join(' + ')} = ${idiomSum} vs ${legs.length} enumerated`);

check('GSPANOK', problems.length === 0,
  `every match sliced to a balanced span: ${problems.length} problem(s)${problems.length ? ' — ' + problems.join('; ') : ''}`);

check('GBLANK', blankWarn.length === 0,
  `blanking preserved length and left every file paren-balanced: ${blankWarn.length} warning(s)${blankWarn.length ? ' — ' + blankWarn.join('; ') : ''}`);

// GSELFEXCL is not vacuous: it reads the count of directories actually excluded, so it reddens
// if the exclusion stops matching (a renamed directory) as well as if it never matched.
check('GSELFEXCL', excluded.length === 1 && !mineDirs.includes(SELF),
  `this unit's own directory excluded from its own surface: ${excluded.length} excluded (${excluded.join(',') || 'none'}), ${mineAll.length} mine before exclusion, ${mineDirs.length} after`);

check('GREV', /^[0-9a-f]{40}$/.test(REV), `rev read and printed: ${REV.slice(0, 8)}`);

// GKPG — a known positive for the `g(` idiom, which drive2 reported as 0 legs while 7 call sites
// existed. Keyed on the file the idiom was hand-found in, not on a count I could re-type: if the
// matcher dies again (or blanking eats the quote again) this reddens.
const KP_G = 'docs/research/unit-464rec3-2026-11-01/grade-the-three-cures.mjs';
const kpGLegs = legs.filter((l) => l.rel === KP_G && l.idiom === 'g(');
check('GKPG', kpGLegs.length > 0,
  `the hand-found g( site is reached: ${kpGLegs.length} leg(s) in ${KP_G.replace('docs/research/', '')} [${kpGLegs.map((l) => l.id).join(',')}]`);

// GGUARD — every REFUSE-SITE either resolved its enclosing `if (…)` or is counted as
// UNMODELLED-PREDICATE. It may never be silently classified off its message string.
const refuseSites = legs.filter((l) => l.kind === 'REFUSE-SITE');
check('GGUARD', refuseSites.every((l) => l.guard !== null || unmodelledPredicate.includes(l)),
  `every refuse site has a resolved guard or is counted UNMODELLED-PREDICATE: ` +
  `${refuseSites.length} sites, ${refuseSites.filter((l) => l.guard !== null).length} resolved, ${unmodelledPredicate.length} unmodelled`);

check('GOWNED', mineDirs.length > 0 && mineDirs.length < dirs.length,
  `authorship selector partitions: ${mineDirs.length} mine of ${dirs.length} dirs`);

// The non-literal-id bucket is a property of the tree, not a slicer failure, so it is counted and
// must be accounted for — it may not silently shrink the denominator.
check('GACCOUNT', legs.length + nonLiteralIds.length === idiomSum + nonLiteralIds.length,
  `every idiom match is either a keyed leg or a counted NON-LITERAL-ID: ${legs.length} keyed + ${nonLiteralIds.length} non-literal`);

const gatesOk = gates.every((x) => x.ok);

// ──────────────────────────────────────────────────────────────────────────────────── output
console.log(`unit-464class — stage 1: the leg population and the idiom census`);
console.log(`  rev:      ${REV}`);
console.log(`  surface:  ${mineDirs.length} of ${dirs.length} unit-464* dirs are mine by oldest adding commit (own dir excluded); ${nFiles} .mjs in them`);
console.log('');
console.log('GATES');
for (const x of gates) console.log(`  ${x.name.padEnd(12)} ${x.ok ? 'ok ' : 'RED'} — ${x.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('A. P1 — THE SINGLE-IDIOM SELECTOR AGAINST THE IDIOM CENSUS');
console.log(`   line-based check(, raw source:   ${String(lineBased.naiveLegs).padStart(3)} sites across ${lineBased.naiveFiles} files   ← inflated by comment prose`);
console.log(`   line-based check(, blanked:      ${String(lineBased.blankedLegs).padStart(3)} sites across ${lineBased.blankedFiles} files`);
console.log(`   span-sliced check( only:         ${String(checkOnly.length).padStart(3)} sites across ${new Set(checkOnly.map((l) => l.rel)).size} files, ${distinctCheck.length} distinct legs`);
console.log(`   idiom census (all idioms):       ${String(legs.length).padStart(3)} sites across ${legFiles} files, ${distinct.length} distinct legs`);
for (const { idiom, kind } of IDIOMS) {
  const ls = legs.filter((l) => l.idiom === idiom);
  console.log(`       ${idiom.padEnd(9)} ${kind.padEnd(12)} ${String(ls.length).padStart(3)} sites across ${new Set(ls.map((l) => l.rel)).size} files, ` +
    `${[...new Set(ls.map(distinctKey))].length} distinct`);
}
const p1Sites = legs.length > checkOnly.length;
const p1Files = legFiles > new Set(checkOnly.map((l) => l.rel)).size;
const p1Distinct = distinct.length > distinctCheck.length;
console.log(`   P1 word: ${p1Sites && p1Files && p1Distinct ? 'LANDS  ' : 'REFUTED'} ` +
  `(strictly more in all three units — sites ${legs.length} > ${checkOnly.length}, ` +
  `files ${legFiles} > ${new Set(checkOnly.map((l) => l.rel)).size}, ` +
  `distinct legs ${distinct.length} > ${distinctCheck.length})`);
console.log('');

console.log('B. PER-FILE ACCOUNTING — the residual bucket is keyed positively');
const byKind = { MODELLED: 0, 'UNMODELLED-FILE': 0, 'NON-HARNESS': 0 };
for (const r of fileRows) byKind[r.kind]++;
console.log(`   MODELLED ${byKind.MODELLED} · UNMODELLED-FILE ${byKind['UNMODELLED-FILE']} · NON-HARNESS ${byKind['NON-HARNESS']}  (of ${nFiles})`);
for (const r of fileRows.filter((x) => x.kind !== 'NON-HARNESS').sort((a, b) => a.rel.localeCompare(b.rel))) {
  console.log(`   ${r.kind.padEnd(16)} ${String(r.total).padStart(2)} legs  ${r.rel.replace('docs/research/', '')}`);
}
console.log('   — UNMODELLED-FILE means: carries verdict vocabulary or a G-named literal, and no');
console.log('     recognised registration call. Its legs are NOT in the population below.');
console.log(`   — NON-LITERAL-ID matches (a leg whose id is computed, so the population cannot key it): ${nonLiteralIds.length}`);
for (const n of nonLiteralIds) console.log(`       ${n.rel.replace('docs/research/', '')}:${n.line}  ${JSON.stringify(n.span.slice(0, 60))}`);
console.log('');

console.log('C. THE ENUMERATED LEG POPULATION — no class printed, by design');
for (const l of legs) {
  console.log(`   ${l.id.padEnd(14)} ${l.kind.padEnd(12)} ${l.idiom.padEnd(8)}` +
    `${l.kind === 'REFUSE-SITE' ? (l.guard === null ? ' UNMODELLED-PREDICATE ' : ' guard-resolved     ') : '                    '}` +
    `${l.rel.replace('docs/research/', '')}:${l.line}`);
}
console.log('');
console.log(`LEGPOP/${legs.length}  ${legs.length} call sites, ${distinct.length} distinct legs, ${legFiles} files, ${mineDirs.length} dirs, rev ${REV.slice(0, 8)}`);

// The span dump is what the hand read works off. For a REFUSE-SITE the guard is printed above the
// span, because the span alone is the message string and classifying off it would be wrong.
const spanDump = legs.map((l) =>
  `──────── ${l.id}  ${l.kind}  ${l.idiom}  ${l.rel}:${l.line}\n` +
  (l.kind === 'REFUSE-SITE' ? `GUARD: ${l.guard === null ? '(UNMODELLED-PREDICATE)' : l.guard}\n` : '') +
  `${l.span}\n`).join('\n');
writeFileSync(join(OUT, 'legs.spans.txt'), `rev ${REV}\n${legs.length} call sites, ${distinct.length} distinct legs\n\n${spanDump}`);
console.log(`spans written: legs.spans.txt (${legs.length} spans)`);
