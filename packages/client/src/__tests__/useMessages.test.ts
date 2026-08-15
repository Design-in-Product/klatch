import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessages } from '../hooks/useMessages';
import type { Message } from '@klatch/shared';

// updateMessage's function-form (round49 flag from Theseus: App.tsx's carried-context
// merge needs the current message in hand to filter-and-append rather than replace
// `artifacts`, since a plain-object update can only ever clobber the array).
// docs/mail/theseus-to-daedalus-iris-cc-team-round49-verified-live-and-one-flag-2026-08-14.md

vi.mock('../api/client', () => ({
  fetchMessages: vi.fn().mockResolvedValue([]),
}));

const baseMessage: Message = {
  id: 'msg-1',
  channelId: 'ch-1',
  role: 'assistant',
  content: 'hello',
  status: 'complete',
  createdAt: '2026-08-14T00:00:00Z',
};

describe('useMessages — updateMessage function form', () => {
  it('accepts a plain object, same as before', async () => {
    const { result } = renderHook(() => useMessages('ch-1'));
    await act(async () => {});
    act(() => result.current.addMessage(baseMessage));

    act(() => result.current.updateMessage('msg-1', { content: 'updated' }));

    expect(result.current.messages[0].content).toBe('updated');
  });

  it('accepts an updater function that reads the current message to merge, not replace', async () => {
    const withFileArtifact: Message = {
      ...baseMessage,
      artifacts: [{ id: 'art-file-1', messageId: 'msg-1', type: 'file', createdAt: '2026-08-14T00:00:00Z' }],
    };
    const { result } = renderHook(() => useMessages('ch-1'));
    await act(async () => {});
    act(() => result.current.addMessage(withFileArtifact));

    act(() =>
      result.current.updateMessage('msg-1', (m) => ({
        artifacts: [
          ...(m.artifacts ?? []).filter((a) => a.type !== 'carried_context'),
          { id: 'art-carried-1', messageId: 'msg-1', type: 'carried_context', inputSummary: '2 other conversations', createdAt: '2026-08-14T00:00:00Z' },
        ],
      }))
    );

    const types = result.current.messages[0].artifacts?.map((a) => a.type);
    expect(types).toEqual(['file', 'carried_context']);
  });

  it('an updater re-run replaces its own prior carried_context entry rather than duplicating it', async () => {
    const { result } = renderHook(() => useMessages('ch-1'));
    await act(async () => {});
    act(() => result.current.addMessage(baseMessage));

    const appendChip = (summary: string) =>
      result.current.updateMessage('msg-1', (m) => ({
        artifacts: [
          ...(m.artifacts ?? []).filter((a) => a.type !== 'carried_context'),
          { id: 'art-carried-x', messageId: 'msg-1', type: 'carried_context', inputSummary: summary, createdAt: '2026-08-14T00:00:00Z' },
        ],
      }));

    act(() => appendChip('1 other conversation'));
    act(() => appendChip('2 other conversations'));

    expect(result.current.messages[0].artifacts).toHaveLength(1);
    expect(result.current.messages[0].artifacts?.[0].inputSummary).toBe('2 other conversations');
  });
});
