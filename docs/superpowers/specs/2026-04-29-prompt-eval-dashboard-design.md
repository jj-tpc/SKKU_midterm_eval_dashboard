# SKKU 영상학과 프롬프트 중간고사 평가 대시보드 — 기능 기획서

- **작성일**: 2026-04-29
- **상태**: Draft (사용자 검토 대기)
- **범위**: 기능/아키텍처 정의. UI/시각 디자인은 별도 디자인 시스템에서 진행.

---

## 1. 개요

성균관대 영상학과 프롬프트 중간고사를 **라이브 발표 현장**에서 평가하는 단일 페이지 대시보드. 학생이 발표를 마치면 TA가 그 자리에서 제출물을 입력하고, 챗봇이 학생에게 추가 질문을 던지고, AI가 5개 루브릭 항목을 병렬 채점한 뒤 노래방 스타일로 점수를 공개한다. Vercel에 배포한다.

### 사용자
- **TA (주 사용자)** — 노트북에서 대시보드 조작, 학생 답변 받아 입력
- **학생 (피평가자)** — 발표 후 챗봇 질문에 답변, 점수 공개를 같이 봄
- **수강생 전체 (관객)** — 점수 공개 시퀀스를 같이 관전

### 핵심 가치
- **긴장감** — 노래방 스타일 합계 공개로 발표 현장을 이벤트화
- **공정성** — 5개 루브릭 항목을 동일한 LLM이 동일 기준으로 채점
- **재현성** — 같은 학생을 다시 평가하면 캐시된 점수가 그대로 재공개

---

## 2. 루브릭 (총 100점)

이미지 기준 그대로:

| 배점 | 평가 항목 | 세부 평가 내용 |
|---|---|---|
| 30점 | 프롬프트 설계 품질 | 구조화 수준 (역할/맥락/제약조건), Few-shot/CoT 등 기법 적용, 영상학과 도메인 용어/맥락 반영 |
| 20점 | 출력 결과 품질 | 프로젝트 목적 부합도, 일관성/완성도/실용성, 다양한 입력에 대한 안정성 |
| 20점 | 반복 개선 과정 | 프롬프트 버전별 변경 이력 문서화 (최소 3회), 수정 사유 분석, Before/After 개선 근거 |
| 15점 | 발표 및 시연 | 라이브 시연으로 프롬프트 실행 과정 시연, 설계 의도/페인포인트 설명, 질의응답 대응력 |
| 15점 | 창의성 및 전공 연결 | 영상학과 전공 지식 활용, 독창적 접근, 실무 활용 가능성 |

---

## 3. 핵심 사용자 흐름

상태 머신 (TA 화면 기준):

```
[idle]
  → "다음 학생" 버튼 클릭
[입력]
  → 학생 이름, 프롬프트 v1/v2/v3, 결과 v1/v2/v3 폼
  → "평가 시작" 클릭
[캐시 체크]
  → KV에서 eval:{normalizedStudentName} 조회
  ├─ hit  → [공개]로 즉시 이동 (Q&A 건너뜀)
  └─ miss → 다음 단계
[챗봇 Q&A]
  → 챗봇이 통통 튀며 3개 질문 순차 출제
     - Q1: 공통 풀(10개)에서 랜덤
     - Q2, Q3: 제출물 기반 동적 생성 (LLM 1회 호출로 둘 다)
  → 각 질문마다 TA가 학생 답변 텍스트로 입력
[채점 중]
  → 5개 tool call 병렬 실행
  → 결과 도착 순서대로 SSE로 클라이언트에 푸시
[공개]
  → 5개 하위 점수 도착 순으로 카드 노출 (캐시 hit 시 ~500ms 간격 강제)
  → 마지막에 합계가 최상단에 드라마틱하게
[저장]
  → KV에 EvaluationResult 통째로 저장 (전체 성공 시에만)
[완료]
  → "다음 학생" 버튼으로 [idle] 복귀
```

### 디자인 원칙
- **프롬프트와 결과물 인터페이스 분리** — 입력 폼/결과 화면 모두 별도 카드/패널로 구분
- **챗봇은 진행 액터** — 단순 데코가 아니라 Q&A 단계 전체를 챗봇이 진행
- **노래방 긴장감** = 스트리밍 + 합계 마지막 공개

---

## 4. 데이터 모델

### Submission (제출물)
```ts
type Submission = {
  studentName: string                    // 캐시 키
  versions: PromptVersion[]              // 1~3개 (v1 필수, v2/v3 선택)
}

type PromptVersion = {
  label: 'v1' | 'v2' | 'v3'
  prompt: string
  result: string
  changeNote?: string                    // v2/v3 변경 사유 (옵션)
}
```

