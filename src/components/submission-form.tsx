'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import type { PromptVersion, Submission, VersionLabel } from '@/types';

type DraftVersion = { prompt: string; result: string; changeNote: string };
const emptyDraft = (): DraftVersion => ({ prompt: '', result: '', changeNote: '' });

export function SubmissionForm() {
  const { dispatch } = useEval();
  const [name, setName] = useState('');
  const [versions, setVersions] = useState<Record<VersionLabel, DraftVersion>>({
    v1: emptyDraft(),
    v2: emptyDraft(),
    v3: emptyDraft(),
  });

  function update(label: VersionLabel, field: keyof DraftVersion, value: string) {
    setVersions((v) => ({ ...v, [label]: { ...v[label], [field]: value } }));
  }

  const v1Filled = versions.v1.prompt.trim() && versions.v1.result.trim();
  const v2Partial = (versions.v2.prompt.trim() === '') !== (versions.v2.result.trim() === '');
  const v3Partial = (versions.v3.prompt.trim() === '') !== (versions.v3.result.trim() === '');
  const canSubmit = name.trim() && v1Filled && !v2Partial && !v3Partial;

  function submit() {
    const collected: PromptVersion[] = (['v1', 'v2', 'v3'] as VersionLabel[])
      .filter((l) => versions[l].prompt.trim() && versions[l].result.trim())
      .map((l) => ({
        label: l,
        prompt: versions[l].prompt.trim(),
        result: versions[l].result.trim(),
        changeNote: versions[l].changeNote.trim() || undefined,
      }));
    const sub: Submission = { studentName: name.trim(), versions: collected };
    dispatch({ type: 'SUBMIT_FORM', payload: sub });
  }

  return (
    <section data-component="submission-form" className="p-4 space-y-6">
      <div>
        <label className="block text-sm font-medium">학생 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-64 border rounded px-3 py-2"
          placeholder="예: 김철수"
        />
      </div>

      {(['v1', 'v2', 'v3'] as VersionLabel[]).map((label) => {
        const required = label === 'v1';
        return (
          <div key={label} data-component="prompt-version-card" className="border rounded p-4">
            <h3 className="font-bold">
              {label.toUpperCase()} {required ? <span className="text-red-600">*</span> : <span className="text-xs opacity-50">(선택)</span>}
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div data-component="prompt-input">
                <label className="block text-xs font-medium">프롬프트</label>
                <textarea
                  value={versions[label].prompt}
                  onChange={(e) => update(label, 'prompt', e.target.value)}
                  className="mt-1 w-full border rounded p-2 h-40 text-sm"
                />
              </div>
              <div data-component="result-input">
                <label className="block text-xs font-medium">결과물</label>
                <textarea
                  value={versions[label].result}
                  onChange={(e) => update(label, 'result', e.target.value)}
                  className="mt-1 w-full border rounded p-2 h-40 text-sm"
                />
              </div>
            </div>
            {!required && (
              <div className="mt-3">
                <label className="block text-xs font-medium">변경 사유 (옵션)</label>
                <input
                  type="text"
                  value={versions[label].changeNote}
                  onChange={(e) => update(label, 'changeNote', e.target.value)}
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}

      {(v2Partial || v3Partial) && (
        <p className="text-sm text-red-600">
          v2/v3는 프롬프트와 결과물을 짝으로 입력하세요.
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        평가 시작
      </button>
    </section>
  );
}
