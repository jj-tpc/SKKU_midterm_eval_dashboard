export const GROUPS = ['그룹1', '그룹2', '그룹3', '그룹4', '그룹5'] as const;
export type Group = (typeof GROUPS)[number];

export type TopicId =
  | 'synopsis'
  | 'content-plan'
  | 'review-framework'
  | 'portfolio-script'
  | 'movie-chatbot';

export type Topic = {
  id: TopicId;
  title: string;
  goal: string;
  requiredElements: string[];
};

export type VersionLabel = 'v1' | 'v2' | 'v3';

export type PromptVersion = {
  label: VersionLabel;
  prompt: string;
  result: string;
  changeNote?: string;
};

export type Submission = {
  group: Group;
  topicId: TopicId;
  versions: PromptVersion[];
};

export type ScoreCategory =
  | 'promptDesign'
  | 'outputQuality'
  | 'iteration'
  | 'creativity';

export const SCORE_MAX: Record<ScoreCategory, number> = {
  promptDesign: 30,
  outputQuality: 25,
  iteration: 25,
  creativity: 20,
};

export type CategoryScore = {
  score: number;
  max: number;
  reasoning: string;
};

export type RequiredElementStatus = 'covered' | 'partial' | 'missing';

export type RequiredElementCheck = {
  requirement: string;
  status: RequiredElementStatus;
  evidence: string;
};

export type RequiredElementsResult = {
  topicId: TopicId;
  elements: RequiredElementCheck[];
};

export type EvaluationResult = {
  group: Group;
  submission: Submission;
  scores: Record<ScoreCategory, CategoryScore>;
  requiredElements?: RequiredElementsResult;
  totalScore: number;
  cheerMessage?: string;
  evaluatedAt: string;
  modelUsed: string;
};
