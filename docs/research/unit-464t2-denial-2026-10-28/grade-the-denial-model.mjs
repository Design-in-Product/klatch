#!/usr/bin/env node
/**
 * grade-the-denial-model.mjs — Unit 464-T2-denial, 2026-10-28, Theseus
 *
 * THE QUESTION. Daedalus's 10/28 STOP memo §3 publishes `attested above 292,
 * denial-filtered: 174 (removed: exactly [465])` and routes to me, as a "one-line change
 * against a known answer", re-keying my own attested census the same way. His filter is
 *
 *     const DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
 *
 * and his `D1`/`D2`/`D3` legs are all keyed on the member **465**. A population-level claim
 * — *the removed set is exactly `[465]`* — graded only by legs about its single known member
 * cannot see either half of what a selector can get wrong: what it wrongly admits, and what
 * it wrongly rejects.
 *
 * SO THIS UNIT GRADES THE TWO HALVES HIS 465-KEYED LEGS CANNOT REACH.
 *
 * DESIGN NOTES, each earned by a prior defect of this seat's:
 *
 *  1. GATE legs refuse as RED. A gate is the one site where a refusal must not be softened
 *     into "unmeasured", because softening it is what makes an instrument stop reporting.
 *     PREDICTION legs and `[MEAS]` rows are separate and may refuse without reddening.
 *  2. The cross-check (`G2`) DRIVES his cell as a child process and parses its printed line.
 *     It does not re-type his reader. My hand-typed copy of another seat's key has disagreed
 *     with its author on this project before.
 *  3. Driving his cell writes nothing into his unit — his cell only prints. My own
 *     recordings live in THIS directory, so no drive here can re-stamp his.
 *  4. Every refusal is `null`, never a numeric sentinel. A `0` fallback would make a
 *     comparison green forever.
 *  5. The exit code and the `/N` token in the verdict line are derived from ONE value. Three
 *     cells of mine printed `RED` and exited 0 this same morning because they were two.
 *  6. G4 carries a CONTROL (`G4c`). A false-positive finding needs a control, or a key that
 *     matched *everything* would read as a false positive.
 *  7. Member lists are compared member-by-member. Equal lengths have hidden an overlap of 2
 *     on this project.
 *
 * REV is a PARAMETER with a pinned default, so the population is reproducible from a rev
 * rather than from the drive clock or from `ls-files`.
 *
 * Cripples (env `CRIPPLE=<name>`), hand map pre-registered in `predicted.md`:
 *   no-denial-filter    the filter does not run             -> [G1, G2]
 *   fp-safe-key         his key, made false-positive-safe   -> []  (G4 flips RED -> green)
 *   xcheck-wrong-figure my figure corrupted before G2        -> [G2]
 *   hand-map-widened    a non-denial added to the hand set   -> [G3, G7]
 *   control-off         the G4 control string made a non-denial -> [G4, G4c]
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const REV = process.env.REV || '10ebefaaae00f7dd4202da132bbb6de70238c020';
const FLOOR = 292; // LAST_PRODUCT_ROUND, per both our cells
const CRIPPLE = process.env.CRIPPLE || '';

// Each declared cripple name must occur MORE THAN ONCE in this file: once in the DECLARED
// list and at least once at a dispatch site. A declared cripple no branch reads leaves every
// crippled control clean, and the self-test below asserts the occurrence count rather than
// trusting that the dispatch exists.
const DECLARED = [
  'no-denial-filter',
  'fp-safe-key',
  'xcheck-wrong-figure',
  'hand-map-widened',
  'control-off',
];

function git(args) {
  return execFileSync('git', ['-C', REPO, ...args], {
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'pipe'], // child stderr must not land in the recording
  });
}

// ---------------------------------------------------------------------------
// Leg harness. kind GATE => a refusal is RED. kind PRED / MEAS => a refusal is
// REFUSED and does not redden.
// ---------------------------------------------------------------------------
const rows = [];
function leg(id, kind, value, why, detail) {
  let state;
  if (value === null || value === undefined) state = kind === 'GATE' ? 'RED' : 'REFUSED';
  else state = value ? 'ok' : 'RED';
  rows.push({ id, kind, state, why, detail });
  console.log(`  ${state.padEnd(7)} ${id} [${kind}] ${why}`);
  console.log(`          ${detail}`);
}

function sameMembers(a, b) {
  if (a === null || b === null) return null;
  if (a.length !== b.length) return false; // length first: a joined-string compare cannot see an empty member
  return a.every((x, i) => x === b[i]);
}

console.log(`grade-the-denial-model  REV=${REV}  FLOOR=${FLOOR}  CRIPPLE=${CRIPPLE || 'none'}`);
console.log(`repo             : ${REPO}`);
console.log(`HEAD at drive    : ${git(['rev-parse', 'HEAD']).trim()}`);
console.log(
  `tree at drive    : ${git(['status', '--porcelain']).trim() === '' ? 'clean' : 'DIRTY (figures below read REV, not the working tree)'}`
);

// ---------------------------------------------------------------------------
// The subject: HIS key, and the false-positive-safe variant that is the cure.
// ---------------------------------------------------------------------------
const HIS_DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;
// The cure: a denial of a round is not a denial of an artifact OF that round. Requiring the
// number to be followed by sentence punctuation or end-of-clause — not by an identifier tail
// like `-instruments` or `.test.ts` — is the narrowest change that separates the two.
const FP_SAFE_DENIAL_RE = /\bno\s+round\s*(\d+)(?![-\w./])/i;
const ACTIVE_DENIAL_RE = CRIPPLE === 'fp-safe-key' ? FP_SAFE_DENIAL_RE : HIS_DENIAL_RE;
console.log(`\nactive denial key: ${ACTIVE_DENIAL_RE}`);

// ---------------------------------------------------------------------------
// My own independent reader of the attested population. Deliberately NOT a copy of his:
// union of round dirs, commit subjects, test filenames and doc paths.
// ---------------------------------------------------------------------------
const subjects = git(['log', '--format=%H\x1f%s', REV])
  .split('\n')
  .filter(Boolean)
  .map((l) => {
    const i = l.indexOf('\x1f');
    return { h: l.slice(0, i), s: l.slice(i + 1) };
  });

const paths = git(['ls-tree', '-r', '--name-only', REV]).split('\n').filter(Boolean);

const ROUND_IN_SUBJECT = /\bround\s*(\d{3})\b/gi;
const ROUND_IN_PATH = /round(\d{3})/gi;

function numbersFrom(text, re) {
  re.lastIndex = 0;
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push(Number(m[1]));
  return out;
}

// nonSubject: every attestation that is NOT a commit subject. The denial filter can only be
// sufficient if a denied round has no non-subject attestation, so this set is what makes the
// filter safe rather than merely necessary.
const nonSubject = new Set();
for (const p of paths) for (const n of numbersFrom(p, ROUND_IN_PATH)) if (n > FLOOR) nonSubject.add(n);

const subjectRounds = new Set();
const deniedRounds = new Set();
const denialHits = [];
for (const r of subjects) {
  for (const n of numbersFrom(r.s, ROUND_IN_SUBJECT)) if (n > FLOOR) subjectRounds.add(n);
  const m = ACTIVE_DENIAL_RE.exec(r.s);
  if (m) {
    deniedRounds.add(Number(m[1]));
    denialHits.push({ h: r.h.slice(0, 8), denies: Number(m[1]), s: r.s });
  }
}

const raw = new Set([...nonSubject, ...subjectRounds]);
// A round is removed ONLY when every attestation of it is a denial: denied, named by no
// non-subject source, and named by no subject that is not a denial.
const nonDenialSubjectRounds = new Set();
for (const r of subjects) {
  if (ACTIVE_DENIAL_RE.test(r.s)) continue;
  for (const n of numbersFrom(r.s, ROUND_IN_SUBJECT)) if (n > FLOOR) nonDenialSubjectRounds.add(n);
}
let removed = [...raw].filter(
  (n) => deniedRounds.has(n) && !nonSubject.has(n) && !nonDenialSubjectRounds.has(n)
).sort((a, b) => a - b);
if (CRIPPLE === 'no-denial-filter') removed = []; // the filter does not run
const filtered = new Set([...raw].filter((n) => !removed.includes(n)));

let mineRaw = raw.size;
let mineFiltered = filtered.size;
const mineRemoved = removed;
const maxAttested = raw.size ? Math.max(...raw) : null;

console.log(`\nM1 [MEAS] my own reader of the attested population above ${FLOOR}:`);
console.log(`  raw                : ${mineRaw}  (max attested ${maxAttested})`);
console.log(`  denial-filtered    : ${mineFiltered}`);
console.log(`  removed            : [${mineRemoved.join(',')}]`);
console.log(`  non-subject sources: ${nonSubject.size} rounds`);

if (CRIPPLE === 'xcheck-wrong-figure') {
  mineRaw = mineRaw + 1; // corrupt MY figure, not his, so G2 must notice the disagreement
  mineFiltered = mineFiltered + 1;
}

// ---------------------------------------------------------------------------
// G1 [GATE] — PRED-1. My independent reader reproduces his three published figures.
// ---------------------------------------------------------------------------
console.log(`\nG1 does my own reader reproduce his published 175 / 174 / [465]?`);
leg(
  'G1',
  'GATE',
  mineRaw === 175 && mineFiltered === 174 && sameMembers(mineRemoved, [465]) === true,
  'my independent reader reproduces his raw=175, denial-filtered=174, removed=[465] at the pinned rev',
  `mine raw=${mineRaw} filtered=${mineFiltered} removed=[${mineRemoved.join(',')}]  expected 175/174/[465]`
);

// ---------------------------------------------------------------------------
// G2 [GATE] — PRED-2. Cross-check by DRIVING HIS CELL, not by re-typing his reader.
// ---------------------------------------------------------------------------
const hisCell = join(
  REPO,
  'docs/research/unit-464t2-population-2026-10-28/grade-the-round-population.mjs'
);
const run = spawnSync(process.execPath, [hisCell], {
  encoding: 'utf8',
  maxBuffer: 1 << 28,
  env: { ...process.env, CRIPPLE: '' }, // drive his CLEAN arm; my cripple must not leak into his cell
});
// His M3 line: "M3 attested denial-filtered  : above 292: 174 max=467 removed=[465]"
const m3 = /M3 attested denial-filtered\s*:\s*above\s+\d+:\s*(\d+)\s+max=(\d+)\s+removed=\[([^\]]*)\]/.exec(
  run.stdout || ''
);
const hisFiltered = m3 ? Number(m3[1]) : null;
const hisMax = m3 ? Number(m3[2]) : null;
const hisRemoved = m3 ? (m3[3] ? m3[3].split(',').map(Number) : []) : null;
console.log(`\nG2 his cell driven as a child process (status ${run.status}):`);
console.log(`  his line parsed    : ${m3 ? m3[0] : 'NOT FOUND in his stdout'}`);
console.log(`  his filtered=${hisFiltered} max=${hisMax} removed=[${hisRemoved?.join(',') ?? 'REFUSED'}]`);
leg(
  'G2',
  'GATE',
  hisFiltered === null
    ? null
    : hisFiltered === mineFiltered &&
        hisMax === maxAttested &&
        sameMembers(hisRemoved, mineRemoved) === true,
  'his cell, driven rather than re-typed, agrees with my reader on the filtered count, the max and the removed MEMBER LIST',
  `his=${hisFiltered}/${hisMax}/[${hisRemoved?.join(',') ?? 'null'}] vs mine=${mineFiltered}/${maxAttested}/[${mineRemoved.join(',')}]`
);

// ---------------------------------------------------------------------------
// G3 [GATE] — PRED-3. His key's match set over the whole corpus, as a MEMBER LIST.
// For a 2-member population the hand reading is primary, so the pinned list grades the
// key rather than the key producing the list.
// ---------------------------------------------------------------------------
let HAND_DENIALS = ['c03773ed', 'ff0cae98']; // hand-read, pre-registered in predicted.md
if (CRIPPLE === 'hand-map-widened') HAND_DENIALS = ['c03773ed', 'ff0cae98', '660d2b94'];
const keyHits = denialHits.map((d) => d.h).sort();
console.log(`\nG3 his key's match set across all ${subjects.length} subjects:`);
for (const d of denialHits) console.log(`  ${d.h} denies ${d.denies} | ${d.s.slice(0, 110)}`);
leg(
  'G3',
  'GATE',
  sameMembers(keyHits, [...HAND_DENIALS].sort()),
  'the key matches exactly the hand-read denial set, member for member — not merely the same NUMBER of commits',
  `key=[${keyHits.join(',')}] hand=[${[...HAND_DENIALS].sort().join(',')}]`
);

// ---------------------------------------------------------------------------
// G4 [GATE] — PRED-4, THE FINDING. Asserts the key does NOT match a non-denial.
// A denial of round N and a statement that an ARTIFACT of round N is absent are different
// claims. The second shape has already been written in this repo, by me, today.
// ---------------------------------------------------------------------------
const FP_SUBJECT =
  'round467: re-key probe-round307 C4 — there is no round467-instruments directory in the tree';
let CONTROL_SUBJECT = 'coord+log: 10/27 WORK fire — no Round 465; the three defects in my own 464 cell are cured';
if (CRIPPLE === 'control-off') CONTROL_SUBJECT = 'coord+log: 10/27 WORK fire — the three defects are cured';

const fpMatch = ACTIVE_DENIAL_RE.exec(FP_SUBJECT);
const controlMatch = ACTIVE_DENIAL_RE.exec(CONTROL_SUBJECT);
console.log(`\nG4 THE FINDING — does the key read an absent ARTIFACT as a denied ROUND?`);
console.log(`  non-denial subject : ${FP_SUBJECT}`);
console.log(`  key says           : ${fpMatch ? `DENIES ${fpMatch[1]}  <-- round ${fpMatch[1]} would be deleted from the population` : 'no match'}`);
console.log(`  control (a real denial): ${CONTROL_SUBJECT}`);
console.log(`  key says           : ${controlMatch ? `DENIES ${controlMatch[1]}` : 'no match'}`);
leg(
  'G4',
  'GATE',
  fpMatch === null,
  'the key does NOT match a subject that denies an ARTIFACT of round N rather than round N itself — a RED means the filter deletes a round that exists',
  `fpSubjectMatched=${fpMatch !== null}${fpMatch ? ` deniesRound=${fpMatch[1]}` : ''}`
);
leg(
  'G4c',
  'GATE',
  controlMatch !== null && Number(controlMatch[1]) === 465,
  'CONTROL: the key still matches a GENUINE denial, so G4 is a false positive and not a key that matches nothing or everything',
  `controlMatched=${controlMatch !== null} denies=${controlMatch ? controlMatch[1] : 'n/a'}`
);

// ---------------------------------------------------------------------------
// G5 [MEAS] — PRED-6. The recall floor. One spelling is one axis of coverage.
// 0 corpus instances, so this is a FLOOR on the filter's reach, not a live defect.
// ---------------------------------------------------------------------------
const ALT_SPELLINGS = [
  'coord+log: 10/29 WORK fire — not Round 468; the cell is cured',
  'coord+log: 10/29 WORK fire — never Round 468, the label was mine',
  'coord+log: 10/29 WORK fire — Round 468 does not exist; renumbered',
  'coord+log: 10/29 WORK fire — Round 468 was skipped',
];
const caught = ALT_SPELLINGS.filter((s) => ACTIVE_DENIAL_RE.test(s));
console.log(`\nM2 [MEAS] recall floor — alternate denial spellings the key reaches:`);
for (const s of ALT_SPELLINGS) console.log(`  ${ACTIVE_DENIAL_RE.test(s) ? 'CAUGHT ' : 'MISSED '} ${s}`);
const altInCorpus = subjects.filter((r) =>
  /\b(not|never|skipped)\s+round\s*\d{3}\b|\bround\s*\d{3}\s+does\s+not\s+exist\b/i.test(r.s)
);
leg(
  'G5',
  'MEAS',
  true,
  `[MEAS] the key reaches ${caught.length} of ${ALT_SPELLINGS.length} alternate denial spellings, with ${altInCorpus.length} instances in the corpus at REV — a FLOOR on its reach, not a live defect`,
  `caught=${caught.length}/${ALT_SPELLINGS.length} corpusInstances=${altInCorpus.length}`
);

// ---------------------------------------------------------------------------
// G6 [MEAS] — PRED-7. Is the false positive reachable, or already landed? Measured over
// committed prose at REV: how many lines does the key match, and do those rounds exist?
// ---------------------------------------------------------------------------
const docPaths = paths.filter((p) => p.startsWith('docs/') && p.endsWith('.md'));
let proseHits = 0;
const proseFp = [];
for (const p of docPaths) {
  let body;
  try {
    body = git(['show', `${REV}:${p}`]);
  } catch {
    // A path that cannot be read is counted, not skipped — a `catch { continue }` drops
    // cases out of a census without saying so.
    proseFp.push({ p, line: '(UNREADABLE at REV)', exists: null });
    continue;
  }
  for (const line of body.split('\n')) {
    const m = ACTIVE_DENIAL_RE.exec(line);
    if (!m) continue;
    proseHits++;
    const n = Number(m[1]);
    // REPAIRED. The first drive asked `nonSubject.has(n) || subjectRounds.has(n)`, and
    // `subjectRounds` contains 465 precisely BECAUSE the two denials name it — so the
    // classifier counted a round attested only by its own denials as existing, and the FP
    // count came out bigger than the truth. A round EXISTS only if some attestation of it is
    // not a denial; that is the same predicate the filter itself uses for sufficiency.
    const existsIndependently = nonSubject.has(n) || nonDenialSubjectRounds.has(n);
    proseFp.push({
      p,
      n,
      match: m[0],
      line: line.trim().slice(0, 150),
      exists: existsIndependently,
    });
  }
}
console.log(`\nM3 [MEAS] the key over ${docPaths.length} committed .md files at REV:`);
console.log(`  lines matched        : ${proseHits}`);
const trueFp = proseFp.filter((x) => x.exists === true);
console.log(`  of those, the round EXISTS independently of its denials (so the line is a FALSE POSITIVE): ${trueFp.length}`);
console.log(`  the rest are genuine denials of a round attested only by denials: ${proseFp.filter((x) => x.exists === false).length}`);
for (const x of trueFp.slice(0, 12))
  console.log(`    FP round=${x.n} match="${x.match}"  ${x.p}\n       ${x.line}`);
leg(
  'G6',
  'MEAS',
  true,
  '[MEAS] how far the false-positive shape has already travelled in committed prose — 0 landed instances with a live route is a defect in the key, not in the corpus',
  `mdFiles=${docPaths.length} linesMatched=${proseHits} falsePositives=${trueFp.length} genuineDenials=${proseFp.filter((x) => x.exists === false).length} unreadable=${proseFp.filter((x) => x.exists === null).length}`
);

// ---------------------------------------------------------------------------
// G7 [GATE] — PRED-8. The candidate population at REV, pinned. Keyed on a pinned REV, so
// this count is a constant and cannot redden on a later commit.
// ---------------------------------------------------------------------------
const ABSENCE =
  /\b(no|not|never|none|nonexistent|non-existent|without|absent|missing|skip|skipped|lacks|lacking|isn't|doesn't|does not|did not|dropped|dead|empty|unused|phantom|invented|denies|denied|denial|retracted|withdrawn|mislabel\w*|wrong)\b/i;
const candidates = subjects.filter((r) => {
  const nums = numbersFrom(r.s, ROUND_IN_SUBJECT).filter((n) => n > FLOOR);
  return nums.length > 0 && ABSENCE.test(r.s);
});
const candidateShas = candidates.map((r) => r.h.slice(0, 8));
const handInCandidates = [...HAND_DENIALS].filter((h) => candidateShas.includes(h)).sort();
console.log(`\nG7 the wide candidate set at REV: ${candidates.length} subjects`);
leg(
  'G7',
  'GATE',
  candidates.length === 207 && sameMembers(handInCandidates, [...HAND_DENIALS].sort()) === true,
  'the candidate population at the pinned rev is 207 and every hand-read denial is inside it — so the hand reading was done over the whole candidate set, not over the key\'s own output',
  `candidates=${candidates.length} (expected 207) handInside=[${handInCandidates.join(',')}] hand=[${[...HAND_DENIALS].sort().join(',')}]`
);

// ---------------------------------------------------------------------------
// Self-test: every DECLARED cripple name must occur MORE THAN ONCE in this file. GATED on
// !== true, not merely printed — a printed self-test that gates nothing is not a self-test.
// The running file is read by its own path so the check cannot walk a sibling.
// ---------------------------------------------------------------------------
// Read the RUNNING file off disk by its own path. Not `git show REV:<path>` — this file does
// not exist at the pinned REV, so a rev-sourced self-test would refuse on its first drive and
// go on refusing in any tree that is behind the pin.
const selfSrc = readFileSync(fileURLToPath(import.meta.url), 'utf8');
const occ = {};
let selfOk = true;
for (const name of DECLARED) {
  const n = selfSrc.split(name).length - 1;
  occ[name] = n;
  if (n < 2) selfOk = false;
}
console.log(`\nSELF-TEST cripple dispatch occurrences (each must be > 1): ${JSON.stringify(occ)}`);
leg(
  'SELF',
  'GATE',
  selfOk === true,
  'every declared cripple name occurs more than once in this file, so none is a declared cripple that no branch reads',
  JSON.stringify(occ)
);

// ---------------------------------------------------------------------------
// Verdict. ONE value drives both the printed /N token and the exit status.
// ---------------------------------------------------------------------------
const red = rows.filter((r) => r.state === 'RED').map((r) => r.id);
const refused = rows.filter((r) => r.state === 'REFUSED').map((r) => r.id);
const code = red.length === 0 ? 0 : 1;
console.log(
  `\nVERDICT/${code} ${code === 0 ? 'GREEN' : 'RED'} legs=${rows.length} red=[${red.join(',')}] refused=[${refused.join(',')}] cripple=${CRIPPLE || 'none'}`
);
process.exit(code);
