'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'openai-api-key';

export function useApiKey() {
  const [key, setKeyState] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY) ?? '';
    setKeyState(v);
    setLoaded(true);
  }, []);

  function setKey(v: string) {
    window.localStorage.setItem(STORAGE_KEY, v);
    setKeyState(v);
  }

  function clearKey() {
    window.localStorage.removeItem(STORAGE_KEY);
    setKeyState('');
  }

  return { apiKey: key, setApiKey: setKey, clearApiKey: clearKey, loaded };
}
