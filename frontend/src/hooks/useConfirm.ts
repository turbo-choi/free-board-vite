import { useState } from 'react'

export function useConfirm() {
  const [open, setOpen] = useState(false)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
      setOpen(true)
    })

  const onConfirm = (value: boolean) => {
    resolver?.(value)
    setOpen(false)
    setResolver(null)
  }

  return { open, confirm, onConfirm }
}
