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
 *
 * ## The sixth source is taken — for durability, and not for the member it was priced on
 *
 * `S6` (`^docs/mail/.*round(\d+)`) was priced here as **+1 member (round 9)** and declined on the
 * grounds that 9 sits far below the 292 floor every live consumer counts above. Both halves of that
 * are now dead, and neither died the way the argument that replaced them said.
 *
 * Theseus's 11/12 §2 withdrew the +1 (it is **zero** at HEAD — see the floor section: reporting the
 * member attested it) and offered **durability** instead: 9's whole claim to membership was two
 * memo-shaped subjects, so *"one future subject of the form 'no round N' removes it again"*, and
 * `S6` would move it into `nonSubject` where no subject can deny it away.
 *
 * **That premise is false, and it is false because of this file.** `affirmedBySubject` is built
 * **per row**, so a round is removed only when *every* attestation of it is a denial. Round 9 has
 * **two** committed non-denying subjects. Measured through this module's own `denialRe` seam
 * (`unit-465maildurable-2026-11-13`, `T1`/`T2`): a synthetic key denying 9 on **one** of the two
 * rows leaves `9 ∈ filtered` and `removed = []`; the same key extended to **both** rows removes it.
 * One future denial cannot touch it. The durability case for round 9 is **vacuous**.
 *
 * It is taken anyway, because the set the argument should have been about is a different set:
 *
 * ```
 * at-risk (in `filtered`, NOT in nonSubject, exactly ONE non-denying subject row)
 *                              @6c9a4348 → [10, 270, 282, 319, 466]   5 members, 9 NOT among them
 * strict S6 ∩ at-risk          → [10]                                 1 of the 5
 * strict S6 at HEAD, members   → gained [] lost []                    moves no live figure
 * strict S6 at 3ee13880        → gained [9]                           the old price, at its own rev
 * ```
 *
 * So the honest size of this change is **one member made denial-proof (round 10) and no figure
 * moved** — not +1 member, and not the member either memo argued over. The decision rule was
 * pre-registered before the arm existed (take iff it moves no member set, protects ≥1 at-risk
 * member, and reclassifies nothing outside `docs/mail/`); all three held, so it is taken.
 *
 * **The loose spelling stays rejected, and now there is a graded case for why.**
 * `round[ -]?(\d+)` over `docs/mail/` admits **2026** — not from a date label, but from
 * `…ssh443-workaround-2026-04-18.md`: the tail of the word *workaround*, followed by a year. That
 * real in-tree path is `SOURCE_CASES`' near-miss for `S6`, so the rejection is a test and not a
 * sentence. Strict claims 61 distinct rounds at `6c9a4348`, max **463**; loose claims 70, one of
 * them ≥ 1000.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

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
 * Returns `{ source: 'S1'|'S2'|'S3'|'S5'|'S6'|null, round: number|null }`. `S4` is not here: it keys
 * on a commit subject, not a path, and is `SUBJECT_ROUND_RE`.
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
  // `S6` needs a boundary on BOTH sides of `round`. The right-hand one (digits must touch the word)
  // is why the separator-tolerant spelling was rejected. The left-hand one was missing until
  // `unit-465routecure`: with only `.*` in front, the pattern reads the **tail of the word
  // *workaround*** as a round, so a mail path ending `…workaround2026-04-18.md` was claimed as round
  // 2026 and landed in `nonSubject`, where no denial can reach it. Both foils are in `S6_FOILS` and
  // `selfTest` requires a live case each one claims and this key refuses.
  m = /^docs\/mail\/(?:.*[^a-z0-9])?round(\d+)/i.exec(p);
  if (m) return { source: 'S6', round: Number(m[1]) };
  return { source: null, round: null };
}

