import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { LoadingBlock } from '@/components/common/LoadingBlock'
import { PostEditorForm } from '@/components/post/PostEditorForm'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBoardsQuery } from '@/features/boards/queries'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import { useCreatePostMutation, usePostDetailQuery, useUpdatePostMutation } from '@/features/posts/queries'
import { useAuth } from '@/hooks/useAuth'
import { attachmentsApi, toApiError } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { Attachment } from '@/types/domain'

export function PostWritePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const boardSlug = searchParams.get('board')
  const postId = Number(searchParams.get('postId') ?? 0)

  const boardsQuery = useBoardsQuery()
  const postQuery = usePostDetailQuery(postId)
  const navigationMenusQuery = useNavigationMenusQuery()

  const createMutation = useCreatePostMutation()
  const updateMutation = useUpdatePostMutation()

  const boardIdFromSlug = useMemo(() => {
    if (!boardsQuery.data || !boardSlug) return 0
    return boardsQuery.data.find((board) => board.slug === boardSlug)?.id ?? 0
  }, [boardsQuery.data, boardSlug])

  const effectiveBoardSlug = boardSlug ?? postQuery.data?.board_slug ?? null
  const boardTarget = effectiveBoardSlug ? `/boards/${effectiveBoardSlug}` : ''
  const boardAccess = useMemo(
    () => getMenuAccess(navigationMenusQuery.data?.groups, boardTarget),
    [boardTarget, navigationMenusQuery.data?.groups]
  )
  const canWriteBoard = boardAccess.canWrite || (user?.role === 'ADMIN' && !boardAccess.canRead)
  const canPinByRole = user?.role === 'STAFF' || user?.role === 'ADMIN'

  const [form, setForm] = useState({
    boardId: 0,
    title: '',
    content: '',
    isPinned: false,
    files: [] as File[],
  })

  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [deletingAttachmentIds, setDeletingAttachmentIds] = useState<number[]>([])

  useEffect(() => {
    if (!boardsQuery.data?.length) return
    setForm((prev) => ({
      ...prev,
      boardId: prev.boardId || boardIdFromSlug || boardsQuery.data[0].id,
    }))
  }, [boardIdFromSlug, boardsQuery.data])

  useEffect(() => {
    if (!postQuery.data) return
    setForm((prev) => ({
      ...prev,
      boardId: postQuery.data.board_id,
      title: postQuery.data.title,
      content: postQuery.data.content,
      isPinned: postQuery.data.is_pinned,
    }))
    setExistingAttachments(postQuery.data.attachments)
    setDeletingAttachmentIds([])
  }, [postQuery.data])

  function toggleDeleteAttachment(id: number) {
    setDeletingAttachmentIds((prev) =>
      prev.includes(id) ? prev.filter((target) => target !== id) : [...prev, id]
    )
  }

  async function onSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('제목과 내용을 입력하세요.')
      return
    }

    try {
      if (postId > 0) {
        const updated = await updateMutation.mutateAsync({
          id: postId,
          payload: {
            board_id: form.boardId,
            title: form.title.trim(),
            content: form.content.trim(),
            ...(canPinByRole ? { is_pinned: form.isPinned } : {}),
          },
        })

        if (deletingAttachmentIds.length > 0) {
          await Promise.all(deletingAttachmentIds.map((attachmentId) => attachmentsApi.remove(attachmentId)))
        }

        if (form.files.length > 0) {
          await Promise.all(form.files.map((file) => attachmentsApi.upload(updated.id, file)))
        }

        await queryClient.invalidateQueries({ queryKey: ['post', updated.id] })
        await queryClient.invalidateQueries({ queryKey: ['posts'] })

        toast.success('게시글이 수정되었습니다.')
        navigate(`/posts/${updated.id}`, {
          state: {
            fromPath: `/boards/${updated.board_slug}`,
          },
        })
        return
      }

      const created = await createMutation.mutateAsync({
        board_id: form.boardId,
        title: form.title.trim(),
        content: form.content.trim(),
        is_pinned: canPinByRole ? form.isPinned : false,
      })

      if (form.files.length > 0) {
        await Promise.all(form.files.map((file) => attachmentsApi.upload(created.id, file)))
      }

      toast.success('게시글이 등록되었습니다.')
      navigate(`/posts/${created.id}`, {
        state: {
          fromPath: `/boards/${created.board_slug}`,
        },
      })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  if (boardsQuery.isLoading || (postId > 0 && postQuery.isLoading) || navigationMenusQuery.isLoading) {
    return <LoadingBlock />
  }

  if (!boardsQuery.data?.length) {
    return <div className="text-sm text-muted-foreground">게시판 데이터가 없습니다.</div>
  }

  if (!canWriteBoard) {
    return <EmptyState title="쓰기 권한이 없습니다." description="관리자에게 권한을 요청하세요." />
  }

  return (
    <Card className="mx-auto max-w-4xl animate-fadeIn">
      <CardHeader>
        <CardTitle>{postId > 0 ? '게시글 수정' : '게시글 작성'}</CardTitle>
      </CardHeader>
      <CardContent>
        <PostEditorForm
          boards={boardsQuery.data}
          value={form}
          saving={createMutation.isPending || updateMutation.isPending}
          existingAttachments={existingAttachments}
          deletingAttachmentIds={deletingAttachmentIds}
          onToggleDeleteAttachment={toggleDeleteAttachment}
          onChange={setForm}
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  )
}
