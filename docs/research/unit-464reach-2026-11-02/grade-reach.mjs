// unit-464reach — grade the ordered 5-way hazard key, and the cure-reach term Theseus routed.
//
// The hand read in HAND-READ-12.tsv is the VERDICT. This harness joins those rows out of that
// file on (file, line, id) and is scored against them. It never supplies a subkind.
//
// Every constant it needs from a subject harness is SLICED out of that harness's source, never
// re-typed: a hand-typed reader is not a slice, and a re-typed literal cannot catch a drift.
// [[feedback_a_hand_typed_reader_is_not_a_slice]]
//
// What it CANNOT do, declared rather than faked: decide whether a predicate compares its two
// states to each other. Theseus's drive6 refuses on exactly that (his one-level inliner drops a
// function's parameter), and so would mine. The `states` column of the hand read is hand-supplied
// and this harness asserts only that the column is PRESENT and COMPLETE for the rows that need
// it, printing it verbatim into the recording. Declare the class, do not detect it.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE = resolve(HERE, '../../..');
const UNIT = 'docs/research/unit-464reach-2026-11-02';
const CLASS_UNIT = 'docs/research/unit-464class-2026-11-02';
const ENTRY = 'docs/research/LEG-CLASS-CONVENTION.md';
const ENTRY_V10 = '820bc96c'; // the only commit that has ever touched the entry; v1.0