/**
 * The two **rejected** spellings of `S6`, kept as foils rather than described in prose.
 *
 * A pattern is only as good as what it refuses, and "we rejected the looser key" is a claim a cell
 * can grade only if the looser key is still executable. `selfTest` requires, for **each** foil, a
 * path case the foil claims and `classifyPath` refuses — so deleting the case that makes the
 * rejection true throws, which is the defect Theseus found in the first shape of this (his `T4p`:
 * the near-miss entry was deletable with `selfTest()` green, because nothing was keyed on what it
 * proved).
 *
 * The whole family is itself a **floor** in `selfTest`, keyed on these two names as literals in the
 * assertion. Every other foil check is a quantifier over this object, so `S6_FOILS = {}` satisfied
 * all of them vacuously and `selfTest()` returned `true` with the executable record of what was
 * rejected deleted — Theseus's `D2` in `unit-465foilchain-2026-11-13`, driven against my own
 * instrument in `unit-465chainfloor-2026-11-13`'s arm A, where arm D publishes
 * `red=[] refused=[D3,D4]` and the leg reading *"the live module is green"* is green **because** of
 * the vacuity.
 */
export const S6_FOILS = {
  /** Reads `…workaround-2026-04-18.md` as round 2026: the digits need not touch the word. */
  separatorTolerant: /^docs\/mail\/.*round[ -]?(\d+)/i,
  /** Reads `…workaround2026-04-18.md` as round 2026: no boundary on the LEFT of the word. */
  boundaryFree: /^docs\/mail\/.*round(\d+)/i,
};

/**
 * The foils **most permissive first**, because they are **nested** and that changes what a witness
 * can prove.
 *
 * Every path `boundaryFree` claims, `separatorTolerant` also claims (`[ -]?` is optional). So the
 * first shape of this cure — *"each foil needs a case it claims and `classifyPath` refuses"* — was
 * satisfied for **both** foils by the **single** case belonging to the stricter one, and deleting
 * the other case left `selfTest()` green. That is Theseus's `T4p` surviving its own cure, found by
 * this unit's `C4-separatorTolerant` and kept red in `drive3.armc.out`.
 *
 * What a nested chain needs is a witness per link that the **next** key refuses: each foil's case
 * must show what that foil admits *and the next one does not*. Pairwise isolation cannot be asked
 * for instead — `boundaryFree` has no path that `separatorTolerant` refuses, so that assertion
 * would be unsatisfiable rather than merely weak.
 */
export const S6_FOIL_CHAIN = ['separatorTolerant', 'boundaryFree'];

/**
 * Every source id `classifyPath` can return. Declared so `selfTest` can require a case for each
 * one **without counting** — a count in an assertion has to be edited by the same hand that adds
 * the source it was supposed to catch.
 *
 * `selfTest` also derives the producible set from `classifyPath`'s own text and compares. That scan
 * is deliberately allowed to under-report: if the quoting style changes, the comparison goes **red**
 * rather than silently passing, which is the safe direction for a self-census.
 */
export const SOURCE_IDS = ['S1', 'S2', 'S3', 'S5', 'S6'];

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
    // S6's positive is the witness that put it in the module: the single member the blind spot hid.
    ['docs/mail/read/daedalus-to-argus-round9.md', 'S6', 9],
    // S6's near-miss, and the reason the LOOSE spelling was rejected rather than merely disliked.
    // `round[ -]?(\d+)` reads the tail of "workaround" plus a date as round 2026; the strict key
    // requires the digits to touch "round", so this real in-tree path is claimed by nothing.
    ['docs/mail/read/calliope-to-dispatch-ssh443-workaround-2026-04-18.md', null, null],
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
    // `S6`'s LEFT-boundary foil, and the only case that proves the boundary does work. Declared
    // synthetic because it is the in-tree `…workaround-2026-04-18.md` path with its separator
    // removed — no live path occupies this edge (measured: 0 of 114 mail paths naming `round` are
    // reclassified by the boundary, `unit-465routecure` R6/R15), so claiming it were real would be
    // the defect `synthetic` exists to avoid.
    ['docs/mail/read/calliope-to-dispatch-ssh443-workaround2026-04-18.md', null, null],
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
 * **`S6` is now taken, and the reason is not the one that was priced here.** See the sixth-source
 * section below; the figures are `unit-465maildurable-2026-11-13`.
 *
 * ## The floor is a reading at a rev, so it is read at a rev
 *
 * The first shape of this constant put `unattestedRounds: [9]` beside `rev: '3ee13880'` and trusted
 * the reader to notice that the second field scopes the first. Theseus named the hazard the day it
 * shipped: **the first cell that asserts the constant against a HEAD read goes red**, because the
 * same quantity at HEAD is `[]`. Measured, not argued (`unit-465maildurable` `T6`/`T7`): `[9]` and
 * 207 paths at `3ee13880`, and `[]` at `6c9a4348` through **one reader** pointed at two revs.
 *
 * Why it moved is the interesting half, and it is the mechanism this module exists to key on: the
 * two commits that *reported* round 9 as unattested both end `"the blind spot hides round 9"`, and
 * `SUBJECT_ROUND_RE` reads a subject naming a round as an attestation of it. **Delivering the
 * finding destroyed it.**
 *
 * So the pinned reading is kept — it is a true known-positive and the live reader is graded against
 * it — but it now lives under a key that *names its own rev*, `at3ee13880`. A consumer cannot write
 * `SOURCE_RECALL_FLOOR.unattestedRounds` any more; the shortest thing it can write carries the rev,
 * and anything else is `unattestedRoundsAt(repo, rev)`. The defect was not the number. It was that
 * the honest number was reachable without its scope.
 */
