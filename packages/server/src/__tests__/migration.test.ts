import { describe, it, expect } from 'vitest';
import { MODEL_ALIASES, AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_ENTITY_ID, ENTITY_COLORS } from '@klatch/shared';

describe('Model configuration', () => {
  it('MODEL_ALIASES maps old IDs to current AVAILABLE_MODELS keys', () => {
    for (const [oldId, newId] of Object.entries(MODEL_ALIASES)) {
      expect(newId in AVAILABLE_MODELS).toBe(true);
      expect(oldId).not.toBe(newId); // alias should differ from target
    }
  });

  it('DEFAULT_MODEL is a valid AVAILABLE_MODELS key', () => {
    expect(DEFAULT_MODEL in AVAILABLE_MODELS).toBe(true);
  });

  it('all AVAILABLE_MODELS have label and description', () => {
    for (const [id, meta] of Object.entries(AVAILABLE_MODELS)) {
      expect(meta.label).toBeTruthy();
      expect(meta.description).toBeTruthy();
    }
  });
});

describe('Default entity configuration', () => {
  it('DEFAULT_ENTITY_ID is set', () => {
    expect(DEFAULT_ENTITY_ID).toBe('default-entity');
  });

  it('ENTITY_COLORS has at least 4 colors', () => {
    expect(ENTITY_COLORS.length).toBeGreaterThanOrEqual(4);
  });

  it('first ENTITY_COLOR is indigo (#6366f1)', () => {
    expect(ENTITY_COLORS[0]).toBe('#6366f1');
  });
});

describe('Model migration behavior', () => {
  // These test that the migration logic in db/index.ts correctly rewrites
  // legacy model IDs. We test the mapping itself since the actual migration
  // runs on DB init (covered by setup.ts using the same schema).

  it('legacy claude-opus-4-20250514 maps to claude-opus-4-6', () => {
    expect(MODEL_ALIASES['claude-opus-4-20250514']).toBe('claude-opus-4-6');
  });

  it('legacy claude-sonnet-4-20250514 maps to claude-sonnet-4-6', () => {
    expect(MODEL_ALIASES['claude-sonnet-4-20250514']).toBe('claude-sonnet-4-6');
  });

  it('new channels get current model IDs', () => {
    // Verified via createChannel tests in queries.test.ts — channels default
    // to DEFAULT_MODEL which is a current AVAILABLE_MODELS key.
    expect(DEFAULT_MODEL).toBe('claude-opus-4-6');
    expect(DEFAULT_MODEL in AVAILABLE_MODELS).toBe(true);
  });
});
