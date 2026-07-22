---
sidebar_position: 3
---

# Alur Kontrol Pekerjaan (Job Control)

Halaman ini mendokumentasikan langkah demi langkah alur kerja operasional harian yang wajib diikuti oleh **member operator** di shopfloor saat menjalankan mesin produksi.

---

## Prosedur & Alur Kerja Operasional Mesin

Alur kerja dimulai dari penyetelan awal hingga pergantian job berikutnya harus mengikuti 5 langkah berurutan di bawah ini:

### 1. Memulai Persiapan Awal (Finish Preparation)
Sebelum memproses material cetak, operator harus melakukan persiapan stasiun kerja (pengecekan cetakan/mold, kesiapan resin, serta parameter mesin). 
*   Di layar tablet, status job akan bertuliskan **Preparation Mode (Shift Start)** atau **Dandori Setup Mode (Changeover)**.
*   Tombol *Finish Shift Preparation* / *Finish Dandori Setup* terkunci secara terjadwal jika waktu belum tiba (kecuali di-bypass oleh Leader).
*   Setelah semua pengecekan selesai dan waktu kerja dimulai, **member operator menekan tombol Finish Preparation** di layar tablet untuk mengubah status mesin menjadi **Running**.

### 2. Notifikasi Cetak Kanban (Bunyi Alert Sistem)
Selama proses produksi berjalan normal, sistem akan terus mencatat kuantitas hasil cetak secara otomatis atau semi-otomatis.
*   Setiap kali target lot per boks tercapai (kelipatan kuantitas isi boks Kanban), kunci pencetakan Kanban akan otomatis terbuka (*Print Lock* dinonaktifkan).
*   Untuk memberi tahu operator bahwa label Kanban siap dicetak, **sistem akan mengeluarkan bunyi peringatan (Loud Kanban Beep) secara berulang-ulang setiap 2 detik**.
*   Bunyi *beep* ini dihasilkan secara dinamis menggunakan Web Audio API pada browser tablet untuk memotong kebisingan di shopfloor. Bunyi hanya akan mati setelah operator menekan tombol cetak dan menyelesaikan proses print label Kanban.

### 3. Penanganan Masalah (Abnormalitas & NG)
Selama proses produksi berjalan, apabila mesin mendadak bermasalah (mati lampu, cetakan macet) atau operator menemukan produk cacat (Not Good):
*   **Member operator harus segera menekan tombol Stop/NG** yang tersedia dengan jelas di layar tablet.
*   Operator diwajibkan **memilih jenis abnormalitas atau tipe NG pada Activity Log** di layar untuk mencatat kejadian secara akurat ke dalam database audit sistem.
*   Status mesin di Monitoring Board TV akan seketika berubah warna menjadi **Merah (Abnormal/NG)** dan sistem tablet operator akan dikunci demi keselamatan kerja serta menjaga kualitas produk.

### 4. Penyelesaian Job & Verifikasi PIN
Setelah target total lot rencana kerja tercapai seluruhnya:
*   Pekerjaan akan dihentikan dan layar tablet akan meminta input konfirmasi PIN pengawas.
*   **Planner (atau Leader) akan mendatangi mesin secara fisik untuk melakukan pengecekan kualitas akhir**, kemudian **memberikan input PIN otorisasi** pada layar tablet operator untuk memverifikasi penyelesaian pekerjaan dan secara resmi melanjutkan ke antrean rencana kerja berikutnya.

### 5. Menyelesaikan Hingga Dandori Terakhir
*   Di akhir shift produksi harian, operator dan tim wajib menyelesaikan seluruh sisa rencana kerja mesin, termasuk melaksanakan proses pembersihan mold dan penyetelan ulang (dandori) terakhir.
*   Pastikan status seluruh antrean heijunka hari itu selesai dengan sempurna sebelum menutup shift produksi harian di tablet.

---

*Untuk mempelajari logika batasan pencetakan label secara teknis, silakan buka halaman [Mekanisme Kunci Cetak (Print Lock)](./print-lock.md).*
