# AGENTS.md

## Module Context
- `backend/app/api`는 HTTP 엔드포인트 계층이다.
- 요청 파싱, 인증/인가 적용, 응답 모델 직렬화, 상태 코드 정의를 담당한다.
- 비즈니스 핵심 로직은 `crud`와 `services`로 위임한다.

## Tech Stack & Constraints
- FastAPI `APIRouter` 기반 모듈 분리 (`auth`, `boards`, `posts`, `comments`, `attachments`, `menus`, `menu_categories`, `users`, `stats`, `audit_logs`)
- 의존성 주입 표준:
  - `SessionDep`: DB 세션
  - `CurrentUserDep`: 인증 사용자
- 권한 체크는 `services/access_control.py`를 사용한다.
- 응답 모델은 Pydantic 스키마를 `response_model`로 명시한다.

## Implementation Patterns
- 라우트 파일 패턴:
  - `router = APIRouter(prefix='...', tags=['...'])`
  - 엔드포인트별 `@router.get/post/patch/delete`
  - 예외는 `AppException`으로 통일
- 게시판/관리자 권한 라우트 패턴:
  - 읽기: `ensure_read_permission(session, target=..., role=user.role)`
  - 쓰기: `ensure_write_permission(session, target=..., role=user.role)`
- 검색/필터 쿼리는 FastAPI `Query` + 스키마 `model_validate` 조합을 따른다.
- 신규 라우트 추가 후 `backend/app/api/router.py`에 반드시 include 한다.

## Testing Strategy
- 최소 검증 순서:
  - `cd backend && source .venv/bin/activate && python3 -m compileall app`
  - 서버 실행 후 `curl http://localhost:8000/health`
- 권한 관련 API 변경 시 수동 점검:
  - 일반 사용자/관리자 토큰 각각으로 200/403 케이스를 확인한다.
- 쿼리 파라미터 변경 시:
  - 기본값, 유효 범위(`ge`, `le`), alias(`from`, `to`) 동작을 직접 확인한다.

## Local Golden Rules

### Do
- 인증이 필요한 엔드포인트는 `CurrentUserDep`를 명시한다.
- 데이터 조회/조합은 `crud` 함수로 이동해 중복을 줄인다.
- 상태 코드와 응답 모델을 문서화 가능한 형태로 유지한다.

### Don't
- 라우트에서 직접 SQL을 작성하지 않는다.
- 권한 실패를 일반 500으로 누락시키지 않는다.
- 요청/응답 필드명을 프론트 계약과 다르게 임의 변경하지 않는다.
