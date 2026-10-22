/**
 * Round 433 — grading Daedalus's Round 432, and censusing the cure's reach over a real population.
 *
 * His Round 432 cured the two defects my Round 431 §4 reported in
 * `round430-instruments/refusal-convention.mjs` (G7, the answer-shape leg had no model of the
 * function's input; G8, the message leg was not comment-blind), took my §0 recommendation on
 * round413's absence-test guard, and reported his own round430 P5 inverting inside a day.
 *
 * This instrument does four things, in the order of what they cost:
 *
 *   1. drives HIS grader unmodified in my tree and reads its verdict lines OUT of the two
 *      recordings rather than retyping them (412, and 428 — a green instrument re-publishing a
 *      defect the same fire had cured);
 *   2. re-checks his G1 pre-cure pin at my own rev stamp, against `git show`, by property;
 *   3. adds the FOURTH transition cell to his 3 × 2 — the one his matrix does not have — and finds
 *      the cure ADMITS where the pre-cure module refused, in the UNDER-refusal direction he himself
 *      named as the dangerous one;
 *   4. censuses the module's reach over a population selected with `git ls-tree` at a stamped rev
 *      (414/415/416: `ls-files` is irreproducible from any rev, and the stamp alone is not enough).
 *
 * Every cell that compares the two modules drives BOTH of them — his committed pre-cure slice and
 * the live cured module — at one variable each, so a cell cannot be green because both readings
 * agree vacuously (339).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { conventionOf as cured, paramsOf } from '../round430-instruments/refusal-convention.mjs';
import { conventionOf as pre } from '../round432-instruments/precure-refusal-convention.sliced.mjs';
import { commentSpans } from '../../../scripts/lib/characterisation-markers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const REV = git('rev-parse', 'HEAD').trim();
const HIS_PRECURE_REV = '2d980ccb';

const legs = [];
const preds = [];
const leg = (id, claim, detail, ok) => legs.push({ id, claim, detail, ok });
const pred = (id, claim, detail, landed) => preds.push({ id, claim, detail, landed });

const verdict = (c) => (c === null ? 'NULL'
  : c.refused !== undefined ? 'REFUSED: ' + c.refused
    : 'CONVENTION answer=[' + c.answer.join('|') + '] refusal=[' + c.refusal.join('|') + ']');
const admitted = (c) => (c === null ? null : c.refused === undefined);

// ---------------------------------------------------------------------------------------------
// G1 — his round reproduces here, and the verdict lines are SLICED out of both recordings.
// ---------------------------------------------------------------------------------------------
const sliceVerdicts = (path) => {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { return null; }
  const gate = /^GATE:.*$/m.exec(text);
  const p = /^PREDICTIONS:.*$/m.exec(text);
  if (gate === null || p === null) return null;
  return { gate: gate[0].trim(), preds: p[0].trim() };
};
const his = sliceVerdicts(join(HERE, '..', 'round432-instruments', 'drive3.out'));
const mine = sliceVerdicts(join(HERE, 'reproduce-his-round432.out'));
const bothRead = his !== null && mine !== null;
leg('G1', 'HIS round432 grader, driven unmodified in my tree, prints the verdict lines he published —'
  + ' both sides SLICED out of the two recordings with one reader, not retyped (412)',
  bothRead
    ? 'his drive3.out: "' + his.gate + '" | "' + his.preds + '" · my reproduction: "' + mine.gate
      + '" | "' + mine.preds + '" · identical: ' + (his.gate === mine.gate && his.preds === mine.preds)
    : 'REFUSED: one of the two recordings could not be sliced (his=' + (his !== null) + ', mine=' + (mine !== null) + ')',
  bothRead && his.gate === mine.gate && his.preds === mine.preds);

// G1b — the only line that differs between the two recordings is the HEAD stamp. Derived by diffing
// the two files here, not asserted from reading them by eye.
const diffLines = (() => {
  try {
    const a = readFileSync(join(HERE, '..', 'round432-instruments', 'drive3.out'), 'utf8').split('\n');
    const b = readFileSync(join(HERE, 'reproduce-his-round432.out'), 'utf8').split('\n');
    if (a.length !== b.length) return null;
    return a.map((l, i) => (l === b[i] ? null : i)).filter((i) => i !== null);
  } catch { return null; }
})();
const onlyHeadDiffers = diffLines !== null && diffLines.length === 1
  && /pre-cure rev .* HEAD /.test(readFileSync(join(HERE, 'reproduce-his-round432.out'), 'utf8').split('\n')[diffLines[0]]);
leg('G1b', 'and the ONLY line that differs between his recording and mine is the HEAD stamp — derived'
  + ' by diffing the two files in this instrument, so a second difference would redden rather than pass unseen',
  diffLines === null ? 'REFUSED: the two recordings have different line counts'
    : 'differing line index/indices: [' + diffLines.join(', ') + '] · that line in mine: "'
      + readFileSync(join(HERE, 'reproduce-his-round432.out'), 'utf8').split('\n')[diffLines[0]].trim() + '"',
  onlyHeadDiffers);

// ---------------------------------------------------------------------------------------------
// G2 — his G1 pre-cure pin, re-checked here at my own stamp, by property as well as by bytes.
// ---------------------------------------------------------------------------------------------
const MOD = 'docs/research/round430-instruments/refusal-convention.mjs';
const SLICE = join(HERE, '..', 'round432-instruments', 'precure-refusal-convention.sliced.mjs');
const CURE_MARKER = 'paramsOf';
const precureFromGit = (() => { try { return git('show', HIS_PRECURE_REV + ':' + MOD); } catch { return null; } })();
const precureSlice = (() => { try { return readFileSync(SLICE, 'utf8'); } catch { return null; } })();
const liveMod = readFileSync(join(REPO, MOD), 'utf8');
const bytesMatch = precureFromGit !== null && precureSlice !== null && precureFromGit === precureSlice;
const propertyHolds = precureSlice !== null && !precureSlice.includes(CURE_MARKER) && liveMod.includes(CURE_MARKER);
leg('G2', 'his committed pre-cure slice IS the module text at the rev he stamped — byte-identical to'
  + ' `git show`, re-run here under my own checkout rather than taken from his cell — and the'
  + ' PROPERTY pin holds in both directions (420/422)',
  (precureFromGit === null ? 'REFUSED: `git show ' + HIS_PRECURE_REV + ':' + MOD + '` did not resolve'
    : 'byte-identical to git show ' + HIS_PRECURE_REV + ': ' + bytesMatch
      + ' · slice lacks "' + CURE_MARKER + '": ' + (precureSlice !== null && !precureSlice.includes(CURE_MARKER))
      + ' · live module carries it: ' + liveMod.includes(CURE_MARKER)),
  bytesMatch && propertyHolds);

// ---------------------------------------------------------------------------------------------
// G3 — the FOURTH cell of his 3 × 2, and the cure moves it the WRONG way.
//
// His matrix varied how the value reaches the input: slices the input / slices a module constant /
// derived by charAt. All three vary the VALUE. This cell varies what the parameter's name is DOING
// in the value: it is an object-literal KEY, not a reference to anything. The leg is a free-
// identifier mention test by its own docblock, and a key is not a free identifier.
// ---------------------------------------------------------------------------------------------
const KEY_PROBE = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return { span: { src: 1 } };
};
const KEY_CONTROL = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return { span: { q: 1 } };
};
const STRING_CELL = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return { span: { nope: 'src' } };
};
const cell = (fn) => {
  const s = fn.toString();
  return { pre: pre(s), cured: cured(s) };
};
const kp = cell(KEY_PROBE);
const kc = cell(KEY_CONTROL);
const sc = cell(STRING_CELL);
const g3ok = admitted(kp.pre) === false && admitted(kp.cured) === true
  && admitted(kc.pre) === false && admitted(kc.cured) === false
  && admitted(sc.pre) === false && admitted(sc.cured) === false;
leg('G3', 'THE FOURTH CELL HIS 3 × 2 DOES NOT HAVE, AND THE CURE MOVES IT THE WRONG WAY: a returned'
  + ' object whose NESTED KEY is spelled like the parameter, and whose value reads the input nowhere,'
  + ' was REFUSED pre-cure and is ADMITTED as the answer shape now. That is the UNDER-refusal'
  + ' direction he named as the dangerous one, and the cure introduced it. CONTROL: the same probe'
  + ' with the nested key renamed refuses in BOTH modules, so the cell is reading the key\'s NAME and'
  + ' not the probe\'s shape; and the same name as a string VALUE refuses in both, so his masked'
  + ' reading does hold where he claimed it',
  'KEY_PROBE { span: { src: 1 } } → pre ' + verdict(kp.pre) + ' ║ cured ' + verdict(kp.cured)
  + '\n        CONTROL { span: { q: 1 } } → pre ' + (admitted(kc.pre) ? 'ADMITTED' : 'refused')
  + ' ║ cured ' + (admitted(kc.cured) ? 'ADMITTED' : 'refused')
  + '\n        STRING CELL { span: { nope: \'src\' } } → pre ' + (admitted(sc.pre) ? 'ADMITTED' : 'refused')
  + ' ║ cured ' + (admitted(sc.cured) ? 'ADMITTED' : 'refused'),
  g3ok);

// ---------------------------------------------------------------------------------------------
// G4 — the message leg is comment-blind now; the KEY leg never was, and still is not.
//
// `entriesOf` locates the colon in the MASKED text and then slices the key out of the RAW text, so
// a doc comment above a key lands inside the key. The module's own docblock says the comment "cancels
// and the leg is comment-blind" — true of the message leg it was written for, false of this one.
// ---------------------------------------------------------------------------------------------
const COMMENTED_KEY = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return {
    /** the slice the caller asked for */
    span: src.slice(0, 3),
  };
};
const UNCOMMENTED_KEY = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return {
    span: src.slice(0, 3),
  };
};
const ck = cell(COMMENTED_KEY);
const uk = cell(UNCOMMENTED_KEY);
const commentInProbe = COMMENTED_KEY.toString().includes('/**');
const keyLegFired = ck.cured !== null && ck.cured.refused !== undefined
  && /non-identifier key/.test(ck.cured.refused);
