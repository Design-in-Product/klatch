import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { extractFromZip } from '../import/claude-ai-zip.js';
import { buildKitBriefing } from '../claude/client.js';
import type { Channel } from '@klatch/shared';

/**
 * Tests for 8¾a: project context injection
 *
 * Covers:
 * - prompt_template extraction from projects.json
 * - Project docs content extraction
 * - memories.json character array bug fix
 * - Project memories extraction
 * - Kit briefing behavior with/without project link
 */

function makeTestZip(files: Record<string, unknown>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(JSON.stringify(content)));
  }
  return zip.toBuffer();
}

describe('extractFromZip — prompt_template extraction', () => {
  it('extracts prompt_template from projects.json', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [
        { uuid: 'proj-1', name: 'My Project', prompt_template: 'You are a helpful assistant for Project X.' },
      ],
      'conversations.json': [
        { uuid: 'conv-1', name: 'Test Chat', chat_messages: [{ uuid: 'm1', sender: 'human', text: 'Hi' }] },
      ],
    });

    const result = extractFromZip(zipBuffer);
    const project = result.projects.get('proj-1');
    expect(project).toBeDefined();
    expect(project!.promptTemplate).toBe('You are a helpful assistant for Project X.');
  });

  it('handles missing prompt_template gracefully', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [
        { uuid: 'proj-2', name: 'No Template Project' },
      ],
      'conversations.json': [],
    });

    const result = extractFromZip(zipBuffer);
    const project = result.projects.get('proj-2');
    expect(project).toBeDefined();
    expect(project!.promptTemplate).toBeUndefined();
  });

  it('extracts docs content from project knowledge files', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [
        {
          uuid: 'proj-3',
          name: 'Docs Project',
          docs: [
            { filename: 'guide.md', content: 'This is a guide.' },
            { filename: 'reference.md', content: 'This is a reference.' },
          ],
        },
      ],
      'conversations.json': [],
    });

    const result = extractFromZip(zipBuffer);
    const project = result.projects.get('proj-3');
    expect(project!.docsContent).toContain('guide.md');
    expect(project!.docsContent).toContain('This is a guide.');
    expect(project!.docsContent).toContain('reference.md');
    expect(project!.documentCount).toBe(2);
  });
});

describe('extractFromZip — memories character array bug', () => {
  it('joins character arrays in project_memories', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [
        { uuid: 'proj-mem', name: 'Memory Test' },
      ],
      'conversations.json': [],
      'memories.json': {
        conversations_memory: [],
        project_memories: {
          'proj-mem': ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'],
        },
      },
    });

    const result = extractFromZip(zipBuffer);
    const projMem = result.projectMemories.get('proj-mem');
    expect(projMem).toBe('Hello world');
  });

  it('handles string project_memories normally', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [
        { uuid: 'proj-str', name: 'String Memory' },
      ],
      'conversations.json': [],
      'memories.json': {
        conversations_memory: [],
        project_memories: {
          'proj-str': 'This is a normal string memory.',
        },
      },
    });

    const result = extractFromZip(zipBuffer);
    const projMem = result.projectMemories.get('proj-str');
    expect(projMem).toBe('This is a normal string memory.');
  });

  it('handles conversation-level memories with char arrays', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [],
      'conversations.json': [],
      'memories.json': {
        conversations_memory: [
          { uuid: 'mem-1', content: ['T', 'e', 's', 't'] },
        ],
        project_memories: {},
      },
    });

    const result = extractFromZip(zipBuffer);
    expect(result.memories.length).toBe(1);
    expect(result.memories[0].content).toBe('Test');
  });

  it('handles legacy array format memories.json', () => {
    const zipBuffer = makeTestZip({
      'projects.json': [],
      'conversations.json': [],
      'memories.json': [
        { uuid: 'mem-2', content: 'Regular string memory' },
        { uuid: 'mem-3', content: ['C', 'h', 'a', 'r', 's'] },
      ],
    });

    const result = extractFromZip(zipBuffer);
    expect(result.memories.length).toBe(2);
    expect(result.memories[0].content).toBe('Regular string memory');
    expect(result.memories[1].content).toBe('Chars');
  });
});

describe('buildKitBriefing — project link behavior', () => {
  it('does NOT inject claudeMd when channel has a projectId', () => {
    const channel: Channel = {
      id: 'ch-1',
      name: 'Test',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-14T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ claudeMd: 'CLAUDE.md content here' }),
      projectId: 'proj-1', // Has a project link
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).not.toContain('CLAUDE.md content here');
  });

  it('DOES inject claudeMd as fallback when channel has no projectId', () => {
    const channel: Channel = {
      id: 'ch-2',
      name: 'Legacy',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-14T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ claudeMd: 'CLAUDE.md content here' }),
      // No projectId — legacy import
    };

    const briefing = buildKitBriefing(channel);
    expect(briefing).toContain('imported into Klatch');
    expect(briefing).toContain('CLAUDE.md content here');
  });

  it('always injects memoryMd regardless of project link', () => {
    const channelWithProject: Channel = {
      id: 'ch-3',
      name: 'With Project',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-03-14T00:00:00Z',
      source: 'claude-code',
      sourceMetadata: JSON.stringify({ memoryMd: 'Memory content' }),
      projectId: 'proj-1',
    };

    const briefing = buildKitBriefing(channelWithProject);
    expect(briefing).toContain('Memory content');
  });
});
