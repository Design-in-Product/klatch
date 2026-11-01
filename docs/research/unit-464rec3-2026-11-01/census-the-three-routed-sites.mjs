#!/usr/bin/env node
// unit-464rec3 — the exposure of each of the three sites Theseus named, measured one site at a
// time against the source that names it. Grades P1, P2, P3 and the sibling-disagreement
// question that P2 did not anticipate.
//
// Every git call is a separate execFileSync with its own argv array, never nested inside
// another, because an enclosing call absorbs its inner call's argv (Theseus, unit-464rec §3.1).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: REPO,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'], // pinned: a child's stderr must not land in the recording
    });
  } catch {
    return null; // refusal, distinct from an empty result
  }
};
const lines = (s) => (s === null ? null : s.split('\n').filter((l) => l.length > 0));

const REV = git(['rev-parse', 'HEAD']).trim();
console.log(`# unit-464rec3 census — rev ${REV}`);
console.log(`# every figure below is read at this rev; a later rev may read differently\n`);

const S1_FILE = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';
const S1_GREP = 'the 375/376 cure landed';
const S2_FILE = 'docs/research/round397-instruments/probe-the-anchor-that-is-not-guarded.mjs';
const S3_FILE = 'docs/research/round397-instruments/grade-the-anchor-that-is-not-guarded.mjs';
const HIS_396_PATH =
  'docs/research/round396-instruments/grade-the-grade-that-reddens-on-its-own-routed-cure.mjs';
const MY_395_PATH =
  'docs/research/round395-instruments/grade-the-refusal-that-deletes-the-verdict.mjs';

// ── S1 ───────────────────────────────────────────────────────────────────────────────────────
// The defect: `log -1 --grep=X` answers "the NEWEST commit whose message matches X", and the
// instrument's `pre()` then reads `CURE^`, i.e. the tree BEFORE whatever that commit is.
console.log('## S1 — ' + S1_FILE + ':43');
const s1Matches = lines(git(['log', '--format=%H %an %ad %s', '--date=short', `--grep=${S1_GREP}`]));
const s1Count = s1Matches === null ? null : s1Matches.length;
console.log(`[MEAS] commits whose message matches ${JSON.stringify(S1_GREP)}: ${s1Count}`);
for (const m of s1Matches ?? []) console.log('        ' + m);

// `log -1` takes the newest; the curing commit is the OLDEST match, because the cure landed once.
const s1Newest = s1Matches === null || s1Matches.length === 0 ? null : s1Matches[0].split(' ')[0];
const s1Oldest =
  s1Matches === null || s1Matches.length === 0 ? null : s1Matches[s1Matches.length - 1].split(' ')[0];
console.log(`[MEAS] what \`log -1 --grep\` resolves to (newest match): ${s1Newest ?? 'REFUSED'}`);
console.log(`[MEAS] what the cure should resolve to (oldest match):   ${s1Oldest ?? 'REFUSED'}`);
const s1Agree = s1Newest !== null && s1Newest === s1Oldest;
console.log(`[P1] S1 latent today (exactly 1 match, newest === oldest): ${s1Count === 1 && s1Agree}`);

// P5 — is his `--diff-filter=A` cure shape even applicable here?
const s1Src = readFileSync(join(REPO, S1_FILE), 'utf8');
const s1Line = (s1Src.split('\n')[42] ?? '');
const s1HasPathspec = s1Line.includes("'--'") || s1Line.includes('"--"');
console.log(`[MEAS] S1's git argv contains a \`--\` pathspec separator: ${s1HasPathspec}`);
console.log(
  `[P5] his --diff-filter=A shape is INAPPLICABLE to S1 (no pathspec to filter events on): ` +
    `${s1HasPathspec === false}`,
);

