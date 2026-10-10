---
description: "Task list: Mini Monitoring DC Tallo Makassar"
---

# Tasks: Mini Monitoring DC Tallo Makassar

**Input**: `specs/001-mini-monitoring/` (spec, plan, research, data-model, contracts, quickstart)

**Tests**: wajib (Konstitusi IV): tes unit ditulis dan dilihat gagal sebelum kode; e2e lokal di
`test/` (tidak ikut repo) untuk tiap story.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 Tambah data tiruan e2e Mini Monitoring di `test/mock-mm.json` (master user 9 Role × 8 Jabatan dengan NIK uji, satu baris per sumber registri, nilai penanda `PRIVATE_MARK_*` di setiap kolom privat) dan harness rute gviz/Supabase tiruan di `test/h.js`
- [ ] T002 [P] Salin 10 logo ke `www/brand/` (sudah: ataru, azko, chatime, eyesoul, informa, informa-custom, informa-electronics, krisbow, selma, toys-kingdom) dan daftarkan di `scripts/check.mjs` agar file wajib ada

---

## Phase 2: Foundational (blocking)

- [ ] T003 [P] Tes `tests/parse.test.mjs` untuk semua fungsi di contracts/core-modules.md `IMMParse` (num: "Rp 1.234.567", "RP1,234", "99.57%", "262 kg", "-", "#N/A", "#DIV/0!", "#VALUE!", "#REF!"; date: M/D/YYYY, DD/MM/YYYY, "10 Oct 26", " 1 Oct-26", "1 Januari 2026", serial 46304 = 2026-10-09, "09/10/2026 14.05.00", "Thursday, 1 Oct" & "1 July" dengan ctx.year; sepDate "Kamis 01/01/2026"; codeDate "260923T036"; weekTab 2026-10-10 = "W41"; monthTab; col/hasHeaders toleran spasi & huruf; fillSep; matrixDay; stripPrivate)
- [ ] T004 Implementasi `www/parse-core.js` sampai T003 lulus
- [ ] T005 [P] Tes `tests/auth.test.mjs`: normNik, parseMaster (ID di depan kolom USER, baris terakhir menang, alias "Asst Manager"→"ASST. MANAGER"), `can()` untuk semua baris tabel FR-010, ADMIN semua menu, WAREHOUSEMAN hanya `demand`, Role LP/MHE melihat dashboard departemennya, `visibleMenus`, `dashDepts`
- [ ] T006 Implementasi `www/auth-core.js` (MENUS, ACCESS persis FR-010) sampai T005 lulus
- [ ] T007 [P] Tes `tests/wo.test.mjs`: fmtNo("WO", 2026-10-10, 4) = "WO-20261010-0004"; daftar ALAT (9), PEKERJAAN (12), LOKASI (13), CHECKLIST (8), KONDISI (9) persis FR-050/062/063; WO_NEXT; canMove (setujui hanya MANAGER; selesai hanya MHE dengan 1–4 foto, pesan "Lampirkan minimal 1 foto dokumentasi"); validateWo (detail wajib ≤ 1000, tim wajib ≤ 200, biaya ≥ 0, catatan ≤ 1000); validateObsEntry (kondisi ≥ 1, detail ≤ 500, foto ≤ 4); validateSchedule (selesai ≥ mulai); reminders
- [ ] T008 Implementasi `www/wo-core.js` sampai T007 lulus
- [ ] T009 Registri `www/sources.js`: 29 sumber (ID, sheet, need, private, ttl) dari research.md R6 dan `research/*.md`; `load(key, {tq})` dengan validasi `hasHeaders` (tab salah → error `WRONGTAB`), `stripPrivate` sebelum cache, cache memori + `localStorage` (`imm.src.<key>`, dengan waktu), konkurensi maks 4, parameter unik anti-cache; tes unit loader dengan fetch tiruan di `tests/sources.test.mjs`
- [ ] T010 Migrasi Supabase di `supabase/schema.sql` (tanpa drop/delete): tabel `run_no`, `work_order`, `wo_event`, `observasi`, `obs_entry`, `dc_schedule`, `notif`; kolom `tto.penyerah`, `tto.input_by`; fungsi `imm_next_no`, `imm_wo_create`, `imm_wo_move`, `imm_obs_create`, `imm_obs_move`, `imm_obs_add`, `imm_schedule_save`, `imm_notif_read` sesuai contracts/supabase.md; RLS select/insert anon, tanpa delete; `search_path = public`. Uji di Postgres lokal (`/var/tmp/pgt`): nomor urut, transisi sah/tak sah, foto 0/1/5
- [ ] T011 Terapkan T010 ke project IMM lewat connector (`apply_migration`), lalu uji `imm_next_no` dan satu alur WO dengan baris bertanda `tim='UJI'`
- [ ] T012 `www/store.js`: fungsi `rpc(name, args)`, `woList/woCreate/woMove`, `obsList/obsCreate/obsMove/obsAdd/obsEntries`, `schedList/schedSave`, `notifList/notifRead`, `uploadPhotos(prefix, files)` (pakai `preparePhoto` 1600 px), pemetaan error NETWORK/TIMEOUT/RULE; tes di `tests/store.test.mjs`

