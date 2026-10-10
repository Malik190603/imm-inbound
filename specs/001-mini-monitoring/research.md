# Research: Mini Monitoring DC Tallo Makassar

Tanggal: 2026-10-10. Lampiran rinci (header persis, URL gviz yang terbukti, kolom privat) ada di
`research/` (00-survey, inventory, outbound, lp, reports). Tidak ada data pribadi di lampiran.

## R1. Cara membaca 29 spreadsheet

- **Decision**: tetap gviz CSV (`/gviz/tq?tqx=out:csv&sheet=<nama tab>&tq=<query>`) per tab,
  dengan **registri sumber** (`www/sources.js`) yang menyimpan ID, nama tab, header wajib, dan
  kolom privat. Setiap respons divalidasi terhadap header wajib sebelum dipakai.
- **Rationale**: semua sheet bisa dibaca publik; pola ini sudah dipakai aplikasi. Riset
  membuktikan gviz **mengembalikan tab pertama tanpa error bila nama tab salah** (termasuk spasi
  di belakang, mis. `SURAT JALAN `), jadi validasi header wajib.
- **Pitfalls yang ditangani**: `limit` sebelum `offset`; `month()` mulai 0; tipe kolom ditebak
  dari mayoritas sehingga sel bertipe lain menjadi kosong (baca kolom campuran sebagai teks
  lewat `headers=0` atau query `select *` lalu urai di aplikasi); cache WebView/HTTP diatasi
  dengan parameter unik.
- **Alternatives**: Google Sheets API (butuh kunci/OAuth, ditolak: rahasia di aplikasi);
  sinkron ke Supabase lewat fungsi server terjadwal (ditunda: menambah biaya dan titik gagal;
  bisa jadi tahap berikutnya bila gviz lambat).

## R2. Pengurai toleran

- **Decision**: `www/parse-core.js` (murni, diuji) berisi `num()` (Rp, %, kg, koma/titik
  ribuan, "-" = 0, `#N/A`/`#DIV/0!`/`#VALUE!`/`#REF!` = null), `date()` (M/D/YYYY, DD/MM/YYYY,
  `d MMM yy`, `d Mon-yy`, "1 Januari 2026", serial Sheets 46304, `dd/mm/yyyy HH.MM.SS`,
  "Thursday, 1 Oct" dan "1 July" tanpa tahun dengan tahun konteks, ISO week `W41`), pemisah
  tanggal berbentuk baris teks ("Kamis 01/01/2026"), tanggal dari kode LC/load `YYMMDD…`, dan
  `matrixDay()` untuk laporan matriks (tanggal sebagai kolom).
- **Rationale**: riset menemukan lebih dari 8 format tanggal dan angka bertipe teks.

## R3. Login NIK dan hak akses

- **Decision**: baca tab `Master User APK` (kolom USER, ROLE, JABATAN). NIK = token angka/kode di
  awal USER; nama = sisanya (hanya ditampilkan di Akun miliknya). Sesi disimpan di
  `localStorage` (`imm.session`: nik, role, jabatan, waktu). Master dimuat ulang saat aplikasi
  dibuka; bila gagal, pakai salinan terakhir. Tabel akses FR-010 menjadi data di
  `www/auth-core.js`, plus aturan ADMIN = semua, WAREHOUSEMAN = Home + Demand, Role LP/MHE boleh
  memilih dashboard departemennya.
- **Risk diterima pemilik**: tanpa PIN; persetujuan Manager dicek di aplikasi, tidak di server.
- **Alternatives**: NIK + PIN di Supabase (ditolak pemilik untuk rilis ini).

## R4. Penyimpanan data input

- **Decision**: Supabase project IMM. Tabel baru `work_order`, `wo_event`, `observasi`,
  `obs_entry`, `dc_schedule`, `notif`, dan `run_no` (penghitung nomor urut). Nomor dibuat oleh
  fungsi `imm_next_no(prefix, day)` dengan kunci advisory sehingga tidak pernah ganda. Perubahan
  status lewat fungsi `imm_wo_move` / `imm_obs_move` yang memeriksa graf status dan jumlah foto.
  Foto di bucket `imm-photos` (`wo/<no>/…`, `obs/<no>/…`). Tanpa kebijakan hapus.
- **Rationale**: pola TTO/putaway sudah terbukti; nomor urut harus atomik (SC-005).
- **Alternatives**: menulis ke Google Sheets lewat Apps Script (ditolak pemilik).

## R5. Pemberitahuan Manager

- **Decision**: baris `notif` dibuat oleh fungsi status (WO dibuat, menunggu persetujuan,
  Pending, Selesai). Aplikasi Manager memeriksa jumlah belum dibaca saat dibuka, saat kembali
  dari latar, dan tiap 2 menit selama terbuka; badge di tab List dan banner di Home.
- **Next stage**: notifikasi HP asli (Firebase) dengan APK baru.

## R6. Peta KPI → sumber (ringkas)

