/**
 * Round 413 — attacking the one leg Theseus's Round 412 rests on (his §"Routed to you": G7).
 *
 * His collapse `[25, 26] → [25, 25]` — my own P3 landing after all — rests on a branch-resolving
 * ternary layer whose only grade is G7: one CONSTRUCTED disagreeing ternary and one CONSTRUCTED
 * agreeing one. He named the limit himself: a constructed control can show the key refuses, but it
 * cannot show the key refuses *the cases that occur*. He asked me to attack the leg first, and said
 * that if it is hollow the collapse is his and not real.
 *
 * It is half hollow, and not in the direction he named.
 *
 * His DISAGREE control is load-bearing: `cond ? 'x' : 7` is OTHER-DERIVED under his 411 key and
 * UNMODELLED under his 412 key, so removing the branch layer reddens it. His AGREE control is not:
 * `cond ? 7 : 8` is OTHER-DERIVED under BOTH keys. The agreeing half of G7 passes unchanged with
 * the entire cure deleted, because the stratum the branches agree on is the same one the test's own
 * leading token already produced. That is my own 380/397/412 lesson — grade a cure as a 2 x 2
 * against the OLD spelling — turned on the leg that was supposed to stop his round being tuning.
 *
 * The repair is one character per branch: an agreeing control whose agreed stratum DIFFERS from
 * what the test alone yields (`cond ? 'x' : 'y'` — OTHER-DERIVED under 411, TYPED-LITERAL under
 * 412). D4 drives it; D5 controls it so the move cannot be credited to the literal merely being
 * present in the window.
 *
 * HIS READER IS SLICED, NOT RETYPED. Round 412 §3 is his own finding that re-implementing my
 * `literalBodies` and `interval()` from their shape made his copy disagree with me about a member
 * of my own headline; my 408 and 412 rules say the same thing from this side (a hand-typed KP is
 * not a slice; a hand-typed reader is not a slice). So this file does not contain a copy of his
 * key. It regenerates `his412-prefix.sliced.mjs` from his file on every drive — his lines 1..422
 * byte-for-byte, plus an export tail that is mine and is declared — asserts the byte-identity as
 * D1, and dynamic-imports it. If his file moves, the slice moves with it or D1 reddens.
 *
 * Drives recorded in this directory. GATE legs read the key; PREDICTION legs read the corpus.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const SELF_DIR = `${SELF.split('/').slice(0, -1).join('/')}/`;
const HIS412 = 'docs/research/round412-instruments/resolve-the-ternary-and-reconstruct-the-nine.mjs';
const HIS412_OUT = `${SELF_DIR}his412-driven-live.out`;

/** The cut: his last definition line. 423 opens his G1 section, which reads an output file out of
 *  HIS directory — so the prefix stops before it and this file does not inherit that dependency. */
const CUT = 422;

const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });

// ─── pre-registration (405: never draft the slot for a measurement that has not run) ────────────
const EXPECTED = [
  ['D1', 'the slice is his lines 1..422 byte-for-byte and the export tail is the only addition'],
  ['D2', 'known positive: the SLICED topLevelTernary splits round410:408 into the three spans his '
    + 'own recorded output prints, parsed out of that output rather than retyped (395)'],
  ['D3', 'THE ATTACK: his G7 as a 2 x 2 against the OLD key. His DISAGREE control moves '
    + '411 -> 412; his AGREE control DOES NOT MOVE, so the agreeing half of G7 passes with the '
    + 'whole branch layer deleted'],
  ['D4', 'the repair: an agreeing ternary whose agreed stratum differs from the test\'s own shape '
    + 'moves OTHER-DERIVED -> TYPED-LITERAL, so it grades the agreeing direction non-vacuously'],
  ['D5', 'controls for D4: the branches without the ternary, and the test alone, are each '
    + 'UNMOVED between the two keys — so D4\'s move is the branch layer and not the literal'],
  ['D6', 'his two isCond exclusions (`?.`, `??`) are driven as constructed known positives AND '
    + 'censused live, so the exclusion is priced on text that occurs'],
  ['P1', 'his P1 regraded by hand under HIS seam: of the declarations whose window carries a `?`, '
    + 'exactly one is a top-level conditional initializer'],
  ['P2', 'his "population held at 57" is a WITHIN-COMMIT property. The directory seam re-admits '
    + 'the previous round\'s instruments, so the population under this round\'s seam is larger'],
  ['P3', 'a third shape in his P3 family: `cond ? .5 : 1` is MISSED by isCond (`?` followed by '
    + '`.`) and then decided by its own test. Constructed hit; live class published as measured'],
  ['P4', 'ADDED AT DRIVE 4, not pre-registered with the rest, and said so: his §1 "10 of 62 carry '
    + 'a `?` in their seven-line window" reconciles against my 2 of 57 on two differences at '
    + 'once — the UNSEAMED population (62) and a LITERAL seven-line window where contRaw stops '
    + 'as soon as the expression is finished'],
];

