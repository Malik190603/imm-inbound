# Mini Monitoring DC Tallo Makassar (dulu IMM – Inbound Mini Monitoring)

Catatan untuk Claude di sesi berikutnya. Jangan menaruh rahasia apa pun di file ini (repo ini publik).

## Pemilik dan cara bekerja

- Pemilik: tim inbound DC Tallo Makassar (GitHub `Malik190603`). **Selalu jawab dalam bahasa Indonesia.**
- Pemilik sering bekerja dari HP tanpa laptop. Langkah yang butuh dashboard sebaiknya dikerjakan lewat connector, bukan disuruh ke pengguna.
- **Aturan "gaspol"**: push ke `main` = rilis ke semua HP (CI membangun dan menerbitkan, layar wajib update memaksa pemasangan). Lakukan itu **hanya** bila pemilik menulis kata "gaspol". "Ya", "lanjut", "jalankan semuanya" bukan izin rilis. Tanpa "gaspol": commit lokal, lalu push hanya ke branch cadangan (`git push origin main:dev`, atau branch fitur).
- Stop hook akan mengeluh soal commit yang belum di-push ke `main`. Jawabannya selalu sama: sengaja, menunggu "gaspol", sudah aman di `dev`.
- Commit yang hanya mengubah dokumen boleh ke `main` dengan `[skip ci]` di pesan commit supaya tidak memicu rilis.
- Saat "gaspol": pesan commit **terakhir** menjadi catatan rilis. Pastikan commit paling atas merangkum semua perubahan sejak rilis sebelumnya (boleh `git commit --allow-empty`).
- Format pesan commit: judul, lalu bagian `Untuk pengguna:` dan `Untuk developer:`, lalu trailer Co-Authored-By dan Claude-Session. Identitas commit `Claude <noreply@anthropic.com>`.
- Setelah push rilis: pantau run "Build APK Android" lewat `gh api repos/Malik190603/imm-inbound/actions/runs`, lalu baca `releases/latest`. Lampirkan APK hanya bila diminta.

## Aturan yang tidak boleh dilanggar

- Nama pribadi customer tidak pernah ditampilkan.
- Sandi menu Inbound tidak boleh tertulis terang di file mana pun yang ikut repo; hanya `PW_HASH` di `www/inbound-core.js`. `scripts/check.mjs` memeriksanya.
- Di aplikasi hanya boleh ada kunci Supabase **anon**. Kunci AI (Gemini/Claude) hanya di Supabase (Vault atau secret fungsi), tidak di repo, tidak di file.
- Kalau pengguna menempel kunci rahasia di chat: jangan tulis ke file, sarankan diganti nanti.
- Perubahan sebaiknya hanya di `www/` supaya terbit sebagai update kilat. Mengubah file native (`android/`, dependensi Capacitor) membuat semua HP harus instal APK baru.

## Arsitektur singkat

- Aplikasi Android (Capacitor 8, appId tetap `id.imm.inbound`, nama tampil "Mini Monitoring"), isi web statis di `www/`, tanpa framework: fungsi JS yang menghasilkan string HTML. Versi dasar di `package.json` (2.0.0), PATCH naik otomatis (`scripts/version.mjs`). Rilis terakhir di `main`: **v1.4.4**, basis native 1.3.0. v2.0.0 (Mini Monitoring) mengganti nama native → wajib APK baru.
- Spesifikasi fitur Mini Monitoring: `specs/001-mini-monitoring/` (spec, plan, research, data-model, contracts, tasks). Konstitusi: `.specify/memory/constitution.md`.
- Lapisan Mini Monitoring: `www/parse-core.js` (IMMParse: angka/tanggal/CSV gviz), `www/auth-core.js` (IMMAuth: Master User, ROLES×JABATAN, MENUS, ACCESS), `www/wo-core.js` (IMMWo: aturan Work Order/Observasi/Jadwal), `www/sources.js` (IMMSrc: 28 spreadsheet, registri sumber, cache, galat WRONGTAB/EMPTY/PRIVATE), `www/kpi-core.js` (IMMKpi). Layar: `www/mm.js`+`mm.css` (sesi NIK, 3 tab Home/List/Settings, rute hash `#list/<menu>/<sub>`, filter BU berlogo, Settings, notifikasi), `www/dash.js` (dashboard per dept), `www/menus.js`, `www/forms.js` (Work Order, Observasi, Jadwal), `www/lp.js`. Logo brand di `www/brand/`.
- Halaman lama tetap dipakai lewat `legacyPage`/`routeFix`: dashboard/inbound → `home` (Beranda lama), dashboard/tools → `inb` (alat Inbound bersandi), demand/storing|outbound → `role`, monitoring/container → `mon` kont, lppb/inbound → `mon` lpp, tto → `inb` mode bebas (`S.inbFree`).
- `www/index.html`: kerangka, CSS dasar, halaman Beranda lama, Role (to Storing / to Outbound), Monitoring (Kontainer / LPPBDO), lembar detail, wajib update. Pertanyaan role lama diganti gerbang login NIK (`loginGate` di mm.js).
- `www/ui-core.js`, `www/ui.js`, `www/ui.css`: lapisan desain v1.4 (kartu jawaban `lead()`, strip minggu, `attention()`, `secHead()`, kamus istilah, `compact()`). Aturan desain di `DESIGN.md`, konteks produk di `PRODUCT.md`.
- `www/inbound-core.js` (logika murni, diuji), `www/inbound.js`, `www/inbound.css`: menu Inbound terkunci sandi (2 jam): Putaway, TTO/Dokumen, Productivity, MPP detail.
- `www/store.js`: Supabase (foto putaway, TTO, `scanTto`).
- `supabase/schema.sql`, `supabase/functions/scan-tto/index.ts` (satu file, sintaks JS biasa; diuji di Node dengan menyalinnya ke `.mjs`).
- Data dibaca dari Google Sheets lewat gviz; kolom sheet Inbound dan sheet kontainer dicari **berdasarkan teks header**, bukan huruf kolom.

