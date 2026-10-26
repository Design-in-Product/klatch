#!/usr/bin/env node
/**
 * ROUND 460 — THE `readTail` PRED GATE, AND WHAT IT DOES TO 439 COMMITTED RECORDINGS
 *
 * Why this cell exists
 * ────────────────────
 * Theseus's Round 457 `C5` read the gap off the lib's own source and said so in its docblock:
 *
 *   > C5  the PRED-count check is MINE and not the lib's — assert `readTail` does not contain a
 *   >     PRED-count comparison, read off the lib's source, so that a cure to the lib reddens this
 *   >     leg instead of leaving a stale sentence behind.
 *
 * His `Q2` then measured the class as LIVE, not latent: **13** committed recordings print a number
 * of `PRED` rows that disagrees with their own `preds=N`, and `readTail` returns `ok` on every one
 * of them. His §5.1 routed the cure to me with one named hazard — `postcommit-rediff.mjs`, which
 * reads a committed recording through `readTail` and degrades silently if that read starts refusing
 * — and my Round 458 §5 found a second, harder one: round450's `W5` conjoins
 * `ROW_REFUSALS.length === 6`, a population size pinned in a guard, so adding a seventh code reddens
 * that leg on its own promotion. His Round 459 §6 agreed the landing is ONE commit carrying the
 * cure, a case that drives the new code by name, and that literal replaced by a derived length.
 *
 * This cell grades that landing. It is not a census of the gap — that is his, and I reproduce his
 * figure under my own key rather than citing it (416).
 *
 * The A/B, and why the pre-cure arm is a PINNED REV and not `HEAD`
 * ───────────────────────────────────────────────────────────────
 * The pre-cure arm is the lib as committed at `PRE_REV`, a 40-character literal. Sourcing it from
 * `HEAD` would make this cell measure a difference that vanishes the moment the cure is committed —
 * both arms would resolve to the cured lib and the A/B would read as "no effect" from a cell that
 * had simply stopped being able to see one (441 — an old cell sourced from HEAD inverts when the
 * cure lands; 438 — identical runs read as no effect when all three arms are dead). `G2` declares
 * the seam and grades it as a 2 × 2: the pinned source must LACK the new code and the worktree
 * source must CARRY it. Before the cure, `G2` is RED and `G7` is RED, which is this instrument
 * saying it can tell the two worlds apart — recorded in `drive1.precure.out`.
 *
 * Legs
 * ────
 *   GATE legs (must hold for the figure to mean anything):
 *     G1  population selected with `ls-tree` at REV, `-C REPO` pinned, REV stamped. Pinned because
 *         `git ls-tree` is cwd-sensitive and an unpinned reader makes its own population (403).
 *     G2  THE SEAM. The pinned pre-cure lib lacks `PRED_ROW_COUNT_DISAGREEMENT`; the worktree lib
 *         declares it, `refuseRow` accepts it, and `readTail` drives it by name on a lifted input.
 *     G3  every recording REACHES a decision in BOTH arms — neither reader threw on any member.
 *         `readTail` is documented never to throw; this grades that claim over 439 real inputs
 *         rather than over the three in the self-test.
 *     G4  the cure is ADDITIVE ONLY. For every recording, the post-cure refusal is either identical
 *         to the pre-cure one or is exactly the new code arriving at a recording that previously
 *         read `ok`. Any other transition — a LEG-side code changing, or a refusal disappearing —
 *         is a defect in the cure and not a finding about the corpus.
 *     G5  HIS NAMED HAZARD, measured. `round450-instruments/drive7.pre-commit-final.out` is the file
 *         `postcommit-rediff.mjs` reads as its `before`. It must still read `ok` after the cure, or
 *         the re-diff silently compares nothing (`rowsOf` returns an empty map on a refusal, and
 *         `mapsIdentical` goes false) and the landing is unsafe as specified.
 *     G6  CONTROL, known negative: `round455-instruments/drive2.w10-disposition.out`, the recording
 *         his `C3` pre-registered as COMPLETE (LEG 8=8, PRED 0=0). It must read `ok` in BOTH arms.
 *         Without it, a cure that refused the whole corpus would score every member "moved" (424).
 *     G7  KP, known positive, pre-registered from HIS report and not from my measurement:
 *         `round449-instruments/drive7.clean.out` is named in his `Q2` detail. It must be in MOVED.
 *
 *   PREDICTION legs (written before the drive; they do not gate the figure):
 *     P1  MOVED is exactly 13 — his `Q2` figure, re-derived from committed bytes rather than copied.
 *         Scored over HIS population (the `.out` files committed at `df5a27cc`) and not mine, which
 *         is larger: every round since has added recordings, and scoring my figure against his
 *         number would compare two populations and read the difference as a disagreement. My own
 *         figure is reported beside it, with any member that postdates his rev named.
 *     P2  every member of MOVED is under `round449-instruments/`. His list is all-449, which would
 *         follow from the cause: `renderTail` dropped a prediction's row until Round 450 built
 *         `renderPredRows`, so the fossils should be the recordings made just before that. A member
 *         outside 449 means a second mechanism I have not accounted for.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readTail, renderTail, renderVerdict, ROW_REFUSALS } from '../lib/verdict.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const LIB = join(HERE, '..', 'lib', 'verdict.mjs');

/**
 * The pre-cure rev, a literal. This is `main` immediately before the Round 460 commit; its
 * `docs/research/lib/verdict.mjs` is the gap Theseus's `C5` read. See the docblock for why this is
 * not `HEAD`.
 */
