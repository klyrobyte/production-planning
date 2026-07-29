---
sidebar_position: 3
---

# Viewer Log Audit Sistem (Global Logs)

Setiap aksi pemanggilan data, perubahan rencana kerja, maupun verifikasi PIN di lapangan direkam secara transparan melalui fitur **Global Audit Logs** (Audit Trail).

---

## Mekanisme Pencatatan Log Otomatis

Backend menyematkan middleware global `auditLogMiddleware` yang merekam rincian transaksi API secara otomatis:
*   **Asynchronous Logging**: Pencatatan ke database berjalan menggunakan pola *fire-and-forget* setelah respon dikirimkan ke pengguna, sehingga tidak memperlambat latensi respon aplikasi bagi operator.
*   **Data yang Direkam**:
    *   Waktu kejadian (*timestamp*).
    *   Nama pengguna dan Peran (*Username & Role*) pemanggil.
    *   IP Address (mampu membaca header `X-Forwarded-For` di belakang proxy Nginx).
    *   Metode HTTP & URL Path (contoh `POST /api/production-plans`).
    *   Status Code (misal `200 Success`, `401 Unauthorized`).
    *   Waktu Respon (dalam satuan milidetik / ms).

---

## Tampilan Global Logs Viewer

Halaman `/global-logs` pada panel admin menampilkan tabel transaksional interaktif:
1.  **Filter Fleksibel**: Menyaring log berdasarkan rentang tanggal, username tertentu, status respon (misal memunculkan semua kegagalan `403 Forbidden` untuk analisis brute force), atau path URL.
2.  **Pagination**: Pembagian baris data halaman untuk kenyamanan memuat data dalam jumlah ribuan baris.
3.  **Fitur Clear Logs**: Super Admin memiliki opsi tombol untuk menghapus seluruh log lama guna menghemat penyimpanan database.

---

*Untuk mempelajari cara mengelola master data pabrik, buka halaman [Pengelolaan Data Pabrik](./factory-management.md).*