### ChatbotQA
```ts
type ChatbotQA = {
  questions: Array<{
    source: 'common' | 'dynamic'
    question: string
    answer: string                        // TA가 받아 친 학생 답변
  }>  // 항상 길이 3 (공통 1 + 동적 2)
}
```

### EvaluationResult (캐시 저장 단위)
```ts
type EvaluationResult = {
  studentName: string
  submission: Submission
  chatbotQA: ChatbotQA
  scores: {
    promptDesign:    { score: number; max: 30; reasoning: string }
    outputQuality:   { score: number; max: 20; reasoning: string }
    iteration:       { score: number; max: 20; reasoning: string }
    presentation:    { score: number; max: 15; reasoning: string }
    creativity:      { score: number; max: 15; reasoning: string }
  }
  totalScore: number                     // 0~100
  evaluatedAt: string                    // ISO timestamp
  modelUsed: string                      // 'gpt-5.4-mini' 등
}
```

### 저장 위치
```
Vercel KV (Upstash Redis):
  eval:{normalizedStudentName}  → EvaluationResult JSON

브라우저 localStorage:
  openai-api-key                → string (BYOK)

코드(빌드 시 정적):
  prompts/common-questions.json → string[] (10개)
  prompts/*.md                   → 5개 평가 + 1개 동적 질문 생성 프롬프트
```

---

## 5. AI 채점 아키텍처 (5개 독립 병렬 호출)

각 툴은 독립적인 OpenAI Chat Completions 호출. Vercel AI SDK의 `generateObject` 사용 (Zod 스키마 검증). `Promise.allSettled` 로 병렬 발사.

### Tool 1. `evaluatePromptDesign` (30점)
- **입력**: 모든 버전의 `prompt`
- **평가 포인트**: 구조화(역할/맥락/제약), Few-shot/CoT, 영상학과 도메인 용어
- **출력**: `{ score: 0~30, reasoning: string, breakdown: { structure, technique, domainFit } }`

### Tool 2. `evaluateOutputQuality` (20점)
- **입력**: 모든 버전의 `result`
- **평가 포인트**: 목적 부합도, 일관성/완성도/실용성, 안정성
- **출력**: `{ score: 0~20, reasoning: string }`

### Tool 3. `evaluateIteration` (20점) — 별도 LLM 노드
- **입력**: 전체 `versions` 배열 + `changeNote`
- **평가 포인트**: 버전 이력 충실도(3회 이상 시 만점 후보), 수정 사유 명료성, 개선 근거
- **특이사항**: v1만 있으면 자동 감점 + reasoning에 명시
- **출력**: `{ score: 0~20, reasoning: string, versionAnalysis: Array<{from, to, improvement}> }`

### Tool 4. `evaluatePresentation` (15점)
- **입력**: `chatbotQA.questions` 전체 (질문 3 + 답변 3)
- **평가 포인트**: 설계 의도 설명, 페인포인트 인식, 질의응답 대응력
- **출력**: `{ score: 0~15, reasoning: string }`

### Tool 5. `evaluateCreativity` (15점)
- **입력**: 모든 버전의 `prompt` + `result`
- **평가 포인트**: 영상학과 전공 지식 활용, 독창적 접근, 실무 활용 가능성
- **출력**: `{ score: 0~15, reasoning: string }`

### 동적 질문 생성 (별도 호출)
- `generateDynamicQuestions(submission)` — 단일 LLM 호출로 Q2/Q3 생성
- 챗봇 Q&A 단계 진입 시 1회 실행

### 모델
- **사용자 지정** — BYOK 방식, 모달에서 OpenAI API Key 입력
- **기본 모델 지정**: `gpt-5.4-mini` (사용자 명시. 실제 OpenAI 모델 카탈로그와의 매핑은 구현 시점에 확인.)

---

## 6. 프롬프트 리소스 분리

### 디렉토리 구조
```
prompts/
├─ evaluate-prompt-design.md          # Tool 1
├─ evaluate-output-quality.md         # Tool 2
├─ evaluate-iteration.md              # Tool 3
├─ evaluate-presentation.md           # Tool 4
├─ evaluate-creativity.md             # Tool 5
├─ generate-dynamic-questions.md      # 챗봇 동적 질문 생성
└─ common-questions.json              # 공통 질문 10개 풀
```

### 프롬프트 파일 포맷 (`.md`)
프론트매터 + 본문:
```markdown
---
name: evaluatePromptDesign
maxScore: 30
schema:
  - score: number (0-30)
  - reasoning: string
  - breakdown: { structure, technique, domainFit }
---

당신은 영상학과 학생의 프롬프트 설계 품질을 평가하는 전문가입니다.

## 평가 기준 (30점)
- 프롬프트 구조화 수준 (역할/맥락/제약조건 명시)
- Few-shot, Chain-of-Thought 등 기법 적용
- 영상학과 도메인에 맞는 전문 용어/맥락 반영

## 입력
프롬프트 버전들:
{{prompts}}

## 출력
다음 JSON 스키마로 응답하세요:
{ "score": ..., "reasoning": "...", "breakdown": {...} }
```

