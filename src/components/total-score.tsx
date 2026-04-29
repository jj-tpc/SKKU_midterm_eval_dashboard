'use client';
import { useEffect, useState } from 'react';

type Props = { target: number | null };

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

  return (
    <div data-component="total-score" className="text-center py-6">
      <p className="text-xs opacity-60">최종 점수</p>
      <p className="text-7xl font-black tabular-nums">
        {target == null ? '??' : display}
        <span className="text-2xl opacity-50"> / 100</span>
      </p>
    </div>
  );
}
