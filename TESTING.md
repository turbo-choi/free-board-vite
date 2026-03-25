# TESTING

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Frameworks

- Frontend: `vitest` + `@testing-library/react` + `jsdom`
- Backend: `pytest` + `pytest-asyncio` + `httpx`

## Run Commands

- Frontend: `cd frontend && npm test`
- Backend: `cd backend && source .venv/bin/activate && pytest`

## Test Layers

- Unit tests: utility functions, permission parsing, config validation 같이 외부 의존성이 적은 로직부터 검증한다.
- Integration tests: 라우트 가드, FastAPI endpoint, API-client-adjacent behavior를 실제 입력/출력 기준으로 검증한다.
- Smoke tests: 프론트 빌드(`cd frontend && npm run build`), 백엔드 컴파일(`cd backend && source .venv/bin/activate && python3 -m compileall app`)을 기본 스모크로 유지한다.
- E2E tests: 브라우저 기반 흐름 검증은 `/qa`에서 실제 앱 실행 후 수행한다.

## Conventions

- Frontend test files: 소스와 가까운 위치의 `*.test.ts` / `*.test.tsx`
- Backend test files: `backend/tests/**/test_*.py`
- Assertion style: 입력과 출력 행동을 직접 검증하고, 단순 존재 여부만 보는 약한 assertion은 피한다.
- Setup/teardown: 필요한 mock은 테스트 파일 안에서 지역적으로 선언하고, 각 테스트 후 상태를 초기화한다.
