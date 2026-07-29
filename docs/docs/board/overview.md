---
sidebar_position: 1
---

# Tinjauan Umum Monitoring Board

Halaman **Monitoring Board** (`/board`) bertindak sebagai "3M Dashboard" visual yang menyajikan status operasional seluruh mesin di area pabrik secara terpusat dan real-time. Halaman ini didesain agar dapat di-host pada TV berlayar lebar di koridor pabrik untuk mempermudah monitoring pasif.

---

## Perbedaan Board (`/board`) dengan Dashboard (`/dashboard`)

Dalam arsitektur aplikasi saat ini, terdapat dua istilah serupa namun dengan fungsi yang sangat berbeda:

*   **Monitoring Board (`/board`)**: 
    Halaman utama visualisasi produksi yang sudah aktif sepenuhnya. Halaman ini bersifat *fullscreen* dan **berfungsi murni sebagai tampilan dashboard yang dipasang di TV koridor pabrik**. Halaman ini mendengarkan sinyal WebSocket untuk perubahan status secara instan dan memfasilitasi navigasi perpindahan detail mesin secara cepat.
*   **Dashboard (`/dashboard`)**: 
    Saat ini masih merupakan halaman **placeholder** (sedang dalam pengembangan). Ketika user selain role `member`/`production-board` log masuk, mereka diarahkan ke `/dashboard` yang menampilkan pesan sambutan selamat datang di Portal Sugity.

---

:::warning 
Kebijakan Akses Halaman Board (View-Only)
- Halaman `/board` ini dirancang **khusus untuk pemantauan (view-only)** dari layar TV pemantau.
- Apabila pengguna menekan salah satu kartu mesin untuk melihat detail mesin tersebut, tampilan modal yang muncul bersifat **hanya baca (read-only)**. Pengguna **tidak dapat melakukan modifikasi data**, memulai/menghentikan job, mencetak label, atau memasukkan PIN supervisor dari halaman ini. 
- Segala aktivitas eksekusi produksi fisik dan modifikasi status mesin wajib dilakukan langsung melalui stasiun tablet operator di shopfloor (`/production/:machineCode/execution`) setelah log masuk sebagai member.
:::

---

## Kegunaan Utama Monitoring Board

1.  **Pemantauan Real-Time**: Status mesin diperbarui tanpa perlu memuat ulang halaman browser berkat koneksi WebSocket Socket.io yang aktif di belakang layar.
2.  **Identifikasi Cepat Masalah**: Visualisasi dengan kode warna yang tegas membantu Leader/Planner langsung mengetahui mesin mana yang sedang berhenti atau mengalami abnormalitas.
3.  **Informasi Job Aktif**: Menampilkan model part yang sedang diproduksi, target produksi harian, dan pencapaian kuantitas aktual saat ini.

---

*Untuk mengetahui bagaimana mesin-mesin dikelompokkan secara visual di layar, buka halaman [Pengelompokan Grid Mesin](./factory-grid.md).*
