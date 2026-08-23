# PRD — NotaKalk (Nota Calculator Level 2)

## Problem statement (asli, ringkas)
Bangun aplikasi **Nota Calculator Level 2** yang jalan di Android (browser/PWA), Android (siap dibungkus AAB untuk Play Store), desktop browser, dan hosting statis (GitHub Pages) — **satu codebase, PWA-first**. Bukan POS penuh: fokusnya "kalkulator yang terasa seperti nota digital". User cukup mengetik baris transaksi (`Susu Enak 28`, `Beras 4x40`) dan aplikasi otomatis membuat nota + TOTAL. Stack: React + TypeScript + Vite + Tailwind + IndexedDB + Service Worker + Web App Manifest. **Tanpa backend, tanpa auth, tanpa cloud DB** (100% client-side). Wajib offline-first, parser terpisah dari UI, format angka Indonesia, edit/duplicate/delete/move item, diskon, catatan, simpan+riwayat, share/copy/print, export/import, dark mode, unit test parser, dokumentasi (README, GitHub Pages, PWA, ANDROID_BUILD).

## Keputusan user (ask_human)
- Migrasi penuh CRA → **Vite + React + TypeScript**
- Tema default **System** + toggle Light/Dark
- Angka **tanpa simbol "Rp"** sama sekali
- Desain diserahkan ke designer/agent
- Tidak ada tambahan di luar spesifikasi Level 2

## Arsitektur
- `frontend/` — satu-satunya aplikasi. Vite 8 + React 19 + TS 7 (strict) + Tailwind 3 + Workbox (vite-plugin-pwa) + Vitest.
- Router: **HashRouter** (`/#/`, `/#/note/:id`, `/#/history`, `/#/settings`) → aman untuk GitHub Pages sub-path.
- `base` build lewat env `VITE_BASE`; output ke `frontend/build`.
- Data: **IndexedDB** `notakalk` → store `notes` (keyPath id, index createdAt) + `meta` (settings, draft). localStorage hanya cache tema/print agar tidak flash.
- Logic terpisah dari UI: `src/lib/{parser,calculator,currency,storage,share,export,dates,sampleData,styles}.ts`, tipe di `src/types/{note,transaction}.ts`, state di `src/state/{settings.tsx,draft.ts}`.
- Backend FastAPI template masih ada di pod tapi **tidak dipakai** (spesifikasi minta tanpa backend).

## User persona
1. **Pemilik warung / pedagang pasar** — Android kelas menengah-bawah, butuh total cepat saat pembeli menunggu.
2. **Reseller / penjual makanan online** — sering mengulang pesanan yang sama → butuh duplikat nota + share teks ke chat.
3. **Pekerja lapangan / tukang** — perlu rincian material (Semen 2x75.000) dan bisa dicetak/dibagikan.

## Core requirements (statis)
- Enter-loop: ketik → Enter → item masuk → input bersih → fokus kembali (fitur UX terpenting).
- Parser: `Nama Harga`, `Nama Qty x Harga`, `x/X/*/×`, case-insensitive, spasi berlebih, pemisah ribuan & desimal; error ringan tanpa popup agresif; **tanpa eval()**.
- Satu calculation engine untuk preview / simpan / share / copy / print.
- Format angka Indonesia tanpa "Rp".
- Offline-first, installable, data hanya di perangkat.

