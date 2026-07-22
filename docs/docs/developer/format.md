---
sidebar_position: 2
---

# Format Swagger & OOP Frontend

Halaman ini menjelaskan standar penulisan dokumentasi API di backend dan pembungkusan logika di frontend.

---

## 1. Format Swagger (Backend API Documentation)

Setiap kali Anda membuat endpoint router baru di backend, Anda wajib mendokumentasikannya langsung di file `*.routes.ts` bersangkutan menggunakan format anotasi JSDoc JSDoc Swagger. 
Anotasi ini akan otomatis di-scan oleh generator Swagger saat server dijalankan dan ditampilkan pada halaman `/api/docs`.

### Standar Penulisan Swagger JSDoc:
*   Tempatkan anotasi tepat di atas inisialisasi route Express.
*   Gunakan parameter terstruktur: `tags`, `summary`, `parameters`, `requestBody` (untuk POST/PUT), dan `responses` (disertai status code).

### Contoh Templat Penulisan:
```typescript
/**
 * @swagger
 * /api/your-feature:
 *   post:
 *     tags: [YourFeatureLabel]
 *     summary: Deskripsi singkat fungsi endpoint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [required_field]
 *             properties:
 *               required_field: { type: string }
 *     responses:
 *       201:
 *         description: Data berhasil disimpan/dibuat
 *       400:
 *         description: Validasi input gagal
 */
yourRoutes.post('/', requireAuth, yourController.create);
```

---

## 2. Format OOP di Frontend (Service Class & Singleton)

Untuk memisahkan logika UI (React components) dari logika bisnis/HTTP request, frontend Sugity Production Planning menerapkan standar **Object-Oriented Programming (OOP)** di dalam folder `context` atau `services` pada setiap fitur.

### Standar Format OOP Frontend:
1.  **Deklarasi Class**: Tulis semua fungsi pemrosesan data, kalkulasi, pemetaan status, dan pemanggilan API Axios ke dalam bentuk metode di dalam sebuah kelas (`class`).
2.  **Ekspor Singleton**: Hindari melakukan ekspor kelas mentah secara langsung. Alih-alih, instansiasi kelas tersebut menjadi sebuah konstanta singleton di baris akhir file dan ekspor konstanta tersebut agar instansinya konsisten di seluruh aplikasi.

### Contoh Implementasi OOP Frontend:
```typescript
import api from '../../../shared/lib/axios';

export class FeatureService {
  // Metode memproses konversi data internal
  resolveStatus(data: RawData): string {
    if (data.isWarning) return 'warning';
    return 'normal';
  }

  // Metode berinteraksi dengan API Backend
  async fetchItems(): Promise<ItemData[]> {
    const res = await api.get('/your-feature');
    return res.data?.data || [];
  }
}

// Ekspor instance singleton untuk digunakan di komponen React
export const featureService = new FeatureService();
```

Di dalam komponen React, Anda cukup mengimpor `featureService` dan memanggil metodenya langsung:
```typescript
import { featureService } from '../context/FeatureService';

// Di dalam komponen:
const status = featureService.resolveStatus(rawData);
```

---

*Untuk memahami alur end-to-end penambahan fitur baru di codebase ini, buka halaman [Alur Penambahan Fitur](./flow.md).*
