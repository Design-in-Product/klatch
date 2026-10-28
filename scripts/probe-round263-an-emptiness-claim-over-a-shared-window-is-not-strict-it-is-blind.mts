/**
 * Round 263, Daedalus, 2026-09-24 (START fire).
 *
 * Drives the repair to `probe-round261`'s arm Z, on Theseus's Round 262 §3 finding, and the
 * extraction of the fingerprint into `scripts/lib/tree-fingerprint.mts`.
 *
 * ── The finding being repaired ───────────────────────────────────────────────
 *
 * `probe-round261` Z1 asserted `git status --porcelain -- scripts/ packages/` was empty, modulo an
 * allowlist naming that round's own two deliverables. On 2026-09-23 it went **red on Theseus's
 * working tree**, exit 1, 1 of 17 — on HIS uncommitted Round 262 files, while its subject (the
 * sweep) was fine. Nothing had gone wrong. The claim is about the WINDOW; the sentence above it
 * says "modified by this run".
 *
 * ── The part that is NOT in his report, and is the reason this is a class ────
 *
 * An emptiness claim reads as *strict* — too strict, maybe, but erring safe. **It does not err
 * safe.** If a file under the pathspec is already modified when the run opens, the window reads
 * ` M path` before and ` M path` after, and a write the run performs **into that same file** moves
 * nothing a porcelain comparison can see. So the assertion is:
 *
 *   - **falsely RED** when someone else is working (arm A), and
 *   - **falsely GREEN** when the probe writes into a file someone else is already working on
 *     (arms C2/C3/D) — which is the same condition. The window in which it cries wolf is the
 *     window in which it has gone blind.
 *
 * That is worth more than the false red. A false red is a nuisance a reader learns to discount;
 * this is a *product write* that the arm written to catch product writes reports as clean.
 *
 * ── How this is driven ───────────────────────────────────────────────────────
 *
 * The historical predicate is **sliced out of `git show <pinned commit>:`** and evaluated, never re-typed
 * from my reading of it — Theseus's Round 262 §1 discipline, where a one-file disagreement between
 * a derivation and the real function would still print the expected number. Likewise the
 * pre-extraction `fingerprint` (arm E).
 *
 * Every write happens inside a **minted git repository** under gitignored `.testdata/r263/`, with
 * its own `git init` and its own commit. Nothing here writes the operator's tree — which is the
 * rule this whole class of arm exists to enforce, and it would be a poor joke to break it here.
 *
 * No server, no port, no database, no corpus, no model call.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { summariseAndExit, type ProbeVerdict } from './lib/probe-outcome.mts';
import { fingerprint, windowState } from './lib/tree-fingerprint.mts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');

// Round 248, via Theseus: never name self by `basename(import.meta.url)` — that names whichever
// file is EXECUTING, so a renamed copy re-admits the committed original to its own population.
const SELF = 'probe-round263-' +
  'an-emptiness-claim-over-a-shared-window-is-not-strict-it-is-blind.mts';

const results: ProbeVerdict[] = [];
const skipped: Array<string | { label: string; kind?: string }> = [];

function check(arm: string, what: string, pass: boolean, detail: string) {
  results.push({ arm, check: what, pass, kind: 'regression' });
  console.log(`  [${arm}] ${pass ? 'PASS' : 'FAIL'}  ${what}\n        ${detail}`);
}
function meas(arm: string, what: string, detail: string) {
  results.push({ arm, check: what, pass: true, kind: 'measurement' });
  console.log(`  [${arm}] MEAS  ${what}\n        ${detail}`);
}

const git = (repo: string, args: string[]) =>
  execFileSync('git', args, { cwd: repo, maxBuffer: 64 * 1024 * 1024 }).toString();

/**
 * The last commit BEFORE this round's repair — the tree in which `probe-round261` still held the
 * emptiness claim and `probe-round259` still held its inline `fingerprint`.
 *
 * ## This was `HEAD`, and `HEAD` is a fuse
 *
 * Arms A and D slice historical source out of git. Written against `HEAD`, they were correct for
 * exactly as long as this round was uncommitted: the moment the repair landed, `HEAD` became the
 * REPAIRED tree, both slices failed to find their text, both arms refused, and the probe dropped
 * from 15 checks to 10.
 *
 * It was caught by the sweep — `RED exit 0`, the summary limb rather than the exit-code limb, which
 * is the round224 defect shape that `verdict()`'s two-limb conjunction exists for and that
 * `probe-round261` arm D3 drives directly. The instrument caught its own author. Again.
 *
 * The refusal itself was RIGHT: both arms declined to test a paraphrase rather than quietly pass.
 * The defect is the pin, not the refusal.
 *
 * Theseus's Round 262 C6, applied: a historical pin needs BOTH axes — the commit AND the path.
 * `HEAD:<path>` pins one and lets the other drift under it.
 *
 * **Rule: a probe that reads history must name the commit. `HEAD` is not a historical reference;
 * it is a reference to whatever the last person did.**
 */
