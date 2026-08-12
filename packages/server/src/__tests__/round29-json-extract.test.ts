/**
 * Round 29 — Regression tests for AAXT extractJson code-fence handling
 *
 * Locks in the bug fix from Round 28 (Theseus 4/26 live AAXT):
 * Haiku 4.5 (auxiliary fallback) wraps JSON in markdown code fences.
 * OpenAI's response_format: json_object had masked this — when the auxiliary
 * fell back to Anthropic, every probe-generation and scoring call failed with
 * `Unexpected token '`'`.
 *
 * Both probe-generator.ts and scorer.ts now delegate to a shared extractJson()
 * helper. These tests cover the helper directly + verify both call sites
 * tolerate code-fenced responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';
import { extractJson } from '../aaxt/json-extract.js';

// Mock auxiliary LLM — we want to control the response shape per test
vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' })),
}));

import { queryAuxiliary } from '../aaxt/auxiliary.js';
import { generateProbes } from '../aaxt/probe-generator.js';
import { scoreResponse } from '../aaxt/scorer.js';

const mockQuery = vi.mocked(queryAuxiliary);

// ═══════════════════════════════════════════════════════════════
// extractJson() unit tests
// ═══════════════════════════════════════════════════════════════

describe('extractJson — raw JSON', () => {
  it('parses a raw JSON object', () => {
    const result = extractJson('{"hello": "world"}');
    expect(result).toEqual({ hello: 'world' });
  });

  it('parses a raw JSON array', () => {
    const result = extractJson('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('tolerates leading/trailing whitespace on raw JSON', () => {
    const result = extractJson('  \n  {"a": 1}  \n  ');
    expect(result).toEqual({ a: 1 });
  });

  it('parses nested JSON correctly', () => {
    const result = extractJson('{"probes": [{"q": "test", "a": "answer"}]}');
    expect(result.probes).toHaveLength(1);
    expect(result.probes[0].q).toBe('test');
  });
});

describe('extractJson — fenced JSON (the bug we fixed)', () => {
  it('strips ```json fence', () => {
    const fenced = '```json\n{"hello": "world"}\n```';
    expect(extractJson(fenced)).toEqual({ hello: 'world' });
  });

  it('strips bare ``` fence (no json language tag)', () => {
    const fenced = '```\n{"hello": "world"}\n```';
    expect(extractJson(fenced)).toEqual({ hello: 'world' });
  });

  it('strips fence with leading commentary stripped by trim', () => {
    // Haiku sometimes prefixes with whitespace before the fence
    const fenced = '\n   ```json\n{"a": 1}\n```   \n';
    expect(extractJson(fenced)).toEqual({ a: 1 });
  });

  it('handles fenced JSON with no trailing newline before ```', () => {
    const fenced = '```json\n{"x": 42}```';
    expect(extractJson(fenced)).toEqual({ x: 42 });
  });

  it('handles fenced JSON arrays', () => {
    const fenced = '```json\n[1, 2, 3]\n```';
    expect(extractJson(fenced)).toEqual([1, 2, 3]);
  });

  it('parses a realistic Haiku-style probe-generation response', () => {
    const haikuResponse = `\`\`\`json
{
  "probes": [
    {
      "question": "What testing framework does this project use?",
      "expectedAnswer": "Vitest",
      "layer": "L2",
      "directness": "direct"
    }
  ]
}
\`\`\``;
    const parsed = extractJson(haikuResponse);
    expect(parsed.probes).toHaveLength(1);
    expect(parsed.probes[0].question).toBe('What testing framework does this project use?');
    expect(parsed.probes[0].layer).toBe('L2');
  });

  it('parses a realistic Haiku-style scoring response', () => {
    const haikuResponse = `\`\`\`json
{"classification": "Correct", "confidence": 0.95, "reasoning": "Matches expected answer."}
\`\`\``;
    const parsed = extractJson(haikuResponse);
    expect(parsed.classification).toBe('Correct');
    expect(parsed.confidence).toBe(0.95);
  });
});

describe('extractJson — error cases', () => {
  it('throws on non-JSON text with no fence', () => {
    expect(() => extractJson('this is just prose, no json here')).toThrow();
  });

  it('throws on malformed JSON inside fence', () => {
    expect(() => extractJson('```json\n{not valid json}\n```')).toThrow();
  });

  it('throws on empty string', () => {
    expect(() => extractJson('')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// Integration: probe generator tolerates fenced responses
// ═══════════════════════════════════════════════════════════════

describe('generateProbes — tolerates fenced auxiliary responses', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('successfully generates probes when auxiliary wraps response in code fence', async () => {
    // Haiku-style fenced response
    mockQuery.mockResolvedValue(`\`\`\`json
{
  "probes": [
    {"question": "What language?", "expectedAnswer": "TypeScript", "layer": "L2", "directness": "direct"}
  ]
}
\`\`\``);

    const debug = {
      channelId: 'test-ch',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — has instructions',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'Use TypeScript.',
    };

    const result = await generateProbes(debug, 'claude-haiku-4-5-20251001');
    const l2 = result.layers.find((l) => l.layer === 'L2')!;

    // Before the fix, this would have status 'ERROR — Unexpected token '`''
    expect(l2.status).not.toContain('ERROR');
    expect(l2.probes).toHaveLength(1);
    expect(l2.probes[0].question).toBe('What language?');
  });

  it('successfully generates probes when auxiliary returns raw JSON (OpenAI-style)', async () => {
    mockQuery.mockResolvedValue('{"probes": [{"question": "Q", "expectedAnswer": "A", "layer": "L2", "directness": "direct"}]}');

    const debug = {
      channelId: 'test-ch',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — has instructions',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'Use TypeScript.',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l2 = result.layers.find((l) => l.layer === 'L2')!;
    expect(l2.status).not.toContain('ERROR');
    expect(l2.probes).toHaveLength(1);
  });

  it('records ERROR when auxiliary returns unparseable response', async () => {
    mockQuery.mockResolvedValue('this is not json and has no fence');

    const debug = {
      channelId: 'test-ch',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — has instructions',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'Use TypeScript.',
    };

    const result = await generateProbes(debug, 'claude-haiku-4-5-20251001');
    const l2 = result.layers.find((l) => l.layer === 'L2')!;
    expect(l2.status).toContain('ERROR');
    expect(l2.probes).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Integration: scorer tolerates fenced responses
// ═══════════════════════════════════════════════════════════════

describe('scoreResponse — tolerates fenced auxiliary responses', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('classifies correctly when auxiliary wraps response in code fence', async () => {
    mockQuery.mockResolvedValue(`\`\`\`json
{"classification": "Correct", "confidence": 0.92, "reasoning": "Matches."}
\`\`\``);

    const result = await scoreResponse('What is X?', 'TypeScript', 'TypeScript');
    expect(result.classification).toBe('Correct');
    expect(result.confidence).toBe(0.92);
  });

  it('classifies correctly with raw JSON response (OpenAI-style)', async () => {
    mockQuery.mockResolvedValue('{"classification": "Phantom", "confidence": 0.85, "reasoning": "False claim."}');

    const result = await scoreResponse('Q', 'A', 'wrong');
    expect(result.classification).toBe('Phantom');
    expect(result.confidence).toBe(0.85);
  });

  it('falls back to Unscored classification when auxiliary returns unparseable garbage', async () => {
    mockQuery.mockResolvedValue('this is just prose');

    const result = await scoreResponse('Q', 'A', 'response');
    // Scorer's outer catch (extractJson throws on non-JSON) is an instrument
    // fault, not a behavioral reading — Unscored, not Absent. Was 'Absent'
    // until the 2026-08-11 server-gate-residual fix (Hole B); see
    // docs/plans/AAXT-SCAFFOLDED-PROBING.md.
    expect(result.classification).toBe('Unscored');
    expect(result.confidence).toBe(0);
    expect(result.reasoning).toContain('Scoring error');
  });

  it('falls back to Unscored classification when the auxiliary call itself throws', async () => {
    mockQuery.mockRejectedValue(new Error('API quota exceeded'));

    const result = await scoreResponse('Q', 'A', 'response');
    expect(result.classification).toBe('Unscored');
    expect(result.confidence).toBe(0);
    expect(result.reasoning).toContain('Scoring error');
    expect(result.reasoning).toContain('API quota exceeded');
  });
});
