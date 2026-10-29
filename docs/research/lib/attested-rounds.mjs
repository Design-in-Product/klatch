/**
 * The round population, as one reader, with the denial key in one place.
 *
 * ## Why this exists
 *
 * Two cells needed the same population and had different ones.
 *
 * `round464-instruments/grade-the-stop-condition.mjs` counts `consecutive` — the run of rounds
 * since the last one that cured a gated surface — over the set of **round directories** on disk
 * (`readdirSync(docs/research)` matching `round(\d+)-instruments`). `unit-464t2-population-2026-10-28`
 * measured that population and found it **terminated**: 91 dirs spanning 365..464, the last created
 * 2026-10-27T10:52:54-07:00 by `725f97ee`, **0** round dirs created after that instant and **6 of 6**
 * `unit-*` dirs created after it. The two-point growth test is the one that settles it — round 467
 * landed between `8fe017b4` and HEAD and the dir measure went 91 → 91 while the attested measure
 * went 174 → 175. A measure that does not move when the thing it measures happens is not a
 * conservative floor; it is dead.
 *
 * The consequence is not that the figure is merely stale. It is **saturated in both directions**,
 * and the standing cell's own baseline prints both halves:
 *
 *   - dir key:   `last=464 consecutive=0` — and 464 IS the max dir, so `consecutive < N` is green
 *                for every future round whatever the track does.
 *   - union key: `last=467 consecutive=0` — 0 not because no round followed 467 but because the
 *                dir population has **no member above 464 at all**, so nothing can be counted above
 *                any last-round at or past the top of it.
 *
 * So this module exports the attested population as the counting surface, and keeps the dir
 * population beside it as a named second axis rather than silently replacing it. Which one a cell
 * counts over is a decision, and a decision should be visible at the call site.
 *
 * ## Why the denial key lives here and not at each call site
 *
 * `DENIAL_RE` had one live site and Theseus's unit had two copies of it. A key with copies is a key
 * that disagrees with itself as soon as one copy is cured — which is exactly what happened: his
 * `unit-464t2-denial-2026-10-28` §2 found a false positive in the as-filed spelling, pre-registered
 * as a RED before the grader existed, and the cure applies to the live site only if someone
 * remembers the live site. It is one export now.
 *
 * ## The cure, and what it is a cure for
 *
 * As filed, `/\bno\s+round\s*(\d+)\b/i` reads
 *
 *     round467: re-key probe-round307 C4 — there is no round467-instruments directory in the tree
 *
 * as a **denial of round 467**. A denial of round N and a statement that an *artifact* of round N is
 * absent are different claims, and `\b` after the digits cannot tell them apart because `7` → `-`
 * is a word boundary. 467 is the highest attested round and the single member whose existence
 * carries the termination finding, so the as-filed key, pointed at a subject of that shape, deletes
 * exactly the member that makes the case — and the figure comes back *smaller* and looks
 * conservative.
 *
 * The cure is Theseus's: a denied round number is not followed by an identifier tail.
 *
 * **Measured, not assumed, before taking it** (this fire, over every commit subject reachable from
 * HEAD): **2** subjects match the as-filed key and the two keys disagree on **0** of them. So the
 * cure is free on today's figure and the hazard is *prophylactic for this population*. The evidence
 * that the shape gets written is real but comes from a different population — Theseus's §3 census
 * over 2811 committed `.md` files found 44 matching lines, **6** of them false positives, twice in
 * `COORDINATION.md` itself. Prose never reaches this key; commit subjects do. Both halves are stated
 * because "the cure removes a live defect" and "the cure removes a defect this key has not met yet"
 * are different claims and only the second one is true here.
 *
 * ## The recall half is a floor, declared rather than claimed
 *
 * `ALT_SPELLINGS` are four denial shapes neither key reaches. Theseus measured **0** instances of
 * them in the corpus, so this is a floor on the key's recall and not a defect — and it is exported
 * so that a cell can print it rather than a reader having to trust this paragraph.
 */

