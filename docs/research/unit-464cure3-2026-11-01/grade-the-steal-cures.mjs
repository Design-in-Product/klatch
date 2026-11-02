// unit-464cure3 — C1 and C2, both in `unit-464steal/drive-the-steal.mjs`, graded in both states.
//
// C1 (his §2): `upstreamMoved` was the union of files whose `raw`, `comments` OR `bytes` moved.
//   `bytes` is `src.length`, so the leg that distinguishes "the read could not express the
//   property" from "the property was absent at both revs" could be satisfied by the two trees
//   merely differing. One of my two published saturation witnesses was carried by `bytes` alone.
//
// C2 (his §3): `GARMREACH`'s steal leg was
//   `matches.length === matchesBefore.length + 1 || matches.length === 2`
//   and the commit was created only `if (!already)` with `already = matchesBefore.length > 1`.
//   On a clone already holding someone else's quoting commit the gate read ok on an arm that
//   created nothing, and one such arm published `P2 REFUTED` against a sha it never created.
//
// His `grade-his-armreach-gate.mjs` cannot grade either cure: `GDISJUNCT` asserts
// `/matches\.length === 2/` and `GALREADY` asserts `/matchesBefore\.length > 1/`, so both go RED
// on the repair and his harness publishes nothing — a cure scored as unrunnable rather than as
// landed. [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
//
// So this is his harness re-aimed: his same three arms, driven against BOTH subject states — PRE
// from this unit's pinned pre-registration rev, POST from the worktree — classifying the source
// shape instead of requiring it.
// [[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]
//
// Run from the repo root:
//   node docs/research/unit-464cure3-2026-11-01/grade-the-steal-cures.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const LIVE = resolve('.');
const SUBJ = 'docs/research/unit-464steal-2026-11-01/drive-the-steal.mjs';
const S1 = 'docs/research/round378-instruments/grade-b3-known-positive.mjs';
const REC3 = 'docs/research/unit-464steal-2026-11-01/drive3.steal.out';
const REC4 = 'docs/research/unit-464steal-2026-11-01/drive4.steal-identity.out';
const PRE_REV = 'de5e93656450d685190ddfc25bd99d8c127de25c';
const CLONE = resolve('.testdata/unit-464steal/clone');   // the path the SUBJECT hardcodes

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };
const g = (args, cwd) => execFileSync('git', args,
  { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 }).trim();

