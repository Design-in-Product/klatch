/**
 * Canonical context package builder — Step 10 Phase 1 format.
 *
 * Single source of truth for the manifest structure produced by the HTTP export
 * route (Phase 2) and the MCP server (Phase 5). Both callers assemble the same
 * package; this module encapsulates that shape so they cannot drift apart.
 *
 * See docs/plans/STEP-10-PHASE-1-PACKAGE-FORMAT.md for the protocol spec.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Channel, Entity, Message, Project, FileWithRef, MicroReflection } from '@klatch/shared';
import type { FieldNote } from './briefing.js';

/**
 * The current canonical format version. Bump when the envelope changes shape.
 * MCP clients may request a specific version; the server serves the highest
 * supported version ≤ requested.
 */
export const FORMAT_VERSION = '1.0.0';

/**
 * List of format versions this build supports serving. For Phase 5a there is
 * exactly one entry; in the future the server may support multiple to allow
 * graceful degradation for older clients.
 */
export const SUPPORTED_FORMAT_VERSIONS = ['1.0.0'];

export interface BuildManifestInput {
  packageId: string;
  createdAt: string;
  channel: Channel;
  project: Project | null;
  entities: Entity[];
  channelFiles: FileWithRef[];
  projectFiles: FileWithRef[];
  messages: Message[];
  entityFieldNotes?: Map<string, FieldNote[]>;
}

export function buildManifest(input: BuildManifestInput): any {
  const { packageId, createdAt, channel, project, entities, channelFiles, projectFiles, messages, entityFieldNotes } = input;

  const instructionsLength = project?.instructions?.trim().length || 0;
  const memoryLength = project?.memory?.trim().length || 0;
  const contextLength = channel.systemPrompt?.trim().length || 0;

  // Build provenance chain
  const provenance: any[] = [];

  // If imported, the original source is the first hop
  if (channel.source && channel.source !== 'native') {
    const meta = parseSourceMetadata(channel.sourceMetadata);
    provenance.push({
      event_id: uuidv4(),
      source: channel.source,
      at: meta?.importedAt || meta?.firstTimestamp || createdAt,
      summary: `Original ${channel.source === 'claude-code' ? 'Claude Code' : 'claude.ai'} session`,
      ...(meta?.cwd ? { path: meta.cwd } : {}),
      ...(meta?.originalSessionId ? { session_id: meta.originalSessionId } : {}),
      ...(meta?.originalProjectUuid ? { project_uuid: meta.originalProjectUuid } : {}),
      layer_fidelity: null,
      integrity: null,
    });
  }

  // The current export is the last hop
  provenance.push({
    event_id: uuidv4(),
    source: 'klatch',
    at: createdAt,
    summary: 'Exported from Klatch',
    instance: 'klatch-local',
    channel_id: channel.id,
    layer_fidelity: {
      L1: channel.source !== 'native' ? 'full' : 'absent',
      L2: instructionsLength > 0 ? 'full' : 'absent',
      L3: memoryLength > 0 || projectFiles.length > 0 ? 'full' : 'absent',
      L4: contextLength > 0 || channelFiles.length > 0 ? 'full' : 'absent',
      L5: 'full',
    },
    integrity: null,
  });

  // Build file entries
  const allFiles = [...projectFiles, ...channelFiles];
  const fileEntries = allFiles.map((f) => ({
    id: f.id,
    name: f.name,
    mime_type: f.mimeType,
    size_bytes: f.sizeBytes,
    length_chars: f.sizeBytes, // approximation for binary; exact for UTF-8 text
    ref: `files/${f.id}_${f.name}`,
    scope: f.scope,
    scope_id: f.scopeId,
    ref_type: f.refType,
    added_at: f.addedAt,
    source: f.addedBy || 'unknown',
    trust: 'unattributed',
  }));

  // Deduplicate files that appear at both project and channel scope
  const seenFileIds = new Set<string>();
  const dedupedFiles = fileEntries.filter((f) => {
    if (seenFileIds.has(f.id)) return false;
    seenFileIds.add(f.id);
    return true;
  });

  // Compaction state
  let compactionState = null;
  if (channel.compactionState) {
    try {
      const parsed = JSON.parse(channel.compactionState);
      compactionState = {
        summary: parsed.summary,
        before_message_id: parsed.beforeMessageId,
        compacted_at: parsed.timestamp,
      };
    } catch { /* ignore malformed */ }
  }

  return {
    format_version: FORMAT_VERSION,
    source_type: 'klatch',
    package_id: packageId,
    package_kind: 'klatch.context.v1',
    created_at: createdAt,

    provenance,

    project: project ? {
      id: project.id,
      name: project.name,
      instructions: {
        ref: 'layer_2_instructions.md',
        length_chars: instructionsLength,
      },
      memory: {
        ref: 'layer_3_memory.md',
        length_chars: memoryLength,
        memory_format: 'flat',
      },
      knowledge_base_file_ids: projectFiles.map((f) => f.id),
    } : null,

    conversation_context: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      mode: channel.mode,
      created_at: channel.createdAt,
      last_active_at: messages.length > 0 ? messages[messages.length - 1].createdAt : channel.createdAt,
      context: {
        ref: 'layer_4_context.md',
        length_chars: contextLength,
      },
      pinned_file_ids: channelFiles.map((f) => f.id),
      compaction_state: compactionState,
    },

    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      handle: e.handle || null,
      model: e.model,
      effort: e.effort,
      color: e.color,
      prompt: e.systemPrompt,
      prompt_length_chars: e.systemPrompt?.length || 0,
      field_notes: mergeFieldNotes(entityFieldNotes?.get(e.id), e.reflections),
    })),

    files: dedupedFiles,

    conversation_history: {
      ref: 'conversation.jsonl',
      message_count: messages.length,
      first_message_at: messages.length > 0 ? messages[0].createdAt : null,
      last_message_at: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    },

    extensions: {
      klatch: {},
    },
  };
}

