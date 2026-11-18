/**
 * The shared answer to **'which bytes of this source are this declaration's BODY?'** — the
 * question 56 instruments in this corpus answer by hand with `indexOf('{')`, and that
 * **52 of them get wrong** on any declaration whose parameter list carries a brace.
 *
 * ## Why this module exists
 *
 * Three independent fires hit the same defect inside eighteen hours:
 *
 * - `unit-467importprice` (Theseus, 11/16): a **TS type literal** in the parameter list.
 * - `unit-468createlit` (Daedalus, 11/17): an **object default** (`= {}`) and an inline options
 *   type — two members silently fell out of a census population, which read `11/10/0` and looked
 *   clean.
 * - `unit-469braceslice` (Theseus, 11/17): the census of the mechanism. **62 brace-balance slicers
 *   in the tracked tree, 6 guarded, 52 not, 45 of the 52 LIVE** — and a third mechanism nobody had
 *   predicted: **JSDoc `@type` braces**, in `.mjs` files with no TypeScript annotations at all.
 *   `stripSource` in the sibling module here is declared exactly that way.
 *
 * His §2 is the reason this file exists rather than another lesson. `|GUARDED| = 6`, and **four of
 * the six predate both incidents and belong to the two seats that had them** — including two of
 * mine written three days before I wrote the unguarded form, one of them in the same directory on
 * the same day. A cure already in your own prior work that does not reach your next instrument is
 * not a knowledge gap; it is a default. `indexOf('{')` is the obvious way to find a body, and the
 * guard appears only when the author has just been bitten. So: a shared helper, and a detector that
 * reddens on the next hand-rolled one (`scripts/verify-decl-body-slicers.mjs`).
 *
 * ## What makes this reader right where the hand-rolled ones are wrong
 *
 * Two facts, in this order:
 *
 * 1. **The brace scan starts after the parameter list closes, never at the first `{`.** The
 *    parameter list is located by a paren-depth walk from the head's own `(`. This is the cure both
 *    bitten seats arrived at independently, and it covers all three known mechanisms.
 * 2. **Every depth walk runs over `stripSource(src, true)`** — comment *and* string bodies blanked,
 *    length preserved — and every slice is taken from the **original**. So a brace in a string, a
 *    brace in a trailing comment, and a brace in a JSDoc type annotation are all invisible to the
 *    walk while every offset still indexes the real source. Length-preservation is load-bearing;
 *    it is the property `strip-source.mjs`'s own header spends a paragraph on.
 *
 * Fact 2 is why this is a composition and not a fourth scanner: the corpus already had the shared
 * answer to 'which bytes are code?' and the hand-rolled slicers were not using it.
 *
 * ## Declared limits — forms this reader does NOT match
 *
 * Stated here rather than discovered by the next seat. `declHeads` matches `function` declarations
 * and `const`/`let`/`var` arrow or function-expression declarations with a **parenthesised**
 * parameter list, with optional `export`, `default`, `async` and a generic parameter list. It does
 * **not** match:
 *
 * - a single-identifier arrow with no parens (`const f = x => …`);
 * - class methods and object-literal methods (`foo() { … }`);
 * - a declaration whose head is split such that no `(` follows on the matched line.
 *
 * A **concise arrow body** (`const f = (a) => a + 1`) is matched as a head and returned with
 * `kind: 'concise'` and `bodyStart === null` — it has no brace-delimited body, and a consumer that
 * treats `null` as 'empty body' will under-report rather than mis-slice. Measured in
 * `docs/research/unit-470bodyslice-2026-11-17` leg A5: these forms are live in this corpus, which
 * is why they are declared instead of claimed.
 *
 * A head this reader matches but cannot resolve comes back as `kind: 'refused'` with a `reason` —
 * never a span running to end-of-file, and never dropped from the result. The refusable reasons are
 * `unbalanced-parameter-list`, `unbalanced-body-brace`, `declaration-without-a-body` (a TS overload
 * signature or an ambient declaration), `no-body-brace-after-the-parameter-list`,
 * `no-body-brace-after-the-return-type`, `unbalanced-brace-in-the-return-type`, and
 * `return-type-annotation-on-an-arrow-declaration` — the last because a depth-0 `=>` inside a
 * function-type return annotation is not distinguishable by character scan from the arrow's own.
 * A refusal under-reports visibly; a wrong span under-reports silently, and that is the whole
 * defect this module was routed to cure.
 */

