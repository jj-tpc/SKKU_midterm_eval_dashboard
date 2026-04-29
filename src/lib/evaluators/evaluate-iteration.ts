import { runEvaluator } from '../run-evaluator';
import { iterationResponseSchema } from '../schemas';
import type { ChatbotQAItem, Submission } from '@/types';

export async function evaluateIteration(
  submission: Submission,
  qaItem: ChatbotQAItem | undefined,
  apiKey: string
) {
  const versionsText = submission.versions
    .map((v) =>
      `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result || '(미제출)'}` +
      (v.changeNote ? `\n[변경사유]\n${v.changeNote}` : '')
    )
    .join('\n\n');
  const qa = qaItem
    ? `Q: ${qaItem.question}\nA: ${qaItem.answer || '(미답변)'}`
    : '(no Q&A captured for this category)';
  return runEvaluator({
    promptName: 'evaluate-iteration',
    vars: { versions: versionsText, qa },
    schema: iterationResponseSchema,
    apiKey,
  });
}
