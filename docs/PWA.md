# PWA — NotaKalk

## Yang sudah terpasang

| Bagian | Implementasi |
| --- | --- |
| Manifest | Dihasilkan `vite-plugin-pwa` → `manifest.webmanifest` |
| Service Worker | Workbox `generateSW`, `registerType: 'autoUpdate'` |
| Registrasi | `registerSW({ immediate: true })` di `src/main.tsx` |
| Offline fallback | `navigateFallback: 'index.html'` (SPA shell) |
| Precache | Semua `js/css/html/svg/png/ico/woff2/webmanifest` hasil build |
| Runtime cache | Google Fonts (stylesheet: SWR, font file: CacheFirst 1 tahun) |
| Ikon | `icons/icon-192.png`, `icons/icon-512.png`, `icons/maskable-512.png`, `apple-touch-icon-180.png`, `favicon.svg` |
| Data | IndexedDB (`notakalk`), bukan localStorage (localStorage hanya untuk cache tema agar tidak flash) |

Isi manifest (lihat `frontend/vite.config.mts`):

```jsonc
{
  "name": "NotaKalk — Kalkulator Nota",
  "short_name": "NotaKalk",
  "start_url": ".",         // relatif → aman untuk sub-path GitHub Pages
  "scope": ".",
  "display": "standalone",
  "theme_color": "#0d1424",
  "background_color": "#f6f5f2",
  "lang": "id",
  "orientation": "portrait-primary"
}
```

## Uji offline (wajib pakai build produksi)

```bash
cd frontend
npm run build
npm run preview     # http://localhost:3000
```

1. Buka halaman, tunggu SW aktif (DevTools → Application → Service Workers → *activated*).
2. DevTools → Network → **Offline** (atau aktifkan airplane mode di HP).
3. Reload: aplikasi tetap terbuka.
4. Buat nota, tekan **Simpan** → tutup tab → buka lagi: nota tetap ada (IndexedDB).

> Pada `npm run start` (dev), SW aktif dalam mode dev (`devOptions.enabled`) namun
> precache hanya berisi offline fallback — normal, gunakan build untuk uji offline penuh.

## Install ke perangkat

- **Android/Chrome**: menu ⋮ → *Install app* / *Add to Home screen*.
  Halaman **Pengaturan** juga menampilkan tombol **Pasang** saat browser mengizinkan (`beforeinstallprompt`).
- **iOS/Safari**: Share → *Add to Home Screen* (meta `apple-mobile-web-app-*` sudah disetel).
- **Desktop Chrome/Edge**: ikon install di address bar.

## Checklist Lighthouse (kategori PWA / Installable)

- [x] Manifest dengan `name`, `short_name`, `start_url`, `display: standalone`, `theme_color`, `background_color`, ikon 192 + 512 + maskable
- [x] Service worker terdaftar dan mengontrol `start_url`
- [x] Offline: navigasi tetap merespons saat jaringan mati
- [x] `viewport` meta + konten responsif
- [x] `<meta name="theme-color">` (varian light & dark)
- [x] Ikon maskable untuk launcher Android
- [x] HTTPS (dipenuhi oleh hosting: GitHub Pages / preview / domain sendiri)

Menjalankan audit:

```bash
npm run build && npm run preview
# lalu: Chrome DevTools → Lighthouse → Analyze page load
```

## Update aplikasi

`registerType: 'autoUpdate'` → SW baru langsung mengambil alih (`clientsClaim` + `skipWaiting`)
dan halaman memakai versi terbaru pada navigasi berikutnya. Tidak ada tombol "update" yang perlu ditekan user.
