# Changelog

All notable changes to this project are documented in this file.

## [2026-03-02]

### Added
- 감사 로그(Audit Log) 기능 추가:
  - `audit_logs` 테이블
  - `/api/*` 요청 자동 로깅 미들웨어
  - 관리자 조회 API `GET /api/audit-logs`
  - 관리자 화면 `/admin/audit-logs` (검색/필터/페이징/자동 새로고침)
- 통계 모니터링 화면 강화:
  - 월 단위/최근 N일 보기
  - 월 일별 그래프 + hover 툴팁
  - 게시판별 게시글 분포 표시
- 회원가입/비밀번호 변경/탈퇴/내 통계(로그인 횟수, 내 글/댓글 수) 기능
- 화이트 모드(라이트 테마) 지원
- 메뉴 아이콘 선택 기능 및 아이콘 옵션 대폭 확장
- DB -> seed 스냅샷 내보내기 스크립트 추가:
  - `backend/scripts/export_seed_snapshot.py`

### Changed
- 인증 정책 변경:
  - 로그인 시 자동 사용자 생성 제거
  - 가입된 계정만 로그인 허용
  - 초기 시드 계정은 admin 1개만 유지
- seed 정책 변경:
  - 기존 운영 데이터가 있으면 seed가 메뉴/라벨/데이터를 재생성하지 않음
  - 초기 부트스트랩 시점에만 기본 seed 적용
- 화면 헤더 제목을 경로 기반 동적 표시로 통일
- 게시글 상세 진입 시 헤더 경로 문맥 유지 + 돌아가기 UX 개선
- 검색 필터 UX 조정:
  - 게시판 목록 검색어는 Enter 입력 시 조회
  - 로그 모니터링 검색어는 Enter 입력 시 조회

### Fixed
- 메뉴 순서 저장 시 정수 파싱 오류 수정
- 메뉴 라벨(카테고리) 삭제 후 재생성되는 이슈 수정
- 게시글 수정 화면에서 첨부파일 삭제/추가 동작 문제 수정
- 첨부파일 다운로드가 브라우저 탭에서 열리던 문제 수정 (강제 다운로드)
- 첨부 드래그앤드롭 업로드 동작 보완
- 통계 그래프 베이스라인/월간 표시/툴팁 표시 문제 수정

## [2026-02-28]

### Added
- 초기 풀스택 구조 구성:
  - Frontend: React(Vite) + TypeScript + Tailwind + shadcn/ui
  - Backend: FastAPI + Pydantic v2 + SQLAlchemy Async + SQLite
- 게시판/게시글/댓글/첨부 CRUD
- 메뉴/라벨 관리 및 권한 기반 내비게이션
