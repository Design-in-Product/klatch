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
});