## Pola dan jebakan yang sudah terbukti

- `cnt()` menghasilkan `<span class="num">`. Aturan CSS seperti `.sesuatu span{…}` akan ikut mengenai angka dan ikon. Pakai pemilih anak (`>`) atau kelas sendiri.
- Angka berjalan (`cnt`) membuat tes yang membaca angka terlalu cepat menjadi tidak stabil; untuk angka pendukung pakai `f0/f1/f2`.
- Teks minimal 12 px, tombol minimal 44 px (ikon 40 px), kontras token ≥ 4,5:1, tanpa geser samping di 360/400/1280 px, terang dan gelap.
- Baris bernilai nol diringkas satu baris; kalimat di kartu jawaban tidak mengulang angka besarnya.
- Connector Supabase membatalkan SQL yang memuat perintah hapus (`drop`, `delete`). Rancang tanpa itu (menandai, bukan menghapus) atau minta pengguna menyetujui.
- Shell sesi cloud tidak bisa menjangkau Google/Supabase. Untuk menguji fungsi server sungguhan: connector Supabase + `pg_net` (`net.http_post`).

## Supabase (project `IMM`, ref `rmvttktlzkecvooqvkpp`)

- Jangan menyentuh project lain di akun yang sama (misalnya "Active Coach").
- Tabel: `putaway_photos`, `tto` (+`input_by`), `scan_log`, dan sejak migrasi `mini_monitoring_v2`: `run_no`, `work_order`, `wo_event`, `observasi`, `obs_entry`, `dc_schedule`, `notif` (anon hanya `select`). Bucket `imm-photos`. Fungsi DB: `imm_limit_putaway_photos`, `imm_scan_take`, `imm_scan_refund`, `imm_secret` (tiga terakhir hanya untuk `service_role`); `imm_wo_create`, `imm_wo_move`, `imm_obs_create`, `imm_obs_move`, `imm_obs_add`, `imm_obs_cancel`, `imm_schedule_save`, `imm_notif_read` (boleh anon, memeriksa aturan dan melempar `IMM_RULE`); `imm_next_no` (internal).
- Uji SQL di Supabase: blok `DO` yang diakhiri `raise exception` supaya semua perubahan uji batal. Uji lokal: Postgres 16 di `/var/tmp/pgt` (port 5544), bila masih ada.
- Fungsi server `scan-tto` terpasang (verifikasi JWT menyala). Kunci Gemini ada di Vault dengan nama `GEMINI_API_KEY`; model bawaan `gemini-3.5-flash-lite`; batas 200 scan per hari untuk semua HP.
- Ekstensi `pg_net` masih aktif (dipakai untuk uji; aman, boleh dimatikan dari dashboard).
- Kalau `index.ts` diubah, fungsi harus dipasang ulang lewat connector (`deploy_edge_function`); rilis aplikasi tidak memasangnya.

## Tes

- `npm test` (unit, `tests/*.test.mjs`) dan `npm run check` (sintaks, konfigurasi, rahasia). Keduanya juga jalan saat rilis.
- Tes layar Playwright (`test/e2e-*.js` termasuk `e2e-mm-*.js` dan `e2e-design.js`, harness `test/h.js` dengan jam tetap 2026-10-04, data tiruan `test/mock.json` dan `test/mm-mock.js`) ada di folder `test/` yang **tidak ikut repo** dan hanya hidup di kontainer sesi. Di sesi baru folder itu kemungkinan sudah hilang dan harus dibuat ulang bila diperlukan. Alasannya: salah satu tes memuat sandi Inbound, dan data tiruannya salinan data asli.
- Cara kerja yang dipakai: tes dulu (lihat gagal), baru kode; jalankan semua sebelum bilang selesai.

## Yang masih terbuka

- Mini Monitoring v2.0.0 siap di branch `feat/mini-monitoring`, menunggu "gaspol". Data yang belum tersambung (nilai rupiah damage, aging tahap outbound, LPPBPO, CBM demand inventory, standar MPP, stok per lokasi, akar masalah Adj/Miss cycle) tercantum di Settings → Data yang belum tersedia; data MPP akan dikirim pemilik.
- Sheet Rit berhenti diisi sejak 15 Sep 2026; kapasitas HCI di occupancy (7354) berbeda dengan dokumen (6331); satuan rupiah sheet kardus belum pasti.

- Belum diuji di HP sungguhan: scan TTO dengan foto kertas asli dan alur kamera, foto Putaway setelah perbaikan v1.3.2, rincian barang per dept/store dengan data asli.
- Kunci Gemini pernah ditempel di chat; disarankan diganti (lalu perbarui Vault).
- Sandi Inbound pernah sempat terlihat di riwayat branch publik; pemilik belum memutuskan menggantinya.
- Peringatan Supabase: `imm_limit_putaway_photos` belum memakai `search_path` tetap.
- Catatan kecil dari tinjauan lama: sandi yang sedang diketik terhapus bila layar dirender ulang, `listTto` dibatasi 1000 baris, `TODAY` ditetapkan saat aplikasi dibuka.
