/**
 * Round 255 — `scripts/lib/probe-source-constants.mts` under `npm test`, and the defect that
 * brought it there.
 *
 * ## Why this file exists at all
 *
 * The module is the tenth of thirteen `scripts/lib` modules to come under the scheduled suite
 * (`probe-round245-the-shared-lib-coverage-floor.mts` measures the ratio; it read 9/13 before this
 * file and 10/13 after). It was the one I named as my next pick in Round 247 and again in
 * Round 251, and it sat undriven through three rounds.
 *
 * The denominator, measured rather than recalled, is the interesting half. "Uncovered" was true of
 * the *suite* and false of the module: `probe-round225-a-citation-is-not-a-call.mts` grades it with
 * 22 checks and `probe-round224-…` with 64. What had **no assertion anywhere** was:
 *
 * - `readNumericConstantFromFile` / `readLeadingFactorFromFile` — the file-reading wrappers. Two
 *   live probes call the first. **Nothing calls the second at all**: one occurrence in the repo,
 *   its own `export function` line. A dead export inside a module whose whole job is refusing to
 *   return a plausible wrong number.
 * - What either reader does when the constant it wants is **quoted in a comment** above the
 *   declaration — which is house style here, and appears four times in this module's own class
 *   comment.
 *
 * ## The defect, which composes into the bug the module exists to prevent
 *
 * Both readers took the first `const <name> = …` in **byte order**. On a file whose doc comment
 * says `const FINGERPRINT_LINE_CAP = 50 * 1000;` above the shipped `= 50_000;`:
 *
 * - `readNumericConstant` threw *"declared as a product"* — false; the shipped declaration is a
 *   bare value — and the throw text names `readLeadingFactor()` as the fix.
 * - `readLeadingFactor`, the call that throw recommends, returned **50**.
 *
 * That pair is the 2026-09-04 `probe-turncount-live-http` failure — a cap 1000× too small, no
 * throw, no warning — reached by a reader following this module's own advice. The rule the round
 * is for: **an error message that recommends a call is asserting something about what that call
 * will return, and is wrong in the same way a return value can be wrong.**
 *
 * And `replaceNumericConstant` — a write path into `packages/` — patched the comment, left the
 * code untouched, and **returned success**. Its two guards both passed: the no-op guard saw the
 * file change, and the "produced what was asked" guard re-read through the same first-match
 * reader and found what it had just written. *A verification that re-reads through the component
 * it is verifying cannot see that component's own error* — my Round 247 finding on
 * `probe-outcome.mts`, in a second module.
 *
 * Every arm below is two-sided where it can be: the assertion states what the repaired code does,
 * and the comment records what the pre-Round-255 code did, so a regression is legible as a
 * return to a named prior behaviour rather than as an unexplained red.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  maskComments,
  readNumericConstant,
  readLeadingFactor,
  readNumericConstantFromFile,
  readLeadingFactorFromFile,
  replaceNumericConstant,
} from '../../../../scripts/lib/probe-source-constants.mts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const SCANNER = path.join(REPO, 'packages/server/src/import/session-scanner.ts');
const IMPORT_ROUTE = path.join(REPO, 'packages/server/src/routes/import.ts');

/** The shape that motivated the round: a doc comment quoting an older spelling. */
const SHADOWED_BLOCK = [
  '/**',
  ' * History: this used to be spelled',
  ' *   const FINGERPRINT_LINE_CAP = 50 * 1000;',
  ' * which Round 225 found returned a prefix.',
  ' */',
  'const FINGERPRINT_LINE_CAP = 50_000;',
  '',
  'export function capInForce() { return FINGERPRINT_LINE_CAP; }',
].join('\n');

/** The same shape with a line comment, where the comment's number is wrong by 10x. */
const SHADOWED_LINE = [
  '// const MAX_IMPORT_SIZE = 5 * 1024 * 1024;  // was 5MB before 2026-04',
  'const MAX_IMPORT_SIZE = 50 * 1024 * 1024;',
].join('\n');

