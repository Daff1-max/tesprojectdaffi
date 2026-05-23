import { AlertTriangle } from 'lucide-react'

interface Props {
  message?: string
  onRetry?: () => void
}

export function ErrorFallback({ message = 'Terjadi kesalahan saat memuat data.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <AlertTriangle className="w-10 h-10 text-[var(--risk-high)]" />
      <p className="text-[var(--text-secondary)] text-sm max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Coba lagi
        </button>
      )}
    </div>
  )
}
