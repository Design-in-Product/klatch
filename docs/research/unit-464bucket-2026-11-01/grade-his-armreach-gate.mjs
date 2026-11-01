// unit-464bucket — axis 3: what does Daedalus's `GARMREACH` actually assert on the steal arm?
//
// `unit-464steal/drive-the-steal.mjs:133-138`:
//
//   // GARMREACH — the arm must actually have moved the figure it exists to move. A steal arm that
//   // left the match count where the KN found it would make every reading below the KN's reading.
//   check('GARMREACH',
//     ARM === 'kn' ? matches.length === 1 : (matches.length === matchesBefore.length + 1 || matches.length === 2),
//
// and :113-129, where the commit is created only `if (!already)`, `already = matchesBefore.length > 1`,
// and `stealSha = rev-parse HEAD` either way.
//
// His own `drive4.steal-identity.out` — the recording his §2 table is published from — records
// `GARMREACH ok — arm=steal: matches 2 → 2`. The first disjunct was false. The gate passed on
// `matches.length === 2`, on an arm that created no commit. That is harmless THERE, because
// drive3 had already put the clone into the steal state. The question this unit drives is what
// the same disjunct does when the second match is NOT a steal — which is the state a fresh clone
// of this repo will be in the first time anyone commits a memo quoting the phrase.
//
// Today that count is 1 in the live tree (measured, see PRE-REGISTRATION.md). So this is a fuse,
// not a defect already firing — and driving it means putting a clone into the state the live tree
// would be in. [[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]
//
// Three arms, each on its OWN fresh clone at the path his instrument hardcodes:
//   ctrl            fresh clone, nothing planted            — must reproduce his drive3
//   preplant-head   one planted quoting commit, at HEAD
//   preplant-buried one planted quoting commit, then one non-quoting commit on top
//
// Run from the repo root:
//   node docs/research/unit-464bucket-2026-11-01/grade-his-armreach-gate.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const LIVE = resolve('.');
const SUBJ = 'docs/research/unit-464steal-2026-11-01/drive-the-steal.mjs';
const S1 = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';
const REC3 = 'docs/research/unit-464steal-2026-11-01/drive3.steal.out';
const CLONE = resolve('.testdata/unit-464steal/clone');   // the path HIS instrument hardcodes

