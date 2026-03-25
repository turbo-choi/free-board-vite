import type { NavigationMenuGroup } from '@/types/domain'

import { buildHeaderSearchContext, getHeaderTitle } from '@/components/layout/headerContext'

const groups: NavigationMenuGroup[] = [
  {
    category_id: null,
    category_label: '주요',
    order: 0,
    items: [{ id: 1, label: 'Dashboard', icon: null, type: 'link', target: '/dashboard', order: 0, category_id: null, can_write: false }],
  },
  {
    category_id: 2,
    category_label: '게시판',
    order: 1,
    items: [{ id: 2, label: '공지사항', icon: null, type: 'link', target: '/boards/notice', order: 0, category_id: 2, can_write: true }],
  },
]

describe('getHeaderTitle', () => {
  it('uses human-readable board labels for write pages', () => {
    expect(
      getHeaderTitle({
        pathname: '/write',
        search: '?board=notice',
        groups,
      })
    ).toBe('게시판 > 공지사항 > 글쓰기')
  })

  it('uses a readable fallback for direct post detail links', () => {
    expect(
      getHeaderTitle({
        pathname: '/posts/5',
        search: '',
        groups,
      })
    ).toBe('게시글 상세')
  })
})

describe('buildHeaderSearchContext', () => {
  it('returns board search context for board pages and preserves query', () => {
    expect(
      buildHeaderSearchContext({
        pathname: '/boards/notice',
        search: '?q=Smoke%20Post',
        groups,
      })
    ).toEqual({
      targetPath: '/boards/notice',
      query: 'Smoke Post',
      placeholder: '공지사항 게시글 검색',
    })
  })

  it('hides header search when the route has no board context', () => {
    expect(
      buildHeaderSearchContext({
        pathname: '/dashboard',
        search: '',
        groups,
      })
    ).toBeNull()
  })
})
