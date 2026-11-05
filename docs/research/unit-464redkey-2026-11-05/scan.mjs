// Shared lexical scanner for unit-464redkey.
//
// WHY THIS FILE EXISTS. probe-boundary's first run reported 13 of 65 arm-[3] sites as having "no
// locatable enclosing call", including one — round441…#1 — that is plainly inside
// `git('log', '--format=%H', REV, '--', r)`. Replaying the scanner over that file showed why:
// **paren depth 2 and a non-null quote state at EOF.** The scan had desynchronised, so every
// paren pair after the desync point was fiction. The cause is NESTED TEMPLATE LITERALS —
// `` `${x ? ` · y ${z}` : ''}` `` — where the inner backtick was read as closing the outer
// template, after which ordinary apostrophes in code became string openers.
//
// That is not a "13 sites I cannot see" problem. A scanner that desyncs produces WRONG pairs for
// the rest of the file, not missing ones, so the 44/8 agree/disagree split from that run was
// computed partly on fiction and is withdrawn rather than corrected.
//
// Two changes, and the second matters more than the first:
//   1. Template literals are tracked with their `${}` interpolation depth, so nesting works.
//   2. **An EOF sanity check.** Any file whose scan ends with a non-empty lexical stack or a
//      non-zero paren depth is UNSCANNABLE and is reported as such. It is never silently read.
//      A reader that cannot tell "no match here" from "my scan fell apart" is not a reader.
//
// THE GUARD IMMEDIATELY EARNED ITS KEEP, and this is the part worth reading. With (1) and (2) in
// place, the very first of my 7 sites — round435…#1 — REFUSED with `unclosedParens 1`. The cause
// was a third construct the scanner did not know: **REGEX LITERALS.** Line 560 of that file holds
// `if (/[{,]\s*(?:get |set |async |\*)?[A-Za-z_$][\w$]*\s*\(/.test(m)) {`, whose escaped `\(` was
// counted as a real open paren.
//
// That file is one of my 7, and P5ORDER had already reported GREEN at exactly 6/1 over it in
// drive3 and drive5 — on a pair table that was fiction past line 560. The figure happened to be
// right; it was not *measured* right, and nothing in those two drives could have told me which.
// Regex literals are now recognised, by the standard "a `/` in operand position starts a regex"
// rule, and the EOF guard stays — it is what found this, and the next unknown construct is the
// one it exists for.

// A `/` begins a regex literal when it sits in OPERAND position — i.e. the previous significant
// character cannot end an expression. Keywords that can be followed by a regex are listed because
// `return /re/` and `x = 1 / 2` are distinguished only by what precedes the slash.
const REGEX_OK_BEFORE = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '~', '^', '<', '>']);
const REGEX_OK_WORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do', 'else', 'yield', 'await', 'case']);

function startsRegex(src, slashIdx) {
  let j = slashIdx - 1;
  while (j >= 0 && /\s/.test(src[j])) j--;
  if (j < 0) return true;
  const c = src[j];
  if (REGEX_OK_BEFORE.has(c)) return true;
  if (/[\w$]/.test(c)) {
    let k = j;
    while (k >= 0 && /[\w$]/.test(src[k])) k--;
    return REGEX_OK_WORDS.has(src.slice(k + 1, j + 1));
  }
  return false;
}

// Consume a regex literal starting at `/`, character-class aware (a `/` inside `[...]` does not
// terminate it). Returns the index just past the closing `/` and its flags, or -1 if unterminated.
function skipRegex(src, i) {
  let j = i + 1;
  let inClass = false;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') { j += 2; continue; }
    if (c === '\n') return -1; // regex literals do not span lines
    if (inClass) { if (c === ']') inClass = false; }
    else if (c === '[') inClass = true;
    else if (c === '/') { j++; while (j < src.length && /[a-z]/.test(src[j])) j++; return j; }
    j++;
  }
  return -1;
}

