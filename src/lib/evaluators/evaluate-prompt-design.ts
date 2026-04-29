import { runEvaluator } from '../run-evaluator';
import { promptDesignResponseSchema } from '../schemas';
import type { ChatbotQAItem, Submission } from '@/types';

export async function evaluatePromptDesign(
  submission: Submission,
  qaItem: ChatbotQAItem | undefined,
  apiKey: string
) {
  const promptsText = submission.versions
    .map((v) => `### ${v.label}\n${v.prompt}`)
    .join('\n\n');
  const qa = qaItem
    ? `Q: ${qaItem.question}\nA: ${qaItem.answer || '(미답변)'}`
    : '(no Q&A captured for this category)';
  return runEvaluator({
    promptName: 'evaluate-prompt-design',
    vars: { prompts: promptsText, qa },
    schema: promptDesignResponseSchema,
    apiKey,
  });
}
