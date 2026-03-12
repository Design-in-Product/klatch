import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../components/MessageList';
import type { Message, Entity } from '@klatch/shared';

// ── Helpers ──────────────────────────────────────────────────

function makeMessage(overrides: Partial<Message> & { id: string }): Message {
  return {
    channelId: 'ch-1',
    role: 'user',
    content: 'test message',
    status: 'complete',
    createdAt: '2026-03-12T10:00:00Z',
    ...overrides,
  };
}

const defaultEntity: Entity = {
  id: 'ent-1',
  name: 'Claude',
  model: 'claude-opus-4-6',
  systemPrompt: 'You are helpful.',
  color: '#6366f1',
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  getStreamContent: () => '',
  isMessageStreaming: () => false,
  channelEntities: [defaultEntity],
  theme: 'light' as const,
};

// ── Fork marker tests ────────────────────────────────────────

describe('MessageList — fork marker', () => {
  it('does not show fork marker for native channels', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Hello' }),
      makeMessage({ id: 'msg-2', role: 'assistant', content: 'Hi', entityId: 'ent-1' }),
    ];

    render(
      <MessageList {...defaultProps} messages={messages} channelSource="native" />
    );

    expect(screen.queryByText(/Continued in Klatch/)).not.toBeInTheDocument();
  });

  it('does not show fork marker when channelSource is undefined', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Hello' }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.queryByText(/Continued in Klatch/)).not.toBeInTheDocument();
  });

  it('does not show fork marker for imported channels with ONLY imported messages', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Hello', originalId: 'orig-1' }),
      makeMessage({ id: 'msg-2', role: 'assistant', content: 'Hi', originalId: 'orig-2', entityId: 'ent-1' }),
    ];

    render(
      <MessageList {...defaultProps} messages={messages} channelSource="claude-code" />
    );

    expect(screen.queryByText(/Continued in Klatch/)).not.toBeInTheDocument();
  });

  it('shows fork marker between imported and new messages', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Imported question', originalId: 'orig-1' }),
      makeMessage({ id: 'msg-2', role: 'assistant', content: 'Imported answer', originalId: 'orig-2', entityId: 'ent-1' }),
      makeMessage({ id: 'msg-3', role: 'user', content: 'New Klatch message', createdAt: '2026-03-12T12:00:00Z' }),
    ];

    render(
      <MessageList {...defaultProps} messages={messages} channelSource="claude-code" />
    );

    expect(screen.getByText(/Continued in Klatch/)).toBeInTheDocument();
  });

  it('shows fork marker with date from first new message', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Old', originalId: 'orig-1' }),
      makeMessage({ id: 'msg-2', role: 'assistant', content: 'Old reply', originalId: 'orig-2', entityId: 'ent-1' }),
      makeMessage({ id: 'msg-3', role: 'user', content: 'New', createdAt: '2026-03-12T12:00:00Z' }),
    ];

    render(
      <MessageList {...defaultProps} messages={messages} channelSource="claude-code" />
    );

    // Should include a formatted date from msg-3's createdAt
    expect(screen.getByText(/Mar 12, 2026/)).toBeInTheDocument();
  });

  it('shows fork marker for claude-ai imported channels too', () => {
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'claude.ai msg', originalId: 'conv-1' }),
      makeMessage({ id: 'msg-2', role: 'user', content: 'Klatch msg' }),
    ];

    render(
      <MessageList {...defaultProps} messages={messages} channelSource="claude-ai" />
    );

    expect(screen.getByText(/Continued in Klatch/)).toBeInTheDocument();
  });

  it('places marker after the LAST imported message when mixed', () => {
    // Scenario: imported, imported, new, new
    const messages = [
      makeMessage({ id: 'msg-1', role: 'user', content: 'Import 1', originalId: 'o-1' }),
      makeMessage({ id: 'msg-2', role: 'assistant', content: 'Import 2', originalId: 'o-2', entityId: 'ent-1' }),
      makeMessage({ id: 'msg-3', role: 'user', content: 'New 1' }),
      makeMessage({ id: 'msg-4', role: 'assistant', content: 'New 2', entityId: 'ent-1' }),
    ];

    const { container } = render(
      <MessageList {...defaultProps} messages={messages} channelSource="claude-code" />
    );

    // The marker should appear once
    const markers = container.querySelectorAll('.text-faint.font-medium');
    const forkMarkers = Array.from(markers).filter((el) =>
      el.textContent?.includes('Continued in Klatch')
    );
    expect(forkMarkers).toHaveLength(1);
  });
});

// ── Empty state ──────────────────────────────────────────────

describe('MessageList — empty state', () => {
  it('shows empty state when no messages', () => {
    render(<MessageList {...defaultProps} messages={[]} />);
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
  });

  it('hides empty state when messages are present', () => {
    const messages = [makeMessage({ id: 'msg-1', role: 'user', content: 'Hi' })];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument();
  });
});

// ── Message rendering ────────────────────────────────────────

describe('MessageList — message rendering', () => {
  it('renders user messages with "You" label', () => {
    const messages = [makeMessage({ id: 'msg-1', role: 'user', content: 'Hello' })];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders assistant messages with entity name', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        role: 'assistant',
        content: 'Response',
        entityId: 'ent-1',
        model: 'claude-opus-4-6',
      }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });

  it('shows model badge for assistant messages', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        role: 'assistant',
        content: 'Response',
        entityId: 'ent-1',
        model: 'claude-opus-4-6',
      }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText('Opus')).toBeInTheDocument();
  });

  it('shows "..." for streaming messages with no content', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        role: 'assistant',
        content: '',
        status: 'streaming',
        entityId: 'ent-1',
      }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows error indicator for error status messages', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        role: 'assistant',
        content: '',
        status: 'error',
        entityId: 'ent-1',
      }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText('Error generating response')).toBeInTheDocument();
  });
});
