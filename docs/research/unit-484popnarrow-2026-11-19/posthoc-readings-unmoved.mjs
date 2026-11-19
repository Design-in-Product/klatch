#!/usr/bin/env node
/**
 * unit-484popnarrow POST-HOC leg 1 — **P10's load-bearing half: the two READINGS that already
 * existed are byte-identical before and after the third one was added.**
 *
 * `blankLongStrings` was APPENDED to `strip-source.mjs` and the scanner was not touched, so this
 * leg looks like it must pass. It is driven anyway, and the reason is specific rather than
 * ceremonial: the module gained a **module-level `const BLANK`** that calls `stripSource` at import
 * time, and three probes in this tree assert this scanner's length-preservation and offset
 * behaviour. "I only appended" is a claim about a diff, not a measurement of an output.
 *
 * The OLD module is extracted from git rather than reconstructed, into `scratch/` which is
 * `.gitignore`d, and both are imported as modules — so the comparison is between two running
 * readers, not between two source texts.
 *
 * Usage: node posthoc-readings-unmoved.mjs <pre-change-rev>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const REV = process.argv[2];
if (!REV) { console.error('USAGE: posthoc-readings-unmoved.mjs <pre-change-rev>'); process.exit(3); }

const SCRATCH = join(HERE, 'scratch');
mkdirSync(SCRATCH, { recursive: true });
const oldSrc = execFileSync('git', ['-C', ROOT, 'show', `${REV}:scripts/lib/strip-source.mjs`], { encoding: 'utf8' });
const oldPath = join(SCRATCH, 'strip-source.OLD.mjs');
writeFileSync(oldPath, oldSrc);

const nowSrc = readFileSync(join(ROOT, 'scripts/lib/strip-source.mjs'), 'utf8');
console.log(`=== the two modules, as sources ===`);
console.log(`  ${REV}:scripts/lib/strip-source.mjs   ${oldSrc.length} bytes`);
console.log(`  working tree                          ${nowSrc.length} bytes`);
if (oldSrc === nowSrc) {
  console.error('CAPTURE-FAILED — the two sources are identical, so this leg is vacuous: the rev'
    + ' passed in is not before the change.');
  process.exit(3);
}
if (/blankLongStrings/.test(oldSrc)) {
  console.error('CAPTURE-FAILED — the OLD module already exports blankLongStrings. Wrong rev.');
  process.exit(3);
}

const OLD = await import(oldPath);
const NEW = await import(join(ROOT, 'scripts/lib/strip-source.mjs'));

/* ---- KP: the comparison must be able to FAIL ------------------------------------------------ */
// A leg that compares two readers needs a case where it reports a difference, or a green run cannot
// be told from a comparison that compares nothing (`feedback_identical_runs_read_as_no_effect_when_all_are_dead`).
const KP = "const s = 'abc'; // tail\n";
const kpSame = OLD.stripSource(KP, false) === NEW.stripSource(KP, false);
const kpDiff = OLD.stripSource(KP, false) !== NEW.stripSource(KP, true);
console.log('\n=== KP — the comparison is live ===');
console.log(`  same reading, two modules differ:      ${!kpSame}   (want false)`);
console.log(`  different readings, same input differ: ${kpDiff}   (want true — else the test is dead)`);
if (!kpDiff) { console.error('KP-FAILED — the comparison cannot report a difference. Nothing published.'); process.exit(4); }

/* ---- the measurement ------------------------------------------------------------------------ */
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean)
  .filter((f) => EXTS.has(extname(f)));

let read = 0, keptDiff = 0, blankedDiff = 0, lenBad = 0;
const offenders = [];
for (const rel of tracked) {
  let raw; try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  read += 1;
  const ok = OLD.stripSource(raw, false), nk = NEW.stripSource(raw, false);
  const ob = OLD.stripSource(raw, true), nb = NEW.stripSource(raw, true);
  if (ok !== nk) { keptDiff += 1; offenders.push(`kept    ${rel}`); }
  if (ob !== nb) { blankedDiff += 1; offenders.push(`blanked ${rel}`); }
  if (nk.length !== raw.length || nb.length !== raw.length) { lenBad += 1; offenders.push(`length  ${rel}`); }
}
console.log('\n=== P10 — both pre-existing readings, over every tracked code file ===');
console.log(`  files read:                              ${read}`);
console.log(`  strings-KEPT reading differs:            ${keptDiff}   (want 0)`);
console.log(`  strings-BLANKED reading differs:         ${blankedDiff}   (want 0)`);
console.log(`  length no longer preserved (new module): ${lenBad}   (want 0)`);
for (const o of offenders.slice(0, 20)) console.log(`      ${o}`);
const verdict = keptDiff === 0 && blankedDiff === 0 && lenBad === 0;
console.log(`\n  P10 (readings half): ${verdict ? 'HIT — the two existing readings are byte-identical across all '
  + `${read} files` : 'REFUTED — see the offenders above'}`);
process.exit(verdict ? 0 : 1);
