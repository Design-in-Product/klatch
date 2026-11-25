#!/usr/bin/env node
/**
 * unit-513consumernull — post-hoc 5 (STOP fire 2026-11-24)
 *
 * WHY THIS EXISTS. Post-hoc 4 re-drove my arm's own site key and got **44** where unit-513's
 * RESULTS published **23**. Post-hoc 4's §4 then *asserted in prose* that the gap is "expected and
 * is NOT a defect" because the two figures are read at different commits and research files were
 * added. That sentence is an UNMEASURED EXPLANATION sitting inside a capture, which is the shape of
 * defect this thread keeps finding in both seats' work. It is graded here instead of believed.
 *
 * THE TEST. For each of the 44 sites, was its file present in the tree at the arm's own commit
 * (`2473f854`, unit-513 Arm)? Partition:
 *
 *   ACCOUNTED   site lives in a file that did NOT exist at the arm commit  → growth, not drift
 *   AT-RISK     site lives in a file that DID exist at the arm commit      → the arm should have
 *               seen it, so every one of these is a candidate MISS by the published 23
 *
 * The prose claim is upheld only if AT-RISK collapses to (approximately) the published 23 — i.e.
 * the arm saw what was there to see. If AT-RISK materially EXCEEDS 23, the published figure missed
 * sites that existed, and the "different commits" story is false.
 *
 * KNOWN POSITIVE FIRST. `git cat-file -e <commit>:<path>` is the existence oracle. It is gated on
 * two planted cases before any site is classified: a path known present at the arm commit (the arm
 * itself) and a path known absent (this file). A classifier whose oracle is untested would put
 * every site in whichever bucket the oracle's failure mode points at — and `cat-file -e` fails by
 * THROWING, so an unguarded failure would read as "absent" and silently ACCOUNT for everything,
 * which is the direction that flatters the claim under test.
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
const SELF = 'docs/research/unit-513consumernull-2026-11-24/posthoc-reconcile-23-to-44.mjs';
const CODE_EXT = new Set(['.mjs', '.mts', '.ts', '.js', '.cjs', '.tsx', '.jsx']);

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const sha12 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);

/** The arm's selector, read FROM the arm's source rather than retyped (asserted below). */
const REGEX_LITERAL = /\/(?:[^/\\\n]|\\.)+\/[a-z]*/g;

function keyOldSites(src) {
  const hits = [];
  if (!src.includes(LABEL)) return hits;
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes(LABEL)) continue;
    for (const m of lines[i].matchAll(REGEX_LITERAL)) {
      if (!m[0].includes(LABEL)) continue;
      hits.push({ line: i + 1, pattern: m[0].slice(0, 70) });
    }
  }
  return hits;
}

say('unit-513 post-hoc 5 — grading post-hoc 4\'s own prose explanation of 23 -> 44');
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
  writeFileSync(join(CAPS, 'POSTHOC-RECONCILE.out'), out.join('\n') + '\n');
  process.exit(2);
}
say('');

// ---------------------------------------------------------------- §1 oracle known positives

say('## §1 existence oracle — known positives FIRST');

/** true iff <path> exists in the tree at <commit>. Throws are NOT swallowed into a verdict. */
function existedAt(commit, path) {
  try {
    execFileSync('git', ['-C', ROOT, 'cat-file', '-e', `${commit}:${path}`], { stdio: 'pipe' });
    return { present: true, errored: false };
  } catch (e) {
    const msg = String(e.stderr || e.message || '');
    // The two stderr forms git ACTUALLY emits for an absent path, both captured by hand from a
    // real failing drive rather than guessed (the first guess here failed KP2 and that is why
    // the oracle is gated):
    //   path '<p>' exists on disk, but not in '<commit>'     — tracked now, absent then
    //   path '<p>' does not exist in '<commit>'              — absent now and then
    // Any OTHER stderr means the oracle itself failed and the answer is UNKNOWN, not "absent".
    const looksAbsent = /exists on disk, but not in|does not exist in/i.test(msg);
    return { present: false, errored: !looksAbsent, stderr: msg.trim().slice(0, 140) };
  }
}

