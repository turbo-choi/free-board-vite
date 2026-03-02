# CorpBoard 프로젝트 문서

작성일: 2026-02-28  
최종 업데이트: 2026-03-02  
대상 프로젝트: `free-board-vite`

참고 문서:
- 프로젝트 개요/실행 가이드: `README.md`
- 변경 이력: `CHANGELOG.md`

## 1. 프로젝트 개요

사내 게시판(공지/자유/자료실/Q&A) + 통계 모니터링 + 감사 로그 모니터링 웹 애플리케이션.

- Frontend: React(Vite) + TypeScript + TailwindCSS + shadcn/ui
- Backend: FastAPI + Pydantic v2 + SQLAlchemy Async + SQLite
- 인증: JWT 기반
- 파일 첨부: 로컬 파일시스템 저장 + DB 메타데이터 관리

---

## 2. 요구사항 정의서 (최종 반영 기준)

### 2.1 인증/회원

1. 회원가입 기능 제공
2. 로그인은 가입된 계정만 가능 (자동 생성 금지)
3. 역할(Role): `USER / STAFF / ADMIN`
4. 로그인 후 세션 유지(JWT + 프론트 localStorage)
5. 마이페이지: 내 정보, 비밀번호 변경, 탈퇴, 통계(로그인 횟수/내 글/내 댓글)

### 2.2 게시판/게시글/댓글/첨부

1. 기본 게시판 4개 seed: notice/free/archive/qa
2. 게시판 CRUD(관리)
3. 게시글 CRUD + 검색/필터/정렬/페이징
4. 게시글 상세 조회 시 조회수 증가
5. 댓글 CRUD
6. 첨부 업로드/다운로드/삭제
7. 첨부는 드래그앤드롭 지원

### 2.3 메뉴/권한

1. 메뉴 CRUD + 정렬 + 가시성 토글
2. 메뉴 분류(라벨) CRUD + 정렬
3. 사이드바에서 분류 접기/펼치기
4. 화면(메뉴) 단위 권한 설정:
   - `read_roles` (읽기 가능 역할)
   - `write_roles` (쓰기 가능 역할)
5. 권한은 일반 사용자/스태프/어드민별 설정 가능
6. 관리자 화면(`게시판/메뉴/회원/로그 모니터링`)도 메뉴 권한 정책 적용

### 2.4 핀(공지 고정) 정책

1. 게시판의 `allowPin=true`여야 함
2. 사용자 역할이 `STAFF` 또는 `ADMIN`이어야 함
3. 프론트/백엔드 모두에서 검증

### 2.5 통계/감사 로그

1. 통계 화면 제공: 월/기간별 일별 지표(누적회원/탈퇴회원/게시글/댓글)
2. 게시판별 게시글 수 집계 제공
3. 감사 로그 자동 기록:
   - 대상: `/api/*` 요청
   - 항목: 사용자, 메서드, 경로, 쿼리, 상태코드, 성공여부, 응답시간, IP, User-Agent, 시각
4. 관리자 로그 모니터링 화면:
   - 필터: 검색어/메서드/상태코드/성공여부/기간
   - 페이징 조회 지원

### 2.6 Seed/초기화 정책

1. DB 초기화: `create_all + 런타임 schema patch`
2. seed는 초기 부트스트랩(데이터가 사실상 없는 상태)에서만 적용
3. 운영 데이터가 있는 경우 메뉴/라벨/게시글을 seed가 재생성/덮어쓰기 하지 않음
4. 현재 DB를 seed 스냅샷으로 갱신하는 스크립트 제공:
   - `backend/scripts/export_seed_snapshot.py`

---

## 3. 설계서

## 3.1 시스템 아키텍처

- FE/BE 분리 구조
- FE는 Vite dev server + `/api` 프록시
- BE는 FastAPI 단일 앱, `/api` 라우터 통합
- DB는 SQLite(`backend/app.db`)
- 초기화 방식: `create_all + 런타임 schema patch + 조건부 seed(초기 부트스트랩)`

## 3.2 백엔드 레이어 설계

