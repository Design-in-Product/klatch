import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../components/MessageInput';
import type { Entity } from '@klatch/shared';

describe('MessageInput', () => {
  it('renders a textarea and send button', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} isStreaming={false} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} isStreaming={false} />);
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('calls onSend with trimmed content on click', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} isStreaming={false} />);

    await user.type(screen.getByPlaceholderText('Type a message...'), '  hello  ');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} disabled={false} isStreaming={false} />);

    const textarea = screen.getByPlaceholderText('Type a message...');
    await user.type(textarea, 'hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(textarea).toHaveValue('');
  });

  it('shows stop button during streaming', () => {
    const onStop = vi.fn();
    render(<MessageInput onSend={vi.fn()} onStop={onStop} disabled={false} isStreaming={true} />);

    expect(screen.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Waiting for response...')).toBeInTheDocument();
  });

  it('disables textarea when disabled', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} isStreaming={false} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeDisabled();
  });
});

// ── @mention autocomplete (increment 7: available in all klatch modes) ──

function ent(id: string, name: string, handle?: string): Entity {
  return { id, name, handle, model: 'claude-opus-4-6', effort: 'high', systemPrompt: '', color: '#222', createdAt: '2026-01-01T00:00:00Z' } as Entity;
}

describe('MessageInput — @mention autocomplete', () => {
  const two = [ent('e1', 'Alice', 'alice'), ent('e2', 'Bob')];
  const base = { onSend: vi.fn(), disabled: false, isStreaming: false };

  // jsdom doesn't move the caret on fireEvent.change, so selectionStart is set explicitly —
  // the mention-context detection reads it to find the @ before the cursor.
  function typeInto(value: string, caret: number) {
    fireEvent.change(screen.getByRole('textbox'), { target: { value, selectionStart: caret } });
  }

  it('shows the autocomplete when typing @ in a PANEL klatch (was previously directed-only)', () => {
    render(<MessageInput {...base} channelEntities={two} mode="panel" />);
    typeInto('@', 1);
    expect(screen.getByText('Mention an entity')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bob/i })).toBeInTheDocument();
  });

  it('shows the autocomplete in a ROUNDTABLE klatch too', () => {
    render(<MessageInput {...base} channelEntities={two} mode="roundtable" />);
    typeInto('@', 1);
    expect(screen.getByText('Mention an entity')).toBeInTheDocument();
  });

  it('does not show the autocomplete in a 1-on-1 (single entity)', () => {
    render(<MessageInput {...base} channelEntities={[ent('e1', 'Alice')]} mode="panel" />);
    typeInto('@', 1);
    expect(screen.queryByText('Mention an entity')).not.toBeInTheDocument();
  });

  it('filters candidates by the query after @, and inserts @handle on click', () => {
    render(<MessageInput {...base} channelEntities={two} mode="panel" />);
    typeInto('@al', 3);
    expect(screen.getByRole('button', { name: /Alice/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bob/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Alice/i }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('@alice ');
  });
});
