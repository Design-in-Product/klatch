#!/usr/bin/env node
/**
 * grade-the-denial-rekey.mjs — Unit 465-attestdenial, 2026-11-12 WORK, Theseus
 *
 * THE RE-KEY ITSELF. Daedalus's 10/28 §7 names "re-keying your attested-round census to exclude
 * denials" as open on this seat, and adds that it is "a one-line change against a known answer
 * (`[465]`, 175 → 174)". This cell is the re-key, and it is not that one line, for the three
 * reasons the pre-registration gives (README.md, pushed at `3d8cac59` before this file existed).
 *
 * The census being re-keyed is `unit-464t2-surface-2026-10-28/recon-run-length-and-cure.mjs`'s
 * `--- Q-B` block, which unions four attestation sources with NO denial handling and published
 * 175. That file is a stamped recording and is not edited: the re-key is here, and it reads the
 * one live reader rather than a copy of its key.
 *
 * ## What is imported and what is pinned
 *
 * `attestedRounds` / `dirRounds` / `DENIAL_RE` / `LEGACY_DENIAL_RE` / `selfTest` all come from
 * `docs/research/lib/attested-rounds.mjs` — Daedalus's module, imported, never re-typed. A
 * hand-typed copy of his key would grade my transcription, not his cure.
 *
 * The reader's SOURCE is taken from the working tree and is never pinned to a subject rev: an
 * instrument's own input cannot carry the subject's pin. What IS pinned is the subject — the tree
 * and the subject set — at two revs:
 *
 *   REV_NOW    HEAD at run time
 *   REV_PRIOR  69cf9167, a pinned literal: the commit that created the lib AND published the
 *              answer key (`unit-464t2-rekey-2026-10-29/drive5.pop-cured-f3-reaimed.out:10`,
 *              `M3 attested denial-filtered  : above 292: 174 max=467 removed=[465]`).
 *
 * ## Three keys, nested, so the census is a bracket and not a number
 *
 *   A  denial-blind  — `denialRe` that never matches. This is my 10/28 census key.
 *   B  as-filed      — `LEGACY_DENIAL_RE`, imported.
 *   C  cured         — `DENIAL_RE`, the live default.
 *
 * ## Cripples
 *
 * Built ADDITIVELY off argv, never by editing a subject: a cripple that mutates the tree cannot be
 * told from a crash, and a restore-from-HEAD would discard anything uncommitted.
 *
 *   --cripple=blind-key     the LIVE key becomes the denial-blind one, so C collapses onto A.
 *                           Predicted: T2 RED (the loss leg) and T3 RED (B vs C disagree), and
 *                           nothing else moves. This is what proves T2 is not vacuous.
 *   --cripple=prior-as-now  REV_PRIOR := REV_NOW. Predicted: G3 REFUSES, and T1/T4/T5 refuse with
 *                           it. A zero-length interval makes "no growth over the interval" true by
 *                           construction, so the right outcome is a refusal and not a pass.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attestedRounds,
  dirRounds,
  DENIAL_RE,
  LEGACY_DENIAL_RE,
  git,
  selfTest as attestedSelfTest,
} from '../lib/attested-rounds.mjs';
import { allOf, measured, renderVerdict, renderRows, renderPredRows } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(dirname(dirname(HERE)));

const CRIPPLES = new Set(['none', 'blind-key', 'prior-as-now']);
const cArg = process.argv.find((a) => a.startsWith('--cripple='));
const CRIPPLE = cArg ? cArg.slice('--cripple='.length) : 'none';
if (!CRIPPLES.has(CRIPPLE)) {
  console.log(`UNKNOWN CRIPPLE ${JSON.stringify(CRIPPLE)} — known: ${[...CRIPPLES].join(', ')}`);
  process.exit(3);
}

/** A regex that matches nothing. Arm A's key, and the `blind-key` cripple's live key. */
const NEVER_RE = /$^/;
const LIVE_RE = CRIPPLE === 'blind-key' ? NEVER_RE : DENIAL_RE;