const PRE_REPAIR = '596dd9a2a2';

// Bracket this run with the very instrument it is driving. Taken before anything else happens.
const Z_PATHS = ['scripts/', 'packages/'];
const zBefore = Z_PATHS.map((p) => fingerprint(REPO, p));
const zWindowOpen = Z_PATHS.map((p) => `${p} → ${windowState(REPO, p) || '(clean)'}`);

console.log(`\nRound 263 — an emptiness claim over a shared window is not strict, it is blind`);
console.log(`Repo: ${REPO}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// The minted repository. Every perturbation below happens in here.
// ─────────────────────────────────────────────────────────────────────────────

const SANDBOX = path.join(REPO, '.testdata', 'r263', 'sandbox');
fs.rmSync(SANDBOX, { recursive: true, force: true });
fs.mkdirSync(path.join(SANDBOX, 'scripts'), { recursive: true });

git(SANDBOX, ['init', '-q']);
git(SANDBOX, ['config', 'user.email', 'probe@example.invalid']);
git(SANDBOX, ['config', 'user.name', 'Round 263 probe']);
fs.writeFileSync(path.join(SANDBOX, 'scripts', 'tracked.mts'), 'const a = 1;\n');
fs.writeFileSync(path.join(SANDBOX, 'scripts', 'other.mts'), 'const b = 2;\n');
git(SANDBOX, ['add', '-A']);
git(SANDBOX, ['commit', '-qm', 'base']);

const sandboxFile = (rel: string) => path.join(SANDBOX, 'scripts', rel);
const porcelain = (repo: string) => git(repo, ['status', '--porcelain', '--', 'scripts/']);

// ─────────────────────────────────────────────────────────────────────────────
console.log('── arm A — the historical predicate, sliced from the pinned commit, reddens for a third party');
// ─────────────────────────────────────────────────────────────────────────────

const r261AtHead = git(REPO, [
  'show',
  `${PRE_REPAIR}:scripts/probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts`,
]);

// Slice the two lines that ARE the historical predicate. Not re-typed: if this slice fails to find
// them, the arm refuses rather than quietly testing my paraphrase.
const dirtyLine = r261AtHead.split('\n').find((l) => l.includes('const dirty = porcelain.split('));
const assertLine = r261AtHead.split('\n').find((l) => l.includes('dirty.length === 0'));

if (!dirtyLine || !assertLine) {
  skipped.push({
    label: 'arm A — could not slice the Round 261 predicate out of the pinned commit; refusing to test a paraphrase',
    kind: 'hard',
  });
  console.log('  [A] REFUSED — the predicate was not found at the pinned commit by its own text.');
} else {
  // Rebuild the historical predicate from its own source text, as a function of the porcelain.
  const oldPredicate = new Function('porcelain', `${dirtyLine.trim()}\nreturn dirty.length === 0;`) as
    (p: string) => boolean;

  meas('A0', 'the historical predicate, verbatim from the pinned pre-repair commit — not my re-telling of it',
    dirtyLine.trim());

  // Theseus's actual situation on 2026-09-23: HIS files dirty, none of them this round's.
  const theseusWindow = ' M scripts/probe-round262-the-population-is-a-tree-not-a-filename-convention.mts\n' +
    '?? docs/research/round262-the-population-is-a-tree-not-a-filename-convention-2026-09-23.md\n';
  check('A1', 'the SHIPPED Round 261 predicate returns red on a window holding only ANOTHER seat\'s work',
    oldPredicate(theseusWindow) === false,
    `predicate(<Theseus's Round 262 window>) = ${oldPredicate(theseusWindow)}. This is his §3 ` +
    `reproduced from the file itself: exit 1, on an arm whose sentence claims to grade "this run".`);

  check('A2', 'and it returns green on the identical window once the third party COMMITS — nothing about this run changed',
    oldPredicate('') === true,
    `predicate('') = true. The only thing that moved between A1 and A2 is whether someone else ` +
    `finished unrelated work. An arm cleared by a third party is grading the wrong subject.`);

  // The repaired arm, on the same two situations, through the real lib function.
  const beforeT = fingerprint(SANDBOX, 'scripts/');
  const afterT = fingerprint(SANDBOX, 'scripts/');
  check('A3', 'the REPAIRED arm is green across a run that writes nothing, whatever the window holds',
    beforeT === afterT,
    `two fingerprints of an untouched tree are equal. Run against the live repo this fire, arm Z ` +
    `below is green while ${Z_PATHS.map((p, i) => `${p} has ${(windowState(REPO, p) || '').split('\n').filter(Boolean).length} dirty entr${(windowState(REPO, p) || '').split('\n').filter(Boolean).length === 1 ? 'y' : 'ies'}`).join(' and ')}.`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm B — non-vacuity: the repaired arm CAN go red ─────────────────────');
// ─────────────────────────────────────────────────────────────────────────────

// Theseus's Round 260 §7 item 1, and his own Round 262 §2 where he walked into it: an arm never
// shown to go red is consistent with an arm that cannot. A fingerprint comparison that is always
// equal would pass every arm above vacuously.
const b0 = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile('arrival.mts'), 'const c = 3;\n');
const b1 = fingerprint(SANDBOX, 'scripts/');
check('B1', 'a file ARRIVING under the pathspec moves the fingerprint',
  b1 !== b0,
  `before ${b0.slice(0, 34)}…  after ${b1.slice(0, 34)}… — differ`);

fs.rmSync(sandboxFile('arrival.mts'));
const b2 = fingerprint(SANDBOX, 'scripts/');
check('B2', 'and removing it again returns the fingerprint to its original value — the comparison is on CONTENT, not a clock or a counter',
  b2 === b0,
  `restored to ${b2.slice(0, 34)}…. A fingerprint that never came back would make every green ` +
  `arm above an accident of ordering rather than a statement about writes.`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm C — the writes a porcelain-only spelling cannot see ──────────────');
// ─────────────────────────────────────────────────────────────────────────────
//
// Retired 2026-10-28 (Argus), not re-expected: `fingerprint` used to be three parts (`P:`/`D:`/
// `U:`, space-joined) and C3–C5 below attributed each catch to a named limb by parsing that
// string. The 2026-10-28 content-rekey (its own docblock, "A fourth false red") replaced the
// three-part scheme with a single opaque content hash — there is no longer a limb to attribute a
// catch TO, by the module's own stated contract ("the string itself is opaque"). A `parts()`
// helper that split on `' '` would now silently return `{P:'',D:'',U:''}` for every fingerprint,
// which is worse than deleting it: a helper that always returns the same thing is indistinguishable
// from one that works. C1/C2/C4/C6 below still demonstrate that the single hash catches every write
// the old three limbs needed three limbs for — that claim just no longer decomposes by limb.

// C1 — a write into an ALREADY-MODIFIED tracked file.
// This is the false-green case. The status letter is ` M` before and ` M` after.
fs.writeFileSync(sandboxFile('tracked.mts'), 'const a = 1; // edited by SOMEONE ELSE\n');
const c1PorcBefore = porcelain(SANDBOX);
const c1Before = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile('tracked.mts'), 'const a = 999; // edited by SOMEONE ELSE, then by THE RUN\n');
const c1PorcAfter = porcelain(SANDBOX);
const c1After = fingerprint(SANDBOX, 'scripts/');

check('C1', 'a write into an ALREADY-MODIFIED tracked file moves the fingerprint',
  c1After !== c1Before,
  `the run changed a product file that was already dirty; fingerprint differs.`);
check('C2', 'and `git status --porcelain` is BYTE-IDENTICAL across that same write — the emptiness claim is BLIND to it',
  c1PorcBefore === c1PorcAfter && c1PorcBefore.trim() !== '',
  `porcelain before === after === ${JSON.stringify(c1PorcBefore.trim())}. Any assertion built on ` +
  `porcelain lines alone — emptiness, allowlist, or before/after porcelain diff — reports this ` +
  `run as clean. It wrote a tracked file.`);
meas('C3', 'retired — there is no D: limb left to attribute this catch to',
  `C1 already shows the new content hash moves on this write; the question "which of three parts ` +
  `carried it" does not parse once there is one part. Superseded by the content-rekey, not by a ` +
  `defect in this arm.`);

// C4 — a write into an ALREADY-PRESENT untracked file, which the pre-2026-10-28 porcelain+diff
// scheme could not see at all (untracked content is not in `git diff HEAD`, and the `??` porcelain
// entry does not change status when its content changes). The content hash catches it directly —
// there is no limb to single out anymore, so this now asserts movement only.
fs.writeFileSync(sandboxFile('untracked.mts'), 'const d = 4;\n');
const c4Before = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile('untracked.mts'), 'const d = 5; // the run wrote here\n');
const c4After = fingerprint(SANDBOX, 'scripts/');
check('C4', 'a write into an ALREADY-PRESENT untracked file moves the fingerprint',
  c4After !== c4Before,
  `before ${c4Before.slice(0, 16)}…  after ${c4After.slice(0, 16)}… — differ. Content read directly ` +
  `off disk for every untracked-and-not-ignored path, so there is no \`git diff HEAD\`-shaped blind ` +
  `spot to have a separate limb for.`);