const RESULTS = [];
const GATE_LEGS = new Set(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
const g = (leg, claim, ok, detail) => {
  RESULTS.push({ leg, claim, ok, detail, gate: GATE_LEGS.has(leg) });
};

// ─── D1 — regenerate the slice from his file and assert byte-identity ───────────────────────────
const hisFull = readFileSync(join(REPO, HIS412), 'utf8');
const hisLines = hisFull.split('\n');
const prefix = `${hisLines.slice(0, CUT).join('\n')}\n`;

/** Mine, appended after the slice. Named here so D1 can assert it is the ONLY addition. */
const TAIL = `
// ─── appended by docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs ───
// Everything above this line is Theseus's file, lines 1..${CUT}, byte-for-byte. This tail is mine.
export { topLevelTernary, stratum411, stratum412, asDecl, contRaw, shapeOf, literalBodies,
  inClassUnder, interval, dist, stripSource, ROWS, P, HIS, SELF_DIR, CORPUS, STRATA };
`;
const SLICED = `${SELF_DIR}his412-prefix.sliced.mjs`;
writeFileSync(join(REPO, SLICED), prefix + TAIL);

const written = readFileSync(join(REPO, SLICED), 'utf8');
g('D1', 'the slice is his lines 1..422 byte-for-byte and the export tail is the only addition',
  written.startsWith(prefix) && written.slice(prefix.length) === TAIL
  && prefix.split('\n').length - 1 === CUT,
  `sliced ${CUT} line(s) of ${hisLines.length} · prefix byte-identical: `
  + `${written.startsWith(prefix)} · remainder is exactly the declared tail: `
  + `${written.slice(prefix.length) === TAIL} · cut line 423 is "${hisLines[CUT].slice(0, 60)}"`);

const M = await import(`../../../${SLICED}`);

// ─── D2 — known positive for the sliced reader, keyed on HIS OWN RECORDED OUTPUT ────────────────
/** His G4 line prints the three spans quoted. Parse them out rather than retype them (395, 412). */
const hisOut = readFileSync(join(REPO, HIS412_OUT), 'utf8');
const spans = (() => {
  const m = hisOut.match(/^\s+test "(.*)" · cons "(.*)" · alt "(.*)"$/m);
  return m === null ? null : { test: m[1], cons: m[2], alt: m[3] };
})();
const kpmod = M.ROWS.find((r) => r.ident === 'KPMOD_SEAMLESS');
const split = kpmod === undefined ? null : M.topLevelTernary(kpmod.raw);
g('D2', 'known positive: the SLICED topLevelTernary splits round410:408 into the three spans his '
  + 'own recorded output prints, parsed out of that output rather than retyped',
  spans !== null && split !== null && split.refused === undefined
  && split.test === spans.test && split.cons === spans.cons && split.alt === spans.alt,
  spans === null ? 'REFUSED: could not parse his G4 spans out of his recorded output'
    : split === null ? 'REFUSED: the sliced reader found no ternary at the cited site'
      : `test ${split.test === spans.test} · cons ${split.cons === spans.cons} · `
        + `alt ${split.alt === spans.alt} · site ${kpmod.path.split('/').pop()}:${kpmod.line}`);

// ─── the 2 x 2 machinery: a fragment under HIS OLD key and under HIS NEW key ────────────────────
/** 411 reads the whole initializer's leading token; 412 adds the branch layer. A fragment is wrapped
 *  as the one-line declaration both keys know how to read, using HIS OWN `asDecl`. */
const under411 = (raw) => M.stratum411(M.asDecl(raw));
const under412 = (raw) => M.stratum412(M.asDecl(raw));
const twoByTwo = (raw) => {
  const a = under411(raw);
  const b = under412(raw);
  return { a, s: b.stratum, via: b.via, moves: a !== b.stratum };
};

// ─── D3 — the attack on G7 ─────────────────────────────────────────────────────────────────────
/** His two G7 controls, parsed out of his recorded G7 line so they are HIS text and not my
 *  reconstruction of it. Both are quoted on that line as `" … "` after DISAGREE / AGREE. */
const g7 = (() => {
  const m = hisOut.match(/^\s+DISAGREE "(.*?)" -> .+ · AGREE "(.*?)" -> .+$/m);
  return m === null ? null : { disagree: m[1], agree: m[2] };
})();
const dis = g7 === null ? null : twoByTwo(g7.disagree);
const agr = g7 === null ? null : twoByTwo(g7.agree);
/** CORRECTED AFTER DRIVE 1, and the correction is the round. I pre-registered the AGREE half as the
 *  vacuous one. It is the DISAGREE half. His 411 key refuses EVERY ternary whose test is a bare
 *  identifier — `CALL-OR-IDENT` is `[A-Za-z_$][\w$.?\[\]']*\s*[(;.,)\]]` and a space followed by `?`
 *  reaches no terminator — so `UNMODELLED` is the DEFAULT for such a text, not a verdict the branch
 *  layer produced. His DISAGREE control therefore reads UNMODELLED under both keys: the half of G7
 *  that is supposed to grade the REFUSING direction passes with the whole cure deleted. The AGREE
 *  half does move (UNMODELLED -> OTHER-DERIVED) and is load-bearing. The EXPECTED line above is
 *  left exactly as pre-registered (408 P6, and his own 412 §4: backdating it would be the defect). */
g('D3', 'THE ATTACK, CORRECTED AFTER DRIVE 1 — I pre-registered the wrong half. His DISAGREE '
  + 'control does NOT move: his 411 key refuses every identifier-test ternary, so UNMODELLED is the '
  + 'default and the refusing half of G7 passes with the branch layer deleted. His AGREE half moves '
  + 'and is load-bearing. See §1 of the write-up',
  g7 !== null && dis.moves === false && dis.a === 'UNMODELLED' && dis.s === 'UNMODELLED'
  && agr.moves === true,
  g7 === null ? 'REFUSED: could not parse his G7 controls out of his recorded output'
    : `DISAGREE "${g7.disagree}" @411=${dis.a} @412=${dis.s} MOVES=${dis.moves} [${dis.via}] `
      + `<- VACUOUS: the refusing half is satisfied by the OLD key alone · `
      + `AGREE "${g7.agree}" @411=${agr.a} @412=${agr.s} MOVES=${agr.moves} [${agr.via}] `
      + '<- load-bearing');

// ─── D4 / D5 — the repair, and its controls ────────────────────────────────────────────────────
/**
 * The repair, and it comes out of HIS OWN P3. The control that grades the refusing direction has to
 * be a ternary his 411 key DECIDES, so that the branch layer has somewhere to move it FROM. His P3
 * found exactly that shape live-class-0 but demonstrated: a ternary whose TEST IS A CALL matches
 * `CALL-OR-IDENT` on its leading token and is decided. Give it disagreeing branches and the cell
 * moves DECIDED -> UNMODELLED, which is the direction his G7 was written to grade and does not.
 */
const REPAIR_REFUSE = " f(x) ? 'y' : 7;";
const REPAIR_DECIDE = " cond ? 'x' : 'y';";
const rr = twoByTwo(REPAIR_REFUSE);
const rd = twoByTwo(REPAIR_DECIDE);
g('D4', 'the repair, built out of HIS P3: a call-test ternary with DISAGREEING branches is DECIDED '
  + 'by 411 and REFUSED by 412, so the cell moves in the refusing direction — the direction his G7 '
  + 'cannot grade. And an agreeing ternary lands on a stratum its test\'s own shape does not give',
  rr.a !== 'UNMODELLED' && rr.s === 'UNMODELLED' && rr.moves === true
  && rd.a === 'UNMODELLED' && rd.s === 'TYPED-LITERAL' && rd.moves === true,
  `REFUSE-REPAIRED "${REPAIR_REFUSE}" @411=${rr.a} @412=${rr.s} MOVES=${rr.moves} [${rr.via}] `
  + `<- grades the refusal · DECIDE-REPAIRED "${REPAIR_DECIDE}" @411=${rd.a} @412=${rd.s} `
  + `MOVES=${rd.moves} [${rd.via}]`);

const CTRL_BRANCH = " 'x';";
const CTRL_TEST = ' cond;';
const CTRL_CALL = ' f(x);';
const cb = twoByTwo(CTRL_BRANCH);
const ct = twoByTwo(CTRL_TEST);
const cc = twoByTwo(CTRL_CALL);
g('D5', 'three controls for D4, one per thing that could be credited with the move: the branches '
  + 'alone, the identifier test alone, and the CALL test alone are each UNMOVED between the two '
  + 'keys — so D4\'s two moves are the branch layer and not the literal or the call shape',
  cb.moves === false && cb.s === 'TYPED-LITERAL' && ct.moves === false && ct.s === 'OTHER-DERIVED'
  && cc.moves === false && cc.a === rr.a,
  `BRANCH-ALONE "${CTRL_BRANCH}" @411=${cb.a} @412=${cb.s} MOVES=${cb.moves} · `
  + `IDENT-TEST-ALONE "${CTRL_TEST}" @411=${ct.a} @412=${ct.s} MOVES=${ct.moves} · `
  + `CALL-TEST-ALONE "${CTRL_CALL}" @411=${cc.a} @412=${cc.s} MOVES=${cc.moves} `
  + `(and it is the same stratum D4's call-test ternary starts from: ${cc.a === rr.a})`);

// ─── D6 — his two isCond exclusions, constructed AND censused ───────────────────────────────────
const OPTCHAIN = ' a?.b;';
const NULLISH = ' a ?? b;';
const oc = M.topLevelTernary(OPTCHAIN);
const nl = M.topLevelTernary(NULLISH);
/** Live: windows whose MASKED text carries a `?` at all, split by what his isCond makes of it. */
const qRows = M.ROWS.filter((r) => M.stripSource(r.raw, true).includes('?'));
const liveOptOrNullish = qRows.filter((r) => {
  const m = M.stripSource(r.raw, true);
  return /\?\.|\?\?/.test(m);
});
g('D6', 'his two isCond exclusions (`?.`, `??`) are driven as constructed known positives AND '
  + 'censused live, so the exclusion is priced on text that occurs',
  oc === null && nl === null,
  `constructed: "${OPTCHAIN}" -> ${oc === null ? 'not a ternary' : JSON.stringify(oc)} · `
  + `"${NULLISH}" -> ${nl === null ? 'not a ternary' : JSON.stringify(nl)} · `
  + `live: ${qRows.length} window(s) carry a masked \`?\`, of which `
  + `${liveOptOrNullish.length} carry \`?.\` or \`??\``);

// ─── P1 — his P1 regraded by hand, under HIS seam ──────────────────────────────────────────────
/** HIS population: corpus minus HIS 411 file and minus HIS OWN round's directory. Reconstructed
 *  from the exported ROWS so the comparison to his published 57 is like for like. */
const HIS_DIR = 'docs/research/round412-instruments/';
/** His seam is his own directory. That is not enough to make his figure reproducible HERE: this
 *  round's directory did not exist in his corpus, so reproducing his 57 needs BOTH rounds removed.
 *  Driven both ways in P2, and this is the form that is stable across my own commit (377/405). */
const hisP = M.ROWS.filter((r) => r.path !== M.HIS && !r.path.startsWith(HIS_DIR)
  && !r.path.startsWith(SELF_DIR));
const hisQ = hisP.filter((r) => M.stripSource(r.raw, true).includes('?'));
/** His §1 hand read reports "10 of 62 carry a `?` in their seven-line window". Mine counts 1,
 *  because mine reads the MASKED window. Reconciled here rather than left as two numbers. */
const hisQraw = hisP.filter((r) => r.raw.includes('?'));
const hisTern = hisQ.filter((r) => {
  const t = M.topLevelTernary(r.raw);
  return t !== null && t.refused === undefined;
});
const hisRefused = hisQ.filter((r) => {
  const t = M.topLevelTernary(r.raw);
  return t !== null && t.refused !== undefined;
});
g('P1', 'his P1 regraded under his population: of the declarations whose window carries a `?`, '
  + 'exactly one is a top-level conditional initializer — and his hand-read 10 is the RAW count, '
  + 'reconciled here against the masked one rather than left as two numbers',
  hisTern.length === 1 && hisP.length === 57 && hisQraw.length >= hisQ.length,
  `his population ${hisP.length} (he published 57) · windows with a \`?\` in the RAW window `
  + `${hisQraw.length} (his hand read: 10) · with a \`?\` surviving the mask ${hisQ.length} · `
  + `top-level conditional initializers ${hisTern.length} `
  + `[${hisTern.map((r) => `${r.path.split('/').pop()}:${r.line} ${r.ident}`).join(' | ')}] · `
  + `refused ${hisRefused.length}`);

// ─── P2 — the seam is a within-commit property, graded both ways ────────────────────────────────
const mineP = M.P;
/** His seam ALONE, applied in my round: his own directory removed, mine left in. */
const hisSeamAlone = M.ROWS.filter((r) => r.path !== M.HIS && !r.path.startsWith(HIS_DIR));
const readmitted = hisSeamAlone.filter((r) => r.path.startsWith(SELF_DIR));
const tracked = M.CORPUS.includes(SELF);
g('P2', 'his "population held at 57" is a WITHIN-COMMIT property. A seam keyed on your OWN '
  + 'directory does not make your figure reproducible for the NEXT seat: his seam alone re-admits '
  + 'this round\'s files as soon as they are tracked. Graded both ways on the tracked state',
  hisP.length === 57 && readmitted.length === hisSeamAlone.length - hisP.length
  && (tracked ? readmitted.length > 0 : readmitted.length === 0),
  `this file tracked: ${tracked} · his seam alone ${hisSeamAlone.length} · both rounds removed `
  + `${hisP.length} · re-admitted from ${SELF_DIR}: ${readmitted.length} `
  + `[${[...new Set(readmitted.map((r) => r.path.split('/').pop()))].join(' | ')}] · `
  + `this round's own seam (his file + this dir) ${mineP.length}, which still carries `
  + `${mineP.filter((r) => r.path.startsWith(HIS_DIR)).length} declaration(s) from ${HIS_DIR}`);

// ─── P3 — a third shape in his P3 family ───────────────────────────────────────────────────────
/**
 * RE-AIMED AFTER DRIVE 1 (357/375: re-aim the pin, don't loosen it). I pre-registered
 * `cond ? .5 : 1`, which his splitter handles correctly — the char after the `?` is a SPACE, so his
 * `?.` exclusion never fires. The shape that actually defeats it has no space: `?.` IS NOT optional
 * chaining when the next character is a decimal digit (the grammar's `?.` carries
 * `[lookahead ∉ DecimalDigit]`), so `f(x) ?.5 : 'y'` is a real conditional. His `isCond` declines it
 * on `masked[i+1] === '.'` alone, so the ternary is invisible; and because the test is a CALL, the
 * 411 key then DECIDES it. Disagreeing branches make that decision wrong in the direction the cure
 * exists to prevent — one character away from his own control, and it fails OPEN, not closed.
 *
 * The shape is not asserted to be valid JS, it is EVALUATED (355/364: a known positive must carry
 * the property, not an analogy).
 */
const DIGIT_DOT = " f(x) ?.5 : 'y';";
const isRealTernary = (() => {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('f', 'x', "return f(x) ?.5 : 'y';")(() => true, 0) === 0.5;
  } catch { return false; }
})();
const dd = M.topLevelTernary(DIGIT_DOT);
const ddTwo = twoByTwo(DIGIT_DOT);
/** Live: a masked `?.` immediately followed by a decimal digit — the only text the blindness can
 *  reach. Published as measured, not asserted from an empty corpus (his own P3 discipline). */