// ------------------------------------------------------------------------------ the two subjects
const postSrc = readFileSync(join(LIVE, SUBJ), 'utf8');
let preSrc = null;
try {
  preSrc = execFileSync('git', ['show', `${PRE_REV}:${SUBJ}`],
    { cwd: LIVE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
} catch (e) {
  console.log(`REFUSED — could not read the PRE baseline ${PRE_REV.slice(0, 8)}:${SUBJ}`);
  console.log('   ' + String(e.message).split('\n')[0]);
  process.exit(2);
}
// The PRE copy is written at the SAME DEPTH as the original, because the subject imports
// `../../../scripts/lib/strip-source.mjs` — a copy one level off refuses every cell.
// [[feedback_a_scratch_copy_at_the_wrong_depth_refuses_every_cell]]
const PRE_COPY = resolve('docs/research/unit-464cure3-2026-11-01/subject.pre.drive-the-steal.mjs');
writeFileSync(PRE_COPY, preSrc);
const STATES = [
  { state: 'PRE', src: preSrc, path: PRE_COPY },
  { state: 'POST', src: postSrc, path: join(LIVE, SUBJ) },
];
// drive3 went RED here, correctly in form and wrong in aim: `resolve(s.path, '../../../…')` treats
// the FILE path as the base directory, so it looked one level too shallow — at `docs/scripts/lib/`
// — and would have reddened every cell of a correctly-placed copy. An import resolves against the
// file's DIRECTORY. Re-aimed on that rather than loosened.
// [[feedback_a_scratch_copy_at_the_wrong_depth_refuses_every_cell]]
const IMPORT_REL = (postSrc.match(/^import \{ stripSource \} from '(.+?)';$/m) ?? [])[1];
check('GDEPTH',
  !!IMPORT_REL
  && STATES.every((s) => s.path.split('/').length === join(LIVE, SUBJ).split('/').length)
  && STATES.every((s) => existsSync(resolve(dirname(s.path), IMPORT_REL))),
  `both subject states are at the same depth and both resolve ${IMPORT_REL} from their own ` +
  `directory: ${STATES.map((s) => s.state + ' ' + existsSync(resolve(dirname(s.path), IMPORT_REL ?? 'x'))).join(', ')}`);

// GCURE — the cures are present in POST and absent from PRE, keyed on the MECHANISM in each case.
const shape = (src) => ({
  bytesInUnion: /movedOn\('bytes'\)\]\)\]/.test(src) || /\.\.\.movedOn\('comments'\), \.\.\.movedOn\('bytes'\)/.test(src),
  perFile: /per file — which fields moved between the two revs/.test(src),
  disjunct: /matches\.length === 2\)/.test(src),
  alreadyOnCount: /const already = matchesBefore\.length > 1;/.test(src),
  alreadyOnSubject: /const already = g\(\['log', '-1', '--format=%s'\], CLONE\) === STEAL_SUBJECT;/.test(src),
  stealOwned: /const stealOwned = stealSha !== null/.test(src),
  // Registered in drive4 as a cure and REMOVED after it drove green: its predicate was P2's own,
  // so it could only turn a verdict word into a refusal. Kept in this shape map as a classifier,
  // not a requirement, so that a future re-introduction of it shows up here as a difference.
  newestGate: /check\('GSTEALNEWEST'/.test(src),
});
const [preHas, postHas] = [shape(preSrc), shape(postSrc)];
check('GCURE',
  preHas.bytesInUnion && !preHas.perFile && preHas.disjunct && preHas.alreadyOnCount
  && !preHas.stealOwned && !preHas.newestGate
  && !postHas.bytesInUnion && postHas.perFile && !postHas.disjunct && !postHas.alreadyOnCount
  && postHas.alreadyOnSubject && postHas.stealOwned && !postHas.newestGate,
  `PRE ${JSON.stringify(preHas)} · POST ${JSON.stringify(postHas)}`);

// ------------------------------------------------------- the phrase and the clone path, lifted
const phraseM = readFileSync(join(LIVE, S1), 'utf8')
  .match(/^\s*\['log', '--format=%H', '--grep=(.+?)'\],$/m);
const clonePre = (preSrc.match(/^const CLONE = resolve\('(.+?)'\);$/m) ?? [])[1];
const clonePost = (postSrc.match(/^const CLONE = resolve\('(.+?)'\);$/m) ?? [])[1];
if (!phraseM) { console.log(`REFUSED — ${S1}: no \`--grep=…\` argv line to lift the phrase from.`); process.exit(2); }
const PHRASE = phraseM[1];
check('GPATH', !!clonePre && clonePre === clonePost && resolve(clonePre) === CLONE,
  `both subject states hardcode the same clone path (${clonePre}) and this harness builds exactly that`);

