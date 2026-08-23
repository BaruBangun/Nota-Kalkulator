# NotaKalk — Kalkulator Nota (Level 2)

Kalkulator yang terasa seperti **nota digital**. Ketik `Beras 4x40`, tekan **Enter**, selesai.
Dibuat untuk pemilik warung, pedagang, reseller, dan siapa pun yang butuh hitung cepat tanpa form panjang.

```text
Susu Enak                 28
Teh Kotak                  5
Beras 4 × 40             160
────────────────────────────
TOTAL                    193
```

- **100% client-side** — tanpa backend, tanpa login, tanpa cloud database.
- **Offline-first** — Service Worker + Cache Storage untuk aset, IndexedDB untuk data.
- **PWA** — installable di Android/desktop, mode standalone, siap dibungkus jadi AAB (TWA).
- **Satu codebase** untuk web, Android (PWA/TWA), dan desktop.

---

## Fitur

| Area | Detail |
| --- | --- |
| Input cepat | `Susu 28`, `Beras 4x40`, `Beras 4*40`, `Beras 4X40`, `Semen 2x75.000` (case-insensitive, spasi bebas) |
| Enter-loop | Enter → parse → tambah item → input dikosongkan → fokus kembali |
| Paste massal | Tempel banyak baris sekaligus, semua baris valid langsung jadi item |
| Item | Edit inline, duplikat, hapus, naik, turun (menu ⋮) |
| Diskon | Nominal atau persen, opsional |
| Catatan | Catatan bebas per nota |
| Total | Real-time, satu calculation engine untuk preview / simpan / share / print |
| Simpan | IndexedDB (`notakalk` → store `notes`, `meta`) |
| Riwayat | Dikelompokkan Hari ini / Kemarin / tanggal; buka, duplikat, bagikan, hapus |
| Share | `navigator.share()` + fallback copy clipboard |
| Print | CSS print, pilihan A4 atau thermal 80mm |
| Backup | Export / Import `nota-backup.json`, hapus semua data |
| Tema | Terang / Gelap / Sistem (design token CSS variables) |

---

## Tech stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS · IndexedDB · Workbox (vite-plugin-pwa) · Vitest

Tidak ada backend, tidak ada PostgreSQL, tidak ada autentikasi, tidak ada analytics.

---

## Struktur folder

```text
frontend/
├── index.html                  # entry Vite + boot theme (anti flash)
├── vite.config.mts             # base configurable, PWA, alias @/, vitest
├── public/icons/               # favicon.svg, icon-192/512, maskable, apple-touch
└── src/
    ├── main.tsx                # mount + registerSW()
    ├── App.tsx                 # HashRouter: / , /note/:id , /history , /settings
    ├── index.css               # design token + print CSS
    ├── components/
    │   ├── AppHeader.tsx  BrandMark.tsx
    │   ├── NoteEditor.tsx      # input utama (Enter-loop, live parse)
    │   ├── NotePreview.tsx     # tampilan nota (kertas + gerigi)
    │   ├── NoteItemRow.tsx     # baris item + menu ⋮ + edit inline
    │   ├── TotalDisplay.tsx  DiscountControl.tsx  NoteMemo.tsx
    │   ├── NoteActions.tsx     # dock mobile + action row desktop
    │   ├── ShareButton.tsx  HistoryList.tsx  SettingsPanel.tsx
    │   ├── ConfirmDialog.tsx  primitives.tsx
    │   └── ui/                 # shadcn/ui (radix)
    ├── lib/
    │   ├── parser.ts           # parseTransactionLine / parseTransactionLines
    │   ├── calculator.ts       # computeTotals, buildNote, move/duplicate
    │   ├── currency.ts         # formatCurrency / parseCurrency (format id-ID)
    │   ├── storage.ts          # IndexedDB (notes + meta)
    │   ├── share.ts            # buildNoteText, shareNote, copyText
    │   ├── export.ts           # export / import backup JSON
    │   ├── dates.ts  styles.ts  sampleData.ts
    │   └── *.test.ts           # unit test parser, kalkulator, storage
    ├── state/                  # settings context + draft reducer
    ├── pages/                  # NewNote, History, Settings
    └── types/                  # note.ts, transaction.ts
```

---

## Menjalankan lokal

```bash
cd frontend
yarn install
yarn start          # dev server di http://localhost:3000
```

Perintah lain:

```bash
yarn test           # unit test (Vitest): parser, kalkulator, diskon, IndexedDB
yarn typecheck      # TypeScript strict, tanpa emit
yarn build          # build produksi ke frontend/build
yarn preview        # serve hasil build (uji Service Worker & offline)
```

> Service Worker hanya melakukan precache penuh pada hasil `yarn build`.
> Untuk uji offline sungguhan, jalankan `yarn build && yarn preview` lalu matikan jaringan.

---

## Aturan parser

`parseTransactionLine(input)` mengembalikan `{ ok, value | code, message, hint }`.

| Input | name | quantity | unitPrice | subtotal |
| --- | --- | --- | --- | --- |
| `Susu 28` | Susu | 1 | 28 | 28 |
| `Susu Enak 28` | Susu Enak | 1 | 28 | 28 |
| `Beras 4x40` | Beras | 4 | 40 | 160 |
| `Beras 4*40` / `Beras 4X40` / `Beras 4×40` | Beras | 4 | 40 | 160 |
| `Semen 2x75.000` | Semen | 2 | 75000 | 150000 |
| `Aqua 600 2x5.000` | Aqua 600 | 2 | 5000 | 10000 |
| `Gula 2x14,5` | Gula | 2 | 14,5 | 29 |

Input tidak valid tidak pernah membuat aplikasi crash:

| Input | Hasil |
| --- | --- |
| `Beras abc` | `unrecognized` → "Format belum dikenali" + contoh |
| `Beras 4x` | `incomplete-price` → "Angkanya belum lengkap" |
| `4x40` | `missing-name` → "Tambahkan nama barang" |

Parser murni parsing string + aritmetika. **Tidak ada `eval()`** dan input user tidak pernah dirender sebagai HTML.

---

## Dokumentasi lain

- [docs/PWA.md](docs/PWA.md) — manifest, service worker, uji offline, checklist Lighthouse
- [docs/DEPLOY_GITHUB_PAGES.md](docs/DEPLOY_GITHUB_PAGES.md) — deploy ke GitHub Pages (termasuk sub-path)
- [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md) — bungkus PWA jadi AAB (Bubblewrap/TWA) → Google Play

---

## Privasi

Semua nota tersimpan di IndexedDB **perangkat pengguna**. Tidak ada data yang dikirim ke server.
Cadangan dilakukan manual lewat Export/Import JSON di halaman Pengaturan.
