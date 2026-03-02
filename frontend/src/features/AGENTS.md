# AGENTS.md

## Module Context
- `frontend/src/features`는 도메인별 서버 상태 훅 레이어다.
- 각 도메인은 주로 `queries.ts`를 통해 목록/상세 조회와 변경 Mutation을 제공한다.
- 메뉴 권한 보조 로직(`menus/permissions.ts`)과 아이콘 레지스트리도 이 경계에서 관리한다.

## Tech Stack & Constraints
- 필수 라이브러리:
  - `@tanstack/react-query`
  - `@/lib/api` (axios wrapper)
- API 함수 직접 재구현 금지: `queries.ts`는 `@/lib/api`의 함수만 호출한다.
- query key는 배열 형태를 유지하고, 문자열 오탈자를 방지한다.

## Implementation Patterns
- Query 패턴:
  - `useQuery({ queryKey: [...], queryFn: ... })`
  - 조건부 조회는 `enabled` 옵션으로 제어한다.
- Mutation 패턴:
  - `useMutation({ mutationFn, onSuccess })`
  - 성공 시 관련 query key를 `invalidateQueries` 또는 `removeQueries`로 동기화한다.
- key 네이밍:
  - 예: `['posts', params]`, `['post', postId]`, `['menus', 'navigation']`
- 권한 헬퍼:
  - 메뉴 권한 계산은 `menus/permissions.ts` 단일 진입점으로 유지한다.

## Testing Strategy
- 빌드 검증:
  - `cd frontend && npm run build`
- 수동 검증:
  - 생성/수정/삭제 후 목록이 자동 갱신되는지 확인한다.
  - 상세/목록 이동 시 캐시 데이터가 의도대로 무효화되는지 확인한다.
  - 권한 변경 후 `menus/navigation` 캐시가 갱신되는지 확인한다.

## Local Golden Rules

### Do
- Mutation 성공 시 최소 범위의 key만 정확히 invalidate 한다.
- 타입 안정성을 위해 `Parameters<typeof apiFn>` 패턴을 활용한다.
- 기능별 파일 경계를 유지해 도메인 간 결합을 낮춘다.

### Don't
- 동일 key를 서로 다른 의미로 재사용하지 않는다.
- 컴포넌트 내부에서 query key 문자열을 임의로 복제하지 않는다.
- 쿼리 훅에서 UI 상태(모달 열림 등)를 함께 관리하지 않는다.
