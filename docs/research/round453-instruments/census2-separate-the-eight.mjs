// Round 453 — census pass 2.
//
// Pass 1 found 8 of 52 at-risk instruments exiting non-zero. "Non-zero" is not "killed": three
// states hide in that 8 and only one of them is Daedalus's class.
//
//   TIMEOUT      — exceeded this sweep's own 60 s budget. An artifact of MY instrument, not a
//                  defect in the subject. Must not be counted as dead.
//   RED-VERDICT  — exited 1 having PUBLISHED a verdict with red legs. That is an instrument
//                  working exactly as designed. Counting it as dead would manufacture findings.
//   KILLED       — threw before publishing anything, with the throw site inside a shared module.
//                  This is the 446 shape.
//
// So this pass re-drives the 8 one at a time with a longer budget, captures stdout and stderr
// separately, and reads the verdict line with the lib's OWN reader rather than a regex of mine.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVerdict } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');

// The 8 non-zero exits from drive1.census1.out, named here as a declared set so a subject that
// stops being in the population fails by its own name rather than by silently shrinking the list.
const EIGHT = [
  'docs/research/round406-instruments/hand-read-the-inline-seven.mjs',
  'docs/research/round412-instruments/resolve-the-ternary-and-reconstruct-the-nine.mjs',
  'docs/research/round431-instruments/grade-his-convention-and-measure-the-reach.mjs',
  'docs/research/round448-instruments/record-cripples.mjs',
  'docs/research/round449-instruments/grade-the-cripples.mjs',
  'docs/research/round449-instruments/postcommit-rediff.mjs',
  'docs/research/round449-instruments/record-drives.mjs',
  'docs/research/round449-instruments/resolve-the-variable-write-targets.mjs',
];

const BUDGET_MS = 180_000;

const git = (args) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const snapshot = () => git(['status', '--porcelain']).trim();

console.log(`rev ${git(['rev-parse', 'HEAD']).trim().slice(0, 8)} · budget ${BUDGET_MS / 1000}s each`);

const rows = [];
for (const path of EIGHT) {
  const before = snapshot();
  let exit = 0;
  let stdout = '';
  let stderr = '';
  let timedOut = false;
  try {
    stdout = execFileSync('node', [path], {
      cwd: REPO,
      encoding: 'utf8',
      timeout: BUDGET_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    exit = e.status ?? -1;
    stdout = String(e.stdout ?? '');
    stderr = String(e.stderr ?? '');
    timedOut = e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT';
  }
  const dirty = snapshot() !== before;

  // the lib's own reader, not a regex of mine
  const v = readVerdict(stdout);

  // throw site = FIRST project frame, read off the real stack
  const frames = [];
  for (const line of stderr.split('\n')) {
    const m = line.match(/\(?(\/[^\s():]+\.(?:mjs|mts|js|ts)):(\d+):(\d+)\)?\s*$/);
    if (m && !m[1].includes('/node_modules/')) frames.push(m[1].replace(`${REPO}/`, ''));
  }
  const site = frames.length === 0 ? null
    : /^docs\/research\/lib\//.test(frames[0]) ? 'research-lib'
    : /^scripts\//.test(frames[0]) ? 'scripts-lib'
    : /^docs\/research\/round\d+-instruments\//.test(frames[0]) ? 'round-dir'
    : 'elsewhere';

  // the three-way separation, positively keyed — no fall-through bucket
  let state;
  if (timedOut) state = 'TIMEOUT';
  else if (v.ok) state = 'RED-VERDICT';
  else if (site !== null) state = 'KILLED';
  else state = 'DEAD-NO-STACK';

  rows.push({ path, exit, timedOut, dirty, state, site, frames: frames.slice(0, 2), v, stderr, stdout });
}

console.log('\n--- the eight, separated ---');
for (const r of rows) {
  const vline = r.v.ok
    ? `${r.v.verdict.token} legs=${r.v.verdict.legs} red=[${r.v.verdict.red}]`
    : `no readable verdict (${r.v.refusal})`;
  console.log(`${r.state.padEnd(14)} exit=${String(r.exit).padEnd(3)} site=${String(r.site).padEnd(13)} ${r.path.replace('docs/research/', '')}`);
  console.log(`               ${vline}${r.dirty ? ' · DIRTIED A TRACKED FILE' : ''}`);
}

const tally = {};
for (const r of rows) tally[r.state] = (tally[r.state] || 0) + 1;
console.log(`\nstates: ${JSON.stringify(tally)}  sum=${rows.length} === declared ${EIGHT.length}: ${rows.length === EIGHT.length}`);

console.log('\n--- the KILLED ones, in full ---');
for (const r of rows.filter((x) => x.state === 'KILLED')) {
  console.log(`\n### ${r.path}`);
  console.log(`exit=${r.exit} · verdict: ${r.v.ok ? 'published' : r.v.refusal} · published ${r.stdout.split('\n').filter(Boolean).length} stdout lines`);
  console.log(r.stderr.split('\n').slice(0, 14).join('\n'));
}

console.log('\n--- the DEAD-NO-STACK ones (exit 1, nothing on stderr) ---');
for (const r of rows.filter((x) => x.state === 'DEAD-NO-STACK')) {
  console.log(`\n### ${r.path}  exit=${r.exit}`);
  console.log(`stderr (${r.stderr.length} chars): ${JSON.stringify(r.stderr.slice(0, 300))}`);
  console.log(`stdout tail:`);
  console.log(r.stdout.split('\n').filter(Boolean).slice(-6).join('\n'));
}
