# AGENTS.md

## Module Context
- `backend/app/services`는 도메인 정책과 인프라 보조 로직을 담당한다.
- 주요 파일:
  - `access_control.py`: 메뉴 타겟 기반 읽기/쓰기 권한 검증
  - `menu_permissions.py`: 역할 CSV 파싱/정규화/권한 판별
  - `audit_logger.py`: `/api/*` 요청 감사 로그 기록
  - `file_storage.py`: 업로드 저장/삭제 경로 관리
  - `seed.py`: 초기 부트스트랩/테스트 데이터 시드

## Tech Stack & Constraints
- Python 표준 라이브러리 + SQLAlchemy Async + FastAPI Request/UploadFile
- 경로/파일 조작은 `pathlib.Path` 우선 사용
- 보안 민감 로직(권한, 인증 연계, 파일 경로)은 방어적 기본값을 유지한다.
- 시드 데이터는 `seed_snapshot.json`을 우선 사용하되, 파일이 없을 때만 기본 부트스트랩 상수를 사용한다.

## Implementation Patterns
- 권한 관련 변경:
  - 역할 파싱/직렬화 규칙은 `menu_permissions.py`에서 일괄 관리
  - 타겟 기반 접근 허용 여부는 `access_control.py`로 통합
- 감사 로그:
  - 사용자 요청 흐름을 방해하지 않도록 실패를 전파하지 않는다.
  - 기록 필드는 검색/필터 가능한 수준으로 유지한다.
- 파일 저장:
  - 파일명은 안전 문자만 허용해 sanitize 한다.
  - 저장 경로는 업로드 루트 기준 상대 경로를 DB에 저장한다.
- 시드:
  - 운영 데이터가 있을 때 destructive reseed 금지
  - 스냅샷 구조 변경 시 export 스크립트(`scripts/export_seed_snapshot.py`)와 함께 검증

## Testing Strategy
- 권한 로직 변경 시:
  - ADMIN/STAFF/USER별 read/write 판단 결과를 수동 검증한다.
- 파일 저장 로직 변경 시:
  - 업로드, 다운로드, 삭제, 빈 디렉터리 정리 경로를 확인한다.
- 시드 변경 시:
  - 서버 기동 후 기본 계정/메뉴/게시판 생성 여부를 확인한다.
  - `cd backend && source .venv/bin/activate && .venv/bin/python scripts/export_seed_snapshot.py` 실행 검증

## Local Golden Rules

### Do
- 권한 판단의 기본값(fallback)과 role 우선순위를 명시적으로 유지한다.
- 서비스 함수는 라우터 재사용을 고려해 부작용 범위를 최소화한다.
- 감사 로그/파일 저장 실패는 사용자 핵심 트랜잭션에 영향 주지 않도록 설계한다.

### Don't
- 역할 문자열을 하드코딩해 여러 파일에서 중복 처리하지 않는다.
- 파일 경로를 신뢰 입력값 그대로 연결하지 않는다.
- 시드 데이터 추가 시 기존 운영 보호 조건을 제거하지 않는다.
