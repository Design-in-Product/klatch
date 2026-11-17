/**
 * Ground rules, phases 2 and 3 — the client half (2026-11-17, Iris).
 *
 * Ruling: 2026-11-03 (xian via Janus), `docs/operations/attention-rollup.md`.
 * Server half: Daedalus, `0ae38749` (2026-11-16) — `GET|POST /api/ground-rules/presets`,
 * `GroundRulesPreset` in `@klatch/shared`. This fire wires the two remaining client
 * halves against that surface: phase 2 (save-as-default / save-as-template on submit)
 * and phase 3 (prefill the default, offer named templates).
 *
 * `ChannelSidebar` takes the preset list and the save callback as props — same
 * shape as `projects`/`entities` — so these tests exercise the component directly
 * with a hand-built preset list rather than mocking `api/client`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelSidebar } from '../components/ChannelSidebar';
import type { Channel, GroundRulesPreset } from '@klatch/shared';

vi.mock('../api/client', () => ({
  fetchChannelEntities: vi.fn(),
}));

function ch(o: Partial<Channel> & { id: string; name: string }): Channel {
  return { type: 'chat', systemPrompt: 'You are a helpful assistant.', model: 'claude-opus-4-6', mode: 'panel', createdAt: '2026-01-01T00:00:00Z', ...o };
}
function preset(o: Partial<GroundRulesPreset> & { id: string; body: string }): GroundRulesPreset {
  return { isDefault: false, createdAt: '2026-01-01T00:00:00Z', ...o };
}

const baseProps = {
  activeChannelId: 'default',
  channels: [ch({ id: 'default', name: 'general' })],
  onSelectChannel: vi.fn(),
  onCreateChannel: vi.fn(),
  theme: 'light' as const,
  onToggleTheme: vi.fn(),
};

const RULES_PLACEHOLDER = /Ground rules — how should people behave in this klatch/i;

describe('Ground rules phase 3 — offering previous rules', () => {
  it('prefills the field with the default preset on opening a klatch', () => {
    const presets = [preset({ id: 'p1', body: 'No jargon.', isDefault: true })];
    render(<ChannelSidebar {...baseProps} groundRulesPresets={presets} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('No jargon.');
  });

  it('does not prefill when no preset is marked default', () => {
    const presets = [preset({ id: 'p1', name: 'Formal', body: 'Be formal.' })];
    render(<ChannelSidebar {...baseProps} groundRulesPresets={presets} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('');
  });

  it('offers named templates in a picker, and selecting one fills the field', () => {
    const presets = [
      preset({ id: 'p1', name: 'Formal', body: 'Be formal.' }),
      preset({ id: 'p2', name: 'Casual', body: 'Keep it loose.', isDefault: true }),
    ];
    render(<ChannelSidebar {...baseProps} groundRulesPresets={presets} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    // Default prefilled first, same as the no-template case.
    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('Keep it loose.');

    const picker = screen.getByText('Use a saved ground rules template…').closest('select') as HTMLSelectElement;
    expect(screen.getByRole('option', { name: 'Formal' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Casual (default)' })).toBeInTheDocument();

    fireEvent.change(picker, { target: { value: 'p1' } });
    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('Be formal.');
  });

  it('an unnamed-only default leaves the picker unrendered', () => {
    const presets = [preset({ id: 'p1', body: 'No jargon.', isDefault: true })];
    render(<ChannelSidebar {...baseProps} groundRulesPresets={presets} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    expect(screen.queryByText('Use a saved ground rules template…')).toBeNull();
  });
});

describe('Ground rules phase 2 — save-as-default / save-as-template on submit', () => {
  it('the save controls stay hidden until there is a body to save', () => {
    render(<ChannelSidebar {...baseProps} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    expect(screen.queryByText('Make this my default')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'No jargon.' } });
    expect(screen.getByText('Make this my default')).toBeInTheDocument();
  });

  it('checking "make this my default" saves on submit with makeDefault, no name', () => {
    const onSaveGroundRulesPreset = vi.fn();
    render(<ChannelSidebar {...baseProps} onSaveGroundRulesPreset={onSaveGroundRulesPreset} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: '  No jargon.  ' } });
    fireEvent.click(screen.getByText('Make this my default'));
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onSaveGroundRulesPreset).toHaveBeenCalledTimes(1);
    expect(onSaveGroundRulesPreset).toHaveBeenCalledWith({ body: 'No jargon.', name: undefined, makeDefault: true });
  });

  it('naming a template without checking the box saves with a name, no makeDefault', () => {
    const onSaveGroundRulesPreset = vi.fn();
    render(<ChannelSidebar {...baseProps} onSaveGroundRulesPreset={onSaveGroundRulesPreset} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'Be formal.' } });
    fireEvent.change(screen.getByPlaceholderText('or save as a template, named…'), { target: { value: '  Formal  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onSaveGroundRulesPreset).toHaveBeenCalledWith({ body: 'Be formal.', name: 'Formal', makeDefault: undefined });
  });

  it('typing rules without checking the box or naming a template saves nothing', () => {
    const onSaveGroundRulesPreset = vi.fn();
    render(<ChannelSidebar {...baseProps} onSaveGroundRulesPreset={onSaveGroundRulesPreset} />);
    fireEvent.click(screen.getByText('+ New Klatch'));

    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'No jargon.' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    expect(onSaveGroundRulesPreset).not.toHaveBeenCalled();
  });

  it('a chat never triggers a save, even with leftover state from a prior klatch', () => {
    // Mirrors the phase-1 "rules typed on a klatch do not follow a switch to chat"
    // case: the save gesture is scoped to the klatch gate exactly like the field.
    const onSaveGroundRulesPreset = vi.fn();
    render(<ChannelSidebar {...baseProps} onSaveGroundRulesPreset={onSaveGroundRulesPreset} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'No jargon.' } });
    fireEvent.click(screen.getByText('Make this my default'));
    fireEvent.click(screen.getByRole('button', { name: /^Chat$/i }));
    fireEvent.change(screen.getByPlaceholderText('Chat name'), { target: { value: 'solo' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Chat/i }));

    expect(onSaveGroundRulesPreset).not.toHaveBeenCalled();
  });

  it('the save controls reset after submit', () => {
    const onSaveGroundRulesPreset = vi.fn();
    render(<ChannelSidebar {...baseProps} onSaveGroundRulesPreset={onSaveGroundRulesPreset} />);
    fireEvent.click(screen.getByText('+ New Klatch'));
    fireEvent.change(screen.getByPlaceholderText('Klatch name'), { target: { value: 'Weekly Review' } });
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'No jargon.' } });
    fireEvent.click(screen.getByText('Make this my default'));
    fireEvent.click(screen.getByRole('button', { name: /Create Klatch/i }));

    fireEvent.click(screen.getByText('+ New Klatch'));
    expect((screen.getByPlaceholderText(RULES_PLACEHOLDER) as HTMLTextAreaElement).value).toBe('');
    fireEvent.change(screen.getByPlaceholderText(RULES_PLACEHOLDER), { target: { value: 'Something else.' } });
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  });
});
