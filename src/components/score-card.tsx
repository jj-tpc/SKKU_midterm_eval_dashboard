'use client';
import { useEffect, useState } from 'react';
import type { ScoreCategory } from '@/types';

type CategoryMeta = {
  label: string;
  /** OKLCH ink color for the dot, bar, and accent. */
  accent: string;
  /** OKLCH ink color for the soft tint behind the card. */
  tint: string;
};

const META: Record<ScoreCategory, CategoryMeta> = {
  promptDesign:  { label: '프롬프트 설계', accent: 'oklch(0.62 0.27 350)', tint: 'oklch(0.97 0.025 350)' }, // magenta
  outputQuality: { label: '출력 결과',     accent: 'oklch(0.7 0.18 220)',  tint: 'oklch(0.96 0.04 220)'  }, // cyan
  iteration:     { label: '반복 개선',     accent: 'oklch(0.78 0.20 75)',  tint: 'oklch(0.97 0.06 80)'   }, // amber-yellow
  presentation:  { label: '발표 시연',     accent: 'oklch(0.65 0.24 305)', tint: 'oklch(0.96 0.05 305)'  }, // violet
  creativity:    { label: '창의성·전공',   accent: 'oklch(0.72 0.20 0)',   tint: 'oklch(0.96 0.05 0)'    }, // hot pink
};

type Props = {
  category: ScoreCategory;
  score: number;
  max: number;
  reasoning: string;
  status: 'success' | 'error' | 'pending';
};

export function ScoreCard({ category, score, max, reasoning, status }: Props) {
  const meta = META[category];
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (status !== 'success') { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score, status]);

  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;

  return (
    <div
      data-component="score-card"
      data-category={category}
      data-status={status}
      className={
        'relative isolate flex flex-col rounded-2xl border-2 border-(--color-ink) p-4 ' +
        'shadow-[5px_5px_0_0_var(--color-ink)] ' +
        (status === 'pending' ? 'opacity-60' : '')
      }
      style={{
        background: status === 'pending' ? 'var(--color-paper-warm)' : meta.tint,
        // the entrance flash uses this var
        ['--card-glow' as string]: `${meta.accent.replace(')', ' / 0.45)')}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: meta.accent }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--color-ink-soft)">
          {meta.label}
        </p>
      </div>

      <div className="mt-3 flex items-baseline gap-1 tabular-nums font-numeric">
        <span className="text-5xl leading-none text-(--color-ink)">
          {status === 'pending' ? '··' : status === 'error' ? '—' : display}
        </span>
        <span className="text-base text-(--color-ink-muted)">/ {max}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full border-2 border-(--color-ink) bg-(--color-paper)">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${status === 'success' ? pct : 0}%`, background: meta.accent }}
        />
      </div>

      {status === 'success' && reasoning && (
        <p className="mt-3 text-xs leading-relaxed text-(--color-ink-soft) line-clamp-3">{reasoning}</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-xs leading-relaxed text-(--color-danger)">평가 실패: {reasoning}</p>
      )}
    </div>
  );
}
