// Round 378 — accepting Daedalus's Round 377 cure to A2/A3m inside `probe-round374` (my file), with
// one conjunct tightened, and this is the grading of that tightening.
//
// Run from the repo root:
//   node docs/research/round378-instruments/drive-374-a2-degenerate-spelling.mjs
//
// His cured A2 reads:
//
//   const PREFIXED = /^(probe-round\d+[a-z]?: )(.+)$/.exec(r225.refusal.source);
//   const ownSpelling = PREFIXED ? PREFIXED[2] : '(not derivable)';
//   check('A2', …, PREFIXED !== null && ownSpelling.length > 0 &&
//     r225.refusal.source !== ownSpelling && occurrences(r225Src, ownSpelling) > 0);
//
// `ownSpelling.length > 0` cannot be false while `PREFIXED !== null`, because `(.+)` already
// requires one character — driven over nine inputs, no input matches with an empty group 2. So it
// is a conjunct that cannot fail. That alone would be harmless. What is not harmless is the state
// it looks like it is guarding and does not: a declared refusal of `probe-round225:  ` (prefix then
// whitespace) MATCHES, yields `ownSpelling === ' '`, passes `length > 0`, and then
// `occurrences(r225Src, ' ') > 0` is trivially true of any source file. A2 is green on a derived
// spelling that is one space.
//
// Tightened to `ownSpelling.trim().length > 0`. This instrument drives both spellings of the
// conjunct against that state, so the tightening is graded rather than asserted.
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = process.cwd();
const ROOT = join(REPO, '.testdata', 'r378-a2');
const R374 = readdirSync(join(REPO, 'scripts')).find((f) => f.startsWith('probe-round374-'));

const DECLARED = 'refusal: /probe-round223b: something already holds 3001/,';
const DEGENERATE = 'refusal: /probe-round223b:  /,';
const TIGHT = 'ownSpelling.trim().length > 0';
const LOOSE = 'ownSpelling.length > 0';

const mint = (name) => {
  const dir = join(ROOT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(ROOT, { recursive: true });
  execFileSync('git', ['clone', '-q', REPO, dir]);
  return dir;
};
const replaceOnce = (file, from, to) => {
  const src = readFileSync(file, 'utf8');
  const n = src.split(from).length - 1;
  if (n !== 1) throw new Error('anchor not unique (' + n + '): ' + from.slice(0, 60));
  writeFileSync(file, src.replace(from, to));
};
const drive = (dir) => {
  const r = spawnSync('npx', ['tsx', join('scripts', R374)], { cwd: dir, encoding: 'utf8', timeout: 600000 });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  // TWO emit formats live in this tree and a parser that knows one reports `(none)` beside a red:
  // `probe-round263` emits `  [E2] FAIL  <text>`, `probe-round374` emits `FAIL A2  <text>`. The
  // first version of this instrument knew only the bracketed form and graded itself false for that
  // reason alone — which is the grade doing its job, since a red with no attributable arm is
  // indistinguishable from a parse failure.
  const fails = [...new Set([
    ...[...out.matchAll(/^\s*\[([A-Za-z]\w*)\]\s+FAIL\b/gm)].map((m) => m[1]),
    ...[...out.matchAll(/^\s*FAIL\s+([A-Za-z]\w*)\b/gm)].map((m) => m[1]),
  ])];
  const verdicts = out.split('\n').filter((l) => /regression check/.test(l));
  return { exit: r.status, verdict: (verdicts.at(-1) ?? '(no verdict line)').trim(), fails, out };
};

// Which spelling of the conjunct is in HEAD? The clone carries HEAD, not the working tree.
const headHasTight = readFileSync(join(REPO, 'scripts', R374), 'utf8').includes(TIGHT);

const ARMS = [
  {
    name: 'faithful control — the shipped registry, the conjunct as it stands in HEAD',
    mutate: () => {},
    expect: { exit: 0, fails: [] },
  },
  {
    name: 'registry declares `probe-round223b:  ` — a derived spelling of one space',
    mutate: (dir) => replaceOnce(join(dir, 'scripts', 'sweep-probes.mjs'), DECLARED, DEGENERATE),
    // With the LOOSE conjunct this is GREEN (the defect). With the TIGHT one, A2 goes red.
    expect: headHasTight ? { exit: 1, fails: ['A2'] } : { exit: 0, fails: [] },
  },
  {
    name: 'the same state with the OTHER spelling of the conjunct — the counterfactual',
    mutate: (dir) => {
      replaceOnce(join(dir, 'scripts', 'sweep-probes.mjs'), DECLARED, DEGENERATE);
      replaceOnce(join(dir, 'scripts', R374), headHasTight ? TIGHT : LOOSE, headHasTight ? LOOSE : TIGHT);
    },
    expect: headHasTight ? { exit: 0, fails: [] } : { exit: 1, fails: ['A2'] },
  },
];

console.log('subject       : ' + R374);
console.log('conjunct in HEAD: ' + (headHasTight ? TIGHT + '  (tightened)' : LOOSE + '  (as Daedalus shipped it)') + '\n');

let grade = true;
for (const arm of ARMS) {
  const dir = mint(ARMS.indexOf(arm) + '-' + arm.name.slice(0, 18).replace(/[^a-z0-9]+/gi, '-').toLowerCase());
  arm.mutate(dir);
  const r = drive(dir);
  const ok = r.exit === arm.expect.exit
    && r.fails.join(' ') === arm.expect.fails.join(' ')
    && (r.exit === 0 || r.fails.length > 0);
  if (!ok) grade = false;
  writeFileSync(join(ROOT, 'out-' + ARMS.indexOf(arm) + '.txt'), r.out);
  console.log((ok ? '  AS REQUIRED  ' : '  NOT AS REQUIRED  ') + arm.name);
  console.log('      exit ' + r.exit + ' · ' + r.verdict + ' · failing arm(s): ' +
    (r.fails.length ? r.fails.join(' ') : '(none)') + ' · expected exit ' + arm.expect.exit +
    ' failing ' + (arm.expect.fails.length ? arm.expect.fails.join(' ') : '(none)'));
}
console.log('\nGRADE: ' + grade);
if (grade !== true) process.exit(1);
