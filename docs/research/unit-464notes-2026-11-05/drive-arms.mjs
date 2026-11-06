// unit-464notes — drive the 9 registered arms against BOTH versions of the instrument.
//
//   node docs/research/unit-464notes-2026-11-05/drive-arms.mjs
//
// Each arm is a COPY of the 7 paths the subject reads, at the same relative depth below an arm
// root, mutated in one place, driven with cwd = that arm root. Two versions are driven on every
// arm: PRE (`git show <SUBJECT_PRE_REV>:<subject>`) and POST (the live file). No parameterisation
// is applied to either version — the arm root supplies every input through cwd — so there is no
// one-line diff between the two drives other than the cure itself.
//
// The subject's argv path is made ABSOLUTE: `execFileSync(node, [relpath], {cwd: armRoot})`
// resolves the argv path against the CHILD's cwd, which refused all nine of Theseus's arms on his
// first drive. [[feedback_an_argv_script_path_resolves_against_the_childs_cwd]]
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SUBJECT = 'docs/research/unit-464prec-2026-11-03/grade-entry-v15.mjs';
const PRE_REV = '7c596cdb';                       // the rev named in PRE-REGISTRATION.md
const UNIT = 'docs/research/unit-464notes-2026-11-05';
const SCRATCH = `${UNIT}/scratch`;

const READS = [
  'docs/research/LEG-CLASS-CONVENTION.md',
  'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv',
  'docs/research/unit-464prec-2026-11-03/drive5.prec.out',
  'docs/research/unit-464prec-2026-11-03/drive7.delta-vs-drive5.txt',
  'docs/research/unit-464prec-2026-11-03/drive6.delta-vs-drive5.txt',
  'docs/research/unit-464prec-2026-11-03/drive6.cripple-preckey.out',
  'docs/research/unit-464prec-2026-11-03/drive7.cripple-hkonly.out',
];

const HK = 'docs/research/unit-464prec-2026-11-03/drive7.delta-vs-drive5.txt';
const PK = 'docs/research/unit-464prec-2026-11-03/drive6.cripple-preckey.out';
const DOC = 'docs/research/LEG-CLASS-CONVENTION.md';
const TSV = 'docs/research/unit-464order-2026-11-02/HAND-AXES-13.tsv';

// Each mutation takes the arm's file map and edits exactly one value. A mutation that cannot find
// what it means to change THROWS — a silent no-op mutation would publish an arm as a known
// positive when it is a second copy of the control.
const sub = (s, from, to, want) => {
  const n = s.split(from).length - 1;
  if (n !== want) throw new Error(`mutation anchor ${JSON.stringify(from)} found ${n}x, want ${want}`);
  return s.split(from).join(to);
};

// The hk delta's two GP3ORDER verdict rows, rewritten as a GP4SURVIVE pair whose verdicts DIFFER,
// with the GP3ORDER token surviving only inside the note. Line count stays 4; both
// "0 departures of 5" survive; the demoted-ORDER header pair is untouched.
const hkMask = (token) => (f) => {
  let hk = f[HK];
  hk = sub(hk, '   ok   GP3ORDER       most-movable-wins under [history-keyed > movable > immovable]',
    `   ok   GP4SURVIVE     [cf ${token}] most-movable-wins under [history-keyed > movable > immovable]`, 1);
  hk = sub(hk, '   ok   GP3ORDER       most-movable-wins under [movable > immovable > history-keyed]',
    `   RED  GP4SURVIVE     [cf ${token}] most-movable-wins under [movable > immovable > history-keyed]`, 1);
  f[HK] = hk;
};

const ARMS = {
  A0CONTROL: () => {},
  A1HKMASK: hkMask('GP3ORDER'),
  A1bHKPLAIN: hkMask('GPXORDER'),
  // A fourth leg flipped in the cripple recording. GP6COUNT is `ok` in both drive5 and drive6
  // today, so flipping it here makes the name-keyed join report 4, not 3.
  A2PKFLIP: (f) => { f[PK] = sub(f[PK], '   ok   GP6COUNT', '   RED  GP6COUNT', 1); },
  // Exactly ONE of the two occurrences changed, so GHKECHO's count predicate moves from 2 to 1.
  A3ECHO: (f) => {
    const i = f[HK].indexOf('0 departures of 5');
    f[HK] = f[HK].slice(0, i) + '0 departures of 6' + f[HK].slice(i + '0 departures of 5'.length);
  },
  A4TSV: (f) => { f[TSV] = f[TSV] + '\n'; },
  // One byte of case on the single line-start heading.
  A5RENAME: (f) => { f[DOC] = sub(f[DOC], '\n### 2.1g A `conjunctive`', '\n### 2.1G A `conjunctive`', 1); },
  // §2.1p's Part B removed whole: the three prose occurrences of the anchor go, the heading stays.
  A6TAILONLY: (f) => {
    const a = f[DOC].indexOf('## Part B — the `GENTRY` leg, repaired');
    const b = f[DOC].indexOf('## 3. The rule that follows', a);
    if (a < 0 || b < 0) throw new Error('A6TAILONLY: Part B bounds not found');
    f[DOC] = f[DOC].slice(0, a) + f[DOC].slice(b);
  },
  // A SECOND line-start hit. Theseus's A11BOTH drove occurrences to 0, which grades the
  // absent-anchor refusal the instrument already had; nothing he built grades duplication.
  A7DUP: (f) => { f[DOC] = f[DOC] + '\n### 2.1g duplicated verbatim by A7DUP\n'; },
};

