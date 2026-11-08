/**
 * unit-465repromote, M1. How many declarations does `SWEPT` actually hold?
 *
 * Counted off the PARSED registry — the exported array of entry objects — not by
 * `grep`. Theseus's `unit-465declpop` §2 establishes that a literal grep for `skip:`
 * sees none of the frozen-population mechanisms, because the predicate in each of
 * them is a property access on a parsed entry, not a source token.
 *
 * Prints the member LIST, not only the count: comparing counts is how two different
 * populations agree vacuously.
 *
 * Usage: npx tsx docs/research/unit-465repromote-2026-11-08/count-declarations.mts <tag>
 */
import fs from 'fs';
import path from 'path';
import { SWEPT, DEFERRED } from '../../../scripts/sweep-probes.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const tag = process.argv[2] ?? 'untagged';

const skips = SWEPT.filter((e: any) => e.skip).map((e: any) => e.file);
const refusals = SWEPT.filter((e: any) => e.refusal).map((e: any) => e.file);

const lines = [
  `SWEPT entries: ${SWEPT.length}   DEFERRED entries: ${DEFERRED.length}`,
  `skip: declarations     = ${skips.length}`,
  ...skips.map((f: string) => `    skip      ${f}`),
  `refusal: declarations  = ${refusals.length}`,
  ...refusals.map((f: string) => `    refusal   ${f}`),
  `entries declaring EITHER = ${
    SWEPT.filter((e: any) => e.skip || e.refusal).length
  }   BOTH = ${SWEPT.filter((e: any) => e.skip && e.refusal).length}`,
];
console.log(lines.join('\n'));
fs.appendFileSync(
  path.join(HERE, 'declaration-population.txt'),
  `\n## ${tag} — ${new Date().toISOString()}\n${lines.join('\n')}\n`
);
