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
} from '../db/queries.js';
import { buildManifest, SUPPORTED_FORMAT_VERSIONS, FORMAT_VERSION } from '../export/package-builder.js';

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
      field_notes:
        entity.reflections && entity.reflections.length > 0
          ? entity.reflections.map((r) => ({
              observation: r.observation,
              citations: [],
              confidence: 'medium',
              source: 'micro-reflection',
              trust: 'agent-observed',
              status: 'draft',
              category: r.type === 'correction' ? 'course-corrections' : 'patterns',
            }))
          : null,
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
      },
      instructions: [
        'Klatch MCP server (Phase 5a) — read-only access to Klatch context packages.',
        `Supported format versions: ${SUPPORTED_FORMAT_VERSIONS.join(', ')}.`,
        'Resources:',
        '  klatch://channels              — list of channels',
        '  klatch://channels/{id}         — full canonical context package',
        '  klatch://channels/{id}/manifest — manifest only (cheap preview)',
        '  klatch://projects/{id}         — project-level package (L2 + L3 + files)',
        '  klatch://entities/{id}         — entity package (L5 prompt + reflections)',
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
      const id = String(variables.id);
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
      const id = String(variables.id);
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
      const id = String(variables.id);
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
      const id = String(variables.id);
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

  return server;
}

// Expose the package assemblers for test use so we can assert on package shape
// without spinning up a transport.
export const _internal = {
  assembleChannelPackage,
  assembleProjectPackage,
  assembleEntityPackage,
};