Status: ✅ siap, 🟡 sebagian (dipakai dengan catatan), ⛔ belum ada sumber (tampil "Belum
tersambung").

| KPI | Sumber | Status | BU |
|-----|--------|--------|----|
| Home Akurasi | INV02 `WTW HCI`/`WTW AHI`: akurasi lokasi = (TARGET−PLUS−MINUS)/TARGET, hari terakhir B>0 | ✅ | HCI, AHI |
| Home Value damage | Rp ⛔; pengganti: SKU/qty on hand BARUS (INV26 `Update barus`) | 🟡 | HCI, AHI |
| Home Occupancy | SCR `OCCUPANCY HCI`/`OCCUPANCY AHI` (TGL, BU, Capasity, Used Space, %, Inbound, Outbound); FBI dari INV02 `Occupancy` per posisi | ✅/🟡 | HCI, AHI, FBI |
| Home Incoming Container | logika Monitoring Kontainer sekarang (POO, OTW, POD) | ✅ | semua |
| Home SLA Outbound | LD `RDC Tallo <BU> <Bln> <YYYY>` baris SLA Customer/SLA Store, kolom tanggal (hari terakhir terisi) vs STANDARD | ✅ | HCI, AHI |
| Inbound dashboard | Beranda sekarang (MASTER_PLAN, MASTER_LC, kontainer) | ✅ | semua |
| Storing | SO `Case ID` + `Transaction` (case id, picked, open, level bawah/atas/floor, per LVL), DP bulan berjalan (demand CBM) ; outstanding floor 🟡 ; pressing ⛔ | ✅/🟡/⛔ | AHI |
| Outbound | aging LC→Check in→Open→Close ⛔; Rit 1/Rit 2 🟡 (LB `SEMESTER 2` RETASE); booking DC & intransit 🟡 (LD baris OUTSTANDING ORDER); location pack ⛔ | 🟡/⛔ | AHI (+HCI di LD) |
| Planner | PL `Dashboard` blok HCI/AHI (plan vs realisasi per Customer RDC/NDC/RT, outstanding Today..H+3up, aging 1-3..30up per store); pending kirim = PL `Pending` | 🟡 | HCI, AHI |
| Inventory | Virtual (INV26 `Virtual`) ✅; cycle count & perbaikan WTW (INV02 `WTW *`) ✅; root cause Move/Picking (INV26 `CC MOVE`/`CC PICKING`) 🟡, Pressing/Adj±/Miss Cycle ⛔; BARUS budget (INV26 `Update barus` per posisi) 🟡; Sloc 1007/1009 (INV02 `Update 1007 & 1009`) ✅ | campuran | HCI, AHI |
| LP | tamu, DO jemputan, segel/armada terseal, return 3PL, TTO, non merch, armada Palopo/Mamuju ✅; karyawan, tarikan tugu, surat jalan, Palu, Rupa Rupa (dari `SEMESTER 2` TYPE), logbook keluar 🟡 | campuran | DC |
| MHE | Work Order di aplikasi | ✅ | DC |
| LPPBDO | IMM `LPPBDO_HCI`/`LPPBDO_AHI` (tanggal dari kolom Tanggal "1 Januari 2026"; damage = Kategori `DAMAGE GOODS`; NDC = Jababeka/Cikupa/Sidoarjo) | ✅ | HCI, AHI |
| LPPBPO (outbound) | tidak ada sumber | ⛔ | — |
| Monitoring LC DC aging | hari ini − ATA BY DC sampai TANGGAL BONGKAR terisi (Monitoring Container - Update `BACKUP`, tujuan Makassar), kelompok 0–7 / 8–14 / 15+ | ✅ | semua |
| Report Status | aturan per laporan di `research/reports.md` (9 aturan) | ✅ | — |
| Layout Gudang | `Mst_Lokasi_All` (lokasi A01.066.5 → lorong.bay.level, Zone, Level, Cubic Capacity, Section=BU); occupancy per lokasi dari `Update Stock By Location` (data lama) | 🟡 | HCI, AHI, FBI, TGI |
| Demand | Inbound (rencana bongkar CBM), Storing (DP), Planner (LD demand in/forecast), Outbound (wave) 🟡, Inventory ⛔ | campuran | — |
| MPP Kebutuhan | menunggu data pemilik | ⛔ | — |

Kesimpulan: kartu dengan ⛔ tetap ada di layar dengan keterangan "Belum tersambung ke data" dan
daftarnya ada di Settings → Database Spreadsheet → "Data yang belum tersedia".

## R7. Penempatan fitur lama

- **Decision**: Beranda lama → Dashboard Inbound; Role "to Storing"/"to Outbound" → Demand
  Storing/Outbound; Monitoring Kontainer → Monitoring Container; Monitoring LPPBDO →
  LPPBDO/LPPBPO Inbound; TTO/Dokumen → List TTO & Dokumen (tanpa sandi, akses dari login);
  Putaway, Productivity, MPP detail → tetap di balik sandi Inbound, dibuka dari Dashboard
  Inbound. Pertanyaan role per HP dan bagian Pengguna dihapus; log perangkat (tab `ROLE`) tetap
  dikirim dengan Role dari login.

## R8. Nama aplikasi dan versi

- **Decision**: `appName` dan `app_name` menjadi "Mini Monitoring" (perubahan native → APK baru,
  basis native naik); versi dasar `package.json` 2.0.0. `appId` tetap `id.imm.inbound` agar
  pembaruan menimpa aplikasi lama.

## R9. Kinerja

- **Decision**: muat per menu (lazy), cache memori + `localStorage` per sumber dengan waktu
  ambil (tampilkan cache dulu, segarkan di latar), maksimal 4 permintaan bersamaan, query gviz
  memilih kolom dan rentang tanggal seperlunya. Home hanya memuat 5 sumber kecil.

## R10. Catatan dari riset yang perlu diperhatikan saat membangun

- Header `MASTER_PLAN` sudah berubah (ada Week, Month, DAY, TGL BONGKAR, …): pastikan pembaca
  lama masih menemukan kolomnya (dicari berdasarkan teks header).
- Kapasitas HCI berbeda antara tab occupancy (7.354) dan dashboard (6.331): pakai tab occupancy,
  tanyakan ke pemilik.
- Satuan rupiah rekap kardus tidak konsisten (Juli penuh, Agustus–September ribuan): tampilkan
  kg sebagai angka utama, rupiah dengan catatan.
- Akurasi perbaikan WTW di sheet bisa > 100%: hitung ulang dan batasi 100%.
