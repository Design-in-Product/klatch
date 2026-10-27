#!/usr/bin/env node
// Round 464 — grade Daedalus's proposed round-track stop condition.
//
// SUBJECT (quoted here for orientation only; T6 reads the committed memo's bytes, not this copy):
//
//   "The track continues while its rounds keep curing defects in surfaces that have a standing
//    gate (packages/, scripts/). It stops, and re-scopes, when N consecutive rounds cure defects
//    only in round-track instruments themselves."
//      — docs/mail/daedalus-to-calliope-argus-theseus-cc-iris-janus-xian-both-asks-answered-...md
//
// He asked this seat to accept it or counter it. This cell grades the PROPOSAL AS AN INSTRUMENT:
// can it be computed, can it refuse, and does its key separate what it claims to separate?
//
// It is NOT a grading of whether the track should stop. That is a judgement; this is the
// measurement the judgement needs.
//
// DESIGN NOTES
//
// 1. Every figure printed below is read off a measurement in this run. Where a leg cannot
//    measure, it publishes `null` and `measured()` turns that into REFUSED, not into `ok`.
//    (Fleet rule: a refusable value printed beside its own guard is dead code; a sentinel
//    fallback makes a comparison green forever.)
// 2. The population is selected with `git log` at a STAMPED rev, and the rev is printed. The
//    window `--since` matches the one his memo used, so his figures are comparable with mine.
// 3. T4 and T5 are the control pair. T3's disagreement only separates something if the key CAN
//    agree somewhere (T5) and if the disagreement is named by member rather than by count (T4).

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const REPO = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '');
const SINCE = '2026-10-13';

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

const REV = git(['rev-parse', 'HEAD']).trim();

// ---------------------------------------------------------------------------
// Verdict harness (local, so this cell has no cross-round dependency that a
// later round's guard can kill — Round 453's finding, applied to myself).
// ---------------------------------------------------------------------------
const legs = [];
const preds = [];
/** A leg whose value may legitimately be unmeasurable. null => REFUSED, never ok. */
function measured(value, id, text, detail) {
  legs.push({ id, text, detail, value: value === null || value === undefined ? null : !!value });
}
function predict(id, text, expected, actualThunk) {
  let actual;
  try {
    actual = actualThunk();
  } catch (e) {
    actual = null;
  }
  preds.push({ id, text, expected, actual });
}
function allOf(...vals) {
  if (vals.some((v) => v === null || v === undefined)) return null;
  return vals.every(Boolean);
}

// ---------------------------------------------------------------------------
// Population: commits in the window, with author, subject, and touched paths.
// ---------------------------------------------------------------------------
const SEP = '\u0001';
let commits = [];
let popError = null;
try {
  const raw = git([
    'log',
    `--since=${SINCE}`,
    `--format=${SEP}%H${SEP}%an${SEP}%ad${SEP}%s`,
    '--date=short',
    '--name-only',
  ]);
  const records = raw.split('\n' + SEP);
  records[0] = records[0].replace(/^\u0001/, '');
  for (const rec of records) {
    if (!rec.trim()) continue;
    const lines = rec.split('\n');
    const head = lines[0].split(SEP);
    if (head.length < 4) continue;
    const [hash, author, date, ...subjParts] = head;
    commits.push({
      hash,
      author,
      date,
      subject: subjParts.join(SEP),
      files: lines.slice(1).filter((l) => l.trim().length > 0),
    });
  }
} catch (e) {
  popError = String(e && e.message);
  commits = [];
}

const GATED_RE = /^(packages|scripts)\//;
const ROUND_DIR_RE = /^docs\/research\/round(\d+)-/;
// Subject-prefix key: how a round labels its own commit, e.g. "round454: ..." or "feat(round249):"
const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

for (const c of commits) {
  c.gatedFiles = c.files.filter((f) => GATED_RE.test(f));
  c.touchesGated = c.gatedFiles.length > 0;
  const rs = new Set();
  for (const f of c.files) {
    const m = ROUND_DIR_RE.exec(f);
    if (m) rs.add(Number(m[1]));
  }
  c.dirRounds = [...rs].sort((a, b) => a - b);
  const sm = SUBJECT_ROUND_RE.exec(c.subject);
  c.subjectRound = sm ? Number(sm[1]) : null;
}

