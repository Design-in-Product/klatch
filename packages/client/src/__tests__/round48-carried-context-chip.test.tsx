import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../components/MessageList';
import type { Message, Entity } from '@klatch/shared';

// Round 48 — carried-context chip (client half of Iris's 2026-08-13 ruling,
// docs/ux/carried-context-visibility-2026-08-13.md). Server half (persisting
// the artifact) already covered by round40/round41 server suites; this pins
// the render: existence + room count only, no content, no channel names, and
// no interference with the other artifact rows sharing the same list.

const defaultEntity: Entity = {
  id: 'ent-1',
  name: 'Claude',
  model: 'claude-opus-5',
  systemPrompt: 'You are helpful.',
  color: '#6366f1',
  effort: 'high',
  createdAt: '2026-01-01T00:00:00Z',
};

const defaultProps = {
  getStreamContent: () => '',
  isMessageStreaming: () => false,
  channelEntities: [defaultEntity],
  theme: 'light' as const,
};

function makeMessage(overrides: Partial<Message> & { id: string }): Message {
  return {
    channelId: 'ch-1',
    role: 'assistant',
    content: 'Reply text.',
    status: 'complete',
    createdAt: '2026-08-13T10:00:00Z',
    entityId: 'ent-1',
    ...overrides,
  };
}

describe('Round 48 — carried-context chip', () => {
  it('shows the chip with room count when a carried_context artifact is present', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        artifacts: [
          {
            id: 'art-carried-1',
            messageId: 'msg-1',
            type: 'carried_context',
            inputSummary: '3 other conversations',
            content: JSON.stringify({ roomCount: 3, messageCount: 12, omittedCount: 0, hasOlderHistory: false }),
            createdAt: '2026-08-13T10:00:00Z',
          },
        ],
      }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.getByText('Carried context from 3 other conversations')).toBeInTheDocument();
  });

  it('singular room count reads "1 other conversation", not "1 other conversations"', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        artifacts: [
          {
            id: 'art-carried-1',
            messageId: 'msg-1',
            type: 'carried_context',
            inputSummary: '1 other conversation',
            content: JSON.stringify({ roomCount: 1, messageCount: 4, omittedCount: 0, hasOlderHistory: false }),
            createdAt: '2026-08-13T10:00:00Z',
          },
        ],
      }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.getByText('Carried context from 1 other conversation')).toBeInTheDocument();
  });

  it('does not show the chip when no carried_context artifact is present', () => {
    const messages = [
      makeMessage({ id: 'msg-1', artifacts: [] }),
      makeMessage({ id: 'msg-2' }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.queryByText(/Carried context from/)).not.toBeInTheDocument();
  });

  it('never renders content or channel names from the artifact payload — count only', () => {
    // hasOlderHistory/omittedCount/messageCount exist on the payload (server round41)
    // but per Iris's ruling the chip must not surface them; this pins that boundary.
    const messages = [
      makeMessage({
        id: 'msg-1',
        artifacts: [
          {
            id: 'art-carried-1',
            messageId: 'msg-1',
            type: 'carried_context',
            inputSummary: '2 other conversations',
            content: JSON.stringify({ roomCount: 2, messageCount: 40, omittedCount: 5, hasOlderHistory: true }),
            createdAt: '2026-08-13T10:00:00Z',
          },
        ],
      }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.getByText('Carried context from 2 other conversations')).toBeInTheDocument();
    expect(screen.queryByText(/40/)).not.toBeInTheDocument();
    expect(screen.queryByText(/dropped/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/older history/i)).not.toBeInTheDocument();
  });

  it('coexists with a thinking indicator on the same message without either suppressing the other', () => {
    const messages = [
      makeMessage({
        id: 'msg-1',
        artifacts: [
          {
            id: 'art-think-1',
            messageId: 'msg-1',
            type: 'thinking',
            createdAt: '2026-08-13T10:00:00Z',
          },
          {
            id: 'art-carried-1',
            messageId: 'msg-1',
            type: 'carried_context',
            inputSummary: '4 other conversations',
            content: JSON.stringify({ roomCount: 4, messageCount: 8, omittedCount: 0, hasOlderHistory: false }),
            createdAt: '2026-08-13T10:00:00Z',
          },
        ],
      }),
    ];

    render(<MessageList {...defaultProps} messages={messages} />);

    expect(screen.getByText(/Thought about this/)).toBeInTheDocument();
    expect(screen.getByText('Carried context from 4 other conversations')).toBeInTheDocument();
  });
});
