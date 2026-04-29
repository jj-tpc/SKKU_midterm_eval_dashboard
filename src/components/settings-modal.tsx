'use client';
import { useState, useEffect } from 'react';
import { useApiKey } from '@/hooks/use-api-key';

type Props = { open: boolean; onClose: () => void };

export function SettingsModal({ open, onClose }: Props) {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) setDraft(apiKey);
  }, [open, apiKey]);

  if (!open) return null;

  const valid = draft.trim().length > 10;

  return (
    <div
      data-component="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-component="settings-modal"
        className="w-[480px] max-w-[92vw] rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-800">설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          OpenAI API Key를 입력하세요. 브라우저(localStorage)에만 저장되고 서버로 전송되지 않습니다.
        </p>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="sk-..."
          autoFocus
          className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
        />
        {!valid && draft.length > 0 && (
          <p className="mt-1 text-xs text-rose-600">키가 너무 짧습니다.</p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            className="text-xs text-rose-500 hover:text-rose-600 underline"
            onClick={() => { clearApiKey(); setDraft(''); }}
          >
            저장된 키 삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:border-slate-300"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full bg-sky-500 hover:bg-sky-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={!valid}
              onClick={() => { setApiKey(draft.trim()); onClose(); }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
