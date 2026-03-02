# AGENTS.md

## Project Context & Operations

### Business Goals
- 사내 게시판, 권한 관리, 통계 모니터링, 감사 로그 모니터링을 안정적으로 운영한다.
- 프론트엔드 UX와 백엔드 권한/감사 일관성을 유지한다.
- Seed 정책과 운영 데이터 보존 원칙을 지키며 기능을 확장한다.

### Tech Stack Snapshot
- Frontend: React 18, TypeScript, Vite 5, TailwindCSS, shadcn/ui, TanStack Query, React Router, Axios
- Backend: FastAPI, Pydantic v2, SQLAlchemy Async, SQLite, JWT
- Docs: `README.md`, `docs/project_documentation.md`, `CHANGELOG.md`

### Operational Commands
- 의존성 설치(Frontend):
  - `cd frontend && npm install`
- 의존성 설치(Backend):
  - `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- 개발 서버 실행(Backend):
  - `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
- 개발 서버 실행(Frontend):
  - `cd frontend && npm run dev -- --port 5173`
- 프론트 빌드 검증:
  - `cd frontend && npm run build`
- 백엔드 정적 스모크 검증:
  - `cd backend && source .venv/bin/activate && python3 -m compileall app`
- Seed 스냅샷 갱신:
  - `cd backend && source .venv/bin/activate && .venv/bin/python scripts/export_seed_snapshot.py`

## Golden Rules

### Immutable
- 모든 `AGENTS.md`는 500라인 미만으로 유지한다.
- 보호 리소스 접근은 백엔드에서 반드시 권한 검증을 수행한다.
- 비밀값은 `.env`에서만 주입하며 코드/문서에 하드코딩하지 않는다.
- Seed는 운영 데이터가 존재하는 상태에서 기존 데이터를 재생성/덮어쓰기하지 않는다.
- API 변경 시 프론트 타입과 쿼리 계층을 함께 갱신한다.

### Do's & Don'ts
- Do: 백엔드 엔드포인트는 `schemas`(입출력), `crud`(조회), `services`(도메인 규칙) 레이어를 유지한다.
- Do: 프론트 데이터 요청은 `src/lib/api.ts`와 `src/features/*/queries.ts`를 통해 일관되게 처리한다.
- Do: 권한 타겟 경로(`/admin/*`, `/boards/*`)는 FE/BE에서 동일한 문자열 규칙을 유지한다.
- Do: 실패 케이스는 사용자 친화 메시지와 함께 처리하고 로그 모니터링 가능성을 고려한다.
- Don't: API 키, JWT 시크릿, 운영 계정 정보를 코드에 하드코딩하지 않는다.
- Don't: 권한 체크를 프론트에서만 처리하고 백엔드 체크를 생략하지 않는다.
- Don't: `frontend/dist`, `backend/uploads`, `__pycache__` 산출물을 소스 규칙 기준으로 수정하지 않는다.
- Don't: 신규 규칙 추가 시 루트/하위 `AGENTS.md` 간 충돌을 방치하지 않는다.

## Standards & References

### Coding Conventions
- Frontend:
  - TypeScript `strict` 유지, 경로 별칭은 `@/*` 사용
  - UI는 Tailwind 토큰(`src/styles/tokens.css`)과 shadcn 컴포넌트 규칙을 따른다
  - 서버 통신/오류 포맷은 `src/lib/api.ts`의 패턴을 따른다
- Backend:
  - FastAPI 의존성 주입(`SessionDep`, `CurrentUserDep`)을 표준으로 사용한다
  - 예외는 `AppException` 기반으로 일관되게 반환한다
  - SQLAlchemy Async 세션 패턴(`await`, `commit`, 필요 시 `refresh`)을 유지한다

### References
- 프로젝트 실행/개요: `./README.md`
- 상세 설계/요구사항: `./docs/project_documentation.md`
- 변경 이력: `./CHANGELOG.md`

### Git Strategy & Commit Message
- 브랜치 전략: `main` 보호 + 짧은 수명 브랜치(`feature/*`, `fix/*`, `chore/*`)
- 커밋 단위: 기능/수정/리팩터링을 분리해 원자적으로 구성
- 커밋 메시지 포맷(권장):
  - `type(scope): summary`
  - 예시: `feat(api): add audit log filtering by date range`
  - 예시: `fix(frontend): preserve board context on post detail back navigation`

### Maintenance Policy
- 코드와 규칙이 어긋나면 구현을 기준으로 문서를 즉시 업데이트하거나 업데이트 작업을 제안한다.
- 신규 의존성/아키텍처 변경이 생기면 해당 경계의 `AGENTS.md`를 같은 PR/작업 단위에서 함께 수정한다.
- 중복 규칙이 생기면 루트는 원칙만 남기고 상세는 하위 파일로 위임한다.

## Context Map (Action-Based Routing) [CRITICAL]
- **[Backend 전반 (FastAPI/Pydantic/SQLAlchemy)](./backend/AGENTS.md)** — 백엔드 구조, 의존성, 실행/검증 흐름 수정 시.
- **[API Routes 수정 (BE)](./backend/app/api/AGENTS.md)** — Route Handler, 권한 체크, 요청/응답 스키마 변경 시.
- **[도메인 서비스/권한/시드/파일저장 (BE)](./backend/app/services/AGENTS.md)** — 접근 제어, 감사 로그, 파일 저장, 시드 정책 수정 시.
- **[Frontend 전반 (React/Vite/TypeScript)](./frontend/AGENTS.md)** — 라우팅, 페이지, Provider, 빌드/실행 규칙 수정 시.
- **[상태/서버데이터 계층 (React Query)](./frontend/src/features/AGENTS.md)** — `queries.ts` 훅, 캐시 키, 무효화 전략 수정 시.
- **[UI 컴포넌트/레이아웃 (FE/Tailwind)](./frontend/src/components/AGENTS.md)** — 공통 UI, 레이아웃, 피드백 컴포넌트 수정 시.
- **[프로젝트 문서 및 스펙 동기화](./docs/AGENTS.md)** — 요구사항/설계/운영 문서 갱신 시.
