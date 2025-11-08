import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Permission } from '../types';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type StreamStatus = 'idle' | 'streaming' | 'pending-permissions' | 'completed' | 'error';

type ToolCall = {
  toolName: string;
  args: any;
};

export function useClaudeStream(sessionId: string, projectPath: string, projectName: string) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pendingPermissions, setPendingPermissions] = useState<Permission[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageRef = useRef<string>('');
  const preventCleanupRef = useRef<boolean>(false);

  const cleanup = useCallback(() => {
    console.log('[cleanup] Closing EventSource');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const initializeSession = useCallback(async () => {
    if (isInitialized) return true;

    if (sessionId === 'new') {
      setIsInitialized(true);
      return true;
    }

    setIsInitialized(true);
    return true;
  }, [sessionId, isInitialized]);

  const connectStream = useCallback(async () => {
    if (eventSourceRef.current) {
      console.log('[connectStream] Stream already exists, skipping');
      return;
    }

    const initialized = await initializeSession();
    if (!initialized) {
      setError('Failed to initialize session');
      setStatus('error');
      return;
    }

    cleanup();
    setError(null);

    const url = `/api/live-sessions/${sessionId}/stream?projectPath=${encodeURIComponent(projectPath)}`;
    const es = new EventSource(url);
    console.log('[connectStream] Connecting to stream:', url);

      es.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'text-chunk') {
            currentMessageRef.current += event.content;

            setMessages((prev) => {
              const last = prev[prev.length - 1];

              if (last?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...last,
                    content: currentMessageRef.current
                  }
                ];
              }

              return [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: currentMessageRef.current,
                  timestamp: new Date()
                }
              ];
            });
          }
        } catch (err) {
          console.error('Failed to parse message event:', err);
        }
      });

      es.addEventListener('tool', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'tool-call') {
            setToolCalls((prev) => [
              ...prev,
              {
                toolName: event.toolName,
                args: event.args
              }
            ]);
          }
        } catch (err) {
          console.error('Failed to parse tool event:', err);
        }
      });

      es.addEventListener('permission', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'permission-request') {
            setPendingPermissions((prev) => [...prev, event.permission]);
          }
        } catch (err) {
          console.error('Failed to parse permission event:', err);
        }
      });


      es.addEventListener('status', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'status-change') {
            setStatus(event.status);
          }
        } catch (err) {
          console.error('Failed to parse status event:', err);
        }
      });


      es.addEventListener('history', (e) => {
        try {
          const event = JSON.parse(e.data);

          if (event.type === 'history') {
            console.log('Received message history:', event.messages);
            setMessages(event.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })));
          }
        } catch (err) {
          console.error('Failed to parse history event:', err);
        }
      });

      es.addEventListener('complete', (e) => {
        console.log('[connectStream] Complete event received:', e.data);
        setStatus('completed');
        cleanup();
      });

      es.addEventListener('error', (e) => {
        try {
          const event = JSON.parse((e as any).data || '{}');
          setError(event.message || 'Stream error occurred');
        } catch {
          setError('Connection error occurred');
        }
        setStatus('error');
        cleanup();
      });

      es.onerror = () => {
        setError('Connection lost');
        setStatus('error');
        cleanup();
      };

      eventSourceRef.current = es;
  }, [sessionId, projectPath, projectName, cleanup, initializeSession, navigate]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (status === 'streaming') {
        console.warn('Cannot send message while streaming');
        return;
      }

      if (isNavigating) {
        console.warn('Cannot send message during navigation');
        return;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatus('streaming');
      setError(null);
      currentMessageRef.current = '';

      try {
        console.log('[sendMessage] Sending to sessionId:', sessionId);

        const response = await fetch(`/api/live-sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, projectPath })
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to send message');
          setStatus('error');
          return;
        }

        const data = await response.json();

        if (sessionId === 'new' && data.pending && data.tempSessionId) {
          console.log('[sendMessage] First message queued, temp session:', data.tempSessionId);

          if (!eventSourceRef.current) {
            console.log('[sendMessage] Connecting to temp session stream');
            setIsNavigating(true);
            const url = `/api/live-sessions/${data.tempSessionId}/stream?projectPath=${encodeURIComponent(projectPath)}`;
            const es = new EventSource(url);
            console.log('[sendMessage] Stream connected to:', url);

            es.addEventListener('init', (e) => {
              try {
                const event = JSON.parse(e.data);

                if (event.type === 'session-init' && event.sessionId) {
                  console.log('[sendMessage] Init received, Claude session:', event.sessionId);

                  console.log('[sendMessage] Keeping temp stream alive, navigating to:', event.sessionId);
                  preventCleanupRef.current = true;
                  navigate({
                    to: '/live/$sessionId',
                    params: { sessionId: event.sessionId },
                    search: { projectPath, projectName },
                    replace: true
                  });
                }
              } catch (err) {
                console.error('Failed to parse init event:', err);
              }
            });

            es.addEventListener('status', (e) => {
              try {
                const event = JSON.parse(e.data);
                if (event.type === 'status-change') {
                  setStatus(event.status);
                }
              } catch (err) {
                console.error('Failed to parse status event:', err);
              }
            });

            es.addEventListener('message', (e) => {
              try {
                const event = JSON.parse(e.data);
                if (event.type === 'text-chunk') {
                  currentMessageRef.current += event.content;
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                      return [...prev.slice(0, -1), { ...last, content: currentMessageRef.current }];
                    }
                    return [...prev, {
                      id: crypto.randomUUID(),
                      role: 'assistant',
                      content: currentMessageRef.current,
                      timestamp: new Date()
                    }];
                  });
                }
              } catch (err) {
                console.error('Failed to parse message event:', err);
              }
            });

            es.addEventListener('history', (e) => {
              try {
                const event = JSON.parse(e.data);
                if (event.type === 'history') {
                  console.log('Received message history:', event.messages);
                  setMessages(event.messages.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                  })));
                }
              } catch (err) {
                console.error('Failed to parse history event:', err);
              }
            });

            eventSourceRef.current = es;
          }
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message');
        setStatus('error');
      }
    },
    [sessionId, status, isNavigating, projectPath, projectName, navigate]
  );

  const cancel = useCallback(async () => {
    cleanup();
    setStatus('idle');

    try {
      await fetch(`/api/live-sessions/${sessionId}/cancel`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  }, [sessionId, cleanup]);

  const approvePermissions = useCallback(
    async (approvals: { id: string; approved: boolean }[]) => {
      try {
        await fetch(`/api/live-sessions/${sessionId}/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ permissions: approvals })
        });

        setPendingPermissions([]);
        setStatus('streaming');
      } catch (err) {
        console.error('Failed to approve permissions:', err);
        setError('Failed to process permissions');
      }
    },
    [sessionId]
  );

  useEffect(() => {
    console.log('[useClaudeStream] useEffect triggered - sessionId:', sessionId, 'hasEventSource:', !!eventSourceRef.current, 'preventCleanup:', preventCleanupRef.current);

    if (sessionId !== 'new' && !eventSourceRef.current) {
      console.log('[useClaudeStream] Connecting stream for session:', sessionId);
      connectStream();
      setIsNavigating(false);
    } else if (sessionId !== 'new' && eventSourceRef.current) {
      console.log('[useClaudeStream] Stream already connected, skipping reconnection');
      setIsNavigating(false);
    } else {
      console.log('[useClaudeStream] Skipping stream connection for new session - will connect after POST message');
    }

    return () => {
      console.log('[useClaudeStream] Cleanup triggered for sessionId:', sessionId, 'preventCleanup:', preventCleanupRef.current);
      if (!preventCleanupRef.current) {
        console.log('[useClaudeStream] Calling cleanup()');
        cleanup();
      } else {
        console.log('[useClaudeStream] Skipping cleanup in useEffect return due to preventCleanup flag');
        preventCleanupRef.current = false;
      }
    };
  }, [sessionId, connectStream, cleanup]);

  return {
    messages,
    status,
    error,
    pendingPermissions,
    toolCalls,
    sendMessage,
    cancel,
    approvePermissions
  };
}
