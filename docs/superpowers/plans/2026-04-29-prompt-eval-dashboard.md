# 프롬프트 평가 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SKKU 영상학과 프롬프트 중간고사를 라이브로 평가하는 단일 페이지 Next.js 대시보드를 만들고 Vercel에 배포한다. 노래방 스타일 점수 공개 + 통통 튀는 챗봇 + AI 5개 툴 병렬 채점.

**Architecture:** Next.js 15 App Router · BYOK OpenAI (Vercel AI SDK `generateObject`) · 5개 평가 함수를 `Promise.allSettled`로 병렬 실행 · Server-Sent Events 로 도착 순 점수 푸시 · Vercel KV 에 학생 이름 키로 결과 캐시 · 평가 프롬프트는 `prompts/*.md` 로 코드 외부 분리.

**Tech Stack:** Next.js 15 (App Router, TypeScript, Tailwind CSS) · React 19 · Vercel AI SDK (`ai`, `@ai-sdk/openai`) · `@vercel/kv` · `zod` · `gray-matter` (프론트매터 파싱) · Vitest (테스트) · `@testing-library/react`.

> **참고**: 사용자 지정 모델 `gpt-5.4-mini` 는 그대로 OpenAI SDK에 전달한다. OpenAI 카탈로그에 해당 모델이 없을 경우 SDK가 에러를 반환할 것이며, 그때 `OPENAI_MODEL` 환경변수 / `DEFAULT_MODEL` 상수로 손쉽게 교체 가능하도록 한다.

> **디자인 시스템 핸드오프**: 이 플랜은 **기능적으로 동작하는** 최소 스타일링까지만 만든다. 색/타이포/캐릭터/모션 등 시각 디자인은 별도 디자인 시스템 단계에서 채운다. 컴포넌트마다 `data-component` 어트리뷰트를 부여해서 디자인 단계가 셀렉터로 잡기 쉽게 한다.

---

## 참고 문서
- 기능 기획서: [`docs/superpowers/specs/2026-04-29-prompt-eval-dashboard-design.md`](../specs/2026-04-29-prompt-eval-dashboard-design.md)
- UI 핸드오프: [`docs/design/2026-04-29-ui-handoff.md`](../../design/2026-04-29-ui-handoff.md)

---

## File Structure

```
prompts/                                           # 코드 외부 프롬프트 리소스
├─ evaluate-prompt-design.md                       # Tool 1 평가 프롬프트 (30점)
├─ evaluate-output-quality.md                      # Tool 2 (20점)
├─ evaluate-iteration.md                           # Tool 3 (20점)
├─ evaluate-presentation.md                        # Tool 4 (15점)
├─ evaluate-creativity.md                          # Tool 5 (15점)
├─ generate-dynamic-questions.md                   # 챗봇 동적 질문 2개 생성
└─ common-questions.json                           # 공통 질문 풀 (10개)

src/
├─ types.ts                                        # 도메인 타입 (Submission, EvaluationResult 등)
├─ lib/
│  ├─ prompt-loader.ts                             # .md 파싱 + {{var}} 치환
│  ├─ normalize-student-name.ts                    # 캐시 키 정규화
│  ├─ kv-cache.ts                                  # Vercel KV get/set wrapper
│  ├─ schemas.ts                                   # Zod 스키마 (LLM 응답 검증)
│  ├─ run-evaluator.ts                             # 평가 함수 공통 헬퍼
│  └─ evaluators/
│     ├─ evaluate-prompt-design.ts
│     ├─ evaluate-output-quality.ts
│     ├─ evaluate-iteration.ts
│     ├─ evaluate-presentation.ts
│     ├─ evaluate-creativity.ts
│     └─ generate-dynamic-questions.ts
├─ app/
│  ├─ layout.tsx                                   # 루트 레이아웃
│  ├─ page.tsx                                     # 메인 대시보드
│  ├─ globals.css                                  # Tailwind base
│  └─ api/
│     ├─ evaluate/route.ts                         # POST: SSE 채점 스트림
│     └─ generate-questions/route.ts               # POST: 동적 질문 생성
├─ components/
│  ├─ submission-form.tsx                          # 학생 이름 + v1/v2/v3 입력
│  ├─ chatbot-panel.tsx                            # 챗봇 Q&A 시퀀스
│  ├─ chatbot.tsx                                  # 챗봇 캐릭터 (디자인 단계에서 본격 구현)
│  ├─ score-reveal.tsx                             # 5개 점수 + 합계 공개
│  ├─ score-card.tsx                               # 단일 항목 점수 카드
│  ├─ total-score.tsx                              # 합계 카운트업
│  ├─ settings-modal.tsx                           # API Key 입력
│  └─ header.tsx                                   # 헤더 + 캐시 무시 토글 + 설정 버튼
├─ hooks/
│  ├─ use-eval-stream.ts                           # SSE 클라이언트 hook
│  └─ use-api-key.ts                               # localStorage API Key
└─ store/
   └─ machine.ts                                   # 상태 머신 reducer + Context

tests/                                              # 단위 테스트 (또는 co-located *.test.ts)
└─ ...
```

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `public/`

- [ ] **Step 1: Run create-next-app non-interactively**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

당황스러운 인터랙티브 프롬프트가 떠도 모두 기본값(yes)으로 진행. Turbopack 옵션이 뜨면 yes.

- [ ] **Step 2: Verify it boots**

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속해서 Next.js 기본 화면 확인. 확인 후 `Ctrl+C`.

- [ ] **Step 3: Replace default page.tsx with a stub**

`src/app/page.tsx`:
```tsx
export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">SKKU 프롬프트 평가 대시보드</h1>
      <p className="mt-2 text-sm opacity-70">초기화 완료. 다음 태스크에서 컴포넌트 채워넣음.</p>
    </main>
  );
}
```

