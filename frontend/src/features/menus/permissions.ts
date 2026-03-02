import type { NavigationMenuGroup } from '@/types/domain'

export interface MenuAccess {
  canRead: boolean
  canWrite: boolean
}

export function getMenuAccess(groups: NavigationMenuGroup[] | undefined, target: string): MenuAccess {
  if (!groups?.length || !target) {
    return { canRead: false, canWrite: false }
  }

  for (const group of groups) {
    const item = group.items.find((entry) => entry.target === target)
    if (!item) continue
    return { canRead: true, canWrite: item.can_write }
  }

  return { canRead: false, canWrite: false }
}
