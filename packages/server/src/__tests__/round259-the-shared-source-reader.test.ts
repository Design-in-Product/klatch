/**
 * Round 259 — coverage for `scripts/lib/strip-source.mjs`, the extracted source reader.
 *
 * The module is new to `scripts/lib` this round, and a new lib module with no test is how the
 * coverage floor in `probe-round245-…` loses a denominator quietly: arm A only breaks when a
 * *recorded* module loses its coverage, so an uncovered arrival passes every check while making the
 * ratio worse. My own Round 257 §"arm E" settled the rule this file is applying — **adding coverage
 * is not the success condition; adding guarded coverage is** — so the module is covered here and
 * recorded in `COVERED_FLOOR` in the same commit.
 *
 * ## What is worth asserting about a scanner that already has 213 checks on it
 *
 * `verify-tsx-guard.mjs` runs this reader over every module under `scripts/` on every invocation,
 * which is far more input than a unit test will ever supply. So this file deliberately does not
 * re-do that. It pins the three properties that the *consumers* depend on and that a well-meaning
 * edit to the scanner could break while leaving the verifier green:
 *
 * 1. **Length and line preservation.** Every consumer locates a site in the masked text and slices
 *    it out of the original. Theseus's Round 258 arm A2 established this as load-bearing and as the
 *    property that only one of the three readers in the tree had.
 * 2. **The two readings are the same scan.** `blankStrings` may change what a string body reads as
 *    and nothing else — if the two readings ever disagree about where a comment or a regex *ends*,
 *    two consumers of the same module can find a site in one reading and judge it by the other.
 * 3. **The cases the decision log says are the hard ones** — a regex body carrying a quote, a
 *    nested template inside `${…}`, `//` inside a string — since those are the three defects the
 *    module's history is made of, and a test that only covers the easy cases records that the file
 *    was visited, not that it works.
 */

import { describe, it, expect } from 'vitest';

// @ts-expect-error — plain ESM helper shared with scripts/, no types by design. One line because
// `@ts-expect-error` suppresses the next LINE, and a multi-line import reports at its specifier.
import { stripSource, regexLiteralEnd, REGEX_MAY_OPEN_AFTER } from '../../../../scripts/lib/strip-source.mjs';

/** Both readings, for the properties that must hold in each. */
const readings = [true, false] as const;

describe('Round 259 — strip-source, the properties every consumer depends on', () => {
  it('preserves length and line count in both readings', () => {
    const src = [
      "const A = 1; // tail",
      "/* two",
      "   lines */",
      "const B = `t ${ a.c }/${ a.s } t`;",
      "const C = /\\bhere(?:'s)\\b/i;",
      "const D = 'a\\'b // not a comment';",
      '',
    ].join('\n');
    for (const blank of readings) {
      const out = stripSource(src, blank);
      expect(out).toHaveLength(src.length);
      expect(out.split('\n')).toHaveLength(src.split('\n').length);
    }
  });

  it('the two readings differ only inside string bodies — never about where a span ends', () => {
    const src = "const A = 'xy'; // c\nconst B = /a'b/; const C = `t${1}t`;\n";
    const kept = stripSource(src, false);
    const blanked = stripSource(src, true);
    // Every position where they differ must be a position the kept reading calls a string body:
    // i.e. the blanked reading has a space there and the kept one does not.
    for (let i = 0; i < src.length; i += 1) {
      if (kept[i] !== blanked[i]) expect(blanked[i]).toBe(' ');
    }
    // And the comment is gone from both, which is the part that must NOT depend on the flag.
    expect(kept).not.toContain('// c');
    expect(blanked).not.toContain('// c');
  });
});