const liveDirty = g(['-C', LIVE, 'status', '--porcelain', '--', 'packages/', 'scripts/'], LIVE);
check('GLIVECLEAN', liveDirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${liveDirty.length} bytes in the LIVE tree`);
const liveMatches = g(['-C', LIVE, 'log', '--format=%H', '--grep=' + PHRASE], LIVE)
  .split('\n').filter((l) => l.length === 40);
check('GFUSE', liveMatches.length === 1,
  `the LIVE tree matches the phrase ${liveMatches.length} time(s) — his §3 is a fuse while that is 1`);

// --------------------------------------------------------------------------- his three arms, verbatim
const plant = (subject, body, when) => execFileSync('git',
  ['commit', '--allow-empty', '--quiet', '-m', subject, ...(body ? ['-m', body] : [])],
  { cwd: CLONE, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env,
      GIT_AUTHOR_NAME: 'Theseus (Klatch)', GIT_AUTHOR_EMAIL: 'xian@designinproduct.com',
      GIT_COMMITTER_NAME: 'Theseus (Klatch)', GIT_COMMITTER_EMAIL: 'xian@designinproduct.com',
      GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when } });

const QUOTE = ['log: unit-464bucket, axis 3', `The pinned phrase, quoted in passing: ${PHRASE}.\n`,
  '2026-11-01T15:00:00-08:00'];
const ARMS = [
  { arm: 'ctrl', why: 'fresh clone, nothing planted', plants: [] },
  { arm: 'preplant-head', why: 'one quoting commit, left at HEAD', plants: [QUOTE] },
  { arm: 'preplant-buried', why: 'one quoting commit, then a non-quoting commit on top',
    plants: [QUOTE, ['coord: status board', '', '2026-11-01T15:01:00-08:00']] },
];

const results = [];
for (const st of STATES) {
  for (const spec of ARMS) {
    if (existsSync(CLONE)) rmSync(resolve('.testdata/unit-464steal'), { recursive: true, force: true });
    mkdirSync(resolve('.testdata/unit-464steal'), { recursive: true });
    execFileSync('git', ['clone', '--local', '--quiet', LIVE, CLONE], { stdio: ['ignore', 'pipe', 'pipe'] });
    for (const [s, b, w] of spec.plants) plant(s, b, w);
    const before = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE).split('\n').filter((l) => l.length === 40);
    const headBefore = g(['rev-parse', 'HEAD'], CLONE);
    let run;
    try {
      run = { code: 0, out: execFileSync('node', [st.path, '--arm=steal'],
        { cwd: LIVE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }) };
    } catch (e) { run = { code: e.status ?? '?', out: String(e.stdout ?? ''), err: String(e.stderr ?? '') }; }
    const after = g(['log', '--format=%H', '--grep=' + PHRASE], CLONE).split('\n').filter((l) => l.length === 40);
    const headAfter = g(['rev-parse', 'HEAD'], CLONE);
    const line = (re) => (run.out.split('\n').find((l) => re.test(l)) ?? '').trim();
    // The per-file row table of section 2, parsed into (file, rev, value, comments, raw, bytes).
    const rows = run.out.split('\n')
      .map((l) => l.match(/^ {3}(probe-round\d+) +(PIN\^|KEYED\^) +(-?\d+) +(-?\d+) +(-?\d+) +(-?\d+)\s*$/))
      .filter(Boolean)
      .map((m) => ({ file: m[1], rev: m[2], value: +m[3], comments: +m[4], raw: +m[5], bytes: +m[6] }));
    results.push({ state: st.state, ...spec,
      beforeN: before.length, afterN: after.length, headBefore, headAfter,
      createdCommit: headBefore !== headAfter,
      armreach: line(/GARMREACH/), armreachOk: /GARMREACH {3}ok/.test(run.out),
      newest: line(/GSTEALNEWEST/), newestPresent: /GSTEALNEWEST/.test(run.out),
      newestOk: /GSTEALNEWEST ok/.test(run.out.replace(/ +/g, ' ')),
      upstream: line(/UPSTREAM figures/),
      upstreamFiles: (line(/UPSTREAM figures/).match(/probe-round\d+/g) ?? []),
      bytesOnly: (line(/files where bytes moved but no property figure did/).match(/probe-round\d+/g) ?? []),
      perFileLines: run.out.split('\n').filter((l) => /^ {6}probe-round\d+ +moved:/.test(l)).map((l) => l.trim()),
      rows,
      refusedPredictions: /REFUSED — a gate is RED, so no prediction below is graded/.test(run.out),
      p2: line(/^ {2}P2 /), p2Word: (line(/^ {2}P2 /).match(/^P2 +(\S+)/) ?? [])[1] ?? '(none)',
      p4: line(/^ {2}P4 /), p4Word: (line(/^ {2}P4 /).match(/^P4 +(\S+(?: \(\w+\))?)/) ?? [])[1] ?? '(none)',
      gateLines: run.out.split('\n').filter((l) => /^ {2}G[A-Z]+ /.test(l)).map((l) => l.trim()),
      allGatesOk: run.out.split('\n').filter((l) => /^ {2}G[A-Z]+ /.test(l)).every((l) => / ok /.test(l)),
      code: run.code, out: run.out });
  }
}
if (existsSync(resolve('.testdata/unit-464steal'))) {
  rmSync(resolve('.testdata/unit-464steal'), { recursive: true, force: true });
}
const cell = (state, arm) => results.find((r) => r.state === state && r.arm === arm);

// --------------------------------------------------------- two controls, one per state, split apart
// [[feedback_one_control_cannot_grade_a_seam_and_a_write_path]]
const rec3 = readFileSync(join(LIVE, REC3), 'utf8');
const rec4 = readFileSync(join(LIVE, REC4), 'utf8');
const transition = (s) => (String(s).match(/matches (\d+) → (\d+)/) ?? []).slice(1, 3).join('→');
const rec3Arm = (rec3.split('\n').find((l) => /GARMREACH/.test(l)) ?? '').trim();
const preCtrl = cell('PRE', 'ctrl');
const postCtrl = cell('POST', 'ctrl');
// Property-pinned, not byte-pinned: the recording carries a sha whose parent is 40-odd commits
// behind this clone's HEAD, so a verbatim pin cannot hold. This is Theseus's own repair of his
// first GCTRL. [[feedback_verbatim_source_pin_is_not_a_property_pin]]
const ctrlPinned = (c) => transition(c.armreach) === '1→2' && c.createdCommit
  && c.p2Word === 'LANDS' && c.code === 0
  && !!(c.armreach.match(/steal commit ([0-9a-f]{8})/) ?? [])[1]
  && c.headAfter.startsWith((c.armreach.match(/steal commit ([0-9a-f]{8})/) ?? [])[1]);
check('GCTRLPRE', ctrlPinned(preCtrl) && transition(rec3Arm) === '1→2',
  `PRE ctrl transition ${transition(preCtrl.armreach)} vs drive3's ${transition(rec3Arm)}, ` +
  `P2 ${preCtrl.p2Word}, created ${preCtrl.createdCommit}, reported sha is the created HEAD`);
