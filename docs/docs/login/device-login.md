---
sidebar_position: 2
---

# Login Perangkat (Device Authorization)

**Device Authorization** adalah langkah pertama yang wajib dilakukan saat aplikasi dibuka pada peranti browser atau tablet baru. Proses ini memverifikasi bahwa peranti tersebut diperbolehkan mengakses sistem.

---

## Siapa yang Menggunakan?

Semua peran (Planner, Leader, Super Admin, Production Board, dan Akun Umum Kios Tablet) wajib melalui tahap ini. 
*   Bagi admin/planner/leader, langkah ini langsung membawa mereka masuk ke dalam portal administratif masing-masing.
*   Bagi peranti tablet shopfloor, administrator akan memasukkan kredensial perangkat yang memiliki hak akses terbatas dengan role `member`.

---

## Cara Melakukan Device Login

1.  Buka web browser dan akses alamat aplikasi.
2.  Jika peranti belum terdaftar, Anda akan melihat tampilan form **Device Authorization**.
3.  Masukkan **Username** dan **Password** perangkat yang telah dibuat oleh Super Admin (misalnya akun khusus tablet shopfloor dengan nama pengguna `tablet-f2-resin`).
4.  Klik tombol **Authorize Workstation**.

![Mockup Form Device Authorization](pathname:///img/device_login_mockup.png)


---

## Logika di Sisi Teknis (Under the Hood)

*   **Endpoint**: Mengirim request `POST /api/auth/login`.
*   **Cookie Session**: Backend merespon dengan sukses dan menyematkan cookie `sugity_session` yang bersifat `HttpOnly` dan `SameSite=Lax`. Token JWT disimpan aman di dalam cookie browser sehingga terlindung dari pembacaan skrip jahat (XSS).
*   **Session State**: Frontend mendeteksi login sukses via `useAuthStore` (Zustand) dan memperbarui state `isAuthenticated` menjadi `true`.
*   **Redireksi Otomatis**:
    *   Jika peran pengguna adalah `super-admin`, `planner`, atau `leader`, mereka akan langsung diarahkan ke halaman `/dashboard`.
    *   Jika peran pengguna adalah `production-board` (untuk display TV), mereka diarahkan ke `/board`.
    *   Jika peran pengguna adalah `member` (tablet stasiun kerja), sistem akan mendeteksi perlunya otorisasi tahap kedua dan mengarahkan ke halaman pilihan mesin.

---

*Untuk mempelajari gerbang autentikasi kedua bagi operator di stasiun kerja, lanjutkan ke halaman [Login Member Operator](./member-login.md).*
