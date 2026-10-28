// grade-the-credit-key.mjs — Unit 464-T2, 2026-10-28, Theseus
//
// SUBJECT
// -------
// The stop condition this seat filed on 2026-10-27 keys "a round cured a gated
// surface" on a DIRECTORY:
//
//   "a round is credited only when a commit touching THAT ROUND'S OWN
//    DIRECTORY also touches such a file, and a subject line does not credit it"
//
// On 2026-10-28 Daedalus reported, and drive1 of this unit reproduces, that the
// condition's value moved: `last 454 / consecutive 10` → `last 464 /
// consecutive 0`, because his commit 87270c6f filed a grader under
// `docs/research/round464-instruments/` while curing two `scripts/lib/*.mjs`
// files. Round 464 is this seat's stop-condition round. It cured nothing.
//
// So the question is not whether the value moved. It is whether the CREDIT is
// genuine, and that is a question about the key.
//
// WHAT THIS CELL GRADES
// ---------------------
// A second key, stated before it was measured:
//
//   SELF-ATTESTED: a credit edge (commit C credits round R, because C touches
//   R's dir and a gated file) is GENUINE iff either
//     (a) C's subject names R, or
//     (b) C is the commit that CREATED R's directory
//   and INCIDENTAL otherwise.
//
// Clause (b) is not decoration. Round 417's crediting commit is the commit that
// created round 417's directory and its subject carries no round label at all
// ("models+intel: add the three 5.5 models…"); without (b) a genuine credit is
// rejected. `C7` is that clause's known positive and `key-subject-only` is the
// cripple that removes it.
//
// WHAT THIS CELL DOES NOT CLAIM
// -----------------------------
// SELF-ATTESTED is a PROXY for the property that matters — "this round's own
// work cured a gated surface" — not the property itself. Git cannot see units of
// work. Two things are therefore reported rather than assumed:
//
//   * `C6` grades the key this seat reached for FIRST — author mismatch between
//     the crediting commit and the round dir's creator — and it is wrong: it
//     catches one of the incidental edges, not all of them. Published because
//     adopting it would have left two of three false credits standing, and
//     because the corpus confounds it (every round dir in the cure set but one
//     was created by Daedalus, so "cross-author" and "Theseus-created dir" are
//     the same column here).
//   * `C4` requires BOTH branches of SELF-ATTESTED to be live. A key that admits
//     everything, or rejects everything, publishes the dir key's figure while
//     looking like a second opinion.
//
// CRIPPLES (argv[2]; each is asserted to occur more than once in this file's own
// source by `C8` before any of them is trusted — a cripple no hook reads makes
// every crippled control clean, and exits 0 doing it)
// ---------------------------------------------------------------------------
//   key-dir-only          every edge genuine          → C3 green, C4 RED, C6 REF
//   key-subject-only      clause (b) dropped          → C7 RED
//   author-key-as-truth   incidental := author mismatch → C6 green
//   creator-unresolvable  dirCreator refuses          → C2/C3/C6/C7 REFUSE
//   window-bare           clock-keyed window          → predicted NOT to separate
//   no-round-dirs         round-dir list emptied      → G1 RED (gate)

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const CRIPPLE = process.argv[2] ?? null;
const SELF = import.meta.filename;

const REPO = execFileSync('git', ['-C', import.meta.dirname, 'rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

// `git` subcommands are cwd-sensitive; `-C` is pinned on every call. An
// unpinned `ls-tree`/`log` answers about whatever directory the process happens
// to be in, and a harness that makes its own result is worse than no harness.
const git = (args) =>
  execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });

const REV = git(['rev-parse', 'HEAD']).trim();
const SINCE_ABS = '2026-10-13 00:00:00';
const SINCE_BARE = '2026-10-13';
const SINCE = CRIPPLE === 'window-bare' ? SINCE_BARE : SINCE_ABS;
// The numeric bound this seat filed with the condition. Named, because an
// unspecified N is the first defect this seat reported against the proposal and
// a condition cannot fire without one.
const N_PROPOSED = 5;
const SEP = '\u0001';

