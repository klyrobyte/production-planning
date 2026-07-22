---
sidebar_position: 3
---

# Login Member Operator & PIN

Setelah perangkat browser berhasil lolos verifikasi Device Login dengan peran `member`, aplikasi akan masuk ke gerbang autentikasi kedua yaitu **Member Machine Login**. Layar ini diperuntukkan bagi **member operator** yang akan bekerja di stasiun mesin tertentu.

---

## Alur Kerja Operator

1.  **Pilih Stasiun Mesin**:
    Operator memilih area pabrik (Plant) dan nama stasiun mesin yang akan mereka operasikan melalui menu dropdown.
2.  **Input PIN**:
    Operator memasukkan 4-6 digit PIN khusus mereka menggunakan numpad virtual yang disediakan pada layar tablet.
3.  **Masuk ke Halaman Kerja**:
    Setelah PIN terverifikasi, aplikasi akan mengalihkan operator ke halaman eksekusi rencana kerja mesin bersangkutan (`/production/:machineCode/execution`).

![Mockup Form Member Machine Login](pathname:///img/member_login_mockup.png)

---

## Logika Verifikasi PIN

*   **Keamanan PIN**: PIN masing-masing operator dikelola di server backend. Untuk pencocokan cepat dan aman, backend membandingkan input PIN dengan `pin_hash` operator yang tersimpan dengan enkripsi satu arah (Bcrypt).
*   **Pencegahan Brute-Force**: Untuk mencegah tebakan PIN secara berulang-ulang dari pihak tidak bertanggung jawab, backend menerapkan pembatasan rate limit berbasis Redis. Jika terdeteksi kegagalan berturut-turut, akses verifikasi PIN stasiun kerja tersebut akan diblokir sementara.
*   **Penyimpanan Status**: Setelah berhasil masuk, status otorisasi disimpan ke dalam `useAuthStore` pada variable `isOperatorAuthenticated = true` dan kode mesin aktif disimpan pada `activeMachineCode`. Status ini digunakan untuk menjaga operator tetap berada pada mesin tersebut tanpa perlu memasukkan PIN kembali kecuali terjadi *logout* atau habis masa shift.

---

*Langkah berikutnya adalah menjelajahi halaman pemantauan visual di [Tinjauan Umum Monitoring Board](../board/overview.md).*
