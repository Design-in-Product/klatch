import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseClaudeAiConversation } from '../import/claude-ai-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures', 'claude-ai');

function readFixture(filename: string): unknown {
  const content = fs.readFileSync(path.join(FIXTURES, filename), 'utf-8');
  return JSON.parse(content);
}

// ── Conversation metadata ─────────────────────────────────────

describe('parseClaudeAiConversation — metadata', () => {
  it('extracts conversation uuid as sessionId', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.sessionId).toBe('conv-simple-001');
  });

  it('extracts conversation name as slug', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.slug).toBe('Chat about React');
  });
});

// ── Turn grouping ─────────────────────────────────────────────

describe('parseClaudeAiConversation — turn grouping', () => {
  it('groups human/assistant messages into turns', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns.length).toBe(2);
  });

  it('preserves chronological order', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    const t1 = new Date(result.turns[0].timestamp).getTime();
    const t2 = new Date(result.turns[1].timestamp).getTime();
    expect(t1).toBeLessThan(t2);
  });

  it('associates each turn with the human message timestamp', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].timestamp).toBe('2026-01-15T10:00:00.000Z');
    expect(result.turns[1].timestamp).toBe('2026-01-15T10:02:00.000Z');
  });
});

// ── Text extraction ───────────────────────────────────────────

describe('parseClaudeAiConversation — text extraction', () => {
  it('extracts user text from content array', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].userText).toBe('What is React?');
  });

  it('extracts assistant text from content array', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].assistantText).toBe(
      'React is a JavaScript library for building user interfaces.'
    );
  });

  it('concatenates multiple assistant messages in a turn', () => {
    const conv = readFixture('tool-heavy-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].assistantText).toContain('analyze the data');
    expect(result.turns[0].assistantText).toContain('steady growth');
  });

  it('falls back to top-level text field when content array has no text blocks', () => {
    const conv = {
      uuid: 'conv-fallback',
      name: 'Fallback test',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-fb-1',
          text: 'Hello from text field',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [],
        },
        {
          uuid: 'msg-fb-2',
          text: 'Response from text field',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].userText).toBe('Hello from text field');
    expect(result.turns[0].assistantText).toBe('Response from text field');
  });
});

// ── Tool-use summarization ────────────────────────────────────

describe('parseClaudeAiConversation — tool summarization', () => {
  it('extracts tool_use blocks as artifacts', () => {
    const conv = readFixture('tool-heavy-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].artifacts).toBeDefined();
    expect(result.turns[0].artifacts!.length).toBe(2);
  });

  it('captures tool names', () => {
    const conv = readFixture('tool-heavy-conversation.json');
    const result = parseClaudeAiConversation(conv);
    const toolNames = result.turns[0].artifacts!.map((a) => a.toolName);
    expect(toolNames).toContain('analysis');
    expect(toolNames).toContain('artifacts');
  });

  it('summarizes artifacts tool with title', () => {
    const conv = readFixture('tool-heavy-conversation.json');
    const result = parseClaudeAiConversation(conv);
    const artifact = result.turns[0].artifacts!.find((a) => a.toolName === 'artifacts');
    expect(artifact?.inputSummary).toContain('Sales Chart');
  });

  it('summarizes analysis tool', () => {
    const conv = readFixture('tool-heavy-conversation.json');
    const result = parseClaudeAiConversation(conv);
    const artifact = result.turns[0].artifacts!.find((a) => a.toolName === 'analysis');
    expect(artifact?.inputSummary).toBe('Ran analysis');
  });

  it('does not create artifacts for turns without tool_use', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].artifacts).toBeUndefined();
  });
});

// ── Edge cases ──────────────────────────────────────────────

describe('parseClaudeAiConversation — edge cases', () => {
  it('handles null/undefined input', () => {
    const result = parseClaudeAiConversation(null);
    expect(result.turns.length).toBe(0);
  });

  it('handles empty chat_messages', () => {
    const conv = {
      uuid: 'conv-empty',
      name: 'Empty',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns.length).toBe(0);
    expect(result.sessionId).toBe('conv-empty');
  });

  it('handles single human message with no assistant response', () => {
    const conv = {
      uuid: 'conv-single',
      name: 'Single msg',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-single-1',
          text: 'Hello?',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Hello?' }],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns.length).toBe(1);
    expect(result.turns[0].userText).toBe('Hello?');
    expect(result.turns[0].assistantText).toBe('');
  });

  it('handles missing uuid field', () => {
    const conv = {
      name: 'No UUID',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Hi',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Hi' }],
        },
        {
          uuid: 'msg-2',
          text: 'Hello!',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [{ type: 'text', text: 'Hello!' }],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.sessionId).toBeUndefined();
    expect(result.turns.length).toBe(1);
  });

  it('handles missing name field', () => {
    const conv = {
      uuid: 'conv-no-name',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Hi',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Hi' }],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.slug).toBeUndefined();
  });

  it('handles missing chat_messages field', () => {
    const result = parseClaudeAiConversation({ uuid: 'conv-no-msgs', name: 'Broken' });
    expect(result.turns.length).toBe(0);
  });

  it('handles chat_messages as non-array', () => {
    const result = parseClaudeAiConversation({
      uuid: 'conv-bad',
      name: 'Bad',
      chat_messages: 'not an array',
    });
    expect(result.turns.length).toBe(0);
  });

  it('reports eventCount based on chat_messages length', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.eventCount).toBe(4); // 4 messages in simple-conversation.json
  });
});

