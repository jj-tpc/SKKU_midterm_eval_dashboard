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
import { GroupSelector } from '@/components/group-selector';

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
      group: state.submission.group,
      submission: state.submission,
      chatbotQA: state.chatbotQA,
      forceRefresh: state.forceRefresh,
    });
  }, [state.phase, state.submission, state.chatbotQA, state.forceRefresh, apiKey, start, dispatch]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {state.phase === 'idle' && <GroupSelector />}

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
