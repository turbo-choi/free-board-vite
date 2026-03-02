# CorpBoard Fullstack

사내 게시판(공지/자유/자료실/Q&A) + 통계 모니터링 + 감사 로그 모니터링 데모 웹 앱입니다.

- Frontend: React(Vite) + TypeScript + Tailwind + shadcn/ui
- Backend: FastAPI + Pydantic v2 + SQLAlchemy Async + SQLite

## 문서

- 상세 문서: [`docs/project_documentation.md`](./docs/project_documentation.md)
- 변경 이력: [`CHANGELOG.md`](./CHANGELOG.md)

## 프로젝트 구조

```text
free-board-vite/
  frontend/
  backend/
  docs/
  design-sample-stitch/
  README.md
```

## Backend 실행

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Health check: `http://localhost:8000/health`
- API base: `http://localhost:8000/api`
- DB 파일: `backend/app.db`
- 앱 시작 시 `create_all + 런타임 schema patch` 수행
- seed 정책:
  - 초기 부트스트랩(사실상 빈 DB)에서만 기본 seed 적용
  - 운영 데이터가 있으면 기존 메뉴/라벨/게시글 데이터를 덮어쓰지 않음

## Seed 데이터 관리

- seed 스냅샷 파일: `backend/app/services/seed_snapshot.json`
- 현재 DB를 seed 스냅샷으로 갱신:

```bash
cd backend
.venv/bin/python scripts/export_seed_snapshot.py
```

## Frontend 실행

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

- 기본 주소: `http://localhost:5173`
- Vite proxy: `/api` -> `http://localhost:8000`

## 인증 정책 (최신)

1. 회원가입: `POST /api/auth/signup`
2. 로그인: `POST /api/auth/login`
3. 로그인은 **가입된 계정만 가능**
4. 기존 자동 계정 생성 기능은 제거됨

초기 관리자 시드 계정:

- 이메일: `admin@corp.com`
- 비밀번호: `admin1234`

## 주요 기능

1. 게시판/게시글/댓글/첨부 CRUD
2. 첨부파일 드래그앤드롭 업로드 및 다운로드
3. 메뉴/라벨(분류) 관리 및 순서 조정
4. 화면별 역할 권한(`USER/STAFF/ADMIN`) 읽기/쓰기 설정
5. 핀(공지 고정): `STAFF`, `ADMIN`만 허용
6. 통계 모니터링(월/기간별 일일 지표 그래프 + 게시판 분포)
7. 감사 로그 자동 기록 + 관리자 로그 모니터링 화면
8. 다크/화이트 모드, 내정보(비밀번호 변경/탈퇴/통계)
9. 검색 필터 UX: 게시판 목록/로그 모니터링 검색어는 Enter 입력 시 조회

## 주요 API 요약

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

## 빌드 검증

```bash
cd frontend && npm run build
python3 -m compileall backend/app
```

## 환경 변수

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
