'use client';
import { useEval } from '@/store/eval-context';
import { ScoreCard } from './score-card';
import { TotalScore } from './total-score';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';
import { SCORE_MAX, type ScoreCategory } from '@/types';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];

function gradeMessage(total: number): string {
  if (total >= 90) return '대단해요! 최고 수준의 작업이에요 🌟';
  if (total >= 75) return '훌륭합니다! 단단한 결과예요.';
  if (total >= 60) return '잘 했어요. 다음엔 더 빛날 거예요.';
  return '수고했어요. 이제 시작이에요.';
}

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

      <div className="flex flex-col items-center gap-4 mt-10">
        <Chatbot pose={showTotal ? 'cheering' : 'thinking'} />
        {showTotal ? (
          <SpeechBubble>
            <span className="font-semibold">{gradeMessage(state.totalScore!)}</span>
          </SpeechBubble>
        ) : (
          <SpeechBubble>
            채점 중이에요… 두근두근 🥁
          </SpeechBubble>
        )}
      </div>

      {state.phase === 'done' && (
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-semibold shadow-lg shadow-sky-500/30 transition-colors"
          >
            다음 학생 →
          </button>
        </div>
      )}
    </section>
  );
}