import { spawnSync } from 'node:child_process';

const SEP = '\u0001';

/**
 * The denial key. A subject that DENIES a round is not an attestation of it.
 *
 * `(?![-\w./])` rather than `\b`: a denied round number is not followed by an identifier tail, so
 * `no round467-instruments` is a statement about a directory and `no Round 465` is a denial.
 */
export const DENIAL_RE = /\bno\s+round\s*(\d+)(?![-\w./])/i;

/**
 * The as-filed spelling, kept so a cell can drive it as a counterfactual arm. Exported rather than
 * re-typed at the cripple site: a cripple that re-types the thing it is crippling can drift away
 * from what the live key actually was, and then the separation it reports is between two spellings
 * neither of which shipped.
 */
export const LEGACY_DENIAL_RE = /\bno\s+round\s*(\d+)\b/i;

/** A round label in a commit subject. Unchanged from the population cell it came from. */
export const SUBJECT_ROUND_RE = /\bround\s*(\d+)\b/i;

/**
 * The subject shape the cure exists for, and a genuine denial to control against it. Exported as
 * data so the known positive and its control are one object a grader can iterate, rather than two
 * string literals a grader might only remember to use one of.
 */
export const KEY_CASES = {
  /** The false positive: an absent ARTIFACT of round 467, not a denial of round 467. */
  fpSubject: 'round467: re-key probe-round307 C4 — there is no round467-instruments directory in the tree',
  /** The control: a real denial, which the cure must still match. */
  denialSubject: 'coord+log: 10/28 STOP fire — no Round 465, the population is the finding',
};

/**
 * Denial spellings NEITHER key reaches. A floor on recall, not a defect: Theseus's §3 census found
 * 0 instances of any of them in the corpus. Declared so a cell can print the floor.
 */
export const ALT_SPELLINGS = [
  'not Round 465',
  'never Round 465',
  'Round 465 does not exist',
  'Round 465 was skipped',
];

/** `git -C repo …`, refusing with `null` rather than throwing or returning an empty string. */
export function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout;
}

/**
 * The round-**directory** population at a rev, read out of the tree rather than off disk so it can
 * be taken at two revs by the same code. Sorted ascending. `null` on refusal.
 */
