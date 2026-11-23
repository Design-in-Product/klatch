#!/usr/bin/env node
/**
 * unit-504mixedstalelabels — POST-HOC, declared as one. Not a re-key of P1.c.
 *
 * P1.c and P1.c2 were REFUTED AS WRITTEN, and the defect is in my key, not in the gate.
 * `derive-stale-entry-general-form.mjs` decided which label the `stale` filter excludes with
 *
 *     const excluded = LABELS.filter((v) => staleLine.includes(v));
 *
 * against the live line `const stale = baseline.filter((f) => verdicts.get(f) !== 'UNGUARDED');`.
 * Bare containment finds `GUARDED` **inside** `UNGUARDED`, so the selector reported TWO excluded
 * labels, dropped `GUARDED` from the reachable set, and P1.a then graded 4 assertions where it
 * should have graded 6 — the two `GUARDED` cells were never reached. A downstream key is blind
 * until its upstream selector is cured.
 *
 * That is the exact hazard this gate's partition-order decision exists to close: an unanchored
 * reader of `GUARDED` landing on `UNGUARDED` (`unit-486markerstale` §5, where it manufactured a
 * `3 → 58` figure move). It bit a reader written by the seat that landed the format cure — in the
 * other direction, reading SOURCE rather than reading the REPORT, which is a surface neither the
 * format decision nor the gate's own guard protects.
 *
 * This script establishes the reachable set with an ANCHORED key — the label as a quoted literal —
 * so the arm's cells rest on a reading rather than on my refuted one. It is recorded as a post-hoc
 * and is NOT counted as a HIT.
 */
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const src = readFileSync(join(ROOT, 'scripts/verify-decl-body-slicers.mjs'), 'utf8');
const must = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };

const lines = src.split('\n');
const labelsLine = lines.find((l) => l.startsWith('const LABELS = '));
const staleLine = lines.find((l) => l.startsWith('const stale = baseline.filter('));
must(labelsLine && staleLine, 'cannot find the live declarations');
const LABELS = new Function(`${labelsLine}; return LABELS;`)();

const Q = String.fromCharCode(39);
// Anchored: the label has to appear as its own quoted literal, which `UNGUARDED` does not satisfy
// for the token `GUARDED`.
const quoted = (v) => `${Q}${v}${Q}`;
const excludedAnchored = LABELS.filter((v) => staleLine.includes(quoted(v)));
const excludedBare = LABELS.filter((v) => staleLine.includes(v));

const ANCHOR = 'for (const f of stale) emitErr(';
const stmt = src.slice(src.indexOf(ANCHOR), src.indexOf('\n', src.indexOf(ANCHOR)));
const dflt = (stmt.match(/\?\?\s*'([A-Z]+)'/) || [])[1];
const reachable = [...LABELS.filter((v) => !excludedAnchored.includes(v)), dflt].sort();

const verdict = {
  'POST-HOC  the anchored key excludes exactly UNGUARDED':
    excludedAnchored.length === 1 && excludedAnchored[0] === 'UNGUARDED',
  'POST-HOC  the bare-containment key excluded TWO, and GUARDED is the false one':
    excludedBare.length === 2 && excludedBare.includes('GUARDED'),
  'POST-HOC  the two keys DISAGREE on this very line, which is why P1.c could be refuted at all':
    excludedBare.length !== excludedAnchored.length,
  'POST-HOC  reachable label set is {ABSENT, GUARDED, MARKED}':
    JSON.stringify(reachable) === JSON.stringify(['ABSENT', 'GUARDED', 'MARKED']),
  'POST-HOC  the containment relation that did it is live in LABELS itself':
    LABELS.some((a) => LABELS.some((b) => a !== b && a.endsWith(b))),
};

console.log(JSON.stringify({
  staleLine: staleLine.trim(),
  LABELS,
  excludedAnchored,
  excludedBare,
  defaultLabel: dflt,
  reachable,
  verdict,
}, null, 2));
