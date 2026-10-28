/** Zero-width / BOM scan over the files this unit edited. A ZWSP pasted into source is invisible in
 *  every diff view and would be a real defect in a `.mjs` the typecheck program reads. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const TARGETS = [
  'scripts/sweep-probes.mjs',
  'scripts/probe-round307-the-return-half-is-gradeable-the-parameter-half-is-any-and-the-arity-check-covers-fourteen-of-eighteen.mts',
  'docs/research/unit-307c4-rekey-2026-10-28/grade-c4.mjs',
];
const BAD = /[​‌‍⁠﻿]/;
let hits = 0;
for (const t of TARGETS) {
  readFileSync(join(REPO, t), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (BAD.test(line)) {
        hits += 1;
        console.log(`ZERO-WIDTH ${t}:${i + 1} ${JSON.stringify(line)}`);
      }
    });
}
console.log(`VERDICT/1 ${hits === 0 ? 'ok' : 'RED'} files=${TARGETS.length} zeroWidthLines=${hits}`);
process.exit(hits === 0 ? 0 : 1);
