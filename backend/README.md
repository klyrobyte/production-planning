# Sugity Production Planning — Backend

REST API untuk sistem **Production Planning & Shopfloor Execution** PT. Sugity Creatives. Mengelola data master produksi, jadwal harian mesin, label Kanban, pemantauan abnormality/NG secara real-time di tablet Android shopfloor, serta administrasi pengguna berbasis peran.

---

## Tech Stack

| Layer | Teknologi | Versi |
|---|---|---|
| Runtime | Node.js + TypeScript | `tsx watch` (dev), `tsc` (prod) |
| Framework | Express | v5 |
| Database | PostgreSQL | 17-alpine (Docker) |
| Cache / Rate-limit | Redis | 7-alpine (Docker) |
| Realtime | Socket.io | v4 |
| Auth | JWT (jsonwebtoken) + bcrypt | HttpOnly cookie |
| Enkripsi PIN | AES-256-GCM (Node crypto) | Built-in |
| API Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) | OpenAPI 3.0 |
| Test | Vitest + Supertest | — |

---

## Fitur

### 🔐 Autentikasi & Keamanan

- **Login berbasis session cookie** — JWT disimpan di cookie `HttpOnly; SameSite=Lax; Secure (production)` dengan masa aktif 30 hari. Tidak bisa dibaca JavaScript, aman dari XSS.
- **Rate limiting berbasis Redis** — 5 percobaan login gagal per 60 detik per IP. Menggunakan `rate-limiter-flexible` dengan Redis backend (konsisten meski backend di-scale horizontal).
- **Verifikasi PIN member** — Setiap mesin punya `pin_hash` (bcrypt). Operator verifikasi PIN sebelum bisa memulai job. Rate-limited terpisah dari login.
- **RBAC dinamis** — Role diambil dari tabel `roles` di database, di-cache Redis (TTL 60s). Tidak ada hardcode role di aplikasi; `super-admin` adalah satu-satunya role yang tidak bisa dihapus.

### 👥 Manajemen Pengguna & Role

- **CRUD User** (super-admin) — Buat, update, dan hapus akun pengguna. Setiap user memiliki satu role.
- **CRUD Role** (super-admin) — Role baru bisa ditambah secara dinamis. Hapus role akan diblock jika masih ada user yang menggunakannya.

### 🏭 Manajemen Infrastruktur Produksi

- **CRUD Factory** (super-admin) — Kelola daftar factory (`F2`, `F3`, `F4`, `SC2 Karawang`).
- **CRUD Mesin** (super-admin) — Kelola mesin per factory. Setiap mesin bisa di-toggle `active/inactive` dan memiliki `pin_hash` untuk verifikasi member.

### 👷 Manajemen Leader

- **CRUD Leader** (planner) — Tambah/hapus leader shopfloor.
- **Verifikasi PIN leader** — Digunakan saat sign-off job produksi (control kualitas berlapis).
- **Reveal PIN** (planner only) — PIN leader disimpan dalam dua bentuk: `bcrypt hash` (untuk verifikasi) dan `AES-256-GCM encrypted` (untuk fitur reveal). Planner bisa melihat PIN asli untuk keperluan operasional.

### 📦 Master Data Part

- **CRUD Part** (planner) — Kelola data part lengkap: `cycle_time`, `cavity`, `spec`, `tonnage`, forecast 4 bulan (`N`, `N+1`, `N+2`, `N+3`), dan metadata lainnya.
- **Bulk import** (planner) — Upload seluruh dataset part sekaligus dalam satu transaksi database. Pakai `ON CONFLICT DO UPDATE` (upsert) sehingga aman dijalankan berulang.

### 🔄 Konversi Order

- **CRUD Order Conversions** (planner) — Mapping part number customer (misal Toyota) ke kode `sebango` internal produksi. Setiap part punya kategori `big/small` yang menentukan alur label Kanban berbeda. Data 147+ record adalah aset kritis operasional.

### 📅 Production Plans

