/**
 * Types for `decl-body.mjs`, so a `.mts` probe may import it without TS7016 — same reason as
 * `strip-source.d.mts` and `tsx-required.d.mts`.
 *
 * `unit-470bodyslice`, Daedalus, 2026-11-17 WORK fire. Declared here because this file can drift
 * from the implementation silently: `.d.mts` is not checked against `.mjs`, and a previous round
 * shipped three exports that existed in one and not the other with typecheck green throughout.
 * `scripts/verify-decl-body-slicers.mjs` asserts the export NAMES match; it does not grade types.
 */

/** Thrown for a non-string source, rather than returning a span a key would read as zero. */
export declare class DeclBodyInputError extends TypeError {}

/**
 * The declaration-head pattern, as a `RegExp` **source string** (not a `RegExp`) so no consumer can
 * inherit another's `lastIndex`. Group 1 is a `function` declaration's name, group 2 a
 * `const`/`let`/`var` declaration's.
 */
export declare const DECL_HEAD_SOURCE: string;

/** The index of the `)` closing the parameter list opened at `open`, or −1. Pass code-only text. */
export declare const parenSpanEnd: (code: string, open: number) => number;

/** The index of the `}` closing the block opened at `open`, or −1. Pass code-only text. */
export declare const braceSpanEnd: (code: string, open: number) => number;

/**
 * Every declaration head in source order. `parenOpen` indexes the `(` of the parameter list;
 * `isArrow` is true for the `const`/`let`/`var` alternative and decides whether a return-type
 * annotation is skippable or refused.
 */
export declare const declHeads: (src: string) => {
  name: string;
  headStart: number;
  parenOpen: number;
  isArrow: boolean;
}[];

/**
 * The body span of the declaration whose parameter list opens at `parenOpen`.
 *
 * Never a span truncated to end-of-file. `kind: 'concise'` carries `body: null`: an arrow with an
 * expression body has no brace-delimited body. `kind: 'refused'` carries a `reason` and
 * `body: null` — a form this reader will not slice rather than one it slices wrongly.
 */
export declare const declBodyAt: (
  src: string,
  parenOpen: number,
  opts?: { isArrow?: boolean },
) => {
  name: string | null;
  kind: 'block' | 'concise' | 'refused';
  reason: string | null;
  parenOpen: number;
  parenClose: number;
  bodyStart: number | null;
  bodyEnd: number | null;
  params: string;
  body: string | null;
};

/** Every declaration with its body span or its refusal reason. Nothing is dropped. */
export declare const declBodies: (src: string) => {
  name: string;
  kind: 'block' | 'concise' | 'refused';
  reason: string | null;
  headStart: number;
  parenOpen: number;
  parenClose: number;
  bodyStart: number | null;
  bodyEnd: number | null;
  params: string;
  body: string | null;
  isArrow: boolean;
}[];

/** The body of the declaration named `name`, or `null`. The common census shape. */
export declare const bodyOf: (src: string, name: string) => string | null;