const LAST_PRODUCT_ROUND_CLAIMED = 292;
const REV_NOW = (git(REPO, ['rev-parse', 'HEAD']) ?? 'UNRESOLVED\n').trim();
const REV_PRIOR_LITERAL = '69cf9167';
const REV_PRIOR = CRIPPLE === 'prior-as-now'
  ? REV_NOW
  : (git(REPO, ['rev-parse', REV_PRIOR_LITERAL]) ?? 'UNRESOLVED').trim();

console.log('=== GRADE/465-attestdenial — the denial re-key, and whether the measure that replaced a dead one is itself moving ===');
console.log(`REV_NOW   ${REV_NOW}`);
console.log(`REV_PRIOR ${REV_PRIOR}  (literal ${REV_PRIOR_LITERAL})`);
console.log(`CLOCK     ${new Date().toISOString()}`);
console.log(`CRIPPLE   ${CRIPPLE}`);
console.log(`LIVE KEY  ${LIVE_RE}`);
console.log('');

// ── the gate on the imported reader ──────────────────────────────────────────────────────────────
let selfOk = null;
let selfWhy = 'not run';
try {
  selfOk = attestedSelfTest() === true;
  selfWhy = selfOk ? 'true' : 'returned a non-true value';
} catch (e) {
  selfOk = false;
  selfWhy = e.message;
}

// ── the three arms, at both revs ─────────────────────────────────────────────────────────────────
const read = (rev, re) => (rev === 'UNRESOLVED' ? null : attestedRounds(REPO, rev, { denialRe: re }));
const arms = {
  now: { A: read(REV_NOW, NEVER_RE), B: read(REV_NOW, LEGACY_DENIAL_RE), C: read(REV_NOW, LIVE_RE) },
  prior: { A: read(REV_PRIOR, NEVER_RE), B: read(REV_PRIOR, LEGACY_DENIAL_RE), C: read(REV_PRIOR, LIVE_RE) },
};
const dirsNow = REV_NOW === 'UNRESOLVED' ? null : dirRounds(REPO, REV_NOW);
const dirsPrior = REV_PRIOR === 'UNRESOLVED' ? null : dirRounds(REPO, REV_PRIOR);

/** Members above the claimed last product round. `null` propagates. */
const above = (r) => (r === null ? null : r.sorted.filter((n) => n > LAST_PRODUCT_ROUND_CLAIMED));
const maxOf = (r) => {
  const a = above(r);
  return a === null ? null : (a.length ? a[a.length - 1] : null);
};

console.log('--- [MEAS] the census, three keys, two revs');
for (const [when, rev] of [['prior', REV_PRIOR], ['now', REV_NOW]]) {
  for (const [key, label] of [['A', 'denial-blind (my 10/28 key)'], ['B', 'as-filed  '], ['C', 'cured/live']]) {
    const r = arms[when][key];
    const ab = above(r);
    console.log(
      `  M-${when}-${key}  ${label.padEnd(28)} rev=${rev.slice(0, 8)}  above ${LAST_PRODUCT_ROUND_CLAIMED}: `
      + `${ab === null ? 'REFUSED' : String(ab.length).padStart(4)}`
      + `  max=${maxOf(r) ?? 'NONE'}`
      + `  removed=[${r === null ? 'REFUSED' : r.removed.join(',')}]`
    );
  }
}
const lossNow = allOf(arms.now.A !== null, arms.now.C !== null) === true
  ? above(arms.now.A).length - above(arms.now.C).length
  : null;
const lossPrior = allOf(arms.prior.A !== null, arms.prior.C !== null) === true
  ? above(arms.prior.A).length - above(arms.prior.C).length
  : null;
console.log(`  M-loss    the re-key's loss (A − C)         prior=${lossPrior ?? 'REFUSED'}  now=${lossNow ?? 'REFUSED'}`);
console.log(`  M-dirs    round-DIR population              prior=${dirsPrior === null ? 'REFUSED' : `n=${dirsPrior.length} max=${dirsPrior[dirsPrior.length - 1]}`}  now=${dirsNow === null ? 'REFUSED' : `n=${dirsNow.length} max=${dirsNow[dirsNow.length - 1]}`}`);
console.log('');

