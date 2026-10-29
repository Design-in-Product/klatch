#!/usr/bin/env node
// verify-wrap.mjs — Session Wrap Protocol steps 1 and 2, read off `origin/main` rather than
// off the working tree. Counts with readdirSync/git cat-file per path, never with grep: grep
// drops a file containing a NUL byte and the figure comes out smaller without saying so.

import { execFileSync } from 'node:child_process';

const REPO = '/Users/xian/Development/klatch-worktrees/theseus';
const UNIT = 'docs/research/unit-464t2-denial-2026-10-28';

function git(args, allowFail = false) {
  try {
    return execFileSync('git', ['-C', REPO, ...args], {
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    if (allowFail) return null;
    throw e;
  }
}

git(['fetch', 'origin', '--quiet']);
const main = git(['rev-parse', 'origin/main']).trim();
console.log(`origin/main = ${main}`);
console.log(`local HEAD  = ${git(['rev-parse', 'HEAD']).trim()}`);

// --- Step 1: this fire's commits, with %an so authorship is checked not assumed ----------
const MINE = ['94a4312b', 'f5bc7253', 'e9901fae', 'deacf180', 'cffc9e9d', 'dc537465', '9fe0979c'];
console.log(`\nSTEP 1 — this fire's commits on origin/main, with author:`);
let allPresent = true;
let allMine = true;
for (const c of MINE) {
  // REPAIRED. This read `git log origin/main --format=... -1 <c>`, which passes TWO revs:
  // git logs their union and `-1` takes the NEWEST, so all seven rows printed the tip commit
  // and each was graded PRESENT+MINE off a line that was not the commit it named. The
  // ancestry check below was per-commit and correct; the printed evidence was not. `show -s`
  // takes exactly one rev and cannot do this.
  const line = git(['show', '-s', '--format=%h %an %s', c], true);
  const reachable = git(['merge-base', '--is-ancestor', c, 'origin/main'], true) !== null;
  if (!line || !reachable) {
    console.log(`  MISSING  ${c}`);
    allPresent = false;
    continue;
  }
  const first = line.split('\n')[0];
  const isMine = /^\S+ Theseus \(Klatch\)/.test(first);
  if (!isMine) allMine = false;
  console.log(`  ${reachable ? 'ON-MAIN' : 'MISSING'} ${isMine ? 'MINE  ' : 'OTHER '} ${first.slice(0, 120)}`);
}

// --- Step 2: each deliverable read off origin/main, by path -------------------------------
const DELIVERABLES = [
  `${UNIT}/recon-denial-shapes.mjs`,
  `${UNIT}/predicted.md`,
  `${UNIT}/grade-the-denial-model.mjs`,
  `${UNIT}/drive-cripples.mjs`,
  `${UNIT}/verify-wrap.mjs`,
  'docs/mail/theseus-to-daedalus-cc-xian-janus-argus-calliope-iris-your-174-is-adopted-and-the-key-that-produces-it-deletes-467-2026-10-28.md',
  'docs/COORDINATION.md',
  'docs/logs/2026-10-28-1047-theseus-opus-log.md',
];
console.log(`\nSTEP 2 — each named deliverable, read off origin/main:`);
let missing = 0;
for (const p of DELIVERABLES) {
  const ok = git(['cat-file', '-e', `origin/main:${p}`], true) !== null;
  if (!ok) missing++;
  console.log(`  ${ok ? 'PRESENT' : 'MISSING'}  ${p}`);
}

// --- Step 2b: the unit directory as origin/main holds it, and every .err size --------------
const tree = git(['ls-tree', '-r', '--name-only', `origin/main`, '--', UNIT])
  .split('\n')
  .filter(Boolean);
console.log(`\nunit directory on origin/main: ${tree.length} files`);
const errs = tree.filter((p) => p.endsWith('.err'));
let nonEmptyErr = 0;
for (const p of errs) {
  const size = Number(git(['cat-file', '-s', `origin/main:${p}`]).trim());
  if (size !== 0) {
    nonEmptyErr++;
    console.log(`  NONEMPTY ${size} bytes  ${p}`);
  }
}
console.log(`.err files: ${errs.length}, non-empty: ${nonEmptyErr} (sized per file with cat-file -s, not grep)`);

// --- Step 2c: the finding verified at the BLOB, not at my claim ---------------------------
// The grader on origin/main must carry BOTH the false-positive subject and the cure regex,
// and its verdict/exit must come from one value. Checking one and not the others is the
// exact failure mode.
const graderSrc = git(['show', `origin/main:${UNIT}/grade-the-denial-model.mjs`]);
const checks = {
  fpSubjectPresent: graderSrc.includes('no round467-instruments directory'),
  cureRegexPresent: graderSrc.includes('(?![-\\w./])'),
  exitDerived: graderSrc.includes('process.exit(code)') && graderSrc.includes('VERDICT/${code}'),
  selfReadsDisk: graderSrc.includes('fileURLToPath(import.meta.url)'),
  classifierRepaired: graderSrc.includes('nonDenialSubjectRounds.has(n)'),
};
console.log(`\nSTEP 2c — the finding and both repairs, verified at the blob on origin/main:`);
for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? 'OK  ' : 'FAIL'} ${k}`);

const ok =
  allPresent && allMine && missing === 0 && nonEmptyErr === 0 && Object.values(checks).every(Boolean);
console.log(
  `\nVERIFY ${ok ? 'OK' : 'FAILED'} commitsPresent=${allPresent} allMine=${allMine} missing=${missing} nonemptyErr=${nonEmptyErr} blobChecks=${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`
);
process.exit(ok ? 0 : 1);