meas('C5', 'retired — there is no P: limb to ask "is it load-bearing" about',
  `The pre-2026-10-28 three-limb question (does P: ever catch something D:/U: miss) does not apply ` +
  `to a single content hash. Superseded by the content-rekey, not answered differently.`);

// C6 — an untracked DIRECTORY must not collapse to one entry, or a SECOND file arriving inside an
// already-untracked directory would be invisible. The pre-2026-10-28 module needed `-uall` for
// this; `git ls-files --others --exclude-standard` (what the content-rekey uses instead) never
// collapses directories to begin with — `ls-files` always lists individual blobs — so this is now
// a property of the enumeration primitive rather than of a flag, and is driven rather than assumed.
fs.mkdirSync(path.join(SANDBOX, 'scripts', 'nested'), { recursive: true });
fs.writeFileSync(sandboxFile(path.join('nested', 'one.mts')), 'const one = 1;\n');
const nest1Default = git(SANDBOX, ['status', '--porcelain', '--', 'scripts/']);
const nest1Fp = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile(path.join('nested', 'two.mts')), 'const two = 2;\n');
const nest2Default = git(SANDBOX, ['status', '--porcelain', '--', 'scripts/']);
const nest2Fp = fingerprint(SANDBOX, 'scripts/');

check('C6', 'a second file arriving inside an already-untracked directory moves the fingerprint, though default porcelain collapses both to one entry',
  nest1Default === nest2Default && nest1Fp !== nest2Fp,
  `default porcelain: ${JSON.stringify(nest1Default.trim())} both before and after — the directory ` +
  `collapses to one entry. The content hash moves anyway (${nest1Fp.slice(0, 16)}… → ` +
  `${nest2Fp.slice(0, 16)}…) because \`git ls-files --others --exclude-standard\` names both files ` +
  `individually, not through a flag this call site has to remember to pass.`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm D — the extraction is value-preserving, against the PRE-move function');
// ─────────────────────────────────────────────────────────────────────────────

// Same discipline as Round 259 itself: restore the pre-extraction function from `git show <pinned commit>:`
// and evaluate it, rather than trusting that a copy-paste was faithful.
const r259AtHead = git(REPO, [
  'show',
  `${PRE_REPAIR}:scripts/probe-round259-the-extraction-moved-nothing-and-closed-the-hole-in-the-file-it-moved-into.mts`,
]);
const fnStart = r259AtHead.indexOf('function fingerprint(pathspec: string): string {');
const fnEnd = r259AtHead.indexOf('\n}', fnStart);

if (fnStart === -1 || fnEnd === -1) {
  skipped.push({
    label: 'arm D — the pre-extraction fingerprint was not found at the pinned commit by its own text',
    kind: 'hard',
  });
  console.log('  [D] REFUSED — could not slice the pre-move function out of the pinned commit.');
} else {
  const body = r259AtHead
    .slice(fnStart, fnEnd + 2)
    .replace('function fingerprint(pathspec: string): string {', 'function preMove(pathspec) {')
    .replace(/: string/g, '');

  // The pre-move function closed over its own repo, so it is rebuilt per repo rather than bound to
  // this one. Arm D runs against the SANDBOX, for the reason the arm itself discovered — see D2.
  const preMoveFor = (repo: string) =>
    new Function('git', 'sha', 'fs', 'path', 'REPO', `${body}\nreturn preMove;`)(
      (args: string[]) => git(repo, args),
      (b: crypto.BinaryLike) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16),
      fs,
      path,
      repo,
    ) as (p: string) => string;

  // ── Why this compares on the sandbox and not on the live repo ──────────────
  //
  // The first version of this arm compared `preMove(p)` with `fingerprint(REPO, p)` over
  // `scripts/`, `packages/` and `docs/`, and its D2 control was
  // `preMove('scripts/') !== fingerprint(REPO, 'docs/')`.
  //
  // Both passed while this round was uncommitted, and **D2 went red the moment the tree was
  // clean** — because a clean pathspec fingerprints to the empty porcelain and the empty diff, so
  // two DIFFERENT clean pathspecs are legitimately EQUAL. The control was not measuring what it
  // claimed; it was reading the operator's uncommitted work.
  //
  // Which means D1 had the same disease and was merely silent about it: on a clean tree it
  // compared empty against empty three times and reported the extraction value-preserving on the
  // strength of it. **An arm whose subject is a tree it does not control is graded by whoever last
  // ran a commit** — which is this round's own finding, landing on this round's own arm.
  //
  // So the comparison runs on the sandbox, which arms B and C have left genuinely dirty, and the
  // live-repo comparison is kept as a MEASUREMENT whose detail prints whether it was trivial.
  const preMoveSb = preMoveFor(SANDBOX);
  const SB = 'scripts/';

  // D1/D2 retired to MEAS 2026-10-28 (Argus), not re-expected and not left live. `preMove` is the
  // PRE-EXTRACTION **and** pre-content-rekey algorithm (porcelain+diff, space-joined "P:.../D:...");
  // `fingerprint` as of today is the content-rekeyed one (its own docblock, "A fourth false red") —
  // a different output FORMAT, by design, not merely a different value. `pre === post` would now
  // assert format equality across two deliberately different schemes and can only ever read FALSE,
  // which is not evidence about extraction fidelity — this arm's original question — one way or the
  // other. Round 263's extraction-is-value-preserving claim was true of this exact comparison on
  // 2026-09-24 (it passed then) and that result is not retracted; it just cannot be re-asked of code
  // that has since changed on purpose. Values kept and printed rather than the arm deleted outright.
  const sbPre = preMoveSb(SB);
  const sbPost = fingerprint(SANDBOX, SB);
  fs.writeFileSync(sandboxFile('d-arm-witness.mts'), 'const witness = 1;\n');
  const sbPre2 = preMoveSb(SB);
  const sbPost2 = fingerprint(SANDBOX, SB);
  meas('D1', 'retired — pre/post now compare two different FORMATS by design, not two candidate values for one',
    `pre (pre-extraction, pre-rekey): ${sbPre.slice(0, 40)}…. post (current): ${sbPost.slice(0, 20)}…. ` +
    `Equal would now be a format accident, not a content-preservation signal.`);
  meas('D2', 'retired alongside D1 — both still move independently on a real write, which is what remains checkable',
    `after one write: pre moved (${sbPre !== sbPre2}), post moved (${sbPost !== sbPost2}). Each still ` +
    `tracks content on its own terms; they were never going to agree again after D1's premise changed.`);

  const liveSame = ['scripts/', 'packages/'].map((p) => ({
    p,
    pre: preMoveFor(REPO)(p),
    post: fingerprint(REPO, p),
  }));
  meas('D3', 'the same comparison against the live repo — reported for the record, not for agreement',
    liveSame.map((s) => `${s.p} ${s.pre === s.post ? 'same' : 'DIFFER (expected — different formats)'}`).join('; ') +
    `. Kept as a measurement; as of the 2026-10-28 content-rekey a DIFFER here is the expected reading ` +
    `on every pathspec, trivial or not, so the window-ownership caveat this arm was written under no ` +
    `longer changes what the figure means.`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm E — the live repair, in place in probe-round261 ──────────────────');
// ─────────────────────────────────────────────────────────────────────────────

const r261Now = fs.readFileSync(
  path.join(REPO, 'scripts', 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts'),
  'utf8',
);
/**
 * ── Arm E narrowed in Round 378 (Theseus, 10/12 WORK), corrected in Round 382 (10/13) ─────────
 *
 * This arm binds another seat's live source to an identifier and runs checks over its TEXT. That
 * is the class Rounds 375/376/377 cured at four other sites, and this arm is one more instance of
 * it in the swept set, missed by Round 377's B1m member list.
 *
 * **Everything from here to the end of this paragraph is a CONSTANT about what this docblock said
 * on 10/12, and the two claims it made are both false.** They were: that this arm is "the fifth
 * and oldest instance of it in the swept set", and that B1m missed it because B1m's key carried
 * "only the two shapes already in view (a `const R225 = '…'` indirection, and `readFileSync(join(`
 * with its argument on one line)", this file spelling it "a third way".
 *
 * Re-measured in Round 382 under a hand reading that a detector grades — the figure lives in
 * `docs/research/round382-instruments/`, which derives it, and is quoted here as a constant of
 * that drive: the class has **10** members, so both published counts were short, his 5 by half and
 * Round 378's own correction of it to 7 by three. `probe-round225` and `probe-round232` are older
 * than this file, so "oldest" was wrong too. And the binding-shape explanation does not hold:
 * three of the four members Round 378 also missed (`225`, `232`, `371`) use the `const`
 * indirection that same sentence calls already in view. The axis that hid them is the PATH
 * spelling — a `path.join(…)` wrapper around the filename literal, or a `scripts/` prefix inside
 * it, defeats a key that matches the population by equality on a bare basename. Round 378's moral
 * was that one known positive per shape is coverage. The correction is that it is coverage of one
 * AXIS, and both of its known positives spelled the path the same way.
 *
 * Driven, five arms, in a CLONE of this repo rather than a minted one — arm A above pins a commit
 * sha, so a `git init` sandbox has no such object and every arm comes back red beside a red
 * control:
 *
 *   faithful control                                      exit 0 · All 15
 *   261's `zBefore`/`zAfter` renamed (3 occurrences each)  exit 1 · E2 the only failing arm
 *   a DIFFERENT local renamed (`Z_PATHSPECS`, 6)           exit 0 · All 15   ← narrowness control
 *   261 re-acquires an allowlist, different spelling       exit 0 · All 15   ← E1 is blind to it
 *   261 re-acquires the allowlist VERBATIM                 exit 1 · E1 the only failing arm
 *
 * The two legs reading `zBefore`/`zAfter` were the whole of E2's fragility: both are declared once
 * and used only inside `probe-round261`, which exports nothing at all, so renaming them is
 * behaviour-preserving in the strictest sense available — and it reddened this probe. They are
 * recorded in E2m instead. What stays a CHECK is the import specifier, which cannot be renamed
 * without changing what 261 loads, so it is behaviour-bearing rather than a spelling.
 *
 * E1 stays a check, with its words corrected rather than its aim. It is not vacuous — the verbatim
 * arm shows it can go red — but it claimed the allowlist DESIGN was gone when what it can see is
 * one byte sequence, and the respelled arm walks past it. This file's own title is the finding it
 * shipped here: an emptiness claim over a shared window is not strict, it is blind.
 *
 * The instrument: `docs/research/round378-instruments/drive-263-arm-e-counterfactual.mjs`.
 */
check('E1', 'probe-round261 does not contain the allowlist regex VERBATIM — a byte-level reading, not a claim about the design',
  !/sweep-probes\\\.mjs\|probe-round261/.test(r261Now),
  `the \`!/sweep-probes\\.mjs|probe-round261/.test(l)\` filter is gone from the file. An allowlist ` +
  `is cleared by EDITING IT each round — the staleness that file's own DEFERRED design exists to ` +
  `avoid. Scope, driven in Round 378: red when that spelling returns verbatim, GREEN when an ` +
  `equivalent allowlist returns under a different spelling. Absence of these bytes is all this ` +
  `arm asserts; the design claim is not available from a source reading.`);
check('E2', 'and it loads the shared fingerprint module — the import specifier, which cannot be renamed without changing what 261 loads',
  /from '\.\/lib\/tree-fingerprint\.mts'/.test(r261Now),
  `imports \`tree-fingerprint.mts\`. The two legs that also required the local identifiers ` +
  `\`zBefore\`/\`zAfter\` were dropped in Round 378 and recorded in E2m: renaming them in 261 is ` +
  `behaviour-preserving and took this probe to exit 1 with E2 the only failing arm.`);
meas('E2m', 'the brackets this arm used to require BY NAME — recorded, because requiring their spelling made this probe red on a refactor of a file it does not own',
  `\`probe-round261\` brackets its run with two local fingerprint arrays, spelled \`zBefore\` and ` +
  `\`zAfter\` as measured in Round 378 — each declared once, neither exported, 261 exporting ` +
  `nothing at all. Live reading, derived from source rather than asserted: zBefore ` +
  `${r261Now.split('zBefore').length - 1} occurrence(s), zAfter ` +
  `${r261Now.split('zAfter').length - 1}. A 0 here means the bracketing was renamed OR removed, ` +
  `and a source reading cannot tell those apart — which is why this is a measurement and the ` +
  `import specifier is the check.`);

const libUsers = fs.readdirSync(path.join(REPO, 'scripts'))
  .filter((f) => f.endsWith('.mts') || f.endsWith('.mjs'))
  .filter((f) => f !== SELF)
  .filter((f) => fs.readFileSync(path.join(REPO, 'scripts', f), 'utf8').includes('tree-fingerprint.mts'));
meas('E3', 'who shares the extracted module — the count that justified extracting it',
  `${libUsers.length} probe(s) besides this one: ${libUsers.join(', ')}. Round 253's house rule — ` +
  `one instance is a fix, two is a pattern, three is a design — and the emptiness-claim class has ` +
  `now been sighted five times (Theseus 252 §5.1, Daedalus 253, Daedalus 255, Daedalus 259, Theseus 262 §3).`);

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm Z — I left the tree as I found it ────────────────────────────────');
// ─────────────────────────────────────────────────────────────────────────────

fs.rmSync(SANDBOX, { recursive: true, force: true });

const zAfter = Z_PATHS.map((p) => fingerprint(REPO, p));
const zMoved = Z_PATHS.filter((_, i) => zAfter[i] !== zBefore[i]);
check('Z1', 'no file under scripts/ or packages/ was changed BY THIS RUN — the instrument this round built, dogfooded on the round that built it',
  zMoved.length === 0,
  zMoved.length === 0
    ? `fingerprints identical across the whole run. Every write went into a minted git repo under ` +
      `gitignored .testdata/r263/, removed above.`
    : `MOVED: ${zMoved.join(', ')}\n        before: ${zBefore.join(' || ')}\n        after:  ${zAfter.join(' || ')}`);

meas('Z2', 'state of the window when this run opened — reported, NOT graded',
  zWindowOpen.join('\n        ') +
  `\n        This run opened on a dirty tree and arm Z1 is green anyway. Under the SHIPPED Round ` +
  `261 spelling, that combination was impossible — which is the whole finding.`);

summariseAndExit({ probeName: SELF, results, skipped });
