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
 * Enumerate every path the pathspec names — tracked (`git ls-files`) and untracked-but-not-ignored
 * (`git ls-files --others --exclude-standard`) — and hash each one's **actual file content on
 * disk**, or a deletion marker if a tracked path no longer exists there. The fingerprint is a sha
 * of that sorted `path:contentHash` list. Content, not git bookkeeping, is what moves it.
 *
 * ── A fourth false red, found 2026-10-28, and why the fix is content not bookkeeping ─────
 *
 * The original three-part scheme (`P:` sha of `git status --porcelain` entries, `D:` sha of
 * `git diff HEAD`, `U:` per-untracked-file content sha) graded content indirectly, through git's
 * index/HEAD bookkeeping. A `git commit` under the pathspec mid-window moves that bookkeeping —
 * `git diff HEAD` goes from showing the dirty hunk to showing nothing, because HEAD just absorbed
 * it — even though the file's bytes on disk never changed. `P:`/`D:` both collapse to
 * `sha256("")` and the bracket reads a mismatch for a run that wrote nothing (Daedalus, 10-28,
 * `docs/research/unit-307c4-rekey-2026-10-28/`, driven in a scratch git repo: dirty a tracked
 * file, fingerprint, commit it with no further edit, fingerprint again — `P:1a29fa97f6686913
 * D:667091dd291d3b5f` → `P:e3b0c44298fc1c14 D:e3b0c44298fc1c14`, reproduced here before this fix
 * and gone after it). Reading file content directly removes the dependency on HEAD/the index
 * entirely, so a commit under the pathspec mid-bracket is no longer a special case to avoid — the
 * operational rule ("don't commit under a pathspec a concurrently-driving probe brackets") is now
 * redundant with the fix rather than a substitute for it, and is kept below only as a note on what
 * used to be required.
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
  // `-z` so a path containing a newline cannot forge an entry boundary. Tracked paths come from
  // the index regardless of on-disk status (so a deleted tracked file still names a path to check
  // for); untracked paths are filtered through `--exclude-standard` so a `.gitignore`d file stays
  // the one documented blind spot (probe-round287) rather than a new one.
  const tracked = git(repo, ['ls-files', '-z', '--', pathspec]).split('\0').filter((s) => s.length > 0);
  const untracked = git(repo, ['ls-files', '-z', '--others', '--exclude-standard', '--', pathspec])
    .split('\0')
    .filter((s) => s.length > 0);
  const parts: string[] = [];
  for (const rel of [...tracked, ...untracked].sort()) {
    const abs = path.join(repo, rel);
    if (!fs.existsSync(abs)) {
      parts.push(`-:${rel}`); // tracked in the index, absent on disk
      continue;
    }
    if (!fs.statSync(abs).isFile()) continue;
    parts.push(`${rel}:${sha(fs.readFileSync(abs))}`);
  }
  return sha(parts.join('\n'));
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

/**
 * How many TRACKED files the pathspec actually names. Also reported, never graded.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * Theseus's Round 334 §4 drove the blind spot that {@link windowState} and the fingerprint detail
 * line shared **under the pre-2026-10-28 porcelain-based `fingerprint`**: on a CLEAN window, a
 * pathspec naming 200 files, a pathspec naming 1, and a MISSPELLED pathspec naming none all
 * produced the identical `P:e69de29b… D:e69de29b…` — both halves `sha256("")`, because an empty
 * porcelain list and an empty diff hash the same no matter how much the pathspec covers. So the
 * evidence line could not distinguish *fingerprinted the tree and it did not move* from
 * *fingerprinted nothing at all*, and a typo'd pathspec read as a clean pass.
 *
 * The content-keyed `fingerprint` below (2026-10-28) no longer has that collision — a clean
 * 200-file match and a 0-file match now hash different things, because every clean file's content
 * is itself part of the hash rather than only its porcelain delta. `trackedCount` is kept anyway:
 * it is still the more direct figure for "how many files does this pathspec actually name", it is
 * cheaper to read than diffing two fingerprints to infer a count, and it remains true that
 * `windowState`'s *porcelain* text is empty on both a 200-file clean match and a typo'd pathspec —
 * that half of the original blind spot is `windowState`'s, not `fingerprint`'s, and is unchanged.
 *
 * `git ls-files` separates the three cases — 200 / 0 / 1 — and does so regardless of dirty state,
 * which is what makes it the right figure for this rather than a second emptiness proxy.
 *
 * Deliberately a separate function rather than folded into {@link windowState}'s return: that
 * returns porcelain text and 37 probe files read it as text today (40 files reference this module;
 * the other three are the sweep, the promotion path and `lib/db-sentinel.mts`).
 *
 * @param repo absolute path to the repository root
 * @param pathspec a git pathspec
 * @returns the number of tracked files the pathspec names; 0 for a pathspec that matches nothing
 */
export function trackedCount(repo: string, pathspec: string): number {
  // `-z` for the same reason `fingerprint` uses it: a path containing a newline must not be able to
  // forge an entry boundary and inflate the count.
  return git(repo, ['ls-files', '-z', '--', pathspec]).split('\0').filter((s) => s.length > 0).length;
}
