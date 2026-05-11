/**
 * Round 34: MicroReflection.validUntil temporal-validity behavior.
 *
 * Argus MemPalace-readiness memo (2026-05-10) proposed a nullable
 * `validUntil` field on MicroReflection so that year-old reflections —
 * not "wrong" when superseded, just no longer applicable — can be
 * filtered from context-assembly reads without destructive deletion.
 *
 * Contract:
 *   - validUntil absent or null → reflection is active indefinitely
 *   - validUntil in the future → reflection is active
 *   - validUntil in the past → reflection is invalidated; filtered from
 *     field_notes in both the HTTP export path (mergeFieldNotes) and the
 *     MCP entity-package path
 *   - validUntil malformed → tolerated as active (no accidental suppression
 *     on bad data)
 *
 * The reflection STAYS in the auditable record (entities.reflections JSON).
 * Filtering is applied at read time only.
 */

import { describe, it, expect } from 'vitest';
import './setup.js';
import {
  createChannel,
  createEntity,
  assignEntityToChannel,
  appendReflection,
  getEntityReflections,
} from '../db/queries.js';
import { mergeFieldNotes } from '../export/package-builder.js';
import { isReflectionActive } from '@klatch/shared';
import type { MicroReflection } from '@klatch/shared';

describe('Round 34: MicroReflection.validUntil temporal validity', () => {
  describe('isReflectionActive helper', () => {
    it('treats missing validUntil as indefinitely active', () => {
      expect(isReflectionActive({
        observation: 'x', createdAt: '2026-01-01T00:00:00Z',
        channelId: 'c', type: 'observation',
      })).toBe(true);
    });

    it('treats future validUntil as active', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isReflectionActive({
        observation: 'x', createdAt: '2026-01-01T00:00:00Z',
        channelId: 'c', type: 'observation', validUntil: future,
      })).toBe(true);
    });

    it('treats past validUntil as inactive', () => {
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(isReflectionActive({
        observation: 'x', createdAt: '2026-01-01T00:00:00Z',
        channelId: 'c', type: 'observation', validUntil: past,
      })).toBe(false);
    });

    it('tolerates malformed validUntil (treats as active, no false suppression)', () => {
      expect(isReflectionActive({
        observation: 'x', createdAt: '2026-01-01T00:00:00Z',
        channelId: 'c', type: 'observation', validUntil: 'not-a-date',
      })).toBe(true);
    });

    it('honors a custom "now" for deterministic tests', () => {
      const fixedNow = new Date('2026-06-01T00:00:00Z');
      expect(isReflectionActive(
        {
          observation: 'x', createdAt: '2026-01-01T00:00:00Z',
          channelId: 'c', type: 'observation', validUntil: '2026-05-01T00:00:00Z',
        },
        fixedNow,
      )).toBe(false);
      expect(isReflectionActive(
        {
          observation: 'x', createdAt: '2026-01-01T00:00:00Z',
          channelId: 'c', type: 'observation', validUntil: '2026-07-01T00:00:00Z',
        },
        fixedNow,
      )).toBe(true);
    });
  });

  describe('mergeFieldNotes filters invalidated reflections', () => {
    it('includes active reflections, excludes invalidated ones, keeps both in record', () => {
      const active: MicroReflection = {
        observation: 'still applicable',
        createdAt: new Date().toISOString(),
        channelId: 'c',
        type: 'observation',
      };
      const invalidated: MicroReflection = {
        observation: 'superseded',
        createdAt: new Date('2025-01-01').toISOString(),
        channelId: 'c',
        type: 'observation',
        validUntil: new Date('2025-12-31').toISOString(),
      };
      const future: MicroReflection = {
        observation: 'expires next year',
        createdAt: new Date().toISOString(),
        channelId: 'c',
        type: 'observation',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const notes = mergeFieldNotes(undefined, [active, invalidated, future]);
      expect(notes).not.toBeNull();
      expect(notes).toHaveLength(2);
      const observations = notes!.map((n: any) => n.observation);
      expect(observations).toContain('still applicable');
      expect(observations).toContain('expires next year');
      expect(observations).not.toContain('superseded');
    });

    it('returns null when all reflections are invalidated and no briefing notes', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const notes = mergeFieldNotes(undefined, [
        { observation: 'a', createdAt: 't', channelId: 'c', type: 'observation', validUntil: past },
        { observation: 'b', createdAt: 't', channelId: 'c', type: 'observation', validUntil: past },
      ]);
      expect(notes).toBeNull();
    });
  });

  describe('storage round-trip preserves validUntil and other reflections (audit-safe)', () => {
    it('appendReflection + getEntityReflections round-trips validUntil', () => {
      const entity = createEntity('R34', 'claude-opus-4-6', 'p', '#3B82F6');
      const ch = createChannel('r34', '');
      assignEntityToChannel(ch.id, entity.id);

      const past = new Date(Date.now() - 1000).toISOString();
      appendReflection(entity.id, {
        observation: 'archived note',
        createdAt: new Date('2025-01-01').toISOString(),
        channelId: ch.id,
        type: 'observation',
        validUntil: past,
      });

      // Invalidated reflection IS still in storage — auditability preserved.
      // Only the merge/assembly pipeline filters it out.
      const stored = getEntityReflections(entity.id);
      expect(stored).toHaveLength(1);
      expect(stored[0].validUntil).toBe(past);
    });
  });
});
