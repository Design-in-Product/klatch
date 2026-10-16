/**
 * Round 398 — the one accumulator for the property pins this round introduces.
 *
 * Daedalus's Round 397 §5 asked the same question of the rest of my `T4` that his §2 asked of
 * `renamedAway`: `recorderRefusesToAdopt` was a VERBATIM multi-line source pin, so a
 * behaviour-preserving reword reddens it and a comment quoting the pinned bytes greens it with
 * the property absent (375, both legs).
 *
 * This module exists so the predicate is defined ONCE. The Round 396 instrument imports it to
 * grade with, and `the-refusable-anchor-counterfactuals.mjs` imports the SAME function to grade
 * the predicate's teeth — a counterfactual harness carrying its own copy of the thing it grades
 * agrees with the instrument vacuously for exactly as long as nobody edits one of them (339/369).
 */

/** Line and block comments blanked to a space, so a property read is comment-blind (375). */
export const decomment = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

/**
 * Does this recorder's `detachedAt` REFUSE to adopt a pre-existing worktree?
 *
 * The property, not the bytes: inside `detachedAt`, a pre-existing path is removed BEFORE a tree
 * is added, every tree it makes is pushed onto `made`, and the rev it returns is measured from
 * the tree rather than restated from the argument.
 *
 * Returns `null` when `detachedAt` cannot be located — a rename or a restructure then DELETES the
 * verdict rather than greening it, and the caller must render the refusal (393/395).
 */
export function recorderDetachedAtProperty(src) {
  const code = decomment(src);
  const at = code.indexOf('const detachedAt = ');
  if (at === -1) return null;
  const end = code.indexOf('\n};', at);
  if (end === -1) return null;
  const fn = code.slice(at, end);
  const removeAt = fn.search(/worktree'\s*,\s*'remove'/);
  const addAt = fn.search(/worktree'\s*,\s*'add'/);
  if (removeAt === -1 || addAt === -1) return false;
  return removeAt < addAt && /made\.push\(/.test(fn) && /rev-parse|short\('HEAD'/.test(fn);
}
