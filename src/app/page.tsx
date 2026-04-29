'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { useEvalStream } from '@/hooks/use-eval-stream';
import { Header } from '@/components/header';
import { SettingsModal } from '@/components/settings-modal';
import { SubmissionForm } from '@/components/submission-form';
import { ChatbotPanel } from '@/components/chatbot-panel';
import { ScoreReveal } from '@/components/score-reveal';
import { Chatbot } from '@/components/chatbot';
import { SpeechBubble } from '@/components/speech-bubble';

export default function Page() {
  const { state, dispatch } = useEval();
  const { apiKey, loaded } = useApiKey();
  const { start } = useEvalStream();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (loaded && !apiKey && state.phase === 'input') {
      setSettingsOpen(true);
    }
  }, [loaded, apiKey, state.phase]);

  useEffect(() => {
    if (state.phase !== 'grading' || !state.submission) return;
    if (!apiKey) {
      dispatch({ type: 'ERROR', payload: 'API key missing' });
      setSettingsOpen(true);
      return;
    }
    start({
      apiKey,
      studentName: state.submission.studentName,
      submission: state.submission,
      chatbotQA: state.chatbotQA,
      forceRefresh: state.forceRefresh,
    });
  }, [state.phase, state.submission, state.chatbotQA, state.forceRefresh, apiKey, start, dispatch]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {state.phase === 'idle' && (
        <div className="p-12 flex flex-col items-center gap-8">
          <Chatbot pose="idle" size="lg" />
          <SpeechBubble>
            <span className="font-semibold">안녕하세요! 평가할 학생을 알려주세요.</span>
          </SpeechBubble>
          <button
            type="button"
            onClick={() => dispatch({ type: 'START_NEW' })}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-lg font-semibold shadow-lg shadow-sky-500/30 transition-colors"
          >
            다음 학생 평가 시작
          </button>
        </div>
      )}

      {state.phase === 'input' && <SubmissionForm />}
      {state.phase === 'qa' && <ChatbotPanel />}
      {(state.phase === 'grading' || state.phase === 'reveal' || state.phase === 'done') && <ScoreReveal />}

      {state.errorMessage && (
        <div role="alert" className="p-4 bg-red-100 text-red-800 fixed bottom-4 right-4 rounded shadow">
          {state.errorMessage}
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