// ── Multiple content blocks per message ─────────────────────

describe('parseClaudeAiConversation — multiple content blocks', () => {
  it('joins multiple text blocks with newline', () => {
    const conv = {
      uuid: 'conv-multi-text',
      name: 'Multi text',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Tell me about cats',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Tell me about cats' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'text', text: 'Cats are fascinating creatures.' },
            { type: 'text', text: 'They are obligate carnivores.' },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].assistantText).toBe('Cats are fascinating creatures.\nThey are obligate carnivores.');
  });

  it('extracts text from messages with mixed text and tool_use blocks', () => {
    const conv = {
      uuid: 'conv-mixed',
      name: 'Mixed blocks',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Search for cats',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Search for cats' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'text', text: 'Let me search for that.' },
            { type: 'tool_use', name: 'web_search', input: { query: 'cats' } },
            { type: 'text', text: 'Here are the results.' },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].assistantText).toBe('Let me search for that.\nHere are the results.');
    expect(result.turns[0].artifacts).toHaveLength(1);
    expect(result.turns[0].artifacts![0].toolName).toBe('web_search');
    expect(result.turns[0].artifacts![0].inputSummary).toBe('Searched: cats');
  });

  it('handles message with only tool_use content (no text blocks)', () => {
    const conv = {
      uuid: 'conv-tool-only',
      name: 'Tool only',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Analyze this',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Analyze this' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'tool_use', name: 'analysis', input: { code: 'print(42)' } },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].assistantText).toBe('');
    expect(result.turns[0].artifacts).toHaveLength(1);
    expect(result.turns[0].artifacts![0].inputSummary).toBe('Ran analysis');
  });

  it('handles consecutive human messages (second starts new turn)', () => {
    const conv = {
      uuid: 'conv-double-human',
      name: 'Double human',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'First question',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'First question' }],
        },
        {
          uuid: 'msg-2',
          text: 'Actually, second question',
          sender: 'human',
          created_at: '2026-01-15T10:01:00.000Z',
          content: [{ type: 'text', text: 'Actually, second question' }],
        },
        {
          uuid: 'msg-3',
          text: 'Response to second',
          sender: 'assistant',
          created_at: '2026-01-15T10:01:05.000Z',
          content: [{ type: 'text', text: 'Response to second' }],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns.length).toBe(2);
    expect(result.turns[0].userText).toBe('First question');
    expect(result.turns[0].assistantText).toBe(''); // no response to first
    expect(result.turns[1].userText).toBe('Actually, second question');
    expect(result.turns[1].assistantText).toBe('Response to second');
  });

  it('summarizes web_search tool with query', () => {
    const conv = {
      uuid: 'conv-ws',
      name: 'Web search',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Search',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Search' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'tool_use', name: 'web_search', input: { query: 'latest React version' } },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].artifacts![0].inputSummary).toBe('Searched: latest React version');
  });

  it('summarizes unknown tool by first input key value', () => {
    const conv = {
      uuid: 'conv-unknown',
      name: 'Unknown tool',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Do something',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Do something' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'tool_use', name: 'custom_tool', input: { filename: 'data.csv' } },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].artifacts![0].toolName).toBe('custom_tool');
    expect(result.turns[0].artifacts![0].inputSummary).toBe('data.csv');
  });

  it('handles tool_use with no input', () => {
    const conv = {
      uuid: 'conv-no-input',
      name: 'No input',
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      chat_messages: [
        {
          uuid: 'msg-1',
          text: 'Go',
          sender: 'human',
          created_at: '2026-01-15T10:00:00.000Z',
          content: [{ type: 'text', text: 'Go' }],
        },
        {
          uuid: 'msg-2',
          text: '',
          sender: 'assistant',
          created_at: '2026-01-15T10:00:05.000Z',
          content: [
            { type: 'tool_use', name: 'some_tool' },
          ],
        },
      ],
    };
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].artifacts![0].toolName).toBe('some_tool');
    expect(result.turns[0].artifacts![0].inputSummary).toBe('');
  });

  it('preserves originalId from human message uuid', () => {
    const conv = readFixture('simple-conversation.json');
    const result = parseClaudeAiConversation(conv);
    expect(result.turns[0].originalId).toBe('msg-001');
    expect(result.turns[1].originalId).toBe('msg-003');
  });
});
