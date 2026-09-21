/**
 * Round 245 — `scripts/lib/probe-corpus-sessions.mts` under `npm test`.
 *
 * Companion to `round245-the-minted-fixture-is-pinned-to-the-real-parser.test.ts`; see that file's
 * header for why a server test covers a file in `scripts/` and how the boundary is typed.
 *
 * ## The property that has to survive
 *
 * This module exists because of one distinction, made in Round 241: **`no-corpus` and
 * `insufficient-corpus` have opposite remedies.** The guard it replaced blamed the machine
 * ("run this on a machine with a live Claude Code install") while standing on 538 sessions, which
 * sends the only reader who will ever see it to a fix that cannot work. Every probe that resolves
 * a cast now routes its refusal through `refuseWithCorpusDiagnosis`, so if the two reasons ever
 * collapse back into one, they collapse everywhere at once and nothing says so.
 *
 * Driven only by its own probe until now, against corpora that probe builds. Under `npm test` the
 * distinction is checked on every run, by a corpus this file mints — no read of `~/.claude`
 * anywhere, so the suite's colour does not depend on whose machine it runs on.
 *
 * ## The selection rules are pinned as behaviour, not as documentation
 *
 * Rank by in-band count descending, tiebreak by name ascending; within a directory, size
 * descending, tiebreak by file name ascending. These are written out in the module docstring, and
 * a docstring is not a control — Round 241's own capability run found a check that a deliberately
 * broken build satisfied. The fixtures below are built so each rule is the ONLY thing that
 * decides the answer.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  resolveSessionCast,
  describeResolution,
  CorpusUnavailable,
  SESSION_RETENTION_DAYS,
} from '../../../../scripts/lib/probe-corpus-sessions.mts';

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'klatch-round245-corpus-'));

/** Write a synthetic session of an exact size, so band membership is decided by the test. */
function session(dir: string, name: string, kib: number): string {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, name);
  fs.writeFileSync(p, 'x'.repeat(kib * 1024));
  return p;
}

