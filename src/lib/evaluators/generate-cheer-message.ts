import { runEvaluator } from '../run-evaluator';
import { cheerMessageResponseSchema } from '../schemas';
import type { CategoryScore, Group, ScoreCategory } from '@/types';
import { SCORE_MAX } from '@/types';

const LABELS: Record<ScoreCategory, string> = {
  promptDesign: '프롬프트 설계 품질',
  outputQuality: '출력 결과 품질',
  iteration: '반복 개선 과정',
  presentation: '발표 및 시연',
  creativity: '창의성 및 전공 연결',
};

type Args = {
  group: Group;
  totalScore: number;
  scores: Record<ScoreCategory, CategoryScore>;
  apiKey: string;
};

export async function generateCheerMessage({ group, totalScore, scores, apiKey }: Args) {
  const order: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];
  const breakdown = order
    .map((c) => `- ${LABELS[c]} (${scores[c].score}/${SCORE_MAX[c]}): ${scores[c].reasoning}`)
    .join('\n');

  return runEvaluator({
    promptName: 'generate-cheer-message',
    vars: {
      group,
      totalScore: String(totalScore),
      breakdown,
    },
    schema: cheerMessageResponseSchema,
    apiKey,
  });
}
