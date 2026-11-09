/**
 * unit-465rekey374 — the cure, as a chain of ANCHORED edits rather than a frozen cured copy.
 *
 * Same shape and the same reason as `unit-465guard374-2026-11-08/cure.mjs`: a cured copy of a
 * 411-line file in a unit directory is a frozen copy of someone's source, which is the defect this
 * whole chain is about. An anchored transform refuses rather than mis-lands if an anchor moves, and
 * it is the same object applied to a sandbox copy for grading and to the tree for landing.
 *
 * Two independent transforms, composed:
 *
 *   `guard`  — the presence guard on the unguarded `SWEPT.find(… R225)!`, built and driven on all
 *              four cells of a 2×2 in `unit-465guard374` and NOT re-typed here: that unit's module
 *              is imported and its `GUARD` / `SHIPPED_LOOKUP` used verbatim. Re-typing an
 *              already-graded cure would make this unit's green a reading of a copy.
 *   `rekey`  — the reason-string-drift cure. `round373`'s arm total is hard-typed in this file at a
 *              predicate, a `meas` text, `A0`'s own published reason and two docblock sentences, and
 *              the drive field is NAMED after the number. Cured Argus's way (`unit-465skipE`): the
 *              number is REMOVED, not refreshed, because a refresh re-arms the identical drift at
 *              the next re-key. The predicate is re-keyed onto `round373`'s own registry entry.
 *
 * Both are needed for either to be landable: the re-key stands on a second registry lookup, and an
 * unguarded second lookup would be this family's own defect, committed in the file whose cure is
 * about it.
 *
 * Every inserted fragment below is spelled with SINGLE-QUOTED JS strings joined on newlines rather
 * than as one template literal. The fragment is itself full of backticks and `${…}`, and a template
 * literal holding it needs an escape on nearly every line — which is a transcription hazard in a
 * module whose whole job is to land bytes exactly.
 */

import { GUARD, SHIPPED_LOOKUP, once } from '../unit-465guard374-2026-11-08/cure.mjs';

export { once, GUARD, SHIPPED_LOOKUP };

/** `unit-465guard374`'s cure, unchanged. Its `GUARD` ends with `const r225 = r225Entry;`. */
export const guard = (src) => once(src, SHIPPED_LOOKUP, GUARD);

/** The anchor `guard` leaves behind, and the insertion point for the second arm. */
export const GUARD_TAIL = 'const r225 = r225Entry;';

/**
 * `A0r` — the second registry lookup the re-key stands on, guarded and recorded in the same shape
 * as `A0g` above it.
 *
 * Deliberately NOT folded into `A0g`. One arm asserting two independent registry claims cannot say
 * which entry went absent, and its reason string would have to narrate both — the refusal stated in
 * my 11/08 §2 and accepted by Daedalus in his 11/09 §1. So this is a second arm and the pin moves
 * 8 → 10 rather than 8 → 9.
 *
 * `HEADLINE_SHAPE` is Daedalus's spelling from `probe-round377:124`, reused rather than reinvented,
 * and the shape conjunct is his `unit-465rekey377` `A1` cure: what this file needs from the sibling
 * entry is not a NUMBER but a HEADLINE MATCHER, so a count conjunct here would redden on that
 * seat's own legitimate bump while missing the defect that matters.
 *
 * `e373Pin` is a DECLARED sentinel, not a default to something live: `'(no entry)'` cannot satisfy
 * `HEADLINE_SHAPE`, so the absent state reaches the arm as a red rather than short-circuiting to a
 * pass. The exit goes through `summariseAndExit` after the arm is recorded, so that state reports a
 * red row and a summary headline instead of a stack trace — the exit code is 1 either way, so the
 * distinguishing key is the row count and the headline's presence.
 */
