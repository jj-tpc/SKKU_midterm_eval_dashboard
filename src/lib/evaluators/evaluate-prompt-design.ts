import { runEvaluator } from '../run-evaluator';
import { promptDesignResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluatePromptDesign(submission: Submission, apiKey: string) {
  const promptsText = submission.versions
    .map((v) => `### ${v.label}\n${v.prompt}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-prompt-design',
    vars: { prompts: promptsText },
    schema: promptDesignResponseSchema,
    apiKey,
  });
}