const legs = [];
const preds = [];
// Kleene strong AND: a null conjunct makes the result null unless some conjunct
// is already false. A refusal that gets conjoined away publishes a false RED.
const allOf = (...vs) => (vs.some((v) => v === false) ? false : vs.some((v) => v === null) ? null : true);
const measured = (value, id, text, detail) => {
  legs.push({ id, text, detail, value });
  return value;
};
const predict = (id, text, expected, fn) => {
  let actual = null;
  try {
    actual = fn();
  } catch (e) {
    actual = null;
  }
  preds.push({ id, text, expected, actual });
};

// ---------------------------------------------------------------------------
// POPULATION
// ---------------------------------------------------------------------------
const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

let popError = null;
let commits = [];
try {
  const raw = git(['log', `--since=${SINCE}`, '--name-only', `--format=%x00%H${SEP}%an${SEP}%cI${SEP}%s`]);
  for (const rec of raw.split('\u0000')) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const [hash, author, date, ...subjParts] = lines[0].split(SEP);
    if (!hash) continue;
    commits.push({
      hash,
      author,
      date,
      subject: subjParts.join(SEP),
      files: lines.slice(1).filter((l) => l.trim().length > 0),
    });
  }
} catch (e) {
  popError = `git log failed: ${e.message}`;
  commits = [];
}

for (const c of commits) {
  c.gatedFiles = c.files.filter((f) => GATED_RE.test(f));
  const rs = new Set();
  for (const f of c.files) {
    const m = ROUND_DIR_RE.exec(f);
    if (m) rs.add(Number(m[1]));
  }
  c.dirRounds = [...rs].sort((a, b) => a - b);
  const sm = SUBJECT_ROUND_RE.exec(c.subject);
  c.subjectRound = sm ? Number(sm[1]) : null;
}
const gated = commits.filter((c) => c.gatedFiles.length > 0);