// ── B vs C, member for member ────────────────────────────────────────────────────────────────────
// Compared as ARRAYS with their lengths asserted non-zero, not as one joined string: a joined-string
// comparison cannot see an empty member, and two empty populations would agree vacuously.
function sameMembers(x, y) {
  if (x === null || y === null) return null;
  const ax = above(x);
  const ay = above(y);
  if (ax.length === 0 || ay.length === 0) return null; // nothing to agree about — refuse, don't pass
  if (ax.length !== ay.length) return false;
  for (let i = 0; i < ax.length; i += 1) if (ax[i] !== ay[i]) return false;
  return true;
}
const bcAgreeNow = sameMembers(arms.now.B, arms.now.C);
const bcDisagreeMembers = (arms.now.B === null || arms.now.C === null)
  ? null
  : [
    ...above(arms.now.B).filter((n) => !above(arms.now.C).includes(n)).map((n) => `+B${n}`),
    ...above(arms.now.C).filter((n) => !above(arms.now.B).includes(n)).map((n) => `+C${n}`),
  ];
console.log('--- [MEAS] does the as-filed key still agree with the cure on this population');
console.log(`  M-bc      B vs C at REV_NOW: ${bcAgreeNow === null ? 'REFUSED (an empty side agrees with anything)' : bcAgreeNow ? 'identical, member for member' : `DISAGREE ${bcDisagreeMembers.join(' ')}`}`);
console.log('');

// ── growth of the attested measure over the interval ─────────────────────────────────────────────
const revsDistinct = REV_NOW !== 'UNRESOLVED' && REV_PRIOR !== 'UNRESOLVED' && REV_NOW !== REV_PRIOR;
const ancestorRc = revsDistinct
  ? spawnSync('git', ['-C', REPO, 'merge-base', '--is-ancestor', REV_PRIOR, REV_NOW], { stdio: 'pipe' }).status
  : null;
const intervalOk = revsDistinct && ancestorRc === 0;

const grewMembers = intervalOk && arms.now.C !== null && arms.prior.C !== null
  ? above(arms.now.C).filter((n) => !above(arms.prior.C).includes(n))
  : null;
const lostMembers = intervalOk && arms.now.C !== null && arms.prior.C !== null
  ? above(arms.prior.C).filter((n) => !above(arms.now.C).includes(n))
  : null;

// Dirs created in the interval, computed as "present in the tree at NOW and absent at PRIOR" —
// reproducible from the two revs alone, with no `--since` and no ambient clock anywhere in it.
function treeDirs(rev, re) {
  const tree = git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const out = new Set();
  for (const p of tree.split('\n')) {
    const m = re.exec(p);
    if (m) out.add(m[1]);
  }
  return out;
}
const UNIT_RE = /^docs\/research\/(unit-[^/]+)\//;
const ROUND_RE = /^docs\/research\/(round\d+-instruments)\//;
const unitNow = intervalOk ? treeDirs(REV_NOW, UNIT_RE) : null;
const unitPrior = intervalOk ? treeDirs(REV_PRIOR, UNIT_RE) : null;
const roundNow = intervalOk ? treeDirs(REV_NOW, ROUND_RE) : null;
const roundPrior = intervalOk ? treeDirs(REV_PRIOR, ROUND_RE) : null;
const newUnits = unitNow && unitPrior ? [...unitNow].filter((d) => !unitPrior.has(d)) : null;
const newRounds = roundNow && roundPrior ? [...roundNow].filter((d) => !roundPrior.has(d)) : null;
const commitsRaw = intervalOk ? git(REPO, ['rev-list', '--count', `${REV_PRIOR}..${REV_NOW}`]) : null;
const commits = commitsRaw === null ? null : Number(commitsRaw.trim());

console.log('--- [MEAS] the interval, and what moved in it');
console.log(`  M-int     interval usable: ${intervalOk ? 'yes' : `NO (distinct=${revsDistinct} is-ancestor-rc=${ancestorRc})`}`);
console.log(`  M-commits commits in REV_PRIOR..REV_NOW    : ${commits ?? 'REFUSED'}`);
console.log(`  M-attgrow attested members gained (cured key): ${grewMembers === null ? 'REFUSED' : `${grewMembers.length} → [${grewMembers.join(',')}]`}`);
console.log(`  M-attlost attested members lost  (cured key): ${lostMembers === null ? 'REFUSED' : `${lostMembers.length} → [${lostMembers.join(',')}]`}`);
console.log(`  M-units   unit-* dirs created in interval   : ${newUnits === null ? 'REFUSED' : newUnits.length}`);
if (newUnits) for (const d of newUnits.sort()) console.log(`              + ${d}`);
console.log(`  M-rounds  roundNNN-instruments created      : ${newRounds === null ? 'REFUSED' : `${newRounds.length} → [${newRounds.join(',')}]`}`);
console.log('');

