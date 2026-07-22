---
sidebar_position: 2
---

# Pengelolaan Akun & Peran (User & Role Management)

Sistem ini menerapkan **Role-Based Access Control (RBAC)** secara dinamis guna menjaga keamanan data produksi dan memisahkan tanggung jawab pekerjaan di area pabrik.

---

## Manajemen Akun Pengguna

Melalui menu `/users`, Super Admin dapat mengelola profil pengguna sistem secara penuh:
*   **Username & Password**: Pendaftaran kredensial baru untuk karyawan.
*   **Penetapan Role**: Menghubungkan pengguna ke salah satu peran dinamis yang ada di sistem (misal menetapkan peran `planner` atau `leader`).
*   **Status Akun**: Mengaktifkan atau menonaktifkan akun karyawan tertentu.

---

## Manajemen Peran Dinamis (Dynamic RBAC)

Tidak seperti sistem tradisional dengan peran yang dikodekan secara kaku (*hardcoded*), Sugity Production Planning mengizinkan pendaftaran peran baru secara dinamis melalui database:
*   **Penyimpanan**: Peran disimpan di tabel `roles` dan dapat ditambahkan oleh Super Admin sewaktu-waktu.
*   **Proteksi Hapus**: Peran yang sedang terhubung ke pengguna aktif tidak diizinkan untuk dihapus secara sengaja untuk menjaga integritas data relasional.
*   **Peran Bawaan Kritis**: `super-admin` bertindak sebagai *root role* bawaan sistem yang dilindungi dan tidak dapat dihapus dalam kondisi apa pun.

---

*Untuk mempelajari cara memantau riwayat aktivitas dan log API sistem, buka halaman [Viewer Log Audit Sistem](./global-logs.md).*
