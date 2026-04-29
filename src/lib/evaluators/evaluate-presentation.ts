import { runEvaluator } from '../run-evaluator';
import { presentationResponseSchema } from '../schemas';
import type { ChatbotQA } from '@/types';

export async function evaluatePresentation(qa: ChatbotQA, apiKey: string) {
  const qaText = qa.questions
    .map((q, i) => `Q${i + 1} (${q.source}): ${q.question}\nA: ${q.answer}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-presentation',
    vars: { qaList: qaText },
    schema: presentationResponseSchema,
    apiKey,
  });
}
