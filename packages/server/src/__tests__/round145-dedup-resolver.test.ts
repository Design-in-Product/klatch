/**
 * Round 145: the browse dedup lookup was O(files x channels).
 *
 * Theseus's end-to-end decomposition (`docs/browse-latency-end-to-end-2026-09-03.md`)
 * found that browse calls `findChannelByOriginalSessionId` once per session file,
 * and that its second pass —
 *
 *   WHERE json_valid(source_metadata) AND json_extract(source_metadata,'$.originalSessionId') = ?
 *
 * — is covered by no index, so every call is a full table scan with a JSON parse
 * per row. Measured over 508 lookups: 11 ms at 0 channels, 201 ms at 2000. It is
 * invisible on our machines (the repo db has 2 channels, 0 imported) and becomes
 * the whole of browse latency once fingerprint scanning is cached.
 *
 * The fix is `createChannelBySessionIdResolver()`: build the same two-pass index
 * in ONE scan, then answer each lookup from a Map.
 *
 * These tests pin the two things that make the swap safe:
 *
 * 1. SEMANTIC EQUIVALENCE — the resolver must agree with the per-call function
 *    on every case the per-call function handles, including its precedence rule
 *    (canonical channel-id beats source-identity) and its edge cases (invalid
 *    JSON, missing key, non-string id, duplicate originalSessionId).
 *
 * 2. THE COMPLEXITY CHANGE ITSELF — asserted as query count, not wall-clock.
 *    Timing tests are flaky; "one scan regardless of lookup count" is the actual
 *    invariant and it is exactly checkable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import {
  createChannel,
  findChannelByOriginalSessionId,
  createChannelBySessionIdResolver,
} from '../db/queries.js';
import { getDb } from '../db/index.js';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic { messages = { create: vi.fn() } },
}));
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return { ...actual, streamClaude: vi.fn(), streamClaudeRoundtable: vi.fn() };
});

/** Insert a channel row directly so `source_metadata` can be set verbatim. */
function insertImported(id: string, sourceMetadata: string | null): string {
  getDb().prepare(
    'INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, 'Imported ' + id, '', 'claude-opus-4-6', 'roundtable', 'chat',
    'claude-code', sourceMetadata, new Date().toISOString(),
  );
  return id;
}

