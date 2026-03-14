/**
 * Tests for memories.json parsing edge cases.
 *
 * Bug found in Day 4 testing: memories.json may contain project_memories
 * where memory content is stored as character arrays (individual characters)
 * rather than plain strings. The parser needs to handle this by joining arrays.
 *
 * Related: research/memo-theseus-day4-testing-report.md
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

// Minimal valid conversation for ZIP extraction
const minConversation = {
  uuid: 'conv-1',
  name: 'Test',
  chat_messages: [
    { uuid: 'm1', sender: 'human', text: 'hi', created_at: '2026-01-01T00:00:00Z' },
  ],
};

describe('memories.json parsing', () => {
  it('parses standard string-content memories', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-1', content: 'User prefers TypeScript', created_at: '2026-01-01' },
        { uuid: 'mem-2', content: 'Project uses Vitest for testing', created_at: '2026-01-02' },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(2);
    expect(result.memories[0].content).toBe('User prefers TypeScript');
    expect(result.memories[1].content).toBe('Project uses Vitest for testing');
  });

  it('handles memory with empty content', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-1', content: '' },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('');
  });

  it('handles memory with text field instead of content', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-1', text: 'Uses dark mode' },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].content).toBe('Uses dark mode');
  });

  it('handles memory with id instead of uuid', () => {
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { id: 'mem-alt', content: 'Alt id format' },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    expect(result.memories[0].uuid).toBe('mem-alt');
  });

  // ── Bug: character array content ───────────────────────────

  it('BUG: content stored as character array returns empty string (current behavior)', () => {
    // Day 4 testing found that some memories have content as character arrays
    // e.g., ['U', 's', 'e', 'r', ...] instead of "User..."
    // Current parser: typeof mem.content === 'string' ? mem.content : ''
    // This silently drops array content.
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-arr', content: ['U', 's', 'e', 'r', ' ', 'l', 'i', 'k', 'e', 's', ' ', 'T', 'S'] },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    // Current behavior: drops the array content
    expect(result.memories[0].content).toBe('');
  });

  it.todo('FIXED: content stored as character array is joined into string');
  // After fix, this should pass:
  // expect(result.memories[0].content).toBe('User likes TS');

  it('BUG: content stored as string array returns empty string (current behavior)', () => {
    // Some memories might have content as an array of sentences
    const zip = makeZipWith({
      'conversations.json': [minConversation],
      'memories.json': [
        { uuid: 'mem-sarr', content: ['User prefers TypeScript', 'Project uses Vitest'] },
      ],
    });

    const result = extractFromZip(zip);
    expect(result.memories).toHaveLength(1);
    // Current behavior: drops the array content
    expect(result.memories[0].content).toBe('');
  });

  it.todo('FIXED: content stored as string array is joined with newlines');
  // After fix, this should pass:
  // expect(result.memories[0].content).toBe('User prefers TypeScript\nProject uses Vitest');
});

// ── Project-scoped memories (project_memories in memories.json) ──

describe('project_memories in memories.json', () => {
  // The Day 4 report mentions memories.json has a project_memories map
  // keyed by project UUID. Current parser doesn't handle this structure.

  it.todo('extracts project_memories keyed by project UUID');
  it.todo('associates project memories with the correct project');
  it.todo('joins character-array project memories into strings');
});
