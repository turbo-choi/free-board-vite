import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AdminRoute } from '@/routes/AdminRoute'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminBoardsPage } from '@/pages/admin/AdminBoardsPage'
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage'
import { AdminMenusPage } from '@/pages/admin/AdminMenusPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { BoardListPage } from '@/pages/BoardListPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { PostDetailPage } from '@/pages/PostDetailPage'
import { PostWritePage } from '@/pages/PostWritePage'
import { StatsMonitoringPage } from '@/pages/StatsMonitoringPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/boards/:slug" element={<BoardListPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/write" element={<PostWritePage />} />
        <Route
          path="/stats/monitoring"
          element={
            <AdminRoute target="/stats/monitoring">
              <StatsMonitoringPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <AdminRoute target="/admin/audit-logs">
              <AdminAuditLogsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/boards"
          element={
            <AdminRoute target="/admin/boards">
              <AdminBoardsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/menus"
          element={
            <AdminRoute target="/admin/menus">
              <AdminMenusPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute target="/admin/users">
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
