---
sidebar_position: 5
---

# Pencatatan Abnormalitas & NG (Activity Log)

Ketika terjadi kendala operasional pada mesin atau ditemukan produk cacat (NG) di lapangan, sistem menyediakan fitur pencatatan terstruktur yang dapat diakses langsung oleh **member operator** di stasiun tablet.

---

## 1. Alur Pelaporan Abnormalitas
Jika mesin mengalami gangguan (misal: material habis, mold tersangkut, pemeliharaan mesin, dll):
1.  **Pelaporan Awal**: Member operator menekan tombol **Stop/Abnormal** di layar tablet.
2.  **Pemilihan Tipe**: Sistem memunculkan dialog log aktivitas (*Activity Log*). Operator memilih klasifikasi gangguan (misal: *Investigation, Mold Setup, Resin Change, Machine Maintenance*).
3.  **Pencatatan**: Setelah disimpan, status mesin pada database diperbarui dan disebarkan secara real-time ke Monitoring Board TV menjadi warna **Merah (Abnormal)**. Waktu mulai gangguan direkam secara otomatis.
4.  **Penyelesaian (Resolve)**: Setelah masalah teratasi secara fisik, **member operator dapat langsung menekan tombol Resolve** di tablet. Sistem akan mengalkulasi durasi downtime dalam hitungan menit dan mengembalikan status mesin menjadi normal (**Running**). 
    *   *Catatan: Proses pelaporan dan pemulihan abnormalitas ini **tidak membutuhkan verifikasi PIN Leader**. Operator dapat menginput dan menyelesaikannya sendiri.*

---

## 2. Alur Pelaporan Produk Cacat (NG)
Jika operator mendeteksi adanya output produk yang tidak memenuhi standar kualitas (Not Good):
1.  Operator menekan tombol **NG** di tablet.
2.  Memasukkan jenis cacat yang ditemukan pada Activity Log untuk pencatatan statistik kualitas.
3.  Status mesin di TV Monitoring Board akan berubah menjadi **Oranye/Kuning (NG Active)**.
4.  Setelah penanganan kualitas selesai, operator menekan tombol **Resolve NG** untuk mengembalikan status kerja.

---

## 3. Logika Integrasi Keamanan PIN Leader
Penggunaan **PIN Leader** (yang dienkripsi dengan AES-256-GCM di backend) **hanya diwajibkan saat proses penyelesaian akhir pekerjaan (Job Sign-off)**, bukan pada saat pelaporan abnormalitas harian.
*   Saat seluruh kuantitas target rencana kerja (lot) terpenuhi, sistem membutuhkan otorisasi pengawas.
*   Leader wajib mengecek kondisi fisik output di stasiun kerja, mencentang checklist kesiapan parameter parameter mesin di tablet, lalu **memasukkan PIN Leader** untuk menutup *active job* secara resmi dan melanjutkan ke antrean rencana kerja berikutnya.

---

*Langkah berikutnya adalah menjelajahi fitur pembuatan rencana produksi di [Tinjauan Umum Perencanaan](../perencanaan/overview.md).*