export function dirRounds(repo, rev) {
  const tree = git(repo, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const dirs = new Set();
  for (const p of tree.split('\n')) {
    const m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
    if (m) dirs.add(Number(m[1]));
  }
  return [...dirs].sort((a, b) => a - b);
}

/**
 * The **attested** round population at a rev: every round a non-subject source names (a round dir,
 * a `roundNNN*.test.ts[x]`, another `docs/research/` path), unioned with every round a commit
 * subject names, minus the rounds whose *only* attestation is a denial.
 *
 * Returns `null` on refusal — a caller must not read a missing population as an empty one.
 *
 * `denialRe` is a parameter so a cell can point the same reader at the as-filed key and at the cure
 * and diff the result. A key that cannot be swapped cannot be graded for vacuity.
 */
export function attestedRounds(repo, rev, { denialRe = DENIAL_RE } = {}) {
  const tree = git(repo, ['ls-tree', '-r', '--name-only', rev]);
  const subjects = git(repo, ['log', `--format=%H${SEP}%s`, rev]);
  if (tree === null || subjects === null) return null;

  const dirs = new Set();
  const tests = new Set();
  const otherDocs = new Set();
  for (const p of tree.split('\n')) {
    let m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
    if (m) { dirs.add(Number(m[1])); continue; }
    m = /(?:^|\/)round(\d+)[^/]*\.test\.tsx?$/.exec(p);
    if (m) { tests.add(Number(m[1])); continue; }
    m = /^docs\/research\/[^/]*round(\d+)/.exec(p);
    if (m) otherDocs.add(Number(m[1]));
  }

  const subjectRounds = new Set();
  const deniedRounds = new Set();
  const rows = [];
  for (const line of subjects.split('\n').filter(Boolean)) {
    const [hash, subject = ''] = line.split(SEP);
    const dm = denialRe.exec(subject);
    const sm = SUBJECT_ROUND_RE.exec(subject);
    if (sm) subjectRounds.add(Number(sm[1]));
    if (dm) deniedRounds.add(Number(dm[1]));
    rows.push({ hash, subject, round: sm ? Number(sm[1]) : null, denies: dm ? Number(dm[1]) : null });
  }

  const nonSubject = new Set([...dirs, ...tests, ...otherDocs]);
  const raw = new Set([...nonSubject, ...subjectRounds]);

  // A round is removed ONLY when every attestation of it is a denial — credited by no non-subject
  // source and by no subject that is not itself a denial of it.
  const affirmedBySubject = new Set();
  for (const r of rows) {
    if (r.round !== null && r.denies !== r.round) affirmedBySubject.add(r.round);
  }
  const filtered = new Set([...raw].filter((n) => nonSubject.has(n) || affirmedBySubject.has(n)));
  const removed = [...raw].filter((n) => !filtered.has(n)).sort((a, b) => a - b);

  return {
    raw, filtered, removed, nonSubject, subjectRounds, deniedRounds, affirmedBySubject,
    dirs: [...dirs].sort((a, b) => a - b),
    sorted: [...filtered].sort((a, b) => a - b),
    rows,
  };
}

/**
 * Returns `true`, or throws with the failing case named. A caller must gate on `!== true` and not on
 * truthiness — a self-test whose result is printed and not gated is decoration.
 */
export function selfTest() {
  const must = (cond, what) => { if (!cond) throw new Error(`attested-rounds.mjs selfTest: ${what}`); };

  // The two keys are not the same VALUE. Identity would pass on a one-byte typo in either.
  must(String(DENIAL_RE) !== String(LEGACY_DENIAL_RE), 'the cure and the as-filed key are the same source');
  must(String(DENIAL_RE).includes('(?![-\\w./])'), `DENIAL_RE lost its lookahead: ${DENIAL_RE}`);

  // THE KNOWN POSITIVE, in the real call shape (a whole commit subject, not a fragment), graded in
  // BOTH directions. The cure must drop the false positive AND the as-filed key must still carry it,
  // otherwise this case is green because the subject matches neither and separates nothing.
  const fpNow = DENIAL_RE.exec(KEY_CASES.fpSubject);
  const fpWas = LEGACY_DENIAL_RE.exec(KEY_CASES.fpSubject);
  must(fpNow === null, `the cure still reads the artifact-absence subject as a denial of ${fpNow && fpNow[1]}`);
  must(fpWas !== null && Number(fpWas[1]) === 467,
    `the as-filed key no longer denies 467 on the KP, so this case separates nothing: ${fpWas && fpWas[1]}`);

  // THE CONTROL. A key that matched nothing would pass the case above. A genuine denial must still
  // match under BOTH spellings, with the same round number.
  const ctlNow = DENIAL_RE.exec(KEY_CASES.denialSubject);
  const ctlWas = LEGACY_DENIAL_RE.exec(KEY_CASES.denialSubject);
  must(ctlNow !== null && Number(ctlNow[1]) === 465, `the cure stopped matching a genuine denial: ${ctlNow}`);
  must(ctlWas !== null && Number(ctlWas[1]) === 465, `the as-filed key stopped matching a genuine denial: ${ctlWas}`);

  // The declared recall floor is a floor: neither key reaches any of them. If one ever does, this
  // throws rather than leaving the exported list claiming something false.
  for (const s of ALT_SPELLINGS) {
    must(!DENIAL_RE.test(s) && !LEGACY_DENIAL_RE.test(s),
      `ALT_SPELLINGS claims no key reaches ${JSON.stringify(s)}, but one does`);
  }

  return true;
}
