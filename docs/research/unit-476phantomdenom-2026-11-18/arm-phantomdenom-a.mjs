/**
 * unit-476phantomdenom — arm A
 *
 * Subject: Daedalus's 11/18 §4 routed item. Does any published figure of mine count
 * `kind: 'refused'` members of `scripts/lib/decl-body.mjs` as a population of declarations, and
 * did his cure (`7e8b4ab1`, this morning) move one of my published figures?
 *
 * The denominator under test is `unit-472publishedfigure`'s CONTROL population, published in
 * `drive5.arma.out` as "287 declarations · IDENTICAL 234 · DIFFERS 53".
 *
 * METHOD NOTES, which are the part worth reading:
 *   - The shared reader is NEVER edited (pre-reg R1). The pre-cure counterfactual is the blob at
 *     `7e8b4ab1^` read out of git into `precure/decl-body.precure.mjs`; `precure/strip-source.mjs`
 *     is HEAD's copy, and HEAD's copy IS the pre-cure copy (`git log 7e8b4ab1^..HEAD --
 *     scripts/lib/strip-source.mjs` is empty), so decl-body is the only variable.
 *   - EVERY figure this arm compares against is CAPTURED by regex out of a recorded drive output,
 *     never typed into this file. A capture that matches nothing is an UNRESOLVED refusal, not a
 *     fallback. (An answer key can be stale relative to its subject; a typed one cannot even be
 *     wrong out loud.)
 *   - The refusal-reason key for the 534-member arrow class is likewise captured out of the
 *     pre-cure blob's own `refuse('…')` call sites, not typed from the memo.
 */

import { readFileSync } from 'node:fs';
import { declBodies as declBodiesHead } from '../../../scripts/lib/decl-body.mjs';
import { declBodies as declBodiesPre } from './precure/decl-body.precure.mjs';

const UNIT = 'docs/research/unit-476phantomdenom-2026-11-18';
const PUBLISHED = 'docs/research/unit-472publishedfigure-2026-11-17/drive5.arma.out';
const AT_HEAD = `${UNIT}/drive1.redrive472-at-head.out`;
const PRECURE_BLOB = `${UNIT}/precure/decl-body.precure.mjs`;

const red = [];
const refused = [];
const out = [];
const check = (name, ok, why) => {
  if (!ok) red.push(`${name}: ${why}`);
  return ok;
};

/* ---------------------------------------------------------------- *
 * CAPTURE the two sets of control figures out of the two drives.
 * ---------------------------------------------------------------- */

/** @param {string} text @param {string} label */
const controlFigures = (text, label) => {
  const nSub = /NOT selected on the defect: (\d+) declarations/.exec(text);
  const nFiles = /instruments read, NOT selected/.test(text)
    ? /every block declaration in the (\d+) subject file\(s\)/.exec(text)
    : null;
  const ident = /\n {6}IDENTICAL {2}(\d+)/.exec(text);
  const diff = /\n {6}DIFFERS {4}(\d+)/.exec(text);
  if (!nSub || !nFiles || !ident || !diff) {
    refused.push(`CAPTURE-FAILED for ${label}: decls=${!!nSub} files=${!!nFiles} ident=${!!ident} differs=${!!diff}`);
    return null;
  }
  return {
    decls: Number(nSub[1]), files: Number(nFiles[1]),
    identical: Number(ident[1]), differs: Number(diff[1]),
  };
};

const pub = controlFigures(readFileSync(PUBLISHED, 'utf8'), 'published drive5 (11/17)');
const head = controlFigures(readFileSync(AT_HEAD, 'utf8'), 're-drive at HEAD (11/18)');

if (pub === null || head === null) {
  console.log(`RED legs=1 red=[CAPTURE: a control figure did not resolve] refused=[${refused.join(' | ')}]`);
  process.exit(1);
}

/* ---------------------------------------------------------------- *
 * B1 — the 26 control subjects, captured from the drive's own
 * printed triple lines, cross-checked against the count the drive
 * itself states. A list that does not reproduce at the stated count
 * is a REFUSAL (pre-reg R4), not a quietly smaller population.
 * ---------------------------------------------------------------- */

