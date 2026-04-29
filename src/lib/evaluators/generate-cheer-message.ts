import { runEvaluator } from '../run-evaluator';
import { cheerMessageResponseSchema } from '../schemas';
import type { CategoryScore, Group, ScoreCategory } from '@/types';
import { SCORE_MAX } from '@/types';

const LABELS: Record<ScoreCategory, string> = {
  promptDesign: '프롬프트 설계',
  outputQuality: '출력 결과',
  iteration: '반복 개선',
  creativity: '창의성·전공',
};

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'creativity'];

type Args = {
  group: Group;
  totalScore: number;
  scores: Record<ScoreCategory, CategoryScore>;
  apiKey: string;
};

export async function generateCheerMessage({ group, totalScore, scores, apiKey }: Args) {
  const breakdown = ORDER
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
