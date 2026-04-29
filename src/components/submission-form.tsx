'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import type { PromptVersion, Submission, VersionLabel } from '@/types';

type DraftVersion = { prompt: string; result: string; changeNote: string };
const emptyDraft = (): DraftVersion => ({ prompt: '', result: '', changeNote: '' });

const FIELD_BASE =
  'mt-1 w-full rounded-lg border bg-white p-3 text-sm leading-relaxed outline-none transition-colors resize-none';

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
    <section data-component="submission-form" className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700">학생 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${FIELD_BASE} max-w-xs border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200`}
          placeholder="예: 김철수"
        />
      </div>

      {(['v1', 'v2', 'v3'] as VersionLabel[]).map((label) => {
        const required = label === 'v1';
        return (
          <div
            key={label}
            data-component="prompt-version-card"
            className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sm font-semibold text-sky-700">
                  {label.toUpperCase()}
                </span>
                {required ? (
                  <span className="text-xs font-semibold text-rose-500">필수</span>
                ) : (
                  <span className="text-xs text-slate-400">선택</span>
                )}
              </h3>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* PROMPT — neutral slate */}
              <div
                data-component="prompt-input"
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-slate-500" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Prompt · 학생이 쓴 프롬프트
                  </label>
                </div>
                <textarea
                  value={versions[label].prompt}
                  onChange={(e) => update(label, 'prompt', e.target.value)}
                  className={`${FIELD_BASE} h-44 border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200`}
                  placeholder="역할/맥락/제약조건 등을 포함한 프롬프트"
                />
              </div>

              {/* RESULT — sky tint to differentiate */}
              <div
                data-component="result-input"
                className="rounded-xl border border-sky-200 bg-sky-50/80 p-3"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                    Result · 그 프롬프트의 출력
                  </label>
                </div>
                <textarea
                  value={versions[label].result}
                  onChange={(e) => update(label, 'result', e.target.value)}
                  className={`${FIELD_BASE} h-44 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200`}
                  placeholder="LLM에서 받은 결과물"
                />
              </div>
            </div>

            {!required && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-500">변경 사유 (옵션)</label>
                <input
                  type="text"
                  value={versions[label].changeNote}
                  onChange={(e) => update(label, 'changeNote', e.target.value)}
                  className={`${FIELD_BASE} border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200`}
                  placeholder="이 버전에서 무엇을 바꿨고 왜 바꿨는지"
                />
              </div>
            )}
          </div>
        );
      })}

      {(v2Partial || v3Partial) && (
        <p className="text-sm font-medium text-rose-600">
          v2/v3는 프롬프트와 결과물을 짝으로 입력하세요.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-full font-semibold shadow-lg shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          평가 시작 →
        </button>
      </div>
    </section>
  );
}
