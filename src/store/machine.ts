import type { CategoryScore, ChatbotQA, ChatbotQAItem, Group, RequiredElementsResult, ScoreCategory, Submission, Topic } from '@/types';

export type Phase = 'idle' | 'topic' | 'input' | 'qa' | 'grading' | 'reveal' | 'done';

export type StoredScore = CategoryScore & { status: 'success' | 'error' };

export type CategoryQuestion = {
  category: ScoreCategory;
  question: string;
};

export type State = {
  phase: Phase;
  group: Group | null;
  topic: Topic | null;
  submission: Submission | null;
  questions: CategoryQuestion[];
  chatbotQA: ChatbotQA;
  scores: Partial<Record<ScoreCategory, StoredScore>>;
  requiredElements: RequiredElementsResult | null;
  totalScore: number | null;
  cheerMessage: string | null;
  cacheHit: boolean | null;
  forceRefresh: boolean;
  errorMessage: string | null;
};

export const initialState: State = {
  phase: 'idle',
  group: null,
  topic: null,
  submission: null,
  questions: [],
  chatbotQA: { questions: [] },
  scores: {},
  requiredElements: null,
  totalScore: null,
  cheerMessage: null,
  cacheHit: null,
  forceRefresh: false,
  errorMessage: null,
};

export type Action =
  | { type: 'START_NEW' }
  | { type: 'SELECT_GROUP'; payload: Group }
  | { type: 'SELECT_TOPIC'; payload: Topic }
  | { type: 'SET_FORCE_REFRESH'; payload: boolean }
  | { type: 'SUBMIT_FORM'; payload: Submission }
  | { type: 'SET_QUESTIONS'; payload: CategoryQuestion[] }
  | { type: 'SUBMIT_QA'; payload: ChatbotQAItem[] }
  | { type: 'CACHE_STATUS'; payload: boolean }
  | { type: 'RECEIVE_SCORE'; payload: { category: ScoreCategory; score: number; max: number; reasoning: string; status: 'success' | 'error' } }
  | { type: 'RECEIVE_REQUIRED_ELEMENTS'; payload: RequiredElementsResult }
  | { type: 'COMPLETE'; payload: { totalScore: number } }
  | { type: 'CHEER'; payload: string }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_NEW':
      return { ...initialState, forceRefresh: state.forceRefresh, phase: 'idle' };
    case 'SELECT_GROUP':
      return { ...initialState, forceRefresh: state.forceRefresh, group: action.payload, phase: 'topic' };
    case 'SELECT_TOPIC':
      return { ...state, topic: action.payload, phase: 'input' };
    case 'SET_FORCE_REFRESH':
      return { ...state, forceRefresh: action.payload };
    case 'SUBMIT_FORM':
      return { ...state, submission: action.payload, group: action.payload.group, phase: 'qa' };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'SUBMIT_QA':
      return { ...state, chatbotQA: { questions: action.payload }, phase: 'grading' };
    case 'CACHE_STATUS':
      return { ...state, cacheHit: action.payload };
    case 'RECEIVE_SCORE': {
      const { category, score, max, reasoning, status } = action.payload;
      return {
        ...state,
        phase: 'reveal',
        scores: { ...state.scores, [category]: { score, max, reasoning, status } },
      };
    }
    case 'RECEIVE_REQUIRED_ELEMENTS':
      return { ...state, requiredElements: action.payload };
    case 'COMPLETE':
      return { ...state, totalScore: action.payload.totalScore, phase: 'done' };
    case 'CHEER':
      return { ...state, cheerMessage: action.payload };
    case 'ERROR':
      return { ...state, errorMessage: action.payload };
    case 'RESET':
      return { ...initialState, forceRefresh: state.forceRefresh };
  }
}