// ── the standing cell, driven as a child ─────────────────────────────────────────────────────────
// Its figure is READ OFF ITS OWN STDOUT, not re-derived here. A re-derivation would grade my copy
// of his arithmetic; the question is what the cell publishes to the standing COORDINATION line.
const STANDING = join(REPO, 'docs/research/round464-instruments/grade-the-stop-condition.mjs');
const CONSEC_RE = /^\s*CONSECUTIVE rounds since, gated-cure-free\s*:\s*(\d+|UNMEASURED)\s*$/m;
const FIRED_RE = /^\s*FIRED under the dir key\s*:\s*(true|false|UNMEASURED)\s*$/m;

// KNOWN POSITIVE and NEAR MISS for the parse, planted here so a silent parse failure cannot read as
// "the cell did not print it". If the parse of the real output fails, T6 refuses rather than passing.
const KP_LINE = '  CONSECUTIVE rounds since, gated-cure-free  : 2';
const KP_NEAR = '  CONSECUTIVE rounds since, gated-cure-free  : two';
const parseKpOk = CONSEC_RE.exec(KP_LINE)?.[1] === '2' && CONSEC_RE.exec(KP_NEAR) === null;

const child = spawnSync('node', [STANDING], { cwd: REPO, encoding: 'utf8', stdio: 'pipe' });
const childOut = child.stdout ?? '';
const consecMatch = CONSEC_RE.exec(childOut);
const consecRaw = consecMatch ? consecMatch[1] : null;
const consec = consecRaw === null || consecRaw === 'UNMEASURED' ? null : Number(consecRaw);
const firedMatch = FIRED_RE.exec(childOut);
const fired = firedMatch ? firedMatch[1] : null;

console.log('--- [MEAS] the standing cell, driven as a child at REV_NOW');
console.log(`  M-child   exit=${child.status}  stderrBytes=${(child.stderr ?? '').length}  stdoutBytes=${childOut.length}`);
console.log(`  M-consec  its own CONSECUTIVE line         : ${consecRaw ?? 'NOT PRINTED'}`);
console.log(`  M-fired   its own FIRED line               : ${fired ?? 'NOT PRINTED'}`);
console.log(`  M-parsekp the parse's KP/near-miss pair    : ${parseKpOk ? 'separates' : 'DOES NOT SEPARATE — T6 refuses'}`);
console.log('');

// ── legs ─────────────────────────────────────────────────────────────────────────────────────────
const legs = [];
const add = (id, ok, what) => legs.push({ id, ok, what });

add('G1', selfOk === true ? true : false,
  `[GATE  ] attested-rounds.mjs selfTest() === true — ${selfWhy}`);

const readersOk = allOf(
  arms.now.A !== null, arms.now.B !== null, arms.now.C !== null,
  arms.prior.A !== null, arms.prior.B !== null, arms.prior.C !== null,
  dirsNow !== null, dirsPrior !== null,
);
add('G2', readersOk,
  `[GATE  ] every reader resolved at both revs — now=${arms.now.C !== null} prior=${arms.prior.C !== null} dirs=${dirsNow !== null}/${dirsPrior !== null}`);

add('G3', intervalOk ? true : null,
  `[GATE  ] the interval is real: two distinct revs, prior an ancestor of now — distinct=${revsDistinct} rc=${ancestorRc}`);

// T1 — his answer key, at HIS rev. Each conjunct is a figure he published, not a re-derivation.
const t1 = selfOk !== true || arms.prior.A === null || arms.prior.C === null
  ? null
  : allOf(
    above(arms.prior.A).length === 175,
    above(arms.prior.C).length === 174,
    arms.prior.C.removed.length === 1 && arms.prior.C.removed[0] === 465,
    maxOf(arms.prior.C) === 467,
  );
