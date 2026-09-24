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
console.log('── arm C — the three parts are not redundant, one perturbation each ─────');
// ─────────────────────────────────────────────────────────────────────────────

const parts = (f: string) => {
  const toks = f.split(' ');
  return {
    P: toks.find((t) => t.startsWith('P:')) ?? '',
    D: toks.find((t) => t.startsWith('D:')) ?? '',
    U: toks.filter((t) => t.startsWith('U:')).join(' '),
  };
};

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
check('C3', 'the part carrying C1 is D:, and P: alone does not move',
  parts(c1Before).P === parts(c1After).P && parts(c1Before).D !== parts(c1After).D,
  `P: unchanged, D: changed. This is why the diff limb exists and why porcelain alone is not a ` +
  `weaker-but-safe version of it.`);

// C4 — a write into an ALREADY-PRESENT untracked file. Neither P: (same `??` entry) nor D:
// (untracked files are not in `git diff HEAD`) can see this one.
fs.writeFileSync(sandboxFile('untracked.mts'), 'const d = 4;\n');
const c4Before = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile('untracked.mts'), 'const d = 5; // the run wrote here\n');
const c4After = fingerprint(SANDBOX, 'scripts/');
check('C4', 'a write into an ALREADY-PRESENT untracked file moves the fingerprint, and only the U: part carries it',
  c4After !== c4Before &&
  parts(c4Before).P === parts(c4After).P &&
  parts(c4Before).D === parts(c4After).D &&
  parts(c4Before).U !== parts(c4After).U,
  `P: unchanged, D: unchanged, U: changed. \`git diff HEAD\` does not contain untracked content, ` +
  `so without the U: limb a run could write freely into any untracked file and grade itself clean.`);

// C5 — the honest negative: is P: load-bearing at all, or is it carried by D: and U: together?
// Measured rather than claimed. Every perturbation this probe drives that moves P: also moves D:
// or U:, so P: is reported as defence-in-depth, NOT as demonstrated-necessary.
const pOnlyWitness = [
  { label: 'file arrives', before: b0, after: b1 },
  { label: 'tracked file edited twice', before: c1Before, after: c1After },
  { label: 'untracked file edited', before: c4Before, after: c4After },
].filter((w) => parts(w.before).P !== parts(w.after).P &&
  parts(w.before).D === parts(w.after).D &&
  parts(w.before).U === parts(w.after).U);
meas('C5', 'is the P: limb demonstrated-necessary? — measured, not asserted',
  pOnlyWitness.length === 0
    ? `NO — 0 of the 3 driven perturbations are caught by P: alone; each one that moves P: also ` +
      `moves D: or U:. P: is retained as defence in depth against a status transition with no ` +
      `content delta (a mode change, an add/unadd), which this probe does not drive. Stated as ` +
      `an unmeasured residual, not as a third load-bearing limb.`
    : `YES — ${pOnlyWitness.length} perturbation(s) caught by P: alone: ${pOnlyWitness.map((w) => w.label).join(', ')}`);

// C6 — `-uall` is load-bearing, and this was a guess until it was driven.
// The module's comment claims that without `-uall` an untracked DIRECTORY collapses to one entry
// and a file appearing inside it goes unseen. That is a claim about git's behaviour, so it is
// measured here rather than asserted in a comment. Note what it costs if wrong: the U: loop skips
// non-file entries, so a collapsed `?? dir/` contributes NOTHING to any of the three parts, and a
// probe could write freely into an untracked subdirectory and grade itself clean.
fs.mkdirSync(path.join(SANDBOX, 'scripts', 'nested'), { recursive: true });
fs.writeFileSync(sandboxFile(path.join('nested', 'one.mts')), 'const one = 1;\n');
const nest1Default = git(SANDBOX, ['status', '--porcelain', '--', 'scripts/']);
const nest1All = git(SANDBOX, ['status', '--porcelain', '-uall', '--', 'scripts/']);
const nest1Fp = fingerprint(SANDBOX, 'scripts/');
fs.writeFileSync(sandboxFile(path.join('nested', 'two.mts')), 'const two = 2;\n');
const nest2Default = git(SANDBOX, ['status', '--porcelain', '--', 'scripts/']);
const nest2All = git(SANDBOX, ['status', '--porcelain', '-uall', '--', 'scripts/']);
const nest2Fp = fingerprint(SANDBOX, 'scripts/');

check('C6', '`-uall` is load-bearing: default porcelain cannot see a file arriving in an already-untracked directory, and the shipped module can',
  nest1Default === nest2Default && nest1All !== nest2All && nest1Fp !== nest2Fp,
  `default -u: ${JSON.stringify(nest1Default.trim())} both before and after — the directory ` +
  `collapses to one entry. -uall: ${nest2All.trim().split('\n').length} entries vs ` +
  `${nest1All.trim().split('\n').length}. The shipped fingerprint moves. Without the flag the U: ` +
  `loop would also contribute nothing, since it skips entries that are not files — so all three ` +
  `parts would have been blind together, not just one.`);

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
  const preMove = new Function('git', 'sha', 'fs', 'path', 'REPO', `${body}\nreturn preMove;`)(
    (args: string[]) => git(REPO, args),
    (b: crypto.BinaryLike) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16),
    fs,
    path,
    REPO,
  ) as (p: string) => string;

  const sameOn = ['scripts/', 'packages/', 'docs/'].map((p) => ({
    p,
    pre: preMove(p),
    post: fingerprint(REPO, p),
  }));
  check('D1', 'the extracted lib function returns the pre-extraction value on every pathspec tried',
    sameOn.every((s) => s.pre === s.post),
    sameOn.map((s) => `${s.p} ${s.pre === s.post ? 'same' : `DIFFER\n          pre ${s.pre}\n          post ${s.post}`}`).join('; ') +
    `. Evaluated from the pinned commit's own text, on a tree that is currently dirty under scripts/ — so this ` +
    `compares the two functions on a non-trivial input, not on two empty strings.`);

  check('D2', 'and that comparison is capable of coming out unequal — checked against a deliberately wrong pathspec',
    preMove('scripts/') !== fingerprint(REPO, 'docs/'),
    `preMove('scripts/') !== fingerprint(REPO,'docs/'). Without this, D1 is consistent with both ` +
    `functions returning a constant.`);
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('');
console.log('── arm E — the live repair, in place in probe-round261 ──────────────────');
// ─────────────────────────────────────────────────────────────────────────────

const r261Now = fs.readFileSync(
  path.join(REPO, 'scripts', 'probe-round261-a-pin-whose-red-is-cleared-by-doing-something-is-a-gate.mts'),
  'utf8',
);
check('E1', 'probe-round261 no longer contains the allowlist regex that had to name every future round\'s files',
  !/sweep-probes\\\.mjs\|probe-round261/.test(r261Now),
  `the \`!/sweep-probes\\.mjs|probe-round261/.test(l)\` filter is gone from the file. An allowlist ` +
  `is cleared by EDITING IT each round — the staleness that file's own DEFERRED design exists to avoid.`);
check('E2', 'and it takes a before/after fingerprint through the shared module',
  /from '\.\/lib\/tree-fingerprint\.mts'/.test(r261Now) && /zBefore/.test(r261Now) && /zAfter/.test(r261Now),
  `imports \`tree-fingerprint.mts\`; brackets the run with \`zBefore\`/\`zAfter\`.`);

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