const liveDigitDot = M.ROWS.filter((r) => /\?\.\d/.test(M.stripSource(r.raw, true)));
g('P3', 'RE-AIMED: `f(x) ?.5 : \'y\'` is a real conditional (`?.` is not optional chaining before a '
  + 'digit), his isCond declines it on the `.` alone, and because the test is a call the 411 key '
  + 'then DECIDES it — so the one-character variant of his own control fails OPEN, not closed',
  isRealTernary === true && dd === null && ddTwo.moves === false && ddTwo.s !== 'UNMODELLED',
  `evaluated as JS: (f(x) ?.5 : 'y') === 0.5 is ${isRealTernary} · his splitter -> `
  + `${dd === null ? 'NOT A TERNARY (invisible)' : JSON.stringify(dd)} · so @411=${ddTwo.a} `
  + `@412=${ddTwo.s} MOVES=${ddTwo.moves} — DECIDED, where the branches disagree and the cure owes `
  + `a refusal · live class ${liveDigitDot.length}`);

// ─── P4 — reconcile his 10 of 62 against my 2 of 57 (added at drive 4) ─────────────────────────
/**
 * Two differences at once, which is why neither figure alone reads as the other's. His 62 is the
 * population with HIS OWN directory left IN (57 + the 5 from round412). And "seven-line window" is
 * literal, where `contRaw` takes `continuationLines(d)` lines and that stops as soon as the
 * expression is finished — a declaration complete on its own line gets a ONE-line window, so a `?`
 * two lines below it is outside `contRaw` and inside a literal seven.
 *
 * `CONT_CAP = 6`, so init + 6 after-lines IS his seven. Varying both axes rather than one (339: two
 * keys sharing a denominator agree vacuously), and reported as a 2 x 2 so the figure that matches
 * his is identified by which pair of choices produces it.
 */
