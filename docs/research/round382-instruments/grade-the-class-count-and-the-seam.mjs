/**
 * Round 382 instrument — one file, three groups, exits non-zero on any grade that is not `true`.
 *
 *   node docs/research/round382-instruments/grade-the-class-count-and-the-seam.mjs
 *
 * Subject: `scripts/probe-round377-…-the-mechanism-was-live-in-both-files.mts`, arm B1m.
 *
 * Group A — Daedalus's Round 381 §0 figures, re-derived under a key that shares neither end with
 *           his: population by `readdirSync` + `startsWith('probe-')` rather than his imported
 *           `census()`/`/^probe-/`, detection by one token scan per source intersected with the
 *           population rather than his `pop.some((f) => src.includes(f))`. Compared by MEMBER LIST
 *           (340), not by count. His B2/B3 widened states re-derived the same way.
 *
 * Group B — the construct class B1m publishes a count of: swept probes that bind another NAMED
 *           probe's source to an identifier. HAND READING IS PRIMARY (341, 350) and is recorded
 *           below as a constant; the detector's job is to GRADE it, and a disagreement fails the
 *           grade rather than publishing either reading.
 *
 * Group C — the figure itself, and the seam.
 *
 * Harness discipline, each item a trap this project has already paid for:
 *   - the detector reads TWO strip-source readings at once and uses offset preservation to tell a
 *     real call site from one quoted inside a string fixture — the subject carries the construct as
 *     a string constant (`A_R225_READ`), so a strings-kept-only key would call it a member for the
 *     wrong reason (344, 364);
 *   - comment-blind, because the subject's own docblocks quote the construct (375);
 *   - five known negatives, not an analogy: census-loop shape, comment, string fixture, non-
 *     population path, registry-derived key — one KP returning nothing reproduces a FALSE 0 for the
 *     wrong reason (355);
 *   - no population SIZE is a conjunct of any check; sizes are measurements, because a pin on a
 *     count reddens on its own promotion (377);
 *   - the two spelling-keyed grades in group C fail as MY OWN harness error, labelled `HARNESS`,
 *     when their extraction returns `null` — never as a finding about his text (356).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRIPTS = join(REPO, 'scripts');

const { stripSource } = await import(join(SCRIPTS, 'lib', 'strip-source.mjs'));
const { SWEPT, census } = await import(join(SCRIPTS, 'sweep-probes.mjs'));

const SUBJECT =
  'probe-round377-the-cure-landed-on-the-two-reported-sites-and-the-mechanism-was-live-in-both-files.mts';

const grades = [];
const grade = (id, what, value) => {
  grades.push({ id, what, value });
  console.log(`${value === true ? '[true ]' : '[FALSE]'} ${id}  ${what}`);
};
const meas = (id, line) => console.log(`[MEAS ] ${id}  ${line}`);

// ─────────────────────────────────────────────────────────────────────────────
// Group A — his §0 and his B2/B3, under my own key
// ─────────────────────────────────────────────────────────────────────────────

/** My population selector: my own directory walk, not his imported `census()` (126, 339). */
const myPop = readdirSync(SCRIPTS)
  .filter((f) => f.startsWith('probe-'))
  .sort();

const TOKEN = /[A-Za-z0-9._-]+/g;
/** My detection: one token scan per source, intersected with the population. */
const namesOtherUnderMine = (pop) => {
  const popSet = new Set(pop);
  return SWEPT.filter((e) => {
    const toks = readFileSync(join(SCRIPTS, e.file), 'utf8').match(TOKEN) ?? [];
    return toks.some((t) => t !== e.file && popSet.has(t));
  }).map((e) => e.file);
};
/** His detection, for the member-list comparison — implemented, not paraphrased (328). */
const namesOtherUnderHis = (pop) =>
  SWEPT.filter((e) => {
    const src = readFileSync(join(SCRIPTS, e.file), 'utf8');
    return pop.some((f) => f !== e.file && src.includes(f));
  }).map((e) => e.file);

const short = (f) => f.split('-').slice(0, 2).join('-');
const sameSet = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

