/**
 * Round 430 — grading the cure for Theseus's Round 429 §1/§6 routed item.
 *
 * His charge, granted: `round413-instruments/attack-g7-and-grade-the-branch-layer.mjs` slices his
 * `topLevelTernary` honestly and then RE-TYPES his refusal convention — `t.refused === undefined`
 * and `t.refused !== undefined`, copied from `round412:518`. If he changed the convention, my legs
 * would grade the new one with the old reading and stay green. He offered me the choice of remedy:
 * a slice of the verdict's text, or a gate on the convention. I took the gate, because the text he
 * pointed at (`got`) is a loop-local in his file and cannot be sliced as a value — and because a
 * gate is the form that closes the class rather than the instance: `refusal-convention.mjs` in
 * this directory reads ANY function's convention off its own returns and is not keyed on his
 * spelling at all. No key name is typed in it.
 *
 * ## What this file grades, and why a mutation grid rather than a known positive
 *
 * Driving round413 today prints `refused 0`: not one declaration in his live corpus exercises the
 * refusal path. So the live population cannot distinguish the re-typed predicate from the derived
 * one — both are correct on it, which is exactly the latency Theseus named. The reading has to be
 * a confusion matrix over mutated copies of his function (418), with each cell varying one thing:
 *
 *   readers  × conventions
 *   ─────────────────────────────────────────────────────────────────────────────────────────────
 *   OLD  = his convention re-typed: `t !== null && t.refused === undefined`
 *   NEW  = `classify(t, conventionOf(topLevelTernary.toString()))`
 *   LIVE = his function as it stands
 *   M1   = the success return also emits `refused: false`  (an absence test inverts)
 *   M2   = the refusal key is renamed `refused` -> `declined`, all 3 sites in the slice
 *   M3   = CONTROL: one refusal MESSAGE reworded, the convention untouched
 *
 * M3 is what makes M1 and M2 readings rather than "my gate reacts to any edit": a control that
 * must move nothing (411 — one control cannot grade two things, so the message edit is its own
 * cell and not a caveat on the others).
 *
 * Each mutation asserts its anchor occurs EXACTLY ONCE before it is applied, and each cell gates
 * that the FIGURE MOVED rather than that the edit landed (347/389/422).
 *
 * HIS READER IS SLICED, NOT RETYPED — the same discipline round413 already used, with one repair:
 * round413 pins the cut as the literal `CUT = 422`, a POSITION. This file derives it as a property
 * — the unique line opening his first non-definition section — and reports both, because a
 * positional pin that happens to still be right is a pin that drifts silently (422).
 *
 * The round413 cure is itself graded, at the end, by re-driving round413 and comparing its verdict
 * lines to a pre-cure baseline recorded in this directory before anything was edited.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { conventionOf, classify, keyOf } from './refusal-convention.mjs';

const REPO = fileURLToPath(new URL('../../..', import.meta.url));
const SELF = relative(REPO, fileURLToPath(import.meta.url)).split('\\').join('/');
const SELF_DIR = `${SELF.split('/').slice(0, -1).join('/')}/`;
const HIS412 = 'docs/research/round412-instruments/resolve-the-ternary-and-reconstruct-the-nine.mjs';
const MY413 = 'docs/research/round413-instruments/attack-g7-and-grade-the-branch-layer.mjs';
const BASELINE = `${SELF_DIR}baseline-round413-redriven-precure.out`;

const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });

// ─── pre-registration (405: never draft the slot for a measurement that has not run) ────────────
const EXPECTED = [
  ['G1', 'the slice is regenerated from his live file with the cut DERIVED as a property (the '
    + 'unique line opening his first non-definition section) rather than pinned as a position, '
    + 'and the export tail is the only addition'],
  ['G2', 'his convention is DERIVABLE from his own returns, and the partition is total and '
    + 'disjoint: one negative answer, a refusal shape, and an answer shape sharing no key'],
  ['G3', 'known positive and agreement control: the three input-reachable return paths driven, '
    + 'and under the LIVE convention the OLD re-typed predicate and the NEW derived classifier '
    + 'agree on all three — so the cure changes no live reading'],
  ['G4', 'M1 — the success return also emits `refused: false`: the OLD predicate FLIPS on the '
    + 'answer input and says so nowhere, while the derived reader REFUSES at the convention with '
    + 'the shared-key reason. Loud beats silent, and both halves are asserted'],
  ['G5', 'M2 — the refusal key renamed: the OLD predicate reads a REFUSAL as an answer (it '
    + 'over-reports, the dangerous direction), while the derived classifier re-derives the new '
    + 'key and is correct on all three paths'],
  ['G6', 'M3 CONTROL — a refusal message reworded and nothing else: the derived convention is '
    + 'byte-identical and every classification under both readers is unchanged, so G4 and G5 are '
    + 'the convention moving and not an edit happening'],
  ['G7', 'the cure landed in round413, read by a detector that is itself graded as a 4-cell '
    + 'matrix: 3 hits on the pre-cure text, 0 on the cured text, and each of the detector\'s two '
    + 'legs — comment-blindness and the receiver leg — removed in its own cell. And round413\'s '
    + 'own 7 GATE legs are still TRUE when re-driven'],
  ['P1', 'the fourth return path — "masker not length-preserving" — is UNREACHABLE from input and '
    + 'is published as UNDRIVEN with its reason, not folded into a zero'],
  ['P2', 'over his live corpus under round413\'s own seam the two readers agree member-for-member, '
    + 'and the population exercises ZERO refusals — which is why the live corpus cannot grade '
    + 'this convention and the grid above had to'],
  ['P3', 'the cure changes no verdict round413 publishes: its GATE line and its PREDICTIONS line '
    + 'post-cure are identical to the pre-cure baseline recorded before anything was edited'],
  ['P4', 'his §4 complement, from this side and under a DIFFERENT key — no `new Function(` '
    + 'precondition, comment-blind, receiver-aware, over every research instrument: round413 was '
    + 'the only instance of the absence-test shape, and it is now 0'],
  ['P5', 'ADDED AFTER DRIVE 2, not pre-registered with the rest, and said so: P4 came back 7 and '
    + '6 of the 7 are the author reading his own convention IN THE FILE THAT DECLARES IT, which '
    + 'is not a copy. The separating leg is declaration, not position — a file that READS the key '
    + 'without RETURNING it is reading someone else\'s convention. Graded both ways'],
];

const RESULTS = [];
const GATE_LEGS = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']);
const g = (leg, claim, ok, detail) => {
  RESULTS.push({ leg, claim, ok, detail, gate: GATE_LEGS.has(leg) });
};

// ─── G1 — regenerate the slice, cut derived by property ─────────────────────────────────────────
const hisFull = readFileSync(join(REPO, HIS412), 'utf8');
const hisLines = hisFull.split('\n');
/** His definitions end where his first graded section opens. That line reads an output file out of
 *  HIS directory, so the prefix must stop before it — the same reason round413 gave for 422. */
