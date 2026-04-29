import { NextResponse } from 'next/server';
import commonQuestions from '../../../../prompts/common-questions.json';
import { generateDynamicQuestions } from '@/lib/evaluators/generate-dynamic-questions';
import type { Submission } from '@/types';

export const runtime = 'nodejs';

function pickRandomCommon(): string {
  const i = Math.floor(Math.random() * commonQuestions.length);
  return commonQuestions[i];
}

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 401 });
  }
  const body = (await req.json()) as { submission: Submission };
  const common = pickRandomCommon();

  let dynamic: string[];
  try {
    const { questions } = await generateDynamicQuestions(body.submission, apiKey);
    dynamic = questions;
  } catch (err) {
    console.warn('dynamic question gen failed, falling back to common pool:', err);
    const used = new Set([common]);
    dynamic = [];
    while (dynamic.length < 2) {
      const q = pickRandomCommon();
      if (!used.has(q)) { used.add(q); dynamic.push(q); }
    }
  }

  return NextResponse.json({
    common,
    dynamic,
    questions: [common, ...dynamic],
  });
}
