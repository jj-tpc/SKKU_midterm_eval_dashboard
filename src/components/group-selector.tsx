'use client';
import { useEffect, useState, useCallback } from 'react';
import { useEval } from '@/store/eval-context';
import type { Group } from '@/types';
import { GROUPS } from '@/types';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';

export function GroupSelector() {
  const { dispatch } = useEval();
  const [selected, setSelected] = useState<Group | null>(null);
  const [cacheStatus, setCacheStatus] = useState<Record<Group, boolean> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cache');
      if (!res.ok) return;
      const data = await res.json();
      setCacheStatus(data.status);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const selectedHasCache = selected != null && cacheStatus?.[selected] === true;

  async function handleDeleteCache() {
    if (!selected) return;
    if (!confirm(`${selected}의 캐시를 삭제할까요?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/cache?group=${encodeURIComponent(selected)}`, { method: 'DELETE' });
      if (res.ok) await fetchStatus();
    } finally {
      setDeleting(false);
    }
  }

  function proceed() {
    if (!selected) return;
    dispatch({ type: 'SELECT_GROUP', payload: selected });
  }

  return (
    <section
      data-component="group-selector"
      className="mx-auto max-w-3xl px-6 py-12 flex flex-col items-center gap-6"
    >
      <Chatbot pose="idle" size="lg" />
      <SpeechBubble>
        <span className="font-semibold">평가할 그룹을 골라주세요!</span>
      </SpeechBubble>

      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
        {GROUPS.map((g) => {
          const isSelected = selected === g;
          const hasCache = cacheStatus?.[g] === true;
          return (
            <button
              key={g}
              type="button"
              data-component="group-button"
              data-group={g}
              data-selected={isSelected}
              data-has-cache={hasCache}
              onClick={() => setSelected(g)}
              className={
                'relative rounded-2xl border px-4 py-5 text-base font-bold transition-colors ' +
                (isSelected
                  ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 shadow-sm')
              }
            >
              {g}
              {hasCache && (
                <span
                  aria-hidden="true"
                  title="이미 평가됨"
                  className={
                    'absolute top-2 right-2 inline-block h-2.5 w-2.5 rounded-full ' +
                    (isSelected ? 'bg-white' : 'bg-emerald-500')
                  }
                />
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="w-full mt-2 flex flex-col items-center gap-3">
          {selectedHasCache && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>이 그룹은 이미 평가됐어요. 시작하면 저장된 점수가 재공개됩니다.</span>
              <button
                type="button"
                data-component="delete-cache-button"
                onClick={handleDeleteCache}
                disabled={deleting}
                className="text-rose-500 hover:text-rose-600 underline disabled:opacity-50"
              >
                × 캐시 삭제
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={proceed}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-lg font-semibold shadow-lg shadow-sky-500/30 transition-colors"
          >
            {selected} 평가 시작 →
          </button>
        </div>
      )}
    </section>
  );
}
