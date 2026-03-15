import { describe, it, expect } from 'vitest';
import './setup.js';
import {
  createProject,
  updateProject,
  deleteProject,
  findOrCreateProject,
  setChannelProject,
  createChannel,
  getAllChannelsEnriched,
  getChannel,
  importSession,
} from '../db/queries.js';

// ── 1. getAllChannelsEnriched query tests ─────────────────────────

describe('getAllChannelsEnriched — project name JOIN', () => {
  it('returns projectName for channel linked to a project', () => {
    const project = createProject('My Project', 'Instructions');
    const channel = createChannel('Test Channel', '');
    setChannelProject(channel.id, project.id);

    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    expect(found).toBeDefined();
    expect(found!.projectName).toBe('My Project');
    expect(found!.projectId).toBe(project.id);
  });

  it('returns projectName: undefined for channel with no project', () => {
    const channel = createChannel('Unlinked Channel', '');

    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    expect(found).toBeDefined();
    expect(found!.projectName).toBeUndefined();
    expect(found!.projectId).toBeUndefined();
  });

  it('returns same projectName for multiple channels sharing a project', () => {
    const project = createProject('Shared Project', 'Instructions');
    const ch1 = createChannel('Channel A', '');
    const ch2 = createChannel('Channel B', '');
    setChannelProject(ch1.id, project.id);
    setChannelProject(ch2.id, project.id);

    const enriched = getAllChannelsEnriched();
    const found1 = enriched.find((ch) => ch.id === ch1.id);
    const found2 = enriched.find((ch) => ch.id === ch2.id);
    expect(found1!.projectName).toBe('Shared Project');
    expect(found2!.projectName).toBe('Shared Project');
    expect(found1!.projectId).toBe(found2!.projectId);
  });

  it('reflects project name updates in enriched query', () => {
    const project = createProject('Original Name', 'Instructions');
    const channel = createChannel('Test Channel', '');
    setChannelProject(channel.id, project.id);

    // Before rename
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Original Name');

    // Rename project
    updateProject(project.id, { name: 'Renamed Project' });

    // After rename
    enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Renamed Project');
  });

  it('includes messageCount and lastMessageAt in enriched results', () => {
    const channel = createChannel('With Messages', '');
    // The enriched endpoint always returns these fields
    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    expect(found).toBeDefined();
    expect(found!.messageCount).toBe(0);
    expect(found!.lastMessageAt).toBeNull();
  });

  it('includes the default #general channel in enriched results', () => {
    const enriched = getAllChannelsEnriched();
    const general = enriched.find((ch) => ch.id === 'default');
    expect(general).toBeDefined();
    expect(general!.name).toBe('general');
    expect(general!.projectName).toBeUndefined(); // #general has no project
  });
});

// ── 2. Cross-source project grouping ─────────────────────────────

describe('Cross-source project grouping', () => {
  it('Claude Code and claude.ai channels share the same project via findOrCreateProject', () => {
    // Claude Code import creates project by cwd
    const ccProject = findOrCreateProject(
      'klatch',
      'CLAUDE.md content',
      'claude-code',
      { cwd: '/Users/dev/klatch' },
      'cwd',
      '/Users/dev/klatch'
    );

    // Import a Claude Code session linked to that project
    const ccResult = importSession({
      channelName: 'CC Session 1',
      source: 'claude-code',
      sourceMetadata: { originalSessionId: 'cc-session-1', cwd: '/Users/dev/klatch' },
      turns: [{ userText: 'Hello', assistantText: 'Hi', timestamp: '2026-03-15T00:00:00Z' }],
      projectId: ccProject.id,
    });

    // Second Claude Code import finds same project
    const ccProject2 = findOrCreateProject(
      'klatch',
      'Updated CLAUDE.md',
      'claude-code',
      { cwd: '/Users/dev/klatch' },
      'cwd',
      '/Users/dev/klatch'
    );
    expect(ccProject2.id).toBe(ccProject.id);

    // Link a manually created channel to same project (simulating claude.ai linked to same project)
    const aiChannel = createChannel('AI Conversation', '');
    setChannelProject(aiChannel.id, ccProject.id);

    // Both should show same projectName in enriched query
    const enriched = getAllChannelsEnriched();
    const ccEnriched = enriched.find((ch) => ch.id === ccResult.channelId);
    const aiEnriched = enriched.find((ch) => ch.id === aiChannel.id);

    expect(ccEnriched!.projectId).toBe(ccProject.id);
    expect(aiEnriched!.projectId).toBe(ccProject.id);
    expect(ccEnriched!.projectName).toBe('klatch');
    expect(aiEnriched!.projectName).toBe('klatch');
  });

  it('channels from different projects get different projectNames', () => {
    const projA = createProject('Project Alpha', 'Instructions A', 'claude-code', { cwd: '/path/a' });
    const projB = createProject('Project Beta', 'Instructions B', 'claude-ai', { originalProjectUuid: 'uuid-b' });

    const chA = createChannel('Channel Alpha', '');
    const chB = createChannel('Channel Beta', '');
    setChannelProject(chA.id, projA.id);
    setChannelProject(chB.id, projB.id);

    const enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === chA.id)!.projectName).toBe('Project Alpha');
    expect(enriched.find((ch) => ch.id === chB.id)!.projectName).toBe('Project Beta');
  });

  it('imported session with projectId appears under project name in enriched query', () => {
    const project = createProject('Import Target', 'Instructions', 'claude-ai', { originalProjectUuid: 'proj-uuid' });
    const result = importSession({
      channelName: 'Imported Conv',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'ai-sess-1', originalProjectUuid: 'proj-uuid' },
      turns: [
        { userText: 'Question', assistantText: 'Answer', timestamp: '2026-03-15T01:00:00Z' },
      ],
      projectId: project.id,
    });

    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === result.channelId);
    expect(found!.projectName).toBe('Import Target');
    expect(found!.source).toBe('claude-ai');
  });
});

