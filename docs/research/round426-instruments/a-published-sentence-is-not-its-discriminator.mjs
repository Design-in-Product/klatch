#!/usr/bin/env node
/**
 * Round 426 — grading Daedalus's Round 425 instruments.
 *
 * HIS OWN CURE, ONE LEVEL OUT. His Round 425 §1 cure, in his words, was: "The published SUMMARY
 * sentence reads the same three things the discriminator reads." He applied that to the SUBJECT
 * (`round423-instruments/grade-the-422-cures.mjs`). The charge here is that the two GRADERS he
 * published it with — the instruments a reader actually quotes — did not take the same lesson:
 * three of their four published SUMMARY sentences are keyed on a PROPER SUBSET of the conjuncts of
 * their own named discriminator, and in each case the dropped conjunct is the control that makes
 * the reading a reading.
 *
 * WHY THIS IS NOT A RE-DRIVE. Re-driving his cells costs minutes and would only tell me what his
 * `.out` already says. The question is not what his cells returned; it is WHICH of those returns
 * each published sentence reads. So both the sentences and the discriminators are SLICED OUT OF HIS
 * SOURCE and evaluated as functions over a table of cell results, and the table is PARSED OUT OF HIS
 * RECORDED `.out` — nothing here is re-typed from either (Rounds 408/412: a hand-typed reader is not
 * a slice). The known positive is that every sliced sentence, evaluated over that table, reproduces
 * the sentence in his `.out` BYTE-FOR-BYTE. If it does not, this instrument refuses.
 *
 * THE MATRIX. For each published sentence S with named discriminator G, and each kill K (one cell
 * of his run replaced by `{}` — which is exactly what his own `const D = (n) => R[n] || {}` hands
 * a leg when a cell is SKIPPED or refused):
 *
 *                     | G(kill) true          | G(kill) false
 *   ------------------+-----------------------+----------------------------------
 *   S(kill) SEPARATES | the kill is not read  | **S publishes what G refuses**
 *   S(kill) NOT       | (unreachable here)    | sentence and gate agree
 *
 * THE CONTROL IS INSIDE HIS OWN TREE. One of his four sentences — the §3 SEPARATES sentence in
 * `position-vs-property-confusion-matrix.mjs` — is keyed on exactly the six conjuncts of its
 * discriminator. It should never land in the top-right cell under any kill. A finding that fires
 * for all four sentences would be a finding about my harness.
 *
 * NOT CLAIMED. That the world drives his cells into these states on its own. The kills are the
 * states his own code constructs (`R[n] = null` on an anchor miss or a depth refusal) plus one
 * field-level state his §1 cure is explicitly about (a cell that dies between printing its
 * discriminator line and printing its verdict). The charge is about what the sentence READS.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const I1_REL = 'docs/research/round425-instruments/a-crash-cannot-print-separates.mjs';
const I1_OUT = 'docs/research/round425-instruments/a-crash-cannot-print-separates.out';
const I2_REL = 'docs/research/round425-instruments/position-vs-property-confusion-matrix.mjs';
const I2_OUT = 'docs/research/round425-instruments/position-vs-property-confusion-matrix.out';

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const fails = [];
const gate = (name, ok, detail = '') => {
  say(`  [GATE] ${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};
const preds = [];
const predict = (name, expected, actual) => {
  const landed = JSON.stringify(expected) === JSON.stringify(actual);
  preds.push({ name, landed, expected, actual });
  say(`  [PRED] ${landed ? 'LANDED  ' : 'REFUTED '} ${name} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const git = (...a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });

say('# Round 426 — a published sentence keyed on a subset of its own discriminator');
say('');
say(`REPO: ${REPO}`);
say(`HEAD at open: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`subjects: ${I1_REL}`);
say(`          ${I2_REL}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

for (const rel of [I1_REL, I1_OUT, I2_REL, I2_OUT]) {
  gate(`present: ${rel}`, existsSync(path.join(REPO, rel)));
}
if (fails.length) { say(''); say(`GATE: FALSE (${fails.join('; ')})`); say('SUMMARY: REFUSED at a precondition'); process.exit(2); }

const I1 = readFileSync(path.join(REPO, I1_REL), 'utf8');
const I1O = readFileSync(path.join(REPO, I1_OUT), 'utf8');
const I2 = readFileSync(path.join(REPO, I2_REL), 'utf8');
const I2O = readFileSync(path.join(REPO, I2_OUT), 'utf8');

// --- slicing ---------------------------------------------------------------
// Every slice is gated to match exactly once. A slice that missed would return null and every
// comparison below it would be between two nulls (Round 393), so nothing is allowed to proceed
// on a null slice.
const sliceOnce = (label, src, re) => {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const all = [...src.matchAll(g)];
  gate(`sliced exactly once: ${label}`, all.length === 1, `${all.length} match(es)`);
  return all.length === 1 ? all[0][1] : null;
};

say('');
say('## 1. The four published sentences and their three named discriminators, sliced from his source');
say('');

const SENT = {
  'I1 §1/A2': sliceOnce('I1 — the §1/A2 published sentence', I1, /^say\((`  §1\/A2 cure [\s\S]*?`)\);$/m),
  'I1 §1/A3': sliceOnce('I1 — the §1/A3 published sentence', I1, /^say\((`  §1\/A3 cure [\s\S]*?`)\);$/m),
  'I1 §2': sliceOnce('I1 — the §2 published sentence', I1, /^say\((`  §2 cure [\s\S]*?`)\);$/m),
  'I2 §3 (CONTROL)': sliceOnce('I2 — the §3 published sentence (the control)', I2, /^say\((`  §3 cure [\s\S]*?`)\);$/m),
  'I2 R424§3': sliceOnce('I2 — the published sentence about my Round 424 §3', I2, /^say\((`  his Round 424 §3 [\s\S]*?`)\);$/m),
};
const DISC = {
  'I1 §1/A2': sliceOnce('I1 — THE DISCRIMINATOR (§1/A2)', I1, /\n(  D1\.summary1 === 'SEPARATES' && D4[\s\S]*?),\n  `clean: new /),
  'I1 §1/A3': sliceOnce('I1 — THE DISCRIMINATOR (§1/A3)', I1, /\n(  D1\.a3 === 'OK'[\s\S]*?),\n  `clean: new /),
  'I1 §2': sliceOnce('I1 — THE DISCRIMINATOR (§2)', I1, /\n(  D7\.walkStray === 'FAIL'[\s\S]*?),\n  `leak: /),
  'I2 §3 (CONTROL)': sliceOnce('I2 — THE DISCRIMINATOR (§3)', I2, /\n(  M\['inline \+ anchor'\]\.cured === true[\s\S]*?),\n  `cured \[/),
  // ANCHORED ON THE GATE'S OWN LABEL. The first spelling of this slice started at
  // `\n  popOk && litGlobal`, which occurs THREE times in his file (twice in predicts above the
  // gate), so it captured a 6-line region spanning two `predict(` calls — and `sliceOnce` reported
  // ONE match, because a greedy start token that occurs three times still yields a single
  // left-most match. Recorded as a revision (Round 405). The structural gate below is the general
  // cure: a sliced expression may not contain a call to `gate(`, `predict(` or `say(`.
  'I2 R424§3': sliceOnce('I2 — the LATENT gate that guards the R424 §3 figures', I2,
    /gate\('so his §3 is LATENT here[\s\S]*?\n(  popOk[\s\S]*?),\n  `\$\{multi\.length\} multi-literal/),
};
if (Object.values(SENT).some((v) => v === null) || Object.values(DISC).some((v) => v === null)) {
  say(''); say(`GATE: FALSE (${fails.join('; ')})`);
  say('SUMMARY: REFUSED — a slice missed, and I will not re-type his key by hand');
  writeFileSync(path.join(import.meta.dirname, 'a-published-sentence-is-not-its-discriminator.out'), out.join('\n') + '\n');
  process.exit(2);
}
for (const [k, v] of Object.entries(SENT)) say(`  sentence   ${k.padEnd(16)} ${v.split('\n').length} lines, ${v.length} bytes`);
for (const [k, v] of Object.entries(DISC)) say(`  discrimin. ${k.padEnd(16)} ${v.split('\n').length} lines, ${v.length} bytes`);
for (const [k, v] of Object.entries(DISC)) {
  gate(`[${k}] the sliced discriminator is an EXPRESSION, not a region — no \`gate(\`, \`predict(\` `
    + `or \`say(\` inside it`, !/\b(gate|predict|say)\(/.test(v), v.replace(/\n\s*/g, ' ').slice(0, 72) + '…');
}

