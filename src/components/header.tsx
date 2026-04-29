'use client';

type Props = { onOpenSettings: () => void };

export function Header({ onOpenSettings }: Props) {
  return (
    <header
      data-component="header"
      className="sticky top-0 z-30 border-b-2 border-(--color-ink) bg-(--color-paper)"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-(--color-magenta)" />
          <h1 className="font-display text-xl tracking-tight text-(--color-ink)">
            SKKU 프롬프트 평가
          </h1>
          <span className="hidden sm:inline text-xs uppercase tracking-[0.25em] text-(--color-ink-muted)">
            Live Scoreboard
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full border-2 border-(--color-ink) bg-(--color-paper) px-3 py-1.5 text-xs font-semibold text-(--color-ink) transition-shadow hover:shadow-[3px_3px_0_0_var(--color-magenta)]"
        >
          설정
        </button>
      </div>
    </header>
  );
}
