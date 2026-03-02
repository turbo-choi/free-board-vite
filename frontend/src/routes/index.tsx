import { lazy, Suspense, type ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { LoadingBlock } from '@/components/common/LoadingBlock'
import { AdminRoute } from '@/routes/AdminRoute'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

const AppShell = lazy(() =>
  import('@/components/layout/AppShell').then((module) => ({ default: module.AppShell }))
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage }))
)
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((module) => ({ default: module.SignupPage }))
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
)
const BoardListPage = lazy(() =>
  import('@/pages/BoardListPage').then((module) => ({ default: module.BoardListPage }))
)
const PostDetailPage = lazy(() =>
  import('@/pages/PostDetailPage').then((module) => ({ default: module.PostDetailPage }))
)
const PostWritePage = lazy(() =>
  import('@/pages/PostWritePage').then((module) => ({ default: module.PostWritePage }))
)
const StatsMonitoringPage = lazy(() =>
  import('@/pages/StatsMonitoringPage').then((module) => ({
    default: module.StatsMonitoringPage,
  }))
)
const AdminAuditLogsPage = lazy(() =>
  import('@/pages/admin/AdminAuditLogsPage').then((module) => ({
    default: module.AdminAuditLogsPage,
  }))
)
const AdminBoardsPage = lazy(() =>
  import('@/pages/admin/AdminBoardsPage').then((module) => ({
    default: module.AdminBoardsPage,
  }))
)
const AdminMenusPage = lazy(() =>
  import('@/pages/admin/AdminMenusPage').then((module) => ({ default: module.AdminMenusPage }))
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage }))
)

function withLazyFallback(element: ReactElement) {
  return (
    <Suspense fallback={<LoadingBlock label="페이지를 불러오는 중..." />}>
      {element}
    </Suspense>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={withLazyFallback(<LoginPage />)} />
      <Route path="/signup" element={withLazyFallback(<SignupPage />)} />

      <Route
        element={
          <ProtectedRoute>
            {withLazyFallback(<AppShell />)}
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={withLazyFallback(<DashboardPage />)} />
        <Route path="/boards/:slug" element={withLazyFallback(<BoardListPage />)} />
        <Route path="/posts/:id" element={withLazyFallback(<PostDetailPage />)} />
        <Route path="/write" element={withLazyFallback(<PostWritePage />)} />
        <Route
          path="/stats/monitoring"
          element={
            withLazyFallback(
              <AdminRoute target="/stats/monitoring">
                <StatsMonitoringPage />
              </AdminRoute>
            )
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            withLazyFallback(
              <AdminRoute target="/admin/audit-logs">
                <AdminAuditLogsPage />
              </AdminRoute>
            )
          }
        />
        <Route
          path="/admin/boards"
          element={
            withLazyFallback(
              <AdminRoute target="/admin/boards">
                <AdminBoardsPage />
              </AdminRoute>
            )
          }
        />
        <Route
          path="/admin/menus"
          element={
            withLazyFallback(
              <AdminRoute target="/admin/menus">
                <AdminMenusPage />
              </AdminRoute>
            )
          }
        />
        <Route
          path="/admin/users"
          element={
            withLazyFallback(
              <AdminRoute target="/admin/users">
                <AdminUsersPage />
              </AdminRoute>
            )
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