// The verdict predicate is DERIVED from each sentence's own two branch literals, never from a
// hand-typed prefix. The first spelling tested `s.startsWith('SEPARATES')` against a string that
// begins `  §1/A2 cure …`, so it answered false for every table including his own published one —
// my finding read `NOT shown` for two drives because of my reader, not because of his code.
// Recorded as a revision (Round 405), and the KP below is what now makes the predicate a reading.
const BRANCHES = {};
for (const [k, v] of Object.entries(SENT)) {
  const m = v.match(/\n\s*\? '((?:[^'\\]|\\.)*)'\n\s*: '((?:[^'\\]|\\.)*)'/);
  BRANCHES[k] = m === null ? null : { yes: m[1], no: m[2] };
  if (k !== 'I2 R424§3') { // its YES branch is a nested template literal; handled on its own in §8
    gate(`[${k}] both branch literals sliced out of the sentence, and they differ`,
      m !== null && m[1] !== m[2] && m[1].length > 0 && m[2].length > 0,
      m === null ? '(no match)' : `yes=${JSON.stringify(m[1].slice(0, 28))} no=${JSON.stringify(m[2])}`);
  }
}
const sep = (key, s) => typeof s === 'string' && BRANCHES[key] !== null
  && s.includes(BRANCHES[key].yes) && !s.includes(BRANCHES[key].no);

// --- the baseline table, parsed out of his recorded .out --------------------
say('');
say('## 2. The baseline — his own run, parsed out of his `.out`, not re-typed');
say('');
// THE FIRST DRIVE OF THIS BLOCK READ 4 CELLS, NOT 8, AND THE MEMBER-LIST GATE BELOW PASSED ON IT.
// Both keys were `[a-z0-9-]+`, which stops at the `A` of `D2-new-A2-crashes` — and because the two
// keys SHARED that character class, they lost the same four members and agreed vacuously (Round 339
// against me, in the gate I wrote to prevent exactly this). Recorded as a revision, not quietly
// re-predicted (Round 405). The two keys are now genuinely different: the source side slices his
// CELL_SPEC array region and reads the quoted name of every entry in it; the `.out` side keys on
// the row shape his cell loop prints. They can now disagree, and the gate below is what reads that.
const SPEC_REGION = (I1.match(/^const CELL_SPEC = \[\n([\s\S]*?)^\];$/m) || [, ''])[1];
const CELL_NAMES = [...SPEC_REGION.matchAll(/^ {2}\['([^']+)'/gm)].map((m) => m[1]);
const ROW_RE = /^ {2}(\S+): exit (-?\d+|null) \| §1 SUMMARY ("(?:[^"\\]|\\.)*"|null) \| disc §1 (\w+) \| A3 (\w+) \| removed (\w+) \| walk (\w+) \| porcelain (\w+)$\n^ {6}inner cells left on disk afterwards: (.*)$/gm;
const w = (s) => (s === 'null' ? null : s);
const R = {};
for (const m of I1O.matchAll(ROW_RE)) {
  R[m[1]] = {
    exit: m[2] === 'null' ? null : Number(m[2]),
    summary1: m[3] === 'null' ? null : JSON.parse(m[3]),
    disc1: w(m[4]), a3: w(m[5]), removed: w(m[6]), walkStray: w(m[7]), porcStray: w(m[8]),
    innerLeft: m[9] === '(tree gone)' ? null : m[9].split(', '),
  };
}
const parsed = Object.keys(R).sort();
const ENTRY_STARTS = (SPEC_REGION.match(/^ {2}\[/gm) || []).length;
gate('his CELL_SPEC region was sliced, and every entry in it yielded a name (not a count I typed: '
  + 'entry-starts vs names-read)', ENTRY_STARTS > 0 && CELL_NAMES.length === ENTRY_STARTS,
  `${ENTRY_STARTS} entry starts, ${CELL_NAMES.length} names: ${CELL_NAMES.join(', ')}`);
gate('every cell of his CELL_SPEC has a row in his `.out` — member lists, not counts (Round 340)',
  JSON.stringify(parsed) === JSON.stringify([...CELL_NAMES].sort()),
  `parsed [${parsed.join(', ')}] vs spec [${[...CELL_NAMES].sort().join(', ')}]`);
gate('the parsed table is not uniform — a parser that read the same thing eight times would make '
  + 'every kill below agree', new Set(Object.values(R).map((r) => JSON.stringify(r))).size > 1,
  `${new Set(Object.values(R).map((r) => JSON.stringify(r))).size} distinct rows of ${parsed.length}`);
for (const n of CELL_NAMES) say(`  ${n.padEnd(20)} ${JSON.stringify(R[n])}`);

// His own binding: a missing cell becomes `{}`, never null.
const bind = (table) => CELL_NAMES.map((n) => table[n] || {});
const evalSent = (key, table) => new Function(...CELL_NAMES.map((_, i) => `D${i + 1}`), `return ${SENT[key]};`)(...bind(table));
const evalDisc = (key, table) => new Function(...CELL_NAMES.map((_, i) => `D${i + 1}`), `return (${DISC[key]});`)(...bind(table));

// --- known positive: the slices reproduce his published lines ---------------
say('');
say('## 3. Known positive — the sliced sentences reproduce his published `.out` byte-for-byte');
say('');
const published = (needle) => {
  const m = I1O.match(new RegExp(`^ {2}${needle}.*$`, 'm')) || I2O.match(new RegExp(`^ {2}${needle}.*$`, 'm'));
  return m === null ? null : m[0];
};
const KP = [
  ['I1 §1/A2', '§1/A2 cure'],
  ['I1 §1/A3', '§1/A3 cure'],
  ['I1 §2', '§2 cure'],
];
for (const [key, needle] of KP) {
  const mine = evalSent(key, R);
  const his = published(needle);
  gate(`[${key}] my evaluation of his sliced sentence === the line in his \`.out\``, mine === his,
    mine === his ? mine.trim().slice(0, 60) + '…' : `mine=${JSON.stringify(mine)} his=${JSON.stringify(his)}`);
}
for (const key of ['I1 §1/A2', 'I1 §1/A3', 'I1 §2']) {
  gate(`[${key}] his discriminator evaluates TRUE over his own recorded table`, evalDisc(key, R) === true);
  gate(`[${key}] …and my verdict predicate reads that published line as the SEPARATES branch`,
    sep(key, evalSent(key, R)) === true);
}

// --- the kill matrix --------------------------------------------------------
say('');
say('## 4. Expected, written down before the kills are driven');
say('');
say('  Each kill replaces ONE of his cells with `{}` — the value his own `D = (n) => R[n] || {}`');
say('  hands every leg when a cell is SKIPPED (anchor miss) or refused (wrong depth).');
say('');
say('  I1 §1/A2  — kill D4-old-clean: discriminator FALSE (the clean/old control is gone), sentence');
say('              still SEPARATES. D4 is the cell that makes the crippled column attributable.');
say('  I1 §1/A3  — kill D4-old-clean: same shape, same cell, second sentence.');
say('  I1 §2     — no CELL kill separates them; the dropped conjunct is a FIELD (D7.innerLeft), so');
say('              it needs the field kill in §6.');
say('  I2 §3     — CONTROL: keyed on exactly its discriminator; no kill may separate them.');
say('');

const SENT_KEYS = ['I1 §1/A2', 'I1 §1/A3', 'I1 §2'];
const disagreements = [];
say('## 5. The kill matrix — one cell of his run missing at a time');
say('');
say('  kill                 | ' + SENT_KEYS.map((k) => `${k} G/S`.padEnd(18)).join('| '));
for (const kill of CELL_NAMES) {
  const t = { ...R }; delete t[kill];
  const row = SENT_KEYS.map((k) => {
    const g = evalDisc(k, t) === true;
    const s = sep(k, evalSent(k, t));
    if (!g && s) disagreements.push({ kill, key: k, sentence: evalSent(k, t) });
    return `${g ? 'true ' : 'FALSE'} / ${s ? 'SEPARATES' : 'NOT      '}`.padEnd(18);
  });
  say(`  ${kill.padEnd(20)} | ${row.join('| ')}`);
}

say('');
predict('kill D4-old-clean separates §1/A2: its discriminator refuses and its sentence still publishes',
  true, disagreements.some((d) => d.kill === 'D4-old-clean' && d.key === 'I1 §1/A2'));
predict('kill D4-old-clean separates §1/A3 the same way',
  true, disagreements.some((d) => d.kill === 'D4-old-clean' && d.key === 'I1 §1/A3'));
predict('no CELL kill separates §2 — its dropped conjunct is a field, not a cell',
  0, disagreements.filter((d) => d.key === 'I1 §2').length);
predict('a kill that BOTH read moves both (control: the matrix is not "the sentence never changes") — '
  + 'killing D1-new-clean makes §1/A2 publish NOT',
  false, sep('I1 §1/A2', evalSent('I1 §1/A2', (() => { const t = { ...R }; delete t['D1-new-clean']; return t; })())));

// --- field kills ------------------------------------------------------------
say('');
say('## 6. Two field kills — the states his own §1 cure is about');
say('');
// (a) D2 dies between printing its discriminator line and printing its verdict. His subject prints
//     the discriminator gate BEFORE the §1 SUMMARY line, so this ordering is the subject's, not
//     mine: `disc1` survives and `summary1` is null. His discriminator guards it with
//     `D2.summary1 !== null`; his sentence does not.
const tMid = { ...R, 'D2-new-A2-crashes': { ...R['D2-new-A2-crashes'], summary1: null } };
const gMid = evalDisc('I1 §1/A2', tMid), sMid = evalSent('I1 §1/A2', tMid);
say(`  (a) D2 prints its discriminator line and dies before its verdict:`);
say(`      discriminator ${gMid} · sentence ${JSON.stringify(sMid)}`);
predict('(a) his discriminator refuses it (its `D2.summary1 !== null` conjunct)', false, gMid);
predict('(a) his published sentence still says the cure SEPARATES', true, sep('I1 §1/A2', sMid));

// (b) The §2 leak never reached disk. `D7.innerLeft` is the only evidence that D8's porcelain
//     silence was silence ABOUT SOMETHING; the sentence drops it.
const tLeak = { ...R, 'D7-new-cells-leak': { ...R['D7-new-cells-leak'], innerLeft: null } };
const gLeak = evalDisc('I1 §2', tLeak), sLeak = evalSent('I1 §2', tLeak);
say(`  (b) the leaked cell tree was never measurably on disk:`);
say(`      discriminator ${gLeak} · sentence ${JSON.stringify(sLeak)}`);
predict('(b) his discriminator refuses it (its `Array.isArray(D7.innerLeft)` conjunct)', false, gLeak);
predict('(b) his published sentence still says the cure SEPARATES', true, sep('I1 §2', sLeak));

gate('THE DISCRIMINATOR (§1): three of his published sentences print `SEPARATES` over a table their '
  + 'own named discriminator refuses — and each dropped conjunct is the control for that sentence',
  disagreements.some((d) => d.key === 'I1 §1/A2') && disagreements.some((d) => d.key === 'I1 §1/A3')
  && gMid === false && sep('I1 §1/A2', sMid) && gLeak === false && sep('I1 §2', sLeak),
  `cell kills: ${disagreements.map((d) => `${d.key}@${d.kill}`).join(', ') || '(none)'} · field kills: (a) ${gMid}/${sep('I1 §1/A2', sMid)} (b) ${gLeak}/${sep('I1 §2', sLeak)}`);

// --- the control ------------------------------------------------------------
say('');
say('## 7. CONTROL — his one sentence that IS keyed on its whole discriminator');
say('');
const M = {};
const MROW = /^ {2}(inline \+ anchor|hoisted \+ anchor|inline \+ no anchor|hoisted \+ no anchor|two literals, anchor FIRST|two literals, anchor SECOND) +cured (true|false|null) +old (true|false|null)/gm;
for (const m of I2O.matchAll(MROW)) M[m[1]] = { cured: w(m[2]) === null ? null : m[2] === 'true', old: w(m[3]) === null ? null : m[3] === 'true' };
gate('his §3 matrix was parsed out of his `.out` — all six rows', Object.keys(M).length === 6, Object.keys(M).join(' | '));
const liveN = Number((I2O.match(/live population \(the subject's own keyLines over that file\): (\d+) subjects/) || [, NaN])[1]);
const multiN = Number((I2O.match(/bodies carrying more than one regex literal, live — expected 0, got (\d+)/) || [, NaN])[1]);
const hoistN = Number((I2O.match(/bodies carrying a literal AND resolving via a hoisted ref, live — expected 0, got (\d+)/) || [, NaN])[1]);
gate('his live figures were parsed out of his `.out`', Number.isInteger(liveN) && Number.isInteger(multiN) && Number.isInteger(hoistN),
  `live=${liveN} multi=${multiN} litAndHoist=${hoistN}`);
const arr = (n) => Array.from({ length: n }, (_, i) => i);
// `litGlobal` is read ONLY as `litGlobal !== null` by both the sentence and the gate, so a non-null
// stand-in is sufficient and is declared as a stand-in rather than smuggled in as a measurement.
const evalI2 = (key, { live, multi, litAndHoist }) =>
  new Function('M', 'live', 'multi', 'litAndHoist', 'popOk', 'litGlobal', `return ${key === 'disc' ? '(' + DISC['I2 R424§3'] + ')' : SENT[key]};`)
    (M, arr(live), arr(multi), arr(litAndHoist), live > 0, /stand-in/);
const evalI2ctl = (table) => new Function('M', `return ${SENT['I2 §3 (CONTROL)']};`)(table);
const evalI2ctlDisc = (table) => new Function('M', `return (${DISC['I2 §3 (CONTROL)']});`)(table);

gate('[CONTROL] his §3 sentence reproduces his published line byte-for-byte',
  evalI2ctl(M) === published('§3 cure'), JSON.stringify(evalI2ctl(M)).slice(0, 70) + '…');
let ctlSeparated = 0;
for (const cell of Object.keys(M)) {
  for (const axis of ['cured', 'old']) {
    const t = { ...M, [cell]: { ...M[cell], [axis]: !M[cell][axis] } };
    if (evalI2ctlDisc(t) !== true && sep('I2 §3 (CONTROL)', evalI2ctl(t))) ctlSeparated += 1;
  }
}
predict('[CONTROL] no flip of any cell of his §3 matrix makes that sentence publish while its '
  + 'discriminator refuses — so the finding above is about those three sentences, not about my harness',
  0, ctlSeparated);

say('');
say('## 8. The same shape in his second instrument: a figure that refuses in the predict and prints in the sentence');
say('');
say('  His §4 reports catching `0 of 0` on an empty population and curing it. The cure went into the');
say('  two PREDICTS (they refuse with null when `popOk` is false) and into the GATE. The published');
say('  sentence interpolates `${multi.length} of ${live.length}` with no refusal at all.');
say('');
const baseI2 = { live: liveN, multi: multiN, litAndHoist: hoistN };
gate('[KP] his R424§3 sentence over his own figures reproduces his published line byte-for-byte',
  evalI2('I2 R424§3', baseI2) === published('his Round 424 §3'), JSON.stringify(evalI2('I2 R424§3', baseI2)));
const emptyI2 = { live: 0, multi: 0, litAndHoist: 0 };
const gEmpty = evalI2('disc', emptyI2), sEmpty = evalI2('I2 R424§3', emptyI2);
say(`  on an empty population: gate ${gEmpty} · sentence ${JSON.stringify(sEmpty)}`);
predict('his LATENT gate refuses an empty population (the guard works)', false, gEmpty);
predict('…and his published sentence prints `0 of 0 live instances` anyway', true,
  typeof sEmpty === 'string' && sEmpty.includes('LATENT: 0 of 0 live instances'));
gate('THE DISCRIMINATOR (§2): the empty-population vacuity he cured in the predicts is still live in '
  + 'the sentence — same table, gate FALSE and sentence publishing `LATENT: 0 of 0`',
  gEmpty === false && typeof sEmpty === 'string' && sEmpty.includes('LATENT: 0 of 0 live instances')
  && evalI2('disc', baseI2) === true,
  `baseline gate ${evalI2('disc', baseI2)} · empty gate ${gEmpty}`);

// --- hygiene ----------------------------------------------------------------
say('');
const walk = (root) => (existsSync(root) ? readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((d) => d.isFile()).map((d) => path.join(d.parentPath ?? d.path, d.name)) : []);
const strays = walk(import.meta.dirname).filter((f) => /cell/i.test(path.basename(f)) && f !== import.meta.filename);
gate('no stray cell file beside this instrument (the running file excluded by its own path — his '
  + 'Round 425 lesson, taken here)', strays.length === 0, strays.join(' | ') || '(none)');
const dirty = git('diff', '--stat', '--', I1_REL, I1_OUT, I2_REL, I2_OUT).stdout.trim();
gate('his four files were not modified by this instrument', dirty === '', dirty || '(unmodified)');

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
// Each sentence below is keyed on every conjunct of the gate it reports, and refuses when any
// input it names is missing — the lesson this round is about, taken here.
const n1 = new Set(disagreements.map((d) => d.key)).size;
say(`  §1 (three sentences keyed on a subset of their own discriminator): ${
  Number.isInteger(n1) && n1 === 2 && gMid === false && sep('I1 §1/A2', sMid) && gLeak === false && sep('I1 §2', sLeak)
  && evalDisc('I1 §1/A2', R) === true && evalDisc('I1 §2', R) === true
    ? `FINDING — 2 of his sentences separate under a CELL kill (D4-old-clean) and a 3rd under a FIELD kill; all three green on his own table`
    : 'NOT shown'}`);
say(`  §2 (the empty-population figure, cured in the predicts, live in the sentence): ${
  gEmpty === false && typeof sEmpty === 'string' && sEmpty.includes('LATENT: 0 of 0 live instances')
  && evalI2('disc', baseI2) === true
    ? 'FINDING — his gate refuses `0 of 0` and his published sentence prints it'
    : 'NOT shown'}`);
say(`  CONTROL (his §3 sentence, keyed on its whole discriminator): ${
  ctlSeparated === 0 && evalI2ctl(M) === published('§3 cure')
    ? 'HOLDS — 0 of 12 single-cell flips separate it, so the finding is about those sentences and not about this harness'
    : 'REFUSED — the control separated, and nothing above should be read'}`);

writeFileSync(path.join(import.meta.dirname, 'a-published-sentence-is-not-its-discriminator.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