- **Upsert jadwal harian** — Simpan/update jadwal produksi per mesin per tanggal. Satu endpoint mendukung insert dan update.
- **Broadcast real-time via Socket.io** — Setiap perubahan jadwal langsung di-broadcast ke semua client yang terhubung (tablet shopfloor, production board). Client subscribe berdasarkan event `production_plan_updated`.

### 🏷️ Label Kanban Counter

- **Counter label per hari** — Menyimpan nomor urut label terakhir yang dicetak per tanggal (`YYYY-MM-DD`). Lintas semua tablet, sehingga nomor label tidak tabrakan.
- **Increment otomatis** — Setiap kali operator cetak label, counter diincrement via upsert.

### 📜 History Orders

- **Bulk insert snapshot** (planner) — Setiap kali planner upload forecast baru, snapshot seluruh data disimpan dengan `batch_id` yang sama. Audit trail permanen.
- **List history** (planner) — Query semua snapshot historis.

### 🪵 Global Logs (Audit Trail)

- **Pencatatan otomatis semua API request** — Middleware `auditLogMiddleware` dipasang global, mencatat setiap request ke tabel `global_logs` secara **async fire-and-forget** (tidak menambah latency response).
- **Data yang dicatat**: timestamp, username, role, HTTP method, endpoint path, IP address (mendukung `X-Forwarded-For` reverse proxy), status code, dan response time (ms).
- **Request unauthenticated tetap dicatat** — username dan role akan `NULL`, IP tetap tercatat. Berguna untuk mendeteksi brute force.
- **Endpoint yang dikecualikan**: `/health` dan `/api/docs` (terlalu noisy).
- **CRUD untuk super-admin** — `GET /api/global-logs` dengan filter (username, method, status_code, endpoint, date range) dan pagination. `DELETE /api/global-logs` untuk clear semua log.

### 🎨 Site Config (Konfigurasi Tema)

- **3 warna sistem yang dapat dikonfigurasi** — `color_primary`, `color_secondary`, `color_navbar` disimpan di database, dapat diubah oleh super-admin tanpa rebuild frontend.
- **Caching Redis** — Config di-cache (TTL 60s) agar tidak query database setiap request. Cache otomatis di-invalidate saat ada update.
- **`GET /api/site-config` bersifat public** — Frontend membaca warna ini saat pertama mount (sebelum login) dan mengaplikasikannya sebagai CSS variables.
- **Default warna dari sistem lama** — `#008d51` (hijau Sugity), `#E76114` (oranye Sugity), `#037233` (hijau navbar).

### 📐 Domain Logic (Pure Functions)

Logic bisnis domain pabrik dipisahkan dari HTTP layer sebagai pure functions yang testable:

- **FUKA Calculator** — `((dailyRequirement / cavity) * cycleTime) / 3600` — menghitung beban kerja mesin per hari dalam jam.
- **Forecast Calculator** — Konversi antara `dailyRequirement` ↔ `monthlyVolume` (konstanta 20 hari kerja/bulan).
- **Print Lock Validator** — Anti-fraud: cegah operator cetak label sebelum mesin secara fisik selesai memproduksi quantity target.
- **Machine Key Resolver** — Normalisasi berbagai variasi penulisan kode mesin dari sumber eksternal (Excel/CSV) menjadi satu format konsisten.

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Client / Frontend                │
└──────────────────────┬──────────────────────────────────┘
                       │ REST + Cookie Auth
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Express App (app.ts)                  │
│                                                         │
│  Global Middleware Stack (urutan penting):              │
│  1. CORS + JSON parser + Cookie parser                  │
│  2. auditLogMiddleware  ← catat semua request           │
│  3. Route handlers      ← requireAuth + requireRole     │
│  4. Global error handler (terakhir)                     │
└────────┬─────────────────────────────┬──────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐          ┌─────────────────────────┐
│   PostgreSQL    │          │          Redis           │
│                 │          │                          │
│ - Data permanen │          │ - RBAC role cache        │
│ - Audit logs    │          │ - Rate limit counters    │
│ - Site config   │          │ - Site config cache      │
└─────────────────┘          └─────────────────────────┘

