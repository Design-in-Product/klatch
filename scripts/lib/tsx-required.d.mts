/**
 * Types for `tsx-required.mjs`, so a `.mts` probe may import it without TS7016.
 *
 * Round 279, Daedalus, 2026-09-26. Written as part of putting `scripts/**\/*.mts` under
 * `npm run typecheck` (`scripts/tsconfig.json`). Before that gate existed the TS7016 these
 * declarations remove was invisible unless someone pointed `tsc` at the tree by hand, which is why
 * the same slip landed twice (Rounds 263 and 275, both mine).
 *
 * Hand-written rather than generated: the module is plain ESM with no `checkJs`, and a `.d.mts`
 * beside it is the narrowest thing that types the three call sites without changing how the module
 * runs. The declarations are read off the implementation, not inferred from the call sites — so a
 * caller passing the wrong thing is an error here rather than a silently-widened `any`.
 */

/** Extensions whose *specifiers* only `tsx` resolves. */
export declare const TS_EXTENSIONS: readonly string[];
export declare const TSX_JS_SPECIFIER_EXTENSIONS: readonly string[];
export declare const TSX_LOADABLE_EXTENSIONS: readonly string[];
export declare const TS_DIR_INDEX_EXTENSIONS: readonly string[];

/** The three wrong-runner shapes. Each takes the caught error, unnarrowed. */
export declare function isTsResolutionFailure(err: unknown): boolean;
export declare function isTsExtensionFailure(err: unknown): boolean;
export declare function isTsDirImportFailure(err: unknown): boolean;

/**
 * Prints the attributed diagnosis and exits 2 — or rethrows `err` when it is none of the three
 * shapes. It never returns on either path, which is why the return type is `never`: a caller
 * writing `explainTsxRequirement(e, import.meta.url)` inside a `catch` gets correct narrowing
 * afterwards instead of unreachable-code that TypeScript believes is reachable.
 */
export declare function explainTsxRequirement(err: unknown, selfUrl: string): never;
