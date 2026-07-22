---
sidebar_position: 2
---

# Unggah Berkas Forecast (Upload Forecast)

Untuk menghindari input data manual satu per satu yang rawan kesalahan, sistem menyediakan fitur **Bulk Upload Forecast** menggunakan file spreadsheet (Excel/CSV).

---

## Alur Unggah Berkas

1.  **Pemuatan File**: 
    Planner memilih berkas spreadsheet dari lokal komputer mereka dan mengunggahnya melalui tombol drag-and-drop di browser.
2.  **Validasi Struktur**: 
    Frontend memvalidasi kolom berkas (memastikan data part number, nama model, jumlah permintaan harian/bulanan terisi lengkap).
3.  **Pengiriman Bulk ke Server**: 
    Data dikirimkan ke endpoint `POST /api/history-orders/upload`.
4.  **Pencatatan Batch ID**: 
    Setiap proses unggah otomatis mendapatkan kode `batch_id` unik. Backend menyimpan seluruh snapshot data forecast ke dalam tabel database historis (`history_orders`) untuk pelacakan masa lalu (audit trail).
5.  **Upsert Ke Master**: 
    Secara bersamaan, backend memperbarui data master part jika ditemukan part number baru dengan metode database `ON CONFLICT DO UPDATE`.

---

## Log Riwayat Forecast

*   Planner dapat melihat riwayat dokumen forecast yang pernah diunggah lengkap dengan nama berkas, waktu pengunggahan, jumlah baris data, dan pengidentifikasi batch untuk mempermudah pelacakan audit.

---

*Untuk mempelajari cara mengelola spesifikasi teknis part cetak, buka halaman [Part Master](./part-master.md).*
