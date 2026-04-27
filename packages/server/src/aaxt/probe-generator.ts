/**
 * AAXT Probe Generator — generates content-aware test questions from prompt-debug layers.
 *
 * Phase 1: generates probes only (no agent interaction).
 * Phase 2 will wire probes → target agent → scorer.
 */

import { queryAuxiliary } from './auxiliary.js';

// ── Types ────────────────────────────────────────────────────

export type ProbeClassification = 'standard' | 'known_pathological' | 'placeholder';

export interface Probe {
  question: string;
  expectedAnswer: string;
  layer: string;         // "L1", "L2", etc.
  directness: 'direct' | 'applied' | 'inferential';
  classification?: ProbeClassification; // default: 'standard'
}

export interface ProbeSet {
  channelId: string;
  generatedAt: string;
  auxiliaryModel: string;
  layers: LayerProbes[];
}

export interface LayerProbes {
  layer: string;
  layerType: string;
  status: string;        // from prompt-debug (ACTIVE, EMPTY, INACTIVE)
  contentLength: number;
  probes: Probe[];
}

// ── Layer config ─────────────────────────────────────────────

interface LayerSpec {
  key: string;           // prompt-debug key (e.g., "1_kitBriefing")
  label: string;         // "L1"
  type: string;          // "Kit Briefing"
  defaultProbeCount: number;
}

const LAYER_SPECS: LayerSpec[] = [
  { key: '1_kitBriefing', label: 'L1', type: 'Kit Briefing', defaultProbeCount: 3 },
  { key: '2_projectInstructions', label: 'L2', type: 'Project Instructions', defaultProbeCount: 5 },
  { key: '3_projectMemory', label: 'L3', type: 'Project Memory', defaultProbeCount: 5 },
  { key: '4_channelAddendum', label: 'L4', type: 'Channel Addendum', defaultProbeCount: 3 },
  { key: '5_entityPrompt', label: 'L5', type: 'Entity Prompt', defaultProbeCount: 3 },
];

// ── Prompt-debug parsing ─────────────────────────────────────

interface PromptDebugResponse {
  channelId: string;
  layers: Record<string, string>;
  assembledPrompt: string;
}

/**
 * Extract per-layer content from the assembled prompt.
 * Uses the layer status from prompt-debug to determine which layers are active,
 * then extracts content by splitting the assembled prompt at layer boundaries.
 */
function extractLayerContent(debug: PromptDebugResponse): Map<string, string> {
  const result = new Map<string, string>();

  // The assembled prompt is the concatenation of active layers joined by \n\n.
  // We can't perfectly split it back apart, but for probe generation we can
  // send the full assembled prompt with layer-type hints — the auxiliary model
  // doesn't need exact boundaries, it needs representative content.
  //
  // For now, send the full assembled prompt and let the aux model know which
  // layers are active. This is simpler and more robust than regex splitting.

  for (const spec of LAYER_SPECS) {
    const status = debug.layers[spec.key] || '';
    if (status.startsWith('ACTIVE')) {
      // Mark as active — content will come from the full prompt
      result.set(spec.key, status);
    }
  }

  return result;
}

// ── JSON extraction ─────────────────────────────────────────

/** Strip markdown code fences from LLM responses before JSON.parse. */
function extractJson(text: string): any {
  // Try raw parse first
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  // Strip ```json ... ``` fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  // Last resort
  return JSON.parse(trimmed);
}

// ── Generation ───────────────────────────────────────────────

const GENERATION_SYSTEM_PROMPT = `You are generating test questions for an AI agent evaluation. You must return valid JSON.`;

function buildGenerationUserPrompt(
  layerLabel: string,
  layerType: string,
  fullPrompt: string,
  layerStatus: string,
  count: number,
): string {
  return `Given the following system prompt that has been assembled for an AI agent, generate ${count} questions that test whether the agent has access to Layer ${layerLabel} (${layerType}) content.

Layer status: ${layerStatus}

The questions should:
1. Can ONLY be answered correctly if the agent has access to this layer's content
2. Have specific, verifiable expected answers
3. Are phrased as natural user questions (not "what does your system prompt say")
4. Vary in directness — some should ask directly, others should require the agent to apply the knowledge

Full assembled system prompt:
---
${fullPrompt.slice(0, 8000)}
---

Return a JSON object with a "probes" array. Each probe has:
- "question": The question to ask the agent
- "expectedAnswer": What a correct response should contain (be specific)
- "layer": "${layerLabel}"
- "directness": "direct" | "applied" | "inferential"

Example format:
{"probes": [{"question": "...", "expectedAnswer": "...", "layer": "${layerLabel}", "directness": "direct"}]}`;
}

/**
 * Generate probes for all active layers in a channel.
 */
export async function generateProbes(
  debug: PromptDebugResponse,
  auxiliaryModel: string,
): Promise<ProbeSet> {
  const activeLayers = extractLayerContent(debug);
  const layers: LayerProbes[] = [];

  for (const spec of LAYER_SPECS) {
    const status = debug.layers[spec.key] || 'INACTIVE';
    const isActive = activeLayers.has(spec.key);

    if (!isActive) {
      layers.push({
        layer: spec.label,
        layerType: spec.type,
        status,
        contentLength: 0,
        probes: [],
      });
      continue;
    }

    const userPrompt = buildGenerationUserPrompt(
      spec.label,
      spec.type,
      debug.assembledPrompt,
      status,
      spec.defaultProbeCount,
    );

    try {
      const response = await queryAuxiliary(GENERATION_SYSTEM_PROMPT, userPrompt);
      const parsed = extractJson(response);
      const probes: Probe[] = (parsed.probes || []).map((p: any) => ({
        question: String(p.question || ''),
        expectedAnswer: String(p.expectedAnswer || p.expected_answer || ''),
        layer: spec.label,
        directness: ['direct', 'applied', 'inferential'].includes(p.directness)
          ? p.directness
          : 'direct',
      }));

      layers.push({
        layer: spec.label,
        layerType: spec.type,
        status,
        contentLength: debug.assembledPrompt.length,
        probes,
      });
    } catch (err) {
      // If generation fails for a layer, record it with zero probes
      layers.push({
        layer: spec.label,
        layerType: spec.type,
        status: `ERROR — ${err instanceof Error ? err.message : String(err)}`,
        contentLength: 0,
        probes: [],
      });
    }
  }

  return {
    channelId: debug.channelId,
    generatedAt: new Date().toISOString(),
    auxiliaryModel,
    layers,
  };
}
