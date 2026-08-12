/**
 * Round 19: AAXT Scaffolded Probing Phase 2 — full pipeline tests
 *
 * Tests the end-to-end pipeline: probe generation → agent probing → scoring → aggregation.
 * All external API calls (auxiliary LLM, Anthropic) are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import {
  createChannel,
  createProject,
  createEntity,
  assignEntityToChannel,
  setChannelProject,
} from '../db/queries.js';

// Mock the auxiliary LLM
vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'openai', model: 'gpt-4o-mini' })),
}));

// Mock the Anthropic client for stateless probing
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'The project uses TypeScript and Vitest for testing.' }],
      }),
    };
  },
}));

// Mock streaming (not used in AAXT but route file imports it)
vi.mock('../claude/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../claude/client.js')>();
  return {
    ...actual,
    streamClaude: vi.fn(),
    streamClaudeRoundtable: vi.fn(),
  };
});

import { queryAuxiliary } from '../aaxt/auxiliary.js';
import { runAAXT } from '../aaxt/runner.js';
import { Hono } from 'hono';
import { aaxtRoutes } from '../routes/aaxt.js';

const mockQueryAuxiliary = vi.mocked(queryAuxiliary);

function createTestApp() {
  const app = new Hono();
  app.route('/api', aaxtRoutes);
  return app;
}

// ── Test helpers ─────────────────────────────────────────────

/** Mock probe generation response (auxiliary LLM returns probes as JSON) */
function mockProbeGeneration(layer: string, probes: Array<{ question: string; expectedAnswer: string; directness: string }>) {
  return JSON.stringify({
    probes: probes.map((p) => ({
      question: p.question,
      expectedAnswer: p.expectedAnswer,
      layer,
      directness: p.directness,
    })),
  });
}

/** Mock scoring response (auxiliary LLM returns classification as JSON) */
function mockScoringResponse(classification: string, confidence: number, reasoning: string) {
  return JSON.stringify({ classification, confidence, reasoning });
}

function setupTestChannel() {
  // Content lengths must exceed TRIVIAL_CONTENT_THRESHOLD (40 chars) in
  // probe-generator.ts so probes are generated for each layer. Round 28
  // added the threshold to prevent false-positive Phantom scores when a
  // layer has too little content to support distinguishing probes.
  const proj = createProject(
    'AAXT Test Project',
    'Use TypeScript with strict mode. Run all tests with Vitest. Default model is Opus 4.6.',
    'native',
    {},
    'User prefers dark mode and concise code reviews. Database is SQLite at the project root.',
  );
  const ch = createChannel('aaxt-test-channel', 'Focus on quality, test coverage, and architectural review across the export pipeline.');
  setChannelProject(ch.id, proj.id);

  const entity = createEntity(
    'TestEntity',
    'claude-opus-4-6',
    'You are a helpful test assistant focused on careful analysis and concise responses.',
    '#3B82F6',
    undefined,
    'high',
  );
  assignEntityToChannel(ch.id, entity.id);

  return { proj, ch, entity };
}

// ── Runner tests ─────────────────────────────────────────────

