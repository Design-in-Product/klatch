import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStream } from '../hooks/useStream';

// ── MockEventSource ──────────────────────────────────────────

type EventSourceListener = (event: MessageEvent) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onmessage: EventSourceListener | null = null;
  onerror: (() => void) | null = null;
  readyState = 0; // CONNECTING
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    // Simulate async open
    setTimeout(() => {
      this.readyState = 1; // OPEN
    }, 0);
  }

  close() {
    this.closed = true;
    this.readyState = 2; // CLOSED
  }

  // Test helper: simulate receiving an SSE message
  _emit(data: object) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Test helper: simulate an error
  _error() {
    if (this.onerror) {
      this.onerror();
    }
  }

  static clear() {
    MockEventSource.instances = [];
  }

  static last(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1];
  }
}

// Install the mock
const OriginalEventSource = globalThis.EventSource;

beforeEach(() => {
  MockEventSource.clear();
  (globalThis as any).EventSource = MockEventSource;
});

afterEach(() => {
  (globalThis as any).EventSource = OriginalEventSource;
});

// ── useStream tests ──────────────────────────────────────────

describe('useStream', () => {
  it('returns empty content and not streaming when messageId is null', () => {
    const { result } = renderHook(() => useStream(null));
    expect(result.current.content).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(MockEventSource.instances).toHaveLength(0);
  });

  it('opens an EventSource to the correct URL', () => {
    renderHook(() => useStream('msg-123'));
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.last()!.url).toBe('/api/messages/msg-123/stream');
  });

  it('sets isStreaming to true when messageId is provided', () => {
    const { result } = renderHook(() => useStream('msg-123'));
    expect(result.current.isStreaming).toBe(true);
  });

  it('accumulates text_delta content', () => {
    const { result } = renderHook(() => useStream('msg-123'));
    const es = MockEventSource.last()!;

    act(() => {
      es._emit({ type: 'text_delta', messageId: 'msg-123', content: 'Hello' });
    });
    expect(result.current.content).toBe('Hello');

    act(() => {
      es._emit({ type: 'text_delta', messageId: 'msg-123', content: ' world' });
    });
    expect(result.current.content).toBe('Hello world');
  });

  it('calls onComplete and stops streaming on message_complete', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useStream('msg-123', onComplete));
    const es = MockEventSource.last()!;

    act(() => {
      es._emit({ type: 'text_delta', messageId: 'msg-123', content: 'partial' });
      es._emit({ type: 'message_complete', messageId: 'msg-123', content: 'full response' });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(onComplete).toHaveBeenCalledWith('full response');
    expect(es.closed).toBe(true);
  });

  it('calls onError and stops streaming on error event', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useStream('msg-123', undefined, onError));
    const es = MockEventSource.last()!;

    act(() => {
      es._emit({ type: 'error', messageId: 'msg-123', content: 'API rate limited' });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(onError).toHaveBeenCalledWith('API rate limited');
    expect(es.closed).toBe(true);
  });

  it('handles EventSource connection error', () => {
    const { result } = renderHook(() => useStream('msg-123'));
    const es = MockEventSource.last()!;

    act(() => {
      es._error();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(es.closed).toBe(true);
  });

  it('closes EventSource on unmount', () => {
    const { unmount } = renderHook(() => useStream('msg-123'));
    const es = MockEventSource.last()!;
    expect(es.closed).toBe(false);

    unmount();
    expect(es.closed).toBe(true);
  });

  it('closes old EventSource and opens new one when messageId changes', () => {
    const { rerender } = renderHook(
      ({ id }) => useStream(id),
      { initialProps: { id: 'msg-1' as string | null } }
    );

    const es1 = MockEventSource.last()!;
    expect(es1.url).toContain('msg-1');

    rerender({ id: 'msg-2' });

    expect(es1.closed).toBe(true);
    expect(MockEventSource.instances).toHaveLength(2);
    const es2 = MockEventSource.last()!;
    expect(es2.url).toContain('msg-2');
  });

  it('resets content when messageId changes', () => {
    const { result, rerender } = renderHook(
      ({ id }) => useStream(id),
      { initialProps: { id: 'msg-1' as string | null } }
    );
    const es1 = MockEventSource.last()!;

    act(() => {
      es1._emit({ type: 'text_delta', messageId: 'msg-1', content: 'old content' });
    });
    expect(result.current.content).toBe('old content');

    rerender({ id: 'msg-2' });
    expect(result.current.content).toBe('');
  });
});
