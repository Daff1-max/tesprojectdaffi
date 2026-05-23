import { AlertCircle } from 'lucide-react'

export function DemoDisclaimer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border-t border-[var(--bg-border)] text-xs text-[var(--text-muted)]">
      <AlertCircle size={12} className="shrink-0 text-[var(--risk-medium)]" />
      <span>
        Data pada aplikasi ini adalah <strong className="text-[var(--text-secondary)]">simulasi</strong> untuk tujuan demonstrasi. Bukan data resmi BPBD atau instansi pemerintah.
      </span>
    </div>
  )
}
