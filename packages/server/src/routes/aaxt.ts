/**
 * AAXT (Automated Agent Experience Testing) routes.
 *
 * Phase 1: Probe generation only — no agent interaction.
 * Returns generated probes for manual review and calibration.
 */

import { Hono } from 'hono';
import { getChannel, getChannelEntities, getProjectForChannel, getChannelFiles, getProjectFiles } from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import { buildCarriedContext } from '../claude/carried-context.js';
import { generateProbes } from '../aaxt/probe-generator.js';
import { getAuxiliaryInfo } from '../aaxt/auxiliary.js';
import { runAAXT } from '../aaxt/runner.js';
import { isDefaultChannelPreamble } from '@klatch/shared';

const app = new Hono();

/**
 * POST /channels/:id/aaxt-probe — Generate AAXT probes for a channel
 *
 * Phase 1: Returns generated probe questions without sending them to the agent.
 * For reviewing probe quality and calibrating the auxiliary model.
 */
app.post('/channels/:id/aaxt-probe', async (c) => {
  const channelId = c.req.param('id');

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  const entity = entities[0];
  if (!entity) {
    return c.json({ error: 'No entity assigned to this channel' }, 400);
  }

  const project = channel.projectId ? getProjectForChannel(channelId) : null;
  const channelFileList = getChannelFiles(channelId);
  const channelFileNames = channelFileList.map((f) => `- ${f.name} (${f.mimeType})`);
  const projectFileList = project ? getProjectFiles(project.id) : [];
  const projectFileNames = projectFileList.map((f) => `- ${f.name} (${f.mimeType})`);

  // Layer 6 included deliberately: an AAXT probe measures what the *real*
  // assembled prompt conveys, and carried context is part of that prompt. This
  // is the observability property option (b) was chosen for — a probe can now
  // distinguish "the agent wasn't given this" from "was given it and didn't use it".
  const carriedContext = buildCarriedContext(entity, channel);
  const assembled = buildSystemPrompt(entity, channel.systemPrompt, channel, project, channelFileNames, projectFileNames, { carriedContext });

  // Build prompt-debug equivalent inline
  const layers: Record<string, string> = {
    '1_kitBriefing': (channel.source && channel.source !== 'native')
      ? 'ACTIVE — imported channel gets kit briefing'
      : 'INACTIVE — native channel, no kit briefing',
    '2_projectInstructions': project?.instructions?.trim()
      ? `ACTIVE — from project "${project.name}" (${project.instructions.length} chars)`
      : project
        ? `EMPTY — project "${project.name}" has no instructions`
        : 'INACTIVE — no project linked',
    '3_projectMemory': (() => {
      const parts: string[] = [];
      if (project?.memory?.trim()) parts.push(`${project.memory.length} chars`);
      if (projectFileList.length > 0) parts.push(`${projectFileList.length} knowledge base file(s)`);
      if (parts.length > 0) return `ACTIVE — from project "${project!.name}" (${parts.join('; ')})`;
      if (project) return `EMPTY — project "${project.name}" has no memory`;
      return 'INACTIVE — no project linked';
    })(),
    '4_channelAddendum': (() => {
      const parts: string[] = [];
      const boilerplate = isDefaultChannelPreamble(channel.systemPrompt);
      if (channel.systemPrompt?.trim() && !boilerplate) parts.push(`${channel.systemPrompt.length} chars`);
      if (channelFileList.length > 0) parts.push(`${channelFileList.length} file(s) pinned`);
      if (parts.length > 0) return `ACTIVE — ${parts.join('; ')}`;
      return boilerplate ? 'EMPTY — default purpose, not sent' : 'EMPTY';
    })(),
    '5_entityPrompt': `ACTIVE — "${entity.name}" (${entity.systemPrompt?.length || 0} chars)`,
    '6_carriedContext': carriedContext
      ? `ACTIVE — ${carriedContext.length} chars carried from "${entity.name}"'s other channels`
      : channel.type === 'klatch'
        ? `EMPTY — "${entity.name}" has no history in any other channel`
        : 'INACTIVE — carried context applies to klatches only',
  };

  try {
    const auxiliary = getAuxiliaryInfo();
    const probeSet = await generateProbes(
      { channelId, layers, assembledPrompt: assembled },
      auxiliary.model,
    );

    return c.json(probeSet);
  } catch (err) {
    return c.json({
      error: `Probe generation failed: ${err instanceof Error ? err.message : String(err)}`,
    }, 500);
  }
});