const g4ok = commentInProbe && keyLegFired && admitted(ck.pre) === false
  && admitted(uk.pre) === true && admitted(uk.cured) === true;
leg('G4', 'G8 CURED THE MESSAGE LEG AND LEFT THE KEY LEG: one doc comment above a key in the returned'
  + ' object makes the key read as "/** … */ span" and refuses the whole function — in the CURED'
  + ' module as well as the pre-cure one. The CONTROL is the identical probe with the comment deleted,'
  + ' which derives the full convention in both. Over-refusal, the safe direction, but the module\'s'
  + ' own docblock sentence is written as a property of the module and is a property of one leg',
  'comment present in the probe source: ' + commentInProbe
  + ' · WITH the comment → pre ' + verdict(ck.pre) + ' ║ cured ' + verdict(ck.cured)
  + '\n        CONTROL comment deleted → pre ' + verdict(uk.pre) + ' ║ cured ' + verdict(uk.cured),
  g4ok);

// G4b — the overstating sentence, located in the live module's own text rather than quoted from memory.
// Written continuation-tolerant on purpose: the sentence is inside a block comment and wraps, so a
// flat string pattern answers "not present" for a sentence that is present. My first spelling of
// this leg did exactly that and reddened (329-331/367/409/429, again).
const CLAIM_RE = /a comment inside a value cancels and the leg is[\s*]+comment-blind/;
const claimHit = CLAIM_RE.exec(liveMod);
const claimLine = claimHit === null ? null : liveMod.slice(0, claimHit.index).split('\n').length;
leg('G4b', 'and the sentence G4 is measured against is IN the live module — located by running the'
  + ' pattern over the file in this instrument (329-331/367/409/429), not quoted from reading it',
  claimHit === null ? 'REFUSED: the sentence is not in the live module under this pattern'
    : MOD + ':' + claimLine + ' — "' + claimHit[0] + '"',
  claimHit !== null);

