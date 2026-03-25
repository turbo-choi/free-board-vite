import { getMenuAccess } from '@/features/menus/permissions'
import type { NavigationMenuGroup } from '@/types/domain'

const groups: NavigationMenuGroup[] = [
  {
    category_id: 1,
    category_label: '관리',
    order: 1,
    items: [
      {
        id: 10,
        label: '메뉴 관리',
        icon: 'menu-square',
        type: 'link',
        target: '/admin/menus',
        order: 1,
        category_id: 1,
        can_write: true,
      },
      {
        id: 11,
        label: '로그 모니터링',
        icon: 'activity',
        type: 'link',
        target: '/admin/audit-logs',
        order: 2,
        category_id: 1,
        can_write: false,
      },
    ],
  },
]

describe('getMenuAccess', () => {
  it('returns write access for known writable targets', () => {
    expect(getMenuAccess(groups, '/admin/menus')).toEqual({ canRead: true, canWrite: true })
  })

  it('returns read-only access for known read-only targets', () => {
    expect(getMenuAccess(groups, '/admin/audit-logs')).toEqual({ canRead: true, canWrite: false })
  })

  it('returns no access for missing targets', () => {
    expect(getMenuAccess(groups, '/admin/users')).toEqual({ canRead: false, canWrite: false })
  })
})
