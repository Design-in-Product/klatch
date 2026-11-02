// unit-464cure3 — C3: does the re-aimed GATTRIB catch what the old one absorbed, without
// reddening the real copy?
//
// Theseus's `unit-464bucket/grade-his-attrib-gate.mjs` drove four arms against my gate and found
// arm-b (arm-a's real mutation plus a trailing `// cap the population`) and arm-c (a column-0
// comment asserting something false) both ABSORBED. His harness cannot grade the cure: its
// `GLIFT` leg requires a 4-bucket `DECLARED` named `header,pop-flag,label,artefact`, and the cure
// moves `header` out of `DECLARED` into a counted positional budget — so his gate would go RED on
// the cure and publish nothing, scoring the repair as unrunnable rather than as landed.
// [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
//
// So this is his harness, re-aimed: the same four arms, driven against BOTH subject states —
// PRE read from a pinned rev that predates every cure in this unit, POST from the worktree — and
// CLASSIFYING the bucket shape instead of requiring it.
// [[feedback_a_unit_that_cures_its_own_subject_needs_the_baseline_from_git]]
//
// Run from the repo root:
//   node docs/research/unit-464cure3-2026-11-01/grade-the-attrib-cure.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const LIVE = resolve('.');
const GATE = 'docs/research/unit-464steal-2026-11-01/grade-the-copy-is-his-reader.mjs';
const REC6 = 'docs/research/unit-464steal-2026-11-01/drive6.copy-gate-repaired.out';
// The pre-registration commit of this unit. It is the last rev at which no cure of this unit
// existed, so it is the honest PRE baseline — and it is a sha, not "HEAD", so this harness grades
// the same pair of states whenever it is re-driven.
// [[feedback_a_population_keyed_on_ls_files_is_irreproducible_from_any_rev]]
const PRE_REV = 'de5e93656450d685190ddfc25bd99d8c127de25c';
const SCRATCH = resolve('.testdata/unit-464cure3-attrib');

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };
const g = (args) => execFileSync('git', args,
  { cwd: LIVE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });

// ------------------------------------------------------------------------------ the two subjects
const postSrc = readFileSync(join(LIVE, GATE), 'utf8');
let preSrc = null;
try { preSrc = g(['show', `${PRE_REV}:${GATE}`]); } catch (e) {
  console.log(`REFUSED — could not read the PRE baseline ${PRE_REV.slice(0, 8)}:${GATE}`);
  console.log('   ' + String(e.message).split('\n')[0]);
  process.exit(2);
}
// Both copies are written at the SAME directory depth as the original, so a relative path inside
// either resolves identically. [[feedback_a_scratch_copy_at_the_wrong_depth_refuses_every_cell]]
const PRE_COPY = resolve('docs/research/unit-464cure3-2026-11-01/subject.pre.copy-gate.mjs');
writeFileSync(PRE_COPY, preSrc);
const STATES = [
  // PRE is a materialised copy of the pinned rev; POST is the LIVE file itself, so the cure is
  // graded where it actually shipped and not on a transcription of it.
  { state: 'PRE', src: preSrc, path: PRE_COPY },
  { state: 'POST', src: postSrc, path: join(LIVE, GATE) },
];
check('GDEPTH',
  STATES.every((s) => s.path.split('/').length === join(LIVE, GATE).split('/').length),
  'both subject states sit at the same path depth, so a relative path inside either resolves alike');

check('GDELTA', preSrc !== postSrc,
  `the two subject states differ (${preSrc.split('\n').length} → ${postSrc.split('\n').length} lines)`);
