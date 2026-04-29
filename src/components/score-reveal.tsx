'use client';
import { useEval } from '@/store/eval-context';
import { ScoreCard } from './score-card';
import { TotalScore } from './total-score';
import { Chatbot } from './chatbot';
import { SCORE_MAX, type ScoreCategory } from '@/types';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];

export function ScoreReveal() {
  const { state, dispatch } = useEval();
  if (state.phase !== 'grading' && state.phase !== 'reveal' && state.phase !== 'done') return null;

  const allArrived = ORDER.every((c) => state.scores[c]);
  const showTotal = state.totalScore != null && allArrived;

  return (
    <section data-component="score-reveal" className="p-6">
      <TotalScore target={showTotal ? state.totalScore : null} />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
        {ORDER.map((cat) => {
          const s = state.scores[cat];
          if (!s) return (
            <ScoreCard
              key={cat}
              category={cat}
              score={0}
              max={SCORE_MAX[cat]}
              reasoning=""
              status="pending"
            />
          );
          return (
            <ScoreCard
              key={cat}
              category={cat}
              score={s.score}
              max={s.max}
              reasoning={s.reasoning}
              status={s.status}
            />
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <Chatbot pose={showTotal ? 'cheering' : 'thinking'} />
      </div>

      {state.phase === 'done' && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="px-4 py-2 bg-black text-white rounded"
          >
            다음 학생
          </button>
        </div>
      )}
    </section>
  );
}
