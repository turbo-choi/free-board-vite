# AGENTS.md

## Module Context
- `frontend/`는 React SPA 클라이언트다.
- 인증, 게시판/게시글/댓글, 관리자 메뉴/회원/로그, 통계 모니터링 UI를 담당한다.
- API 호출은 `/api` 프록시를 통해 백엔드와 통신한다.

## Tech Stack & Constraints
- React 18 + TypeScript(strict) + Vite 5
- TailwindCSS + shadcn/ui (`components.json`, `src/styles/tokens.css`)
- TanStack Query (`@tanstack/react-query`)로 서버 상태를 관리한다.
- 경로 별칭 `@/*`를 사용한다.
- HTTP 클라이언트는 `src/lib/api.ts`의 axios 인스턴스를 표준으로 사용한다.

## Implementation Patterns
- 라우팅:
  - `src/routes/index.tsx`에서 전체 경로를 선언한다.
  - 보호 화면은 `ProtectedRoute`, 권한 화면은 `AdminRoute`로 감싼다.
- 데이터 계층:
  - API 함수는 `src/lib/api.ts`
  - Query/Mutation 훅은 `src/features/*/queries.ts`
- 화면 계층:
  - 페이지 단위는 `src/pages`
  - 재사용 UI는 `src/components`
  - Provider는 `src/providers`
- 인증:
  - 토큰 저장/제거 로직은 `src/lib/auth.ts` 경유
  - 401 공통 처리는 axios interceptor + unauthorized handler 패턴을 유지

## Testing Strategy
- 기본 자동 테스트는 `Vitest + Testing Library`를 사용한다.
- 단위/컴포넌트 테스트:
  - `cd frontend && npm test`
- 타입/빌드 검증:
  - `cd frontend && npm run build`
- 로컬 실행 검증:
  - `cd frontend && npm run dev -- --port 5173`
  - 로그인, 게시글 목록/상세, 관리자 페이지 접근 제어를 수동 확인한다.
- API 계약 변경 시:
  - `src/types/api.ts`, `src/types/domain.ts`, `src/lib/api.ts`, `src/features/*`를 함께 점검한다.

## Local Golden Rules

### Do
- 서버 상태는 React Query로 관리하고 query key를 안정적으로 유지한다.
- 라우팅 타겟 문자열(`/boards/*`, `/admin/*`)은 백엔드 권한 타겟과 동일하게 맞춘다.
- UI 스타일은 토큰/유틸 클래스 기반으로 일관성 있게 유지한다.
- 폼/모달/피드백 컴포넌트는 재사용 가능하게 분리한다.

### Don't
- 페이지 컴포넌트에서 axios를 직접 호출하지 않는다.
- 인증/권한 실패를 무시하고 UI만 숨기는 방식으로 처리하지 않는다.
- 임의 절대 URL을 코드에 하드코딩하지 않는다.
- `dist/` 산출물 수정을 소스 변경으로 간주하지 않는다.
