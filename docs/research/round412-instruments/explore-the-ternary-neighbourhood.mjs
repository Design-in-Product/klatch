/**
 * EXPLORATORY, NOT GRADED. This file exists to produce the hand read that the graded Round 412
 * instrument records a prediction against. It is committed so the hand read is auditable, and it
 * is named `explore-` so nothing downstream mistakes it for a key.
 *
 * It prints every KP-shaped declaration with a `?` anywhere in its four-line window, so the
 * ternary class can be hand-read BEFORE a detector exists (350: characterise under the detector's
 * own selector, but form the expectation by hand first).
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const git = (a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' });
const CORPUS = git(['ls-files', 'docs/research', 'scripts']).split('\n')
  .filter((f) => /\.(mjs|mts)$/.test(f)).sort();
const NAME_RE = /^(KP|KNOWN_POSITIVE|KNOWN_NEGATIVE|CONTROL)[A-Za-z0-9_]*$/;
const DECL_RE = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g;

let scanned = 0;
let withQ = 0;
for (const p of CORPUS) {
  const lines = readFileSync(join(REPO, p), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    DECL_RE.lastIndex = 0;
    let m;
    while ((m = DECL_RE.exec(lines[i])) !== null) {
      if (!NAME_RE.test(m[1])) continue;
      scanned++;
      const init = lines[i].slice(m.index + m[0].length);
      const window = [init, ...lines.slice(i + 1, i + 7)].join('\n');
      if (!/\?/.test(window)) continue;
      withQ++;
      console.log(`${p}:${i + 1} ${m[1]}`);
      console.log(`   INIT  ${JSON.stringify(init.slice(0, 100))}`);
      for (let k = 1; k <= 3; k++) {
        const l = lines[i + k];
        if (l === undefined) break;
        console.log(`   +${k}    ${JSON.stringify(l.slice(0, 100))}`);
      }
    }
  }
}
console.log(`\nscanned ${scanned} KP-shaped declaration(s); ${withQ} have a "?" in the window`);
