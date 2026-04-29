import { runEvaluator } from '../run-evaluator';
import { outputQualityResponseSchema } from '../schemas';
import type { ChatbotQAItem, Submission } from '@/types';

export async function evaluateOutputQuality(
  submission: Submission,
  qaItem: ChatbotQAItem | undefined,
  apiKey: string
) {
  const resultsText = submission.versions
    .map((v) => `### ${v.label}\n${v.result || '(결과물 미제출)'}`)
    .join('\n\n');
  const qa = qaItem
    ? `Q: ${qaItem.question}\nA: ${qaItem.answer || '(미답변)'}`
    : '(no Q&A captured for this category)';
  return runEvaluator({
    promptName: 'evaluate-output-quality',
    vars: { results: resultsText, qa },
    schema: outputQualityResponseSchema,
    apiKey,
  });
}