### 로딩
- 서버 사이드(API 라우트)에서 `fs.readFile` 또는 정적 `import` 로 읽음
- 단순 템플릿 엔진: `{{변수}}` 치환
- 편집 → git push → Vercel 자동 재배포 → 반영 (GitOps)

---

## 7. 캐싱 전략

### 저장소
**Vercel KV (Upstash Redis)**

### 키 구조
```
eval:{normalizedStudentName}
```

### 이름 정규화
```ts
function normalizeStudentName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}
```
- 동명이인은 마지막 평가가 덮어씌움 (의도된 동작)
- 강제 재평가는 "캐시 무시" 토글로 처리

### 조회 흐름
1. TA가 "평가 시작" 클릭
2. `POST /api/evaluate`
3. 서버:
   - `forceRefresh` 면 캐시 skip
   - 아니면 KV GET
     - **hit** → SSE로 캐시된 결과를 일부러 ~500ms 간격으로 5개 순차 발사 후 `complete`
     - **miss** → 5개 tool call 병렬 → 결과 도착 순 SSE 발사 → 모두 끝나면 KV SET + `complete`

### TTL
- **무기한** (학기 자산 보존)
- 수동 삭제는 별도 안 만듦 (필요 시 KV CLI)

### 캐시 hit 시 챗봇 Q&A
- **건너뜀** — 이미 평가된 학생이므로 재실행 불필요
- 화면 표시: "이미 평가됨, 캐시된 점수 재공개"

### 부분 실패 시 캐싱
- `Promise.allSettled` 결과 중 1개라도 rejected → **캐시 저장 안 함**
- 5개 모두 fulfilled 일 때만 저장

---

## 8. API 라우트 구조

### Next.js App Router 트리
```
app/
├─ page.tsx                          # 메인 대시보드
└─ api/
   ├─ evaluate/route.ts              # POST: SSE 스트림 채점
   ├─ generate-questions/route.ts    # POST: 챗봇 Q2/Q3 생성
   └─ cache/route.ts                 # GET: 캐시 조회 (옵션)
```

### `POST /api/evaluate`
**요청**:
```ts
Headers: { 'X-OpenAI-Key': string }
Body: {
  studentName: string
  submission: Submission
  chatbotQA: ChatbotQA
  forceRefresh?: boolean
}
```

**응답**: `Content-Type: text/event-stream` (SSE)

**이벤트**:
```
event: cache-status
data: { hit: boolean }

event: score
data: {
  category: 'promptDesign' | 'outputQuality' | 'iteration' | 'presentation' | 'creativity'
  score: number
  max: number
  reasoning: string
  status: 'success' | 'error'
}

event: complete
data: { totalScore: number, evaluatedAt: string }

event: error
data: { category?: string, message: string }
```

### `POST /api/generate-questions`
**요청**: `{ apiKey, submission }` (apiKey는 헤더 권장)
**응답**: `{ questions: [string, string] }` (단일 LLM 호출, JSON)

### API Key 처리
- 모든 요청에 `X-OpenAI-Key` 헤더로 전달
- 서버는 받자마자 OpenAI 호출에만 사용. **메모리 외 어디에도 저장하지 않음**
- 키 누락/빈값 → 401, 클라이언트가 설정 모달 자동 오픈

### Vercel AI SDK
- `generateObject` 로 각 툴 응답 JSON 스키마 검증 자동화
- Zod 스키마로 점수 범위 등 보장

---

## 9. 클라이언트 상태 & UI 컴포넌트 (기능 수준)

> UI 디자인 자체는 별도 디자인 시스템 단계에서 진행. 여기서는 컴포넌트 단위와 책임만 정의.

### 화면 영역
| 영역 | 책임 |
|---|---|
| 헤더 | 로고/타이틀, 설정 버튼(API Key 모달), 캐시 무시 토글 |
| 입력 폼 | 학생 이름, v1~v3 프롬프트/결과 입력, "평가 시작" |
| 챗봇 패널 | 통통 튀는 챗봇 + 질문 표시 + 학생 답변 입력 (TA가 타이핑) |
| 점수 패널 | 합계(상단 큼지막), 5개 하위 점수 카드 (도착 순 노출) |

### 핵심 컴포넌트
- `<SubmissionForm>` — 학생 이름 + v1/v2/v3 입력
- `<ChatbotPanel>` — Q&A 시퀀스 진행
- `<ScoreReveal>` — SSE 이벤트 받아 카드 노출 + 합계 애니메이션
- `<SettingsModal>` — API Key 입력
- `<Chatbot>` — 캐릭터 컴포넌트 (디자인 시스템에서 구현)

