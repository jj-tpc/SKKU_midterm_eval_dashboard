import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCachedEvaluation,
  setCachedEvaluation,
  deleteCachedEvaluation,
  getAllCacheStatus,
  buildCacheKey,
} from './kv-cache';
import type { EvaluationResult } from '@/types';

const kvStore = new Map<string, unknown>();

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvStore.set(key, value); return 'OK'; }),
    del: vi.fn(async (key: string) => { kvStore.delete(key); return 1; }),
  },
}));

beforeEach(() => kvStore.clear());

const sample: EvaluationResult = {
  group: '그룹1',
  submission: {
    group: '그룹1',
    topicId: 'synopsis',
    versions: [{ label: 'v1', prompt: 'p', result: 'r' }],
  },
  scores: {
    promptDesign:  { score: 25, max: 30, reasoning: 'r' },
    outputQuality: { score: 20, max: 25, reasoning: 'r' },
    iteration:     { score: 18, max: 25, reasoning: 'r' },
    creativity:    { score: 16, max: 20, reasoning: 'r' },
  },
  totalScore: 79,
  evaluatedAt: '2026-04-29T00:00:00Z',
  modelUsed: 'gpt-5.4-mini',
};

describe('buildCacheKey', () => {
  it('prefixes with eval: and uses the group as-is', () => {
    expect(buildCacheKey('그룹2')).toBe('eval:그룹2');
  });
});

describe('cache get/set/delete', () => {
  it('returns null on miss', async () => {
    expect(await getCachedEvaluation('그룹1')).toBeNull();
  });

  it('roundtrips an EvaluationResult', async () => {
    await setCachedEvaluation(sample);
    const got = await getCachedEvaluation('그룹1');
    expect(got).toEqual(sample);
  });

  it('deletes a cached entry', async () => {
    await setCachedEvaluation(sample);
    await deleteCachedEvaluation('그룹1');
    expect(await getCachedEvaluation('그룹1')).toBeNull();
  });

  it('fail-open on KV read error returns null', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));
    expect(await getCachedEvaluation('그룹1')).toBeNull();
  });
});

describe('getAllCacheStatus', () => {
  it('reports presence per group', async () => {
    await setCachedEvaluation(sample);
    const status = await getAllCacheStatus();
    expect(status).toEqual({
      그룹1: true,
      그룹2: false,
      그룹3: false,
      그룹4: false,
      그룹5: false,
    });
  });
});
