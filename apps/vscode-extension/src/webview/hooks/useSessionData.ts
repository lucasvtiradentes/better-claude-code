import { useEffect, useState } from 'react';
import type { SessionData } from '../types';
import { vscode } from '../utils/vscode';

export const useSessionData = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'sessionData') {
        setSessionData(message.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    vscode.postMessage({ type: 'ready' });
  }, []);

  return sessionData;
};
