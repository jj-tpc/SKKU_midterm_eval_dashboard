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

## 스택

Next.js 16 (App Router) · React 19 · Tailwind v4 · Vercel AI SDK v6 · @vercel/kv · Zod v4 · Vitest.