const PRE_REV = '172b547f81db597542b6c3344e683ff371b01d6a';
const NEW_CODE = 'PRED_ROW_COUNT_DISAGREEMENT';

const legs = [];
const preds = [];
const leg = (id, ok, what) => { legs.push({ id, ok, what: String(what).replace(/\s+/g, ' ').trim() }); };
const pred = (id, landed, what) => { preds.push({ id, landed, what: String(what).replace(/\s+/g, ' ').trim() }); };
const say = (...a) => console.log(...a);

// `-C REPO` via `cwd`, pinned: `git ls-tree -r <rev>` is relative to the working directory, so an
// unpinned reader returns 400 paths from the root and 0 from a subdirectory (403).
const git = (args) => execFileSync('git', args, {
  cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
});

const REV = git(['rev-parse', 'HEAD']).trim();
say('═══ ROUND 460 — THE readTail PRED GATE, GRADED OVER THE COMMITTED CORPUS ═══');
say(`REV      ${REV}`);
say(`PRE_REV  ${PRE_REV}  (pinned literal — the pre-cure arm)`);
say(`DIRTY    ${git(['status', '--porcelain']).trim().length > 0}`);
say('');

// ── G1 — the population, from the rev ───────────────────────────────────────────────────────────
const corpus = git(['ls-tree', '-r', REV, '--name-only']).trim().split('\n')
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out'))
  .sort();
leg('G1', corpus.length > 0 && REV.length === 40 && PRE_REV.length === 40,
  `population ${corpus.length} committed .out recording(s), ls-tree at ${REV}, cwd pinned to the repo root`);

// ── G2 — THE SEAM, graded as a 2 × 2 ────────────────────────────────────────────────────────────
// The pre-cure reader is IMPORTED from the pinned source, not hand-typed. A copy of this reader
// written out by hand would be my model of his gap rather than the gap (411 — a hand-typed reader is
// not a slice). The copy lands in THIS directory, which sits at the same depth below the repo root
// as `lib/` does, so the lib's own `REPO_ROOT` resolves identically (439).
const preSrc = git(['show', `${PRE_REV}:docs/research/lib/verdict.mjs`]);
const postSrc = readFileSync(LIB, 'utf8');

let preReadTail = null;
let importProblem = null;
{
  const p = join(HERE, '.pre-cure-lib.mjs');
  writeFileSync(p, preSrc);
  try {
    const m = await import(`${p}?v=${Date.now()}`);
    if (typeof m.readTail !== 'function') importProblem = 'the pinned source has no readTail export';
    else preReadTail = m.readTail;
  } catch (e) {
    importProblem = `IMPORT: ${e.message}`;
  } finally {
    rmSync(p, { force: true });
  }
}

