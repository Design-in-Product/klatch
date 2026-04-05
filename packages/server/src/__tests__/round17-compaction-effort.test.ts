/**
 * Round 17: Compaction threshold (80K→160K) + per-entity effort parameter
 *
 * Compaction: verify new trigger value, entity-attribution instructions
 * for roundtable/directed channels.
 *
 * Effort: schema, query defaults, API validation, streaming integration.
 */

import { describe, it, expect, vi } from 'vitest';
import './setup.js';
import {
  createEntity,
  updateEntity,
  getEntity,
  getAllEntities,
} from '../db/queries.js';
import { getDb } from '../db/index.js';
import type { EffortLevel } from '@klatch/shared';

// Mock streaming to avoid real API calls
vi.mock('../claude/client.js', () => ({
  streamClaude: vi.fn(),
  streamClaudeRoundtable: vi.fn(),
}));

import { Hono } from 'hono';
import { entityRoutes } from '../routes/entities.js';

function createTestApp() {
  const app = new Hono();
  app.route('/api', entityRoutes);
  return app;
}

// ── Compaction threshold ──────────────────────────────��──────

describe('Compaction threshold — 80K → 160K', () => {
  it('trigger value is 160000 in source', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );
    expect(clientSource).toContain("trigger: { type: 'input_tokens', value: 160000 }");
    expect(clientSource).not.toContain("value: 80000");
  });

  it('entity-attribution instructions present for non-panel modes', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );
    expect(clientSource).toContain("options?.channelMode && options.channelMode !== 'panel'");
    expect(clientSource).toContain('attribution markers');
  });

  it('channelMode is passed through from streamClaude and streamClaudeRoundtable', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );
    // Both call sites pass channelMode
    const channelModeRefs = clientSource.match(/channelMode:\s*channel\?\.mode/g);
    expect(channelModeRefs).not.toBeNull();
    expect(channelModeRefs!.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Effort: schema + queries ────────────────────────��────────

describe('Effort parameter — schema & queries', () => {
  it('entities table has effort column', () => {
    const cols = getDb().pragma('table_info(entities)') as { name: string }[];
    const colNames = cols.map((c) => c.name);
    expect(colNames).toContain('effort');
  });

  it('createEntity with explicit effort stores and returns it', () => {
    const entity = createEntity('Low Effort Bot', 'claude-opus-4-6', 'Be brief.', '#FF0000', undefined, 'low');
    expect(entity.effort).toBe('low');

    const fetched = getEntity(entity.id);
    expect(fetched!.effort).toBe('low');
  });

  it('createEntity without effort + Sonnet model defaults to medium', () => {
    const entity = createEntity('Sonnet Bot', 'claude-sonnet-4-6', 'Hello.', '#00FF00');
    expect(entity.effort).toBe('medium');
  });

  it('createEntity without effort + Opus model defaults to high', () => {
    const entity = createEntity('Opus Bot', 'claude-opus-4-6', 'Hello.', '#0000FF');
    expect(entity.effort).toBe('high');
  });

  it('createEntity with max effort on Opus stores correctly', () => {
    const entity = createEntity('Max Bot', 'claude-opus-4-6', 'Think deeply.', '#FF00FF', undefined, 'max');
    expect(entity.effort).toBe('max');
  });

  it('updateEntity with effort updates and returns it', () => {
    const entity = createEntity('Update Bot', 'claude-opus-4-6', 'Hi.', '#AABBCC');
    expect(entity.effort).toBe('high');

    const updated = updateEntity(entity.id, { effort: 'low' });
    expect(updated!.effort).toBe('low');

    const fetched = getEntity(entity.id);
    expect(fetched!.effort).toBe('low');
  });

  it('rowToEntity includes effort field', () => {
    createEntity('Check Bot', 'claude-opus-4-6', 'Test.', '#112233', undefined, 'medium');
    const all = getAllEntities();
    const found = all.find((e) => e.name === 'Check Bot');
    expect(found).toBeDefined();
    expect(found!.effort).toBe('medium');
  });
});

// ── Effort: API validation ─────────────────────────────────��─

describe('Effort parameter — API validation', () => {
  it('POST /entities with effort max + Opus → 201', async () => {
    const app = createTestApp();
    const res = await app.request('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Max Entity', model: 'claude-opus-4-6', effort: 'max' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.effort).toBe('max');
  });

  it('POST /entities with effort max + Sonnet → 400', async () => {
    const app = createTestApp();
    const res = await app.request('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bad Max', model: 'claude-sonnet-4-6', effort: 'max' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('max');
  });

  it('POST /entities with invalid effort → 400', async () => {
    const app = createTestApp();
    const res = await app.request('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Invalid', model: 'claude-opus-4-6', effort: 'turbo' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('effort');
  });

  it('PATCH /entities/:id with effort max + non-Opus → 400', async () => {
    const entity = createEntity('Patch Target', 'claude-sonnet-4-6', 'Hi.', '#AABB00');

    const app = createTestApp();
    const res = await app.request(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ effort: 'max' }),
    });
    expect(res.status).toBe(400);
  });

  it('PATCH /entities/:id with effort max + model change to Sonnet → 400', async () => {
    const entity = createEntity('Model Switch', 'claude-opus-4-6', 'Deep.', '#CC0000', undefined, 'max');

    const app = createTestApp();
    // Explicitly setting effort=max alongside model change triggers validation
    const res = await app.request(`/api/entities/${entity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', effort: 'max' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /entities without effort + Sonnet defaults to medium', async () => {
    const app = createTestApp();
    const res = await app.request('/api/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Default Sonnet', model: 'claude-sonnet-4-6' }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.effort).toBe('medium');
  });
});

// ── Effort: streaming integration ────────────────────────────

describe('Effort parameter — streaming integration', () => {
  it('output_config with effort is passed in both compaction and standard paths', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );

    // Both paths should have output_config with effort
    const effortRefs = clientSource.match(/output_config:\s*\{\s*effort:\s*entity\.effort\s*\}/g);
    expect(effortRefs).not.toBeNull();
    expect(effortRefs!.length).toBeGreaterThanOrEqual(2);
  });

  it('effort is conditionally included (not passed when falsy)', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );

    // Should use conditional spread, not unconditional
    expect(clientSource).toContain('entity.effort ?');
  });
});
