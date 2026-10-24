/**
 * Round 448 — `P1` LANDS, and the predicate that scored it is wrong for a THIRD time.
 *
 * Theseus's Round 447 (`e2d70405`) re-aimed his `G4` slicer at my cured `P2` spelling and lifted
 * the one blocker `P1` was deferred on for two rounds. The Round 446 instrument, driven unmodified
 * at his repaired rev, reads `VERDICT/1 ok legs=5 red=[] refused=[] preds=1 prefused=[]` —
 * `P1` LANDED. Recording: `drive1.r446-unmodified-at-his-g4-repaired-rev.out`.
 *
 * Scoring it is how this round's defect was found, and it is in the same four lines of mine for the
 * third round running:
 *
 *   Round 444 — `/^GATE: true/` over his gate line. Cannot tell REFUSED from RED.
 *   Round 446 — cured to `topToken(red, refused)`. Can tell those apart.
 *   Round 448 — `topToken` is derived from the LEG lists AND FROM NOTHING ELSE. Cannot tell `ok`
 *               from `ok with a refuted PREDICTION`.
 *
 * `P1`'s claim is "the cure holds under HIS gate, not just under mine." A run of his whose legs are
 * all green but whose own prediction about my tree was REFUTED is precisely a case where the cure
 * does not hold under his gate — and `scoreP1` publishes LANDED on it, with the reason
 * "his gate is green: red=[] refused=[]". Both halves of that sentence are true. The conclusion
 * does not follow from them.
 *
 * NOT hypothetical, and censused BEFORE this file was written (`drive2.census.out`, 409): of 356
 * committed `.out` files under `docs/` at `9d7c71be`, 30 carry a verdict line `readVerdict`
 * accepts, and **10 of those 30 are token `ok` with a non-empty prediction list** — two of them
 * with a genuinely REFUTED prediction. The known positives here are real recordings from my own
 * rounds, read as blobs at a rev, not analogies (437).
 *
 * THE CURE IS IN THE SCORER, NOT IN THE LIB, and `G3` is the counterfactual that establishes that
 * rather than the claim that it does. Making `topToken` prediction-aware would make every one of
 * those 10 recordings unreadable — `readVerdict` refuses a line whose token disagrees with its own
 * lists (`TOKEN_LIST_CONTRADICTION`), which is a property worth keeping. Driven in a scratch copy;
 * the real lib is never edited (417 — drive a counterfactual in a scratch repo, never another
 * seat's tree).
 *
 * `G4` is a defect of mine of a different kind: two leg DESCRIPTIONS in the Round 446 instrument
 * assert a live-tree outcome ("his gate is REFUSED, not RED"; "the row it is wrong about is the one
 * his repaired instrument actually produces") that was true at `16c0e797` and is FALSE at
 * `e2d70405`. The legs are green and the figures are right, because they are keyed on PINS. The
 * sentences beside them are keyed on the live tree and nothing gates them (439/447 — a cured figure
 * can leave a live sentence about the old one; 445 — prose written beside its own cure needs a pin).
 *
 * Driving it: `node docs/research/round448-instruments/grade-the-four-list-scorer.mjs`
 * Cripples: `KLATCH_R448_LEGONLY=1` (score with the retired leg-only predicate — `G2` must redden)
 *           `KLATCH_R448_BLINDPIN=1` (point `G4` at HEAD instead of the pin — `G4` must redden)
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

import { readVerdict, renderVerdict, renderRows, topToken } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], {
  encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
});
const REV = git('rev-parse', 'HEAD').trim();
const SHORT = REV.slice(0, 8);

// Depth guard keyed on THIS file's own directory (421).
const DEPTH = Number(process.env.KLATCH_R448_DEPTH ?? '0');
if (DEPTH > 1) { console.log('REFUSED: recursion depth exceeded'); process.exit(0); }

// ── Cripples. Every name here is read by a hook below, and `G5` asserts that (Theseus's Round 447
// §4: three declared cripples that nothing implemented, so a recording filed as a crippled control
// was not one). ──────────────────────────────────────────────────────────────────────────────────
const IMPLEMENTED = ['KLATCH_R448_LEGONLY', 'KLATCH_R448_BLINDPIN'];
const LEGONLY = process.env.KLATCH_R448_LEGONLY === '1';
const BLINDPIN = process.env.KLATCH_R448_BLINDPIN === '1';

const MINE_REL = 'docs/research/round446-instruments/grade-my-own-oracle-predicate.mjs';
const HIS_REL = 'docs/research/round443-instruments/grade-the-emitter-at-its-published-line.mjs';
const LIB_REL = 'docs/research/lib/verdict.mjs';
const SELF_REL = 'docs/research/round448-instruments/grade-the-four-list-scorer.mjs';

/**
 * The rev my Round 446 instrument carries the leg-only scorer AND the two stale sentences at.
 * Pinned to the commit that introduced them, BEFORE this round's cure, because `G2` slices the
 * retired scorer and `G4` slices the two sentences out of this file — sourcing either from HEAD
 * empties the cell the moment the cure lands, the class that has inverted a cell on this project
 * six times now (420/422/436/444/446). Asserted by PROPERTY below, never by the hash (445).
 */
const MINE_PIN = '16c0e797';

/** His instrument's rev before Round 447 re-aimed `G4`. Asserted by property, same reason. */
const HIS_PRE_G4_REV = '62e023ca';

// ── Tracked-tree watch, snapshotted before anything runs (440/441). ─────────────────────────────
const statusLines = () => git('status', '--porcelain').split('\n')
  .map((l) => l.match(/^(..) (.*)$/)).filter((m) => m !== null)
  .map((m) => ({ code: m[1], path: m[2] }));
const trackedModified = () => {
  const out = {};
  for (const { code, path } of statusLines()) if (/[MARCD]/.test(code)) out[path] = code;
  return out;
};
const DIRTY_AT_ENTRY = trackedModified();
const WATCHED = [MINE_REL, HIS_REL, LIB_REL];
const BYTES_AT_ENTRY = Object.fromEntries(
  WATCHED.map((r) => [r, readFileSync(join(REPO, r), 'utf8')]),
);

