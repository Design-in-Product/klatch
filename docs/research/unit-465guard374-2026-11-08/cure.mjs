/**
 * unit-465guard374 — the cure, expressed as ONE asserted anchored edit rather than as a frozen copy
 * of a cured file.
 *
 * Why this shape. A full cured copy of the 411-line subject in this directory would be a frozen
 * copy of source that drifts the moment anyone touches the real file, and this unit's own RESULTS
 * records what a frozen copy of someone's source costs. An anchored transform instead: it is
 * auditable, it refuses rather than mis-lands if the anchor moves (`once`), and it is the same
 * object whether it is applied to a sandbox copy for grading or to the tree for landing.
 *
 * **The tree is NOT edited by this module.** The pre-registration's third declared refusal says no
 * change to `sweep-probes.mjs`'s registry from this seat in this fire, and landing the cure needs
 * one: the entry's `expect` is `/All 8 regression checks passed/` and the guard makes it 9. So the
 * cure is graded in the sandbox and the `expect` 8 → 9 decision is ROUTED with the measurement in
 * hand, rather than taken quietly as bookkeeping. Relaxing the gate to fit is how rows get
 * manufactured somewhere else.
 *
 * ## What the cure is, and what it deliberately is not
 *
 * It is a PRESENCE GUARD, in the shape `probe-round372`'s A2 now establishes: the arm is RECORDED
 * first and the exit goes through `summariseAndExit`, so the deciding state reports a red row with
 * its reason and a summary headline instead of a stack trace.
 *
 * It is NOT a narrowing of the 13 `.refusal!`/`.skip!` dereferences. That is this unit's U2: the
 * line that actually throws is `const DRIFT_TARGET = r225.file;` — a plain property access carrying
 * no `!` — so the assertion operators are a SPELLING of the assumption and the unguarded lookup is
 * the assumption. Narrowing all 13 is cosmetic once the guard is above them, and doing it in the
 * same edit would mean the graded change and the cosmetic change could not be told apart.
 *
 * It does NOT guard `:348`'s `mutantSweep.SWEPT.find(…)!`. That is a different hazard with the same
 * spelling — the probe's own fixture construction dropping the entry, not the tree's registry
 * drifting — and it is routed in RESULTS U1, not folded in here.
 */

const occurrences = (h, n) => h.split(n).length - 1;
export const once = (src, from, to) => {
  const n = occurrences(src, from);
  if (n !== 1) throw new Error(`anchor occurs ${n} time(s), expected exactly 1: ${from}`);
  return src.replace(from, to);
};

/** The shipped lookup this cure replaces. Asserted unique by `once`. */
export const SHIPPED_LOOKUP = 'const r225 = SWEPT.find((s) => s.file === R225)!;';

export const GUARD = `/**
 * **GUARD (Round 465, \`unit-465guard374\`), and it is the FIRST arm for a reason that was driven.**
 *
 * As shipped, this file's second statement was \`SWEPT.find((s) => s.file === R225)!\` — a claim the
 * type system cannot check and which is false in three reachable states the registry itself names:
 * a reverted promotion, a renamed file, an entry demoted to deferred. Driven under a registry copy
 * in which that entry is renamed (one asserted replacement, nothing else changed): the shipped file
 * exits **1 with ZERO verdict rows and no headline**, throwing at
 * \`const DRIFT_TARGET = r225.file;\` — a PLAIN property access, which is why a census keyed on
 * \`.refusal!\`/\`.skip!\` cannot see the crashing line in this very file. The \`!\`s are a spelling of
 * the assumption; the unguarded lookup IS the assumption.
 *
 * The arm is recorded BEFORE the exit, so that state reports a red row naming the missing entry and
 * a summary headline, rather than a stack trace a sweep-level reader cannot tell from a crash — the
 * exit code is 1 either way, so the distinguishing key is the row count and the headline's presence.
 *
 * Keyed on the member LIST rather than on a count of declaring entries: a count is green on a
 * registry that moved these declarations whole onto some other entry, which is exactly the state
 * that would kill this file.
 */
const r225Entry = SWEPT.find((s) => s.file === R225);
const declaringMembers = SWEPT.filter((s) => s.refusal || s.skip).map((s) => s.file);
check(
  'A0g',
  \`the keyed entry is still in SWEPT and still declares both optional patterns — \` +
    \`\\\`\${R225}\\\` \${r225Entry === undefined ? 'is ABSENT from' : 'is present in'} the registry, and \` +
    \`the entries declaring either pattern are (\${declaringMembers.join(', ')}). Every dereference \` +
    \`below stands behind this arm (Round 465, \\\`unit-465guard374\\\`): compare member lists, not \` +
    \`counts, because a registry that moved these two declarations whole onto another entry keeps \` +
    \`the count and still kills this file\`,
  declaringMembers.includes(R225) &&
    r225Entry !== undefined &&
    r225Entry.refusal !== undefined &&
    r225Entry.skip !== undefined,
);
if (
  r225Entry === undefined ||
  r225Entry.refusal === undefined ||
  r225Entry.skip === undefined
) {
  summariseAndExit({ probeName: 'probe-round374', results });
  throw new Error('unreachable');
}
const r225 = r225Entry;`;

/** The cure: shipped source in, cured source out. Refuses rather than mis-lands. */
export const cure = (src) => once(src, SHIPPED_LOOKUP, GUARD);
