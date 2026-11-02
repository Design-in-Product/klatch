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
const tsv = readFileSync(join(LIVE, UNIT, 'HAND-READ-12.tsv'), 'utf8').split('\n')
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
check('GJOIN', rows.length === 12 && classCross.length === 12 && missing.length === 0 && extra.length === 0,
  `re-key covers exactly the census's CROSS-STATE set: mine ${rows.length}, census ${classCross.length}, ` +
  `missing ${missing.length}, extra ${extra.length}` +
  (missing.length ? ` [missing ${missing.join(' | ')}]` : '') + (extra.length ? ` [extra ${extra.join(' | ')}]` : ''));
// [[feedback_compare_member_lists_not_counts]]

// the re-key must be NEW, not a transcription of the census's own `sub` column
const censusSubs = new Set(classCross.map((r) => r.sub));
const newSubs = [...new Set(rows.map((r) => r.subkind5))].filter((s) => !censusSubs.has(s));
check('GNEWCOL', !classTsv[0].includes('subkind5') && newSubs.length >= 1,
  `census has no subkind5 column; sub-kinds not in its vocabulary: [${newSubs.join(',')}] ` +
  `(census vocabulary [${[...censusSubs].join(',')}])`);

const by = (sk) => rows.filter((r) => r.subkind5 === sk);
const tally = Object.fromEntries([...new Set(rows.map((r) => r.subkind5))].map((s) => [s, by(s).length]));
check('GPARTITION', Object.values(tally).reduce((a, b) => a + b, 0) === 12,
  `the 5-way key sums to 12: ${JSON.stringify(tally)}`);
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
check('GP2COEXT', litKeyedNonInert.length === 0,
  `source-literal rows that are NOT inert: ${litKeyedNonInert.length} ` +
  `[${litKeyedNonInert.map((r) => `${r.id}@${r.line}=${r.subkind5}`).join(',')}]`);

// ----------------------------------------------- the conjunctive rows: declared, printed, not detected
const conj = by('conjunctive');
const conjComplete = conj.every((r) => r.states && r.states !== '-' && r.states.split(';').length >= 2);
check('GCONJDECL', conj.length === 2 && conjComplete,
  `conjunctive rows ${conj.length}, every one carrying a hand-supplied per-operand state label: ${conjComplete}`);
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
  // the counterfactual, computed not argued: lift the line at BOTH revs and compare
  const liftAt = (rev) => {
    const src = showAt(rev, H396);
    if (!src) return null;
    const m = src.match(/^.*HIS_396.*$/m);
    return m ? m[0] : src.split('\n').find((l) => l.includes('readFileSync')) ?? null;
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

// ------------------------------------------- P6: does moving the property term out cost any row?
// LIMITATION, registered before measuring: this is a `why`-column proxy over the census's 35 GATE
// rows, not a re-read of 48 predicates. It can only find rows that SAY they read two states.
const FROZEN = /frozen|recording|pinned sha|git show|PRE_REV|drive\d/i;
const LIVEWORD = /live|worktree|POST\b/i;
const gateBoth = classGate.filter((r) => FROZEN.test(r.why) && LIVEWORD.test(r.why));
check('GWHYPROXY', classGate.length === 35 && gateBoth.length === 0,
  `GATE rows ${classGate.length}; of those, whose why names a frozen artefact AND a live read: ` +
  `${gateBoth.length}${gateBoth.length ? ` [${gateBoth.map((r) => `${r.id}@${r.line}`).join(',')}]` : ''}`);
console.log('[LIMITATION] GWHYPROXY is keyed on prose I wrote, not on a re-read of the 48 predicates. '
  + 'A non-zero result names rows needing a hand re-read; it does not itself reclassify them.');

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
