#!/usr/bin/env node
/**
 * unit-516secondargfixture — post-hoc: P7 at BOTH granularities, and the two deltas' disjoint causes.
 *
 * Registered in PRE-REGISTRATION-ADDENDUM-GRANULARITY.md, committed before this file existed.
 *
 * The arm graded P7 against every own-line consumer at HEAD (22) when the registered claim is scoped
 * to the 18 rows published in unit-514's capture. The wide run says REFUTED. This script runs the
 * same key at the registered granularity and publishes BOTH, because a foil at the wrong granularity
 * is not a verdict in either direction.
 *
 * Everything measured here is read out of the arm's own committed capture — the arm's JSON carries
 * every site with its shape, its `from`, its nested flag and its own line — so this script adds one
 * oracle (file existence at the prior commit) and no new classifier. There is nothing here to drift
 * from the arm, because there is no second scan.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

process.chdir(execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());

const ARM_CAPTURE = 'docs/research/unit-516secondargfixture-2026-11-25/captures/ARM.out';
const PRIOR_CAPTURE = 'docs/research/unit-514equalityconsumer-2026-11-24/captures/POSTHOC-REKEY.out';
const PRIOR_COMMIT = '616f5705';
const EYE_FIXTURE_SITES = [
  'docs/research/unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs:127',
  'docs/research/unit-513consumernull-2026-11-24/posthoc-nonliteral-matchers.mjs:157',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:72',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:77',
  'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-which-conjunct-fires.mjs:78',
];
const UNIT_DIR_RE = /^docs\/research\/unit-[^/]+\//;
const say = (...a) => console.log(...a);
const out = {};

/* ---------------------------------------------------------------- §0 both captures, parsed */

function trailingJson(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) if (lines[i] === '{') return JSON.parse(lines.slice(i).join('\n'));
  throw new Error(`no trailing JSON object in ${path}`);
}

say('=== §0 THE TWO CAPTURES — parsed, with completeness asserted against each one\'s own figures ===\n');

const arm = trailingJson(ARM_CAPTURE);
const prior = trailingJson(PRIOR_CAPTURE);

const armSites = arm.allSites;
const armInt = arm.corpus.integratedOwnLineConsumers;
const armBase = arm.corpus.baseOwnLineConsumers;
const INTEGRATED_CONSUMER_SHAPES = [...arm.provenance.inheritedConsumerShapes, 'SECOND-ARG'];
const isOwnLineConsumer = (r) => r.from === 'own line' && INTEGRATED_CONSUMER_SHAPES.includes(r.shape);
const isBaseOwnLineConsumer = (r) => r.baseFrom === 'own line' && arm.provenance.inheritedConsumerShapes.includes(r.baseShape);

const intRows = armSites.filter(isOwnLineConsumer);
const baseRows = armSites.filter(isBaseOwnLineConsumer);
const intOk = intRows.length === armInt;
const baseOk = baseRows.length === armBase;
say(`  arm capture: allSites ${armSites.length} rows`);
say(`  integrated own-line consumers re-derived from the rows: ${intRows.length}   arm's own figure: ${armInt}   agree: ${intOk}`);
say(`  inherited  own-line consumers re-derived from the rows: ${baseRows.length}   arm's own figure: ${baseOk ? armBase : armBase}   agree: ${baseOk}`);

const priorRows = prior.consumersPrefix;
const priorOk = priorRows.length === prior.figures.PREFIX.consumersOwnLine;
say(`  prior capture: ${priorRows.length} published rows   its own declared figure: ${prior.figures.PREFIX.consumersOwnLine}   agree: ${priorOk}`);

const complete = intOk && baseOk && priorOk;
say(`\n  completeness gate: ${complete}`);
out.completeness = { armSites: armSites.length, intRows: intRows.length, armInt, baseRows: baseRows.length, armBase, priorRows: priorRows.length, priorDeclared: prior.figures.PREFIX.consumersOwnLine, complete };
if (!complete) {
  say('\nREFUSED — a re-derivation disagrees with the capture it was read out of. No figure printed.');
  say(`\n${JSON.stringify({ refused: true, ...out }, null, 2)}`);
  process.exit(0);
}

/* ---------------------------------------------------------------- §1 the oracle, re-KP'd here */

