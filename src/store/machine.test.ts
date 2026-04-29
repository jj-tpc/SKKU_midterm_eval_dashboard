import { describe, it, expect } from 'vitest';
import { initialState, reducer } from './machine';
import type { Submission, ChatbotQAItem } from '@/types';

const sub: Submission = { studentName: '김철수', versions: [{ label: 'v1', prompt: 'p', result: 'r' }] };

describe('eval machine reducer', () => {
  it('starts in idle', () => {
    expect(initialState.phase).toBe('idle');
  });

  it('idle -> input on START_NEW', () => {
    const s = reducer(initialState, { type: 'START_NEW' });
    expect(s.phase).toBe('input');
  });

  it('input -> qa on SUBMIT_FORM', () => {
    const s0 = reducer(initialState, { type: 'START_NEW' });
    const s1 = reducer(s0, { type: 'SUBMIT_FORM', payload: sub });
    expect(s1.phase).toBe('qa');
    expect(s1.submission).toEqual(sub);
  });

  it('qa -> grading on SUBMIT_QA', () => {
    let s = reducer(initialState, { type: 'START_NEW' });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    s = reducer(s, { type: 'SET_QUESTIONS', payload: ['q1', 'q2', 'q3'] });
    const items: ChatbotQAItem[] = [
      { source: 'common',  question: 'q1', answer: 'a1' },
      { source: 'dynamic', question: 'q2', answer: 'a2' },
      { source: 'dynamic', question: 'q3', answer: 'a3' },
    ];
    s = reducer(s, { type: 'SUBMIT_QA', payload: items });
    expect(s.phase).toBe('grading');
    expect(s.chatbotQA.questions).toHaveLength(3);
  });

  it('grading -> reveal on RECEIVE_SCORE updates running totals', () => {
    let s = reducer(initialState, { type: 'START_NEW' });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    s = reducer(s, { type: 'SET_QUESTIONS', payload: ['q1', 'q2', 'q3'] });
    s = reducer(s, { type: 'SUBMIT_QA', payload: [
      { source: 'common',  question: 'q1', answer: 'a' },
      { source: 'dynamic', question: 'q2', answer: 'a' },
      { source: 'dynamic', question: 'q3', answer: 'a' },
    ]});
    s = reducer(s, { type: 'RECEIVE_SCORE', payload: { category: 'promptDesign', score: 25, max: 30, reasoning: 'r', status: 'success' } });
    expect(s.phase).toBe('reveal');
    expect(s.scores.promptDesign).toBeDefined();
    expect(s.scores.promptDesign?.score).toBe(25);
  });

  it('RESET returns to idle', () => {
    let s = reducer(initialState, { type: 'START_NEW' });
    s = reducer(s, { type: 'RESET' });
    expect(s.phase).toBe('idle');
  });
});
