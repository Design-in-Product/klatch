/**
 * Robust JSON extraction from LLM responses.
 *
 * OpenAI's `response_format: { type: 'json_object' }` returns clean JSON, but
 * Anthropic models (used as auxiliary fallback) often wrap JSON in markdown
 * code fences (```json ... ```). This helper handles both shapes.
 *
 * Discovered as a bug during Theseus's first live AAXT run on April 26, 2026
 * (Round 28, CH1 probe generation failed under Haiku 4.5 fallback). Both
 * probe-generator.ts and scorer.ts delegate to this single implementation.
 */

/**
 * Parse JSON from an LLM response, tolerating markdown code fences.
 * Throws SyntaxError if no parseable JSON is found.
 */
export function extractJson(text: string): any {
  const trimmed = text.trim();

  // Fast path: raw JSON object or array
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }

  // Fenced JSON: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  // Last resort: try anyway (will throw with the actual content for debugging)
  return JSON.parse(trimmed);
}
