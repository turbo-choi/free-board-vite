import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import { buildHeaderSearchContext, getHeaderTitle } from '@/components/layout/headerContext'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { TopHeader } from '@/components/layout/TopHeader'
import { useNavigationMenusQuery } from '@/features/menus/queries'

const SIDEBAR_COLLAPSE_KEY = 'corpboard_sidebar_collapsed'

function readCollapsedState() {
  return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1'
}

export function AppShell() {
  const location = useLocation()
  const navigationMenusQuery = useNavigationMenusQuery()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const postDetailFromPath = useMemo(() => {
    if (!location.pathname.startsWith('/posts/')) return null
    const state = location.state as { fromPath?: string } | null
    return state?.fromPath ?? null
  }, [location.pathname, location.state])
  const groups = navigationMenusQuery.data?.groups ?? []
  const title = useMemo(
    () =>
      getHeaderTitle({
        pathname: location.pathname,
        search: location.search,
        groups,
        postDetailFromPath,
      }),
    [groups, location.pathname, location.search, postDetailFromPath]
  )
  const searchContext = useMemo(
    () =>
      buildHeaderSearchContext({
        pathname: location.pathname,
        search: location.search,
        groups,
        postDetailFromPath,
      }),
    [groups, location.pathname, location.search, postDetailFromPath]
  )

  useEffect(() => {
    setSidebarCollapsed(readCollapsedState())
  }, [])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, sidebarCollapsed ? '1' : '0')
  }, [sidebarCollapsed])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-full">
      <SidebarNav
        mobileOpen={mobileSidebarOpen}
        onMobileOpenChange={setMobileSidebarOpen}
        collapsed={sidebarCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          title={title}
          searchContext={searchContext}
          isSidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