- `api/`: 엔드포인트
- `schemas/`: 요청/응답 모델
- `models/`: SQLAlchemy 모델
- `crud/`: DB 조회/목록 로직
- `services/`: 권한, 시드, 파일 저장 등 도메인 서비스
- `core/`: 설정, DB 세션, 보안, 예외 처리

## 3.3 프론트 구조 설계

- `pages/`: 라우트 페이지
- `components/`: 공통/레이아웃/UI 컴포넌트
- `features/*/queries.ts`: TanStack Query 훅
- `providers/`: Auth/Theme/Query Provider
- `lib/`: API client, auth storage, util

## 3.4 권한 설계

- 메뉴 테이블에 `read_roles`, `write_roles` 저장(CSV)
- 권한 서비스:
  - `menu_permissions.py`: 권한 파싱/정규화/판별
  - `access_control.py`: 타겟 경로 기준 읽기/쓰기 검증
- 화면 권한 타겟 예시:
  - `/boards/notice`
  - `/admin/menus`
- 내비게이션 응답에 `can_write` 포함하여 프론트 제어

---

## 4. 데이터 모델

## 4.1 핵심 테이블

1. `users`
   - `id, name, email(unique), role, is_active, password_hash, login_count, created_at`
2. `boards`
   - `id, name, slug(unique), description, settings_json, created_at`
3. `posts`
   - `id, board_id, title, content, author_id, is_pinned, view_count, created_at, updated_at`
4. `comments`
   - `id, post_id, author_id, content, created_at, updated_at`
5. `attachments`
   - `id, post_id, file_name, mime_type, size, storage_path, created_at`
6. `menu_categories`
   - `id, label, order, is_visible`
7. `menus`
   - `id, label, type, target, order, is_visible, category_id, is_admin_only, read_roles, write_roles`
8. `audit_logs`
   - `id, user_id, user_email, user_role, method, path, query_string, status_code, is_success, latency_ms, ip_address, user_agent, created_at`

## 4.2 Board settings_json

- `allowAnonymous: bool`
- `allowAttachment: bool`
- `allowPin: bool`

---

## 5. API 설계

## 5.1 Auth

- `POST /api/auth/signup`  
  body: `{ email, name, password }`
- `POST /api/auth/login`  
  body: `{ email, password }`
- `GET /api/auth/me`

## 5.2 Boards

- `GET /api/boards`
- `POST /api/boards`
- `PATCH /api/boards/{id}`
- `DELETE /api/boards/{id}`

## 5.3 Posts

- `GET /api/posts?boardSlug=&q=&sort=&page=&size=&from=&to=`
- `POST /api/posts`
- `GET /api/posts/{id}` (조회수 +1)
- `PATCH /api/posts/{id}`
- `DELETE /api/posts/{id}`

## 5.4 Comments

- `GET /api/posts/{id}/comments`
- `POST /api/posts/{id}/comments`
- `PATCH /api/comments/{id}`
- `DELETE /api/comments/{id}`

## 5.5 Attachments

- `POST /api/posts/{id}/attachments`
- `GET /api/attachments/{id}/download`
- `DELETE /api/attachments/{id}`

## 5.6 Menus / Categories

- `GET /api/menus`
- `GET /api/menus/navigation`
- `POST /api/menus`
- `PATCH /api/menus/{id}`
- `DELETE /api/menus/{id}`
- `PATCH /api/menus/reorder`
- `GET /api/menu-categories`
- `POST /api/menu-categories`
- `DELETE /api/menu-categories/{id}`
- `PATCH /api/menu-categories/reorder`

## 5.7 Users

- `GET /api/users`
- `PATCH /api/users/{id}/role`
- `PATCH /api/users/{id}/active`
- `GET /api/users/me/profile`
- `PATCH /api/users/me/password`
- `DELETE /api/users/me/withdraw`

## 5.8 Stats

- `GET /api/stats/monitoring?days=&month=`

## 5.9 Audit Logs

- `GET /api/audit-logs?q=&method=&status_code=&is_success=&from_at=&to_at=&page=&size=`