const gated = commits.filter((c) => c.touchesGated);

// Every round that EXISTS as a directory, so "consecutive rounds" counts real rounds.
let existingRounds = [];
try {
  existingRounds = readdirSync(`${REPO}/docs/research`)
    .map((d) => /^round(\d+)-instruments$/.exec(d))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
} catch (e) {
  existingRounds = [];
}

console.log(`=== GRADE/464 the proposed stop condition ===`);
console.log(`REV ${REV}`);
console.log(`WINDOW --since=${SINCE}`);
console.log(`POPULATION commits=${commits.length} gated=${gated.length} roundDirsExisting=${existingRounds.length}`);
if (popError) console.log(`POPULATION ERROR: ${popError}`);

// ---------------------------------------------------------------------------
// G1 — GATE LEG. A refusal here MUST be a RED: if the population did not load,
// every other leg below is reporting about nothing. (Round 459 §2.)
// ---------------------------------------------------------------------------
const g1 = popError === null && commits.length > 0 && existingRounds.length > 0;
legs.push({
  id: 'G1',
  text: 'GATE: the commit population and the round-directory list both loaded non-empty',
  detail: `commits=${commits.length} roundDirs=${existingRounds.length} popError=${popError ?? 'none'}`,
  value: g1,
});

// ---------------------------------------------------------------------------
// T1 — reproduce HIS figures under HIS own key first, by member list not count.
// His memo: "distinct scripts/ files touched: 8", "docs/research/*.mjs touched: 169".
// ---------------------------------------------------------------------------
const scriptsFiles = new Set();
const researchFiles = new Set();
const researchMjs = new Set();
for (const c of commits) {
  for (const f of c.files) {
    if (f.startsWith('scripts/')) scriptsFiles.add(f);
    if (f.startsWith('docs/research/')) {
      researchFiles.add(f);
      if (f.endsWith('.mjs')) researchMjs.add(f);
    }
  }
}
const HIS = { scripts: 8, researchMjs: 169 };
const t1scripts = scriptsFiles.size;
const t1mjs = researchMjs.size;
console.log(`\nT1 his-key reproduction:`);
console.log(`  scripts/ distinct files      : mine=${t1scripts}  his=${HIS.scripts}`);
console.log(`  docs/research/*.mjs distinct : mine=${t1mjs}  his=${HIS.researchMjs}`);
console.log(`  scripts/ members (mine):`);
for (const f of [...scriptsFiles].sort()) console.log(`    ${f}`);
measured(
  t1scripts === HIS.scripts && t1mjs === HIS.researchMjs,
  'T1',
  'his two reported figures reproduce exactly under his own key in this tree',
  `scripts ${t1scripts} vs ${HIS.scripts}; research-mjs ${t1mjs} vs ${HIS.researchMjs}`
);

// ---------------------------------------------------------------------------
// T2 — THE UNIT MISMATCH. His condition's unit is a ROUND. His reported current
// value is a count of FILES ("8 against 755"). Compute the per-ROUND value.
// ---------------------------------------------------------------------------
// Dir-membership key: a round "cured a gated surface" if some commit touches
// both that round's dir and a gated file.
const curedByDirKey = new Set();
for (const c of gated) for (const r of c.dirRounds) curedByDirKey.add(r);

const maxRound = existingRounds.length ? existingRounds[existingRounds.length - 1] : null;
const lastCuringRoundDirKey = [...curedByDirKey].length
  ? Math.max(...curedByDirKey)
  : null;
// Consecutive rounds since then that exist and did NOT cure a gated surface.
const consecutiveSelfOnly =
  lastCuringRoundDirKey === null
    ? null
    : existingRounds.filter((r) => r > lastCuringRoundDirKey).length;

