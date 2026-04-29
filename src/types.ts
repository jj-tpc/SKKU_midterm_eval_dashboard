export const GROUPS = ['그룹1', '그룹2', '그룹3', '그룹4', '그룹5'] as const;
export type Group = (typeof GROUPS)[number];

export type VersionLabel = 'v1' | 'v2' | 'v3';

export type PromptVersion = {
  label: VersionLabel;
  prompt: string;
  result: string;
  changeNote?: string;
};

export type Submission = {
  group: Group;
  versions: PromptVersion[];
};

export type QuestionSource = 'common' | 'dynamic';

export type ChatbotQAItem = {
  source: QuestionSource;
  question: string;
  answer: string;
};

export type ChatbotQA = {
  questions: ChatbotQAItem[];
};

export type ScoreCategory =
  | 'promptDesign'
  | 'outputQuality'
  | 'iteration'
  | 'presentation'
  | 'creativity';

export const SCORE_MAX: Record<ScoreCategory, number> = {
  promptDesign: 30,
  outputQuality: 20,
  iteration: 20,
  presentation: 15,
  creativity: 15,
};

export type CategoryScore = {
  score: number;
  max: number;
  reasoning: string;
};

export type EvaluationResult = {
  group: Group;
  submission: Submission;
  chatbotQA: ChatbotQA;
  scores: Record<ScoreCategory, CategoryScore>;
  totalScore: number;
  cheerMessage?: string;
  evaluatedAt: string;
  modelUsed: string;
};
