#!/usr/bin/env node
/**
 * Known positive for `scripts/verify-decl-body-slicers.mjs`: a NEW hand-rolled brace-balance body
 * slicer, not in the baseline. The detector must redden on this file and name it.
 *
 * Drive 16 runs it unmarked (expected: RED, 1 new slicer, this path). Drive 17 runs it with the
 * marker below added — the committed state — and must be GREEN with `MARKED 2`. Without a known
 * positive the detector's green on drive 15 is unfalsifiable: a detector that reports zero has not
 * been shown to be able to report one.
 *
 * brace-slicer-deliberate: this is the detector's own known positive — the defect written out so
 * the gate can be shown to catch it. Added at drive 17; drive 16's recording is the unmarked run.
 */

export const findBodyTheWrongWay = (src, name) => {
  const at = src.indexOf(name);
  if (at === -1) return null;
  const open = src.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
};
