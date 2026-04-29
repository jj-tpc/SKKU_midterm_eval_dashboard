'use client';
import type { ScoreCategory } from '@/types';

const LABELS: Record<ScoreCategory, string> = {
  promptDesign: '프롬프트 설계 품질',
  outputQuality: '출력 결과 품질',
  iteration: '반복 개선 과정',
  presentation: '발표 및 시연',
  creativity: '창의성 및 전공 연결',
};

type Props = {
  category: ScoreCategory;
  score: number;
  max: number;
  reasoning: string;
  status: 'success' | 'error' | 'pending';
};

export function ScoreCard({ category, score, max, reasoning, status }: Props) {
  return (
    <div
      data-component="score-card"
      data-category={category}
      data-status={status}
      className={`border rounded p-4 ${status === 'pending' ? 'opacity-50 animate-pulse' : ''}`}
    >
      <p className="text-xs opacity-60">{LABELS[category]}</p>
      {status === 'pending' ? (
        <p className="text-3xl font-bold mt-1">…</p>
      ) : (
        <p className="text-3xl font-bold mt-1">
          {score} <span className="text-base opacity-50">/ {max}</span>
        </p>
      )}
      {status !== 'pending' && (
        <p className="text-xs mt-2 opacity-70">{reasoning}</p>
      )}
    </div>
  );
}
