# ANDROID_BUILD.md — Bungkus PWA jadi Android App Bundle (Play Store)

Strategi: **PWA → Trusted Web Activity (TWA) via Bubblewrap → AAB → Google Play Console**.
Tidak ada UI Android terpisah; aplikasi Android menampilkan PWA yang sama.

---

## 0. Prasyarat

| Kebutuhan | Keterangan |
| --- | --- |
| Node.js ≥ 20 | `node -v` |
| JDK 17 | Bubblewrap dapat mengunduh JDK & Android SDK sendiri saat pertama kali dijalankan |
| Akun Google Play Console | Biaya pendaftaran satu kali (USD 25) |
| PWA sudah online di HTTPS | Wajib, TWA memuat URL publik |

---

## 1. Install Node.js

Unduh LTS dari <https://nodejs.org> lalu verifikasi:

```bash
node -v
npm -v
```

## 2. Build produksi

```bash
cd frontend
npm ci --legacy-peer-deps
npm test -- --run   # pastikan hijau
npm run typecheck
npm run build       # hasil di frontend/build
```

Jika dihosting di sub-path (GitHub Pages repo):

```bash
VITE_BASE=/nota-calculator/ npm run build
```

## 3. Deploy PWA ke HTTPS

Host `frontend/build` di domain HTTPS, contoh:

- `https://username.github.io/nota-calculator/` (lihat `docs/DEPLOY_GITHUB_PAGES.md`)
- atau domain sendiri: `https://notakalk.contoh.com/`

Catat URL manifest, misal `https://notakalk.contoh.com/manifest.webmanifest`.
Pastikan: manifest terbaca, SW aktif, aplikasi bisa dibuka offline.

> **Disarankan** untuk Play Store: pakai domain/sub-path sendiri di root (`/`).
> TWA di sub-path tetap bisa, tetapi `assetlinks.json` harus dapat diakses di
> `https://domain/.well-known/assetlinks.json` (root domain, bukan sub-path).
> GitHub Pages tipe `username.github.io` melayani root domain milik user, sehingga
> file `.well-known` harus diletakkan di repository `username.github.io`.

## 4. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
bubblewrap doctor        # akan menawarkan unduh JDK/Android SDK bila belum ada
```

## 5. Generate project Android

```bash
mkdir notakalk-android && cd notakalk-android
bubblewrap init --manifest https://notakalk.contoh.com/manifest.webmanifest
```

Jawaban yang disarankan:

| Pertanyaan | Nilai |
| --- | --- |
| Domain | `notakalk.contoh.com` |
| URL path | `/` |
| Application name | `NotaKalk` |
| Short name | `NotaKalk` |
| Application ID | `com.contoh.notakalk` (unik, tidak bisa diubah setelah publish) |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Status bar color | `#0d1424` |
| Splash color | `#f6f5f2` |
| Icon URL | `https://notakalk.contoh.com/icons/icon-512.png` |
| Maskable icon URL | `https://notakalk.contoh.com/icons/maskable-512.png` |
| Include support for shortcuts | `No` (opsional) |
| Signing key | biarkan Bubblewrap membuat baru (`android.keystore`) |

## 6. Build AAB

```bash
bubblewrap build
```

Output:

- `app-release-bundle.aab` → yang diunggah ke Play Console
- `app-release-signed.apk` → untuk uji pasang manual (`adb install -r app-release-signed.apk`)
- `assetlinks.json` → **wajib** di-deploy ke `https://notakalk.contoh.com/.well-known/assetlinks.json`

## 7. Signing

- Bubblewrap membuat keystore + menyimpan sidik jari SHA-256 di `twa-manifest.json`.
- **Backup `android.keystore` + password.** Hilang = tidak bisa update aplikasi.
- Play App Signing (default di Play Console) akan menandatangani ulang; setelah aplikasi
  dibuat, ambil **SHA-256 dari Play Console → Setup → App integrity** dan regenerasi
  `assetlinks.json`:

  ```bash
  bubblewrap fingerprint add <SHA256_DARI_PLAY_CONSOLE>
  bubblewrap fingerprint generateAssetLinks
  ```

  Deploy ulang `assetlinks.json`. Jika langkah ini dilewati, aplikasi akan tampil
  dengan address bar (Custom Tab), bukan fullscreen TWA.

## 8. Upload ke Google Play Console

1. <https://play.google.com/console> → **Create app** (nama: NotaKalk, bahasa: Indonesia, tipe: App, gratis).
2. **Internal testing → Create new release** → unggah `app-release-bundle.aab`.
3. Lengkapi: **App content** (privacy policy, data safety: *no data collected/shared* karena data hanya di perangkat), rating konten, target audience, kategori (Business/Productivity).
4. **Store listing**: judul, deskripsi singkat & panjang, ikon 512×512, feature graphic 1024×500, minimal 2 screenshot ponsel.
5. Uji lewat Internal testing → bila sudah rapi, promosikan ke **Production** dan kirim untuk review.

## 9. Update versi berikutnya

```bash
# 1) deploy ulang PWA (konten web langsung ikut terbarui tanpa rilis baru)
# 2) hanya jika perlu ganti ikon/nama/target SDK:
bubblewrap update
bubblewrap build          # naikkan appVersionCode di twa-manifest.json
```

Karena kontennya PWA, perbaikan fitur/bug cukup dengan deploy web — pengguna Android
mendapat versi terbaru otomatis (Service Worker `autoUpdate`).

---

## Checklist cepat

- [ ] `npm run build` sukses, `npm test -- --run` hijau
- [ ] PWA online di HTTPS, installable, offline OK
- [ ] `bubblewrap init` memakai URL manifest produksi
- [ ] `assetlinks.json` ter-deploy di `/.well-known/` dan berisi SHA-256 Play App Signing
- [ ] Keystore dibackup
- [ ] AAB terunggah, store listing & data safety terisi
