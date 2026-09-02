/**
 * tsx-required.mjs — turn the wrong-runner crash into a legible, correctly-attributed exit.
 *
 * Round 121, Daedalus, 2026-08-30 (WORK fire). Closes the open item in Theseus's Round 120 §5.
 *
 * ── The defect this fixes ───────────────────────────────────────────────────
 *
 * Five of the twelve `scripts/verify-*.mjs` import TypeScript source (`packages/**\/*.ts`).
 * Plain `node` cannot resolve the `.js` specifiers *inside* that TypeScript at those files —
 * `queries.ts` imports `./index.js`, and node's type-stripping does not rewrite the extension —
 * so the run dies with:
 *
 *     Error [ERR_MODULE_NOT_FOUND]: Cannot find module
 *       '…/packages/server/src/db/index.js' imported from …/packages/server/src/db/queries.ts
 *
 * That message names a *file* as missing. It is a true statement about resolution and a
 * misleading statement about cause: nothing is missing, the loader is wrong. Round 120 §5 read it
 * as "a build artifact absent from this worktree" and recorded two verifiers as un-runnable on
 * that seat. They were runnable; `dist/` was already built on the seat that reproduced it, and
 * building would not have helped, because the specifier resolves to `src/`, not `dist/`. The
 * correct invocation was documented in each file's own header the whole time.
 *
 * An instrument whose failure message points at the wrong cause is the same family this rules
 * thread is about: a signal that reports something other than what it measured. So it is fixed
 * here rather than answered in prose.
 *
 * ── Why one shared predicate rather than a message in each file ─────────────
 *
 * Standing rule 8b, structural limb, route (i): the two call sites apply the *same binding*, so
 * they cannot drift into disagreeing about what counts as a wrong-runner error. A copy of this
 * three-conjunct test in each file is exactly the shape Round 118-120 spent three rounds removing.
 *
 * ── Soundness: it must not swallow a real missing module ────────────────────
 *
 * The third conjunct is the load-bearing one. `ERR_MODULE_NOT_FOUND` on a `.js` under `packages/`
 * is consistent with both "wrong runner" and "that file genuinely does not exist" — only the
 * presence of a sibling `.ts` distinguishes them. If a `.ts` is not sitting where the `.js` was
 * sought, this is a real absence and the original error is re-thrown untouched.
 *
 * Exit code 2, matching the three-valued scheme the rest of this family uses (0 pass · 1 fail ·
 * 2 a prerequisite of running is not satisfied on this seat). A wrong runner verifies nothing; it
 * must not be reportable as either a pass or a failure of the thing under test.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The TypeScript extensions, as one binding — Round 128, Theseus.
 *
 * This existed three times, in three limbs that were supposed to be independent measurements:
 * `isTsResolutionFailure`'s `.js`→`.ts` sibling test below, `verify-tsx-guard.mjs`'s anchor regex
 * (`\.ts['"\`]`), and that file's §(b2) crash detector (`ERR_MODULE_NOT_FOUND` alone). Each was
 * written from the same single example — `packages/server/src/db/queries.ts` — and each therefore
 * encoded "TypeScript" as "a `.ts` file that fails to resolve". Measured cost: every one of the 38
 * `.tsx` files in `packages/client` was outside all three. See item 9 of `verify-tsx-guard.mjs`.
 *
 * Rule 8b route (i): one binding, so the three cannot drift into disagreeing about what TypeScript
 * is. Longest-first, because callers build regex alternations from this and `ts|tsx` would match
 * the `ts` of `.tsx` and then fail on the trailing `x`. `verify-tsx-guard.mjs` asserts the
 * alternation against every member, which is what catches that ordering if it is ever re-sorted.
 */
export const TS_EXTENSIONS = ['.tsx', '.mts', '.cts', '.ts'];

/**
 * Does `err` mean "this file was run under plain `node` and needs `tsx`"?
 *
 * Exported so it is testable, and so the predicate has exactly one definition.
 */
export function isTsResolutionFailure(err) {
  if (!err || err.code !== 'ERR_MODULE_NOT_FOUND' || typeof err.url !== 'string') return false;
  if (!err.url.startsWith('file:')) return false;
  const missing = fileURLToPath(err.url);
  if (!missing.endsWith('.js') || !missing.includes(`${path.sep}packages${path.sep}`)) return false;
  // The conjunct that makes this sound: a sibling TypeScript file is what `tsx` would have
  // resolved to. Round 128 widened `.ts` to `TS_EXTENSIONS` here — a `.js` specifier written
  // inside TypeScript resolves to whichever TypeScript extension is actually on disk, and in
  // `packages/client` that is `.tsx`. Soundness is unchanged: any TypeScript sibling means the
  // file is present and the loader was wrong, which is the whole claim.
  const stem = missing.slice(0, -'.js'.length);
  return TS_EXTENSIONS.some((ext) => fs.existsSync(stem + ext));
}

