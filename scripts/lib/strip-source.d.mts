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
 */
export declare const stripSource: (src: string, blankStrings: boolean) => string;