const headText = readFileSync(AT_HEAD, 'utf8');
const subjects = new Set();
for (const line of headText.split('\n')) {
  const m = /^ {18}(?:READ|DIFFERS \[[a-z-]+\]|IMPORT-ONLY) +(\S+): /.exec(line)
    ?? /^ {6}UNRESOLVED (\S+): /.exec(line);
  if (m) subjects.add(m[1]);
}
const subjectList = [...subjects].sort();

check(
  'B1',
  subjectList.length === head.files,
  `captured ${subjectList.length} distinct control subject(s) from the drive's printed triples, but the drive states ${head.files} subject file(s) — the capture does not reproduce the population it is about`,
);
if (subjectList.length !== head.files) {
  refused.push(`SUBJECT-LIST UNRESOLVED (${subjectList.length} captured vs ${head.files} stated) — every figure below is withdrawn`);
  console.log(`RED legs=${red.length} red=[${red.join(' | ')}] refused=[${refused.join(' | ')}]`);
  process.exit(1);
}

/* ---------------------------------------------------------------- *
 * The two readings over the SAME 26 files, same bytes, two readers.
 * Keyed on `parenOpen` — the head's own character offset — which is
 * stable across the two readers because the source text is identical
 * on both sides. A name key would collide; a body-offset key cannot
 * tell a cured span from a moved one (Daedalus's P4 defect, 11/18 §5).
 * ---------------------------------------------------------------- */

/** @param {(src: string) => any[]} reader */
const readAll = (reader) => {
  const byFile = new Map();
  for (const p of subjectList) {
    let src;
    try { src = readFileSync(p, 'utf8'); } catch { byFile.set(p, null); continue; }
    const m = new Map();
    for (const d of reader(src)) m.set(d.parenOpen, d);
    byFile.set(p, m);
  }
  return byFile;
};

const atHead = readAll(declBodiesHead);
const atPre = readAll(declBodiesPre);

const unreadable = subjectList.filter((p) => atHead.get(p) === null);
if (unreadable.length > 0) refused.push(`${unreadable.length} control subject(s) unreadable in this worktree: ${unreadable.join(', ')}`);

const tally = (byFile) => {
  const t = { block: 0, concise: 0, refused: 0, other: 0, total: 0 };
  for (const m of byFile.values()) {
    if (m === null) continue;
    for (const d of m.values()) {
      t.total++;
      if (d.kind === 'block' || d.kind === 'concise' || d.kind === 'refused') t[d.kind]++;
      else t.other++;
    }
  }
  return t;
};

const tHead = tally(atHead);
const tPre = tally(atPre);

/* ---------------------------------------------------------------- *
 * B2 — THE PROOF OF P1, mechanical rather than by reading the filter.
 * `arm-publishedfigure-a.mjs:318` drops every member whose kind is not
 * `block`. If that is true, the published denominator must equal the
 * `block` count over the same files, EXACTLY — and the refused members
 * over those files are the phantom population it did NOT carry.
 * ---------------------------------------------------------------- */

check(
  'B2',
  tHead.block === head.decls,
  `the HEAD denominator the old arm reports is ${head.decls} but declBodies returns ${tHead.block} block member(s) over the same ${subjectList.length} files — the denominator is NOT the block set, so what it is made of is unknown`,
);

/* ---------------------------------------------------------------- *
 * B3 — can a §4 phantom LEAK as `block`? This is the single reading
 * that would make the routed item land as routed, so it is driven
 * with a planted known positive rather than reasoned about.
 *
 * §4's phantom is `const NAME = (` matching a parenthesised
 * INITIALISER. The IIFE spelling `const x = (function () { … })();`
 * is the form where such a head is followed by a real brace.
 * ---------------------------------------------------------------- */

