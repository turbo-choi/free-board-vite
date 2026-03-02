# AGENTS.md

## Module Context
- `frontend/src/components`는 재사용 UI 구성 요소를 담당한다.
- 하위 영역:
  - `ui`: shadcn 기반 기본 컴포넌트
  - `layout`: 앱 셸, 사이드바, 헤더
  - `common`: 테이블/로딩/빈 상태 등 공통 블록
  - `post`, `feedback`: 도메인 공용 뷰 컴포넌트

## Tech Stack & Constraints
- React + TypeScript + TailwindCSS + shadcn/ui
- 스타일은 토큰(`src/styles/tokens.css`)과 글로벌 규칙(`src/styles/globals.css`)을 기준으로 유지한다.
- 컴포넌트는 가능한 프레젠테이셔널하게 유지하되, `layout` 계층의 화면 전역 상태(예: 내비게이션/프로필) 조회는 허용한다.
- 아이콘은 `lucide-react`와 프로젝트 레지스트리(`features/menus/iconRegistry.ts`)를 활용한다.

## Implementation Patterns
- 공통 UI는 `ui/`에 두고 variant 기반(`cva`) 패턴을 재사용한다.
- 페이지 조합용 레이아웃은 `layout/`에서 관리하고 라우트 컨텍스트(`location`, `state`)를 명확히 처리한다.
- 테이블/폼/모달은 props 기반으로 제어하고 외부 훅에서 상태를 주입한다.
- 접근성:
  - 버튼/입력은 명확한 라벨과 포커스 스타일을 유지한다.
  - 키보드 이벤트 처리 시 조합 입력(`isComposing`)을 고려한다.

## Testing Strategy
- 빌드 검증:
  - `cd frontend && npm run build`
- 수동 검증:
  - 데스크톱/모바일 사이드바 열림/접힘 동작 확인
  - 로딩/빈 상태/오류 상태 컴포넌트 렌더링 확인
  - 게시글 목록, 상세, 작성 폼에서 상호작용 흐름 확인

## Local Golden Rules

### Do
- 시각 표현과 데이터 로직을 분리한다.
- 재사용 가능한 컴포넌트는 작은 단위로 나누고 props 계약을 명확히 유지한다.
- 클래스 조합은 기존 유틸(`cn`)과 패턴을 따른다.

### Don't
- `useQuery/useMutation` 패턴을 우회해 axios를 컴포넌트에서 직접 호출하지 않는다.
- 같은 UI 패턴을 페이지마다 중복 구현하지 않는다.
- 스타일 토큰을 우회하는 임의 인라인 스타일 남발을 피한다.
