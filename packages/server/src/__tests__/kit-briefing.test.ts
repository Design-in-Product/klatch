import { describe, it, expect } from 'vitest';
import { buildKitBriefing } from '../claude/client.js';
import type { Channel } from '@klatch/shared';

// ── buildKitBriefing ──────────────────────────────────────────────

describe('buildKitBriefing', () => {
  function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return {
      id: 'ch-test',
      name: 'Test Channel',
      systemPrompt: '',
      model: 'claude-opus-4-20250514',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'claude-code',
      ...overrides,
    };
  }

  it('mentions Claude Code for claude-code imports', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    expect(briefing).toContain('Claude Code');
    expect(briefing).toContain('do NOT have access to tools');
    expect(briefing).toContain('conversation-only');
  });

  it('mentions claude.ai for claude-ai imports', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-ai' }));
    expect(briefing).toContain('claude.ai');
    expect(briefing).toContain('do NOT have access to tools');
  });

  it('includes CLAUDE.md content from sourceMetadata', () => {
    const meta = { claudeMd: '# Project\n\nBuild instructions here.' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('Project instructions (CLAUDE.md)');
    expect(briefing).toContain('Build instructions here.');
  });

  it('includes MEMORY.md content from sourceMetadata', () => {
    const meta = { memoryMd: '# Memory\n\nUser prefers dark mode.' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('Project memory (MEMORY.md)');
    expect(briefing).toContain('User prefers dark mode.');
  });

  it('includes both CLAUDE.md and MEMORY.md when present', () => {
    const meta = {
      claudeMd: 'Project rules.',
      memoryMd: 'User preferences.',
    };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('Project instructions (CLAUDE.md)');
    expect(briefing).toContain('Project rules.');
    expect(briefing).toContain('Project memory (MEMORY.md)');
    expect(briefing).toContain('User preferences.');
  });

  it('truncates CLAUDE.md content exceeding MAX_CONTEXT_CHARS', () => {
    const longContent = 'x'.repeat(5000);
    const meta = { claudeMd: longContent };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('...(truncated)');
    // The briefing should contain at most 4000 chars of the content
    expect(briefing).not.toContain('x'.repeat(5000));
    expect(briefing).toContain('x'.repeat(4000));
  });

  it('truncates MEMORY.md content exceeding MAX_CONTEXT_CHARS', () => {
    const longContent = 'y'.repeat(5000);
    const meta = { memoryMd: longContent };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
    }));
    expect(briefing).toContain('...(truncated)');
    expect(briefing).toContain('y'.repeat(4000));
  });

  it('handles missing sourceMetadata gracefully', () => {
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: undefined,
    }));
    // Should still have the core orientation
    expect(briefing).toContain('conversation-only');
    // But no project context sections
    expect(briefing).not.toContain('CLAUDE.md');
    expect(briefing).not.toContain('MEMORY.md');
  });

  it('handles malformed sourceMetadata JSON gracefully', () => {
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: 'not-valid-json',
    }));
    // Should still have the core orientation without crashing
    expect(briefing).toContain('conversation-only');
  });
});
