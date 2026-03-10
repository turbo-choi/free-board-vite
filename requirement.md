# Requirement

## FR (Functional Requirements)
1. `POST /api/auth/signup`은 이미 존재하는 이메일 계정(비밀번호 해시 유무와 무관)을 재사용/재활성화하지 않고 `409 EMAIL_ALREADY_EXISTS`로 거부해야 한다.
2. 로그인 시도 제한 키 생성에 사용되는 클라이언트 IP는 기본적으로 `request.client.host`를 사용해야 한다.
3. 감사 로그 IP 기록도 기본적으로 `request.client.host`를 사용해야 하며, 프록시 헤더 신뢰는 명시 설정으로만 허용해야 한다.
4. `TRUST_PROXY_HEADERS` 환경 변수를 추가해 운영 환경에서 프록시 체인 사용 여부를 제어할 수 있어야 한다.

## NFR (Non-Functional Requirements)
1. 기존 인증 API 계약(`signup/login/me`)과 권한 모델은 유지한다.
2. 변경은 백엔드 보안 경계(인증/감사) 중심의 최소 범위 패치로 제한한다.
3. 백엔드 컴파일 스모크(`python3 -m compileall app`)가 통과해야 한다.

## Scope
- 포함:
  - `backend/app/api/auth.py` 회원가입 로직 강화
  - `backend/app/services/auth_throttle.py` 입력 키 신뢰 경계 보강(호출부 기준)
  - `backend/app/services/audit_logger.py` IP 추출 정책 강화
  - `backend/app/core/config.py`, `backend/.env.example`, `README.md`, `docs/project_documentation.md` 설정/운영 문서 반영
- 제외:
  - JWT 저장 매체(localStorage -> HttpOnly Cookie) 변경
  - 신규 비밀번호 재설정(이메일 인증) 기능 추가
  - 프론트엔드 라우팅/화면 구조 변경

## Constraints
1. 비밀값 하드코딩 없이 환경 변수 기반 설정만 사용한다.
2. 보호 API의 기존 권한 체크 흐름은 변경하지 않는다.
3. 기존 운영 데이터 및 시드 보호 정책은 유지한다.

## Acceptance
1. 기존 이메일로 `/api/auth/signup` 요청 시 항상 `EMAIL_ALREADY_EXISTS`를 반환한다.
2. 기본 설정(`TRUST_PROXY_HEADERS=false`)에서 임의의 `X-Forwarded-For` 헤더로 로그인 쓰로틀 키를 우회할 수 없다.
3. 기본 설정에서 감사 로그의 IP는 헤더가 아닌 직접 클라이언트 IP 기준으로 기록된다.
4. `cd backend && source .venv/bin/activate && python3 -m compileall app`가 성공한다.

## Risks
1. 기존에 `password_hash IS NULL` 계정을 회원가입으로 복구하던 내부 운영 절차가 있었다면 영향이 발생할 수 있다.
2. 프록시 기반 운영 환경에서 `TRUST_PROXY_HEADERS=true`를 설정하지 않으면 실제 사용자 IP가 아닌 프록시 IP가 기록될 수 있다.

## Changes
- 2026-03-10: 회원가입 계정 탈취 가능성 차단 및 프록시 헤더 신뢰 경계 강화 요구사항 추가.
