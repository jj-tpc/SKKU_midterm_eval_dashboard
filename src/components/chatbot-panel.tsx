'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { Chatbot } from './chatbot';
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
      <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
        <Chatbot pose="thinking" />
        <p>질문을 준비하는 중…</p>
      </section>
    );
  }
  if (errorMsg) {
    return (
      <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
        <Chatbot pose="thinking" />
        <p className="text-red-600">질문 생성 실패: {errorMsg}</p>
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
    <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
      <Chatbot pose="talking" />
      <p className="text-sm opacity-70">{idx + 1} / {state.questions.length}</p>
      <p data-component="question-bubble" className="text-lg font-semibold text-center max-w-xl">
        {currentQ}
      </p>
      <textarea
        value={draftAnswer}
        onChange={(e) => setDraftAnswer(e.target.value)}
        className="border rounded p-3 w-full max-w-xl h-32 text-sm"
        placeholder="학생 답변을 받아 적으세요"
      />
      <button
        type="button"
        disabled={!draftAnswer.trim()}
        onClick={next}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {isLast ? '채점 시작' : '다음 질문'}
      </button>
    </section>
  );
}
