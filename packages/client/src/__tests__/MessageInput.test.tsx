import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../components/MessageInput';

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
