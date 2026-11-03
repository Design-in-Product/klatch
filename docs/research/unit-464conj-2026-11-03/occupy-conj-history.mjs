#!/usr/bin/env node
// occupy-conj-history — unit-464conj. Is `conjunctive × history-keyed` an OCCUPIABLE cell?
// Grades P1, P2 and P4 of PRE-REGISTRATION.md.
//
// Daedalus's v1.3 polarity lemma cannot reach this cell (`conjunctive` has no operator to negate)
// and my own arithmetic only explains why it is EMPTY in a 13-row sample. So it is answered by
// CONSTRUCTION, in a SCRATCH GIT REPO under the OS temp dir — never Klatch's own repo, so no index
// of any worktree is touched.
// [[feedback_drive_a_counterfactual_in_a_scratch_git_repo]]
// [[feedback_dont_touch_the_index_while_the_sweep_drives]]
//
// THE MOVE. C2b@99 is `delta × history-keyed`: `atPin !== atRecency`, `atRecency` lifted at
// `git log -1 --format=%h -- <path>`, a recency SELECTOR. Negating that operator reached
// `identity × history-keyed` (mine, 11-02). There is a SECOND transformation, and it is the one
// that reaches `conjunctive`: replace one OPERAND of the comparison with a LITERAL, keeping both
// state reads live. Each state is then tested on its own against a literal and the two are never
// operands of one comparison — axis A `conjunctive` by the convention's own definition — while the
// selector-derived anchor is untouched, so axis B does not move. **operand→literal substitution.**
//
// THE LEG IS A REAL FILE, DRIVEN BY `node`, AND GRADED OFF ITS OWN BYTES. The predicate is not
// written twice (once to run, once to read); `leg.mjs` is generated, executed, and then read by the
// span/operator reader LIFTED out of my own `unit-464cell-2026-11-02/grade-cell.mjs` at the pin —
// not copied. A copy with a verbatim pin beside it can drift between the fire that writes the pin
// and the fire that reads it; Daedalus made that point on 11-03 and he is right.
//
// FOUR MODES, all over THE SAME TWO READS and the same two literals:
//   conjhk   atPin === <lit> && atRecency === <lit>    conjunctive, selector anchor  — THE CELL
//   conjfix  atPin === <lit> && atFixed   === <lit>    conjunctive, both anchors fixed — THE CONTROL
//   delta    atPin !== atRecency                        C2b's own shape
//   identity atPin === atRecency                        the cell I built on 11-02
// `conjhk` and `conjfix` differ by ONE ARGUMENT — whether the second read's `git log -1` is given a
// rev or not. One reader reporting "did not move" cannot be told from a dead reader, so both are
// read at every state and exactly one of them is registered to move.
// [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
//
// THE CRIPPLE, registered in PRE-REGISTRATION.md: CONJ_CMP_MAX, the ceiling on state-vs-state
// comparisons the constructed leg may carry, re-keyed from 0 to a value no reader can produce.
// Keyed on the KEY, not the subject: `leg.mjs`'s hash is asserted identical in both arms.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { stripSource } from '../../../scripts/lib/strip-source.mjs';

const PIN = process.env.PIN ?? '0c23e551';
const MY_READER = 'docs/research/unit-464cell-2026-11-02/grade-cell.mjs';
const SUBJ_ROOT = 'docs/research/';
// The registered ceiling on STATE-VS-STATE comparisons in a `conjunctive` leg: zero, by the
// convention's definition. The cripple re-keys this and nothing else.
// THE CRIPPLE SWITCH WAS HERE AND IS REMOVED, as registered. During drives 5 and 6 these two
// lines read the environment variable `CRIPPLE_CONJ_CMP_MAX`; `cripple-arm.mjs` set it to -1, a
// value no comparison count can produce. The instrument's `git hash-object` was
// 7916f8c3f84ed21c5463e2418bb0348638ff5eac in BOTH arms, so the cripple was a switch on the KEY
// and not on the subject. drive6 moved exactly one leg (GCONJSRC ok -> RED) and exactly one verdict
// (P2 LANDS -> REFUTED); drive6.delta-vs-drive5.txt is the computed delta. The switch is removed so
// that the committed tree cannot drive a cripple by inheriting an environment variable, which means
// THE COMMITTED INSTRUMENT IS NOT BYTE-IDENTICAL TO THE ONE DRIVEN IN DRIVES 1-6 — drive7 re-drives
// the committed bytes and records its own hash.
const CONJ_CMP_MAX = 0;
const CRIPPLE = false;

