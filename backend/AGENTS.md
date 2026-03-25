# AGENTS.md

## Module Context
- `backend/`는 FastAPI 기반 API 서버와 DB 초기화/시드/첨부 저장을 담당한다.
- 핵심 하위 모듈:
  - `app/api`: 엔드포인트
  - `app/schemas`: 요청/응답 계약
  - `app/models`: SQLAlchemy 모델
  - `app/crud`: 조회/목록 중심 DB 접근
  - `app/services`: 권한, 감사 로그, 파일 저장, 시드
  - `app/core`: 설정, 보안, 예외, DB 세션

## Tech Stack & Constraints
- Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy Async, SQLite, python-jose
- 의존성 관리는 `requirements.txt` 기준으로 유지한다.
- DB 세션은 `SessionDep` 주입을 표준으로 사용한다.
- 예외 응답은 `AppException` 형식으로 통일한다.
- 설정값은 `app/core/config.py` + `.env`를 통해 주입한다.

## Implementation Patterns
- 신규 API 추가 순서:
  - `schemas`에 입출력 모델 정의
  - `api/*.py` 라우트 구현
  - 필요한 조회 로직은 `crud`에 분리
  - 정책/권한/파일/감사 로직은 `services`로 위임
  - `app/api/router.py`에 라우터 등록
- 권한이 필요한 라우트는 타겟 경로 기반 권한 검증을 명시적으로 호출한다.
- 비즈니스 에러는 `raise AppException(message, code, status)`로 반환한다.
- 파일 첨부/다운로드 로직은 `services/file_storage.py`를 재사용한다.
- 시드 정책 변경 시 `services/seed.py`와 `services/seed_snapshot.json`을 함께 검토한다.

## Testing Strategy
- 기본 자동 테스트는 `pytest`를 사용한다.
- 단위/서비스/API 테스트:
  - `cd backend && source .venv/bin/activate && pytest`
- 컴파일 스모크:
  - `cd backend && source .venv/bin/activate && python3 -m compileall app`
- 서버 실행 스모크:
  - `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000`
  - `curl http://localhost:8000/health`
- 시드 스냅샷 관련 변경 시:
  - `cd backend && source .venv/bin/activate && .venv/bin/python scripts/export_seed_snapshot.py`

## Local Golden Rules

### Do
- `async/await` 기반으로 I/O를 처리하고 동기 블로킹 호출을 피한다.
- 인증 라우트 외 보호 API는 `CurrentUserDep`를 사용한다.
- 메뉴 권한 정책 관련 로직은 `services/access_control.py`, `services/menu_permissions.py`를 우선 수정한다.
- DB 커밋이 필요한 작업은 명시적으로 `await session.commit()`을 호출한다.

### Don't
- 라우트 함수 내부에 대형 권한/정책 로직을 직접 하드코딩하지 않는다.
- 프론트 검증만 믿고 백엔드 권한 검증을 생략하지 않는다.
- 운영 시크릿 값을 기본값(`change-me`) 상태로 배포하지 않는다.
- `uploads/`의 실데이터 파일을 규칙 문서나 샘플 목적으로 수정하지 않는다.
