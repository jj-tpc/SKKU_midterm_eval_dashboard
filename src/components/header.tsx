'use client';
import { useEval } from '@/store/eval-context';

type Props = { onOpenSettings: () => void };

export function Header({ onOpenSettings }: Props) {
  const { state, dispatch } = useEval();
  return (
    <header data-component="header" className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">SKKU 프롬프트 평가 대시보드</h1>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.forceRefresh}
            onChange={(e) => dispatch({ type: 'SET_FORCE_REFRESH', payload: e.target.checked })}
          />
          캐시 무시하고 재평가
        </label>
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-3 py-1 border rounded text-sm"
        >
          설정
        </button>
      </div>
    </header>
  );
}
