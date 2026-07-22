---
sidebar_position: 5
---

# Pengelolaan Data Mesin (Machine Management)

Pengelolaan data master unit mesin cetak dilakukan secara mandiri melalui menu `/machines` di panel administrasi.

---

## Properti Master Mesin

Setiap mesin injeksi didaftarkan dengan properti lengkap berikut:

1.  **Machine Code**: Kode unik mesin (contoh `MC-01`, `MC-02`).
2.  **Machine Name**: Deskripsi mesin (contoh `Mesin Injeksi Toyo 150T`).
3.  **Tonnage**: Kapasitas tonase mesin untuk pencocokan dengan spesifikasi mold (contoh `150T`, `350T`).
4.  **Factory Plant Mapping**: Menghubungkan mesin ke salah satu pabrik terdaftar.
5.  **Status Aktif/Nonaktif**: Opsi untuk mematikan mesin sementara waktu dari daftar aktif antrean kerja.
6.  **Operator PIN (PIN Hash)**: Tempat menyimpan sandi PIN unik Bcrypt untuk akses operator pada stasiun mesin tersebut.

---

## Alur Pengecekan Mesin Terdaftar

Saat file jadwal harian diunggah oleh Planner, backend menjalankan validator **Machine Key Resolver** untuk menormalisasi variasi input kode mesin (misalnya variasi teks penulisan `MC01`, `MC-1`, atau `Mesin 01` dari Excel) agar dapat terpetakan secara konsisten ke Kode Mesin resmi di database.

---

*Untuk mempelajari konfigurasi kustomisasi tampilan tema portal, buka halaman [Kustomisasi Tema & Warna Instan](./site-configuration.md).*
