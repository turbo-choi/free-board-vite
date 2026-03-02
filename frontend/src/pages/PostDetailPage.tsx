import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { CommentList } from '@/components/post/CommentList'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDeletePostMutation, usePostDetailQuery } from '@/features/posts/queries'
import { useNavigationMenusQuery } from '@/features/menus/queries'
import { getMenuAccess } from '@/features/menus/permissions'
import {
  useCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from '@/features/comments/queries'
import { useAuth } from '@/hooks/useAuth'
import { attachmentsApi, toApiError } from '@/lib/api'
import { formatApiDate } from '@/lib/datetime'

export function PostDetailPage() {
  const { id } = useParams()
  const postId = Number(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [deleteOpen, setDeleteOpen] = useState(false)

  const postQuery = usePostDetailQuery(postId)
  const commentsQuery = useCommentsQuery(postId)
  const navigationMenusQuery = useNavigationMenusQuery()

  const deletePostMutation = useDeletePostMutation()
  const createCommentMutation = useCreateCommentMutation(postId)
  const updateCommentMutation = useUpdateCommentMutation(postId)
  const deleteCommentMutation = useDeleteCommentMutation(postId)

  const canManagePost = useMemo(() => {
    if (!postQuery.data || !user) return false
    return postQuery.data.author_id === user.id || user.role === 'ADMIN'
  }, [postQuery.data, user])
  const boardAccess = useMemo(() => {
    if (!postQuery.data) return { canRead: false, canWrite: false }
    return getMenuAccess(navigationMenusQuery.data?.groups, `/boards/${postQuery.data.board_slug}`)
  }, [navigationMenusQuery.data?.groups, postQuery.data])
  const canReadBoard = boardAccess.canRead || user?.role === 'ADMIN'
  const canWriteBoard = boardAccess.canWrite || (user?.role === 'ADMIN' && !boardAccess.canRead)

  if (postQuery.isLoading || commentsQuery.isLoading || navigationMenusQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">로딩 중...</div>
  }

  if (!postQuery.data) {
    return <div className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</div>
  }

  const post = postQuery.data

  if (!canReadBoard) {
    return <div className="text-sm text-muted-foreground">읽기 권한이 없습니다.</div>
  }

  const fromPath = (location.state as { fromPath?: string } | null)?.fromPath
  const backPath = fromPath && !fromPath.startsWith('/posts/') ? fromPath : `/boards/${post.board_slug}`
  const handleBack = () => {
    navigate(backPath)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <Button variant="ghost" className="gap-1 px-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{post.board_name}</Badge>
                {post.is_pinned ? <Badge variant="warning">Pinned</Badge> : null}
              </div>
              <CardTitle>{post.title}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.author_name} · {formatApiDate(post.created_at, 'yyyy-MM-dd HH:mm')} · 조회 {post.view_count}
              </p>
            </div>
            {canManagePost && canWriteBoard ? (
              <div className="flex gap-2">
                <Link to={`/write?board=${post.board_slug}&postId=${post.id}`}>
                  <Button variant="outline">수정</Button>
                </Link>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  삭제
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <article className="whitespace-pre-wrap text-sm leading-7">{post.content}</article>

          {post.attachments.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border/70 bg-secondary/30 p-4">
              <p className="text-sm font-semibold">첨부파일</p>
              <ul className="space-y-1 text-sm">
                {post.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <a
                      className="text-primary hover:underline"
                      href={attachmentsApi.downloadUrl(attachment.id)}
                      download={attachment.file_name}
                    >
                      {attachment.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">댓글</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentList
            comments={commentsQuery.data ?? []}
            currentUser={user}
            canWrite={canWriteBoard}
            onCreate={async (content) => {
              try {
                await createCommentMutation.mutateAsync({ content })
                toast.success('댓글이 등록되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
            onUpdate={async (commentId, content) => {
              try {
                await updateCommentMutation.mutateAsync({ id: commentId, content })
                toast.success('댓글이 수정되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
            onDelete={async (commentId) => {
              try {
                await deleteCommentMutation.mutateAsync(commentId)
                toast.success('댓글이 삭제되었습니다.')
              } catch (error) {
                toast.error(toApiError(error).message)
              }
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="게시글을 삭제할까요?"
        description="삭제하면 복구할 수 없습니다."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deletePostMutation.mutateAsync(post.id)
            toast.success('게시글이 삭제되었습니다.')
            navigate(`/boards/${post.board_slug}`)
          } catch (error) {
            toast.error(toApiError(error).message)
          } finally {
            setDeleteOpen(false)
          }
        }}
      />
    </div>
  )
}