// ── S2 ───────────────────────────────────────────────────────────────────────────────────────
console.log('\n## S2 — ' + S2_FILE + ':40');
const s2All = lines(git(['log', '--format=%h %ad %s', '--date=short', '--', HIS_396_PATH]));
console.log(`[MEAS] commits touching HIS_396_PATH: ${s2All === null ? 'REFUSED' : s2All.length}`);
for (const m of s2All ?? []) console.log('        ' + m);
const s2Recency = (git(['log', '-1', '--format=%h', '--', HIS_396_PATH]) ?? '').trim() || null;
const s2Added = (git(['log', '--diff-filter=A', '--format=%h', '--', HIS_396_PATH]) ?? '').trim() || null;
console.log(`[MEAS] what the probe's \`log -1\` resolves to:        ${s2Recency ?? 'REFUSED'}`);
console.log(`[MEAS] what \`--diff-filter=A\` (the add event) resolves to: ${s2Added ?? 'REFUSED'}`);
console.log(
  `[P2] S2 latent today (1 commit, both selectors agree): ` +
    `${s2All !== null && s2All.length === 1 && s2Recency !== null && s2Recency === s2Added}`,
);

// The question P2 did not anticipate: the sibling grade in the SAME directory pins this very
// name as a literal. Do the two spellings of HIS_396_PIN agree?
const s3Src = readFileSync(join(REPO, S3_FILE), 'utf8');
const siblingLiteral = (s3Src.match(/^const HIS_396_PIN = '([0-9a-f]+)';$/m) ?? [null, null])[1];
console.log(`[MEAS] the sibling grade's literal HIS_396_PIN: ${siblingLiteral ?? 'NOT FOUND'}`);
const s2SiblingAgree =
  siblingLiteral !== null && s2Recency !== null && s2Recency.startsWith(siblingLiteral.slice(0, 8));
console.log(
  `[MEAS] probe's derived pin === sibling's literal pin: ${s2SiblingAgree} ` +
    `(derived ${s2Recency ?? 'REFUSED'} vs literal ${siblingLiteral ?? 'NOT FOUND'})`,
);
console.log(
  `[MEAS] two spellings of ONE name in ONE unit directory: ` +
    `probe derives it, grade pins it as a literal — the cure for S2 is already in its sibling`,
);

// ── S3 ───────────────────────────────────────────────────────────────────────────────────────
console.log('\n## S3 — ' + S3_FILE + ':251');
const s3All = lines(git(['log', '--format=%h %ad %s', '--date=short', '--', MY_395_PATH]));
console.log(`[MEAS] commits touching MY_395_PATH: ${s3All === null ? 'REFUSED' : s3All.length}`);
for (const m of s3All ?? []) console.log('        ' + m);
const s3Recency = (git(['log', '-1', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim() || null;
const s3AddedSha = (git(['log', '--diff-filter=A', '--format=%h %s', '--', MY_395_PATH]) ?? '').trim() || null;
console.log(`[MEAS] what \`log -1\` publishes today:      ${s3Recency ?? 'REFUSED'}`);
console.log(`[MEAS] what the add event would publish:   ${s3AddedSha ?? 'REFUSED'}`);
const s3Moved = s3All !== null && s3All.length > 1 && s3Recency !== s3AddedSha;
console.log(`[P3] S3 has ALREADY moved (>1 commit AND the two selectors disagree): ${s3Moved}`);

// Where does S3's value actually reach? Theseus's memo said "display only".
const s3VerdictLine = (s3Src.split('\n')[274] ?? '');
const s3InVerdict = s3VerdictLine.includes('theFixCommit');
console.log(`[MEAS] S3's value appears in the verdict conjunction at :275: ${s3InVerdict}`);
console.log(`        :275 = ${s3VerdictLine.trim()}`);
console.log(
  `[MEAS] the conjunct's predicate, read off the source: ` +
    `${(s3VerdictLine.match(/theFixCommit\.\w+ > \d+/) ?? ['NOT A LENGTH TEST'])[0]}`,
);

console.log('\n# CENSUS DONE — no verdict is published here; the hand-reading in the');
console.log('# RESULTS doc is primary and this census grades that reading.');
