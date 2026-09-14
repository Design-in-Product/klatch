/**
 * Fixture provenance and golden snapshots.
 *
 * The 2026-08-28 audit's root cause was not any single bug: it was that the fixtures
 * encoded the format the team intended rather than the one Claude Code emits, and nothing
 * made that visible. Five fixtures hand-written in March against Claude Code 2.1.19/2.1.30
 * were still the whole suite in August, ~220 releases later.
 *
 * These tests are the alarm. See fixtures/PROVENANCE.md.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEvents, type RawEvent } from '../import/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');
const REPO_ROOT = path.resolve(__dirname, '../../../..');

interface Provenance {
  lastReviewed: string;
  reviewIntervalDays: number;
  fixtures: Record<string, { claudeCodeVersion: string; origin: string; capturedOn: string }>;
}

const provenance: Provenance = JSON.parse(
  fs.readFileSync(path.join(FIXTURES, 'provenance.json'), 'utf-8'),
);

function readJsonl(file: string): RawEvent[] {
  return fs.readFileSync(file, 'utf-8')
    .split('\n').filter(l => l.trim())
    .flatMap(l => { try { return [JSON.parse(l)]; } catch { return []; } });
}

const cmp = (a: string, b: string): number => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};

describe('fixture provenance', () => {
  // Some tests write scratch transcripts into this directory and delete them in a finally
  // block. Those are not fixtures and must not trip the manifest check — but a leftover one
  // (a crashed run, or a sandbox that cannot delete) would. Excluded by naming convention.
  // Better still: such tests should use os.tmpdir() instead. Recorded in PROVENANCE.md.
  const isRuntimeTemp = (f: string) => /(^temp-|-temp\.jsonl$)/.test(f);
  const jsonlFixtures = fs.readdirSync(FIXTURES)
    .filter(f => f.endsWith('.jsonl') && !isRuntimeTemp(f))
    .sort();

  it('records every .jsonl fixture', () => {
    // A fixture with no recorded version is one nobody can tell is stale.
    const undocumented = jsonlFixtures.filter(f => !provenance.fixtures[f]);
    expect(undocumented, `add these to fixtures/provenance.json: ${undocumented.join(', ')}`).toEqual([]);
  });

  it('does not record fixtures that no longer exist', () => {
    const missing = Object.keys(provenance.fixtures).filter(f => !jsonlFixtures.includes(f));
    expect(missing, `remove these from provenance.json: ${missing.join(', ')}`).toEqual([]);
  });

  it('declares a version for each fixture', () => {
    for (const [name, meta] of Object.entries(provenance.fixtures)) {
      expect(meta.claudeCodeVersion, `${name} has no claudeCodeVersion`).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('has been reviewed recently enough', () => {
    // This is the test that would have fired. The fixtures were 171 days old and nothing
    // said so. If this fails: run scripts/refresh-import-fixtures.sh, confirm the parser
    // still handles what current Claude Code emits, then bump lastReviewed.
    const ageDays = Math.floor(
      (Date.now() - new Date(provenance.lastReviewed).getTime()) / 86_400_000,
    );
    expect(
      ageDays,
      `Import fixtures were last reviewed ${ageDays} days ago (limit ${provenance.reviewIntervalDays}). ` +
      `Claude Code's transcript format is documented as changing between versions. ` +
      `Run scripts/refresh-import-fixtures.sh and update fixtures/provenance.json.`,
    ).toBeLessThanOrEqual(provenance.reviewIntervalDays);
  });

  it('keeps the oldest fixtures as the back-compat floor', () => {
    // Pre-permissionMode transcripts must still parse under the legacy boundary test.
    const oldest = Object.entries(provenance.fixtures)
      .sort(([, a], [, b]) => cmp(a.claudeCodeVersion, b.claudeCodeVersion))[0];
    const session = parseEvents(readJsonl(path.join(FIXTURES, oldest[0])));
    expect(session.integrity?.boundaryMode).toBe('legacy-flags');
    expect(session.turns.length).toBeGreaterThan(0);
  });

  it('covers a version materially newer than the original hand-written set', () => {
    const newest = Object.values(provenance.fixtures)
      .map(m => m.claudeCodeVersion).sort(cmp).pop()!;
    expect(cmp(newest, '2.1.30'), `newest fixture is ${newest}; the March set was 2.1.30`).toBeGreaterThan(0);
  });
});

describe('golden snapshot — real-shapes fixture', () => {
  const session = parseEvents(readJsonl(path.join(FIXTURES, 'real-shapes-2.1.81.jsonl')));

  it('extracts three real human turns and rejects seven injections', () => {
    expect(session.turns.length).toBe(3);
    expect(session.integrity!.injectedUserEventsFiltered).toBe(7);
    expect(session.turns.map(t => t.userText)).toEqual([
      'Summarize the import pipeline.',
      'And what did it miss?',
      'Orphaned but real.',
    ]);
  });

  it('finds sessionId and both versions despite line 1 carrying neither', () => {
    expect(session.sessionId).toBe('e8ad7ef9-0000-4c83-a9ee-000000000001');
    expect(session.versions).toEqual(['2.1.73', '2.1.81']);
    expect(session.integrity!.boundaryMode).toBe('permissionMode');
  });

  it('emits all four artifact types, including tool_result from a user event', () => {
    expect(session.integrity!.artifactsByType).toEqual({
      thinking: 1, tool_use: 1, tool_result: 1, image: 1,
    });
  });

  it('reports the tree shape it cannot act on', () => {
    expect(session.integrity!.treeShape).toEqual({
      roots: 1, orphans: 1, forkPoints: 2, duplicateTimestamps: 1,
    });
  });

  it('separates the assistant timestamp from the user timestamp', () => {
    const answeredLater = session.turns[1];
    expect(answeredLater.timestamp).toContain('18:30:00');
    expect(answeredLater.assistantTimestamp).toContain('23:05:00');
  });

  it('surfaces event types absent from JSONL-SCHEMA.md', () => {
    expect(Object.keys(session.integrity!.unrecognizedEventTypes).sort())
      .toEqual(['file-history-snapshot', 'last-prompt', 'progress', 'queue-operation', 'system']);
  });

  it('reports nothing content-bearing was skipped in this fixture', () => {
    expect(session.integrity!.skippedContentBearing.total).toBe(0);
  });

  it('does not throw on a conversation event with no timestamp', () => {
    expect(() => parseEvents(readJsonl(path.join(FIXTURES, 'real-shapes-2.1.81.jsonl')))).not.toThrow();
  });
});

describe('golden snapshot — the 2.1.241 capture', () => {
  const f = path.join(FIXTURES, 'real-shapes-2.1.241.jsonl');
  const present = fs.existsSync(f);

  it.runIf(present)('records the attachment gap rather than hiding it', () => {
    const session = parseEvents(readJsonl(f));
    const i = session.integrity!;
    // 622 attachment events in 3,096 across the full Sept 2026 survey; this 400-event
    // redacted sample carries 72, of which 62 hang off a conversation event.
    expect(i.skippedContentBearing.byType.attachment).toBeGreaterThan(0);
    expect(i.unrecognizedEventTypes.attachment).toBeGreaterThan(0);
    // If a future change starts handling attachments, this expectation should FAIL and be
    // replaced by one asserting the content actually arrives.
    expect(i.skippedContentBearing.total).toBeGreaterThan(0);
  });
});

describe('golden snapshot — the committed real capture', () => {
  const capture = path.join(REPO_ROOT, 'exports/sessions/theseus-2026-03-22.jsonl');
  const present = fs.existsSync(capture);

  // This file sat in the repo from March to August without one test reading it. Every
  // defect fixed on 2026-08-28 was measurable from it in under ten minutes.
  it.runIf(present)('pins the parse of a real 1,001-event transcript', () => {
    const session = parseEvents(readJsonl(capture));
    const i = session.integrity!;
    expect(i.eventCount).toBe(1001);
    expect(i.conversationEvents).toBe(689);
    expect(i.turnsEmitted).toBe(66);          // was 75 before the boundary fix; 9 were fabricated
    expect(i.boundaryMode).toBe('permissionMode');
    expect(i.versionsSeen).toEqual(['2.1.73', '2.1.81']);
    expect(i.artifactsByType).toEqual({ thinking: 47, tool_use: 215, tool_result: 213 });
    expect(i.treeShape).toEqual({ roots: 1, orphans: 44, forkPoints: 10, duplicateTimestamps: 6 });
    expect(session.sessionId).toBe('e8ad7ef9-5567-4c83-a9ee-f01eedc87e7e');
  });

  it.skipIf(present)('capture missing — skipping (this is the highest-value fixture in the repo)', () => {});
});
