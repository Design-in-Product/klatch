import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import { AVAILABLE_MODELS, MODEL_ALIASES, DEFAULT_MODEL } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

const app = new Hono();

// ── Types ────────────────────────────────────────────────────

export interface DiscoveredModel {
  id: string;
  displayName: string;
  maxOutputTokens: number;
  capabilities: {
    thinking: boolean;
    effort: string[];      // e.g. ['low', 'medium', 'high', 'max']
    compaction: boolean;
  };
}

interface ModelsCache {
  models: DiscoveredModel[];
  fetchedAt: number;
}

// ── Cache ────────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let modelsCache: ModelsCache | null = null;

// Lazy-init Anthropic client (same pattern as claude/client.ts)
let _anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

// ── Fetch + transform ────────────────────────────────────────

/** Fetch models from Anthropic API and transform to our format */
async function fetchModelsFromAPI(): Promise<DiscoveredModel[]> {
  const client = getClient();
  const response = await client.models.list({ limit: 100 });

  const models: DiscoveredModel[] = [];

  for await (const model of response) {
    // Only include Claude models (skip any non-Claude entries)
    if (!model.id.startsWith('claude-')) continue;

    // Skip alias/dated IDs — only keep the short-form IDs
    // e.g. keep 'claude-opus-4-6' but skip 'claude-opus-4-20250514'
    // Heuristic: if the ID ends with a YYYYMMDD date pattern, skip it
    if (/\d{8}$/.test(model.id)) continue;

    const caps = (model as any).capabilities || {};

    const effortLevels: string[] = [];
    if (caps.effort) {
      for (const [level, info] of Object.entries(caps.effort)) {
        if ((info as any)?.supported) effortLevels.push(level);
      }
    }

    models.push({
      id: model.id,
      displayName: model.display_name,
      maxOutputTokens: (model as any).max_tokens || 16384,
      capabilities: {
        thinking: caps.thinking?.supported ?? false,
        effort: effortLevels,
        compaction: caps.context_management?.compact_20260112?.supported ?? false,
      },
    });
  }

  return models;
}

/** Get models, using cache if fresh, falling back to hardcoded list on error */
export async function getModels(): Promise<{ models: DiscoveredModel[]; source: 'api' | 'cache' | 'fallback' }> {
  // Return cache if fresh
  if (modelsCache && Date.now() - modelsCache.fetchedAt < CACHE_TTL_MS) {
    return { models: modelsCache.models, source: 'cache' };
  }

  try {
    const models = await fetchModelsFromAPI();
    modelsCache = { models, fetchedAt: Date.now() };
    return { models, source: 'api' };
  } catch (err) {
    console.warn('Models API fetch failed, using fallback:', err instanceof Error ? err.message : err);

    // Fallback to hardcoded AVAILABLE_MODELS. Effort ladders per model family:
    // xhigh arrived with Opus 4.7 and is carried by every 4.7+ flagship
    // (Opus 5 / 4.8 / 4.7, Sonnet 5, Fable 5); Opus 4.6 stops at max; older
    // tiers stop at high. Keeps offline gating aligned with the live API.
    const FIVE_LEVEL_EFFORT = new Set([
      'claude-fable-5',
      'claude-opus-5',
      'claude-opus-4-8',
      'claude-opus-4-7',
      'claude-sonnet-5',
    ]);
    const fallback: DiscoveredModel[] = Object.entries(AVAILABLE_MODELS).map(
      ([id, info]) => ({
        id,
        displayName: `Claude ${info.label}`,
        maxOutputTokens: 16384,
        capabilities: {
          thinking: true,
          effort: FIVE_LEVEL_EFFORT.has(id)
            ? ['low', 'medium', 'high', 'xhigh', 'max']
            : id === 'claude-opus-4-6'
            ? ['low', 'medium', 'high', 'max']
            : ['low', 'medium', 'high'],
          compaction: false,
        },
      })
    );
    return { models: fallback, source: 'fallback' };
  }
}

// ── Validation against the discovered set ────────────────────
// These replace the old static `model in AVAILABLE_MODELS` gate. They go
// through getModels() (cache-preferential), so a model the picker offers is a
// model the server accepts. When the API is unreachable, getModels() returns
// the AVAILABLE_MODELS-derived fallback, so offline behavior == the old static
// set (no regression).

/** True if `id` is a currently-discoverable model (or in the offline fallback set). */
export async function isValidModel(id: string): Promise<boolean> {
  if (!id) return false;
  const { models } = await getModels();
  return models.some((m) => m.id === id);
}

/** Discovered effort levels for a model, or null if the model isn't known. */
export async function effortLevelsForModel(id: string): Promise<string[] | null> {
  const { models } = await getModels();
  const m = models.find((x) => x.id === id);
  return m ? m.capabilities.effort : null;
}

// Test seam: seed/clear the cache so validation doesn't reach for the live API
// in tests (see __tests__/setup.ts). Not used in production.
export function _setModelsCacheForTest(models: DiscoveredModel[]): void {
  modelsCache = { models, fetchedAt: Date.now() };
}
export function _clearModelsCacheForTest(): void {
  modelsCache = null;
}

// ── Routes ───────────────────────────────────────────────────

/**
 * GET /models — dynamic model list
 *
 * Returns all available Claude models with capabilities.
 * Cached for 1 hour, falls back to hardcoded list on API failure.
 *
 * Also returns `aliases` for legacy model ID mapping and
 * `defaultModel` for the recommended default.
 */
app.get('/models', async (c) => {
  const { models, source } = await getModels();

  return c.json({
    models,
    aliases: MODEL_ALIASES,
    defaultModel: DEFAULT_MODEL,
    source, // helpful for debugging: 'api', 'cache', or 'fallback'
  });
});

export const modelRoutes = app;
