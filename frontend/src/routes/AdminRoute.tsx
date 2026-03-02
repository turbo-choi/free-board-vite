import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import { useAuth } from '@/hooks/useAuth'

export function AdminRoute({ children, target }: { children: ReactNode; target: string }) {
  const { isLoading, user } = useAuth()
  const menusQuery = useNavigationMenusQuery()
  const access = getMenuAccess(menusQuery.data?.groups, target)

  if (isLoading || menusQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">권한 확인 중...</div>
  }

  if (!access.canRead && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
