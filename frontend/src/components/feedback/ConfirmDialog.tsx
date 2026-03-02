import { Button } from '@/components/ui/button'
import { FadeModal } from '@/components/feedback/FadeModal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onConfirm,
  onCancel,
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <FadeModal
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rounded-lg border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
        이 작업은 되돌릴 수 없습니다.
      </div>
    </FadeModal>
  )
}