// ONE EDIT TO THIS BLOB, DECLARED (unit-476phantomdenom, Theseus, 2026-11-18). Everything else in
// this file is `git show 7e8b4ab1^:scripts/lib/decl-body.mjs` byte for byte. The specifier was
// `'./strip-source.mjs'` and is re-pointed at the tracked module, for two reasons:
//   1. Vendoring a second copy of `strip-source.mjs` beside this one added a NEW unguarded
//      brace-balance slicer to the tree, and `scripts/verify-decl-body-slicers.mjs` reddened on it
//      in the pre-commit gate of this very unit — Daedalus's detector catching this seat's own new
//      file, one day after it caught his. The detector was right; the copy is gone.
//   2. `git log 7e8b4ab1^..HEAD -- scripts/lib/strip-source.mjs` is EMPTY, so the tracked module at
//      HEAD *is* the pre-cure module. Re-pointing holds strip-source constant and leaves
//      `decl-body` as the only variable between the two readers, which is what the unit wanted.
import { stripSource } from '../../../../scripts/lib/strip-source.mjs';

/** Thrown for a non-string source, rather than returning an empty span a key would read as zero. */
export class DeclBodyInputError extends TypeError {}

/**
 * The declaration heads this reader matches. Exported so a consumer censusing declarations shares
 * this key instead of writing a fifth one — a head regex that makes `function` optional matches
 * `if (`, `for (` and every statement-position call, which is how `unit-469braceslice`'s drive 2
 * came back green with a figure that was pure artefact.
 *
 * Group 1 is the declared name. The regex is `g`-flagged and `m`-anchored; callers must not rely on
 * its `lastIndex` across calls, so `declHeads` clones it per call.
 */
export const DECL_HEAD_SOURCE =
  '^[ \\t]*(?:export\\s+)?(?:default\\s+)?(?:async\\s+)?function\\s*\\*?\\s*([A-Za-z_$][\\w$]*)\\s*(?:<[^(){};]*>)?\\s*\\('
  + '|'
  + '^[ \\t]*(?:export\\s+)?(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=\\n]*)?=\\s*(?:async\\s+)?(?:function\\s*\\*?\\s*)?(?:<[^(){};]*>)?\\s*\\(';

const codeOf = (/** @type {unknown} */ src) => {
  if (typeof src !== 'string') {
    throw new DeclBodyInputError(
      `declBody: source must be a string, got ${src === null ? 'null' : `a ${typeof src}`}`
      + ' — a non-string source would slice to an empty span, and an empty span reads as a'
      + ' declaration with no body rather than as a refusal.',
    );
  }
  // Strings blanked as well as comments: a brace inside either must not move the depth count, and
  // `stripSource` returns a string of the SAME LENGTH, so every index below indexes `src` too.
  return stripSource(src, true);
};

/**
 * The index of the `)` closing the parameter list opened by the `(` at `open`, or `-1` if it never
 * closes. The walk is over code-only text; pass the stripped reading.
 */
export const parenSpanEnd = (/** @type {string} */ code, /** @type {number} */ open) => {
  if (code[open] !== '(') return -1;
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/**
 * The index of the `}` closing the block opened by the `{` at `open`, or `-1` if it never closes.
 * The walk is over code-only text; pass the stripped reading.
 */
export const braceSpanEnd = (/** @type {string} */ code, /** @type {number} */ open) => {
  if (code[open] !== '{') return -1;
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
};

/**
 * Every declaration head in `src`, in source order: `{ name, headStart, parenOpen }`.
 * `headStart` is the index of the match (line start, including indentation); `parenOpen` is the
 * index of the `(` that opens the parameter list.
 */
export const declHeads = (/** @type {unknown} */ src) => {
  const code = codeOf(src);
  const re = new RegExp(DECL_HEAD_SOURCE, 'gm');
  /** @type {{ name: string, headStart: number, parenOpen: number, isArrow: boolean }[]} */
  const out = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    const name = m[1] ?? m[2];
    if (!name) continue;
    const parenOpen = m.index + m[0].length - 1;
    // Group 2 is the `const`/`let`/`var` alternative: an arrow or function expression. The
    // distinction is load-bearing — a return-type annotation is skippable on a `function`
    // declaration and REFUSED on an arrow, because a depth-0 `=>` inside a function-type return
    // annotation is not distinguishable by character scan from the arrow's own.
    out.push({ name, headStart: m.index, parenOpen, isArrow: m[2] !== undefined });
    if (m[0].length === 0) re.lastIndex++; // defensive: a zero-length match cannot advance
  }
  return out;
};

/**
 * The body span of the declaration whose parameter list opens at `parenOpen`.
 *
 * Returns `null` when the parameter list does not close, or when a `{`-delimited body is opened and
 * never closed. Returns `kind: 'concise'` with `bodyStart === null` for an arrow whose body is an
 * expression. All indices index `src` itself; `params` and `body` are sliced from `src`, not from
 * the stripped reading, so the caller sees real source text.
 */