add('T1', t1,
  `[PIN   ] P1 his M3 reproduces at his rev: A=${arms.prior.A === null ? 'REF' : above(arms.prior.A).length}/175 C=${arms.prior.C === null ? 'REF' : above(arms.prior.C).length}/174 removed=[${arms.prior.C === null ? 'REF' : arms.prior.C.removed.join(',')}]/[465] max=${maxOf(arms.prior.C) ?? 'REF'}/467`);

// T2 — the loss at HEAD. The leg the blind-key cripple exists to redden.
const t2 = arms.now.C === null || lossNow === null
  ? null
  : allOf(
    lossNow === 1,
    arms.now.C.removed.length === 1 && arms.now.C.removed[0] === 465,
  );
add('T2', t2,
  `[CLAIM ] P2 the re-key still loses exactly 465 at HEAD: loss=${lossNow ?? 'REF'}/1 removed=[${arms.now.C === null ? 'REF' : arms.now.C.removed.join(',')}]/[465]`);

add('T3', bcAgreeNow,
  `[CLAIM ] P3 as-filed and cured still agree member-for-member at HEAD: ${bcAgreeNow === null ? 'REFUSED' : bcAgreeNow ? 'identical' : `disagree ${bcDisagreeMembers.join(' ')}`}`);

// T4 — the growth test on the REPLACEMENT measure. Keyed on the member sets in both directions, not
// on the two counts: two counts can agree while the members diverge.
const t4 = !intervalOk || grewMembers === null || lostMembers === null
  ? null
  : allOf(grewMembers.length === 0, lostMembers.length === 0);
add('T4', t4,
  `[CLAIM ] P4 the attested measure did not move over the interval: gained=${grewMembers === null ? 'REF' : grewMembers.length} lost=${lostMembers === null ? 'REF' : lostMembers.length}`);

// T5 — and the interval is not empty of work. The companion that stops T4 being a fact about an
// idle fortnight rather than about the measure.
const t5 = !intervalOk || commits === null || newUnits === null || newRounds === null
  ? null
  : allOf(commits >= 200, newUnits.length >= 10, newRounds.length === 0);
add('T5', t5,
  `[CLAIM ] P5 the interval carried work the measure cannot see: commits=${commits ?? 'REF'}>=200 newUnits=${newUnits === null ? 'REF' : newUnits.length}>=10 newRoundDirs=${newRounds === null ? 'REF' : newRounds.length}==0`);

// T6 — the standing cell's live figure. Refuses on a parse that cannot separate its own KP.
const t6 = !parseKpOk || child.status === null || consec === null || fired === null
  ? null
  : allOf(child.status === 0, consec === 2, fired === 'false');
add('T6', t6,
  `[CLAIM ] P6 the standing cell still publishes 2 and still cannot fire: exit=${child.status} consecutive=${consecRaw ?? 'REF'}/2 fired=${fired ?? 'REF'}/false`);

// ── predictions ──────────────────────────────────────────────────────────────────────────────────
const preds = [
  { id: 'P1', landed: t1, what: 'his 175/174/[465]/467 reproduces at his rev under the imported reader' },
  { id: 'P2', landed: t2, what: 'the re-key still loses exactly one member at HEAD, and it is still 465' },
  { id: 'P3', landed: bcAgreeNow, what: 'the as-filed key and the cure still agree on this population 15 days on' },
  { id: 'P4', landed: t4, what: 'the attested measure gained and lost nothing over the interval' },
  { id: 'P5', landed: t5, what: 'the interval carried >=200 commits and >=10 unit dirs and 0 new round dirs' },
  { id: 'P6', landed: t6, what: 'the standing cell still publishes consecutive=2 and fired=false' },
];

console.log('--- legs');
console.log(renderRows(legs).join('\n'));
console.log('');
console.log('--- predictions');
console.log(renderPredRows(preds).join('\n'));
console.log('');
const line = renderVerdict({ legs, preds });
console.log(line);
const red = legs.filter((l) => l.ok === false);
const refused = legs.filter((l) => l.ok === null);
process.exit(red.length || refused.length ? 1 : 0);
