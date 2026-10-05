/**
 * Round 263, Daedalus, 2026-09-24.
 *
 * Coverage for `scripts/lib/tree-fingerprint.mts`, extracted this round from `probe-round259`.
 *
 * ## Why this file exists at all
 *
 * Round 259's lesson, verbatim: *an uncovered new lib module is invisible to BOTH limbs of the
 * `scripts/lib` coverage floor while making the ratio worse.* `probe-round245` reports a floor of
 * covered modules; a module with no test is neither in `COVERED_FLOOR` (so arm A guards nothing
 * about it) nor counted as a regression (so nothing goes red). It just quietly lowers the
 * percentage. So the module and its coverage land in the same commit, and `COVERED_FLOOR` grows
 * in that commit too.
 *
 * ## What is actually being checked
 *
 * `probe-round263` drives this module against the live repository and against a minted sandbox.
 * This file covers the part a probe cannot: the module's behaviour on cases that are awkward to
 * arrange in the operator's tree, each in a throwaway repository of its own.
 *
 * The load-bearing cases are the two where `git status --porcelain` — the spelling this module
 * replaces — cannot see the write at all:
 *
 *   - a second write into an already-modified TRACKED file (the status letter does not move), and
 *   - a write into an already-present UNTRACKED file (`git diff HEAD` does not contain it).
 *
 * Those are not edge cases. They are the normal condition of a shared repository with another
 * agent mid-task, which is exactly when a probe's "I wrote nothing" claim is worth having.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fingerprint, windowState, trackedCount } from '../../../../scripts/lib/tree-fingerprint.mts';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round263-'));

const git = (repo: string, args: string[]) =>
  execFileSync('git', args, { cwd: repo, maxBuffer: 16 * 1024 * 1024 }).toString();

/** A throwaway repository with one committed file under `scripts/`. */
function mintRepo(name: string): string {
  const repo = path.join(TMP, name);
  fs.mkdirSync(path.join(repo, 'scripts'), { recursive: true });
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.email', 'test@example.invalid']);
  git(repo, ['config', 'user.name', 'Round 263 test']);
  fs.writeFileSync(path.join(repo, 'scripts', 'tracked.mts'), 'const a = 1;\n');
  git(repo, ['add', '-A']);
  git(repo, ['commit', '-qm', 'base']);
  return repo;
}

const write = (repo: string, rel: string, body: string) =>
  fs.writeFileSync(path.join(repo, 'scripts', rel), body);

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

