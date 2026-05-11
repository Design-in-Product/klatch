/**
 * Klatch MCP server — Step 10 Phase 5a.
 *
 * Exposes Klatch's canonical context packages as read-only MCP resources.
 * Any MCP-capable client (Claude Code, Claude Desktop, Managed Agent bootstrap)
 * can list and read Klatch channels, projects, and entities in the same format
 * the HTTP export endpoint produces.
 *
 * Phase 5a is read-only, stdio-transport, no auth. The client spawns this
 * server as a child process under the same user — no trust boundary is crossed,
 * so no authentication model is defined.
 *
 * See docs/plans/STEP-10-PHASE-5-MCP-SERVER.md for the full design.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  getAllChannels,
  getChannel,
  getAllProjects,
  getProject,
  getProjectForChannel,
  getChannelEntities,
  getMessages,
  getChannelFiles,
  getProjectFiles,
  getAllEntities,
  getEntity,
  appendReflection,
} from '../db/queries.js';
import { buildKitBriefing } from '../claude/client.js';
import type { MicroReflection } from '@klatch/shared';
import { isReflectionActive } from '@klatch/shared';
import {
  buildManifest,
  SUPPORTED_FORMAT_VERSIONS,
  FORMAT_VERSION,
  negotiateFormatVersion,
} from '../export/package-builder.js';
import { assembleChannelManifest } from '../export/assemble.js';

// ── URI constants ────────────────────────────────────────────

export const CHANNELS_LIST_URI = 'klatch://channels';
export const CHANNEL_URI_TEMPLATE = 'klatch://channels/{id}';
export const CHANNEL_MANIFEST_URI_TEMPLATE = 'klatch://channels/{id}/manifest';
export const PROJECT_URI_TEMPLATE = 'klatch://projects/{id}';
export const ENTITY_URI_TEMPLATE = 'klatch://entities/{id}';

// ── Package assembly helpers ────────────────────────────────

/**
 * Assemble the canonical context package for a channel.
 * Phase 5a: no briefing/extraction generation, no review state — pure DB read.
 * (Those options come online in Phase 5b.)
 */
function assembleChannelPackage(channelId: string): any | null {
  const channel = getChannel(channelId);
  if (!channel) return null;

  const entities = getChannelEntities(channelId);
  const project = channel.projectId ? (getProjectForChannel(channelId) ?? null) : null;
  const messages = getMessages(channelId);
  const channelFiles = getChannelFiles(channelId);
  const projectFiles = project ? getProjectFiles(project.id) : [];

  return buildManifest({
    packageId: uuidv4(),
    createdAt: new Date().toISOString(),
    channel,
    project,
    entities,
    channelFiles,
    projectFiles,
    messages,
  });
}

/**
 * Phase 5b — async channel package assembly with briefing/extraction options.
 *
 * Thin wrapper over the shared `assembleChannelManifest` helper used by the
 * HTTP export endpoints. Returns just the manifest (the MCP server doesn't
 * need the loaded entities the HTTP routes use for zip building). If both
 * options are false, the result is structurally identical to
 * `assembleChannelPackage`.
 *
 * Cost/latency: briefing and extraction are LLM-backed. One API call per
 * entity for briefing, one per channel for extraction. Clients should prefer
 * the plain resource fetch or `get_manifest` when enrichment is not needed.
 */
async function assembleChannelPackageWithOptions(
  channelId: string,
  opts: { includeBriefing?: boolean; includeExtraction?: boolean },
): Promise<any | null> {
  const assembled = await assembleChannelManifest(channelId, opts);
  return assembled?.manifest ?? null;
}

/**
 * Filter helper used by `list_channels` tool.
 */
function filterChannels(
  channels: ReturnType<typeof listChannelsLightweight>,
  args: { filter?: string; type?: string },
): ReturnType<typeof listChannelsLightweight> {
  let result = channels;
  if (args.filter) {
    const needle = args.filter.toLowerCase();
    result = result.filter((c) => c.name.toLowerCase().includes(needle));
  }
  if (args.type) {
    result = result.filter((c) => c.type === args.type);
  }
  return result;
}

/**
 * Assemble a project-level package (no conversation context).
 * Exposes L2 instructions + L3 memory + project files.
 */