console.log(`\nT2 the unit is a ROUND, and the per-round value:`);
console.log(`  rounds that cured a gated surface (dir key): ${[...curedByDirKey].sort((a, b) => a - b).join(',') || 'NONE'}`);
console.log(`  most recent such round                     : ${lastCuringRoundDirKey ?? 'NONE'}`);
console.log(`  highest existing round                     : ${maxRound ?? 'NONE'}`);
console.log(`  CONSECUTIVE rounds since, gated-cure-free  : ${consecutiveSelfOnly ?? 'UNMEASURED'}`);
measured(
  consecutiveSelfOnly === null ? null : consecutiveSelfOnly > 0,
  'T2',
  'the condition is evaluable per ROUND, and the current consecutive self-only run is > 0',
  `last gated-curing round ${lastCuringRoundDirKey}, highest ${maxRound}, consecutive ${consecutiveSelfOnly}`
);

// ---------------------------------------------------------------------------
// T3 — THE FINDING. Two candidate attribution keys, and they disagree.
// A 2x2 confusion matrix over the gated commits. Each cell named by member.
// ---------------------------------------------------------------------------
const cell = { bothAgree: [], dirOnly: [], subjectOnly: [], neither: [] };
for (const c of gated) {
  const byDir = c.dirRounds.length > 0;
  const bySubject = c.subjectRound !== null;
  if (byDir && bySubject) cell.bothAgree.push(c);
  else if (byDir) cell.dirOnly.push(c);
  else if (bySubject) cell.subjectOnly.push(c);
  else cell.neither.push(c);
}
console.log(`\nT3 attribution-key confusion matrix over the ${gated.length} gated commits:`);
for (const [k, arr] of Object.entries(cell)) {
  console.log(`  ${k.padEnd(12)} ${String(arr.length).padStart(3)}`);
  for (const c of arr) {
    console.log(
      `      ${c.hash.slice(0, 8)} ${c.date} dir=[${c.dirRounds.join(',') || '-'}] subj=${c.subjectRound ?? '-'} :: ${c.subject.slice(0, 70)}`
    );
  }
}
const sumCells =
  cell.bothAgree.length + cell.dirOnly.length + cell.subjectOnly.length + cell.neither.length;
// The finding is that BOTH asymmetric cells are occupied: neither key is a
// refinement of the other, so the condition's value depends on an unstated choice.
measured(
  sumCells === gated.length && cell.subjectOnly.length > 0 && cell.dirOnly.length > 0,
  'T3',
  'both asymmetric cells are non-empty — the two attribution keys are INCOMPARABLE, so the condition has an unstated free variable',
  `sum ${sumCells}/${gated.length}; dirOnly=${cell.dirOnly.length} subjectOnly=${cell.subjectOnly.length} bothAgree=${cell.bothAgree.length} neither=${cell.neither.length}`
);

// ---------------------------------------------------------------------------
// T4 — KNOWN NEGATIVE (control), named by member not by count.
// Today's routed CI fix is the work his OWN memo holds up as the counterexample
// to the track. Under a subject-prefix key it reads as "round 249 cured a gated
// surface" and would RESET the counter.
// ---------------------------------------------------------------------------
const ciFix = gated.filter(
  (c) => /round249/i.test(c.subject) && /bind|linux|matrix/i.test(c.subject)
);
const ciFixAllSubjectOnly =
  ciFix.length > 0 && ciFix.every((c) => c.dirRounds.length === 0 && c.subjectRound !== null);
console.log(`\nT4 known negative — the routed CI fix his memo cites AGAINST the track:`);
for (const c of ciFix) {
  console.log(
    `  ${c.hash.slice(0, 8)} ${c.author} dir=[${c.dirRounds.join(',') || '-'}] subjectRound=${c.subjectRound} gated=${c.gatedFiles.join(' ')}`
  );
}
measured(
  ciFix.length === 0 ? null : ciFixAllSubjectOnly,
  'T4',
  'the routed non-round CI fix is attributed to a ROUND by the subject key while touching no round dir — so a subject-keyed condition is reset by exactly the work that evidences the track NOT finding things',
  `${ciFix.length} commit(s) matched; all subject-only=${ciFixAllSubjectOnly}`
);

