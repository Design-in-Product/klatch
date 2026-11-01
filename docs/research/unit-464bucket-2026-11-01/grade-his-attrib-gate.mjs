// unit-464bucket — axis 4: how much can Daedalus's `GATTRIB` absorb?
//
// `unit-464steal/grade-the-copy-is-his-reader.mjs` asserts that every line differing between my
// reader and his parameterised copy is attributable to one of four declared edits. The four
// buckets are keyed positively, which is right. But two of the predicates are much wider than
// the edits they name:
//
//   { key: 'header', why: 'my own header block, ABOVE his verbatim one',
//     mine: (l) => /^\/\//.test(l) || l === '', his: () => false },
//   { key: 'pop-flag', why: 'the --pop parameter replacing the hardcoded --all',
//     mine: (l) => /POP|--pop|POP_ARGS|REFUSED: --pop|a default would|which is the exact defect/i, … }
//
// `header`'s `why` is a POSITIONAL claim ("above his verbatim one") enforced by a SYNTACTIC
// predicate (starts with `//`, or is blank). `pop-flag` is case-insensitive on the bare
// substring `pop`, so any line containing `population`, `popped` or `.pop()` lands in it.
//
// Two readings:
//   §1 CAPACITY — for each bucket, how many lines of the whole 316-line copy its predicate
//      matches. A bucket that matches most of the file can absorb an edit to most of the file.
//   §2 CRIPPLE — four arms. His gate is run UNMODIFIED; his file hardcodes both paths
//      RELATIVE to cwd, so each arm is a scratch directory holding those two relative paths with
//      a one-line mutation planted in the copy. Nothing in the live tree is edited.
//
// The decisive pair is arm-a vs arm-b: the SAME semantic mutation, differing only in a trailing
// comment containing the word `population`.
//
// Run from the repo root:
//   node docs/research/unit-464bucket-2026-11-01/grade-his-attrib-gate.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const LIVE = resolve('.');
const GATE = 'docs/research/unit-464steal-2026-11-01/grade-the-copy-is-his-reader.mjs';
const REC6 = 'docs/research/unit-464steal-2026-11-01/drive6.copy-gate-repaired.out';
const SCRATCH = resolve('.testdata/unit-464bucket');

const gateSrc = readFileSync(join(LIVE, GATE), 'utf8');
const rec6 = readFileSync(join(LIVE, REC6), 'utf8');

const legs = [];
const check = (name, ok, note) => { legs.push({ name, ok, note }); return ok; };

// --------------------------------------------------------- his two fixture paths, lifted not typed
const hisPathM = gateSrc.match(/^const HIS = '(.+?)';$/m);
const minePathM = gateSrc.match(/^const MINE = '(.+?)';$/m);
// his DECLARED array, lifted as SOURCE and evaluated — so §1 censuses HIS predicates, not my
// retyping of them. [[feedback_run_the_regex_dont_reason_about_it]]
const declStart = gateSrc.indexOf('const DECLARED = [');
const declEnd = gateSrc.indexOf('\n];', declStart);
let DECLARED = null;
let declWhy = null;
if (declStart >= 0 && declEnd > declStart) {
  const block = gateSrc.slice(declStart + 'const DECLARED = '.length, declEnd + 3);
  try { DECLARED = new Function('return ' + block.replace(/;$/, ''))(); } catch (e) { declWhy = String(e.message); }
}
if (!hisPathM || !minePathM || !DECLARED) {
  console.log('REFUSED — his gate could not be read:');
  if (!hisPathM) console.log('   no `const HIS = \'…\';` line');
  if (!minePathM) console.log('   no `const MINE = \'…\';` line');
  if (!DECLARED) console.log('   DECLARED could not be lifted: ' + (declWhy ?? 'block not found'));
  process.exit(2);
}
const HIS = hisPathM[1];
const MINE = minePathM[1];
check('GLIFT', Array.isArray(DECLARED) && DECLARED.length === 4
  && DECLARED.map((d) => d.key).join(',') === 'header,pop-flag,label,artefact',
  `4 buckets lifted from his source: ${DECLARED.map((d) => d.key).join(', ')}`);

const hisLines = readFileSync(join(LIVE, HIS), 'utf8').split('\n');
const mineLines = readFileSync(join(LIVE, MINE), 'utf8').split('\n');

// ------------------------------------------------------------------ GREPRO: his published counts
// His drive6 printed a per-bucket (added, removed) table. The lifted predicates, run over the
// same multiset difference, must reproduce all four pairs — otherwise what I censused in §1 is
// not what his gate uses.
const bag = (lines) => { const m = new Map(); for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1); return m; };
const diffOnly = (a, b) => {
  const [ab, bb] = [bag(a), bag(b)];
  const out = [];
  for (const [l, n] of ab) { const d = n - (bb.get(l) ?? 0); for (let i = 0; i < d; i++) out.push(l); }
  return out;
};
const onlyMine = diffOnly(mineLines, hisLines);
const onlyHis = diffOnly(hisLines, mineLines);
const mineCounts = DECLARED.map((d) => ({ key: d.key,
  added: onlyMine.filter((l) => d.mine(l)).length,
  removed: onlyHis.filter((l) => d.his(l)).length }));
