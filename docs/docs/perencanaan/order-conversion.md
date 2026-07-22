---
sidebar_position: 4
---

# Pemetaan Part Customer ke Kode Sebango (Order Conversion)

Saat customer mengirimkan pesanan forecast, kode part number yang tertera sering kali mengikuti format eksternal customer (seperti penamaan global Toyota, Daihatsu, dll). Sistem Sugity membutuhkan pemetaan (*mapping*) ke kode part internal produksi yang disebut **Sebango**.

---

## Logika Pemetaan Kode

Halaman pemetaan berisi baris data relasional yang mendefinisikan hubungan satu-ke-satu atau satu-ke-banyak antara nomor part customer dan kode produksi internal:
*   **Customer Part Number**: Kode unik dari customer.
*   **Sebango Code**: Kode produksi internal.
*   **Kategori Ukuran (Big/Small)**: Menentukan ukuran boks Kanban dan jenis mesin cetak yang akan dialokasikan.

---

## Aset Data Kritis

Database awal saat ini menyimpan sekitar **147+ record pemetaan order conversion** yang telah divalidasi. Data ini merupakan aset operasional kritis karena:
*   Kesalahan pemetaan satu baris saja dapat menyebabkan tablet shopfloor memproduksi model part yang salah atau memotong nomor urut cetak label Kanban yang tidak sinkron.
*   Perubahan data konversi ini hanya diperbolehkan oleh peran Planner dan dilindungi dengan *audit log* ketat.

---

*Langkah berikutnya adalah menjelajahi fitur pengelolaan administrasi di [Tinjauan Umum Panel Admin](../admin/overview.md).*