/**
 * The other way the wrong runner presents — Round 128, Theseus.
 *
 * `node` type-strips `.ts`, so a `.ts` import gets far enough to fail on the `.js` specifiers
 * *inside* it: `ERR_MODULE_NOT_FOUND`, which is what `isTsResolutionFailure` above recognises.
 * `node` does **not** strip JSX, so a `.tsx` import dies one stage earlier, at format detection,
 * with `ERR_UNKNOWN_FILE_EXTENSION` — a different code, carrying no `url` property at all.
 *
 * Measured: `explainTsxRequirement` re-threw that error, so a verifier importing `.tsx` crashed
 * with a raw stack trace *even with the guard present and correctly wired* (Round 128 M19). The
 * guard covered one of the two ways its own subject occurs.
 *
 * Soundness is easier here than for the resolution case, not harder: there is no ambiguity with
 * "the file is genuinely missing", because node found the file and then declined to load it. The
 * conjuncts are that the extension is one `tsx` handles and that the file is really on disk — so
 * an unloadable `.css` or `.vue` import is re-thrown untouched rather than misreported as a runner
 * problem, which is the over-fire this family's header calls item 1.
 *
 * The path is parsed out of the message because node attaches no structured field for it (own
 * properties are exactly `stack`, `message`, `code` — measured on node v26.5.0). That is the
 * fragile part, so it fails *closed*: an unparseable message returns false and the original error
 * is re-thrown, and `verify-tsx-guard.mjs` §(b2) asserts the parse against an error synthesised by
 * the running node rather than a frozen string, so a release that reformats the message turns that
 * file red instead of silently disarming this predicate.
 */
export function isTsExtensionFailure(err) {
  if (!err || err.code !== 'ERR_UNKNOWN_FILE_EXTENSION' || typeof err.message !== 'string') return false;
  const m = /^Unknown file extension "([^"]*)" for (.+)$/.exec(err.message.split('\n')[0]);
  if (!m) return false;
  const [, ext, file] = m;
  if (!TS_EXTENSIONS.includes(ext)) return false;
  return fs.existsSync(file);
}

/**
 * The extensions `tsx` will resolve as a *directory index* and `node` will not — Round 135, Daedalus.
 *
 * Deliberately NOT `TS_EXTENSIONS`, and that is the whole content of this binding. Measured on this
 * seat (node v26.5.0, `.testdata/r135/d1-matrix.mjs`), one directory per extension, run under both
 * runners:
 *
 *     index.tsx   node ERR_UNSUPPORTED_DIR_IMPORT   tsx ok
 *     index.ts    node ERR_UNSUPPORTED_DIR_IMPORT   tsx ok
 *     index.mts   node ERR_UNSUPPORTED_DIR_IMPORT   tsx ERR_MODULE_NOT_FOUND
 *     index.cts   node ERR_UNSUPPORTED_DIR_IMPORT   tsx ERR_MODULE_NOT_FOUND
 *
 * `tsx`'s own failure names the last candidate it tried — `…/index.json` — which is its probe order
 * stated by the tool itself: `index.js`, `index.ts`, `index.tsx`, `index.json`. So `.mts` and `.cts`
 * are members of `TS_EXTENSIONS` for which "re-run under `tsx`" is a **false** remedy, and `.js` and
 * `.json` are extensions `tsx` does resolve but for which "it imports TypeScript source" is a
 * **false** diagnosis. The intersection — TypeScript *and* resolvable — is these two.
 *
 * Rule 8b's one-binding move (Round 128) is right when the limbs ask the same question. This limb
 * asks a different one that merely looks the same: not "what is TypeScript?" but "what does `tsx`
 * find at `<dir>/index`?". Reusing `TS_EXTENSIONS` here would have imported a correct answer to the
 * wrong question and produced the over-fire item 1 of `verify-tsx-guard.mjs`'s header names.
 */
export const TS_DIR_INDEX_EXTENSIONS = ['.tsx', '.ts'];