export function scanParens(src) {
  const pairs = [];
  const parenStack = [];
  // lexical stack entries: {k:'s',q:char} string · {k:'t',braces:n} template · {k:'c'} block comment
  const lex = [];
  let i = 0;
  let unterminatedRegex = 0;

  const top = () => (lex.length ? lex[lex.length - 1] : null);

  while (i < src.length) {
    const c = src[i];
    const t = top();

    if (t && t.k === 'c') {
      if (c === '*' && src[i + 1] === '/') { lex.pop(); i += 2; continue; }
      i++; continue;
    }

    if (t && t.k === 's') {
      if (c === '\\') { i += 2; continue; }
      if (c === t.q) lex.pop();
      i++; continue;
    }

    if (t && t.k === 't') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`' && t.braces === 0) { lex.pop(); i++; continue; }
      if (c === '$' && src[i + 1] === '{') { t.braces++; i += 2; continue; }
      if (t.braces > 0) {
        // inside ${ ... }: real code, so parens, nested literals and regexes all count
        if (c === '}') { t.braces--; i++; continue; }
        if (c === '`') { lex.push({ k: 't', braces: 0 }); i++; continue; }
        if (c === '"' || c === "'") { lex.push({ k: 's', q: c }); i++; continue; }
        if (c === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); i = nl === -1 ? src.length : nl; continue; }
        if (c === '/' && src[i + 1] === '*') { lex.push({ k: 'c' }); i += 2; continue; }
        if (c === '/' && startsRegex(src, i)) {
          const end = skipRegex(src, i);
          if (end === -1) { unterminatedRegex++; i++; continue; }
          i = end; continue;
        }
        if (c === '(') { parenStack.push(i); i++; continue; }
        if (c === ')') { const o = parenStack.pop(); if (o !== undefined) pairs.push({ open: o, close: i }); i++; continue; }
      }
      i++; continue;
    }

    // top-level code
    if (c === '/' && src[i + 1] === '/') { const nl = src.indexOf('\n', i); i = nl === -1 ? src.length : nl; continue; }
    if (c === '/' && src[i + 1] === '*') { lex.push({ k: 'c' }); i += 2; continue; }
    if (c === '/' && startsRegex(src, i)) {
      const end = skipRegex(src, i);
      if (end === -1) { unterminatedRegex++; i++; continue; }
      i = end; continue;
    }
    if (c === '"' || c === "'") { lex.push({ k: 's', q: c }); i++; continue; }
    if (c === '`') { lex.push({ k: 't', braces: 0 }); i++; continue; }
    if (c === '(') { parenStack.push(i); i++; continue; }
    if (c === ')') { const o = parenStack.pop(); if (o !== undefined) pairs.push({ open: o, close: i }); i++; continue; }
    i++;
  }

  // THE GUARD. Not advisory — callers must honour it. An unterminated regex also counts as
  // unclean: it means startsRegex misfired on a division, and everything after it is suspect.
  const clean = lex.length === 0 && parenStack.length === 0 && unterminatedRegex === 0;
  return {
    pairs,
    clean,
    residue: { lex: lex.length, unclosedParens: parenStack.length, unterminatedRegex },
  };
}

// The innermost call expression whose balanced argument list contains [s,e).
// Returns null only when the scan was clean and no such call exists; an unclean scan must be
// handled by the caller BEFORE this is called.
export function enclosingInvocation(pairs, src, s, e) {
  const containing = pairs.filter((p) => p.open < s && p.close >= e).sort((a, b) => b.open - a.open);
  for (const p of containing) {
    const callee = /([A-Za-z_$][\w$]*)\s*$/.exec(src.slice(0, p.open));
    if (!callee) continue;
    return { name: callee[1], start: p.open, end: p.close, text: src.slice(p.open, p.close + 1) };
  }
  return null;
}

export const ARM3_RE = /--format=%[hH][\s\S]{0,240}?['"`]--['"`]/g;
