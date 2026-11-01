// unit-464grep — the base rate of the steal mechanism across the whole commit history.
//
// Daedalus's §5 makes the claim the three-site census cannot settle:
//
//   "any `--grep`-keyed selector in this repo is stealable by the prose we write about it, and
//    ours is a tree where we write a great deal of prose quoting our own commit subjects."
//
// The three-site census measures how many selectors exist. It says nothing about whether the
// second clause is true. That clause is an EMPIRICAL claim about this repo's commit messages and
// it has been asserted, not measured — by him and, until this drive, by me.
//
// The measurement: for every commit subject in the repo, does ANY OTHER commit's message contain
// it verbatim? A subject quoted by a LATER commit is a selector that a `--grep` + `-1` key would
// already answer differently. That is the steal, counted, over 4-and-a-half thousand commits.
//
// Usage:
//   node base-rate-of-the-steal.mjs                 full measurement at both thresholds
//   node base-rate-of-the-steal.mjs --cripple=self-blind
//                                                   drop the self-occurrence exclusion
//   node base-rate-of-the-steal.mjs --selftest       KP/CONTROL only, no population figure

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO = resolve(HERE, '../../..');

const ARGS = process.argv.slice(2);
const CRIPPLE = (ARGS.find((a) => a.startsWith('--cripple=')) ?? '').slice('--cripple='.length);
const SELFTEST = ARGS.includes('--selftest');
if (!new Set(['', 'self-blind']).has(CRIPPLE)) {
  console.log(`REFUSED: unknown cripple ${JSON.stringify(CRIPPLE)}`);
  process.exit(2);
}

const git = (...args) => execFileSync('git', ['-C', REPO, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1024 * 1024 * 1024,
});

// ------------------------------------------------- corpus
//
// \u001e between fields, \u001f between records: neither can occur in a commit message, so the
// split is lossless and a record boundary cannot be forged by message content.
const RAW = git('log', '--all', '--format=%H%x1e%ct%x1e%s%x1e%b%x1f');
const records = RAW.split('\u001f').map((r) => r.replace(/^\n/, '')).filter((r) => r.includes('\u001e'));
const commits = records.map((r) => {
  const [sha, ct, subject, ...rest] = r.split('\u001e');
  return { sha, ct: Number(ct), subject, body: rest.join('\u001e') };
});

// One corpus string, one indexOf pass per subject. Per-commit `includes` would be the same
// number of bytes scanned with 20 million extra call frames.
const SEP = '\u0000';
const starts = [];
let corpus = '';
for (const c of commits) {
  starts.push(corpus.length);
  corpus += `${c.subject}\n${c.body}${SEP}`;
}
// offset -> commit index, by binary search over the start offsets.
function ownerOf(off) {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; }
  return lo;
}

// Two kinds of hit, and the first drive conflated them. drive8 is kept as the recording of the
// un-split version; it is the evidence for this defect, not a figure to lift.
//
// A hit inside another commit's SUBJECT field is a COLLISION — two commits with the same
// subject. A hit inside another commit's BODY is a QUOTATION — prose written about it. Both
// steal a `--grep` key, but only the second is the clause under test ("the prose we write about
// it"), and drive8's top twelve were all one spelling of the first: `Merge remote-tracking
// branch 'origin/main'`, 85 identical subjects. Reported undivided, that distribution would have
// been attributed to prose quotation and the headline would have been false.
function quotersOf(subject, selfIdx) {
  const hits = new Map(); // owner -> {subject:bool, body:bool}
  let from = 0;
  for (;;) {
    const j = corpus.indexOf(subject, from);
    if (j < 0) break;
    const owner = ownerOf(j);
    // The self-occurrence is the subject sitting in its own record. Excluding it is the whole
    // measurement: without the exclusion every subject is trivially "quoted" by itself.
    // CRIPPLE `self-blind` removes exactly this line and nothing else.
    if (!(CRIPPLE === 'self-blind') && owner === selfIdx) { from = j + 1; continue; }
    // A subject contains no newline, so a hit starting inside the subject span lies wholly
    // within it; the `\n` after it cannot be crossed by a needle that has none.
    const inSubject = j < starts[owner] + commits[owner].subject.length;
    const e = hits.get(owner) ?? { subject: false, body: false };
    if (inSubject) e.subject = true; else e.body = true;
    hits.set(owner, e);
    from = j + 1;
  }
  return hits;
}