const hisPop = census(SCRIPTS);
const myNarrow = myPop.filter((f) => f.startsWith('probe-round'));

const mineCensus = namesOtherUnderMine(myPop);
const mineNarrow = namesOtherUnderMine(myNarrow);
const hisCensus = namesOtherUnderHis(hisPop);
const hisNarrow = namesOtherUnderHis(hisPop.filter((f) => /^probe-round/.test(f)));

const onlyWiderMine = mineCensus.filter((f) => !mineNarrow.includes(f));
const onlyNarrowerMine = mineNarrow.filter((f) => !mineCensus.includes(f));

meas(
  'A0m',
  `my key: narrow ${mineNarrow.length}/${myNarrow.length} · census ${mineCensus.length}/${myPop.length} · ` +
    `only-wider ${onlyWiderMine.length} [${onlyWiderMine.map(short).join(', ')}] · ` +
    `only-narrower ${onlyNarrowerMine.length}. His key, in this same process: ` +
    `narrow ${hisNarrow.length}/${hisPop.filter((f) => /^probe-round/.test(f)).length} · ` +
    `census ${hisCensus.length}/${hisPop.length}`,
);
grade(
  'A1',
  'his §0 census member LIST and mine are the same set, under two keys sharing neither selection ' +
    'nor detection (340)',
  sameSet(mineCensus, hisCensus),
);
grade('A2', 'his §0 narrow member LIST and mine are the same set', sameSet(mineNarrow, hisNarrow));
grade(
  'A3',
  `his §0 relations hold under my key: only-wider non-empty (${onlyWiderMine.length}) and ` +
    `only-narrower empty (${onlyNarrowerMine.length}) — the two conjuncts B1 grades`,
  onlyWiderMine.length > 0 && onlyNarrowerMine.length === 0,
);

/** His B2: widen the narrow leg by one file outside `/^probe-/`. Under my key, by shape. */
const widenedB2 = [...myNarrow, 'sweep-probes.mjs'];
const b2Narrow = namesOtherUnderMine(widenedB2);
const b2OnlyWider = mineCensus.filter((f) => !b2Narrow.includes(f));
const b2OnlyNarrower = b2Narrow.filter((f) => !mineCensus.includes(f));
meas(
  'A4m',
  `his B2 under my key: narrow ${b2Narrow.length}/${widenedB2.length} · only-wider ` +
    `${b2OnlyWider.length} [${b2OnlyWider.map(short).join(', ')}] · only-narrower ${b2OnlyNarrower.length}`,
);
grade(
  'A4',
  'his B2 claim reproduces by shape: widening the narrow leg by `sweep-probes.mjs` leaves ' +
    'non-emptiness TRUE and makes nesting the SOLE false conjunct',
  b2OnlyWider.length > 0 && b2OnlyNarrower.length > 0,
);

/** His B3 / my own Round 380 M3: widen by a string every swept file contains. */
const widenedB3 = [...myNarrow, 'summariseAndExit'];
const b3Narrow = namesOtherUnderMine(widenedB3);
const b3OnlyWider = mineCensus.filter((f) => !b3Narrow.includes(f));
const b3OnlyNarrower = b3Narrow.filter((f) => !mineCensus.includes(f));
meas(
  'A5m',
  `his B3 under my key: narrow ${b3Narrow.length}/${widenedB3.length} · only-wider ` +
    `${b3OnlyWider.length} · only-narrower ${b3OnlyNarrower.length}`,
);
grade(
  'A5',
  'his B3 claim reproduces by shape: that widening kills BOTH conjuncts, which is why nesting had ' +
    'never carried a red alone',
  b3OnlyWider.length === 0 && b3OnlyNarrower.length > 0,
);

