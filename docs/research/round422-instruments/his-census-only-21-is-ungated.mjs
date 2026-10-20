#!/usr/bin/env node
/**
 * Round 422 §2 — his memo's published "census-only ceiling is 21" is printed by say() and read by
 * no predict() and by no gate that can fail on its value.
 *
 * THE CHARGE. `scope-label-legs-are-a-class-of-three.mjs` drives six cells and prints a figure for
 * each. Nine `predict()` calls grade: the 3-leg census, the [7,9] precedence, the baseline's
 * 191/32/29 and greenness, his 27/24 for MY instance, and the DIRECTION of the i-flag move. So of
 * the figures his memo publishes as findings, these are graded by nothing:
 *
 *     §2 table, `streaming:` dropped -> 26        say() only
 *     §2 table, `models:`   dropped -> 29 (±0)    say() only   <- his "models: is worth nothing"
 *     §2 table, all three   dropped -> 21         say() only   <- his headline "census-only is 21"
 *     §6,       i flag                -> 33/30    say() only   (only the SIGN is predicted)
 *
 * The one gate that touches 21 is line 255: `all3.behavioural <= t.behavioural`. That is an
 * inequality, not a value — and `read()` returns `null` when its regex misses, so when the figure
 * cannot be read at all the gate evaluates `null <= 24`, which JavaScript coerces to `0 <= 24` and
 * calls TRUE. The figure can therefore be wrong, or absent, and his GATE line still says `true`.
 *
 * This is the shape I have now met in his work and my own enough times to name it the same way
 * each round: a refusable figure printed beside a guard that cannot refuse it (353/395), and a
 * guard on identity rather than on value (354). It is NOT a claim that 21 is the wrong number — my
 * §1 drive reproduces 21 exactly. It is a claim that the instrument would have published any other
 * number just as green, which is what makes 21 unverified rather than verified.
 *
 * HOW IT IS GRADED — three cells, each a mutated copy of HIS committed instrument, driven, with
 * its verdict lines read back out of its own stdout (Rounds 408/412: a hand-typed reader is not a
 * slice; so his key is never retyped, only patched).
 *
 *   ALPHA  his instrument, unmodified              -> GATE true, 9 landed, SUMMARY "…behavioural 21"
 *   BETA   the cell NAMED `drop-all-three-scope-legs` silently drops only TWO of the three, so the
 *          figure his SUMMARY publishes under the sentence "census-only (all three scope legs
 *          dropped)" is the figure for a DIFFERENT mutation
 *                                                           -> expect GATE still true, 9 landed,
 *                                                              0 refuted, and a different number
 *   GAMMA  the all-three cell's behavioural print line is reworded, so `read()` cannot find it and
 *          returns null                                     -> expect GATE still true and line
 *          255's inequality to pass on `null <= 24`
 *   DELTA  an incidental measurement, kept because my CONTROL refused my first BETA and I would
 *          rather publish the refusal than hide it: the all-three cell with a FOURTH, non-scope leg
 *          (`hasCompaction`) also dropped. I expected that to move the figure off 21. It does not —
 *          `hasCompaction` is worth 0 on top of the three scope legs — so it is useless as a
 *          discriminator and is reported as a figure instead (Round 347/344: a mutation
 *          counterfactual needs its target asserted to have MOVED, not merely applied).
 *
 * BETA is the discriminator for "wrong value passes". GAMMA is the discriminator for "no value
 * passes". A cure that fixes one without the other is half a cure, so both are driven.
 *
 * CONTROL — and this instrument needs one, because a mutation that silently failed to apply would
 * make every cell agree with ALPHA and look like proof of vacuity (Round 344: a diff-based test
 * blind to self-blanking edits reported 146 defects against a true 0). So each cell asserts its
 * anchor occurs exactly once before patching (347), AND the control is that BETA's and GAMMA's
 * all-three figures must actually DIFFER from ALPHA's. If a mutation did not bite, this instrument
 * refuses instead of reporting vacuity.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REPO = path.resolve(import.meta.dirname, '../../..');
const HIS_REL = 'docs/research/round421-instruments/scope-label-legs-are-a-class-of-three.mjs';
const HIS_REV = '5bf46753';
const GRADED_REL = 'docs/research/round419-instruments/sec3-rekeyed-on-the-call-shape.mjs';
// Each cell DIRECTORY must be depth 3 under REPO: his instrument derives REPO from its own dirname
// as ../../.., and so does the instrument IT drives. Round 421's own note says his first spelling
// got this wrong and every cell refused; mine is gated per cell for the same reason.
const CELLS = path.join(REPO, '.testdata', 'round422cells');

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

say('# Round 422 §2 — is his published 21 graded by anything?');
say('');
say(`REPO: ${REPO}`);
say(`my HEAD: ${git('rev-parse', 'HEAD').stdout.trim()}`);
say(`his instrument taken from commit: ${HIS_REV}`);
say(`driven at: ${new Date().toISOString()}`);
say('');

const HIS = git('show', `${HIS_REV}:${HIS_REL}`).stdout;
gate('his instrument was extracted from his commit, non-empty', HIS.length > 0, `${HIS.length}B`);
gate('a cell DIRECTORY is depth 3 under REPO',
  path.resolve(path.join(CELLS, 'sample'), '../../..') === REPO,
  path.resolve(path.join(CELLS, 'sample'), '../../..'));
gate('the changelog fixture is present', existsSync(path.join(REPO, '.testdata', 'round419-sdk-changelog.md')));
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(2); }

// --- the static charge, read off his source rather than asserted -------------
say('');
say('## 1. Which printed figures his source actually grades');
say('');
// Keyed on the CALL shape over his source, not on my memory of which predicts he wrote (355).
const predictCalls = [...HIS.matchAll(/^predict\(\s*(['"`])([\s\S]*?)\1/gm)].map((m) => m[2]);
say(`  predict() calls in his source: ${predictCalls.length}`);
predictCalls.forEach((n, i) => say(`    ${String(i + 1).padStart(2)}. ${n.replace(/\s+/g, ' ').slice(0, 92)}`));
// His four cell result variables. A figure is GRADED iff some predict() reads that variable.
const CELL_VARS = { baseline: 'base', 'drop-tools-scope': 't', 'drop-models-scope': 'mo',
  'drop-streaming-scope': 'st', 'drop-all-three-scope-legs': 'all3', 'event-key-with-i-flag': 'ev' };
say('');
const predictBodies = [...HIS.matchAll(/^predict\(([\s\S]*?)\);$/gm)].map((m) => m[1]);
const readByPredict = {};
for (const [cell, v] of Object.entries(CELL_VARS)) {
  const re = new RegExp(`\\b${v}\\s*&&|\\b${v}\\s*\\.`);
  readByPredict[cell] = predictBodies.some((b) => re.test(b));
  say(`    cell ${cell.padEnd(27)} result var ${String(v).padEnd(5)} read by a predict(): ${readByPredict[cell] ? 'YES' : 'no'}`);
}
predict('the all-three cell (his published 21) is read by NO predict()', false,
  readByPredict['drop-all-three-scope-legs']);
predict('the models: and streaming: cells are likewise read by no predict()',
  [false, false], [readByPredict['drop-models-scope'], readByPredict['drop-streaming-scope']]);
gate('CONTROL: the baseline and his-instance cells ARE read by a predict(), so this key is not '
  + 'simply blind to every variable',
  readByPredict['baseline'] === true && readByPredict['drop-tools-scope'] === true,
  `baseline=${readByPredict['baseline']} tools=${readByPredict['drop-tools-scope']}`);

// The one gate that touches all3, and what it does on null. Evaluated, not reasoned about (409).
const GATE255 = "all3 && t && all3.behavioural <= t.behavioural";
say('');
say(`  the sole gate reading all3: "${GATE255}"  — occurs ${HIS.split(GATE255).length - 1}x`);
gate('that gate is in his source exactly once (the charge is pinned on the real expression)',
  HIS.split(GATE255).length - 1 === 1);
const nullPasses = (() => { const all3 = { behavioural: null }, t = { behavioural: 24 };
  return !!(all3 && t && all3.behavioural <= t.behavioural); })();
predict('his gate expression, evaluated with all3.behavioural = null, PASSES', true, nullPasses);

// --- the cells ---------------------------------------------------------------
say('');
say('## 2. Three cells: his key unmodified, his key with a wrong 21, his key with no 21');
say('');
rmSync(CELLS, { recursive: true, force: true });
mkdirSync(CELLS, { recursive: true });

const ALL3_FROM = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE], [A_STREAM_SCOPE, STREAM_NO_SCOPE]]],`;
// BETA: the cell keeps its NAME and drops only two of the three legs. His SUMMARY sentence
// ("census-only (all three scope legs dropped): behavioural N") is bound to the cell's name, so
// this is the exact hazard: the sentence and the number can disagree, green.
const ALL3_BETA = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE]]], // MUTANT: named all three, drops two`;
// DELTA: a fourth, non-scope leg also dropped. This was my first BETA; my own CONTROL refused it
// because it did not move the figure. Kept as an incidental measurement of what hasCompaction is
// worth on top of the three scope legs, not as a discriminator.
const COMPACTION_ANCHOR = `const hasCompaction = (l) => /compaction|context_management|compact[-_]2026/i.test(l);`;
const COMPACTION_NEVER = `const hasCompaction = (l) => /(?!)/.test(l); // MUTANT: fourth leg, not a scope leg`;
const ALL3_DELTA = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE], [A_STREAM_SCOPE, STREAM_NO_SCOPE], [${JSON.stringify(COMPACTION_ANCHOR)}, ${JSON.stringify(COMPACTION_NEVER)}]]],`;
// GAMMA: reword the graded instrument's behavioural print line in the all-three cell only, so his
// read() regex misses it and `behavioural` comes back null for that cell and that cell alone.
const BEHAV_PRINT = 'say(`  of which behavioural (not docs:/internal:/chore:): ${reachableBehavioural.length}`);';
const BEHAV_PRINT_REWORDED = 'say(`  behavioural rows [MUTANT label]: ${reachableBehavioural.length}`);';
const ALL3_GAMMA = `  ['drop-all-three-scope-legs', [[A_TOOL, TOOL_NO_SCOPE], [A_MODELS, MODELS_NO_SCOPE], [A_STREAM_SCOPE, STREAM_NO_SCOPE], [${JSON.stringify(BEHAV_PRINT)}, ${JSON.stringify(BEHAV_PRINT_REWORDED)}]]],`;

const gradedSrc = readFileSync(path.join(REPO, GRADED_REL), 'utf8');
gate('DELTA\'s fourth anchor occurs exactly once in the instrument HIS cells mutate',
  gradedSrc.split(COMPACTION_ANCHOR).length - 1 === 1,
  `occurs=${gradedSrc.split(COMPACTION_ANCHOR).length - 1}`);
gate('GAMMA\'s print-line anchor occurs exactly once in that same instrument',
  gradedSrc.split(BEHAV_PRINT).length - 1 === 1,
  `occurs=${gradedSrc.split(BEHAV_PRINT).length - 1}`);
gate('the all-three CELLS_SPEC row occurs exactly once in HIS source',
  HIS.split(ALL3_FROM).length - 1 === 1, `occurs=${HIS.split(ALL3_FROM).length - 1}`);
if (fails.length) { say(''); say(`VERDICT: REFUSED — ${fails.join('; ')}`); process.exit(2); }

const SPEC = [
  ['ALPHA', HIS],
  ['BETA', HIS.split(ALL3_FROM).join(ALL3_BETA)],
  ['GAMMA', HIS.split(ALL3_FROM).join(ALL3_GAMMA)],
  ['DELTA', HIS.split(ALL3_FROM).join(ALL3_DELTA)],
];

const results = {};
for (const [name, src] of SPEC) {
  const dir = path.join(CELLS, name);
  mkdirSync(dir, { recursive: true });
  if (path.resolve(dir, '../../..') !== REPO) { gate(`[${name}] cell dir depth 3`, false, dir); continue; }
  const file = path.join(dir, 'cell.mjs');
  writeFileSync(file, src);
  const r = spawnSync('node', [file], { cwd: dir, encoding: 'utf8', timeout: 900000 });
  const text = (r.stdout || '') + (r.stderr || '');
  // His own output lines, read back — the all-three row of his §3 table and his SUMMARY line.
  const row = (text.match(/^ {2}drop-all-three-scope-legs +denom +(\d+) \| reachable +(\S+) \| behavioural +(\S+) \| exit/m) || []);
  results[name] = {
    exit: r.status,
    gate: (text.match(/^GATE: (.*)$/m) || [, '(none)'])[1],
    preds: (text.match(/^PREDICTIONS: (.*)$/m) || [, '(none)'])[1],
    censusOnly: (text.match(/^ +census-only \(all three scope legs dropped\): behavioural (.*)$/m) || [, '(none)'])[1],
    all3Behavioural: row[3] ?? '(row not printed)',
    deltaLine: (text.match(/^ {4}all three +behavioural .*$/m) || [, ''])[0] || '(none)',
    gate255Line: (text.match(/^.*dropping all three scope legs is at least as large a move.*$/m) || [, ''])[0] || '(none)',
  };
  const R = results[name];
  say(`  ${name}`);
  say(`      exit ${R.exit} | GATE ${R.gate.slice(0, 48)} | PREDICTIONS ${R.preds}`);
  say(`      his §3 all-three row behavioural: ${R.all3Behavioural}`);
  say(`      his §5 delta line: ${R.deltaLine.trim()}`);
  say(`      his gate on all3:  ${R.gate255Line.trim()}`);
  say(`      his SUMMARY "census-only … behavioural": ${R.censusOnly}`);
}

// --- the control, before any vacuity is claimed -------------------------------
say('');
say('## 3. CONTROL first: did the mutations actually bite?');
say('');
const A = results.ALPHA, B = results.BETA, G = results.GAMMA, D = results.DELTA;
gate('ALPHA reproduces his published 21 — without this, nothing below is about his figure',
  A && A.censusOnly === '21', A ? `censusOnly=${A.censusOnly}` : 'ALPHA did not run');
gate('CONTROL: BETA\'s all-three figure DIFFERS from ALPHA\'s, so BETA\'s mutation bit',
  A && B && B.censusOnly !== A.censusOnly && B.censusOnly !== '(none)',
  A && B ? `ALPHA ${A.censusOnly} vs BETA ${B.censusOnly}` : 'a cell did not run');
gate('CONTROL: GAMMA\'s all-three figure became unreadable, so GAMMA\'s mutation bit',
  G && G.censusOnly !== (A && A.censusOnly), G ? `GAMMA ${G.censusOnly}` : 'GAMMA did not run');
// DELTA is NOT a control and must not be gated as one: it is reported because it refused to be a
// discriminator. Stating the refusal as a measurement rather than deleting the cell.
say(`  DELTA (incidental, not a discriminator): dropping hasCompaction on TOP of the three scope`);
say(`    legs leaves the figure at ${D ? D.censusOnly : '?'} — i.e. worth ${A && D && A.censusOnly !== '(none)' && D.censusOnly !== '(none)' ? (+D.censusOnly - +A.censusOnly) : '?'} there. This was my first BETA; my own`);
say(`    control refused it, which is the only reason this instrument has a real BETA.`);

// --- the finding --------------------------------------------------------------
say('');
say('## 4. Does his verdict line notice?');
say('');
predict('ALPHA: his instrument is green and publishes 21', ['true', '9 landed, 0 refuted', '21'],
  A ? [A.gate, A.preds, A.censusOnly] : null);
predict('BETA: the number published under the sentence "all three scope legs dropped" is NOT 21',
  true, !!(B && B.censusOnly !== '21' && B.censusOnly !== '(none)'));
predict('BETA: …and his GATE is still true', 'true', B && B.gate);
// Not a fresh guess: 24 is what his own tools-only cell measured and his own models: cell measured
// as worth 0, so this is a reproduction of two of his figures composed, and it is allowed to fail.
predict('BETA: …and that number is his tools-only 24, because his models: leg is worth 0',
  '24', B && B.censusOnly);
predict('BETA: …with every one of his predictions still landing', '9 landed, 0 refuted', B && B.preds);
predict('BETA: …and exit 0', 0, B && B.exit);
predict('GAMMA: the figure cannot be read at all, and his GATE is STILL true', 'true', G && G.gate);
predict('GAMMA: …with every one of his predictions still landing', '9 landed, 0 refuted', G && G.preds);
predict('GAMMA: …and exit 0', 0, G && G.exit);
predict('GAMMA: …and his sole gate on all3 reports OK on a null figure', true,
  G ? /\[GATE\] OK/.test(G.gate255Line) : null);
// Re-measurement of the cell my control rejected, so the incidental figure is graded too rather
// than only printed — which is the whole charge of this instrument, and it applies to me.
predict('DELTA: hasCompaction is worth 0 on top of the three scope legs (re-measured, not guessed)',
  '21', D && D.censusOnly);

gate('THE DISCRIMINATOR: a wrong 21 (BETA) and an absent 21 (GAMMA) are both published green, so '
  + 'no leg of his instrument grades that figure',
  A && B && G && A.gate === 'true' && B.gate === 'true' && G.gate === 'true'
  && B.censusOnly !== A.censusOnly && G.censusOnly !== A.censusOnly,
  A && B && G ? `ALPHA ${A.censusOnly} / BETA ${B.censusOnly} / GAMMA ${G.censusOnly}, all GATE true` : 'a cell did not run');
// His instrument is not merely lax: ALPHA is green for the right reason, and his nine predictions
// DO bite on the figures they read. Without this leg the finding would read as "his instrument
// gates nothing", which is false and would be the 351 shape — a triage claim too broad to act on.
gate('CONTROL: his instrument is not lax everywhere — ALPHA green AND the figures he does predict '
  + 'are the ones that moved nothing in BETA/GAMMA',
  A && B && G && A.preds === '9 landed, 0 refuted'
  && B.preds === '9 landed, 0 refuted' && G.preds === '9 landed, 0 refuted',
  A ? `ALPHA ${A.preds}` : 'n/a');

// --- hygiene ------------------------------------------------------------------
say('');
rmSync(CELLS, { recursive: true, force: true });
gate('the cell tree was removed', !existsSync(CELLS), CELLS);
for (const d of ['docs/research/round421-instruments', 'docs/research/round419-instruments']) {
  const dirty = git('status', '--porcelain', '--', d).stdout.trim();
  gate(`${d} untouched by this drive`, dirty === '', dirty || '(clean)');
}

say('');
say('='.repeat(78));
const refuted = preds.filter((p) => !p.landed);
say(`GATE: ${fails.length === 0 ? 'true' : 'FALSE (' + fails.join('; ') + ')'}`);
say(`PREDICTIONS: ${preds.length - refuted.length} landed, ${refuted.length} refuted`);
refuted.forEach((p) => say(`  REFUTED: ${p.name} — expected ${JSON.stringify(p.expected)}, got ${JSON.stringify(p.actual)}`));
say('');
say('SUMMARY:');
say(`  his published census-only figure, reproduced:       ${A ? A.censusOnly : '?'}`);
say(`  BETA  — cell named "all three", drops two:          ${B ? B.censusOnly : '?'}  (his GATE: ${B ? B.gate : '?'})`);
say(`  GAMMA — the same figure made unreadable:            ${G ? G.censusOnly : '?'}  (his GATE: ${G ? G.gate : '?'})`);
say(`  DELTA — incidental: +hasCompaction dropped:         ${D ? D.censusOnly : '?'}  (so that leg is worth 0 there)`);
say(`  => his 21 is reproducible but UNGRADED: his instrument publishes any value, or none, green.`);
writeFileSync(path.join(import.meta.dirname, 'his-census-only-21-is-ungated.out'), out.join('\n') + '\n');
if (fails.length || refuted.length) process.exit(1);