`src/app/globals.css` 의 Tailwind 디렉티브는 그대로 둔다.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js 15 App Router project"
```

---

## Task 2: Install Runtime Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install AI SDK + KV + utilities**

```bash
npm install ai @ai-sdk/openai @vercel/kv zod gray-matter
```

- [ ] **Step 2: Install dev dependencies (testing)**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add test scripts to package.json**

`package.json` 의 `scripts` 객체에 추가:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Verify test runner works**

Create `tests/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
describe('sanity', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```

Run: `npm test`
Expected: 1 passed.

`tests/sanity.test.ts` 삭제.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add ai sdk, kv, zod, vitest"
```

---

## Task 3: Define Domain Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
// src/types.ts

export type VersionLabel = 'v1' | 'v2' | 'v3';

export type PromptVersion = {
  label: VersionLabel;
  prompt: string;
  result: string;
  changeNote?: string;
};

export type Submission = {
  studentName: string;
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
  studentName: string;
  submission: Submission;
  chatbotQA: ChatbotQA;
  scores: Record<ScoreCategory, CategoryScore>;
  totalScore: number;
  evaluatedAt: string;
  modelUsed: string;
};

export type SSEEvent =
  | { type: 'cache-status'; data: { hit: boolean } }
  | { type: 'score'; data: { category: ScoreCategory; score: number; max: number; reasoning: string; status: 'success' | 'error' } }
  | { type: 'complete'; data: { totalScore: number; evaluatedAt: string } }
  | { type: 'error'; data: { category?: ScoreCategory; message: string } };
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: define domain types for submission, qa, evaluation, sse"
```

---

## Task 4: Create Prompt Resource Files

**Files:**
- Create: `prompts/evaluate-prompt-design.md`, `prompts/evaluate-output-quality.md`, `prompts/evaluate-iteration.md`, `prompts/evaluate-presentation.md`, `prompts/evaluate-creativity.md`, `prompts/generate-dynamic-questions.md`, `prompts/common-questions.json`

- [ ] **Step 1: Create evaluate-prompt-design.md**

```markdown
---
name: evaluatePromptDesign
maxScore: 30
---

당신은 성균관대 영상학과 학생의 프롬프트 설계 품질을 평가하는 전문가입니다.

## 평가 기준 (총 30점)

1. **프롬프트 구조화 수준** (12점): 역할(Role) / 맥락(Context) / 제약조건(Constraint) 명시 여부
2. **프롬프트 기법 적용** (10점): Few-shot, Chain-of-Thought, Role-playing 등 기법 활용도
3. **도메인 적합성** (8점): 영상학과 도메인 용어와 맥락 반영 여부 (예: 시퀀스, 시놉시스, 콘티, 미장센)

## 입력 — 학생이 작성한 프롬프트 (버전별)

{{prompts}}

## 출력

다음 JSON 스키마로 응답하세요:
- `score`: 0~30 정수
- `reasoning`: 점수 근거 한국어 2~3문장
- `breakdown`: { structure: 0-12, technique: 0-10, domainFit: 0-8 }

엄격하게 평가하되, 우수한 부분은 정확히 인정하세요.
```

- [ ] **Step 2: Create evaluate-output-quality.md**

```markdown
---
name: evaluateOutputQuality
maxScore: 20
---

당신은 영상학과 학생이 LLM에서 얻은 결과물의 품질을 평가하는 전문가입니다.

## 평가 기준 (총 20점)

1. **목적 부합도** (8점): 결과물이 프로젝트(영상 기획/시나리오/콘티 등)의 목적을 달성했는가
2. **완성도/일관성** (7점): 텍스트의 일관성, 완성도, 디테일 수준
3. **실용성/안정성** (5점): 다양한 입력에 대해 안정적으로 좋은 결과를 낼 가능성

## 입력 — 학생이 얻은 결과물 (버전별)

{{results}}

## 출력

다음 JSON 스키마로 응답하세요:
- `score`: 0~20 정수
- `reasoning`: 점수 근거 한국어 2~3문장
```

- [ ] **Step 3: Create evaluate-iteration.md**

```markdown
---
name: evaluateIteration
maxScore: 20
---

당신은 학생의 프롬프트 반복 개선 과정을 평가하는 전문가입니다.

## 평가 기준 (총 20점)

1. **버전 이력 충실도** (8점): 최소 3회 이상 버전 제출 시 만점 후보. v1만 있으면 6점 이하.
2. **수정 사유 명료성** (6점): 각 버전 변경 사유(`changeNote`)가 구체적이고 명료한가
3. **개선 근거** (6점): v1 → v2 → v3 로 갈수록 실제로 개선되었는가 (Before/After 비교)

## 입력

전체 버전 (배열):
{{versions}}

## 출력

다음 JSON 스키마로 응답하세요:
- `score`: 0~20 정수
- `reasoning`: 점수 근거 한국어 2~3문장
- `versionAnalysis`: 배열, 각 항목 `{ from: "v1", to: "v2", improvement: "..." }`. 버전이 1개면 빈 배열.

v1만 제출된 경우 reasoning에 "반복 개선 부재" 명시.
```

- [ ] **Step 4: Create evaluate-presentation.md**

```markdown
---
name: evaluatePresentation
maxScore: 15
---

당신은 학생의 발표 및 시연 능력을 챗봇 Q&A 답변을 통해 평가하는 전문가입니다.

## 평가 기준 (총 15점)

1. **설계 의도 설명** (6점): 자신이 작성한 프롬프트의 의도를 명확히 설명하는가
2. **페인포인트 인식** (5점): 어려웠던 점/한계를 구체적으로 인식하고 있는가
3. **질의응답 대응력** (4점): 질문에 직접적이고 구체적으로 답변하는가

## 입력 — 챗봇 Q&A 3쌍

{{qaList}}

## 출력

다음 JSON 스키마로 응답하세요:
- `score`: 0~15 정수
- `reasoning`: 점수 근거 한국어 2~3문장

답변이 매우 짧거나 회피적이면 감점.
```

- [ ] **Step 5: Create evaluate-creativity.md**

```markdown
---
name: evaluateCreativity
maxScore: 15
---

당신은 학생의 창의성과 영상학과 전공 연결성을 평가하는 전문가입니다.

## 평가 기준 (총 15점)

1. **전공 지식 활용** (6점): 영상학과 전공 지식(연출론, 시나리오 작법, 영상 미학 등)의 활용
2. **독창적 접근** (5점): 흔하지 않은 프롬프트 아이디어, 차별화된 발상
3. **실무 활용 가능성** (4점): 실제 영상 제작 현장에서 쓸 수 있는가

## 입력

프롬프트 + 결과물 전체:
{{submission}}

## 출력

다음 JSON 스키마로 응답하세요:
- `score`: 0~15 정수
- `reasoning`: 점수 근거 한국어 2~3문장
```

- [ ] **Step 6: Create generate-dynamic-questions.md**

```markdown
---
name: generateDynamicQuestions
---

당신은 영상학과 학생의 프롬프트 과제 발표 직후, 그 학생에게 던질 추가 질문을 만드는 챗봇입니다.

## 입력

학생이 제출한 프롬프트와 결과물:
{{submission}}

## 출력

다음 JSON 스키마로 응답:
- `questions`: 정확히 길이 2의 한국어 질문 배열

규칙:
- 학생의 제출물에서 구체적인 부분을 짚어 묻기 (일반론 금지)
- 짧고 명료하게 (한 문장)
- 평가 의도가 드러나지 않도록 자연스럽게
```

- [ ] **Step 7: Create common-questions.json**

```json
[
  "이번 과제에서 가장 도전적이었던 부분이 뭐였나요?",
  "프롬프트를 작성할 때 가장 먼저 고려한 요소는 무엇인가요?",
  "결과물이 의도와 가장 달랐던 부분은 어디인가요?",
  "AI를 활용한 영상 작업의 가능성을 어떻게 보시나요?",
  "이 과제를 통해 새롭게 배운 점이 있다면 무엇인가요?",
  "프롬프트 디자인에서 가장 중요한 원칙은 무엇이라고 생각하나요?",
  "결과물 중 가장 만족스러웠던 부분과 그 이유는 무엇인가요?",
  "다시 한다면 어떤 부분을 가장 먼저 바꾸시겠어요?",
  "AI의 한계를 가장 크게 느낀 순간은 언제였나요?",
  "이 도구를 본인의 졸업 작품에 어떻게 활용할 수 있을까요?"
]
```

- [ ] **Step 8: Commit**

```bash
git add prompts/
git commit -m "feat: add evaluation and question-generation prompt resources"
```

---

## Task 5: Build Prompt Loader (TDD)

**Files:**
- Create: `src/lib/prompt-loader.ts`
- Test: `src/lib/prompt-loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/prompt-loader.test.ts
import { describe, it, expect, vi } from 'vitest';
import { loadPrompt, renderTemplate } from './prompt-loader';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(async (path: string) => {
    if (String(path).endsWith('test-prompt.md')) {
      return `---
name: testPrompt
maxScore: 10
---
Hello {{name}}, your score is {{score}}.`;
    }
    throw new Error('not found');
  }),
}));

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
    const result = await loadPrompt('test-prompt');
    expect(result.frontmatter.name).toBe('testPrompt');
    expect(result.frontmatter.maxScore).toBe(10);
    expect(result.body).toContain('Hello {{name}}');
  });

  it('renders body with vars', async () => {
    const { render } = await loadPrompt('test-prompt');
    expect(render({ name: 'Alice', score: '7' })).toBe('Hello Alice, your score is 7.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/prompt-loader.test.ts
```

Expected: FAIL — `loadPrompt is not a function` (또는 모듈 미존재)

- [ ] **Step 3: Implement prompt-loader.ts**

```ts
// src/lib/prompt-loader.ts
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

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

export async function loadPrompt(name: string): Promise<LoadedPrompt> {
  const filePath = path.join(PROMPTS_DIR, `${name}.md`);
  const raw = await readFile(filePath, 'utf-8');
  const parsed = matter(raw);
  const body = parsed.content.trim();
  return {
    frontmatter: parsed.data,
    body,
    render: (vars) => renderTemplate(body, vars),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/prompt-loader.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prompt-loader.ts src/lib/prompt-loader.test.ts
git commit -m "feat: prompt loader with frontmatter parsing and template rendering"
```

---

## Task 6: Build Student Name Normalizer (TDD)

**Files:**
- Create: `src/lib/normalize-student-name.ts`
- Test: `src/lib/normalize-student-name.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/normalize-student-name.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/normalize-student-name.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/normalize-student-name.ts
export function normalizeStudentName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
```

- [ ] **Step 4: Run test**

```bash
npm test -- src/lib/normalize-student-name.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/normalize-student-name.ts src/lib/normalize-student-name.test.ts
git commit -m "feat: normalize student name for cache keying"
```

---

## Task 7: Build KV Cache Helpers (TDD with mock)

**Files:**
- Create: `src/lib/kv-cache.ts`
- Test: `src/lib/kv-cache.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/kv-cache.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCachedEvaluation, setCachedEvaluation, buildCacheKey } from './kv-cache';
import type { EvaluationResult } from '@/types';

const kvStore = new Map<string, unknown>();

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvStore.set(key, value); return 'OK'; }),
  },
}));