// ─────────────────────────────────────────────────────────────────────────────
// Group B — the construct class, hand reading primary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * B1m's own criterion, quoted: swept probes where a NAMED probe's source is bound to an identifier;
 * "a loop over the whole population is a census, not a pin, and is excluded", and a site that reads
 * a probe "through a REGISTRY-derived key" is not a member.
 *
 * HAND READING, by eye over every `readFileSync` site in all 20 census members, with the resolving
 * declaration read in each case. Site lines are at HEAD = 56d3623e.
 *
 *   probe-round225  r219src    ← R219    = path.join(SCRIPTS, 'probe-round219-…mts')      (125/225)
 *                   r223bAfter ← R223B   = path.join(SCRIPTS, 'probe-round223b-…mts')     (126/259)
 *   probe-round232  src        ← ARM_O_SOURCE = path.join(REPO, 'scripts/probe-browse-…') (51/131)
 *   probe-round263  r261Now    ← inline literal 'probe-round261-…mts'                     (384)
 *   probe-round269  r225 / src ← inline literal 'probe-round225-…mts'                     (1138/1289)
 *   probe-round371  subjectSrc ← SUBJECT = 'scripts/probe-round224-…mts'                  (121/197)
 *   probe-round372  r225Src    ← R225                                                     (352)
 *   probe-round373  r225Src    ← R225                                                     (237)
 *   probe-round374  r225Src, r373Src                                                      (77/78)
 *   probe-round375  r225Src, r373Src, r374Src                                             (93/94/95)
 *   probe-round377  r225Src, r374Src, r375Src  ← THE SUBJECT, swept since this fire       (93/94/95)
 *
 * Not members, read and rejected: 224/244/246/256/309 (population loops only — his own exclusion);
 * 257 (`VTG_SRC` ← `verify-tsx-guard.mjs`, not a population file); 241/262 (no `readFileSync` at
 * all); 297/304 (a `read(…)` helper, never applied to a named probe file).
 */
const HAND_READING = [
  'probe-round225',
  'probe-round232',
  'probe-round263',
  'probe-round269',
  'probe-round371',
  'probe-round372',
  'probe-round373',
  'probe-round374',
  'probe-round375',
  'probe-round377',
];

/**
 * The detector. Two readings of the same bytes, offsets preserved: strings KEPT to resolve which
 * filename a site names, strings BLANKED to decide whether the site is code at all.
 */
const classSitesIn = (src, pop) => {
  const kept = stripSource(src, false);
  const blanked = stripSource(src, true);
  const popSet = new Set(pop);
  /** Simple `const NAME = …;` declarations whose initializer quotes a population filename. */
  const named = new Set();
  for (const m of kept.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]*);/g)) {
    if (blanked.slice(m.index, m.index + 5) !== 'const') continue;
    for (const f of popSet) if (m[2].includes(f)) named.add(m[1]);
  }
  const sites = [];
  for (const m of kept.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);/g)) {
    if (blanked.slice(m.index, m.index + 5) !== 'const') continue;
    const init = m[2];
    const at = init.indexOf('readFileSync(');
    if (at < 0) continue;
    // Offset preservation: a `readFileSync(` quoted inside a string fixture is blanked here.
    const abs = m.index + m[0].indexOf(init) + at;
    if (blanked.slice(abs, abs + 13) !== 'readFileSync(') continue;
    const inline = [...popSet].some((f) => init.includes(f));
    const viaConst = [...named].some((n) => new RegExp(`\\b${n}\\b`).test(init));
    if (inline || viaConst) sites.push({ id: m[1], shape: inline ? 'inline' : 'const' });
  }
  return sites;
};

// ── known positives and known negatives, each carrying the property rather than resembling it ──
const KP_CONST_INDIRECTION = `const R225 = 'probe-round225-a-citation-is-not-a-call.mts';
const r225Src = readFileSync(join(HERE, R225), 'utf8');`;
const KP_INLINE_MULTILINE = `const r261Now = fs.readFileSync(
  path.join(REPO, 'scripts', 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts'),
  'utf8',
);`;
const KN_CENSUS_LOOP = `const members = SWEPT.filter((e) => {
  const src = readFileSync(join(HERE, e.file), 'utf8');
  return pop.some((f) => f !== e.file && src.includes(f));
});`;
const KN_IN_COMMENT = `/**
 * const r225Src = readFileSync(join(HERE, 'probe-round225-a-citation-is-not-a-call.mts'), 'utf8');
 */
const unrelated = 1;`;
const KN_STRING_FIXTURE = `const A_R225_READ = "const r225Src = readFileSync(join(HERE, R225), 'utf8');";
const R225 = 'probe-round225-a-citation-is-not-a-call.mts';`;
const KN_NON_POPULATION = `const VTG = join(SCRIPTS, 'verify-tsx-guard.mjs');
const VTG_SRC = readFileSync(VTG, 'utf8');`;
const KN_REGISTRY_KEY = `const entry = SWEPT.find((s) => s.file === R225);
const src = readFileSync(join(HERE, entry.file), 'utf8');`;