// The cure must be IN the POST subject and ABSENT from the PRE one, keyed on the mechanism and not
// on a comment: a counted header budget, a positional header end, and a case-SENSITIVE pop-flag.
const curePresent = (src) => ({
  budget: /const headerBudget = new Map\(HEADER\);/.test(src),
  positional: /const hdrEnd = mine\.indexOf\(his\[0\]\);/.test(src),
  caseSens: !/\/POP\|--pop\|POP_ARGS\|REFUSED: --pop\|a default would\|which is the exact defect\/i/.test(src),
  buckets: (src.match(/^ {2}\{ key: '/gm) ?? []).length,
});
const [preHas, postHas] = [curePresent(preSrc), curePresent(postSrc)];
check('GCURE',
  !preHas.budget && !preHas.positional && !preHas.caseSens && preHas.buckets === 4
  && postHas.budget && postHas.positional && postHas.caseSens && postHas.buckets === 3,
  `PRE: budget ${preHas.budget}, positional ${preHas.positional}, case-sensitive ${preHas.caseSens}, ` +
  `${preHas.buckets} buckets · POST: budget ${postHas.budget}, positional ${postHas.positional}, ` +
  `case-sensitive ${postHas.caseSens}, ${postHas.buckets} buckets`);

const liveDirty = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
check('GLIVECLEAN', liveDirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${liveDirty.length} bytes in the LIVE tree`);

// ---------------------------------------------------------- his fixtures and his planted mutations
// Lifted from the POST subject, which is the file whose paths the arms must satisfy. If the two
// states disagreed about where the fixtures live, the arms would grade different files.
const pathOf = (src, name) => (src.match(new RegExp(`^const ${name} = '(.+?)';$`, 'm')) ?? [])[1];
const HIS = pathOf(postSrc, 'HIS');
const MINE = pathOf(postSrc, 'MINE');
check('GPATHS', !!HIS && !!MINE && HIS === pathOf(preSrc, 'HIS') && MINE === pathOf(preSrc, 'MINE'),
  `both states read the same two fixtures: HIS ${HIS}, MINE ${MINE}`);
if (!HIS || !MINE) { console.log('REFUSED — fixture paths could not be lifted.'); process.exit(2); }

const hisLines = readFileSync(join(LIVE, HIS), 'utf8').split('\n');
const mineLines = readFileSync(join(LIVE, MINE), 'utf8').split('\n');

// His three mutations, verbatim from his harness, plus his control. Typing them differently would
// make this grade a different cripple than the one that found the hole.
const ANCHOR_LOOP = 'for (const c of commits) {';
const ANCHOR_SEP = "const SEP = '\\u0000';";
const ARMS = [
  { arm: 'ctrl', why: 'no mutation — must stay GREEN in BOTH states', plant: null },
  { arm: 'a', why: 'a real filter added to the corpus loop, no bucket keyword',
    anchor: ANCHOR_LOOP, after: true, line: '  if (c.subject.length > 500) continue;' },
  { arm: 'b', why: 'the SAME filter, plus a trailing comment containing "population"',
    anchor: ANCHOR_LOOP, after: true,
    line: '  if (c.subject.length > 500) continue;  // cap the population' },
  { arm: 'c', why: 'a column-0 comment asserting something false about the reader',
    anchor: ANCHOR_SEP, after: false,
    line: '// The self-exclusion is unnecessary for subjects over 30 chars.' },
];

if (existsSync(SCRATCH)) rmSync(SCRATCH, { recursive: true, force: true });
const results = [];
for (const st of STATES) {
  for (const spec of ARMS) {
    const dir = join(SCRATCH, st.state, 'arm-' + spec.arm);
    mkdirSync(join(dir, dirname(HIS)), { recursive: true });
    mkdirSync(join(dir, dirname(MINE)), { recursive: true });
    writeFileSync(join(dir, HIS), readFileSync(join(LIVE, HIS)));
    let mutated = mineLines.slice();
    let planted = { ok: spec.plant === null, note: 'no mutation' };
    if (spec.plant !== null) {
      const at = mutated.findIndex((l) => l.trim() === spec.anchor);
      const already = mutated.includes(spec.line) || hisLines.includes(spec.line);
      if (at < 0 || already) {
        planted = { ok: false, note: at < 0 ? `anchor ${JSON.stringify(spec.anchor)} not found`
          : 'the planted line already exists in a fixture, so the diff would cancel' };
      } else {
        mutated.splice(spec.after ? at + 1 : at, 0, spec.line);
        planted = { ok: mutated.length === mineLines.length + 1,
          note: `1 line inserted ${spec.after ? 'after' : 'before'} index ${at}` };
      }
    }
    writeFileSync(join(dir, MINE), mutated.join('\n'));
    let run;
    try {
      run = { code: 0, out: execFileSync('node', [st.path],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }) };
    } catch (e) { run = { code: e.status ?? '?', out: String(e.stdout ?? ''), err: String(e.stderr ?? '') }; }
    const verdict = /^VERDICT: the copy is his reader/m.test(run.out) ? 'GREEN'
      : /^VERDICT: REFUSED/m.test(run.out) ? 'REFUSED' : 'UNPARSED';
    const gateLine = (n) => (run.out.split('\n').find((l) => l.trim().startsWith(n + ' ')) ?? '').trim();
    results.push({ state: st.state, ...spec, planted, code: run.code, verdict,
      attrib: /GATTRIB {3}ok/.test(run.out) ? 'ok' : 'RED',
      gateLines: ['GATTRIB', 'GNOPAD', 'GWITNESS', 'GALLGONE', 'GREADER'].map(gateLine),
      unattributedCount: (run.out.match(/^ {4}\+ /gm) ?? []).length,
      raw: run.out });
  }
}
const cell = (state, arm) => results.find((r) => r.state === state && r.arm === arm);

// GCTRL — split in two, one per state. A single control cannot grade two subjects.
// [[feedback_one_control_cannot_grade_a_seam_and_a_write_path]]
const rec6 = readFileSync(join(LIVE, REC6), 'utf8');
const rec6Lines = ['GATTRIB', 'GNOPAD', 'GWITNESS', 'GALLGONE', 'GREADER']
  .map((n) => (rec6.split('\n').find((l) => l.trim().startsWith(n + ' ')) ?? '').trim());
const preCtrl = cell('PRE', 'ctrl');
const postCtrl = cell('POST', 'ctrl');
// PRE's control is pinned against my own drive6 recording BYTE FOR BYTE — the PRE subject IS the
// file that produced it, so anything less would not prove this harness drives it.
const preCtrlMatches = preCtrl.gateLines.filter((l, i) => l === rec6Lines[i]).length;
check('GCTRLPRE', preCtrl.code === 0 && preCtrl.verdict === 'GREEN' && preCtrlMatches === 5,
  `PRE ctrl exit ${preCtrl.code}, ${preCtrl.verdict}, ${preCtrlMatches}/5 gate lines byte-identical to drive6`);
// POST's control cannot be byte-pinned (the gate's own lines changed, which is the cure). It is
// pinned on the property: green, exit 0, and NOTHING unattributed.
// [[feedback_verbatim_source_pin_is_not_a_property_pin]]
check('GCTRLPOST', postCtrl.code === 0 && postCtrl.verdict === 'GREEN'
  && postCtrl.attrib === 'ok' && postCtrl.unattributedCount === 0,
  `POST ctrl exit ${postCtrl.code}, ${postCtrl.verdict}, GATTRIB ${postCtrl.attrib}, ` +
  `${postCtrl.unattributedCount} unattributed lines`);
check('GPLANT', results.every((r) => r.planted.ok),
  `every cell's fixture is exactly as declared (${results.filter((r) => r.planted.ok).length}/${results.length})`);

// ------------------------------------------------------------------- the capacity census (§2 below)
// Computed HERE, above the gate print, because `GLIFT2` is a gate: in drive1 it was registered
// after `gatesOk` had already been taken, so it counted in the summary line and refused nothing.
// [[feedback_a_printed_self_test_that_gates_nothing]]
const lift = (src) => {
  const s = src.indexOf('const DECLARED = [');
  const e = src.indexOf('\n];', s);
  if (s < 0 || e < s) return null;
  try { return new Function('return ' + src.slice(s + 'const DECLARED = '.length, e + 3).replace(/;$/, ''))(); }
  catch { return null; }
};
const [preDecl, postDecl] = [lift(preSrc), lift(postSrc)];
const bucket = (decl, key) => (decl ?? []).find((d) => d.key === key);
check('GLIFT2',
  Array.isArray(preDecl) && Array.isArray(postDecl)
  && !!bucket(preDecl, 'header') && !!bucket(preDecl, 'pop-flag') && !!bucket(postDecl, 'pop-flag'),
  `both DECLARED arrays lift and evaluate, and the censused buckets exist: PRE ` +
  `[${(preDecl ?? []).map((d) => d.key).join(',')}] · POST [${(postDecl ?? []).map((d) => d.key).join(',')}]`);
const hdrEnd = mineLines.indexOf(hisLines[0]);
const capacity = legs.find((l) => l.name === 'GLIFT2').ok ? {
  PRE: { header: mineLines.filter((l) => bucket(preDecl, 'header').mine(l)).length,
    'pop-flag': mineLines.filter((l) => bucket(preDecl, 'pop-flag').mine(l)).length },
  POST: { header: hdrEnd, // the counted budget's total: exactly the positional span
    'pop-flag': mineLines.filter((l) => bucket(postDecl, 'pop-flag').mine(l)).length },
} : null;

// --------------------------------------------------------------------------------------- readings
const gatesOk = legs.every((l) => l.ok);
console.log('unit-464cure3 — C3: the re-aimed GATTRIB, graded in both states');
console.log(`  subject:   ${GATE}`);
console.log(`  PRE from:  ${PRE_REV.slice(0, 8)}  ·  POST from: the worktree`);
console.log(`  fixtures:  HIS ${hisLines.length} lines · MINE ${mineLines.length} lines`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(12)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('1. THE 2 × 4 MATRIX — his four arms, both subject states');
console.log('   state  arm   GATTRIB  verdict   unattrib  what was planted');
for (const r of results) {
  console.log(`   ${r.state.padEnd(6)} ${r.arm.padEnd(5)} ${r.attrib.padEnd(8)} ${r.verdict.padEnd(9)} ` +
    `${String(r.unattributedCount).padStart(8)}  ${r.why}`);
}
console.log('');

// §2 CAPACITY — the question his §4 asked: how many lines of the whole copy could each mechanism
// absorb? For a predicate that is the match count; for a counted budget it is the budget's total,
// because beyond that the budget is spent and the next line is unattributed.
console.log('2. ABSORBABLE-LINE CAPACITY over the whole copy, per mechanism');
console.log(`   mechanism   PRE   POST   of ${mineLines.length} lines   how POST is bounded`);
console.log(`   header    ${String(capacity.PRE.header).padStart(5)} ${String(capacity.POST.header).padStart(6)}` +
  `                 counted budget of the positional span (lines 0..${hdrEnd - 1})`);
console.log(`   pop-flag  ${String(capacity.PRE['pop-flag']).padStart(5)} ${String(capacity.POST['pop-flag']).padStart(6)}` +
  '                 case-sensitive tokens + its own literal strings');
console.log('');

const absorbedIn = (state) => results.filter((r) => r.state === state && r.arm !== 'ctrl' && r.attrib === 'ok');
const flips = (state) => cell(state, 'a').attrib !== cell(state, 'b').attrib;
console.log('READINGS');
for (const st of ['PRE', 'POST']) {
  console.log(`  ${st.padEnd(5)} absorbed: ${absorbedIn(st).map((r) => 'arm-' + r.arm).join(', ') || '(none)'}` +
    ` · a-vs-b flips on one comment: ${flips(st)} · ctrl ${cell(st, 'ctrl').verdict}`);
}
console.log('');
console.log('PREDICTIONS settled by this drive');
const p5pre = cell('PRE', 'ctrl').attrib === 'ok' && cell('PRE', 'a').attrib === 'RED'
  && cell('PRE', 'b').attrib === 'ok' && cell('PRE', 'c').attrib === 'ok';
const p5post = cell('POST', 'ctrl').attrib === 'ok' && cell('POST', 'a').attrib === 'RED'
  && cell('POST', 'b').attrib === 'RED' && cell('POST', 'c').attrib === 'RED';
console.log(`  P5  ${p5pre && p5post ? 'LANDS  ' : 'REFUTED'}  PRE (ok,RED,ok,ok) reproduced: ${p5pre}; ` +
  `POST (ok,RED,RED,RED): ${p5post}; absorbed ${absorbedIn('PRE').length} → ${absorbedIn('POST').length}`);
const p6 = capacity.PRE.header === 103 && capacity.POST.header <= 25
  && capacity.PRE['pop-flag'] === 19 && capacity.POST['pop-flag'] <= 15;
console.log(`  P6  ${p6 ? 'LANDS  ' : 'REFUTED'}  header ${capacity.PRE.header} → ${capacity.POST.header} ` +
  `(registered: 103 → ≤25); pop-flag ${capacity.PRE['pop-flag']} → ${capacity.POST['pop-flag']} ` +
  '(registered: 19 → ≤15)');
console.log('');

// The .err/.out discipline is enforced here rather than reported: this harness refuses to call
// itself clean if its own recording directory has a non-empty .err beside it.
const RECDIR = resolve('docs/research/unit-464cure3-2026-11-01');
const errs = existsSync(RECDIR)
  ? readdirSync(RECDIR).filter((f) => f.endsWith('.err')) : [];
const nonEmpty = errs.filter((f) => statSync(join(RECDIR, f)).size > 0);
console.log(`ATTRIBCURE/${legs.filter((l) => !l.ok).length}  ${legs.length} gates, ` +
  `${legs.filter((l) => l.ok).length} ok; P5 ${p5pre && p5post ? 'LANDS' : 'REFUTED'}, ` +
  `P6 ${p6 ? 'LANDS' : 'REFUTED'}; prior .err files ${errs.length}, non-empty ${nonEmpty.length}`);
rmSync(SCRATCH, { recursive: true, force: true });
process.exit(0);