function assembleProjectPackage(projectId: string): any | null {
  const project = getProject(projectId);
  if (!project) return null;

  const projectFiles = getProjectFiles(projectId);
  const now = new Date().toISOString();

  return {
    format_version: FORMAT_VERSION,
    source_type: 'klatch',
    package_id: uuidv4(),
    package_kind: 'klatch.project.v1',
    created_at: now,

    provenance: [
      {
        event_id: uuidv4(),
        source: 'klatch',
        at: now,
        summary: 'Project package served from Klatch MCP server',
        instance: 'klatch-local',
        project_id: project.id,
        layer_fidelity: {
          L2: project.instructions?.trim() ? 'full' : 'absent',
          L3: project.memory?.trim() || projectFiles.length > 0 ? 'full' : 'absent',
        },
        integrity: null,
      },
    ],

    project: {
      id: project.id,
      name: project.name,
      instructions: {
        content: project.instructions?.trim() || '',
        length_chars: project.instructions?.trim().length || 0,
      },
      memory: {
        content: project.memory?.trim() || '',
        length_chars: project.memory?.trim().length || 0,
        memory_format: 'flat',
      },
      knowledge_base_file_ids: projectFiles.map((f) => f.id),
    },

    files: projectFiles.map((f) => ({
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      size_bytes: f.sizeBytes,
      length_chars: f.sizeBytes,
      scope: f.scope,
      scope_id: f.scopeId,
      ref_type: f.refType,
      added_at: f.addedAt,
      source: f.addedBy || 'unknown',
      trust: 'unattributed',
    })),

    extensions: { klatch: {} },
  };
}

/**
 * Assemble an entity package — L5 prompt + reflections as field notes.
 */
function assembleEntityPackage(entityId: string): any | null {
  const entity = getEntity(entityId);
  if (!entity) return null;

  const now = new Date().toISOString();

  return {
    format_version: FORMAT_VERSION,
    source_type: 'klatch',
    package_id: uuidv4(),
    package_kind: 'klatch.entity.v1',
    created_at: now,

    provenance: [
      {
        event_id: uuidv4(),
        source: 'klatch',
        at: now,
        summary: 'Entity package served from Klatch MCP server',
        instance: 'klatch-local',
        entity_id: entity.id,
        layer_fidelity: { L5: 'full' },
        integrity: null,
      },
    ],

    entity: {
      id: entity.id,
      name: entity.name,
      handle: entity.handle || null,
      model: entity.model,
      effort: entity.effort,
      color: entity.color,
      prompt: entity.systemPrompt,
      prompt_length_chars: entity.systemPrompt?.length || 0,
      field_notes: (() => {
        // Filter out invalidated reflections (validUntil in the past).
        // Keeps the auditable record intact while keeping context-assembly
        // reads accurate.
        const active = (entity.reflections || []).filter(isReflectionActive);
        if (active.length === 0) return null;
        return active.map((r) => ({
          observation: r.observation,
          citations: [],
          confidence: 'medium',
          source: 'micro-reflection',
          trust: 'agent-observed',
          status: 'draft',
          category: r.type === 'correction' ? 'course-corrections' : 'patterns',
        }));
      })(),
    },

    extensions: { klatch: {} },
  };
}

// ── Listing helpers ──────────────────────────────────────────

export function listChannelsLightweight(): Array<{
  id: string;
  name: string;
  type: string;
  mode: string;
  source: string;
  created_at: string;
  message_count: number;
  entity_count: number;
  last_active_at: string | null;
}> {
  const channels = getAllChannels();
  return channels.map((c) => {
    const messages = getMessages(c.id);
    const entities = getChannelEntities(c.id);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      mode: c.mode,
      source: c.source || 'native',
      created_at: c.createdAt,
      message_count: messages.length,
      entity_count: entities.length,
      last_active_at: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
    };
  });
}

// ── Server construction ─────────────────────────────────────