let red = 0;
let unrunnable = 0;
const seen = new Set();
const check = (id, cond, msg) => {
  if (seen.has(id)) { console.log(`DUPLICATE LEG ID ${id}`); red += 1; }
  seen.add(id);
  if (cond === true) console.log(`${id}  ok    ${msg}`);
  else { console.log(`${id}  RED   ${msg}`); red += 1; }
};
// A refusal is its own outcome and is NOT conjoined into any verdict.
// [[feedback_a_refusal_conjoined_away_publishes_a_false_red]]
const refuse = (id, msg) => { console.log(`${id}  UNRUNNABLE  ${msg}`); unrunnable += 1; };

const verdicts = [];
const verdict = (p, registered, measured, pred) => {
  const v = (measured === null || measured === undefined) ? 'UNRESOLVED' : (pred(measured) ? 'LANDS' : 'REFUTED');
  verdicts.push({ p, registered, measured, v });
  console.log(`\nVERDICT ${p}: ${v}\n  registered: ${registered}\n  measured:   ${JSON.stringify(measured)}`);
};

const gitIn = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) { return { err: String(e.message).split('\n')[0] }; }
};
// For reading Klatch's own tree (the lift source only). Array form, matching my reader's contract.
const git = (args) => {
  try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch { return null; }
};

console.log(`occupy-conj-history — PIN=${PIN} · CONJ_CMP_MAX=${CONJ_CMP_MAX}${CRIPPLE ? ' (CRIPPLED)' : ''}`);
if (CRIPPLE) console.log(`!! CRIPPLE-CONJ-CMP-MAX present: the registered KEY is re-aimed in this arm; leg.mjs is untouched.\n`);

// ===========================================================================================
// Lift MY OWN span/operator reader out of my own file at the pin. No copy exists in this unit.
// ===========================================================================================
// drive1 refused here, correctly in form and wrong in its input model: the reader was read at
// `${PIN}`, the SUBJECT's pin, and my own grade-cell.mjs is not reachable from that rev — it was
// committed after it. An instrument's own input cannot be pinned to the subject's rev. It is read
// at HEAD instead, with the HEAD blob asserted byte-identical to the worktree copy, which is the
// same input model my own grade-cell.mjs uses for its own TSV.
// [[feedback_an_instruments_own_input_cannot_be_pinned_to_the_subjects_rev]]
const readerSrc = git(['show', `HEAD:${MY_READER}`]);
let readerWork = null;
try { readerWork = readFileSync(MY_READER, 'utf8'); } catch { readerWork = null; }
let reader = null;
if (readerSrc === null || readerWork === null) {
  refuse('GLIFT', `${MY_READER} unreadable (HEAD=${readerSrc === null ? 'missing' : 'ok'}, worktree=${readerWork === null ? 'missing' : 'ok'}) — the constructed leg's axis A would be my say-so, and I will not fall back to a fresh reader of my own`);
} else if (readerSrc !== readerWork) {
  refuse('GLIFT', `${MY_READER} differs between HEAD and the worktree (${readerSrc.length} vs ${readerWork.length} bytes) — the reader lifted below would not be the committed one`);
} else {
  const START = 'const CMP = /===';
  const ENDMARK = 'return { cmps, andTop, orTop,';
  const s = readerSrc.indexOf(START);
  const e0 = readerSrc.indexOf(ENDMARK, s);
  const e = e0 < 0 ? -1 : readerSrc.indexOf('\n};', e0);
  if (s < 0 || e0 < 0 || e < 0) {
    refuse('GLIFT', `a lift anchor is missing at the pin (start ${s}, endmark ${e0}, close ${e}) — a present anchor is not an intact span and nothing below would be quotable`);
  } else {
    const region = readerSrc.slice(s, e + 3);
    let built = null;
    try {
      built = new Function('git', 'PIN', 'SUBJ_ROOT', 'stripSource',
        `${region}\nreturn { CMP, spanOf, countOps };`)(git, PIN, SUBJ_ROOT, stripSource);
    } catch (err) {
      refuse('GLIFT', `the region lifted but would not evaluate: ${String(err.message).split('\n')[0]}`);
    }
    // A present anchor is not an intact span: assert both definitions are there AND callable.
    // [[feedback_a_present_anchor_does_not_mean_an_intact_span]]
    if (built !== null) {
      const intact = /const spanOf = /.test(region) && /const countOps = /.test(region)
        && typeof built.spanOf === 'function' && typeof built.countOps === 'function';
      check('GLIFT', intact,
        `spanOf/countOps lifted from ${MY_READER} at HEAD (blob byte-identical to the worktree, ${readerSrc.length} bytes): ${region.split('\n').length} lines, both present, both callable. No copy of the reader exists in this unit, so there is nothing to keep in sync`);
      if (intact) reader = built;
    }
  }
}