const KP_IIFE = 'const kpIife = (function () { return 1; })();\n';
const kpRead = [...declBodiesHead(KP_IIFE)];
const kpKinds = kpRead.map((d) => d.kind);
check(
  'B3a',
  kpRead.length > 0,
  'the planted IIFE known positive produced NO member at all — the phantom-leak question is ungradeable because the head key did not match it',
);
const kpLeaks = kpKinds.includes('block');

// If the KP leaks, the phantom class CAN reach a block-only denominator, and the live count over
// the 26 subjects is what matters. Keyed on the head text, captured from the file, never typed.
let liveIife = 0;
const liveIifeSites = [];
for (const p of subjectList) {
  const m = atHead.get(p);
  if (m === null) continue;
  const src = readFileSync(p, 'utf8');
  for (const d of m.values()) {
    if (d.kind !== 'block') continue;
    const lineStart = src.lastIndexOf('\n', d.parenOpen) + 1;
    const headText2 = src.slice(lineStart, d.parenOpen + 1);
    if (/=\s*\($/.test(headText2)) {
      liveIife++;
      liveIifeSites.push(`${p}: ${src.slice(lineStart, d.parenOpen + 1).trim()}`);
    }
  }
}

check(
  'B3b',
  !kpLeaks || liveIife === 0,
  `the phantom form CAN read as block (KP kinds ${kpKinds.join(',')}) AND ${liveIife} live site(s) in the 26 control subjects carry it — the published denominator IS contaminated: ${liveIifeSites.slice(0, 5).join(' | ')}`,
);

/* ---------------------------------------------------------------- *
 * B4 — ATTRIBUTION of the movement. For every member that is `block`
 * at HEAD, what was it before the cure? The reason strings are
 * captured out of the pre-cure blob's own `refuse('…')` sites.
 * ---------------------------------------------------------------- */

const blobSrc = readFileSync(PRECURE_BLOB, 'utf8');
const reasonLiterals = [...blobSrc.matchAll(/refuse\('([a-z-]+)'\)/g)].map((m) => m[1]);
const arrowReason = reasonLiterals.find((r) => r.includes('arrow'));
const retTypeReason = reasonLiterals.find((r) => r.includes('no-body-brace-after-the-return-type'));
if (!arrowReason) refused.push(`CAPTURE-FAILED: no refuse('…arrow…') literal in the pre-cure blob — the 534-class key is UNRESOLVED and P4 cannot be graded`);

const transitions = new Map();
const newlyBlock = [];
for (const p of subjectList) {
  const h = atHead.get(p); const q = atPre.get(p);
  if (h === null || q === null) continue;
  for (const [off, d] of h) {
    if (d.kind !== 'block') continue;
    const before = q.get(off);
    const was = before === undefined ? 'ABSENT-PRE-CURE'
      : before.kind === 'block' ? 'block'
      : `${before.kind}:${before.reason ?? '<none>'}`;
    transitions.set(was, (transitions.get(was) ?? 0) + 1);
    if (was !== 'block') newlyBlock.push({ file: p, name: d.name, off, was });
  }
}

const delta = head.decls - pub.decls;
check(
  'B4a',
  newlyBlock.length === delta,
  `the published-to-HEAD denominator delta is ${delta} (${pub.decls} → ${head.decls}) but ${newlyBlock.length} member(s) are newly block under the two readers — the movement is not fully attributable to the cure, so some of it is the TREE and not the reader`,
);

const arrowAttributed = arrowReason
  ? newlyBlock.filter((n) => n.was === `refused:${arrowReason}`).length
  : null;

check(
  'B4b',
  arrowReason === undefined || arrowAttributed === 0,
  `P4 REFUTED: ${arrowAttributed} of the ${newlyBlock.length} newly-gradeable member(s) were refused pre-cure as '${arrowReason}' — the headline 534-member class DOES reach this denominator, contrary to the prediction that a concise-bodied class cannot`,
);

/* ---------------------------------------------------------------- *
 * B5 — P5: the DIFFERS ratio, both figures captured.
 * ---------------------------------------------------------------- */

const rPub = pub.differs / pub.decls;
const rHead = head.differs / head.decls;
const ppMove = Math.abs(rHead - rPub) * 100;
check('B5', ppMove < 5, `the DIFFERS share moved ${ppMove.toFixed(2)}pp (${(rPub * 100).toFixed(2)}% → ${(rHead * 100).toFixed(2)}%), over the 5pp registered floor`);

/* ---------------------------------------------------------------- *
 * B6 — the phantom population my denominator did NOT carry. Not a
 * pass/fail: the figure the routed item is about, over MY 26 files.
 * ---------------------------------------------------------------- */

check(
  'B6',
  tHead.refused > 0 || tPre.refused === 0,
  `0 refused members over the 26 control subjects at HEAD while ${tPre.refused} existed pre-cure — a reading of 0 with a non-zero before means the reader is not being driven, not that the corpus is clean`,
);

/* ---------------------------------------------------------------- *
 * REPORT
 * ---------------------------------------------------------------- */

out.push('unit-476phantomdenom arm A — does my published denominator carry refused members, and did the cure move it?');
out.push(`  control subjects (captured, cross-checked against the drive's own count): ${subjectList.length}`);
out.push('');
out.push('  THE DENOMINATOR, published vs re-driven at HEAD:');
out.push(`      published 11/17   ${pub.decls} declarations · IDENTICAL ${pub.identical} · DIFFERS ${pub.differs}  (${(rPub * 100).toFixed(2)}% DIFFERS)`);
out.push(`      HEAD      11/18   ${head.decls} declarations · IDENTICAL ${head.identical} · DIFFERS ${head.differs}  (${(rHead * 100).toFixed(2)}% DIFFERS)`);
out.push(`      delta             ${delta >= 0 ? '+' : ''}${delta} declarations · ratio moved ${ppMove.toFixed(2)}pp`);
out.push('');
out.push('  KIND TALLY over the same 26 files, same bytes, two readers:');
out.push(`      pre-cure (7e8b4ab1^)  total ${tPre.total}  block ${tPre.block}  concise ${tPre.concise}  refused ${tPre.refused}  other ${tPre.other}`);
out.push(`      HEAD                  total ${tHead.total}  block ${tHead.block}  concise ${tHead.concise}  refused ${tHead.refused}  other ${tHead.other}`);
out.push(`      ^ the published denominator is the BLOCK column. The REFUSED column is the phantom`);
out.push(`        population it would have carried had the kind filter been absent: ${tPre.refused} pre-cure, ${tHead.refused} now.`);
out.push('');
out.push('  B4 ATTRIBUTION — what each HEAD block member was before the cure:');
for (const [was, n] of [...transitions].sort((a, b) => b[1] - a[1])) out.push(`      ${String(n).padStart(4)}  ${was}`);
out.push('');
out.push(`  NEWLY GRADEABLE (not block pre-cure, block now): ${newlyBlock.length}`);
for (const n of newlyBlock) out.push(`      ${n.file}: ${n.name} — was ${n.was}`);
out.push('');
out.push(`  B3 phantom-leak probe: planted IIFE KP read as [${kpKinds.join(',')}]; leaks=${kpLeaks}; live \`= (\`-initialised block heads in the 26 subjects: ${liveIife}`);
for (const s of liveIifeSites.slice(0, 10)) out.push(`      ${s}`);
out.push(`  reason literals captured from the pre-cure blob: ${reasonLiterals.join(', ')}`);
out.push(`  arrow-class key: ${arrowReason ?? 'UNRESOLVED'} · return-type-class key: ${retTypeReason ?? 'UNRESOLVED'}`);
out.push(`  of the ${newlyBlock.length} newly gradeable, attributed to the arrow class: ${arrowAttributed ?? 'UNGRADEABLE'}`);

console.log(out.join('\n'));
console.log(`${red.length === 0 ? 'ok' : 'RED'} legs=${red.length} red=[${red.join(' | ')}] refused=[${refused.join(' | ')}]`);
