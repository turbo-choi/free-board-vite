# Plan

## Goal
- 대시보드 `Quick Links` 섹션을 `Recent Notices`와 유사하게 제목과 목록 영역을 분리한 형태로 개선하고, 샘플 링크를 모두 `google.com`으로 연결한다.

## Architecture
- 대상: `frontend/src/pages/DashboardPage.tsx`
- 방식:
  1. `Quick Links` 블록을 카드 헤더 내 제목 구조에서, 섹션 제목 + 목록 카드 구조로 변경
  2. 샘플 링크 데이터를 배열로 정의해 반복 렌더링
  3. 모든 링크 `href`를 `https://www.google.com`으로 통일

## Interfaces
- Public API 변경 없음
- 백엔드 스키마/엔드포인트 변경 없음
- 라우트 변경 없음

## Steps
1. 요구사항 문서(`requirement.md`) 업데이트 확인
2. `DashboardPage`의 Quick Links UI 구조 변경
3. 샘플 항목 링크 URL 통일
4. `npm run build`로 프론트 빌드 검증
5. 변경사항을 작업 결과로 문서화

## Tests
1. 정적 검증: `cd frontend && npm run build`
2. 수동 확인:
   - 대시보드에서 `Quick Links` 제목/링크 목록 분리 렌더링 확인
   - 링크 클릭 시 `google.com` 이동 확인

## Rollback
1. `DashboardPage.tsx`의 Quick Links 섹션을 이전 카드 헤더/본문 구조로 되돌린다.
2. 문서(`requirement.md`, `plan.md`)의 변경 항목을 이전 상태로 되돌린다.

## Changes
- 2026-03-06: 대시보드 퀵 링크 섹션 레이아웃 개선 및 샘플 링크 URL 통일 작업 계획 추가.
