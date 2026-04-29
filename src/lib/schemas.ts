import { z } from 'zod';

export const promptDesignResponseSchema = z.object({
  score: z.number().int().min(0).max(30),
  reasoning: z.string().min(1),
  breakdown: z.object({
    structure: z.number().int().min(0).max(12),
    technique: z.number().int().min(0).max(10),
    domainFit: z.number().int().min(0).max(8),
  }),
});

export const outputQualityResponseSchema = z.object({
  score: z.number().int().min(0).max(25),
  reasoning: z.string().min(1),
});

export const iterationResponseSchema = z.object({
  score: z.number().int().min(0).max(25),
  reasoning: z.string().min(1),
  versionAnalysis: z.array(z.object({
    from: z.string(),
    to: z.string(),
    improvement: z.string(),
  })),
});

export const creativityResponseSchema = z.object({
  score: z.number().int().min(0).max(20),
  reasoning: z.string().min(1),
});

export const SCORE_CATEGORIES = ['promptDesign', 'outputQuality', 'iteration', 'creativity'] as const;

export const dynamicQuestionsResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        category: z.enum(SCORE_CATEGORIES),
        question: z.string().min(1),
      })
    )
    .length(4),
});

export const cheerMessageResponseSchema = z.object({
  message: z.string().min(1).max(280),
});

export const requiredElementsResponseSchema = z.object({
  elements: z.array(
    z.object({
      requirement: z.string().min(1),
      status: z.enum(['covered', 'partial', 'missing']),
      evidence: z.string().min(1),
    })
  ).min(1),
});
