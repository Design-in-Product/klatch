/**
 * Read a shipped numeric constant out of `packages/` source — separator-tolerantly.
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
 * conclusion that was, underneath, correct. Its `scanUncapped` also split pre/post density at
 * line 50 instead of line 50,000, which is latent only because no session on this corpus
 * reaches the real cap; on the corpus where arm J matters, it is live.
 *
 * Found 2026-09-17 while driving Round 224's subjects against a stranger: `browse-latency` came
 * back `OPEN — NOT ESTABLISHED` with zero contact, which is the same result Theseus's Round 223
 * §4 reported for it — he attributed it to "an early failure unrelated to any of this," which
 * was right about the relationship and left the cause unfound.
 *
 * **The rule: a probe that scrapes a constant to avoid going stale must not be defeated by the
 * constant being reformatted.** `50000`, `50_000` and `5e4` are the same number; a probe that
 * reads source is asserting a fact about a value, not about its spelling.
 *
 * ## Fail loudly, never partially
 *
 * {@link readNumericConstant} throws when it cannot find the constant. It will not return a
 * prefix, and it anchors on a value terminator so that it cannot match `50` inside `50_000`.
 * Given the choice these two probes demonstrate, loud is strictly better: a dead probe gets
 * fixed and a quietly wrong one gets cited.
 */

import fs from 'fs';

/**
 * Find `const <name> = <number>` in `src` and return the number, tolerating `_` separators.
 *
 * Anchored on a terminator (`;`, `*`, whitespace, `,`, `)`) so a partial match is impossible:
 * the bug this module exists for was a regex that happily returned `50` from `50_000`.
 *
 * @param what a description used in the error message — usually the probe's name.
 */
export function readNumericConstant(src: string, name: string, what: string): number {
  const m = src.match(new RegExp(`const ${name}\\s*=\\s*(\\d[\\d_]*)\\s*(?=[;*,)\\s])`));
  if (!m) {
    throw new Error(
      `${what}: could not read ${name} from source — the probe cannot proceed safely. ` +
      `It scrapes this constant so a bump in packages/ cannot stale it; if the declaration was ` +
      `reformatted (a numeric separator, an expression, a move), fix the reader in ` +
      `scripts/lib/probe-source-constants.mts rather than hardcoding the value here.`);
  }
  const digits = m[1].replace(/_/g, '');
  const value = Number(digits);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${what}: read ${name} as ${JSON.stringify(m[1])}, which is not a usable number.`);
  }
  return value;
}

/** Same, reading the file for you. */
export function readNumericConstantFromFile(file: string, name: string, what: string): number {
  return readNumericConstant(fs.readFileSync(file, 'utf8'), name, what);
}

/**
 * Rewrite `const <name> = <number>` to `const <name> = <expr>`, for probes that temporarily
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
 * That probe's own no-op guard caught it and threw **before** writing, leaving `packages/`
 * clean — which is why this was a dead probe and not a corrupted working tree. Worth copying:
 * a probe that patches shipped source should assert its patch changed something before it
 * writes, not after.
 *
 * Throws on a no-op, for the same reason.
 */
export function replaceNumericConstant(src: string, name: string, newExpr: string, what: string): string {
  const pattern = new RegExp(`(const ${name}\\s*=\\s*)(\\d[\\d_]*)(?=[;*,)\\s])`);
  if (!pattern.test(src)) {
    throw new Error(
      `${what}: cannot patch ${name} — no \`const ${name} = <number>\` in the source. ` +
      `Refusing to write a file this probe could not parse.`);
  }
  const out = src.replace(pattern, `$1${newExpr}`);
  if (out === src) throw new Error(`${what}: patching ${name} to ${newExpr} was a no-op.`);
  return out;
}
