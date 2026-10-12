// Round 378 — the counterfactual for `probe-round263` arm E: it binds `probe-round261`'s live
// source to an identifier and runs two CHECKS over that source text, keyed on hand-typed
// spellings of 261's internal identifiers. Same mechanism Rounds 375/376/377 cured at four
// other sites.
//
// Run from the repo root:  node docs/research/round378-instruments/drive-263-arm-e-counterfactual.mjs
//
// ── Two things this instrument got wrong first, both recorded because they changed a reading ──
//
// 1. A `git init` sandbox (the Round 332 pattern) is NOT viable for this subject. 263 arm A runs
//    `git show <pinned sha>:scripts/probe-round261-….mts` against this repo's real history, so a
//    minted repo has no such object and ALL FOUR arms came back exit 1 — the faithful control red
//    alongside them. That is the control doing its job: four reds with a red control is not a
//    reading. It clones instead.
// 2. The failing-arm parser looked for `^[FAIL] <arm>` and 263 emits `  [E2] FAIL  <text>`, so the
//    first run printed `failing arm(s): (none)` beside exit 1. A red with no attributable arm is
//    indistinguishable from a parse failure, so the arm list is asserted EXACTLY below, not
//    contained, and the grade fails if any arm list is empty on a red run.
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO = process.cwd();
const ROOT = join(REPO, '.testdata', 'r378');
const SCRIPTS = join(REPO, 'scripts');
const R261 = readdirSync(SCRIPTS).find((f) => f.startsWith('probe-round261'));
const R263 = readdirSync(SCRIPTS).find((f) => f.startsWith('probe-round263'));
if (!R261 || !R263) throw new Error('subject or mutation target not found under scripts/');

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
  if (n !== 1) throw new Error('anchor not unique (' + n + '): ' + from.slice(0, 70));
  writeFileSync(file, src.replace(from, to));
};
const replaceEvery = (file, from, to) => {
  const src = readFileSync(file, 'utf8');
  const n = src.split(from).length - 1;
  if (n < 1) throw new Error('anchor absent: ' + from);
  writeFileSync(file, src.split(from).join(to));
  return n;
};

const drive = (dir) => {
  const t0 = Date.now();
  const r = spawnSync('npx', ['tsx', join('scripts', R263)], {
    cwd: dir, encoding: 'utf8', timeout: 900000,
  });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  // 263 emits `  [E2] FAIL  <text>`; take the arm ids, and the LAST verdict line, never the first
  // (a first-match read has reported a child's headline as a parent's on this project).
  const fails = [...out.matchAll(/^\s*\[([A-Za-z]\w*)\]\s+FAIL\b/gm)].map((m) => m[1]);
  const verdicts = out.split('\n').filter((l) => /regression check/.test(l));
  return {
    exit: r.status,
    verdict: (verdicts.at(-1) ?? '(no verdict line)').trim(),
    fails: [...new Set(fails)],
    ms: Date.now() - t0,
    out,
  };
};

const ANCHOR = 'const zBefore = Z_PATHSPECS.map((p) => fingerprint(REPO, p));';

const ARMS = [
  {
    name: 'faithful control — nothing changed',
    expect: { exit: 0, fails: [] },
    mutate: () => ({}),
  },
  {
    name: "261's two local fingerprint identifiers renamed (behaviour-preserving)",
    // Both are declared once and used only inside 261, and 261 exports nothing at all, so this
    // is behaviour-preserving in the strictest sense available — Daedalus's own §2 standard.
    expect: { exit: 1, fails: ['E2'] },
    mutate: (f) => ({
      zBefore: replaceEvery(f, 'zBefore', 'zOpenFp'),
      zAfter: replaceEvery(f, 'zAfter', 'zCloseFp'),
    }),
  },
  {
    name: 'narrowness control — a DIFFERENT local in 261 renamed, one E2 does not name',
    // If this reddened too, the red above would be about editing 261 at all rather than about
    // the two spellings E2 hand-types.
    expect: { exit: 0, fails: [] },
    mutate: (f) => ({ Z_PATHSPECS: replaceEvery(f, 'Z_PATHSPECS', 'Z_SPECLIST') }),
  },
  {
    name: "261 re-acquires an allowlist under a DIFFERENT spelling (E1's absence claim tested)",
    expect: { exit: 0, fails: [] },
    mutate: (f) => {
      replaceOnce(f, ANCHOR, ANCHOR +
        "\nconst allowlisted = (l: string) => !new RegExp('sweep-probes[.]mjs' + '|' + 'probe-round261').test(l);\n" +
        'void allowlisted;');
      return { respelled: 1 };
    },
  },
  {
    name: "261 re-acquires the allowlist VERBATIM (known positive for E1)",
    expect: { exit: 1, fails: ['E1'] },
    mutate: (f) => {
      replaceOnce(f, ANCHOR, ANCHOR +
        '\nconst allowlisted = (l: string) => !/sweep-probes\\.mjs|probe-round261/.test(l);\nvoid allowlisted;');
      return { verbatim: 1 };
    },
  },
];

const rows = [];
let grade = true;
for (const arm of ARMS) {
  const dir = mint(arm.name.slice(0, 24).replace(/[^a-z0-9]+/gi, '-').toLowerCase());
  const counts = arm.mutate(join(dir, 'scripts', R261));
  const r = drive(dir);
  const exitOk = r.exit === arm.expect.exit;
  const failsOk = r.fails.join(' ') === arm.expect.fails.join(' ');
  const attributable = r.exit === 0 || r.fails.length > 0; // a red with no arm is a parse failure
  const ok = exitOk && failsOk && attributable;
  if (!ok) grade = false;
  rows.push({ arm, r, counts, ok });
  writeFileSync(join(ROOT, 'out-' + ARMS.indexOf(arm) + '.txt'), r.out);
}

console.log('subject driven : ' + R263);
console.log('file mutated   : ' + R261 + '\n');
for (const { arm, r, counts, ok } of rows) {
  console.log((ok ? '  AS REQUIRED  ' : '  NOT AS REQUIRED  ') + arm.name);
  console.log('      exit ' + r.exit + ' · ' + r.verdict +
    ' · failing arm(s): ' + (r.fails.length ? r.fails.join(' ') : '(none)') +
    ' · expected exit ' + arm.expect.exit +
    ' failing ' + (arm.expect.fails.length ? arm.expect.fails.join(' ') : '(none)'));
  const c = Object.entries(counts).map(([k, v]) => k + ' ×' + v).join(', ');
  if (c) console.log('      replacements asserted: ' + c);
  console.log('      ' + r.ms + ' ms');
}
console.log('\nGRADE (every arm as required, every red attributable): ' + grade);
if (grade !== true) {
  console.log('refusing: an arm came out other than as required (356 — gate on !== true)');
  process.exit(1);
}
