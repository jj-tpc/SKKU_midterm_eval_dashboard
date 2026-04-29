'use client';
import { useMemo } from 'react';
import { useEval } from '@/store/eval-context';
import { ScoreCard } from './score-card';
import { TotalScore } from './total-score';
import { Chatbot } from './chatbot';
import { SpeechBubble } from './speech-bubble';
import { SCORE_MAX, type ScoreCategory } from '@/types';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];

function fallbackMessage(total: number): string {
  if (total >= 90) return '대단해요! 무대 위 별처럼 빛났어요.';
  if (total >= 75) return '훌륭했어요. 단단한 구성이 보여요.';
  if (total >= 60) return '잘 했어요. 다음 무대는 더 빛날 거예요.';
  return '오늘도 무대에 섰다는 게 멋져요. 다음엔 더 빛날 수 있어요!';
}

const CONFETTI_COLORS = [
  'oklch(0.62 0.27 350)', // magenta
  'oklch(0.78 0.16 220)', // cyan
  'oklch(0.88 0.18 95)',  // yellow
  'oklch(0.65 0.24 305)', // violet
  'oklch(0.72 0.20 0)',   // pink
];

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        cx: (Math.random() - 0.5) * 240,
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 10,
      })),
    []
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: p.w,
            height: p.h,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.25,0.46,0.45,0.94) ${p.delay}s forwards`,
            ['--cx' as string]: `${p.cx}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function ScoreReveal() {
  const { state, dispatch } = useEval();
  if (state.phase !== 'grading' && state.phase !== 'reveal' && state.phase !== 'done') return null;

  const arrivedScores = ORDER.map((c) => state.scores[c]).filter(Boolean);
  const allArrived = arrivedScores.length === ORDER.length;
  const allErrored = allArrived && arrivedScores.every((s) => s!.status === 'error');
  const showTotal = state.totalScore != null && allArrived && !allErrored;
  const totalForBubble = state.totalScore ?? 0;
  const bubbleMessage = state.cheerMessage ?? (showTotal ? fallbackMessage(totalForBubble) : null);
  const isChampion = showTotal && totalForBubble >= 90;

  // The chatbot cheers (and keeps going warmly) for any successful reveal —
  // including the 'KEEP GOING' band — to honor "warm encouragement, not silent withdrawal".
  const chatbotPose = isChampion ? 'jumping' : showTotal ? 'cheering' : 'thinking';

  // All-errored: collapse the card grid into a single retry pane.
  if (allErrored) {
    return (
      <section
        data-component="score-reveal"
        className="mx-auto max-w-3xl px-6 py-12 flex flex-col items-center gap-6"
      >
        <Chatbot pose="thinking" />
        <SpeechBubble tail="top">
          <span className="font-display text-lg leading-relaxed">
            앗, 채점에 일시 오류가 났어요. 잠시 후 다시 시도해 주세요.
          </span>
        </SpeechBubble>
        <p className="text-xs text-(--color-ink-muted) text-center max-w-md">
          API Key가 유효한지, 인터넷 연결이 정상인지 확인하세요.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'RESET' })}
          className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-6 py-2.5 font-display text-base text-(--color-paper) shadow-[5px_5px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-ink)]"
        >
          처음으로 →
        </button>
      </section>
    );
  }

  return (
    <section
      data-component="score-reveal"
      className="mx-auto max-w-7xl px-6 py-8 grid gap-6 md:grid-cols-[35%_1fr]"
    >
      {/* Confetti for 90+ champion */}
      {isChampion && state.phase === 'done' && <Confetti />}

      {/* LEFT — total */}
      <div className="flex items-center justify-center md:border-r-2 md:border-(--color-ink) md:pr-6">
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
            <Chatbot pose={chatbotPose} size="md" />
          </div>
          <div className="flex-1 min-w-0">
            {bubbleMessage ? (
              <SpeechBubble tail="left" key={bubbleMessage}>
                <span className="font-display text-lg leading-relaxed">{bubbleMessage}</span>
              </SpeechBubble>
            ) : (
              <SpeechBubble tail="left">
                <span className="font-display">채점 중이에요…</span>
              </SpeechBubble>
            )}
          </div>
        </div>

        {state.phase === 'done' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET' })}
              className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-7 py-3 font-display text-lg text-(--color-paper) tracking-wide shadow-[6px_6px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)]"
            >
              다음 그룹 →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