const live = Object.fromEntries(READS.map((p) => [p, readFileSync(p, 'utf8')]));
const subjectPre = execFileSync('git', ['show', `${PRE_REV}:${SUBJECT}`], { encoding: 'utf8', maxBuffer: 1 << 28 });
const subjectPost = readFileSync(SUBJECT, 'utf8');

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
// A `*` .gitignore at the scratch root, written at creation, so no later `git add -A` over this
// directory can track ten copies of a 1700-line document.
// [[feedback_git_add_minus_a_over_a_unit_dir_tracks_the_scratch_in_it]]
writeFileSync(`${SCRATCH}/.gitignore`, '*\n');
const VERSIONS = { PRE: `${SCRATCH}/subject-PRE.mjs`, POST: `${SCRATCH}/subject-POST.mjs` };
writeFileSync(VERSIONS.PRE, subjectPre);
writeFileSync(VERSIONS.POST, subjectPost);

console.log(`unit-464notes · 9 arms x 2 versions · subject ${SUBJECT}`);
console.log(`PRE  = git show ${PRE_REV}:<subject>  (${subjectPre.length} bytes)`);
console.log(`POST = live worktree                  (${subjectPost.length} bytes)`);
console.log(`identical: ${subjectPre === subjectPost}`);
console.log('');

const run = (version, armRoot) => {
  try {
    const out = execFileSync(process.execPath, [resolve(VERSIONS[version])], {
      cwd: armRoot, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { rc: 0, out };
  } catch (e) {
    return { rc: e.status ?? 'THROW', out: (e.stdout ?? '') + (e.stderr ?? '') };
  }
};

const results = {};
for (const [arm, mutate] of Object.entries(ARMS)) {
  const files = { ...live };
  mutate(files);                      // throws if its anchor is missing — no silent no-op arm
  const root = `${SCRATCH}/${arm}`;
  for (const [p, body] of Object.entries(files)) {
    mkdirSync(dirname(`${root}/${p}`), { recursive: true });
    writeFileSync(`${root}/${p}`, body);
  }
  results[arm] = {};
  for (const v of ['PRE', 'POST']) {
    const r = run(v, root);
    results[arm][v] = r;
    const verdict = (r.out.match(/^(GREEN|RED) — (\d+) of (\d+) legs ok/m) ?? [])[0] ?? `(no verdict line, rc=${r.rc})`;
    const reds = [...r.out.matchAll(/^   RED  (\S+)/gm)].map((m) => m[1]);
    console.log(`=== ${arm.padEnd(11)} ${v.padEnd(4)} rc=${String(r.rc).padEnd(5)} ${verdict}${reds.length ? `  REDS: ${reds.join(', ')}` : ''}`);
  }
  for (const v of ['PRE', 'POST']) {
    console.log(`--- ${arm} ${v} full output`);
    console.log(results[arm][v].out.replace(/^/gm, '    ').trimEnd());
  }
  console.log('');
}

// The note-level comparison the C2 cure exists for: for each leg, is its note on this arm the
// SAME BYTES as its note on A0CONTROL? A note that never moves cannot report its own failure.
console.log('=== note movement: per leg, does the note differ from its A0CONTROL note?');
const notes = (out) => Object.fromEntries([...out.matchAll(/^   (?:ok  |RED ) (\S+) +(.*)$/gm)].map((m) => [m[1], m[2]]));
for (const v of ['PRE', 'POST']) {
  const ctrl = notes(results.A0CONTROL[v].out);
  for (const arm of Object.keys(ARMS)) {
    if (arm === 'A0CONTROL') continue;
    const n = notes(results[arm][v].out);
    const moved = Object.keys(ctrl).filter((k) => n[k] !== undefined && n[k] !== ctrl[k]);
    const stuck = Object.keys(ctrl).filter((k) => n[k] !== undefined && n[k] === ctrl[k]);
    const reds = [...results[arm][v].out.matchAll(/^   RED  (\S+)/gm)].map((m) => m[1]);
    const stuckRed = reds.filter((r) => stuck.includes(r));
    console.log(`  ${v} ${arm.padEnd(11)} moved ${String(moved.length).padEnd(2)} [${moved.join(', ')}]` +
      `${stuckRed.length ? `  ** RED WITH AN UNCHANGED NOTE: ${stuckRed.join(', ')} **` : ''}`);
  }
}