export const declBodyAt = (
  /** @type {unknown} */ src,
  /** @type {number} */ parenOpen,
  /** @type {{ isArrow?: boolean }} */ opts = {},
) => {
  const code = codeOf(src);
  const s = /** @type {string} */ (src);
  const isArrow = opts.isArrow === true;
  const parenClose = parenSpanEnd(code, parenOpen);
  if (parenClose === -1) {
    return {
      name: null, kind: /** @type {'refused'} */ ('refused'),
      reason: 'unbalanced-parameter-list',
      parenOpen, parenClose: -1, bodyStart: null, bodyEnd: null, params: '', body: null,
    };
  }

  const refuse = (/** @type {string} */ reason) => ({
    name: null, kind: /** @type {'refused'} */ ('refused'), reason,
    parenOpen, parenClose, bodyStart: null, bodyEnd: null,
    params: s.slice(parenOpen + 1, parenClose), body: null,
  });

  // THE FIRST CURE, and the one this module was routed for: the search for the body's opening brace
  // starts at `parenClose + 1`, past the parameter list — so a brace in the parameter list (a TS
  // type literal, an object default, a JSDoc `@type`) cannot be mistaken for the body's.
  let i = parenClose + 1;
  while (i < code.length && /\s/.test(code[i])) i++;

  // THE SECOND CURE — the mirror mechanism, found by this module's own first measurement and NOT
  // by either incident that routed it here. A brace-bearing RETURN TYPE sits between the parameter
  // list and the body, so a slicer that paren-matches the parameter list and then takes the first
  // `{` is *still* wrong. Live in this corpus at four sites named in
  // `docs/research/unit-470bodyslice-2026-11-17` leg A6 — among them
  // `packages/server/src/claude/client.ts`'s `assembleSystemPrompt(…): { prompt: string;
  // floorApplied: boolean } {`. All six files Theseus's census called GUARDED are exposed to it.
  //
  // The type region is skipped by the candidate rule: brace-match each `{` reached at bracket depth
  // 0, then look at what follows. A `{…}` followed by `{` or by type-continuation syntax
  // (`|`, `&`, `[`, `,`, `>`, `)`) was a type literal; anything else means that group WAS the body.
  if (code[i] === ':') {
    if (isArrow) return refuse('return-type-annotation-on-an-arrow-declaration');
    let j = i + 1;
    let depth = 0;
    let found = -1;
    while (j < code.length) {
      const c = code[j];
      if (c === '(' || c === '[' || c === '<') depth++;
      else if (c === ')' || c === ']' || c === '>') depth--;
      else if (c === ';' && depth === 0) return refuse('declaration-without-a-body');
      else if (c === '{' && depth === 0) {
        const end = braceSpanEnd(code, j);
        if (end === -1) return refuse('unbalanced-brace-in-the-return-type');
        let k = end + 1;
        while (k < code.length && /\s/.test(code[k])) k++;
        if (code[k] === '{' || /[|&[,>)]/.test(code[k] ?? '')) { j = end + 1; continue; }
        found = j;
        break;
      }
      j++;
    }
    if (found === -1) return refuse('no-body-brace-after-the-return-type');
    i = found;
  }

  // An arrow's `=>` sits between the head and the body; a `function` declaration's does not.
  if (code.startsWith('=>', i)) {
    i += 2;
    while (i < code.length && /\s/.test(code[i])) i++;
    if (code[i] !== '{') {
      return {
        name: null, kind: /** @type {'concise'} */ ('concise'), reason: null,
        parenOpen, parenClose, bodyStart: null, bodyEnd: null,
        params: s.slice(parenOpen + 1, parenClose), body: null,
      };
    }
  }
  if (code[i] !== '{') return refuse('no-body-brace-after-the-parameter-list');

  const bodyStart = i;
  const bodyEnd = braceSpanEnd(code, bodyStart);
  if (bodyEnd === -1) return refuse('unbalanced-body-brace');
  return {
    name: null, kind: /** @type {'block'} */ ('block'), reason: null,
    parenOpen, parenClose, bodyStart, bodyEnd,
    params: s.slice(parenOpen + 1, parenClose), body: s.slice(bodyStart, bodyEnd + 1),
  };
};

/**
 * Every declaration in `src` with its body span, in source order.
 *
 * **Nothing is dropped.** A head whose spans do not close, or whose form this reader refuses, comes
 * back with `kind: 'refused'`, a `reason`, and `body: null` — a population member that no key can
 * grade must still be visible to the census that walked it, which is why this never silently
 * shortens its own population.
 */
export const declBodies = (/** @type {unknown} */ src) => {
  const out = [];
  for (const h of declHeads(src)) {
    const b = declBodyAt(src, h.parenOpen, { isArrow: h.isArrow });
    out.push({ ...b, name: h.name, headStart: h.headStart, isArrow: h.isArrow });
  }
  return out;
};

/**
 * The body of the declaration named `name`, or `null` if it is not declared in `src`, is declared
 * in a form this reader does not match (see the declared limits above), or has a concise body.
 * The common shape for a census: `bodyOf(src, 'createGroundRulesPreset')?.includes('INSERT INTO')`.
 */
export const bodyOf = (/** @type {unknown} */ src, /** @type {string} */ name) => {
  for (const d of declBodies(src)) if (d.name === name) return d.body;
  return null;
};
