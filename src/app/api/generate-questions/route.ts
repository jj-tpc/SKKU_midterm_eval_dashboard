import { NextResponse } from 'next/server';
import commonQuestionsRaw from '../../../../prompts/common-questions.json';
import { generateDynamicQuestions } from '@/lib/evaluators/generate-dynamic-questions';
import type { ScoreCategory, Submission } from '@/types';

export const runtime = 'nodejs';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'creativity'];

type CommonPool = Record<ScoreCategory, string[]>;
const commonQuestions = commonQuestionsRaw as CommonPool;

function pickFallback(category: ScoreCategory): string {
  const pool = commonQuestions[category] ?? [];
  if (pool.length === 0) return '이번 작업에서 가장 신경 쓴 부분이 무엇인가요?';
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 401 });
  }
  const body = (await req.json()) as { submission: Submission };

  let questions: Array<{ category: ScoreCategory; question: string }>;
  try {
    const out = await generateDynamicQuestions(body.submission, apiKey);
    // Re-order to canonical category order, in case the LLM swapped them.
    const map = new Map(out.questions.map((q) => [q.category, q.question]));
    questions = ORDER.map((c) => ({ category: c, question: map.get(c) ?? pickFallback(c) }));
  } catch (err) {
    console.warn('dynamic question gen failed, falling back to common pool:', err);
    questions = ORDER.map((c) => ({ category: c, question: pickFallback(c) }));
  }

  return NextResponse.json({ questions });
}
