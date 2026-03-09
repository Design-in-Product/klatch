import { describe, it, expect } from 'vitest';
import { parseMentions, resolveMentions } from '@klatch/shared';
import type { Entity, ModelId } from '@klatch/shared';

// Helper to create a mock entity
function mockEntity(name: string, handle?: string): Entity {
  return {
    id: `entity-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    handle,
    model: 'claude-opus-4-6' as ModelId,
    systemPrompt: '',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
  };
}

// ── parseMentions ────────────────────────────────────────────

describe('parseMentions', () => {
  it('parses simple @Name', () => {
    expect(parseMentions('@Claude hello')).toEqual(['claude']);
  });

  it('parses @name with hyphens', () => {
    expect(parseMentions('@code-reviewer check this')).toEqual(['code-reviewer']);
  });

  it('parses @name with underscores', () => {
    expect(parseMentions('@my_bot help')).toEqual(['my_bot']);
  });

  it('parses quoted @"Name with spaces"', () => {
    expect(parseMentions('@"Chief of Staff" hello')).toEqual(['chief of staff']);
  });

  it('parses multiple mentions', () => {
    const result = parseMentions('@Claude @Reviewer please review');
    expect(result).toEqual(['claude', 'reviewer']);
  });

  it('deduplicates mentions', () => {
    const result = parseMentions('@Claude @Claude hello');
    expect(result).toEqual(['claude']);
  });

  it('handles case insensitivity (lowercases)', () => {
    expect(parseMentions('@CLAUDE hello')).toEqual(['claude']);
  });

  it('returns empty for no mentions', () => {
    expect(parseMentions('hello world')).toEqual([]);
  });

  it('handles @ preceded by word char (email-like) as a mention', () => {
    // The regex uses /(^|[^\w])@.../ so email@example matches @example
    // This is acceptable since users won't type emails in the chat
    expect(parseMentions('email@example.com')).toEqual(['example']);
  });

  it('handles mention at start of string', () => {
    expect(parseMentions('@Claude')).toEqual(['claude']);
  });

  it('handles mention after newline', () => {
    expect(parseMentions('hello\n@Claude')).toEqual(['claude']);
  });

  it('handles mixed quoted and unquoted', () => {
    const result = parseMentions('@Claude @"Chief of Staff" thoughts?');
    expect(result).toEqual(['claude', 'chief of staff']);
  });

  it('handles alphanumeric names', () => {
    expect(parseMentions('@Bot3 hello')).toEqual(['bot3']);
  });
});

// ── resolveMentions ──────────────────────────────────────────

describe('resolveMentions', () => {
  const entities = [
    mockEntity('Claude'),
    mockEntity('Code Reviewer'),
    mockEntity('Chief of Staff', 'exec'),
    mockEntity('Analyst', 'cxo'),
  ];

  it('resolves by name (case-insensitive)', () => {
    const result = resolveMentions('@claude hello', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Claude');
  });

  it('resolves by name with different casing', () => {
    const result = resolveMentions('@CLAUDE hello', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Claude');
  });

  it('resolves by handle', () => {
    const result = resolveMentions('@exec what do you think?', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chief of Staff');
  });

  it('resolves by handle (case-insensitive)', () => {
    const result = resolveMentions('@EXEC update', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chief of Staff');
  });

  it('resolves quoted names with spaces', () => {
    const result = resolveMentions('@"Code Reviewer" check this', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Code Reviewer');
  });

  it('resolves quoted name "Chief of Staff"', () => {
    const result = resolveMentions('@"Chief of Staff" hello', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chief of Staff');
  });

  it('resolves multiple mentions to multiple entities', () => {
    const result = resolveMentions('@Claude @exec review this', entities);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.name)).toContain('Claude');
    expect(result.map((e) => e.name)).toContain('Chief of Staff');
  });

  it('returns empty when no entities match', () => {
    const result = resolveMentions('@nonexistent hello', entities);
    expect(result).toHaveLength(0);
  });

  it('returns empty for no mentions', () => {
    const result = resolveMentions('hello world', entities);
    expect(result).toHaveLength(0);
  });

  it('prefers both name and handle matches (no duplicates)', () => {
    // If someone writes @exec AND @"Chief of Staff", both match the same entity
    const result = resolveMentions('@exec @"Chief of Staff"', entities);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chief of Staff');
  });

  it('handles entity with no handle gracefully', () => {
    const result = resolveMentions('@Claude', entities);
    expect(result).toHaveLength(1);
    // Claude has no handle, but name matches
  });
});