check('GCTRLPOST', ctrlPinned(postCtrl) && postCtrl.allGatesOk,
  `POST ctrl transition ${transition(postCtrl.armreach)}, P2 ${postCtrl.p2Word}, ` +
  `created ${postCtrl.createdCommit}, all ${postCtrl.gateLines.length} of its own gates ok: ${postCtrl.allGatesOk}`);
check('GPLANTED', results.every((r) => r.beforeN === 1 + r.plants.filter((p) => p[1].includes(PHRASE)).length),
  'each cell entered its run with the match count its plant list declares: ' +
  [...new Set(results.map((r) => `${r.arm} ${r.beforeN}`))].join(', '));

// GROWREPRO — the C1 reading is published off the row table, so the PRE control's rows must
// reproduce drive4's (value, comments, raw) triples. `bytes` is excluded from the PIN for the same
// reason the cure excludes it from the witness union: it moves when the trees merely differ.
const rec4Rows = rec4.split('\n')
  .map((l) => l.match(/^ {3}(probe-round\d+) +(PIN\^|KEYED\^) +(-?\d+) +(-?\d+) +(-?\d+) +(-?\d+)\s*$/))
  .filter(Boolean).map((m) => ({ file: m[1], rev: m[2], value: +m[3], comments: +m[4], raw: +m[5], bytes: +m[6] }));
const tripleKey = (rs) => rs.map((r) => `${r.file}/${r.rev}=${r.value},${r.comments},${r.raw}`).sort().join(' ');
check('GROWREPRO', rec4Rows.length === 4 && preCtrl.rows.length === 4
  && tripleKey(preCtrl.rows) === tripleKey(rec4Rows),
  `PRE ctrl reproduces drive4's 4 (value,comments,raw) triples: ` +
  `${tripleKey(preCtrl.rows) === tripleKey(rec4Rows)} (${rec4Rows.length} recorded, ${preCtrl.rows.length} read)`);

