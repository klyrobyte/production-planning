---
sidebar_position: 1
---

# Setup Lokal Development

Ikuti panduan ini untuk mempersiapkan lingkungan pengembangan lokal Anda dan menjalankan seluruh layanan sistem secara bersamaan.

---

## Prasyarat System Lokal

Sebelum memulai, pastikan perangkat komputer Anda telah terinstal:
*   **Node.js**: Versi `>= 20`
*   **npm**: Versi `>= 10`
*   **Docker Desktop**: Dibutuhkan untuk menjalankan database PostgreSQL dan cache server Redis secara otomatis.

---

## Langkah 1: Jalankan PostgreSQL & Redis via Docker

Di root folder proyek (`d:\sugity\production-planning\`), salin berkas environment terlebih dahulu:

1.  Salin template env:
    ```bash
    cp .env.example .env
    ```
2.  Buka berkas `.env` dan lengkapi konfigurasi PostgreSQL (sesuaikan username, password, dan nama DB yang ingin Anda gunakan).
3.  Jalankan container menggunakan Docker Compose:
    ```bash
    docker compose up -d
    ```
4.  Pastikan kedua kontainer berjalan normal dengan perintah:
    ```bash
    docker compose ps
    ```

---

## Langkah 2: Seeding Data Awal ke Database

:::info Catatan Keberadaan File SQL
Jika berkas database `init.sql` beserta berkas seeder `.sql` lainnya belum tersedia di proyek lokal Anda, silakan hubungi Author untuk mendapatkan berkas database terkait. Seluruh berkas SQL database tersebut wajib diletakkan di dalam direktori `backend/src/database/` (skema migrasi di sub-folder `/migrations/` dan seeder di sub-folder `/seeds/`) agar dapat dibaca dengan benar oleh konfigurasi Docker dan skrip migrasi.
:::

Database Anda saat ini masih kosong. Anda perlu mengimpor skema database dan data awal (seeding) untuk mendaftarkan user bawaan, pabrik, mesin cetak, data part, dan data konversi Sebango:

1.  Salin file-file SQL di folder `backend/src/database/seeds/` ke dalam kontainer database Docker Anda:
    ```bash
    docker cp backend/src/database/seeds/roles.sql sugity-db:/tmp/
    ```
2.  Jalankan perintah SQL psql di dalam kontainer untuk mengeksekusi seed tersebut:
    ```bash
    docker exec sugity-db psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /tmp/roles.sql
    ```
3.  Ulangi langkah di atas secara berurutan untuk seluruh berkas seed lainnya:
    *   `users.sql` (registrasi akun-akun default)
    *   `factories.sql` (pendaftaran area pabrik)
    *   `machines.sql` (pendaftaran 33 unit mesin cetak bawaan)
    *   `master_parts.sql` (daftar master part injection)
    *   `order_conversions.sql` (147+ record pemetaan part number customer)
    *   `site_config.sql` (skema warna tema awal)

---

## Langkah 3: Menjalankan Backend Dev Server

1.  Pindah ke direktori backend:
    ```bash
    cd backend
    ```
2.  Salin file konfigurasi environment backend:
    ```bash
    cp .env.example .env
    ```
3.  Isi variabel di `.env` backend (pastikan `DATABASE_URL` dan `REDIS_URL` terarah dengan benar ke port Docker lokal). Generate kunci rahasia baru menggunakan OpenSSL jika dibutuhkan.
4.  Jalankan server dalam mode hot-reload:
    ```bash
    npm run dev
    ```
5.  Pastikan muncul log sukses koneksi PostgreSQL & Redis di terminal. Swagger UI Anda sekarang dapat diakses secara lokal di alamat `http://localhost:3000/api/docs`.

---

## Langkah 4: Menjalankan Frontend Dev Server

1.  Buka tab terminal baru dan pindah ke direktori frontend:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Jalankan server Vite lokal:
    ```bash
    npm run dev
    ```
4.  Buka web browser ke alamat yang tertera di terminal (misal `http://localhost:5173`). Request API akan secara otomatis dialihkan ke port backend `3000` lewat proxy server Vite.

---

*Untuk mempelajari cara mendeploy aplikasi ke server production, buka halaman [Panduan Build & Deploy Produksi](./production.md).*
