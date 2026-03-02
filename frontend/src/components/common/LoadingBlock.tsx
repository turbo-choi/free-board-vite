export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="glass rounded-xl border border-border/60 p-10 text-center text-sm text-muted-foreground animate-fadeIn">
      {label}
    </div>
  )
}
