import { runEvaluator } from '../run-evaluator';
import { dynamicQuestionsResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function generateDynamicQuestions(submission: Submission, apiKey: string) {
  const text = submission.versions
    .map((v) => `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result || '(미제출)'}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'generate-dynamic-questions',
    vars: { submission: text },
    schema: dynamicQuestionsResponseSchema,
    apiKey,
  });
}