**Checkpoint**: modul murni + data siap.

---

## Phase 3: User Story 1 — Masuk NIK & menu sesuai akses (P1) 🎯 MVP

**Goal**: login NIK, sesi tersimpan, List hanya menu berhak.
**Independent Test**: `test/e2e-mm-login.js` — tiap kombinasi Role × Jabatan dari mock → menu List sama dengan `IMMAuth.visibleMenus`; NIK salah → "NIK tidak terdaftar. Hubungi admin."; buka ulang → langsung Home; hapus dari master → keluar dengan pesan.

- [ ] T013 [US1] Tulis `test/e2e-mm-login.js` (gagal dulu)
- [ ] T014 [US1] Intro baru di `www/index.html`: "Mini Monitoring" + "DC Tallo Makassar" + 10 logo (`www/brand/*.png`, `alt` nama brand, chip terang di tema gelap)
- [ ] T015 [US1] Layar Masuk di `www/index.html` (input NIK `inputmode=text`, tombol 44 px, pesan error, status "Butuh internet untuk masuk pertama kali" + Coba lagi); simpan `imm.session` & `imm.users` (tanpa nama orang lain); muat ulang master saat dibuka, offline pakai salinan; bila NIK sesi hilang dari master → keluar dengan pesan "Akun tidak lagi terdaftar"
- [ ] T016 [US1] Shell 3 tab (Home, List, Settings) menggantikan TABS lama di `www/index.html`; hash route `#/home`, `#/list/<menu>/<sub>`, `#/settings`; tombol kembali Android sesuai contracts/screens.md
- [ ] T017 [US1] `www/list.js`: hub List (kisi menu berikon, hanya `visibleMenus`), rute sub menu, penjaga akses untuk tautan langsung
- [ ] T018 [US1] Kirim log perangkat (tab `ROLE`) memakai Role dari sesi; hapus `roleGate`/`rolesBlock`/pertanyaan role per HP di `www/index.html`

---

## Phase 4: User Story 3 — Filter BU dropdown berlogo (P1)

**Goal**: dropdown BU global + periode bawaan.
**Independent Test**: `test/e2e-mm-home.js` bagian filter — tiap BU mengubah angka; Semua BU = jumlah; bawaan Hari ini/Semua BU, LPPB Bulan ini.

- [ ] T019 [US3] Komponen dropdown BU di `www/index.html` + `www/ui.css` (Semua BU, HCI: Informa+Selma, AHI: Azko+Ataru, KWI: Krisbow, TGI: Toys Kingdom, FBI: Chatime; logo di chip terang; target 44 px; aria-expanded/listbox)
- [ ] T020 [US3] Filter periode per halaman dengan bawaan `today` + `ALL`, LPPB `month` + `ALL`, di state `F` `www/index.html`

---

## Phase 5: User Story 2 — Home 5 kartu (P1)

**Goal**: Akurasi, Value damage, Occupancy, Incoming Container, SLA Outbound.
**Independent Test**: `test/e2e-mm-home.js` — angka = perhitungan manual dari mock untuk ALL dan tiap BU; satu sumber gagal → kartu itu "Data belum bisa dimuat" + Coba lagi; ketuk kartu → menu terkait bila berhak.

- [ ] T021 [P] [US2] Tes `tests/kpi.test.mjs` bagian Home: `akurasi` (=(TARGET−PLUS−MINUS)/TARGET, hari terakhir B>0, gabungan HCI+AHI), `occupancy` (Used/Capasity, FBI dari blok posisi), `damage` (SKU/qty BARUS, value null), `slaOutbound` (hari terakhir terisi, vs STANDARD), BU tanpa data → `{missing:true}`
- [ ] T022 [US2] Implementasi fungsi Home di `www/kpi-core.js`
- [ ] T023 [US2] Halaman Home di `www/index.html`: kartu jawaban + 5 kartu dengan tanggal data, status muat/gagal/belum tersambung, Incoming Container dari model kontainer yang ada (POO, OTW, POD), banner pemberitahuan Manager (diisi US5)
- [ ] T024 [US2] Tulis `test/e2e-mm-home.js` (termasuk ukur waktu: layar Masuk → Home ≤ 30 detik dan 5 kartu terisi ≤ 5 detik dengan latensi jaringan tiruan 4G, SC-001/SC-003)

---

## Phase 6: User Story 4 — Dashboard per departemen (P2)

