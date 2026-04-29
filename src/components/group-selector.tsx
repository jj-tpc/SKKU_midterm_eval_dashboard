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
      className="relative mx-auto max-w-4xl px-6 py-12 flex flex-col items-center gap-8"
    >
      <Chatbot pose="idle" size="lg" />
      <SpeechBubble tail="bottom">
        <span className="font-display text-lg">평가할 그룹을 골라주세요!</span>
      </SpeechBubble>

      <p className="text-xs uppercase tracking-[0.4em] text-(--color-ink-muted)">
        Tonight&apos;s lineup
      </p>

      <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-3 mt-1">
        {GROUPS.map((g, i) => {
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
                'group relative isolate rounded-2xl border-2 border-(--color-ink) px-4 pt-4 pb-5 text-left transition-transform duration-200 ' +
                (isSelected
                  ? 'bg-(--color-magenta) text-(--color-paper) -translate-y-1 shadow-[6px_8px_0_0_var(--color-ink)]'
                  : 'bg-(--color-paper) text-(--color-ink) hover:-translate-y-0.5 hover:shadow-[4px_6px_0_0_var(--color-magenta)]')
              }
            >
              <span className="block font-numeric text-2xl leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mt-3 block font-display text-xl leading-none">
                {g}
              </span>
              {hasCache && (
                <span
                  aria-hidden="true"
                  title="이미 평가됨"
                  className={
                    'absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wider ' +
                    (isSelected ? 'bg-(--color-paper) text-(--color-magenta)' : 'bg-(--color-yellow) text-(--color-ink)')
                  }
                >
                  ●
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="w-full mt-4 flex flex-col items-center gap-4">
          {selectedHasCache && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-(--color-ink-soft)">
              <span>이 그룹은 이미 평가됐어요. 시작하면 저장된 점수가 재공개돼요.</span>
              <button
                type="button"
                data-component="delete-cache-button"
                onClick={handleDeleteCache}
                disabled={deleting}
                className="font-semibold text-(--color-danger) underline underline-offset-2 disabled:opacity-50"
              >
                × 캐시 삭제
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={proceed}
            className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-7 py-3 font-display text-lg text-(--color-paper) tracking-wide shadow-[6px_6px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            {selected} 평가 시작 →
          </button>
        </div>
      )}
    </section>
  );
}