const legs = [];
const preds = [];
const leg = (id, what, detail, ok) => legs.push({ id, what, detail, ok });
const pred = (id, what, detail, landed) => preds.push({ id, what, detail, landed });

const MINE_PIN_SRC = git('show', `${MINE_PIN}:${MINE_REL}`);
/**
 * The LIVE half reads the WORKING TREE, not `REV:`. "Does the live instrument state something
 * false of today's gate" is a question about the file on disk, and sourcing it from HEAD made `G4`
 * red on the clean run in drive 6 — the cure was written and not yet committed, so the HEAD blob
 * still carried both unqualified sentences and the leg could not see its own cure. The mirror of
 * 436/444: an OLD cell sourced from HEAD inverts when the cure lands, and a NEW one sourced from
 * HEAD cannot see the cure until it does. The post-commit re-drive is what checks the two agree.
 */
const MINE_NOW_SRC = readFileSync(join(REPO, MINE_REL), 'utf8');
const LIB_SRC = git('show', `${REV}:${LIB_REL}`);

/** Import a source STRING at this directory's depth, so a relative import inside it resolves. */
let scratchN = 0;
const importSource = async (src, tag) => {
  const p = join(HERE, `.scratch-${tag}-${scratchN++}.mjs`);
  writeFileSync(p, src);
  try { return await import(`file://${p}?t=${Date.now()}`); }
  finally { rmSync(p, { force: true }); }
};