// The new code, DRIVEN by name through the worktree reader rather than grepped for. A literal
// present in a source file is not a live branch (358). The input is a tail whose LEG count agrees
// with its own `legs=N` and whose PRED rows do not account for its `preds=N` — the exact class.
const liveInput = `LEG G6 RED x\n${renderVerdict({
  legs: [{ id: 'G6', ok: false }], preds: [{ id: 'Q1', landed: true }],
})}`;
let driven = null;
try { driven = readTail(liveInput).refusal; } catch (e) { driven = `threw:${e.message.slice(0, 60)}`; }

const preLacks = !preSrc.includes(NEW_CODE);
const postDeclares = ROW_REFUSALS.includes(NEW_CODE) && postSrc.includes(NEW_CODE);
const seamOk = preLacks && postDeclares && driven === NEW_CODE && preReadTail !== null;
leg('G2', seamOk,
  `pinned pre-cure source LACKS ${NEW_CODE}: ${preLacks} · worktree lib DECLARES it: ${postDeclares} · `
  + `readTail DRIVES it by name on a lifted input: ${driven === NEW_CODE} (got ${driven}) · `
  + `pre-cure reader imported: ${preReadTail !== null}${importProblem === null ? '' : ` (${importProblem})`}`);

// ── the measurement: both arms over every member, one read of the bytes ─────────────────────────
const rows = [];
let unreached = 0;
const unreachedNames = [];
for (const p of corpus) {
  const text = git(['show', `${REV}:${p}`]);
  const read = (f) => {
    if (f === null) return { reached: false, ok: null, refusal: 'ARM DEAD' };
    try {
      const t = f(text);
      return { reached: true, ok: t.ok === true, refusal: t.ok === true ? null : t.refusal };
    } catch (e) {
      return { reached: false, ok: null, refusal: `threw:${e.message.slice(0, 40)}` };
    }
  };
  const pre = read(preReadTail);
  const post = read(readTail);
  if (!pre.reached || !post.reached) { unreached += 1; if (unreachedNames.length < 5) unreachedNames.push(p); }
  rows.push({ p, pre, post });
}

const moved = rows.filter((x) => x.pre.ok === true && x.post.refusal === NEW_CODE);
const violations = rows.filter((x) => {
  if (!x.pre.reached || !x.post.reached) return false;       // G3's business, not G4's
  if (x.pre.refusal === x.post.refusal) return false;        // unchanged, including both-ok
  return !(x.pre.refusal === null && x.post.refusal === NEW_CODE);
});

say(`MOVED    ${moved.length} recording(s) ok → ${NEW_CODE}`);
for (const m of moved) say(`   ${m.p}`);
say(`OTHER TRANSITIONS  ${violations.length}`);
for (const v of violations) say(`   ${v.p}: ${v.pre.refusal ?? 'ok'} → ${v.post.refusal ?? 'ok'}`);
say('');

// ── G3 — both arms reach a decision on every member ─────────────────────────────────────────────
leg('G3', unreached === 0,
  `recordings where either arm failed to reach a decision: ${unreached}`
  + `${unreached === 0 ? '' : ` (first few: ${JSON.stringify(unreachedNames)})`} — readTail is `
  + 'documented never to throw, graded here over the whole corpus rather than over the self-test');

// ── G4 — additive only ─────────────────────────────────────────────────────────────────────────
leg('G4', violations.length === 0,
  `transitions that are neither identical nor ok→${NEW_CODE}: ${violations.length}`
  + `${violations.length === 0 ? '' : ` — ${JSON.stringify(violations.map((v) => `${v.p}:${v.pre.refusal ?? 'ok'}→${v.post.refusal ?? 'ok'}`))}`}`);

// ── G5 — his named hazard, measured rather than assured ─────────────────────────────────────────
const HAZARD = 'docs/research/round450-instruments/drive7.pre-commit-final.out';
const hazardRow = rows.find((x) => x.p === HAZARD) ?? null;
leg('G5', hazardRow !== null && hazardRow.post.ok === true,
  `postcommit-rediff's 'before' recording ${HAZARD.replace('docs/research/', '')} reads `
  + `${hazardRow === null ? 'ABSENT FROM POPULATION' : (hazardRow.post.ok ? 'ok' : hazardRow.post.refusal)} `
  + 'after the cure — expect ok, or the re-diff compares an empty row map against a full one');

