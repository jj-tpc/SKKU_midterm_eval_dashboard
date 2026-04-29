'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import type { PromptVersion, Submission, VersionLabel } from '@/types';

type DraftVersion = { prompt: string; result: string; changeNote: string };
const emptyDraft = (): DraftVersion => ({ prompt: '', result: '', changeNote: '' });

const FIELD_BASE =
  'mt-1 w-full rounded-xl border-2 border-(--color-ink) bg-(--color-paper) p-3 text-sm leading-relaxed outline-none transition-shadow resize-none focus:shadow-[3px_3px_0_0_var(--color-magenta)]';

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
    <section data-component="submission-form" className="mx-auto max-w-5xl px-6 py-8 space-y-5">
      {/* Group banner — neutral title bar (magenta reserved for the CTA) */}
      <div className="flex items-center justify-between border-b-2 border-(--color-ink) pb-3">
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-[0.4em] text-(--color-ink-muted)">평가 중</span>
          <span className="rounded-full border-2 border-(--color-ink) bg-(--color-paper) px-4 py-1 font-display text-lg text-(--color-ink)">
            {group ?? '?'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'START_NEW' })}
          className="text-xs font-semibold text-(--color-ink-soft) underline underline-offset-2 hover:text-(--color-ink)"
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
            className="rounded-2xl border-2 border-(--color-ink) bg-(--color-paper) p-5 shadow-[6px_6px_0_0_var(--color-line-strong)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-baseline gap-2">
                <span className="font-numeric text-2xl tracking-wider text-(--color-magenta)">
                  {label.toUpperCase()}
                </span>
                {required ? (
                  <span className="text-xs font-bold tracking-wider uppercase text-(--color-danger)">PROMPT REQUIRED</span>
                ) : (
                  <span className="text-xs font-bold tracking-wider uppercase text-(--color-ink-muted)">개선 이력</span>
                )}
              </h3>
              {canRemove && (
                <button
                  type="button"
                  data-component="remove-version-button"
                  onClick={removeLastVersion}
                  aria-label={`${label.toUpperCase()} 제거`}
                  className="rounded-full border-2 border-(--color-ink) bg-(--color-paper) px-2.5 py-0.5 text-xs font-semibold text-(--color-ink) transition-shadow hover:shadow-[2px_2px_0_0_var(--color-danger)]"
                >
                  × 제거
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div data-component="prompt-input" className="rounded-xl border-2 border-(--color-ink) bg-(--color-paper-warm) p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-(--color-ink)" />
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-ink-soft)">
                    Prompt · 학생이 쓴 프롬프트{required && <span className="ml-1 text-(--color-danger)">*</span>}
                  </label>
                </div>
                <textarea
                  value={versions[label].prompt}
                  onChange={(e) => update(label, 'prompt', e.target.value)}
                  className={`${FIELD_BASE} h-44 mt-2`}
                  placeholder="역할/맥락/제약조건 등을 포함한 프롬프트"
                />
              </div>

              <div data-component="result-input" className="rounded-xl border-2 border-(--color-ink) bg-(--color-paper-warm) p-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-(--color-cyan)" />
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-ink-soft)">
                    Result · 그 프롬프트의 출력 <span className="ml-1 text-(--color-ink-muted) font-medium normal-case tracking-normal">(선택)</span>
                  </label>
                </div>
                <textarea
                  value={versions[label].result}
                  onChange={(e) => update(label, 'result', e.target.value)}
                  className={`${FIELD_BASE} h-44 mt-2`}
                  placeholder="LLM에서 받은 결과물"
                />
              </div>
            </div>

            {!required && (
              <div className="mt-3">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-(--color-ink-muted)">변경 사유 (옵션)</label>
                <input
                  type="text"
                  value={versions[label].changeNote}
                  onChange={(e) => update(label, 'changeNote', e.target.value)}
                  className={`${FIELD_BASE}`}
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
          className="w-full rounded-2xl border-2 border-dashed border-(--color-ink) bg-transparent py-5 font-display text-base text-(--color-ink-soft) transition-colors hover:border-(--color-magenta) hover:text-(--color-magenta) hover:bg-(--color-magenta-tint)"
        >
          + 개선 이력 추가 (v{visibleCount + 1})
        </button>
      )}

      {hasOrphan && (
        <p className="rounded-xl border-2 border-(--color-danger) bg-(--color-paper) px-4 py-3 text-sm font-semibold text-(--color-danger)">
          결과물만 입력된 버전이 있어요. 프롬프트도 함께 입력하거나 결과물을 비워두세요.
        </p>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="rounded-full border-2 border-(--color-ink) bg-(--color-magenta) px-7 py-3 font-display text-lg text-(--color-paper) tracking-wide shadow-[6px_6px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-[3px_3px_0_0_var(--color-line-strong)]"
        >
          평가 시작 →
        </button>
      </div>
    </section>
  );
}
