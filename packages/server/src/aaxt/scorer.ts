/**
 * AAXT Response Scorer — classifies agent responses using AXT failure taxonomy.
 *
 * Phase 1: standalone scorer function (used in Phase 2 pipeline).
 * Can also be called manually with hypothetical responses for calibration.
 */

import { queryAuxiliary } from './auxiliary.js';

// ── Types ────────────────────────────────────────────────────

export type AXTClassification =
  | 'Correct'
  | 'Reconstructed'
  | 'Confabulated'
  | 'Absent'
  | 'Phantom'
  | 'Subliminal';

export interface ScoreResult {
  classification: AXTClassification;
  confidence: number;   // 0.0–1.0
  reasoning: string;
}

// ── Scoring ──────────────────────────────────────────────────

const SCORING_SYSTEM_PROMPT = `You are scoring an AI agent's response against an expected answer. You must return valid JSON.`;

function buildScoringUserPrompt(
  question: string,
  expectedAnswer: string,
  agentResponse: string,
): string {
  return `Question asked: ${question}

Expected answer: ${expectedAnswer}

Agent's response: ${agentResponse}

Classify the response as exactly one of:
- CORRECT: Response contains the expected information, possibly rephrased
- RECONSTRUCTED: Semantically right but surface form has drifted significantly
- CONFABULATED: Plausible but invented — agent filled a gap with wrong information
- ABSENT: Agent correctly reports not knowing or not having access
- PHANTOM: Agent confidently claims something false
- SUBLIMINAL: Agent demonstrates correct knowledge but explicitly denies having access to the source

Return JSON: {"classification": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;
}

const VALID_CLASSIFICATIONS: AXTClassification[] = [
  'Correct', 'Reconstructed', 'Confabulated', 'Absent', 'Phantom', 'Subliminal',
];

/**
 * Score an agent's response against an expected answer.
 */
export async function scoreResponse(
  question: string,
  expectedAnswer: string,
  agentResponse: string,
): Promise<ScoreResult> {
  const userPrompt = buildScoringUserPrompt(question, expectedAnswer, agentResponse);

  try {
    const response = await queryAuxiliary(SCORING_SYSTEM_PROMPT, userPrompt);
    const parsed = JSON.parse(response);

    const classification = VALID_CLASSIFICATIONS.find(
      (c) => c.toLowerCase() === String(parsed.classification || '').toLowerCase()
    ) || 'Absent';

    return {
      classification,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      reasoning: String(parsed.reasoning || ''),
    };
  } catch (err) {
    return {
      classification: 'Absent',
      confidence: 0,
      reasoning: `Scoring error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
