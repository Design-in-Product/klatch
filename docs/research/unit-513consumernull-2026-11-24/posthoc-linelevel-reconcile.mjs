#!/usr/bin/env node
/**
 * unit-513consumernull — post-hoc 6 (STOP fire 2026-11-24)
 *
 * WHY THIS EXISTS. Post-hoc 5 partitioned the 44 HEAD sites by FILE existence at the arm commit
 * and found 27 AT-RISK against a published 23 — delta +4 — then declared its own limit: file
 * existence cannot separate "the arm MISSED a site" from "a site was APPENDED to an old file after
 * the arm ran". It named a line-level reconciliation as the next rung and did not drive it.
 *
 * That rung is driven here, in the same fire, because it has no blocker and it is the difference
 * between a priced gap and an attributed one.
 *
 * THE METHOD. For every AT-RISK file, read its BLOB AT THE ARM COMMIT (`git show <commit>:<path>`)
 * and run the arm's own selector over that blob. Summing those gives what the arm's key WOULD have
 * returned over exactly the files that existed. Partition each HEAD site:
 *
 *   PRESENT-THEN   the same (file, pattern) was already matchable in the arm-commit blob
 *   APPENDED       the file existed but this pattern was not in its arm-commit blob
 *
 * If PRESENT-THEN totals the published 23 and the +4 are all APPENDED, post-hoc 4's prose claim is
 * upheld after all, for a reason it never gave. If PRESENT-THEN EXCEEDS 23, the arm missed sites
 * that were there and the published figure is wrong.
 *
 * MATCHING GRAIN, stated before the result. Sites are compared on (file, pattern-text) and NOT on
 * line number, because any edit above a line moves it — keying on the line number would report
 * every shifted site as APPENDED and manufacture the finding. The cost of that choice is that a
 * pattern DUPLICATED within one file is matched by multiset count, not identity; counts per
 * (file, pattern) are compared, so a file that went from one occurrence to four (the arm's own
 * fixtures do exactly this) is reported as +3 APPENDED rather than as unchanged.
 *
 * KNOWN POSITIVE FIRST. The blob reader is gated on a planted case before any site is classified:
 * the arm-commit blob of the arm itself must be readable AND must yield a non-zero site count
 * under the selector. A blob reader that silently returned empty text would report every site as
 * APPENDED — the direction that would flatter nothing and alarm everything, but still a false
 * finding.
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
const SELF = 'docs/research/unit-513consumernull-2026-11-24/posthoc-linelevel-reconcile.mjs';

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

say('unit-513 post-hoc 6 — line-level reconciliation: did the arm MISS sites, or were they APPENDED?');
say('');

// ---------------------------------------------------------------- §0 provenance

const armRel = 'docs/research/unit-513consumernull-2026-11-24/arm-consumernull.mjs';
const armLine = readFileSync(join(ROOT, armRel), 'utf8').split('\n')
  .find((l) => l.includes('const REGEX_LITERAL'));
const mineLine = readFileSync(join(ROOT, SELF), 'utf8').split('\n')
  .find((l) => l.includes('const REGEX_LITERAL'));
say('## §0 selector provenance');
say(`  byte-identical to the arm's selector line: ${armLine.trim() === mineLine.trim() ? 'YES' : 'NO'}`);
if (armLine.trim() !== mineLine.trim()) {
  say('  ABORT — not the key that produced the 23.');
  writeFileSync(join(CAPS, 'POSTHOC-LINELEVEL.out'), out.join('\n') + '\n');
  process.exit(2);
}
say('');

// ---------------------------------------------------------------- §1 blob reader KP

/** The file's text at <commit>, or null if it was not in that tree. Errors are not swallowed. */
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
const kp1 = armBlob !== null && armBlob.length > 0;
const kp2 = armBlobSites > 0;
const kp3 = blobAt(ARM_COMMIT, 'docs/research/NO-SUCH-FILE-trap.mjs') === null;
say(`  ${kp1 ? 'PASS' : 'FAIL'}  arm blob at ${ARM_COMMIT} readable and non-empty (${armBlob === null ? 'null' : armBlob.length + ' B'})`);
say(`  ${kp2 ? 'PASS' : 'FAIL'}  selector returns non-zero on that blob (${armBlobSites}) — an empty-returning reader would call every site APPENDED`);
say(`  ${kp3 ? 'PASS' : 'FAIL'}  absent path returns null rather than empty text`);
const kpOk = kp1 && kp2 && kp3;
say('');
say(`BLOB READER KNOWN POSITIVES: ${[kp1, kp2, kp3].filter(Boolean).length} of 3`);
if (!kpOk) {
  say('ABORT — an ungated blob reader would attribute the whole gap.');
  writeFileSync(join(CAPS, 'POSTHOC-LINELEVEL.out'), out.join('\n') + '\n');
  process.exit(3);
}
say('');