describe('Round 255 — the comment shadow, driven from both sides', () => {
  it('reads the code declaration, not the comment above it', () => {
    // Before Round 255: threw "FINGERPRINT_LINE_CAP is declared as a product — `50 * 1000`",
    // which is a false statement about a file whose declaration is `50_000`.
    expect(readNumericConstant(SHADOWED_BLOCK, 'FINGERPRINT_LINE_CAP', 't')).toBe(50_000);
  });

  it('refuses the leading factor of a bare value even when a comment offers a product', () => {
    // Before Round 255: returned 50 — and this is the call the throw above recommended, so the
    // two defects composed into the 2026-09-04 turncount bug, 1000x small and silent.
    expect(() => readLeadingFactor(SHADOWED_BLOCK, 'FINGERPRINT_LINE_CAP', 't'))
      .toThrow(/not a product, so it has no leading factor/);
  });

  it('takes the factor from the code line when a line comment shadows it', () => {
    // Before Round 255: 5, from the commented-out spelling. A 5MB cap read off a 50MB constant.
    expect(readLeadingFactor(SHADOWED_LINE, 'MAX_IMPORT_SIZE', 't')).toBe(50);
  });

  it('patches the code declaration and leaves the quoting comment alone', () => {
    // Before Round 255: the comment line became `= Number.MAX_SAFE_INTEGER;`, the code line kept
    // `50_000`, and the function returned success. This is a write path into packages/.
    const out = replaceNumericConstant(
      SHADOWED_BLOCK, 'FINGERPRINT_LINE_CAP', 'Number.MAX_SAFE_INTEGER', 't');

    const lines = out.split('\n');
    expect(lines[5]).toBe('const FINGERPRINT_LINE_CAP = Number.MAX_SAFE_INTEGER;');
    expect(lines[2]).toBe(' *   const FINGERPRINT_LINE_CAP = 50 * 1000;');
    // And the patched file reads back as the value asked for — the round trip, not just the bytes.
    expect(readNumericConstant(out.replace('Number.MAX_SAFE_INTEGER', '9_007_199'),
      'FINGERPRINT_LINE_CAP', 't')).toBe(9_007_199);
  });

  it('refuses a name that exists only inside comments rather than reading one', () => {
    const commentOnly = ['/**', ' * const GHOST_CAP = 7;', ' */', 'const OTHER = 1;'].join('\n');
    expect(() => readNumericConstant(commentOnly, 'GHOST_CAP', 't'))
      .toThrow(/only inside comments/);
    // Not the same refusal as "absent": a caller reading this message knows the name is in the
    // file and knows why the reader will not use it.
    expect(() => readNumericConstant(commentOnly, 'NOT_THERE_AT_ALL', 't'))
      .toThrow(/could not read NOT_THERE_AT_ALL from source/);
  });

  it('refuses two code declarations rather than preferring the first', () => {
    const twice = ['const CAP = 10;', 'if (x) { const CAP = 20; }'].join('\n');
    // Before Round 255: returned 10, silently, with no signal that a second existed.
    expect(() => readNumericConstant(twice, 'CAP', 't'))
      .toThrow(/declared 2 times outside comments \(lines 1, 2\)/);
  });
});