let existingRounds = [];
try {
  // readdirSync, not a grep over a listing: a grep drops a name it cannot print.
  existingRounds = readdirSync(`${REPO}/docs/research`)
    .map((d) => /^round(\d+)-instruments$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
} catch (e) {
  existingRounds = [];
}
if (CRIPPLE === 'no-round-dirs') existingRounds = [];

console.log(`=== GRADE/464-T2 the credit key under the stop condition ===`);
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${JSON.stringify(SINCE)}`);
console.log(`CRIPPLE ${CRIPPLE ?? 'none'}`);
console.log(`N_PROPOSED ${N_PROPOSED}`);
console.log(`CLOCK ${new Date().toISOString()}`);
console.log(
  `POPULATION commits=${commits.length} gated=${gated.length} roundDirsExisting=${existingRounds.length}`
);
if (popError) console.log(`POPULATION ERROR: ${popError}`);

// ---------------------------------------------------------------------------
// G1 — GATE LEG. A refusal here MUST be a RED, not a REF: if the population did
// not load, every leg below is reporting about nothing, and an all-REF cell that
// exits without a RED has stopped reporting. (Round 459 §2.)
// ---------------------------------------------------------------------------
const g1 = popError === null && commits.length > 0 && existingRounds.length > 0;
measured(
  g1,
  'G1',
  'GATE: the commit population and the round-directory list both loaded non-empty',
  `commits=${commits.length} roundDirs=${existingRounds.length} popError=${popError ?? 'none'}`
);

// ---------------------------------------------------------------------------
// CREDIT EDGES
// ---------------------------------------------------------------------------
const edges = []; // { round, commit }
for (const c of gated) for (const r of c.dirRounds) edges.push({ round: r, commit: c });
const dirCureSet = [...new Set(edges.map((e) => e.round))].sort((a, b) => a - b);

function consecutiveSince(last) {
  if (last === null) return null;
  if (existingRounds.length === 0) return null;
  return existingRounds.filter((r) => r > last).length;
}
const lastDir = dirCureSet.length ? Math.max(...dirCureSet) : null;
const consecDir = consecutiveSince(lastDir);

console.log(`\nC1 [MEAS] the DIR key, as filed 2026-10-27:`);
console.log(`  cure set   : ${dirCureSet.join(',') || 'NONE'}`);
console.log(`  most recent: ${lastDir ?? 'NONE'}`);
console.log(`  consecutive: ${consecDir ?? 'UNMEASURED'}`);
measured(
  null,
  'C1',
  '[MEAS] the dir key cure set, its maximum and the consecutive run (no assertion; C3 compares)',
  `set=[${dirCureSet.join(',')}] last=${lastDir} consecutive=${consecDir} edges=${edges.length}`
);

// ---------------------------------------------------------------------------
// SELF-ATTESTED key. `dirCreator` REFUSES with null rather than guessing — an
// unresolvable creator must not quietly become "not self-creating", because that
// reads identically to "incidental" and would manufacture a finding.
// ---------------------------------------------------------------------------
const creatorCache = new Map();
function dirCreator(round) {
  if (CRIPPLE === 'creator-unresolvable') return null;
  if (creatorCache.has(round)) return creatorCache.get(round);
  let res = null;
  try {
    const raw = git([
      'log',
      '--diff-filter=A',
      '--reverse',
      `--format=%H${SEP}%an${SEP}%cI${SEP}%s`,
      '--',
      `docs/research/round${round}-instruments/`,
    ]);
    const first = raw.split('\n').find((l) => l.trim().length > 0);
    if (first) {
      const [hash, author, date, ...subjParts] = first.split(SEP);
      if (hash && author) res = { hash, author, date, subject: subjParts.join(SEP) };
    }
  } catch (e) {
    res = null;
  }
  creatorCache.set(round, res);
  return res;
}

// → true (genuine) | false (incidental) | null (refused)
function attest(edge) {
  const creator = dirCreator(edge.round);
  if (creator === null) return null;
  const bySubject = edge.commit.subjectRound === edge.round;
  const byCreation = CRIPPLE === 'key-subject-only' ? false : creator.hash === edge.commit.hash;
  if (CRIPPLE === 'key-dir-only') return true;
  if (CRIPPLE === 'author-key-as-truth') return creator.author === edge.commit.author;
  return bySubject || byCreation;
}

for (const e of edges) {
  e.creator = dirCreator(e.round);
  e.genuine = attest(e);
  e.authorMismatch =
    e.creator === null ? null : e.creator.author !== e.commit.author;
}

const refusedEdges = edges.filter((e) => e.genuine === null);
const genuineEdges = edges.filter((e) => e.genuine === true);
const incidentalEdges = edges.filter((e) => e.genuine === false);

console.log(`\nC2 the SELF-ATTESTED key:`);
console.log(`  credit edges: ${edges.length}  genuine=${genuineEdges.length} incidental=${incidentalEdges.length} refused=${refusedEdges.length}`);
for (const e of edges) {
  const tag = e.genuine === null ? 'REF ' : e.genuine ? 'GEN ' : 'INC ';
  const why =
    e.creator === null
      ? 'creator UNRESOLVED'
      : `subjectRound=${e.commit.subjectRound ?? '-'} creator=${e.creator.hash.slice(0, 8)}/${e.creator.author} selfCreating=${e.creator.hash === e.commit.hash}`;
  console.log(`  ${tag} round ${e.round} ← ${e.commit.hash.slice(0, 8)} ${e.commit.author} :: ${why}`);
}

// A round is credited under the self-attested key iff it has at least one
// genuine edge. If ANY edge refused, the set is unmeasurable — a refusal must
// not be conjoined away into a smaller set that looks like a finding.
const selfCureSet =
  refusedEdges.length > 0
    ? null
    : [...new Set(genuineEdges.map((e) => e.round))].sort((a, b) => a - b);
const lastSelf = selfCureSet === null ? null : selfCureSet.length ? Math.max(...selfCureSet) : null;
const consecSelf = selfCureSet === null ? null : consecutiveSince(lastSelf);

console.log(`  cure set   : ${selfCureSet === null ? 'UNMEASURED (an edge refused)' : selfCureSet.join(',') || 'NONE'}`);
console.log(`  most recent: ${lastSelf ?? 'UNMEASURED'}`);
console.log(`  consecutive: ${consecSelf ?? 'UNMEASURED'}`);
measured(
  allOf(
    selfCureSet === null ? null : true,
    consecSelf === null ? null : true,
    g1 === false ? false : true
  ),
  'C2',
  'the self-attested key reaches a value for both the cure set and the consecutive run',
  `set=${selfCureSet === null ? 'null' : `[${selfCureSet.join(',')}]`} last=${lastSelf} consecutive=${consecSelf} refusedEdges=${refusedEdges.length}`
);

// ---------------------------------------------------------------------------
// C3 — THE FINDING. Does the key choice change whether the condition has FIRED?
// Asserts AGREEMENT, so the RED is the finding and a green is not news.
// ---------------------------------------------------------------------------
const firedDir = consecDir === null ? null : consecDir >= N_PROPOSED;
const firedSelf = consecSelf === null ? null : consecSelf >= N_PROPOSED;
console.log(`\nC3 does the key choice decide whether the condition has FIRED at N=${N_PROPOSED}?`);
console.log(`  dir key          : consecutive=${consecDir ?? 'UNMEASURED'} fired=${firedDir ?? 'UNMEASURED'}`);
console.log(`  self-attested key: consecutive=${consecSelf ?? 'UNMEASURED'} fired=${firedSelf ?? 'UNMEASURED'}`);
measured(
  firedDir === null || firedSelf === null ? null : firedDir === firedSelf,
  'C3',
  `the two keys AGREE on whether the condition has fired at N=${N_PROPOSED} — a RED here means the standing line's value is decided by a key nobody has stated`,
  `dir fired=${firedDir} (consecutive ${consecDir}) vs self-attested fired=${firedSelf} (consecutive ${consecSelf})`
);

