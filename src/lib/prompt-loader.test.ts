import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadPrompt, renderTemplate } from './prompt-loader';

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

describe('renderTemplate', () => {
  it('replaces {{var}} placeholders', () => {
    expect(renderTemplate('Hi {{x}}', { x: 'world' })).toBe('Hi world');
  });
  it('handles missing vars as empty string', () => {
    expect(renderTemplate('Hi {{x}}', {})).toBe('Hi ');
  });
  it('handles multiple occurrences', () => {
    expect(renderTemplate('{{a}} {{a}}', { a: '1' })).toBe('1 1');
  });
});

describe('loadPrompt', () => {
  it('parses frontmatter and body', async () => {
    const result = await loadPrompt('test-prompt', FIXTURES_DIR);
    expect(result.frontmatter.name).toBe('testPrompt');
    expect(result.frontmatter.maxScore).toBe(10);
    expect(result.body).toContain('Hello {{name}}');
  });

  it('renders body with vars', async () => {
    const { render } = await loadPrompt('test-prompt', FIXTURES_DIR);
    expect(render({ name: 'Alice', score: '7' })).toBe('Hello Alice, your score is 7.');
  });
});