const sectionOpeners = hisLines
  .map((l, i) => ({ i, l }))
  .filter(({ l }) => /^\/\/ ─{2,} G1\b/.test(l));
const CUT = sectionOpeners.length === 1 ? sectionOpeners[0].i : -1;
const ROUND413_PINNED_CUT = (() => {
  const m = readFileSync(join(REPO, MY413), 'utf8').match(/^const CUT = (\d+);$/m);
  return m === null ? null : Number(m[1]);
})();

const prefix = CUT === -1 ? null : `${hisLines.slice(0, CUT).join('\n')}\n`;
const TAIL = `
// ─── appended by ${SELF} ───
// Everything above this line is Theseus's file, lines 1..${CUT}, byte-for-byte. This tail is mine.
export { topLevelTernary, contRaw, stripSource, ROWS, HIS };
`;
const writeSlice = (name, text) => {
  const rel = `${SELF_DIR}${name}`;
  writeFileSync(join(REPO, rel), text);
  return rel;
};
const LIVE_SLICE = prefix === null ? null : writeSlice('his412-prefix.sliced.mjs', prefix + TAIL);
const liveWritten = LIVE_SLICE === null ? '' : readFileSync(join(REPO, LIVE_SLICE), 'utf8');

g('G1', EXPECTED[0][1],
  CUT !== -1 && liveWritten.startsWith(prefix) && liveWritten.slice(prefix.length) === TAIL
  && prefix.split('\n').length - 1 === CUT && ROUND413_PINNED_CUT === CUT,
  CUT === -1 ? `REFUSED: ${sectionOpeners.length} line(s) open his first graded section, not 1`
    : `cut derived as ${CUT} of ${hisLines.length} line(s) from the unique opener `
      + `"${hisLines[CUT].slice(0, 34)}…" · round413 pins it as the position `
      + `${ROUND413_PINNED_CUT} (agrees: ${ROUND413_PINNED_CUT === CUT}) · prefix byte-identical `
      + `${liveWritten.startsWith(prefix)} · remainder is exactly the declared tail `
      + `${liveWritten.slice(prefix.length) === TAIL}`);