// ── 3. Project deletion impact on sidebar ────────────────────────

describe('Project deletion impact on enriched query', () => {
  it('channels survive project deletion with projectId: undefined, projectName: undefined', () => {
    const project = createProject('Doomed Project', 'Instructions');
    const ch1 = createChannel('Survivor 1', '');
    const ch2 = createChannel('Survivor 2', '');
    setChannelProject(ch1.id, project.id);
    setChannelProject(ch2.id, project.id);

    // Confirm they show under project name before deletion
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === ch1.id)!.projectName).toBe('Doomed Project');
    expect(enriched.find((ch) => ch.id === ch2.id)!.projectName).toBe('Doomed Project');

    // Delete the project
    deleteProject(project.id);

    // Channels still exist
    enriched = getAllChannelsEnriched();
    const surv1 = enriched.find((ch) => ch.id === ch1.id);
    const surv2 = enriched.find((ch) => ch.id === ch2.id);
    expect(surv1).toBeDefined();
    expect(surv2).toBeDefined();

    // They now have no project
    expect(surv1!.projectId).toBeUndefined();
    expect(surv1!.projectName).toBeUndefined();
    expect(surv2!.projectId).toBeUndefined();
    expect(surv2!.projectName).toBeUndefined();
  });

  it('imported channel falls to ungrouped after project deletion', () => {
    const project = createProject('Import Project', 'Instructions', 'claude-ai', { originalProjectUuid: 'del-uuid' });
    const result = importSession({
      channelName: 'Will Be Orphaned',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'orphan-sess' },
      turns: [{ userText: 'Hello', assistantText: 'Hi', timestamp: '2026-03-15T02:00:00Z' }],
      projectId: project.id,
    });

    // Before deletion
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === result.channelId)!.projectName).toBe('Import Project');

    // Delete
    deleteProject(project.id);

    // After — channel exists, project fields are undefined
    enriched = getAllChannelsEnriched();
    const orphan = enriched.find((ch) => ch.id === result.channelId);
    expect(orphan).toBeDefined();
    expect(orphan!.projectId).toBeUndefined();
    expect(orphan!.projectName).toBeUndefined();
    expect(orphan!.source).toBe('claude-ai'); // source preserved
  });

  it('native channel is unaffected by unrelated project deletion', () => {
    const project = createProject('Other Project', 'Instructions');
    const channel = createChannel('Bystander', '');
    // Channel NOT linked to this project

    deleteProject(project.id);

    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    expect(found).toBeDefined();
    expect(found!.projectId).toBeUndefined();
    expect(found!.projectName).toBeUndefined();
  });
});

// ── 4. Channel-project linking/unlinking ─────────────────────────

describe('Channel-project linking and unlinking via enriched query', () => {
  it('setChannelProject links a channel — enriched query reflects projectName', () => {
    const project = createProject('Link Target', 'Instructions');
    const channel = createChannel('To Link', '');

    // Before linking
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBeUndefined();

    // Link
    setChannelProject(channel.id, project.id);

    // After linking
    enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Link Target');
  });

  it('setChannelProject(null) unlinks a channel — enriched query reflects undefined', () => {
    const project = createProject('Unlink Source', 'Instructions');
    const channel = createChannel('To Unlink', '');
    setChannelProject(channel.id, project.id);

    // Confirm linked
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Unlink Source');

    // Unlink
    setChannelProject(channel.id, null);

    // Confirm unlinked
    enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    expect(found!.projectId).toBeUndefined();
    expect(found!.projectName).toBeUndefined();
  });

  it('re-linking a channel to a different project updates projectName', () => {
    const projA = createProject('Project A', 'Instructions A');
    const projB = createProject('Project B', 'Instructions B');
    const channel = createChannel('Mobile Channel', '');

    setChannelProject(channel.id, projA.id);
    let enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Project A');

    // Re-link to different project
    setChannelProject(channel.id, projB.id);
    enriched = getAllChannelsEnriched();
    expect(enriched.find((ch) => ch.id === channel.id)!.projectName).toBe('Project B');
  });

  it('getChannel (non-enriched) does NOT include projectName', () => {
    const project = createProject('P', 'I');
    const channel = createChannel('Plain', '');
    setChannelProject(channel.id, project.id);

    const plain = getChannel(channel.id);
    expect(plain).toBeDefined();
    expect(plain!.projectId).toBe(project.id);
    // projectName is only populated by the enriched JOIN, not the plain query
    expect((plain as any).projectName).toBeUndefined();
  });

  it('linking non-existent project ID does not crash (SQLite has no FK on project_id)', () => {
    const channel = createChannel('Orphan Link', '');
    // This should not throw — project_id column has no FK constraint in schema
    setChannelProject(channel.id, 'non-existent-project-id');

    const enriched = getAllChannelsEnriched();
    const found = enriched.find((ch) => ch.id === channel.id);
    // projectId is set but JOIN yields no match, so projectName is undefined
    expect(found!.projectId).toBe('non-existent-project-id');
    expect(found!.projectName).toBeUndefined();
  });
});
