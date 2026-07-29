---
sidebar_position: 1
---

# Tinjauan Teknis & Struktur Codebase

Halaman ini ditujukan bagi pengembang (developer) untuk memahami bagaimana kode sistem Sugity Production Planning diorganisasikan, baik pada sisi backend maupun frontend.

---

## Struktur Folder Umum (Monorepo)

Project ini disusun dalam struktur multi-folder yang memisahkan backend, frontend, dan dokumentasi secara modular:

```text
production-planning/
├── backend/                  # REST API & Socket.io Server (Node.js/TypeScript)
│   ├── src/                  # Source code utama backend
│   └── tests/                # Unit & Integration Tests (Vitest)
│
├── frontend/                 # Web Application (React 19/Vite/Tailwind v4)
│   ├── src/                  # Source code utama frontend
│   │   ├── features/         # Modul modular per fitur bisnis
│   │   └── shared/           # Komponen, hook, store global
│   └── dist/                 # Hasil build produksi statis
│
├── docs/                     # Project Web Dokumentasi (Docusaurus)
└── docker-compose.yml        # Setup database PostgreSQL & Redis untuk lokal dev
```

---

## Pola Desain Backend (4-Layer Pattern)

Backend dikembangkan menggunakan Express.js 5 dengan TypeScript. Setiap modul fungsional di bawah `/backend/src/modules/` dipisah secara ketat menjadi 4 layer utama:

| Layer | Berkas / Nama | Tanggung Jawab |
| :--- | :--- | :--- |
| **Routing** | `*.routes.ts` | Definisi jalur API, anotasi Swagger JSDoc, pemasangan middleware validasi & otorisasi peran (requireRole). |
| **Controller**| `*.controller.ts` | Penerima input HTTP request (body, query, params), pemanggil logika service, dan pengirim JSON HTTP response. |
| **Service** | `*.service.ts` | Otak pemrosesan bisnis (business logic), validasi aturan pabrik, dan manipulasi data internal. |
| **Repository**| `*.repository.ts` | Pengumpul query SQL mentah menggunakan database pool pg. Tidak boleh disusupi logika bisnis. |

---

## Pola Desain Frontend (Feature Folder Convention)

Frontend dikembangkan dengan React 19 dan dipilah ke dalam direktori `/frontend/src/features/`. Setiap sub-folder fitur di dalamnya wajib mematuhi konvensi folder berikut untuk menjaga modularitas:

| Direktori | Deskripsi & Tanggung Jawab | Contoh File |
| :--- | :--- | :--- |
| **`pages/`** | Komponen halaman utama sesungguhnya yang didaftarkan pada konfigurasi *routing*. Berperan sebagai *entry point* utama visual. | `BoardPage.tsx`, `LoginPage.tsx` |
| **`components/`** | Potongan elemen UI terkecil atau bagian sub-halaman visual spesifik yang menyusun halaman utama dari fitur bersangkutan. | `MemberLoginForm.tsx` (di auth), `BoardMachineCard.tsx` (di board) |
| **`context/` / `services/`** | Logika bisnis frontend, pengisolasian React Context, *custom hooks* lokal, kelas layanan (service class), dan panggilan API Axios. | `BoardService.ts`, `AuthContext.tsx` |

---

## Pemisahan Logika Domain (Domain Logic Separation)

Untuk memudahkan penulisan pengujian unit tanpa harus terikat ke database atau HTTP layer, aturan bisnis pabrik dipisahkan sebagai fungsi murni (pure functions) di dalam folder `backend/src/domain/`:
*   **fuka-calculator.ts**: Rumus perhitungan beban mesin.
*   **print-lock-validator.ts**: Logika batasan anti-fraud cetak label.
*   **machine-key-resolver.ts**: Normalisasi format penulisan kode mesin.

Fungsi-fungsi di atas diuji secara intensif menggunakan Vitest di folder `/tests/unit/`.

---

*Untuk memahami standar penulisan Swagger dan Object-Oriented Programming (OOP) di frontend, buka halaman [Format Swagger & OOP Frontend](./format.md).*
