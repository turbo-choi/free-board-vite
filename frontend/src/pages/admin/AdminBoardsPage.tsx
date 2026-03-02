import { useMemo, useState } from 'react'
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
  useBoardsQuery,
  useCreateBoardMutation,
  useDeleteBoardMutation,
  useUpdateBoardMutation,
} from '@/features/boards/queries'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import { useAuth } from '@/hooks/useAuth'
import { toApiError } from '@/lib/api'
import type { Board } from '@/types/domain'

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  settings_json: {
    allowAnonymous: false,
    allowAttachment: true,
    allowPin: true,
  },
}

export function AdminBoardsPage() {
  const { user } = useAuth()
  const boardsQuery = useBoardsQuery()
  const navigationMenusQuery = useNavigationMenusQuery()
  const createMutation = useCreateBoardMutation()
  const updateMutation = useUpdateBoardMutation()
  const deleteMutation = useDeleteBoardMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null)
  const [form, setForm] = useState(defaultForm)
  const adminBoardsAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, '/admin/boards'),
    [navigationMenusQuery.data?.groups]
  )
  const canWrite = adminBoardsAccess.canWrite || user?.role === 'ADMIN'

  const columns: ColumnDef<Board>[] = useMemo(
    () => [
      { accessorKey: 'name', header: '이름' },
      { accessorKey: 'slug', header: '슬러그' },
      {
        id: 'settings',
        header: '설정',
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.settings_json.allowAttachment ? <Badge>첨부</Badge> : null}
            {row.original.settings_json.allowPin ? <Badge variant="warning">고정</Badge> : null}
            {row.original.settings_json.allowAnonymous ? <Badge variant="secondary">익명</Badge> : null}
          </div>
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
              onClick={(event) => {
                event.stopPropagation()
                setEditingBoard(row.original)
                setForm({
                  name: row.original.name,
                  slug: row.original.slug,
                  description: row.original.description ?? '',
                  settings_json: row.original.settings_json,
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
              onClick={(event) => {
                event.stopPropagation()
                setDeletingBoard(row.original)
                setDeleteOpen(true)
              }}
            >
              삭제
            </Button>
          </div>
        ),
      },
    ],
    [canWrite]
  )

  async function submitBoard() {
    if (!canWrite) {
      toast.error('쓰기 권한이 없습니다.')
      return
    }
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('이름과 슬러그를 입력하세요.')
      return
    }

    try {
      if (editingBoard) {
        await updateMutation.mutateAsync({
          id: editingBoard.id,
          payload: {
            name: form.name,
            slug: form.slug,
            description: form.description || null,
            settings_json: form.settings_json,
          },
        })
        toast.success('게시판이 수정되었습니다.')
      } else {
        await createMutation.mutateAsync({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          settings_json: form.settings_json,
        })
        toast.success('게시판이 생성되었습니다.')
      }
      setModalOpen(false)
      setEditingBoard(null)
      setForm(defaultForm)
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex justify-end">
        <Button
          disabled={!canWrite}
          onClick={() => {
            setEditingBoard(null)
            setForm(defaultForm)
            setModalOpen(true)
          }}
        >
          게시판 추가
        </Button>
      </div>

      <DataTable data={boardsQuery.data ?? []} columns={columns} />

      <FadeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingBoard ? '게시판 수정' : '게시판 추가'}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={submitBoard}
              disabled={!canWrite || createMutation.isPending || updateMutation.isPending}
            >
              저장
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>이름</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>슬러그</Label>
            <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>설명</Label>
            <Input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          <div className="space-y-2 rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">익명 허용</span>
              <Switch
                checked={form.settings_json.allowAnonymous}
                disabled={!canWrite}
                onCheckedChange={(value) =>
                  setForm({
                    ...form,
                    settings_json: { ...form.settings_json, allowAnonymous: value },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">첨부 허용</span>
              <Switch
                checked={form.settings_json.allowAttachment}
                disabled={!canWrite}
                onCheckedChange={(value) =>
                  setForm({
                    ...form,
                    settings_json: { ...form.settings_json, allowAttachment: value },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">고정 허용</span>
              <Switch
                checked={form.settings_json.allowPin}
                disabled={!canWrite}
                onCheckedChange={(value) =>
                  setForm({
                    ...form,
                    settings_json: { ...form.settings_json, allowPin: value },
                  })
                }
              />
            </div>
          </div>
        </div>
      </FadeModal>

      <ConfirmDialog
        open={deleteOpen}
        title="게시판을 삭제할까요?"
        description={deletingBoard ? `${deletingBoard.name} 게시판이 삭제됩니다.` : undefined}
        onCancel={() => {
          setDeleteOpen(false)
          setDeletingBoard(null)
        }}
        onConfirm={async () => {
          if (!deletingBoard) return
          try {
            await deleteMutation.mutateAsync(deletingBoard.id)
            toast.success('게시판이 삭제되었습니다.')
          } catch (error) {
            toast.error(toApiError(error).message)
          } finally {
            setDeleteOpen(false)
            setDeletingBoard(null)
          }
        }}
      />
    </div>
  )
}