export const SOURCE_RECALL_FLOOR = {
  /** The rev of the TREE the pinned reading below was taken over. */
  rev: '3ee13880',
  /**
   * The reading, under a key that cannot be quoted without its rev. A fact about `3ee13880` and
   * about no other rev — at `6c9a4348` the same reader returns `[]` (measured, `T7`).
   */
  at3ee13880: {
    invisiblePaths: 207,
    unattestedRounds: [9],
    witness: 'docs/mail/read/daedalus-to-argus-round9.md',
    /**
     * **The second axis, which the first shape of this cure missed.** This quantity is a function
     * of `(tree rev, classifier)`, not of the tree rev alone: it counts paths **no source claims**,
     * so it moves when the set of sources moves. This reading was taken under the **five-source**
     * classifier — before `S6` — whose last rev is `6c9a4348`. Calling today's
     * `unattestedRoundsAt(repo, '3ee13880')` returns a *smaller* blind spot and an empty `outside`,
     * because `S6` now claims the mail paths that made it up, including the witness above.
     *
     * Found by this unit's own cure-contract leg (`T11`), which went **RED on the cure** and is
     * kept red in `drive2.postcure.out`: scoping the pin to a rev and then changing the classifier
     * in the same commit is the same defect one axis over.
     *
     * **The route is `reproduceFloorReading(repo)`, not this sentence.** The first shape of this
     * docblock said *"slice this module at `classifierRev` and read the tree at `rev`"* — and that
     * route **raises a `TypeError` on the first reader who follows it**, because
     * `unattestedRoundsAt` was added by the cure commit `a827c5cd`, one commit *after* the
     * `6c9a4348` named here. Theseus found it by doing exactly what the sentence said
     * (`unit-465s6bounds` arm A, `drive1.out`, kept as a crash).
     *
     * A rev-valued pin is reproducible only if **every** component of the route exists at that rev,
     * and when a cure adds the scoping field and the reader that field scopes in the same commit,
     * the scope value necessarily points at a rev that predates the reader. The cure is not a better
     * sentence: it is that the route is a **function**, so a reader cannot follow a stale one and a
     * cell can grade the pin's *value* instead of the presence of a string.
     */
    classifierRev: '6c9a4348',
  },
  /** For any other rev, call this instead of reading the pin. */
  readAnyRevWith: 'unattestedRoundsAt(repo, rev)',
  /** And to reproduce the pin itself, call this — a function, never a described procedure. */
  reproducibleBy: 'reproduceFloorReading(repo)',
};