Modul pattern (tiap resource):
  routes.ts → controller.ts → service.ts → repository.ts → DB
```

**Pola Modul** — Setiap resource mengikuti struktur 4-layer yang sama:

| Layer | Tanggung Jawab |
|---|---|
| `routes.ts` | Definisi endpoint, Swagger JSDoc, pasang middleware RBAC |
| `controller.ts` | Baca request, panggil service, kirim response |
| `service.ts` | Business logic, validasi input |
| `repository.ts` | Query SQL, tidak ada logic bisnis |

---

## Prerequisites

Sebelum memulai, pastikan sudah terinstall:

- **Node.js** `>= 20`
- **npm** `>= 10`
- **Docker Desktop** (untuk PostgreSQL dan Redis)
- **Git**

Opsional (untuk generate secret keys):
- **OpenSSL** atau gunakan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Instalasi & Setup

### 1. Clone dan masuk ke folder backend

```bash
git clone <repo-url>
cd production-planning/backend
npm install
```

### 2. Jalankan PostgreSQL dan Redis via Docker

Di root folder project (bukan di dalam `backend/`):

```bash
# Salin dan isi credentials Docker
cp .env.example .env
# Edit .env: isi POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

# Jalankan container
docker compose up -d

# Verifikasi keduanya running
docker compose ps
```

> **Catatan**: `init.sql` otomatis dijalankan saat volume PostgreSQL pertama kali dibuat. Jika perlu reset schema: `docker compose down -v && docker compose up -d`.

### 3. Seed data awal

Setelah container berjalan, jalankan seed data (roles, users, factories, machines, parts, dll):

```bash
# Salin file seed ke container lalu jalankan
docker cp src/database/seeds/roles.sql sugity-db:/tmp/
docker exec sugity-db psql -U <POSTGRES_USER> -d <POSTGRES_DB> -f /tmp/roles.sql

