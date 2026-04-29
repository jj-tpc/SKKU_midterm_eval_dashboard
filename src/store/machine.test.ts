import { describe, it, expect } from 'vitest';
import { initialState, reducer, type CategoryQuestion } from './machine';
import type { Submission, ChatbotQAItem } from '@/types';

const sub: Submission = {
  group: '그룹1',
  topicId: 'synopsis',
  versions: [{ label: 'v1', prompt: 'p', result: 'r' }],
};

const fourQuestions: CategoryQuestion[] = [
  { category: 'promptDesign',  question: 'q1' },
  { category: 'outputQuality', question: 'q2' },
  { category: 'iteration',     question: 'q3' },
  { category: 'creativity',    question: 'q4' },
];

const fourQA: ChatbotQAItem[] = [
  { category: 'promptDesign',  question: 'q1', answer: 'a1' },
  { category: 'outputQuality', question: 'q2', answer: 'a2' },
  { category: 'iteration',     question: 'q3', answer: 'a3' },
  { category: 'creativity',    question: 'q4', answer: 'a4' },
];

describe('eval machine reducer', () => {
  it('starts in idle', () => {
    expect(initialState.phase).toBe('idle');
  });

  it('SELECT_GROUP moves to topic phase and stores the group', () => {
    const s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹2' });
    expect(s.phase).toBe('topic');
    expect(s.group).toBe('그룹2');
  });

  it('SELECT_TOPIC moves to input and stores the topic', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹2' });
    s = reducer(s, {
      type: 'SELECT_TOPIC',
      payload: { id: 'synopsis', title: '시놉시스', goal: 'g', requiredElements: ['r1', 'r2'] },
    });
    expect(s.phase).toBe('input');
    expect(s.topic?.id).toBe('synopsis');
  });

  it('START_NEW returns to idle and clears scores', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, { type: 'START_NEW' });
    expect(s.phase).toBe('idle');
    expect(s.group).toBeNull();
  });

  it('input -> qa on SUBMIT_FORM', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, {
      type: 'SELECT_TOPIC',
      payload: { id: 'synopsis', title: '시놉시스', goal: 'g', requiredElements: ['r1'] },
    });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    expect(s.phase).toBe('qa');
    expect(s.submission).toEqual(sub);
  });

  it('qa -> grading on SUBMIT_QA carries 4 category-tagged answers', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    s = reducer(s, { type: 'SET_QUESTIONS', payload: fourQuestions });
    s = reducer(s, { type: 'SUBMIT_QA', payload: fourQA });
    expect(s.phase).toBe('grading');
    expect(s.chatbotQA.questions).toHaveLength(4);
    expect(s.chatbotQA.questions[0].category).toBe('promptDesign');
    expect(s.chatbotQA.questions[3].category).toBe('creativity');
  });

  it('grading -> reveal on RECEIVE_SCORE updates running totals', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    s = reducer(s, { type: 'SET_QUESTIONS', payload: fourQuestions });
    s = reducer(s, { type: 'SUBMIT_QA', payload: fourQA });
    s = reducer(s, { type: 'RECEIVE_SCORE', payload: { category: 'promptDesign', score: 25, max: 30, reasoning: 'r', status: 'success' } });
    expect(s.phase).toBe('reveal');
    expect(s.scores.promptDesign).toBeDefined();
    expect(s.scores.promptDesign?.score).toBe(25);
  });

  it('RESET returns to idle', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, { type: 'RESET' });
    expect(s.phase).toBe('idle');
  });
});
