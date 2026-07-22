# Frontend - PT. Sugity Creatives Production Planning

## 1. Overview
Aplikasi ini adalah Portal Perencanaan Produksi (Production Planning Portal) untuk PT. Sugity Creatives. Aplikasi ini menyediakan **3M Dashboard** dan **Production Control** untuk visualisasi timeline Heijunka serta monitoring mesin secara real-time.
- **Target Pengguna**: Operator shopfloor, Supervisor (Leader), Planner, dan Super Admin.
- **Tech Stack Utama**:
  - **Core**: React 19, TypeScript, Vite
  - **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
  - **State Management**: Zustand (Global UI/Device state), React Query (Server state)
  - **Routing**: React Router v7
  - **Real-time**: Socket.io Client
  - **Hardware Integration**: Web Bluetooth API, `nosleep.js` (Wake Lock)

- **Library & Package Pendukung**:
  - `axios`: HTTP Client.
  - `@tanstack/react-query`: Fetching, caching, dan sinkronisasi data dari server.
  - `zustand`: Manajemen state global yang ringan.
  - `react-router-dom`: Navigasi dan manajemen rute.
  - `socket.io-client`: Komunikasi WebSocket secara real-time.
  - `lucide-react`: Kumpulan ikon berbasis komponen React.
  - `recharts`: Library pembuat grafik dan visualisasi data.
  - `@hello-pangea/dnd`: Implementasi fitur Drag-and-Drop.
  - `date-fns`: Utilitas untuk format dan manipulasi penanggalan.
  - `qrcode`: Generator grafis untuk kode QR.
  - `clsx` & `tailwind-merge`: Utilitas untuk penggabungan nama class Tailwind CSS secara dinamis.
  - `nosleep.js`: Fallback dan API layar untuk menahan *wake lock*.

## 2. Getting Started

### Prerequisites
- Node.js (v18 atau lebih baru disarankan)
- npm (Node Package Manager)

### Instalasi & Setup
1. Clone repositori dan masuk ke folder `frontend`.
2. Install dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi Environment Variables:
   Buat file `.env` di root folder `frontend`. Walaupun `vite.config.ts` sudah mengatur proxy ke backend lokal (`http://127.0.0.1:3000`), Anda mungkin perlu mengatur beberapa variabel spesifik (misal `VITE_API_URL` jika di environment production).

### Menjalankan Server (Development)
```bash
npm run dev
```
Aplikasi akan berjalan (secara default Vite menggunakan port 5173 atau yang tersedia). Request ke `/api` dan `/socket.io` otomatis diproxy ke backend.

### Build (Production)
```bash
npm run build
```
Menghasilkan bundle statis di folder `dist/`.

## 3. Project Structure
Proyek ini menggunakan arsitektur **Feature-Sliced/Feature-Based** untuk skalabilitas:

- `src/features/`: Modul aplikasi yang dipisah berdasarkan fitur bisnis (contoh: `auth`, `production`, `machines`, `orders`, dsb.). Masing-masing fitur dapat memiliki `components`, `pages`, `context`, `services` sendiri.
- `src/shared/`: Komponen yang digunakan secara global, mencakup:
  - `components/`: UI dasar (layout, form, modal)
  - `hooks/`: Custom hooks global (misal `useScreenControls`)
  - `store/`: Zustand global stores (`useAuthStore`, `useThemeStore`, `useBtPrinterStore`)
  - `lib/`: Konfigurasi library eksternal (Axios instance)
- `src/app/`: Bootstrap dan app-wide providers.
- **Alur Data**: Server state ditangani oleh React Query untuk fetching, caching, dan invalidation. Client state/Device state ditangani oleh Zustand. Context API digunakan pada level fitur jika dibutuhkan enkapsulasi lokal.

## 4. Routing
Routing dikonfigurasi di `App.tsx` menggunakan `react-router-dom`.
- **Public Route**: `/login`
- **Protected Routes**: Dilindungi oleh komponen `ProtectedRoute` yang memeriksa status autentikasi dan **Role-Based Access Control (RBAC)**.
  - `/dashboard` (Role: `super-admin`, `planner`, `leader`, `production-board`)
  - `/orders`, `/database` (Role: `super-admin`, `planner`)
  - `/production`, `/production/:machine`, `/production/:machine/:tab` (Role: `super-admin`, `planner`, `leader`)
  - Admin/Master Data (Role: `super-admin`): `/users`, `/factories`, `/machines`, `/global-logs`, `/site-config`

