import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AttachmentUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
}

function mergeFiles(prev: File[], incoming: File[]) {
  const map = new Map<string, File>()
  for (const file of [...prev, ...incoming]) {
    const key = `${file.name}-${file.size}-${file.lastModified}`
    map.set(key, file)
  }
  return Array.from(map.values())
}

export function AttachmentUploader({ files, onChange }: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleAdd(next: File[]) {
    if (next.length === 0) return
    onChange(mergeFiles(files, next))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">첨부파일</label>
      <div
        className={cn(
          'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/40 p-6 text-center transition hover:border-primary/40 hover:bg-primary/5',
          isDragging && 'border-primary/70 bg-primary/10'
        )}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
          setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleAdd(Array.from(event.dataTransfer.files ?? []))
        }}
      >
        <Upload className="h-6 w-6 text-primary" />
        <p className="text-sm font-medium">클릭하거나 파일을 드래그하여 업로드</p>
        <p className="text-xs text-muted-foreground">여러 파일 선택 가능</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(event) => {
            handleAdd(Array.from(event.target.files ?? []))
            event.currentTarget.value = ''
          }}
        />
      </div>
      {files.length > 0 ? (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <span className="truncate pr-2">{file.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange(
                    files.filter(
                      (target) =>
                        !(
                          target.name === file.name &&
                          target.size === file.size &&
                          target.lastModified === file.lastModified
                        )
                    )
                  )
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
