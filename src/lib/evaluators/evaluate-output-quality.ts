import { runEvaluator } from '../run-evaluator';
import { outputQualityResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateOutputQuality(submission: Submission, apiKey: string) {
  const resultsText = submission.versions
    .map((v) => `### ${v.label}\n${v.result || '(결과물 미제출)'}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-output-quality',
    vars: { results: resultsText },
    schema: outputQualityResponseSchema,
    apiKey,
  });
}