// ===========================================================================================
// Build the scratch repo
// ===========================================================================================
const root = mkdtempSync(join(tmpdir(), 'klatch-464conj-'));
console.log(`\nscratch repo: ${root}`);
if (gitIn(root, 'init', '--quiet', '-b', 'main')?.err) {
  refuse('GSCRATCH', 'git init failed in the scratch dir'); process.exit(2);
}
gitIn(root, 'config', 'user.email', 'theseus@example.invalid');
gitIn(root, 'config', 'user.name', 'unit-464conj scratch');

const SUBJECT = 'subject.txt';
writeFileSync(join(root, SUBJECT), 'the property the leg is really about: FOUR\n');
writeFileSync(join(root, 'unrelated.txt'), 'nothing to do with it\n');
gitIn(root, 'add', '-A');
if (gitIn(root, 'commit', '--quiet', '-m', 'add the subject')?.err) {
  refuse('GSCRATCH', 'first commit failed'); process.exit(2);
}
const PIN_REV = gitIn(root, 'rev-parse', 'HEAD');
check('GSCRATCH', typeof PIN_REV === 'string' && /^[0-9a-f]{40}$/.test(PIN_REV),
  `scratch repo built with one commit; the leg's pinned rev is ${PIN_REV}`);

// ===========================================================================================
// THE LEG, generated with its literals BAKED IN — because "compared to a literal" is what axis A
// `conjunctive` is about, and a comparison against `process.env.X` is not that.
// ===========================================================================================
const LEG_SRC = (PIN_REV) => `// generated by unit-464conj/occupy-conj-history.mjs — the four modes under test.
import { execFileSync } from 'node:child_process';
const g = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const MODE = process.argv[2];
const atPin = g('rev-parse', '${PIN_REV}');
const atRecency = g('log', '-1', '--format=%H', '--', 'subject.txt');
const atFixed = g('log', '-1', '--format=%H', '${PIN_REV}', '--', 'subject.txt');
let ok = null;
let c1 = null;
let c2 = null;
if (MODE === 'conjhk') {
  c1 = atPin === '${PIN_REV}';
  c2 = atRecency === '${PIN_REV}';
  ok = atPin === '${PIN_REV}' && atRecency === '${PIN_REV}';
} else if (MODE === 'conjfix') {
  c1 = atPin === '${PIN_REV}';
  c2 = atFixed === '${PIN_REV}';
  ok = atPin === '${PIN_REV}' && atFixed === '${PIN_REV}';
} else if (MODE === 'delta') {
  ok = atPin !== atRecency;
} else if (MODE === 'identity') {
  ok = atPin === atRecency;
}
console.log(JSON.stringify({ mode: MODE, verdict: ok === null ? 'UNRUNNABLE' : (ok ? 'GREEN' : 'RED'), atPin, atRecency, atFixed, c1, c2 }));
`;
writeFileSync(join(root, 'leg.mjs'), LEG_SRC(PIN_REV));
const legHash = createHash('sha256').update(readFileSync(join(root, 'leg.mjs'))).digest('hex');
console.log(`leg.mjs sha256 ${legHash}`);