# Ulangi untuk: users.sql, factories.sql, machines.sql,
#               master_parts.sql, order_conversions.sql, site_config.sql
```

### 4. Setup environment variables backend

```bash
cp .env.example .env
```

Buka `.env` dan isi semua nilai (lihat bagian [Environment Variables](#environment-variables)).

---

## Cara Menjalankan

### Development (hot-reload)

```bash
npm run dev
```

Output yang diharapkan:
```
[DB] Connected to PostgreSQL
[Redis] Connected
[Server] Running on http://localhost:3000
[Swagger] Docs at http://localhost:3000/api/docs
```

### Lainnya

```bash
npm run build      # Compile TypeScript → dist/
npm start          # Jalankan hasil build (production)
npm test           # Jalankan semua unit + integration test
npm run lint       # ESLint check
```

---

## Struktur Folder

```
backend/
├── src/
│   ├── app.ts                        # Express app factory — daftarkan semua middleware & route
│   ├── server.ts                     # Entry point — koneksi DB/Redis, HTTP server, graceful shutdown
│   │
│   ├── config/
│   │   ├── env.ts                    # Validasi env vars saat startup (throw jika ada yang kosong)
│   │   ├── database.ts               # pg.Pool singleton — satu koneksi pool untuk seluruh app
│   │   └── redis.ts                  # ioredis singleton
│   │
│   ├── common/
│   │   ├── errors/
│   │   │   └── AppError.ts           # Error class: AppError(statusCode, code, message)
│   │   └── middlewares/
│   │       ├── error-handler.middleware.ts  # Global error handler — konversi AppError ke JSON response
│   │       ├── rate-limit.middleware.ts     # Factory function Redis-based rate limiter
│   │       └── audit-log.middleware.ts      # Global audit trail — fire-and-forget res.on('finish')
│   │
│   ├── modules/                      # Setiap subfolder = satu resource (routes→controller→service→repo)
│   │   ├── auth/                     # Login, logout, /me, verify-member-pin, JWT util, PIN crypto util
│   │   ├── rbac/                     # requireAuth, requireRole middleware — validasi role dari Redis cache
│   │   ├── roles/                    # CRUD role dinamis, invalidate Redis cache saat mutasi
│   │   ├── users/                    # CRUD user (super-admin)
│   │   ├── factories/                # CRUD factory
│   │   ├── machines/                 # CRUD mesin per factory, toggle active/inactive
│   │   ├── leaders/                  # CRUD leader, verify PIN, reveal PIN (AES-256-GCM decrypt)
│   │   ├── master-parts/             # CRUD part + bulk import (upsert dalam satu transaksi)
│   │   ├── order-conversions/        # CRUD mapping part number customer ↔ sebango internal
│   │   ├── production-plans/         # Upsert jadwal + Socket.io broadcast ke semua client
│   │   ├── label-counters/           # Get + increment counter label Kanban per tanggal
│   │   ├── history-orders/           # Bulk insert snapshot forecast + list history
│   │   ├── global-logs/              # List audit log (filter+pagination) + delete all — super-admin
│   │   └── site-config/              # GET warna tema (public) + PUT update (super-admin) + Redis cache
│   │
│   ├── domain/                       # Pure functions — business logic domain pabrik, tanpa dependency HTTP
│   │   ├── fuka-calculator.ts        # Hitung beban kerja mesin per hari (jam)
│   │   ├── forecast-calculator.ts    # Konversi dailyRequirement ↔ monthlyVolume
│   │   ├── print-lock-validator.ts   # Anti-fraud: validasi apakah mesin sudah cukup produksi sebelum print
│   │   └── machine-key-resolver.ts   # Normalisasi variasi kode mesin dari sumber eksternal
│   │
│   ├── websocket/
│   │   └── socket.server.ts          # Socket.io server + JWT auth middleware untuk koneksi WebSocket
│   │
│   ├── swagger/
│   │   └── swagger.config.ts         # OpenAPI 3.0 spec — scan JSDoc dari semua *.routes.ts
│   │
│   ├── types/
│   │   └── express.d.ts              # Augment Request: tambah `req.user` (id, username, role, name)
│   │
│   └── database/
│       ├── migrations/
│       │   └── init.sql              # Schema lengkap — auto-run Docker saat volume pertama dibuat
│       └── seeds/
│           ├── roles.sql             # 5 role awal
│           ├── users.sql             # 5 user awal (satu per role)
│           ├── factories.sql         # F2, F3, F4, SC2 Karawang
│           ├── machines.sql          # 33 mesin sesuai layout produksi
│           ├── master_parts.sql      # 36 part injection
│           ├── order_conversions.sql # 147 mapping part number
│           └── site_config.sql       # 3 warna default tema
│
├── tests/
│   ├── unit/                         # Pure function tests (tanpa DB)
│   │   ├── fuka-calculator.test.ts
│   │   ├── forecast-calculator.test.ts
│   │   └── print-lock-validator.test.ts
│   └── integration/                  # Endpoint tests (dengan DB container)
│       ├── auth.test.ts
│       ├── factories.test.ts
│       └── rate-limit.test.ts
│
├── .env                              # ⚠️ TIDAK di-commit — lihat .env.example
├── .env.example                      # Template env vars
├── package.json
├── tsconfig.json
└── eslint.config.mjs
```

---

## Environment Variables

Salin `.env.example` ke `.env` dan isi semua nilai:

| Variable | Wajib | Keterangan | Contoh |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL | `postgres://user:pass@localhost:5432/dbname` |
| `REDIS_URL` | ✅ | Connection string Redis | `redis://localhost:6379` |
| `JWT_SECRET` | ✅ | Secret key signing JWT — min 32 karakter hex | `openssl rand -hex 32` |
| `PIN_ENCRYPTION_KEY` | ✅ | Kunci AES-256-GCM untuk enkripsi PIN leader — **server crash jika kosong** | `openssl rand -hex 32` |
| `PORT` | ❌ | Port server (default: `3000`) | `3000` |
| `NODE_ENV` | ❌ | Environment (`development` / `production`) — mempengaruhi cookie `Secure` flag | `development` |

