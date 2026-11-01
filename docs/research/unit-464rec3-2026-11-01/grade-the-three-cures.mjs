#!/usr/bin/env node
// unit-464rec3 — grade the three cures. Each leg reads the CURED source and asks whether the
// cure does what its own note claims, and the S3 leg re-runs drive4's cripple against the NEW
// conjunct so the cure is graded by the instrument that showed the old one vacuous.
//
// Round397's own filed `.out` recordings are NOT re-driven here: re-driving the instruments
// would re-stamp the recordings they produced. The cures are verified against source and git,
// which is the granularity the cures were made at.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
};
const parses = (p) => {
  try {
    execFileSync(process.execPath, ['--check', join(REPO, p)], { stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
};

const S1 = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';
const S2 = 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs';
const S3 = 'docs/research/round397-instruments/grade-the-anchor-that-is-not-guarded.mjs';
const HIS_396_PATH =
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const MY_395_PATH =
  'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';

console.log(`# unit-464rec3 — grading the three cures, rev ${git(['rev-parse', 'HEAD']).trim()}`);

const legs = [];
const g = (id, claim, pass) => {
  legs.push([id, pass]);
  console.log(`\n[${id}] ${pass === null ? 'REFUSED' : pass ? 'GREEN' : 'RED'} — ${claim}`);
};

// ── all three parse ──────────────────────────────────────────────────────────────────────────
const allParse = [S1, S2, S3].every(parses);
for (const p of [S1, S2, S3]) console.log(`[MEAS] node --check ${p}: ${parses(p)}`);
g('C0', 'all three edited instruments still parse', allParse);

// ── S1 ───────────────────────────────────────────────────────────────────────────────────────
const s1Src = readFileSync(join(REPO, S1), 'utf8');
const s1Pin = (s1Src.match(/^const CURE = '([0-9a-f]{40})';$/m) ?? [null, null])[1];
const s1NoRecency = !/const CURE = execFileSync/.test(s1Src);
const s1GrepHits = (git(['log', '--format=%H', '--grep=the 375/376 cure landed']) ?? '')
  .trim().split('\n').filter((l) => l.length > 0);
const s1PinSelected = s1Pin !== null && s1GrepHits.includes(s1Pin);
const s1ParentResolves = s1Pin !== null && git(['rev-parse', `${s1Pin}^`]) !== null;
console.log(`[MEAS] S1's pin: ${s1Pin ?? 'NOT FOUND'}`);
console.log(`[MEAS] the subject phrase currently selects ${s1GrepHits.length} commit(s)`);
console.log(`[MEAS] the pin is among them: ${s1PinSelected}; its parent resolves: ${s1ParentResolves}`);
g('C1', 'S1 is a literal pin, no longer a recency selector, and the pin is still the commit ' +
  'its own subject names', s1Pin !== null && s1NoRecency && s1PinSelected && s1ParentResolves);

// C1b is NOT graded here. The version of it that shipped in drive5 was vacuous — it asserted
// that the grep's hit list excludes a 40-zero sha, which is true by construction and exercises
// none of S1's guard. It is replaced by an execution in `drive-s1-guard-cripple.mjs`
// (drive6): the guard is silent at exit 0 under the correct pin and fatal at exit 1 under a
// real-but-unnamed one, graded as a delta between two generated arms. Asserting it a second
// time from source here would re-grade my own transcription of it.
console.log(`[MEAS] C1b is driven, not asserted here — see drive6-s1-guard.out`);

// ── S2 ───────────────────────────────────────────────────────────────────────────────────────
const s2Src = readFileSync(join(REPO, S2), 'utf8');
const s2Pin = (s2Src.match(/^const HIS_396_PIN = '([0-9a-f]+)';$/m) ?? [null, null])[1];
const s2NoRecency = !/const HIS_396_PIN = git\(\['log', '-1'/.test(s2Src);
const s2Added = (git(['log', '--diff-filter=A', '--format=%h', '--', HIS_396_PATH]) ?? '').trim();
const s2LabelFixed = !/git log -1 on the path, measured here/.test(s2Src);
console.log(`[MEAS] S2's pin: ${s2Pin ?? 'NOT FOUND'}; the path's add event: ${s2Added}`);
console.log(`[MEAS] the stale "(git log -1 on the path)" label is gone: ${s2LabelFixed}`);
g('C2', 'S2 is pinned to the add event, the recency call is gone, and the printed label no ' +
  'longer describes the method it stopped using',
  s2Pin !== null && s2NoRecency && s2Pin === s2Added && s2LabelFixed);

// The decisive one: does the lift now read the text his round PUBLISHED, i.e. the defect?
const liftAt = (rev) => {
  const src = git(['show', `${rev}:${HIS_396_PATH}`]);
  return src === null ? null : (src.match(/^const renamedAway = .*$/m) ?? [null])[0];
};
const atPin = liftAt(s2Pin);
const atRecency = liftAt((git(['log', '-1', '--format=%h', '--', HIS_396_PATH]) ?? '').trim());
const defectiveShape = atPin !== null && atPin.includes('readFileSync');
console.log(`[MEAS] the line at the pin is the DEFECTIVE spelling (reads the file twice): ${defectiveShape}`);
console.log(`[MEAS] the line differs from what the old recency key would have lifted: ${atPin !== atRecency}`);
g('C2b', 'S2 now lifts the defective spelling its round exists to grade, and that text is ' +
  'different from what the uncured key lifted',
  defectiveShape && atPin !== atRecency);

// ── S3 ───────────────────────────────────────────────────────────────────────────────────────
const s3Src = readFileSync(join(REPO, S3), 'utf8');
const s3Pin = (s3Src.match(/^const THE_FIX_PIN = '([0-9a-f]+)';$/m) ?? [null, null])[1];
const s3InHistory = s3Pin !== null &&
  (git(['log', '--format=%h', '--', MY_395_PATH]) ?? '').trim().split('\n').includes(s3Pin);
console.log(`[MEAS] S3's pin: ${s3Pin ?? 'NOT FOUND'}; in MY_395_PATH's history: ${s3InHistory}`);
g('C3', 'S3 publishes a pinned identity that is actually in the path\'s history',
  s3Pin !== null && s3InHistory);

// C3b — drive4's cripple, re-run against the NEW conjunct. The delta is the evidence.
const verdictLine = s3Src.split('\n').find((l) => l.includes('theFixCommit.startsWith')) ?? '';
const newPredicate = /theFixCommit\.startsWith\(THE_FIX_PIN\)/.test(verdictLine);
const resolve = (rev) => (git(['log', '-1', '--format=%h %s', rev]) ?? '').trim();
const arms = {
  'NO-CRIPPLE (the pin itself)': resolve(s3Pin),
  'KP (the add event — the value the OLD key had already drifted off)':
    (git(['log', '--diff-filter=A', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim(),
  'KP (what the old `log -1` would give today)':
    (git(['log', '-1', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim(),
  'KP (the repo root)': resolve((git(['log', '--reverse', '--format=%h', 'HEAD']) ?? '').split('\n')[0]),
};
const oldConjunct = (v) => v.length > 8;
const newConjunct = (v) => v.startsWith(s3Pin ?? '\u0000');
console.log(`\n# the same four arms, under the OLD conjunct and the NEW one`);
let oldMoved = false, newMoved = false;
const liveOld = oldConjunct(arms['NO-CRIPPLE (the pin itself)']);
const liveNew = newConjunct(arms['NO-CRIPPLE (the pin itself)']);
for (const [arm, v] of Object.entries(arms)) {
  const o = oldConjunct(v), n = newConjunct(v);
  if (arm.startsWith('KP')) { if (o !== liveOld) oldMoved = true; if (n !== liveNew) newMoved = true; }
  console.log(`[MEAS] old=${String(o).padEnd(5)} new=${String(n).padEnd(5)}  ${v.slice(0, 44)}`);
  console.log(`         arm: ${arm}`);
}
console.log(`\n[MEAS] under the OLD conjunct, any KP arm moves the verdict: ${oldMoved}`);
console.log(`[MEAS] under the NEW conjunct, any KP arm moves the verdict: ${newMoved}`);
g('C3b', 'the re-keyed conjunct is falsifiable by exactly the movement the old one could not ' +
  'see — graded as a delta against the same arms, not as an absolute',
  newPredicate && oldMoved === false && newMoved === true);

// ── summary ──────────────────────────────────────────────────────────────────────────────────
const red = legs.filter(([, p]) => p === false);
const refused = legs.filter(([, p]) => p === null);
console.log(`\n# ${legs.length} legs — ${legs.length - red.length - refused.length} green, ` +
  `${red.length} red, ${refused.length} refused`);
console.log(`# VERDICT: ${red.length === 0 && refused.length === 0 ? 'ALL CURES HOLD' :
  'NOT CLEAN — ' + [...red, ...refused].map(([id]) => id).join(', ')}`);