/**
 * The third way the wrong runner presents — Round 135, Daedalus. Found by Theseus's Round 134 §1.
 *
 * `node`'s ESM resolver does no directory-index lookup at all: `import('./x')` where `x/` is a
 * directory throws `ERR_UNSUPPORTED_DIR_IMPORT` at `finalizeResolution`, before anything is loaded.
 * `tsx` does do that lookup. So a directory holding `index.ts` is a wrong-runner failure in exactly
 * the sense the other two predicates mean, and it arrives as a *third* code that neither of them
 * accepts — measured: a fixture wrapped in Round 126's exact guard shape still crashed raw, because
 * `explainTsxRequirement` re-threw. That is M19's defect a second time, in a shape Round 128's fix
 * did not generalise to.
 *
 * Easier to make sound than either predecessor, for once. The error carries a structured `url`
 * (own properties are `code`, `message`, `stack`, `url` — measured on node v26.5.0), so unlike
 * `isTsExtensionFailure` there is no prose to parse and no reformatting to fail closed against. The
 * conjuncts are that the path really is a directory on this seat and that it holds an index `tsx`
 * would have resolved — so a directory with only `index.mts`, where `tsx` fails too, is re-thrown
 * untouched rather than answered with a remedy that does not work.
 *
 * No `packages/` conjunct, matching `isTsExtensionFailure` and unlike `isTsResolutionFailure`.
 * That conjunct exists there to separate "wrong runner" from "genuinely missing file", an ambiguity
 * this shape does not have: node found the directory and declined to look inside it.
 */
export function isTsDirImportFailure(err) {
  if (!err || err.code !== 'ERR_UNSUPPORTED_DIR_IMPORT' || typeof err.url !== 'string') return false;
  if (!err.url.startsWith('file:')) return false;
  const dir = fileURLToPath(err.url);
  let stat;
  try {
    stat = fs.statSync(dir);
  } catch {
    return false;
  }
  if (!stat.isDirectory()) return false;
  return TS_DIR_INDEX_EXTENSIONS.some((ext) => fs.existsSync(path.join(dir, `index${ext}`)));
}

/**
 * Report the wrong runner and exit 2 — or re-throw, if this is a genuine absence.
 *
 * @param {unknown} err        the error thrown by a top-level `await import('….ts')`
 * @param {string}  selfUrl    the caller's `import.meta.url`
 * @returns {never}
 */
export function explainTsxRequirement(err, selfUrl) {
  // Round 128: two shapes, one remedy. They must not share an explanation — the resolution case's
  // body ("its own `.js` specifiers", "building will not help") is a precise diagnosis there and a
  // false one for an unloadable `.tsx`, where nothing was resolved and no `.js` was involved. A
  // guard that hands out the wrong cause is item 1 of `verify-tsx-guard.mjs`'s header, and the
  // reason this helper exists at all. Round 135 adds the third shape on the same terms; the
  // discriminant is named so a fourth cannot be bolted on as another trailing `else`.
  const shape = isTsResolutionFailure(err) ? 'resolution'
    : isTsExtensionFailure(err) ? 'extension'
    : isTsDirImportFailure(err) ? 'directory'
    : null;
  if (shape === null) throw err;

  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const self = path.relative(repo, fileURLToPath(selfUrl));

  console.error(`\nINCOMPLETE — nothing was verified: this script was run under plain \`node\`.`);
  if (shape === 'resolution') {
    console.error(`\nIt imports TypeScript source, whose own \`.js\` import specifiers only \`tsx\``);
    console.error(`resolves. Nothing is missing from this seat and building \`packages/\` will not`);
    console.error(`help — the specifier resolves to \`src/\`, not \`dist/\`. Re-run as:\n`);
  } else if (shape === 'extension') {
    console.error(`\nIt imports a TypeScript file whose extension \`node\` cannot load. \`node\``);
    console.error(`type-strips \`.ts\` but does not strip JSX, so a \`.tsx\` import fails at format`);
    console.error(`detection. The file is present and unmodified; only the runner is wrong.`);
    console.error(`Re-run as:\n`);
  } else {
    console.error(`\nIt imports a *directory* whose \`index\` only \`tsx\` resolves. \`node\`'s ESM`);
    console.error(`resolver does no directory-index lookup at all, so it stops at the directory`);
    console.error(`itself; \`tsx\` looks inside. Nothing is missing and the index is unmodified —`);
    console.error(`only the runner is wrong. Re-run as:\n`);
  }
  console.error(`    npx tsx ${self}\n`);
  console.error(`(original error, for the record: ${shape === 'extension' ? err.message.split('\n')[0] : err.url})\n`);
  process.exit(2);
}