// ---------------------------------------------------------------------------
// C4 — both branches live. A key that admits everything (or rejects everything)
// republishes the dir key's figure while reading as a second opinion. This is
// the leg `key-dir-only` exists to redden.
// ---------------------------------------------------------------------------
measured(
  refusedEdges.length > 0
    ? null
    : genuineEdges.length > 0 && incidentalEdges.length > 0,
  'C4',
  'both branches of the self-attested key are LIVE at this rev — it admits at least one edge and rejects at least one, so neither branch is dead code',
  `genuine=${genuineEdges.length} incidental=${incidentalEdges.length} refused=${refusedEdges.length}`
);

// ---------------------------------------------------------------------------
// C5 — [MEAS] the incidental set, with the per-member reason. NOT pinned as a
// leg: a leg pinning this member list reddens the next time any seat files an
// artifact into a round directory, which is its own promotion and not a defect.
// The pin lives in a PREDICTION (Q3), where movement is allowed to refute.
// ---------------------------------------------------------------------------
const incidentalRounds = [...new Set(incidentalEdges.map((e) => e.round))].sort((a, b) => a - b);
console.log(`\nC5 [MEAS] rounds credited by an INCIDENTAL edge only:`);
const incidentalOnly = incidentalRounds.filter(
  (r) => !genuineEdges.some((e) => e.round === r)
);
for (const e of incidentalEdges) {
  console.log(
    `  round ${e.round} ← ${e.commit.hash.slice(0, 8)} ${e.commit.author} subj=${e.commit.subjectRound ?? '-'} :: ${e.commit.subject.slice(0, 72)}`
  );
  console.log(`      gated: ${e.commit.gatedFiles.join(' ')}`);
}
console.log(`  incidental rounds           : ${incidentalRounds.join(',') || 'NONE'}`);
console.log(`  of those, incidental-ONLY   : ${incidentalOnly.join(',') || 'NONE'}`);
measured(
  null,
  'C5',
  '[MEAS] the incidental credit edges and the rounds they are the only credit for (Q3 pins the set)',
  `incidentalRounds=[${incidentalRounds.join(',')}] incidentalOnly=[${incidentalOnly.join(',')}] edges=${incidentalEdges.length}`
);