// G4c — and the live member. NOT PRE-REGISTERED, and said so: this cell was written after P2 came
// back refuted, to read at the granularity P2 should have been keyed at (345). The comment IS the
// cause of the non-identifier-key refusal — the REASON moves when the comment spans are deleted —
// while the member's VERDICT does not, because a second unmodelled return takes over. A leg keyed
// on the verdict cannot see this, which is exactly why P2 is refuted below rather than quietly
// re-keyed.
const stripCommentsEarly = (src) => {
  const spans = commentSpans(src);
  let out = '';
  let at = 0;
  for (const s of spans) { out += src.slice(at, s.start); at = s.end; }
  return out + src.slice(at);
};
const liveMember = await (async () => {
  const m = await import(join(REPO, 'scripts/lib/recall-tap.mjs'));
  const s = m.tapSummary.toString();
  return { withC: cured(s), without: cured(stripCommentsEarly(s)), spans: commentSpans(s).length };
})();
const keyLegOnMember = liveMember.withC.refused !== undefined
  && /non-identifier key/.test(liveMember.withC.refused);
const reasonMoved = liveMember.without.refused !== undefined
  && !/non-identifier key/.test(liveMember.without.refused);
leg('G4c', 'NOT PRE-REGISTERED (written after P2 came back refuted, and read at the granularity P2'
  + ' should have been keyed at — 345): the key leg has a LIVE member outside the round-track —'
  + ' `scripts/lib/recall-tap.mjs#tapSummary` — and the comment is its CAUSE: deleting the comment'
  + ' spans moves the REASON off the key leg while leaving the member refused for a different return',
  'with its own comments: ' + verdict(liveMember.withC)
  + '\n        comment spans deleted (' + liveMember.spans + ' spans): ' + verdict(liveMember.without),
  keyLegOnMember && reasonMoved);

