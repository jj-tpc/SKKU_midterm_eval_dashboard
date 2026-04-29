import { evaluatePromptDesign } from '@/lib/evaluators/evaluate-prompt-design';
import { evaluateOutputQuality } from '@/lib/evaluators/evaluate-output-quality';
import { evaluateIteration } from '@/lib/evaluators/evaluate-iteration';
import { evaluatePresentation } from '@/lib/evaluators/evaluate-presentation';
import { evaluateCreativity } from '@/lib/evaluators/evaluate-creativity';
import { getCachedEvaluation, setCachedEvaluation } from '@/lib/kv-cache';
import { DEFAULT_MODEL } from '@/lib/run-evaluator';
import { SCORE_MAX } from '@/types';
import type { ChatbotQA, EvaluationResult, ScoreCategory, Submission } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Body = {
  studentName: string;
  submission: Submission;
  chatbotQA: ChatbotQA;
  forceRefresh?: boolean;
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key missing' }), { status: 401 });
  }
  const body = (await req.json()) as Body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        const cached = body.forceRefresh ? null : await getCachedEvaluation(body.studentName);
        send('cache-status', { hit: !!cached });

        if (cached) {
          const order: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];
          for (const cat of order) {
            const s = cached.scores[cat];
            send('score', { category: cat, score: s.score, max: s.max, reasoning: s.reasoning, status: 'success' });
            await sleep(500);
          }
          send('complete', { totalScore: cached.totalScore, evaluatedAt: cached.evaluatedAt });
          controller.close();
          return;
        }

        const tasks: Array<{ category: ScoreCategory; promise: Promise<{ score: number; reasoning: string }> }> = [
          { category: 'promptDesign',  promise: evaluatePromptDesign(body.submission, apiKey) },
          { category: 'outputQuality', promise: evaluateOutputQuality(body.submission, apiKey) },
          { category: 'iteration',     promise: evaluateIteration(body.submission, apiKey) },
          { category: 'presentation',  promise: evaluatePresentation(body.chatbotQA, apiKey) },
          { category: 'creativity',    promise: evaluateCreativity(body.submission, apiKey) },
        ];

        const results: Partial<Record<ScoreCategory, { score: number; reasoning: string; ok: boolean }>> = {};
        const wrapped = tasks.map(async ({ category, promise }) => {
          try {
            const r = await promise;
            results[category] = { score: r.score, reasoning: r.reasoning, ok: true };
            send('score', { category, score: r.score, max: SCORE_MAX[category], reasoning: r.reasoning, status: 'success' });
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            results[category] = { score: 0, reasoning: msg, ok: false };
            send('score', { category, score: 0, max: SCORE_MAX[category], reasoning: msg, status: 'error' });
          }
        });
        await Promise.all(wrapped);

        const allOk = Object.values(results).every((r) => r!.ok);
        const total = (['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'] as ScoreCategory[])
          .reduce((sum, c) => sum + (results[c]?.score ?? 0), 0);
        const evaluatedAt = new Date().toISOString();

        send('complete', { totalScore: total, evaluatedAt });

        if (allOk) {
          const evalResult: EvaluationResult = {
            studentName: body.studentName,
            submission: body.submission,
            chatbotQA: body.chatbotQA,
            scores: {
              promptDesign:  { score: results.promptDesign!.score,  max: SCORE_MAX.promptDesign,  reasoning: results.promptDesign!.reasoning },
              outputQuality: { score: results.outputQuality!.score, max: SCORE_MAX.outputQuality, reasoning: results.outputQuality!.reasoning },
              iteration:     { score: results.iteration!.score,     max: SCORE_MAX.iteration,     reasoning: results.iteration!.reasoning },
              presentation:  { score: results.presentation!.score,  max: SCORE_MAX.presentation,  reasoning: results.presentation!.reasoning },
              creativity:    { score: results.creativity!.score,    max: SCORE_MAX.creativity,    reasoning: results.creativity!.reasoning },
            },
            totalScore: total,
            evaluatedAt,
            modelUsed: DEFAULT_MODEL,
          };
          await setCachedEvaluation(evalResult);
        }

        controller.close();
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Unknown error' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