// ---------------------------------------------------------------- §2 HEAD sites and THEN sites

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean)
  .filter((p) => CODE_EXT.has(p.slice(p.lastIndexOf('.'))));

const headSites = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  for (const h of keyOldSites(src)) headSites.push({ rel, ...h });
}

/** Multiset of (file,pattern) counts in the arm-commit blob of each file that HEAD sites live in. */
const thenCounts = new Map();   // `${rel}\u0000${pattern}` -> count
const thenTotalByFile = new Map();
const fileExistedThen = new Map();
for (const rel of new Set(headSites.map((s) => s.rel))) {
  const blob = blobAt(ARM_COMMIT, rel);
  fileExistedThen.set(rel, blob !== null);
  if (blob === null) continue;
  const hits = keyOldSites(blob);
  thenTotalByFile.set(rel, hits.length);
  for (const h of hits) {
    const k = `${rel}\u0000${h.pattern}`;
    thenCounts.set(k, (thenCounts.get(k) || 0) + 1);
  }
}

const budget = new Map(thenCounts);
const presentThen = [];
const appended = [];
const newFile = [];
for (const s of headSites) {
  if (!fileExistedThen.get(s.rel)) { newFile.push(s); continue; }
  const k = `${s.rel}\u0000${s.pattern}`;
  const left = budget.get(k) || 0;
  if (left > 0) { budget.set(k, left - 1); presentThen.push(s); }
  else appended.push(s);
}

const thenTotalAll = [...thenTotalByFile.values()].reduce((a, b) => a + b, 0);

say('## §2 partition of the 44 HEAD sites');
say(`  HEAD sites                                   ${headSites.length}`);
say(`  NEW-FILE   (file postdates the arm)          ${newFile.length}`);
say(`  PRESENT-THEN (matchable in the arm blob)     ${presentThen.length}`);
say(`  APPENDED   (old file, pattern not then)      ${appended.length}`);
say('');
say(`  Sites the arm's key WOULD have returned over the files HEAD sites live in: ${thenTotalAll}`);
say('');

say('## §3 the APPENDED sites, printed in full');
if (appended.length === 0) say('  none.');
else for (const s of appended) say(`  ${s.rel}:${s.line}  ${s.pattern.slice(0, 70)}`);
say('');

// ---------------------------------------------------------------- §4 verdict

say('## §4 verdict');
say(`  Published at the arm commit: ${PUBLISHED_SITES} sites.`);
say(`  PRESENT-THEN at HEAD:        ${presentThen.length}`);
const overshoot = presentThen.length - PUBLISHED_SITES;
say(`  delta: ${overshoot >= 0 ? '+' : ''}${overshoot}`);
say('');
if (overshoot > 0) {
  say(`  THE ARM UNDER-COUNTED. ${overshoot} site(s) were matchable by the arm's OWN key in files`);
  say('  that existed at its own commit, and are not in the published 23. Post-hoc 4\'s "different');
  say('  commits" prose is REFUTED as the explanation for that part of the gap.');
} else if (overshoot === 0) {
  say('  EXACT. The published 23 is precisely the set that was matchable then; the whole gap to 44');
  say('  is new files and appended patterns. Post-hoc 4\'s prose claim is UPHELD — and it was');
  say('  upheld by a drive, not by the reasoning it offered.');
} else {
  say(`  PUBLISHED EXCEEDS PRESENT-THEN by ${-overshoot}. The 23 counted something this re-drive`);
  say('  does not reach — most likely sites in files DELETED or RENAMED since the arm commit, which');
  say('  this partition cannot see because it starts from HEAD. Reported, not explained.');
}
say('');
say('## §5 limits of THIS rung, stated before anyone cites it');
say('  - Starts from HEAD, so a site that existed at the arm commit in a file since DELETED or');
say('    RENAMED is invisible here. That is the one remaining direction and it is NOT driven.');
say('  - Matches on (file, pattern) multiset counts, not line identity (see the header): a pattern');
say('    duplicated within a file is reconciled by count, so the arm\'s own four identical fixture');
say('    patterns are indistinguishable from each other.');

writeFileSync(join(CAPS, 'POSTHOC-LINELEVEL.out'), out.join('\n') + '\n');
say('');
say(`capture sha12 ${sha12(out.join('\n'))}`);
