/**
 * Klatch canonical package import — Step 10 round-trip.
 *
 * Consumes the canonical zip produced by `GET /channels/:id/export`
 * (Phase 1 format spec). Idempotent by canonical UUIDs:
 *   - Project: matched by `project.id`. Existing rows reused; missing rows
 *     created with the canonical id preserved.
 *   - Channel: matched by `conversation_context.id`. Duplicates return 409
 *     unless `forceImport` is set, in which case a fork is created with a
 *     new uuid and `originalChannelId` linkage.
 *   - Entities, files: matched by canonical id, upserted.
 *   - Messages: inserted with their canonical ids (only when channel is new
 *     or forked).
 *
 * Source field on the imported channel preserves the channel's original
 * source (claude-code / claude-ai if it was originally imported through
 * those paths; klatch if it was natively created in another Klatch
 * instance).
 */

import AdmZip from 'adm-zip';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { getProject, getChannel, getEntity, getFile } from '../db/queries.js';
import { saveFile } from '../files/storage.js';
import { SUPPORTED_FORMAT_VERSIONS } from '../export/package-builder.js';
import { DEFAULT_ENTITY_ID } from '@klatch/shared';
import type { ChannelSource } from '@klatch/shared';

export interface KlatchImportParams {
  zipBuffer: Buffer;
  forceImport?: boolean;
}

export interface KlatchImportResult {
  channelId: string;
  channelName: string;
  projectId?: string;
  messageCount: number;
  fileCount: number;
  artifactCount: number;
  reused: {
    project: boolean;
    entities: number;
    files: number;
  };
  forked: boolean; // true if existing channel was duplicated under a new uuid
}

export interface KlatchImportConflict {
  duplicate: true;
  existingChannelId: string;
  existingChannelName: string;
  packageChannelId: string;
}

export interface KlatchImportVersionMismatch {
  formatVersion: string;
  supportedVersions: readonly string[];
}

export type KlatchImportOutcome =
  | { ok: true; result: KlatchImportResult }
  | { ok: false; status: 400 | 409; error: string; conflict?: KlatchImportConflict; versionMismatch?: KlatchImportVersionMismatch };

/**
 * Pure parser — pulls manifest + sidecars + jsonl + files out of the zip.
 * Tolerates missing optional sidecars; rejects on missing manifest.
 */
export function parseKlatchPackage(zipBuffer: Buffer): {
  manifest: any;
  layer2: string;
  layer3: string;
  layer4: string;
  conversationJsonl: string;
  files: Map<string, Buffer>;
} | null {
  let zip: AdmZip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch {
    return null;
  }

  const entries = zip.getEntries();
  const byName = new Map<string, AdmZip.IZipEntry>();
  for (const e of entries) byName.set(e.entryName, e);

  const manifestEntry = byName.get('manifest.json');
  if (!manifestEntry) return null;

  let manifest: any;
  try {
    manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
  } catch {
    return null;
  }

  if (manifest.package_kind !== 'klatch.context.v1') return null;
  if (!manifest.conversation_context?.id) return null;

  const readText = (name: string): string =>
    byName.get(name)?.getData().toString('utf-8') ?? '';

  const layer2 = readText('layer_2_instructions.md');
  const layer3 = readText('layer_3_memory.md');
  const layer4 = readText('layer_4_context.md');
  const conversationJsonl = readText('conversation.jsonl');

  // Files live under files/{id}_{name}; map the file id from the manifest's
  // `ref` field back to the zip entry.
  const files = new Map<string, Buffer>();
  if (Array.isArray(manifest.files)) {
    for (const f of manifest.files) {
      if (!f.ref || !f.id) continue;
      const entry = byName.get(f.ref);
      if (entry) files.set(f.id, entry.getData());
    }
  }

  return { manifest, layer2, layer3, layer4, conversationJsonl, files };
}

/**
 * Determine the source value to stamp on the imported channel. Preserves
 * the channel's original source if it was previously imported (claude-code /
 * claude-ai). Otherwise stamps 'klatch' to signal Klatch-to-Klatch handoff.
 *
 * Reads provenance[0].source — the first hop in the chain — which is the
 * original source by construction in `package-builder.ts`.
 */
function determineSource(manifest: any): ChannelSource {
  const first = Array.isArray(manifest.provenance) ? manifest.provenance[0] : null;
  if (first?.source === 'claude-code') return 'claude-code';
  if (first?.source === 'claude-ai') return 'claude-ai';
  return 'klatch';
}

/**
 * Build the source_metadata blob for the imported channel. Carries the
 * canonical package id, the original channel id (so subsequent re-exports
 * can preserve the chain), the importedAt timestamp, and the upstream
 * provenance chain for future provenance-aware tooling.
 */
function buildSourceMetadata(manifest: any, originalChannelId: string, packageId: string) {
  const cc = manifest.conversation_context;
  return {
    originalSessionId: originalChannelId, // round-trip dedup key (claude-code/claude-ai use the same field)
    originalChannelId,
    originalPackageId: packageId,
    importedAt: new Date().toISOString(),
    upstreamProvenance: manifest.provenance ?? [],
    // Carry forward original-source metadata if present so kit briefing logic
    // can find cwd / originalSessionId / etc. that the source path expected.
    ...(extractUpstreamMeta(manifest)),
    // Channel-level metadata that doesn't cleanly fit elsewhere
    ...(cc?.compaction_state ? { compactionStateAtExport: cc.compaction_state } : {}),
  };
}

