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
  score: z.number().int().min(0).max(20),
  reasoning: z.string().min(1),
});

export const iterationResponseSchema = z.object({
  score: z.number().int().min(0).max(20),
  reasoning: z.string().min(1),
  versionAnalysis: z.array(z.object({
    from: z.string(),
    to: z.string(),
    improvement: z.string(),
  })),
});

export const presentationResponseSchema = z.object({
  score: z.number().int().min(0).max(15),
  reasoning: z.string().min(1),
});

export const creativityResponseSchema = z.object({
  score: z.number().int().min(0).max(15),
  reasoning: z.string().min(1),
});

export const dynamicQuestionsResponseSchema = z.object({
  questions: z.array(z.string().min(1)).length(2),
});

export const cheerMessageResponseSchema = z.object({
  message: z.string().min(1).max(280),
});
