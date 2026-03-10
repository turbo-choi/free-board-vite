# Plan

## Goal
- 인증/감사 경계에서 악용 가능한 취약점(기존 계정 탈취, 프록시 헤더 스푸핑 기반 로그인 제한 우회)을 최소 변경으로 차단한다.

## Architecture
- 대상:
  - `backend/app/api/auth.py`
  - `backend/app/services/audit_logger.py`
  - `backend/app/core/config.py`
  - (신규) `backend/app/core/request_meta.py`
- 방식:
  1. `signup`에서 기존 이메일 계정 재사용 분기 제거
  2. 클라이언트 IP 추출 로직을 공통 함수로 분리
  3. 기본값은 소켓 IP(`request.client.host`) 사용, `TRUST_PROXY_HEADERS=true`일 때만 `X-Forwarded-For` 허용
  4. 설정/운영 문서에 신규 환경 변수 반영

## Interfaces
- Public API:
  - `POST /api/auth/signup`의 기존 이메일 처리만 강화(항상 `409`), 경로/요청/응답 스키마는 유지
- 환경 변수:
  - `TRUST_PROXY_HEADERS` (bool, default `false`) 추가
- 프론트 타입/쿼리 계층 변경 없음

## Steps
1. 보안 요구사항 기준으로 `requirement.md`/`plan.md` 선반영
2. 백엔드 인증/감사 코드 패치 적용
3. `.env.example` 및 운영 문서(README, project_documentation) 동기화
4. 보안 디스커버리 재실행 및 백엔드 컴파일 스모크 검증
5. 결과(발견사항/수정/검증/잔여리스크) 문서화

## Tests
1. 정적 검증: `cd backend && source .venv/bin/activate && python3 -m compileall app`
2. 보안 스캔:
   - `bash /home/turbo/skills_store/.agents/skills/fix-code-vulnerabilities/scripts/run_security_checks.sh --path <repo> --out <dir>`
   - `bash /home/turbo/skills_store/.agents/skills/fix-code-vulnerabilities/scripts/verify_remediation.sh --path <repo>`
   - `bash /home/turbo/skills_store/.agents/skills/fix-code-vulnerabilities/scripts/verify_remediation.sh --path <repo> --run`
3. 수동 확인:
   - 기존 이메일 `signup` 거부(409) 확인
   - `TRUST_PROXY_HEADERS=false`에서 `X-Forwarded-For` 무시 동작 확인

## Rollback
1. `auth.py`의 기존 이메일 재활성화 분기 복구
2. `request_meta.py` 도입 전 IP 추출 코드로 되돌림
3. 신규 환경 변수/문서 변경 롤백

## Changes
- 2026-03-10: 인증/감사 보안 리메디에이션(계정 탈취 차단, 프록시 헤더 신뢰 제어) 작업 계획 추가.
