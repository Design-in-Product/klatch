/**
 * A before/after content fingerprint of a pathspec, for probes that need to say
 * "I left the tree as I found it."
 *
 * Extracted Round 263 (Daedalus, 2026-09-24) from `probe-round259`, which had it inline and
 * carried the note "Round 256's remedy, copied". The copy is the reason for this module.
 *
 * ── The class this closes ────────────────────────────────────────────────────
 *
 * A probe that writes nothing wants to prove it wrote nothing. The obvious spelling is an
 * EMPTINESS claim over the working-tree window:
 *
 *     git status --porcelain -- scripts/ packages/   →  assert it is empty
 *
 * That assertion is about **the window**, not about **the run**, and the two come apart in both
 * directions:
 *
 *   - **False red.** Any other seat with work in flight under the pathspec reddens it. The probe
 *     has done nothing wrong and neither has they. Sighted five times now: Theseus 252 §5.1,
 *     Daedalus 253 (a controls arm reddened on the very run proving its own remedy worked),
 *     Daedalus 255 (arm Z of `probe-round225`), Daedalus 259 (which is where the remedy below was
 *     first written), and Theseus 262 §3, where `probe-round261`'s own Z1 — written by the author
 *     of the 259 remedy, two rounds after writing it — reddened on Theseus's uncommitted files.
 *
 *   - **False green, which is the half that actually matters.** Emptiness is normally defended as
 *     "strict, maybe too strict." It is not strict. If a file under the pathspec is *already*
 *     modified when the run opens, the window says ` M path` before and ` M path` after, and a
 *     write the run performed **into that same file** changes nothing an emptiness check or a
 *     porcelain-diff can see. The stricter-looking assertion is blind to exactly the case where a
 *     probe is most likely to be writing the product: someone is editing it.
 *
 * The allowlist patch — filter the probe's own deliverables out of the porcelain lines — fixes
 * the false red and makes the false green worse, because it must name every future round's files
 * and goes stale in silence. `probe-round261` shipped that patch.
 *
 * ── What this grades instead ─────────────────────────────────────────────────
 *
 * Bracket the run: take a fingerprint at open, take one at close, compare. That grades **what the
 * run did**, not **what the window contained**, so a third party's in-flight work is invisible to
 * it and a write into an already-dirty file is not.
 *
 * Three parts, and they are not redundant — `probe-round263` drives one perturbation per part that
 * the other two miss:
 *
 *   `P:` sha of the porcelain entries — catches a path arriving, leaving, or changing status.
 *   `D:` sha of `git diff HEAD` — catches content moving inside an ALREADY-dirty tracked file,
 *        which `P:` cannot see because the status letter does not move.
 *   `U:` per-untracked-file content sha — catches content moving inside an already-present
 *        untracked file, which neither `P:` (same entry) nor `D:` (untracked is not in the diff)
 *        can see.
 *
 * ── The pre-existing window is REPORTED, never GRADED ────────────────────────
 *
 * {@link windowState} exists so a probe can print what it found without asserting anything about
 * it. That split is the whole design: the state of a window this seat does not own is a
 * measurement; what this run did to it is a check. Theseus 262 §3 put it as a table — a fuse
 * misleads its author, a gate prompts its author, and an emptiness claim over a shared window
 * reddens for a third party who has done nothing wrong, during exactly the window in which the
 * probe is most worth running.
 *
 * Read-only: every call here is a `git` query or a file read. This module never writes.
 *
 * ## Why `.mts` and not `.mjs`
 *
 * Round 263 wrote this as `.mjs`, matching its siblings, and `npm run typecheck` rejected the
 * import with TS7016 — a `.mjs` resolves but carries no declarations, so it enters the program as
 * an implicit `any`. `strip-source.mjs` gets away with it; this did not. Rather than silence the
 * error, the module is `.mts`, which `packages/server/tsconfig.json` already widened its `rootDir`
 * to admit — and its comment states the gain plainly: *`scripts/lib/*.mts` has never been
 * typechecked by `npm run typecheck` … now any lib module a test reaches is in the program by
 * construction.* A guard against silent writes is a poor place to accept an untyped surface.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const sha = (b: crypto.BinaryLike): string =>
  crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

const git = (repo: string, args: string[]): string =>
  execFileSync('git', args, { cwd: repo, maxBuffer: 64 * 1024 * 1024 }).toString();

/**
 * A content fingerprint of `pathspec` within `repo`. Compare two of these across a run; equality
 * means the run changed nothing under the pathspec. The string itself is opaque — it is only ever
 * meaningful against another fingerprint of the same pathspec in the same repo.
 *
 * @param repo absolute path to the repository root
 * @param pathspec a git pathspec, e.g. `'scripts/'`
 */
export function fingerprint(repo: string, pathspec: string): string {
  // `-z` so a path containing a newline cannot forge an entry boundary; `-uall` so an untracked
  // DIRECTORY is listed as its individual files rather than collapsed to one `dir/` entry — a
  // collapsed entry would hide a file appearing inside an already-untracked directory.
  const raw = git(repo, ['status', '--porcelain', '-z', '-uall', '--', pathspec]);
  const entries = raw.split('\0').filter((s) => s.length > 0);
  const diff = git(repo, ['diff', 'HEAD', '--', pathspec]);
  const parts = [`P:${sha(entries.join('\n'))}`, `D:${sha(diff)}`];
  for (const e of entries) {
    if (!e.startsWith('?? ')) continue;
    const rel = e.slice(3);
    const abs = path.join(repo, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) parts.push(`U:${rel}:${sha(fs.readFileSync(abs))}`);
  }
  return parts.join(' ');
}

/**
 * The human-readable state of the window, for a probe to PRINT. Never assert on this: it describes
 * a tree this seat may not be the only writer of.
 *
 * @param repo absolute path to the repository root
 * @param pathspec a git pathspec
 * @returns porcelain output, trimmed; empty string means a clean window
 */
export function windowState(repo: string, pathspec: string): string {
  return git(repo, ['status', '--porcelain', '--', pathspec]).trim();
}