// --------------------------------------------------------------------------------------- readings
const gatesOk = legs.every((l) => l.ok);
console.log('unit-464cure3 — C1 and C2, graded in both states');
console.log(`  subject:  ${SUBJ}`);
console.log(`  PRE from: ${PRE_REV.slice(0, 8)}  ·  POST from: the worktree`);
console.log(`  phrase:   ${JSON.stringify(PHRASE)}   (lifted from ${S1})`);
console.log(`  clone:    ${CLONE}  (rebuilt fresh per cell, removed at the end)`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(12)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('1. C2 — THE 2 × 3 MATRIX');
console.log('   state  arm              matches  commit    GARMREACH  GSTEALNEWEST  exit  P2');
for (const r of results) {
  console.log(`   ${r.state.padEnd(6)} ${r.arm.padEnd(16)} ${(r.beforeN + ' → ' + r.afterN).padEnd(8)} ` +
    `${(r.createdCommit ? 'created' : 'NONE').padEnd(9)} ${(r.armreachOk ? 'ok' : 'RED').padEnd(10)} ` +
    `${(r.newestPresent ? (r.newestOk ? 'ok' : 'RED') : '(absent)').padEnd(13)} ${String(r.code).padEnd(5)} ` +
    `${r.refusedPredictions ? 'NOT GRADED' : r.p2Word}`);
}
console.log('');
for (const r of results.filter((x) => x.arm !== 'ctrl')) {
  const reported = (r.armreach.match(/steal commit ([0-9a-f]{8})/) ?? [])[1];
  console.log(`   ${r.state} ${r.arm}:`);
  console.log(`     ${r.armreach}`);
  if (r.newest) console.log(`     ${r.newest}`);
  console.log(`     ${r.refusedPredictions ? 'predictions NOT GRADED — a gate is RED' : r.p2}`);
  console.log(`     the sha reported as "steal commit": ${reported ?? '(none)'} — ` +
    (r.createdCommit ? 'created by this arm' : 'NOT created by this arm; the clone\'s pre-existing HEAD'));
}
console.log('');

console.log('2. C1 — THE SATURATION WITNESS SET, from the control cell of each state');
for (const st of ['PRE', 'POST']) {
  const c = cell(st, 'ctrl');
  console.log(`   ${st}:`);
  console.log(`     ${c.upstream}`);
  for (const l of c.perFileLines) console.log(`       ${l}`);
  console.log(`     P4: ${c.p4Word}`);
}
console.log('');
console.log('   the row table both states read (identical by GROWREPRO on the triples):');
console.log('   file            rev      value  comments  raw   bytes');
for (const r of preCtrl.rows) {
  console.log(`   ${r.file.padEnd(15)} ${r.rev.padEnd(8)} ${String(r.value).padStart(5)} ` +
    `${String(r.comments).padStart(9)} ${String(r.raw).padStart(5)} ${String(r.bytes).padStart(7)}`);
}
console.log('');

// -------------------------------------------------------------------------------------- predictions
const upPre = cell('PRE', 'ctrl').upstreamFiles;
const upPost = cell('POST', 'ctrl').upstreamFiles;
const p1 = upPre.length === 2 && upPost.length === 1 && upPost[0] === 'probe-round375'
  && /saturated/.test(cell('POST', 'ctrl').p4) && /saturated/.test(cell('PRE', 'ctrl').p4);
// P2 is the NON-VACUITY leg: the dropped term must have been the only thing carrying a witness for
// at least one file, or the cure is a no-op dressed as a repair.
const byteOnlyFiles = (() => {
  const byFile = new Map();
  for (const r of preCtrl.rows) {
    const o = byFile.get(r.file) ?? {};
    o[r.rev] = r; byFile.set(r.file, o);
  }
  return [...byFile].filter(([, o]) => o['PIN^'] && o['KEYED^']
    && o['PIN^'].bytes !== o['KEYED^'].bytes
    && o['PIN^'].raw === o['KEYED^'].raw && o['PIN^'].comments === o['KEYED^'].comments)
    .map(([f]) => f);
})();
const p2 = byteOnlyFiles.length >= 1 && byteOnlyFiles.includes('probe-round374')
  && cell('POST', 'ctrl').bytesOnly.includes('probe-round374');
const spuriousIn = (st) => results.filter((r) => r.state === st && r.armreachOk && !r.createdCommit);
const p3 = spuriousIn('PRE').length === 2 && spuriousIn('POST').length === 0;
const wordsIn = (st) => new Set(results.filter((r) => r.state === st && r.allGatesOk && !r.refusedPredictions)
  .map((r) => r.p2Word));
const [wPre, wPost] = [wordsIn('PRE'), wordsIn('POST')];
const p4 = wPre.size === 2 && wPre.has('LANDS') && wPre.has('REFUTED')
  && wPost.size === 1 && wPost.has('LANDS')
  && results.filter((r) => r.state === 'POST' && r.arm !== 'ctrl').every((r) => r.refusedPredictions);

console.log('PREDICTIONS settled by this drive');
console.log(`  P1  ${p1 ? 'LANDS  ' : 'REFUTED'}  witness set ${JSON.stringify(upPre)} → ${JSON.stringify(upPost)}; ` +
  `P4 word PRE "${cell('PRE', 'ctrl').p4Word}" → POST "${cell('POST', 'ctrl').p4Word}"`);
console.log(`  P2  ${p2 ? 'LANDS  ' : 'REFUTED'}  files whose bytes moved while raw and comments did not: ` +
  `${byteOnlyFiles.join(', ') || '(none)'} — the cure is ${p2 ? 'not vacuous' : 'VACUOUS: the dropped term carried no witness'}`);
console.log(`  P3  ${p3 ? 'LANDS  ' : 'REFUTED'}  arms reading GARMREACH ok while creating nothing: ` +
  `PRE ${spuriousIn('PRE').length} (${spuriousIn('PRE').map((r) => r.arm).join(', ') || 'none'}) → ` +
  `POST ${spuriousIn('POST').length} (${spuriousIn('POST').map((r) => r.arm).join(', ') || 'none'})`);
// P4 was registered as a conjunction of two clauses and is graded as one. Both are printed, because
// a conjunction that fails tells you nothing about which half moved.
// [[feedback_a_cured_figure_can_leave_a_live_sentence_about_the_old_one]]
const p4Threshold = wPre.size === 2 && wPost.size === 1 && wPost.has('LANDS');
const p4Refusal = results.filter((r) => r.state === 'POST' && r.arm !== 'ctrl').every((r) => r.refusedPredictions);
console.log(`  P4  ${p4 ? 'LANDS  ' : 'REFUTED'}  P2 words published under an all-green gate: ` +
  `PRE {${[...wPre].join(', ')}} → POST {${[...wPost].join(', ')}}`);
console.log(`      clause 1 — the word set narrows to {LANDS}:            ${p4Threshold ? 'HOLDS' : 'FAILS'}`);
console.log(`      clause 2 — both POST pre-planted arms publish nothing: ${p4Refusal ? 'HOLDS' : 'FAILS'}` +
  (p4Refusal ? '' : ` (they publish ${results.filter((r) => r.state === 'POST' && r.arm !== 'ctrl')
    .map((r) => r.p2Word).join('/')}, because with \`already\` keyed on this arm's own subject the ` +
    'arm now CREATES its steal, so the pre-cure spelling resolves to it and the reading is true)'));
console.log('');
console.log(`STEALCURES/${legs.filter((l) => !l.ok).length}  ${legs.length} gates, ${legs.filter((l) => l.ok).length} ok; ` +
  `P1 ${p1 ? 'LANDS' : 'REFUTED'}, P2 ${p2 ? 'LANDS' : 'REFUTED'}, P3 ${p3 ? 'LANDS' : 'REFUTED'}, P4 ${p4 ? 'LANDS' : 'REFUTED'}`);
process.exit(0);
