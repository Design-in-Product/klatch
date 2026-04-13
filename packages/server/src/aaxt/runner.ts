/**
 * AAXT Runner — Phase 2: full pipeline execution.
 *
 * Generates probes → sends each to the target agent → scores responses → aggregates.
 *
 * Uses stateless probing: calls the Anthropic API directly with the channel's
 * assembled prompt and each probe question. No messages created in DB, no
 * streaming, no channel pollution. The agent receives the same context it would
 * in a real conversation but the probe is invisible to the channel history.
 */

import Anthropic from '@anthropic-ai/sdk';
import { generateProbes, type ProbeSet, type Probe } from './probe-generator.js';
import { scoreResponse, type ScoreResult, type AXTClassification } from './scorer.js';
import { getAuxiliaryInfo } from './auxiliary.js';

// ── Types ────────────────────────────────────────────────────

export interface ProbeResult {
  probe: Probe;
  agentResponse: string;
  score: ScoreResult;
}

export interface LayerResult {
  layer: string;
  layerType: string;
  status: string;
  probeCount: number;
  results: ProbeResult[];
  dominant: AXTClassification | null;
  correct: number;
  reconstructed: number;
  confabulated: number;
  absent: number;
  phantom: number;
  subliminal: number;
}

export interface AAXTRunResult {
  channelId: string;
  runAt: string;
  auxiliaryModel: string;
  targetModel: string;
  layers: LayerResult[];
  summary: {
    totalProbes: number;
    totalScored: number;
    phantomCount: number;
    subliminalCount: number;
    overallFidelity: 'high' | 'medium' | 'low' | 'failed';
  };
}

// ── Anthropic client ─────────────────────────────────────────

let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

/**
 * Send a single probe question to an agent using a stateless API call.
 * No messages are created in the DB — this is a pure probe.
 */
async function probeAgent(
  systemPrompt: string,
  question: string,
  model: string,
  effort?: string,
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
    ...(effort ? { output_config: { effort } } : {}),
  } as any);

  // Extract text from response
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text || '';
}

// ── Pipeline ─────────────────────────────────────────────────

/**
 * Run the full AAXT pipeline on a channel.
 *
 * 1. Generate probes from prompt-debug
 * 2. For each probe, send to the target agent (stateless API call)
 * 3. Score each response
 * 4. Aggregate into per-layer results
 */
export async function runAAXT(
  channelId: string,
  assembledPrompt: string,
  targetModel: string,
  targetEffort: string | undefined,
  promptDebugLayers: Record<string, string>,
): Promise<AAXTRunResult> {
  const auxiliary = getAuxiliaryInfo();

  // Step 1: Generate probes
  const probeSet = await generateProbes(
    { channelId, layers: promptDebugLayers, assembledPrompt },
    auxiliary.model,
  );

  // Step 2+3: Probe agent and score responses
  const layerResults: LayerResult[] = [];

  for (const layerProbes of probeSet.layers) {
    const results: ProbeResult[] = [];
    const counts: Record<AXTClassification, number> = {
      Correct: 0,
      Reconstructed: 0,
      Confabulated: 0,
      Absent: 0,
      Phantom: 0,
      Subliminal: 0,
    };

    for (const probe of layerProbes.probes) {
      try {
        // Send probe to agent
        const agentResponse = await probeAgent(
          assembledPrompt,
          probe.question,
          targetModel,
          targetEffort,
        );

        // Score the response
        const score = await scoreResponse(
          probe.question,
          probe.expectedAnswer,
          agentResponse,
        );

        counts[score.classification]++;
        results.push({ probe, agentResponse, score });
      } catch (err) {
        // If the probe fails (API error, etc.), record as Absent with error
        results.push({
          probe,
          agentResponse: `[Error: ${err instanceof Error ? err.message : String(err)}]`,
          score: {
            classification: 'Absent',
            confidence: 0,
            reasoning: `Probe failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        });
        counts.Absent++;
      }
    }

    // Determine dominant classification
    let dominant: AXTClassification | null = null;
    let maxCount = 0;
    for (const [cls, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = cls as AXTClassification;
      }
    }

    layerResults.push({
      layer: layerProbes.layer,
      layerType: layerProbes.layerType,
      status: layerProbes.status,
      probeCount: layerProbes.probes.length,
      results,
      dominant: layerProbes.probes.length > 0 ? dominant : null,
      correct: counts.Correct,
      reconstructed: counts.Reconstructed,
      confabulated: counts.Confabulated,
      absent: counts.Absent,
      phantom: counts.Phantom,
      subliminal: counts.Subliminal,
    });
  }

  // Step 4: Aggregate summary
  const totalProbes = layerResults.reduce((sum, l) => sum + l.probeCount, 0);
  const totalScored = layerResults.reduce((sum, l) => sum + l.results.length, 0);
  const phantomCount = layerResults.reduce((sum, l) => sum + l.phantom, 0);
  const subliminalCount = layerResults.reduce((sum, l) => sum + l.subliminal, 0);
  const correctCount = layerResults.reduce((sum, l) => sum + l.correct + l.reconstructed, 0);

  let overallFidelity: 'high' | 'medium' | 'low' | 'failed';
  if (phantomCount > 0) {
    overallFidelity = 'failed';
  } else if (totalScored === 0) {
    overallFidelity = 'low';
  } else if (correctCount / totalScored >= 0.8) {
    overallFidelity = 'high';
  } else if (correctCount / totalScored >= 0.5) {
    overallFidelity = 'medium';
  } else {
    overallFidelity = 'low';
  }

  return {
    channelId,
    runAt: new Date().toISOString(),
    auxiliaryModel: auxiliary.model,
    targetModel,
    layers: layerResults,
    summary: {
      totalProbes,
      totalScored,
      phantomCount,
      subliminalCount,
      overallFidelity,
    },
  };
}
