---
sidebar_position: 6
---

# Kustomisasi Tema & Warna Instan (Site Configuration)

Untuk memberikan fleksibilitas branding tanpa memerlukan proses kompilasi ulang (rebuild) kode aplikasi frontend setiap kali ada perubahan warna korporasi, sistem menyediakan fitur **Dynamic Site Configuration**.

---

## Variabel Warna Utama yang Dapat Diatur

Super Admin dapat menyesuaikan skema warna global melalui form interaktif di menu `/site-config` dengan 3 parameter warna utama:

1.  **Color Primary**: Warna utama aksen aplikasi (contoh default: `#008d51` - Hijau Sugity).
2.  **Color Secondary**: Warna tombol/pesan peringatan dan highlight (contoh default: `#E76114` - Oranye Sugity).
3.  **Color Navbar**: Warna background bar navigasi atas aplikasi (contoh default: `#037233` - Hijau Navbar Sugity).

---

## Logika Penerapan Instan (Real-Time CSS Variable Sync)

Warna-warna di atas disinkronkan secara langsung di sisi frontend dan backend menggunakan mekanisme berikut:

1.  **Public API**: Endpoint `GET /api/site-config` dibuka secara umum (tidak memerlukan login) agar dibaca langsung saat aplikasi React pertama kali di-mount.
2.  **Injeksi CSS Variables**: Frontend menerima data warna JSON, lalu menginjeksikannya langsung ke elemen root HTML sebagai CSS Variable:
    ```css
    :root {
      --color-brand-primary: #008d51;
      --color-brand-secondary: #E76114;
      --color-brand-navbar: #037233;
    }
    ```
    Seluruh komponen Tailwind CSS v4 di frontend dikonfigurasi untuk membaca variabel CSS tersebut, sehingga warna latar belakang tombol, header, dan aksen navigasi seketika berubah.
3.  **Redis Caching**: Di sisi backend, data warna di-cache di Redis (TTL 60 detik) agar request publik ini tidak terus-menerus membebani query database PostgreSQL. Saat Super Admin mengirim request `PUT /api/site-config` untuk mengganti warna, cache Redis otomatis di-invalidate sehingga seluruh tablet operator di shopfloor langsung memuat warna baru pada render berikutnya.

---

*Langkah berikutnya adalah menjelajahi panduan pengembangan teknis bagi Developer di [Tinjauan Teknis Developer Guide](../developer/overview.md).*
