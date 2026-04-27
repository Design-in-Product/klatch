/**
 * AAXT Probe Generator — generates content-aware test questions from prompt-debug layers.
 *
 * Phase 1: generates probes only (no agent interaction).
 * Phase 2 will wire probes → target agent → scorer.
 */

import { queryAuxiliary } from './auxiliary.js';
import { extractJson } from './json-extract.js';

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

/**
 * Minimum content length (in characters) below which we treat a layer as
 * "trivially active" and skip probe generation. Default channel addenda like
 * "You are a helpful assistant." pass the ACTIVE check but contain no probe-worthy
 * content — the auxiliary model fills the gap by generating questions about other
 * layers, causing false-positive Phantom scores when scored.
 *
 * Origin: Round 28 finding (Theseus 4/26) — CH3 false-positive Phantom from
 * 28-char default L4 addendum.
 */
const TRIVIAL_CONTENT_THRESHOLD = 40;

/**
 * Parse the content-length value from a prompt-debug status string.
 * Status strings come in shapes like:
 *   "ACTIVE — from project \"Foo\" (191 chars)"
 *   "ACTIVE — 175 chars; 1 file(s) pinned"
 *   "ACTIVE — 800 chars"
 *   "ACTIVE — 1 file(s) pinned"  (no chars portion)
 *   "ACTIVE — \"Daedalus\" (322 chars)"
 * Returns the largest number found before "chars", or null if none present.
 * A null result means we cannot determine length; we fall back to ACTIVE handling.
 */
function parseStatusContentLength(status: string): number | null {
  // Look for `(N chars)` or `N chars` patterns
  const matches = [...status.matchAll(/(\d+)\s*chars?/g)];
  if (matches.length === 0) return null;
  return Math.max(...matches.map((m) => parseInt(m[1], 10)));
}

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
1. Can ONLY be answered correctly using content that originated in Layer ${layerLabel}
2. Have specific, verifiable expected answers grounded in concrete details from that layer
3. Are phrased as natural user questions (not "what does your system prompt say")
4. Vary in directness — some direct, some applied, some inferential
5. Use ONLY layer-content vocabulary in the expected answer — never reference "Layer ${layerLabel}" or "${layerType}" or other internal terminology by name. The agent does not know about layers.
6. Avoid questions whose answer could plausibly come from a different layer. If the target layer's content is too thin to support distinguishing questions, return fewer probes (or none) rather than generating questions that bleed into adjacent layers.

Full assembled system prompt:
---
${fullPrompt.slice(0, 8000)}
---

Return a JSON object with a "probes" array. Each probe has:
- "question": The question to ask the agent
- "expectedAnswer": What a correct response should contain — quote concrete content, not layer names
- "layer": "${layerLabel}"
- "directness": "direct" | "applied" | "inferential"

If the target layer cannot support ${count} distinguishing probes, return whatever number of high-quality probes you can — an empty "probes" array is acceptable.

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

    // Skip probe generation for layers with trivially small content. This
    // prevents the auxiliary model from spilling into adjacent layers when
    // the target layer has nothing layer-specific to ask about.
    const contentLength = parseStatusContentLength(status);
    if (contentLength !== null && contentLength < TRIVIAL_CONTENT_THRESHOLD) {
      layers.push({
        layer: spec.label,
        layerType: spec.type,
        status: `${status} [SKIPPED — content below ${TRIVIAL_CONTENT_THRESHOLD}-char threshold]`,
        contentLength,
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
