import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/common/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import { useUsersQuery, useUpdateUserActiveMutation, useUpdateUserRoleMutation } from '@/features/users/queries'
import { useAuth } from '@/hooks/useAuth'
import { toApiError } from '@/lib/api'
import type { Role, User } from '@/types/domain'

export function AdminUsersPage() {
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const usersQuery = useUsersQuery({ q: q || undefined, page, size: 10 })
  const navigationMenusQuery = useNavigationMenusQuery()
  const roleMutation = useUpdateUserRoleMutation()
  const activeMutation = useUpdateUserActiveMutation()
  const userMenuAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, '/admin/users'),
    [navigationMenusQuery.data?.groups]
  )
  const canWrite = userMenuAccess.canWrite || user?.role === 'ADMIN'

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      { accessorKey: 'name', header: '이름' },
      { accessorKey: 'email', header: '이메일' },
      {
        accessorKey: 'role',
        header: '역할',
        cell: ({ row }) => (
          <select
            className="h-9 rounded-md border border-input bg-card px-2 text-xs"
            value={row.original.role}
            disabled={!canWrite}
            onChange={async (event) => {
              try {
                await roleMutation.mutateAsync({
                  id: row.original.id,
                  role: event.target.value as Role,
                })
                toast.success('역할이 변경되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
          >
            <option value="USER">USER</option>
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        ),
      },
      {
        id: 'active',
        header: '활성',
        cell: ({ row }) => (
          <Switch
            checked={row.original.is_active}
            disabled={!canWrite}
            onCheckedChange={async (next) => {
              try {
                await activeMutation.mutateAsync({ id: row.original.id, isActive: next })
                toast.success('활성 상태가 변경되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
          />
        ),
      },
    ],
    [activeMutation, canWrite, roleMutation]
  )

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(event) => {
            setQ(event.target.value)
            setPage(1)
          }}
          placeholder="이름 또는 이메일 검색"
        />
      </div>

      <DataTable data={usersQuery.data?.items ?? []} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {Math.max(1, Math.ceil((usersQuery.data?.total ?? 0) / 10))}
        </span>
        <Button
          variant="outline"
          disabled={(usersQuery.data?.total ?? 0) <= page * 10}
          onClick={() => setPage((prev) => prev + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