// ---------------------------------------------------------------------------------------------
// G5 — reach. The population is selected with `git ls-tree` at a stamped rev and every member is
// asserted byte-identical to its blob, so "the live tree" and "the stamped rev" are the same claim
// here rather than two (414/415/416). The instrument's own directory is NOT in the population —
// 425, twice: a gate that walks its own directory reddens in every cell, and an instrument does
// not census its own source.
// ---------------------------------------------------------------------------------------------
const POP_DIR = 'scripts/lib/';
const popFiles = git('ls-tree', '--name-only', REV, POP_DIR).trim().split('\n').filter((f) => f.endsWith('.mjs'));
const selfExcluded = !popFiles.some((f) => f.includes('round433'));
const identical = popFiles.filter((f) => git('show', REV + ':' + f) === readFileSync(join(REPO, f), 'utf8'));
const cells = new Map();
const members = new Map();
const reasons = new Map();
const paramRefusals = [];
let fnCount = 0;
let importFails = 0;
for (const f of popFiles) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { importFails += 1; continue; }
  for (const [name, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    fnCount += 1;
    const s = v.toString();
    const a = admitted(pre(s));
    const b = cured(s);
    const k = (a ? 'admitted' : 'refused') + '->' + (admitted(b) ? 'admitted' : 'refused');
    cells.set(k, (cells.get(k) ?? 0) + 1);
    if (!members.has(k)) members.set(k, []);
    members.get(k).push(f + '#' + name);
    if (b.refused !== undefined) {
      const cls = /^the input is not nameable/.test(b.refused) ? 'the input is not nameable (paramsOf refused)'
        : /^a return form this reader does not model/.test(b.refused) ? 'a return form this reader does not model'
          : /^a non-identifier key/.test(b.refused) ? 'a non-identifier key'
            : /^no `return` site/.test(b.refused) ? 'no `return` site in the source'
              : /^no answer shape/.test(b.refused) ? 'no answer shape among the returns'
                : /^no refusal shape/.test(b.refused) ? 'no refusal shape among the returns'
                  : /that is neither all-message nor input-derived/.test(b.refused) ? 'neither all-message nor input-derived'
                    : 'UNCLASSIFIED: ' + b.refused.slice(0, 50);
      reasons.set(cls, (reasons.get(cls) ?? 0) + 1);
      if (/^the input is not nameable/.test(b.refused)) paramRefusals.push(f + '#' + name);
    }
  }
}
const unclassified = [...reasons.keys()].filter((k) => k.startsWith('UNCLASSIFIED'));
const g5ok = popFiles.length > 0 && identical.length === popFiles.length && selfExcluded
  && importFails === 0 && fnCount > 0 && unclassified.length === 0;
