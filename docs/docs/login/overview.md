---
sidebar_position: 1
---

# Tinjauan Umum Alur Login

Untuk mengamankan akses sistem perencanaan produksi di lingkungan pabrik, Sugity Production Planning menggunakan skema **autentikasi bertingkat** (Multi-level Authentication) yang terbagi menjadi dua gerbang masuk utama:

1.  **Device Login (Otorisasi Perangkat/Browser)**
2.  **Member Machine Login (Pilih Stasiun Kerja & Masukkan PIN)**

---

## Mengapa Alur Bertingkat Digunakan?

Pada area produksi (shopfloor), sebuah tablet Android sering kali dipasang permanen pada stasiun mesin tertentu dan digunakan bergantian oleh beberapa operator lintas shift kerja. 
*   **Keamanan Token**: Device Login memastikan browser pada tablet tersebut terdaftar secara resmi di backend dan mendapatkan token akses (JWT).
*   **Kemudahan Operator**: Operator tidak perlu mengetikkan alamat email dan password yang panjang saat berganti shift. Mereka cukup memilih nama stasiun kerja mereka dan memasukkan 4-6 digit PIN operator secara cepat di layar.

---

## Aliran Proses Log Masuk (Login Flow)

Berikut adalah diagram alur proses login dari sudut pandang perangkat tablet shopfloor:

```mermaid
flowchart TD
    Start([Buka Aplikasi]) --> CheckAuth{Apakah Perangkat Berotentikasi?}
    
    CheckAuth -- Tidak --> DevLogin[Lakukan Device Login\nInput User & Password]
    DevLogin --> VerifyDev[Backend Set Cookie JWT]
    VerifyDev --> CheckAuth
    
    CheckAuth -- Ya --> CheckRole{Apakah Role = 'member'?}
    
    CheckRole -- Tidak (Planner/Admin/Leader) --> RedirectDash[Masuk ke Portal /dashboard atau /board]
    CheckRole -- Ya (Tablet Shopfloor) --> ChooseStation[Halaman Pilih Stasiun & Input PIN]
    
    ChooseStation --> InputPIN[Operator Input PIN & Stasiun Mesin]
    InputPIN --> VerifyPIN[Verifikasi PIN oleh Backend]
    
    VerifyPIN -- Sukses --> RedirectExecution[Masuk ke Halaman Eksekusi Produksi]
    VerifyPIN -- Gagal (PIN Salah) --> ShowError[Tampilkan Error & Kunci Layar jika Berulang]
```

---

*Untuk mempelajari konfigurasi dan detail langkah Device Login, silakan buka halaman [Login Perangkat](./device-login.md).*
