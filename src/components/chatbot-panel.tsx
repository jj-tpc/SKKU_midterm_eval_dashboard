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
      <section data-component="chatbot-panel" className="p-8 flex flex-col items-center gap-6">
        <Chatbot pose="thinking" />
        <SpeechBubble>질문을 준비하는 중…</SpeechBubble>
      </section>
    );
  }
  if (errorMsg) {
    return (
      <section data-component="chatbot-panel" className="p-8 flex flex-col items-center gap-6">
        <Chatbot pose="thinking" />
        <SpeechBubble>
          <span className="text-red-600">질문 생성 실패: {errorMsg}</span>
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
    <section data-component="chatbot-panel" className="p-8 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <Chatbot pose="talking" />
        <p className="text-xs uppercase tracking-wider text-sky-600">
          질문 {idx + 1} / {state.questions.length}
        </p>
      </div>

      {/* keyed on idx so the bubble re-mounts and the entrance animation re-plays each question */}
      <SpeechBubble key={idx}>
        <span className="text-lg font-semibold leading-relaxed">{currentQ}</span>
      </SpeechBubble>

      <textarea
        value={draftAnswer}
        onChange={(e) => setDraftAnswer(e.target.value)}
        className="border border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 outline-none rounded-xl p-3 w-full max-w-xl h-32 text-sm resize-none"
        placeholder="학생 답변을 받아 적으세요"
      />
      <button
        type="button"
        disabled={!draftAnswer.trim()}
        onClick={next}
        className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
      >
        {isLast ? '채점 시작' : '다음 질문 →'}
      </button>
    </section>
  );
}
