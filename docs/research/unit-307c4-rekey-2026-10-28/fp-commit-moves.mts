/**
 * `scripts/lib/tree-fingerprint.mts`'s bracket is NOT immune to a COMMIT landing during the run —
 * and the module's own design note does not cover that case.
 *
 * Round 467 (Daedalus, 2026-10-28). Found by its consequence, not by reading: sweep 3 of this fire
 * reported `probe-round264` RED at `1 of 14`, and driving that probe standalone immediately
 * afterwards reported `All 14 regression checks passed`. The variable between the two was that I had
 * run `git add` + `git commit` while the sweep was driving — the incremental-push discipline this
 * project requires of a fire.
 *
 * The module's docblock makes a specific, careful argument: an EMPTINESS claim over
 * `git status --porcelain` is about the WINDOW and reds falsely when another seat has work in
 * flight, so the remedy is to BRACKET the run — fingerprint at open, fingerprint at close, compare —
 * because that "grades **what the run did**, not **what the window contained**, so a third party's
 * in-flight work is invisible to it."
 *
 * That holds for a third party's *uncommitted* work. It does not hold for a COMMIT, because two of
 * the fingerprint's three components are keyed on `HEAD` and the index rather than on file content:
 *
 *     P: sha of `git status --porcelain -z -uall -- <pathspec>`
 *     D: sha of `git diff HEAD -- <pathspec>`
 *
 * Commit a dirty tracked file under the pathspec and **no byte of the working tree changes**, yet
 * `P:` loses its ` M ` entry and `D:` goes empty. Any probe bracketing with this module reds, and its
 * detail line says "this run changed nothing under scripts/" — the exact opposite of what happened.
 *
 * Driven here in a SCRATCH repo rather than in this worktree, because the counterfactual is a commit
 * and nothing should drive a commit into a tree another seat may be reading.
 *
 * Legs:
 *   F0  the control: no commit, no content change → the fingerprint does NOT move. Without this the
 *       whole cell is "a fingerprint moved", which proves nothing.
 *   F1  THE FINDING: commit the dirty file, assert the file's bytes are identical across the
 *       bracket, and assert the fingerprint MOVED anyway.
 *   F2  which component moved, named — so a reader is sent to a line rather than to a verdict.
 *   F3  the NEGATIVE control, and it refuted my first reason for this cell. I predicted that a commit
 *       touching only a path OUTSIDE the pathspec would also move the fingerprint, "since
 *       `git diff HEAD` is re-based on the new HEAD". Driven, that is false and F3 reddened on it
 *       (`drive11`, kept): both `git status --porcelain -- <pathspec>` and `git diff HEAD --
 *       <pathspec>` are PATH-FILTERED, so a `docs/`-only commit leaves `scripts/`'s fingerprint
 *       byte-identical. Re-aimed rather than loosened — the leg now asserts the negative, which is
 *       what makes the finding precise instead of merely alarming: the hazard is not "a commit
 *       happened", it is "a commit included a path inside the bracketed pathspec". My own
 *       `6190a0dd` did exactly that (`scripts/sweep-probes.mjs`, `scripts/probe-round307-….mts`),
 *       which is why `probe-round264` reddened and why a `docs/`-only commit mid-sweep is safe.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../../../scripts/lib/tree-fingerprint.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const SCRATCH = join(REPO, '.testdata', 'r467-fp');

const results: { id: string; ok: boolean }[] = [];
const check = (id: string, claim: string, ok: boolean, detail: string): void => {
  results.push({ id, ok });
  console.log(`  [${id}] ${ok ? 'PASS' : 'FAIL'}  ${claim}`);
  console.log(`        ${detail}`);
};
const sha = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 16);
const git = (args: string[]): string =>
  execFileSync('git', args, { cwd: SCRATCH, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(join(SCRATCH, 'scripts'), { recursive: true });
mkdirSync(join(SCRATCH, 'docs'), { recursive: true });
git(['init', '-q', '-b', 'main']);
git(['config', 'user.email', 'scratch@example.invalid']);
git(['config', 'user.name', 'Scratch']);
const TRACKED = join(SCRATCH, 'scripts', 'thing.mjs');
writeFileSync(TRACKED, 'export const a = 1;\n');
writeFileSync(join(SCRATCH, 'docs', 'note.md'), 'one\n');
git(['add', '-A']);
git(['commit', '-q', '-m', 'base']);

// Make the tracked file dirty — the state a fire's worktree is in while it works.
writeFileSync(TRACKED, 'export const a = 2;\n');

// ── F0: the control ─────────────────────────────────────────────────────────────────────────────
const c0 = fingerprint(SCRATCH, 'scripts/');
const c1 = fingerprint(SCRATCH, 'scripts/');
check(
  'F0',
  'CONTROL: with nothing happening between the two reads, the fingerprint does NOT move — so a move below is caused by the action and not by the instrument',
  c0 === c1,
  `${c0} vs ${c1}`,
);

// ── F1/F2: commit the dirty file under the pathspec ─────────────────────────────────────────────
const before = fingerprint(SCRATCH, 'scripts/');
const bytesBefore = sha(readFileSync(TRACKED, 'utf8'));
git(['commit', '-q', '-am', 'a commit landing mid-run']);
const after = fingerprint(SCRATCH, 'scripts/');
const bytesAfter = sha(readFileSync(TRACKED, 'utf8'));

check(
  'F1',
  'THE FINDING: committing a dirty tracked file changes no byte of the working tree, and the bracket MOVES anyway — so a probe using it publishes "this run changed nothing" as a RED',
  bytesBefore === bytesAfter && before !== after,
  `file content sha ${bytesBefore} → ${bytesAfter} (${bytesBefore === bytesAfter ? 'IDENTICAL — no write occurred' : 'CHANGED — then this cell is not measuring what it claims'}); ` +
    `fingerprint ${before} → ${after} (${before === after ? 'unmoved' : 'MOVED'}).`,
);

const comp = (f: string): Record<string, string> =>
  Object.fromEntries(f.split(' ').map((p) => [p.slice(0, p.indexOf(':')), p]));
const cb = comp(before);
const ca = comp(after);
const moved = ['P', 'D'].filter((k) => cb[k] !== ca[k]);
check(
  'F2',
  'and the components that moved are named: `P:` (the porcelain entry list) and `D:` (`git diff HEAD`) — both keyed on HEAD and the index rather than on file content',
  moved.length === 2 && moved.includes('P') && moved.includes('D'),
  `moved: ${moved.join(', ') || 'none'} · P ${cb.P} → ${ca.P} · D ${cb.D} → ${ca.D}. ` +
    'The module hashes `git status --porcelain` and `git diff HEAD`; a commit empties both for the committed path while writing nothing.',
);

// ── F3: a commit entirely OUTSIDE the pathspec ──────────────────────────────────────────────────
writeFileSync(TRACKED, 'export const a = 3;\n');
writeFileSync(join(SCRATCH, 'docs', 'note.md'), 'two\n');
const b3 = fingerprint(SCRATCH, 'scripts/');
const bytes3Before = sha(readFileSync(TRACKED, 'utf8'));
git(['add', 'docs/note.md']);
git(['commit', '-q', '-m', 'a commit touching only docs/']);
const a3 = fingerprint(SCRATCH, 'scripts/');
const bytes3After = sha(readFileSync(TRACKED, 'utf8'));
check(
  'F3',
  'THE NEGATIVE CONTROL that bounds F1: a commit touching ONLY a path outside the pathspec leaves the pathspec’s own fingerprint byte-identical — so the hazard is not "a commit happened" but "a commit included a path inside the bracketed pathspec"',
  bytes3Before === bytes3After && b3 === a3,
  `commit touched docs/note.md only; scripts/ file content sha ${bytes3Before} → ${bytes3After}; fingerprint ${b3 === a3 ? 'UNMOVED (correct)' : 'MOVED — then F1 is not about the pathspec at all'}. ` +
    `components moved: ${['P', 'D'].filter((k) => comp(b3)[k] !== comp(a3)[k]).join(', ') || 'none'}. ` +
    'I predicted the opposite here and this leg refuted it: both git queries are path-filtered. ' +
    'With F1, the rule a fire can act on is exact — do not commit a path under a pathspec a concurrently-driving probe brackets; a docs/-only commit mid-sweep is safe.',
);

rmSync(SCRATCH, { recursive: true, force: true });
check(
  'F4',
  'the scratch repo is removed, and it was never this worktree — the counterfactual is a commit, and nothing drives a commit into a tree another seat may be reading',
  !existsSync(SCRATCH),
  `${SCRATCH.slice(REPO.length + 1)} absent at exit · gitignored while it existed.`,
);

const red = results.filter((r) => !r.ok);
console.log(
  `\nVERDICT/1 ${red.length === 0 ? 'ok' : 'RED'} legs=${results.length} red=[${red.map((r) => r.id).join(', ')}]`,
);
process.exit(red.length === 0 ? 0 : 1);