**Goal**: dropdown departemen; KPI FR-030..036; ⛔ berlabel.
**Independent Test**: `test/e2e-mm-list.js` bagian dashboard — tiap departemen tampil, angka cocok mock, kartu ⛔ berlabel "Belum tersambung ke data", tanpa angka nol palsu.

- [ ] T025 [P] [US4] Tes `tests/kpi.test.mjs` bagian dashboard: storing (case id, picked, open, level bawah/atas/floor, per LVL, CBM=sum(CM3)/1e6), outbound (Rit dari RETASE, outstanding dari baris LD; aging → missing), planner (blok HCI/AHI per posisi, bucket aging), inventory (virtual buckets, WTW lokasi/count/qty, perbaikan dibatasi 100%, root cause Move/Picking, lainnya missing, BARUS budget), lp (hitungan per periode dari sumber LP, `fillSep`), mhe (status, alat, pekerjaan, biaya, tren mingguan)
- [ ] T026 [US4] Implementasi fungsi dashboard di `www/kpi-core.js`
- [ ] T027 [US4] `www/dash.js`: dropdown departemen (`IMMAuth.dashDepts`), render per departemen dengan komponen v1.4; Inbound = Beranda lama dipindah (termasuk pintu ke Putaway/Productivity/MPP detail bersandi)
- [ ] T028 [US4] Tulis bagian dashboard di `test/e2e-mm-list.js`

---

## Phase 7: User Story 5 — Work Order + persetujuan Manager (P2)

**Goal**: Tambah WO, setujui, pending, selesai dengan foto, Reminder, pemberitahuan.
**Independent Test**: `test/e2e-mm-wo.js` — nomor `WO-20261010-0004` setelah `-0003`; non-Manager tanpa tombol Setujui; selesai tanpa foto ditolak; foto ke-5 ditolak; Manager melihat badge & daftar.

- [ ] T029 [US5] Tulis `test/e2e-mm-wo.js` (Supabase tiruan di harness)
- [ ] T030 [US5] `www/forms.js` Work Order: daftar (status, filter), form Tambah (field FR-050 dengan pilihan tetap dari `IMMWo`, waktu mulai tanggal+jam, biaya rupiah), detail + riwayat `wo_event`, aksi status sesuai `canMove`, unggah 1–4 foto saat selesai, draf lokal bila unggah gagal
- [ ] T031 [US5] Infrastructure → Reminder (`IMMWo.reminders`) di `www/forms.js`
- [ ] T032 [US5] Pemberitahuan Manager: periksa `notif` saat buka, saat resume (`App` plugin), tiap 2 menit; badge tab List + banner Home; tandai dibaca (`imm_notif_read`) di `www/index.html`

---

## Phase 8: User Story 6 — Observasi & Checklist LP (P2)

**Goal**: OBS open → ongoing → closed, isi lokasi & checklist dengan foto.
**Independent Test**: `test/e2e-mm-obs.js` — nomor OBS, check-in, kondisi ganda tersimpan, Closed hanya baca, NIK pencatat.

- [ ] T033 [US6] Tulis `test/e2e-mm-obs.js`
- [ ] T034 [US6] `www/forms.js` Observasi: daftar + Tambah (mulai, tim), Check-in, sub menu Observasi (13 lokasi) dan Checklist (8 alat) dengan kondisi pilihan ganda (9), detail, foto ≤ 4, Tutup; Closed hanya baca; entri salah ditandai `batal`; foto gagal unggah disimpan sebagai draf dan bisa dikirim ulang

---

## Phase 9: User Story 7 — Menu List lainnya (P3)

**Goal**: Monitoring, Occupancy/Layout, Sloc, Project & Schedule, Demand, LPPB, Report, TTO, MPP, LP In/Out.
**Independent Test**: `test/e2e-mm-list.js` — setiap menu tampil dengan mock, mengikuti filter, hanya untuk yang berhak; Report Status 7/9 → 78% + 2 nama; TTO "Yang menyerahkan" teks bebas + Input by NIK; Container 5 tahap.

