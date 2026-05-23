export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] text-sm">Memuat...</p>
      </div>
    </div>
  )
}
