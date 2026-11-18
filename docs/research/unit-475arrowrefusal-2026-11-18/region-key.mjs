/**
 * The region key for unit-475arrowrefusal, in its own module so the arm and the diagnosis drive
 * share ONE copy of it rather than two that can drift. Extracted from the arm mid-fire, when the
 * second drive needed it: importing it out of the arm would have re-run the arm's 975-file census
 * and then hit the arm's `process.exit`.
 *
 * Conservative by construction: `<`/`>` are NOT tracked as brackets, so an arrow inside a generic
 * type argument (`Map<string, () => void>`) counts at depth 0 and the site is called ambiguous. The
 * failure direction is over-reporting ambiguity, never under-reporting it.
 */

import { braceSpanEnd } from '../../../scripts/lib/decl-body.mjs';

const TYPE_CONTINUATION = /[|&[,>)]/;

/**
 * Classify the annotation region of a declaration whose parameter list closes at `parenClose`.
 * Every path returns an explicit named bucket; there is no fall-through `else`, because a terminal
 * bucket reached by fall-through absorbs every blindness the scan has.
 *
 *   'no-annotation'          the `)` is not followed by `:` — not in the class at all
 *   'arrow-then-brace'       first depth-0 `=>` is immediately followed by the body `{` → RESOLVABLE
 *   'type-literal-then-body' a `{…}` in the annotation was a type literal, and a later arrow's `{`
 *                            is the body → RESOLVABLE
 *   'arrow-then-other'       first depth-0 `=>` is followed by something that is not `{` (a concise
 *                            body, or a function-type annotation) → AMBIGUOUS under this key
 *   'semicolon-at-depth-0'   an overload/ambient declaration — no body to find
 *   'no-depth-0-arrow'       the region never reaches a depth-0 `=>`
 *   'unbalanced'             a bracket or brace in the region never closes
 */
export const classifyAnnotation = (/** @type {string} */ code, /** @type {number} */ parenClose) => {
  let i = parenClose + 1;
  while (i < code.length && /\s/.test(code[i])) i++;
  if (code[i] !== ':') return { bucket: 'no-annotation', arrowAt: -1, bodyAt: -1 };

  let j = i + 1;
  let depth = 0;
  let hoppedTypeLiteral = false;
  while (j < code.length) {
    const c = code[j];
    // `=>` is read as ONE token. The existing non-arrow scan in decl-body.mjs decrements its depth
    // on this `>` (`:220`), which is P3.
    if (c === '=' && code[j + 1] === '>') {
      if (depth === 0) {
        let k = j + 2;
        while (k < code.length && /\s/.test(code[k])) k++;
        if (code[k] === '{') {
          // Is this `{` the body, or an object type returned by a function-type annotation?
          const end = braceSpanEnd(code, k);
          if (end === -1) return { bucket: 'unbalanced', arrowAt: j, bodyAt: -1 };
          let k2 = end + 1;
          while (k2 < code.length && /\s/.test(code[k2])) k2++;
          const afterIsArrow = code[k2] === '=' && code[k2 + 1] === '>';
          if (afterIsArrow || TYPE_CONTINUATION.test(code[k2] ?? '')) {
            hoppedTypeLiteral = true;
            j = end + 1;
            continue;
          }
          return {
            bucket: hoppedTypeLiteral ? 'type-literal-then-body' : 'arrow-then-brace',
            arrowAt: j, bodyAt: k,
          };
        }
        return { bucket: 'arrow-then-other', arrowAt: j, bodyAt: -1 };
      }
      j += 2;
      continue;
    }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === '{') {
      // A body cannot precede the arrow's own `=>`, so a `{` reached first is in the annotation.
      const end = braceSpanEnd(code, j);
      if (end === -1) return { bucket: 'unbalanced', arrowAt: -1, bodyAt: -1 };
      if (depth === 0) hoppedTypeLiteral = true;
      j = end + 1;
      continue;
    }
    else if (c === ';' && depth === 0) return { bucket: 'semicolon-at-depth-0', arrowAt: -1, bodyAt: -1 };
    j++;
  }
  return { bucket: 'no-depth-0-arrow', arrowAt: -1, bodyAt: -1 };
};