// ------------------------------------------------- KP / CONTROL
//
// A synthetic KP on the MATCHER, driven rather than argued. A real subject is planted inside a
// synthetic record appended to the corpus; the matcher must find it and attribute it to that
// record. CONTROL is the same synthetic record with one character of the subject changed — so
// the two arms differ ONLY in whether the property (verbatim containment) holds.
function kpLegs() {
  const base = commits.find((c) => c.subject.length >= 40);
  if (!base) return { pass: false, why: 'no subject >= 40 chars exists; KP cannot be built' };
  const subj = base.subject;
  const mutated = subj.slice(0, -1) + (subj.slice(-1) === 'x' ? 'y' : 'x');

  const savedCorpus = corpus, savedStarts = starts.slice(), savedLen = commits.length;
  const planted = [];
  for (const [name, text] of [['KP', subj], ['CONTROL', mutated]]) {
    corpus = savedCorpus;
    starts.length = 0; savedStarts.forEach((s) => starts.push(s));
    commits.length = savedLen;
    const synthSubject = `synthetic ${name} record`;
    starts.push(corpus.length);
    // The synthetic record needs a `commits` entry too, or the subject/body split reads
    // `commits[owner]` off the end of the array. Caught by the repair's first drive throwing —
    // and a `catch { continue }` here would have dropped the KP row and shipped green.
    commits.push({ sha: `synthetic-${name}`, ct: 0, subject: synthSubject, body: `quoting: ${text}` });
    corpus += `${synthSubject}\nquoting: ${text}${SEP}`;
    const syntheticIdx = starts.length - 1;
    const q = quotersOf(subj, commits.indexOf(base));
    // The planted text sits in the synthetic record's BODY line, so the KP must be found as a
    // BODY hit specifically — a KP that passed on a subject hit would not carry the property
    // the split exists to measure.
    planted.push({ name, found: q.get(syntheticIdx)?.body === true, quoters: q.size, syntheticIdx });
  }
  corpus = savedCorpus;
  starts.length = 0; savedStarts.forEach((s) => starts.push(s));
  commits.length = savedLen;

  const kp = planted.find((p) => p.name === 'KP');
  const ctl = planted.find((p) => p.name === 'CONTROL');
  return {
    subject: subj, mutatedTail: mutated.slice(-12),
    kpFound: kp.found, ctlFound: ctl.found,
    pass: kp.found === true && ctl.found === false,
  };
}

const kp = kpLegs();
console.log(`cripple:  ${CRIPPLE || '(none)'}`);
console.log(`commits:  ${commits.length}  (git log --all, %H/%ct/%s/%b, \\x1e and \\x1f delimited)`);
console.log(`corpus:   ${corpus.length} chars`);
console.log('');
console.log(`GKP  ${kp.pass ? 'ok ' : 'RED'} planted verbatim subject FOUND=${kp.kpFound} · one-char-mutated CONTROL FOUND=${kp.ctlFound}`);
console.log(`       KP subject: ${JSON.stringify((kp.subject ?? '').slice(0, 70))}${(kp.subject ?? '').length > 70 ? '…' : ''}`);
console.log(`       CONTROL differs from it in the LAST CHARACTER only (tail ${JSON.stringify(kp.mutatedTail ?? '')})`);

if (SELFTEST) {
  console.log('');
  console.log(`SELFTEST  ${kp.pass ? 'GKP ok' : 'GKP RED'} — no base-rate figure published from a --selftest drive.`);
  process.exit(kp.pass ? 0 : 1);
}
if (!kp.pass && CRIPPLE === '') {
  console.log('');
  console.log('REFUSED: GKP RED under the no-cripple arm — the matcher cannot separate a verbatim');
  console.log('         quotation from a one-character mutation, so NO base rate is published.');
  process.exit(2);
}
if (CRIPPLE === 'self-blind') {
  console.log('');
  console.log('*** CRIPPLE ARM — THE FIGURES BELOW ARE VACUOUS BY CONSTRUCTION. ***');
  console.log('    `self-blind` removes the self-occurrence exclusion, so every subject is');
  console.log('    "quoted" by its own record. A quoted-rate near 100% here is an identity.');
}

