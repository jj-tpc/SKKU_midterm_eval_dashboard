'use client';
import { useEval } from '@/store/eval-context';

type Props = { onOpenSettings: () => void };

export function Header({ onOpenSettings }: Props) {
  const { state, dispatch } = useEval();
  return (
    <header
      data-component="header"
      className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-sky-100 bg-white/80 backdrop-blur px-6 py-3"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500 ring-2 ring-sky-200" />
        <h1 className="text-base font-bold tracking-tight text-slate-800">
          SKKU 프롬프트 평가 대시보드
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 cursor-pointer select-none hover:border-sky-300 transition-colors">
          <input
            type="checkbox"
            checked={state.forceRefresh}
            onChange={(e) => dispatch({ type: 'SET_FORCE_REFRESH', payload: e.target.checked })}
            className="accent-sky-500"
          />
          캐시 무시
        </label>
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:text-sky-600 transition-colors"
        >
          설정
        </button>
      </div>
    </header>
  );
}
