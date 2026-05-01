import { describe, it, expect } from 'vitest';
import { initialState, reducer } from './machine';
import type { Submission } from '@/types';

const sub: Submission = {
  group: '그룹1',
  topicId: 'synopsis',
  versions: [{ label: 'v1', prompt: 'p', result: 'r' }],
};

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

  it('input -> grading on SUBMIT_FORM', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, {
      type: 'SELECT_TOPIC',
      payload: { id: 'synopsis', title: '시놉시스', goal: 'g', requiredElements: ['r1'] },
    });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
    expect(s.phase).toBe('grading');
    expect(s.submission).toEqual(sub);
  });

  it('grading -> reveal on RECEIVE_SCORE updates running totals', () => {
    let s = reducer(initialState, { type: 'SELECT_GROUP', payload: '그룹1' });
    s = reducer(s, { type: 'SUBMIT_FORM', payload: sub });
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
