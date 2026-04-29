import { kv } from '@vercel/kv';
import type { EvaluationResult, Group } from '@/types';
import { GROUPS } from '@/types';

export function buildCacheKey(group: Group): string {
  return `eval:${group}`;
}

export async function getCachedEvaluation(group: Group): Promise<EvaluationResult | null> {
  try {
    const data = await kv.get<EvaluationResult>(buildCacheKey(group));
    return data ?? null;
  } catch (err) {
    console.warn('[kv-cache] get failed (fail-open):', err);
    return null;
  }
}

export async function setCachedEvaluation(result: EvaluationResult): Promise<void> {
  try {
    await kv.set(buildCacheKey(result.group), result);
  } catch (err) {
    console.warn('[kv-cache] set failed (non-fatal):', err);
  }
}

export async function deleteCachedEvaluation(group: Group): Promise<void> {
  try {
    await kv.del(buildCacheKey(group));
  } catch (err) {
    console.warn('[kv-cache] delete failed:', err);
    throw err;
  }
}

export async function getAllCacheStatus(): Promise<Record<Group, boolean>> {
  const status = {} as Record<Group, boolean>;
  await Promise.all(
    GROUPS.map(async (g) => {
      try {
        const data = await kv.get(buildCacheKey(g));
        status[g] = data !== null && data !== undefined;
      } catch {
        status[g] = false;
      }
    })
  );
  return status;
}
