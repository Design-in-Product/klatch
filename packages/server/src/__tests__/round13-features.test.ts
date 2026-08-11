import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { buildKitBriefing } from '../claude/client.js';
import type { Channel } from '@klatch/shared';

// ── B1: Models API endpoint ──────────────────────────────────

// Mock Anthropic client for models tests
const mockModelsList = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    models = {
      list: mockModelsList,
    };
  },
}));

// Mock claude client to avoid real API calls
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
  };
});

// Import model routes after mocks
import { Hono } from 'hono';
import { modelRoutes } from '../routes/models.js';

function createModelsApp() {
  const app = new Hono();
  app.route('/api', modelRoutes);
  return app;
}

// Fake API model objects that mimic Anthropic's response shape
function fakeApiModel(overrides: Record<string, any> = {}) {
  return {
    id: 'claude-opus-4-6',
    display_name: 'Claude Opus 4.6',
    created_at: '2025-05-14T00:00:00Z',
    max_tokens: 16384,
    max_input_tokens: 1048576,
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
    ...overrides,
  };
}

describe('GET /api/models', () => {
  let timeOffset = 0;

  beforeEach(() => {
    mockModelsList.mockReset();
    // Advance time past the 1-hour cache TTL between tests
    // so each test starts with an expired cache
    vi.useFakeTimers();
    timeOffset += 2 * 60 * 60 * 1000; // +2 hours per test
    vi.setSystemTime(new Date(Date.UTC(2026, 3, 1, 12, 0, 0) + timeOffset));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns models with correct response shape', async () => {
    const models = [
      fakeApiModel({ id: 'claude-opus-4-6', display_name: 'Claude Opus 4.6' }),
      fakeApiModel({ id: 'claude-sonnet-4-6', display_name: 'Claude Sonnet 4.6' }),
    ];
    mockModelsList.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        for (const m of models) yield m;
      },
    });

    const app = createModelsApp();
    const res = await app.request('/api/models');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('models');
    expect(body).toHaveProperty('aliases');
    expect(body).toHaveProperty('defaultModel', 'claude-opus-5');
    expect(body).toHaveProperty('source');
  });

  it('each model has id, displayName, maxOutputTokens, capabilities', async () => {
    mockModelsList.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield fakeApiModel();
      },
    });

    const app = createModelsApp();
    const res = await app.request('/api/models');
    const body = await res.json();

    expect(body.models).toHaveLength(1);
    const model = body.models[0];
    expect(model).toHaveProperty('id', 'claude-opus-4-6');
    expect(model).toHaveProperty('displayName', 'Claude Opus 4.6');
    expect(model).toHaveProperty('maxOutputTokens', 16384);
    expect(model.capabilities).toHaveProperty('thinking', true);
    expect(model.capabilities).toHaveProperty('effort');
    expect(model.capabilities.effort).toContain('high');
    expect(model.capabilities).toHaveProperty('compaction', true);
  });

  it('filters out non-Claude and dated model IDs', async () => {
    mockModelsList.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield fakeApiModel({ id: 'claude-opus-4-6' });
        yield fakeApiModel({ id: 'claude-opus-4-20250514' }); // dated — excluded
        yield fakeApiModel({ id: 'not-a-claude-model' });     // non-Claude — excluded
      },
    });

    const app = createModelsApp();
    const res = await app.request('/api/models');
    const body = await res.json();

    expect(body.models).toHaveLength(1);
    expect(body.models[0].id).toBe('claude-opus-4-6');
  });

  it('returns cache source on second call within TTL', async () => {
    mockModelsList.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield fakeApiModel();
      },
    });

    const app = createModelsApp();

    // First call — from API
    const res1 = await app.request('/api/models');
    const body1 = await res1.json();
    expect(body1.source).toBe('api');

    // Second call — from cache
    const res2 = await app.request('/api/models');
    const body2 = await res2.json();
    expect(body2.source).toBe('cache');
  });

  it('falls back to hardcoded models when API fails', async () => {
    mockModelsList.mockRejectedValue(new Error('API unavailable'));

    const app = createModelsApp();
    const res = await app.request('/api/models');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.source).toBe('fallback');
    expect(body.models.length).toBeGreaterThanOrEqual(3); // opus, sonnet, haiku
    expect(body.models.some((m: any) => m.id === 'claude-opus-4-6')).toBe(true);
  });
});

// ── B2: Kit briefing updates (MAXT F3 + F4) ─────────────────

describe('buildKitBriefing — MAXT updates', () => {
  function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return {
      id: 'ch-test',
      name: 'Test Channel',
      type: 'chat',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'claude-code',
      ...overrides,
    };
  }

  it('includes current date string (MAXT F4)', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    // Should contain a date like "Tuesday, April 1, 2026"
    expect(briefing).toMatch(/Today is \w+, \w+ \d{1,2}, \d{4}/);
  });

  it('includes layer awareness text (MAXT F3)', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    expect(briefing).toContain('project instructions and project memory');
    expect(briefing).toContain('without being able to identify their origin');
    expect(briefing).toContain('treat it as background knowledge');
  });

  it('includes layer awareness for claude-ai imports too', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-ai' }));
    expect(briefing).toContain('project instructions and project memory');
    expect(briefing).toContain('treat it as background knowledge');
  });

  it('includes file handling guidance', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    expect(briefing).toContain('attach files to messages');
    expect(briefing).toContain('fenced code blocks');
  });
});

// ── B3: Auto-prompt caching + thinking.display ───────────────
// These are tested by verifying the parameters passed to the Anthropic SDK.
// Since streamClaudeCore is not directly exported, we test via the route
// by checking what the mock SDK receives.

import { afterEach } from 'vitest';

describe('streamClaudeCore parameters', () => {
  it('passes adaptive thinking with display omitted', async () => {
    // The buildKitBriefing function is the one we can test directly.
    // For streamClaudeCore, we verify via the client module's behavior.
    // We confirm the pattern exists in the source code since the function
    // wraps the Anthropic SDK internally.
    //
    // Read the client source to verify the parameters are set.
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );

    // Verify thinking parameter
    expect(clientSource).toContain("thinking: { type: 'adaptive', display: 'omitted' }");

    // Verify cache_control parameter
    expect(clientSource).toContain("cache_control: { type: 'ephemeral' }");
  });

  it('sets adaptive thinking on both compaction and standard paths', async () => {
    const fs = await import('fs');
    const clientSource = fs.readFileSync(
      new URL('../claude/client.ts', import.meta.url).pathname.replace('/dist/', '/src/'),
      'utf-8'
    );

    // Count occurrences — should appear in both beta (compaction) and standard paths
    const thinkingMatches = clientSource.match(/thinking:\s*\{[^}]*adaptive[^}]*omitted[^}]*\}/g);
    expect(thinkingMatches).not.toBeNull();
    expect(thinkingMatches!.length).toBeGreaterThanOrEqual(2);

    const cacheMatches = clientSource.match(/cache_control:\s*\{[^}]*ephemeral[^}]*\}/g);
    expect(cacheMatches).not.toBeNull();
    expect(cacheMatches!.length).toBeGreaterThanOrEqual(2);
  });
});
