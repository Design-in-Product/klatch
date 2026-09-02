/**
 * Regression tests for the memories.json defect found 2026-08-28.
 *
 * Real claude.ai exports wrap the memory payload in a SINGLE-ELEMENT ARRAY:
 *   [{ conversations_memory: "<string>", project_memories: {...}, account_uuid }]
 * — documented in research/claude-export-format-analysis.docx.
 *
 * The original extractor treated *any* array as a list of memory items requiring
 * uuid/id, so the real container was skipped; the object branch below it was guarded
 * by !Array.isArray and never ran; and joinIfCharArray — the 2026-03-14 char-array
 * fix — was unreachable on real data. Result: every claude.ai import produced empty
 * memory, silently, with the preview reporting "0 memories" and no error, while
 * CHANGELOG.md:182 and docs/PROMPT-ASSEMBLY.md:69 stated it worked.
 *
 * The pre-existing tests passed because their fixtures used a hand-made shape
 * (loose items with uuid + char-array content) that the docx says does not occur.
 * Those shapes are still covered here, so back-compat is explicit rather than assumed.
 */
import { describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { extractFromZip } from '../import/claude-ai-zip.js';

function zipOf(memoriesJson: unknown): Buffer {
  const z = new AdmZip();
  z.addFile('conversations.json', Buffer.from('[]'));
  z.addFile('memories.json', Buffer.from(JSON.stringify(memoriesJson)));
  return z.toBuffer();
}

describe('memories.json — the real export shape', () => {
  it('reads an array-wrapped container with conversations_memory as a string', () => {
    const r = extractFromZip(zipOf([{
      account_uuid: 'acct-1',
      conversations_memory: 'User prefers concise answers. Works on Klatch.',
      project_memories: { 'proj-1': '**Project rules**\n- no optional complexity' },
    }]));

    expect(r.memories).toHaveLength(1);
    expect(r.memories[0].content).toBe('User prefers concise answers. Works on Klatch.');
    expect(r.projectMemories.get('proj-1')).toContain('no optional complexity');
  });

  it('reads a bare (not array-wrapped) container too', () => {
    const r = extractFromZip(zipOf({
      conversations_memory: 'bare object form',
      project_memories: { 'proj-2': 'bare project memory' },
    }));
    expect(r.memories[0].content).toBe('bare object form');
    expect(r.projectMemories.get('proj-2')).toBe('bare project memory');
  });

  it('joins char arrays inside an array-wrapped container', () => {
    const r = extractFromZip(zipOf([{
      conversations_memory: [...'Memory stored as a char array.'],
      project_memories: { 'proj-1': [...'Project memory as chars'] },
    }]));
    expect(r.memories[0].content).toBe('Memory stored as a char array.');
    expect(r.projectMemories.get('proj-1')).toBe('Project memory as chars');
  });

  it('accepts conversations_memory as an array of item objects', () => {
    const r = extractFromZip(zipOf([{
      conversations_memory: [
        { uuid: 'x1', content: 'item one' },
        { uuid: 'x2', content: 'item two' },
      ],
      project_memories: {},
    }]));
    expect(r.memories.map(m => m.content)).toEqual(['item one', 'item two']);
  });

  it('unwraps a project memory stored as an object rather than a bare string', () => {
    const r = extractFromZip(zipOf([{
      project_memories: { 'proj-3': { content: 'wrapped project memory' } },
    }]));
    expect(r.projectMemories.get('proj-3')).toBe('wrapped project memory');
  });
});

describe('memories.json — the astral-character bug', () => {
  it('does not void an entire memory because it contains an emoji', () => {
    // [...'👍'] yields one element whose .length is 2. The old test — every element
    // .length === 1 — failed for the whole array, so the memory silently became ''.
    const r = extractFromZip(zipOf([{
      conversations_memory: [...'Ship it \u{1F44D} today'],
      project_memories: {},
    }]));
    expect(r.memories).toHaveLength(1);
    expect(r.memories[0].content).toBe('Ship it \u{1F44D} today');
  });

  it('keeps a one-element array holding a whole string', () => {
    const r = extractFromZip(zipOf([{ conversations_memory: ['a complete memory string'] }]));
    expect(r.memories[0].content).toBe('a complete memory string');
  });
});

describe('memories.json — back-compat with the pre-existing fixture shape', () => {
  it('still reads loose items keyed by uuid with char-array content', () => {
    const r = extractFromZip(zipOf([
      { uuid: 'm1', content: [...'legacy char array item'] },
      { uuid: 'm2', text: 'legacy text item' },
    ]));
    expect(r.memories.map(m => m.uuid)).toEqual(['m1', 'm2']);
    expect(r.memories[0].content).toBe('legacy char array item');
    expect(r.memories[1].content).toBe('legacy text item');
  });

  it('preserves user-declared items with empty content (long-standing contract)', () => {
    // memories-parsing.test.ts pins this; an item carrying its own uuid is emitted even
    // when blank. Only entries synthesized from a container are skipped when empty.
    const r = extractFromZip(zipOf([{ uuid: 'm1', content: '' }]));
    expect(r.memories).toHaveLength(1);
    expect(r.memories[0].content).toBe('');
  });

  it('does not invent a blank entry from an empty container', () => {
    const r = extractFromZip(zipOf([{ account_uuid: 'a', conversations_memory: '   ', project_memories: {} }]));
    expect(r.memories).toHaveLength(0);
  });

  it('returns empty for an empty array without throwing', () => {
    const r = extractFromZip(zipOf([]));
    expect(r.memories).toHaveLength(0);
    expect(r.projectMemories.size).toBe(0);
  });
});