// ── G6 — CONTROL, known negative ───────────────────────────────────────────────────────────────
const CONTROL = 'docs/research/round455-instruments/drive2.w10-disposition.out';
const controlRow = rows.find((x) => x.p === CONTROL) ?? null;
leg('G6', controlRow !== null && controlRow.pre.ok === true && controlRow.post.ok === true,
  `CONTROL ${CONTROL.replace('docs/research/', '')} — pre-cure `
  + `${controlRow === null ? 'ABSENT FROM POPULATION' : (controlRow.pre.ok ? 'ok' : controlRow.pre.refusal)}, `
  + `post-cure ${controlRow === null ? 'ABSENT FROM POPULATION' : (controlRow.post.ok ? 'ok' : controlRow.post.refusal)} `
  + '— his C3 pre-registered this one as COMPLETE (LEG 8=8, PRED 0=0); a cure that refused the '
  + 'whole corpus would score every member moved');

// ── G7 — KP, pre-registered from HIS report ────────────────────────────────────────────────────
const KP = 'docs/research/round449-instruments/drive7.clean.out';
const kpRow = rows.find((x) => x.p === KP) ?? null;
leg('G7', kpRow !== null && kpRow.pre.ok === true && kpRow.post.refusal === NEW_CODE,
  `KP ${KP.replace('docs/research/', '')} — named in his Q2 detail, pre-registered from his report: `
  + `pre-cure ${kpRow === null ? 'ABSENT FROM POPULATION' : (kpRow.pre.ok ? 'ok' : kpRow.pre.refusal)}, `
  + `post-cure ${kpRow === null ? 'ABSENT FROM POPULATION' : (kpRow.post.refusal ?? 'ok')} — expect `
  + `ok → ${NEW_CODE}`);

// ── the predictions ────────────────────────────────────────────────────────────────────────────
// Scored only when the seam is live. Before the cure the MOVED set is empty for a reason that has
// nothing to do with the corpus, and a prediction scored off that would be a REFUTED earned by an
// unrun measurement — the `P1` shape I cured in Round 458 (435).
const scorable = seamOk && unreached === 0;

// His 13 was measured over the 439 `.out` files committed at `HIS_REV`. Mine is measured over
// whatever is committed at `REV`, which is larger — every round since has added recordings. Scoring
// my figure against his number directly would compare two populations and call the difference a
// disagreement. So P1 is scored on MOVED ∩ HIS population, which is his key, and my own figure is
// reported beside it (416 — reproduce their figures under their own key before correcting them).
const HIS_REV = 'df5a27cc58166b6f5c620bd5799ed4b863957bbb';
const hisCorpus = new Set(git(['ls-tree', '-r', HIS_REV, '--name-only']).trim().split('\n')
  .filter((p) => p.startsWith('docs/research/') && p.endsWith('.out')));
const movedAtHisRev = moved.map((m) => m.p).filter((p) => hisCorpus.has(p));
const movedSinceHisRev = moved.map((m) => m.p).filter((p) => !hisCorpus.has(p));

pred('P1', scorable ? movedAtHisRev.length === 13 : null,
  `his Q2 figure under HIS key: MOVED ∩ (${hisCorpus.size} recordings at ${HIS_REV.slice(0, 8)}) = `
  + `${movedAtHisRev.length}, expect 13 · my own population at ${REV.slice(0, 8)} is ${corpus.length} `
  + `and gives MOVED ${moved.length}, of which ${movedSinceHisRev.length} postdate his rev`
  + `${movedSinceHisRev.length === 0 ? '' : ` (${JSON.stringify(movedSinceHisRev)})`}`
  + `${scorable ? '' : ' — NOT SCORED: the seam is not live in this drive'}`);

const outside = moved.map((m) => m.p).filter((p) => !p.startsWith('docs/research/round449-instruments/'));
pred('P2', scorable ? outside.length === 0 : null,
  `members of MOVED outside round449-instruments: ${outside.length}`
  + `${outside.length === 0 ? '' : ` (${JSON.stringify(outside)})`}`
  + `${scorable ? '' : ' — NOT SCORED: the seam is not live in this drive'}`);

say('');
say(renderTail({ legs, preds }));
process.exitCode = legs.some((l) => l.ok === false) ? 1 : 0;
