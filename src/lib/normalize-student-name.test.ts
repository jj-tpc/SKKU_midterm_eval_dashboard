import { describe, it, expect } from 'vitest';
import { normalizeStudentName } from './normalize-student-name';

describe('normalizeStudentName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeStudentName('  김철수  ')).toBe('김철수');
  });
  it('collapses internal whitespace', () => {
    expect(normalizeStudentName('김  철  수')).toBe('김 철 수');
  });
  it('preserves Hangul exactly', () => {
    expect(normalizeStudentName('이영희')).toBe('이영희');
  });
  it('returns empty string for whitespace-only', () => {
    expect(normalizeStudentName('   ')).toBe('');
  });
});
