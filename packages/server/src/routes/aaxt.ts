/**
 * AAXT (Automated Agent Experience Testing) routes.
 *
 * Phase 1: Probe generation only — no agent interaction.
 * Returns generated probes for manual review and calibration.
 */

import { Hono } from 'hono';
import { getChannel, getChannelEntities, getProjectForChannel, getChannelFiles, getProjectFiles } from '../db/queries.js';
import { buildSystemPrompt } from '../claude/client.js';
import { generateProbes } from '../aaxt/probe-generator.js';
import { getAuxiliaryInfo } from '../aaxt/auxiliary.js';

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

  const assembled = buildSystemPrompt(entity, channel.systemPrompt, channel, project, channelFileNames, projectFileNames);

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
      if (channel.systemPrompt?.trim()) parts.push(`${channel.systemPrompt.length} chars`);
      if (channelFileList.length > 0) parts.push(`${channelFileList.length} file(s) pinned`);
      return parts.length > 0 ? `ACTIVE — ${parts.join('; ')}` : 'EMPTY';
    })(),
    '5_entityPrompt': `ACTIVE — "${entity.name}" (${entity.systemPrompt?.length || 0} chars)`,
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
