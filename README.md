# Flood Vulnerability Dashboard — Jakarta Garden City

Dashboard interaktif peta kerentanan banjir kawasan Jakarta Garden City (JGC).
**Data pada aplikasi ini adalah simulasi untuk tujuan demonstrasi.**

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Zustand + TanStack Query v5 + MapLibre GL JS
- **Backend**: Hono (Vercel Edge Functions)
- **Shared**: Zod schemas
- **UI**: Tailwind CSS + Framer Motion + Recharts

## Cara Menjalankan (Development)

```bash
# 1. Install dependencies
npm install

# 2. Generate demo data
npm run generate:data

# 3. Jalankan frontend + backend bersamaan
npm run dev
```

Frontend berjalan di `http://localhost:5173`, backend di `http://localhost:3001`.

## Generate Ulang Demo Data

```bash
npm run generate:data
```

Script `scripts/generate-demo-data.ts` akan membuat ulang file di `apps/api/src/data/`.

## Deploy ke Vercel

1. Push ke GitHub
2. Connect repo di [vercel.com](https://vercel.com)
3. Vercel otomatis detect `vercel.json` dan deploy frontend + API

Environment variables yang perlu diset di Vercel Dashboard:
```
VITE_API_URL=/api
```

## Struktur Proyek

```
flood-jgc/
├── apps/
│   ├── web/        # React frontend (Vite)
│   └── api/        # Hono backend (Vercel Edge)
├── packages/
│   └── shared/     # Zod schemas & types
└── scripts/        # Data generation
```

## API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/zones` | Daftar zona dengan filter & pagination |
| GET | `/api/zones/:id` | Detail zona + event terakhir |
| GET | `/api/sensors` | Daftar sensor (filter by zoneId, status) |
| GET | `/api/sensors/:id/readings` | Pembacaan sensor historis |
| GET | `/api/flood-events` | Riwayat kejadian banjir |
| GET | `/api/stats/summary` | Statistik ringkasan kawasan |
