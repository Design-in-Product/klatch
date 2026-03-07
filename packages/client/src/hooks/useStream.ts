import { useState, useEffect } from 'react';
import type { StreamEvent } from '@klatch/shared';

export function useStream(
  messageId: string | null,
  onComplete?: (content: string) => void,
  onError?: (content: string) => void
) {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!messageId) return;

    setIsStreaming(true);
    setContent('');

    const eventSource = new EventSource(`/api/messages/${messageId}/stream`);

    eventSource.onmessage = (event) => {
      const data: StreamEvent = JSON.parse(event.data);

      if (data.type === 'text_delta') {
        setContent((prev) => prev + data.content);
      } else if (data.type === 'message_complete') {
        setIsStreaming(false);
        onComplete?.(data.content);
        eventSource.close();
      } else if (data.type === 'error') {
        setIsStreaming(false);
        onError?.(data.content);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [messageId]);

  return { content, isStreaming };
}
