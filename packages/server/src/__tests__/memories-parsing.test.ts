/**
 * Integration tests for memories.json parsing — covers the character array
 * bug fix (Daedalus 8¾a) and project_memories extraction.
 *
 * Bug found in Day 4 testing: memories.json may contain project_memories
 * where memory content is stored as character arrays instead of strings.
 * Fixed in joinIfCharArray() in claude-ai-zip.ts.
 */
import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { extractFromZip } from '../import/claude-ai-zip.js';

function makeZipWith(files: Record<string, unknown>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(JSON.stringify(content)));
  }
  return zip.toBuffer();
}

const minConversation = {
  uuid: 'conv-1',
  name: 'Test',
  chat_messages: [
    { uuid: 'm1', sender: 'human', text: 'hi', created_at: '2026-01-01T00:00:00Z' },
  ],
};

describe('memories.json — standard parsing', () => {
  it('parses string-content memories', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-1', content: 'User prefers TypeScript', created_at: '2026-01-01' },
        { uuid: 'mem-2', content: 'Project uses Vitest', created_at: '2026-01-02' },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].content).toBe('User prefers TypeScript');
    expect(result.memories[1].content).toBe('Project uses Vitest');
  });

  it('handles memory with empty content', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [{ uuid: 'mem-1', content: '' }],
    });
    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('');
  });

  it('handles memory with text field instead of content', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [{ uuid: 'mem-1', text: 'Uses dark mode' }],
    });
    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('Uses dark mode');
  });

  it('handles memory with id instead of uuid', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [{ id: 'mem-alt', content: 'Alt id format' }],
    });
    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].uuid).toBe('mem-alt');
  });
});

// ── Character array bug fix (Day 4 finding, fixed in 8¾a) ───────

describe('memories.json — character array bug fix', () => {
  it('joins character arrays into strings (legacy array format)', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-arr', content: ['U', 's', 'e', 'r', ' ', 'l', 'i', 'k', 'e', 's', ' ', 'T', 'S'] },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('User likes TS');
  });

  it('joins character arrays in conversations_memory (object format)', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': {
        conversations_memory: [
          { uuid: 'mem-1', content: ['T', 'e', 's', 't'] },
        ],
        project_memories: {},
      },
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('Test');
  });

  it('handles mixed string and char-array memories', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-str', content: 'Regular string memory' },
        { uuid: 'mem-arr', content: ['C', 'h', 'a', 'r', 's'] },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].content).toBe('Regular string memory');
    expect(result.memories[1].content).toBe('Chars');
  });
});

// ── Project-scoped memories ─────────────────────────────────────

describe('memories.json — project_memories', () => {
  it('extracts project_memories keyed by project UUID', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': {
        conversations_memory: [],
        project_memories: {
          'proj-1': 'User prefers functional programming.',
          'proj-2': 'Project uses React 19.',
        },
      },
    });

    const result = extractFromZip(zip);
    expect(result.projectMemories.get('proj-1')).toBe('User prefers functional programming.');
    expect(result.projectMemories.get('proj-2')).toBe('Project uses React 19.');
  });

  it('joins character-array project memories into strings', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': {
        conversations_memory: [],
        project_memories: {
          'proj-mem': ['H', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd'],
        },
      },
    });

    const result = extractFromZip(zip);
    expect(result.projectMemories.get('proj-mem')).toBe('Hello world');
  });

  it('skips empty/whitespace project memories', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': {
        conversations_memory: [],
        project_memories: {
          'proj-1': '',
          'proj-2': '   ',
          'proj-3': 'Real content.',
        },
      },
    });

    const result = extractFromZip(zip);
    expect(result.projectMemories.has('proj-1')).toBe(false);
    expect(result.projectMemories.has('proj-2')).toBe(false);
    expect(result.projectMemories.get('proj-3')).toBe('Real content.');
  });
});
