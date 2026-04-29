'use client';
import { useEffect, useState } from 'react';

type Props = { target: number | null };

type Tier = {
  label: string;
  /** Solid ink color for the number itself. */
  text: string;
  /** Accent for the halo behind the number. */
  halo: string;
  /** Glow used by total-shimmer drop-shadow. */
  shimmer: string;
};

function tierFor(score: number): Tier {
  if (score >= 90) return {
    label: 'CHAMPION',
    text: 'oklch(0.5 0.25 350)',
    halo: 'oklch(0.88 0.18 95 / 0.85)',  // gold halo
    shimmer: 'oklch(0.62 0.27 350 / 0.6)',
  };
  if (score >= 75) return {
    label: 'EXCELLENT',
    text: 'oklch(0.55 0.27 350)',
    halo: 'oklch(0.85 0.16 350 / 0.65)',
    shimmer: 'oklch(0.62 0.27 350 / 0.55)',
  };
  if (score >= 60) return {
    label: 'GOOD JOB',
    text: 'oklch(0.4 0.18 220)',
    halo: 'oklch(0.85 0.16 220 / 0.55)',
    shimmer: 'oklch(0.7 0.18 220 / 0.5)',
  };
  return {
    label: 'KEEP GOING',
    text: 'oklch(0.42 0.015 350)',
    halo: 'oklch(0.92 0.04 350 / 0.55)',
    shimmer: 'oklch(0.62 0.012 350 / 0.4)',
  };
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

  const t = target != null ? tierFor(target) : null;
  const revealed = target != null;

  return (
    <div
      data-component="total-score"
      data-revealed={revealed}
      className="relative flex flex-col items-center justify-center text-center py-6"
    >
      {/* glow halo */}
      {t && (
        <div
          aria-hidden="true"
          className="total-halo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] h-[22rem] rounded-full blur-3xl -z-10"
          style={{ background: t.halo }}
        />
      )}

      <p className="font-numeric text-xs uppercase tracking-[0.5em] text-(--color-ink-muted)">
        Final Score
      </p>

      <p
        className="total-number mt-3 font-numeric tabular-nums leading-none"
        style={{
          fontSize: 'clamp(6rem, 16vw, 11rem)',
          color: t ? t.text : 'oklch(0.85 0.018 350)',
          ['--shimmer-color' as string]: t?.shimmer ?? 'transparent',
        }}
      >
        {target == null ? '··' : display}
        <span className="ml-1 font-numeric text-[0.28em] text-(--color-ink-muted)"> / 100</span>
      </p>

      {t && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-(--color-ink) bg-(--color-paper) px-5 py-1.5">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: t.text }} />
          <span className="font-display text-sm tracking-[0.2em] text-(--color-ink)">
            {t.label}
          </span>
        </div>
      )}
    </div>
  );
}
