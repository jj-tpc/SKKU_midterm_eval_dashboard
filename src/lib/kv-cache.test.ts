import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedEvaluation, setCachedEvaluation, buildCacheKey } from './kv-cache';
import type { EvaluationResult } from '@/types';

const kvStore = new Map<string, unknown>();

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvStore.set(key, value); return 'OK'; }),
  },
}));

beforeEach(() => kvStore.clear());

const sample: EvaluationResult = {
  studentName: '김철수',
  submission: { studentName: '김철수', versions: [{ label: 'v1', prompt: 'p', result: 'r' }] },
  chatbotQA: { questions: [] },
  scores: {
    promptDesign:  { score: 25, max: 30, reasoning: 'r' },
    outputQuality: { score: 18, max: 20, reasoning: 'r' },
    iteration:     { score: 12, max: 20, reasoning: 'r' },
    presentation:  { score: 13, max: 15, reasoning: 'r' },
    creativity:    { score: 14, max: 15, reasoning: 'r' },
  },
  totalScore: 82,
  evaluatedAt: '2026-04-29T00:00:00Z',
  modelUsed: 'gpt-5.4-mini',
};

describe('buildCacheKey', () => {
  it('prefixes with eval: and normalizes name', () => {
    expect(buildCacheKey('  김철수  ')).toBe('eval:김철수');
  });
});

describe('cache get/set', () => {
  it('returns null on miss', async () => {
    expect(await getCachedEvaluation('nobody')).toBeNull();
  });

  it('roundtrips an EvaluationResult', async () => {
    await setCachedEvaluation(sample);
    const got = await getCachedEvaluation('김철수');
    expect(got).toEqual(sample);
  });

  it('fail-open on KV error returns null', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));
    expect(await getCachedEvaluation('김철수')).toBeNull();
  });
});