describe('Round 259 — the three defects this module is made of', () => {
  it('a regex body carrying an apostrophe does not open a string (Round 258 arm C2)', () => {
    // The shape live in `verify-filler-constraints.mjs`. A reader without a regex model treats the
    // apostrophe as a quote, and the line comment after it then survives into the code reading.
    const src = ["const RE = /\\bhere(?:'s)\\b/i;", '// const CAP = 1;', 'const CAP = 2;'].join('\n');
    const code = stripSource(src, false);
    expect(code).not.toContain('const CAP = 1;');
    expect(code).toContain('const CAP = 2;');
  });

  it('a template nested inside an interpolation does not close the outer one (Round 257)', () => {
    // The Round 257 defect in miniature: the inner backtick closed the outer template, the rest of
    // the line read as code, and `${x.c}/${x.s}` then looked like a regex opener. `MARK` sits in
    // template TEXT, so it must not survive the strings-blanked reading.
    const src = 'const t = `a ${ `${x.c}/${x.s}` } MARK b`; const n = 1 / 2;\n';
    expect(stripSource(src, true)).not.toContain('MARK');
    // …and the interpolation itself IS code, so what is inside `${ }` survives.
    expect(stripSource(src, true)).toContain('x.c');
  });

  it('`//` inside a string is not a comment, and an escaped quote does not close the string', () => {
    const src = "const U = 'http://x/y'; const N = 42;\nconst S = 'it\\'s // fine'; const M = 7;\n";
    for (const blank of readings) {
      const out = stripSource(src, blank);
      expect(out).toContain('const N = 42;');
      expect(out).toContain('const M = 7;');
    }
    // Strings kept means the URL is still readable; strings blanked means it is not.
    expect(stripSource(src, false)).toContain('http://x/y');
    expect(stripSource(src, true)).not.toContain('http://x/y');
  });

  it('a regex body is blanked in BOTH readings, so a quote inside one cannot leak out', () => {
    // This is what makes the verifier's parity precondition exact: every quote surviving the
    // strings-blanked reading is a real delimiter. A regex body that leaked its apostrophe would
    // desynchronise the scan for the rest of the file — the Round 131 defect.
    const src = "const R = /it's/; const N = 3;\n";
    for (const blank of readings) {
      expect(stripSource(src, blank)).not.toContain("it's");
      expect(stripSource(src, blank)).toContain('const N = 3;');
    }
  });
});

describe('Round 259 — the regex heuristic, in both of its error directions', () => {
  it('finds the end of a regex literal, and treats `/` inside a character class as ordinary', () => {
    // `/[/]/` is ONE literal, not two — the case the scanner keeps separate so the table can point
    // at it directly.
    const src = '/[/]/';
    expect(regexLiteralEnd(src, 0)).toBe(src.length);
  });

  it('declines rather than guessing when no literal closes on the line', () => {
    // Declining leaves the scan exactly as it was — an unrepaired instance of the old defect, never
    // a new one. That asymmetry is why the heuristic is allowed to exist at all.
    expect(regexLiteralEnd('/ not closed\n', 0)).toBe(-1);
    expect(regexLiteralEnd('//', 0)).toBe(-1);
  });

  it('does not read a division as a regex opener', () => {
    // The prev-token test admits only characters that cannot END an expression. Round 257 found the
    // argument around this was false for template text; inside real code it is what keeps `a / b`
    // and `f(x) / 2` from being stepped over.
    const src = 'const q = a / b; const r = f(x) / 2; const MARK = 1;\n';
    expect(stripSource(src, true)).toContain('MARK');
    expect(stripSource(src, true)).toContain('a / b');
  });

  it('the prev-token table is a character class, and a word-boundary opener is not in it', () => {
    // Pins the split between the two admission tests: punctuation lives in the regex, keywords in
    // the Set. A refactor that merged them would have to notice this.
    expect(REGEX_MAY_OPEN_AFTER.test('(')).toBe(true);
    expect(REGEX_MAY_OPEN_AFTER.test('}')).toBe(true);
    expect(REGEX_MAY_OPEN_AFTER.test('a')).toBe(false);
    expect(stripSource('const x = return /MARK/;\n', true)).not.toContain('MARK');
    expect(stripSource('const x = obj.in / 2 / 3; const MARK = 1;\n', true)).toContain('MARK');
  });
});