/**
 * Re-derive the pinned floor reading from a **whole module sliced out of `classifierRev`**, and
 * grade it against the pin. Returns `{ ok, got, want, route }`, or `null` on refusal — a caller must
 * not read a refusal as a reproduction.
 *
 * ## Why a whole slice and not a spliced classifier
 *
 * The cure routed to this seat was *"compose `classifyPath` sliced at `classifierRev` with the
 * reader from HEAD."* That pins two axes and leaves a third live, and the third one was under
 * repair in the same memo (`unattestedRoundsAt`'s round-extraction key — see its own docblock). A
 * route whose reader is live is not a pin; it is an unscoped axis wearing a pinned label.
 *
 * It also does not work. Splicing `6c9a4348`'s classifier into today's module leaves `SOURCE_IDS`
 * declaring `S6` that classifier cannot return, so the composed module's own `selfTest()` **throws**
 * (measured twice: Theseus's `T8c`, and `unit-465routecure` `R4b` as the set relation that causes
 * it). The **whole** slice at that rev is self-consistent — its own `selfTest()` returns `true`
 * (`R4`) — because a module at a rev is a thing that once passed its own tests, while a hybrid of
 * two revs is a thing no drive has ever graded.
 *
 * ## What is still HEAD-authored, stated rather than hidden
 *
 * The four lines below that build `invisible` and `rounds` are the reader expression, and they live
 * at HEAD. They are deliberately **not** a call to `unattestedRoundsAt`: that function is free to
 * move (and did, in the same commit as this one), and the pin must not move with it. The guarantee
 * this buys is not that the expression cannot be edited — it is that editing it turns the grading
 * cell **red** instead of letting the pin drift silently, which is the whole difference between a
 * pin and a number in a comment.
 */
export async function reproduceFloorReading(repo, { modPath = 'docs/research/lib/attested-rounds.mjs' } = {}) {
  const treeRev = SOURCE_RECALL_FLOOR.rev;
  const pin = SOURCE_RECALL_FLOOR[`at${treeRev}`];
  if (!pin) return null;

  const src = git(repo, ['show', `${pin.classifierRev}:${modPath}`]);
  if (src === null) return null;
  let sliced;
  try {
    const file = join(mkdtempSync(join(tmpdir(), 'attested-rounds-pin-')), 'sliced.mjs');
    writeFileSync(file, src);
    sliced = await import(pathToFileURL(file).href);
  } catch {
    return null;
  }
  if (typeof sliced.classifyPath !== 'function' || typeof sliced.attestedRounds !== 'function') return null;

  const tree = git(repo, ['ls-tree', '-r', '--name-only', treeRev]);
  const pop = sliced.attestedRounds(repo, treeRev);
  if (tree === null || pop === null) return null;

  const invisible = tree.split('\n').filter((p) => /round\d+/i.test(p) && sliced.classifyPath(p).source === null);
  const rounds = new Set(invisible.map((p) => Number(/round(\d+)/i.exec(p)[1])));
  const got = {
    paths: invisible.length,
    outside: [...rounds].filter((n) => !pop.filtered.has(n)).sort((a, b) => a - b),
  };
  const want = { paths: pin.invisiblePaths, outside: [...pin.unattestedRounds] };
  return {
    ok: got.paths === want.paths && String(got.outside) === String(want.outside),
    got,
    want,
    route: `whole module@${pin.classifierRev} · tree@${treeRev} · reader expression at HEAD`,
  };
}

/**
 * The source patterns' recall floor **at a rev the caller names**: every round that some path in the
 * tree names and **no** source pattern claims, and which nothing else attests.
 *
 * This is `unit-465srckeys-2026-11-12` leg `T7`'s key, promoted from a one-rev constant to a reader,
 * because the constant's value is rev-dependent and its consumers could not see that. Returns
 * `{ paths, rounds, outside, creditLeak }` — `outside` is the part that matters: rounds the blind
 * spot hides *and nothing else credits*. `null` on refusal; a caller must not read a refusal as an
 * empty set.
 *
 * ## The round key is per **token**, not per path, and that is a cure
 *
 * The first shape of this reader had **two readers of one path with different answers**, which
 * Theseus found (`unit-465s6bounds` §4): `classifyPath`'s `S6` uses a greedy `.*` and so credits the
 * **last** `round\d+` in a path, while this census took `/round(\d+)/i.exec(p)[1]` — the **first**.
 * The harm was not a count error. It was a leak in the one census whose whole job is finding rounds
 * nothing attests: a path claimed for its *last* round hid **every other round it names**, and 28
 * distinct rounds were in that position at HEAD (his `T6c`, reproduced as `R11`).
 *
 * So the key is now every round **token** a path names, minus the one that path's own classification
 * credits — which is a strict widening of the old set, and `creditLeak` is exactly the part the old
 * spelling could not see, so the change is attributable rather than merely different.
 *
 * `paths` keeps its old definition — paths **no source claims** — because that is the quantity
 * `SOURCE_RECALL_FLOOR` pins. The pin is reproduced by `reproduceFloorReading()`, which carries its
 * own reader expression and so does **not** move when this one does; that independence is the
 * design claim, and it is graded (`unit-465routecure` `R13`), not asserted.
 */
