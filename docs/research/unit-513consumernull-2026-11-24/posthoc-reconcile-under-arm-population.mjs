#!/usr/bin/env node
/**
 * unit-513consumernull — post-hoc 7 (STOP fire 2026-11-24)
 *
 * WHY THIS EXISTS, AND IT IS A CORRECTION OF MY OWN POST-HOC 6.
 *
 * Post-hoc 6 published "THE ARM UNDER-COUNTED — 4 sites were matchable by the arm's OWN key in
 * files that existed at its own commit, and are not in the published 23." That verdict is wrong,
 * and it is wrong for the reason this thread has written down more than once: I reproduced the
 * arm's SELECTOR byte-identically and did not reproduce its POPULATION RULE. The arm filters its
 * census (arm-consumernull.mjs:283):
 *
 *     const corpus = allSites.filter((s) => !s.rel.startsWith(SELF_DIR) && s.rel !== GATE);
 *
 * Post-hoc 6 applied neither exclusion. A selector copied exactly, dropped into a wider
 * population, returns a different figure and the difference reads as the other party's error.
 *
 * WHAT THIS DRIVES. The same line-level reconciliation, with the arm's population rule applied —
 * and with SELF_DIR and GATE read OUT OF THE ARM'S SOURCE rather than retyped here, so the
 * exclusion is provenanced the same way the selector is. Three figures are published:
 *
 *   A  PRESENT-THEN, no exclusions          (post-hoc 6's population — expected 27)
 *   B  PRESENT-THEN, arm's exclusions       (the arm's population — the claim under test is 23)
 *   C  the excluded sites, printed in full  (so B − A is shown, not asserted)
 *
 * THE DIRECTION THIS CAN STILL FAIL. If B is 23, post-hoc 6 is retracted and the arm's figure is
 * confirmed. If B is NOT 23, the arm's figure is wrong for some other reason and that reason is
 * NOT yet known — this script does not get to assume which way it lands, and the verdict text
 * below is written for all three directions before the drive.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const CAPS = join(HERE, 'captures');
mkdirSync(CAPS, { recursive: true });

const LABEL = 'tracked files read';
const ARM_COMMIT = '2473f854';
const PUBLISHED_SITES = 23;
const CODE_EXT = new Set(['.mjs', '.mts', '.ts', '.js', '.cjs', '.tsx', '.jsx']);
const SELF = 'docs/research/unit-513consumernull-2026-11-24/posthoc-reconcile-under-arm-population.mjs';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

const REGEX_LITERAL = /\/(?:[^/\\\n]|\\.)+\/[a-z]*/g;

function keyOldSites(src) {
  const hits = [];
  if (!src.includes(LABEL)) return hits;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(LABEL)) continue;
    for (const m of lines[i].matchAll(REGEX_LITERAL)) {
      if (!m[0].includes(LABEL)) continue;
      hits.push({ line: i + 1, pattern: m[0] });
    }
  }
  return hits;
}

say('unit-513 post-hoc 7 — the reconciliation re-driven under the ARM\'S OWN POPULATION RULE');
say('(this retracts or confirms post-hoc 6\'s "the arm under-counted")');
say('');

// ---------------------------------------------------------------- §0 provenance: selector AND rule

const armRel = 'docs/research/unit-513consumernull-2026-11-24/arm-consumernull.mjs';
const armSrc = readFileSync(join(ROOT, armRel), 'utf8');
const armSrcLines = armSrc.split('\n');

const armSelLine = armSrcLines.find((l) => l.includes('const REGEX_LITERAL'));
const mySelLine = readFileSync(join(ROOT, SELF), 'utf8').split('\n')
  .find((l) => l.includes('const REGEX_LITERAL'));

/** Pull the arm's own exclusion constants out of the arm's source. Not retyped. */
function armConst(name) {
  const l = armSrcLines.find((x) => new RegExp(`const\\s+${name}\\s*=`).test(x));
  if (!l) return null;
  const m = l.match(/=\s*'([^']*)'/);
  return m ? m[1] : null;
}
const SELF_DIR = armConst('SELF_DIR');
const GATE = armConst('GATE');
const filterLine = armSrcLines.find((l) => l.includes('const corpus = allSites.filter'));

say('## §0 provenance — selector AND population rule, both read from the arm');
say(`  selector line byte-identical: ${armSelLine.trim() === mySelLine.trim() ? 'YES' : 'NO'}`);
say(`  SELF_DIR read from arm source: ${SELF_DIR === null ? '(NOT FOUND)' : SELF_DIR}`);
say(`  GATE     read from arm source: ${GATE === null ? '(NOT FOUND)' : GATE}`);
say(`  arm's filter line: ${filterLine ? filterLine.trim() : '(NOT FOUND)'}`);
const provOk = armSelLine.trim() === mySelLine.trim() && SELF_DIR && GATE && filterLine;
if (!provOk) {
  say('  ABORT — cannot reproduce the arm\'s population rule from its own source.');
  writeFileSync(join(CAPS, 'POSTHOC-ARMPOP.out'), out.join('\n') + '\n');
  process.exit(2);
}
say('');

// ---------------------------------------------------------------- §1 blob reader KP