- [ ] T035 [P] [US7] Tes `tests/kpi.test.mjs` bagian menu: `lcAging` (ATA BY DC → TANGGAL BONGKAR, 0–7/8–14/15+), `lppb` (tanggal dari kolom Tanggal, damage = `DAMAGE GOODS`, NDC = Jababeka/Cikupa/Sidoarjo, status dinormalisasi), `reportStatus` (9 aturan research/reports.md, `idle` bila rencana bongkar 0), `sloc`, `layoutGrid` (A01.066.5 → lorong/bay/level), demand per departemen
- [ ] T036 [US7] Implementasi fungsi menu di `www/kpi-core.js`
- [ ] T037 [US7] `www/menus.js`: Monitoring (LC DC + Container dari `monKont` lama), Occupancy & Capacity + Layout Gudang (kisi lorong × bay, warna occupancy, catatan tanggal data stok), Sloc Value/Qty, Demand (Inbound dari rencana bongkar, Storing/Outbound dari halaman Role lama, Planner, Inventory ⛔), LPPBDO/LPPBPO (Inbound dari `monLpp` lama diperluas; Outbound ⛔), Report Daily (9 tautan) + Status, MPP "Menunggu data MPP"
- [ ] T038 [US7] Project & Schedule di `www/forms.js` (daftar per jenis, Tambah/Ubah hanya MANAGER/ASST. MANAGER/SUPERVISOR/ADMIN, status rencana/berjalan/selesai/batal)
- [ ] T039 [US7] TTO & Dokumen di `www/inbound.js`: keluarkan dari kunci sandi, ganti "PIC yang menyerahkan" → "Yang menyerahkan" (teks bebas, tanpa dropdown), isi `input_by` = NIK sesi, tampilkan Input by di daftar & detail; scan foto tetap jalan
- [ ] T040 [US7] `www/lp.js` LP In/Out: tamu (hari ini, masih di dalam), karyawan, logbook barang keluar/masuk, armada terseal, rekap kardus — daftar tanpa kolom privat
- [ ] T041 [US7] Tulis bagian menu di `test/e2e-mm-list.js` (termasuk cek tidak ada `PRIVATE_MARK_*` di DOM)

---

## Phase 10: User Story 8 — Settings baru (P3)

**Independent Test**: tiap baris berfungsi; Keluar → layar Masuk dan sesi terhapus.

- [ ] T042 [US8] `pageSet` di `www/index.html`: Akun (NIK, nama sendiri, Role, Jabatan), Versi APK, Tampilan, Kurangi Animasi, Live Akses, Pembaruan, Database Spreadsheet (daftar sumber per departemen + "Data yang belum tersedia" dari ⛔), Tentang, Keluar (konfirmasi); hapus kartu Pengguna
- [ ] T043 [US8] Tambah kasus Settings di `test/e2e-mm-login.js`

---

## Phase 11: Polish & Cross-Cutting

- [ ] T044 Nama aplikasi "Mini Monitoring": `capacitor.config.json` `appName`, `android/app/src/main/res/values/strings.xml` (`app_name`, `title_activity_main`), `<title>` di `www/index.html`; `package.json` versi dasar 2.0.0; README dan PRODUCT.md
- [ ] T045 Pastikan pembaca lama tetap cocok dengan header `MASTER_PLAN` terbaru (Week, Month, DAY, TGL BONGKAR, …) di `www/index.html` `buildModel`; tambah tes fixture
- [ ] T045b Ganti `TODAY` tetap menjadi tanggal WITA yang dihitung ulang (saat resume dan tiap menit) agar "Hari ini" dan nomor urut ikut tanggal baru tanpa menutup aplikasi, di `www/index.html`; tes di `tests/core.test.mjs`
- [ ] T046 [P] Jalankan & perbaiki tes desain (`test/e2e-design.js`) untuk semua layar baru di 360/400/1280, terang/gelap; perbarui `DESIGN.md` untuk komponen baru (dropdown BU, login, hub List, form)
- [ ] T047 [P] Perbarui `CLAUDE.md` (arsitektur Mini Monitoring, tabel & fungsi Supabase baru, sumber data) dan `scripts/check.mjs` (file wajib baru, sintaks modul baru)
- [ ] T048 Verifikasi penuh: `npm test`, `npm run check`, semua `test/e2e-*.js` per suite, uji server lewat connector (quickstart.md), lalu commit dengan pesan rilis gabungan 2.0.0 — push hanya ke `feat/mini-monitoring`/`dev` sampai pemilik menulis "gaspol"

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (T003–T012) → semua story.
- US1 (Phase 3) → US3, US2, US4–US8 (semua butuh shell & sesi).
- US3 → US2 (Home memakai filter).
- US5 (pemberitahuan) mengisi banner Home dari US2.
- US7 T039 bergantung pada T010–T012 (kolom TTO baru).
- Polish setelah semua story.

## Parallel Opportunities

- T003, T005, T007 paralel (file tes berbeda); T004/T006/T008 paralel setelah tesnya.
- T021, T025, T035 (bagian tes kpi berbeda) bisa disiapkan bersamaan.
- Setelah US1: US4 (dash.js), US5/US6 (forms.js — berurutan karena satu file), US7 menus.js/lp.js paralel.

## Implementation Strategy

Pemilik memilih **satu rilis besar**. Urutan kerja tetap MVP-first: US1 → US3 → US2 berarti
aplikasi sudah layak dipakai (login, filter, Home) sebelum dashboard dan form ditambahkan. Setiap
checkpoint di-commit lokal dan didorong ke `feat/mini-monitoring`. Rilis 2.0.0 ke `main` hanya
setelah "gaspol".
