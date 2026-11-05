// unit-464frozen — drive1: eight arms against Daedalus's v1.5 entry gate.
//
//   node docs/research/unit-464frozen-2026-11-05/drive1-arms.mjs        (from the repo root)
//
// Each arm is a COPY of the six files `grade-entry-v15.mjs` reads, laid out at the SAME DEPTH below
// an arm root, mutated in exactly one place, and driven with cwd = that arm root. `D`, `DOC` and
// `AXES` in the subject are all cwd-relative, so an arm root at the wrong depth refuses every cell
// rather than grading it. The arm roots stay inside this worktree because the subject also runs
// `git rev-parse <PIN>:<path>` (root-relative, so it reads the REAL tree at the pin) and
// `git hash-object <AXES>` (cwd-relative, so it reads the ARM's copy) — outside a repo both refuse.
//
// A0CONTROL is the matched baseline: no arm's RED is attributable to its mutation unless the
// unmutated arm, driven the same way from the same depth, grades as the repo-root run does.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const PREC = 'docs/research/unit-464prec-2026-11-03/';
const ORDER = 'docs/research/unit-464order-2026-11-02/';
const CONV = 'docs/research/LEG-CLASS-CONVENTION.md';
const SUBJECT = PREC + 'grade-entry-v15.mjs';
const SCRATCH = 'docs/research/unit-464frozen-2026-11-05/.arms';

// Every file the subject reads, measured off the subject's own source rather than recalled.
const FILES = [
  SUBJECT, CONV, ORDER + 'HAND-AXES-13.tsv',
  PREC + 'drive5.prec.out', PREC + 'drive6.cripple-preckey.out', PREC + 'drive7.cripple-hkonly.out',
  PREC + 'drive6.delta-vs-drive5.txt', PREC + 'drive7.delta-vs-drive5.txt',
];

const g = (a, o = {}) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...o }).trim();

// Refuse loudly rather than grade a tree I am not at the root of.
const top = g(['rev-parse', '--show-toplevel']);
if (resolve(top) !== resolve(process.cwd())) {
  console.log(`REFUSE — cwd ${process.cwd()} is not the repo root ${top}`);
  process.exit(2);
}
console.log(`subject ${SUBJECT}`);
console.log(`subject rev (HEAD, read not recalled) ${g(['rev-parse', 'HEAD'])}`);
console.log(`subject blob at HEAD ${g(['rev-parse', `HEAD:${SUBJECT}`]).slice(0, 12)}`);
console.log('');