## 5. State Management & Data Fetching
- **API Fetching**: Konsumsi REST API dilakukan melalui instance `axios` yang terpusat. Request ini dibungkus menggunakan React Query untuk handling *loading*, *error*, dan caching.
- **Real-time Data**: Menggunakan `socket.io-client` untuk mendengarkan event dari server (seperti update status mesin, perubahan plan produksi). Proxy WebSocket sudah dikonfigurasi di `vite.config.ts`.
- **Global State**: Zustand digunakan untuk Session/Auth, Theme UI, dan koneksi Bluetooth.

## 6. Komponen Utama & UI Patterns
- **Layouts**: Menggunakan `PageLayout` sebagai cangkang (shell) utama aplikasi.
- **Styling**: Memanfaatkan fitur terbaru Tailwind CSS v4. Kelas utilitas digunakan langsung secara luas tanpa banyak file CSS kustom. Konfigurasi tema disinkronisasikan melalui Zustand (`useThemeStore`).
- **Icons & Data Viz**: Menggunakan `lucide-react` untuk ikon dan `recharts` untuk visualisasi grafik data produksi/timeline.

## 7. Autentikasi & Otorisasi
- **Login Flow**: Pengguna login (PIN di-hash `scrypt` di sisi backend). Backend mengembalikan token/session yang disimpan dan dikelola oleh `useAuthStore`.
- **Role-Based UI (RBAC)**: Render komponen `ProtectedRoute` menyesuaikan prop `allowedRoles`. Jika peran (role) pengguna tidak sesuai, mereka dialihkan ke `/forbidden`. Navigasi/Menu juga bisa dirender kondisional berdasarkan role pengguna yang sedang login.

## 8. Integrasi Hardware/Device (Fitur Spesifik)
- **Bluetooth Printer (`useBtPrinterStore`, `useBtPrinterManager`)**:
  - Menggunakan Web Bluetooth API.
  - Menyimpan metedata *pairing* di `localStorage`.
  - Memiliki kapabilitas **Auto-Reconnect**: otomatis mencari printer dari daftar *permitted devices* dan menghubungkan GATT server jika aplikasi dimuat ulang.
  - Secara otomatis memindai service UUID untuk mencari karakteristik yang writable.
- **Wake Lock (`useScreenControls`)**:
  - Menjaga agar layar device (misalnya tablet/kiosk shopfloor) tidak mati (sleep).
  - Menggunakan library `nosleep.js` yang memanfaatkan `navigator.wakeLock`.
  - Sebagai fallback pada WebView lawas, memainkan *silent video* pada *canvas* agar sistem operasi mendeteksi aktivitas pemutaran media dan menahan state *sleep*.

## 9. Environment & Deployment
- **Docker Compose Setup**: File `docker-compose.yml` di root proyek saat ini hanya ditujukan untuk menjalankan layanan infrastruktur (database PostgreSQL dan Redis) yang dibutuhkan oleh backend. Frontend tidak dijalankan via Docker pada setup bawaan ini.
- **Local Development**: Untuk menjalankan aplikasi secara penuh di lokal, pastikan service Docker sudah berjalan (`docker compose up -d`), backend berjalan, lalu jalankan frontend secara terpisah menggunakan `npm run dev`.
- **Deployment (Production)**:
  1. Sesuaikan variabel di `.env` jika diperlukan untuk lingkungan production.
  2. Jalankan perintah `npm run build` untuk membuat production bundle.
  3. Pindahkan (deploy) isi dari direktori `/dist` ke web server pilihan Anda (misalnya Nginx, Vercel, Netlify). 
  4. Pastikan web server dikonfigurasi untuk menangani *client-side routing* (fallback ke `index.html`) dan melakukan *reverse-proxy* request `/api` dan `/socket.io` ke server backend.