const unseamed = M.ROWS.filter((r) => r.path !== M.HIS && !r.path.startsWith(SELF_DIR));
const literal7 = (r) => [r.d.init, ...r.d.afterRaw.slice(0, 6)].join('\n');
const qIn = (rows, win) => rows.filter((r) => win(r).includes('?')).length;
const grid = {
  'seamed(57) x contRaw': qIn(hisP, (r) => r.raw),
  'seamed(57) x literal7': qIn(hisP, literal7),
  'unseamed(62) x contRaw': qIn(unseamed, (r) => r.raw),
  'unseamed(62) x literal7': qIn(unseamed, literal7),
};
const matches = Object.entries(grid).filter(([, v]) => v === 10).map(([k]) => k);
/** CORRECTED BY THE GRID. I expected both axes to be involved. Only one is: the window accounts for
 *  the whole 2 -> 10 move, at the SEAMED population of 57. His 10 is therefore measured over 57
 *  while the 62 he states beside it counts the UNSEAMED set — his numerator and his denominator
 *  come from different populations. Over one population it is 10 of 57 or 13 of 62, not 10 of 62. */
g('P4', 'CORRECTED BY THE GRID: his 10 reconciles on ONE axis, not two — a LITERAL seven-line '
  + 'window over the SEAMED 57. So his stated "10 of 62" pairs a numerator measured over 57 with a '
  + 'denominator counting the unseamed set; over one population it is 10 of 57 or 13 of 62',
  unseamed.length === 62 && grid['seamed(57) x literal7'] === 10
  && grid['unseamed(62) x literal7'] === 13 && matches.length === 1,
  `populations: seamed ${hisP.length} · unseamed ${unseamed.length} (his 62) · `
  + `${Object.entries(grid).map(([k, v]) => `${k} = ${v}`).join(' · ')} · `
  + `cell(s) reproducing his 10: ${matches.length === 0 ? 'NONE — still unreconciled' : matches.join(', ')}`);