leg('G5', 'REACH, MEASURED: the module is a general reader of a subject\'s refusal convention by its'
  + ' own docblock. Over every function export of `' + POP_DIR + '` at a stamped rev — a population'
  + ' it is not aimed at but is now importable by — the transition matrix pre-cure → cured is a'
  + ' SINGLE cell. Each member is asserted byte-identical to its blob at the rev, the reason classes'
  + ' are positively keyed, and an UNCLASSIFIED reason reddens this leg rather than falling into a'
  + ' terminal bucket (411)',
  'rev ' + REV.slice(0, 8) + ' · files ' + popFiles.length + ' (all byte-identical to their blobs: '
  + (identical.length === popFiles.length) + ') · import failures ' + importFails
  + ' · function exports ' + fnCount
  + '\n        transitions: ' + [...cells].map(([k, c]) => k + ' ' + c).join(' ║ ')
  + '\n        refusal reasons: ' + [...reasons].sort((x, y) => y[1] - x[1]).map(([k, c]) => c + '× ' + k).join(' ║ '),
  g5ok);

// G5b — his two refusal legs are not vacuous in this population: the destructured form has members.
const declForms = paramRefusals.map((m) => {
  const [f, name] = m.split('#');
  const text = readFileSync(join(REPO, f), 'utf8');
  const hit = new RegExp('^export (?:function |const )' + name + '\\b.*$', 'm').exec(text);
  return hit === null ? name + ': NOT FOUND' : hit[0].trim();
});
leg('G5b', 'and his G4 refusal legs are NOT vacuous in a real population — `paramsOf` refuses on live'
  + ' members here, and their declaration lines are read out of the files rather than described, so'
  + ' the form that tripped it is visible',
  paramRefusals.length + ' member(s) refused by paramsOf: ' + (paramRefusals.join(', ') || 'none')
  + (declForms.length > 0 ? '\n        ' + declForms.join('\n        ') : ''),
  paramRefusals.length > 0 && declForms.every((d) => !d.endsWith('NOT FOUND')));

// ---------------------------------------------------------------------------------------------
// P1 — the under-admission of G3 is reachable only while the value carries no literal message.
// ---------------------------------------------------------------------------------------------
const KEY_PROBE_WITH_MESSAGE = (src) => {
  if (src === null) return null;
  if (src.length < 3) return { why: 'too short to read', how: 'pass a longer source' };
  return { span: { src: 1, note: 'constant' } };
};
const kpm = cell(KEY_PROBE_WITH_MESSAGE);
pred('P1', 'the G3 under-admission is reachable only while the value carries NO literal message: add'
  + ' a string anywhere in the same value and the all-message leg takes it back to a refusal',
  '{ span: { src: 1, note: \'constant\' } } → cured ' + verdict(kpm.cured),
  admitted(kpm.cured) === false);

// ---------------------------------------------------------------------------------------------
// P2 — how much of the population's refusal is caused by COMMENTS rather than by shapes.
// Counterfactual: delete every comment span (located with the shared `commentSpans`, not a
// hand-rolled matcher) from each member's source and re-read. Predicted: exactly one member moves.
// ---------------------------------------------------------------------------------------------
const stripComments = (src) => {
  const spans = commentSpans(src);
  let out = '';
  let at = 0;
  for (const s of spans) { out += src.slice(at, s.start); at = s.end; }
  return out + src.slice(at);
};
const movers = [];
let probed = 0;
for (const f of popFiles) {
  let mod;
  try { mod = await import(join(REPO, f)); } catch { continue; }
  for (const [name, v] of Object.entries(mod)) {
    if (typeof v !== 'function') continue;
    const s = v.toString();
    const bare = stripComments(s);
    if (bare === s) continue;
    probed += 1;
    if (admitted(cured(s)) !== admitted(cured(bare))) movers.push(f + '#' + name);
  }
}
pred('P2', 'COMMENTS, not shapes, account for exactly ONE of the population\'s refusals: deleting every'
  + ' comment span from each member\'s own source (located with the shared `commentSpans`) moves'
  + ' exactly one member\'s verdict, and it is the one the key leg refused. LEFT RED: the prediction'
  + ' was keyed on the VERDICT and the comment moves only the REASON — 18 members carry a comment and'
  + ' none of their verdicts move, because every one of them refuses for a second reason as well.'
  + ' G4c above reads it at the granularity this should have had',
  'members carrying a comment: ' + probed + ' · verdict moved for ' + movers.length + ': ['
  + (movers.join(', ') || 'none') + '] · members refused with "a non-identifier key": '
  + (reasons.get('a non-identifier key') ?? 0),
  movers.length === 1 && (reasons.get('a non-identifier key') ?? 0) === 1);

