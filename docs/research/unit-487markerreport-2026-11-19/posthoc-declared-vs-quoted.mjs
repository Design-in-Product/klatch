#!/usr/bin/env node
/**
 * **POST-HOC. Not registered. Opened because the pre-commit hook on this unit's own build commit
 * reported 15 dead-marker files where the arm had measured 14 — and the 15th is this unit's own
 * cripple.**
 *
 * The increment is NOT the same mechanism as Theseus's. His `unit-486markerstale` §6 named his arm
 * as the 14th and the increment as "the instrument": his arm genuinely carries 5 marker occurrences,
 * written on purpose. **Mine carries none.** `cripple-dead-marker-key.mjs` asserts the gate's key
 * line is present verbatim, so it holds the string
 *
 *     "const MARKER = /brace-slicer-deliberate:\\s*\\S+/;"
 *
 * as a FIXTURE, and `MARKER.test(raw)` — read from raw text — cannot tell a declared exemption from
 * a quoted one.
 *
 * **This is the identical over-admission mechanism I cured in the POPULATION key eight hours ago**
 * (`unit-484popnarrow`: 8 of 73 members were in the population only because a fixture string
 * contains `"if (s[i] === '{') d += 1;"`). The cure there was to read the key from a reading that
 * blanks long string bodies. **It cannot be applied here, and the reason is structural rather than
 * effort:** a marker lives in a COMMENT, and every reading `lib/strip-source.mjs` exports blanks
 * comments. There is no comments-KEPT / strings-blanked export, so the marker key has no reading
 * available to it that discriminates. Reading from raw is not a shortcut somebody took; it is the
 * only reading under which the key can match at all.
 *
 * ## So this leg measures the reach instead of asserting it, in both directions
 *
 * The discriminator is built from the two readings the module already produces — no third scanner,
 * for Round 258's reason — and relies on `stripSource` being LENGTH-PRESERVING, which is asserted
 * here rather than assumed:
 *
 *   - occurrence blanked in `stripSource(raw, false)` (strings KEPT, comments blanked)
 *       → it was inside a COMMENT → a **DECLARED** marker. What requirement 3 means.
 *   - occurrence survives there but is blanked in `stripSource(raw, true)` (strings blanked)
 *       → it was inside a STRING literal → a **QUOTED** token. Never an exemption.
 *   - survives both → live code text outside any comment or string. Unexpected; reported as OTHER.
 *
 * **The serious direction is the MARKED column, not my report.** A dead-marker disclosure that
 * over-admits costs a reader one confusing path. But `MARKED` is the class that GRANTS THE
 * EXEMPTION: a file in the population whose only `brace-slicer-deliberate:` is quoted inside a
 * fixture string is exempted from this gate without anybody having declared anything.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripSource, blankLongStrings } from '../../../scripts/lib/strip-source.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const EXTS = new Set(['.ts', '.mts', '.js', '.mjs', '.cts', '.cjs', '.tsx']);
const SELF = new Set(['scripts/verify-decl-body-slicers.mjs', 'scripts/decl-body-slicers.baseline']);
const MARKER_ALL = /brace-slicer-deliberate:\s*\S+/g;
const cmp = (ch) => new RegExp(`[=!]==?\\s*['"\`]\\${ch}['"\`]|['"\`]\\${ch}['"\`]\\s*[=!]==?`);
const OPEN_BRACE = cmp('{');
const CLOSE_BRACE = cmp('}');

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8' })
  .split('\n').map((l) => l.trim()).filter(Boolean);

let lengthFailures = 0;
const rows = [];
for (const rel of tracked) {
  if (SELF.has(rel) || !EXTS.has(extname(rel))) continue;
  let raw;
  try { raw = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  if (!MARKER_ALL.test(raw)) { MARKER_ALL.lastIndex = 0; continue; }
  MARKER_ALL.lastIndex = 0;

  const kept = stripSource(raw, false);   // strings kept, comments blanked
  const blanked = stripSource(raw, true); // strings blanked, comments blanked
  // Offsets only mean the same thing in all three strings if the readings preserve length. This is
  // the module's documented contract and this fire re-asserts it rather than inheriting it.
  if (kept.length !== raw.length || blanked.length !== raw.length) { lengthFailures++; continue; }

  const inPopulation = OPEN_BRACE.test(blankLongStrings(raw, 2))
    && CLOSE_BRACE.test(blankLongStrings(raw, 2));
  let declared = 0, quoted = 0, other = 0;
  for (const m of raw.matchAll(MARKER_ALL)) {
    const at = m.index;
    const probe = 'brace-slicer-deliberate:';
    const inKept = kept.startsWith(probe, at);
    const inBlanked = blanked.startsWith(probe, at);
    if (!inKept) declared++;            // gone once comments are blanked → it was a comment
    else if (!inBlanked) quoted++;      // survives strings-kept, gone strings-blanked → a string
    else other++;
  }
  rows.push({ rel, inPopulation, declared, quoted, other, total: declared + quoted + other });
}

console.log('posthoc-declared-vs-quoted — is a counted marker a DECLARED exemption or a QUOTED token?');
console.log(`  (POST-HOC, not registered. ${rows.length} marker-bearing tracked code file(s).)\n`);
console.log(`  stripSource length-preservation failures: ${lengthFailures}  (non-zero invalidates every offset below)\n`);

const show = (title, pred) => {
  const set = rows.filter(pred);
  const sum = (k) => set.reduce((n, r) => n + r[k], 0);
  console.log(`  ${title}: ${set.length} file(s) · declared=${sum('declared')} quoted=${sum('quoted')} other=${sum('other')}`);
  for (const r of set) {
    const tags = [r.declared && `${r.declared} declared`, r.quoted && `${r.quoted} QUOTED`,
      r.other && `${r.other} other`].filter(Boolean).join(', ');
    console.log(`      ${r.rel}  (${tags})`);
  }
  console.log('');
  return set;
};

const marked = show('IN the population — the gate\'s MARKED column, which GRANTS the exemption',
  (r) => r.inPopulation);
const deadSet = show('OUT of the population — this fire\'s dead-marker disclosure',
  (r) => !r.inPopulation);

/* ------------------------------------------------------------------------- the findings */
const quotedOnlyMarked = marked.filter((r) => r.declared === 0 && r.quoted > 0);
const quotedOnlyDead = deadSet.filter((r) => r.declared === 0 && r.quoted > 0);

const checks = [
  ['offsets are valid — stripSource preserved length on every file read', lengthFailures === 0],
  ['this unit\'s own cripple is in the dead set and its marker is QUOTED, not declared',
    deadSet.some((r) => r.rel.endsWith('unit-487markerreport-2026-11-19/cripple-dead-marker-key.mjs')
      && r.declared === 0 && r.quoted > 0)],
];
console.log('');
for (const [label, ok] of checks) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);

console.log(`\n  THE REACH, both directions:`);
console.log(`    MARKED files whose ONLY marker is a quoted token (a silent, undeclared exemption):`
  + ` ${quotedOnlyMarked.length}`);
for (const r of quotedOnlyMarked) console.log(`        ${r.rel}`);
console.log(`    dead-marker files whose ONLY marker is a quoted token (my report over-admitting):`
  + ` ${quotedOnlyDead.length}`);
for (const r of quotedOnlyDead) console.log(`        ${r.rel}`);
console.log(`\n  If the first number is 0, requirement 3's exemption class is CLEAN TODAY and this is`
  + ` a declared reach with no members — held open by this leg rather than by a claim.`);
console.log(`  If it is non-zero, the gate is exempting files nobody exempted, and that is a red's`
  + ` worth of finding rather than a disclosure's.`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
