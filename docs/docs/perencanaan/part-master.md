---
sidebar_position: 3
---

# Pengelolaan Data Spesifikasi Part Cetak (Part Master)

Daftar **Part Master** menyimpan seluruh informasi parameter teknis dari setiap komponen plastik yang dicetak menggunakan mesin injeksi di pabrik.

---

## Parameter Utama Part Master

Setiap baris master part menyimpan informasi kritis berikut yang digunakan untuk perhitungan beban kapasitas mesin:

1.  **Part Number**: Identifikasi unik part (misal `76811-0D010`).
2.  **Part Name & Model**: Nama part beserta model mobil terkait (misal `Garnish, Toyota Yaris`).
3.  **Cycle Time**: Waktu siklus pembuatan part dalam satuan detik (misal `45s`). Digunakan untuk menghitung estimasi waktu rampung dan kapasitas beban.
4.  **Cavity**: Jumlah cetakan aktif dalam sekali injeksi (misal `1` atau `2`).
5.  **Tonnage**: Kapasitas tonase mesin injeksi yang disyaratkan untuk mencetak part tersebut (misal `150T`, `350T`).
6.  **Forecast N s/d N+3**: Jumlah perkiraan pesanan untuk bulan aktif (N) hingga 3 bulan ke depan untuk analisis kebutuhan kapasitas jangka menengah.

---

## Hubungan ke Logika Bisnis

Parameter Part Master dibaca secara langsung oleh fungsi-fungsi domain di backend untuk menghasilkan kalkulasi:
*   **FUKA Calculator**: Menghitung beban kerja mesin harian dalam satuan jam berdasarkan rumus: `((dailyRequirement / cavity) * cycleTime) / 3600`.
*   **Forecast Converter**: Melakukan konversi antara kebutuhan volume bulanan dan rata-rata kebutuhan harian dengan pembagi standar 20 hari kerja efektif per bulan.

---

*Untuk mempelajari cara menerjemahkan nomor part eksternal customer ke nama internal, buka halaman [Konversi Part Number (Sebango)](./order-conversion.md).*