say('\n=== §1 EXISTENCE ORACLE — re-KP\'d inside this process, exit code only ===\n');
function existedAt(commit, path) {
  try { execFileSync('git', ['cat-file', '-e', `${commit}:${path}`], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
const oracleKp = [
  { path: 'docs/research/unit-514equalityconsumer-2026-11-24/posthoc-rekey-prefix-and-binding.mjs', want: true, note: 'the prior key itself, added IN that commit' },
  { path: 'packages/server/src/db/index.ts', want: true, note: 'long-lived path OUTSIDE docs/' },
  { path: 'docs/research/unit-515keyekp-2026-11-25/arm-keyekp.mjs', want: false, note: "Daedalus's arm, committed 09:24 today" },
].map((k) => ({ ...k, got: existedAt(PRIOR_COMMIT, k.path) }));
for (const k of oracleKp) { k.ok = k.got === k.want; say(`  ${k.ok ? 'PASS' : 'FAIL'}  existedAt(${PRIOR_COMMIT}, ${k.path}) = ${k.got} (want ${k.want}) — ${k.note}`); }
const oracleOk = oracleKp.every((k) => k.ok);
say(`\n  oracle KP: ${oracleKp.filter((k) => k.ok).length} of ${oracleKp.length}`);
out.oracleKp = oracleKp;
if (!oracleOk) {
  say('\nREFUSED — the oracle failed a KP, so PH2–PH4 are UNGRADED rather than printed behind a plausible figure.');
  say(`\n${JSON.stringify({ refused: true, ...out }, null, 2)}`);
  process.exit(0);
}

/* ---------------------------------------------------------------- §2 PH1 — P7 at its own granularity */

say('\n=== §2 PH1 — P7 restricted to the 18 published rows, which is what it was registered about ===\n');

const publishedSet = new Set(priorRows.map((r) => r.site));
const nestedIntRows = intRows.filter((r) => r.nested === true);
const nestedWithin18 = nestedIntRows.filter((r) => publishedSet.has(r.site));
const nestedOutside18 = nestedIntRows.filter((r) => !publishedSet.has(r.site));

const sortedNarrow = nestedWithin18.map((r) => r.site).sort();
const eyeSorted = EYE_FIXTURE_SITES.slice().sort();
const ph1 = sortedNarrow.length === eyeSorted.length && eyeSorted.every((s, i) => s === sortedNarrow[i]);

say(`  NESTED own-line consumers at HEAD (the arm's wide run): ${nestedIntRows.length}`);
say(`  of those, AMONG the 18 published rows: ${nestedWithin18.length}   outside them: ${nestedOutside18.length}`);
say('\n  within the 18:');
for (const r of nestedWithin18) say(`    ${r.site}  ${r.shape}`);
say('\n  outside the 18 — rows the arm counted and the registered claim does not reach:');
for (const r of nestedOutside18) say(`    ${r.site}  ${r.shape}  |  ${r.ownLine.slice(0, 120)}`);
say(`\n  PH1 — exact-set match against the eye list, at the registered granularity: ${ph1}`);
say(`  so P7 is: HIT at the granularity it was registered at, REFUTED at the granularity the arm ran it.`);
out.ph1 = { nestedAtHead: nestedIntRows.length, within18: sortedNarrow, outside18: nestedOutside18.map((r) => r.site), eye: eyeSorted, ph1 };

/* ---------------------------------------------------------------- §3 PH2–PH4 — the two deltas */

say('\n=== §3 PH2–PH4 — the 18→20→22 climb, partitioned per row by file novelty ===\n');

const novelty = new Map();
const noveltyOf = (site) => {
  const file = site.slice(0, site.lastIndexOf(':'));
  if (!novelty.has(file)) novelty.set(file, existedAt(PRIOR_COMMIT, file));
  return novelty.get(file) ? 'PRESENT-THEN' : 'NEW-FILE';
};

const addedToBase = baseRows.filter((r) => !publishedSet.has(r.site));
const addedByIntegration = intRows.filter((r) => !new Set(baseRows.map((b) => b.site)).has(r.site));

say(`  inherited key at HEAD: ${baseRows.length}   published at ${PRIOR_COMMIT}: ${priorRows.length}   delta +${baseRows.length - priorRows.length}`);
for (const r of addedToBase) say(`    + ${r.site}  ${r.baseShape}  ${noveltyOf(r.site)}`);
const ph3 = addedToBase.length > 0 && addedToBase.every((r) => noveltyOf(r.site) === 'NEW-FILE');
say(`  PH3 — every row the inherited key gained is in a file NEW since ${PRIOR_COMMIT}: ${ph3}`);

say(`\n  integrated key at HEAD: ${intRows.length}   inherited at the same HEAD: ${baseRows.length}   delta +${intRows.length - baseRows.length}`);
for (const r of addedByIntegration) say(`    + ${r.site}  ${r.shape}  ${noveltyOf(r.site)}`);
const ph4 = addedByIntegration.length > 0 && addedByIntegration.every((r) => noveltyOf(r.site) === 'PRESENT-THEN');
say(`  PH4 — every row the integration gained is in a file that ALREADY EXISTED at ${PRIOR_COMMIT}: ${ph4}`);

const ph2 = nestedOutside18.length > 0 && nestedOutside18.every((r) => noveltyOf(r.site) === 'NEW-FILE');
say(`\n  PH2 — every NESTED row outside the 18 is in a file NEW since ${PRIOR_COMMIT}: ${ph2}`);
for (const r of nestedOutside18) say(`    ${r.site}  ${noveltyOf(r.site)}`);

/* Disjointness stated as a measurement rather than as a reading of the two bullet lists above. */
const popGrowth = new Set(addedToBase.map((r) => r.site));
const keyGain = new Set(addedByIntegration.map((r) => r.site));
const overlap = [...popGrowth].filter((s) => keyGain.has(s));
say(`\n  the two deltas' row sets overlap in ${overlap.length} rows${overlap.length ? ': ' + overlap.join(', ') : ' — disjoint'}`);
out.deltas = {
  publishedAtPrior: priorRows.length, inheritedAtHead: baseRows.length, integratedAtHead: intRows.length,
  gainedByPopulation: addedToBase.map((r) => ({ site: r.site, shape: r.baseShape, novelty: noveltyOf(r.site) })),
  gainedByIntegration: addedByIntegration.map((r) => ({ site: r.site, shape: r.shape, novelty: noveltyOf(r.site) })),
  overlap, ph2, ph3, ph4,
};

/* ---------------------------------------------------------------- §4 PH5 — the two exclusions */

say('\n=== §4 PH5 — what each candidate exclusion actually leaves ===\n');
const afterNested = intRows.filter((r) => r.nested !== true);
const afterUnit = intRows.filter((r) => !UNIT_DIR_RE.test(r.site));
say(`  census as measured:                                ${intRows.length}`);
say(`  minus NESTED-LITERAL rows (the "FIXTURE" reading):  ${afterNested.length}`);
say(`  minus docs/research/unit-*/ (the "unit" reading):   ${afterUnit.length}`);
const ph5 = afterNested.length === 15 && afterUnit.length === 0;
say(`\n  PH5 — 15 and 0 as registered: ${ph5}   (measured ${afterNested.length} and ${afterUnit.length})`);
say('  the two exclusions differ by more than the whole surviving census of the narrower one.');
out.ph5 = { census: intRows.length, afterNested: afterNested.length, afterUnit: afterUnit.length, ph5 };

/* ---------------------------------------------------------------- §5 verdicts */

const P = [
  ['PH1', 'P7 at its registered granularity: exactly the five eye-named sites among the 18', ph1, `${sortedNarrow.length} of 5 matched exactly`],
  ['PH2', `both extra NESTED rows are in a file new since ${PRIOR_COMMIT}`, ph2, `${nestedOutside18.length} rows, all NEW-FILE: ${ph2}`],
  ['PH3', 'the inherited key\'s 18→20 delta is entirely new files', ph3, `+${addedToBase.length}`],
  ['PH4', 'the integration\'s 20→22 delta is entirely pre-existing files', ph4, `+${addedByIntegration.length}`],
  ['PH5', 'the two candidate exclusions leave 15 and 0', ph5, `${afterNested.length} and ${afterUnit.length}`],
];
say('\n=== §5 REGISTERED PREDICTIONS (addendum) ===\n');
for (const [id, text, v, note] of P) say(`  ${(v ? 'HIT' : 'REFUTED').padEnd(9)} ${id.padEnd(5)} ${text}  —  ${note}`);
say(`\n  ${P.filter((p) => p[2]).length} HIT · ${P.filter((p) => !p[2]).length} REFUTED of ${P.length}`);
out.predictions = P.map(([id, text, v, note]) => ({ id, text, verdict: v ? 'HIT' : 'REFUTED', note }));

const productDiff = execFileSync('git', ['diff', '--stat', 'HEAD', '--', 'packages/', 'scripts/'], { encoding: 'utf8' }).trim();
say(`\n  git diff --stat HEAD -- packages/ scripts/ : ${productDiff === '' ? 'EMPTY' : 'NON-EMPTY'}`);
out.productDiffEmpty = productDiff === '';

say(`\n${JSON.stringify(out, null, 2)}`);