const kp = (label, text) => classSitesIn(text, myPop).length;
meas(
  'B0m',
  `KP const-indirection ${kp('kp1', KP_CONST_INDIRECTION)} · KP inline-multiline ` +
    `${kp('kp2', KP_INLINE_MULTILINE)} · KN census-loop ${kp('kn1', KN_CENSUS_LOOP)} · KN comment ` +
    `${kp('kn2', KN_IN_COMMENT)} · KN string-fixture ${kp('kn3', KN_STRING_FIXTURE)} · ` +
    `KN non-population ${kp('kn4', KN_NON_POPULATION)} · KN registry-key ${kp('kn5', KN_REGISTRY_KEY)}`,
);
grade(
  'B0',
  'the detector is characterised on both sides before it is believed: both known positives are ' +
    'non-zero and all five known negatives are 0 — census loop, comment, string fixture, ' +
    'non-population path, registry-derived key',
  kp('kp1', KP_CONST_INDIRECTION) > 0 &&
    kp('kp2', KP_INLINE_MULTILINE) > 0 &&
    kp('kn1', KN_CENSUS_LOOP) === 0 &&
    kp('kn2', KN_IN_COMMENT) === 0 &&
    kp('kn3', KN_STRING_FIXTURE) === 0 &&
    kp('kn4', KN_NON_POPULATION) === 0 &&
    kp('kn5', KN_REGISTRY_KEY) === 0,
);

const detected = [];
const perMember = [];
const shapesOf = new Map();
for (const f of mineCensus) {
  const sites = classSitesIn(readFileSync(join(SCRIPTS, f), 'utf8'), myPop);
  if (sites.length > 0) {
    detected.push(short(f));
    shapesOf.set(short(f), [...new Set(sites.map((s) => s.shape))].sort());
    perMember.push(`${short(f)}:${sites.length}(${shapesOf.get(short(f)).join('+')})`);
  }
}
meas('B1m', `detector over the ${mineCensus.length} census members: ${perMember.join(' ')}`);
grade(
  'B1',
  `the detector reproduces the hand reading as a SET, not as a count: hand ${HAND_READING.length} ` +
    `[${HAND_READING.join(', ')}], detector ${detected.length} [${detected.join(', ')}]`,
  sameSet(HAND_READING, detected),
);

/**
 * The one escape his criterion could offer: that the unlisted members are a different construct.
 * They are not. Both binding shapes present in the unlisted set are already witnessed by a member
 * of his OWN published list — `probe-round269` binds by inline literal exactly as `probe-round263`
 * does, and `probe-round372` binds through a module-scope `const` exactly as `225`, `232` and `371`
 * do. So no reading of "binds another NAMED probe's source to an identifier" that keeps his five
 * can drop these four.
 */
const LISTED = ['probe-round269', 'probe-round372', 'probe-round373', 'probe-round374', 'probe-round375'];
const shapeSet = (names) =>
  [...new Set(names.flatMap((n) => shapesOf.get(n) ?? []))].sort();
const unlisted = detected.filter((n) => !LISTED.includes(n) && n !== short(SUBJECT));
meas(
  'B2m',
  `listed-by-him shapes {${shapeSet(LISTED).join(', ')}} · unlisted-member shapes ` +
    `{${shapeSet(unlisted).join(', ')}} · unlisted members [${unlisted.join(', ')}]`,
);
grade(
  'B2',
  'every binding shape the unlisted members use is already witnessed by a member of his own ' +
    'published five, so the criterion cannot be re-read to exclude them',
  unlisted.length > 0 && shapeSet(unlisted).every((s) => shapeSet(LISTED).includes(s)),
);

