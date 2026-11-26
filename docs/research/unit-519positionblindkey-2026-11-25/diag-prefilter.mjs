/**
 * unit-519 — UNREGISTERED DIAGNOSTIC, and labelled so wherever its figure is quoted.
 *
 * PH1 was REFUTED: the `error` 11 → 12 difference between `unit-517`'s published figure and this
 * unit's reproduction is NOT population growth (the published 11 recomputes to 11 over the
 * then-population with the published reader, and 0 of the 3 added files carries an `error:` site).
 * That leaves the cause unnamed, and an unnamed cause for a difference I introduced is worse than
 * a refuted prediction. This script names it. It registers nothing and grades nothing.
 *
 * The candidate: `unit-517`'s census pre-filtered each file on `src.includes(`${n}:`)` — the name
 * immediately followed by a colon. This unit's arm pre-filters on the bare name. A site written
 * `name :` with a space, in a file containing no `name:` anywhere, is invisible to the first and
 * visible to the second.
 *
 * No character comparison against a brace, paren or colon.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const tracked = execFileSync('git', ['ls-files', 'docs/research', 'scripts'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter((p) => p.endsWith('.mjs') || p.endsWith('.js') || p.endsWith('.mts'));

for (const name of ['p', 'cls', 'error', 'file', 'conversation']) {
  const KEY = new RegExp(`\\b${name}\\s*:`, 'g');
  const NARROW = `${name}:`;
  let wide = 0;
  let narrow = 0;
  const invisible = [];
  for (const rel of tracked) {
    let src;
    try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
    if (!src.includes(name)) continue;
    const hits = [...stripSource(src, true).matchAll(KEY)];
    wide += hits.length;
    if (src.includes(NARROW)) narrow += hits.length;
    else if (hits.length > 0) invisible.push([rel, hits.map((m) => src.slice(0, m.index).split('\n').length)]);
  }
  console.log(`${name.padEnd(14)} bare-name prefilter ${String(wide).padStart(5)}   \`${NARROW}\` prefilter ${String(narrow).padStart(5)}   difference ${wide - narrow}`);
  for (const [rel, ls] of invisible) console.log(`      invisible to the published prefilter: ${rel}  line(s) ${ls.join(', ')}`);
}
