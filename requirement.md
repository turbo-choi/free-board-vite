# Requirement

## FR (Functional Requirements)
1. 대시보드의 `Quick Links` 영역은 `Recent Notices`처럼 제목과 목록 영역이 분리되어 보여야 한다.
2. 퀵 링크 샘플 항목은 클릭 가능한 링크로 표시되어야 한다.
3. 퀵 링크 샘플 항목의 링크 URL은 모두 `https://www.google.com`으로 연결되어야 한다.

## NFR (Non-Functional Requirements)
1. 기존 대시보드 반응형 레이아웃(`xl` 3열 구성)을 유지한다.
2. 다크/화이트 모드에서 기존 토큰 기반 스타일과 충돌이 없어야 한다.
3. 타입스크립트 빌드가 통과해야 한다.

## Scope
- 포함:
  - 프론트엔드 대시보드 퀵 링크 UI 구조 변경
  - 퀵 링크 샘플 항목의 링크 URL 반영
- 제외:
  - 백엔드/API 변경
  - 메뉴/권한/통계 기능 변경

## Constraints
1. 변경은 최소 범위로 수행한다.
2. 기존 `DashboardPage`의 다른 카드/공지 목록 동작은 유지한다.
3. 링크는 외부 사이트로 이동 가능하도록 구현한다.

## Acceptance
1. 대시보드에서 `Quick Links` 제목이 목록 컨테이너와 분리되어 보인다.
2. 각 샘플 링크 클릭 시 `google.com`으로 이동한다.
3. `cd frontend && npm run build`가 성공한다.

## Risks
1. 외부 링크 이동 시 현재 탭 이탈이 발생할 수 있다.
2. 스타일 클래스 변경 시 카드 간 간격/정렬이 미세하게 달라질 수 있다.

## Changes
- 2026-03-06: 대시보드 퀵 링크 UI 분리 및 샘플 URL 통일 요구사항 추가.