const LIVE = await import(`../../../${LIVE_SLICE}`);

// ─── the three input-reachable return paths, named once and driven in every cell ─────────────────
/** Enumerated from his source, not guessed (334): his function has four returns. Three are
 *  reachable by choosing an input; the fourth is P1. */
const INPUTS = [
  ['ANSWER', 'cond ? 1 : 2', 'a top-level `?` with a matching `:`'],
  ['NONE', 'plainIdentifier', 'no top-level `?` at all'],
  ['REFUSED', 'cond ? 1', 'a top-level `?` with no matching `:` in the window'],
];

/** The predicate as round413 typed it, kept here verbatim as the thing being graded. */
const OLD_IS_ANSWER = (t) => t !== null && t.refused === undefined;
const OLD_IS_REFUSAL = (t) => t !== null && t.refused !== undefined;
const oldReading = (t) => (OLD_IS_ANSWER(t) ? 'ANSWER' : OLD_IS_REFUSAL(t) ? 'REFUSED' : 'NONE');

/** One cell: a module, read by both readers over all three inputs. */
const cell = (mod) => {
  const conv = conventionOf(mod.topLevelTernary.toString());
  const rows = INPUTS.map(([want, raw]) => {
    const t = mod.topLevelTernary(raw);
    return { want, raw, keys: t === null ? 'null' : keyOf(t), old: oldReading(t), nu: classify(t, conv) };
  });
  return { conv, rows };
};

const live = cell(LIVE);

// ─── G2 — the convention, derived ────────────────────────────────────────────────────────────────
const nForm = (c, k) => (c.forms === undefined ? 0 : c.forms.filter((f) => f.kind === k).length);
g('G2', EXPECTED[1][1],
  live.conv.refused === undefined && live.conv.answer.length === 1
  && live.conv.refusal.length === 1 && live.conv.none === 1,
  live.conv.refused !== undefined ? `REFUSED: ${live.conv.refused}`
    : `${live.conv.forms.length} return(s): ${nForm(live.conv, 'NONE')} negative answer, `
      + `${nForm(live.conv, 'REFUSAL')} refusal → shape(s) {${live.conv.refusal.join('} {')}}, `
      + `${nForm(live.conv, 'ANSWER')} answer → shape(s) {${live.conv.answer.join('} {')}} · `
      + 'shared keys: none (checked in conventionOf, which refuses on overlap)');

// ─── G3 — known positive, and the two readers agreeing on the live convention ───────────────────
const rowText = (rows) => rows.map((r) => `${r.want}: keys ${r.keys} → OLD ${r.old} / NEW ${r.nu}`)
  .join(' · ');
g('G3', EXPECTED[2][1],
  live.rows.every((r) => r.old === r.want && r.nu === r.want),
  rowText(live.rows));

// ─── the mutations ──────────────────────────────────────────────────────────────────────────────
/** A mutation is (anchor, replacement, expected site count). The anchor is asserted to occur
 *  exactly the declared number of times BEFORE the edit; a mutation whose target is not asserted
 *  grades nothing (347/389/422). */
const mutate = (name, sites) => {
  const problems = [];
  let text = prefix;
  for (const [anchor, replacement, want] of sites) {
    const n = text.split(anchor).length - 1;
    if (n !== want) problems.push(`anchor "${anchor.slice(0, 30)}…" occurs ${n}×, wanted ${want}`);
    text = text.split(anchor).join(replacement);
  }
  const rel = writeSlice(`mutant-${name}.sliced.mjs`, text + TAIL);
  return { rel, problems, changed: text !== prefix };
};

const ANSWER_RETURN = 'return { test: rawText.slice(0, qi), cons: rawText.slice(qi + 1, ci), '
  + 'alt: rawText.slice(ci + 1) };';
const M1 = mutate('m1-refused-false-on-success', [[ANSWER_RETURN,
  ANSWER_RETURN.replace('return { test:', 'return { refused: false, test:'), 1]]);
