import { runEvaluator } from '../run-evaluator';
import { iterationResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateIteration(
  submission: Submission,
  apiKey: string
) {
  const versionsText = submission.versions
    .map((v) =>
      `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result || '(미제출)'}` +
      (v.changeNote ? `\n[변경사유]\n${v.changeNote}` : '')
    )
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-iteration',
    vars: { versions: versionsText },
    schema: iterationResponseSchema,
    apiKey,
  });
}