### 상태 관리
- 단일 페이지 SPA, 단순한 상태 → React `useReducer` + Context로 충분
- 머신 상태: `idle | input | qa | grading | reveal | done`

---

## 10. 에러 처리 & 엣지 케이스

### API Key
| 상황 | 동작 |
|---|---|
| 미입력 | 첫 평가 시도 시 모달 자동 오픈 + 토스트 |
| 형식 오류 | 모달에서 `sk-` 패턴 느슨하게 검증 |
| 인증 실패 (401) | 토스트 + 모달 재오픈 |
| 잔액 부족 (429) | 토스트 + 재시도 버튼 |

### 입력 검증
| 상황 | 동작 |
|---|---|
| 학생 이름 공란 | "평가 시작" 비활성화 |
| v1 prompt/result 공란 | 비활성화 + 안내 |
| v2/v3 한쪽만 입력 | 인라인 에러: "prompt와 result는 짝으로 입력하세요" |
| 챗봇 답변 미입력 | 다음 질문 버튼 비활성화 |

### 채점 중
| 상황 | 동작 |
|---|---|
| 5개 툴 중 일부 실패 | 해당 카테고리 "재시도" 카드. 나머지 점수는 정상 공개. 합계는 부분점수로 잠정 표시. **캐시 저장 안 함**. |
| 동적 질문 생성 실패 | 공통 풀에서 추가 2개 폴백 (총 3개 모두 공통) |
| KV 장애 | fail-open: 캐시 무시하고 채점 강행. 저장만 실패. |
| OpenAI 응답 스키마 불일치 | 1회 자동 재시도. 재시도도 실패하면 에러 처리. |
| SSE 끊김 | 자동 재연결 안 함. "평가 중단됨 — 처음부터 다시" 안내. |

### 노래방 연출
- 5개 툴 중 1개가 너무 일찍 끝나면 클라이언트 측에서 최소 ~1.5초 간격 보장
- 캐시 hit 시 일부러 ~500ms 텀

### 보안 / 프라이버시
- API Key는 서버 로그에 절대 남기지 않음 (Vercel logs 마스킹 확인)
- KV 데이터 (학생 이름/프롬프트/점수)는 민감 정보는 아니지만 **공개 URL** 이므로 학생 데이터 조회 API는 구현하지 않음. 라이브 시연 때만 한 명씩 노출.
- 인증 없음. 누구나 URL 접속 가능 (API Key 없으면 채점은 못 함).

### 브라우저 호환
- SSE = EventSource API. Chrome/Safari/Firefox 최신 OK.
- 모바일은 타깃 아님 (TA 노트북 기준).

---

## 11. 결정사항 요약 표

| 항목 | 결정 |
|---|---|
| 배포 | Vercel |
| 프레임워크 | Next.js (App Router) |
| 제출물 형식 | 텍스트만, v1 필수 + v2/v3 선택 + 학생 이름 |
| 사용 시나리오 | 라이브 발표 100% (TA가 그 자리에서 입력) |
| 채점 아키텍처 | 5개 독립 병렬 호출 (`Promise.allSettled`) |
| AI SDK | Vercel AI SDK (`generateObject`) |
| AI 모델 | 사용자 지정 (`gpt-5.4-mini`), BYOK |
| API Key 저장 | 브라우저 localStorage |
| API Key 전달 | `X-OpenAI-Key` 헤더 |
| 데이터 캐시 | Vercel KV |
| 캐시 키 | 학생 이름 (정규화) |
| 캐시 TTL | 무기한 |
| 챗봇 질문 | 공통 1개 (10개 풀 랜덤) + 동적 2개 (LLM 1회 호출) |
| 챗봇 답변 | TA가 텍스트로 받아 입력 |
| 접근 제어 | 공개 URL |
| 점수 공개 | SSE 스트리밍, 도착 순 + 합계 마지막 |
| 프롬프트 리소스 | `prompts/*.md` + `common-questions.json` (편집 → 재배포) |

---

## 12. 비범위 (Out of Scope)

- UI 시각 디자인 (색상, 타이포, 챗봇 캐릭터 외형, 애니메이션 디테일) — 디자인 시스템에서 별도 진행
- 학생 평가 이력 조회 페이지/CRUD UI
- 음성 인식 답변 입력
- 모바일 레이아웃
- 다국어 지원
- 인증/권한 관리
- 평가 결과 PDF/엑셀 export
- 비용/사용량 모니터링 대시보드

---

## 13. 다음 단계

이 기획서가 승인되면:
1. 디자인 시스템 단계에서 시각 디자인 (챗봇 외형, 노래방 공개 애니메이션, 색상/타이포 등)
2. 위 시각 디자인 확정 후 → 구현 플랜 (`writing-plans`) → 실제 코드 구현