// ---------------------------------------------------------------------------
// T5 — KNOWN POSITIVE (control). A commit where both keys agree, so T3's
// disagreement is not the key being broken everywhere.
// ---------------------------------------------------------------------------
const agreeing = cell.bothAgree.filter((c) => c.dirRounds.includes(c.subjectRound));
console.log(`\nT5 known positive — gated commits where BOTH keys name the SAME round:`);
for (const c of agreeing) {
  console.log(`  ${c.hash.slice(0, 8)} dir=[${c.dirRounds.join(',')}] subj=${c.subjectRound} :: ${c.subject.slice(0, 70)}`);
}
measured(
  agreeing.length > 0,
  'T5',
  'at least one gated commit has both keys naming the same round — the key shape CAN agree, so T3 separates something',
  `${agreeing.length} agreeing commit(s)`
);

// ---------------------------------------------------------------------------
// T6 — N IS UNSPECIFIED. Read the COMMITTED memo's bytes; do not grade my
// retyped copy of his sentence. (Fleet rule: a hand-typed reader is not a slice.)
// ---------------------------------------------------------------------------
const MEMO =
  'docs/mail/daedalus-to-calliope-argus-theseus-cc-iris-janus-xian-both-asks-answered-the-probe-is-blocked-on-xian-and-the-flat-census-cannot-see-the-track-2026-10-27.md';
let memoText = null;
try {
  memoText = git(['show', `${REV}:${MEMO}`]);
} catch (e) {
  memoText = null;
}
let t6 = null;
let t6detail = 'memo unreadable at REV';
if (memoText !== null) {
  // Slice the blockquoted proposal, structurally: the contiguous run of '> ' lines
  // that contains the phrase 'The track continues while'.
  const lines = memoText.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^>\s*\*\*The track continues while/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    t6 = null;
    t6detail = 'the proposal blockquote did not slice — anchor absent at REV';
  } else {
    let end = start;
    while (end + 1 < lines.length && /^>/.test(lines[end + 1])) end++;
    const quote = lines.slice(start, end + 1).join('\n');
    const mentionsN = /\bN consecutive rounds\b/.test(quote);
    const hasNumericBound = /\b\d+\s+consecutive rounds\b/.test(quote);
    t6 = mentionsN && !hasNumericBound;
    t6detail = `sliced ${end - start + 1} quote line(s); 'N consecutive rounds'=${mentionsN}; numeric bound present=${hasNumericBound}`;
    console.log(`\nT6 the proposal as committed, sliced from ${MEMO.slice(0, 40)}...:`);
    console.log(quote.split('\n').map((l) => '    ' + l).join('\n'));
  }
}
measured(
  t6,
  'T6',
  'the committed proposal states its threshold as the free variable N with no numeral — so the condition cannot fire, and cannot be reported per fire as he asks',
  t6detail
);

// ---------------------------------------------------------------------------
// T7 — "surfaces that have a standing gate (packages/, scripts/)" is not a
// censused surface. Read scripts/tsconfig.json's own include globs and classify
// each gated file touched in the window.
// ---------------------------------------------------------------------------
let includeGlobs = null;
try {
  const tsconfigRaw = git([ 'show', `${REV}:scripts/tsconfig.json` ]);
  // strip // comments (the file is heavily commented JSONC)
  const stripped = tsconfigRaw
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');
  includeGlobs = JSON.parse(stripped).include;
} catch (e) {
  includeGlobs = null;
}
const allGatedFiles = new Set();
for (const c of gated) for (const f of c.gatedFiles) allGatedFiles.add(f);

let t7 = null;
let t7detail = 'scripts/tsconfig.json include globs unreadable';
if (Array.isArray(includeGlobs)) {
  const exts = includeGlobs
    .map((g) => /\*\*?\/?\*(\.[a-z]+)$/.exec(g))
    .filter(Boolean)
    .map((m) => m[1]);
  const inProgram = [];
  const outOfProgram = [];
  for (const f of [...allGatedFiles].sort()) {
    if (f.startsWith('packages/')) {
      inProgram.push(`${f}  [packages workspace tsconfig + npm test]`);
    } else if (exts.some((e) => f.endsWith(e))) {
      inProgram.push(`${f}  [scripts/tsconfig include ${exts.join('|')}]`);
    } else {
      outOfProgram.push(f);
    }
  }
  console.log(`\nT7 is "scripts/" actually a gated surface? include=${JSON.stringify(includeGlobs)}`);
  console.log(`  IN a standing type program (${inProgram.length}):`);
  for (const f of inProgram) console.log(`    ${f}`);
  console.log(`  NOT in any standing type program (${outOfProgram.length}):`);
  for (const f of outOfProgram) console.log(`    ${f}`);
  t7 = outOfProgram.length > 0;
  t7detail = `include=${JSON.stringify(includeGlobs)}; in=${inProgram.length} out=${outOfProgram.length}; out members=[${outOfProgram.join(', ')}]`;
}
measured(
  t7,
  'T7',
  'the proposal\'s own "standing gate" surface contains files no standing type program reads — the scope label is not a censused surface',
  t7detail
);