// ------------------------------------------------- base rate

// Two thresholds, so the headline is not an artefact of one. Short subjects ("fix typo") are
// quoted by coincidence; the claim is about the long, distinctive subjects this track writes.
// FRAGMENT mode. Whole-subject keys turned out never to be quoted (see the 0 below), but the
// one real defect on this track was keyed on a FRAGMENT — "the 375/376 cure landed" is a clause
// out of the middle of a 95-character subject. So the same machinery is run a second time with
// the needle cut down to a prefix of N characters, which is what a selector keyed on part of a
// subject actually looks like. Declared as a separate key, not folded into the headline.
const FRAGMENT = Number((ARGS.find((a) => a.startsWith('--fragment=')) ?? '').slice('--fragment='.length)) || 0;
const needleOf = (subject) => (FRAGMENT > 0 ? subject.slice(0, FRAGMENT) : subject);

const THRESHOLDS = FRAGMENT > 0 ? [FRAGMENT] : [30, 50];
const out = {};
for (const MINLEN of THRESHOLDS) {
  const tested = commits.map((c, i) => ({ ...c, i })).filter((c) => c.subject.length >= MINLEN);
  const rows = [];
  for (const c of tested) {
    const q = quotersOf(needleOf(c.subject), c.i);
    if (q.size === 0) continue;
    const owners = [...q.keys()];
    const isLater = (j) => commits[j].ct > c.ct || (commits[j].ct === c.ct && j < c.i);
    const bodyOwners = owners.filter((j) => q.get(j).body);
    const subjOwners = owners.filter((j) => q.get(j).subject);
    rows.push({
      sha: c.sha.slice(0, 8), subject: c.subject,
      quoters: q.size,
      collision: subjOwners.length, quotation: bodyOwners.length,
      later: owners.filter(isLater).length,
      laterQuotation: bodyOwners.filter(isLater).length,
      laterQuotationShas: bodyOwners.filter(isLater).map((j) => commits[j].sha.slice(0, 8)),
    });
  }
  const quoted = rows.length;
  const anyLater = rows.filter((r) => r.later > 0);
  const byQuotation = rows.filter((r) => r.quotation > 0);
  const byCollisionOnly = rows.filter((r) => r.quotation === 0 && r.collision > 0);
  const laterQuotation = rows.filter((r) => r.laterQuotation > 0);
  out[MINLEN] = {
    tested: tested.length, quoted, stolenShape: anyLater.length,
    byQuotation: byQuotation.length, byCollisionOnly: byCollisionOnly.length,
    laterQuotation: laterQuotation.length, rows,
  };
  const pc = (n) => `${(100 * n / tested.length).toFixed(1)}%`;
  console.log('');
  console.log(FRAGMENT > 0
    ? `FRAGMENT KEY: first ${FRAGMENT} chars of each subject (subjects >= ${MINLEN} chars)`
    : `MINLEN >= ${MINLEN}`);
  console.log(`  subjects tested                            ${tested.length} of ${commits.length}`);
  console.log(`  matched anywhere in another commit         ${quoted}  (${pc(quoted)})   <- drive8's undivided figure`);
  console.log(`    of which: COLLISION only (same subject)  ${byCollisionOnly.length}  (${pc(byCollisionOnly.length)})`);
  console.log(`    of which: QUOTATION (in another BODY)    ${byQuotation.length}  (${pc(byQuotation.length)})  <- the clause under test`);
  console.log(`  QUOTED IN A BODY BY A STRICTLY LATER COMMIT ${laterQuotation.length}  (${pc(laterQuotation.length)})`);
  console.log('     ^ THE figure: a `--grep <subject>` + `-1` selector on one of these already');
  console.log('       answers with a commit other than the one its author meant.');
  // GSUM: the two kinds must partition the matched set. A split whose parts do not add up to
  // the whole is a bucket reached by fall-through, which absorbs every blindness silently.
  const sumOk = byCollisionOnly.length + byQuotation.length === quoted;
  console.log(`  GSUM ${sumOk ? 'ok ' : 'RED'} ${byCollisionOnly.length} + ${byQuotation.length} = ${byCollisionOnly.length + byQuotation.length}, matched ${quoted}`);
  out[MINLEN].sumOk = sumOk;
}

