/**
 * Replace the zero-width escapes this fire's own prose introduced with a visible `*\/` escape.
 *
 * I had used a ZWSP to stop a `*​/` inside a block comment from closing it. That works and is
 * invisible, which is the problem: it is undetectable in any diff view and would survive into a
 * `.mjs` the typecheck program reads. `zw-scan.mjs` found 6 lines across 3 files; this rewrites them
 * and `zw-scan.mjs` is the gate that must then read 0.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TARGETS = [
  'scripts/sweep-probes.mjs',
  'scripts/probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts',
  'docs/research/unit-307c4-rekey-2026-10-28/grade-c4.mjs',
];
const ZW_CLASS = '[\\u200b\\u200c\\u200d\\u2060\\ufeff]';
const PAIR = new RegExp(`\\*${ZW_CLASS}/`, 'g');
const ANY = new RegExp(ZW_CLASS, 'g');

let touched = 0;
for (const t of TARGETS) {
  const abs = join(REPO, t);
  const before = readFileSync(abs, 'utf8');
  const after = before.replace(PAIR, '*\\/').replace(ANY, '');
  if (after !== before) {
    writeFileSync(abs, after);
    touched += 1;
  }
  console.log(`${t}: ${after === before ? 'unchanged' : 'rewritten'}`);
}
console.log(`files rewritten: ${touched} of ${TARGETS.length}`);
