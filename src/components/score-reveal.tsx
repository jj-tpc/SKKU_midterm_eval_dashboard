'use client';
import { useEval } from '@/store/eval-context';
import { ScoreCard } from './score-card';
import { TotalScore } from './total-score';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';
import { SCORE_MAX, type ScoreCategory } from '@/types';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];

function fallbackMessage(total: number): string {
  if (total >= 90) return '대단해요! 최고 수준의 작업이에요.';
  if (total >= 75) return '훌륭합니다. 단단한 결과예요.';
  if (total >= 60) return '잘 했어요. 다음엔 더 빛날 거예요.';
  return '수고했어요. 더 좋은 결과를 바랄게요!';
}

export function ScoreReveal() {
  const { state, dispatch } = useEval();
  if (state.phase !== 'grading' && state.phase !== 'reveal' && state.phase !== 'done') return null;

  const allArrived = ORDER.every((c) => state.scores[c]);
  const showTotal = state.totalScore != null && allArrived;
  const totalForBubble = state.totalScore ?? 0;
  const bubbleMessage = state.cheerMessage ?? (showTotal ? fallbackMessage(totalForBubble) : null);

  return (
    <section
      data-component="score-reveal"
      className="mx-auto max-w-7xl p-6 grid gap-6 md:grid-cols-[35%_1fr]"
    >
      {/* LEFT — total */}
      <div className="flex items-center justify-center">
        <TotalScore target={showTotal ? state.totalScore : null} />
      </div>

      {/* RIGHT — top: score cards, bottom: chatbot + bubble */}
      <div className="flex flex-col gap-8 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
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

        <div className="flex items-end gap-4 pt-2">
          <div className="shrink-0">
            <Chatbot pose={showTotal ? 'cheering' : 'thinking'} size="md" />
          </div>
          <div className="flex-1 min-w-0">
            {bubbleMessage ? (
              <SpeechBubble tail="left" key={bubbleMessage}>
                <span className="font-semibold leading-relaxed">{bubbleMessage}</span>
              </SpeechBubble>
            ) : (
              <SpeechBubble tail="left">채점 중이에요… 두근두근</SpeechBubble>
            )}
          </div>
        </div>

        {state.phase === 'done' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET' })}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-semibold shadow-lg shadow-sky-500/30 transition-colors"
            >
              다음 학생 →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
