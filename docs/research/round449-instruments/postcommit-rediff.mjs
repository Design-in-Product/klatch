/**
 * Round 449 — the post-commit re-drive.
 *
 * The class this exists for has inverted a cell in this round track repeatedly and a reread cannot
 * catch it: an instrument that sources its population from `HEAD` measures a DIFFERENT population
 * once its own files are committed. So the verdict is re-taken after promotion and diffed against
 * the pre-commit recording, field by field, with every moving field classified as EXPECTED or not
 * BEFORE the diff is read (431 — commit, re-drive, diff the VERDICT map).
 *
 * Round 449 has an unusually large expected movement and it is worth naming in advance, because it
 * is also evidence for `W10`: promoting this round adds its own `.out` recordings to the committed
 * population, and those recordings use the LIB's row grammar, which neither row reader can read. So
 * `W10`'s "neither agrees" cell MUST grow on promotion. A pin on that count would redden on its own
 * promotion (377); it is reported here and gated nowhere.
 *
 * Scratch goes under `os.tmpdir()`, never in the tree — a scratch file reached `origin/main` in
 * this repo as recently as this morning.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { readVerdict, writeRecording } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SUBJECT = join(HERE, 'resolve-the-variable-write-targets.mjs');
// `drive15`, not `drive7`: `drive7` was recorded by an earlier state of the instrument inside this
// same fire, and comparing the post-commit drive against it would attribute this round's own
// in-fire repairs to the commit.
const PRE = join(HERE, 'drive21.pre-commit.out');

const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// Fields that MUST move across the commit, named before the diff is read. Anything else that moves
// is a finding, not a footnote.
const EXPECTED_TO_MOVE = [
  { key: 'REV:', why: 'the rev this drive measures is the new commit' },
  { key: 'EXCLUDED as this instrument', why: 'self-exclusion goes 0 -> 1 once this file is tracked — it is VACUOUS before promotion and this is the drive that reads it (434)' },
  { key: 'tracked .mjs under docs/', why: 'this round adds its own .mjs files to the population' },
  { key: 'population ', why: 'same' },
  { key: 'committed .out recordings', why: 'this round adds its own recordings' },
  { key: 'ROW-TOKEN VOCABULARY', why: 'this round\'s recordings carry the lib grammar' },
  { key: 'AGREEMENT WITH THE RECORDING', why: 'W10 — this round\'s own recordings land in the "neither agrees" cell, which is the finding reddening on its own promotion if it were gated. It is not' },
  { key: 'cell [448 row count', why: 'same' },
  { key: 'other write tokens found', why: 'this round\'s .mjs files are in the population' },
  { key: 'blind `writeFileSync(` token count', why: 'this round\'s .mjs files are in the population' },
  { key: 'resolved ', why: 'same' },
  { key: 'TRACKED targets', why: 'same' },
  { key: 'UNMODELLED by form', why: 'same' },
  { key: '        TRACKED', why: 'same' },
  { key: '        UNTRACKED', why: 'same' },
  { key: '        OUTSIDE', why: 'same' },
  { key: '        AMBIGUOUS', why: 'same' },
  { key: '        UNMODELLED', why: 'same' },
  { key: 'old tracked set at', why: 'same' },
  { key: 'in mine and not his', why: 'same' },
  { key: 'residue ', why: 'same' },
  { key: 'tracked MODIFIED on entry', why: 'the working tree differs before and after the commit' },
  { key: 'untracked on entry', why: 'same' },
  { key: 'files in the population that IMPORT renderTail', why: 'this round\'s files join the population' },
  { key: 'spellings each reader matches', why: 'the exemplar may now come from one of this round\'s recordings' },
  { key: '          AGREE', why: 'the two printed exemplar members are the first two of a changed population' },
  { key: '          DISAGREE', why: 'same' },
  { key: 'recordings carrying a RED leg', why: 'same' },
  { key: 'deepest chain any site needed', why: 'this round\'s .mjs files are in the population' },
  // Added AFTER the first post-commit drive flagged it UNEXPECTED, which is the honest record:
  // the declaration above was written before the diff was read and it missed this one. THIS file
  // calls the write-guard helper and was committed between the two drives, so it joins the
  // population and the adoption figure moves 5 -> 6. Same mechanism as every other mover here; I
  // had enumerated the `.mjs`-population consequences and missed the one keyed on a different
  // token. The key below deliberately omits the helper's opening paren, because a key CONTAINING
  // the token this leg counts would bump the count again on its own promotion (425).
  { key: 'call sites in the population:', why: 'this file calls the write-guard helper and joined the population in the commit being diffed' },
];

const post = execFileSync('node', [SUBJECT], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const pre = readFileSync(PRE, 'utf8');

const vPre = readVerdict(pre);
const vPost = readVerdict(post);
const mapOf = (v) => (v.ok !== true ? { refusal: v.refusal } : {
  token: v.verdict.token ?? null,
  legs: v.verdict.legs,
  red: v.verdict.red,
  refused: v.verdict.refused,
  refuted: v.verdict.refuted,
  prefused: v.verdict.prefused,
});
const mPre = mapOf(vPre);
const mPost = mapOf(vPost);
const identical = JSON.stringify(mPre) === JSON.stringify(mPost);

const lineOf = (t) => t.split('\n');
const preL = lineOf(pre);
const postL = lineOf(post);
const moved = [];
for (let i = 0; i < Math.max(preL.length, postL.length); i += 1) {
  if (preL[i] !== postL[i]) moved.push({ i, pre: preL[i] ?? '(absent)', post: postL[i] ?? '(absent)' });
}
const classify = (m) => {
  const hit = EXPECTED_TO_MOVE.find((e) => (m.pre ?? '').includes(e.key) || (m.post ?? '').includes(e.key));
  return hit ?? null;
};
const unexpected = moved.filter((m) => classify(m) === null);

const out = [];
out.push(`PRE  recording: ${PRE.replace(`${REPO}/`, '')}`);
out.push(`PRE  verdict:  ${pre.split('\n').find((l) => l.startsWith('VERDICT/1')) ?? '(none)'}`);
out.push(`POST verdict:  ${post.split('\n').find((l) => l.startsWith('VERDICT/1')) ?? '(none)'}`);
out.push('');
out.push(`VERDICT MAPS IDENTICAL ACROSS THE COMMIT: ${identical}`);
out.push(`  pre:  ${JSON.stringify(mPre)}`);
out.push(`  post: ${JSON.stringify(mPost)}`);
out.push('');
out.push(`lines that moved: ${moved.length} · of those UNEXPECTED: ${unexpected.length}`);
out.push('');
for (const m of moved) {
  const c = classify(m);
  out.push(`${c === null ? 'UNEXPECTED' : 'expected  '} line ${m.i + 1}${c === null ? '' : `  [${c.key}]`}`);
  if (c === null) {
    out.push(`    pre : ${m.pre}`);
    out.push(`    post: ${m.post}`);
  }
}
out.push('');
out.push(`GATE: the verdict map must be identical and no UNEXPECTED line may move → ${identical && unexpected.length === 0}`);

const text = `${out.join('\n')}\n`;
writeRecording(join(HERE, 'drive14.postcommit-diff.out'), text);
console.log(text);
