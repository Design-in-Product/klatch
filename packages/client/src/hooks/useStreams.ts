import { useState, useEffect, useRef, useCallback } from 'react';
import type { StreamEvent } from '@klatch/shared';

interface StreamState {
  content: string;
  isStreaming: boolean;
}

/**
 * Manages N concurrent SSE streams for multi-entity responses.
 * Each message ID gets its own EventSource connection.
 */
export function useStreams(
  messageIds: string[],
  onComplete?: (messageId: string, content: string) => void,
  onError?: (messageId: string, content: string) => void
) {
  const [states, setStates] = useState<Map<string, StreamState>>(new Map());
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Keep refs current to avoid stale closures
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  // Track which message IDs we've already set up streams for
  const activeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const eventSources: EventSource[] = [];

    for (const messageId of messageIds) {
      // Skip if we already have a stream for this ID
      if (activeIdsRef.current.has(messageId)) continue;
      activeIdsRef.current.add(messageId);

      // Initialize state for this stream
      setStates((prev) => {
        const next = new Map(prev);
        next.set(messageId, { content: '', isStreaming: true });
        return next;
      });

      const eventSource = new EventSource(`/api/messages/${messageId}/stream`);
      eventSources.push(eventSource);

      eventSource.onmessage = (event) => {
        const data: StreamEvent = JSON.parse(event.data);

        if (data.type === 'text_delta') {
          setStates((prev) => {
            const next = new Map(prev);
            const current = next.get(messageId);
            next.set(messageId, {
              content: (current?.content || '') + data.content,
              isStreaming: true,
            });
            return next;
          });
        } else if (data.type === 'message_complete') {
          setStates((prev) => {
            const next = new Map(prev);
            next.set(messageId, { content: data.content, isStreaming: false });
            return next;
          });
          activeIdsRef.current.delete(messageId);
          onCompleteRef.current?.(messageId, data.content);
          eventSource.close();
        } else if (data.type === 'error') {
          setStates((prev) => {
            const next = new Map(prev);
            next.set(messageId, { content: data.content, isStreaming: false });
            return next;
          });
          activeIdsRef.current.delete(messageId);
          onErrorRef.current?.(messageId, data.content);
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setStates((prev) => {
          const next = new Map(prev);
          next.set(messageId, { content: prev.get(messageId)?.content || '', isStreaming: false });
          return next;
        });
        activeIdsRef.current.delete(messageId);
        eventSource.close();
      };
    }

    return () => {
      for (const es of eventSources) {
        es.close();
      }
    };
  }, [messageIds.join(',')]); // Re-run when the set of IDs changes

  // Clean up when all IDs are removed (e.g., channel switch)
  const reset = useCallback(() => {
    activeIdsRef.current.clear();
    setStates(new Map());
  }, []);

  const isAnyStreaming = Array.from(states.values()).some((s) => s.isStreaming);

  const getStreamContent = useCallback(
    (messageId: string): string => states.get(messageId)?.content || '',
    [states]
  );

  const isMessageStreaming = useCallback(
    (messageId: string): boolean => states.get(messageId)?.isStreaming || false,
    [states]
  );

  return { states, isAnyStreaming, getStreamContent, isMessageStreaming, reset };
}
