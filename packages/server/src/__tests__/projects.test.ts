import { describe, it, expect } from 'vitest';
import './setup.js';
import {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  findOrCreateProject,
  getProjectForChannel,
  setChannelProject,
  createChannel,
  importSession,
} from '../db/queries.js';

describe('Project CRUD', () => {
  it('creates a project with name and instructions', () => {
    const project = createProject('My Project', 'You are a helpful assistant.');
    expect(project.id).toBeTruthy();
    expect(project.name).toBe('My Project');
    expect(project.instructions).toBe('You are a helpful assistant.');
    expect(project.source).toBe('native');
  });

  it('creates a project with source and metadata', () => {
    const project = createProject(
      'Imported Project',
      'Original system prompt',
      'claude-ai',
      { originalProjectUuid: 'abc-123' }
    );
    expect(project.source).toBe('claude-ai');
    const meta = JSON.parse(project.sourceMetadata);
    expect(meta.originalProjectUuid).toBe('abc-123');
  });

  it('gets a project by ID', () => {
    const created = createProject('Test', 'Instructions');
    const found = getProject(created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Test');
    expect(found!.instructions).toBe('Instructions');
  });

  it('returns undefined for non-existent project', () => {
    expect(getProject('does-not-exist')).toBeUndefined();
  });

  it('lists all projects', () => {
    createProject('P1', 'I1');
    createProject('P2', 'I2');
    const all = getAllProjects();
    expect(all.length).toBe(2);
    expect(all[0].name).toBe('P1');
    expect(all[1].name).toBe('P2');
  });

  it('updates project name and instructions', () => {
    const project = createProject('Original', 'Original instructions');
    const updated = updateProject(project.id, {
      name: 'Updated',
      instructions: 'New instructions',
    });
    expect(updated).toBeDefined();
    expect(updated!.name).toBe('Updated');
    expect(updated!.instructions).toBe('New instructions');

    // Verify persistence
    const fetched = getProject(project.id);
    expect(fetched!.name).toBe('Updated');
  });

  it('partial update only changes specified fields', () => {
    const project = createProject('Name', 'Instructions');
    const updated = updateProject(project.id, { name: 'New Name' });
    expect(updated!.name).toBe('New Name');
    expect(updated!.instructions).toBe('Instructions'); // unchanged
  });

  it('deletes a project and unlinks channels', () => {
    const project = createProject('To Delete', 'Instructions');
    const channel = createChannel('Test Channel', '');
    setChannelProject(channel.id, project.id);

    // Verify link exists
    const linked = getProjectForChannel(channel.id);
    expect(linked).toBeDefined();

    // Delete project
    const deleted = deleteProject(project.id);
    expect(deleted).toBe(true);

    // Project gone
    expect(getProject(project.id)).toBeUndefined();

    // Channel still exists but unlinked
    const unlinked = getProjectForChannel(channel.id);
    expect(unlinked).toBeUndefined();
  });
});

describe('findOrCreateProject', () => {
  it('creates a new project when none matches', () => {
    const project = findOrCreateProject(
      'New Project',
      'Instructions',
      'claude-ai',
      { originalProjectUuid: 'uuid-1' },
      'originalProjectUuid',
      'uuid-1'
    );
    expect(project.id).toBeTruthy();
    expect(project.name).toBe('New Project');
    expect(project.instructions).toBe('Instructions');
  });

  it('returns existing project when match found', () => {
    const first = findOrCreateProject(
      'Project',
      'Instructions v1',
      'claude-ai',
      { originalProjectUuid: 'uuid-2' },
      'originalProjectUuid',
      'uuid-2'
    );
    const second = findOrCreateProject(
      'Project Updated',
      'Instructions v2',
      'claude-ai',
      { originalProjectUuid: 'uuid-2' },
      'originalProjectUuid',
      'uuid-2'
    );
    expect(second.id).toBe(first.id);
    expect(second.name).toBe('Project'); // original name preserved
  });

  it('finds Claude Code project by cwd', () => {
    const first = findOrCreateProject(
      'klatch',
      'CLAUDE.md content',
      'claude-code',
      { cwd: '/Users/xian/Development/klatch' },
      'cwd',
      '/Users/xian/Development/klatch'
    );
    const second = findOrCreateProject(
      'klatch',
      'Different content',
      'claude-code',
      { cwd: '/Users/xian/Development/klatch' },
      'cwd',
      '/Users/xian/Development/klatch'
    );
    expect(second.id).toBe(first.id);
  });

  it('creates separate projects for different cwds', () => {
    const proj1 = findOrCreateProject(
      'project-a',
      'Instructions A',
      'claude-code',
      { cwd: '/path/a' },
      'cwd',
      '/path/a'
    );
    const proj2 = findOrCreateProject(
      'project-b',
      'Instructions B',
      'claude-code',
      { cwd: '/path/b' },
      'cwd',
      '/path/b'
    );
    expect(proj1.id).not.toBe(proj2.id);
  });
});

describe('Channel-Project linking', () => {
  it('links a channel to a project', () => {
    const project = createProject('Linked Project', 'Project instructions');
    const channel = createChannel('Test Channel', '');
    setChannelProject(channel.id, project.id);

    const found = getProjectForChannel(channel.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(project.id);
    expect(found!.instructions).toBe('Project instructions');
  });

  it('returns undefined for channel with no project', () => {
    const channel = createChannel('Unlinked', '');
    expect(getProjectForChannel(channel.id)).toBeUndefined();
  });

  it('unlinks a channel from its project', () => {
    const project = createProject('P', 'I');
    const channel = createChannel('C', '');
    setChannelProject(channel.id, project.id);
    expect(getProjectForChannel(channel.id)).toBeDefined();

    setChannelProject(channel.id, null);
    expect(getProjectForChannel(channel.id)).toBeUndefined();
  });

  it('importSession creates channel with projectId', () => {
    const project = createProject('Import Project', 'Instructions');
    const result = importSession({
      channelName: 'Imported Channel',
      source: 'claude-ai',
      sourceMetadata: { originalSessionId: 'test-123' },
      turns: [{ userText: 'Hello', assistantText: 'Hi there', timestamp: '2026-03-14T00:00:00Z' }],
      projectId: project.id,
    });
    expect(result.channelId).toBeTruthy();

    const linked = getProjectForChannel(result.channelId);
    expect(linked).toBeDefined();
    expect(linked!.id).toBe(project.id);
  });
});
