'use client';
import { useEffect, useState } from 'react';
import type { ScoreCategory } from '@/types';

type CategoryMeta = {
  label: string;
  gradient: string;
  ring: string;
  bar: string;
  dot: string;
};

const META: Record<ScoreCategory, CategoryMeta> = {
  promptDesign:  { label: '프롬프트 설계 품질', gradient: 'from-violet-100/70 to-white', ring: 'ring-violet-200', bar: 'bg-violet-400', dot: 'bg-violet-400' },
  outputQuality: { label: '출력 결과 품질',     gradient: 'from-teal-100/70 to-white',   ring: 'ring-teal-200',   bar: 'bg-teal-400',   dot: 'bg-teal-400' },
  iteration:     { label: '반복 개선 과정',     gradient: 'from-amber-100/70 to-white',  ring: 'ring-amber-200',  bar: 'bg-amber-400',  dot: 'bg-amber-400' },
  presentation:  { label: '발표 및 시연',       gradient: 'from-rose-100/70 to-white',   ring: 'ring-rose-200',   bar: 'bg-rose-400',   dot: 'bg-rose-400' },
  creativity:    { label: '창의성 및 전공 연결', gradient: 'from-indigo-100/70 to-white', ring: 'ring-indigo-200', bar: 'bg-indigo-400', dot: 'bg-indigo-400' },
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
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} ring-1 ${meta.ring} p-4 shadow-sm ${status === 'pending' ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
        <p className="text-xs font-medium text-slate-600">{meta.label}</p>
      </div>

      <div className="mt-3 flex items-baseline gap-1 tabular-nums">
        <span className="text-4xl font-black text-slate-900">
          {status === 'pending' ? '…' : status === 'error' ? '—' : display}
        </span>
        <span className="text-sm text-slate-500">/ {max}</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/70 ring-1 ring-inset ring-slate-200/60">
        <div
          className={`h-full ${meta.bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${status === 'success' ? pct : 0}%` }}
        />
      </div>

      {status === 'success' && reasoning && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-3">{reasoning}</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-xs leading-relaxed text-red-600">평가 실패: {reasoning}</p>
      )}
    </div>
  );
}