const g = (args) => execFileSync('git', ['-C', LIVE, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const legs = [];
const check = (name, ok, why) => { legs.push({ name, ok: !!ok, why }); };
const refuse = (name, why) => { legs.push({ name, ok: false, why: 'REFUSED — ' + why }); };

// ------------------------------------------------------------------- the hand read, joined not typed
// HAND-READ-13.tsv is the verdict (revised after drive1). HAND-READ-12.tsv is the pre-instrument
// filing and must stay byte-identical to what was committed: a revision that silently rewrote the
// earlier filing would be unfalsifiable. [[feedback_a_filed_cripple_map_is_complete_only_at_its_filing_rev]]
const FILED12 = 'b19f0e80';
const tsv = readFileSync(join(LIVE, UNIT, 'HAND-READ-13.tsv'), 'utf8').split('\n')
  .filter((l) => l.length && !l.startsWith('#'));
const hdr = tsv[0].split('\t');
const rows = tsv.slice(1).map((l) => {
  const c = l.split('\t');
  return Object.fromEntries(hdr.map((h, i) => [h, c[i]]));
});
const key = (r) => `${r.file}\t${r.line}\t${r.id}`;

// the 12 CROSS-STATE rows of yesterday's census, read out of ITS file
const classTsv = readFileSync(join(LIVE, CLASS_UNIT, 'HAND-READ.tsv'), 'utf8').split('\n')
  .filter((l) => l.length && !l.startsWith('#'));
const classRows = classTsv.map((l) => l.split('\t'))
  .filter((c) => c.length >= 6)
  .map((c) => ({ file: c[0], line: c[1], id: c[2], site: c[3], cls: c[4], sub: c[5], why: c[6] ?? '' }));
const classCross = classRows.filter((r) => r.cls === 'CROSS-STATE');
const classGate = classRows.filter((r) => r.cls === 'GATE');

const mine = new Set(rows.map(key));
const theirs = new Set(classCross.map(key));
const missing = [...theirs].filter((k) => !mine.has(k));
const extra = [...mine].filter((k) => !theirs.has(k));
// the re-key must COVER the census's 12 and may ADD rows, each of which must be a row the census
// classed something else — a reclassification, named, not a row invented here.
const extraRows = extra.map((k) => classRows.find((r) => key(r) === k)).filter(Boolean);
check('GJOIN', missing.length === 0 && classCross.length === 12 && extra.length === extraRows.length,
  `re-key covers the census's 12 CROSS-STATE rows (missing ${missing.length}) and adds ` +
  `${extra.length}, every one of which the census classed otherwise: ` +
  `[${extraRows.map((r) => `${r.id}@${r.line} was ${r.cls}`).join(', ')}]`);
// [[feedback_compare_member_lists_not_counts]]
const filed12 = g(['show', `${FILED12}:${UNIT}/HAND-READ-12.tsv`]);
const filed12Live = readFileSync(join(LIVE, UNIT, 'HAND-READ-12.tsv'), 'utf8');
check('GFILED12', filed12 === filed12Live,
  `the pre-instrument filing is identical to its commit ${FILED12} — ${filed12.length} UTF-16 ` +
  `code units, ${Buffer.byteLength(filed12Live, 'utf8')} bytes (3 non-ascii chars; the two counts ` +
  `are not interchangeable and the earlier wording of this leg called the first one "bytes")`);

// the re-key must be NEW, not a transcription of the census's own `sub` column
const censusSubs = new Set(classCross.map((r) => r.sub));
const newSubs = [...new Set(rows.map((r) => r.subkind5))].filter((s) => !censusSubs.has(s));
check('GNEWCOL', !classTsv[0].includes('subkind5') && newSubs.length >= 1,
  `census has no subkind5 column; sub-kinds not in its vocabulary: [${newSubs.join(',')}] ` +
  `(census vocabulary [${[...censusSubs].join(',')}])`);

const by = (sk) => rows.filter((r) => r.subkind5 === sk);
const tally = Object.fromEntries([...new Set(rows.map((r) => r.subkind5))].map((s) => [s, by(s).length]));
check('GPARTITION', Object.values(tally).reduce((a, b) => a + b, 0) === rows.length && rows.length === 13,
  `the 5-way key sums to ${rows.length}: ${JSON.stringify(tally)}`);
// a sub-split must partition the class it splits [[feedback_a_subsplit_cannot_partition_a_class_keyed_on_something_else]]

// ------------------------------------------------------- P1/P2: cure reach of what each row compares
// Both inert rows live in unit-464cure3; slice their harness constants rather than typing them.
const sliceConst = (src, name) => (src.match(new RegExp(`^const ${name} = (?:resolve\\()?'(.+?)'`, 'm')) ?? [])[1];
const H = {};
for (const h of ['grade-the-attrib-cure.mjs', 'grade-the-steal-cures.mjs']) {
  H[h] = readFileSync(join(LIVE, 'docs/research/unit-464cure3-2026-11-01', h), 'utf8');
}
const attrib = H['grade-the-attrib-cure.mjs'];
const steal = H['grade-the-steal-cures.mjs'];

// the two subjects and the one PRE_REV, sliced
const PRE_A = sliceConst(attrib, 'PRE_REV');
const PRE_S = sliceConst(steal, 'PRE_REV');
const SUBJ_A = sliceConst(attrib, 'GATE');
const SUBJ_S = sliceConst(steal, 'SUBJ');
check('GSLICED', [PRE_A, PRE_S, SUBJ_A, SUBJ_S].every((v) => typeof v === 'string' && v.length > 0),
  `all four constants sliced out of the harnesses: PRE_A ${String(PRE_A).slice(0, 8)}, ` +
  `PRE_S ${String(PRE_S).slice(0, 8)}, SUBJ_A ${SUBJ_A}, SUBJ_S ${SUBJ_S}`);

// the literal-lifting regex, sliced out of each harness rather than re-typed
const pathOfPat = (attrib.match(/new RegExp\(`(.+?)`/) ?? [])[1];
const clonePat = (steal.match(/\(preSrc\.match\((\/.+?\/m)\)/) ?? [])[1];
check('GPATSLICED', !!pathOfPat && !!clonePat,
  `lifting patterns sliced from the harnesses: pathOf \`${pathOfPat}\` · CLONE ${clonePat}`);

const liftPath = (src, name) => {
  if (!pathOfPat) return null;
  const p = pathOfPat.replace('${name}', name);
  return (src.match(new RegExp(p, 'm')) ?? [])[1] ?? null;
};
const liftClone = (src) => {
  if (!clonePat) return null;
  const body = clonePat.slice(1, clonePat.lastIndexOf('/'));
  return (src.match(new RegExp(body, 'm')) ?? [])[1] ?? null;
};

const showAt = (rev, path) => { try { return g(['show', `${rev}:${path}`]); } catch { return null; } };

const reachOf = (label, subject, preRev, lifters) => {
  const preSrc = showAt(preRev, subject);
  const postSrc = showAt('HEAD', subject);
  if (!preSrc || !postSrc) { refuse(`GREACH_${label}`, `could not read ${subject} at ${preRev.slice(0, 8)} or HEAD`); return null; }
  const lits = lifters.map(([n, f]) => ({ n, pre: f(preSrc), post: f(postSrc) }));
  const allLifted = lits.every((l) => l.pre !== null && l.post !== null);
  const identical = allLifted && lits.every((l) => l.pre === l.post);
  // the cure's own diff over the subject
  const numstat = (g(['diff', '--numstat', `${preRev}..HEAD`, '--', subject]) ?? '').trim();
  const [add, del] = numstat ? numstat.split('\t').map(Number) : [0, 0];
  const diff = g(['diff', '-U0', `${preRev}..HEAD`, '--', subject]);
  const changed = diff.split('\n').filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
  const carrying = changed.filter((l) => lits.some((x) => x.post && l.includes(x.post)));
  check(`GLITIDENT_${label}`, identical,
    `${label}: every compared literal identical in both states — ` +
    lits.map((l) => `${l.n} pre=${l.pre} post=${l.post}`).join(' · '));
  check(`GCUREREACH_${label}`, changed.length > 0,
    `${label}: the cure's diff over ${subject} is non-empty — numstat +${add}/-${del} = ${add + del}, ` +
    `${changed.length} changed lines in -U0`);
  check(`GLITINDIFF_${label}`, changed.length > 0 && carrying.length === 0,
    `${label}: ${carrying.length} of ${changed.length} changed lines carry a compared literal` +
    (carrying.length ? ` [${carrying.slice(0, 2).join(' / ')}]` : ''));
  return { changed: changed.length, numstat: add + del, carrying: carrying.length, identical };
};

const R_A = reachOf('GPATHS', SUBJ_A, PRE_A, [['HIS', (s) => liftPath(s, 'HIS')], ['MINE', (s) => liftPath(s, 'MINE')]]);
const R_S = reachOf('GPATH', SUBJ_S, PRE_S, [['CLONE', liftClone]]);

// P2: is `inert` coextensive with source-literal?
const inert = by('inert');
const inertAllLiteral = inert.every((r) => r.reach === 'source-literal');
const litKeyedNonInert = rows.filter((r) => r.reach === 'source-literal' && r.subkind5 !== 'inert');
check('GP2', inert.length === 2 && inertAllLiteral,
  `inert rows: ${inert.length} [${inert.map((r) => r.id).join(',')}], all source-literal: ${inertAllLiteral}`);
// P2's coextension half is REFUTED (drive1). The leg is re-aimed onto the measured relation, which
// is the finding: source-literal is NECESSARY for inert here and not SUFFICIENT — every
// source-literal row that is not inert is a `delta`, i.e. DIRECTION is decided before REACH. A
// future source-literal row landing in `keyed` reddens this.
// [[feedback_a_leg_that_asserts_the_defect_reddens_on_its_own_cure]]
check('GREACHAFTERDIR', litKeyedNonInert.length >= 1 && litKeyedNonInert.every((r) => r.subkind5 === 'delta'),
  `source-literal rows that are NOT inert: ${litKeyedNonInert.length} ` +
  `[${litKeyedNonInert.map((r) => `${r.id}@${r.line}=${r.subkind5}`).join(',')}] — all delta, so reach ` +
  `is only reached after direction`);

// ----------------------------------------------- the conjunctive rows: declared, printed, not detected
const conj = by('conjunctive');
const conjComplete = conj.every((r) => r.states && r.states !== '-' && r.states.split(';').length >= 2);
// Keyed on the DATA, not on a typed count — drive2's RED here was a `conj.length === 2` written
// when the hand read had 12 rows, which reddened on my own re-key rather than on anything about
// the subject. [[feedback_a_pin_on_a_count_reddens_on_its_own_promotion]]
const strayStates = rows.filter((r) => r.subkind5 !== 'conjunctive' && r.states && r.states !== '-');
check('GCONJDECL', conj.length >= 2 && conjComplete && strayStates.length === 0,
  `conjunctive rows ${conj.length}, every one carrying a complete hand-supplied per-operand state ` +
  `label (${conjComplete}), and ${strayStates.length} non-conjunctive rows carry one`);
for (const r of conj) {
  console.log(`[DECLARED, NOT DETECTED] ${r.id}@${r.line} operands: ${r.states}`);
}
console.log('[UNMODELLED] whether a predicate compares its two states TO EACH OTHER is not decided by '
  + 'this harness. One-level inlining drops a function parameter (Theseus drive6, his §6); the labels '
  + 'above are hand-supplied and are the verdict.');

// ------------------------------------------------------------------------- P3: the staleness row
const three = readFileSync(join(LIVE, 'docs/research/unit-464rec3-2026-11-01/grade-the-three-cures.mjs'), 'utf8');
const H396 = (three.match(/^const HIS_396_PATH =\s*\n?\s*'(.+?)';/m)
  ?? three.match(/HIS_396_PATH =\s*'(.+?)'/) ?? [])[1];
const subjPath = (three.match(/^const S2 = '(.+?)';$/m) ?? [])[1];
if (!H396) {
  refuse('GSTALE', 'could not slice HIS_396_PATH out of grade-the-three-cures.mjs');
} else {
  const s2Src = subjPath ? showAt('HEAD', subjPath) : null;
  const pin = s2Src ? (s2Src.match(/^const HIS_396_PIN = '([0-9a-f]+)';$/m) ?? [])[1] : null;
  const added = g(['log', '--diff-filter=A', '--format=%h', '--', H396]).trim().split('\n').filter(Boolean).pop();
  const newest = g(['log', '-1', '--format=%h', '--', H396]).trim();
  check('GSTALEPIN', !!pin && !!added && pin === added,
    `the pin is the ADDING commit, deliberately, not rot: pin ${pin} · adding ${added} · newest ${newest}`);
  check('GSTALE', !!pin && !!newest && pin !== newest,
    `pin ${pin} !== newest ${newest} — the leg's truth needs a post-addition edit to exist`);
  // the counterfactual, computed not argued: lift the line at BOTH revs and compare.
  // drive1's RED here was MINE: I hand-typed `/^.*HIS_396.*$/m` instead of slicing the harness's
  // own lifter, and it matched an `import` line that is identical at both revs — so my reader made
  // the two states look the same and would have reported Theseus's finding as not reproducing.
  // The pattern is now sliced out of grade-the-three-cures.mjs's own `liftAt`.
  // [[feedback_a_hand_typed_reader_is_not_a_slice]]
  const liftPat = (three.match(/liftAt = \(rev\) => \{[\s\S]*?match\((\/.+?\/m)\)/) ?? [])[1];
  check('GLIFTSLICED', !!liftPat, `the subject harness's own lifting pattern, sliced: ${liftPat}`);
  const liftAt = (rev) => {
    const src = showAt(rev, H396);
    if (!src || !liftPat) return null;
    const body = liftPat.slice(1, liftPat.lastIndexOf('/'));
    return (src.match(new RegExp(body, 'm')) ?? [null])[0];
  };
  const atPin = liftAt(pin);
  const atNewest = liftAt(newest);
  check('GSTALEINVERT', atPin !== null && atNewest !== null && atPin !== atNewest,
    `the two addressed lines differ (so the leg is true): atPin ${JSON.stringify(String(atPin).slice(0, 60))} · ` +
    `atNewest ${JSON.stringify(String(atNewest).slice(0, 60))}`);
  console.log(`[MEAS] counterfactual: were the pin equal to the newest commit (${newest}), the two lifted `
    + `lines would be identical and C2b@99 would read RED. Its soundness runs opposite to its own pin's freshness.`);
  const s2NoRecency = /const s2NoRecency = /.test(three);
  check('GS2', s2NoRecency, `the same harness carries s2NoRecency, asserting its SUBJECT's pin is not recency-keyed: ${s2NoRecency}`);
}

// ------------------------------------------------------------- P4: the overlap is in my own v1.0 text
const v10 = showAt(ENTRY_V10, ENTRY);
if (!v10) {
  refuse('GDOCV10', `could not read ${ENTRY} at ${ENTRY_V10}`);
} else {
  const nDisjoint = (v10.match(/disjoint|partition/gi) ?? []).length;
  const gateRow = v10.split('\n').find((l) => l.startsWith('| **GATE**')) ?? '';
  const crossRow = v10.split('\n').find((l) => l.startsWith('| **CROSS-STATE**')) ?? '';
  const gateHasProp = gateRow.includes('cure-independent property');
  const crossHasLive = crossRow.includes('the live subject');
  check('GDOCV10', nDisjoint === 0 && gateHasProp && crossHasLive,
    `v1.0 at ${ENTRY_V10}: disjoint|partition ${nDisjoint}; GATE row carries "cure-independent property" ` +
    `${gateHasProp}; CROSS-STATE row carries "the live subject" ${crossHasLive} — a leg reading both ` +
    `states and comparing a cure-immovable figure satisfies BOTH rows`);
}

// ---------------------------------------------- the G0@80 departure, read off the source not my why
// My census `why` for measure.mjs:80 says "between his rev and my live tree". The source says
// MY_REV is read out of a recorded file. That one word is the whole departure from Theseus's
// matrix, so it is asserted here against the source, not argued.
// [[feedback_read_a_precedence_claim_off_the_live_array]]
const measureSrc = readFileSync(join(LIVE, 'docs/research/unit-464vac-2026-10-31/measure.mjs'), 'utf8');
const myRevDecl = (measureSrc.match(/^const MY_REV = (.+)$/m) ?? [])[1] ?? '';
const g0Why = (classRows.find((r) => r.file.endsWith('measure.mjs') && r.line === '80') ?? {}).why ?? '';
check('GMYREV', /readFileSync\(/.test(myRevDecl) && !/resolve\('\.'\)|process\.cwd/.test(myRevDecl)
  && /live tree/.test(g0Why),
  `measure.mjs MY_REV = ${JSON.stringify(myRevDecl)} — a recorded rev, not the worktree; and my own ` +
  `census why for :80 says "live tree": ${JSON.stringify(g0Why)}. The why was wrong, so the row is ` +
  `staleness, not keyed, and his keyed-and-reachable 3 is 2.`);

// ------------------------------------------- P6: does moving the property term out cost any row?
// LIMITATION, registered before measuring: this is a `why`-column proxy over the census's GATE
// rows, not a re-read of 48 predicates. It can only find rows that SAY they read two states.
// Published as a confusion matrix against the hand verdict, never as a count of its own, and NOT
// tuned to go green. [[feedback_a_lookahead_behind_quantified_whitespace_excludes_nothing]]
const FROZEN = /frozen|recording|pinned sha|git show|PRE_REV|drive\d/i;
const LIVEWORD = /live|worktree|POST\b/i;
const NEGATING = /no frozen|frozen side only|live only|no live|git only|no live-vs-frozen/i;
const handCross = new Set(rows.map(key));
const matrix = { flaggedCross: [], flaggedNot: [], unflaggedCross: [], unflaggedNot: 0 };
for (const r of classRows) {
  const flagged = FROZEN.test(r.why) && LIVEWORD.test(r.why);
  const isCross = handCross.has(key(r));
  if (flagged && isCross) matrix.flaggedCross.push(`${r.id}@${r.line}`);
  else if (flagged) matrix.flaggedNot.push(`${r.id}@${r.line}`);
  else if (isCross) matrix.unflaggedCross.push(`${r.id}@${r.line}`);
  else matrix.unflaggedNot += 1;
}
console.log(`[MATRIX] why-proxy × hand verdict over ${classRows.length} rows: ` +
  `flagged&CROSS ${matrix.flaggedCross.length} · flagged&not ${matrix.flaggedNot.length} ` +
  `[${matrix.flaggedNot.join(',')}] · unflagged&CROSS ${matrix.unflaggedCross.length} ` +
  `[${matrix.unflaggedCross.join(',')}] · unflagged&not ${matrix.unflaggedNot}`);
check('GPROXYSUM', matrix.flaggedCross.length + matrix.flaggedNot.length
  + matrix.unflaggedCross.length + matrix.unflaggedNot === classRows.length,
  `the matrix's four cells sum to the census's ${classRows.length} rows`);
// every false positive must be explained by NEGATING prose, not by a tuned threshold: a `why` that
// says "no frozen artefact" contains the word "frozen". [[feedback_a_correction_that_quotes_the_wrong_spelling_retrips_the_detector]]
const fpRows = matrix.flaggedNot.map((s) => classRows.find((r) => `${r.id}@${r.line}` === s)).filter(Boolean);
check('GPROXYNEG', fpRows.length >= 1 && fpRows.every((r) => NEGATING.test(r.why)),
  `every why-proxy false positive is prose that NEGATES one side: ` +
  `${fpRows.map((r) => `${r.id}@${r.line} ${JSON.stringify(r.why.slice(0, 44))}`).join(' · ')}`);
// GP6 is keyed on the RECLASSIFIED rows (in my 13, census-classed otherwise), not on the proxy's
// flags — most of the census's own 12 are flagged too, so a flag count could not tell the two
// apart. [[feedback_a_gate_named_after_a_figure_is_not_a_gate_on_that_figure]]
const movedFromGate = extraRows.filter((r) => r.cls === 'GATE');
check('GP6', classGate.length === 35 && movedFromGate.length === 1,
  `P6 REFUTED: the census published GATE ${classGate.length} / CROSS-STATE ${classCross.length}; ` +
  `making the class key explicit about "two states" moves ${movedFromGate.length} row ` +
  `[${movedFromGate.map((r) => `${r.id}@${r.line}`).join(',')}] from GATE to CROSS-STATE, so the ` +
  `entry's v1.0 block is wrong by one: GATE ${classGate.length - movedFromGate.length}, ` +
  `CROSS-STATE ${classCross.length + movedFromGate.length}`);
console.log('[LIMITATION] the why-proxy is keyed on prose I wrote. It named 3 rows; a hand read of '
  + 'all 3 predicates confirmed 1 (measure.mjs:79) and refuted 2. The proxy is a pointer, not a verdict.');

// --------------------------- does the reclassification move §3's published detector figures?
// DECLARED CLASS OF THIS LEG, per the convention it grades: CROSS-STATE (conjunctive). It reads
// three frozen recordings AND the live hand read, but compares each to a literal and never to the
// other. A legitimate change to either side reddens it once per state; neither red is cross-state.
const detRecs = ['drive4.classify.out', 'drive5.classify-depth-curve.out', 'drive6.classify-docpin.out'];
const detVerdicts = detRecs.map((f) => {
  const L = readFileSync(join(LIVE, CLASS_UNIT, f), 'utf8').split('\n');
  const row = L.find((l) => /measure\.mjs:79\s*$/.test(l)) ?? '';
  return (row.match(/det\s+(\S+)/) ?? [])[1] ?? null;
});
const movedRow = rows.find((r) => r.file.endsWith('measure.mjs') && r.line === '79');
check('GDETINVARIANT', detVerdicts.every((v) => v === 'UNMODELLED') && movedRow
  && movedRow.subkind5 === 'conjunctive',
  `the detector called the reclassified row ${JSON.stringify(detVerdicts)} at every depth — never ` +
  `GATE and never CROSS-STATE — so moving it from GATE to CROSS-STATE changes neither the agreement ` +
  `count, nor "CROSS-STATE found", nor "hand-CROSS-STATE called GATE". §3's figures stand.`);

// ------------------------------------------------------------------------- hygiene, inside the harness
const dirty = g(['status', '--porcelain', '--', 'packages/', 'scripts/']);
check('GNODEPEND', dirty.length === 0, `git status --porcelain -- packages/ scripts/ is ${dirty.length} bytes`);
// [[feedback_a_hygiene_gate_that_walks_its_own_directory_reddens_in_every_cell]] — nothing here walks
// its own directory; the only file in this unit it reads is its own hand read, by name.

// --------------------------------------------------------------------------- the doc pin, if promoted
const liveEntry = (() => { try { return readFileSync(join(LIVE, ENTRY), 'utf8'); } catch { return null; } })();
if (liveEntry === null) {
  refuse('GDOCPIN', `${ENTRY} is missing from the worktree — a missing doc is a RED, not a skip`);
} else if (!/v1\.1/.test(liveEntry)) {
  console.log('[PENDING] GDOCPIN: the entry in the worktree is not yet v1.1, so there are no promoted '
    + 'figures to pin. This drive records the measurements; the promotion drive pins them.');
} else {
  const want = {
    'delta': by('delta').length, 'keyed': by('keyed').length, 'inert': by('inert').length,
    'conjunctive': by('conjunctive').length, 'staleness': by('staleness').length,
  };
  const blk = liveEntry.match(/MEASURED-BLOCK-V11[\s\S]*?```/);
  if (!blk) { refuse('GDOCPIN', 'the entry claims v1.1 but carries no MEASURED-BLOCK-V11 fence'); }
  else {
    const bad = Object.entries(want).filter(([k, v]) => !new RegExp(`${k}\\s+${v}\\b`).test(blk[0]));
    check('GDOCPIN', bad.length === 0,
      `every v1.1 sub-kind figure in the entry's own markdown matches the measured value: ` +
      `${JSON.stringify(want)}; mismatched [${bad.map(([k, v]) => `${k} want ${v}`).join(',')}]`);
    // it must not recompute what it grades [[feedback_a_pin_that_recomputes_what_it_grades_is_hollow]]
    const reachFigs = [
      ['GPATHS changed lines', R_A && R_A.changed], ['GPATH changed lines', R_S && R_S.changed],
    ].filter(([, v]) => typeof v === 'number');
    const badReach = reachFigs.filter(([, v]) => !new RegExp(`\\b${v}\\b`).test(liveEntry));
    check('GDOCREACH', badReach.length === 0,
      `the cure-reach line counts appear in the entry as written: ` +
      `${reachFigs.map(([k, v]) => `${k}=${v}`).join(' · ')}; absent [${badReach.map(([k]) => k).join(',')}]`);
  }
}

// ------------------------------------------------------------------------------------------- verdict
console.log('');
console.log(`unit-464reach — ${legs.length} legs`);
for (const l of legs) console.log(`  ${l.ok ? 'ok  ' : 'RED '} ${l.name}  ${l.why}`);
const red = legs.filter((l) => !l.ok);
console.log('');
console.log(`THE 5-WAY KEY: ${JSON.stringify(tally)}`);
console.log(`VERDICT: ${red.length === 0 ? 'GREEN' : `RED — ${red.length} of ${legs.length} (${red.map((l) => l.name).join(', ')})`}`);
console.log(`rev: ${g(['rev-parse', 'HEAD']).trim()}`);
process.exit(red.length === 0 ? 0 : 1);
