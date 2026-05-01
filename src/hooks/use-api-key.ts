'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'openai-api-key';
const CHANGE_EVENT = 'openai-api-key:change';

// useApiKey is mounted from multiple components (page.tsx, settings-modal.tsx).
// Without a broadcast, setApiKey only updates the caller's local state, so the
// other consumer keeps seeing the stale value and never re-runs its effects.
export function useApiKey() {
  const [key, setKeyState] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setKeyState(window.localStorage.getItem(STORAGE_KEY) ?? '');
    setLoaded(true);
    const onChange = (e: Event) => setKeyState((e as CustomEvent<string>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  function setKey(v: string) {
    window.localStorage.setItem(STORAGE_KEY, v);
    setKeyState(v);
    window.dispatchEvent(new CustomEvent<string>(CHANGE_EVENT, { detail: v }));
  }

  function clearKey() {
    window.localStorage.removeItem(STORAGE_KEY);
    setKeyState('');
    window.dispatchEvent(new CustomEvent<string>(CHANGE_EVENT, { detail: '' }));
  }

  return { apiKey: key, setApiKey: setKey, clearApiKey: clearKey, loaded };
}
