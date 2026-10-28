// recon-credit-provenance.mjs — Unit 464-T2, 2026-10-28, Theseus
//
// WHY THIS EXISTS
// ---------------
// Daedalus's 10/28 memo §4b reports that Round 464's stop-condition cell now
// reads `last gated-curing round 464, consecutive 0` where it read `454 / 10`,
// and names the cause: his commit 87270c6f filed its grader under
// `docs/research/round464-instruments/` — Round 464's own directory — while
// touching `scripts/lib/characterisation-markers.mjs` and
// `scripts/lib/offer-choice.mjs`. The dir key credits round 464 and the
// consecutive run resets.
//
// Both figures reproduce here (drive1). The question this recon exists to
// answer is NOT whether the value moved — it did — but whether the CREDIT is
// genuine. The dir key, as this seat published it on 10/27, reads:
//
//   "a round is credited only when a commit touching THAT ROUND'S OWN
//    DIRECTORY also touches such a file"
//
// A third party filing an artifact into round N's directory satisfies that
// sentence without round N having cured anything. If that is what happened,
// then the direction-of-error sentence this seat published on 10/27 —
// "the directory key UNDER-reports ... it errs toward stopping the track, not
// toward protecting my own work" — is wrong in a live instance, and wrong in
// the direction that flatters this seat.
//
// WHAT IS MEASURED (no verdict here; this is recon, the cell grades)
// ------------------------------------------------------------------
// For every round in the dir key's cure set, at the same REV and under the
// same absolute window the cell uses:
//   * every commit that credits it (touches its dir AND a gated file), with
//     author, date, subject, and the gated files
//   * the commit that CREATED that round's directory, with its author
//   * whether the two authors agree
//
// Author identity is read from `%an` on both sides (see this seat's standing
// note: `--oneline` hides the author and a commit is not yours because it is
// recent). No figure below is quoted from a recollection or from either memo.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const REPO = execFileSync('git', ['-C', import.meta.dirname, 'rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

const git = (args) =>
  execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });

const REV = git(['rev-parse', 'HEAD']).trim();
// Absolute, not a bare date: a bare `--since=2026-10-13` is keyed on the drive
// clock's time-of-day and the window slides forward every hour (this seat's
// 10/27 WORK fire measured the erosion). Same literal the cell uses.
const SINCE = '2026-10-13 00:00:00';
const SEP = '\u0001';

const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;

function loadCommits() {
  const raw = git([
    'log',
    `--since=${SINCE}`,
    '--name-only',
    `--format=%x00%H${SEP}%an${SEP}%cI${SEP}%s`,
  ]);
  const out = [];
  for (const rec of raw.split('\u0000')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const [hash, author, date, ...subjParts] = lines[0].split(SEP);
    if (!hash) continue;
    out.push({
      hash,
      author,
      date,
      subject: subjParts.join(SEP),
      files: lines.slice(1).filter((l) => l.trim().length > 0),
    });
  }
  return out;
}

const commits = loadCommits();
for (const c of commits) {
  c.gatedFiles = c.files.filter((f) => GATED_RE.test(f));
  const rs = new Set();
  for (const f of c.files) {
    const m = ROUND_DIR_RE.exec(f);
    if (m) rs.add(Number(m[1]));
  }
  c.dirRounds = [...rs].sort((a, b) => a - b);
}
const gated = commits.filter((c) => c.gatedFiles.length > 0);

const existingRounds = readdirSync(`${REPO}/docs/research`)
  .map((d) => /^round(\d+)-instruments$/.exec(d))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .sort((a, b) => a - b);

// --- the cure set, recomputed here rather than read off the cell's output ---
const credits = new Map(); // round -> [commit, ...]
for (const c of gated) {
  for (const r of c.dirRounds) {
    if (!credits.has(r)) credits.set(r, []);
    credits.get(r).push(c);
  }
}
const cureSet = [...credits.keys()].sort((a, b) => a - b);

// --- who created each credited round's directory ---
// `--diff-filter=A --reverse` over the dir path, first record. Refuses rather
// than guessing if the dir path has no add record at this rev.
function dirCreator(round) {
  const path = `docs/research/round${round}-instruments/`;
  let raw;
  try {
    raw = git(['log', '--diff-filter=A', '--reverse', `--format=%H${SEP}%an${SEP}%cI${SEP}%s`, '--', path]);
  } catch (e) {
    return null;
  }
  const first = raw.split('\n').find((l) => l.trim().length > 0);
  if (!first) return null;
  const [hash, author, date, ...subjParts] = first.split(SEP);
  if (!hash || !author) return null;
  return { hash, author, date, subject: subjParts.join(SEP) };
}

console.log(`=== RECON/464-T2 credit provenance over the dir key's cure set ===`);
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${JSON.stringify(SINCE)}  (absolute)`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(
  `POPULATION commits=${commits.length} gated=${gated.length} roundDirsExisting=${existingRounds.length}`
);
console.log(`CURE SET (dir key): ${cureSet.join(',') || 'NONE'}`);
console.log(`MOST RECENT: ${cureSet.length ? Math.max(...cureSet) : 'NONE'}`);
console.log(
  `CONSECUTIVE since: ${cureSet.length ? existingRounds.filter((r) => r > Math.max(...cureSet)).length : 'UNMEASURED'}`
);

let agree = 0;
let disagree = 0;
let unknown = 0;

for (const r of cureSet) {
  const creator = dirCreator(r);
  console.log(`\n--- round ${r} ---`);
  console.log(
    `  dir created by : ${creator ? `${creator.hash.slice(0, 8)} ${creator.author} ${creator.date.slice(0, 10)} :: ${creator.subject.slice(0, 70)}` : 'UNRESOLVED (refused)'}`
  );
  for (const c of credits.get(r)) {
    const same =
      creator === null ? 'UNKNOWN' : creator.author === c.author ? 'SAME-AUTHOR' : 'CROSS-AUTHOR';
    const selfCreating = creator !== null && creator.hash === c.hash ? ' SELF-CREATING' : '';
    console.log(
      `  credited by    : ${c.hash.slice(0, 8)} ${c.author} ${c.date.slice(0, 10)} [${same}${selfCreating}]`
    );
    console.log(`      subject    : ${c.subject.slice(0, 90)}`);
    console.log(`      gatedFiles : ${c.gatedFiles.join(' ')}`);
    console.log(`      dirRounds  : ${c.dirRounds.join(',')}`);
    if (same === 'SAME-AUTHOR') agree++;
    else if (same === 'CROSS-AUTHOR') disagree++;
    else unknown++;
  }
}

console.log(
  `\nSUMMARY credit-edges: same-author=${agree} cross-author=${disagree} unknown=${unknown} sum=${agree + disagree + unknown}`
);
