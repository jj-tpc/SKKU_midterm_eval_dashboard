import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { ZodType } from 'zod';
import { loadPrompt } from './prompt-loader';

export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';

export type RunEvaluatorOptions<T> = {
  promptName: string;
  vars: Record<string, string>;
  schema: ZodType<T>;
  apiKey: string;
  model?: string;
  maxRetries?: number;
};

export async function runEvaluator<T>({
  promptName,
  vars,
  schema,
  apiKey,
  model = DEFAULT_MODEL,
  maxRetries = 1,
}: RunEvaluatorOptions<T>): Promise<T> {
  const prompt = await loadPrompt(promptName);
  const rendered = prompt.render(vars);

  const openai = createOpenAI({ apiKey });

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { object } = await generateObject({
        model: openai(model),
        schema,
        prompt: rendered,
      });
      return object as T;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
    }
  }
  throw lastError;
}
