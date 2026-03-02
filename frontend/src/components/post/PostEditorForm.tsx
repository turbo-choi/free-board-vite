import { useMemo } from 'react'
import { Paperclip, Trash2, Undo2 } from 'lucide-react'

import { AttachmentUploader } from '@/components/post/AttachmentUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import { attachmentsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Attachment, Board } from '@/types/domain'

interface PostEditorValue {
  boardId: number
  title: string
  content: string
  isPinned: boolean
  files: File[]
}

interface PostEditorFormProps {
  boards: Board[]
  value: PostEditorValue
  saving: boolean
  existingAttachments?: Attachment[]
  deletingAttachmentIds?: number[]
  onToggleDeleteAttachment?: (id: number) => void
  onChange: (next: PostEditorValue) => void
  onSubmit: () => void
}

export function PostEditorForm({
  boards,
  value,
  saving,
  existingAttachments = [],
  deletingAttachmentIds = [],
  onToggleDeleteAttachment,
  onChange,
  onSubmit,
}: PostEditorFormProps) {
  const { user } = useAuth()
  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === value.boardId),
    [boards, value.boardId]
  )
  const canPinByRole = user?.role === 'STAFF' || user?.role === 'ADMIN'

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="board">게시판</Label>
        <Input
          id="board"
          className="bg-secondary/20"
          value={selectedBoard?.name ?? ''}
          readOnly
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="제목을 입력하세요"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          value={value.content}
          onChange={(event) => onChange({ ...value, content: event.target.value })}
          className="min-h-[220px]"
          placeholder="내용을 입력하세요"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/30 p-3">
        <div>
          <p className="text-sm font-semibold">공지 고정</p>
          <p className="text-xs text-muted-foreground">스태프/어드민만 가능하며 게시판 고정 허용 시 사용됩니다.</p>
        </div>
        <Switch
          checked={value.isPinned}
          disabled={!selectedBoard?.settings_json.allowPin || !canPinByRole}
          onCheckedChange={(next) => onChange({ ...value, isPinned: next })}
        />
      </div>

      {existingAttachments.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-border/70 bg-secondary/20 p-3">
          <p className="text-sm font-semibold">기존 첨부파일</p>
          <ul className="space-y-1 text-sm">
            {existingAttachments.map((attachment) => {
              const markedDelete = deletingAttachmentIds.includes(attachment.id)

              return (
                <li
                  key={attachment.id}
                  className={cn(
                    'flex items-center justify-between rounded-md border border-border/60 px-3 py-2',
                    markedDelete && 'opacity-60 line-through'
                  )}
                >
                  <a
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                    href={attachmentsApi.downloadUrl(attachment.id)}
                    download={attachment.file_name}
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate">{attachment.file_name}</span>
                  </a>
                  {onToggleDeleteAttachment ? (
                    <Button
                      size="sm"
                      variant={markedDelete ? 'outline' : 'ghost'}
                      onClick={() => onToggleDeleteAttachment(attachment.id)}
                    >
                      {markedDelete ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
          {deletingAttachmentIds.length > 0 ? (
            <p className="text-xs text-amber-300">저장 시 선택된 첨부파일이 삭제됩니다.</p>
          ) : null}
        </div>
      ) : null}

      <AttachmentUploader files={value.files} onChange={(files) => onChange({ ...value, files })} />

      <div className="flex justify-end">
        <Button disabled={saving} onClick={onSubmit}>
          {saving ? '저장 중...' : '게시글 저장'}
        </Button>
      </div>
    </div>
  )
}
