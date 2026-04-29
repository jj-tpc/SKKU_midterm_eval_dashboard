'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import { TOPICS } from '@/lib/topics';
import type { Topic } from '@/types';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';

export function TopicSelector() {
  const { state, dispatch } = useEval();
  const [selected, setSelected] = useState<Topic | null>(null);

  return (
    <section
      data-component="topic-selector"
      className="mx-auto max-w-5xl px-6 py-10 flex flex-col items-center gap-6"
    >
      <Chatbot pose="idle" size="md" />
      <SpeechBubble tail="top">
        <span className="font-display text-lg">
          {state.group ? `${state.group}, 어떤 주제로 평가할까요?` : '주제를 골라주세요!'}
        </span>
      </SpeechBubble>

      <p className="text-xs uppercase tracking-[0.4em] text-(--color-ink-muted)">
        Pick a topic
      </p>

      <ol className="w-full grid grid-cols-1 lg:grid-cols-2 gap-3">
        {TOPICS.map((t, i) => {
          const isSelected = selected?.id === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                data-component="topic-button"
                data-topic={t.id}
                data-selected={isSelected}
                onClick={() => setSelected(t)}
                className={
                  'group relative isolate flex w-full flex-col rounded-2xl border-2 border-(--color-ink) p-5 text-left transition-transform duration-200 ' +
                  (isSelected
                    ? 'bg-(--color-paper) -translate-y-0.5 shadow-[6px_8px_0_0_var(--color-magenta)]'
                    : 'bg-(--color-paper) shadow-[3px_4px_0_0_var(--color-line-strong)] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_0_var(--color-magenta)]')
                }
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-numeric text-2xl leading-none text-(--color-magenta)">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-lg leading-tight text-(--color-ink)">
                    {t.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-(--color-ink-soft)">
                  <span className="font-bold text-(--color-ink)">목표 · </span>{t.goal}
                </p>
                <div className="mt-3 rounded-xl border border-(--color-line) bg-(--color-paper-warm) p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-ink-soft)">
                    필수 포함 요소
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {t.requiredElements.map((req, idx) => (
                      <li key={idx} className="flex gap-2 text-xs leading-snug text-(--color-ink)">
                        <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-(--color-magenta)" />
                        <span className="break-words">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <button
          type="button"
          onClick={() => dispatch({ type: 'START_NEW' })}
          className="text-xs font-semibold text-(--color-ink-soft) underline underline-offset-2 hover:text-(--color-ink)"
        >
          ← 그룹 다시 선택
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && dispatch({ type: 'SELECT_TOPIC', payload: selected })}
          className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-7 py-3 font-display text-lg text-(--color-paper) tracking-wide shadow-[6px_6px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[3px_3px_0_0_var(--color-line-strong)]"
        >
          {selected ? '이 주제로 평가 시작 →' : '주제를 골라주세요'}
        </button>
      </div>
    </section>
  );
}
