#!/usr/bin/env node
// read-consumers.mjs — unit-464acons, Theseus, 2026-11-04 STOP fire.
//
// Reads, for each CLASS=A site in HAND-ARM3.tsv, the enclosing call at the pin, the identifier the
// call's result is bound to, and the downstream uses of that identifier in the same file.
//
// IT CONTAINS NO CLASSIFIER AND EMITS NO CLASS. Its output is a TSV skeleton plus a per-site
// listing. The A_HOLDS / WHY columns are left EMPTY for the hand read, which is filed in its own
// commit before any grader in this unit exists.
//
// Every git read pins -C <toplevel> and an explicit rev. No worktree reads, no relative pathspecs.
// Child stderr is captured, never inherited.
//
// REFUSES (exit 2, `REFUSE:` line, no FLIPS= line, no counts) when:
//   - the pin does not resolve
//   - any subject source reads empty
//   - the enclosing call cannot be located for any site
//   - the A-row count read out of HAND-ARM3.tsv is not 8
// A reader that scored 0 on unread sources would publish a false GREEN on P6CRIPPLE and a false RED
// on P1AFLIP at the same time. See PRE-REGISTRATION P7REFUSE.

import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const flag = (n, d) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const PIN = flag('pin', '0ae48068');
const TABLE_REV = flag('table-rev', '721fb5b4');
const CRIPPLE = flag('cripple', 'none');

const TOP = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

function refuse(why) {
  console.log(`REFUSE: ${why}`);
  process.exit(2);
}

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', TOP, ...args], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    if (allowFail) return null;
    refuse(`git ${args.slice(0, 3).join(' ')} failed, status ${e.status}`);
  }
}

// ---- pin -------------------------------------------------------------------
const pinFull = git(['rev-parse', '--verify', `${PIN}^{commit}`], { allowFail: true });
if (pinFull === null) refuse(`pin ${PIN} does not resolve`);
const tableFull = git(['rev-parse', '--verify', `${TABLE_REV}^{commit}`], { allowFail: true });
if (tableFull === null) refuse(`table rev ${TABLE_REV} does not resolve`);

console.log(`read-consumers — unit-464acons`);
console.log(`  pin        ${pinFull.trim()}  (${PIN})`);
console.log(`  table rev  ${tableFull.trim()}  (${TABLE_REV})`);
console.log(`  cripple    ${CRIPPLE}`);
console.log(`  toplevel   ${TOP}`);
console.log('');

// ---- the 8, CAPTURED from HAND-ARM3.tsv, not retyped ------------------------
const TABLE_REL = 'docs/research/unit-464addarm-2026-11-04/HAND-ARM3.tsv';
const tableSrc = git(['show', `${TABLE_REV}:${TABLE_REL}`]);
if (!tableSrc || !tableSrc.trim()) refuse(`${TABLE_REL} reads empty at ${TABLE_REV}`);

const tableRows = tableSrc
  .split('\n')
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter((c) => c[0] !== 'site_id'); // drop the header BY NAME, never by position

const COL = { site: 0, lines: 5, cls: 6, consumer: 7 };
const sites = tableRows
  .filter((c) => (c[COL.cls] || '').trim() === 'A')
  .map((c) => {
    const id = c[COL.site].trim();
    const hash = id.lastIndexOf('#');
    const rel = 'docs/research/' + id.slice(0, hash);
    const [a, b] = c[COL.lines].trim().split('-').map(Number);
    return { id, rel, lineFrom: a, lineTo: b, handConsumer: (c[COL.consumer] || '').trim() };
  });

if (sites.length !== 8) refuse(`expected 8 CLASS=A rows in HAND-ARM3.tsv, read ${sites.length}`);
console.log(`A rows captured from ${TABLE_REL}: ${sites.length}`);
console.log('');

