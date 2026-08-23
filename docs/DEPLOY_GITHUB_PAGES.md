# Deploy ke GitHub Pages

Aplikasi ini murni statis (tanpa backend), jadi hasil `npm run build` bisa dihosting di mana saja:
GitHub Pages, Netlify, Vercel, Cloudflare Pages, Nginx, atau folder di hosting biasa.

Output build: `frontend/build/`

---

## 1. Penting: `base` bisa dikonfigurasi

`frontend/vite.config.mts` membaca env `VITE_BASE`:

```ts
const base = process.env.VITE_BASE ?? '/';
```

| Skenario | Perintah build |
| --- | --- |
| Domain sendiri / root (`https://nota.contoh.com/`) | `npm run build` |
| GitHub Pages user/organisasi (`https://user.github.io/`) | `npm run build` |
| GitHub Pages repo (`https://user.github.io/nota-calculator/`) | `VITE_BASE=/nota-calculator/ npm run build` |

Router memakai **HashRouter** (`/#/history`), sehingga deep-link tidak butuh konfigurasi
rewrite server dan tidak akan 404 di GitHub Pages.

`manifest` memakai `start_url: "."` dan `scope: "."` (relatif) supaya PWA tetap valid di sub-path.

---

## 2. Deploy manual (paling cepat)

```bash
cd frontend
VITE_BASE=/nota-calculator/ npm run build

cd build
git init
git add -A
git commit -m "deploy notakalk"
git branch -M gh-pages
git remote add origin https://github.com/USERNAME/nota-calculator.git
git push -f origin gh-pages
```

Lalu di GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `gh-pages` / root**.

---

## 3. Deploy otomatis (GitHub Actions)

Workflow siap pakai sudah tersedia di `.github/workflows/deploy-pages.yml`.
Aktifkan dengan: **Settings → Pages → Source: GitHub Actions**, lalu push ke branch `main`.

Isi workflow (ringkas):

```yaml
- run: npm ci --legacy-peer-deps
  working-directory: frontend
- run: npm test -- --run && npm run typecheck
  working-directory: frontend
- run: VITE_BASE="/${{ github.event.repository.name }}/" npm run build
  working-directory: frontend
- uses: actions/upload-pages-artifact@v3
  with: { path: frontend/build }
```

`VITE_BASE` otomatis mengikuti nama repository, jadi tidak perlu diubah manual.

---

## 4. Setelah deploy — verifikasi

1. Buka `https://USERNAME.github.io/nota-calculator/` (harus HTTPS agar SW jalan).
2. DevTools → Application → **Manifest** terbaca, **Service Workers** activated.
3. Matikan jaringan → reload → aplikasi tetap terbuka.
4. Chrome Android: menu ⋮ → *Install app* → aplikasi terbuka standalone (tanpa address bar).

---

## 5. Masalah umum

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Halaman putih, aset 404 | `base` masih `/` padahal dihosting di sub-path | build ulang dengan `VITE_BASE=/nama-repo/` |
| Manifest 404 | Pages belum selesai deploy / path salah | tunggu, lalu hard reload |
| SW tidak aktif | dibuka via `http://` atau `file://` | wajib HTTPS (atau `localhost`) |
| Versi lama masih muncul | SW lama masih aktif | reload sekali lagi (autoUpdate), atau Application → Unregister |
