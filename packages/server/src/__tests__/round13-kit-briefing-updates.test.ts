import { describe, it, expect } from 'vitest';
import { buildKitBriefing } from '../claude/client.js';
import type { Channel } from '@klatch/shared';

// ── Round 13 B2: Kit briefing MAXT F3 + F4 updates ─────────

describe('buildKitBriefing — Round 12 updates (MAXT F3 + F4)', () => {
  function makeChannel(overrides: Partial<Channel> = {}): Channel {
    return {
      id: 'ch-test',
      name: 'Test Channel',
      systemPrompt: '',
      model: 'claude-opus-4-6',
      mode: 'panel',
      createdAt: '2026-01-01T00:00:00.000Z',
      source: 'claude-code',
      ...overrides,
    };
  }

  it('includes current date string', () => {
    const briefing = buildKitBriefing(makeChannel());
    // Should contain a date like "Today is Saturday, March 28, 2026"
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    expect(briefing).toContain(`Today is ${today}`);
  });

  it('includes layer awareness text (MAXT F3)', () => {
    const briefing = buildKitBriefing(makeChannel());
    expect(briefing).toContain('project instructions and project memory');
    expect(briefing).toContain('without being able to identify their origin');
    expect(briefing).toContain('treat it as background knowledge');
  });

  it('includes layer awareness for claude-code sources', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    expect(briefing).toContain('project instructions and project memory');
  });

  it('includes layer awareness for claude-ai sources', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-ai' }));
    expect(briefing).toContain('project instructions and project memory');
  });

  it('includes file awareness text', () => {
    const briefing = buildKitBriefing(makeChannel());
    expect(briefing).toContain('attach files to messages');
    expect(briefing).toContain('fenced code blocks');
  });

  it('includes prompted acknowledgment for claude-code', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-code' }));
    expect(briefing).toContain('briefly acknowledge');
    expect(briefing).toContain('Claude Code session');
  });

  it('includes prompted acknowledgment for claude-ai', () => {
    const briefing = buildKitBriefing(makeChannel({ source: 'claude-ai' }));
    expect(briefing).toContain('briefly acknowledge');
    expect(briefing).toContain('claude.ai conversation');
  });

  it('does not inject CLAUDE.md/MEMORY.md when channel has a project', () => {
    const meta = { claudeMd: 'Project rules.', memoryMd: 'User prefs.' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
      projectId: 'proj-1',
    }));
    // With projectId, context comes from project level — not legacy sourceMetadata
    expect(briefing).not.toContain('Project instructions (CLAUDE.md)');
    expect(briefing).not.toContain('Project memory (MEMORY.md)');
  });

  it('still injects CLAUDE.md/MEMORY.md for channels without a project (legacy)', () => {
    const meta = { claudeMd: 'Project rules.', memoryMd: 'User prefs.' };
    const briefing = buildKitBriefing(makeChannel({
      sourceMetadata: JSON.stringify(meta),
      projectId: undefined,
    }));
    expect(briefing).toContain('Project instructions (CLAUDE.md)');
    expect(briefing).toContain('Project rules.');
    expect(briefing).toContain('Project memory (MEMORY.md)');
    expect(briefing).toContain('User prefs.');
  });
});