beforeEach(() => kvStore.clear());

const sample: EvaluationResult = {
  studentName: '김철수',
  submission: { studentName: '김철수', versions: [{ label: 'v1', prompt: 'p', result: 'r' }] },
  chatbotQA: { questions: [] },
  scores: {
    promptDesign:  { score: 25, max: 30, reasoning: 'r' },
    outputQuality: { score: 18, max: 20, reasoning: 'r' },
    iteration:     { score: 12, max: 20, reasoning: 'r' },
    presentation:  { score: 13, max: 15, reasoning: 'r' },
    creativity:    { score: 14, max: 15, reasoning: 'r' },
  },
  totalScore: 82,
  evaluatedAt: '2026-04-29T00:00:00Z',
  modelUsed: 'gpt-5.4-mini',
};

describe('buildCacheKey', () => {
  it('prefixes with eval: and normalizes name', () => {
    expect(buildCacheKey('  김철수  ')).toBe('eval:김철수');
  });
});

describe('cache get/set', () => {
  it('returns null on miss', async () => {
    expect(await getCachedEvaluation('nobody')).toBeNull();
  });

  it('roundtrips an EvaluationResult', async () => {
    await setCachedEvaluation(sample);
    const got = await getCachedEvaluation('김철수');
    expect(got).toEqual(sample);
  });

  it('fail-open on KV error returns null', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));
    expect(await getCachedEvaluation('김철수')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/kv-cache.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/kv-cache.ts
import { kv } from '@vercel/kv';
import type { EvaluationResult } from '@/types';
import { normalizeStudentName } from './normalize-student-name';

export function buildCacheKey(studentName: string): string {
  return `eval:${normalizeStudentName(studentName)}`;
}

export async function getCachedEvaluation(studentName: string): Promise<EvaluationResult | null> {
  try {
    const data = await kv.get<EvaluationResult>(buildCacheKey(studentName));
    return data ?? null;
  } catch (err) {
    console.warn('[kv-cache] get failed (fail-open):', err);
    return null;
  }
}

export async function setCachedEvaluation(result: EvaluationResult): Promise<void> {
  try {
    await kv.set(buildCacheKey(result.studentName), result);
  } catch (err) {
    console.warn('[kv-cache] set failed (non-fatal):', err);
  }
}
```

- [ ] **Step 4: Run test**

```bash
npm test -- src/lib/kv-cache.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/kv-cache.ts src/lib/kv-cache.test.ts
git commit -m "feat: vercel KV cache helpers with fail-open semantics"
```

---

## Task 8: Define Zod Schemas for AI Responses

**Files:**
- Create: `src/lib/schemas.ts`

- [ ] **Step 1: Write schemas**

```ts
// src/lib/schemas.ts
import { z } from 'zod';

export const promptDesignResponseSchema = z.object({
  score: z.number().int().min(0).max(30),
  reasoning: z.string().min(1),
  breakdown: z.object({
    structure: z.number().int().min(0).max(12),
    technique: z.number().int().min(0).max(10),
    domainFit: z.number().int().min(0).max(8),
  }),
});

export const outputQualityResponseSchema = z.object({
  score: z.number().int().min(0).max(20),
  reasoning: z.string().min(1),
});

export const iterationResponseSchema = z.object({
  score: z.number().int().min(0).max(20),
  reasoning: z.string().min(1),
  versionAnalysis: z.array(z.object({
    from: z.string(),
    to: z.string(),
    improvement: z.string(),
  })),
});

export const presentationResponseSchema = z.object({
  score: z.number().int().min(0).max(15),
  reasoning: z.string().min(1),
});

export const creativityResponseSchema = z.object({
  score: z.number().int().min(0).max(15),
  reasoning: z.string().min(1),
});

export const dynamicQuestionsResponseSchema = z.object({
  questions: z.array(z.string().min(1)).length(2),
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/schemas.ts
git commit -m "feat: zod schemas for evaluator responses"
```

---

## Task 9: Build runEvaluator Helper

**Files:**
- Create: `src/lib/run-evaluator.ts`

> 5개 평가 함수와 질문 생성 함수에서 공통적으로 쓰는 LLM 호출 보일러플레이트.

- [ ] **Step 1: Implement**

```ts
// src/lib/run-evaluator.ts
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { z } from 'zod';
import { loadPrompt } from './prompt-loader';

export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.4-mini';

export type RunEvaluatorOptions<T> = {
  promptName: string;                          // prompts/<name>.md
  vars: Record<string, string>;
  schema: z.ZodType<T>;
  apiKey: string;
  model?: string;
  maxRetries?: number;
};

export async function runEvaluator<T>({
  promptName,
  vars,
  schema,
  apiKey,
  model = DEFAULT_MODEL,
  maxRetries = 1,
}: RunEvaluatorOptions<T>): Promise<T> {
  const prompt = await loadPrompt(promptName);
  const rendered = prompt.render(vars);

  const openai = createOpenAI({ apiKey });

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { object } = await generateObject({
        model: openai(model),
        schema,
        prompt: rendered,
      });
      return object;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
    }
  }
  throw lastError;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/run-evaluator.ts
git commit -m "feat: runEvaluator helper wrapping AI SDK generateObject"
```

---

## Task 10: Build Five Evaluator Functions

**Files:**
- Create: `src/lib/evaluators/evaluate-prompt-design.ts`, `src/lib/evaluators/evaluate-output-quality.ts`, `src/lib/evaluators/evaluate-iteration.ts`, `src/lib/evaluators/evaluate-presentation.ts`, `src/lib/evaluators/evaluate-creativity.ts`

각 파일은 `runEvaluator` + 적절한 vars 매핑.

- [ ] **Step 1: evaluate-prompt-design.ts**

```ts
// src/lib/evaluators/evaluate-prompt-design.ts
import { runEvaluator } from '../run-evaluator';
import { promptDesignResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluatePromptDesign(submission: Submission, apiKey: string) {
  const promptsText = submission.versions
    .map((v) => `### ${v.label}\n${v.prompt}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-prompt-design',
    vars: { prompts: promptsText },
    schema: promptDesignResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 2: evaluate-output-quality.ts**

```ts
// src/lib/evaluators/evaluate-output-quality.ts
import { runEvaluator } from '../run-evaluator';
import { outputQualityResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateOutputQuality(submission: Submission, apiKey: string) {
  const resultsText = submission.versions
    .map((v) => `### ${v.label}\n${v.result}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-output-quality',
    vars: { results: resultsText },
    schema: outputQualityResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 3: evaluate-iteration.ts**

```ts
// src/lib/evaluators/evaluate-iteration.ts
import { runEvaluator } from '../run-evaluator';
import { iterationResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateIteration(submission: Submission, apiKey: string) {
  const versionsText = submission.versions
    .map((v) =>
      `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result}` +
      (v.changeNote ? `\n[변경사유]\n${v.changeNote}` : '')
    )
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-iteration',
    vars: { versions: versionsText },
    schema: iterationResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 4: evaluate-presentation.ts**

```ts
// src/lib/evaluators/evaluate-presentation.ts
import { runEvaluator } from '../run-evaluator';
import { presentationResponseSchema } from '../schemas';
import type { ChatbotQA } from '@/types';

export async function evaluatePresentation(qa: ChatbotQA, apiKey: string) {
  const qaText = qa.questions
    .map((q, i) => `Q${i + 1} (${q.source}): ${q.question}\nA: ${q.answer}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-presentation',
    vars: { qaList: qaText },
    schema: presentationResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 5: evaluate-creativity.ts**

```ts
// src/lib/evaluators/evaluate-creativity.ts
import { runEvaluator } from '../run-evaluator';
import { creativityResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function evaluateCreativity(submission: Submission, apiKey: string) {
  const text = submission.versions
    .map((v) => `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'evaluate-creativity',
    vars: { submission: text },
    schema: creativityResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/evaluators/
git commit -m "feat: 5 rubric evaluator functions backed by external prompts"
```

---

## Task 11: Build generateDynamicQuestions

**Files:**
- Create: `src/lib/evaluators/generate-dynamic-questions.ts`

- [ ] **Step 1: Implement**

```ts
// src/lib/evaluators/generate-dynamic-questions.ts
import { runEvaluator } from '../run-evaluator';
import { dynamicQuestionsResponseSchema } from '../schemas';
import type { Submission } from '@/types';

export async function generateDynamicQuestions(submission: Submission, apiKey: string) {
  const text = submission.versions
    .map((v) => `### ${v.label}\n[프롬프트]\n${v.prompt}\n[결과]\n${v.result}`)
    .join('\n\n');
  return runEvaluator({
    promptName: 'generate-dynamic-questions',
    vars: { submission: text },
    schema: dynamicQuestionsResponseSchema,
    apiKey,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/evaluators/generate-dynamic-questions.ts
git commit -m "feat: dynamic question generator for chatbot Q2/Q3"
```

---

## Task 12: Build /api/generate-questions Route

**Files:**
- Create: `src/app/api/generate-questions/route.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/api/generate-questions/route.ts
import { NextResponse } from 'next/server';
import commonQuestions from '../../../../prompts/common-questions.json';
import { generateDynamicQuestions } from '@/lib/evaluators/generate-dynamic-questions';
import type { Submission } from '@/types';

export const runtime = 'nodejs';

function pickRandomCommon(): string {
  const i = Math.floor(Math.random() * commonQuestions.length);
  return commonQuestions[i];
}

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key missing' }, { status: 401 });
  }
  const body = (await req.json()) as { submission: Submission };
  const common = pickRandomCommon();

  let dynamic: string[];
  try {
    const { questions } = await generateDynamicQuestions(body.submission, apiKey);
    dynamic = questions;
  } catch (err) {
    console.warn('dynamic question gen failed, falling back to common pool:', err);
    const used = new Set([common]);
    dynamic = [];
    while (dynamic.length < 2) {
      const q = pickRandomCommon();
      if (!used.has(q)) { used.add(q); dynamic.push(q); }
    }
  }

  return NextResponse.json({
    common,
    dynamic,
    questions: [common, ...dynamic],
  });
}
```

- [ ] **Step 2: Manual sanity check**

```bash
npm run dev
```

다른 터미널에서:
```bash
curl -X POST http://localhost:3000/api/generate-questions \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Key: dummy" \
  -d '{"submission":{"studentName":"테스트","versions":[{"label":"v1","prompt":"p","result":"r"}]}}'
```

API Key가 dummy이므로 동적 질문 생성은 실패하고 폴백으로 공통 풀에서 3개 가져오는지 확인. 응답 JSON에 `questions` 배열 길이 3 확인. 서버 종료.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate-questions/route.ts
git commit -m "feat: /api/generate-questions with common-pool fallback"
```

---

## Task 13: Build /api/evaluate SSE Route

**Files:**
- Create: `src/app/api/evaluate/route.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/api/evaluate/route.ts
import { evaluatePromptDesign } from '@/lib/evaluators/evaluate-prompt-design';
import { evaluateOutputQuality } from '@/lib/evaluators/evaluate-output-quality';
import { evaluateIteration } from '@/lib/evaluators/evaluate-iteration';
import { evaluatePresentation } from '@/lib/evaluators/evaluate-presentation';
import { evaluateCreativity } from '@/lib/evaluators/evaluate-creativity';
import { getCachedEvaluation, setCachedEvaluation } from '@/lib/kv-cache';
import { DEFAULT_MODEL } from '@/lib/run-evaluator';
import { SCORE_MAX } from '@/types';
import type { ChatbotQA, EvaluationResult, ScoreCategory, Submission } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Body = {
  studentName: string;
  submission: Submission;
  chatbotQA: ChatbotQA;
  forceRefresh?: boolean;
};

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(req: Request) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key missing' }), { status: 401 });
  }
  const body = (await req.json()) as Body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      try {
        // 1. Cache check
        const cached = body.forceRefresh ? null : await getCachedEvaluation(body.studentName);
        send('cache-status', { hit: !!cached });

        if (cached) {
          // Replay cached scores with deliberate delays
          const order: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];
          for (const cat of order) {
            const s = cached.scores[cat];
            send('score', { category: cat, score: s.score, max: s.max, reasoning: s.reasoning, status: 'success' });
            await sleep(500);
          }
          send('complete', { totalScore: cached.totalScore, evaluatedAt: cached.evaluatedAt });
          controller.close();
          return;
        }

        // 2. Run 5 evaluators in parallel; emit each as it resolves
        const tasks: Array<{ category: ScoreCategory; promise: Promise<{ score: number; reasoning: string }> }> = [
          { category: 'promptDesign',  promise: evaluatePromptDesign(body.submission, apiKey) },
          { category: 'outputQuality', promise: evaluateOutputQuality(body.submission, apiKey) },
          { category: 'iteration',     promise: evaluateIteration(body.submission, apiKey) },
          { category: 'presentation',  promise: evaluatePresentation(body.chatbotQA, apiKey) },
          { category: 'creativity',    promise: evaluateCreativity(body.submission, apiKey) },
        ];

        const results: Partial<Record<ScoreCategory, { score: number; reasoning: string; ok: boolean }>> = {};
        const wrapped = tasks.map(async ({ category, promise }) => {
          try {
            const r = await promise;
            results[category] = { score: r.score, reasoning: r.reasoning, ok: true };
            send('score', { category, score: r.score, max: SCORE_MAX[category], reasoning: r.reasoning, status: 'success' });
          } catch (err) {
            results[category] = { score: 0, reasoning: err instanceof Error ? err.message : 'Unknown error', ok: false };
            send('score', { category, score: 0, max: SCORE_MAX[category], reasoning: results[category]!.reasoning, status: 'error' });
          }
        });
        await Promise.all(wrapped);

        const allOk = Object.values(results).every((r) => r!.ok);
        const total = (['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'] as ScoreCategory[])
          .reduce((sum, c) => sum + (results[c]?.score ?? 0), 0);
        const evaluatedAt = new Date().toISOString();

        send('complete', { totalScore: total, evaluatedAt });

        if (allOk) {
          const evalResult: EvaluationResult = {
            studentName: body.studentName,
            submission: body.submission,
            chatbotQA: body.chatbotQA,
            scores: {
              promptDesign:  { score: results.promptDesign!.score,  max: SCORE_MAX.promptDesign,  reasoning: results.promptDesign!.reasoning },
              outputQuality: { score: results.outputQuality!.score, max: SCORE_MAX.outputQuality, reasoning: results.outputQuality!.reasoning },
              iteration:     { score: results.iteration!.score,     max: SCORE_MAX.iteration,     reasoning: results.iteration!.reasoning },
              presentation:  { score: results.presentation!.score,  max: SCORE_MAX.presentation,  reasoning: results.presentation!.reasoning },
              creativity:    { score: results.creativity!.score,    max: SCORE_MAX.creativity,    reasoning: results.creativity!.reasoning },
            },
            totalScore: total,
            evaluatedAt,
            modelUsed: DEFAULT_MODEL,
          };
          await setCachedEvaluation(evalResult);
        }

        controller.close();
      } catch (err) {
        send('error', { message: err instanceof Error ? err.message : 'Unknown error' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

- [ ] **Step 2: Manual sanity check**

`.env.local` 생성:
```
KV_REST_API_URL=http://example.invalid
KV_REST_API_TOKEN=dummy
```
(KV는 fail-open 처리되므로 채점 진행은 가능. 캐시는 안 됨.)

```bash
npm run dev
```

`curl` 로 SSE 받아보기:
```bash
curl -N -X POST http://localhost:3000/api/evaluate \
  -H "Content-Type: application/json" \
  -H "X-OpenAI-Key: $OPENAI_API_KEY" \
  -d '{
    "studentName":"테스트",
    "submission":{"studentName":"테스트","versions":[{"label":"v1","prompt":"영상학과 단편 시나리오를 써줘","result":"제목: 사라진 카메라\n..."}]},
    "chatbotQA":{"questions":[
      {"source":"common","question":"가장 어려웠던 점?","answer":"캐릭터 설정"},
      {"source":"dynamic","question":"왜 단편으로 가셨나요?","answer":"러닝타임 제약"},
      {"source":"dynamic","question":"가장 만족스러운 부분?","answer":"엔딩"}
    ]}
  }'
```

SSE 이벤트 5개 + complete 받는지 확인. 일부 실패해도 나머지는 점수 옴.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/evaluate/route.ts
git commit -m "feat: /api/evaluate SSE route streaming 5 parallel evaluations"
```

---

## Task 14: Build State Machine Reducer (TDD)

**Files:**
- Create: `src/store/machine.ts`
- Test: `src/store/machine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/store/machine.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/store/machine.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/store/machine.ts
import type { CategoryScore, ChatbotQA, ChatbotQAItem, ScoreCategory, Submission } from '@/types';

export type Phase = 'idle' | 'input' | 'qa' | 'grading' | 'reveal' | 'done';

export type State = {
  phase: Phase;
  studentName: string;
  submission: Submission | null;
  questions: string[];                          // 길이 3 (공통 1 + 동적 2)
  chatbotQA: ChatbotQA;
  scores: Partial<Record<ScoreCategory, CategoryScore & { status: 'success' | 'error' }>>;
  totalScore: number | null;
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
    case 'ERROR':
      return { ...state, errorMessage: action.payload };
    case 'RESET':
      return { ...initialState, forceRefresh: state.forceRefresh };
  }
}
```

- [ ] **Step 4: Run test**

```bash
npm test -- src/store/machine.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/machine.ts src/store/machine.test.ts
git commit -m "feat: state machine reducer for evaluation flow"
```

---

## Task 15: Build EvalContext Provider

**Files:**
- Create: `src/store/eval-context.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/store/eval-context.tsx
'use client';
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { reducer, initialState, type State, type Action } from './machine';

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function EvalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useEval() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEval must be used inside EvalProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/store/eval-context.tsx
git commit -m "feat: react context wrapping state machine reducer"
```

---

## Task 16: Build useApiKey Hook

**Files:**
- Create: `src/hooks/use-api-key.ts`

- [ ] **Step 1: Implement**

```ts
// src/hooks/use-api-key.ts
'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'openai-api-key';

export function useApiKey() {
  const [key, setKeyState] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = window.localStorage.getItem(STORAGE_KEY) ?? '';
    setKeyState(v);
    setLoaded(true);
  }, []);

  function setKey(v: string) {
    window.localStorage.setItem(STORAGE_KEY, v);
    setKeyState(v);
  }

  function clearKey() {
    window.localStorage.removeItem(STORAGE_KEY);
    setKeyState('');
  }

  return { apiKey: key, setApiKey: setKey, clearApiKey: clearKey, loaded };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-api-key.ts
git commit -m "feat: useApiKey hook with localStorage persistence"
```

---

## Task 17: Build useEvalStream Hook (SSE Client)

**Files:**
- Create: `src/hooks/use-eval-stream.ts`

> 일반 EventSource는 POST + 헤더 전달이 안되므로 `fetch` + ReadableStream 직접 파싱.

- [ ] **Step 1: Implement**

```ts
// src/hooks/use-eval-stream.ts
'use client';
import { useCallback } from 'react';
import { useEval } from '@/store/eval-context';
import type { ChatbotQA, Submission } from '@/types';

type StartArgs = {
  apiKey: string;
  studentName: string;
  submission: Submission;
  chatbotQA: ChatbotQA;
  forceRefresh?: boolean;
};

function parseSSEChunk(text: string): Array<{ event: string; data: string }> {
  const out: Array<{ event: string; data: string }> = [];
  for (const block of text.split('\n\n')) {
    if (!block.trim()) continue;
    let event = 'message';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    out.push({ event, data });
  }
  return out;
}

export function useEvalStream() {
  const { dispatch } = useEval();

  const start = useCallback(async (args: StartArgs) => {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OpenAI-Key': args.apiKey },
      body: JSON.stringify({
        studentName: args.studentName,
        submission: args.submission,
        chatbotQA: args.chatbotQA,
        forceRefresh: args.forceRefresh ?? false,
      }),
    });
    if (!res.ok || !res.body) {
      dispatch({ type: 'ERROR', payload: `HTTP ${res.status}` });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const splitIdx = buffer.lastIndexOf('\n\n');
      if (splitIdx < 0) continue;
      const ready = buffer.slice(0, splitIdx + 2);
      buffer = buffer.slice(splitIdx + 2);

      for (const { event, data } of parseSSEChunk(ready)) {
        if (!data) continue;
        const parsed = JSON.parse(data);
        switch (event) {
          case 'cache-status':
            dispatch({ type: 'CACHE_STATUS', payload: parsed.hit });
            break;
          case 'score':
            dispatch({ type: 'RECEIVE_SCORE', payload: parsed });
            break;
          case 'complete':
            dispatch({ type: 'COMPLETE', payload: { totalScore: parsed.totalScore } });
            break;
          case 'error':
            dispatch({ type: 'ERROR', payload: parsed.message });
            break;
        }
      }
    }
  }, [dispatch]);

  return { start };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-eval-stream.ts
git commit -m "feat: SSE client hook with manual fetch + stream parsing"
```

---

## Task 18: Build SettingsModal Component

**Files:**
- Create: `src/components/settings-modal.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/settings-modal.tsx
'use client';
import { useState, useEffect } from 'react';
import { useApiKey } from '@/hooks/use-api-key';

type Props = { open: boolean; onClose: () => void };

export function SettingsModal({ open, onClose }: Props) {
  const { apiKey, setApiKey, clearApiKey } = useApiKey();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) setDraft(apiKey);
  }, [open, apiKey]);

  if (!open) return null;

  const valid = draft.trim().length > 10;

  return (
    <div
      data-component="settings-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        data-component="settings-modal"
        className="bg-white text-black p-6 rounded shadow-lg w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">설정</h2>
        <p className="text-sm mt-2 opacity-70">OpenAI API Key를 입력하세요. 브라우저에만 저장됩니다.</p>
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="sk-..."
          className="mt-3 w-full border rounded px-3 py-2 font-mono text-sm"
        />
        {!valid && draft.length > 0 && (
          <p className="text-xs text-red-600 mt-1">키가 너무 짧습니다.</p>
        )}
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            className="text-sm text-red-600 underline"
            onClick={() => { clearApiKey(); setDraft(''); }}
          >
            저장된 키 삭제
          </button>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 border rounded" onClick={onClose}>취소</button>
            <button
              type="button"
              className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
              disabled={!valid}
              onClick={() => { setApiKey(draft.trim()); onClose(); }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settings-modal.tsx
git commit -m "feat: SettingsModal for BYOK API key entry"
```

---

## Task 19: Build Header Component

**Files:**
- Create: `src/components/header.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/header.tsx
'use client';
import { useEval } from '@/store/eval-context';

type Props = { onOpenSettings: () => void };

export function Header({ onOpenSettings }: Props) {
  const { state, dispatch } = useEval();
  return (
    <header data-component="header" className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">SKKU 프롬프트 평가 대시보드</h1>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.forceRefresh}
            onChange={(e) => dispatch({ type: 'SET_FORCE_REFRESH', payload: e.target.checked })}
          />
          캐시 무시하고 재평가
        </label>
        <button
          type="button"
          onClick={onOpenSettings}
          className="px-3 py-1 border rounded text-sm"
        >
          설정
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/header.tsx
git commit -m "feat: Header with cache toggle and settings button"
```

---

## Task 20: Build SubmissionForm Component

**Files:**
- Create: `src/components/submission-form.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/submission-form.tsx
'use client';
import { useState } from 'react';
import { useEval } from '@/store/eval-context';
import type { PromptVersion, Submission, VersionLabel } from '@/types';

type DraftVersion = { prompt: string; result: string; changeNote: string };
const emptyDraft = (): DraftVersion => ({ prompt: '', result: '', changeNote: '' });

export function SubmissionForm() {
  const { dispatch } = useEval();
  const [name, setName] = useState('');
  const [versions, setVersions] = useState<Record<VersionLabel, DraftVersion>>({
    v1: emptyDraft(),
    v2: emptyDraft(),
    v3: emptyDraft(),
  });

  function update(label: VersionLabel, field: keyof DraftVersion, value: string) {
    setVersions((v) => ({ ...v, [label]: { ...v[label], [field]: value } }));
  }

  const v1Filled = versions.v1.prompt.trim() && versions.v1.result.trim();
  const v2Partial = (versions.v2.prompt.trim() === '') !== (versions.v2.result.trim() === '');
  const v3Partial = (versions.v3.prompt.trim() === '') !== (versions.v3.result.trim() === '');
  const canSubmit = name.trim() && v1Filled && !v2Partial && !v3Partial;

  function submit() {
    const collected: PromptVersion[] = (['v1', 'v2', 'v3'] as VersionLabel[])
      .filter((l) => versions[l].prompt.trim() && versions[l].result.trim())
      .map((l) => ({
        label: l,
        prompt: versions[l].prompt.trim(),
        result: versions[l].result.trim(),
        changeNote: versions[l].changeNote.trim() || undefined,
      }));
    const sub: Submission = { studentName: name.trim(), versions: collected };
    dispatch({ type: 'SUBMIT_FORM', payload: sub });
  }

  return (
    <section data-component="submission-form" className="p-4 space-y-6">
      <div>
        <label className="block text-sm font-medium">학생 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-64 border rounded px-3 py-2"
          placeholder="예: 김철수"
        />
      </div>

      {(['v1', 'v2', 'v3'] as VersionLabel[]).map((label) => {
        const required = label === 'v1';
        return (
          <div key={label} data-component="prompt-version-card" className="border rounded p-4">
            <h3 className="font-bold">
              {label.toUpperCase()} {required ? <span className="text-red-600">*</span> : <span className="text-xs opacity-50">(선택)</span>}
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div data-component="prompt-input">
                <label className="block text-xs font-medium">프롬프트</label>
                <textarea
                  value={versions[label].prompt}
                  onChange={(e) => update(label, 'prompt', e.target.value)}
                  className="mt-1 w-full border rounded p-2 h-40 text-sm"
                />
              </div>
              <div data-component="result-input">
                <label className="block text-xs font-medium">결과물</label>
                <textarea
                  value={versions[label].result}
                  onChange={(e) => update(label, 'result', e.target.value)}
                  className="mt-1 w-full border rounded p-2 h-40 text-sm"
                />
              </div>
            </div>
            {!required && (
              <div className="mt-3">
                <label className="block text-xs font-medium">변경 사유 (옵션)</label>
                <input
                  type="text"
                  value={versions[label].changeNote}
                  onChange={(e) => update(label, 'changeNote', e.target.value)}
                  className="mt-1 w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}

      {(v2Partial || v3Partial) && (
        <p className="text-sm text-red-600">
          v2/v3는 프롬프트와 결과물을 짝으로 입력하세요.
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        평가 시작
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/submission-form.tsx
git commit -m "feat: SubmissionForm with v1 required, v2/v3 paired validation"
```

---

## Task 21: Build Chatbot Placeholder + ChatbotPanel

**Files:**
- Create: `src/components/chatbot.tsx`
- Create: `src/components/chatbot-panel.tsx`

> 챗봇 캐릭터 자체는 디자인 단계가 채움. 여기서는 텍스트 라벨 + bounce 애니메이션 placeholder.

- [ ] **Step 1: Build chatbot.tsx (placeholder)**

```tsx
// src/components/chatbot.tsx
'use client';
type Pose = 'idle' | 'talking' | 'thinking' | 'cheering' | 'jumping';
type Props = { pose?: Pose; size?: 'sm' | 'md' | 'lg' };

export function Chatbot({ pose = 'idle', size = 'md' }: Props) {
  const sz = size === 'sm' ? 'w-16 h-16' : size === 'lg' ? 'w-40 h-40' : 'w-24 h-24';
  const bounce = pose === 'jumping' || pose === 'cheering' ? 'animate-bounce' : '';
  const pulse = pose === 'thinking' ? 'animate-pulse' : '';
  return (
    <div
      data-component="chatbot"
      data-pose={pose}
      className={`${sz} ${bounce} ${pulse} bg-yellow-300 rounded-full flex items-center justify-center font-bold text-sm`}
    >
      BOT
    </div>
  );
}
```

- [ ] **Step 2: Build chatbot-panel.tsx**

```tsx
// src/components/chatbot-panel.tsx
'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { Chatbot } from './chatbot';
import type { ChatbotQAItem } from '@/types';

export function ChatbotPanel() {
  const { state, dispatch } = useEval();
  const { apiKey } = useApiKey();
  const [idx, setIdx] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch questions when entering qa phase
  useEffect(() => {
    if (state.phase !== 'qa' || state.questions.length > 0) {
      setLoading(false);
      return;
    }
    if (!state.submission) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-OpenAI-Key': apiKey },
          body: JSON.stringify({ submission: state.submission }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!Array.isArray(data.questions) || data.questions.length !== 3) {
          throw new Error('invalid questions response');
        }
        dispatch({ type: 'SET_QUESTIONS', payload: data.questions });
      } catch (err) {
        if (!cancelled) setErrorMsg(err instanceof Error ? err.message : 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state.phase, state.questions.length, state.submission, apiKey, dispatch]);

  if (state.phase !== 'qa') return null;

  if (loading) {
    return (
      <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
        <Chatbot pose="thinking" />
        <p>질문을 준비하는 중…</p>
      </section>
    );
  }
  if (errorMsg) {
    return (
      <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
        <Chatbot pose="thinking" />
        <p className="text-red-600">질문 생성 실패: {errorMsg}</p>
      </section>
    );
  }

  const currentQ = state.questions[idx];
  const isLast = idx === state.questions.length - 1;

  function next() {
    const newAnswers = [...answers, draftAnswer.trim()];
    setAnswers(newAnswers);
    setDraftAnswer('');
    if (!isLast) {
      setIdx(idx + 1);
      return;
    }
    // Build ChatbotQAItem[] with sources: index 0 = common, 1,2 = dynamic
    const items: ChatbotQAItem[] = state.questions.map((q, i) => ({
      source: i === 0 ? 'common' : 'dynamic',
      question: q,
      answer: newAnswers[i],
    }));
    dispatch({ type: 'SUBMIT_QA', payload: items });
  }

  return (
    <section data-component="chatbot-panel" className="p-6 flex flex-col items-center gap-4">
      <Chatbot pose="talking" />
      <p className="text-sm opacity-70">{idx + 1} / {state.questions.length}</p>
      <p data-component="question-bubble" className="text-lg font-semibold text-center max-w-xl">
        {currentQ}
      </p>
      <textarea
        value={draftAnswer}
        onChange={(e) => setDraftAnswer(e.target.value)}
        className="border rounded p-3 w-full max-w-xl h-32 text-sm"
        placeholder="학생 답변을 받아 적으세요"
      />
      <button
        type="button"
        disabled={!draftAnswer.trim()}
        onClick={next}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {isLast ? '채점 시작' : '다음 질문'}
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/chatbot.tsx src/components/chatbot-panel.tsx
git commit -m "feat: Chatbot placeholder + ChatbotPanel Q&A flow"
```

---

## Task 22: Build ScoreCard, TotalScore, ScoreReveal Components

**Files:**
- Create: `src/components/score-card.tsx`
- Create: `src/components/total-score.tsx`
- Create: `src/components/score-reveal.tsx`

- [ ] **Step 1: score-card.tsx**

```tsx
// src/components/score-card.tsx
'use client';
import type { ScoreCategory } from '@/types';

const LABELS: Record<ScoreCategory, string> = {
  promptDesign: '프롬프트 설계 품질',
  outputQuality: '출력 결과 품질',
  iteration: '반복 개선 과정',
  presentation: '발표 및 시연',
  creativity: '창의성 및 전공 연결',
};

type Props = {
  category: ScoreCategory;
  score: number;
  max: number;
  reasoning: string;
  status: 'success' | 'error' | 'pending';
};

export function ScoreCard({ category, score, max, reasoning, status }: Props) {
  return (
    <div
      data-component="score-card"
      data-category={category}
      data-status={status}
      className={`border rounded p-4 ${status === 'pending' ? 'opacity-50 animate-pulse' : ''}`}
    >
      <p className="text-xs opacity-60">{LABELS[category]}</p>
      {status === 'pending' ? (
        <p className="text-3xl font-bold mt-1">…</p>
      ) : (
        <p className="text-3xl font-bold mt-1">
          {score} <span className="text-base opacity-50">/ {max}</span>
        </p>
      )}
      {status !== 'pending' && (
        <p className="text-xs mt-2 opacity-70">{reasoning}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: total-score.tsx**

```tsx
// src/components/total-score.tsx
'use client';
import { useEffect, useState } from 'react';

type Props = { target: number | null };

export function TotalScore({ target }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target == null) { setDisplay(0); return; }
    const duration = 1500;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div data-component="total-score" className="text-center py-6">
      <p className="text-xs opacity-60">최종 점수</p>
      <p className="text-7xl font-black tabular-nums">
        {target == null ? '??' : display}
        <span className="text-2xl opacity-50"> / 100</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: score-reveal.tsx**

```tsx
// src/components/score-reveal.tsx
'use client';
import { useEval } from '@/store/eval-context';
import { ScoreCard } from './score-card';
import { TotalScore } from './total-score';
import { Chatbot } from './chatbot';
import { SCORE_MAX, type ScoreCategory } from '@/types';

const ORDER: ScoreCategory[] = ['promptDesign', 'outputQuality', 'iteration', 'presentation', 'creativity'];

export function ScoreReveal() {
  const { state, dispatch } = useEval();
  if (state.phase !== 'grading' && state.phase !== 'reveal' && state.phase !== 'done') return null;

  const allArrived = ORDER.every((c) => state.scores[c]);
  const showTotal = state.totalScore != null && allArrived;

  return (
    <section data-component="score-reveal" className="p-6">
      <TotalScore target={showTotal ? state.totalScore : null} />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
        {ORDER.map((cat) => {
          const s = state.scores[cat];
          if (!s) return (
            <ScoreCard
              key={cat}
              category={cat}
              score={0}
              max={SCORE_MAX[cat]}
              reasoning=""
              status="pending"
            />
          );
          return (
            <ScoreCard
              key={cat}
              category={cat}
              score={s.score}
              max={s.max}
              reasoning={s.reasoning}
              status={s.status}
            />
          );
        })}
      </div>

      <div className="flex justify-center mt-8">
        <Chatbot pose={showTotal ? 'cheering' : 'thinking'} />
      </div>

      {state.phase === 'done' && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="px-4 py-2 bg-black text-white rounded"
          >
            다음 학생
          </button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/score-card.tsx src/components/total-score.tsx src/components/score-reveal.tsx
git commit -m "feat: ScoreCard, TotalScore countup, and ScoreReveal grid"
```

---

## Task 23: Compose Main Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx` (wrap with EvalProvider)

- [ ] **Step 1: Update layout to wrap provider**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { EvalProvider } from '@/store/eval-context';

export const metadata: Metadata = {
  title: 'SKKU 프롬프트 평가 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <EvalProvider>{children}</EvalProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace page.tsx**

```tsx
// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useEval } from '@/store/eval-context';
import { useApiKey } from '@/hooks/use-api-key';
import { useEvalStream } from '@/hooks/use-eval-stream';
import { Header } from '@/components/header';
import { SettingsModal } from '@/components/settings-modal';
import { SubmissionForm } from '@/components/submission-form';
import { ChatbotPanel } from '@/components/chatbot-panel';
import { ScoreReveal } from '@/components/score-reveal';
import { Chatbot } from '@/components/chatbot';

export default function Page() {
  const { state, dispatch } = useEval();
  const { apiKey, loaded } = useApiKey();
  const { start } = useEvalStream();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto-open settings if no key on first action attempt
  useEffect(() => {
    if (loaded && !apiKey && state.phase === 'input') {
      setSettingsOpen(true);
    }
  }, [loaded, apiKey, state.phase]);

  // Kick off stream when entering grading
  useEffect(() => {
    if (state.phase !== 'grading' || !state.submission) return;
    if (!apiKey) {
      dispatch({ type: 'ERROR', payload: 'API key missing' });
      setSettingsOpen(true);
      return;
    }
    start({
      apiKey,
      studentName: state.submission.studentName,
      submission: state.submission,
      chatbotQA: state.chatbotQA,
      forceRefresh: state.forceRefresh,
    });
  }, [state.phase, state.submission, state.chatbotQA, state.forceRefresh, apiKey, start, dispatch]);

  return (
    <main className="min-h-screen">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      {state.phase === 'idle' && (
        <div className="p-12 flex flex-col items-center gap-6">
          <Chatbot pose="idle" size="lg" />
          <button
            type="button"
            onClick={() => dispatch({ type: 'START_NEW' })}
            className="px-6 py-3 bg-black text-white rounded text-lg"
          >
            다음 학생 평가 시작
          </button>
        </div>
      )}

      {state.phase === 'input' && <SubmissionForm />}
      {state.phase === 'qa' && <ChatbotPanel />}
      {(state.phase === 'grading' || state.phase === 'reveal' || state.phase === 'done') && <ScoreReveal />}

      {state.errorMessage && (
        <div role="alert" className="p-4 bg-red-100 text-red-800 fixed bottom-4 right-4 rounded shadow">
          {state.errorMessage}
        </div>
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 3: Verify build & boot**

```bash
npm run build
npm run dev
```

브라우저에서 http://localhost:3000 — idle 화면 → "다음 학생 평가 시작" → 입력 폼 → 학생 이름 + v1 prompt/result 입력 → "평가 시작" → API Key 모달 (없으면) → 키 입력 → Q&A → 채점 → 점수 공개 까지 끝까지 흘러가는지 확인.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: compose main dashboard page with state-driven view switching"
```

---

## Task 24: Add Vercel KV Setup Documentation

**Files:**
- Create: `README.md` (replace existing)
- Create: `.env.local.example`

- [ ] **Step 1: Write README.md**

```markdown
# SKKU 영상학과 프롬프트 중간고사 평가 대시보드

라이브 발표 현장에서 학생의 프롬프트 과제를 AI로 채점하고 노래방 스타일로 점수를 공개하는 단일 페이지 대시보드.

## 배포

Vercel:

```bash
vercel link
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

Vercel 대시보드에서 Storage > Create > KV (또는 Upstash Redis) 만들고 환경변수 자동 연결.

## 로컬 실행

`.env.local.example` 을 `.env.local` 로 복사하고 KV 토큰 채우기:

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

OpenAI API Key는 앱 내 설정 모달에서 입력 (BYOK, localStorage에만 저장).

## 평가 프롬프트 수정

`prompts/*.md` 편집 → 커밋 → push → Vercel 자동 재배포.

## 핵심 문서

- [기능 기획서](docs/superpowers/specs/2026-04-29-prompt-eval-dashboard-design.md)
- [UI 핸드오프](docs/design/2026-04-29-ui-handoff.md)
- [구현 플랜](docs/superpowers/plans/2026-04-29-prompt-eval-dashboard.md)

## 모델

기본 `gpt-5.4-mini`. 다른 모델로 바꾸려면 `OPENAI_MODEL` 환경변수 설정.
```

- [ ] **Step 2: Write .env.local.example**

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
OPENAI_MODEL=gpt-5.4-mini
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.local.example
git commit -m "docs: add README with Vercel KV and BYOK setup"
```

---

## Task 25: Run Full Test Suite & Lint

**Files:** —

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: 모든 테스트 PASS (loader, normalize, kv-cache, machine).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: 무경고 또는 trivial only.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: 빌드 성공. 타입 에러 없음.

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: lint and type fixes" || echo "nothing to commit"
```

---

## Task 26: Final Manual Smoke Test

**Files:** —

- [ ] **Step 1: Clean run**

```bash
npm run build
npm run start
```

- [ ] **Step 2: 완전 흐름 검증**

브라우저에서 다음 시나리오 전부 통과:
1. idle 화면 → "다음 학생 평가 시작"
2. 입력 폼 → 학생 이름 (예: "김철수") + v1 prompt/result만 채우고 평가 시작
3. API Key 미입력이면 모달 자동 오픈, 키 입력 후 저장
4. Q&A 단계 → 3개 질문 (1 공통 + 2 동적) 등장, 답변 입력
5. 채점 → 5개 카드가 도착 순으로 채워짐
6. 합계가 마지막에 카운트업 등장
7. "다음 학생" → idle 복귀
8. 같은 학생 이름으로 다시 입력 → 캐시 hit, Q&A 건너뜀, 즉시 점수 재공개
9. "캐시 무시하고 재평가" 토글 ON → 같은 학생 재평가하면 Q&A 다시 진행
10. v2/v3 한쪽만 입력 → 인라인 에러 표시, 평가 시작 비활성

- [ ] **Step 3: 에러 시나리오 검증**

11. API Key를 잘못된 값으로 저장 → 평가 시 401 / 에러 토스트
12. 모든 5개 툴 실패 시뮬레이션 (잘못된 키) → 5개 모두 error 카드 + 합계 0 표시되지만 캐시 저장 안 됨

각 시나리오에 대해 노트:
- ✅ 통과
- ❌ 실패 (재현 단계와 함께 기록)

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: smoke test pass" || echo "nothing to commit"
```

---

## 디자인 시스템 단계 핸드오프 메모

이 플랜으로 만든 결과물은 **기능적으로 동작**하지만 **시각 디자인은 placeholder** 다. 디자인 단계에서 다음을 채운다:

1. `src/components/chatbot.tsx` — 실제 캐릭터 디자인 (5개 pose 시안)
2. `src/components/score-card.tsx` — 카드 등장 애니메이션, 색/타이포
3. `src/components/total-score.tsx` — 카운트업 연출 강화 (slot machine 등)
4. `src/components/chatbot-panel.tsx` — 말풍선 디자인, 챗봇 idle 모션
5. 색상 토큰, 다크/라이트, 폰트 시스템
6. 점수 공개 효과 사운드 (선택)

각 컴포넌트에 `data-component`, `data-pose`, `data-category`, `data-status` 어트리뷰트가 부여돼 있어 디자인 시스템이 셀렉터로 잡기 쉽다.