const driveIn = (r, mode) => {
  try {
    const out = execFileSync('node', ['leg.mjs', mode], { cwd: r, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(out.trim().split('\n').pop());
  } catch (e) { return { mode, verdict: 'UNRUNNABLE', err: String(e.message).split('\n')[0] }; }
};
const drive = (mode) => driveIn(root, mode);

// A whole scratch repo plus its generated leg, so the P2 series can start from an UNPERTURBED
// state0 instead of inheriting arm B's commit. drive1 ran the series in the arm-B repo and every
// row of it read RED at every state: four constants agreeing is not agreement.
// [[feedback_identical_runs_read_as_no_effect_when_all_three_are_dead]]
const buildScratch = (tag) => {
  const r = mkdtempSync(join(tmpdir(), `klatch-464conj-${tag}-`));
  if (gitIn(r, 'init', '--quiet', '-b', 'main')?.err) return null;
  gitIn(r, 'config', 'user.email', 'theseus@example.invalid');
  gitIn(r, 'config', 'user.name', 'unit-464conj scratch');
  writeFileSync(join(r, SUBJECT), 'the property the leg is really about: FOUR\n');
  writeFileSync(join(r, 'unrelated.txt'), 'nothing to do with it\n');
  gitIn(r, 'add', '-A');
  if (gitIn(r, 'commit', '--quiet', '-m', 'add the subject')?.err) return null;
  const rev = gitIn(r, 'rev-parse', 'HEAD');
  if (typeof rev !== 'string' || !/^[0-9a-f]{40}$/.test(rev)) return null;
  writeFileSync(join(r, 'leg.mjs'), LEG_SRC(rev));
  return { root: r, rev };
};

// ===========================================================================================
// P1 — the two arms. arm A changes nothing; arm B makes ONE commit that touches the path and
// changes nothing the leg is about.
// ===========================================================================================
const a1 = drive('conjhk');
const a1fix = drive('conjfix');
const a2 = drive('conjhk');
const a2fix = drive('conjfix');
console.log(`\narm A (control — no commit):`);
console.log(`  conjunctive × history-keyed : ${a1.verdict} -> ${a2.verdict}   (c1 ${a1.c1}/${a2.c1} · c2 ${a1.c2}/${a2.c2})`);
console.log(`  conjunctive, anchors FIXED  : ${a1fix.verdict} -> ${a2fix.verdict}`);

const b1 = drive('conjhk');
const b1fix = drive('conjfix');
appendFileSync(join(root, SUBJECT), '# a trailing comment. The property above is still FOUR.\n');
gitIn(root, 'add', '-A');
const cB = gitIn(root, 'commit', '--quiet', '-m', 'touch the path without touching the property');
if (cB?.err) {
  refuse('GARMB', `the perturbing commit failed: ${cB.err} — arm B is undriven and P1 stays unmeasured`);
}
const b2 = cB?.err ? null : drive('conjhk');
const b2fix = cB?.err ? null : drive('conjfix');

let p1measured = null;
let p4measured = null;
if (b2 !== null) {
  console.log(`\narm B (perturbed — ONE commit touching the path, property unchanged):`);
  console.log(`  conjunctive × history-keyed : ${b1.verdict} -> ${b2.verdict}   (c1 ${b1.c1}/${b2.c1} · c2 ${b1.c2}/${b2.c2})`);
  console.log(`  conjunctive, anchors FIXED  : ${b1fix.verdict} -> ${b2fix.verdict}`);

  // The TARGET of the perturbation is asserted present BEFORE any delta is read.
  // [[feedback_a_mutation_counterfactual_needs_its_target_asserted]]
  const newest = gitIn(root, 'log', '-1', '--format=%H', '--', SUBJECT);
  check('GTARGET', typeof newest === 'string' && newest !== PIN_REV,
    `the perturbation's target moved: the newest commit touching ${SUBJECT} is now ${String(newest).slice(0, 8)}, was ${PIN_REV.slice(0, 8)}`);

  check('GARMA', a1.verdict === 'GREEN' && a2.verdict === 'GREEN',
    `matched control: the conjunctive × history-keyed leg reads ${a1.verdict} -> ${a2.verdict} with no commit (registered: GREEN -> GREEN)`);
  check('GARMB', b1.verdict === 'GREEN' && b2.verdict === 'RED',
    `perturbed: the same leg reads ${b1.verdict} -> ${b2.verdict} after one commit that changes nothing it is about (registered: GREEN -> RED)`);
  check('GDELTAVSCTRL', a2.verdict !== b2.verdict,
    `the two arms DIFFER at the second read (${a2.verdict} vs ${b2.verdict}) — a single arm could not have told occupiable from dead`);
  // The reader-is-alive control, in the other direction: the SAME leg with its second anchor given
  // a rev instead of a selector does NOT move across the same commit.
  check('GFIXEDCTRL', b1fix.verdict === 'GREEN' && b2fix.verdict === 'GREEN' && b1fix.atFixed === b2fix.atFixed,
    `the one-argument-different control holds: anchors-fixed conjunctive reads ${b1fix.verdict} -> ${b2fix.verdict} across the same commit and its figure is byte-identical (${String(b1fix.atFixed).slice(0, 8)} -> ${String(b2fix.atFixed).slice(0, 8)}). Exactly one of the two readers moved`);

  const propAtPin = gitIn(root, 'show', `${PIN_REV}:${SUBJECT}`);
  const propNow = gitIn(root, 'show', `HEAD:${SUBJECT}`);
  const fourAtPin = typeof propAtPin === 'string' && /FOUR/.test(propAtPin);
  const fourNow = typeof propNow === 'string' && /FOUR/.test(propNow);
  check('GFALSERED', fourAtPin && fourNow,
    `the property is FOUR at the pin and FOUR now (${fourAtPin}/${fourNow}) — so arm B's RED reports a change that did not happen, which is the hazard axis B's prescription predicts`);

  p1measured = {
    armA: `${a1.verdict}->${a2.verdict}`,
    armB: `${b1.verdict}->${b2.verdict}`,
    fixedControlArmB: `${b1fix.verdict}->${b2fix.verdict}`,
    fixedFigureMoved: b1fix.atFixed !== b2fix.atFixed,
  };

  // =========================================================================================
  // P4 — axis B's "exactly one value holds", on this one leg.
  // conjunct 1 reads a FROZEN anchor: no commit can move its figure  → immovable
  // conjunct 2 reads a RECENCY SELECTOR: any commit touching the path moves it → history-keyed
  // =========================================================================================
  const c1Figure = { before: b1.atPin, after: b2.atPin };
  const c2Figure = { before: b1.atRecency, after: b2.atRecency };
  check('GC1FROZEN', c1Figure.before === c1Figure.after && b1.c1 === true && b2.c1 === true,
    `conjunct 1's figure is byte-identical across the perturbation (${String(c1Figure.before).slice(0, 8)} -> ${String(c1Figure.after).slice(0, 8)}) and its own truth value never changes — no commit can move it, which is axis B \`immovable\``);
  check('GC2MOVED', c2Figure.before !== c2Figure.after && b1.c2 === true && b2.c2 === false,
    `conjunct 2's figure MOVED on a commit that touched the path and nothing else (${String(c2Figure.before).slice(0, 8)} -> ${String(c2Figure.after).slice(0, 8)}) and its truth value flipped true->false — which is axis B \`history-keyed\``);
  p4measured = {
    conjunct1: c1Figure.before === c1Figure.after ? 'immovable' : 'moved',
    conjunct2: c2Figure.before !== c2Figure.after ? 'history-keyed' : 'did-not-move',
    oneLegTwoCells: c1Figure.before === c1Figure.after && c2Figure.before !== c2Figure.after,
  };
}

// ===========================================================================================
// P2 — operand→literal substitution preserves axis B: the anchor TUPLE is the same in all four
// modes at every state, while the constructed leg carries 0 state-vs-state comparisons.
// ===========================================================================================
const STATES = [];
const series = buildScratch('series');
if (series === null) {
  refuse('GSERIES', 'the P2 series scratch repo could not be built — P2 stays unmeasured rather than being read off the arm-B repo, whose state0 already carries the perturbing commit');
} else {
  console.log(`\nP2 — four modes over successive states, same two reads throughout.`);
  console.log(`series scratch repo: ${series.root}  (FRESH — state0 is unperturbed)`);
  const record = (label) => {
    const rows = ['conjhk', 'conjfix', 'delta', 'identity'].map((m) => driveIn(series.root, m));
    STATES.push({ label, rows });
    console.log(`  ${label.padEnd(10)} ` + rows.map((r) => `${r.mode}=${r.verdict}`).join(' · ')
      + `  tuple=(${String(rows[0].atPin).slice(0, 8)},${String(rows[0].atRecency).slice(0, 8)})`);
  };
  record('state0');
  for (let i = 1; i <= 4; i += 1) {
    appendFileSync(join(series.root, SUBJECT), `# touch ${i}\n`);
    gitIn(series.root, 'add', '-A');
    const c = gitIn(series.root, 'commit', '--quiet', '-m', `touch ${i}`);
    if (c?.err) { refuse(`GSTATE${i}`, `commit for state ${i} failed: ${c.err}`); break; }
    record(`state${i}`);
  }
}

let p2measured = null;
if (STATES.length >= 5) {
  // Compare the anchor tuple MEMBER BY MEMBER across modes, not a joined string — a joined
  // comparison cannot see an empty member. [[feedback_a_joined_string_comparison_cannot_see_an_empty_member]]
  const tupleAgree = STATES.filter((s) => {
    const t = s.rows.map((r) => [r.atPin, r.atRecency]);
    return t.every((x) => x[0] === t[0][0] && x[1] === t[0][1])
      && t.every((x) => typeof x[0] === 'string' && x[0] !== '' && typeof x[1] === 'string' && x[1] !== '');
  }).length;
  check('GTUPLE', tupleAgree === STATES.length,
    `the anchor tuple (atPin, atRecency) is identical across all four modes at ${tupleAgree} of ${STATES.length} states, every member non-empty — the substitution changes what the predicate DOES with the pair, not what the pair READS`);
  // And the complements run opposite, which is the polarity lemma reproducing inside this unit.
  const oppos = STATES.filter((s) => {
    const d = s.rows.find((r) => r.mode === 'delta');
    const i = s.rows.find((r) => r.mode === 'identity');
    return d.verdict !== i.verdict && d.verdict !== 'UNRUNNABLE' && i.verdict !== 'UNRUNNABLE';
  }).length;
  check('GPOLARITY', oppos === STATES.length,
    `delta and identity give OPPOSITE verdicts at ${oppos} of ${STATES.length} states — Daedalus's polarity lemma reproduces here as a by-product, on anchors I built rather than the ones he did`);
  // The conjunctive leg tracks the IDENTITY polarity, not the delta one — because the literal it
  // was given is the pin, and substituting the other operand would have tracked delta.
  const tracksIdentity = STATES.filter((s) => {
    const c = s.rows.find((r) => r.mode === 'conjhk');
    const i = s.rows.find((r) => r.mode === 'identity');
    return c.verdict === i.verdict;
  }).length;
  // Agreement between two CONSTANTS is not agreement. The series must vary for GTRACKS to say
  // anything, so the variation is its own registered leg rather than an assumption.
  // [[feedback_two_keys_sharing_a_denominator_agree_vacuously]]
  const conjVerdicts = [...new Set(STATES.map((s) => s.rows.find((r) => r.mode === 'conjhk').verdict))];
  check('GNONCONST', conjVerdicts.length >= 2,
    `the conjunctive leg is NOT constant across the series — it takes ${conjVerdicts.length} distinct verdicts [${conjVerdicts.join(',')}] over ${STATES.length} states, so GTRACKS below is an agreement between two varying readers and not between two constants`);
  check('GTRACKS', tracksIdentity === STATES.length,
    `the conjunctive leg's verdict matches the identity leg's at ${tracksIdentity} of ${STATES.length} states — the substitution preserves the leg's DIRECTION as well as its figure`);

  if (reader === null) {
    refuse('GCONJSRC', 'the reader did not lift, so the constructed leg\'s axis A is unmeasured and P2 cannot be resolved off my own say-so');
  } else {
    // Read the constructed leg's OWN BYTES — the same bytes node executed.
    const legText = readFileSync(join(root, 'leg.mjs'), 'utf8');
    const stripped = stripSource(legText, true);
    const conjLine = stripped.split('\n').find((l) => l.includes("ok = atPin ===") && l.includes('&&'));
    if (conjLine === undefined) {
      refuse('GCONJSRC', 'the conjunctive predicate line is not findable in the generated leg after stripping — the span model cannot be applied and nothing below is quotable');
    } else {
      const ops = reader.countOps(conjLine);
      const stateVsState = ops.cmps - ops.litCmps;
      console.log(`\nthe constructed leg's own predicate, read by the lifted reader:`);
      console.log(`  ${conjLine.trim()}`);
      console.log(`  cmps=${ops.cmps} litCmps=${ops.litCmps} stateVsState=${stateVsState} &&=${ops.andTop} ||=${ops.orTop}`);
      check('GCONJSRC', stateVsState <= CONJ_CMP_MAX && ops.litCmps >= 2 && ops.cmps >= 2,
        `the constructed predicate carries ${ops.cmps} comparisons of which ${ops.litCmps} are against a LITERAL, so state-vs-state comparisons = ${stateVsState} (registered ceiling: ${CONJ_CMP_MAX}). It is axis A \`conjunctive\` by the convention's own definition, measured off the bytes node executed and not asserted by me`);
      p2measured = { states: STATES.length, tupleAgree, oppositePolarity: oppos, tracksIdentity, distinctConjVerdicts: conjVerdicts.length, cmps: ops.cmps, litCmps: ops.litCmps, stateVsState };
    }
  }
} else {
  refuse('GTUPLE', `only ${STATES.length} states were driven; the registered minimum is 5`);
}

// ===========================================================================================
// Verdicts
// ===========================================================================================
verdict('P1', 'arm A GREEN->GREEN, arm B GREEN->RED, and the anchors-fixed control byte-identical across arm B\'s commit',
  p1measured, (m) => m.armA === 'GREEN->GREEN' && m.armB === 'GREEN->RED'
    && m.fixedControlArmB === 'GREEN->GREEN' && m.fixedFigureMoved === false);
verdict('P2', 'anchor tuples identical across modes at >=5 of 5 states, the series non-constant, state-vs-state comparisons 0, literal comparisons >=2',
  p2measured, (m) => m.states >= 5 && m.tupleAgree === m.states && m.distinctConjVerdicts >= 2
    && m.stateVsState <= CONJ_CMP_MAX && m.litCmps >= 2);
verdict('P4', 'one constructed leg whose conjunct 1 is immovable and conjunct 2 is history-keyed — i.e. simultaneously in two axis-B cells',
  p4measured, (m) => m.oneLegTwoCells === true);

const legs = seen.size;
console.log(`\n=========================================================`);
console.log(`occupy-conj-history: ${legs} legs · RED ${red} · UNRUNNABLE ${unrunnable}`);
for (const v of verdicts) console.log(`  ${v.p}: ${v.v}`);
console.log(`VERDICT ${red === 0 && unrunnable === 0 ? 'GREEN' : red > 0 ? 'RED' : 'UNRUNNABLE'} at ${legs} legs`);
console.log(`leg.mjs sha256 ${legHash} — asserted identical across cripple arms`);
console.log(`scratch repo left at ${root} for inspection; it is outside the Klatch tree.`);
process.exit(red > 0 ? 1 : unrunnable > 0 ? 2 : 0);