## 5.10 API 권한 요약

| 영역 | 메서드 | 경로 | 권한(요약) |
|---|---|---|---|
| Auth | POST | `/api/auth/signup` | 누구나 |
| Auth | POST | `/api/auth/login` | 가입 계정만 |
| Auth | GET | `/api/auth/me` | 로그인 필요 |
| Boards | GET | `/api/boards` | 로그인 필요(읽기 가능한 게시판만 반환) |
| Boards | POST/PATCH/DELETE | `/api/boards`, `/api/boards/{id}` | `/admin/boards` 쓰기 권한 |
| Posts | GET | `/api/posts` | 로그인 필요(보드 읽기 권한) |
| Posts | POST | `/api/posts` | 보드 쓰기 권한 |
| Posts | GET | `/api/posts/{id}` | 보드 읽기 권한 |
| Posts | PATCH/DELETE | `/api/posts/{id}` | 작성자 또는 ADMIN + 보드 쓰기 권한 |
| Comments | GET | `/api/posts/{id}/comments` | 보드 읽기 권한 |
| Comments | POST | `/api/posts/{id}/comments` | 보드 쓰기 권한 |
| Comments | PATCH/DELETE | `/api/comments/{id}` | 작성자 또는 ADMIN + 보드 쓰기 권한 |
| Attachments | POST | `/api/posts/{id}/attachments` | 보드 쓰기 권한 + 보드 첨부 허용 |
| Attachments | GET | `/api/attachments/{id}/download` | 보드 읽기 권한 |
| Attachments | DELETE | `/api/attachments/{id}` | 작성자 또는 ADMIN + 보드 쓰기 권한 |
| Menus | GET | `/api/menus` | `/admin/menus` 읽기 권한 |
| Menus | POST/PATCH/DELETE | `/api/menus`, `/api/menus/{id}` | `/admin/menus` 쓰기 권한 |
| Menus | PATCH | `/api/menus/reorder` | `/admin/menus` 쓰기 권한 |
| Menu Categories | GET | `/api/menu-categories` | `/admin/menus` 읽기 권한 |
| Menu Categories | POST/DELETE | `/api/menu-categories`, `/api/menu-categories/{id}` | `/admin/menus` 쓰기 권한 |
| Menu Categories | PATCH | `/api/menu-categories/reorder` | `/admin/menus` 쓰기 권한 |
| Users(Admin) | GET | `/api/users` | `/admin/users` 읽기 권한 |
| Users(Admin) | PATCH | `/api/users/{id}/role`, `/api/users/{id}/active` | `/admin/users` 쓰기 권한 |
| Users(Me) | GET | `/api/users/me/profile` | 로그인 필요 |
| Users(Me) | PATCH | `/api/users/me/password` | 로그인 필요 |
| Users(Me) | DELETE | `/api/users/me/withdraw` | 로그인 필요 |
| Stats | GET | `/api/stats/monitoring` | `/stats/monitoring` 읽기 권한 |
| Audit Logs | GET | `/api/audit-logs` | `/admin/audit-logs` 읽기 권한 |

---

## 6. 개발된 사항 정리

## 6.1 UI/UX

1. 모바일 햄버거 메뉴 + 데스크탑 사이드바 축소/확장
2. 사이드바 분류(라벨) 접기/펼치기
3. 헤더 화면명 경로 기반 동적 표기
4. 게시글 상세 진입 시 헤더 경로 유지 + 돌아가기 UX 적용
5. 다크/화이트 모드 전환
6. 내정보 모달(통계/비밀번호 변경/탈퇴)
7. 필터 초기화 버튼 위치 개선(검색 필터 영역 우측)
8. 검색 필터 UX 개선:
   - 게시판 목록 검색은 Enter 입력 시 조회
   - 로그 모니터링 검색은 Enter 입력 시 조회

## 6.2 게시글/첨부

