---
sidebar_position: 2
---

# Pengurutan Rencana Heijunka (Drag & Drop)

**Heijunka** adalah susunan urutan produksi harian yang dirancang untuk meratakan beban kerja mesin. Di dalam stasiun tablet, rencana kerja harian untuk satu mesin ditampilkan di bagian bawah layar eksekusi dalam bentuk daftar antrean kartu rencana kerja.

---

## Fungsionalitas Drag & Drop

Untuk memudahkan penyesuaian urutan rencana produksi secara lokal dan dinamis sebelum pekerjaan dimulai:

1.  **Teknologi**: Menggunakan `@hello-pangea/dnd` (turunan dari React Beautiful DnD yang mendukung React 19).
2.  **Operasional**: 
    *   Pengguna dapat menahan dan menggeser (*drag and drop*) kartu rencana produksi naik atau turun untuk mengubah urutan pengerjaan.
    *   Perubahan urutan rencana ini akan disimpan secara otomatis dan dikoordinasikan kembali ke backend untuk diperbarui di database.
3.  **Real-Time Update**: 
    Setiap perubahan urutan heijunka di suatu mesin akan di-broadcast via socket.io sehingga display board TV `/board` dan dashboard planner `/orders` ikut terupdate secara real-time.

---

## Pembatasan Akses (Read-Only Mode)

*   **Member Operator**: Secara default, member operator di shopfloor berada pada mode *Read-Only* untuk daftar urutan rencana jika pekerjaan sudah dimulai.
*   **Planner / Supervisor Bypass**: Untuk mengubah urutan heijunka ketika produksi sedang berjalan, dibutuhkan otorisasi (input PIN Supervisor/Planner) untuk membuka kunci pengurutan. Hal ini dilakukan demi mencegah operator mengubah urutan kerja tanpa koordinasi dengan departemen perencanaan.

---

*Untuk melangkah ke bagian alur kerja operasional harian operator, buka halaman [Alur Kontrol Pekerjaan (Job Control)](./job-control.md).*
