/**
 * Round 30 — Probe content-length threshold (Round 28 Finding 2)
 *
 * Yesterday's CH3 false-positive Phantom: a 28-char default L4 addendum
 * ("You are a helpful assistant.") passed the ACTIVE check, the auxiliary
 * model generated questions about general project context (which the agent
 * answered from L2), and the scorer flagged the response as Phantom because
 * the probe's expected answer referenced "Layer L4 Channel Addendum" by name.
 *
 * Two-part fix tested here:
 *   1. parseStatusContentLength — pulls "(N chars)" or "N chars" from prompt-debug status
 *   2. Probe generator skips layers below TRIVIAL_CONTENT_THRESHOLD (40 chars)
 *
 * Prompt wording change (avoid layer-name leakage in expected answers, allow
 * empty probes when content is thin) is verified at the call-site level — we
 * check that the prompt sent to queryAuxiliary contains the new instructions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import './setup.js';

vi.mock('../aaxt/auxiliary.js', () => ({
  queryAuxiliary: vi.fn(),
  getAuxiliaryInfo: vi.fn(() => ({ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' })),
}));

import { queryAuxiliary } from '../aaxt/auxiliary.js';
import { generateProbes } from '../aaxt/probe-generator.js';

const mockQuery = vi.mocked(queryAuxiliary);

function fenceJson(probes: Array<{ question: string; expectedAnswer: string; layer: string; directness: string }>) {
  return JSON.stringify({ probes });
}

// ═══════════════════════════════════════════════════════════════
// Threshold behavior — layer skipping
// ═══════════════════════════════════════════════════════════════

describe('probe generator — content-length threshold', () => {
  beforeEach(() => mockQuery.mockReset());

  it('skips L4 when addendum is below threshold (default "helpful assistant" addendum)', async () => {
    mockQuery.mockResolvedValue(fenceJson([
      { question: 'Q?', expectedAnswer: 'A', layer: 'L4', directness: 'direct' },
    ]));

    const debug = {
      channelId: 'ch-thin-l4',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'ACTIVE — 28 chars', // below 40-char threshold
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'You are a helpful assistant.',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l4 = result.layers.find((l) => l.layer === 'L4')!;

    expect(l4.probes).toHaveLength(0);
    expect(l4.status).toContain('SKIPPED');
    expect(l4.status).toContain('40-char threshold');
    expect(l4.contentLength).toBe(28);
  });

  it('does NOT skip L4 when addendum is above threshold', async () => {
    mockQuery.mockResolvedValue(fenceJson([
      { question: 'Q?', expectedAnswer: 'A', layer: 'L4', directness: 'direct' },
    ]));

    const debug = {
      channelId: 'ch-rich-l4',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'ACTIVE — 175 chars; 1 file(s) pinned',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'A substantial L4 addendum with specific content...',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l4 = result.layers.find((l) => l.layer === 'L4')!;

    expect(l4.probes.length).toBeGreaterThan(0);
    expect(l4.status).not.toContain('SKIPPED');
  });

  it('skips L5 when entity prompt is below threshold (e.g., "You are Claude.")', async () => {
    mockQuery.mockResolvedValue(fenceJson([
      { question: 'Q?', expectedAnswer: 'A', layer: 'L5', directness: 'direct' },
    ]));

    // AAXT route format: 'ACTIVE — "Name" (N chars)'
    const debug = {
      channelId: 'ch-thin-l5',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'ACTIVE — "Claude" (16 chars)',
      },
      assembledPrompt: 'You are Claude.',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l5 = result.layers.find((l) => l.layer === 'L5')!;

    expect(l5.probes).toHaveLength(0);
    expect(l5.status).toContain('SKIPPED');
  });

  it('parses status with multiple "chars" mentions (memory + KB files) using max length', async () => {
    mockQuery.mockResolvedValue(fenceJson([
      { question: 'Q?', expectedAnswer: 'A', layer: 'L3', directness: 'direct' },
    ]));

    // L3 status with both memory and file listings — should pick the larger value
    const debug = {
      channelId: 'ch-l3-mixed',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'ACTIVE — 200 chars; 1 knowledge base file(s): foo.md',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'project memory content here',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l3 = result.layers.find((l) => l.layer === 'L3')!;
    expect(l3.probes.length).toBeGreaterThan(0); // 200 chars >> 40 threshold
    expect(l3.status).not.toContain('SKIPPED');
  });

  it('does not skip when status has no parseable char count (file-only L4)', async () => {
    mockQuery.mockResolvedValue(fenceJson([
      { question: 'Q?', expectedAnswer: 'A', layer: 'L4', directness: 'direct' },
    ]));

    // L4 with only file pins, no addendum text — no "chars" in status
    const debug = {
      channelId: 'ch-files-only',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'ACTIVE — 2 file(s) pinned: spec.md, notes.txt',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'Channel files available:\n- spec.md\n- notes.txt',
    };

    const result = await generateProbes(debug, 'gpt-4o-mini');
    const l4 = result.layers.find((l) => l.layer === 'L4')!;
    // No char count parseable → don't skip → probes generated
    expect(l4.probes.length).toBeGreaterThan(0);
    expect(l4.status).not.toContain('SKIPPED');
  });

  it('does not call auxiliary LLM for skipped layers (cost optimization)', async () => {
    const debug = {
      channelId: 'ch-all-thin',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'INACTIVE',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'ACTIVE — 20 chars',
        '5_entityPrompt': 'ACTIVE — "X" (10 chars)',
      },
      assembledPrompt: 'tiny',
    };

    await generateProbes(debug, 'gpt-4o-mini');
    // Both layers skipped → zero auxiliary calls
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// Prompt wording — anti-leakage instructions
// ═══════════════════════════════════════════════════════════════

describe('probe generator — anti-leakage prompt wording', () => {
  beforeEach(() => mockQuery.mockReset());

  it('instructs auxiliary model to avoid layer-name terminology in expected answers', async () => {
    mockQuery.mockResolvedValue(fenceJson([]));

    const debug = {
      channelId: 'ch-prompt-check',
      layers: {
        '1_kitBriefing': 'INACTIVE',
        '2_projectInstructions': 'ACTIVE — from project "Test" (200 chars)',
        '3_projectMemory': 'INACTIVE',
        '4_channelAddendum': 'INACTIVE',
        '5_entityPrompt': 'INACTIVE',
      },
      assembledPrompt: 'Project instructions content here'.padEnd(200, '.'),
    };

    await generateProbes(debug, 'gpt-4o-mini');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const userPrompt = mockQuery.mock.calls[0][1];
    // The new instructions should appear in the prompt sent to auxiliary
    expect(userPrompt).toContain('never reference');
    expect(userPrompt).toContain('agent does not know about layers');
    expect(userPrompt).toContain('bleed into adjacent layers');
    expect(userPrompt).toContain('empty "probes" array is acceptable');
  });
});
