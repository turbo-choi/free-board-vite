import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'

import { DataTable } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FadeModal } from '@/components/feedback/FadeModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useCreateMenuCategoryMutation,
  useCreateMenuMutation,
  useDeleteMenuCategoryMutation,
  useDeleteMenuMutation,
  useMenuCategoriesQuery,
  useNavigationMenusQuery,
  useMenusQuery,
  useReorderMenuCategoriesMutation,
  useReorderMenusMutation,
  useUpdateMenuMutation,
} from '@/features/menus/queries'
import { MENU_ICON_OPTIONS, getMenuIcon } from '@/features/menus/iconRegistry'
import { getMenuAccess } from '@/features/menus/permissions'
import { useAuth } from '@/hooks/useAuth'
import { toApiError } from '@/lib/api'
import type { Menu, MenuCategory, Role } from '@/types/domain'

const roleOptions: Role[] = ['USER', 'STAFF', 'ADMIN']
const roleLabelMap: Record<Role, string> = {
  USER: '일반',
  STAFF: '스태프',
  ADMIN: '어드민',
}

const defaultForm = {
  label: '',
  icon: 'book-open',
  type: 'internal',
  target: '',
  order: 1,
  is_visible: true,
  category_id: null as number | null,
  is_admin_only: false,
  read_roles: ['USER', 'STAFF', 'ADMIN'] as Role[],
  write_roles: ['STAFF', 'ADMIN'] as Role[],
}

