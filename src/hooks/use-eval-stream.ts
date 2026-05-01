'use client';
import { useCallback } from 'react';
import { useEval } from '@/store/eval-context';
import type { Group, Submission } from '@/types';

type StartArgs = {
  apiKey: string;
  group: Group;
  submission: Submission;
  forceRefresh?: boolean;
};

function parseSSEChunk(text: string): Array<{ event: string; data: string }> {
  const out: Array<{ event: string; data: string }> = [];
  for (const block of text.split('\n\n')) {
    if (!block.trim()) continue;
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    out.push({ event, data });
  }
  return out;
}

export function useEvalStream() {
  const { dispatch } = useEval();

  const start = useCallback(async (args: StartArgs) => {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OpenAI-Key': args.apiKey },
      body: JSON.stringify({
        group: args.group,
        submission: args.submission,
        forceRefresh: args.forceRefresh ?? false,
      }),
    });
    if (!res.ok || !res.body) {
      dispatch({ type: 'ERROR', payload: `HTTP ${res.status}` });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const splitIdx = buffer.lastIndexOf('\n\n');
      if (splitIdx < 0) continue;
      const ready = buffer.slice(0, splitIdx + 2);
      buffer = buffer.slice(splitIdx + 2);

      for (const { event, data } of parseSSEChunk(ready)) {
        if (!data) continue;
        const parsed = JSON.parse(data);
        switch (event) {
          case 'cache-status':
            dispatch({ type: 'CACHE_STATUS', payload: parsed.hit });
            break;
          case 'score':
            dispatch({ type: 'RECEIVE_SCORE', payload: parsed });
            break;
          case 'complete':
            dispatch({ type: 'COMPLETE', payload: { totalScore: parsed.totalScore } });
            break;
          case 'required-elements':
            dispatch({ type: 'RECEIVE_REQUIRED_ELEMENTS', payload: parsed });
            break;
          case 'cheer':
            dispatch({ type: 'CHEER', payload: parsed.message });
            break;
          case 'error':
            dispatch({ type: 'ERROR', payload: parsed.message });
            break;
        }
      }
    }
  }, [dispatch]);

  return { start };
}
