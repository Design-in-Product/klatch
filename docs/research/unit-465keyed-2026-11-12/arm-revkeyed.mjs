#!/usr/bin/env node
/**
 * unit-465keyed-2026-11-12 drive2 — the rev-keyed arm. ADDITIVE: `verify-keyed-figures.mjs` is not
 * edited, so drive1's grading stands.
 *
 * Q1-Q5 are pre-registered in PRE-REGISTRATION-addendum.md, pushed before this file existed.
 *
 * Every round attribution is read by importing the subject module's readers. The one reader typed
 * here is the CANDIDATE sixth source over `docs/mail/`, which does not exist in the module yet.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  attestedRounds, classifyPath, git, DENIAL_RE, SUBJECT_ROUND_RE,
} from '../lib/attested-rounds.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const HIS_REV = '3ee13880';        // the rev his §5 enumeration was taken at
const MY_REV = '69cf9167';         // the rev my memo's figures were taken at
const MY_DRIVE_REV = '684dea64';   // the rev my attestdenial drive ran at (where 83 was taken)
const FLOOR = 292;

const legs = [];
const say = (s) => console.log(s);
const check = (id, ok, note) => {
  legs.push({ id, ok, note });
  say(`  ${ok === null ? 'REFUSED' : ok ? 'ok     ' : 'RED    '} ${id}  ${note}`);
};
const setDiff = (a, b) => [...a].filter((x) => !b.has(x)).sort((x, y) => x - y);

const headRev = (git(REPO, ['rev-parse', 'HEAD']) ?? '').trim() || null;

say('=== VERIFY/465-keyed drive2 — rev-keyed: whose figure was right where, and how the member got in ===');
say(`HEAD_REV     ${headRev ?? '(refused)'}`);
say(`HIS_REV      ${HIS_REV}   MY_REV ${MY_REV}   MY_DRIVE_REV ${MY_DRIVE_REV}`);
say(`CLOCK        ${new Date().toISOString()}`);
say('');

const pop = (rev) => attestedRounds(REPO, rev, { denialRe: DENIAL_RE });
const pHis = pop(HIS_REV);
const pHead = headRev === null ? null : pop(headRev);

// --- Q1 -------------------------------------------------------------------
say('--- [MEAS] Q1 — the population move, as a set difference both ways');
if (pHis === null || pHead === null) {
  check('Q1a', null, 'a population read refused');
  check('Q1b', null, 'a population read refused');
} else {
  const gained = setDiff(pHead.filtered, pHis.filtered);
  const lost = setDiff(pHis.filtered, pHead.filtered);
  say(`  M-move  |filtered| ${pHis.filtered.size} @${HIS_REV} → ${pHead.filtered.size} @${headRev.slice(0, 8)}  gained=[${gained}] lost=[${lost}]`);
  const q1a = gained.length === 1 && gained[0] === 9;
  check('Q1a', q1a, `gained=[${gained}], predicted exactly [9]`);
  const q1b = lost.length === 0;
  check('Q1b', q1b, `lost=[${lost}], predicted []`);
}
say('');

// --- Q2 -------------------------------------------------------------------
say('--- [MEAS] Q2 — which commit subjects in the interval attest the member');
const rangeLog = git(REPO, ['log', '--format=%H%x1f%s', `${HIS_REV}..HEAD`]);
if (rangeLog === null) {
  check('Q2a', null, `git log ${HIS_REV}..HEAD refused`);
  check('Q2b', null, `git log ${HIS_REV}..HEAD refused`);
} else {
  const rows = rangeLog.split('\n').filter(Boolean).map((l) => {
    const [hash, subject = ''] = l.split('\x1f');
    const sm = SUBJECT_ROUND_RE.exec(subject);
    const dm = DENIAL_RE.exec(subject);
    return { hash, subject, round: sm ? Number(sm[1]) : null, denies: dm ? Number(dm[1]) : null };
  });
  const attest9 = rows.filter((r) => r.round === 9);
  const denies9 = attest9.filter((r) => r.denies === 9);
  say(`  M-range  commits in ${HIS_REV}..HEAD = ${rows.length}`);
  for (const r of attest9) {
    say(`  M-attest  ${r.hash.slice(0, 8)}  denies=${r.denies}  ${r.subject.slice(0, 96)}`);
  }
  const q2a = attest9.length >= 1;
  check('Q2a', q2a, `subjects attesting the member = ${attest9.length} (${attest9.map((r) => r.hash.slice(0, 8)).join(',') || 'none'}), predicted >=1`);
  const q2b = denies9.length === 0;
  check('Q2b', q2b, `of those, denials = ${denies9.length}, predicted 0 (a denial would have dropped it back out)`);
}
say('');

// --- Q3 -------------------------------------------------------------------
say('--- [MEAS] Q3 — is the membership subject-only');
if (pHead === null) {
  check('Q3', null, 'population at HEAD refused');
} else {
  const inNonSubject = pHead.nonSubject.has(9);
  const inAffirmed = pHead.affirmedBySubject.has(9);
  say(`  M-prov  9: nonSubject=${inNonSubject} affirmedBySubject=${inAffirmed} denied=${pHead.deniedRounds.has(9)}`);
  const q3 = inNonSubject === false && inAffirmed === true;
  check('Q3', q3, `nonSubject=${inNonSubject} affirmed=${inAffirmed}, predicted false/true — subject-only, so a later denial subject can drop it out again`);
}
say('');

// --- Q4 -------------------------------------------------------------------
say('--- [MEAS] Q4 — each dir figure at its own rev');
function unitDirs(rev) {
  const tree = git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const byDir = new Map();
  for (const p of tree.split('\n')) {
    const c = classifyPath(p);
    if (c.source !== 'S5') continue;
    const dir = p.split('/').slice(0, 3).join('/');
    if (!byDir.has(dir)) byDir.set(dir, c.round);
  }
  return byDir;
}
const dHis = unitDirs(HIS_REV);
const dMine = unitDirs(MY_REV);
const dMyDrive = unitDirs(MY_DRIVE_REV);
if (dHis === null || dMine === null || dMyDrive === null) {
  check('Q4a', null, 'a tree read refused');
  check('Q4b', null, 'a tree read refused');
  check('Q4c', null, 'a tree read refused');
} else {
  const addedAtMyDrive = [...dMyDrive.keys()].filter((d) => !dMine.has(d));
  say(`  M-dirs  @${HIS_REV}=${dHis.size}  @${MY_REV}=${dMine.size}  @${MY_DRIVE_REV}=${dMyDrive.size}  added ${MY_REV}..${MY_DRIVE_REV}=${addedAtMyDrive.length}`);
  const q4a = dHis.size === 92;
  check('Q4a', q4a, `his standing dirs @${HIS_REV} = ${dHis.size}, predicted 92`);
  const q4b = dMine.size === 8;
  check('Q4b', q4b, `dirs @${MY_REV} = ${dMine.size}, predicted 8`);
  const q4c = addedAtMyDrive.length === 83;
  check('Q4c', q4c, `my interval dirs @${MY_DRIVE_REV} = ${addedAtMyDrive.length}, predicted 83`);
}
say('');

// --- Q5 -------------------------------------------------------------------
say('--- [MEAS] Q5 — the candidate sixth source, priced at his rev and at HEAD');
const MAIL_ROUND_RE = /round(\d+)/;
function mailAdds(rev, p) {
  const tree = git(REPO, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null || p === null) return null;
  const rounds = new Set();
  for (const q of tree.split('\n')) {
    if (!q.startsWith('docs/mail/')) continue;
    const m = MAIL_ROUND_RE.exec(q);
    if (m) rounds.add(Number(m[1]));
  }
  return { rounds, added: setDiff(rounds, p.filtered) };
}
const mHis = mailAdds(HIS_REV, pHis);
const mHead = headRev === null ? null : mailAdds(headRev, pHead);
if (mHis === null || mHead === null) {
  check('Q5a', null, 'a mail read refused');
  check('Q5b', null, 'a mail read refused');
} else {
  say(`  M-mail  @${HIS_REV}: distinct=${mHis.rounds.size} adds=[${mHis.added}]  ·  @${headRev.slice(0, 8)}: distinct=${mHead.rounds.size} adds=[${mHead.added}]`);
  const q5a = mHis.added.length === 1 && mHis.added[0] === 9;
  check('Q5a', q5a, `adds at HIS rev = [${mHis.added}], predicted [9] — his price was right when he took it`);
  const q5b = mHead.added.length === 0;
  check('Q5b', q5b, `adds at HEAD = [${mHead.added}], predicted [] — and it is zero now`);
}
say('');

say(`  (floor context: the member is ${9 < FLOOR ? 'below' : 'at or above'} the ${FLOOR} floor, so no above-floor figure moves either way)`);
const red = legs.filter((l) => l.ok === false).map((l) => l.id);
const refused = legs.filter((l) => l.ok === null).map((l) => l.id);
const verdict = red.length === 0 && refused.length === 0 ? 'GREEN' : 'RED';
say(`VERDICT/${verdict === 'GREEN' ? 0 : 1} ${verdict} legs=${legs.length} red=[${red}] refused=[${refused}]`);
process.exit(verdict === 'GREEN' ? 0 : 1);
