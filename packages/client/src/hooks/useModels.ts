import { useState, useEffect } from 'react';
import { fetchModels } from '../api/client';
import type { ModelsResponse } from '../api/client';
import { AVAILABLE_MODELS, DEFAULT_MODEL, DEFAULT_EFFORT, buildFallbackModels } from '@klatch/shared';

/** Cached models response — shared across all hook consumers */
let cachedResponse: ModelsResponse | null = null;
let fetchPromise: Promise<ModelsResponse> | null = null;

/**
 * Build the offline model set when the server can't be reached.
 *
 * Derived from `@klatch/shared` so it matches the server's own offline
 * fallback. It used to be a local copy that gave *every* model
 * `['low','medium','high']`; because `EntityManager` disables any level absent
 * from a model's discovered ladder — and only degrades to "allowed" for a model
 * it doesn't recognise at all — that copy actively greyed out xhigh and max on
 * Opus 5 whenever `/api/models` failed. A wrong entry is worse than none.
 */
function buildFallback(): ModelsResponse {
  return {
    models: buildFallbackModels(),
    aliases: {},
    defaultModel: DEFAULT_MODEL,
    recommendedEffort: DEFAULT_EFFORT,
    source: 'fallback' as const,
  };
}

/**
 * Hook: fetch available models from the server.
 * Caches the result in memory — only one API call per app session.
 * Falls back to the hardcoded AVAILABLE_MODELS on error.
 */
export function useModels() {
  const [data, setData] = useState<ModelsResponse>(cachedResponse ?? buildFallback());
  const [loading, setLoading] = useState(!cachedResponse);

  useEffect(() => {
    if (cachedResponse) return; // Already fetched

    if (!fetchPromise) {
      fetchPromise = fetchModels().catch(() => {
        console.warn('Models API unavailable, using fallback');
        return buildFallback();
      });
    }

    fetchPromise.then((response) => {
      cachedResponse = response;
      setData(response);
      setLoading(false);
    });
  }, []);

  return { ...data, loading };
}

/**
 * Get display name for a model ID.
 * Checks dynamic models first, then static AVAILABLE_MODELS, then returns the raw ID.
 */
export function getModelLabel(modelId: string): string {
  if (cachedResponse) {
    const found = cachedResponse.models.find((m) => m.id === modelId);
    if (found) return found.displayName.replace('Claude ', '');
  }
  const staticEntry = AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS];
  if (staticEntry) return staticEntry.label;
  return modelId;
}