/** Slice `[start … end)` out of `src`, refusing unless each boundary occurs exactly once (426). */
const sliceOnce = (src, start, end) => {
  if (src.split(start).length - 1 !== 1) return null;
  const i = src.indexOf(start);
  const rest = src.slice(i);
  if (rest.split(end).length - 1 < 1) return null;
  return rest.slice(0, rest.indexOf(end));
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE POPULATION — real committed recordings, one per cell, pre-registered above every leg that
// reads them so `G1` and `G2` cannot grade two hand-kept copies of the same list (430).
//
// `want.legOnly` is what the RETIRED predicate says; `want.fourList` is what the cure says. The
// rows that must DISAGREE are exactly the two whose prediction list is dirty under a green token.
// Declared here, in source, before the run (437).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const rowText = (rel) => { try { return git('show', `${REV}:${rel}`); } catch { return null; } };

/**
 * THE CENSUS, hoisted above every leg that reads it so `G1` and `G2` grade ONE selection rather
 * than two hand-kept copies of it (430). Population selected with `ls-tree -z` at this rev and
 * read with the real `readVerdict`; this instrument's own directory is excluded and the exclusion
 * is COUNTED, because a self-exclusion conjunct is vacuous until the directory is committed (434).
 */
const CENSUS = (() => {
  const all = git('ls-tree', '-r', '--name-only', '-z', REV, 'docs/').split('\0').filter((p) => p !== '');
  const candidates = all.filter((p) => p.endsWith('.out'));
  const selfDir = `${dirname(SELF_REL)}/`;
  const excludedSelf = candidates.filter((p) => p.startsWith(selfDir));
  const population = candidates.filter((p) => !p.startsWith(selfDir));

  const readable = [];
  for (const p of population) {
    const rv = readVerdict(rowText(p));
    if (rv.ok !== true) continue;
    const v = rv.verdict;
    readable.push({ p, v, tok: topToken(v.red, v.refused) });
  }
  // Sorted, so "the first member of the cell" is a reproducible choice and not a directory-order
  // accident (420 — a population has to be reproducible from the rev).
  const inCell = (f) => readable.filter(f).sort((a, b) => a.p.localeCompare(b.p));
  return {
    population, excludedSelf, readable,
    okRefuted: inCell((r) => r.tok === 'ok' && r.v.refuted.length > 0),
    okPrefused: inCell((r) => r.tok === 'ok' && r.v.refuted.length === 0 && r.v.prefused.length > 0),
    okClean: inCell((r) => r.tok === 'ok' && r.v.refuted.length === 0 && r.v.prefused.length === 0),
    refused: inCell((r) => r.tok === 'REFUSED'),
    red: inCell((r) => r.tok === 'RED'),
  };
})();

/**
 * The six cells, one row each. `want` is a declared property OF THE CELL — what each predicate
 * must say about any member of it — and the member is SELECTED BY THE CENSUS PREDICATE, not typed
 * as a filename.
 *
 * Drive 3 is why. I hand-picked `round446-instruments/drive5.h5-conjunct-re-keyed.out` for the
 * `ok prefused` cell; its token is `REFUSED legs=5 red=[] refused=[H5] … prefused=[P1]`, so it is
 * not in the cell at all, both predicates correctly refused it, and the leg went red on MY
 * declaration rather than on the cure. 415 — a hand-typed known positive is not a slice: a row for
 * a cell defined by a property has to be selected by that property.
 *
 * The no-verdict control cannot be selected this way — it is defined by `readVerdict` REFUSING it,
 * so it has no cell in the census — and it is named, with its refusal asserted below.
 */
const ROWS = [
  {
    cell: 'ok   preds-clean', role: 'the cure must not move a genuinely green run',
    from: 'okClean', want: { legOnly: true, fourList: true },
  },
  {
    cell: 'ok   REFUTED', role: 'THE DEFECT — his prediction about my tree failed, token is `ok`',
    from: 'okRefuted', want: { legOnly: true, fourList: false },
  },
  {
    cell: 'ok   prefused', role: 'THE DEFECT, refusing arm — his prediction is OPEN, token is `ok`',
    from: 'okPrefused', want: { legOnly: true, fourList: null },
  },
  {
    cell: 'REFUSED', role: 'the Round 446 cure must survive — a leg could not reach its figure',
    from: 'refused', want: { legOnly: null, fourList: null },
  },
  {
    cell: 'RED', role: 'a leg GRADED the tree badly',
    from: 'red', want: { legOnly: false, fourList: false },
  },
  {
    cell: 'no verdict (control)', role: 'CONTROL — unreadable output must refuse under both (436)',
    rel: 'docs/research/round444-instruments/his-r443-instrument-dies-at-this-rev.out',
    want: { legOnly: null, fourList: null },
  },
];

/** Resolve each row to a concrete member, and say which cell was EMPTY rather than skipping it. */
const RESOLVED = ROWS.map((r) => {
  if (r.rel !== undefined) return { ...r, rel: r.rel, cellSize: null };
  const members = CENSUS[r.from];
  return { ...r, rel: members.length === 0 ? null : members[0].p, cellSize: members.length };
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// THE CURE — the four-list scorer. All four lists, each with its own reason, so a refusal and a
// refutation can never be reported as each other (408 — a refusing signal only raises a floor, so
// the leg has to say WHICH END it can move).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
const scoreFourList = (text) => {
  const rv = readVerdict(text);
  if (rv.ok !== true) return { landed: null, why: `his output is unreadable: ${rv.refusal}` };
  const v = rv.verdict;
  if (v.red.length > 0) return { landed: false, why: `a leg GRADED the tree badly: red=${JSON.stringify(v.red)}` };
  if (v.refuted.length > 0) {
    return {
      landed: false,
      why: `every leg is green BUT a PREDICTION of his about my tree was refuted: `
        + `refuted=${JSON.stringify(v.refuted)} — the top token is \`${v.token}\` and says nothing about this`,
    };
  }
  if (v.refused.length > 0) return { landed: null, why: `a leg could not REACH its figure: refused=${JSON.stringify(v.refused)}, red=[]` };
  if (v.prefused.length > 0) {
    return {
      landed: null,
      why: `every leg is green BUT a PREDICTION of his is still OPEN: `
        + `prefused=${JSON.stringify(v.prefused)} — scorable neither way`,
    };
  }
  return { landed: true, why: `all four lists empty: legs=${v.legs} preds=${v.preds}` };
};

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G1 — THE BLIND CELL IS OCCUPIED BY REAL COMMITTED RECORDINGS, re-derived here rather than cited
// from the census run (so this leg cannot go green off a stale `.out` file).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const blindOk = [...CENSUS.okRefuted, ...CENSUS.okPrefused];

  // Two conjuncts, because the refusing arm and the refuted arm have DIFFERENT floors: a
  // `prefused` row only shows the predicate cannot refuse, a `refuted` row shows it reports a
  // refutation as a landing. Both are required, so neither can carry the leg alone (423).
  const ok = CENSUS.okRefuted.length > 0 && CENSUS.okPrefused.length > 0
    && CENSUS.readable.length > 0 && CENSUS.excludedSelf.length > 0;

  leg('G1', 'THE CELL `P1` CANNOT SEE IS OCCUPIED BY REAL COMMITTED RECORDINGS, not by a '
    + 'constructed line. `topToken(red, refused)` is derived from the LEG lists and from nothing '
    + 'else, so a run whose legs are all green publishes token `ok` however its PREDICTION lists '
    + 'read. Population selected with `ls-tree -z` at this rev and read with the real '
    + '`readVerdict`; this instrument\'s own directory is excluded and the exclusion is COUNTED, '
    + 'because a self-exclusion conjunct is vacuous until the directory is committed (434) — it '
    + 'read 0 in the pre-commit census and must read > 0 here',
    `population ${CENSUS.population.length} \`.out\` file(s) · self-excluded ${CENSUS.excludedSelf.length} (> 0 required) · `
    + `readable verdict line ${CENSUS.readable.length}\n`
    + `        token \`ok\` with a DIRTY prediction list: ${blindOk.length} (> 0 required)\n`
    + `        of those, with a genuinely REFUTED prediction: ${CENSUS.okRefuted.length} (> 0 required) `
    + `${JSON.stringify(CENSUS.okRefuted.map((r) => r.p.replace('docs/research/', '')))}\n`
    + `        with an OPEN prediction and nothing refuted: ${CENSUS.okPrefused.length} (> 0 required)\n`
    + `        the other cells, for contrast: ok-clean ${CENSUS.okClean.length} · REFUSED ${CENSUS.refused.length} · RED ${CENSUS.red.length}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G2 — THE CONFUSION MATRIX. The retired predicate is SLICED out of the pinned Round 446 source,
// never retyped (411/428 — a hand-typed reader is not a slice; slicing the inputs but retyping the
// verdict). Six real recordings, one per cell, expectations declared in `ROWS` above.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const START = '  const scoreP1 = (text) => {';
  const END = '\n  const s = treeOut === null';
  const retiredSrc = sliceOnce(MINE_PIN_SRC, START, END);

  // The pin asserted by PROPERTY, not by its hash: the pinned blob must carry the leg-only scorer
  // and must NOT carry this round's four-list one (445).
  const pinHasLegOnly = retiredSrc !== null && /topToken\(rv\.verdict\.red, rv\.verdict\.refused\)/.test(retiredSrc);
  const pinHasFourList = /v\.refuted\.length > 0/.test(MINE_PIN_SRC);

  let retired = null;
  let sliceErr = null;
  if (retiredSrc !== null) {
    try {
      // Evaluated, not regex-matched (407 — run the regex, don't reason about it). `readVerdict`
      // and `topToken` are the real lib functions, passed in, so the retired predicate is scored
      // on the same reader the cure uses and the two cannot differ because of their reader.
      // eslint-disable-next-line no-new-func
      retired = new Function('readVerdict', 'topToken', `${retiredSrc}\n  return scoreP1;`)(readVerdict, topToken);
    } catch (e) { sliceErr = String(e.message).slice(0, 80); }
  }

  const rows = [];
  for (const r of RESOLVED) {
    const text = r.rel === null ? null : rowText(r.rel);
    const got = {
      legOnly: retired === null || text === null ? 'NOT RUN' : retired(text).landed,
      fourList: text === null ? 'NOT RUN' : scoreFourList(text).landed,
    };
    rows.push({
      ...r,
      present: text !== null,
      got,
      okLegOnly: got.legOnly === r.want.legOnly,
      okFourList: got.fourList === r.want.fourList,
      disagree: got.legOnly !== got.fourList,
    });
  }

  // Every cell had to be non-empty for its row to exist, and the control's refusal is asserted
  // rather than assumed — a control that silently became readable would stop being a control (436).
  const everyCellOccupied = rows.every((r) => r.cellSize === null || r.cellSize > 0);
  const controlRow = rows.find((r) => r.cell === 'no verdict (control)');
  const controlRefuses = controlRow !== undefined && controlRow.present
    && readVerdict(rowText(controlRow.rel)).ok !== true;

  const allPresent = rows.every((r) => r.present);
  const retiredRight = rows.every((r) => r.okLegOnly);
  const cureRight = rows.every((r) => r.okFourList);
  const disagreeing = rows.filter((r) => r.disagree).map((r) => r.cell);
  // The two cells that MUST disagree, and no others. Written down here before the run, as a member
  // LIST and not a count — equal counts have hidden an overlap on this project before (397).
  const MUST_DISAGREE = ['ok   REFUTED', 'ok   prefused'];
  const sameMembers = disagreeing.length === MUST_DISAGREE.length
    && MUST_DISAGREE.every((c) => disagreeing.includes(c));

  // GATE legs and PREDICTION legs kept apart (410): the gate is that the slice and the pin hold
  // and the cure is right on every row; the finding is that exactly the declared two disagree.
  const ok = retiredSrc !== null && sliceErr === null && pinHasLegOnly && !pinHasFourList
    && allPresent && everyCellOccupied && controlRefuses && retiredRight && cureRight && sameMembers
    && !LEGONLY; // the cripple scores the cure WITH the retired predicate; this leg must redden

  leg('G2', 'THE RETIRED LEG-ONLY PREDICATE AND THE FOUR-LIST CURE, over six real committed '
    + 'recordings, one per cell. Each row is SELECTED BY THE CELL\'S OWN PREDICATE out of the '
    + 'census above, not typed as a filename — drive 3 is why: I hand-picked a `prefused` row '
    + 'whose token was `REFUSED`, so it was not in the cell at all and this leg reddened on my '
    + 'declaration instead of on the cure (415). The retired predicate is sliced out of my own '
    + 'Round 446 source at its PIN and evaluated — not retyped, and not regex-matched — and both '
    + 'predicates are handed the same `readVerdict`, so they cannot differ because of their '
    + 'reader. Exactly the two declared cells must disagree, compared as a MEMBER LIST and not as '
    + 'a count (397)',
    `retired predicate SLICED ${retiredSrc !== null} (start 1× required)${sliceErr === null ? '' : ` · EVAL FAILED: ${sliceErr}`}\n`
    + `        pin ${MINE_PIN} by property: leg-only scorer in the pin ${pinHasLegOnly} (true required) · `
    + `four-list cure in the pin ${pinHasFourList} (false required)\n`
    + `        every row present at this rev ${allPresent} · every selected cell non-empty ${everyCellOccupied} · `
    + `control still REFUSES the reader ${controlRefuses} (true required)\n`
    + `        retired predicate matches its declaration on every row ${retiredRight} · cure matches on every row ${cureRight}\n`
    + rows.map((r) => `        ${r.cell.padEnd(22)} legOnly=${String(r.got.legOnly).padEnd(7)} `
      + `fourList=${String(r.got.fourList).padEnd(7)} ${r.disagree ? 'DISAGREE' : 'agree   '} · `
      + `${r.cellSize === null ? 'named ' : `cell=${String(r.cellSize).padStart(2)}`} ${(r.rel ?? '(CELL EMPTY)').replace('docs/research/', '')}`
      + `\n${' '.repeat(32)}${r.role}`).join('\n')
    + `\n        disagreeing cells: ${JSON.stringify(disagreeing)}\n`
    + `        declared:          ${JSON.stringify(MUST_DISAGREE)} — ${sameMembers ? 'same members' : 'MEMBER MISMATCH'}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G3 — THE COUNTERFACTUAL THAT LOCATES THE CURE. Why the fix is in the scorer and not in
// `topToken`: a prediction-aware `topToken` makes `readVerdict` refuse every recording in the blind
// cell, because the reader checks that the token is derivable from the lists. Driven against a
// SCRATCH COPY of the lib; the real file is never touched (417), and `G6` checks that.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // The one-line mutation, applied to the lib's SOURCE STRING. Its target is asserted to occur
  // exactly once and the mutation is gated on the text actually MOVING (431 — a mutation
  // counterfactual needs its target asserted, and the figure gated on having changed).
  const TARGET = '  if (red.length > 0) return \'RED\';';
  const occurrences = LIB_SRC.split(TARGET).length - 1;
  const MUTATED = `  if ((arguments[2] ?? []).length > 0 || (arguments[3] ?? []).length > 0) return 'RED';\n${TARGET}`;
  const mutantSrc = occurrences === 1 ? LIB_SRC.replace(TARGET, MUTATED) : null;
  const moved = mutantSrc !== null && mutantSrc !== LIB_SRC;

  // `readVerdict` calls `topToken(red, refused)` with two arguments, so the mutant only bites when
  // the reader is changed to pass all four. That is the WHOLE mutation: both call sites.
  const RD_CALL = 'if (topToken(red, refused) !== token) return refuse(\'TOKEN_LIST_CONTRADICTION\');';
  const rdOccurrences = mutantSrc === null ? 0 : mutantSrc.split(RD_CALL).length - 1;
  const fullSrc = rdOccurrences === 1
    ? mutantSrc.replace(RD_CALL, 'if (topToken(red, refused, refuted, prefused) !== token) return refuse(\'TOKEN_LIST_CONTRADICTION\');')
    : null;

  let mutantRefuses = null;
  let realAccepts = null;
  let importErr = null;
  if (fullSrc !== null) {
    try {
      const m = await importSource(fullSrc, 'predaware-lib');
      // Scored over the SAME blind-cell members `G1` found, read at this rev.
      const blind = RESOLVED.filter((r) => r.cell.startsWith('ok   ') && r.cell !== 'ok   preds-clean');
      let refusedByMutant = 0;
      let acceptedByReal = 0;
      for (const r of blind) {
        const text = r.rel === null ? null : rowText(r.rel);
        if (text === null) continue;
        if (m.readVerdict(text).ok !== true) refusedByMutant += 1;
        if (readVerdict(text).ok === true) acceptedByReal += 1;
      }
      mutantRefuses = refusedByMutant;
      realAccepts = acceptedByReal;
      // The control: a genuinely green run with clean prediction lists must survive the mutant,
      // or the mutant refuses everything and the figure above means nothing (437 — a
      // population-level known positive needs a CONTROL).
      const cleanRel = RESOLVED[0].rel;
      const cleanText = cleanRel === null ? null : rowText(cleanRel);
      var mutantKeepsClean = cleanText === null ? null : m.readVerdict(cleanText).ok === true;
    } catch (e) { importErr = String(e.message).slice(0, 90); }
  }

  const blindCount = RESOLVED.filter((r) => r.cell.startsWith('ok   ') && r.cell !== 'ok   preds-clean'
    && r.rel !== null).length;
  const ok = occurrences === 1 && moved && rdOccurrences === 1 && importErr === null
    && mutantRefuses === blindCount && realAccepts === blindCount && mutantKeepsClean === true;

  leg('G3', 'THE CURE BELONGS IN THE SCORER, NOT IN `topToken` — driven, not asserted. A '
    + 'prediction-aware `topToken` (plus the reader passing all four lists) makes `readVerdict` '
    + 'REFUSE every blind-cell recording as `TOKEN_LIST_CONTRADICTION`, because the reader checks '
    + 'the token is derivable from its own lists — a property worth keeping, and the reason the '
    + 'lib is left alone. Run against a SCRATCH import of the lib source; the real file is never '
    + 'edited (`G6` checks that). The clean-prediction row is the CONTROL: a mutant that refused '
    + 'everything would make the figure above meaningless',
    `mutation target occurs ${occurrences}× (1 required) · text MOVED ${moved} (true required) · `
    + `reader call site ${rdOccurrences}× (1 required)${importErr === null ? '' : ` · IMPORT FAILED: ${importErr}`}\n`
    + `        blind-cell rows refused by the PRED-AWARE mutant: ${mutantRefuses}/${blindCount} (all required)\n`
    + `        the same rows accepted by the REAL lib:           ${realAccepts}/${blindCount} (all required)\n`
    + `        CONTROL — clean-prediction row survives the mutant: ${mutantKeepsClean} (true required; `
    + 'a mutant that refuses every row cannot separate)',
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G4 — TWO LEG DESCRIPTIONS OF MINE ASSERT A LIVE-TREE OUTCOME THAT IS NOW FALSE.
//
// Both legs are GREEN and both figures are RIGHT, because they are keyed on pins. The sentences
// are keyed on the live tree and nothing gates them. Graded as a 2 × 2 — each sentence against the
// PIN it was written at, where it must be TRUE, and against HEAD, where it must be FALSE — because
// a cell sourced only from HEAD inverts the moment the cure lands (436/444).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  // `BLINDPIN` re-sources the "was true when written" half from HEAD, which is the defect this
  // 2 × 2 exists to exclude. Under it both halves read the same tree and the leg must redden.
  const whenWritten = BLINDPIN ? MINE_NOW_SRC : MINE_PIN_SRC;

  /**
   * Run an instrument SOURCE against today's tree and return its top token. Written into THIS
   * directory, which is the same depth as his own file, so a relative import inside it resolves
   * (421 — a scratch copy at the wrong depth refuses every cell).
   */
  const tokenOf = (src, tag) => {
    const p = join(HERE, `.scratch-${tag}.mjs`);
    writeFileSync(p, src);
    const read = (text) => {
      const rv = readVerdict(text);
      return rv.ok === true
        ? { tok: topToken(rv.verdict.red, rv.verdict.refused), why: null }
        : { tok: null, why: rv.refusal };
    };
    try {
      return read(execFileSync('node', [p], {
        encoding: 'utf8', cwd: REPO, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, KLATCH_R448_DEPTH: String(DEPTH + 1) },
      }));
    } catch (e) {
      // His instrument exits 0 even when a leg reddens, so a throw here means it failed to RUN.
      // Its stdout is still read, because a run that printed a verdict and then died has one.
      const r = read(String(e.stdout ?? ''));
      return r.tok !== null ? r : { tok: null, why: `DID NOT RUN: ${String(e.message).slice(0, 60)}` };
    } finally { rmSync(p, { force: true }); }
  };

  // THE 2 × 2, both ends DRIVEN against today's tree — no recording archaeology. Drive 3 is why:
  // I tried to read "his gate when the sentence was written" out of a committed recording of MY
  // OWN instrument, named the wrong file (a Round 444 drive, which carries no such line), and the
  // reader returned null — which then made the seam conjunct `pinTok !== hisTopToken` TRUE BY
  // SENTINEL, green on an unreadable pin (433 — a sentinel fallback makes a comparison green
  // forever). Both ends are instrument runs now, and both are required non-null before comparison.
  const hisHeadSrc = readFileSync(join(REPO, HIS_REL), 'utf8');
  const hisPreSrc = git('show', `${HIS_PRE_G4_REV}:${HIS_REL}`);
  const atPin = tokenOf(hisPreSrc, 'his-pre-g4');
  const atHead = tokenOf(hisHeadSrc, 'his-head');

  // His pre-`G4` blob asserted by PROPERTY, not by its hash (445), and keyed on what the REPAIR
  // INTRODUCED rather than on what the old slicer used.
  //
  // Drive 4 is why. I first keyed this on the old end token `inferable === 0);` being ABSENT from
  // his file at HEAD, and it is there 2× — he kept the old spelling deliberately, as the resolver
  // his `KLATCH_R443_G4KEY` cripple swaps back in to prove the re-key was load-bearing. Asserting
  // its absence was asserting that his crippled control should not exist: I keyed the pin on the
  // defect's spelling surviving somewhere in a 700-line file instead of on the repair (443 —
  // census the mechanism, not the spelling; 449 — a declared cripple keeps the old key alive on
  // purpose, so the old key cannot date the file).
  const REPAIR_MARKER = 'KLATCH_R443_G4KEY';
  const markerAtPin = hisPreSrc.split(REPAIR_MARKER).length - 1;
  const markerAtHead = hisHeadSrc.split(REPAIR_MARKER).length - 1;
  const pinPredatesRepair = markerAtPin === 0 && markerAtHead > 1;

  /**
   * A leg description is a `+`-concatenation of string literals, so a claim that spans a line
   * break does not occur contiguously in the file. Collapsing the seams keys each needle on the
   * SENTENCE AS PUBLISHED rather than on where the author happened to break the line — drive 3's
   * `H1-desc` needle read 0× at BOTH revs for exactly this reason, and a needle re-chosen to fit
   * the line breaks would have keyed this leg on bytes instead of on the claim (445/446).
   */
  // TWO transforms, because drive 10 showed the seam model alone is not enough: a needle written
  // as a JS literal evaluates its own escapes, so `INSTRUMENT\'S` in the file and `INSTRUMENT'S`
  // in the needle never match. The reader has to model what the source PUBLISHES — seams joined
  // AND escapes resolved (442 — a source scanner needs a model of the thing it is scanning, not
  // just of where the lines break).
  const publishedText = (src) => src
    .replace(/'\s*\n\s*\+\s*'/g, '')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
  const pinSrc = publishedText(whenWritten);
  const headSrc = publishedText(MINE_NOW_SRC);

  // The reader graded both ways and on BOTH of its models, because one that mangled the text would
  // read every needle 0× and this leg would go green on a destroyed reader rather than on a cured
  // sentence. The escape control carries an apostrophe, so it fails under the seam model alone —
  // one control per model, not one control for both (423).
  const collapseMoved = pinSrc !== whenWritten && headSrc !== MINE_NOW_SRC;
  const SEAM_CONTROL = 'MY `P1` PREDICATE CANNOT TELL A REFUSED LEG FROM A RED ONE';
  const ESCAPE_CONTROL = "Round 444's prose";
  const seamControlOk = whenWritten.includes(SEAM_CONTROL) && pinSrc.includes(SEAM_CONTROL);
  const escapeControlOk = !whenWritten.includes(ESCAPE_CONTROL) && pinSrc.includes(ESCAPE_CONTROL);
  const controlSurvives = seamControlOk && escapeControlOk;

  // The two sentences, each keyed on the CLAIM it makes about the live tree and paired with the
  // predicate that decides whether that claim is true of a given gate.
  const SENTENCES = [
    {
      id: 'P1-desc',
      needle: 'the answer is REFUSED for a SECOND, different reason',
      qualified: 'the answer was REFUSED AT THIS INSTRUMENT\'S OWN REV',
      claims: 'his gate is REFUSED against the live tree',
      trueWhen: (tok) => tok === 'REFUSED',
    },
    {
      id: 'H1-desc',
      needle: 'the row it is wrong about is the one his repaired instrument actually produces',
      qualified: 'the one his instrument produced AT THIS INSTRUMENT\'S OWN REV',
      claims: 'his live run occupies the REFUSED row',
      trueWhen: (tok) => tok === 'REFUSED',
    },
  ];

  const sent = SENTENCES.map((s) => {
    const nPin = pinSrc.split(s.needle).length - 1;
    const nHead = headSrc.split(s.needle).length - 1;
    const qPin = pinSrc.split(s.qualified).length - 1;
    const qHead = headSrc.split(s.qualified).length - 1;
    return {
      ...s, nPin, nHead, qPin, qHead,
      // UNQUALIFIED at a rev = the claim is stated as live. That is the defect, and whether it is
      // FALSE depends on the gate that rev's reader sees.
      liveAtPin: nPin > 0, liveAtHead: nHead > 0,
      pinnedAtPin: qPin > 0, pinnedAtHead: qHead > 0,
    };
  });

  // ── The gate, re-keyed so it does NOT assert a live defect. ─────────────────────────────────
  //
  // Drive 6 is why. `G4` first required both sentences to be STILL PRESENT at HEAD — it asserted
  // the defect it had just found, which is my own Round 446 `G6` mistake repeated one round later:
  // curing the sentences would have REDDENED the leg that asked for the cure. It also made the
  // `BLINDPIN` cripple INERT, because an uncured sentence is present at the pin and at HEAD alike,
  // so pointing the pin half at HEAD changed nothing — `drive6` graded it `BAD`, by exactly the
  // property Theseus's Round 447 §4 used to find three dead cripples in his own file (356).
  //
  // What is gated now is the PROPERTY WORTH KEEPING: no sentence in the live instrument states as
  // live a gate claim that is false of today's gate. The pre-cure PIN is the known positive — it
  // must carry 2 such sentences — and HEAD must carry 0. The leg goes green ON THE CURE.
  const falseIfLive = (tok) => sent.filter((s) => !s.trueWhen(tok));
  const liveAndFalseAtPin = sent.filter((s) => s.liveAtPin && !s.trueWhen(atHead.tok)).length;
  const liveAndFalseAtHead = sent.filter((s) => s.liveAtHead && !s.trueWhen(atHead.tok)).length;
  const pinnedAtHead = sent.filter((s) => s.pinnedAtHead).length;

  // Each sentence was TRUE of the gate at the pin and is FALSE of the gate at HEAD — which is what
  // makes them worth pinning rather than merely stale wording.
  const trueAtPin = atPin.tok === null ? null : sent.every((s) => s.trueWhen(atPin.tok));
  const falseAtHead = atHead.tok === null ? null : sent.every((s) => !s.trueWhen(atHead.tok));
  const seamMoved = atPin.tok !== null && atHead.tok !== null && atPin.tok !== atHead.tok;

  const ok = collapseMoved && controlSurvives && pinPredatesRepair
    && trueAtPin === true && falseAtHead === true && seamMoved
    && liveAndFalseAtPin === sent.length   // the KNOWN POSITIVE: the pin carries every one of them
    && liveAndFalseAtHead === 0            // the CURE: none is stated as live at HEAD
    && pinnedAtHead === sent.length;       // and each is still SAID, qualified — not deleted

  leg('G4', 'TWO LEG DESCRIPTIONS IN MY ROUND 446 INSTRUMENT STATED A LIVE-TREE OUTCOME THAT HIS '
    + 'ROUND 447 RE-AIM MADE FALSE, AND BOTH ARE NOW PINNED. Both legs were green and both figures '
    + 'were right — they are keyed on PINS. The SENTENCES were keyed on the live tree and nothing '
    + 'gated them: `P1`\'s said his gate is "REFUSED for a SECOND, different reason", `H1`\'s said '
    + 'the REFUSED row "is the one his repaired instrument actually produces". What is gated here '
    + 'is the property worth keeping — NO sentence states as live a gate claim that is false of '
    + 'today\'s gate — with the PRE-CURE PIN as the known positive, so the leg goes green ON THE '
    + 'CURE rather than reddening on it. Both ends of the 2 × 2 are DRIVEN (his pre-`G4` blob and '
    + 'his working tree, each run against today\'s tree), both are required non-null before the '
    + 'seam is compared, and the needles are matched against a SEAM-COLLAPSED reading of the '
    + 'source so a claim spanning a `+` line break is still found',
    `his pre-\`G4\` blob ${HIS_PRE_G4_REV} vs today's tree: ${atPin.tok ?? `UNREADABLE (${atPin.why})`} · `
    + `his working tree vs the same tree: ${atHead.tok ?? `UNREADABLE (${atHead.why})`} · seam MOVED ${seamMoved} (true required)\n`
    + `        blob by property, not hash — keyed on the REPAIR's own marker \`${REPAIR_MARKER}\`: in the pin ${markerAtPin}× `
    + `(0 required) · at HEAD ${markerAtHead}× (> 1 required)\n`
    + `        (drive 4 keyed this on the OLD end token being gone from his file; it is there 2×, because his `
    + 'crippled control swaps the old resolver back in on purpose — the defect\'s spelling cannot date the file)\n'
    + `        source→published reader: text MOVED ${collapseMoved} (true required) · SEAM control ${seamControlOk} · `
    + `ESCAPE control ${escapeControlOk} (both required — the escape control carries an apostrophe, so it is absent `
    + 'from the raw source and present only after the escapes resolve; a reader that mangled the source, or one '
    + 'modelling seams alone, would read every needle 0× and this leg green)\n'
    + sent.map((s) => `        ${s.id.padEnd(8)} UNQUALIFIED pin ${s.nPin}× → HEAD ${s.nHead}× (0 at HEAD required) · `
      + `QUALIFIED pin ${s.qPin}× → HEAD ${s.qHead}× (>= 1 at HEAD required — pinned, not deleted) · claims: ${s.claims}`).join('\n')
    + `\n        stated as LIVE and false of today's gate: at the pin ${liveAndFalseAtPin}/${sent.length} `
    + `(all required — the KNOWN POSITIVE) · at HEAD ${liveAndFalseAtHead}/${sent.length} (0 required — the CURE)\n`
    + `        every sentence TRUE of the gate at the pin ${trueAtPin} (true required) · `
    + `FALSE of the gate at HEAD ${falseAtHead} (true required) · still SAID at HEAD, qualified: ${pinnedAtHead}/${sent.length}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G5 — EVERY DECLARED CRIPPLE IS IMPLEMENTED (Theseus's Round 447 §4, taken here rather than
// re-derived: he found three declared `KLATCH_R443_*` names that nothing in his file read, so a
// recording filed as a crippled control was not one). The property that catches it is that an
// implemented name occurs MORE THAN ONCE in the file — somewhere other than its own declaration.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const selfSrc = readFileSync(join(REPO, SELF_REL), 'utf8');
  const counts = Object.fromEntries(IMPLEMENTED.map((n) => [n, selfSrc.split(n).length - 1]));
  const requested = Object.keys(process.env).filter((k) => /^KLATCH_R448_/.test(k) && k !== 'KLATCH_R448_DEPTH');
  const inert = requested.filter((k) => !IMPLEMENTED.includes(k));
  const ok = IMPLEMENTED.every((n) => counts[n] > 1) && inert.length === 0;

  leg('G5', 'EVERY DECLARED CRIPPLE IS READ BY A HOOK, and any requested `KLATCH_R448_*` that no '
    + 'hook implements reddens this leg and is named INERT rather than reported active. The '
    + 'property is that an implemented name occurs MORE THAN ONCE in this file — at its '
    + 'declaration and at least one read — which is exactly what three dead names in his Round 443 '
    + 'instrument failed',
    `occurrences in this file (> 1 each required): ${JSON.stringify(counts)}\n`
    + `        requested this run: ${JSON.stringify(requested)} · INERT (requested, nothing implements): ${JSON.stringify(inert)} (empty required)\n`
    + `        active: ${JSON.stringify([LEGONLY ? 'KLATCH_R448_LEGONLY' : null, BLINDPIN ? 'KLATCH_R448_BLINDPIN' : null].filter(Boolean))}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// G6 — THIS DRIVE REWROTE NOTHING TRACKED AND LEFT NO SCRATCH FILE BEHIND (440/441).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  const dirtyNow = trackedModified();
  const newlyDirty = Object.keys(dirtyNow).filter((p) => !(p in DIRTY_AT_ENTRY));
  const changed = WATCHED.filter((r) => readFileSync(join(REPO, r), 'utf8') !== BYTES_AT_ENTRY[r]);
  // Keyed on ANY dotfile in this directory, not on the `.scratch-` prefix. The narrow key let
  // `.g4-replacement.txt` — a scratch file this fire used to splice this very leg, and which a
  // refused `rm` in a shell chain left behind — reach `origin/main` with `G6` green. A hygiene
  // check keyed on one spelling of "temporary" only sees that spelling (403).
  const leftovers = git('status', '--porcelain', '--untracked-files=all', '--', relative(REPO, HERE))
    .split('\n').map((l) => l.trim()).filter((l) => l !== '')
    .filter((l) => /(^|\/)\.[^/]+$/.test(l.replace(/^\S+\s+/, '')));
  const ok = newlyDirty.length === 0 && changed.length === 0 && leftovers.length === 0;

  leg('G6', 'THIS DRIVE REWROTE NOTHING TRACKED AND LEFT NO SCRATCH FILE BEHIND. The `G3` '
    + 'counterfactual mutates the lib as a SOURCE STRING imported from a scratch path, so the '
    + 'real `verdict.mjs` is byte-identical at exit — checked here rather than intended',
    `tracked MODIFIED on entry (not this drive's): ${Object.keys(DIRTY_AT_ENTRY).length} ${JSON.stringify(Object.keys(DIRTY_AT_ENTRY))} · `
    + `newly MODIFIED by this drive: ${newlyDirty.length} ${JSON.stringify(newlyDirty)}\n`
    + `        watched files byte-identical at exit: ${changed.length === 0} ${JSON.stringify(changed)} · `
    + `scratch files left: ${leftovers.length} ${JSON.stringify(leftovers)}`,
    ok);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// P1″ — ROUND 444's `P1`, RE-SCORED UNDER THE FOUR-LIST PREDICATE.
//
// The deferral closes. His Round 447 `G4` re-aim lifted the blocker, every leg of his is green AND
// both his prediction lists are empty, so the cure holds under his gate and not only under mine.
//
// Said plainly, because it is the honest reading: on TODAY's live row the retired leg-only
// predicate and the four-list cure AGREE, both LANDED. The cure is not load-bearing on this row.
// Everything that establishes the defect is in `G1`/`G2`, off pinned committed recordings — which
// is why those are real artifacts at a rev and not this run's output (436/444).
// ═════════════════════════════════════════════════════════════════════════════════════════════════
{
  let out = null;
  let runErr = null;
  try {
    out = execFileSync('node', [join(REPO, HIS_REL)], {
      encoding: 'utf8', cwd: REPO, maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, KLATCH_R448_DEPTH: String(DEPTH + 1) },
    });
  } catch (e) { runErr = String(e.message).slice(0, 90); }

  // THE CRIPPLE: score with the retired leg-only predicate instead of the cure. On today's row it
  // cannot change the answer — and that is the point of saying so, rather than filing a crippled
  // recording whose every line is identical to the clean one (Theseus's 447 §4 / 356).
  const scorer = LEGONLY
    ? (text) => {
      const rv = readVerdict(text);
      if (rv.ok !== true) return { landed: null, why: `unreadable: ${rv.refusal}` };
      const t = topToken(rv.verdict.red, rv.verdict.refused);
      if (t === 'ok') return { landed: true, why: 'RETIRED PREDICATE — his gate is green: red=[] refused=[]' };
      if (t === 'RED') return { landed: false, why: `RETIRED PREDICATE — red=${JSON.stringify(rv.verdict.red)}` };
      return { landed: null, why: `RETIRED PREDICATE — refused=${JSON.stringify(rv.verdict.refused)}` };
    }
    : scoreFourList;

  const s = out === null ? { landed: null, why: `his instrument did not run: ${runErr}` } : scorer(out);
  const rv = out === null ? null : readVerdict(out);
  const alt = out === null ? null : (LEGONLY ? scoreFourList(out) : null);

  pred('P1', 'ROUND 444 `P1` — "the cure holds under HIS gate, not just under mine" — SCORED, and '
    + 'the two-round deferral closes. Round 444 deferred it on his `G3` anchor-presence guard; '
    + 'Round 446 found my own predicate could not tell his REFUSED leg from a RED one and left it '
    + 'refused a second time, on `G4` being unable to reach its figure. His Round 447 re-aim '
    + '(`e2d70405`) lifted that. Scored here on ALL FOUR lists: every leg of his is green and '
    + 'both his prediction lists are empty. On this row the retired predicate agrees — the cure is '
    + 'not load-bearing here, and `G1`/`G2` carry the defect off pinned recordings instead',
    `his live verdict: ${rv === null ? `NOT RUN (${runErr})` : (rv.ok ? rv.verdict.token : rv.refusal)}`
    + `${rv !== null && rv.ok ? ` legs=${rv.verdict.legs} red=${JSON.stringify(rv.verdict.red)} refused=${JSON.stringify(rv.verdict.refused)}`
      + ` preds=${rv.verdict.preds} refuted=${JSON.stringify(rv.verdict.refuted)} prefused=${JSON.stringify(rv.verdict.prefused)}` : ''}\n`
    + `        FOUR-LIST predicate → ${s.landed === null ? 'REFUSED (open)' : s.landed ? 'LANDED' : 'REFUTED'} — ${s.why}`
    + `${alt === null ? '' : `\n        (cripple active: the CURE would say ${alt.landed === null ? 'REFUSED' : alt.landed ? 'LANDED' : 'REFUTED'} — ${alt.why})`}`,
    s.landed);
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────

const activeCripples = [LEGONLY ? 'KLATCH_R448_LEGONLY' : null, BLINDPIN ? 'KLATCH_R448_BLINDPIN' : null].filter(Boolean);
console.log(`SUBJECTS: ${MINE_REL} (my own Round 446 predicate) · ${HIS_REL} (his oracle)`);
console.log(`REV: ${SHORT}   my pin: ${MINE_PIN}   his pre-G4-repair rev: ${HIS_PRE_G4_REV}   depth: ${DEPTH}`);
console.log(`CRIPPLED: ${activeCripples.length === 0 ? '(none — clean run)' : activeCripples.join(', ')}`);
console.log('');
for (const l of legs) {
  console.log(`${{ true: ' ok ', false: 'RED ', null: 'REF ' }[String(l.ok)]} ${l.id}  ${l.what}`);
  console.log(`        ${l.detail}`);
}
console.log('');
for (const p of preds) {
  console.log(`${{ true: 'LANDED  ', false: 'REFUTED ', null: 'OPEN    ' }[String(p.landed)]} ${p.id}  ${p.what}`);
  console.log(`        ${p.detail}`);
}
console.log('');
console.log(renderVerdict({ legs, preds }));
