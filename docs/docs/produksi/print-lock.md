---
sidebar_position: 4
---

# Mekanisme Kunci Cetak (Print Lock)

Untuk mencegah kecurangan (anti-fraud) berupa pencetakan label Kanban sebelum kuantitas produk siap cetak secara fisik selesai dibuat oleh mesin, sistem menerapkan pembatasan ketat yang disebut **Print Lock**.

---

## Logika Bisnis Print Lock

Pencetakan label Kanban hanya diperbolehkan ketika mesin terbukti telah memproduksi part dengan jumlah kelipatan standar isi boks Kanban.
*   **Contoh**: Jika kapasitas standar satu boks Kanban adalah `50 pcs` (target per lot), operator dilarang mencetak label Kanban pertama ketika kuantitas aktual mesin baru mencapai `49 pcs`. Tombol cetak di UI stasiun tablet akan dinonaktifkan (disabled) dengan label bertuliskan *Locked*.
*   Ketika kuantitas aktual mencapai `50 pcs`, tombol cetak terbuka (*unlocked*), bunyi alarm bip berulang berbunyi, dan operator wajib menekan tombol cetak untuk mengirim instruksi print ke Bluetooth Printer. Setelah dicetak, status kembali terkunci (*locked*) hingga kuantitas aktual mencapai kelipatan berikutnya (`100 pcs`).

---

## Validasi Server-Side

Logika Print Lock tidak hanya divalidasi pada sisi frontend browser, melainkan diverifikasi secara ketat di backend melalui validator `print-lock-validator.ts` sebelum data pencetakan label diperbarui di database:

```typescript
export function validatePrintLock(
  actualQty: number,
  printedCount: number,
  qtyPerBox: number
): { isLocked: boolean; reason?: string } {
  const maxAllowedPrints = Math.floor(actualQty / qtyPerBox);
  if (printedCount >= maxAllowedPrints) {
    return {
      isLocked: true,
      reason: `Kuantitas aktual (${actualQty}) belum mencapai kelipatan target box berikutnya.`
    };
  }
  return { isLocked: false };
}
```

---

*Untuk mempelajari cara membuka kunci stasiun tablet jika terjadi kendala abnormalitas, buka halaman [Abnormality & Pemulihan Sistem (Sign-off)](./abnormality-signoff.md).*