describe('Round 145: batch dedup resolver', () => {
  describe('semantic equivalence with findChannelByOriginalSessionId', () => {
    it('matches by source_metadata.originalSessionId', () => {
      const chId = insertImported('imp-a', JSON.stringify({ originalSessionId: 'sess-a' }));

      const resolve = createChannelBySessionIdResolver();
      expect(resolve('sess-a')?.id).toBe(chId);
      expect(resolve('sess-a')?.id).toBe(findChannelByOriginalSessionId('sess-a')?.id);
    });

    it('matches by canonical channel id (the Klatch round-trip case)', () => {
      const ch = createChannel('round-trip', '');

      const resolve = createChannelBySessionIdResolver();
      expect(resolve(ch.id)?.id).toBe(ch.id);
      expect(resolve(ch.id)?.id).toBe(findChannelByOriginalSessionId(ch.id)?.id);
    });

    it('returns undefined when neither pass matches', () => {
      insertImported('imp-b', JSON.stringify({ originalSessionId: 'sess-b' }));

      const resolve = createChannelBySessionIdResolver();
      expect(resolve('nothing-matches-this')).toBeUndefined();
      expect(findChannelByOriginalSessionId('nothing-matches-this')).toBeUndefined();
    });

    it('gives canonical id precedence over source-identity, as the two-pass does', () => {
      // A channel whose id is X, and a DIFFERENT channel claiming X as its
      // originalSessionId. The per-call version tries getChannel() first, so the
      // id-holder wins. The resolver must not let map-build order flip that.
      const idHolder = createChannel('id-holder', '');
      insertImported('claims-it', JSON.stringify({ originalSessionId: idHolder.id }));

      const resolve = createChannelBySessionIdResolver();
      expect(findChannelByOriginalSessionId(idHolder.id)?.id).toBe(idHolder.id);
      expect(resolve(idHolder.id)?.id).toBe(idHolder.id);
    });

    it('when several channels share an originalSessionId, both pick the same one', () => {
      insertImported('dupe-first', JSON.stringify({ originalSessionId: 'shared' }));
      insertImported('dupe-second', JSON.stringify({ originalSessionId: 'shared' }));

      const resolve = createChannelBySessionIdResolver();
      // The per-call version uses .get() — first row in table order. Whatever it
      // picks, the resolver must pick the same; that's the contract that makes
      // the swap invisible to the browse UI's existingChannelId/Name.
      expect(resolve('shared')?.id).toBe(findChannelByOriginalSessionId('shared')?.id);
      expect(resolve('shared')?.id).toBe('dupe-first');
    });

    it('agrees on rows the SQL filters out: null, invalid JSON, missing key', () => {
      insertImported('meta-null', null);
      insertImported('meta-garbage', 'not json at all');
      insertImported('meta-nokey', JSON.stringify({ originalProjectUuid: 'p1' }));

      const resolve = createChannelBySessionIdResolver();
      for (const probe of ['not json at all', 'p1', 'null', '']) {
        expect(resolve(probe)?.id).toBe(findChannelByOriginalSessionId(probe)?.id);
      }
      // Each row is still reachable by its own canonical id.
      expect(resolve('meta-garbage')?.id).toBe('meta-garbage');
    });

    it('agrees on a non-string originalSessionId', () => {
      // json_extract returns INTEGER for a JSON number, which never compares
      // equal to a bound TEXT param in SQLite — so the SQL does not match it.
      // The resolver skips non-strings for the same reason.
      insertImported('meta-numeric', JSON.stringify({ originalSessionId: 12345 }));

      const resolve = createChannelBySessionIdResolver();
      expect(findChannelByOriginalSessionId('12345')).toBeUndefined();
      expect(resolve('12345')).toBeUndefined();
    });

    it('returns a fully hydrated Channel, not a raw row', () => {
      insertImported('imp-shape', JSON.stringify({ originalSessionId: 'sess-shape' }));

      const resolve = createChannelBySessionIdResolver();
      const viaResolver = resolve('sess-shape');
      const viaQuery = findChannelByOriginalSessionId('sess-shape');
      expect(viaResolver).toEqual(viaQuery);
      expect(viaResolver?.source).toBe('claude-code');
      expect(viaResolver?.name).toBe('Imported imp-shape');
    });
  });

  describe('the complexity change', () => {
    /** Count channel-table reads by wrapping db.prepare for the duration. */
    function countChannelQueries(fn: () => void): number {
      const db = getDb();
      const original = db.prepare.bind(db);
      let count = 0;
      (db as any).prepare = (sql: string) => {
        if (/FROM channels/i.test(sql)) count++;
        return original(sql);
      };
      try {
        fn();
      } finally {
        (db as any).prepare = original;
      }
      return count;
    }

    beforeEach(() => {
      for (let i = 0; i < 25; i++) {
        insertImported(`bulk-${i}`, JSON.stringify({ originalSessionId: `bulk-sess-${i}` }));
      }
    });

    it('the per-call version costs at least one channels query per lookup', () => {
      const queries = countChannelQueries(() => {
        for (let i = 0; i < 25; i++) findChannelByOriginalSessionId(`bulk-sess-${i}`);
      });
      // Two passes per call: getChannel() then the json_extract scan.
      expect(queries).toBeGreaterThanOrEqual(25);
    });

    it('the resolver costs exactly one channels query for any number of lookups', () => {
      let resolve: (id: string) => unknown;
      const buildQueries = countChannelQueries(() => {
        resolve = createChannelBySessionIdResolver();
      });
      expect(buildQueries).toBe(1);

      const lookupQueries = countChannelQueries(() => {
        for (let i = 0; i < 25; i++) resolve(`bulk-sess-${i}`);
      });
      expect(lookupQueries).toBe(0);
    });

    it('still resolves every id correctly after the swap', () => {
      const resolve = createChannelBySessionIdResolver();
      for (let i = 0; i < 25; i++) {
        expect(resolve(`bulk-sess-${i}`)?.id).toBe(`bulk-${i}`);
      }
    });
  });

  describe('snapshot semantics are real and documented', () => {
    it('does not see a channel created after the resolver was built', () => {
      const resolve = createChannelBySessionIdResolver();
      insertImported('created-later', JSON.stringify({ originalSessionId: 'sess-later' }));

      // This is why the bulk-import loop in routes/import.ts must keep using the
      // live per-call lookup — it creates channels as it goes.
      expect(resolve('sess-later')).toBeUndefined();
      expect(findChannelByOriginalSessionId('sess-later')?.id).toBe('created-later');
    });
  });
});