const recPairs = DECLARED.map((d) => {
  const row = rec6.split('\n').find((l) => l.trimStart().startsWith(d.key + ' '));
  const nums = String(row).trim().slice(d.key.length).trim().split(/\s+/).map(Number);
  return { key: d.key, added: nums[0], removed: nums[1] };
});
const reproOk = mineCounts.every((m, i) => m.added === recPairs[i].added && m.removed === recPairs[i].removed);
check('GREPRO', reproOk,
  'lifted predicates reproduce drive6\'s per-bucket (added, removed): ' +
  mineCounts.map((m, i) => `${m.key} ${m.added}/${m.removed} vs ${recPairs[i].added}/${recPairs[i].removed}`).join(' · '));

const liveDirty = execFileSync('git', ['-C', LIVE, 'status', '--porcelain', '--', 'packages/', 'scripts/'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
check('GLIVECLEAN', liveDirty.length === 0,
  `git status --porcelain -- packages/ scripts/ is ${liveDirty.length} bytes in the LIVE tree`);

// --------------------------------------------------------------------------- the planted mutations
// Each is ONE added line. arm-a and arm-b are the same code; arm-b carries a trailing comment.
const ANCHOR_LOOP = 'for (const c of commits) {';
const ANCHOR_SEP = "const SEP = '\\u0000';";
const ARMS = [
  { arm: 'ctrl', why: 'no mutation — must reproduce his drive6', plant: null },
  { arm: 'a', why: 'a real filter added to the corpus loop, no bucket keyword',
    anchor: ANCHOR_LOOP, after: true,
    line: '  if (c.subject.length > 500) continue;' },
  { arm: 'b', why: 'the SAME filter, plus a trailing comment containing "population"',
    anchor: ANCHOR_LOOP, after: true,
    line: '  if (c.subject.length > 500) continue;  // cap the population' },
  { arm: 'c', why: 'a column-0 comment asserting something false about the reader',
    anchor: ANCHOR_SEP, after: false,
    line: '// The self-exclusion is unnecessary for subjects over 30 chars.' },
];

if (existsSync(SCRATCH)) rmSync(SCRATCH, { recursive: true, force: true });
const results = [];
for (const spec of ARMS) {
  const dir = join(SCRATCH, 'arm-' + spec.arm);
  mkdirSync(join(dir, dirname(HIS)), { recursive: true });
  mkdirSync(join(dir, dirname(MINE)), { recursive: true });
  writeFileSync(join(dir, HIS), readFileSync(join(LIVE, HIS)));          // his fixture, verbatim
  let mutated = mineLines.slice();
  let planted = { ok: spec.plant === null, note: 'no mutation' };
  if (spec.plant !== null) {
    const at = mutated.findIndex((l) => l.trim() === spec.anchor);
    const already = mutated.includes(spec.line) || hisLines.includes(spec.line);
    if (at < 0 || already) {
      planted = { ok: false, note: at < 0 ? `anchor ${JSON.stringify(spec.anchor)} not found`
        : 'the planted line already exists in one of the two fixtures, so the diff would cancel' };
    } else {
      mutated.splice(spec.after ? at + 1 : at, 0, spec.line);
      planted = { ok: mutated.length === mineLines.length + 1,
        note: `1 line inserted at ${spec.after ? 'after' : 'before'} index ${at}; ${mineLines.length} → ${mutated.length} lines` };
    }
  }
  writeFileSync(join(dir, MINE), mutated.join('\n'));
  // his gate, UNMODIFIED, with cwd = the arm dir. Both its paths are relative, so it grades the
  // fixtures above and never touches the live files.
  let run;
  try {
    run = { code: 0, out: execFileSync('node', [join(LIVE, GATE)],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) { run = { code: e.status ?? '?', out: String(e.stdout ?? ''), err: String(e.stderr ?? '') }; }
  const gateLine = (n) => (run.out.split('\n').find((l) => l.trim().startsWith(n + ' ')) ?? '').trim();
  const verdict = /^VERDICT: the copy is his reader/m.test(run.out) ? 'GREEN'
    : /^VERDICT: REFUSED/m.test(run.out) ? 'REFUSED' : 'UNPARSED';
  results.push({ ...spec, dir, planted, code: run.code, verdict,
    attrib: /GATTRIB {3}ok/.test(run.out) ? 'ok' : 'RED',
    gateLines: ['GATTRIB', 'GNOPAD', 'GWITNESS', 'GALLGONE', 'GREADER'].map(gateLine),
    unattributed: run.out.includes('UNATTRIBUTED lines I added'),
    raw: run.out });
}

// GCTRL — the no-mutation arm must reproduce his own recording's five gate lines byte for byte.
// Without this, a green on a cripple arm could just mean my fixtures do not drive his gate.
const ctrl = results.find((r) => r.arm === 'ctrl');
const rec6Lines = ['GATTRIB', 'GNOPAD', 'GWITNESS', 'GALLGONE', 'GREADER']
  .map((n) => (rec6.split('\n').find((l) => l.trim().startsWith(n + ' ')) ?? '').trim());
const ctrlMatches = ctrl.gateLines.filter((l, i) => l === rec6Lines[i]).length;
check('GCTRL', ctrl.code === 0 && ctrl.verdict === 'GREEN' && ctrlMatches === 5,
  `ctrl arm exit ${ctrl.code}, ${ctrl.verdict}, ${ctrlMatches}/5 gate lines byte-identical to drive6`);
check('GPLANT', results.every((r) => r.planted.ok),
  `every arm's fixture is exactly as declared (${results.filter((r) => r.planted.ok).length}/${results.length})`);

// ------------------------------------------------------------------------------------- readings
const gatesOk = legs.every((l) => l.ok);
console.log('unit-464bucket — how much can his GATTRIB absorb?');
console.log(`  his gate:  ${GATE}`);
console.log(`  fixtures:  HIS ${hisLines.length} lines · MINE ${mineLines.length} lines (as his gate counts them)`);
console.log(`  scratch:   ${SCRATCH}`);
console.log('');
console.log('GATES');
for (const l of legs) console.log(`  ${l.name.padEnd(11)} ${l.ok ? 'ok ' : 'RED'} — ${l.note}`);
console.log('');
if (!gatesOk) { console.log('REFUSED — a gate is RED, so nothing below is published.'); process.exit(1); }

console.log('1. BUCKET CAPACITY — lines of the WHOLE copy each lifted predicate matches');
console.log('   bucket     matches  of    %      used by the declared edit   why (his words)');
for (const d of DECLARED) {
  const cap = mineLines.filter((l) => d.mine(l)).length;
  const used = onlyMine.filter((l) => d.mine(l)).length;
  console.log(`   ${d.key.padEnd(10)} ${String(cap).padStart(7)} ${String(mineLines.length).padStart(5)} ` +
    `${(100 * cap / mineLines.length).toFixed(1).padStart(5)}%  ${String(used).padStart(24)}   ${d.why}`);
}
const structM = gateSrc.match(/^const STRUCTURAL = new Map\(\[([\s\S]*?)^\]\);$/m);
const structN = structM ? [...structM[1].matchAll(/^ {2}\[/gm)].length : -1;
console.log(`   (beside a structural allowlist of ${structN} exact strings, which GNOPAD requires be fully consumed)`);
console.log('');

console.log('2. CRIPPLE ARMS — his gate, unmodified, on a one-line mutation of the copy');
console.log('   arm   GATTRIB  verdict   exit  what was planted');
for (const r of results) {
  console.log(`   ${r.arm.padEnd(5)} ${r.attrib.padEnd(8)} ${r.verdict.padEnd(9)} ${String(r.code).padEnd(5)} ${r.why}`);
}
console.log('');
for (const r of results.filter((x) => x.arm !== 'ctrl')) {
  const bucketsHit = DECLARED.filter((d) => d.mine(r.line)).map((d) => d.key);
  console.log(`   arm-${r.arm}: ${JSON.stringify(r.line)}`);
  console.log(`          buckets whose predicate matches it: ${bucketsHit.length ? bucketsHit.join(', ') : '(none)'}` +
    ` ⇒ his gate ${r.attrib === 'ok' ? 'ABSORBED it (green)' : 'CAUGHT it (red)'}`);
}
console.log('');

const absorbed = results.filter((r) => r.arm !== 'ctrl' && r.attrib === 'ok');
const caught = results.filter((r) => r.arm !== 'ctrl' && r.attrib === 'RED');
const armA = results.find((r) => r.arm === 'a');
const armB = results.find((r) => r.arm === 'b');
const pairFlips = armA && armB && armA.attrib !== armB.attrib;
const headerCap = mineLines.filter((l) => DECLARED[0].mine(l)).length;
console.log('READINGS');
console.log(`  absorbed (gate green on a planted mutation): ${absorbed.map((r) => 'arm-' + r.arm).join(', ') || '(none)'}`);
console.log(`  caught   (gate red):                         ${caught.map((r) => 'arm-' + r.arm).join(', ') || '(none)'}`);
console.log(`  the a/b pair — identical code, one comment — flips the verdict: ${pairFlips}`);
console.log('');
console.log('PREDICTIONS settled by this drive');
console.log(`  P5  ${headerCap >= 100 ? 'LANDS  ' : 'REFUTED'}  the \`header\` predicate matches ${headerCap} of ` +
  `${mineLines.length} lines of the whole copy (registered threshold: >= 100)`);
console.log(`  P6  ${absorbed.length >= 1 ? 'LANDS  ' : 'REFUTED'}  ${absorbed.length} of 3 planted mutations ` +
  `went green: ${absorbed.map((r) => 'arm-' + r.arm).join(', ') || '(none)'}`);
console.log('');
console.log(`ATTRIBVERDICT/0  ${legs.length} gates ok; absorbed ${absorbed.length}/3, caught ${caught.length}/3, ` +
  `a-vs-b flips ${pairFlips}`);
process.exit(0);
