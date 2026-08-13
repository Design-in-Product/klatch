import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import {
  MODEL_ALIASES,
  DEFAULT_MODEL,
  buildFallbackModels,
} from '@klatch/shared';
import type { ModelId, DiscoveredModel } from '@klatch/shared';
import { defaultEffortForModel } from '../db/queries.js';

const app = new Hono();

// ── Types ────────────────────────────────────────────────────

// `DiscoveredModel` now lives in `@klatch/shared` (the client rebuilds the same
// shape offline). Re-exported so existing importers of this module are unchanged.
export type { DiscoveredModel };

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

    // Fallback to hardcoded AVAILABLE_MODELS. The per-model effort ladder now
    // lives in `@klatch/shared` — the client builds the same fallback when the
    // server itself is unreachable, and the two copies had drifted apart.
    return { models: buildFallbackModels(), source: 'fallback' };
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
 * Also returns `aliases` for legacy model ID mapping, `defaultModel` for the
 * recommended default model, and `recommendedEffort` for the effort level a
 * new entity gets when the user doesn't pick one.
 *
 * `recommendedEffort` exists so the client asks rather than assumes. The
 * editor previously read `DEFAULT_EFFORT` out of `@klatch/shared` directly,
 * which is only correct while the server's own default is that same uniform
 * constant — and `DEFAULT_EFFORT`'s doc comment names the conditions under
 * which it becomes per-model again. When that happens the server changes in
 * one place and the client follows, instead of quietly seeding new entities
 * with a value the server would not have chosen.
 */
app.get('/models', async (c) => {
  const { models, source } = await getModels();

  return c.json({
    models,
    aliases: MODEL_ALIASES,
    defaultModel: DEFAULT_MODEL,
    recommendedEffort: defaultEffortForModel(DEFAULT_MODEL),
    source, // helpful for debugging: 'api', 'cache', or 'fallback'
  });
});

export const modelRoutes = app;
