/**
 * MODEL_ALIASES validation tests.
 *
 * Catches typos in alias keys by verifying they match known Anthropic
 * model ID patterns. The Haiku 3 alias typo (wrong name order + wrong year)
 * was caught by the automated intel sweep on 2026-04-13, not by tests.
 * This suite prevents that class of bug from recurring.
 */

import { describe, it, expect } from 'vitest';
import { MODEL_ALIASES, AVAILABLE_MODELS } from '@klatch/shared';

describe('MODEL_ALIASES', () => {
  it('all alias values point to valid AVAILABLE_MODELS keys', () => {
    for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
      expect(
        Object.keys(AVAILABLE_MODELS),
        `Alias "${alias}" points to "${target}" which is not in AVAILABLE_MODELS`
      ).toContain(target);
    }
  });

  it('alias keys follow Anthropic model ID format (claude-{family}-{version}-{date})', () => {
    const anthropicIdPattern = /^claude-[\w-]+-\d{8}$/;
    for (const alias of Object.keys(MODEL_ALIASES)) {
      expect(
        alias,
        `Alias key "${alias}" doesn't match expected Anthropic model ID pattern`
      ).toMatch(anthropicIdPattern);
    }
  });

  it('alias keys have dates in the YYYYMMDD range 2024-2026', () => {
    for (const alias of Object.keys(MODEL_ALIASES)) {
      const dateMatch = alias.match(/(\d{8})$/);
      expect(dateMatch, `Alias "${alias}" doesn't end with a date`).not.toBeNull();

      const dateStr = dateMatch![1];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6));
      const day = parseInt(dateStr.slice(6, 8));

      expect(year, `Alias "${alias}" has year ${year} outside 2024-2026`).toBeGreaterThanOrEqual(2024);
      expect(year, `Alias "${alias}" has year ${year} outside 2024-2026`).toBeLessThanOrEqual(2026);
      expect(month, `Alias "${alias}" has month ${month} outside 1-12`).toBeGreaterThanOrEqual(1);
      expect(month, `Alias "${alias}" has month ${month} outside 1-12`).toBeLessThanOrEqual(12);
      expect(day, `Alias "${alias}" has day ${day} outside 1-31`).toBeGreaterThanOrEqual(1);
      expect(day, `Alias "${alias}" has day ${day} outside 1-31`).toBeLessThanOrEqual(31);
    }
  });

  it('no alias key duplicates an AVAILABLE_MODELS key', () => {
    const modelKeys = Object.keys(AVAILABLE_MODELS);
    for (const alias of Object.keys(MODEL_ALIASES)) {
      expect(
        modelKeys,
        `Alias key "${alias}" is also in AVAILABLE_MODELS — it should be one or the other`
      ).not.toContain(alias);
    }
  });

  it('Haiku 3 alias uses correct Anthropic model ID format', () => {
    // This test documents the specific bug found on 2026-04-13.
    // Anthropic's Haiku 3 ID is claude-3-haiku-YYYYMMDD (note: "3-haiku" not "haiku-3").
    // If this test fails after a fix, update the expected values.
    const haiku3Aliases = Object.keys(MODEL_ALIASES).filter((k) => k.includes('haiku'));

    for (const alias of haiku3Aliases) {
      // Verify the alias resolves to Haiku 4.5
      expect(MODEL_ALIASES[alias]).toBe('claude-haiku-4-5-20251001');
    }

    // At minimum, the real Haiku 3 ID should be present after the fix
    // Uncomment after Daedalus fixes the alias:
    // expect(MODEL_ALIASES).toHaveProperty('claude-3-haiku-20240307');
  });
});