// ---- call extraction -------------------------------------------------------
// Find every call-expression opening in the source, paren-balance it, and pick the one whose
// character span contains the start of the site's line range.
const OPENERS = /\b(git|gitLines|gitOrNull|sh|run|execFileSync|execSync)\s*\(/g;

function balancedFrom(src, openIdx) {
  // openIdx points at the '(' of the call
  let depth = 0;
  let i = openIdx;
  let q = null;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '\\') { i++; continue; }
      if (ch === q) q = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function lineStarts(src) {
  const out = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') out.push(i + 1);
  return out;
}

const results = [];

for (const s of sites) {
  const src = git(['show', `${PIN}:${s.rel}`]);
  if (!src || !src.trim()) refuse(`${s.rel} reads empty at ${PIN}`);
  const starts = lineStarts(src);
  if (s.lineFrom > starts.length) refuse(`${s.id}: line ${s.lineFrom} past EOF at ${PIN}`);
  const spanStart = starts[s.lineFrom - 1];
  const spanEnd = (starts[s.lineTo] ?? src.length) - 1;

  // enclosing call
  let call = null;
  OPENERS.lastIndex = 0;
  let m;
  while ((m = OPENERS.exec(src)) !== null) {
    const open = src.indexOf('(', m.index + m[1].length - 1);
    if (open < 0) continue;
    const close = balancedFrom(src, open);
    if (close < 0) continue;
    if (open <= spanEnd && close >= spanStart) {
      // innermost enclosing wins: an enclosing call absorbs its inner call's argv
      if (call === null || open > call.open) call = { fn: m[1], open, close };
    }
  }
  if (call === null) refuse(`${s.id}: no enclosing call located at ${PIN} for lines ${s.lineFrom}-${s.lineTo}`);

  const callText = src.slice(call.open - call.fn.length, call.close + 1);
  const callLine = starts.findIndex((p) => p > call.open); // 1-based line of the '('
  const callLineNo = callLine === -1 ? starts.length : callLine;

  // flags
  const flags = [...callText.matchAll(/'(--[a-z][a-z0-9-]*(?:=[^']*)?)'/g)].map((x) => x[1]);

  // pathspec: everything after the '--' separator argument
  const sep = callText.indexOf("'--'");
  let pathspec = [];
  if (sep >= 0) {
    const after = callText.slice(sep + 4);
    pathspec = [...after.matchAll(/'([^']*)'|`([^`]*)`|([A-Za-z_$][\w$.]*)/g)]
      .map((x) => x[1] ?? x[2] ?? x[3])
      .filter((t) => t && t !== ',' && !/^[\]\)]/.test(t));
  }
  // arity: how many pathspec operands, and does any look directory-shaped
  const pathArity = pathspec.length;
  const dirShaped = pathspec.some((p) => p.endsWith('/'));

  // statement containing the call -> binding
  let stmtStart = src.lastIndexOf('\n', call.open);
  // walk back over continuation: find nearest preceding ';' or '{' or line that starts a decl
  const back = src.slice(Math.max(0, call.open - 600), call.open);
  const declM = /(?:^|[\n;{}])\s*(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;]*$/.exec(back);
  const binding = declM ? declM[2] : null;

  // reduction: text from the call's close to end of statement
  const semi = src.indexOf(';', call.close);
  const tail = src.slice(call.close + 1, semi < 0 ? call.close + 120 : semi);
  const REDUCERS = [
    ["[0]", /\[\s*0\s*\]/],
    [".find(", /\.find\s*\(/],
    [".pop()", /\.pop\s*\(/],
    [".shift()", /\.shift\s*\(/],
    [".at(", /\.at\s*\(/],
    [".length", /\.length\b/],
    [".split", /\.split\s*\(/],
    [".trim", /\.trim\s*\(/],
    [".filter(", /\.filter\s*\(/],
    [".map(", /\.map\s*\(/],
  ];
  const tailReducers = REDUCERS.filter(([, re]) => re.test(tail)).map(([n]) => n);

  // downstream uses of the binding, excluding its own declaration line
  let uses = [];
  if (binding) {
    const re = new RegExp(`\\b${binding.replace(/\$/g, '\\$')}\\b`);
    const lines = src.split('\n');
    const declLine = callLineNo;
    uses = lines
      .map((text, i) => ({ no: i + 1, text }))
      .filter((r) => re.test(r.text))
      .filter((r) => r.no < s.lineFrom - 2 || r.no > s.lineTo + 2)
      .filter((r) => r.no !== declLine);
  }

  // consumer-side markers, read off the USE lines only (not off the declaration)
  const useText = uses.map((u) => u.text).join('\n');
  const useMarkers = REDUCERS.filter(([, re]) => re.test(useText)).map(([n]) => n);
  const iterated = /\bfor\s*\(\s*(?:const|let|var)?\s*[^)]*\bof\b/.test(useText)
    || /\.forEach\s*\(/.test(useText)
    || /\.filter\s*\(/.test(useText)
    || /\.map\s*\(/.test(useText);
  const lengthRead = /\.length\b/.test(useText) || /\.length\b/.test(tail);

  results.push({
    ...s,
    fn: call.fn,
    callLineNo,
    flags,
    pathspec,
    pathArity,
    dirShaped,
    binding,
    tailReducers,
    uses,
    useMarkers,
    iterated,
    lengthRead,
    callText,
  });
}

// ---- cripple: callshapeonly ------------------------------------------------
// Classifies from the enclosing call's FLAGS alone, which is exactly what the original hand read
// did. It is given no access to binding, uses, pathspec arity or reduction.
function crippleCallShapeOnly(r) {
  const addish = r.flags.includes('--diff-filter=A') || r.flags.includes('--reverse');
  return addish ? 'A' : 'R';
}

// ---- output ----------------------------------------------------------------
console.log('=== PER-SITE LISTING (source-derived; no class emitted) ===');
for (const r of results) {
  console.log('');
  console.log(`--- ${r.id}`);
  console.log(`    lines ${r.lineFrom}-${r.lineTo}   call fn \`${r.fn}(\` at line ${r.callLineNo}`);
  console.log(`    flags      ${r.flags.join(' ') || '(none)'}`);
  console.log(`    pathspec   [${r.pathspec.join(' | ')}]  arity=${r.pathArity} dirShaped=${r.dirShaped}`);
  console.log(`    binding    ${r.binding ?? '(inline — not bound)'}`);
  console.log(`    tail       ${r.tailReducers.join(' ') || '(none)'}`);
  console.log(`    use lines  ${r.uses.length}`);
  for (const u of r.uses.slice(0, 14)) {
    console.log(`      ${String(u.no).padStart(4)}: ${u.text.trim().slice(0, 150)}`);
  }
  if (r.uses.length > 14) console.log(`      … ${r.uses.length - 14} more`);
  console.log(`    use markers ${r.useMarkers.join(' ') || '(none)'}  iterated=${r.iterated} lengthRead=${r.lengthRead}`);
  if (CRIPPLE === 'callshapeonly') {
    console.log(`    CRIPPLE callshapeonly -> ${crippleCallShapeOnly(r)}`);
  }
}

console.log('');
console.log('=== MECHANICAL COUNTS (no class, no flip) ===');
const nBound = results.filter((r) => r.binding).length;
const nDir = results.filter((r) => r.dirShaped || r.pathArity > 1).length;
const nSingleTake = results.filter((r) => {
  const all = [...r.tailReducers, ...r.useMarkers];
  return all.some((m) => m === '[0]' || m === '.find(' || m === '.pop()' || m === '.shift()' || m === '.at(');
}).length;
const nLength = results.filter((r) => r.lengthRead || r.iterated).length;
console.log(`  BOUND_TO_IDENT   ${nBound} of ${results.length}`);
console.log(`  MULTIPATH_OR_DIR ${nDir} of ${results.length}`);
console.log(`  SINGLE_RECORD    ${nSingleTake} of ${results.length}`);
console.log(`  WHOLE_SELECTION  ${nLength} of ${results.length}   (length read or iterated, at the USE lines)`);

if (CRIPPLE === 'callshapeonly') {
  const flips = results.filter((r) => crippleCallShapeOnly(r) !== 'A').length;
  console.log(`  CRIPPLE_FLIPS    ${flips} of ${results.length}`);
}

console.log('');
console.log('=== TSV SKELETON (A_HOLDS and WHY intentionally EMPTY — for the hand read) ===');
console.log(['site_id', 'call_fn', 'flags', 'path_arity', 'dir_shaped', 'binding', 'single_record', 'whole_selection', 'A_HOLDS', 'WHY'].join('\t'));
for (const r of results) {
  const all = [...r.tailReducers, ...r.useMarkers];
  const single = all.some((m) => ['[0]', '.find(', '.pop()', '.shift()', '.at('].includes(m));
  console.log([
    r.id,
    r.fn,
    r.flags.join(' '),
    r.pathArity,
    r.dirShaped,
    r.binding ?? '-',
    single,
    r.lengthRead || r.iterated,
    '',
    '',
  ].join('\t'));
}
