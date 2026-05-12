import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import { AVAILABLE_MODELS, MODEL_ALIASES, DEFAULT_MODEL } from '@klatch/shared';
import type { ModelId } from '@klatch/shared';

const app = new Hono();

// ── Types ────────────────────────────────────────────────────

interface DiscoveredModel {
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
async function getModels(): Promise<{ models: DiscoveredModel[]; source: 'api' | 'cache' | 'fallback' }> {
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

    // Fallback to hardcoded AVAILABLE_MODELS. 4.7 surfaces 'xhigh' between high+max;
    // older models stop at 'high'.
    const fallback: DiscoveredModel[] = Object.entries(AVAILABLE_MODELS).map(
      ([id, info]) => ({
        id,
        displayName: `Claude ${info.label}`,
        maxOutputTokens: 16384,
        capabilities: {
          thinking: true,
          effort: id === 'claude-opus-4-7'
            ? ['low', 'medium', 'high', 'xhigh', 'max']
            : ['low', 'medium', 'high'],
          compaction: false,
        },
      })
    );
    return { models: fallback, source: 'fallback' };
  }
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
