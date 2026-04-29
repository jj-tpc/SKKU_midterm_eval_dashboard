import { readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export type LoadedPrompt = {
  frontmatter: Record<string, unknown>;
  body: string;
  render: (vars: Record<string, string>) => string;
};

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

const DEFAULT_PROMPTS_DIR = path.join(process.cwd(), 'prompts');

export async function loadPrompt(
  name: string,
  baseDir: string = DEFAULT_PROMPTS_DIR
): Promise<LoadedPrompt> {
  const filePath = path.join(baseDir, `${name}.md`);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = matter(raw);
  const body = parsed.content.trim();
  return {
    frontmatter: parsed.data,
    body,
    render: (vars) => renderTemplate(body, vars),
  };
}