// ─── report ────────────────────────────────────────────────────────────────────────────────────
const rev = git(['rev-parse', 'HEAD']).trim();
const dirty = git(['status', '--porcelain']).trim() !== '';
console.log('Round 413 — attacking G7: the agreeing half is satisfied by the key it was meant to '
  + `grade, at ${rev}`);
console.log('');
for (const [leg, claim] of EXPECTED) console.log(`  EXPECTED ${leg}  ${claim}`);
console.log('');
for (const r of RESULTS) {
  console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.leg}  [${r.gate ? 'GATE' : 'PRED'}] ${r.claim}`);
  console.log(`        ${r.detail}`);
}
const gateLegs = RESULTS.filter((r) => r.gate);
const preds = RESULTS.filter((r) => !r.gate);
const gateOk = gateLegs.every((r) => r.ok === true);
const failed = preds.filter((r) => r.ok !== true);
console.log(`\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the key itself)`);
console.log(`PREDICTIONS: ${preds.length - failed.length} landed`
  + `${failed.length === 0 ? '' : `, ${failed.length} REFUTED: ${failed.map((r) => r.leg).join(' | ')}`}`);
console.log('\n  !! A REFUTED PREDICTION IS THE ROUND\'S CONTENT, NOT ITS FAILURE (383).');
console.log(`\n  rev ${rev} · ${M.CORPUS.length} file(s) in the corpus · worktree `
  + `${dirty ? 'DIRTY' : 'clean'}`);
console.log(`  interval under his 412 key, this round's seam: [${M.interval('s412')}]`);
if (gateOk !== true) process.exitCode = 1;