/**
 * POST /channels/:id/aaxt-run — Run full AAXT pipeline on a channel
 *
 * Phase 2: generates probes, sends each to the target agent (stateless API call),
 * scores responses, and returns aggregated per-layer fidelity results.
 *
 * Uses stateless probing: no messages created in DB, no streaming, no channel pollution.
 * The agent receives the same context it would in a real conversation.
 */
app.post('/channels/:id/aaxt-run', async (c) => {
  const channelId = c.req.param('id');

  const channel = getChannel(channelId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  const entities = getChannelEntities(channelId);
  const entity = entities[0];
  if (!entity) {
    return c.json({ error: 'No entity assigned to this channel' }, 400);
  }

  const project = channel.projectId ? getProjectForChannel(channelId) : null;
  const channelFileList = getChannelFiles(channelId);
  const channelFileNames = channelFileList.map((f) => `- ${f.name} (${f.mimeType})`);
  const projectFileList = project ? getProjectFiles(project.id) : [];
  const projectFileNames = projectFileList.map((f) => `- ${f.name} (${f.mimeType})`);

  // Layer 6 included deliberately: an AAXT probe measures what the *real*
  // assembled prompt conveys, and carried context is part of that prompt. This
  // is the observability property option (b) was chosen for — a probe can now
  // distinguish "the agent wasn't given this" from "was given it and didn't use it".
  const carriedContext = buildCarriedContext(entity, channel);
  const assembled = buildSystemPrompt(entity, channel.systemPrompt, channel, project, channelFileNames, projectFileNames, { carriedContext });

  // Build prompt-debug layers (same as aaxt-probe)
  const layers: Record<string, string> = {
    '1_kitBriefing': (channel.source && channel.source !== 'native')
      ? 'ACTIVE — imported channel gets kit briefing'
      : 'INACTIVE — native channel, no kit briefing',
    '2_projectInstructions': project?.instructions?.trim()
      ? `ACTIVE — from project "${project.name}" (${project.instructions.length} chars)`
      : project
        ? `EMPTY — project "${project.name}" has no instructions`
        : 'INACTIVE — no project linked',
    '3_projectMemory': (() => {
      const parts: string[] = [];
      if (project?.memory?.trim()) parts.push(`${project.memory.length} chars`);
      if (projectFileList.length > 0) parts.push(`${projectFileList.length} knowledge base file(s)`);
      if (parts.length > 0) return `ACTIVE — from project "${project!.name}" (${parts.join('; ')})`;
      if (project) return `EMPTY — project "${project.name}" has no memory`;
      return 'INACTIVE — no project linked';
    })(),
    '4_channelAddendum': (() => {
      const parts: string[] = [];
      const boilerplate = isDefaultChannelPreamble(channel.systemPrompt);
      if (channel.systemPrompt?.trim() && !boilerplate) parts.push(`${channel.systemPrompt.length} chars`);
      if (channelFileList.length > 0) parts.push(`${channelFileList.length} file(s) pinned`);
      if (parts.length > 0) return `ACTIVE — ${parts.join('; ')}`;
      return boilerplate ? 'EMPTY — default purpose, not sent' : 'EMPTY';
    })(),
    '5_entityPrompt': `ACTIVE — "${entity.name}" (${entity.systemPrompt?.length || 0} chars)`,
    '6_carriedContext': carriedContext
      ? `ACTIVE — ${carriedContext.length} chars carried from "${entity.name}"'s other channels`
      : channel.type === 'klatch'
        ? `EMPTY — "${entity.name}" has no history in any other channel`
        : 'INACTIVE — carried context applies to klatches only',
  };

  try {
    const result = await runAAXT(
      channelId,
      assembled,
      entity.model,
      entity.effort,
      layers,
    );

    return c.json(result);
  } catch (err) {
    return c.json({
      error: `AAXT run failed: ${err instanceof Error ? err.message : String(err)}`,
    }, 500);
  }
});

/**
 * GET /aaxt/status — Check auxiliary LLM configuration
 */
app.get('/aaxt/status', (c) => {
  try {
    const info = getAuxiliaryInfo();
    return c.json({ configured: true, ...info });
  } catch (err) {
    return c.json({
      configured: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

export const aaxtRoutes = app;
