---
sidebar_position: 3
---

# Aturan Status Warna Mesin

Untuk memberikan sinyal visual yang cepat dipahami oleh tim di area pabrik, sistem memetakan berbagai kondisi mesin ke dalam beberapa status warna utama.

---

## Logika Pemetaan Status (Status Resolution)

Di dalam frontend (`BoardService.ts`), status mesin disaring menggunakan fungsi penentu prioritas status berikut:

```typescript
resolveStatus(mc: MappedMachineStatus): MachineStatus {
  if (mc.isAbnormalLong) return 'abnormal-critical';
  if (mc.isAbnormal) return 'abnormal';
  if (mc.isNgActive) return 'ng';
  if (mc.isDandori) return 'dandori';
  if (mc.isRunning) return 'running';
  return 'idle';
}
```

---

## Tabel Skema Warna dan Maknanya

| Status | Representasi Warna | Deskripsi / Makna |
| :--- | :--- | :--- |
| **Abnormal Critical** (`abnormal-critical`) | Merah Pekat + Ping Animation | Terjadi abnormality dengan durasi yang sudah melewati batas toleransi tertentu (membutuhkan tindakan darurat segera). |
| **Abnormal** (`abnormal`) | Merah | Operator melaporkan adanya abnormality mesin (misal: material habis, cetakan tersangkut). |
| **NG Active** (`ng`) | Merah Tua / Berkedip | Ditemukan produk cacat (Not Good) yang sedang dianalisis atau diproses. |
| **Dandori** (`dandori`) | Kuning / Oranye | Mesin sedang dalam proses changeover (penyetelan cetakan/mold baru atau penggantian resin). |
| **Running** (`running`) | Hijau | Mesin beroperasi normal memproduksi part sesuai jadwal. |
| **Idle** (`idle`) | Abu-abu | Mesin dalam kondisi mati/standby, tidak ada job aktif yang sedang berjalan. |

---

*Untuk mempelajari navigasi cepat antar modal detail mesin, buka halaman [Navigasi Detail Mesin](./machine-switching.md).*
