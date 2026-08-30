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
 * Does `err` mean "this file was run under plain `node` and needs `tsx`"?
 *
 * Exported so it is testable, and so the predicate has exactly one definition.
 */
export function isTsResolutionFailure(err) {
  if (!err || err.code !== 'ERR_MODULE_NOT_FOUND' || typeof err.url !== 'string') return false;
  if (!err.url.startsWith('file:')) return false;
  const missing = fileURLToPath(err.url);
  if (!missing.endsWith('.js') || !missing.includes(`${path.sep}packages${path.sep}`)) return false;
  // The conjunct that makes this sound: a sibling `.ts` is what `tsx` would have resolved to.
  return fs.existsSync(missing.replace(/\.js$/, '.ts'));
}

/**
 * Report the wrong runner and exit 2 — or re-throw, if this is a genuine absence.
 *
 * @param {unknown} err        the error thrown by a top-level `await import('….ts')`
 * @param {string}  selfUrl    the caller's `import.meta.url`
 * @returns {never}
 */
export function explainTsxRequirement(err, selfUrl) {
  if (!isTsResolutionFailure(err)) throw err;

  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const self = path.relative(repo, fileURLToPath(selfUrl));

  console.error(`\nINCOMPLETE — nothing was verified: this script was run under plain \`node\`.`);
  console.error(`\nIt imports TypeScript source, whose own \`.js\` import specifiers only \`tsx\``);
  console.error(`resolves. Nothing is missing from this seat and building \`packages/\` will not`);
  console.error(`help — the specifier resolves to \`src/\`, not \`dist/\`. Re-run as:\n`);
  console.error(`    npx tsx ${self}\n`);
  console.error(`(original resolution error, for the record: ${err.url})\n`);
  process.exit(2);
}