// ─────────────────────────────────────────────────────────────────────────────
// Group C — the published figure, and the seam
// ─────────────────────────────────────────────────────────────────────────────

const subjectSrc = readFileSync(join(SCRIPTS, SUBJECT), 'utf8');
const subjectCode = stripSource(subjectSrc, false);

grade(
  'C1',
  `the subject is itself a member of the class it counts: it binds ` +
    `${classSitesIn(subjectSrc, myPop).length} named probe sources to identifiers`,
  classSitesIn(subjectSrc, myPop).length > 0,
);
grade(
  'C2',
  'and it is already IN the population the same sentence counts over — `SWEPT` carries its entry ' +
    'and the census member list contains it — so "this file will be the 6th" names a future that ' +
    'has happened (377)',
  SWEPT.some((e) => e.file === SUBJECT) && mineCensus.includes(SUBJECT),
);
grade(
  'C3',
  `the live class count is strictly greater than the 5 the line publishes: ${detected.length} ` +
    `members, and it is greater even with the subject itself set aside (${detected.length - 1})`,
  detected.length > 5 && detected.length - 1 > 5,
);

/**
 * The two spelling-keyed readings. Extraction failing is MY error, not a finding: both grades carry
 * `HARNESS` and go false on `null` rather than silently reading as a pass (356).
 */
const publishedCount = subjectCode.match(/(\d+) bind ` \+\n\s*"another NAMED probe's source/);
const publishedOrdinal = subjectCode.match(/this file will ' \+\n\s*'be the (\d+)th\./);
meas(
  'C4m',
  `extracted from the live B1m template literal: published class count ` +
    `${publishedCount ? publishedCount[1] : 'NULL (HARNESS)'}, published ordinal for this file ` +
    `${publishedOrdinal ? publishedOrdinal[1] : 'NULL (HARNESS)'}`,
);
grade(
  'C4',
  'HARNESS — both phrases are found in the live file, so C5 is reading the subject and not an ' +
    'empty string',
  publishedCount !== null && publishedOrdinal !== null,
);
grade(
  'C5',
  `the published count (${publishedCount ? publishedCount[1] : '?'}) disagrees with the live class ` +
    `(${detected.length}), and the published ordinal (${publishedOrdinal ? publishedOrdinal[1] : '?'}) ` +
    `is one past a 5 that is no longer the count`,
  publishedCount !== null && Number(publishedCount[1]) !== detected.length,
);

/**
 * The seam. Round 380 §4 asked for a declared seam and Round 381 shipped one: "EVERY figure in this
 * sentence so far is derived; every figure in the next one is a CONSTANT". The declaration names one
 * boundary. The line has two: it crosses BACK to derived, and the crossing is INSIDE a sentence
 * whose denominator is live and whose numerator is a hand constant.
 */
const seamIdx = subjectCode.indexOf('every figure in the next one is a CONSTANT');
const liveAfterSeam = seamIdx < 0 ? null : subjectCode.slice(seamIdx).indexOf('${namesOther} members');
grade(
  'C6',
  'HARNESS — the seam declaration and a later live interpolation are both located',
  seamIdx >= 0 && liveAfterSeam !== null && liveAfterSeam > 0,
);
grade(
  'C7',
  'the declared seam is crossed in the other direction and the crossing is not declared: after ' +
    '"every figure in the next one is a CONSTANT" the line returns to a LIVE `${namesOther}`, in ' +
    'the same sentence as the hand-constant numerator C5 grades',
  seamIdx >= 0 && liveAfterSeam > 0,
);

// ─────────────────────────────────────────────────────────────────────────────

const bad = grades.filter((g) => g.value !== true);
console.log('');
if (bad.length > 0) {
  console.log(`NOT TRUE: ${bad.map((g) => g.id).join(' ')}  (of ${grades.length} grades)`);
  process.exit(1);
}
console.log(`ALL ${grades.length} GRADES TRUE`);
