---
sidebar_position: 2
---

# Panduan Build & Deploy Produksi

Halaman ini berisi petunjuk kompilasi berkas statis frontend dan panduan mendeploy seluruh ekosistem aplikasi Sugity ke server produksi.

---

## 1. Kompilasi & Build Frontend

Aplikasi frontend React harus dikompilasi menjadi berkas statis (HTML, CSS, JS) sebelum dideploy ke web server produksi:

1.  Masuk ke direktori `frontend`.
2.  Jalankan perintah kompilasi:
    ```bash
    npm run build
    ```
    Perintah di atas akan menjalankan TypeScript compiler (`tsc`) untuk memverifikasi tipe data, lalu memicu build bundler Vite untuk mengekspor seluruh aset statis yang optimal ke folder `frontend/dist/`.

---

## 2. Pilihan Deploying Frontend (Web Server Nginx)

Untuk performa terbaik di server produksi, Anda disarankan mendeploy isi direktori `/dist` menggunakan web server statis berperforma tinggi seperti **Nginx**:

### Rekomendasi Konfigurasi Nginx (`nginx.conf`):
Pastikan Nginx dikonfigurasi untuk menangani *client-side routing* (mengarahkan semua request tak dikenal kembali ke `index.html`) dan melakukan *reverse-proxy* ke backend untuk API `/api` dan WebSocket `/socket.io`:

```nginx
server {
    listen 80;
    server_name production-portal.sugity.co.id;

    # Folder file statis frontend hasil build
    root /var/www/sugity-portal/dist;
    index index.html;

    # Penanganan client-side routing React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy request API ke Node.js Backend
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Reverse Proxy koneksi real-time WebSocket
    location /socket.io {
        proxy_pass http://127.0.0.1:3000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 3. Konfigurasi Environment & Keamanan Backend

Saat mendeploy Node.js backend ke server produksi:
1.  **NODE_ENV**: Set nilai variabel ke `production`. Hal ini secara otomatis mengaktifkan flag `Secure` dan `HttpOnly` pada session cookie JWT backend agar hanya dikirim lewat protokol HTTPS aman.
2.  **Kunci Rahasia**: 
    *   **Jangan gunakan** `JWT_SECRET` dan `PIN_ENCRYPTION_KEY` bawaan dari lokal development.
    *   Hasilkan kunci rahasia acak 32 karakter hex baru untuk masing-masing variabel tersebut sebelum menyalakan server di production:
        ```bash
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
        ```
3.  **Cors Protection**: Sesuaikan pengaturan asal CORS di `backend/src/app.ts` agar hanya menerima request dari domain portal Sugity resmi Anda, alih-alih mengizinkan semua domain (`origin: true`).
