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
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-ink)/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-component="settings-modal"
        className="w-[480px] max-w-[92vw] rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) p-6 shadow-[10px_10px_0_0_var(--color-magenta)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-(--color-ink)">설정</h2>
        <p className="mt-2 text-sm text-(--color-ink-soft)">
          OpenAI API Key를 입력하세요. 브라우저(localStorage)에만 저장되고 서버로 전송되지 않습니다.
        </p>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="sk-..."
          autoFocus
          className="mt-4 w-full rounded-xl border-2 border-(--color-ink) bg-(--color-paper) px-3 py-2 font-mono text-sm outline-none transition-shadow focus:shadow-[3px_3px_0_0_var(--color-magenta)]"
        />
        {!valid && draft.length > 0 && (
          <p className="mt-1 text-xs font-semibold text-(--color-danger)">키가 너무 짧습니다.</p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            className="text-xs font-semibold text-(--color-danger) underline underline-offset-2 hover:opacity-80"
            onClick={() => { clearApiKey(); setDraft(''); }}
          >
            저장된 키 삭제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border-2 border-(--color-ink) bg-(--color-paper) px-4 py-1.5 text-sm font-semibold text-(--color-ink) transition-shadow hover:shadow-[3px_3px_0_0_var(--color-line-strong)]"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="button"
              className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-4 py-1.5 font-display text-sm text-(--color-paper) shadow-[4px_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
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
