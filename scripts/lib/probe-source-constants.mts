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
const INITIALISER = (name: string, flags = '') =>
  new RegExp(`const ${name}\\s*=\\s*([^;\\n]+)`, flags);

/**
 * Return a copy of `src` the same length, with every comment byte replaced by a space.
 *
 * ## Why a reader of source has to know what a comment is
 *
 * Round 255. The first version scanned the raw file, so the **first** `const <name> = …` in
 * byte order won — comment or code. Every failure that follows is from one shape: a doc comment
 * above the declaration that quotes a declaration, which is ordinary house style here and appears
 * in this module's own class comment four times.
 *
 * On a file whose comment says `const FINGERPRINT_LINE_CAP = 50 * 1000;` above a shipped
 * `const FINGERPRINT_LINE_CAP = 50_000;`:
 *
 * | call | before | why it is the worst possible answer |
 * |---|---|---|
 * | `readNumericConstant` | **throws "declared as a product"** | the shipped declaration is a bare value; the throw names `readLeadingFactor()` as the remedy |
 * | `readLeadingFactor` | **returns `50`** | which is the remedy the throw just recommended — a cap 1000× small, silently |
 * | `replaceNumericConstant` | **returns success, comment patched, code untouched** | both guards pass; this is a write path into `packages/` |
 *
 * The first two rows compose. A reader who meets the throw does exactly what it tells them to do
 * and lands on **the 2026-09-04 turncount bug this module was built to prevent** — reached through
 * the module's own advice. *An error message is part of the interface, and one that recommends a
 * call is asserting something about what that call will return.*
 *
 * ## What is masked and what is not
 *
 * Comments only. String and template contents are left standing, because `${…}` can hold code and
 * a masker that guessed at it would hide declarations. A declaration quoted inside a string is
 * therefore still a second site — caught loudly by the multiplicity guard in
 * {@link declarationSite} rather than silently preferred.
 *
 * **Known limit, bounded deliberately:** a regex literal ending `//` (`/https:\/\//`) reads as a
 * line comment to this scanner, masking the rest of that line. It can only ever mask *more*, never
 * less, so its worst outcome is a declaration going unseen — which is a throw, not a wrong number.
 * Loud over partial, the same trade the rest of this module makes. Arm C of
 * `probe-round255-…` drives both live product files to show neither trips it.
 *
 * Newlines survive masking so line numbers reported in errors stay true.
 */
export function maskComments(src: string): string {
  const out = src.split('');
  const n = src.length;
  let mode: 'code' | 'line' | 'block' | "'" | '"' | '`' = 'code';
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '/') { out[i] = out[i + 1] = ' '; mode = 'line'; i += 2; continue; }
      if (c === '/' && d === '*') { out[i] = out[i + 1] = ' '; mode = 'block'; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { mode = c; i += 1; continue; }
      i += 1; continue;
    }
    if (mode === 'line') {
      if (c === '\n') { mode = 'code'; i += 1; continue; }
      out[i] = ' '; i += 1; continue;
    }
    if (mode === 'block') {
      if (c === '*' && d === '/') { out[i] = out[i + 1] = ' '; mode = 'code'; i += 2; continue; }
      if (c !== '\n') out[i] = ' ';
      i += 1; continue;
    }
    // Inside a string or template: left as written, escapes skipped so `\'` does not close it.
    if (c === '\\') { i += 2; continue; }
    if (c === mode) { mode = 'code'; i += 1; continue; }
    i += 1;
  }
  return out.join('');
}

/** 1-based line number of a byte offset, for error messages a reader can act on. */
function lineOf(src: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (src[i] === '\n') line += 1;
  return line;
}

/** The single code declaration of `const <name> = …`, or a refusal saying which case it hit. */
type Site = {
  /** Offset of `const` — used for the line number in refusals. */
  index: number;
  /** Offset of the initialiser text itself, so a patch can be spliced exactly there. */
  initStart: number;
  /** The initialiser as the original source spells it. */
  init: string;
};

/**
 * Locate the one declaration of `name` outside comments, and **refuse when there is not exactly
 * one**.
 *
 * Three outcomes, each loud, in the spirit of the class comment's "fail loudly, never partially":
 *
 * - **no match anywhere** — `null`, which the callers turn into {@link notFound}.
 * - **matches, but all inside comments** — throws. Returning the comment's value is exactly the
 *   Round 255 defect; guessing that the comment *is* the declaration is not the reader's call.
 * - **two or more code matches** — throws, naming every line. Two declarations of the same name
 *   means the reader cannot know which one ships, and picking the first is how the old version
 *   got this wrong in the first place. Measured before shipping: both constants any caller reads
 *   today (`FINGERPRINT_LINE_CAP`, `MAX_IMPORT_SIZE`) have exactly one declaration, so nothing in
 *   the tree regresses on this.
 */
function declarationSite(src: string, name: string): Site | null {
  const masked = maskComments(src);
  const sites: Site[] = [];
  const re = INITIALISER(name, 'g');
  for (let m = re.exec(masked); m !== null; m = re.exec(masked)) {
    // The initialiser text is taken from the ORIGINAL source at the same offset — masking exists
    // to decide *where* the declaration is, never to change what it says.
    const initStart = m.index + m[0].length - m[1].length;
    sites.push({ index: m.index, initStart, init: src.slice(initStart, initStart + m[1].length) });
  }

  if (sites.length > 1) {
    const lines = sites.map((s) => lineOf(src, s.index)).join(', ');
    throw new Error(
      `${name} is declared ${sites.length} times outside comments (lines ${lines}). This reader ` +
      `will not pick one for you: the caller scrapes this constant so a bump in packages/ cannot ` +
      `stale it, and two declarations mean "the shipped value" is not a single fact. Read the ` +
      `file and either remove the duplicate or read the one you mean by a distinct name.`);
  }
  if (sites.length === 1) return sites[0];

  if (INITIALISER(name).test(src)) {
    throw new Error(
      `${name} appears in ${JSON.stringify('const ' + name + ' = …')} form only inside comments ` +
      `in this file — there is no such declaration in the code. Reading the comment's value is ` +
      `the Round 255 defect: a doc comment quoting an old spelling would be reported as the ` +
      `shipped one. Refusing to guess that the comment is the declaration.`);
  }
  return null;
}

/**
 * Pull the raw initialiser text for `const <name> = …`, trimmed of trailing punctuation and of a
 * widening-suppression suffix. Returns `null` when the constant is not declared in `src`.
 *
 * Kept deliberately dumb: it does not decide what the text *means*. That is the caller's job,
 * because the two callers below mean different things by the same bytes.
 */
function initialiserOf(src: string, name: string): string | null {
  const site = declarationSite(src, name);
  if (site === null) return null;
  return site.init
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
 *
 * Round 255: the substitution is spliced at the one **code** declaration site, so a doc comment
 * quoting the declaration can no longer absorb the patch. See {@link maskComments}.
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

  // Replace the initialiser entire, so a product leaves no operands behind — and splice it at the
  // offset `declarationSite` proved is code. `String.replace` would take the first match in byte
  // order, which is how a doc comment quoting the declaration used to absorb the whole patch and
  // still pass both guards below. Round 255.
  const site = declarationSite(src, name)!;
  const trailing = site.init.match(/[,)\]}]+\s*$/)?.[0] ?? '';
  const out =
    src.slice(0, site.initStart) + newExpr + trailing + src.slice(site.initStart + site.init.length);

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
