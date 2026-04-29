'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import type { PromptVersion, Submission, VersionLabel } from '@/types';

type DraftVersion = { prompt: string; result: string; changeNote: string };
const emptyDraft = (): DraftVersion => ({ prompt: '', result: '', changeNote: '' });

const FIELD_BASE =
  'mt-1 w-full rounded-lg border bg-white p-3 text-sm leading-relaxed outline-none transition-colors resize-none';

export function SubmissionForm() {
  const { state, dispatch } = useEval();
  const group = state.group;
  const [versions, setVersions] = useState<Record<VersionLabel, DraftVersion>>({
    v1: emptyDraft(),
    v2: emptyDraft(),
    v3: emptyDraft(),
  });
  const [visibleCount, setVisibleCount] = useState<1 | 2 | 3>(1);

  const visibleLabels = (['v1', 'v2', 'v3'] as VersionLabel[]).slice(0, visibleCount);

  function update(label: VersionLabel, field: keyof DraftVersion, value: string) {
    setVersions((v) => ({ ...v, [label]: { ...v[label], [field]: value } }));
  }

  function removeLastVersion() {
    const lastLabel = visibleLabels[visibleLabels.length - 1];
    if (lastLabel === 'v1') return;
    setVersions((v) => ({ ...v, [lastLabel]: emptyDraft() }));
    setVisibleCount((c) => (c - 1) as 1 | 2 | 3);
  }

  const v1HasPrompt = versions.v1.prompt.trim().length > 0;
  const hasOrphan = visibleLabels.some(
    (l) => versions[l].prompt.trim() === '' && versions[l].result.trim() !== ''
  );
  const canSubmit = group !== null && v1HasPrompt && !hasOrphan;

  function submit() {
    if (!group) return;
    const collected: PromptVersion[] = visibleLabels
      .filter((l) => versions[l].prompt.trim().length > 0)
      .map((l) => ({
        label: l,
        prompt: versions[l].prompt.trim(),
        result: versions[l].result.trim(),
        changeNote: versions[l].changeNote.trim() || undefined,
      }));
    const sub: Submission = { group, versions: collected };
    dispatch({ type: 'SUBMIT_FORM', payload: sub });
  }

  return (
    <section data-component="submission-form" className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Selected group banner */}
      <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-slate-500">평가 중</span>
          <span className="rounded-full bg-sky-500 px-3 py-1 text-sm font-semibold text-white">
            {group ?? '?'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'START_NEW' })}
          className="text-xs text-slate-500 hover:text-sky-600 underline"
        >
          ← 그룹 다시 선택
        </button>
      </div>

      {visibleLabels.map((label, idx) => {
        const required = label === 'v1';
        const canRemove = !required && idx === visibleLabels.length - 1;
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
                  <span className="text-xs font-semibold text-rose-500">프롬프트 필수</span>
                ) : (
                  <span className="text-xs text-slate-400">개선 이력</span>
                )}
              </h3>
              {canRemove && (
                <button
                  type="button"
                  data-component="remove-version-button"
                  onClick={removeLastVersion}
                  aria-label={`${label.toUpperCase()} 제거`}
                  className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  <span aria-hidden="true">×</span> 제거
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div data-component="prompt-input" className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-slate-500" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Prompt · 학생이 쓴 프롬프트{required && <span className="ml-1 text-rose-500">*</span>}
                  </label>
                </div>
                <textarea
                  value={versions[label].prompt}
                  onChange={(e) => update(label, 'prompt', e.target.value)}
                  className={`${FIELD_BASE} h-44 border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200`}
                  placeholder="역할/맥락/제약조건 등을 포함한 프롬프트"
                />
              </div>

              <div data-component="result-input" className="rounded-xl border border-sky-200 bg-sky-50/80 p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-sky-500" />
                  <label className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                    Result · 그 프롬프트의 출력 <span className="ml-1 text-sky-400 normal-case font-normal">(선택)</span>
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

      {visibleCount < 3 && (
        <button
          type="button"
          data-component="add-version-button"
          onClick={() => setVisibleCount((c) => (c + 1) as 1 | 2 | 3)}
          className="w-full rounded-2xl border-2 border-dashed border-sky-200 bg-white/40 py-5 text-sm font-semibold text-sky-600 transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
        >
          + 개선 이력 추가 (v{visibleCount + 1})
        </button>
      )}

      {hasOrphan && (
        <p className="text-sm font-medium text-rose-600">
          결과물만 입력된 버전이 있어요. 프롬프트도 함께 입력하거나 결과물을 비워두세요.
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