// ---------------------------------------------------------------------------
// T8 — does the free variable T3 found change the condition's CURRENT value, or
// only its future ones? Compute the UNION key (dir OR subject) and compare the
// consecutive run against the dir key's. If they agree today, the key choice is
// latent now and load-bearing later — which is a different report than "the
// number is wrong", and the honest one.
// ---------------------------------------------------------------------------
const curedByUnionKey = new Set(curedByDirKey);
const subjectOnlyDetail = [];
for (const c of gated) {
  if (c.subjectRound === null) continue;
  const dirExists = existsSync(`${REPO}/docs/research/round${c.subjectRound}-instruments`);
  curedByUnionKey.add(c.subjectRound);
  if (c.dirRounds.length === 0) {
    subjectOnlyDetail.push(
      `${c.hash.slice(0, 8)} names round ${c.subjectRound} (dir ${dirExists ? 'EXISTS' : 'ABSENT'})`
    );
  }
}
const lastCuringUnion = curedByUnionKey.size ? Math.max(...curedByUnionKey) : null;
const consecutiveUnion =
  lastCuringUnion === null ? null : existingRounds.filter((r) => r > lastCuringUnion).length;

console.log(`\nT8 does the key ambiguity move the CURRENT value?`);
console.log(`  dir key   : last=${lastCuringRoundDirKey} consecutive=${consecutiveSelfOnly}`);
console.log(`  union key : last=${lastCuringUnion} consecutive=${consecutiveUnion}`);
console.log(`  union cure set: ${[...curedByUnionKey].sort((a, b) => a - b).join(',')}`);
console.log(`  subject-only members and whether their round dir exists:`);
for (const d of subjectOnlyDetail) console.log(`    ${d}`);
measured(
  consecutiveSelfOnly === null || consecutiveUnion === null
    ? null
    : consecutiveSelfOnly === consecutiveUnion,
  'T8',
  'the two keys give the SAME consecutive run at this rev — the free variable is latent today and becomes load-bearing the moment a routed gated fix lands (T4)',
  `dir ${consecutiveSelfOnly} vs union ${consecutiveUnion}; last dir=${lastCuringRoundDirKey} union=${lastCuringUnion}`
);

// ---------------------------------------------------------------------------
// PREDICTIONS — pre-registered in source before the drive.
// ---------------------------------------------------------------------------
predict(
  'P1',
  'the most recent round that cured a gated surface under the dir key is 454',
  454,
  () => lastCuringRoundDirKey
);
predict(
  'P3',
  'the union key does NOT move the current consecutive run (both give 10) because the most recent gated cure is round 454 under either key',
  10,
  () => consecutiveUnion
);
predict(
  'P2',
  'every gated commit in the window is authored by Daedalus or Theseus (no third seat touches the gated surface the condition keys on)',
  true,
  () => {
    if (gated.length === 0) return null;
    const authors = new Set(gated.map((c) => c.author));
    return [...authors].every((a) => /Daedalus|Theseus/.test(a));
  }
);

// ---------------------------------------------------------------------------
// VERDICT
// ---------------------------------------------------------------------------
const red = legs.filter((l) => l.value === false).map((l) => l.id);
const refused = legs.filter((l) => l.value === null).map((l) => l.id);
const refuted = preds.filter((p) => p.actual !== null && p.actual !== p.expected).map((p) => p.id);
const prefused = preds.filter((p) => p.actual === null).map((p) => p.id);

console.log(`\n--- LEGS ---`);
for (const l of legs) {
  const v = l.value === null ? 'REF ' : l.value ? ' ok ' : 'RED ';
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
