'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';
import type { ChatbotQAItem } from '@/types';

export function ChatbotPanel() {
  const { state, dispatch } = useEval();
  const { apiKey } = useApiKey();
  const [idx, setIdx] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (state.phase !== 'qa' || state.questions.length > 0) {
      setLoading(false);
      return;
    }
    if (!state.submission) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-OpenAI-Key': apiKey },
          body: JSON.stringify({ submission: state.submission }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!Array.isArray(data.questions) || data.questions.length !== 3) {
          throw new Error('invalid questions response');
        }
        dispatch({ type: 'SET_QUESTIONS', payload: data.questions });
      } catch (err) {
        if (!cancelled) setErrorMsg(err instanceof Error ? err.message : 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state.phase, state.questions.length, state.submission, apiKey, dispatch]);

  if (state.phase !== 'qa') return null;

  if (loading) {
    return (
      <section data-component="chatbot-panel" className="mx-auto max-w-3xl px-6 py-12 flex flex-col items-center gap-6">
        <Chatbot pose="thinking" />
        <SpeechBubble tail="bottom"><span className="font-display">질문 준비 중…</span></SpeechBubble>
      </section>
    );
  }
  if (errorMsg) {
    return (
      <section data-component="chatbot-panel" className="mx-auto max-w-3xl px-6 py-12 flex flex-col items-center gap-6">
        <Chatbot pose="thinking" />
        <SpeechBubble tail="bottom">
          <span className="font-semibold text-(--color-danger)">질문 생성 실패: {errorMsg}</span>
        </SpeechBubble>
      </section>
    );
  }

  const currentQ = state.questions[idx];
  const isLast = idx === state.questions.length - 1;

  function next() {
    const newAnswers = [...answers, draftAnswer.trim()];
    setAnswers(newAnswers);
    setDraftAnswer('');
    if (!isLast) {
      setIdx(idx + 1);
      return;
    }
    const items: ChatbotQAItem[] = state.questions.map((q, i) => ({
      source: i === 0 ? 'common' : 'dynamic',
      question: q,
      answer: newAnswers[i],
    }));
    dispatch({ type: 'SUBMIT_QA', payload: items });
  }

  return (
    <section data-component="chatbot-panel" className="mx-auto max-w-3xl px-6 py-10 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <Chatbot pose="talking" />
        <p className="font-numeric text-sm tracking-[0.3em] text-(--color-magenta)">
          {String(idx + 1).padStart(2, '0')} / {String(state.questions.length).padStart(2, '0')}
        </p>
      </div>

      {/* keyed on idx so the bubble re-mounts and the entrance animation re-plays */}
      <SpeechBubble key={idx} tail="bottom">
        <span className="font-display text-xl leading-relaxed">{currentQ}</span>
      </SpeechBubble>

      <textarea
        value={draftAnswer}
        onChange={(e) => setDraftAnswer(e.target.value)}
        className="mt-2 w-full max-w-xl h-36 resize-none rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) p-3 text-sm leading-relaxed outline-none transition-shadow focus:shadow-[3px_3px_0_0_var(--color-magenta)]"
        placeholder="학생 답변을 받아 적으세요"
      />
      <button
        type="button"
        disabled={!draftAnswer.trim()}
        onClick={next}
        className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-7 py-3 font-display text-lg text-(--color-paper) tracking-wide shadow-[6px_6px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[3px_3px_0_0_var(--color-line-strong)]"
      >
        {isLast ? '채점 시작' : '다음 질문 →'}
      </button>
    </section>
  );
}
