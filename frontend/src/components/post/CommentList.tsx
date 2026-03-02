import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatApiDate } from '@/lib/datetime'
import type { Comment, User } from '@/types/domain'

interface CommentListProps {
  comments: Comment[]
  currentUser: User | null
  canWrite: boolean
  onCreate: (content: string) => Promise<void>
  onUpdate: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function CommentList({ comments, currentUser, canWrite, onCreate, onUpdate, onDelete }: CommentListProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  return (
    <div className="space-y-4">
      {canWrite ? (
        <div className="flex gap-2">
          <Input
            placeholder="댓글을 입력하세요"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button
            onClick={async () => {
              if (!draft.trim()) return
              await onCreate(draft.trim())
              setDraft('')
            }}
          >
            등록
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">댓글 작성 권한이 없습니다.</p>
      )}

      <ul className="space-y-3">
        {comments.map((comment) => {
          const canEdit =
            currentUser?.id === comment.author.id || currentUser?.role === 'ADMIN'

          return (
            <li key={comment.id} className="rounded-xl border border-border/60 bg-card/70 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{comment.author.name}</span>
                <span>{formatApiDate(comment.created_at, 'yyyy-MM-dd HH:mm')}</span>
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Input
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!editingContent.trim()) return
                        await onUpdate(comment.id, editingContent.trim())
                        setEditingId(null)
                      }}
                    >
                      저장
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{comment.content}</p>
              )}

              {canWrite && canEdit && editingId !== comment.id ? (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(comment.id)
                      setEditingContent(comment.content)
                    }}
                  >
                    수정
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(comment.id)}>
                    삭제
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
