# Panduan Hosting Web SAMP CS Corrector

Aplikasi web ini sudah disiapkan agar siap dipasang (deploy) di berbagai layanan hosting seperti Vercel, Netlify, atau Shared Hosting (cPanel).

## Langkah 1: Download Source Code
1. Klik tombol menu (titik tiga) di pojok kanan atas AI Studio.
2. Pilih **Export to GitHub** (jika ingin langsung dihubungkan ke hosting) atau **Download ZIP**.
3. Jika mendownload ZIP, ekstrak file tersebut di komputer Anda.

## Langkah 2: Dapatkan API Key Gemini
Aplikasi ini menggunakan AI Gemini. Anda memerlukan API Key agar fitur AI (Koreksi CS & Metro Bot) bisa berjalan.
1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Buat API Key baru dan copy kodenya.

## Langkah 3: Konfigurasi Environment (PENTING)
Agar AI bisa berjalan di hosting Anda, Anda harus memasukkan API Key tersebut ke dalam Environment Variables.

Buat file baru bernama `.env` di folder utama project Anda (sejajar dengan `package.json`), lalu isi dengan:
```env
VITE_GEMINI_API_KEY="paste_api_key_gemini_anda_disini"
```

---

## Opsi A: Hosting Gratis & Mudah (Vercel / Netlify) - SANGAT DISARANKAN
Ini adalah cara terbaik dan gratis untuk menghosting aplikasi React (Vite).

### Menggunakan Vercel:
1. Buat akun di [Vercel](https://vercel.com).
2. Jika Anda menggunakan GitHub, klik **Add New -> Project** dan pilih repository GitHub Anda.
3. Jika menggunakan ZIP, Anda bisa menginstal Vercel CLI (`npm i -g vercel`) dan jalankan perintah `vercel` di dalam folder project.
4. **PENTING:** Di bagian **Environment Variables** pada dashboard Vercel sebelum deploy, tambahkan:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `(paste API Key Gemini Anda)`
5. Klik **Deploy**. Selesai!

---

## Opsi B: Hosting cPanel / Shared Hosting (Hostinger, Niagahoster, dll)
Jika Anda ingin menggunakan domain sendiri di cPanel, ikuti langkah ini:

1. Pastikan Anda sudah menginstal **Node.js** di komputer Anda.
2. Buka terminal/CMD di dalam folder project, lalu jalankan perintah:
   ```bash
   npm install
   ```
3. Setelah selesai, jalankan perintah build:
   ```bash
   npm run build
   ```
4. Perintah di atas akan menghasilkan folder baru bernama `dist`.
5. Buka cPanel hosting Anda, masuk ke **File Manager** -> `public_html`.
6. Upload **semua isi dari dalam folder `dist`** (bukan foldernya, tapi isinya) ke dalam `public_html`.
7. **PENTING UNTUK cPanel:** Karena ini aplikasi React Router (SPA), Anda wajib membuat file `.htaccess` di dalam `public_html` agar jika di-refresh halamannya tidak error 404. Isi file `.htaccess` dengan kode berikut:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Selesai! Web CS Corrector Anda sudah online dan siap digunakan oleh player server Anda.