export const A0R = [
  GUARD_TAIL,
  '',
  '/**',
  ' * **GUARD (Round 465, `unit-465rekey374`) — the SECOND registry lookup, and the one the arms',
  ' * below are re-keyed onto.**',
  ' *',
  " * As shipped, this file asserted `probe-round373`'s arm total as a frozen headline string — the",
  ' * `All <N> regression checks passed` form with that seat\'s N typed into it, spelled WITHOUT its',
  ' * number here on purpose — at a predicate, at a `meas` text, inside `A0`\'s own published reason,',
  ' * and in two docblock sentences, with the drive field NAMED after the number. A docblock that',
  ' * quoted the cured literal verbatim would leave the exact byte the cure exists to remove sitting',
  ' * in the file, and would re-trip any detector keyed on it: the Round 371 shape, handed back to',
  ' * this seat by its own grader on the first cured build of this very fragment.',
  ' * No predicate, no verdict and no consumer read any of those against the registry, so all five',
  ' * would have drifted false the moment the sibling pin moved while `A0` kept passing cleanly: a',
  ' * sentence nothing checks, sitting beside a predicate that recomputes (Argus, `unit-465skipE`).',
  ' * Cured by REMOVING the number rather than refreshing it — a refresh re-arms the identical drift',
  ' * at the next re-key, which is that unit\'s own measured precedent.',
  ' *',
  ' * Kept as its own arm rather than conjoined into `A0g`: one arm asserting two independent',
  ' * registry claims cannot say which entry went absent.',
  ' *',
  ' * The conjunct is the SHAPE and not a count (`HEADLINE_SHAPE` is `probe-round377:124`\'s',
  ' * spelling). What the arms below need from this entry is a headline matcher; an entry whose',
  ' * `expect` has stopped being one is the same defect one step on, while a count conjunct here',
  " * would go red on that seat's own legitimate bump.",
  ' */',
  'const HEADLINE_SHAPE = /^All \\d+ regression checks passed$/;',
  'const e373 = SWEPT.find((s) => s.file === R373);',
  "const e373Pin = e373 === undefined ? '(no entry)' : e373.expect.source;",
  'check(',
  "  'A0r',",
  '  `the sibling entry these arms are re-keyed onto is still in SWEPT and still pins a HEADLINE: ` +',
  "    `\\`${R373}\\` ${e373 === undefined ? 'is ABSENT from' : 'is present in'} the registry, pinning ` +",
  "    `\\`${e373Pin}\\`, which ${HEADLINE_SHAPE.test(e373Pin) ? 'is' : 'is NOT'} a headline matcher. ` +",
  '    `The conjunct is the SHAPE and not the number, so this file does not redden on that seat\'s ` +',
  '    `legitimate bump; and it is a SECOND arm rather than a conjunct of A0g, because one arm ` +',
  '    `asserting two independent registry claims cannot say which entry went absent`,',
  '  e373 !== undefined && HEADLINE_SHAPE.test(e373Pin),',
  ');',
  'if (e373 === undefined || !HEADLINE_SHAPE.test(e373Pin)) {',
  "  summariseAndExit({ probeName: 'probe-round374', results });",
  "  throw new Error('unreachable');",
  '}',
  "/** The sibling's declared headline, read now. No arm below states its number. */",
  'const R373_HEADLINE = e373.expect;',
].join('\n');

/**
 * The sites that hard-typed the sibling's arm total, plus the field named after it. Each is asserted
 * unique by `once`, so a moved anchor refuses instead of landing somewhere else.
 */
export const REKEYS = [
  // the type field — renamed off the number it was named after
  ['  all15: boolean;', '  headline: boolean;'],
  // THE PREDICATE — the only one of the five that was ever checkable, re-keyed onto the entry
  [
    '    all15: /All 15 regression checks passed/.test(out),',
    '    headline: R373_HEADLINE.test(out),',
  ],
  // the `meas` text printed per drive
  [
    ['      (d.all15', "        ? 'All 15 regression checks passed'"].join('\n'),
    [
      '      (d.headline',
      '        ? `headline green, matching the \\`${R373_HEADLINE.source}\\` its own entry declares`',
    ].join('\n'),
  ],
  // A0's OWN PUBLISHED REASON — the worst of the five, because it is the reason of the control arm
  // that makes A1 attributable, and so the sentence a skimming reader quotes without re-checking
  [
    "    'child against a VERBATIM copy of the registry module, is green on all 15 with B4 reading ' +",
    [
      "    'child against a VERBATIM copy of the registry module, is green across the full set its ' +",
      '    `own registry entry declares (\\`${R373_HEADLINE.source}\\`) with B4 reading ` +',
    ].join('\n'),
  ],
  // the two reads of the renamed field
  ['faithful.count === 0 && faithful.all15,', 'faithful.count === 0 && faithful.headline,'],
  ['    !drifted.all15 &&', '    !drifted.headline &&'],
  // the two docblock sentences: the property stated, the sibling's number dropped
  [
    ' *     `probe-round373` stays at **exit 0, All 15**, and still goes **B4 FAIL at 2** under the',
    [
      ' *     `probe-round373` stays at **exit 0 with its own declared headline green**, and still',
      ' *     goes **B4 FAIL at 2** under the',
    ].join('\n'),
  ],
  [
    ' *     reports `0` and passes **All 15** while its claim is false by 2 (sandbox D4), against **B4 FAIL',
    [
      ' *     reports `0` and passes **its own declared headline** while its claim is false by 2',
      ' *     (sandbox D4), against **B4 FAIL',
    ].join('\n'),
  ],
];

/** The re-key, as anchored edits. Refuses rather than mis-lands. */
export const rekey = (src) => {
  let s = once(src, GUARD_TAIL, A0R);
  for (const [from, to] of REKEYS) s = once(s, from, to);
  return s;
};

/** The whole cure: shipped source in, cured source out. */
export const cure = (src) => rekey(guard(src));