function blobAt(commit, path) {
  try {
    return execFileSync('git', ['-C', ROOT, 'show', `${commit}:${path}`], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    const msg = String(e.stderr || e.message || '');
    if (/exists on disk, but not in|does not exist in/i.test(msg)) return null;
    throw new Error(`blob oracle failed on ${path}: ${msg.trim().slice(0, 160)}`);
  }
}

say('## §1 blob reader — known positives FIRST');
const armBlob = blobAt(ARM_COMMIT, armRel);
const armBlobSites = armBlob === null ? -1 : keyOldSites(armBlob).length;
const kps = [
  [armBlob !== null && armBlob.length > 0, `arm blob readable, non-empty (${armBlob === null ? 'null' : armBlob.length + ' B'})`],
  [armBlobSites > 0, `selector non-zero on that blob (${armBlobSites})`],
  [blobAt(ARM_COMMIT, 'docs/research/NO-SUCH-FILE-trap.mjs') === null, 'absent path returns null, not empty text'],
  [keyOldSites(armBlob).length === 4, `the arm's own fixture patterns in its own blob: ${keyOldSites(armBlob).length} (expected 4 — the candidate +4)`],
];
for (const [ok, why] of kps) say(`  ${ok ? 'PASS' : 'FAIL'}  ${why}`);
say('');
say(`BLOB READER KNOWN POSITIVES: ${kps.filter(([o]) => o).length} of ${kps.length}`);
if (!kps.every(([o]) => o)) {
  say('ABORT.');
  writeFileSync(join(CAPS, 'POSTHOC-ARMPOP.out'), out.join('\n') + '\n');
  process.exit(3);
}
say('');

// ---------------------------------------------------------------- §2 three figures

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean)
  .filter((p) => CODE_EXT.has(p.slice(p.lastIndexOf('.'))));

const headSites = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  for (const h of keyOldSites(src)) headSites.push({ rel, ...h });
}

const thenCounts = new Map();
const existedThen = new Map();
for (const rel of new Set(headSites.map((s) => s.rel))) {
  const blob = blobAt(ARM_COMMIT, rel);
  existedThen.set(rel, blob !== null);
  if (blob === null) continue;
  for (const h of keyOldSites(blob)) {
    const k = `${rel}\u0000${h.pattern}`;
    thenCounts.set(k, (thenCounts.get(k) || 0) + 1);
  }
}

const budget = new Map(thenCounts);
const presentThenAll = [];
for (const s of headSites) {
  if (!existedThen.get(s.rel)) continue;
  const k = `${s.rel}\u0000${s.pattern}`;
  const left = budget.get(k) || 0;
  if (left > 0) { budget.set(k, left - 1); presentThenAll.push(s); }
}

const isExcluded = (rel) => rel.startsWith(SELF_DIR) || rel === GATE;
const presentThenArmPop = presentThenAll.filter((s) => !isExcluded(s.rel));
const excluded = presentThenAll.filter((s) => isExcluded(s.rel));

say('## §2 three figures');
say(`  A  PRESENT-THEN, no exclusions (post-hoc 6's population)   ${presentThenAll.length}`);
say(`  B  PRESENT-THEN, arm's own exclusions applied              ${presentThenArmPop.length}`);
say(`  C  excluded by the arm's rule                              ${excluded.length}`);
say(`     A − C = ${presentThenAll.length - excluded.length}   (must equal B: ${presentThenAll.length - excluded.length === presentThenArmPop.length ? 'YES' : 'NO'})`);
say('');

say('## §3 the excluded sites, printed in full rather than sized');
if (excluded.length === 0) say('  none.');
else for (const s of excluded) {
  const why = s.rel === GATE ? 'GATE' : 'SELF_DIR';
  say(`  [${why}] ${s.rel}:${s.line}  ${s.pattern.slice(0, 60)}`);
}
say('');

// ---------------------------------------------------------------- §4 verdict, all directions

say('## §4 verdict');
say(`  Published by the arm: ${PUBLISHED_SITES}`);
say(`  B (arm's population, re-driven at line level): ${presentThenArmPop.length}`);
const d = presentThenArmPop.length - PUBLISHED_SITES;
say(`  delta: ${d >= 0 ? '+' : ''}${d}`);
say('');
if (d === 0) {
  say('  POST-HOC 6 IS RETRACTED. The arm did not under-count. Its published 23 is reproduced');
  say('  EXACTLY once its own population rule is applied alongside its selector. The +4 post-hoc 6');
  say('  reported as a miss is the arm\'s own four fixture patterns, which the arm excluded');
  say('  deliberately so as not to join the population it grades.');
  say('');
  say('  THE DEFECT WAS MINE AND ITS SHAPE IS WORTH THE NAME: I copied the selector line');
  say('  byte-for-byte, asserted that provenance in §0 of two scripts, and that assertion made the');
  say('  reconciliation FEEL reproduced while the population silently differed. A byte-identical');
  say('  selector in a wider population is a different instrument, and it fails by accusing the');
  say('  other figure rather than by going quiet.');
} else if (d > 0) {
  say(`  THE ARM STILL UNDER-COUNTS BY ${d} with its own exclusions applied. Post-hoc 6's direction`);
  say('  survives this correction and the cause is NOT the self-exclusion. Unexplained — named.');
} else {
  say(`  THE ARM'S 23 EXCEEDS THIS RE-DRIVE BY ${-d}. Candidate: sites in files deleted or renamed`);
  say('  since the arm commit, which a HEAD-first partition cannot see. Unexplained — named.');
}
say('');
say('## §5 what is still not driven');
say('  - Deleted/renamed files: a site matchable at the arm commit in a file that no longer exists');
say('    at HEAD is invisible to every rung of this reconciliation. Not driven.');
say('  - The non-literal matcher form (post-hoc 4) is a measured 0 with one declared blindness');
say('    (concatenated patterns). Unchanged by this correction.');

writeFileSync(join(CAPS, 'POSTHOC-ARMPOP.out'), out.join('\n') + '\n');
say('');
say(`capture sha12 ${sha12(out.join('\n'))}`);