function extractUpstreamMeta(manifest: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!Array.isArray(manifest.provenance)) return out;
  const first = manifest.provenance[0];
  if (!first) return out;
  if (first.path) out.cwd = first.path;
  if (first.session_id) out.originalSessionId = first.session_id;
  if (first.project_uuid) out.originalProjectUuid = first.project_uuid;
  return out;
}

/**
 * Execute the import. Single-transaction; idempotent by canonical UUIDs.
 */
export function importKlatchPackage(params: KlatchImportParams): KlatchImportOutcome {
  const parsed = parseKlatchPackage(params.zipBuffer);
  if (!parsed) {
    return { ok: false, status: 400, error: 'Invalid Klatch package' };
  }

  const { manifest, layer2, layer3, layer4, conversationJsonl, files } = parsed;

  // Format version gate. The import path materializes data into the DB;
  // accepting a version we don't recognize would silently drop fields we
  // can't model — the worst kind of fidelity loss. Reject anything outside
  // the explicit supported-versions set with a structured error so clients
  // can surface "your Klatch is too old / too new for this package."
  const fv = typeof manifest.format_version === 'string' ? manifest.format_version : '';
  if (!SUPPORTED_FORMAT_VERSIONS.includes(fv)) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported format_version "${fv || '(missing)'}". This Klatch supports: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}.`,
      versionMismatch: {
        formatVersion: fv,
        supportedVersions: SUPPORTED_FORMAT_VERSIONS,
      },
    };
  }

  const cc = manifest.conversation_context;
  const packageChannelId = cc.id as string;

  // Pre-flight: duplicate channel?
  const existingChannel = getChannel(packageChannelId);
  if (existingChannel && !params.forceImport) {
    return {
      ok: false,
      status: 409,
      error: 'Channel already imported',
      conflict: {
        duplicate: true,
        existingChannelId: existingChannel.id,
        existingChannelName: existingChannel.name,
        packageChannelId,
      },
    };
  }

  const targetChannelId = existingChannel ? uuidv4() : packageChannelId;
  const forked = !!existingChannel;
  const source = determineSource(manifest);
  const sourceMetadata = buildSourceMetadata(manifest, packageChannelId, manifest.package_id);

  let reusedProject = false;
  let reusedEntities = 0;
  let reusedFiles = 0;
  let messageCount = 0;
  let artifactCount = 0;
  let fileCount = 0;
  let projectId: string | undefined;

  const db = getDb();
  const txn = db.transaction(() => {
    // ── Project upsert ──
    if (manifest.project?.id) {
      const existing = getProject(manifest.project.id);
      if (existing) {
        projectId = existing.id;
        reusedProject = true;
      } else {
        const projSourceMeta = {
          originalProjectId: manifest.project.id,
          originalPackageId: manifest.package_id,
          importedAt: new Date().toISOString(),
        };
        db.prepare(
          'INSERT INTO projects (id, name, instructions, memory, source, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(
          manifest.project.id,
          manifest.project.name,
          layer2,
          layer3,
          'klatch',
          JSON.stringify(projSourceMeta),
          new Date().toISOString(),
        );
        projectId = manifest.project.id;
      }
    }

    // ── Channel insert ──
    db.prepare(
      'INSERT INTO channels (id, name, system_prompt, model, mode, type, source, source_metadata, project_id, created_at, compaction_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      targetChannelId,
      cc.name,
      layer4 || '',
      // Inherit model from first entity if present; default applied by schema if not
      (Array.isArray(manifest.entities) && manifest.entities[0]?.model) || 'claude-opus-4-6',
      cc.mode || 'roundtable',
      cc.type || 'chat',
      source,
      JSON.stringify(sourceMetadata),
      projectId || null,
      cc.created_at || new Date().toISOString(),
      compactionStateForRow(cc.compaction_state),
    );

    // ── Entities upsert + channel link ──
    // If the package has no entities (empty or missing), auto-attach the
    // seed default-entity so the imported channel is exportable. Matches
    // createChannel's seed behavior; otherwise the channel would exist but
    // immediately fail any subsequent export with "no entities assigned."
    const manifestEntities: any[] = Array.isArray(manifest.entities) ? manifest.entities : [];
    if (manifestEntities.length === 0) {
      db.prepare('INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
        .run(targetChannelId, DEFAULT_ENTITY_ID);
    }
    if (manifestEntities.length > 0) {
      for (const e of manifestEntities) {
        if (!e.id) continue;
        const existingEntity = getEntity(e.id);
        if (existingEntity) {
          reusedEntities++;
        } else {
          const reflections = extractReflectionsFromFieldNotes(e.field_notes);
          db.prepare(
            'INSERT INTO entities (id, name, handle, model, effort, system_prompt, color, reflections, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(
            e.id,
            e.name,
            e.handle || null,
            e.model || 'claude-opus-4-6',
            e.effort || 'high',
            e.prompt || '',
            e.color || '#3B82F6',
            JSON.stringify(reflections),
            new Date().toISOString(),
          );
        }
        db.prepare('INSERT OR IGNORE INTO channel_entities (channel_id, entity_id) VALUES (?, ?)')
          .run(targetChannelId, e.id);
      }
    }

    // ── Files upsert + scope refs ──
    if (Array.isArray(manifest.files)) {
      for (const f of manifest.files) {
        if (!f.id) continue;
        let storageKey: string;
        const existingFile = getFile(f.id);
        if (existingFile) {
          storageKey = existingFile.storageKey;
          reusedFiles++;
        } else {
          const content = files.get(f.id);
          if (!content) continue; // file referenced but missing from zip — skip
          const saved = saveFile(content, f.name, f.mime_type);
          storageKey = saved.storageKey;
          db.prepare(
            'INSERT INTO files (id, name, mime_type, size_bytes, storage_key, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(
            f.id,
            f.name,
            f.mime_type,
            f.size_bytes,
            storageKey,
            f.source && f.source !== 'unknown' ? f.source : null,
            f.added_at || new Date().toISOString(),
          );
        }
        fileCount++;

        // Re-scope to the imported channel/project. If the package's scope
        // matches the original channel/project, point it at the imported
        // ones; otherwise skip the ref (orphan files are harmless).
        const scopeId = f.scope === 'project' ? projectId : f.scope === 'channel' ? targetChannelId : null;
        if (scopeId) {
          db.prepare(
            'INSERT INTO file_refs (id, file_id, scope, scope_id, ref_type, added_at, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(
            uuidv4(),
            f.id,
            f.scope,
            scopeId,
            f.ref_type || 'pinned',
            f.added_at || new Date().toISOString(),
            f.source && f.source !== 'unknown' ? f.source : null,
          );
        }
      }
    }

    // ── Messages + artifacts from JSONL ──
    if (conversationJsonl) {
      const insertMsg = db.prepare(
        'INSERT INTO messages (id, channel_id, role, content, status, model, entity_id, original_timestamp, original_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      const insertArtifact = db.prepare(
        'INSERT INTO message_artifacts (id, message_id, type, tool_name, input_summary, content, file_name, file_mime_type, file_size_bytes, file_storage_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      for (const line of conversationJsonl.split('\n')) {
        if (!line.trim()) continue;
        let row: any;
        try { row = JSON.parse(line); } catch { continue; }
        if (!row.id || !row.role) continue;

        // When forking, mint a new message id to avoid PK collision with the
        // existing channel's messages. Original is recorded in original_id.
        const messageId = forked ? uuidv4() : row.id;
        const originalId = row.original_id ?? (forked ? row.id : null);

        insertMsg.run(
          messageId,
          targetChannelId,
          row.role,
          row.content || '',
          row.status === 'streaming' || row.status === 'error' ? row.status : 'complete',
          row.model || null,
          row.entity_id || null,
          row.original_timestamp || null,
          originalId,
          row.created_at || new Date().toISOString(),
        );
        messageCount++;

        if (Array.isArray(row.artifacts)) {
          for (const a of row.artifacts) {
            if (!a.type) continue;
            const artifactId = forked ? uuidv4() : (a.id || uuidv4());
            insertArtifact.run(
              artifactId,
              messageId,
              a.type,
              a.tool_name || null,
              a.input_summary || null,
              a.content || null,
              a.file_name || null,
              a.file_mime_type || null,
              a.file_size_bytes || null,
              a.file_storage_key || null,
              row.created_at || new Date().toISOString(),
            );
            artifactCount++;
          }
        }
      }
    }
  });

  txn();

  return {
    ok: true,
    result: {
      channelId: targetChannelId,
      channelName: cc.name,
      projectId,
      messageCount,
      fileCount,
      artifactCount,
      reused: {
        project: reusedProject,
        entities: reusedEntities,
        files: reusedFiles,
      },
      forked,
    },
  };
}

function compactionStateForRow(cs: any): string | null {
  if (!cs) return null;
  return JSON.stringify({
    summary: cs.summary,
    timestamp: cs.compacted_at,
    beforeMessageId: cs.before_message_id,
  });
}

/**
 * Recover MicroReflection-shaped entries from a manifest field_notes array.
 * Only entries marked `source: 'micro-reflection'` are recovered; briefing
 * notes and extraction notes don't round-trip back into reflections (they
 * weren't reflections to begin with — they're per-export ephemera).
 */
function extractReflectionsFromFieldNotes(fieldNotes: any): any[] {
  if (!Array.isArray(fieldNotes)) return [];
  const out: any[] = [];
  for (const n of fieldNotes) {
    if (n?.source !== 'micro-reflection') continue;
    out.push({
      observation: n.observation,
      createdAt: new Date().toISOString(),
      channelId: '',
      type: n.category === 'course-corrections' ? 'correction' : 'observation',
      ingress: 'import',
    });
  }
  return out;
}
