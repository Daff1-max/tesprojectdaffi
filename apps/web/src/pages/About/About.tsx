import { BookOpen, Database, Layers, Shield } from 'lucide-react'

export default function About() {
  return (
    <div className="h-full overflow-y-auto pb-12">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="text-[var(--accent-primary)]" size={22} />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Metodologi & Sumber Data</h1>
            <p className="text-sm text-[var(--text-muted)]">Tentang aplikasi ini</p>
          </div>
        </div>

        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-8 text-sm text-amber-200/80">
          <strong className="block mb-1">⚠ Data Simulasi</strong>
          Seluruh data dalam aplikasi ini — termasuk zona, sensor, dan riwayat banjir — adalah data sintetis yang
          dibuat untuk tujuan demonstrasi. Tidak ada hubungan dengan data resmi BPBD, BMKG, atau instansi pemerintah lain.
        </div>

        <div className="flex flex-col gap-6">
          <Section icon={<Database size={16} />} title="Sumber Data Demo">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Data zona (25 klaster) dihasilkan secara prosedural menggunakan grid 5×5 di dalam bounding box Jakarta Garden City
              (koordinat [106.9350, -6.2200] — [106.9600, -6.1950], WGS84). Elevasi, kapasitas drainase, dan frekuensi banjir
              divariasikan sesuai kedekatan zona dengan Kali Sunter dan kanal sekitarnya.
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2">
              Data sensor (40–60 unit) dan pembacaan 7 hari ke belakang (interval 5 menit) dibuat oleh script generasi data.
              Riwayat kejadian banjir (8 event, 2019–2024) mencerminkan pola historis nyata secara umum namun angka-angkanya
              adalah fiktif.
            </p>
          </Section>

          <Section icon={<Layers size={16} />} title="Metodologi Perhitungan Risiko">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
              Skor risiko (0–100) dihitung di server dengan formula tertimbang dari empat komponen:
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--bg-border)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--bg-elevated)]">
                  <tr>
                    <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Komponen</th>
                    <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Bobot</th>
                    <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Logika</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-border)] bg-[var(--bg-surface)]">
                  {[
                    ['Elevasi', '30%', 'Makin rendah → risiko makin tinggi (normalize terbalik)'],
                    ['Kapasitas Drainase', '25%', 'Kapasitas rendah → risiko naik'],
                    ['Frekuensi Historis', '25%', 'Makin sering banjir → risiko naik'],
                    ['Kepadatan Penduduk', '20%', 'Dampak sosial lebih besar'],
                  ].map(([c, w, l]) => (
                    <tr key={c}>
                      <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{c}</td>
                      <td className="px-3 py-2 text-[var(--accent-primary)] text-right font-bold">{w}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {([['Rendah', '0–25', '#22c55e'], ['Sedang', '26–50', '#eab308'], ['Tinggi', '51–75', '#f97316'], ['Kritis', '76–100', '#ef4444']] as const).map(([l, r, c]) => (
                <div key={l} className="flex items-center gap-2 p-2 rounded bg-[var(--bg-elevated)]">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: c }} />
                  <span className="text-[var(--text-secondary)]">{l}</span>
                  <span className="text-[var(--text-muted)] ml-auto">{r}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={<Shield size={16} />} title="Tech Stack">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Frontend', 'React 18 + TypeScript + Vite'],
                ['Peta', 'MapLibre GL JS (react-map-gl)'],
                ['Backend', 'Hono + Vercel Edge Functions'],
                ['State', 'Zustand + TanStack Query v5'],
                ['Visualisasi', 'Recharts + D3'],
                ['UI', 'Tailwind CSS + Framer Motion'],
                ['Validasi', 'Zod (shared frontend & backend)'],
                ['Deploy', 'Vercel (Frontend + Serverless)'],
              ].map(([k, v]) => (
                <div key={k} className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded p-3">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{k}</p>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4 text-[var(--text-secondary)]">
        <span className="text-[var(--accent-primary)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}
