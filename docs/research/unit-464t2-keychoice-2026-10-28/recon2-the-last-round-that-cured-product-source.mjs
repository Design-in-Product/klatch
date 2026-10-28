#!/usr/bin/env node
// recon2-the-last-round-that-cured-product-source.mjs — Unit 464-T2-keychoice, 2026-10-28, Daedalus
//
// `grade-the-surface-predicate.mjs` answers the question inside the 15-day window the
// stop condition was filed with. This recon asks the same question with the window
// widened, because the 15-day answer ("the last product-source credit is round 417, via a
// commit whose subject is not round work") invites an obvious objection: the window may
// simply have cut off the product-curing rounds.
//
// It did not, and the regime change is datable. Measured here rather than asserted.
//
// The figure the condition's own sentence actually wants is the last round whose OWN
// commit (subject names the round) cured a file under `packages/` that is NOT a
// `__tests__/` round-track test — i.e. the last round that cured product source. The
// `consecutive` run is then the number of round directories above it.
//
// GATE: a window that selects no product-source commit at all, or an empty round-dir
// list, is a RED — not a quiet `last=NONE`. A dead population must not read as a finding.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const SEP = '\u001f';
const N_PROPOSED = 5;
// Absolute, and deliberately wide: 120 days reaches well before the dense product-curing
// stretch, so "the window cut it off" is answerable rather than arguable.
const WINDOWS = ['2026-10-13 00:00:00', '2026-09-13 00:00:00', '2026-07-01 00:00:00'];

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const REV = git(['rev-parse', 'HEAD']).trim();
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;
const isProductSource = (f) => /^packages\//.test(f) && !/(^|\/)__tests__\//.test(f);

const roundDirs = readdirSync(`${REPO}/docs/research`)
  .map((d) => /^round(\d+)-instruments$/.exec(d))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .sort((a, b) => a - b);

console.log('=== RECON2/464-T2-keychoice — the last ROUND that cured product source ===');
console.log(`REV ${REV}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(`roundDirs=${roundDirs.length} highest=${roundDirs.length ? Math.max(...roundDirs) : 'NONE'}`);
console.log(`N_PROPOSED=${N_PROPOSED}`);
console.log(
  '\nproduct source := under packages/ and NOT under a __tests__/ directory ' +
    '(3 of the 4 packages/ files touched in the 15-day window are roundNNN-*.test.ts, ' +
    'which are the round track\'s own instruments living in the product tree)'
);

let gateOk = roundDirs.length > 0;
const summary = [];

for (const since of WINDOWS) {
  const raw = git(['log', `--since=${since}`, '--name-only', `--format=%x00%H${SEP}%an${SEP}%cI${SEP}%s`]);
  const rows = [];
  for (const rec of raw.split('\u0000')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const [hash, author, date, ...subj] = lines[0].split(SEP);
    if (!hash) continue;
    const files = lines.slice(1).filter((l) => l.trim().length > 0);
    const ps = files.filter(isProductSource);
    if (!ps.length) continue;
    const sm = SUBJECT_ROUND_RE.exec(subj.join(SEP));
    rows.push({
      hash,
      author,
      date,
      subject: subj.join(SEP),
      productSource: ps,
      subjectRound: sm ? Number(sm[1]) : null,
    });
  }
  const labelled = rows.filter((r) => r.subjectRound !== null);
  const lastRound = labelled.length ? Math.max(...labelled.map((r) => r.subjectRound)) : null;
  const consecutive = lastRound === null ? null : roundDirs.filter((r) => r > lastRound).length;
  if (rows.length === 0) gateOk = false;

  console.log(`\n--- --since=${JSON.stringify(since)}`);
  console.log(`  commits touching product source      : ${rows.length}`);
  console.log(`  of those, carrying a round label     : ${labelled.length}`);
  console.log(`  last ROUND that cured product source : ${lastRound ?? 'NONE'}`);
  console.log(`  round dirs above it (consecutive)    : ${consecutive ?? 'UNMEASURED'}`);
  console.log(
    `  fired at N=${N_PROPOSED}                         : ${consecutive === null ? 'UNMEASURED' : consecutive >= N_PROPOSED}`
  );
  if (labelled.length) {
    const top = labelled.sort((a, b) => b.subjectRound - a.subjectRound)[0];
    console.log(`  that round's commit                  : ${top.hash.slice(0, 8)} ${top.author} ${top.date.slice(0, 16)}`);
    console.log(`    subject: ${top.subject.slice(0, 100)}`);
    console.log(`    files  : ${top.productSource.join(' ')}`);
  }
  // The most recent product-source commit of ANY kind, round-labelled or not — so
  // "no round cured product source" is not confused with "nobody did".
  const newest = rows.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (newest) {
    console.log(`  newest product-source commit of ANY kind: ${newest.hash.slice(0, 8)} ${newest.author} ${newest.date.slice(0, 16)}`);
    console.log(`    subject: ${newest.subject.slice(0, 100)}`);
  }
  summary.push({ since, commits: rows.length, lastRound, consecutive });
}

