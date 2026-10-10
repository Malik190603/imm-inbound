# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Tim DC Tallo Makassar per departemen (Inbound, Storing, Outbound, Inventory, Planner, MHE, LP, Admin, Warehouseman): membuka aplikasi di HP Android di lantai gudang untuk melihat keadaan hari itu, mengerjakan Work Order dan Observasi LP, mendokumentasikan foto, dan mencatat serah terima.
- Manager, Assistant Manager dan Supervisor: melihat sekilas KPI semua departemen, menyetujui Work Order, mengisi Project & Schedule.
- Hak akses ditentukan oleh Role × Jabatan dari sheet Master User APK (login dengan NIK).
- Dua kelompok ini sama pentingnya (dikonfirmasi pemilik aplikasi, 4 Okt 2026).

## Product Purpose

Mini Monitoring (dulu IMM – Inbound Mini Monitoring) menampilkan keadaan DC Tallo yang sumbernya tetap di Google Sheets: KPI per departemen (Inbound, Storing, Outbound, Inventory, Planner, MHE, LP), jadwal bongkar, CBM ke storing/store/customer, posisi kontainer, occupancy dan layout, LC DC, Sloc, demand, LPPBDO, status report harian, MPP, putaway per LPN dan produktivitas. Input yang tidak punya sheet (Work Order, Observasi LP, Project & Schedule, TTO, foto) disimpan di Supabase. Berhasil kalau orang membuka aplikasi dan langsung paham keadaan hari itu tanpa membuka spreadsheet.

## Positioning

Aplikasi khusus satu DC yang membaca langsung spreadsheet kerja tim itu sendiri; tidak ada input ganda. Supabase hanya untuk data yang memang diisi di aplikasi.

## Operating Context

- Dipakai di HP Android (aplikasi Capacitor), sebagian besar satu tangan, di gudang; juga dibuka di desktop saat rapat.
- Data: 28 spreadsheet DC Tallo (daftar di `www/sources.js` dan Settings → Database Spreadsheet), termasuk IMM (LOGIC, MASTER_PLAN, MASTER_LC, LPPBDO), sheet kontainer RDC, sheet inbound stock dan transit, Laporan Daily Update, occupancy, LP; Supabase untuk foto, TTO, Work Order, Observasi, Jadwal dan notifikasi.
- Istilah kerja yang dipakai apa adanya: CBM, TEUs, LC, LPN, Dept, BU (HCI, AHI, FBI, TGI, KWI), Storing, Outbound, Yard, Dooring, LPPBDO, TTO.

## Capabilities and Constraints

- Tiga tab: Home (5 kartu KPI), List (12 menu sesuai hak akses: Dashboard, Monitoring, Occupancy & Layout, Sloc, Project & Schedule, Demand, LPPB, Report, TTO, Infrastruktur & MHE, MPP, LP), Settings. Alat Inbound lama (Putaway, Productivity, MPP detail) tetap terkunci sandi 2 jam.
- Filter bawaan: Hari ini + Semua BU (LPPB: Bulan ini). Filter BU memakai logo brand.
- Bahasa antarmuka: Indonesia. Nama pribadi customer tidak pernah ditampilkan.
- Kontainer dihitung dalam TEUs. CBM dan qty memakai angka shipped.
- Update wajib lewat update di dalam aplikasi; perubahan tampilan tidak boleh mengubah bagian native.
- Tanpa framework: HTML, CSS, dan JavaScript biasa di `www/`.

## Brand Commitments

- Nama: Mini Monitoring DC Tallo Makassar (sejak v2.0; sebelumnya IMM). Intro memuat logo 10 brand Kawan Lama Group (Informa, Informa Custom, Informa Electronics, Selma, Azko, Ataru, Krisbow, Toys Kingdom, Eyesoul, Chatime).
- Warna yang mengikat: Storing hijau, Store/Outbound oranye, Customer biru; BU: HCI biru, AHI merah, TGI biru muda, FBI ungu, KWI oranye.
- Pemilik meminta tampilan yang minimalis, interaktif, dan mudah dipahami; pada 4 Okt 2026 memilih "naikkan gaya yang sekarang", bukan identitas baru.

## Evidence on Hand

- Data nyata dari spreadsheet di atas; data contoh sintetis di `tests/` untuk tes. Angka yang belum punya sumber tampil "Belum tersambung", bukan nol.
- Tidak ada testimoni, logo perusahaan, atau angka kinerja selain yang dihitung dari sheet. Jangan dikarang.

## Product Principles

1. Jawaban dulu, rincian kemudian: tiap halaman menjawab satu pertanyaan di layar pertama.
2. Angka selalu punya satuan dan konteks (dibanding apa, untuk periode mana).
3. Yang perlu ditindak ditampilkan di atas, yang kosong tidak memakan tempat.
4. Istilah gudang dipakai apa adanya, dengan penjelasan satu ketukan bagi yang belum tahu.
5. Sumber kebenaran tetap spreadsheet; aplikasi tidak pernah menampilkan angka yang tidak bisa ditelusuri ke sheet.

## Accessibility & Inclusion

- Dibaca di HP di lingkungan gudang: teks minimal 12 px, kontras teks minimal 4,5:1, target sentuh minimal 44 px.
- Mode terang dan gelap, dan pilihan "Kurangi animasi".
