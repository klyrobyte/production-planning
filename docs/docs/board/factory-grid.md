---
sidebar_position: 2
---

# Pengelompokan Grid Mesin (Factory Grid)

Halaman Monitoring Board membagi dan menyusun susunan mesin-mesin pabrik secara terstruktur agar mudah dibaca dari jarak jauh.

---

## Logika Pemetaan Baris (Row Mapping)

Daftar mesin dikelompokkan secara dinamis berdasarkan unit pabrik (Plant) menggunakan data terstruktur yang dikembalikan oleh backend.
*   **Pengelompokan**: Kode mesin dipetakan ke dalam baris-baris pabrik (misalnya baris khusus area `F2 Resin`, `F3 Resin`, dst).
*   **Struktur Grid**: Setiap baris pabrik menampilkan kartu mesin (*Machine Card*) secara berjejer horizontal.
*   **Logika Frontend**: Menggunakan `BoardService` (`mapFactoryRows`) untuk meratakan data pabrik dan mesin menjadi array terstruktur:
    ```typescript
    mapFactoryRows(dynamicResinData: any[]): BoardFactoryRowType[] {
      if (!dynamicResinData) return [];
      return dynamicResinData.flatMap(plant =>
        plant.factories.map((fact: any) => ({
          plant: plant.plant,
          name: fact.name,
          machines: fact.machines
        }))
      );
    }
    ```

---

## Kartu Mesin (BoardMachineCard)

Setiap elemen mesin direpresentasikan oleh komponen `BoardMachineCard.tsx` yang menampilkan informasi dinamis:

1.  **Header Kartu**: Menampilkan Kode Mesin (misal `MC-01`) dan Tonnage kapasitas mesin (misal `150T`).
2.  **Informasi Job**: Nama model part yang sedang diproses saat ini.
3.  **Progress Bar**: Bar persentase penyelesaian job berdasarkan perbandingan kuantitas Aktual vs Target.
4.  **Status Warna & Animasi**: Kartu akan berubah warna latar belakang dan memicu efek kedip (*ping animation*) jika status mesin bermasalah.

![Mockup Grid Mesin di Monitoring Board](pathname:///img/board_grid_mockup.png)

---

*Untuk memahami aturan dan warna dari masing-masing status mesin, lanjutkan ke halaman [Aturan Status Warna Mesin](./status-resolution.md).*