// ---- the mutations. Each returns the mutated text, or throws if its anchor is absent. ------------
// Row tokens in these recordings are PADDED by `name.padEnd(12)`, so every anchor below is captured
// with a regex and re-emitted, never retyped. [[feedback_an_aligned_row_token_is_padded]]
const sub1 = (re, repl) => (t) => {
  if (!re.test(t)) throw new Error(`anchor absent: ${re}`);
  return t.replace(re, repl);
};
// A3: rewrite the GP3ORDER changed PAIR as a GP4SURVIVE pair whose verdicts differ, keeping the line
// count at 4 and both `0 departures of 5` occurrences. `tok` is injected into the note.
const hkMask = (tok) => (t) => {
  const lines = t.split('\n');
  let seen = 0;
  const out = lines.map((l) => {
    const m = l.match(/^([<>])(\s+)(ok|RED)(\s+)GP3ORDER(\s+)(most-movable-wins )(.*)$/);
    if (!m) return l;
    seen += 1;
    const verdict = seen === 2 ? 'RED' : m[3];
    return `${m[1]}${m[2]}${verdict}${m[4]}GP4SURVIVE${m[5]}${m[6]}[cf ${tok}] ${m[7]}`;
  });
  if (seen !== 2) throw new Error(`expected 2 GP3ORDER changed lines, found ${seen}`);
  return out.join('\n');
};
// A7: one digit inside the §2.1g span. The span end is re-derived here with the SAME structural rule
// the repaired subject uses (next `### ` that is not the entry's own MEASURED-BLOCK, else end of
// document) — a declared re-implementation, printed so it can be checked against the subject's own
// SPAN figure. [[feedback_derive_the_verdict_predicate_from_the_branch_literals]]
const docDigit = (t) => {
  const i = t.indexOf('### 2.1g');
  if (i < 0) throw new Error('### 2.1g absent');
  const heads = [...t.matchAll(/^### .*$/gm)].filter((m) => m.index > i && !m[0].startsWith('### MEASURED-BLOCK-V15'));
  const j = heads.length ? heads[0].index : t.length;
  const span = t.slice(i, j);
  const d = span.search(/[0-9]/);
  if (d < 0) throw new Error('no digit in the span');
  console.log(`   (A7DOC re-derived span: ${span.length} bytes, ends at ${heads.length ? heads[0][0].slice(0, 20) : '(eof)'}; ` +
    `first digit at span offset ${d} = "${span[d]}")`);
  const ch = span[d] === '9' ? '8' : String(Number(span[d]) + 1);
  return t.slice(0, i + d) + ch + t.slice(i + d + 1);
};

const ARMS = [
  ['A0CONTROL', null, null, []],
  ['A1CLAIM', PREC + 'drive5.prec.out',
    sub1(/RED — 19 of 20 legs ok/, 'RED — 18 of 20 legs ok'), ['GCLAIMS']],
  ['A2HKEXTRA', PREC + 'drive7.delta-vs-drive5.txt',
    (t) => t.replace(/\n?$/, '\n>    RED  GP4UNIQUE    appended fifth changed line\n'), ['GHKNOOP']],
  ['A3HKMASK', PREC + 'drive7.delta-vs-drive5.txt', hkMask('GP3ORDER'), []],
  ['A3bHKPLAIN', PREC + 'drive7.delta-vs-drive5.txt', hkMask('GPXORDER'), ['GHKNOOP']],
  ['A4ECHO', PREC + 'drive7.delta-vs-drive5.txt',
    sub1(/0 departures of 5/, '0 departures of 6'), ['GHKECHO']],
  ['A5PKFLIP', PREC + 'drive6.cripple-preckey.out',
    sub1(/^( {3})ok( +GP6COUNT )/m, '$1RED$2'), ['GPKREACHED']],
  ['A6TSV', ORDER + 'HAND-AXES-13.tsv', (t) => t + '\n', ['GTSVFROZEN']],
  ['A7DOC', CONV, docDigit, ['GENTRY']],
];

rmSync(SCRATCH, { recursive: true, force: true });
// The scratch holds ~10 copies of a 1700-line document, and it lives inside the repo because the
// subject needs a repo to resolve `git rev-parse`. A `git add -A` over this unit's directory swept
// all 79 of them into commit 3db1279b before this guard existed; they were untracked in the next
// commit, forward, and this `*` ignore is the mechanical fix so the next driver cannot repeat it.
mkdirSync(SCRATCH, { recursive: true });
writeFileSync(`${SCRATCH}/.gitignore`, '*\n');
const rows = [];
for (const [arm, target, mut, predicted] of ARMS) {
  const root = `${SCRATCH}/${arm}`;
  for (const d of [PREC, ORDER, 'docs/research/']) mkdirSync(`${root}/${d}`, { recursive: true });
  for (const f of FILES) writeFileSync(`${root}/${f}`, readFileSync(f));
  console.log(`== ${arm}  ${target ?? '(no mutation)'}`);
  if (mut) {
    const before = readFileSync(`${root}/${target}`, 'utf8');
    let after;
    try { after = mut(before); } catch (e) { console.log(`   MUTATION REFUSED: ${e.message}`); rows.push([arm, 'REFUSED', predicted, null]); continue; }
    if (after === before) { console.log('   MUTATION NO-OP — arm abandoned, it would be a second control'); rows.push([arm, 'NOOP', predicted, null]); continue; }
    writeFileSync(`${root}/${target}`, after);
    // The mutation's own diff, printed: a cripple that is not shown to have landed is not a cripple.
    const bl = before.split('\n'), al = after.split('\n');
    const changed = [];
    for (let k = 0; k < Math.max(bl.length, al.length); k += 1) if (bl[k] !== al[k]) changed.push(k);
    console.log(`   landed: ${before.length} -> ${after.length} bytes, ${changed.length} line(s) differ` +
      (changed.length <= 3 ? changed.map((k) => `\n     - ${(bl[k] ?? '(absent)').slice(0, 150)}\n     + ${(al[k] ?? '(absent)').slice(0, 150)}`).join('') : ''));
  }
  let out = '', err = '', status = 0;
  try {
    // The script path must be ABSOLUTE: an argv path is resolved against the CHILD's cwd, which is
    // the arm root, so a repo-relative path sends node looking for <arm>/<arm>/<subject>. The first
    // form of this line did exactly that and refused all nine arms — caught only because A0CONTROL
    // refused too, i.e. by the matched baseline rather than by reading the code.
    out = execFileSync(process.execPath, [resolve(root, SUBJECT)], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
  } catch (e) {
    out = e.stdout ?? ''; err = e.stderr ?? ''; status = e.status ?? -1;
  }
  const verdicts = [...out.matchAll(/^ {3}(ok|RED) +(G[A-Z0-9]+) /gm)].map((m) => [m[2], m[1]]);
  const red = verdicts.filter(([, v]) => v === 'RED').map(([n]) => n);
  const summary = (out.match(/^(GREEN|RED) — .*$/m) ?? ['(no summary line)'])[0];
  // A run that never reached the summary line is a REFUSAL, not a RED. [[topic_refusal_and_sentinels]]
  const kind = verdicts.length === 6 ? 'GRADED' : 'REFUSED';
  console.log(`   exit ${status} · ${verdicts.length} leg lines · ${summary}`);
  if (kind === 'REFUSED') console.log(`   stderr: ${err.split('\n').slice(0, 4).join(' | ').slice(0, 400)}`);
  // NOT truncated. The first form of this line printed `.slice(0, 230)`, and `probe-notes` then
  // derived a common-suffix figure from the recording: every note at or over 230 bytes was cut, so
  // three of six legs' suffix figures measured my own display width, not the leg's note.
  // `probe-notes.out` is kept as the contaminated evidence; this is the re-record.
  for (const l of out.split('\n').filter((l) => /^ {3}(ok|RED) /.test(l))) console.log(`      ${l.trim()}`);
  rows.push([arm, kind, predicted, red]);
  console.log('');
}

console.log('== MATRIX — registered cell vs measured');
const eq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
let hit = 0;
for (const [arm, kind, predicted, red] of rows) {
  const p = predicted.length ? `{${predicted.join(', ')}}` : '∅';
  const m = kind !== 'GRADED' ? kind : (red.length ? `{${red.join(', ')}}` : '∅');
  const ok = kind === 'GRADED' && eq(predicted, red);
  if (ok) hit += 1;
  console.log(`   ${ok ? 'HIT ' : 'MISS'} ${arm.padEnd(11)} predicted ${p.padEnd(16)} measured ${m}`);
}
console.log('');
console.log(`${hit} of ${rows.length} arms hit their registered cell`);