describe('fingerprint — stability', () => {
  let repo: string;
  beforeAll(() => {
    repo = mintRepo('stable');
  });

  it('is equal across two calls when nothing happens between them', () => {
    expect(fingerprint(repo, 'scripts/')).toBe(fingerprint(repo, 'scripts/'));
  });

  it('is equal on a clean tree and on a dirty tree, as long as the tree does not move in between', () => {
    write(repo, 'tracked.mts', 'const a = 1; // dirtied by someone else\n');
    const a = fingerprint(repo, 'scripts/');
    const b = fingerprint(repo, 'scripts/');
    expect(a).toBe(b);
  });

  it('returns to its original value when a change is undone — it is a content hash, not a counter', () => {
    const clean = mintRepo('undo');
    const before = fingerprint(clean, 'scripts/');
    write(clean, 'tracked.mts', 'const a = 2;\n');
    expect(fingerprint(clean, 'scripts/')).not.toBe(before);
    write(clean, 'tracked.mts', 'const a = 1;\n');
    expect(fingerprint(clean, 'scripts/')).toBe(before);
  });

  it('scopes to the pathspec — a write outside it does not move it', () => {
    const scoped = mintRepo('scoped');
    const before = fingerprint(scoped, 'scripts/');
    fs.mkdirSync(path.join(scoped, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(scoped, 'docs', 'note.md'), '# elsewhere\n');
    expect(fingerprint(scoped, 'scripts/')).toBe(before);
  });
});

describe('fingerprint — the writes porcelain cannot see', () => {
  it('moves on a SECOND write into an already-modified tracked file, where porcelain is byte-identical', () => {
    const repo = mintRepo('already-modified');

    // Someone else dirties the file first. This is the normal state of a shared repo.
    write(repo, 'tracked.mts', 'const a = 1; // THEIR edit\n');
    const porcelainBefore = git(repo, ['status', '--porcelain', '--', 'scripts/']);
    const before = fingerprint(repo, 'scripts/');

    // Now "the run" writes into that same file.
    write(repo, 'tracked.mts', 'const a = 999; // THEIR edit, then OURS\n');
    const porcelainAfter = git(repo, ['status', '--porcelain', '--', 'scripts/']);
    const after = fingerprint(repo, 'scripts/');

    // The spelling being replaced is blind here — this is the false GREEN, not the false red.
    expect(porcelainAfter).toBe(porcelainBefore);
    expect(porcelainBefore.trim()).not.toBe('');

    // The fingerprint is not.
    expect(after).not.toBe(before);
  });

  it('moves on a write into an already-present UNTRACKED file, which `git diff HEAD` never contains', () => {
    const repo = mintRepo('already-untracked');

    write(repo, 'scratch.mts', 'const d = 4;\n');
    const porcelainBefore = git(repo, ['status', '--porcelain', '--', 'scripts/']);
    const diffBefore = git(repo, ['diff', 'HEAD', '--', 'scripts/']);
    const before = fingerprint(repo, 'scripts/');

    write(repo, 'scratch.mts', 'const d = 5; // the run wrote here\n');
    const porcelainAfter = git(repo, ['status', '--porcelain', '--', 'scripts/']);
    const diffAfter = git(repo, ['diff', 'HEAD', '--', 'scripts/']);
    const after = fingerprint(repo, 'scripts/');

    // Neither of the two obvious cheaper spellings can see it.
    expect(porcelainAfter).toBe(porcelainBefore);
    expect(diffAfter).toBe(diffBefore);

    expect(after).not.toBe(before);
  });

  it('lists an untracked DIRECTORY as its individual files, so a file appearing inside one is visible', () => {
    const repo = mintRepo('untracked-dir');

    fs.mkdirSync(path.join(repo, 'scripts', 'nested'), { recursive: true });
    write(repo, path.join('nested', 'one.mts'), 'const one = 1;\n');
    const before = fingerprint(repo, 'scripts/');

    // Without `-uall`, porcelain collapses this to a single `?? scripts/nested/` entry and the
    // arriving second file is invisible.
    write(repo, path.join('nested', 'two.mts'), 'const two = 2;\n');
    const after = fingerprint(repo, 'scripts/');

    expect(after).not.toBe(before);
  });
});

describe('fingerprint — the writes porcelain CAN see', () => {
  it('moves when a file arrives', () => {
    const repo = mintRepo('arrival');
    const before = fingerprint(repo, 'scripts/');
    write(repo, 'new.mts', 'const n = 1;\n');
    expect(fingerprint(repo, 'scripts/')).not.toBe(before);
  });

  it('moves when a tracked file is deleted', () => {
    const repo = mintRepo('deletion');
    const before = fingerprint(repo, 'scripts/');
    fs.rmSync(path.join(repo, 'scripts', 'tracked.mts'));
    expect(fingerprint(repo, 'scripts/')).not.toBe(before);
  });

  it('moves when a file is staged, even though its content on disk did not change', () => {
    const repo = mintRepo('staging');
    write(repo, 'new.mts', 'const n = 1;\n');
    const before = fingerprint(repo, 'scripts/');
    git(repo, ['add', 'scripts/new.mts']);
    expect(fingerprint(repo, 'scripts/')).not.toBe(before);
  });
});

describe('windowState — reported, never graded', () => {
  it('is empty on a clean tree', () => {
    const repo = mintRepo('window-clean');
    expect(windowState(repo, 'scripts/')).toBe('');
  });

  it('names the dirty paths when there are any', () => {
    const repo = mintRepo('window-dirty');
    write(repo, 'tracked.mts', 'const a = 2;\n');
    expect(windowState(repo, 'scripts/')).toContain('scripts/tracked.mts');
  });

  it('is NOT what fingerprint compares — a dirty window and an unmoved fingerprint coexist', () => {
    // This is the whole point of the split, stated as a test rather than as a comment: the
    // condition that reddened `probe-round261` on another agent's tree is the condition under
    // which the repaired arm must stay green.
    const repo = mintRepo('coexist');
    write(repo, 'their-work-in-flight.mts', 'const theirs = 1;\n');

    const before = fingerprint(repo, 'scripts/');
    const after = fingerprint(repo, 'scripts/'); // a "run" that writes nothing

    expect(windowState(repo, 'scripts/')).not.toBe('');
    expect(after).toBe(before);
  });
});

describe('trackedCount — the figure that separates a clean window from a wrong pathspec', () => {
  /**
   * Round 335, driving Theseus's Round 334 §4. The three cases below are the ones he measured on
   * the live repo, reproduced here at size instead of transcribed: on a CLEAN window the whole
   * fingerprint detail line is byte-identical for a pathspec that names files and one that names
   * none, so a typo'd pathspec reads as a clean pass. The first test states the DEFECT so that a
   * future change which makes those columns diverge fails here rather than silently retiring the
   * reason this function exists.
   */
  it('is the ONLY one of the reported columns that moves: on a clean window the others do not', () => {
    const repo = mintRepo('clean-window-blindspec');
    fs.mkdirSync(path.join(repo, 'packages', 'shared', 'src'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'packages', 'shared', 'src', 'one.ts'), 'export const x = 1;\n');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-qm', 'a second tracked file, elsewhere']);

    const real = fingerprint(repo, 'scripts');
    const typo = fingerprint(repo, 'scriptz-does-not-exist');
    const other = fingerprint(repo, 'packages/shared/src');

    // The defect, asserted: fingerprint, its component count and the porcelain entry count are all
    // identical across a pathspec naming 1 file, one naming 0, and one naming a different 1.
    expect(typo).toBe(real);
    expect(other).toBe(real);
    expect(windowState(repo, 'scripts')).toBe('');
    expect(windowState(repo, 'scriptz-does-not-exist')).toBe('');

    // And the figure that separates them, in the same clean window.
    expect(trackedCount(repo, 'scripts')).toBe(1);
    expect(trackedCount(repo, 'scriptz-does-not-exist')).toBe(0);
    expect(trackedCount(repo, 'packages/shared/src')).toBe(1);
  });

  it('is diagnostic in the DIRTY window too — it does not depend on anything being dirty', () => {
    const repo = mintRepo('dirty-window');
    write(repo, 'tracked.mts', 'const a = 2;\n');
    write(repo, 'untracked.mts', 'const u = 1;\n');
    expect(windowState(repo, 'scripts')).not.toBe('');
    // One tracked file; the untracked one is deliberately NOT counted — this is a tracked-file
    // count, and an untracked file is already visible in the porcelain entries.
    expect(trackedCount(repo, 'scripts')).toBe(1);
  });

  it('counts a file whose path contains a newline as ONE entry', () => {
    // `-z` is load-bearing: without it a newline in a path forges an entry boundary and inflates
    // the count, which is the same hazard `fingerprint` uses `-z` for. Known positive rather than a
    // comment claiming the flag matters.
    const repo = mintRepo('newline-path');
    const weird = path.join(repo, 'scripts', 'two\nlines.mts');
    fs.writeFileSync(weird, 'const w = 1;\n');
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-qm', 'a path with a newline in it']);
    expect(trackedCount(repo, 'scripts')).toBe(2);
  });

  it('is 0 for a pathspec outside the repo rather than throwing', () => {
    const repo = mintRepo('outside');
    expect(trackedCount(repo, 'no/such/dir')).toBe(0);
  });
});
