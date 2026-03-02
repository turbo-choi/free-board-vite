# AGENTS.md

## Module Context
- `docs/`는 프로젝트 요구사항, 설계, 운영 정책 문서를 관리한다.
- 코드 구현과 문서 간 정합성을 유지하는 기준 저장소 역할을 한다.

## Tech Stack & Constraints
- Markdown 문서 중심
- 제품 동작은 `README.md`, 상세 스펙은 `project_documentation.md`, 변경 기록은 `CHANGELOG.md`를 기준으로 관리한다.
- 날짜/버전/정책 문구는 실제 코드 상태와 일치해야 한다.

## Implementation Patterns
- 기능 변경 문서화 순서:
  - 요구사항 변경: `project_documentation.md`
  - 실행/운영 가이드 변경: `README.md`
  - 릴리스 수준 변경 이력: `CHANGELOG.md`
- API/권한 변경 문서화 시:
  - 경로, 메서드, 권한 조건, 파라미터를 함께 갱신한다.
- 날짜 표기는 `YYYY-MM-DD`로 통일한다.

## Testing Strategy
- 문서 변경 검증 체크리스트:
  - 실행 명령어가 현재 프로젝트 스크립트와 일치하는지 확인
  - 인증/권한 정책 설명이 실제 코드와 일치하는지 확인
  - 최신 변경 사항이 `CHANGELOG.md`에 반영되었는지 확인

## Local Golden Rules

### Do
- 코드가 바뀌면 같은 작업 단위에서 문서를 함께 수정한다.
- 한국어 용어와 API 경로 표기를 일관되게 유지한다.
- 독자가 바로 실행할 수 있는 명령어를 우선 제공한다.

### Don't
- 구현되지 않은 기능을 완료된 것처럼 문서화하지 않는다.
- 오래된 스크린샷/예시를 최신 동작처럼 유지하지 않는다.
- 근거 없는 수치/정책을 임의로 추가하지 않는다.
