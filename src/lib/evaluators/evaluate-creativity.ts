import { runEvaluator } from '../run-evaluator';
import { creativityResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateCreativity(
  submission: Submission,
  apiKey: string
) {
  const text = submission.versions
    .map((v) => `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result || '(미제출)'}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-creativity',
    vars: { submission: text },
    schema: creativityResponseSchema,
    apiKey,
  });
}