const oracleKP = [
  { path: armRel, want: true, why: 'the arm itself was committed AT the arm commit' },
  { path: SELF, want: false, why: 'on disk now, absent then — git\'s "exists on disk, but not in" form' },
  { path: 'docs/research/NO-SUCH-FILE-oracle-trap.mjs', want: false, why: 'absent now AND then — git\'s "does not exist in" form; both absent shapes must classify' },
  { path: 'package.json', want: true, why: 'a long-lived path outside docs/, so "present" is not an artefact of one directory' },
];
let oracleOk = 0;
for (const k of oracleKP) {
  const r = existedAt(ARM_COMMIT, k.path);
  const ok = r.present === k.want && !r.errored;
  if (ok) oracleOk += 1;
  say(`  ${ok ? 'PASS' : 'FAIL'}  present=${r.present} errored=${r.errored} want=${k.want}  ${k.path}`);
  say(`        ${k.why}`);
}
say('');
say(`ORACLE KNOWN POSITIVES: ${oracleOk} of ${oracleKP.length}`);
if (oracleOk !== oracleKP.length) {
  say('ABORT — an untested existence oracle would sort every site into one bucket.');
  writeFileSync(join(CAPS, 'POSTHOC-RECONCILE.out'), out.join('\n') + '\n');
  process.exit(3);
}
say('');

// ---------------------------------------------------------------- §2 the 44, partitioned

say('## §2 the sites at HEAD, partitioned by existence at the arm commit');

const tracked = execFileSync('git', ['-C', ROOT, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n').filter(Boolean)
  .filter((p) => CODE_EXT.has(p.slice(p.lastIndexOf('.'))));

const sites = [];
for (const rel of tracked) {
  let src;
  try { src = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }
  for (const h of keyOldSites(src)) sites.push({ rel, ...h });
}

const fileVerdict = new Map();
let oracleFailures = 0;
for (const s of sites) {
  if (!fileVerdict.has(s.rel)) {
    const r = existedAt(ARM_COMMIT, s.rel);
    if (r.errored) oracleFailures += 1;
    fileVerdict.set(s.rel, r);
  }
}

const accounted = sites.filter((s) => !fileVerdict.get(s.rel).present && !fileVerdict.get(s.rel).errored);
const atRisk = sites.filter((s) => fileVerdict.get(s.rel).present);
const unknown = sites.filter((s) => fileVerdict.get(s.rel).errored);

say(`  sites at HEAD                 ${sites.length}`);
say(`  ACCOUNTED (file is new)       ${accounted.length}`);
say(`  AT-RISK   (file existed)      ${atRisk.length}`);
say(`  UNKNOWN   (oracle failed)     ${unknown.length}`);
say(`  oracle failures               ${oracleFailures}`);
say('');

say('## §3 the AT-RISK sites, printed in full');
if (atRisk.length === 0) {
  say('  none — every site at HEAD lives in a file that postdates the arm.');
} else {
  for (const s of atRisk) say(`  ${s.rel}:${s.line}  ${s.pattern}`);
}
say('');

if (unknown.length > 0) {
  say('## §3b UNKNOWN sites — reported, never folded into either bucket');
  for (const s of unknown) say(`  ${s.rel}:${s.line}  oracle stderr: ${fileVerdict.get(s.rel).stderr}`);
  say('');
}

// ---------------------------------------------------------------- §4 verdict

say('## §4 verdict on post-hoc 4\'s prose claim');
say(`  Post-hoc 4 said the 23 -> ${sites.length} gap is "expected and is NOT a defect".`);
say(`  Published sites at the arm commit: ${PUBLISHED_SITES}`);
say(`  Sites at HEAD whose file ALREADY EXISTED at the arm commit: ${atRisk.length}`);
const delta = atRisk.length - PUBLISHED_SITES;
say(`  delta (AT-RISK − published): ${delta >= 0 ? '+' : ''}${delta}`);
say('');
if (unknown.length > 0) {
  say('  UNGRADEABLE — the oracle failed on at least one site; no verdict is published.');
} else if (delta <= 0) {
  say('  UPHELD — every site that existed when the arm ran is covered by the published 23.');
  say('  The growth is new files, exactly as claimed.');
} else {
  say(`  REFUTED IN PART — ${delta} site(s) lived in files that existed when the arm ran and are`);
  say('  not covered by the published 23. "Different commits" does not account for those. They are');
  say('  either sites the arm missed, or sites ADDED to pre-existing files after the arm ran —');
  say('  which this key cannot tell apart, because it keys on FILE existence, not LINE existence.');
  say('  Stated as the limit it is: this partition prices the gap, it does not attribute it.');
}
say('');
say('## §5 the limit of this reconciliation, stated before anyone cites it');
say('  Keying on file existence CANNOT separate "the arm missed a site" from "a site was appended');
say('  to an old file afterwards". A line-level reconciliation would need the arm-commit blob of');
say('  every AT-RISK file re-scanned with the same key. That is the next rung and it is NOT driven');
say('  here — named, unblocked, not claimed as done.');

writeFileSync(join(CAPS, 'POSTHOC-RECONCILE.out'), out.join('\n') + '\n');
say('');
say(`capture sha12 ${sha12(out.join('\n'))}`);
