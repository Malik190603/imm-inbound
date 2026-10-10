# Quickstart: memvalidasi Mini Monitoring

## Prasyarat
- Node 20+, `npm ci`.
- Playwright + Chromium (sudah ada di kontainer sesi; `test/` lokal, tidak ikut repo).
- Postgres 16 lokal untuk uji SQL (`/var/tmp/pgt`, port 5544) — opsional.

## Uji otomatis
```bash
npm test          # unit: parse-core, auth-core, kpi-core, wo-core + tes lama
npm run check     # sintaks, konfigurasi, rahasia, sandi
node test/e2e-mm-login.js     # masuk NIK, menu per Role×Jabatan (data tiruan)
node test/e2e-mm-home.js      # 5 kartu Home + filter BU
node test/e2e-mm-list.js      # semua menu List tampil, ⛔ berlabel, tanpa geser samping
node test/e2e-mm-wo.js        # Work Order: buat, setujui, selesai tanpa/dengan foto (Supabase tiruan)
node test/e2e-mm-obs.js       # Observasi: open → ongoing → isi → closed
node test/e2e-design.js       # batas keterbacaan 360/400/1280, terang/gelap
```
Hasil yang diharapkan: semua lulus, 0 error konsol, tidak ada nilai penanda privat
(`PRIVATE_MARK_*` di data tiruan) di DOM.

## Uji server sungguhan (lewat connector Supabase)
1. Terapkan migrasi `supabase/schema.sql` bagian Mini Monitoring.
2. `select imm_next_no('WO')` dua kali → nomor berurutan hari ini.
3. `imm_wo_create` → `imm_wo_move(...,'disetujui',..., jabatan 'STAFF')` harus gagal;
   dengan `MANAGER` berhasil; `selesai` tanpa foto gagal; dengan 1 foto berhasil.
4. Baris uji ditandai (mis. tim = 'UJI'), tidak dihapus.

## Uji manual di HP (setelah rilis)
- Masuk dengan NIK sendiri; cek menu sesuai jabatan.
- Home menampilkan 5 kartu dengan tanggal data.
- Buat 1 WO uji, Manager menyetujui, MHE menutup dengan foto.
- Jalankan 1 observasi lengkap.
