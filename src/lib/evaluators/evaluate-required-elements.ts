import { runEvaluator } from '../run-evaluator';
import { requiredElementsResponseSchema } from '../schemas';
import type { Submission, Topic } from '@/types';

export async function evaluateRequiredElements(
  submission: Submission,
  topic: Topic,
  apiKey: string
) {
  // Audit the LAST submitted version's prompt (v3 if present, else v2, else v1).
  const lastVersion = submission.versions[submission.versions.length - 1];
  const finalPrompt = lastVersion?.prompt ?? '';
  const finalResult = lastVersion?.result ?? '';

  const requiredElements = topic.requiredElements
    .map((r, i) => `${i + 1}. ${r}`)
    .join('\n');

  return runEvaluator({
    promptName: 'evaluate-required-elements',
    vars: {
      topicTitle: topic.title,
      topicGoal: topic.goal,
      requiredElements,
      finalPrompt,
      finalResult,
    },
    schema: requiredElementsResponseSchema,
    apiKey,
  });
}
