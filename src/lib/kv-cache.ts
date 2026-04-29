import { kv } from '@vercel/kv';
import type { EvaluationResult } from '@/types';
import { normalizeStudentName } from './normalize-student-name';

export function buildCacheKey(studentName: string): string {
  return `eval:${normalizeStudentName(studentName)}`;
}

export async function getCachedEvaluation(studentName: string): Promise<EvaluationResult | null> {
  try {
    const data = await kv.get<EvaluationResult>(buildCacheKey(studentName));
    return data ?? null;
  } catch (err) {
    console.warn('[kv-cache] get failed (fail-open):', err);
    return null;
  }
}

export async function setCachedEvaluation(result: EvaluationResult): Promise<void> {
  try {
    await kv.set(buildCacheKey(result.studentName), result);
  } catch (err) {
    console.warn('[kv-cache] set failed (non-fatal):', err);
  }
}