describe('Round 255 — maskComments, the mechanism, on its own', () => {
  it('preserves length and newlines so offsets and line numbers stay true', () => {
    const src = 'const A = 1; // tail\n/* two\n   lines */\nconst B = 2;\n';
    const masked = maskComments(src);
    expect(masked).toHaveLength(src.length);
    expect(masked.split('\n')).toHaveLength(src.split('\n').length);
  });

  it('masks both comment forms and nothing else', () => {
    const masked = maskComments('const A = 1; // nine\nconst B = /* mid */ 2;\n');
    expect(masked).toContain('const A = 1;');
    expect(masked).not.toContain('nine');
    expect(masked).not.toContain('mid');
    expect(masked).toContain('const B =');
  });

  it('does not treat // inside a string as a comment', () => {
    // A masker that did would hide the rest of the line and turn a correct read into a refusal.
    // Deliberately one line: with the declaration on the *next* line, a spurious line comment
    // ends at the newline and the arm passes against its own defect. It did, until the mutation
    // drive said so — see the writeup's "two vacuous arms".
    const src = 'const URL_BASE = "http://x"; const PORT_GUESS = 8080;';
    expect(maskComments(src)).toContain('const PORT_GUESS = 8080;');
    expect(readNumericConstant(src, 'PORT_GUESS', 't')).toBe(8080);
  });

  it('does not let an escaped quote close a string early', () => {
    // Same reason for one line: an early-closing string opens a spurious line comment, and the
    // damage stops at the newline. The declaration has to be inside the blast radius.
    const src = 'const S = \'it\\\'s // not a comment\'; const N = 42;';
    expect(readNumericConstant(src, 'N', 't')).toBe(42);
  });

  it('leaves string contents standing, so a quoted declaration is a second site, not a shadow', () => {
    // Deliberate: `${...}` can hold code, so masking template contents would hide declarations.
    // The multiplicity guard is what makes this loud instead of silently preferred.
    const src = ['const NEEDLE = `const CAP = 1;`;', 'const CAP = 2;'].join('\n');
    expect(() => readNumericConstant(src, 'CAP', 't')).toThrow(/declared 2 times outside comments/);
  });
});

describe('Round 255 — the file-reading wrappers, which nothing asserted before', () => {
  it('readNumericConstantFromFile reads the shipped cap out of the real scanner', () => {
    expect(readNumericConstantFromFile(SCANNER, 'FINGERPRINT_LINE_CAP', 't')).toBe(50_000);
  });

  it('readLeadingFactorFromFile reads the real import cap — its first caller in the repo', () => {
    // Zero call sites before this line: one occurrence repo-wide, its own `export function`.
    expect(readLeadingFactorFromFile(IMPORT_ROUTE, 'MAX_IMPORT_SIZE', 't')).toBe(50);
  });

  it('both wrappers agree with reading the file by hand', () => {
    const scannerSrc = fs.readFileSync(SCANNER, 'utf8');
    const importSrc = fs.readFileSync(IMPORT_ROUTE, 'utf8');
    expect(readNumericConstantFromFile(SCANNER, 'FINGERPRINT_LINE_CAP', 't'))
      .toBe(readNumericConstant(scannerSrc, 'FINGERPRINT_LINE_CAP', 't'));
    expect(readLeadingFactorFromFile(IMPORT_ROUTE, 'MAX_IMPORT_SIZE', 't'))
      .toBe(readLeadingFactor(importSrc, 'MAX_IMPORT_SIZE', 't'));
  });
});

describe('Round 255 — the two constants live callers actually scrape', () => {
  it('each is declared exactly once outside comments, so the multiplicity guard regresses nothing', () => {
    for (const [file, name] of [[SCANNER, 'FINGERPRINT_LINE_CAP'], [IMPORT_ROUTE, 'MAX_IMPORT_SIZE']] as const) {
      const masked = maskComments(fs.readFileSync(file, 'utf8'));
      const hits = masked.match(new RegExp(`const ${name}\\s*=\\s*[^;\\n]+`, 'g')) ?? [];
      expect(hits, `${path.basename(file)} declares ${name}`).toHaveLength(1);
    }
  });

  it('the values the callers depend on are unchanged by this round', () => {
    // Pinned on purpose, unlike the coverage floor: these two numbers are what ten probes compute
    // from. A bump to either is a real event and should redden here so it is read, not absorbed.
    expect(readNumericConstantFromFile(SCANNER, 'FINGERPRINT_LINE_CAP', 't')).toBe(50_000);
    expect(readLeadingFactorFromFile(IMPORT_ROUTE, 'MAX_IMPORT_SIZE', 't') * 1024 * 1024)
      .toBe(52_428_800);
  });
});