## Implemented (2026-06 / iterasi 2 — permintaan user)
- ✅ **Swipe-to-delete**: geser baris item ke kiri (>76px) → item terhapus; latar merah "Hapus" muncul saat digeser; geser pendek → kembali. Pointer Events (jalan di touch & mouse); pointerleave hanya me-reset (tidak menghapus).
- ✅ **Input menyatu di dalam nota** (`ReceiptInputRow`): kartu "Ketik item" dihapus, baris input jadi baris terakhir di dalam nota — ketik → Enter → langsung jadi baris nota, dengan live subtotal & pesan error inline di dalam kertas nota.
- ✅ **Diskon dihilangkan dari UI** (`DiscountControl` dihapus). Engine diskon + unit test tetap ada di `calculator.ts` bila nanti diminta lagi.
- ✅ Layout halaman utama jadi satu kolom terfokus (`max-w-2xl`): nota → catatan → aksi; dock mobile tetap.
- ✅ QA: testing agent iterasi 2 = **100% pass** (swipe, input di dalam nota, kartu hilang, regresi simpan/riwayat/settings/mobile dock); 38 unit test hijau; `yarn typecheck` bersih.

## Implemented (2026-06 / iterasi 1)
- ✅ Phase 1–2: `calculator.ts` + `parser.ts` (+ `currency.ts`) — 38 unit test hijau (parser, varian format, invalid input, total 193, diskon, IndexedDB save/load, backup parse).
- ✅ Phase 3: UI nota — `NoteEditor` (live parse hint, paste multi-baris), `NotePreview` (kertas + gerigi + mono + tabular-nums), `NoteItemRow` (edit inline, duplikat, hapus, naik, turun via menu ⋮), `TotalDisplay`, `DiscountControl` (nominal/persen), `NoteMemo`.
- ✅ Phase 4: IndexedDB `storage.ts` + draft otomatis (nota tidak hilang saat reload).
- ✅ Phase 5: `/history` grup Hari ini / Kemarin / tanggal + buka, duplikat, bagikan, hapus (dialog konfirmasi).
- ✅ Phase 6: Share (`navigator.share` + fallback clipboard), Copy teks nota, Print (CSS print A4 / thermal 80mm).
- ✅ Phase 7: PWA — manifest (standalone, ikon 192/512/maskable, start_url & scope relatif), Workbox generateSW (precache 17 entri, navigateFallback, cache Google Fonts), `registerSW` autoUpdate, tombol Pasang (beforeinstallprompt).
- ✅ Phase 8: Responsive — mobile satu kolom + dock bawah (total + `+ Item` / Simpan / Bagikan / ⋮), desktop 2 kolom dengan preview sticky.
- ✅ Phase 9: Settings — tema Light/Dark/System, ukuran cetak, Export/Import `nota-backup.json`, Muat contoh data, Hapus semua data, blok privasi.
- ✅ Phase 10: Dokumentasi — `README.md`, `docs/PWA.md`, `docs/DEPLOY_GITHUB_PAGES.md`, `docs/ANDROID_BUILD.md`, workflow `.github/workflows/deploy-pages.yml`.
- ✅ Aksesibilitas: semantic HTML, aria-label pada icon button, target sentuh ≥44px, focus ring, `prefers-reduced-motion`.
- ✅ QA: testing agent iterasi 1 = **100% pass**, 0 bug; `yarn typecheck` bersih; `yarn build` sukses (JS 417 KB / 131 KB gzip).

## Backlog
### P0 (belum ada)
- (kosong — seluruh acceptance criteria Level 2 terpenuhi)

### P1
- Uji offline penuh otomatis (saat ini manual: `yarn build && yarn preview` lalu matikan jaringan).
- Undo setelah hapus item/nota (toast dengan aksi "Batalkan") — makin penting setelah ada swipe.
- Ringkasan harian di Riwayat (total per hari sudah ada; filter/pencarian belum).
- Code-splitting per rute untuk menurunkan bundle awal.

### P2 (Level 3 — sengaja tidak dibuat)
- Auth, cloud sync/multi-device, multi-toko, inventory, database pelanggan/supplier, laporan, PDF export, template nota, cetak thermal via Bluetooth, AI/OCR.

## Next tasks (jika diminta)
1. Undo hapus + edit cepat via long-press.
2. Pencarian & filter tanggal di Riwayat.
3. Nama toko/header nota pada teks share & print.
4. Shortcut keyboard desktop (Ctrl+S simpan, Ctrl+Enter share).
