'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { useEvalStream } from '@/hooks/use-eval-stream';
import { Header } from '@/components/header';
import { SettingsModal } from '@/components/settings-modal';
import { SubmissionForm } from '@/components/submission-form';
import { ScoreReveal } from '@/components/score-reveal';
import { GroupSelector } from '@/components/group-selector';
import { TopicSelector } from '@/components/topic-selector';

export default function Page() {
  const { state, dispatch } = useEval();
  const { apiKey, loaded } = useApiKey();
  const { start } = useEvalStream();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (loaded && !apiKey && (state.phase === 'topic' || state.phase === 'input')) {
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
      forceRefresh: state.forceRefresh,
    });
  }, [state.phase, state.submission, state.forceRefresh, apiKey, start, dispatch]);

  return (
    <main className="relative min-h-screen bg-(--color-paper)">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {state.phase === 'idle' && <GroupSelector />}
      {state.phase === 'topic' && <TopicSelector />}

      {state.phase === 'input' && <SubmissionForm />}
      {(state.phase === 'grading' || state.phase === 'reveal' || state.phase === 'done') && <ScoreReveal />}

      {state.errorMessage && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) px-4 py-3 text-sm font-semibold text-(--color-danger) shadow-[6px_6px_0_0_var(--color-danger)]"
        >
          {state.errorMessage}
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