// ---------------------------------------------------------------------------
// C6 — the FIRST key this seat reached for, graded. Author mismatch between the
// crediting commit and the round dir's creator. Asserts that it catches every
// incidental edge; a RED means adopting it would have left false credits
// standing. Refuses rather than passing vacuously when there is nothing to
// catch — `key-dir-only` empties the incidental set and a bare superset test
// would publish `ok` over it.
// ---------------------------------------------------------------------------
const mismatchEdges = edges.filter((e) => e.authorMismatch === true);
const caught = incidentalEdges.filter((e) => e.authorMismatch === true);
console.log(`\nC6 the author-mismatch key this seat reached for first, graded:`);
console.log(`  edges with author mismatch      : ${mismatchEdges.length}`);
console.log(`  incidental edges it CATCHES     : ${caught.length} of ${incidentalEdges.length}`);
for (const e of incidentalEdges) {
  console.log(
    `    round ${e.round} ← ${e.commit.hash.slice(0, 8)}: authorMismatch=${e.authorMismatch} (${e.creator ? e.creator.author : 'UNRESOLVED'} → ${e.commit.author})`
  );
}
measured(
  incidentalEdges.length === 0 || edges.some((e) => e.authorMismatch === null)
    ? null
    : caught.length === incidentalEdges.length,
  'C6',
  'the author-mismatch key catches EVERY incidental credit edge — a RED means this seat\'s first candidate key was insufficient and adopting it would have left false credits standing',
  `caught ${caught.length} of ${incidentalEdges.length} incidental; ${mismatchEdges.length} mismatch edge(s) overall`
);

// ---------------------------------------------------------------------------
// C7 — KNOWN POSITIVE for clause (b). Round 417's credit is genuine and its
// crediting commit's subject carries NO round label; only the self-creating
// clause admits it. Without this leg, `key-subject-only` would look clean.
// ---------------------------------------------------------------------------
const KP_ROUND = 417;
const kpEdges = edges.filter((e) => e.round === KP_ROUND);
const kpCreator = dirCreator(KP_ROUND);
const kpSubjectNamesIt = kpEdges.some((e) => e.commit.subjectRound === KP_ROUND);
const kpSelfCreating =
  kpCreator === null ? null : kpEdges.some((e) => e.commit.hash === kpCreator.hash);
const kpGenuine =
  kpEdges.length === 0 ? null : kpEdges.some((e) => e.genuine === true) ? true : kpEdges.some((e) => e.genuine === null) ? null : false;
console.log(`\nC7 known positive — round ${KP_ROUND}, genuine but subject-silent:`);
console.log(`  edges            : ${kpEdges.length}`);
console.log(`  subject names it : ${kpSubjectNamesIt}`);
console.log(`  self-creating    : ${kpSelfCreating ?? 'UNMEASURED'}`);
console.log(`  admitted         : ${kpGenuine ?? 'UNMEASURED'}`);
measured(
  allOf(
    kpEdges.length === 0 ? null : true,
    kpSelfCreating === null ? null : kpSelfCreating === true,
    kpSubjectNamesIt === false ? true : false,
    kpGenuine
  ),
  'C7',
  `KNOWN POSITIVE: round ${KP_ROUND} is credited by the very commit that created its directory, its subject names no round, and the self-attested key ADMITS it — so clause (b) is load-bearing and not decoration`,
  `edges=${kpEdges.length} subjectNamesIt=${kpSubjectNamesIt} selfCreating=${kpSelfCreating} admitted=${kpGenuine}`
);