console.log('\nSUMMARY (window → last round that cured product source → consecutive since):');
for (const s of summary) {
  console.log(`  ${s.since}  commits=${String(s.commits).padStart(3)}  lastRound=${s.lastRound ?? 'NONE'}  consecutive=${s.consecutive ?? 'UNMEASURED'}`);
}

// REPAIR, same fire (drive4 → drive5). The first version of this predicate conflated two
// different things and published `widenedAgree=false` for the wrong reason: the narrow
// window's `lastRound` is `null` (no round-labelled product-source commit exists in it at
// all), and `lasts.length === summary.length` folded that null in as a DISAGREEMENT. The
// claim said "the two wider windows"; the predicate read all three. A sentence keyed on
// the cell's name rather than on the measurement beside it.
//
// Split in two, because they are two facts and one of them is the finding:
//   (a) the windows that CAN answer agree with each other — this is the artifact check;
//   (b) the narrow window cannot answer — reported, not folded into (a).
const answering = summary.filter((s) => s.lastRound !== null);
const silent = summary.filter((s) => s.lastRound === null);
const widenedAgree =
  answering.length >= 2 ? new Set(answering.map((s) => s.lastRound)).size === 1 : null;

console.log(
  `\nWIDENED-WINDOW AGREEMENT: every window that reports a last product-source round reports the SAME one: ${widenedAgree}` +
    ` (${summary.map((s) => `${s.since.slice(0, 10)}→${s.lastRound ?? 'NONE'}`).join(', ')})`
);
console.log(
  `WINDOWS THAT CANNOT ANSWER: ${silent.length} (${silent.map((s) => s.since.slice(0, 10)).join(', ') || 'none'})` +
    (silent.length
      ? ' — a window with no round-labelled product-source commit cannot report a last round. This is not a' +
        ' disagreement with the wider windows; it is the condition failing to be answerable inside the very' +
        ' window it was filed with.'
      : '')
);
console.log(`GATE roundDirs>0 and every window selected at least one product-source commit of ANY kind: ${gateOk}`);

// `consecutive` counts round DIRECTORIES above the last credited round, which is also how
// the stop condition and Theseus's cell compute it. Named as a floor rather than left to
// read as a round count: `roundNNN-instruments/` dirs only exist from round 293 onward, so
// for a last-round of 292 the figure saturates at the whole dir population.
const highest = roundDirs.length ? Math.max(...roundDirs) : null;
const lowest = roundDirs.length ? Math.min(...roundDirs) : null;
for (const s of answering) {
  const byNumber = highest === null ? null : highest - s.lastRound;
  console.log(
    `FLOOR NOTE window ${s.since.slice(0, 10)}: consecutive=${s.consecutive} counts round DIRECTORIES above ${s.lastRound};` +
      ` dirs span ${lowest}..${highest}, so by round NUMBER the run is ${byNumber} and the directory figure is a FLOOR` +
      (s.consecutive === roundDirs.length ? ' — and here it has saturated at the entire dir population' : '')
  );
}

const ok = gateOk && widenedAgree === true;
console.log(
  `\nVERDICT/${ok ? 0 : 1} ${ok ? 'ok' : 'RED'} gate=${gateOk} widenedAgree=${widenedAgree} windowsSilent=${silent.length}`
);
process.exit(ok ? 0 : 1);
