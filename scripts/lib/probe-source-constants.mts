/**
 * Read a shipped numeric constant out of `packages/` source — separator-tolerantly, and
 * refusing to guess which unit convention the call site meant.
 *
 * ## Why this exists
 *
 * Several probes deliberately scrape a constant from source rather than importing it, so that a
 * bump in `packages/` cannot stale the probe. Good instinct. Every one of them hand-rolled the
 * regex, and every one of them wrote `(\d+)`.
 *
 * On **2026-09-04** (`18d46318`, "cap ruled removed (xian 9/4) + CI landed") the shipped cap
 * became `const FINGERPRINT_LINE_CAP = 50_000;`. A JavaScript numeric separator. `\d+` cannot
 * match it, and the two probes that read that constant failed in **two different ways from the
 * one change**:
 *
 * | probe | regex | what happened |
 * |---|---|---|
 * | `probe-browse-latency-end-to-end` | `= (\d+);` | no match → `throw` → **dead on arrival since 2026-09-04** |
 * | `probe-turncount-live-http` | `= (\d+)` (no `;`) | matched `50` out of `50_000` → **ran, silently, with a cap 1000× too small** |
 *
 * The stricter regex failed loudly and the looser one failed silently, and the silent one is
 * the worse outcome: `probe-turncount-live-http` printed *"no session in the corpus exceeds the
 * 50-line cap"* — a claim about a 50-line cap that no reader would believe — attached to a
 * conclusion that was, underneath, correct.
 *
 * **The rule: a probe that scrapes a constant to avoid going stale must not be defeated by the
 * constant being reformatted.** `50000`, `50_000`, `5e4` and `0xC350` are the same number; a
 * probe that reads source is asserting a fact about a value, not about its spelling. All four
 * spellings are read correctly here — see {@link readNumericConstant}.
 *
 * ## Two unit conventions, and why they are two functions
 *
 * The first version of this module (Round 224) had one reader, whose terminator class included
 * `*`. That was not an oversight — it is what three real callers need. `routes/import.ts` ships
 *
 * ```ts
 * const MAX_IMPORT_SIZE = 50 * 1024 * 1024;
 * ```
 *
 * and `probe-import-large-session`, `probe-import-multipart-cap` and
 * `probe-accepted-multipart-allocation` each read the **leading factor** `50` and multiply it
 * back up themselves. For them, `50` is the right answer.
 *
 * Theseus drove this in Round 225 and found what the `*` terminator costs: on
 * `const FINGERPRINT_LINE_CAP = 50 * 1000;` the same call returned **`50`** — a prefix, silently,
 * 1000× small. *The last two rows are the same call returning the same number, once right and
 * once wrong.* Two unit conventions had merged into one function, and nothing at either call
 * site recorded which one it wanted.
 *
 * The failure is **symmetric**, which is the half that is easy to miss. Spell the MB constant as
 * a whole number — `const MAX_IMPORT_SIZE = 52_428_800;` — and the old reader returned
 * `52428800` to three callers who each multiply by `1024 * 1024`, computing a **50 TB** cap for a
 * 50 MB one, with every arm still green.
 *
 * So the convention now lives at the call site, in the name of the function called:
 *
 * | the call site wants | function | on the other convention |
 * |---|---|---|
 * | the value of the constant | {@link readNumericConstant} | **throws** on a product |
 * | the leading factor of a product | {@link readLeadingFactor} | **throws** on a bare value |
 *
 * Each refuses the other's spelling rather than returning a plausible wrong number. A probe that
 * wants `50000` and meets `50 * 1000` gets a throw naming `readLeadingFactor`; a probe that wants
 * `50` and meets `52_428_800` gets a throw naming `readNumericConstant`. Both reformattings that
 * used to be silent are now loud, and the cost of a throw is one edit by someone who is already
 * reading the line.
 *
 * ## Fail loudly, never partially
 *
 * These readers throw when they cannot find the constant, and throw when the declaration is
 * spelled in the convention they do not serve. **They never return a prefix of the declaration**
 * — unconditionally, for every spelling, which is the property Round 225 graded the first version
 * against and found wanting. Given the choice the two 2026-09-04 probes demonstrate, loud is
 * strictly better: a dead probe gets fixed and a quietly wrong one gets cited.
 */

import fs from 'fs';

