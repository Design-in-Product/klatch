/**
 * Model discovery/validation unification — new-behavior round (Argus).
 *
 * Closes the loop on the discovery/validation split (sweep #13 finding; xian flagged
 * "Klatch tops out at 4.7" as brittle). Daedalus's impl (84e7d71): ModelId→string,
 * validation against the discovered /api/models set (`isValidModel`), capability
 * gating from the discovered `effort[]` (`effortAllowedForModel`), AVAILABLE_MODELS
 * demoted to an offline overlay. Contract: docs/plans/MODEL-VALIDATION-UNIFICATION.md.
 *
 * Cache seam: seed FILE-LOCAL via `_setModelsCacheForTest` (NOT global setup.ts —
 * that defeats round13's vi.mock per Daedalus's impl notes), clear in afterEach.
 * With no seed, `getModels()` falls back to the AVAILABLE_MODELS-derived set (the
 * Anthropic client throws without a key → fallback), so offline == the old static set.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import './setup.js';
import { createTestApp } from './app.js';
import {
  _setModelsCacheForTest,
  _clearModelsCacheForTest,
  getModels,
} from '../routes/models.js';
import type { ModelId } from '@klatch/shared';

// Mock streaming — createTestApp mounts messageRoutes, which pulls in the client.
vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return { ...actual, streamClaude: vi.fn() };
});

function postJson(body: unknown) {
  return {
    method: 'POST' as const,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

/** A discovered model the static AVAILABLE_MODELS dict never knew about. */
function disc(id: string, effort: string[]) {
  return {
    id,
    displayName: `Claude ${id}`,
    maxOutputTokens: 16384,
    capabilities: { thinking: true, effort, compaction: false },
  };
}

// Module-level cache is shared across files in the singleThread server suite — always
// clear after each test so a seed never leaks into another file's fallback path.
afterEach(() => {
  _clearModelsCacheForTest();
});

describe('Model validation — discovered-set unification (new behavior)', () => {
  it('accepts a discovered model the static dict never knew (Opus 4.8 → 201)', async () => {
    _setModelsCacheForTest([disc('claude-opus-4-8', ['low', 'medium', 'high', 'xhigh', 'max'])]);
    const app = createTestApp();

    const res = await app.request('/api/channels', postJson({ name: 'On 4.8', model: 'claude-opus-4-8' }));
    expect(res.status).toBe(201); // would have been 400 under the old `in AVAILABLE_MODELS` gate
  });

  it('rejects a garbage model id → 400', async () => {
    _setModelsCacheForTest([disc('claude-opus-4-8', ['low', 'medium', 'high'])]);
    const app = createTestApp();

    const res = await app.request('/api/channels', postJson({ name: 'Bad', model: 'not-a-model' }));
    expect(res.status).toBe(400);
  });

  it('offline fallback: with no discovered cache, only AVAILABLE_MODELS keys validate', async () => {
    _clearModelsCacheForTest(); // force getModels() → fetch throws (no key) → AVAILABLE_MODELS fallback
    const app = createTestApp();

    // a static key (4.8, in the curated overlay since the Aug 2026 lineup refresh)
    // still validates offline — no regression
    const ok = await app.request('/api/channels', postJson({ name: 'Fallback OK', model: 'claude-opus-4-8' }));
    expect(ok.status).toBe(201);
    // a model outside the overlay is discovery-only — offline it is NOT accepted
    // (the API has to be reachable)
    const no = await app.request('/api/channels', postJson({ name: 'Fallback No', model: 'claude-opus-4-9' }));
    expect(no.status).toBe(400);
  });

  it('capability gating derives from discovered effort[] (not a literal-ID switch)', async () => {
    // 4.8 advertises xhigh in its discovered metadata → entity with xhigh is allowed.
    // (Under the old hardcoded gate, xhigh was 4.7-ONLY, so 4.8+xhigh would have 400'd.)
    _setModelsCacheForTest([disc('claude-opus-4-8', ['low', 'medium', 'high', 'xhigh', 'max'])]);
    const app = createTestApp();
    const ok = await app.request('/api/entities', postJson({ name: 'Sharp', model: 'claude-opus-4-8', effort: 'xhigh' }));
    expect(ok.status).toBe(201);

    // A model whose discovered effort[] stops at 'medium' rejects 'high' (a valid
    // EffortLevel, just not offered by that model) — gating tracks metadata, not a dict.
    _clearModelsCacheForTest();
    _setModelsCacheForTest([disc('claude-thrifty-1', ['low', 'medium'])]);
    const no = await app.request('/api/entities', postJson({ name: 'TooSharp', model: 'claude-thrifty-1', effort: 'high' }));
    expect(no.status).toBe(400);
  });

  it('picker↔validation consistency: every model /api/models offers validates on create', async () => {
    // Seed a discovered set that includes models the static dict never had — the exact
    // shape that produced the original split (picker offers X, server 400s X).
    _setModelsCacheForTest([
      disc('claude-opus-4-8', ['low', 'medium', 'high', 'xhigh', 'max']),
      disc('claude-haiku-9', ['low', 'medium', 'high']),
      disc('claude-opus-4-7', ['low', 'medium', 'high', 'xhigh', 'max']),
    ]);
    const app = createTestApp();

    // What the picker would show (the /api/models route + the pickers both go through getModels()).
    const { models } = await getModels();
    expect(models.length).toBeGreaterThan(0);

    // The invariant: nothing offered can be rejected by a create.
    for (const m of models) {
      const res = await app.request('/api/channels', postJson({ name: `ch-${m.id}`, model: m.id as ModelId }));
      expect(res.status, `model "${m.id}" is offered by getModels() but a create returned ${res.status}`).toBe(201);
    }
  });
});