/** 5, not 3. My first spelling of this wanted 3 and the instrument refused it: I had counted the
 *  LINES `grep -n refused` printed (310, 336, 365) and written the line count where an occurrence
 *  count belongs — his line 365 carries three of them. That is my own rule (count from a walk, not
 *  from grep's row count) failing on the smallest possible population, and it is left here as the
 *  reason the mutation asserts its anchor count instead of trusting it. All 5 sites are renamed,
 *  which is the coherent counterfactual: his `stratum412` consumer reads the key too. */
const M2 = mutate('m2-refusal-key-renamed', [['refused', 'declined', 5]]);
const MSG = 'a top-level `?` with no matching `:` inside the window';
const M3 = mutate('m3-control-message-reworded', [[MSG, 'no `:` matched the top-level `?`', 1]]);

const m1 = cell(await import(`../../../${M1.rel}`));
const m2 = cell(await import(`../../../${M2.rel}`));
const m3 = cell(await import(`../../../${M3.rel}`));

const row = (c, want) => c.rows.find((r) => r.want === want);

// ─── G4 — M1: the absence test inverts, silently ────────────────────────────────────────────────
const m1Answer = row(m1, 'ANSWER');
const liveAnswer = row(live, 'ANSWER');
g('G4', EXPECTED[3][1],
  M1.problems.length === 0 && M1.changed
  && liveAnswer.old === 'ANSWER' && m1Answer.old !== 'ANSWER'
  && m1.conv.refused !== undefined && /share key/.test(m1.conv.refused)
  && m1Answer.nu === 'UNMODELLED',
  M1.problems.length > 0 ? `REFUSED: ${M1.problems.join(' | ')}`
    : `the answer input now returns keys ${m1Answer.keys} · OLD moved `
      + `${liveAnswer.old} → ${m1Answer.old} with no refusal of any kind · NEW: the convention `
      + `REFUSES — "${m1.conv.refused}" — so every result reads ${m1Answer.nu}`);

// ─── G5 — M2: a refusal read as an answer, which over-reports ──────────────────────────────────
const m2Ref = row(m2, 'REFUSED');
const liveRef = row(live, 'REFUSED');
g('G5', EXPECTED[4][1],
  M2.problems.length === 0 && M2.changed
  && liveRef.old === 'REFUSED' && m2Ref.old === 'ANSWER'
  && m2.conv.refused === undefined && m2.conv.refusal.join() === 'declined'
  && m2.rows.every((r) => r.nu === r.want),
  M2.problems.length > 0 ? `REFUSED: ${M2.problems.join(' | ')}`
    : `refusal shape now {${m2.conv.refusal.join('} {')}} · OLD on the refusing input moved `
      + `${liveRef.old} → ${m2Ref.old}, counting a refusal as a found ternary · NEW re-derived `
      + `the key and reads ${rowText(m2.rows)}`);

// ─── G6 — the control: a message reworded must move nothing ────────────────────────────────────
const convText = (c) => (c.refused !== undefined ? `REFUSED ${c.refused}`
  : `answer ${c.answer.join('|')} / refusal ${c.refusal.join('|')} / none ${c.none}`);
g('G6', EXPECTED[5][1],
  M3.problems.length === 0 && M3.changed
  && convText(m3.conv) === convText(live.conv)
  && m3.rows.every((r, i) => r.old === live.rows[i].old && r.nu === live.rows[i].nu),
  M3.problems.length > 0 ? `REFUSED: ${M3.problems.join(' | ')}`
    : `the edit landed (text changed: ${M3.changed}) and the convention is unchanged — `
      + `"${convText(m3.conv)}" · readings identical: ${rowText(m3.rows)}`);

// ─── G7 / P3 — the cure in round413, and its verdict lines against the pre-cure baseline ───────
/**
 * The detector for "an absence test on his refusal key" needs two legs, and my first spelling of
 * it had neither. It reported 4 hits against a true 0, for two different reasons at once:
 *
 *   - 2 of the 4 are my own Round 430 comments QUOTING the spelling they remove (371/383 — a
 *     correction that quotes the wrong spelling re-trips the detector). So: comment-blind.
 *   - 2 of the 4 are `CONV.refused === undefined` — absence tests on MY OWN module's refusal
 *     sentinel, which is the same identifier under a different convention. A key on the property
 *     name alone cannot separate them. So: the receiver must not be the convention object.
 *
 * Each leg is graded by a cell that removes it, against a pre-cure known positive, because a
 * separating key needs a confusion matrix and not a known positive (418).
 */
