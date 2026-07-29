---
sidebar_position: 4
---

# Navigasi Perpindahan Detail Mesin (Machine Switching)

Ketika pengguna (seperti Planner, Leader, atau Super Admin) memantau mesin-mesin di halaman Monitoring Board (`/board`), mereka dapat melihat rincian rencana heijunka, parameter OEE, part list, dan histori abnormalitas dari mesin tertentu secara mendalam melalui modal detail mesin (`BoardMachineDetailModal.tsx`).

:::warning 
Seluruh informasi detail yang diakses melalui tombol navigasi modal di halaman `/board` bersifat **view-only (read-only)**. Tidak ada tombol eksekusi atau fitur modifikasi data yang aktif di sini.
:::

Untuk mempermudah pemantauan tanpa harus keluar-masuk jendela modal detail, sistem menyediakan fitur **Navigasi Cepat Detail Mesin (Next/Prev Machine Switching)**.

---

## Mekanisme Kerja Navigasi Modal

1.  **Tombol Navigasi**: 
    Di bagian header modal (`BoardMachineModalHeader.tsx`), terdapat tombol panah **Kanan (Next)** dan **Kiri (Prev)**.

    ![Mockup Tombol Navigasi di Monitoring Board](pathname:///img/tombol_navigasi.png)

2.  **Pemilihan Target**:
    Ketika tombol ditekan, frontend memicu fungsi `handleNavigateMachine` pada `BoardPage.tsx` yang secara programatis mencari indeks mesin aktif di dalam daftar mesin (`allMachinesList`) lalu memajukan atau memundurkan pilihan mesin:
    ```typescript
    const handleNavigateMachine = (direction: 'next' | 'prev') => {
      const activeMachine = urlMachine || selectedMachine?.machine;
      if (!activeMachine) return;

      const currentIndex = allMachinesList.findIndex(m => m.code === activeMachine || m.id === activeMachine);
      if (currentIndex === -1) return;

      let newIndex = currentIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % allMachinesList.length;
      } else {
        newIndex = (currentIndex - 1 + allMachinesList.length) % allMachinesList.length;
      }

      const target = allMachinesList[newIndex];
      setSelectedMachine({ machine: target.code, tonnage: target.tonnage, factory: target.factory });
      navigate(`/board/${target.code}/${urlTab || 'pattern'}`);
    };
    ```
3.  **Sinkronisasi Rute Browser**:
    Perpindahan mesin otomatis memperbarui path URL browser menjadi `/board/:machineCode/:activeTab`. Ini memastikan link detail mesin bersifat *bookmarkable* dan dapat dibagikan langsung ke rekan kerja lainnya.

---

*Langkah berikutnya adalah menjelajahi proses pengerjaan produksi harian di [Tinjauan Umum Eksekusi Produksi](../produksi/overview.md).*
