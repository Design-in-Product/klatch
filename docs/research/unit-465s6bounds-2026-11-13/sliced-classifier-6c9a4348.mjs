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
 *
 * ## The SOURCE patterns were ungraded, and two of them carry no load
 *
 * Until `unit-465srckeys-2026-11-12`, `selfTest()` graded the denial *key* and nothing else — every
 * case was a commit subject. Theseus named that blindness in his 11/12 §8 (*"a mis-written source
 * regex would be green in all four of my arms"*), and it was equally true here. Measured, by
 * blinding each source pattern in a copy of this file taken from git and running that copy's own
 * `selfTest()`: **0 of 4 blindings were noticed** (`drive1.precure.out`, leg `T1`).
 *
 * A population-level check cannot close it, because two of the sources do not move the population:
 *
 * ```
 * S1 (round dirs)        blinded → filtered 465 → 465   lost 0      <- redundant at HEAD
 * S2 (roundNNN*.test.ts) blinded → filtered 465 → 455   lost 10
 * S3 (other docs paths)  blinded → filtered 465 → 465   lost 0      <- redundant at HEAD
 * S4 (commit subjects)   blinded → filtered 465 → 369   lost 96
 * ```
 *
 * `S1` and `S3` are **entirely subsumed by `S2 ∪ S4`** on today's tree, so a mis-written `S1` or
 * `S3` is invisible to every count a cell could print. That is why the cases below are graded as
 * **classifications of a path**, not as effects on a figure — and why `classifyPath` exists as one
 * named reader instead of three regex literals inside a loop body.
 *
 * The ten members `S2` alone carries are `[8,26,27,30,37,43,45,46,47,465]`. Nine of them have no
 * subject attestation at all; **465 is the one that is also denied by a subject**, which is the
 * mechanism behind Theseus's 11/12 §1 — *the cure's whole measured price was one test filename away
 * from zero.* Measured here, the dependency is wider than that one round.
 *
 * ## Why there is a fifth source, and what taking it cost
 *
 * `S5` (`^docs/research/unit-(\d+)`) is Theseus's 11/12 §6 item 1, routed to this seat. It is taken
 * because the reason to refuse it was **pre-registered and then refuted**. The objection was that
 * crediting a round from a `unit-*` dir moves it into `nonSubject`, where the denial filter can no
 * longer drop it — so `S5` would buy no member and quietly disarm the filter. Predicted: at
 * `69cf9167` it takes `removed` from `[465]` to `[]`.
 *
 * **It does not** (`drive1.precure.out`, leg `T4`): `removed` is `[465]` under both keys at that
 * rev, and `[]` under both at HEAD. The prediction imported a count measured at HEAD (465's 38
 * `unit-*` dirs) into a rev predating every one of them — at `69cf9167` no `unit-465*` dir existed,
 * so `S5` credits nothing there. Zero measured effect at both revs, in both directions, as a set
 * difference rather than a count comparison.
 *
 * The mechanism is still real and is therefore **declared rather than hidden**: `unitRounds` comes
 * back as its own set so a cell can print what `S5` contributed, and `SOURCE_CASES` grades it like
 * the other four. A source whose only effect would be to weaken the denial filter should be visible
 * at the call site, not folded into a total.
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

/**
 * The non-subject source patterns, as ONE reader over a path string.
 *
 * First match wins, and the order is part of the key: `docs/research/round464-instruments/x.mjs`
 * satisfies both `S1` and `S3`, and `docs/research/round465-notes.test.ts` satisfies both `S2` and
 * `S3`. Which set they land in is a decision, so it is tested (`SOURCE_CASES`) rather than left to
 * whoever next reads the loop body.
 *
 * Returns `{ source: 'S1'|'S2'|'S3'|'S5'|null, round: number|null }`. `S4` is not here: it keys on
 * a commit subject, not a path, and is `SUBJECT_ROUND_RE`.
 */
export function classifyPath(p) {
  let m = /^docs\/research\/round(\d+)-instruments\//.exec(p);
  if (m) return { source: 'S1', round: Number(m[1]) };
  m = /(?:^|\/)round(\d+)[^/]*\.test\.tsx?$/.exec(p);
  if (m) return { source: 'S2', round: Number(m[1]) };
  m = /^docs\/research\/[^/]*round(\d+)/.exec(p);
  if (m) return { source: 'S3', round: Number(m[1]) };
  m = /^docs\/research\/unit-(\d+)/.exec(p);
  if (m) return { source: 'S5', round: Number(m[1]) };
  return { source: null, round: null };
}

/**
 * Known positives and near-misses for every source pattern, as data a grader iterates.
 *
 * `present` paths are asserted to exist in the tree — `casePathsPresent()` is how, and a cell must
 * drive it, because a KP that has been deleted is not a slice of anything. `synthetic` paths are
 * declared synthetic: they sit on discrimination edges no live path happens to occupy, and claiming
 * they are real would be the defect this field exists to avoid.
 *
 * Every entry is `[path, source, round]`. The `null` entries are the near-misses: a case table with
 * only positives is satisfied by a pattern that matches everything.
 */
export const SOURCE_CASES = {
  present: [
    ['docs/research/round464-instruments/grade-the-stop-condition.mjs', 'S1', 464],
    ['packages/server/src/__tests__/round465-data-delta.test.ts', 'S2', 465],
    ['docs/research/unit-465attestdenial-2026-11-12/grade-the-denial-rekey.mjs', 'S5', 465],
    ['docs/research/lib/attested-rounds.mjs', null, null],
  ],
  synthetic: [
    // S3 reaches a round-named file only in the FIRST component under docs/research/ …
    ['docs/research/round999-notes.md', 'S3', 999],
    // … so the same filename one level down is reached by nothing. Measured, not supposed: see
    // `unit-465srckeys-2026-11-12` leg T7 for the live count of paths in this blind spot.
    ['docs/research/unit-999x/round999-notes.md', 'S5', 999],
    ['docs/research/notes-2026/round999-notes.md', null, null],
    // S1 wins over S3 on a path both match; S2 wins over S3 on a path both match.
    ['docs/research/round464-instruments/notes.md', 'S1', 464],
    ['docs/research/round465-notes.test.ts', 'S2', 465],
    // Near-misses: no digits, and a test file whose round label is not at a component boundary.
    ['docs/research/round-notes.test.ts', null, null],
    ['packages/server/src/__tests__/for-round465-data.test.ts', null, null],
  ],
  /** `S4` keys on a subject, not a path. One affirming subject and one that names no round. */
  subjects: [
    ['round467: re-key probe-round307 C4 after the population moved', 467],
    ['coord+log: 11/12 STOP fire — the population is the finding', null],
  ],
};

/**
 * The source patterns' own recall floor, measured rather than asserted.
 *
 * `unit-465srckeys-2026-11-12` leg `T7` enumerated every path in the tree at `3ee13880` that names
 * a round and is claimed by **no** source pattern: **207 paths**, naming 162 distinct round numbers,
 * of which **exactly one is not attested by any other source** — round **9**, via
 * `docs/mail/read/daedalus-to-argus-round9.md`. The pre-registered prediction was that the blind
 * spot hid no member; that was **refuted**, and this is the member.
 *
 * A sixth source over `docs/mail/` is therefore a real option with a measured price, and it is
 * **not taken here** — priced, routed, declared:
 *
 *   - keyed strictly as `round(\d+)`: **+1 member (9)**, and 9 is far below the 292 floor every
 *     live consumer counts above, so no figure anyone prints today moves.
 *   - keyed loosely as `round[ -]?(\d+)` to catch the hyphenated mail spellings: admits
 *     **`round-2026`**, i.e. a date read as a round. 93 mail paths name a round-shaped token.
 *
 * So the loose key is wrong and the strict key buys one member below every live threshold. Printed
 * here as a constant so a cell can assert the floor instead of a reader trusting this paragraph.
 */
export const SOURCE_RECALL_FLOOR = {
  rev: '3ee13880',
  invisiblePaths: 207,
  unattestedRounds: [9],
  witness: 'docs/mail/read/daedalus-to-argus-round9.md',
};

/**
 * Which of `SOURCE_CASES.present` are missing from the tree at `rev`. `null` on refusal — a caller
 * must not read a refused check as "nothing missing".
 */
export function casePathsPresent(repo, rev = 'HEAD') {
  const tree = git(repo, ['ls-tree', '-r', '--name-only', rev]);
  if (tree === null) return null;
  const have = new Set(tree.split('\n'));
  return SOURCE_CASES.present.map(([p]) => p).filter((p) => !have.has(p));
}

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

  const bySource = { S1: new Set(), S2: new Set(), S3: new Set(), S5: new Set() };
  for (const p of tree.split('\n')) {
    const c = classifyPath(p);
    if (c.source !== null) bySource[c.source].add(c.round);
  }
  const dirs = bySource.S1;
  const tests = bySource.S2;
  const otherDocs = bySource.S3;
  const unitRounds = bySource.S5;

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

  const nonSubject = new Set([...dirs, ...tests, ...otherDocs, ...unitRounds]);
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
    unitRounds,
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

  // THE SOURCE PATTERNS. Graded as classifications of a path, because two of the five move no
  // figure at all (S1 and S3 are subsumed by S2 ∪ S4 on today's tree — measured, see the docblock),
  // so nothing a cell prints could catch a mis-written one. Positives AND near-misses: a table of
  // positives alone is satisfied by a pattern that matches everything.
  const pathCases = [...SOURCE_CASES.present, ...SOURCE_CASES.synthetic];
  must(pathCases.length >= 8, `SOURCE_CASES has only ${pathCases.length} path case(s)`);
  must(
    pathCases.some(([, s]) => s === null) && new Set(pathCases.map(([, s]) => s)).size >= 5,
    'SOURCE_CASES does not cover every source plus a near-miss'
  );
  for (const [p, wantSource, wantRound] of pathCases) {
    const got = classifyPath(p);
    must(
      got.source === wantSource && got.round === wantRound,
      `classifyPath(${JSON.stringify(p)}) → ${got.source}/${got.round}, want ${wantSource}/${wantRound}`
    );
  }

  // S4, the one source that keys on a subject rather than a path.
  for (const [subject, wantRound] of SOURCE_CASES.subjects) {
    const m = SUBJECT_ROUND_RE.exec(subject);
    const got = m ? Number(m[1]) : null;
    must(got === wantRound, `SUBJECT_ROUND_RE on ${JSON.stringify(subject)} → ${got}, want ${wantRound}`);
  }

  // The declared recall floor is a floor: neither key reaches any of them. If one ever does, this
  // throws rather than leaving the exported list claiming something false.
  for (const s of ALT_SPELLINGS) {
    must(!DENIAL_RE.test(s) && !LEGACY_DENIAL_RE.test(s),
      `ALT_SPELLINGS claims no key reaches ${JSON.stringify(s)}, but one does`);
  }

  return true;
}
