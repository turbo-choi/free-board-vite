import { useState } from 'react'
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FadeModal } from '@/components/feedback/FadeModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/providers/ThemeProvider'
import {
  useChangeMyPasswordMutation,
  useMyProfileQuery,
  useWithdrawMeMutation,
} from '@/features/users/queries'
import { toApiError } from '@/lib/api'
import { formatApiDate } from '@/lib/datetime'

interface TopHeaderProps {
  title: string
  isSidebarCollapsed: boolean
  onToggleSidebarCollapse: () => void
  onToggleMobileSidebar: () => void
}

export function TopHeader({
  title,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  onToggleMobileSidebar,
}: TopHeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [profileOpen, setProfileOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    nextPasswordConfirm: '',
  })

  const profileQuery = useMyProfileQuery(profileOpen)
  const changePasswordMutation = useChangeMyPasswordMutation()
  const withdrawMutation = useWithdrawMeMutation()

  async function submitPasswordChange() {
    if (!passwordForm.currentPassword.trim() || !passwordForm.nextPassword.trim()) {
      toast.error('현재 비밀번호와 새 비밀번호를 입력하세요.')
      return
    }
    if (passwordForm.nextPassword !== passwordForm.nextPasswordConfirm) {
      toast.error('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.nextPassword,
      })
      toast.success('비밀번호가 변경되었습니다.')
      setPasswordForm({ currentPassword: '', nextPassword: '', nextPasswordConfirm: '' })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  async function submitWithdraw() {
    try {
      await withdrawMutation.mutateAsync()
      toast.success('회원 탈퇴 처리되었습니다.')
      setWithdrawOpen(false)
      setProfileOpen(false)
      logout()
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary/70 hover:text-foreground lg:hidden"
            onClick={onToggleMobileSidebar}
            title="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="hidden rounded-md p-2 text-muted-foreground hover:bg-secondary/70 hover:text-foreground lg:inline-flex"
            onClick={onToggleSidebarCollapse}
            title={isSidebarCollapsed ? '메뉴 펼치기' : '메뉴 줄이기'}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-72 rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search notices, posts..."
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
            onClick={toggleTheme}
            title={theme === 'dark' ? '화이트 모드' : '다크 모드'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-secondary/70 sm:flex"
            onClick={() => setProfileOpen(true)}
            title="나의 정보"
          >
            <div>
              <p className="text-xs font-semibold leading-tight">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{user?.role}</p>
            </div>
          </button>
          <Button variant="outline" size="sm" className="sm:hidden" onClick={() => setProfileOpen(true)}>
            내정보
          </Button>

          <Button variant="outline" size="sm" onClick={logout}>
            로그아웃
          </Button>
        </div>
      </header>

      <FadeModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        title="나의 정보"
        description="계정 정보 조회 및 비밀번호 변경"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">이름:</span> {profileQuery.data?.user.name ?? user?.name}
            </p>
            <p>
              <span className="text-muted-foreground">이메일:</span> {profileQuery.data?.user.email ?? user?.email}
            </p>
            <p>
              <span className="text-muted-foreground">권한:</span> {profileQuery.data?.user.role ?? user?.role}
            </p>
            <p>
              <span className="text-muted-foreground">가입일:</span>{' '}
              {profileQuery.data?.user.created_at
                ? formatApiDate(profileQuery.data.user.created_at, 'yyyy-MM-dd HH:mm')
                : '-'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">로그인 횟수</p>
              <p className="text-xl font-bold">{profileQuery.data?.stats.login_count ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">나의 글 수</p>
              <p className="text-xl font-bold">{profileQuery.data?.stats.post_count ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">나의 댓글 수</p>
              <p className="text-xl font-bold">{profileQuery.data?.stats.comment_count ?? 0}</p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border/70 p-3">
            <p className="text-sm font-semibold">비밀번호 변경</p>
            <Input
              type="password"
              placeholder="현재 비밀번호"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
            <Input
              type="password"
              placeholder="새 비밀번호"
              value={passwordForm.nextPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, nextPassword: event.target.value }))}
            />
            <Input
              type="password"
              placeholder="새 비밀번호 확인"
              value={passwordForm.nextPasswordConfirm}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, nextPasswordConfirm: event.target.value }))
              }
            />
            <div className="flex justify-end">
              <Button onClick={submitPasswordChange} disabled={changePasswordMutation.isPending}>
                비밀번호 변경
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
              탈퇴하기
            </Button>
          </div>
        </div>
      </FadeModal>

      <ConfirmDialog
        open={withdrawOpen}
        title="정말 탈퇴하시겠습니까?"
        description="탈퇴 시 계정은 비활성화되며 즉시 로그아웃됩니다."
        onCancel={() => setWithdrawOpen(false)}
        onConfirm={submitWithdraw}
      />
    </>
  )
}
