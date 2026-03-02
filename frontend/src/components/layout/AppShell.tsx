import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import { SidebarNav } from '@/components/layout/SidebarNav'
import { TopHeader } from '@/components/layout/TopHeader'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import type { NavigationMenuGroup } from '@/types/domain'

const SIDEBAR_COLLAPSE_KEY = 'corpboard_sidebar_collapsed'

function getTitle(pathname: string, search: string, groups: NavigationMenuGroup[]) {
  for (const group of groups) {
    const matchedItem = group.items.find((item) => item.target === pathname)
    if (matchedItem) {
      if (group.category_id === null) {
        return matchedItem.label
      }
      return `${group.category_label} > ${matchedItem.label}`
    }
  }

  const segments = pathname.split('/').filter(Boolean)
  const [first, second] = segments

  if (!first || first === 'dashboard') return '대시보드'
  if (first === 'boards') return `게시판 > ${second ?? ''}`
  if (first === 'posts') return `게시글 > ${second ?? ''}`
  if (first === 'stats') return `통계 > ${second ?? ''}`

  if (first === 'write') {
    const params = new URLSearchParams(search)
    const board = params.get('board')
    const postId = params.get('postId')
    if (postId && board) return `게시판 > ${board} > 수정`
    if (postId) return '게시글 > 수정'
    if (board) return `게시판 > ${board} > 글쓰기`
    return '게시글 > 글쓰기'
  }

  if (first === 'admin') {
    const adminLabelMap: Record<string, string> = {
      'audit-logs': '로그 모니터링',
      boards: '관리자-게시판',
      menus: '관리자-메뉴',
      users: '관리자-회원',
    }
    return `관리자 > ${adminLabelMap[second ?? ''] ?? second ?? ''}`
  }

  return segments.join(' > ')
}

function splitPathAndSearch(pathWithSearch: string) {
  const questionIndex = pathWithSearch.indexOf('?')
  if (questionIndex < 0) {
    return {
      pathname: pathWithSearch,
      search: '',
    }
  }

  return {
    pathname: pathWithSearch.slice(0, questionIndex),
    search: pathWithSearch.slice(questionIndex),
  }
}

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
  const title = useMemo(
    () => {
      const groups = navigationMenusQuery.data?.groups ?? []
      if (postDetailFromPath) {
        const { pathname, search } = splitPathAndSearch(postDetailFromPath)
        if (pathname && !pathname.startsWith('/posts/')) {
          return getTitle(pathname, search, groups)
        }
      }
      return getTitle(location.pathname, location.search, groups)
    },
    [location.pathname, location.search, location.state, navigationMenusQuery.data?.groups, postDetailFromPath]
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