// ---------------------------------------------------------------------------------------------
// P3 — his P1: round430's own P5 inverted inside a day. Re-driven here, read out of the files.
// ---------------------------------------------------------------------------------------------
const round430Published = sliceVerdicts(join(HERE, '..', 'round430-instruments', 'drive4.after-promotion.out'));
const round430Rerun = (() => {
  try {
    const out = execFileSync('node', [join(REPO, 'docs/research/round430-instruments/grade-the-convention-gate.mjs')],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const g = /^GATE:.*$/m.exec(out);
    const p = /^PREDICTIONS:.*$/m.exec(out);
    return g === null || p === null ? null : { gate: g[0].trim(), preds: p[0].trim(), out };
  } catch (e) {
    const out = String(e.stdout ?? '');
    const g = /^GATE:.*$/m.exec(out);
    const p = /^PREDICTIONS:.*$/m.exec(out);
    return g === null || p === null ? null : { gate: g[0].trim(), preds: p[0].trim(), out };
  }
})();
const hisPostcure = sliceVerdicts(join(HERE, '..', 'round432-instruments', 'round430-postcure.out'));
const p3Readable = round430Published !== null && round430Rerun !== null && hisPostcure !== null;
pred('P3', 'HIS P1 REPRODUCES HERE, in a third fire and a different worktree: round430\'s published'
  + ' PREDICTIONS line and the same instrument re-driven at the same code differ, and today\'s'
  + ' reading matches the one HE recorded this fire. All three lines sliced out of files',
  p3Readable
    ? 'published (round430 drive4.after-promotion.out): "' + round430Published.preds + '"'
      + '\n        his round432 re-drive (round430-postcure.out): "' + hisPostcure.preds + '"'
      + '\n        my re-drive, this fire, same code: "' + round430Rerun.preds + '"'
      + '\n        published differs from today: ' + (round430Published.preds !== round430Rerun.preds)
      + ' · my reading matches his: ' + (hisPostcure.preds === round430Rerun.preds)
    : 'REFUSED: one of the three readings could not be sliced',
  p3Readable && round430Published.preds !== round430Rerun.preds
    && hisPostcure.preds === round430Rerun.preds);

// ---------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------
console.log('Round 433 — his Round 432 graded, and the cure\'s reach censused\n');
for (const l of legs) {
  console.log('  ' + (l.ok === true ? 'TRUE ' : 'FALSE') + ' ' + l.id + '  ' + l.claim);
  console.log('        ' + l.detail);
}
console.log('');
for (const p of preds) {
  console.log('  ' + (p.landed === true ? 'TRUE ' : 'FALSE') + ' ' + p.id + '  ' + p.claim);
  console.log('        ' + p.detail);
}
const failed = legs.filter((l) => l.ok !== true);
const refuted = preds.filter((p) => p.landed !== true);
console.log('\nGATE: ' + (failed.length === 0) + '   (' + legs.length + ' leg(s))'
  + (failed.length === 0 ? '' : ' — FALSE: ' + failed.map((l) => l.id).join(', ')));
console.log('PREDICTIONS: ' + (preds.length - refuted.length) + ' landed, ' + refuted.length
  + ' refuted' + (refuted.length === 0 ? '' : ': ' + refuted.map((p) => p.id).join(' | ')));
console.log('\n  rev ' + REV.slice(0, 8) + ' · his pre-cure rev ' + HIS_PRECURE_REV
  + ' · worktree ' + (git('status', '--porcelain').trim() === '' ? 'clean' : 'DIRTY'));