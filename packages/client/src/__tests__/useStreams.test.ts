import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStreams } from '../hooks/useStreams';

// ── MockEventSource (shared pattern) ────────────────────────

type EventSourceListener = (event: MessageEvent) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onmessage: EventSourceListener | null = null;
  onerror: (() => void) | null = null;
  readyState = 0;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    setTimeout(() => { this.readyState = 1; }, 0);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  _emit(data: object) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  _error() {
    if (this.onerror) this.onerror();
  }

  static clear() { MockEventSource.instances = []; }
  static byUrl(url: string) { return MockEventSource.instances.find((es) => es.url === url); }
}

const OriginalEventSource = globalThis.EventSource;

beforeEach(() => {
  MockEventSource.clear();
  (globalThis as any).EventSource = MockEventSource;
});

afterEach(() => {
  (globalThis as any).EventSource = OriginalEventSource;
});

// ── useStreams tests ─────────────────────────────────────────

describe('useStreams', () => {
  it('creates no EventSources for empty messageIds', () => {
    const { result } = renderHook(() => useStreams([]));
    expect(MockEventSource.instances).toHaveLength(0);
    expect(result.current.isAnyStreaming).toBe(false);
  });

  it('creates one EventSource per messageId', () => {
    renderHook(() => useStreams(['msg-1', 'msg-2']));
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.byUrl('/api/messages/msg-1/stream')).toBeTruthy();
    expect(MockEventSource.byUrl('/api/messages/msg-2/stream')).toBeTruthy();
  });

  it('reports isAnyStreaming as true while streams are active', () => {
    const { result } = renderHook(() => useStreams(['msg-1']));
    expect(result.current.isAnyStreaming).toBe(true);
  });

  it('accumulates content per stream independently', () => {
    const { result } = renderHook(() => useStreams(['msg-1', 'msg-2']));

    const es1 = MockEventSource.byUrl('/api/messages/msg-1/stream')!;
    const es2 = MockEventSource.byUrl('/api/messages/msg-2/stream')!;

    act(() => {
      es1._emit({ type: 'text_delta', messageId: 'msg-1', content: 'Hello from 1' });
      es2._emit({ type: 'text_delta', messageId: 'msg-2', content: 'Hello from 2' });
    });

    expect(result.current.getStreamContent('msg-1')).toBe('Hello from 1');
    expect(result.current.getStreamContent('msg-2')).toBe('Hello from 2');
  });

  it('returns empty string for unknown messageId in getStreamContent', () => {
    const { result } = renderHook(() => useStreams(['msg-1']));
    expect(result.current.getStreamContent('unknown')).toBe('');
  });

  it('calls onComplete when a stream finishes', () => {
    const onComplete = vi.fn();
    renderHook(() => useStreams(['msg-1'], onComplete));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({ type: 'text_delta', messageId: 'msg-1', content: 'partial' });
      es._emit({ type: 'message_complete', messageId: 'msg-1', content: 'full response' });
    });

    expect(onComplete).toHaveBeenCalledWith('msg-1', 'full response', undefined, undefined);
    expect(es.closed).toBe(true);
  });

  it('passes stopReason through to onComplete when a turn ends without finishing cleanly', () => {
    const onComplete = vi.fn();
    renderHook(() => useStreams(['msg-1'], onComplete));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({ type: 'message_complete', messageId: 'msg-1', content: 'cut off mid', stopReason: 'max_tokens' });
    });

    expect(onComplete).toHaveBeenCalledWith('msg-1', 'cut off mid', 'max_tokens', undefined);
  });

  it('passes carriedContext through to onComplete when layer 6 was active for the turn', () => {
    const onComplete = vi.fn();
    renderHook(() => useStreams(['msg-1'], onComplete));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({
        type: 'message_complete',
        messageId: 'msg-1',
        content: 'reply',
        carriedContext: '2 other conversations',
      });
    });

    expect(onComplete).toHaveBeenCalledWith('msg-1', 'reply', undefined, '2 other conversations');
  });

  it('calls onToolUse for each tool_use event, without closing the stream', () => {
    const onToolUse = vi.fn();
    const { result } = renderHook(() => useStreams(['msg-1'], undefined, undefined, onToolUse));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({
        type: 'tool_use',
        messageId: 'msg-1',
        content: '',
        toolName: 'search_my_other_conversations',
        inputSummary: 'Searched own conversations: staging freeze',
      });
    });

    expect(onToolUse).toHaveBeenCalledWith(
      'msg-1',
      'search_my_other_conversations',
      'Searched own conversations: staging freeze'
    );
    expect(es.closed).toBe(false);
    expect(result.current.isMessageStreaming('msg-1')).toBe(true);
  });

  it('calls onToolUse once per tool_use event, in order, for a turn with multiple calls', () => {
    const onToolUse = vi.fn();
    renderHook(() => useStreams(['msg-1'], undefined, undefined, onToolUse));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({ type: 'tool_use', messageId: 'msg-1', content: '', toolName: 'search_my_other_conversations', inputSummary: 'Searched own conversations: alpha' });
      es._emit({ type: 'tool_use', messageId: 'msg-1', content: '', toolName: 'search_my_other_conversations', inputSummary: 'Expanded own conversation: beta 1–5' });
    });

    expect(onToolUse).toHaveBeenCalledTimes(2);
    expect(onToolUse).toHaveBeenNthCalledWith(1, 'msg-1', 'search_my_other_conversations', 'Searched own conversations: alpha');
    expect(onToolUse).toHaveBeenNthCalledWith(2, 'msg-1', 'search_my_other_conversations', 'Expanded own conversation: beta 1–5');
  });

  it('does not require inputSummary on tool_use events (tools with no summary vocabulary)', () => {
    const onToolUse = vi.fn();
    renderHook(() => useStreams(['msg-1'], undefined, undefined, onToolUse));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({ type: 'tool_use', messageId: 'msg-1', content: '', toolName: 'save_file' });
    });

    expect(onToolUse).toHaveBeenCalledWith('msg-1', 'save_file', undefined);
  });

  it('calls onError when a stream errors', () => {
    const onError = vi.fn();
    renderHook(() => useStreams(['msg-1'], undefined, onError));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._emit({ type: 'error', messageId: 'msg-1', content: 'overloaded' });
    });

    expect(onError).toHaveBeenCalledWith('msg-1', 'overloaded');
    expect(es.closed).toBe(true);
  });

  it('isAnyStreaming becomes false only when ALL streams complete', () => {
    const { result } = renderHook(() => useStreams(['msg-1', 'msg-2']));

    const es1 = MockEventSource.byUrl('/api/messages/msg-1/stream')!;
    const es2 = MockEventSource.byUrl('/api/messages/msg-2/stream')!;

    act(() => {
      es1._emit({ type: 'message_complete', messageId: 'msg-1', content: 'done 1' });
    });
    expect(result.current.isAnyStreaming).toBe(true); // msg-2 still streaming

    act(() => {
      es2._emit({ type: 'message_complete', messageId: 'msg-2', content: 'done 2' });
    });
    expect(result.current.isAnyStreaming).toBe(false);
  });

  it('isMessageStreaming tracks individual streams', () => {
    const { result } = renderHook(() => useStreams(['msg-1', 'msg-2']));
    const es1 = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    expect(result.current.isMessageStreaming('msg-1')).toBe(true);
    expect(result.current.isMessageStreaming('msg-2')).toBe(true);

    act(() => {
      es1._emit({ type: 'message_complete', messageId: 'msg-1', content: 'done' });
    });

    expect(result.current.isMessageStreaming('msg-1')).toBe(false);
    expect(result.current.isMessageStreaming('msg-2')).toBe(true);
  });

  it('handles EventSource connection error gracefully', () => {
    const { result } = renderHook(() => useStreams(['msg-1']));
    const es = MockEventSource.byUrl('/api/messages/msg-1/stream')!;

    act(() => {
      es._error();
    });

    expect(result.current.isMessageStreaming('msg-1')).toBe(false);
    expect(es.closed).toBe(true);
  });

  it('reset clears all stream state', () => {
    const { result } = renderHook(() => useStreams(['msg-1', 'msg-2']));

    const es1 = MockEventSource.byUrl('/api/messages/msg-1/stream')!;
    act(() => {
      es1._emit({ type: 'text_delta', messageId: 'msg-1', content: 'content' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.isAnyStreaming).toBe(false);
    expect(result.current.getStreamContent('msg-1')).toBe('');
  });

  it('does not create duplicate streams for the same messageId', () => {
    const { rerender } = renderHook(
      ({ ids }) => useStreams(ids),
      { initialProps: { ids: ['msg-1'] } }
    );

    expect(MockEventSource.instances).toHaveLength(1);

    // Re-render with same IDs — should not create new EventSource
    rerender({ ids: ['msg-1'] });
    expect(MockEventSource.instances).toHaveLength(1);
  });

  it('creates additional streams when new IDs are added', () => {
    const { rerender } = renderHook(
      ({ ids }) => useStreams(ids),
      { initialProps: { ids: ['msg-1'] } }
    );

    expect(MockEventSource.instances).toHaveLength(1);

    // Add a new message ID
    rerender({ ids: ['msg-1', 'msg-2'] });
    expect(MockEventSource.instances).toHaveLength(2);
  });
});