export function AdminMenusPage() {
  const { user } = useAuth()
  const menusQuery = useMenusQuery()
  const categoriesQuery = useMenuCategoriesQuery()
  const navigationMenusQuery = useNavigationMenusQuery()

  const createMutation = useCreateMenuMutation()
  const updateMutation = useUpdateMenuMutation()
  const deleteMutation = useDeleteMenuMutation()
  const reorderMutation = useReorderMenusMutation()

  const createCategoryMutation = useCreateMenuCategoryMutation()
  const deleteCategoryMutation = useDeleteMenuCategoryMutation()
  const reorderCategoriesMutation = useReorderMenuCategoriesMutation()

  const [menus, setMenus] = useState<Menu[]>([])
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false)
  const menuAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, '/admin/menus'),
    [navigationMenusQuery.data?.groups]
  )
  const canWrite = menuAccess.canWrite || user?.role === 'ADMIN'

  useEffect(() => {
    setMenus([...(menusQuery.data ?? [])].sort((a, b) => a.order - b.order))
  }, [menusQuery.data])

  useEffect(() => {
    setCategories([...(categoriesQuery.data ?? [])].sort((a, b) => a.order - b.order))
  }, [categoriesQuery.data])

  const categoryLabelMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const category of categories) {
      map.set(category.id, category.label)
    }
    return map
  }, [categories])

  const columns: ColumnDef<Menu>[] = useMemo(
    () => [
      { accessorKey: 'order', header: '순서' },
      { accessorKey: 'label', header: '라벨' },
      {
        id: 'icon',
        header: '아이콘',
        cell: ({ row }) => {
          const iconKey = row.original.icon
          const Icon = getMenuIcon(iconKey, row.original.target, row.original.type)
          return (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-4 w-4 text-foreground" />
              <span>{iconKey || '자동'}</span>
            </div>
          )
        },
      },
      { accessorKey: 'type', header: '타입' },
      { accessorKey: 'target', header: '타겟' },
      {
        id: 'category',
        header: '카테고리',
        cell: ({ row }) => row.original.category_label ?? '미분류',
      },
      {
        id: 'read_roles',
        header: '읽기 권한',
        cell: ({ row }) =>
          row.original.read_roles.map((role) => (
            <Badge key={`read-${row.original.id}-${role}`} variant={role === 'ADMIN' ? 'warning' : 'outline'} className="mr-1">
              {role}
            </Badge>
          )),
      },
      {
        id: 'write_roles',
        header: '쓰기 권한',
        cell: ({ row }) =>
          row.original.write_roles.map((role) => (
            <Badge key={`write-${row.original.id}-${role}`} variant={role === 'ADMIN' ? 'warning' : 'outline'} className="mr-1">
              {role}
            </Badge>
          )),
      },
      {
        id: 'visible',
        header: '가시성',
        cell: ({ row }) => (
          <Switch
            checked={row.original.is_visible}
            disabled={!canWrite}
            onCheckedChange={async (next) => {
              try {
                await updateMutation.mutateAsync({
                  id: row.original.id,
                  payload: { is_visible: next },
                })
                toast.success('가시성이 변경되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
          />
        ),
      },
      {
        id: 'action',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canWrite}
              onClick={() => {
                setEditingMenu(row.original)
                setForm({
                  label: row.original.label,
                  icon: row.original.icon ?? 'book-open',
                  type: row.original.type,
                  target: row.original.target,
                  order: row.original.order,
                  is_visible: row.original.is_visible,
                  category_id: row.original.category_id,
                  is_admin_only: row.original.is_admin_only,
                  read_roles: row.original.read_roles,
                  write_roles: row.original.write_roles,
                })
                setModalOpen(true)
              }}
            >
              수정
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!canWrite}
              onClick={() => {
                setDeletingMenu(row.original)
                setDeleteOpen(true)
              }}
            >
              삭제
            </Button>
          </div>
        ),
      },
    ],
    [canWrite, updateMutation]
  )

  async function saveMenu() {
    if (!canWrite) {
      toast.error('쓰기 권한이 없습니다.')
      return
    }
    if (!form.label.trim() || !form.target.trim()) {
      toast.error('라벨과 타겟을 입력하세요.')
      return
    }
    if (form.read_roles.length === 0) {
      toast.error('읽기 권한은 최소 1개 이상 선택해야 합니다.')
      return
    }
    if (form.write_roles.length === 0) {
      toast.error('쓰기 권한은 최소 1개 이상 선택해야 합니다.')
      return
    }

    try {
      const payload = {
        ...form,
        icon: form.icon || null,
        is_admin_only: form.read_roles.length === 1 && form.read_roles[0] === 'ADMIN',
      }
      if (editingMenu) {
        await updateMutation.mutateAsync({ id: editingMenu.id, payload })
        toast.success('메뉴가 수정되었습니다.')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('메뉴가 생성되었습니다.')
      }
      setModalOpen(false)
      setEditingMenu(null)
      setForm(defaultForm)
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  async function createCategory() {
    if (!canWrite) {
      toast.error('쓰기 권한이 없습니다.')
      return
    }
    if (!newCategoryLabel.trim()) {
      toast.error('카테고리명을 입력하세요.')
      return
    }

    try {
      const maxOrder = Math.max(0, ...categories.map((category) => category.order))
      await createCategoryMutation.mutateAsync({
        label: newCategoryLabel.trim(),
        order: maxOrder + 1,
        is_visible: true,
      })
      toast.success('카테고리가 생성되었습니다.')
      setNewCategoryLabel('')
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  function moveRow(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= menus.length) return

    const next = [...menus]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setMenus(next.map((menu, idx) => ({ ...menu, order: idx + 1 })))
  }

  function moveCategoryRow(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= categories.length) return

    const next = [...categories]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setCategories(next.map((category, idx) => ({ ...category, order: idx + 1 })))
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <p className="mb-2 text-sm font-semibold">메뉴 카테고리 관리</p>
        <div className="mb-3 flex gap-2">
          <Input
            value={newCategoryLabel}
            onChange={(event) => setNewCategoryLabel(event.target.value)}
            placeholder="카테고리명"
          />
          <Button onClick={createCategory} disabled={!canWrite || createCategoryMutation.isPending}>
            카테고리 추가
          </Button>
          <Button
            variant="outline"
            disabled={!canWrite || reorderCategoriesMutation.isPending || categories.length === 0}
            onClick={async () => {
              try {
                await reorderCategoriesMutation.mutateAsync(
                  categories.map((category, idx) => ({ id: category.id, order: idx + 1 }))
                )
                toast.success('카테고리 순서가 저장되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
          >
            카테고리 순서 저장
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                {index + 1}. {category.label}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => moveCategoryRow(index, -1)}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => moveCategoryRow(index, 1)}>
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canWrite}
                  onClick={() => {
                    setDeletingCategoryId(category.id)
                    setDeleteCategoryOpen(true)
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          disabled={!canWrite}
          onClick={() => {
            setEditingMenu(null)
            setForm(defaultForm)
            setModalOpen(true)
          }}
        >
          메뉴 추가
        </Button>
        <Button
          variant="outline"
          disabled={!canWrite || reorderMutation.isPending || menus.length === 0}
          onClick={async () => {
            try {
              await reorderMutation.mutateAsync(menus.map((menu, idx) => ({ id: menu.id, order: idx + 1 })))
              toast.success('메뉴 순서가 저장되었습니다.')
            } catch (error) {
              toast.error(toApiError(error).message)
            }
          }}
        >
          메뉴 순서 저장
        </Button>
      </div>

      <DataTable data={menus} columns={columns} />

      <div className="rounded-xl border border-border/70 bg-card/70 p-3">
        <p className="mb-2 text-sm font-semibold">빠른 메뉴 순서 변경</p>
        <div className="space-y-2">
          {menus.map((menu, index) => (
            <div key={menu.id} className="flex items-center justify-between rounded-md border border-border/60 p-2">
              <span className="text-sm">
                {index + 1}. {menu.label}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => moveRow(index, -1)}>
                  ↑
                </Button>
                <Button size="sm" variant="outline" disabled={!canWrite} onClick={() => moveRow(index, 1)}>
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FadeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingMenu ? '메뉴 수정' : '메뉴 추가'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button onClick={saveMenu} disabled={!canWrite}>
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>라벨</Label>
            <Input
              disabled={!canWrite}
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>타입</Label>
            <Input
              disabled={!canWrite}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>아이콘</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
              disabled={!canWrite}
            >
              {MENU_ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>타겟</Label>
            <Input
              disabled={!canWrite}
              value={form.target}
              onChange={(event) => setForm({ ...form, target: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>카테고리</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={form.category_id ?? ''}
              onChange={(event) =>
                setForm({
                  ...form,
                  category_id: event.target.value ? Number(event.target.value) : null,
                })
              }
              disabled={!canWrite}
            >
              <option value="">미분류</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>순서</Label>
            <Input
              type="number"
              value={form.order}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) || 1 })}
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border/70 p-2">
            <Label>읽기 권한</Label>
            <div className="flex flex-wrap gap-3">
              {roleOptions.map((role) => (
                <label key={`read-role-${role}`} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.read_roles.includes(role)}
                    disabled={!canWrite}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setForm((prev) => {
                        const nextReadRoles = checked
                          ? Array.from(new Set([...prev.read_roles, role]))
                          : prev.read_roles.filter((item) => item !== role)
                        let nextWriteRoles = prev.write_roles.filter((item) => nextReadRoles.includes(item))
                        if (nextWriteRoles.length === 0 && nextReadRoles.length > 0) {
                          const fallbackWriteRole = nextReadRoles.includes('STAFF')
                            ? 'STAFF'
                            : nextReadRoles[nextReadRoles.length - 1]
                          nextWriteRoles = [fallbackWriteRole]
                        }
                        return {
                          ...prev,
                          read_roles: nextReadRoles,
                          write_roles: nextWriteRoles,
                        }
                      })
                    }}
                  />
                  {roleLabelMap[role]} ({role})
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-border/70 p-2">
            <Label>쓰기 권한</Label>
            <div className="flex flex-wrap gap-3">
              {roleOptions.map((role) => {
                const enabled = form.read_roles.includes(role)
                return (
                  <label
                    key={`write-role-${role}`}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      disabled={!enabled || !canWrite}
                      aria-disabled={!enabled || !canWrite}
                      checked={form.write_roles.includes(role)}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setForm((prev) => ({
                          ...prev,
                          write_roles: checked
                            ? Array.from(new Set([...prev.write_roles, role]))
                            : prev.write_roles.filter((item) => item !== role),
                        }))
                      }}
                    />
                    {roleLabelMap[role]} ({role})
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">쓰기 권한은 읽기 권한에 포함된 역할만 선택할 수 있습니다.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 p-2">
            <span className="text-sm">가시성</span>
            <Switch
              checked={form.is_visible}
              disabled={!canWrite}
              onCheckedChange={(value) => setForm({ ...form, is_visible: value })}
            />
          </div>
          {form.category_id && !categoryLabelMap.has(form.category_id) ? (
            <p className="text-xs text-amber-300">선택한 카테고리가 없습니다. 저장 시 미분류로 이동될 수 있습니다.</p>
          ) : null}
        </div>
      </FadeModal>

      <ConfirmDialog
        open={deleteOpen}
        title="메뉴를 삭제할까요?"
        description={deletingMenu?.label}
        onCancel={() => {
          setDeleteOpen(false)
          setDeletingMenu(null)
        }}
        onConfirm={async () => {
          if (!deletingMenu) return
          try {
            await deleteMutation.mutateAsync(deletingMenu.id)
            toast.success('메뉴가 삭제되었습니다.')
          } catch (error) {
            toast.error(toApiError(error).message)
          } finally {
            setDeleteOpen(false)
            setDeletingMenu(null)
          }
        }}
      />

      <ConfirmDialog
        open={deleteCategoryOpen}
        title="카테고리를 삭제할까요?"
        description="하위 메뉴는 미분류로 이동됩니다."
        onCancel={() => {
          setDeleteCategoryOpen(false)
          setDeletingCategoryId(null)
        }}
        onConfirm={async () => {
          if (!deletingCategoryId) return
          try {
            await deleteCategoryMutation.mutateAsync(deletingCategoryId)
            toast.success('카테고리가 삭제되었습니다.')
          } catch (error) {
            toast.error(toApiError(error).message)
          } finally {
            setDeleteCategoryOpen(false)
            setDeletingCategoryId(null)
          }
        }}
      />
    </div>
  )
}