const CONVENTION_RECEIVERS = new Set(['CONV']);
const retyped = (text, { commentBlind = true, receiverLeg = true } = {}) => {
  const src = commentBlind ? LIVE.stripSource(text, true) : text;
  const re = /(\w+)\.refused\s*(===|!==)\s*undefined/g;
  const hits = [];
  let m = re.exec(src);
  while (m !== null) {
    if (!(receiverLeg && CONVENTION_RECEIVERS.has(m[1]))) {
      hits.push({ at: m.index, receiver: m[1], line: src.slice(0, m.index).split('\n').length });
    }
    m = re.exec(src);
  }
  return hits;
};

const my413 = readFileSync(join(REPO, MY413), 'utf8');
/** Pinned, and gated BY PROPERTY rather than trusted: the cell is only a known positive if the
 *  text at this rev predates the cure, which is checked by the absence of the cure's import — so a
 *  wrong rev reddens instead of inverting once the cure is committed (420/422). */
const PRE_REV = '91d5b08d3d3bab9b67aae275216d046c9c2bb5c1';
const CURE_IMPORT = "from '../round430-instruments/refusal-convention.mjs'";
const preCure = (() => {
  try { return git(['show', `${PRE_REV}:${MY413}`]); } catch (e) { return null; }
})();
const C = {
  c1: preCure === null ? null : retyped(preCure),
  c2: retyped(my413),
  c3: retyped(my413, { commentBlind: false }),
  c4: retyped(my413, { receiverLeg: false }),
};
const retypedHits = C.c2.length === 0 ? null : C.c2;
const importsCure = my413.includes(CURE_IMPORT);
const preIsPreCure = preCure !== null && !preCure.includes(CURE_IMPORT);
const drive = (() => {
  try {
    return execFileSync(process.execPath, [join(REPO, MY413)],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  } catch (e) { return `DRIVE FAILED: ${e.message}`; }
})();
const verdictOf = (text) => {
  const gate = text.match(/^GATE: (\S+)\s+\((\d+) leg\(s\)/m);
  const pred = text.match(/^PREDICTIONS: (.+)$/m);
  return gate === null || pred === null ? null
    : { gate: gate[1], legs: Number(gate[2]), pred: pred[1].trim() };
};
const post = verdictOf(drive);
const base = verdictOf(readFileSync(join(REPO, BASELINE), 'utf8'));

const cellN = (c) => (c === null ? 'n/a' : c.length);
g('G7', EXPECTED[6][1],
  preIsPreCure && C.c1.length === 3 && C.c2.length === 0
  && C.c3.length === 2 && C.c4.length === 2
  && importsCure && post !== null && post.gate === 'true' && post.legs === 7,
  !preIsPreCure ? `REFUSED: the text at ${PRE_REV.slice(0, 8)} is not pre-cure (the cure's import `
    + `is ${preCure === null ? 'unreadable' : 'already present'}), so C1 is not a known positive`
    : `C1 pre-cure × both legs ${cellN(C.c1)} [${C.c1.map((h) => `${h.receiver}@${h.line}`).join(' ')}]`
      + ` · C2 cured × both legs ${cellN(C.c2)} · C3 cured × comment-blindness OFF ${cellN(C.c3)} `
      + `[${C.c3.map((h) => `L${h.line}`).join(' ')}] — my own comments quoting the cured spelling `
      + `· C4 cured × receiver leg OFF ${cellN(C.c4)} `
      + `[${C.c4.map((h) => `${h.receiver}@${h.line}`).join(' ')}] — absence tests on MY sentinel, `
      + `not his · imports the derived convention ${importsCure} · re-driven: `
      + (post === null ? `REFUSED: could not read its verdict lines — ${drive.slice(0, 120)}`
        : `GATE ${post.gate} over ${post.legs} leg(s)`));

// ─── P1 — the undriven fourth path, published rather than zeroed ────────────────────────────────
const lengthRefusal = live.conv.forms === undefined ? null
  : live.conv.forms.filter((f) => f.kind === 'REFUSAL');
g('P1', EXPECTED[7][1],
  lengthRefusal !== null && lengthRefusal.length === 2,
  `${lengthRefusal === null ? 'n/a' : lengthRefusal.length} refusal return(s) in his function; `
  + 'the grid drives 1 of them. The other fires only if `stripSource(raw, true)` returns a '
  + 'different length than its input, which no INPUT can cause — it is a property of the shared '
  + 'masker, asserted in the server suite (round259). UNDRIVEN, with that as the reason.');

// ─── P2 — the live corpus, and why it cannot grade this ─────────────────────────────────────────
const HIS_DIR = 'docs/research/round412-instruments/';
const MY413_DIR = 'docs/research/round413-instruments/';
const pop = LIVE.ROWS.filter((r) => r.path !== LIVE.HIS && !r.path.startsWith(HIS_DIR)
  && !r.path.startsWith(MY413_DIR));
const withQ = pop.filter((r) => LIVE.stripSource(r.raw, true).includes('?'));
const read = withQ.map((r) => {
  const t = LIVE.topLevelTernary(r.raw);
  return { r, old: oldReading(t), nu: classify(t, live.conv) };
});
const disagree = read.filter((x) => x.old !== x.nu);
const answers = read.filter((x) => x.nu === 'ANSWER');
const refusals = read.filter((x) => x.nu === 'REFUSED');
g('P2', EXPECTED[8][1],
  disagree.length === 0 && refusals.length === 0,
  `population ${pop.length} · windows carrying a masked \`?\` ${withQ.length} · answers `
  + `${answers.length} [${answers.map((x) => `${x.r.path.split('/').pop()}:${x.r.line}`).join(' | ')}]`
  + ` · refusals ${refusals.length} · member-for-member disagreements between OLD and NEW: `
  + `${disagree.length}`);

// ─── P3 — the cure publishes the same verdicts as the pre-cure baseline ─────────────────────────
g('P3', EXPECTED[9][1],
  base !== null && post !== null && base.gate === post.gate && base.legs === post.legs
  && base.pred === post.pred,
  base === null ? 'REFUSED: could not read the baseline verdict lines'
    : `pre-cure  GATE ${base.gate}/${base.legs} · PREDICTIONS ${base.pred}\n`
      + `        post-cure GATE ${post === null ? 'n/a' : `${post.gate}/${post.legs}`} · `
      + `PREDICTIONS ${post === null ? 'n/a' : post.pred}`);

// ─── P4 — the wider surface his §4 deferred, under a key that is not his ───────────────────────
/**
 * His census keyed the class behind a `new Function(` precondition (11 of 103 instruments admitted)
 * and published the result as a FLOOR, naming the complement as deferred with that precondition as
 * the blocker. This leg takes the complement from this side with a key that shares no leg with his:
 * every `.mjs` under `docs/research/`, no precondition, comment-blind, receiver-aware — the same
 * detector G7 grades, so it is the detector whose blindness is already measured rather than a
 * second unmeasured one.
 *
 * Its own direction of error, named: it is keyed on the absence-test SHAPE. A re-typed verdict that
 * is an EQUALITY against a literal (`t.kind === 'REFUSED'`), or one that tests a key this key does
 * not spell, is invisible to it. Floor, not total — the same disposition his carries.
 *
 * This file and its directory are excluded BY THEIR OWN PATH, positively, not by a filter that
 * happens to miss them: `OLD_IS_ANSWER` above is a deliberate copy of the cured spelling, and an
 * instrument that censuses its own source reports its own apparatus as the finding (425).
 */
const research = git(['ls-tree', '-r', '--name-only', 'HEAD', 'docs/research/']).trim().split('\n')
  .filter((p) => p.endsWith('.mjs'));
const censusPop = research.filter((p) => !p.startsWith(SELF_DIR));
const censusHits = censusPop.flatMap((p) => {
  let text = '';
  try { text = readFileSync(join(REPO, p), 'utf8'); } catch (e) { return [{ path: p, unread: true }]; }
  return retyped(text).map((h) => ({ path: p, line: h.line, receiver: h.receiver }));
});
g('P4', EXPECTED[10][1],
  censusHits.length === 0 && censusPop.length < research.length,
  `${research.length} research .mjs at HEAD · ${research.length - censusPop.length} excluded by `
  + `this directory's own path (${SELF_DIR}) · ${censusPop.length} censused · hits `
  + `${censusHits.length}${censusHits.length === 0 ? '' : ` [${censusHits
    .map((h) => `${h.path.split('/').pop()}:${h.line} ${h.receiver}`).join(' | ')}]`} · `
  + 'FLOOR: keyed on the absence-test shape, so a verdict re-typed as an equality against a '
  + 'literal is invisible to this key');

// ─── P5 — the leg that separates a copy from an author, added after drive 2 ────────────────────
/**
 * P4's naive key cannot tell a re-typed copy from the author's own file: 6 of its 7 hits are in
 * `round412`, which is where the convention is DECLARED. Reading your own return shape in the file
 * that returns it is not a copy of anything.
 *
 * The separating property is declaration, not position (422): a file that reads the key and never
 * RETURNS an object literal carrying it is reading a convention defined elsewhere. Graded in both
 * directions below, because a leg whose removal changes nothing has separated nothing.
 */
const declaresConvention = (text) => /return\s*\{[^}]*\brefused\s*:/.test(LIVE.stripSource(text, true));
const byFile = new Map();
for (const h of censusHits) {
  if (!byFile.has(h.path)) byFile.set(h.path, []);
  byFile.get(h.path).push(h);
}
const classified = [...byFile.entries()].map(([path, hits]) => ({
  path, hits: hits.length, declares: declaresConvention(readFileSync(join(REPO, path), 'utf8')),
}));
const copies = classified.filter((c) => !c.declares);
const authors = classified.filter((c) => c.declares);
g('P5', EXPECTED[11][1],
  copies.length === 1 && copies[0].path.includes('round414-instruments/')
  && authors.reduce((n, c) => n + c.hits, 0) === 7 - copies.reduce((n, c) => n + c.hits, 0),
  `leg ON — files reading the key without declaring it: ${copies.length} `
  + `[${copies.map((c) => `${c.path} ×${c.hits}`).join(' | ')}] · leg OFF: `
  + `${classified.length} file(s), ${censusHits.length} hit(s), of which `
  + `${authors.reduce((n, c) => n + c.hits, 0)} are in the file(s) that DECLARE the convention `
  + `[${authors.map((c) => `${c.path.split('/').pop()} ×${c.hits}`).join(' | ')}] · so P4's `
  + 'pre-registered "it is now 0" is REFUTED BY EXACTLY ONE MEMBER, and that member is his: '
  + 'round414 slices his own round412 reader out of a module and then re-types the same absence '
  + 'test my round413 did. His §1 census could not see it — its `new Function(` precondition '
  + 'excludes round414 — which is the direction of error he published it with');

// ─── report ─────────────────────────────────────────────────────────────────────────────────────
const rev = git(['rev-parse', 'HEAD']).trim();
const dirty = git(['status', '--porcelain']).trim() !== '';
console.log(`\nRound 430 — gate his refusal convention instead of re-typing it`);
console.log(`  subject: ${HIS412}`);
console.log(`  cured:   ${MY413}\n`);
for (const [leg, claim] of EXPECTED) {
  const r = RESULTS.find((x) => x.leg === leg);
  if (r === undefined) { console.log(`  ????  ${leg}  NOT DRIVEN — ${claim}`); continue; }
  console.log(`  ${r.ok ? 'TRUE ' : 'FALSE'} ${r.leg}  [${r.gate ? 'GATE' : 'PRED'}] ${r.claim}`);
  console.log(`        ${r.detail}`);
}
const gateLegs = RESULTS.filter((r) => r.gate);
const predLegs = RESULTS.filter((r) => !r.gate);
const gateOk = gateLegs.length > 0 && gateLegs.every((r) => r.ok);
const refuted = predLegs.filter((r) => !r.ok).map((r) => r.leg);
console.log(`\nGATE: ${gateOk}   (${gateLegs.length} leg(s) on the cure itself)`);
console.log(`PREDICTIONS: ${predLegs.length - refuted.length} landed`
  + `${refuted.length === 0 ? ', 0 refuted' : `, ${refuted.length} REFUTED: ${refuted.join(' | ')}`}`);
console.log(`\n  rev ${rev} · ${LIVE.ROWS.length} declaration(s) in his corpus reading `
  + `· worktree ${dirty ? 'DIRTY' : 'clean'}`);
if (gateLegs.length !== GATE_LEGS.size) {
  console.log(`\n  !! ${GATE_LEGS.size} gate leg(s) pre-registered, ${gateLegs.length} driven.`);
}
process.exitCode = gateOk === true ? 0 : 1;
