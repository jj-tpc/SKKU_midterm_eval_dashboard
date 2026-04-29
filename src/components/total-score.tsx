'use client';
import { useEffect, useState } from 'react';

type Props = { target: number | null };

function tier(score: number) {
  if (score >= 90) return { label: '최우수', text: 'text-amber-500', glow: 'bg-amber-200/60' };
  if (score >= 75) return { label: '우수',   text: 'text-sky-500',   glow: 'bg-sky-200/60' };
  if (score >= 60) return { label: '양호',   text: 'text-slate-700', glow: 'bg-slate-200/60' };
  return { label: '재도전 권장', text: 'text-slate-500', glow: 'bg-slate-100/60' };
}

export function TotalScore({ target }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target == null) { setDisplay(0); return; }
    const duration = 1500;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const t = target != null ? tier(target) : null;

  return (
    <div data-component="total-score" className="relative text-center py-8">
      {/* glow halo */}
      {t && (
        <div
          aria-hidden="true"
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 ${t.glow} rounded-full blur-3xl -z-10`}
        />
      )}

      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">최종 점수</p>
      <p className={`mt-2 text-8xl font-black tabular-nums ${t ? t.text : 'text-slate-300'}`}>
        {target == null ? '??' : display}
        <span className="text-3xl text-slate-400 font-medium"> / 100</span>
      </p>
      {t && (
        <p className={`mt-1 text-sm font-semibold ${t.text}`}>{t.label}</p>
      )}
    </div>
  );
}