/** Longest initialiser we will look at; a declaration is one line by convention here. */
const INITIALISER = (name: string) => new RegExp(`const ${name}\\s*=\\s*([^;\\n]+)`);

/**
 * Pull the raw initialiser text for `const <name> = …`, trimmed of trailing punctuation and of a
 * widening-suppression suffix. Returns `null` when the constant is not declared in `src`.
 *
 * Kept deliberately dumb: it does not decide what the text *means*. That is the caller's job,
 * because the two callers below mean different things by the same bytes.
 */
function initialiserOf(src: string, name: string): string | null {
  const m = src.match(INITIALISER(name));
  if (!m) return null;
  return m[1]
    .replace(/\bas\s+const\b/, '')   // `50_000 as const`
    .replace(/[,)\]}]+\s*$/, '')     // `const X=7,` / `const X = 12 )`
    .trim();
}

/** Every numeric literal spelling we accept, as a whole initialiser. Separators stripped. */
function literalValue(text: string): number | null {
  const t = text.replace(/_/g, '');
  const ok =
    /^[+-]?\d+$/.test(t) ||                              // 50000
    /^[+-]?0[xX][0-9a-fA-F]+$/.test(t) ||                // 0xC350
    /^[+-]?0[bB][01]+$/.test(t) ||                       // 0b…
    /^[+-]?0[oO][0-7]+$/.test(t) ||                      // 0o…
    /^[+-]?(\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(t) ||    // 5e4
    /^[+-]?(\d+\.\d*|\.\d+)$/.test(t);                   // 1.5
  if (!ok) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

/** Split a product initialiser into its literal operands, or `null` if it is not a pure product. */
function productOperands(text: string): number[] | null {
  if (!text.includes('*')) return null;
  const parts = text.split('*').map((p) => p.trim());
  if (parts.length < 2) return null;
  const values = parts.map(literalValue);
  return values.every((v): v is number => v !== null) ? values : null;
}

function notFound(name: string, what: string): Error {
  return new Error(
    `${what}: could not read ${name} from source — the probe cannot proceed safely. ` +
    `It scrapes this constant so a bump in packages/ cannot stale it; if the declaration was ` +
    `reformatted (a numeric separator, an expression, a move), fix the reader in ` +
    `scripts/lib/probe-source-constants.mts rather than hardcoding the value here.`);
}

/**
 * Find `const <name> = <number>` in `src` and return **the value of the constant**, tolerating
 * `_` separators, hex, binary, octal and exponent spellings.
 *
 * Throws — rather than returning the leading factor — when the declaration is a product such as
 * `50 * 1024 * 1024`. That case is {@link readLeadingFactor}'s, and guessing between them is the
 * exact defect this module was built around: see the class comment.
 *
 * @param what a description used in the error message — usually the probe's name.
 */
export function readNumericConstant(src: string, name: string, what: string): number {
  const text = initialiserOf(src, name);
  if (text === null) throw notFound(name, what);

  if (productOperands(text) !== null) {
    throw new Error(
      `${what}: ${name} is declared as a product — \`${text}\` — so "the value" and "the leading ` +
      `factor" are different numbers, and this reader will not pick one for you. ` +
      `If you want the whole value, evaluate it at the call site or respell the constant. ` +
      `If you want the leading factor (as the MAX_IMPORT_SIZE callers do), call ` +
      `readLeadingFactor(). Returning ${text.split('*')[0].trim()} here is the 2026-09-04 ` +
      `turncount bug: a cap 1000x too small, with no throw and no warning.`);
  }

  const value = literalValue(text);
  if (value === null) {
    throw new Error(
      `${what}: read ${name} as ${JSON.stringify(text)}, which is not a numeric literal this ` +
      `reader recognises. Refusing to guess a number out of it.`);
  }
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${what}: read ${name} as ${JSON.stringify(text)}, which is not a usable number.`);
  }
  return value;
}

/**
 * Find `const <name> = <a> * <b> …` and return **the leading factor** `<a>`.
 *
 * For the three probes that read `MAX_IMPORT_SIZE = 50 * 1024 * 1024` and multiply the `50` back
 * up themselves. Throws when the declaration is *not* a product, because that is precisely the
 * reformatting that used to hand those callers `52428800` to multiply by `1024 * 1024` — a 50 TB
 * cap read off a 50 MB constant, silently, with every arm still green.
 */
export function readLeadingFactor(src: string, name: string, what: string): number {
  const text = initialiserOf(src, name);
  if (text === null) throw notFound(name, what);

  const operands = productOperands(text);
  if (operands === null) {
    const whole = literalValue(text);
    throw new Error(
      `${what}: ${name} is declared as \`${text}\`, which is not a product, so it has no leading ` +
      `factor. This caller multiplies the factor back up itself, so returning ` +
      `${whole ?? 'the whole value'} here would overstate the constant by whatever it multiplies ` +
      `by. If the constant was respelled as a whole value, call readNumericConstant() and drop ` +
      `the multiplication at the call site.`);
  }
  const value = operands[0];
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${what}: read the leading factor of ${name} as ${value}, which is not usable.`);
  }
  return value;
}

/** Same as {@link readNumericConstant}, reading the file for you. */
export function readNumericConstantFromFile(file: string, name: string, what: string): number {
  return readNumericConstant(fs.readFileSync(file, 'utf8'), name, what);
}

/** Same as {@link readLeadingFactor}, reading the file for you. */
export function readLeadingFactorFromFile(file: string, name: string, what: string): number {
  return readLeadingFactor(fs.readFileSync(file, 'utf8'), name, what);
}

/**
 * Rewrite `const <name> = <initialiser>` to `const <name> = <expr>`, for probes that temporarily
 * patch a shipped constant to measure the counterfactual.
 *
 * The same 2026-09-04 reformatting had a **second** victim inside
 * `probe-browse-latency-end-to-end`, 170 lines below the one that killed it at startup: the
 * patch was built by string interpolation —
 *
 * ```ts
 * src.replace(`const FINGERPRINT_LINE_CAP = ${SHIPPED_CAP};`, '… = Number.MAX_SAFE_INTEGER;')
 * ```
 *
 * — so even with `SHIPPED_CAP` read correctly as `50000`, the needle
 * `const FINGERPRINT_LINE_CAP = 50000;` does not occur in a file that says `50_000`. Reading
 * the value correctly is not sufficient; anything that reconstructs the *declaration* has to
 * match the source's spelling too.
 *
 * Round 225 found the rest of that seam: the first version matched only the leading literal, so
 * patching `50 * 1000` produced `Number.MAX_SAFE_INTEGER * 1000` — **the multipliers survived**,
 * and the no-op guard passed it, because that guard asserted *the patch changed something* rather
 * than *the patch produced what was asked for*. Those differ exactly on a product spelling, and
 * this is a write path into `packages/`. So this now replaces the **whole initialiser** and
 * verifies the result against what was requested before returning it.
 *
 * Throws on a no-op, on an unparseable initialiser, and on a substitution that did not come out
 * as asked — for the same reason.
 */
export function replaceNumericConstant(src: string, name: string, newExpr: string, what: string): string {
  const text = initialiserOf(src, name);
  if (text === null) {
    throw new Error(
      `${what}: cannot patch ${name} — no \`const ${name} = <number>\` in the source. ` +
      `Refusing to write a file this probe could not parse.`);
  }
  if (literalValue(text) === null && productOperands(text) === null) {
    throw new Error(
      `${what}: cannot patch ${name} — its initialiser ${JSON.stringify(text)} is not a numeric ` +
      `literal or a product of them. Refusing to rewrite an expression this probe cannot parse.`);
  }

  // Replace the initialiser entire, so a product leaves no operands behind.
  const pattern = new RegExp(`(const ${name}\\s*=\\s*)([^;\\n]+)`);
  const out = src.replace(pattern, (_all, lead: string, init: string) => {
    const trailing = init.match(/[,)\]}]+\s*$/)?.[0] ?? '';
    return `${lead}${newExpr}${trailing}`;
  });

  if (out === src) throw new Error(`${what}: patching ${name} to ${newExpr} was a no-op.`);

  // The guard that matters: assert the patch produced what was asked, not merely that it changed
  // something. These differ on exactly the product spelling that motivated this function.
  const after = initialiserOf(out, name);
  if (after === null || after.replace(/\s+/g, ' ') !== newExpr.replace(/\s+/g, ' ')) {
    throw new Error(
      `${what}: patching ${name} to ${JSON.stringify(newExpr)} produced ` +
      `${JSON.stringify(after)} instead — refusing to write a partial substitution.`);
  }
  return out;
}
