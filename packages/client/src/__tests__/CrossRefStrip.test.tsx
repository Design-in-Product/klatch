import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CrossRefStrip } from '../components/CrossRefStrip';
import type { Channel } from '@klatch/shared';

const klatch = (id: string, name: string): Channel =>
  ({
    id,
    name,
    type: 'klatch',
    systemPrompt: '',
    model: 'claude-opus-4-6',
    mode: 'panel',
    source: 'native',
    createdAt: '2026-01-01T00:00:00Z',
  } as Channel);

describe('CrossRefStrip', () => {
  it('renders nothing when there are no klatches', () => {
    const { container } = render(<CrossRefStrip klatches={[]} onSelect={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders "Also in:" with a link per klatch', () => {
    render(
      <CrossRefStrip klatches={[klatch('k1', 'standup'), klatch('k2', 'retro')]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('Also in:')).toBeInTheDocument();
    expect(screen.getByText('#standup')).toBeInTheDocument();
    expect(screen.getByText('#retro')).toBeInTheDocument();
  });

  it('calls onSelect with the klatch id when a link is clicked', () => {
    const onSelect = vi.fn();
    render(<CrossRefStrip klatches={[klatch('k1', 'standup')]} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('#standup'));
    expect(onSelect).toHaveBeenCalledWith('k1');
  });
});