export function createKlatchMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'klatch',
      version: '0.1.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
      instructions: [
        'Klatch MCP server (Phase 5c) — resources + tools + prompts for Klatch context packages.',
        `Supported format versions: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}.`,
        'Resources:',
        '  klatch://channels              — list of channels',
        '  klatch://channels/{id}         — full canonical context package',
        '  klatch://channels/{id}/manifest — manifest only (cheap preview)',
        '  klatch://projects/{id}         — project-level package (L2 + L3 + files)',
        '  klatch://entities/{id}         — entity package (L5 prompt + reflections)',
        'Tools:',
        '  list_channels(filter?, type?, limit?, offset?)     — filterable, paginated channel list',
        '  get_context_package(channel_id, options?)          — rich accessor (briefing, extraction, version)',
        '  get_manifest(channel_id)                           — cheap preview, no LLM calls',
        '  reflect(channel_id, entity_id, note, type?)        — write a micro-reflection back (5c-i, explicit-note only)',
        'Prompts:',
        '  kit_briefing(channel_id)                           — environment-orientation preamble for a Klatch channel',
      ].join('\n'),
    },
  );

  // ── Resource: klatch://channels (list) ──

  server.registerResource(
    'channels-list',
    CHANNELS_LIST_URI,
    {
      title: 'Klatch channels',
      description: 'Lightweight list of all channels in this Klatch instance.',
      mimeType: 'application/json',
    },
    async () => {
      const channels = listChannelsLightweight();
      return {
        contents: [
          {
            uri: CHANNELS_LIST_URI,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                format_version: FORMAT_VERSION,
                channels,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Resource template: klatch://channels/{id} (full package) ──

  server.registerResource(
    'channel-package',
    new ResourceTemplate(CHANNEL_URI_TEMPLATE, {
      list: async () => {
        const channels = listChannelsLightweight();
        return {
          resources: channels.map((c) => ({
            uri: `klatch://channels/${c.id}`,
            name: c.name,
            description: `${c.type} channel, ${c.message_count} messages, ${c.entity_count} ${c.entity_count === 1 ? 'entity' : 'entities'}`,
            mimeType: 'application/json',
          })),
        };
      },
    }),
    {
      title: 'Klatch channel context package',
      description: 'Full canonical context package for a Klatch channel (Phase 1 format).',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = decodeURIComponent(String(variables.id));
      const pkg = assembleChannelPackage(id);
      if (!pkg) {
        throw new Error(`Channel not found: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(pkg, null, 2),
          },
        ],
      };
    },
  );

  // ── Resource template: klatch://channels/{id}/manifest (cheap preview) ──

  server.registerResource(
    'channel-manifest',
    new ResourceTemplate(CHANNEL_MANIFEST_URI_TEMPLATE, { list: undefined }),
    {
      title: 'Klatch channel manifest',
      description: 'Manifest-only preview (same shape as the full package minus file payloads).',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = decodeURIComponent(String(variables.id));
      const pkg = assembleChannelPackage(id);
      if (!pkg) {
        throw new Error(`Channel not found: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(pkg, null, 2),
          },
        ],
      };
    },
  );

  // ── Resource template: klatch://projects/{id} ──

  server.registerResource(
    'project-package',
    new ResourceTemplate(PROJECT_URI_TEMPLATE, {
      list: async () => {
        const projects = getAllProjects();
        return {
          resources: projects.map((p) => ({
            uri: `klatch://projects/${p.id}`,
            name: p.name,
            description: 'Klatch project context package (L2 + L3 + knowledge base files).',
            mimeType: 'application/json',
          })),
        };
      },
    }),
    {
      title: 'Klatch project package',
      description: 'Project-level context package — instructions, memory, and knowledge base files.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = decodeURIComponent(String(variables.id));
      const pkg = assembleProjectPackage(id);
      if (!pkg) {
        throw new Error(`Project not found: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(pkg, null, 2),
          },
        ],
      };
    },
  );

  // ── Resource template: klatch://entities/{id} ──

  server.registerResource(
    'entity-package',
    new ResourceTemplate(ENTITY_URI_TEMPLATE, {
      list: async () => {
        const entities = getAllEntities();
        return {
          resources: entities.map((e) => ({
            uri: `klatch://entities/${e.id}`,
            name: e.name,
            description: `Klatch entity: ${e.name}${e.handle ? ` (@${e.handle})` : ''}`,
            mimeType: 'application/json',
          })),
        };
      },
    }),
    {
      title: 'Klatch entity package',
      description: 'Entity prompt (L5) plus accumulated reflections as field notes.',
      mimeType: 'application/json',
    },
    async (uri, variables) => {
      const id = decodeURIComponent(String(variables.id));
      const pkg = assembleEntityPackage(id);
      if (!pkg) {
        throw new Error(`Entity not found: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(pkg, null, 2),
          },
        ],
      };
    },
  );

  // ── Tool: list_channels ──

  server.registerTool(
    'list_channels',
    {
      title: 'List Klatch channels',
      description:
        'List Klatch channels with optional filter and pagination. Returns the same shape as the klatch://channels resource, plus pagination metadata.',
      inputSchema: {
        filter: z
          .string()
          .optional()
          .describe('Case-insensitive substring match on channel name.'),
        type: z
          .enum(['chat', 'klatch'])
          .optional()
          .describe('Restrict to one channel type.'),
        limit: z.number().int().positive().optional().describe('Max results to return.'),
        offset: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe('Pagination offset; pairs with limit.'),
      },
    },
    async (args) => {
      const all = listChannelsLightweight();
      const filtered = filterChannels(all, { filter: args.filter, type: args.type });
      const offset = args.offset ?? 0;
      const limit = args.limit ?? filtered.length;
      const page = filtered.slice(offset, offset + limit);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                format_version: FORMAT_VERSION,
                total: filtered.length,
                offset,
                limit,
                returned: page.length,
                channels: page,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Tool: get_context_package ──
  //
  // Alignment note (per PM Chief Architect memo 2026-04-18): `get_context_package`
  // is the agreed cross-producer tool name. Any MCP server that speaks this
  // protocol exposes it; the response envelope is canonical (Phase 1 format),
  // the options surface is producer-specific.

  server.registerTool(
    'get_context_package',
    {
      title: 'Get Klatch channel context package',
      description:
        'Fetch a full canonical context package for a channel. Options can trigger LLM-backed briefing and/or extraction (incurs API cost + latency).',
      inputSchema: {
        channel_id: z.string().describe('The Klatch channel id to fetch.'),
        include_briefing: z
          .boolean()
          .optional()
          .describe('Generate self-authored handoff briefings per entity (Phase 3.5a). LLM-backed.'),
        include_extraction: z
          .boolean()
          .optional()
          .describe('Run external behavioral extraction (Phase 3.5b). LLM-backed; requires ≥5 messages.'),
        format_version: z
          .string()
          .optional()
          .describe(`Requested canonical format version. Server serves the highest version ≤ request. Supported: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}.`),
      },
    },
    async (args) => {
      if (args.format_version) {
        const negotiated = negotiateFormatVersion(args.format_version);
        if (!negotiated) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: `Unsupported format_version: ${args.format_version}. Supported versions: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}.`,
              },
            ],
          };
        }
      }

      const pkg = await assembleChannelPackageWithOptions(args.channel_id, {
        includeBriefing: args.include_briefing,
        includeExtraction: args.include_extraction,
      });
      if (!pkg) {
        return {
          isError: true,
          content: [
            { type: 'text' as const, text: `Channel not found: ${args.channel_id}` },
          ],
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(pkg, null, 2) }],
      };
    },
  );

  // ── Tool: get_manifest ──

  server.registerTool(
    'get_manifest',
    {
      title: 'Get Klatch channel manifest',
      description:
        'Cheap preview of a channel package. No briefing, no extraction, no LLM calls. Equivalent to reading klatch://channels/{id}/manifest.',
      inputSchema: {
        channel_id: z.string().describe('The Klatch channel id to preview.'),
      },
    },
    async (args) => {
      const pkg = assembleChannelPackage(args.channel_id);
      if (!pkg) {
        return {
          isError: true,
          content: [
            { type: 'text' as const, text: `Channel not found: ${args.channel_id}` },
          ],
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(pkg, null, 2) }],
      };
    },
  );

  // ── Tool: reflect ──
  //
  // Phase 5c-i — first MCP write-path. Explicit-note only; auto-reflect (LLM
  // generation when note omitted) is deferred to 5c-ii pending a real driver.
  //
  // Design choices (xian alignment, 2026-04-26):
  //   - entity_id is required: the client knows what it observed; we don't guess.
  //   - type defaults to 'observation' (the new value added for MCP-driven notes).
  //   - ingress is stamped 'mcp' so downstream readers can weight by transport.
  //     Treat ingress as a thin wrapper/layer identifier; future transports get
  //     their own values without breaking the schema.

  server.registerTool(
    'reflect',
    {
      title: 'Append a micro-reflection to a Klatch entity',
      description:
        'Write a micro-reflection back to a specific entity on a channel. The first MCP write-path; explicit-note only in Phase 5c-i. The note is appended to the entity\'s reflections array and will appear in the entity\'s field_notes on subsequent context-package fetches.',
      inputSchema: {
        channel_id: z.string().describe('The Klatch channel id this reflection belongs to.'),
        entity_id: z
          .string()
          .describe('The entity id to attach the reflection to. Must be assigned to the channel.'),
        note: z
          .string()
          .min(1)
          .describe('The observation text. Required in 5c-i (auto-reflect mode is 5c-ii).'),
        type: z
          .enum(['observation', 'correction', 'session-end'])
          .optional()
          .describe('Reflection category. Defaults to "observation" for MCP-driven notes.'),
      },
    },
    async (args) => {
      const channel = getChannel(args.channel_id);
      if (!channel) {
        return {
          isError: true,
          content: [
            { type: 'text' as const, text: `Channel not found: ${args.channel_id}` },
          ],
        };
      }

      const entity = getEntity(args.entity_id);
      if (!entity) {
        return {
          isError: true,
          content: [
            { type: 'text' as const, text: `Entity not found: ${args.entity_id}` },
          ],
        };
      }

      // Membership check — entity must be assigned to the channel. This keeps
      // the write-path scoped and prevents a confused client from polluting an
      // unrelated entity by guessing IDs.
      const channelEntities = getChannelEntities(args.channel_id);
      if (!channelEntities.some((e) => e.id === args.entity_id)) {
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: `Entity ${args.entity_id} is not assigned to channel ${args.channel_id}.`,
            },
          ],
        };
      }

      const reflection: MicroReflection = {
        observation: args.note,
        createdAt: new Date().toISOString(),
        channelId: args.channel_id,
        type: args.type ?? 'observation',
        ingress: 'mcp',
      };

      appendReflection(args.entity_id, reflection);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                ok: true,
                appended: reflection,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ── Prompt: kit_briefing ──
  //
  // Returns an environment-orientation preamble suitable for prepending into a
  // new conversation that is about to consume context originating from a Klatch
  // channel. For imported channels, reuses the existing buildKitBriefing text
  // (the "you are continuing from..." orientation written for receiving
  // imported sessions). For native Klatch-originating channels, returns a brief
  // generic preamble naming the source.

  server.registerPrompt(
    'kit_briefing',
    {
      title: 'Klatch kit briefing',
      description:
        'Environment-orientation preamble for a Klatch channel. Suitable for prepending into a new conversation that is bootstrapping from a Klatch context package.',
      argsSchema: {
        channel_id: z.string().describe('The Klatch channel id whose briefing to return.'),
      },
    },
    async (args) => {
      const channel = getChannel(args.channel_id);
      if (!channel) {
        // Prompts have no isError envelope — surface as an empty/error message.
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `Channel not found: ${args.channel_id}`,
              },
            },
          ],
        };
      }

      const text =
        channel.source && channel.source !== 'native'
          ? buildKitBriefing(channel)
          : `You are about to consume context from a Klatch channel ("${channel.name}"). ` +
            `This channel originated in Klatch (it was not imported from another environment). ` +
            `Use the included context package to continue the conversation in your current environment.`;

      return {
        messages: [
          {
            role: 'user' as const,
            content: { type: 'text' as const, text },
          },
        ],
      };
    },
  );

  return server;
}

// Expose the package assemblers for test use so we can assert on package shape
// without spinning up a transport.
export const _internal = {
  assembleChannelPackage,
  assembleChannelPackageWithOptions,
  assembleProjectPackage,
  assembleEntityPackage,
  filterChannels,
};
