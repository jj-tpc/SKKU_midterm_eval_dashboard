'use client';
import type { RequiredElementCheck, RequiredElementsResult, Topic } from '@/types';

const STATUS_META: Record<RequiredElementCheck['status'], { glyph: string; bg: string; ring: string; label: string }> = {
  covered: { glyph: '✓', bg: 'oklch(0.93 0.10 145 / 0.6)', ring: 'oklch(0.55 0.18 145)', label: '충족' },
  partial: { glyph: '◐', bg: 'oklch(0.95 0.10 95 / 0.7)',  ring: 'oklch(0.62 0.18 95)',  label: '부분' },
  missing: { glyph: '✕', bg: 'oklch(0.95 0.05 25 / 0.7)',  ring: 'oklch(0.55 0.22 25)',  label: '미흡' },
};

type Props = {
  topic: Topic | null;
  result: RequiredElementsResult | null;
};

export function RequiredElementsWidget({ topic, result }: Props) {
  if (!topic) return null;

  type Row = { requirement: string; status: RequiredElementCheck['status'] | 'pending'; evidence: string };
  const elements: Row[] = result
    ? result.elements.map((e) => ({ requirement: e.requirement, status: e.status, evidence: e.evidence }))
    : topic.requiredElements.map((requirement) => ({ requirement, status: 'pending' as const, evidence: '' }));

  const counts = result
    ? {
        covered: result.elements.filter((e) => e.status === 'covered').length,
        partial: result.elements.filter((e) => e.status === 'partial').length,
        missing: result.elements.filter((e) => e.status === 'missing').length,
      }
    : null;

  return (
    <div
      data-component="required-elements"
      className="rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) p-4 shadow-[5px_5px_0_0_var(--color-line-strong)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--color-line) pb-2">
        <div className="flex items-baseline gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-ink-soft)">
            필수 포함 요소
          </p>
          <p className="font-display text-sm text-(--color-ink)">{topic.title}</p>
        </div>
        {counts && (
          <p className="font-numeric text-xs tabular-nums text-(--color-ink-muted)">
            <span className="text-(--color-success) font-bold">{counts.covered}</span>
            {' / '}
            {topic.requiredElements.length}
          </p>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {elements.map((el, i) => {
          const meta = el.status === 'pending' ? null : STATUS_META[el.status];
          return (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 font-bold text-sm"
                style={{
                  background: meta?.bg ?? 'transparent',
                  borderColor: meta?.ring ?? 'var(--color-line-strong)',
                  color: meta?.ring ?? 'var(--color-ink-muted)',
                }}
                title={meta?.label}
              >
                {meta?.glyph ?? '·'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug text-(--color-ink) break-words">
                  {el.requirement}
                </p>
                {el.evidence && (
                  <p className="mt-0.5 text-xs leading-snug text-(--color-ink-soft) break-words">
                    {el.evidence}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
