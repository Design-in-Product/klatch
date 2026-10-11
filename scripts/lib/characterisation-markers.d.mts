/**
 * Types for `characterisation-markers.mjs`, so a `.mts` probe may import it without TS7016.
 *
 * Round 371, Daedalus, 2026-10-11. Same reason as `strip-source.d.mts` and `tsx-required.d.mts`:
 * `scripts/tsconfig.json` puts every `.mts` under `scripts/` into a type program, `.mjs` files enter
 * it only as import TARGETS, and their types come from a hand-written `.d.mts` beside them. That is
 * the surface the Round 263 and 275 slips were both on.
 */

export interface CommentSpan {
  start: number;
  end: number;
  text: string;
  line: number;
}

export interface CommentBlock extends CommentSpan {
  spans: number;
}

export interface Population {
  all: string[];
  tests: string[];
  probes: string[];
  files: string[];
}

/** A marker-carrying member as one of the two surface readers returns it. */
export interface SurfaceMember {
  line: number;
  text: string;
  markers: string[];
}

/** The same member once `reconcile` has attributed it to a file and a surface. */
export interface FoundMember extends SurfaceMember {
  file: string;
  surface: string;
}

export type RegistryStatus = 'live' | 'commemoration';

export interface RegistryEntry {
  id: string;
  file: string;
  surface: string;
  status: RegistryStatus;
  anchor: string;
  claim: string;
  cells: string[];
}

export interface Reconciliation {
  pop: string[];
  found: FoundMember[];
  ambiguous: { id: string; hits: number }[];
  undeclared: FoundMember[];
  unmatched: RegistryEntry[];
}

export declare function walk(root: string, dir?: string, acc?: string[]): string[];
export declare function population(root: string): Population;
export declare function commentSpans(src: string): CommentSpan[];
export declare function commentBlocks(src: string): CommentBlock[];
export declare function commentProse(raw: string): string;
export declare const MARKERS: [string, RegExp][];
export declare function markersIn(text: string): string[];
export declare function markersInRaw(text: string): string[];
export declare const PRECISE_MARKERS: Set<string>;
export declare const SURFACES: Record<string, (src: string) => SurfaceMember[]>;
export declare const REGISTRY: RegistryEntry[];
export declare const SELF_EXCLUDED: string;
export declare function reconcile(root: string, registry?: RegistryEntry[]): Reconciliation;
