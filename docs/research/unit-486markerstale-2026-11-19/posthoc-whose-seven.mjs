#!/usr/bin/env node
/**
 * unit-486markerstale POST-HOC — **whose seven, and where the eighth went.**
 *
 * Not pre-registered. The arm reported `stale AND in the population under the OLD reading` = **8**,
 * where Daedalus published **7** (`MARKED 11 → 4`). Both figures can be right only if one member of
 * the 8 was invisible to his table, and this leg settles which, from git rather than from reading.
 *
 * KEY: his `drive0.live-gate.out` is the "before anything" row of his §1 table — `tracked 1002 ·
 * population 73 · UNGUARDED 59 · MARKED 11 · GUARDED 3`, timestamped `2026-11-19T21:18:52Z`. The
 * cure landed in `60ac5efc` ("arm+cure+migration"), **which also added his arm**. So the tree his
 * MARKED 11 was read from is `60ac5efc^`, and any file absent there could not be in his 11.
 *
 * Prediction, stated before the run (post-hoc for the UNIT, pre-stated for the LEG):
 *   - of the 8, exactly **7** exist at `60ac5efc^` — those are his seven, reproducing exactly;
 *   - the **1** that does not is **his own arm**, added in the same commit as the cure, so it
 *     entered the tree already out of the population and never appeared in EITHER column of his
 *     own table.
 *
 * Read-only. No file is edited; `git cat-file -e` is an existence test against history.
 */

import { readFileSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const GATE = join(ROOT, 'scripts/verify-decl-body-slicers.mjs');
const HIS_DRIVE0 = join(ROOT, 'docs/research/unit-484popnarrow-2026-11-19/drive0.live-gate.out');
const CURE_COMMIT = '60ac5efc';

const die = (code, msg) => { console.error(`\n${msg}`); process.exit(code); };
const capture = (label, re, src) => {
  const m = src.match(re);
  if (!m) die(3, `CAPTURE-FAILED — ${label}`);
  return m[1];
};

/* ------------------------------------------------- keys, captured (R3 applies to this leg too) */
const gateSrc = readFileSync(GATE, 'utf8');
const cmpSrc = capture('cmp factory', /const cmp = (\(ch\) => new RegExp\([\s\S]*?\));\n/, gateSrc);
// eslint-disable-next-line no-eval
const cmp = eval(cmpSrc);
const OPEN_BRACE = cmp(capture('OPEN_BRACE', /const OPEN_BRACE = cmp\('(.)'\)/, gateSrc));
const CLOSE_BRACE = cmp(capture('CLOSE_BRACE', /const CLOSE_BRACE = cmp\('(.)'\)/, gateSrc));
const MARKER = new RegExp(capture('MARKER', /const MARKER = \/(.*?)\/;/, gateSrc));
const EXTS = new Set(capture('EXTS', /const EXTS = new Set\(\[([^\]]*)\]\)/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const SELF = new Set(capture('SELF', /const SELF = new Set\(\[([\s\S]*?)\]\);/, gateSrc)
  .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));
const MINLEN = Number(capture('minLen', /const code = blankLongStrings\(raw, (\d+)\);/, gateSrc));
const { stripSource, blankLongStrings } = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ------------------------------------------------- his drive0, read not recalled */
const his = readFileSync(HIS_DRIVE0, 'utf8');
const hisNum = (label) => {
  const m = his.match(new RegExp(`(?:^|\\n)\\s*${label}\\s+(\\d+)`));
  return m ? Number(m[1]) : null;
};
const hisMarked = hisNum('MARKED');
const hisTracked = hisNum('tracked files read:');
const hisPop = hisNum('population \\(compares against both braces\\):');
if (hisMarked === null) die(3, 'CAPTURE-FAILED — his MARKED count');
console.log('posthoc-whose-seven — whose seven, and where the eighth went');
console.log(`  his drive0 (read, not recalled): tracked ${hisTracked} · population ${hisPop}`
  + ` · MARKED ${hisMarked}`);

/* ------------------------------------------------- the stale-by-narrowing set, recomputed */
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((f) => EXTS.has(extname(f)) && !SELF.has(f));

const staleByNarrowing = [];
const needed = [];
for (const rel of tracked) {
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  if (!MARKER.test(raw)) continue;
  const code = blankLongStrings(raw, MINLEN);
  const old = stripSource(raw, false);
  const pop = OPEN_BRACE.test(code) && CLOSE_BRACE.test(code);
  const popOld = OPEN_BRACE.test(old) && CLOSE_BRACE.test(old);
  if (pop) needed.push(rel);
  else if (popOld) staleByNarrowing.push(rel);
}

/* ------------------------------------------------- existed at his reading? */
const existedAt = (rev, rel) => {
  try {
    execFileSync('git', ['-C', ROOT, 'cat-file', '-e', `${rev}:${rel}`], { stdio: 'ignore' });
    return true;
  } catch { return false; }
};
const REV = `${CURE_COMMIT}^`;
let sha;
try {
  sha = execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', REV], { encoding: 'utf8' }).trim();
} catch (e) { die(2, `BLOCKED — cannot resolve ${REV}: ${e.message}`); }
console.log(`  the tree his MARKED ${hisMarked} was read from: ${REV} = ${sha}`);

const present = []; const added = [];
for (const rel of staleByNarrowing) (existedAt(REV, rel) ? present : added).push(rel);

console.log(`\n  stale-by-narrowing (marker + out of the LIVE population + in the OLD one): ${staleByNarrowing.length}`);
for (const rel of present) console.log(`      PRESENT at ${sha}  ${rel}`);
for (const rel of added) console.log(`      ADDED after ${sha}  ${rel}`);

const neededPresent = needed.filter((r) => existedAt(REV, r));
console.log(`\n  still-NEEDED markers present at ${sha}: ${neededPresent.length} of ${needed.length}`);

console.log(`\n  HIS ARITHMETIC, reconstructed: MARKED at ${sha} should be`
  + ` (still needed, present) ${neededPresent.length} + (departed, present) ${present.length}`
  + ` = ${neededPresent.length + present.length}; his drive0 printed ${hisMarked}.`);
const reconstructs = neededPresent.length + present.length === hisMarked;
console.log(`  ${reconstructs ? 'RECONSTRUCTS EXACTLY' : 'DOES NOT RECONSTRUCT'} — his 11 → 4 is`
  + ` ${present.length} departures, and this seat's ${staleByNarrowing.length}th is`
  + ` ${added.length === 1 ? `the one file ADDED in the cure commit: ${added[0]}` : `${added.length} files added after his reading`}.`);

console.log('\n' + '='.repeat(78));
console.log(`SUMMARY — his published 7 reproduces as ${present.length}; the ${staleByNarrowing.length}th`
  + ` is ${added.join(', ') || 'none'}, added in ${CURE_COMMIT} alongside the cure, so it entered the`
  + ' tree already out of the population and appears in NEITHER column of his own table.');
console.log('='.repeat(78));
process.exit(reconstructs ? 0 : 1);
