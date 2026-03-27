import { useState, useEffect } from 'react';
import { fetchModels } from '../api/client';
import type { DiscoveredModel, ModelsResponse } from '../api/client';
import { AVAILABLE_MODELS } from '@klatch/shared';

/** Cached models response — shared across all hook consumers */
let cachedResponse: ModelsResponse | null = null;
let fetchPromise: Promise<ModelsResponse> | null = null;

/** Build fallback from static AVAILABLE_MODELS */
function buildFallback(): ModelsResponse {
  const models: DiscoveredModel[] = Object.entries(AVAILABLE_MODELS).map(
    ([id, info]) => ({
      id,
      displayName: `Claude ${info.label}`,
      maxOutputTokens: 16384,
      capabilities: { thinking: true, effort: ['low', 'medium', 'high'], compaction: false },
    })
  );
  return { models, aliases: {}, defaultModel: 'claude-opus-4-6', source: 'fallback' as const };
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