const HEAD_T = 30;
// Ranked by QUOTATION, not by total matches. Ranking by total put twelve merge commits at the
// top of drive8 and buried every real instance of the mechanism below them.
const top = out[HEAD_T].rows.filter((r) => r.laterQuotation > 0)
  .sort((a, b) => b.laterQuotation - a.laterQuotation).slice(0, 15);
console.log('');
console.log(`Subjects QUOTED IN A LATER COMMIT'S BODY, top ${top.length} at MINLEN ${HEAD_T} — the GHAND surface:`);
for (const r of top) {
  console.log(`  later-quot=${String(r.laterQuotation).padStart(3)} collision=${String(r.collision).padStart(3)}  ${r.sha}  ${JSON.stringify(r.subject.slice(0, 86))}`);
  console.log(`        quoted by: ${r.laterQuotationShas.slice(0, 8).join(' ')}${r.laterQuotationShas.length > 8 ? ' …' : ''}`);
}

// GMONO: a higher threshold selects a SUBSET, so its counts cannot exceed the lower one's.
// A gate on a figure the data can actually move, not a restatement of the rule.
// In FRAGMENT mode there is only one threshold, so the leg is declared NOT APPLICABLE in those
// words rather than quietly reading `true` — a leg a run cannot reach must not score green.
const mono = FRAGMENT > 0 ? null
  : (out[50].tested <= out[30].tested && out[50].quoted <= out[30].quoted
    && out[50].stolenShape <= out[30].stolenShape
    && out[50].laterQuotation <= out[30].laterQuotation);
console.log('');
if (mono === null) {
  console.log('GMONO N/A  fragment mode drives a single threshold; the subset leg is unreachable here');
} else {
  console.log(`GMONO ${mono ? 'ok ' : 'RED'} MINLEN 50 is a subset of MINLEN 30: tested ${out[50].tested}<=${out[30].tested}, matched ${out[50].quoted}<=${out[30].quoted}, later ${out[50].stolenShape}<=${out[30].stolenShape}, later-quotation ${out[50].laterQuotation}<=${out[30].laterQuotation}`);
}
const sumsOk = THRESHOLDS.every((t) => out[t].sumOk);

writeFileSync(`${HERE}/base-rate.json`, JSON.stringify({
  cripple: CRIPPLE || null, commits: commits.length, corpusChars: corpus.length,
  gkp: { pass: kp.pass, kpFound: kp.kpFound, ctlFound: kp.ctlFound, subject: kp.subject },
  thresholds: Object.fromEntries(THRESHOLDS.map((t) => [t, {
    tested: out[t].tested, quoted: out[t].quoted, stolenShape: out[t].stolenShape,
    byQuotation: out[t].byQuotation, byCollisionOnly: out[t].byCollisionOnly,
    laterQuotation: out[t].laterQuotation, sumOk: out[t].sumOk, rows: out[t].rows,
  }])),
  gmono: mono, gsum: sumsOk,
}, null, 2) + '\n');

const verdict = kp.pass && (mono === null || mono) && sumsOk;
console.log('');
// Derived from the leg states, not typed. The first version of this line read "GMONO ok" in
// fragment mode, where GMONO is unreachable — a closure sentence asserting a leg the run never
// drove, printed beside the N/A that says so.
const legWord = `GKP ok, GMONO ${mono === null ? 'N/A (unreachable in fragment mode)' : 'ok'}, GSUM ok at ${THRESHOLDS.length} threshold(s): ${THRESHOLDS.join(',')}`;
console.log(`BASERATEVERDICT/${verdict ? 0 : 1}  ${verdict ? legWord : 'see the RED line above'}`);
process.exit(verdict ? 0 : 1);
