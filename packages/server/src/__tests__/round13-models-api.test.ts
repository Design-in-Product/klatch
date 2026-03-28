import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { Hono } from 'hono';

// ── Mock Anthropic client ───────────────────────────────────

const mockModelsList = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      models = {
        list: mockModelsList,
      };
    },
  };
});

// Import AFTER mocks are set up
const { modelRoutes } = await import('../routes/models.js');

function createApp() {
  const app = new Hono();
  app.route('/api', modelRoutes);
  return app;
}

// ── Fixtures ────────────────────────────────────────────────

function makeModelPage(models: any[]) {
  // Simulate the async iterable that client.models.list() returns
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < models.length) return { value: models[i++], done: false };
          return { value: undefined, done: true };
        },
      };
    },
  };
}

const MOCK_MODELS = [
  {
    id: 'claude-opus-4-6',
    display_name: 'Claude Opus 4.6',
    max_tokens: 16384,
    capabilities: {
      thinking: { supported: true },
      effort: {
        low: { supported: true },
        medium: { supported: true },
        high: { supported: true },
        max: { supported: true },
      },
      context_management: {
        compact_20260112: { supported: true },
      },
    },
  },
  {
    id: 'claude-sonnet-4-6',
    display_name: 'Claude Sonnet 4.6',
    max_tokens: 16384,
    capabilities: {
      thinking: { supported: true },
      effort: {
        low: { supported: true },
        medium: { supported: true },
        high: { supported: true },
      },
      context_management: {
        compact_20260112: { supported: true },
      },
    },
  },
  {
    id: 'claude-haiku-4-5',
    display_name: 'Claude Haiku 4.5',
    max_tokens: 8192,
    capabilities: {
      thinking: { supported: false },
      effort: {},
      context_management: {},
    },
  },
  // Dated ID that should be filtered out
  {
    id: 'claude-opus-4-20250514',
    display_name: 'Claude Opus 4 (dated)',
    max_tokens: 16384,
    capabilities: {
      thinking: { supported: true },
    },
  },
  // Non-Claude model that should be filtered out
  {
    id: 'not-claude-model',
    display_name: 'Some Other Model',
    max_tokens: 4096,
    capabilities: {},
  },
];

// ── Tests ───────────────────────────────────────────────────

describe('GET /api/models', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
    mockModelsList.mockReset();
    // Clear the module-level cache between tests by reimporting
    // We'll handle this via dynamic import reset
  });

  it('returns response shape: models, aliases, defaultModel, source', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('models');
    expect(body).toHaveProperty('aliases');
    expect(body).toHaveProperty('defaultModel');
    expect(body).toHaveProperty('source');
    expect(body.defaultModel).toBe('claude-opus-4-6');
  });

  it('each model has id, displayName, maxOutputTokens, capabilities', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    const body = await res.json();

    for (const model of body.models) {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('displayName');
      expect(model).toHaveProperty('maxOutputTokens');
      expect(model).toHaveProperty('capabilities');
      expect(model.capabilities).toHaveProperty('thinking');
      expect(model.capabilities).toHaveProperty('effort');
      expect(model.capabilities).toHaveProperty('compaction');
    }
  });

  it('filters out non-Claude models', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    const body = await res.json();

    const ids = body.models.map((m: any) => m.id);
    expect(ids).not.toContain('not-claude-model');
    expect(ids.every((id: string) => id.startsWith('claude-'))).toBe(true);
  });

  it('filters out dated model IDs (ending in YYYYMMDD)', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    const body = await res.json();

    const ids = body.models.map((m: any) => m.id);
    expect(ids).not.toContain('claude-opus-4-20250514');
    expect(ids).toContain('claude-opus-4-6');
  });

  it('transforms capabilities correctly', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    const body = await res.json();

    const opus = body.models.find((m: any) => m.id === 'claude-opus-4-6');
    expect(opus.capabilities.thinking).toBe(true);
    expect(opus.capabilities.effort).toEqual(expect.arrayContaining(['low', 'medium', 'high', 'max']));
    expect(opus.capabilities.compaction).toBe(true);

    const haiku = body.models.find((m: any) => m.id === 'claude-haiku-4-5');
    expect(haiku.capabilities.thinking).toBe(false);
    expect(haiku.capabilities.effort).toEqual([]);
    expect(haiku.capabilities.compaction).toBe(false);
  });

  it('falls back to hardcoded models when API fails', async () => {
    // Advance time past the cache TTL (1 hour) so stale cache is evicted
    vi.useFakeTimers();
    vi.advanceTimersByTime(61 * 60 * 1000);

    mockModelsList.mockImplementation(() => {
      throw new Error('API key invalid');
    });

    const res = await app.request('/api/models');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(body.models.length).toBeGreaterThan(0);
    // Fallback models should have the expected shape
    for (const model of body.models) {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('displayName');
      expect(model).toHaveProperty('capabilities');
    }

    vi.useRealTimers();
  });

  it('uses maxOutputTokens from API response', async () => {
    mockModelsList.mockReturnValue(makeModelPage(MOCK_MODELS));

    const res = await app.request('/api/models');
    const body = await res.json();

    const haiku = body.models.find((m: any) => m.id === 'claude-haiku-4-5');
    expect(haiku.maxOutputTokens).toBe(8192);
  });
});