1. 글쓰기 화면 통일 및 게시판 읽기전용 표기
2. 수정 시 첨부파일 기존 삭제 + 신규 추가 동작 개선
3. 첨부파일 drag-and-drop 동작 보완
4. 첨부 다운로드는 강제 attachment 다운로드 처리
5. 첨부 다운로드 링크로 열림 이슈 수정 (`Content-Disposition: attachment`)

## 6.3 메뉴/권한

1. 메뉴 분류(라벨) 생성/삭제/순서조정
2. 메뉴/분류 순서 저장 에러 수정
3. 미분류 우선 + 분류별 메뉴 출력 구조 개선
4. 화면별 권한(`read_roles/write_roles`) 설정 UI/백엔드 구현
5. 관리자 메뉴(게시판/메뉴/회원/로그 모니터링)까지 메뉴관리 대상 포함

## 6.4 인증 정책 변경

1. 회원가입 기능 추가
2. 로그인 자동 계정 생성 제거
3. 가입 계정만 로그인 허용
4. 시드 초기 사용자: admin 1계정만 유지
5. 초기 어드민 자격:
   - email: `admin@corp.com`
   - password: `admin1234`

## 6.5 통계/감사 로그

1. 통계 모니터링 화면 구현:
   - 월 단위 일별 그래프
   - 최근 N일 그래프
   - 그래프 hover 툴팁(일자/수치)
   - 게시판별 게시글 분포
2. 감사 로그 자동 수집 미들웨어 구현(`/api/*`)
3. 감사 로그 관리자 화면 구현(`/admin/audit-logs`)

## 6.6 Seed/데이터 운영

1. 현재 DB를 seed 스냅샷으로 내보내는 스크립트 추가
   - `backend/scripts/export_seed_snapshot.py`
2. seed 로직 개선:
   - 기존 운영 데이터가 있으면 seed가 메뉴/라벨을 재생성하지 않음
   - 삭제한 메뉴 라벨이 재생성되는 문제 수정

---

## 7. 실행 및 사용법

## 7.1 백엔드 실행

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Health: `http://localhost:8000/health`
- API base: `http://localhost:8000/api`

## 7.2 프론트 실행

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

- App: `http://localhost:5173`
- Vite Proxy: `/api -> http://localhost:8000`

## 7.3 기본 시나리오

1. `/signup`에서 사용자 가입
2. `/login`에서 로그인
3. 게시판 이동 후 글쓰기/댓글/첨부 사용
4. 관리자 계정 로그인 후 메뉴관리에서 화면별 권한 조정
5. 통계모니터링(`/stats/monitoring`) 화면에서 월/기간 지표 확인
6. 로그 모니터링(`/admin/audit-logs`) 화면에서 감사 로그 필터 조회

## 7.4 Seed 스냅샷 갱신

```bash
cd backend
.venv/bin/python scripts/export_seed_snapshot.py
```

- 현재 `backend/app.db` 데이터를 `app/services/seed_snapshot.json`으로 내보냅니다.

---

## 8. 주요 설정

`backend/.env` 예시:

```env
APP_NAME=CorpBoard API
APP_ENV=development
SECRET_KEY=change-me-in-production
DEFAULT_ADMIN_PASSWORD=admin1234
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite+aiosqlite:///./app.db
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=25
CORS_ORIGINS=http://localhost:5173
CORS_ALLOW_CREDENTIALS=true
LOGIN_MAX_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_SECONDS=300
LOGIN_LOCK_SECONDS=300
LOGIN_MAX_TRACKED_KEYS=10000
```

---

## 9. 검증 커맨드

```bash
cd frontend && npm run build
python3 -m compileall backend/app
```

---

## 10. 현재 제약/향후 개선 제안

1. 메뉴 권한은 메뉴 타겟 경로 기반 정책이며, 더 세밀한 리소스 단위 RBAC는 미구현
2. DB 마이그레이션은 Alembic 미적용 (런타임 patch 방식)
3. 댓글 대댓글(트리형) 기능은 현재 미구현
4. 테스트 자동화(pytest/e2e)는 아직 미구축
5. 운영환경에서는 초기 admin 비밀번호를 환경변수화하는 것을 권장
