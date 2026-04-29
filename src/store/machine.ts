import type { CategoryScore, ChatbotQA, ChatbotQAItem, ScoreCategory, Submission } from '@/types';

export type Phase = 'idle' | 'input' | 'qa' | 'grading' | 'reveal' | 'done';

export type StoredScore = CategoryScore & { status: 'success' | 'error' };

export type State = {
  phase: Phase;
  studentName: string;
  submission: Submission | null;
  questions: string[];
  chatbotQA: ChatbotQA;
  scores: Partial<Record<ScoreCategory, StoredScore>>;
  totalScore: number | null;
  cheerMessage: string | null;
  cacheHit: boolean | null;
  forceRefresh: boolean;
  errorMessage: string | null;
};

export const initialState: State = {
  phase: 'idle',
  studentName: '',
  submission: null,
  questions: [],
  chatbotQA: { questions: [] },
  scores: {},
  totalScore: null,
  cheerMessage: null,
  cacheHit: null,
  forceRefresh: false,
  errorMessage: null,
};

export type Action =
  | { type: 'START_NEW' }
  | { type: 'SET_FORCE_REFRESH'; payload: boolean }
  | { type: 'SUBMIT_FORM'; payload: Submission }
  | { type: 'SET_QUESTIONS'; payload: string[] }
  | { type: 'SUBMIT_QA'; payload: ChatbotQAItem[] }
  | { type: 'CACHE_STATUS'; payload: boolean }
  | { type: 'RECEIVE_SCORE'; payload: { category: ScoreCategory; score: number; max: number; reasoning: string; status: 'success' | 'error' } }
  | { type: 'COMPLETE'; payload: { totalScore: number } }
  | { type: 'CHEER'; payload: string }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_NEW':
      return { ...initialState, forceRefresh: state.forceRefresh, phase: 'input' };
    case 'SET_FORCE_REFRESH':
      return { ...state, forceRefresh: action.payload };
    case 'SUBMIT_FORM':
      return { ...state, submission: action.payload, studentName: action.payload.studentName, phase: 'qa' };
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
