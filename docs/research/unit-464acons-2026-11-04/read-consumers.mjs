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
// SCOPE: 'block' restricts the binding's uses to the enclosing function/block of its declaration.
// 'file' is drive1's behaviour, kept as a LIVE CRIPPLE: it counts a same-named binding declared in
// another function as a use of this site's binding. drive1.read.out is its recording.
const SCOPE = flag('scope', 'block');

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

// Mask strings, template literals and comments so brace-depth tracking is not fooled by `{` in a
// string or a `//` comment. Returns a same-length string with masked spans blanked.
function codeMask(src) {
  const out = src.split('');
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') { out[i] = ' '; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      out[i] = out[i + 1] = ' '; i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] !== '\n') out[i] = ' '; i++; }
      if (i < src.length) { out[i] = out[i + 1] = ' '; i += 2; }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      out[i] = ' '; i++;
      while (i < src.length) {
        if (src[i] === '\\') { out[i] = ' '; out[i + 1] = ' '; i += 2; continue; }
        if (src[i] === q) { out[i] = ' '; i++; break; }
        if (src[i] !== '\n') out[i] = ' ';
        i++;
      }
      continue;
    }
    i++;
  }
  return out.join('');
}

// Character range of the innermost brace block enclosing `idx`. Returns [start, end] of the block's
// interior, or the whole file when the declaration is at top level.
function enclosingBlock(mask, idx) {
  let depth = 0;
  let open = -1;
  for (let i = idx; i >= 0; i--) {
    const ch = mask[i];
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) { open = i; break; }
      depth--;
    }
  }
  if (open < 0) return [0, mask.length];
  let d = 0;
  for (let i = open; i < mask.length; i++) {
    if (mask[i] === '{') d++;
    else if (mask[i] === '}') { d--; if (d === 0) return [open, i]; }
  }
  return [open, mask.length];
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
  const backBase0 = Math.max(0, call.open - 600);
  const back = src.slice(backBase0, call.open);
  // Two defects drive2 had here, both found by reading the subjects directly:
  //   (a) `let raw;` hoisted, then `raw = git(...)` on a later line — a declaration-keyed regex
  //       cannot see it, and #6 came out "(inline — not bound)" with a FALSE ZERO use count;
  //   (b) `exec` returns the FIRST match, so an OUTER binding whose initializer encloses the call
  //       won it — #8 bound to `PRECURE_REV` instead of to `log`, the identifier the call's result
  //       is actually assigned to, and the reduction inside the IIFE was invisible.
  // Fixed by accepting a bare assignment and by taking the LAST (innermost) match.
  // The statement the call sits in: everything after the last `;`, `{` or `}` before it. That cut
  // is what makes the match innermost — an enclosing initializer is always separated from the call
  // by its own `{` when it is an IIFE, and by a `;` otherwise.
  let cut = -1;
  for (const ch of [';', '{', '}']) cut = Math.max(cut, back.lastIndexOf(ch));
  const stmt = back.slice(cut + 1);
  const declM = /(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*=\s*[A-Za-z_$][\w$.]*$/.exec(stmt);
  const binding = declM ? declM[1] : null;
  const declStartAbs = backBase0 + cut + 1;

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

  // downstream uses of the binding.
  //
  // Scoped to the enclosing block of the DECLARATION (SCOPE=block, the default), because `raw` is
  // re-declared in several of these files and a file-wide scan counts another function's `raw` as a
  // use of this one. Excluded: the declaration's own character range — not a +/-2 line window,
  // which hid consumers sitting on the line after the call's closing paren (drive1).
  let uses = [];
  let scopeFrom = 1;
  let scopeTo = src.split('\n').length;
  if (binding) {
    const mask = codeMask(src);
    const declStart = declStartAbs;
    const declEnd = semi < 0 ? call.close : semi;
    // Where the binding's SCOPE starts is not always where the call's statement is. `let raw;` at
    // function level, assigned inside a `try {}`, consumed after the `try` — block-scoping the
    // ASSIGNMENT site put #6's scope at lines 123-125 and its real consumer at 128 outside it, a
    // second false zero from the same hoisted pattern. Anchor on the hoisting declaration when the
    // statement is a bare assignment.
    const bareAssign = !/\b(?:const|let|var)\s/.test(stmt);
    let scopeAnchor = declStart;
    if (bareAssign) {
      const hoist = new RegExp(`\\b(?:let|var|const)\\s+${binding.replace(/\$/g, '\\$')}\\b`, 'g');
      let last = -1;
      for (const h of mask.matchAll(hoist)) if (h.index < declStart) last = h.index;
      if (last >= 0) scopeAnchor = last;
    }
    const [bFrom, bTo] = SCOPE === 'block' ? enclosingBlock(mask, scopeAnchor) : [0, src.length];
    const lineOf = (ci) => {
      let lo = 0, hi = starts.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= ci) lo = mid; else hi = mid - 1; }
      return lo + 1;
    };
    scopeFrom = lineOf(bFrom);
    scopeTo = lineOf(bTo);
    // Matched against the RAW source, not the mask: a use inside a template literal
    // (`${ADDED_BY}`) is a real consumption and the mask blanks it. The cost is that an
    // identifier named inside a comment or a plain string also matches; those are visible in the
    // printed use lines and were checked by hand.
    const re = new RegExp(`\\b${binding.replace(/\$/g, '\\$')}\\b`, 'g');
    uses = [...src.matchAll(re)]
      .filter((x) => x.index >= bFrom && x.index <= bTo)
      .filter((x) => x.index < declStart || x.index > declEnd)
      .map((x) => lineOf(x.index))
      .filter((no, i, a) => a.indexOf(no) === i)
      .map((no) => ({ no, text: src.split('\n')[no - 1] }));
  }

  // Consumer-side markers, ANCHORED ON THE BINDING'S OWN METHOD CHAIN.
  //
  // drive3's `lengthRead` was keyed on the token `.length` appearing anywhere on a use line, so
  // `raw.split('\n').find((l) => l.trim().length > 0)` read as a length read of the SELECTION when
  // the `.length` belongs to the lambda's parameter. The chain walker below skips every
  // parenthesised argument whole, so a marker inside a lambda body cannot be mistaken for a marker
  // applied to the selection.
  const chainsFor = (text, ident) => {
    const out = [];
    const re = new RegExp(`\\b${ident.replace(/\$/g, '\\$')}\\b`, 'g');
    for (const m of text.matchAll(re)) {
      let i = m.index + ident.length;
      // the binding may sit inside a parenthesised expression: `(log ?? '').trim()...`
      if (text[i] !== '.' && text[i] !== '[') {
        const openParen = text.lastIndexOf('(', m.index);
        if (openParen >= 0) {
          const close = balancedFrom(text, openParen);
          if (close > m.index) i = close + 1;
        }
      }
      const segs = [];
      while (i < text.length) {
        if (text[i] === '.') {
          const sm = /^\.(\w+)/.exec(text.slice(i));
          if (!sm) break;
          i += sm[0].length;
          if (text[i] === '(') {
            const c = balancedFrom(text, i);
            if (c < 0) break;
            segs.push(`.${sm[1]}(`);
            i = c + 1;
          } else segs.push(`.${sm[1]}`);
        } else if (text[i] === '[') {
          const c = balancedFrom(text, i);
          if (c < 0) break;
          segs.push(text.slice(i, c + 1).replace(/\s+/g, ''));
          i = c + 1;
        } else break;
      }
      out.push(segs);
    }
    return out;
  };

  const useText = uses.map((u) => u.text).join('\n');
  const chains = binding ? chainsFor(useText + '\n' + tail, binding) : [];
  const SINGLE = ['[0]', '.find(', '.pop(', '.shift(', '.at('];
  const FANOUT = ['.forEach(', '.filter(', '.map(', '.reduce(', '.sort('];
  const chainTakesOne = (segs) => segs.some((s) => SINGLE.includes(s));
  const chainFansOut = (segs) => segs.some((s) => FANOUT.includes(s)) && !chainTakesOne(segs);
  const useMarkers = [...new Set(chains.flat())];
  const ofLoop = binding
    ? new RegExp(`\\bfor\\s*\\([^)]*\\bof\\s+${binding.replace(/\$/g, '\\$')}\\b`).test(useText)
    : false;
  const singleRecord = chains.some(chainTakesOne) || /\[\s*0\s*\]|\.find\s*\(|\.pop\s*\(/.test(tail);
  const lengthRead = chains.some((segs) => segs.includes('.length'));
  const iterated = ofLoop || chains.some(chainFansOut);

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
    singleRecord,
    iterated,
    lengthRead,
    callText,
    scopeFrom,
    scopeTo,
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
  console.log(`    scope      ${SCOPE}  lines ${r.scopeFrom}-${r.scopeTo}`);
  console.log(`    use lines  ${r.uses.length}`);
  for (const u of r.uses.slice(0, 14)) {
    console.log(`      ${String(u.no).padStart(4)}: ${u.text.trim().slice(0, 150)}`);
  }
  if (r.uses.length > 14) console.log(`      … ${r.uses.length - 14} more`);
  console.log(`    chain      ${r.useMarkers.join(' ') || '(none)'}`);
  console.log(`    singleRecord=${r.singleRecord} iterated=${r.iterated} lengthRead=${r.lengthRead}`);
  if (CRIPPLE === 'callshapeonly') {
    console.log(`    CRIPPLE callshapeonly -> ${crippleCallShapeOnly(r)}`);
  }
}

console.log('');
console.log('=== MECHANICAL COUNTS (no class, no flip) ===');
const nBound = results.filter((r) => r.binding).length;
const nDir = results.filter((r) => r.dirShaped || r.pathArity > 1).length;
const nSingleTake = results.filter((r) => r.singleRecord).length;
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
  const single = r.singleRecord;
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