export function unattestedRoundsAt(repo, rev) {
  const tree = git(repo, ['ls-tree', '-r', '--name-only', rev]);
  const pop = attestedRounds(repo, rev);
  if (tree === null || pop === null) return null;

  const paths = tree.split('\n').filter(Boolean);
  const invisible = paths.filter((p) => /round\d+/i.test(p) && classifyPath(p).source === null);

  // Every round token any path names, minus the one that path itself credits.
  const rounds = new Set();
  const firstOnly = new Set();
  for (const p of paths) {
    const named = [...p.matchAll(/round(\d+)/gi)].map((m) => Number(m[1]));
    if (named.length === 0) continue;
    const credited = classifyPath(p).round;
    for (const n of named) if (n !== credited) rounds.add(n);
    // What the superseded per-path key would have seen, kept so the widening is attributable.
    if (credited === null) firstOnly.add(named[0]);
  }

  return {
    paths: invisible.length,
    rounds: [...rounds].sort((a, b) => a - b),
    outside: [...rounds].filter((n) => !pop.filtered.has(n)).sort((a, b) => a - b),
    /** Rounds the superseded first-token-of-an-unclaimed-path key could not see. */
    creditLeak: [...rounds].filter((n) => !firstOnly.has(n)).sort((a, b) => a - b),
  };
}

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

  const bySource = { S1: new Set(), S2: new Set(), S3: new Set(), S5: new Set(), S6: new Set() };
  for (const p of tree.split('\n')) {
    const c = classifyPath(p);
    if (c.source !== null) bySource[c.source].add(c.round);
  }
  const dirs = bySource.S1;
  const tests = bySource.S2;
  const otherDocs = bySource.S3;
  const unitRounds = bySource.S5;
  const mailRounds = bySource.S6;

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

  const nonSubject = new Set([...dirs, ...tests, ...otherDocs, ...unitRounds, ...mailRounds]);
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
    mailRounds,
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

  // Coverage, keyed on the SOURCE IDS and not on a count. The previous spelling of this assertion
  // was `size >= 5`, which a sixth source satisfied without being covered by a single case — a
  // count in a coverage assertion has to be edited by the same hand that adds the thing it was
  // supposed to catch, so it catches nothing.
  const covered = new Set(pathCases.map(([, s]) => s));
  must(covered.has(null), 'SOURCE_CASES has no near-miss: a table of positives alone is satisfied by a pattern matching everything');
  for (const id of SOURCE_IDS) must(covered.has(id), `SOURCE_CASES covers no case for source ${id}`);

  // …and the declared id list is checked against what `classifyPath` can actually return, so adding
  // a seventh source without a case is caught. The scan is allowed to UNDER-report: a quoting change
  // makes this comparison fail, which is red, not a silent pass.
  const producible = new Set([...classifyPath.toString().matchAll(/source:\s*'(S\d+)'/g)].map((m) => m[1]));
  const undeclared = [...producible].filter((s) => !SOURCE_IDS.includes(s));
  const unproducible = SOURCE_IDS.filter((s) => !producible.has(s));
  must(undeclared.length === 0, `classifyPath can return ${undeclared} but SOURCE_IDS does not declare it`);
  must(unproducible.length === 0, `SOURCE_IDS declares ${unproducible} but classifyPath cannot return it`);
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

  // The floor's pinned reading must stay unreachable WITHOUT its rev. A future edit that re-adds a
  // bare `unattestedRounds` at the top level re-seeds the exact consumer trap this shape cured, and
  // would do it while every other assertion here stayed green.
  const floorKeys = Object.keys(SOURCE_RECALL_FLOOR);
  must(!floorKeys.includes('unattestedRounds') && !floorKeys.includes('invisiblePaths'),
    `SOURCE_RECALL_FLOOR exposes a rev-free reading again: [${floorKeys}]`);
  must(floorKeys.includes(`at${SOURCE_RECALL_FLOOR.rev}`),
    `SOURCE_RECALL_FLOOR.rev is ${SOURCE_RECALL_FLOOR.rev}, but no \`at${SOURCE_RECALL_FLOOR.rev}\` key holds the reading`);
  // …and it must name the CLASSIFIER it was taken under, not only the tree rev. The quantity counts
  // paths no source claims, so it moves when the source set moves: a reading pinned to a rev alone
  // is still unscoped on the axis this module's own cure travelled.
  // …and it must name the CLASSIFIER rev as a REV. The first spelling of this was `typeof ===
  // 'string'`, which `classifierRev: 'banana'` satisfied (Theseus's `T5`, reproduced as `R8`): a
  // guard on type is not a guard on value. This is a SHAPE guard — an abbreviated hex object name —
  // and it is worth saying what it still does not catch: a well-formed hash that is the wrong
  // commit passes here. The value grade is `reproduceFloorReading(repo)`, which needs a repo and so
  // cannot live in this function; `R13` drives it.
  const pinnedFloor = SOURCE_RECALL_FLOOR[`at${SOURCE_RECALL_FLOOR.rev}`];
  must(/^[0-9a-f]{7,40}$/.test(String(pinnedFloor.classifierRev)),
    `the pinned floor reading's classifierRev is not a rev: ${JSON.stringify(pinnedFloor.classifierRev)}`);
  must(SOURCE_RECALL_FLOOR.reproducibleBy === 'reproduceFloorReading(repo)',
    `the floor does not name a runnable reproduction route: ${JSON.stringify(SOURCE_RECALL_FLOOR.reproducibleBy)}`);
  must(typeof reproduceFloorReading === 'function', 'the named reproduction route does not exist');

  // S6's REJECTED spellings are graded as refusals, not described in prose. For each foil, some path
  // case must exist that the foil claims and `classifyPath` refuses — otherwise "we rejected the
  // looser key" is a sentence no case makes true, and the case that made it true was deletable with
  // everything else green (Theseus's `T4p`). Keyed on the property, not on a filename or a count.
  // FLOOR, before any of the quantifiers below. Every foil check is a `for` over the declared
  // family, so `S6_FOILS = {}` / `S6_FOIL_CHAIN = []` satisfies all four of them vacuously and this
  // function returned `true` with the whole rejection record deleted. Keyed on the two names as
  // LITERALS here, which is what stops the regress: a floor keyed on another exported list is the
  // same defect one level up, and a cardinality floor (`>= 2`) is satisfied by *substituting* the
  // rejected spellings — the one thing this family exists to keep from happening quietly. Names cost
  // the add side nothing (a third foil leaves both present) and are load-bearing on the remove side.
  // Declared limit: this pins the two NAMES, not their languages. A foil kept under its name with a
  // harmless pattern is caught, if at all, by the witness loop below, not here.
  for (const required of ['separatorTolerant', 'boundaryFree']) {
    must(
      Object.prototype.hasOwnProperty.call(S6_FOILS, required) && S6_FOILS[required] instanceof RegExp,
      `S6_FOILS no longer declares ${required} as a RegExp — the rejected spellings are the family's ` +
        `whole point and every check below quantifies over them, so an empty or substituted family ` +
        `passes vacuously. Declared: [${Object.keys(S6_FOILS)}]`
    );
  }
  // The chain must cover the foils, keyed on the key SET and not on a count — a count here would
  // have to be edited by the same hand that adds the foil it was supposed to catch.
  must(
    S6_FOIL_CHAIN.length === new Set(S6_FOIL_CHAIN).size &&
      Object.keys(S6_FOILS).every((n) => S6_FOIL_CHAIN.includes(n)) &&
      S6_FOIL_CHAIN.every((n) => n in S6_FOILS),
    `S6_FOIL_CHAIN [${S6_FOIL_CHAIN}] is not a permutation of S6_FOILS [${Object.keys(S6_FOILS)}]`
  );
  for (let i = 0; i < S6_FOIL_CHAIN.length; i += 1) {
    const name = S6_FOIL_CHAIN[i];
    const foil = S6_FOILS[name];
    const nextName = S6_FOIL_CHAIN[i + 1];
    const next = nextName ? S6_FOILS[nextName] : null;
    // The successor of the last foil is the LIVE key, so the last link's witness is a path the
    // module actually refuses — which is what makes the live boundary, not just the chain, load-bearing.
    const witness = pathCases.find(
      ([p, s]) => s === null && classifyPath(p).source === null && foil.test(p) && (next === null || !next.test(p))
    );
    must(
      witness !== undefined,
      `S6_FOILS.${name} has no witness that ${nextName ? `S6_FOILS.${nextName}` : 'the live key'} refuses. ` +
        'The foils are nested, so a case that merely satisfies this foil is satisfied by the stricter ' +
        "one's witness too and asserts nothing about this link."
    );
  }
  // …and no adjacent pair may CROSS: if the successor claims a case its predecessor refuses, the two
  // keys are incomparable and no ordering of them is a chain. Checked on the languages, over the
  // cases, rather than declared.
  //
  // This check is **dominated wherever the pair is nested**, which is every family this module has
  // had: a nested pair in the wrong order makes "a case this link claims and its successor refuses"
  // unsatisfiable at that link, so the witness loop above throws first and this one never runs.
  // Theseus drove that at length 2 (my `D4`) and again at length 3
  // (`unit-465foilchain-2026-11-13`, arm B) — the variable was never the chain's length, it is
  // whether the misordered pair is nested, so "kept for chains of 3+" was the wrong scope.
  // The state that *can* reach this check is therefore an **incomparable** pair, and he drove both
  // permutations of one (his arm C): both red, which is correct — but the old message said
  // `misordered`, telling the next hand to reorder, when no permutation of two crossing keys is a
  // chain. The predicate was sound and the remedy it prescribed did not exist. Hence the wording
  // below; `/misordered/`, the anchor my committed arm D's `D4` keys on, is deliberately gone, and
  // `unit-465chainfloor`'s arm C records that `D4`'s detector is now blind in the one state that
  // prints here.
  for (let i = 0; i + 1 < S6_FOIL_CHAIN.length; i += 1) {
    const wide = S6_FOILS[S6_FOIL_CHAIN[i]];
    const narrow = S6_FOILS[S6_FOIL_CHAIN[i + 1]];
    const counterexample = pathCases.find(([p]) => narrow.test(p) && !wide.test(p));
    must(counterexample === undefined,
      `S6_FOIL_CHAIN: ${S6_FOIL_CHAIN[i + 1]} and ${S6_FOIL_CHAIN[i]} are incomparable, so they ` +
        `cannot form a chain — ${S6_FOIL_CHAIN[i + 1]} claims ` +
        `${JSON.stringify(counterexample && counterexample[0])} and ${S6_FOIL_CHAIN[i]} does not. ` +
        'Reordering cannot help: in the other order the other key claims something this one refuses. ' +
        'Split them into separate chains or drop one.');
  }
  // …and the live key must not BE either foil. Identity would make every witness above vacuous.
  for (const [name, foil] of Object.entries(S6_FOILS)) {
    must(!classifyPath.toString().includes(String(foil)),
      `classifyPath contains S6_FOILS.${name} verbatim — the rejected spelling is the live one`);
  }

  // The declared recall floor is a floor: neither key reaches any of them. If one ever does, this
  // throws rather than leaving the exported list claiming something false.
  for (const s of ALT_SPELLINGS) {
    must(!DENIAL_RE.test(s) && !LEGACY_DENIAL_RE.test(s),
      `ALT_SPELLINGS claims no key reaches ${JSON.stringify(s)}, but one does`);
  }

  return true;
}
