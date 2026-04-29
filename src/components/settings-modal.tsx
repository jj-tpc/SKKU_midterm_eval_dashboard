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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        data-component="settings-modal"
        className="bg-white text-black p-6 rounded shadow-lg w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">설정</h2>
        <p className="text-sm mt-2 opacity-70">OpenAI API Key를 입력하세요. 브라우저에만 저장됩니다.</p>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="sk-..."
          className="mt-3 w-full border rounded px-3 py-2 font-mono text-sm"
        />
        {!valid && draft.length > 0 && (
          <p className="text-xs text-red-600 mt-1">키가 너무 짧습니다.</p>
        )}
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            className="text-sm text-red-600 underline"
            onClick={() => { clearApiKey(); setDraft(''); }}
          >
            저장된 키 삭제
          </button>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 border rounded" onClick={onClose}>취소</button>
            <button
              type="button"
              className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
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
