/**
 * Round 39 — offline model fallback parity + `recommendedEffort` on /api/models
 *
 * Two drifts closed, both of the same class: a value the server derives, copied
 * by hand into a second place that then went stale.
 *
 * 1. **Effort ladder.** The server's offline fallback (`routes/models.ts`) was
 *    model-aware — Opus 5 / 4.8 / 4.7 / Sonnet 5 / Fable 5 carry xhigh+max,
 *    Opus 4.6 stops at max, older tiers at high. The *client's* offline
 *    fallback (`hooks/useModels.ts`) handed every model `['low','medium','high']`.
 *    `EntityManager` disables any level missing from a model's discovered
 *    ladder and only degrades to "allowed" for a model it doesn't recognise at
 *    all — so with `/api/models` unreachable the editor actively greyed out
 *    xhigh and max on Opus 5, a model that supports both. Derivation now lives
 *    once in `@klatch/shared` (`fallbackEffortLevels` / `buildFallbackModels`).
 *
 * 2. **`recommendedEffort`.** The client seeded new entities from
 *    `DEFAULT_EFFORT` imported out of `@klatch/shared` — correct only while the
 *    server's `defaultEffortForModel()` returns that same uniform constant, and
 *    `DEFAULT_EFFORT`'s own doc comment names the conditions under which it
 *    becomes per-model again. The route now publishes what that function
 *    actually returns.
 *
 * These pin the contract, not the current values: a future per-model default
 * should fail #2's parity assertion only if the wire stops matching the
 * function, not merely because the constant changed.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import './setup.js';
import { _clearModelsCacheForTest, getModels, modelRoutes } from '../routes/models.js';
import { defaultEffortForModel } from '../db/queries.js';
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL,
  buildFallbackModels,
  fallbackEffortLevels,
} from '@klatch/shared';

vi.mock('../claude/client.js', async () => {
  const actual = await vi.importActual('../claude/client.js');
  return { ...actual, streamClaude: vi.fn() };
});

// Force the fallback path explicitly. Without a key these tests already take
// it — but by accident, and an accident that reverses the day someone loads
// `.env` into the server test setup (Argus did exactly that for the client on
// 2026-08-12). Then these assertions would either fail or make billed calls.
const mockModelsList = vi.fn().mockRejectedValue(new Error('API unavailable'));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    models = { list: mockModelsList };
  },
}));

function createModelsApp() {
  const app = new Hono();
  app.route('/api', modelRoutes);
  return app;
}

afterEach(() => {
  _clearModelsCacheForTest();
});

describe('GET /api/models — recommendedEffort', () => {
  it('publishes what the server would actually assign a new entity', async () => {
    const app = createModelsApp();
    const res = await app.request('/api/models');
    expect(res.status).toBe(200);

    const body = await res.json();
    // Parity with the function, not with a re-imported constant — that is the
    // whole point of putting it on the wire.
    expect(body.recommendedEffort).toBe(defaultEffortForModel(DEFAULT_MODEL));
  });

  it('is a level the picker can actually offer', async () => {
    const app = createModelsApp();
    const body = await (await app.request('/api/models')).json();
    expect(['low', 'medium', 'high', 'xhigh', 'max']).toContain(body.recommendedEffort);
  });
});

describe('offline fallback effort ladders', () => {
  // No models cache seeded and no API key in tests, so getModels() takes the
  // fallback path for real rather than a stubbed version of it.
  it('server fallback is the shared derivation, model for model', async () => {
    const { models, source } = await getModels();
    expect(source).toBe('fallback');
    expect(models).toEqual(buildFallbackModels());
  });

  it('gives 4.7+ flagships the full five-level ladder', async () => {
    const { models } = await getModels();
    for (const id of ['claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5', 'claude-fable-5']) {
      const m = models.find((x) => x.id === id);
      expect(m, `${id} missing from fallback set`).toBeDefined();
      expect(m!.capabilities.effort).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
    }
  });

  it('stops Opus 4.6 at max and older tiers at high', async () => {
    const { models } = await getModels();
    expect(models.find((m) => m.id === 'claude-opus-4-6')!.capabilities.effort)
      .toEqual(['low', 'medium', 'high', 'max']);
    expect(models.find((m) => m.id === 'claude-sonnet-4-6')!.capabilities.effort)
      .toEqual(['low', 'medium', 'high']);
  });

  it('covers every model in the AVAILABLE_MODELS overlay', async () => {
    const { models } = await getModels();
    expect(models.map((m) => m.id).sort()).toEqual(Object.keys(AVAILABLE_MODELS).sort());
  });

  it('floors an unrecognised model at three levels rather than inventing capability', () => {
    // Unknown → allowed-but-modest; server-side validation is the real backstop.
    expect(fallbackEffortLevels('claude-opus-9')).toEqual(['low', 'medium', 'high']);
  });

  it('never offers a level outside the EffortLevel union', () => {
    const union = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
    for (const m of buildFallbackModels()) {
      for (const level of m.capabilities.effort) expect(union.has(level)).toBe(true);
    }
  });
});