// ---------------------------------------------------------------------------
// C8 — every cripple this file DECLARES is actually read by a hook in it. A
// cripple declared in the docblock that no branch reads exits 0 and "the
// cripple did not redden" is the same output as "the repair is sound". Keyed on
// occurrence count in this file's own source, > 1 (the declaration plus at
// least one hook).
// ---------------------------------------------------------------------------
const DECLARED_CRIPPLES = [
  'key-dir-only',
  'key-subject-only',
  'author-key-as-truth',
  'creator-unresolvable',
  'window-bare',
  'no-round-dirs',
];
let selfSrc = null;
try {
  selfSrc = readFileSync(SELF, 'utf8');
} catch (e) {
  selfSrc = null;
}
const occ = {};
if (selfSrc !== null) {
  for (const name of DECLARED_CRIPPLES) {
    occ[name] = selfSrc.split(name).length - 1;
  }
}
console.log(`\nC8 declared-cripple occurrence count in this file's own source:`);
for (const name of DECLARED_CRIPPLES) console.log(`  ${name}: ${selfSrc === null ? 'UNREADABLE' : occ[name]}`);
measured(
  selfSrc === null ? null : DECLARED_CRIPPLES.every((n) => occ[n] > 1),
  'C8',
  'every cripple declared in this file\'s docblock occurs MORE THAN ONCE in its own source, so each has at least one hook that reads it',
  selfSrc === null
    ? 'self source unreadable'
    : DECLARED_CRIPPLES.map((n) => `${n}=${occ[n]}`).join(' ')
);

// ---------------------------------------------------------------------------
// PREDICTIONS — written here before the first drive of this cell.
// ---------------------------------------------------------------------------
predict(
  'Q1',
  'under the self-attested key the most recent gated-curing round is 454 — the value the standing line carried before 87270c6f',
  454,
  () => lastSelf
);
predict(
  'Q2',
  'under the self-attested key the consecutive run is 10, so the condition HAS fired at N=5 — the opposite verdict from the dir key at the same rev',
  10,
  () => consecSelf
);
predict(
  'Q3',
  'the incidental credit edges name exactly rounds 387, 389 and 464 — two of them same-author (round 391\'s commit amending the 387 and 389 cells) and one cross-author (87270c6f in round 464\'s dir)',
  '3|387,389,464',
  () => (selfCureSet === null ? null : `${incidentalRounds.length}|${incidentalRounds.join(',')}`)
);
predict(
  'Q4',
  'the author-mismatch key catches exactly 1 of the 3 incidental edges, which is why it is reported and not adopted',
  1,
  () => (incidentalEdges.length === 0 ? null : caught.length)
);
predict(
  'Q5',
  'every credited round\'s directory-creating commit resolves, so no edge refuses and the self-attested figure is a measurement rather than a floor',
  true,
  () => (edges.length === 0 ? null : refusedEdges.length === 0)
);

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
const red = legs.filter((l) => l.value === false).map((l) => l.id);
const refused = legs.filter((l) => l.value === null && !/^\[MEAS\]/.test(l.text)).map((l) => l.id);
const refuted = preds.filter((p) => p.actual !== null && p.actual !== p.expected).map((p) => p.id);
const prefused = preds.filter((p) => p.actual === null).map((p) => p.id);

console.log(`\n--- LEGS ---`);
for (const l of legs) {
  const v = /^\[MEAS\]/.test(l.text) ? 'MEAS' : l.value === null ? 'REF ' : l.value ? ' ok ' : 'RED ';
  console.log(`${v} ${l.id}: ${l.text}`);
  console.log(`      detail: ${l.detail}`);
}
console.log(`\n--- PREDICTIONS ---`);
for (const p of preds) {
  const v = p.actual === null ? 'PREF' : p.actual === p.expected ? 'LAND' : 'REFU';
  console.log(`${v} ${p.id}: ${p.text}`);
  console.log(`      expected=${JSON.stringify(p.expected)} actual=${JSON.stringify(p.actual)}`);
}

const status = red.length > 0 ? 'RED' : refused.length > 0 ? 'REFUSED' : 'ok';
console.log(
  `\nVERDICT/1 ${status} legs=${legs.length} red=[${red}] refused=[${refused}] preds=${preds.length} refuted=[${refuted}] prefused=[${prefused}]`
);