> ⚠️ **Penting**: `JWT_SECRET` dan `PIN_ENCRYPTION_KEY` di `.env` development lokal **jangan dipakai di production**. Generate ulang dengan `openssl rand -hex 32` setiap deploy ke environment baru.

---

## API Documentation

Swagger UI tersedia saat server berjalan:

```
http://localhost:3000/api/docs
```

Fitur Swagger UI:
- Semua endpoint terdokumentasi lengkap dengan request/response schema
- Bisa dicoba langsung dari browser (try it out)
- Auth via cookie `sugity_session` — login dulu via `POST /api/auth/login`, cookie otomatis terkirim untuk request berikutnya

### Endpoint Summary

| Prefix | Akses | Keterangan |
|---|---|---|
| `POST /api/auth/login` | Public | Login — set cookie session |
| `POST /api/auth/logout` | Auth | Logout — hapus cookie |
| `GET /api/auth/me` | Auth | Data user aktif |
| `POST /api/auth/verify-member-pin` | Auth | Verifikasi PIN member per mesin |
| `GET/POST/DELETE /api/roles` | Auth / super-admin | Manajemen role |
| `GET/POST/PUT/DELETE /api/users` | super-admin | Manajemen user |
| `GET/POST/PUT/DELETE /api/factories` | Auth / super-admin | Manajemen factory |
| `GET/POST/PUT/DELETE /api/machines` | Auth / super-admin | Manajemen mesin |
| `GET/POST/DELETE /api/leaders` | Auth / planner | Manajemen leader + PIN |
| `GET/POST/DELETE /api/parts` | Auth / planner | Master data part + bulk import |
| `GET/POST/PUT/DELETE /api/order-conversions` | Auth / planner | Mapping order |
| `GET/POST /api/production-plans` | Auth | Jadwal produksi + Socket.io |
| `GET/POST /api/label-counters` | Auth | Counter label Kanban |
| `GET/POST /api/history-orders` | Auth / planner | Snapshot history forecast |
| `GET/DELETE /api/global-logs` | super-admin | Audit trail semua request |
| `GET /api/site-config` | **Public** | Konfigurasi warna tema |
| `PUT /api/site-config` | super-admin | Update warna tema |
| `GET /health` | Public | Health check (status + uptime) |

---

## Deployment

### Menggunakan Docker (Recommended)

1. **Setup infrastructure** — PostgreSQL dan Redis via `docker-compose.yml` di root project sudah siap.

2. **Build image backend**:

```bash
npm run build
# atau build Docker image jika ada Dockerfile di root
docker build -t sugity-backend .
```

3. **Environment variables production**:
   - Set `NODE_ENV=production` — mengaktifkan flag `Secure` pada cookie JWT
   - **Generate ulang** `JWT_SECRET` dan `PIN_ENCRYPTION_KEY` — jangan pakai nilai dari development
   - Sesuaikan `DATABASE_URL` dan `REDIS_URL` dengan credentials production

4. **Jalankan**:

```bash
npm start   # Menjalankan dist/server.js hasil build
```

### Catatan Deployment

- **Graceful shutdown** sudah diimplementasi (`SIGTERM` / `SIGINT`) — aman untuk container orchestration (Kubernetes, Docker Swarm).
- **CORS** saat ini dikonfigurasi `origin: true` (allow all). Untuk production, ubah ke domain spesifik di `app.ts`:
  ```typescript
  app.use(cors({ origin: 'https://your-domain.com', credentials: true }));
  ```
- **Rate limiting** berbasis Redis — aman untuk deployment multi-instance (tidak in-memory).
- **Schema migration** — Jika ada perubahan schema di `init.sql` setelah database sudah berisi data, jalankan DDL secara manual via `docker exec psql -f migration.sql`. `init.sql` hanya dijalankan otomatis saat volume Docker baru dibuat.