describe('AAXT Phase 2 — runAAXT pipeline', () => {
  beforeEach(() => {
    mockQueryAuxiliary.mockReset();
  });

  it('runs the full pipeline and returns aggregated results', async () => {
    const { ch } = setupTestChannel();

    // Mock auxiliary calls: first call = probe generation, second = scoring
    let callCount = 0;
    mockQueryAuxiliary.mockImplementation(async () => {
      callCount++;
      // Probe generation calls (one per active layer)
      if (callCount <= 5) {
        return mockProbeGeneration(`L${callCount}`, [
          { question: 'What language does the project use?', expectedAnswer: 'TypeScript', directness: 'direct' },
        ]);
      }
      // Scoring calls
      return mockScoringResponse('Correct', 0.9, 'Response matches expected answer.');
    });

    const result = await runAAXT(
      ch.id,
      'You are a helpful assistant. Use TypeScript.',
      'claude-opus-4-6',
      'high',
      {
        '1_kitBriefing': 'INACTIVE — native channel',
        '2_projectInstructions': 'ACTIVE — project has instructions',
        '3_projectMemory': 'ACTIVE — project has memory',
        '4_channelAddendum': 'ACTIVE — 20 chars',
        '5_entityPrompt': 'ACTIVE — "TestEntity" (30 chars)',
      },
    );

    expect(result.channelId).toBe(ch.id);
    expect(result.targetModel).toBe('claude-opus-4-6');
    expect(result.auxiliaryModel).toBe('gpt-4o-mini');
    expect(result.layers).toHaveLength(5);
    expect(result.summary.totalProbes).toBeGreaterThan(0);
  });

  it('classifies phantom responses as fidelity failure', async () => {
    mockQueryAuxiliary.mockImplementation(async (_system: string, user: string) => {
      // Distinguish probe generation from scoring by prompt content
      if (user.includes('Generate') || user.includes('generate') || user.includes('test questions')) {
        return mockProbeGeneration('L2', [
          { question: 'Test?', expectedAnswer: 'Yes', directness: 'direct' },
        ]);
      }
      return mockScoringResponse('Phantom', 0.95, 'Agent confidently stated something false.');
    });

    const result = await runAAXT(
      'test-ch',
      'system prompt',
      'claude-opus-4-6',
      'high',
      {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — test',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'EMPTY',
        '5_entityPrompt': 'ACTIVE — test',
      },
    );

    expect(result.summary.phantomCount).toBeGreaterThan(0);
    expect(result.summary.overallFidelity).toBe('failed');
  });

  it('skips inactive layers (no probes generated)', async () => {
    mockQueryAuxiliary.mockImplementation(async () => {
      return mockProbeGeneration('L5', [
        { question: 'Test?', expectedAnswer: 'Yes', directness: 'direct' },
      ]);
    });

    const result = await runAAXT(
      'test-ch',
      'entity prompt only',
      'claude-opus-4-6',
      undefined,
      {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'EMPTY',
        '5_entityPrompt': 'ACTIVE — test',
      },
    );

    // Only L5 should have probes
    const activeLayers = result.layers.filter((l) => l.probeCount > 0);
    expect(activeLayers).toHaveLength(1);
    expect(activeLayers[0].layer).toBe('L5');
  });

  it('handles auxiliary LLM errors gracefully', async () => {
    mockQueryAuxiliary.mockRejectedValue(new Error('API quota exceeded'));

    const result = await runAAXT(
      'test-ch',
      'test prompt',
      'claude-opus-4-6',
      'high',
      {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — test',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'EMPTY',
        '5_entityPrompt': 'ACTIVE — test',
      },
    );

    // Pipeline should still return a result, with error status on affected layers
    expect(result.layers).toHaveLength(5);
    const errorLayers = result.layers.filter((l) => l.status.includes('ERROR'));
    expect(errorLayers.length).toBeGreaterThan(0);

    // Hole A (2026-08-11 server-gate-residual fix): every layer failed at
    // probe generation, so totalScored === 0 — no reading was ever taken.
    // That must report 'failed', not a silently-computed 'low' indistinguishable
    // from a surface that genuinely conveys badly.
    expect(result.summary.totalScored).toBe(0);
    expect(result.summary.overallFidelity).toBe('failed');
  });

  it('reports failed, not low, when the judge is down for every scored probe (Hole B)', async () => {
    // Probe generation succeeds; every scoring call then throws (judge outage).
    mockQueryAuxiliary.mockImplementation(async (_system: string, user: string) => {
      if (user.includes('Generate') || user.includes('generate') || user.includes('test questions')) {
        return mockProbeGeneration('L2', [
          { question: 'Test?', expectedAnswer: 'Yes', directness: 'direct' },
        ]);
      }
      throw new Error('Anthropic API error (401): judge outage');
    });

    const result = await runAAXT(
      'test-ch',
      'system prompt',
      'claude-opus-4-6',
      'high',
      {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — test',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'EMPTY',
        '5_entityPrompt': 'ACTIVE — test',
      },
    );

    // scoreResponse catches the judge-call throw internally and never rejects,
    // so every scored probe lands as Unscored, not Absent.
    expect(result.summary.totalScored).toBeGreaterThan(0);
    expect(result.summary.unscoredCount).toBe(result.summary.totalScored);
    expect(result.summary.overallFidelity).toBe('failed');
  });
});

// ── Route tests ──────────────────────────────────────────────

describe('AAXT Phase 2 — POST /channels/:id/aaxt-run', () => {
  beforeEach(() => {
    mockQueryAuxiliary.mockReset();
  });

  it('returns 404 for unknown channel', async () => {
    const app = createTestApp();
    const res = await app.request('/api/channels/nonexistent/aaxt-run', { method: 'POST' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for channel with no entities', async () => {
    const ch = createChannel('no-entity-aaxt', '');
    const { getDb: getTestDb } = await import('../db/index.js');
    getTestDb().prepare('DELETE FROM channel_entities WHERE channel_id = ?').run(ch.id);

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/aaxt-run`, { method: 'POST' });
    expect(res.status).toBe(400);
  });

  it('returns scored results for a valid channel', async () => {
    const { ch } = setupTestChannel();

    let callCount = 0;
    mockQueryAuxiliary.mockImplementation(async () => {
      callCount++;
      if (callCount <= 5) {
        return mockProbeGeneration(`L${callCount}`, [
          { question: 'Test question?', expectedAnswer: 'Expected answer', directness: 'direct' },
        ]);
      }
      return mockScoringResponse('Correct', 0.85, 'Matches expected answer.');
    });

    const app = createTestApp();
    const res = await app.request(`/api/channels/${ch.id}/aaxt-run`, { method: 'POST' });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.channelId).toBe(ch.id);
    expect(body.summary).toBeDefined();
    expect(body.summary.totalProbes).toBeGreaterThan(0);
    expect(body.layers).toBeInstanceOf(Array);
  });
});

// ── GET /aaxt/status ─────────────────────────────────────────

describe('AAXT — GET /aaxt/status', () => {
  it('returns configured status', async () => {
    const app = createTestApp();
    const res = await app.request('/api/aaxt/status');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.configured).toBe(true);
    expect(body.provider).toBe('openai');
    expect(body.model).toBe('gpt-4o-mini');
  });
});
