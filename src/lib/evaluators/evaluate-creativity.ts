import { runEvaluator } from '../run-evaluator';
import { creativityResponseSchema } from '../schemas';
import type { ChatbotQAItem, Submission } from '@/types';

export async function evaluateCreativity(
  submission: Submission,
  qaItem: ChatbotQAItem | undefined,
  apiKey: string
) {
  const text = submission.versions
    .map((v) => `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result || '(미제출)'}`)
    .join('\n\n');
  const qa = qaItem
    ? `Q: ${qaItem.question}\nA: ${qaItem.answer || '(미답변)'}`
    : '(no Q&A captured for this category)';
  return runEvaluator({
    promptName: 'evaluate-creativity',
    vars: { submission: text, qa },
    schema: creativityResponseSchema,
    apiKey,
  });
}
