/**
 * Channel package assembly — shared orchestration for HTTP export routes
 * and the MCP server.
 *
 * Centralizes the load → maybe-briefing → maybe-extraction → buildManifest
 * pipeline so HTTP and MCP cannot drift. Returns the manifest plus the
 * loaded entities (channel, project, entities, files, messages) that callers
 * need for their downstream work (zip building, format adaptation).
 */

import { v4 as uuidv4 } from 'uuid';
import {
  getChannel,
  getChannelEntities,
  getMessages,
  getProjectForChannel,
  getChannelFiles,
  getProjectFiles,
} from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import { generateHandoffBriefing, type FieldNote } from './briefing.js';
import { extractBehavioralPatterns } from './external-extraction.js';
import { buildManifest } from './package-builder.js';
import type { Channel, Entity, Message, Project, FileWithRef } from '@klatch/shared';

export interface AssembleOptions {
  includeBriefing?: boolean;
  includeExtraction?: boolean;
}

export interface AssembledChannel {
  manifest: any;
  channel: Channel;
  project: Project | null;
  entities: Entity[];
  channelFiles: FileWithRef[];
  projectFiles: FileWithRef[];
  messages: Message[];
  entityFieldNotes: Map<string, FieldNote[]>;
}

/**
 * Assemble a channel context package.
 *
 * Returns `null` if the channel does not exist. If `entities.length === 0`,
 * returns the assembled struct anyway — callers decide whether to treat
 * that as an error (HTTP routes return 400; MCP isError envelope).
 *
 * Briefing and extraction are LLM-backed; both are gated by their own
 * heuristics (briefing requires messages.length > 0; extraction requires
 * messages.length >= 5). Failures within the loops are logged and skipped
 * per-entity rather than aborting the whole assembly.
 */
export async function assembleChannelManifest(
  channelId: string,
  opts: AssembleOptions = {},
): Promise<AssembledChannel | null> {
  const channel = getChannel(channelId);
  if (!channel) return null;

  const entities = getChannelEntities(channelId);
  const project = channel.projectId ? (getProjectForChannel(channelId) ?? null) : null;
  const messages = getMessages(channelId);
  const channelFiles = getChannelFiles(channelId);
  const projectFiles = project ? getProjectFiles(project.id) : [];

  const entityFieldNotes = new Map<string, FieldNote[]>();

  if (opts.includeBriefing && messages.length > 0 && entities.length > 0) {
    const channelFileNames = channelFiles.map((f) => `- ${f.name} (${f.mimeType})`);
    const projectFileNames = projectFiles.map((f) => `- ${f.name} (${f.mimeType})`);
    for (const entity of entities) {
      try {
        // Layer 6 (carried context) is deliberately omitted here. It is
        // runtime assembly for a live turn, and it contains verbatim content
        // from channels *other* than the one being exported — including it
        // would bake a second conversation's messages into this channel's
        // exported package, which no export contract promises. The briefing is
        // meant to summarize this channel; carried context is not part of it.
        const systemPrompt = buildSystemPrompt(
          entity,
          channel.systemPrompt,
          channel,
          project,
          channelFileNames,
          projectFileNames,
        );
        const notes = await generateHandoffBriefing(entity, systemPrompt, messages);
        entityFieldNotes.set(entity.id, notes);
      } catch (err) {
        console.error(`[assemble] Briefing generation failed for entity ${entity.name}:`, err);
      }
    }
  }

  if (opts.includeExtraction && messages.length >= 5) {
    for (const entity of entities) {
      try {
        const extractedNotes = await extractBehavioralPatterns(entity.name, messages);
        const existing = entityFieldNotes.get(entity.id) || [];
        entityFieldNotes.set(entity.id, [...existing, ...extractedNotes]);
      } catch (err) {
        console.error(`[assemble] External extraction failed for entity ${entity.name}:`, err);
      }
    }
  }

  const manifest = buildManifest({
    packageId: uuidv4(),
    createdAt: new Date().toISOString(),
    channel,
    project,
    entities,
    channelFiles,
    projectFiles,
    messages,
    entityFieldNotes: entityFieldNotes.size > 0 ? entityFieldNotes : undefined,
  });

  return { manifest, channel, project, entities, channelFiles, projectFiles, messages, entityFieldNotes };
}
