---
sidebar_position: 4
---

# Pengelolaan Data Pabrik (Factory Management)

Menu **Factory Management** digunakan untuk mendefinisikan lokasi-lokasi fisik pabrik Sugity tempat mesin-mesin cetak beroperasi.

---

## Atribut Pabrik

Setiap entri pabrik menyimpan parameter dasar:
*   **Factory Code**: Kode nama pabrik (contoh: `F2`, `F3`, `F4`, `SC2-Karawang`).
*   **Factory Name**: Deskripsi nama lengkap pabrik (contoh: `Plant Resin F2 Sugity`).
*   **Status Aktif**: Mengaktifkan atau menonaktifkan seluruh unit pabrik dari menu pilihan di tablet.

---

## Logika Relasi Data

Data pabrik bertindak sebagai simpul utama (*parent*) dari data mesin produksi. 
*   Ketika Planner mengunggah data jadwal produksi, sistem memvalidasi apakah kode pabrik yang tercantum di file spreadsheet terdaftar secara resmi di database.
*   Pada halaman Monitoring Board `/board`, baris mesin dikelompokkan dan ditampilkan secara dinamis berdasarkan relasi pabrik yang dimilikinya.

---

*Untuk mempelajari cara mengelola mesin cetak produksi, buka halaman [Pengelolaan Data Mesin](./machine-management.md).*
