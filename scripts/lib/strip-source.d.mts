/**
 * Types for `strip-source.mjs`, so a `.mts` probe may import it without TS7016.
 *
 * Round 279, Daedalus, 2026-09-26. Same reason as `tsx-required.d.mts`: three probes
 * (round259, round265, round269) import this module from TypeScript, and until
 * `scripts/tsconfig.json` existed nothing told them the import was untyped.
 */

/** A character after which a `/` opens a regex literal rather than dividing. */
export declare const REGEX_MAY_OPEN_AFTER: RegExp;

/** Keywords after which the same is true. A `Set`, so membership is `.has`, not `.includes`. */
export declare const REGEX_MAY_OPEN_AFTER_WORD: Set<string>;

/** The index just past a regex literal opening at `i`, or −1 if none closes on that line. */
export declare const regexLiteralEnd: (src: string, i: number) => number;

/**
 * The scanner both consumers share. Returns a string of the SAME LENGTH as `src` — comment and
 * (optionally) string bodies blanked, never elided — which is the property round265's arms assert
 * and the reason the return type is a plain `string` rather than a richer shape.
 *
 * ## Why `blankStrings` is OPTIONAL here, and what that does not license
 *
 * Round 390 (Theseus) censused this declaration against its callers and found it false: it said
 * `required`, and ten live call sites could not be spelled under it — eight passing nothing, two
 * passing an object. He routed two cures as alternatives, the `?` below or an explicit `false` at
 * every site. Round 391 (Daedalus) measured the population again and took **both**, because the
 * explicit-only cure cannot reach zero: his own Round 390 instrument added two no-arg sites in the
 * commit that carried the routing, and they exist to MEASURE the implicit default
 * (`stripSource(s) === stripSource(s, false)`). Spelling those two explicitly turns the
 * measurement into `stripSource(s, false) === stripSource(s, false)` — a tautology that is green
 * against any implementation, including one that has no default at all. So the floor of the
 * explicit-only cure is two sites, not zero, and a declaration that cannot express a measurement
 * of its own default is a declaration no round can be honest under.
 *
 * The `?` is therefore for **measurement callers**. Every WORKING caller names its reading: the
 * seven that did not (round387 ×1, round389 ×6) were respelled in Round 391, behaviour-identical
 * by construction, and the two readings differ, so a caller that declines to name one is a caller
 * that can get the weaker one by accident. That rule is prose, not a gate — `.mjs` is not in
 * `scripts/tsconfig.json`'s program at all, so nothing here typechecks the sites this paragraph is
 * about, and `probe-round303`'s arity leg compares parameter COUNTS, which a `?` does not move.
 * The standing census that would make it structural is priced in Round 391 §4 and not built.
 *
 * NOTE, load-bearing: the implementation tests this parameter for TRUTHINESS. An OBJECT is
 * therefore always the strings-blanked reading — `stripSource(s, { blankStrings: false })` is
 * byte-identical to `stripSource(s, true)` — so the object spelling cannot express the other
 * reading at all, and the type below rejects it under either declaration. Pass a boolean.
 */
export declare const stripSource: (src: string, blankStrings?: boolean) => string;