function corpus(name: string): string {
  const p = path.join(TMP_ROOT, name);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

afterAll(() => {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
});

describe('the refusal stays two-valued', () => {
  it('says no-corpus when the projects directory is absent', () => {
    const missing = path.join(TMP_ROOT, 'does-not-exist');
    expect(() => resolveSessionCast({ count: 1, projectsDir: missing })).toThrow(CorpusUnavailable);
    try {
      resolveSessionCast({ count: 1, projectsDir: missing });
    } catch (e) {
      const err = e as CorpusUnavailable;
      expect(err.reason).toBe('no-corpus');
      expect(err.observed).toContain('does not exist');
    }
  });

  it('says no-corpus when the directory exists but holds no sessions at all', () => {
    // Distinct from the case above and from the case below: the path is right, the install is
    // not there. Checked because this is the branch a mistyped projectsDir lands in.
    const root = corpus('empty-corpus');
    fs.mkdirSync(path.join(root, '-Users-test-proj'), { recursive: true });
    try {
      resolveSessionCast({ count: 1, projectsDir: root });
      expect.unreachable('should have refused');
    } catch (e) {
      const err = e as CorpusUnavailable;
      expect(err.reason).toBe('no-corpus');
      expect(err.observed).toMatch(/holds 0 \.jsonl sessions across 1 directories/);
    }
  });

  it('says insufficient-corpus — and does NOT blame the machine — when sessions exist out of band', () => {
    // THE defect this module was built to remove. A corpus is present; the properties asked for
    // are not met. Reporting that as "wrong machine" is the failure Round 241 named.
    const root = corpus('out-of-band');
    session(path.join(root, '-Users-test-a'), 'a.jsonl', 1);
    session(path.join(root, '-Users-test-b'), 'b.jsonl', 1);
    try {
      resolveSessionCast({ count: 2, projectsDir: root });
      expect.unreachable('should have refused');
    } catch (e) {
      const err = e as CorpusUnavailable;
      expect(err.reason).toBe('insufficient-corpus');
      expect(err.observed).toContain('this machine HAS a corpus');
      expect(err.observed).toMatch(/2 sessions across 2 directories/);
      expect(err.remedy).toMatch(/Do NOT read this as "wrong machine"/);
      // The remedy has to be actionable on THIS machine, so it names the knobs that would work.
      expect(err.remedy).toMatch(/Widen the size band or lower count\/sessionsPerDir/);
    }
  });

  it('says insufficient-corpus when the band is met but not by enough directories', () => {
    const root = corpus('too-few-dirs');
    session(path.join(root, '-Users-test-a'), 'a.jsonl', 200);
    try {
      resolveSessionCast({ count: 3, projectsDir: root });
      expect.unreachable('should have refused');
    } catch (e) {
      const err = e as CorpusUnavailable;
      expect(err.reason).toBe('insufficient-corpus');
      expect(err.observed).toMatch(/only 1 of them hold 1\+ sessions in 150-600 KiB, and 3 are needed/);
    }
  });

  it('refuses a count below one rather than resolving an empty cast', () => {
    const root = corpus('range');
    session(path.join(root, '-Users-test-a'), 'a.jsonl', 200);
    expect(() => resolveSessionCast({ count: 0, projectsDir: root })).toThrow(RangeError);
    expect(() => resolveSessionCast({ count: 1, sessionsPerDir: 0, projectsDir: root })).toThrow(RangeError);
  });
});

describe('selection is by property, and the order is the documented one', () => {
  it('ranks directories by in-band count descending, tiebreaking on name ascending', () => {
    // `rich` has two in-band files, `poor-a`/`poor-b` one each. Asking for two must take `rich`
    // first (count), then `poor-a` (name tiebreak) — the ONLY thing separating the two poor
    // directories is their name, so a lost tiebreak cannot hide behind anything else.
    const root = corpus('ranking');
    session(path.join(root, '-x-rich'), 'r1.jsonl', 200);
    session(path.join(root, '-x-rich'), 'r2.jsonl', 300);
    session(path.join(root, '-x-poor-a'), 'p.jsonl', 200);
    session(path.join(root, '-x-poor-b'), 'p.jsonl', 200);

    const r = resolveSessionCast({ count: 2, projectsDir: root });
    expect(r.sources.map((s) => s.dir)).toEqual(['-x-rich', '-x-poor-a']);
    expect(r.totalSessions).toBe(4);
    expect(r.totalDirs).toBe(3);
    expect(r.qualifyingDirs).toBe(3);
  });

  it('takes the largest session in a directory, tiebreaking on file name ascending', () => {
    const root = corpus('within-dir');
    session(path.join(root, '-x-one'), 'small.jsonl', 160);
    session(path.join(root, '-x-one'), 'big.jsonl', 500);
    session(path.join(root, '-x-two'), 'b-tie.jsonl', 300);
    session(path.join(root, '-x-two'), 'a-tie.jsonl', 300);

    const r = resolveSessionCast({ count: 2, projectsDir: root });
    const byDir = Object.fromEntries(r.sources.map((s) => [s.dir, s.sessions.map((x) => x.file)]));
    expect(byDir['-x-one']).toEqual(['big.jsonl']);
    expect(byDir['-x-two']).toEqual(['a-tie.jsonl']);
  });

  it('excludes files on both sides of the band, inclusive at the edges', () => {
    const root = corpus('band-edges');
    session(path.join(root, '-x-edges'), 'under.jsonl', 149);
    session(path.join(root, '-x-edges'), 'lower.jsonl', 150);
    session(path.join(root, '-x-edges'), 'upper.jsonl', 600);
    session(path.join(root, '-x-edges'), 'over.jsonl', 601);

    const r = resolveSessionCast({ count: 1, sessionsPerDir: 2, projectsDir: root });
    expect(r.sources[0].sessions.map((s) => s.file)).toEqual(['upper.jsonl', 'lower.jsonl']);
    expect(r.totalSessions).toBe(4); // the report counts everything, the cast does not
  });
});

describe('labels are distinguishing, not merely distinct', () => {
  it('widens until the label contains the segment that tells two directories apart', () => {
    // Round 241's capability run: the broken build satisfied "distinct, and both mention argus"
    // via an `Argus1`/`Argus2` fallback. Distinctness alone is not the property — a reader has to
    // be able to tell WHICH directory a label names.
    const root = corpus('labels');
    session(path.join(root, '-Users-x-klatch-worktrees-argus'), 'a.jsonl', 200);
    session(path.join(root, '-Users-x-other-worktrees-argus'), 'b.jsonl', 200);

    const r = resolveSessionCast({ count: 2, projectsDir: root });
    const labels = r.sources.map((s) => s.label);
    expect(new Set(labels).size).toBe(2);
    expect(labels.some((l) => /klatch/i.test(l))).toBe(true);
    expect(labels.some((l) => /other/i.test(l))).toBe(true);
    // And not via the index fallback, which is reachable but should not be reached here.
    expect(labels.some((l) => /\d$/.test(l))).toBe(false);
  });
});

describe('the report and the age it prints', () => {
  it('clamps a future mtime to zero instead of printing a negative age', () => {
    // Observed while building the module: filesystem granularity can put a just-written file
    // fractionally ahead of `Date.now()`, printing `last append -0.0 d ago`. Forced here rather
    // than waited for.
    const root = corpus('future-mtime');
    const p = session(path.join(root, '-x-future'), 'f.jsonl', 200);
    const ahead = new Date(Date.now() + 60 * 60 * 1000);
    fs.utimesSync(p, ahead, ahead);

    const r = resolveSessionCast({ count: 1, projectsDir: root });
    expect(r.sources[0].sessions[0].mtimeAgeDays).toBe(0);
    expect(describeResolution(r)).not.toContain('-0.0 d ago');
  });

  it('prints what was resolved, including the totals it was resolved out of', () => {
    // "A resolution that is not printed is indistinguishable, to a reader, from a pin that
    // happens to still resolve." The report is the module's product as much as the cast is.
    const root = corpus('report');
    session(path.join(root, '-x-alpha'), 'a.jsonl', 200);
    session(path.join(root, '-x-beta'), 'b.jsonl', 200);

    const text = describeResolution(resolveSessionCast({ count: 1, projectsDir: root }));
    expect(text).toContain('corpus: 2 sessions across 2 directories');
    expect(text).toContain('resolved 1 of 2 qualifying directories (by property, not by name)');
    expect(text).toMatch(/a\.jsonl\s+200 KiB/);
    // Life left is labelled as a lower bound: retention is a sweep horizon, not a delete time.
    expect(text).toMatch(/>= \d+\.\d d of life left/);
    expect(SESSION_RETENTION_DAYS).toBe(30);
  });
});