/** Merge handoff briefing notes with accumulated micro-reflections into a single field_notes array. */
export function mergeFieldNotes(briefingNotes?: FieldNote[], reflections?: MicroReflection[]): any[] | null {
  const notes: any[] = [];

  if (briefingNotes) {
    notes.push(...briefingNotes);
  }

  if (reflections && reflections.length > 0) {
    for (const r of reflections) {
      notes.push({
        observation: r.observation,
        citations: [],
        confidence: 'medium',
        source: 'micro-reflection',
        trust: 'agent-observed',
        status: 'draft',
        category: r.type === 'correction' ? 'course-corrections' : 'patterns',
      });
    }
  }

  return notes.length > 0 ? notes : null;
}

/** Parse the JSON-encoded sourceMetadata column, tolerating null/malformed input. */
export function parseSourceMetadata(raw?: string | null): Record<string, any> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Negotiate a format version. Returns the highest supported version ≤ requested,
 * or null if the requested version is older than anything we support.
 * If `requested` is undefined, returns the current FORMAT_VERSION.
 */
export function negotiateFormatVersion(requested?: string): string | null {
  if (!requested) return FORMAT_VERSION;
  // Simple major.minor.patch comparison for now
  const requestedParts = parseVersion(requested);
  if (!requestedParts) return null;

  let best: string | null = null;
  let bestParts: number[] | null = null;
  for (const v of SUPPORTED_FORMAT_VERSIONS) {
    const parts = parseVersion(v);
    if (!parts) continue;
    if (compareVersions(parts, requestedParts) <= 0) {
      if (!bestParts || compareVersions(parts, bestParts) > 0) {
        best = v;
        bestParts = parts;
      }
    }
  }
  return best;
}

function parseVersion(v: string): number[] | null {
  const parts = v.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts;
}

function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}