const subjSrc = readFileSync(join(LIVE, SUBJ), 'utf8');
const rec3 = readFileSync(join(LIVE, REC3), 'utf8');

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };
const g = (args, cwd) => execFileSync('git', args,
  { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

// -------------------------------------------------------------- the phrase and the gate, lifted
// The phrase comes from the same place his instrument gets it: S1's own `--grep` argv. Typing it
// here would make this unit grade a literal nobody uses.
const phraseM = readFileSync(join(LIVE, S1), 'utf8')
  .match(/^\s*\['log', '--format=%H', '--grep=(.+?)'\],$/m);
const clonePathM = subjSrc.match(/^const CLONE = resolve\('(.+?)'\);$/m);
const armReachM = subjSrc.match(/^check\('GARMREACH',\n(.+)$/m);
const alreadyM = subjSrc.match(/^\s*const already = (.+);$/m);
if (!phraseM || !clonePathM || !armReachM || !alreadyM) {
  console.log('REFUSED — the subject could not be lifted:');
  if (!phraseM) console.log(`   ${S1}: no \`['log', '--format=%H', '--grep=…'],\` line`);
  if (!clonePathM) console.log(`   ${SUBJ}: no \`const CLONE = resolve('…');\` line`);
  if (!armReachM) console.log(`   ${SUBJ}: no \`check('GARMREACH',\` line`);
  if (!alreadyM) console.log(`   ${SUBJ}: no \`const already = …;\` line`);
  process.exit(2);
}
const PHRASE = phraseM[1];
check('GPATH', resolve(clonePathM[1]) === CLONE,
  `his instrument's hardcoded clone path is ${clonePathM[1]} and this harness builds exactly that`);
// The disjunct under test, quoted from his source rather than from his memo.
const DISJUNCT = armReachM[1].trim();
check('GDISJUNCT', /matches\.length === 2/.test(DISJUNCT) && /matchesBefore\.length \+ 1/.test(DISJUNCT),
  `his steal-arm leg is: ${DISJUNCT}`);
check('GALREADY', /matchesBefore\.length > 1/.test(alreadyM[1]),
  `his skip condition is: already = ${alreadyM[1]}`);

const liveDirty = g(['-C', LIVE, 'status', '--porcelain', '--', 'packages/', 'scripts/'], LIVE);
check('GLIVECLEAN', liveDirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${liveDirty.length} bytes in the LIVE tree`);
const liveMatches = g(['-C', LIVE, 'log', '--format=%H', '--grep=' + PHRASE], LIVE)
  .split('\n').filter((l) => l.length === 40);
check('GFUSE', liveMatches.length === 1,
  `the LIVE tree matches the phrase ${liveMatches.length} time(s) — this is a fuse while that is 1`);

// --------------------------------------------------------------------------------- the planted commits
// A memo-shaped commit: the phrase in the BODY, not the subject. Deterministic dates so each arm
// is re-drivable. This is NOT his deterministic steal commit — it is the ordinary commit a fire
// writing up this very finding would produce, which is the point.
const plant = (subject, body, when) => execFileSync('git',
  ['commit', '--allow-empty', '--quiet', '-m', subject, ...(body ? ['-m', body] : [])],
  { cwd: CLONE, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env,
      GIT_AUTHOR_NAME: 'Theseus (Klatch)', GIT_AUTHOR_EMAIL: 'xian@designinproduct.com',
      GIT_COMMITTER_NAME: 'Theseus (Klatch)', GIT_COMMITTER_EMAIL: 'xian@designinproduct.com',
      GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when } });

const ARMS = [
  { arm: 'ctrl', why: 'fresh clone, nothing planted — must reproduce his drive3', plants: [] },
  { arm: 'preplant-head', why: 'one quoting commit, left at HEAD',
    plants: [['log: unit-464bucket, axis 3', `The pinned phrase, quoted in passing: ${PHRASE}.\n`, '2026-11-01T15:00:00-08:00']] },
  { arm: 'preplant-buried', why: 'one quoting commit, then a non-quoting commit on top',
    plants: [['log: unit-464bucket, axis 3', `The pinned phrase, quoted in passing: ${PHRASE}.\n`, '2026-11-01T15:00:00-08:00'],
      ['coord: status board', '', '2026-11-01T15:01:00-08:00']] },
];

const results = [];
for (const spec of ARMS) {
  if (existsSync(CLONE)) rmSync(resolve('.testdata/unit-464steal'), { recursive: true, force: true });
  mkdirSync(resolve('.testdata/unit-464steal'), { recursive: true });
  execFileSync('git', ['clone', '--local', '--quiet', LIVE, CLONE], { stdio: ['ignore', 'pipe', 'pipe'] });
  for (const [s, b, w] of spec.plants) plant(s, b, w);
  const before = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE).split('\n').filter((l) => l.length === 40);
  const headBefore = g(['rev-parse', 'HEAD'], CLONE);
  // his instrument, UNMODIFIED, from MY repo root — which is the LIVE tree it reads and the
  // parent of the .testdata/ path it expects.
  let run;
  try {
    run = { code: 0, out: execFileSync('node', [SUBJ, '--arm=steal'],
      { cwd: LIVE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }) };
  } catch (e) { run = { code: e.status ?? '?', out: String(e.stdout ?? ''), err: String(e.stderr ?? '') }; }
  const after = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE).split('\n').filter((l) => l.length === 40);
  const headAfter = g(['rev-parse', 'HEAD'], CLONE);
  const line = (re) => (run.out.split('\n').find((l) => re.test(l)) ?? '').trim();
  results.push({ ...spec,
    beforeN: before.length, afterN: after.length,
    headBefore, headAfter,
    createdCommit: headBefore !== headAfter,
    armreach: line(/GARMREACH/),
    armreachOk: /GARMREACH {3}ok/.test(run.out),
    p2: line(/^ {2}P2 /),
    p2Word: (line(/^ {2}P2 /).match(/^P2 +(\S+)/) ?? [])[1] ?? '?',
    code: run.code, out: run.out });
}

// GCTRL — the control arm must reproduce his drive3, or a green on a cripple arm means only that
// my harness does not drive his instrument. [[feedback_an_unverified_control_scores_better_than_a_missing_one]]
const ctrl = results.find((r) => r.arm === 'ctrl');
const rec3Arm = (rec3.split('\n').find((l) => /GARMREACH/.test(l)) ?? '').trim();
// First version of this leg required ctrl's GARMREACH line to be BYTE-IDENTICAL to drive3's. It
// went RED, correctly: his note carries the steal commit's sha, which depends on its parent, and
// my clone's HEAD is 40-odd commits past his. Re-aimed on the PROPERTY rather than loosened
// ([[feedback_verbatim_source_pin_is_not_a_property_pin]]): the two `matches N → M` figures must
// agree, the sha his note reports must be the commit the arm actually created, and P2 must LAND.
const transition = (s) => (String(s).match(/matches (\d+) → (\d+)/) ?? []).slice(1, 3).join('→');
const ctrlStealSha = (ctrl.armreach.match(/steal commit ([0-9a-f]{8})/) ?? [])[1];
const ctrlShaIsHead = !!ctrlStealSha && ctrl.headAfter.startsWith(ctrlStealSha);
check('GCTRL', transition(ctrl.armreach) === transition(rec3Arm) && transition(rec3Arm) === '1→2'
  && ctrl.p2Word === 'LANDS' && ctrl.createdCommit && ctrlShaIsHead,
  `ctrl transition ${transition(ctrl.armreach)} vs drive3's ${transition(rec3Arm)}, P2 ${ctrl.p2Word}, ` +
  `commit created ${ctrl.createdCommit}, his reported sha ${ctrlStealSha} is the created HEAD: ${ctrlShaIsHead}`);
check('GPLANTED', results.every((r) => r.beforeN === 1 + r.plants.filter((p) => p[1].includes(PHRASE)).length),
  'each arm entered its run with the match count its plant list declares: ' +
  results.map((r) => `${r.arm} ${r.beforeN}`).join(', '));

const gatesOk = legs.every((l) => l.ok);
console.log('unit-464bucket — what his GARMREACH asserts on the steal arm');
console.log(`  subject:  ${SUBJ}`);
console.log(`  phrase:   ${JSON.stringify(PHRASE)}   (lifted from ${S1})`);
console.log(`  clone:    ${CLONE}  (rebuilt fresh per arm)`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(12)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('ARMS');
console.log('   arm              matches  commit    GARMREACH  his P2     what the arm was');
for (const r of results) {
  console.log(`   ${r.arm.padEnd(16)} ${(r.beforeN + ' → ' + r.afterN).padEnd(8)} ` +
    `${(r.createdCommit ? 'created' : 'NONE').padEnd(9)} ${(r.armreachOk ? 'ok' : 'RED').padEnd(10)} ` +
    `${r.p2Word.padEnd(10)} ${r.why}`);
}
console.log('');
for (const r of results) {
  const reported = (r.armreach.match(/steal commit ([0-9a-f]{8})/) ?? [])[1];
  console.log(`   arm ${r.arm}:`);
  console.log(`     ${r.armreach}`);
  console.log(`     ${r.p2}`);
  console.log(`     the sha his note calls "steal commit": ${reported ?? '(none printed)'} — ` +
    (r.createdCommit ? 'created by this arm' : 'NOT created by this arm; it is the clone\'s pre-existing HEAD') +
    `; HEAD ${r.headBefore.slice(0, 8)} → ${r.headAfter.slice(0, 8)}`);
}
console.log('');

const spurious = results.filter((r) => r.arm !== 'ctrl' && r.armreachOk && !r.createdCommit);
const p2Words = new Set(spurious.map((r) => r.p2Word));
console.log('READINGS');
console.log(`  arms where GARMREACH read ok while the arm created NO commit: ` +
  `${spurious.map((r) => r.arm).join(', ') || '(none)'}`);
console.log(`  P2 words those arms published: ${[...p2Words].join(', ') || '(none)'}`);
console.log(`  both verdict words reachable with the gate green: ${p2Words.size >= 2}`);
console.log('');
console.log('PREDICTIONS settled by this drive');
const p4 = spurious.length >= 1;
console.log(`  P4  ${p4 ? 'LANDS  ' : 'REFUTED'}  ${spurious.length} of 2 pre-planted arms: gate ok, no commit created` +
  `, P2 graded ${[...p2Words].join('/') || 'n/a'} against a commit that is not a steal`);
console.log('');
console.log(`ARMREACHVERDICT/0  ${legs.length} gates ok; spurious-green arms ${spurious.length}/2, ` +
  `P2 words reachable under a green gate: ${[...p2Words].join(',') || 'none'}`);
process.exit(0);
