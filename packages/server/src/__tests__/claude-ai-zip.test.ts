import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { extractConversationsFromZip } from '../import/claude-ai-zip.js';

/** Helper: create a ZIP buffer with the given entries */
function makeZip(entries: Record<string, string | Buffer>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(entries)) {
    zip.addFile(name, typeof content === 'string' ? Buffer.from(content) : content);
  }
  return zip.toBuffer();
}

function makeConversation(uuid: string, name: string, messages: number = 1) {
  return {
    uuid,
    name,
    created_at: '2026-01-15T10:00:00.000Z',
    updated_at: '2026-01-15T10:05:00.000Z',
    chat_messages: Array.from({ length: messages }, (_, i) => ({
      uuid: `${uuid}-msg-${i}`,
      text: `Message ${i}`,
      sender: i % 2 === 0 ? 'human' : 'assistant',
      created_at: `2026-01-15T10:0${i}:00.000Z`,
      content: [{ type: 'text', text: `Message ${i}` }],
    })),
  };
}

// ── Format 1: root conversations.json array (current claude.ai format) ──

describe('extractConversationsFromZip — Format 1 (conversations.json array)', () => {
  it('extracts conversations from root conversations.json array', () => {
    const convs = [makeConversation('c1', 'First'), makeConversation('c2', 'Second')];
    const buf = makeZip({ 'conversations.json': JSON.stringify(convs) });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(2);
  });

  it('uses uuid in filename for each extracted conversation', () => {
    const convs = [makeConversation('abc-123', 'Test')];
    const buf = makeZip({ 'conversations.json': JSON.stringify(convs) });
    const result = extractConversationsFromZip(buf);
    expect(result[0].filename).toContain('abc-123');
  });

  it('skips entries in the array without chat_messages', () => {
    const convs = [
      makeConversation('c1', 'Valid'),
      { uuid: 'c2', name: 'No messages' },  // missing chat_messages
      { uuid: 'c3', name: 'Null messages', chat_messages: null },
    ];
    const buf = makeZip({ 'conversations.json': JSON.stringify(convs) });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
    expect((result[0].conversation as any).uuid).toBe('c1');
  });

  it('handles conversations.json nested in a subdirectory', () => {
    const convs = [makeConversation('c1', 'Nested')];
    const buf = makeZip({ 'export-data/conversations.json': JSON.stringify(convs) });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
  });

  it('falls back to index for filename when uuid is missing', () => {
    const conv = { name: 'No UUID', chat_messages: [{ uuid: 'm1', text: 'Hi', sender: 'human', created_at: '2026-01-15T10:00:00.000Z' }] };
    const buf = makeZip({ 'conversations.json': JSON.stringify([conv]) });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
    // Should use the array index as fallback
    expect(result[0].filename).toBeTruthy();
  });
});

// ── Format 2: individual files in conversations/ directory ──

describe('extractConversationsFromZip — Format 2 (conversations/ directory)', () => {
  it('extracts individual JSON files from conversations/ directory', () => {
    const buf = makeZip({
      'conversations/conv1.json': JSON.stringify(makeConversation('c1', 'First')),
      'conversations/conv2.json': JSON.stringify(makeConversation('c2', 'Second')),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(2);
  });

  it('preserves original filename for individual files', () => {
    const buf = makeZip({
      'conversations/my-chat.json': JSON.stringify(makeConversation('c1', 'My Chat')),
    });
    const result = extractConversationsFromZip(buf);
    expect(result[0].filename).toBe('conversations/my-chat.json');
  });

  it('skips files without chat_messages in conversations/ directory', () => {
    const buf = makeZip({
      'conversations/valid.json': JSON.stringify(makeConversation('c1', 'Valid')),
      'conversations/invalid.json': JSON.stringify({ uuid: 'c2', name: 'No messages' }),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
  });

  it('handles nested conversations/ path (e.g. export/conversations/)', () => {
    const buf = makeZip({
      'data/conversations/chat.json': JSON.stringify(makeConversation('c1', 'Nested')),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
  });
});

// ── Edge cases ──────────────────────────────────────────────

describe('extractConversationsFromZip — edge cases', () => {
  it('returns empty array for ZIP with no JSON files', () => {
    const buf = makeZip({
      'readme.txt': 'This is not a conversation',
      'data.csv': 'col1,col2\n1,2',
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for ZIP with JSON outside conversations/', () => {
    // JSON file not named conversations.json and not in conversations/ directory
    const buf = makeZip({
      'settings.json': JSON.stringify({ theme: 'dark' }),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(0);
  });

  it('skips malformed JSON files gracefully', () => {
    const buf = makeZip({
      'conversations/valid.json': JSON.stringify(makeConversation('c1', 'Valid')),
      'conversations/broken.json': '{ invalid json !!!',
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
  });

  it('throws for invalid ZIP buffer', () => {
    expect(() => {
      extractConversationsFromZip(Buffer.from('not a zip'));
    }).toThrow();
  });

  it('skips directory entries', () => {
    const zip = new AdmZip();
    zip.addFile('conversations/', Buffer.alloc(0)); // directory entry
    zip.addFile('conversations/chat.json', Buffer.from(JSON.stringify(makeConversation('c1', 'Chat'))));
    const result = extractConversationsFromZip(zip.toBuffer());
    expect(result).toHaveLength(1);
  });

  it('handles both formats in same ZIP (conversations.json + conversations/ dir)', () => {
    const arrayConv = makeConversation('from-array', 'Array Conv');
    const dirConv = makeConversation('from-dir', 'Dir Conv');
    const buf = makeZip({
      'conversations.json': JSON.stringify([arrayConv]),
      'conversations/dir-conv.json': JSON.stringify(dirConv),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(2);
    const uuids = result.map((r) => (r.conversation as any).uuid);
    expect(uuids).toContain('from-array');
    expect(uuids).toContain('from-dir');
  });

  it('handles conversations.json that is an object (not array) — skips it', () => {
    // If conversations.json is an object instead of array, it's not Format 1
    // and it's not in conversations/ directory, so it should be skipped
    const buf = makeZip({
      'conversations.json': JSON.stringify({ uuid: 'single', name: 'Not array', chat_messages: [] }),
    });
    const result = extractConversationsFromZip(buf);
    // Not an array, so Format 1 doesn't match; not in conversations/ dir, so Format 2 doesn't match
    expect(result).toHaveLength(0);
  });

  it('handles empty conversations.json array', () => {
    const buf = makeZip({ 'conversations.json': '[]' });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(0);
  });

  it('skips non-.json files in conversations/ directory', () => {
    const buf = makeZip({
      'conversations/chat.json': JSON.stringify(makeConversation('c1', 'Chat')),
      'conversations/notes.txt': 'Some notes',
      'conversations/image.png': Buffer.alloc(10),
    });
    const result = extractConversationsFromZip(buf);
    expect(result).toHaveLength(1);
  });
});
