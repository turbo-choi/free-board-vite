import { Inbox } from 'lucide-react'

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="glass rounded-xl border border-dashed border-border p-12 text-center animate-fadeIn">
      <Inbox className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}
