# Survei Google Sheets – DC Tallo (untuk rebuild IMM)

Tanggal survei: 10 Okt 2026. Metode: hanya WebFetch (gviz `tq?tqx=out:csv|html`, dengan `gid=` atau `sheet=<nama tab>`, plus halaman `/edit` untuk judul dan nama tab).
Privasi: tidak ada nama orang, nomor HP, NIK, PIN atau sandi yang disalin. Kolom berisi orang ditulis "nama orang".

Catatan umum:
- **Semua 29 spreadsheet bisa dibaca publik lewat gviz** (berbagi "siapa saja yang punya link"). Tidak ada yang meminta login.
- Halaman `/edit` hanya dirender sebagian (tanpa JS), tetapi judul dan bar tab terbaca. Nomor gid per tab **tidak** terlihat, jadi pemetaan gid → nama tab tidak bisa dipastikan kecuali dari isinya.
- gviz menerima `&sheet=<Nama Tab>` (URL-encoded) — cara paling andal untuk membaca tab tertentu tanpa gid.
- Banyak tab bertipe "dashboard" (tata letak bebas, judul di sel, tanpa baris header). Untuk KPI sebaiknya baca tab data mentah (Master/Query/Transaction), bukan tab dashboard.

---

## 1. IMM master — `1Dxejz_FVQqE6t3xg6dWsLwlJoB7qBFOyZKRqvsfonQs`
- Grup: Master. Judul: "Mini Monitoring" (judul halaman /edit) / "IMM" (htmlview, og:title). Publik: **ya**.
- Tab (14): `ROLE`, `Source Link`, `Master User APK`, `LOGIC`, `MASTER_PLAN`, `MASTER_LC`, `MASTER_ZONA_MERAH`, `INBOUND_LOCAL`, `BREAKDOWN_KONTAINER`, `VENDOR`, `LPPBDO_HCI`, `LPPBDO_AHI`, `DO_UNRECEIPT`, `DAILY_PROGRESS`.
- **`Master User APK`** (tab master pengguna, ±88 baris):
  - Header: `USER | ROLE | JABATAN | (kosong) | (kosong) | ROLE | (kosong) | JABATAN`
  - `USER` = gabungan ID + nama orang dalam satu sel (perlu dipecah). Tidak ada kolom PIN/sandi, tidak ada kolom Dept terpisah (ROLE berfungsi sebagai dept).
  - Nilai ROLE (kol 2): INBOUND, INVENTORY, LP, MANAGER, ASST. MANAGER, MHE, OUTBOUND, PLANNER, STORING.
  - Nilai JABATAN (kol 3): ADMIN, MANAGER, ASST. MANAGER, SUPERVISOR, STAFF COORDINATOR, STAFF LP, STAFF, WAREHOUSEMAN.
  - Kol 6 & 8 = daftar referensi (lookup) ROLE/JABATAN di beberapa baris teratas, bukan data per orang.
- `ROLE` (tab pertama, gid default): `Timestamp | Role? | ID Perangkat | Versi | Column 4 | Column 5` — log pendaftaran perangkat APK (22 baris), Timestamp `M/D/YYYY H:MM:SS`, Role ∈ Inbound/Outbound/Storing/LP/Manager, Versi `x.y.z`.
- `Source Link`: daftar laporan per dept (kolom B) dan "Official Report" (kolom D) — **hanya nama, tanpa URL/ID** (hyperlink tidak ikut di gviz). Isinya cocok 1:1 dengan semua ID di survei ini.
- `LOGIC`: `Stock | BU | Store | BU` — peta kode lokasi stok/store → BU (A017/F004/T009 → AHI, FBI, TGI, KWI; H019 → HCI; store J* → HCI, A*/T* → AHI grup). 27 baris.
- `MASTER_PLAN`: header dua baris `DAY | NO.KONTAINER | No LC | SITE | LEAD TIME KONTAINER (HARI) | <tanggal hari ini>` + `EXP | FLEET | SHIP FROM | BU`; tanggal `d MMM yyyy`, ±113 kolom, tata letak lebar.
- `MASTER_LC`: ekspor WMS order — `No LC, ORDERKEY, EXTERNORDERKEY, AreaPengiriman, TradingPartner, KODE SITE, SITE NAME, ORDERDATE, REQUESTEDSHIPDATE, POKEY, TYPE, STATUS, ADDDATE, EDITDATE, EDITWHO, SITE, SKU, DESCR, Dept, ORIGINALQTY, OPENQTY, QTYPREALLOCATED, QTYALLOCATED, QTYPICKED, SHIPPEDQTY, CBM_ORIGINAL_QTY, CBM_SHIPPED_QTY`; tanggal `MM/DD/YYYY HH:MM`.
- `MASTER_ZONA_MERAH`: `ARTIKEL | DEPT | DESC` — daftar artikel zona merah.
- `INBOUND_LOCAL`: judul "INCOMING IE"; header `Vendor | UoM` + kolom tanggal "1 July"…"30 October" (tanpa tahun), nilai 1/kosong (kedatangan armada vendor lokal).
- `BREAKDOWN_KONTAINER`: `BU | HARI - POD (TEUS)` + kolom hari 0–14 (aging kontainer sejak POD, dalam TEUS).
- `VENDOR`: penilaian vendor ekspedisi — sama dengan Inbound #3 di bawah (Week, TGL BONGKAR, …, 6 kriteria YA/TIDAK).
- `LPPBDO_HCI` (dan diasumsikan `LPPBDO_AHI` sama): 28 kolom `UPDATE, Tgl, Bulan, BU, LPPBDO No., Site Receiver, Load Id, Driver(nama orang), Receiver(nama orang), Tujuan, Do No., Artikel, Desc, dept_code, Qty OD, Qty Receive, Remark Detail, Status, Kategori, Qty LPPBDO, Created by, Posted by, Dept, JGN DIRUBAH, (kosong 0/1), (kosong), Tanggal ("1 Januari 2026"), Week`.
- `DO_UNRECEIPT`: 41 kolom ekspor SAP (DO Number, DO Item, Loading Number, WMS SO No., RDelvDate, Suppl Code, Rec. Code, Article, DO qty, NorQty, DmgQty, TotQty, DiscQty, GR Doc/Date, TP Doc, LPBB Number, GI date, …) — **saat ini kosong** (header saja).
- `DAILY_PROGRESS`: judul "Inbound DC Tallo Makassar"; kolom `MPP` (nama orang) + 93 kolom tanggal "1 July"…"1 October" (tanpa tahun), nilai 0/1 per orang (kehadiran MPP/SPV/KOORDINATOR).
- KPI: master user → login/role; LPPBDO → jumlah selisih (Qty OD − Qty Receive) per BU/minggu; BREAKDOWN_KONTAINER → kontainer > 7 hari sejak POD; DAILY_PROGRESS → MPP hadir per hari.

---

## LP (Loss Prevention)

### 2. `1Pr9g7PQ9_xFIBhejYo8eBbPmoOeBmI6OQKaaGqLFboE` — "Logbook Visitor"
- Publik: ya. Tab: `Form Visitor` (hanya ini yang terlihat).
- Header: `Timestamp, Tanggal Kunjungan, Nama Tamu(nama orang), Asal Perusahaan, Nomor Telepon(sensitif), Tujuan Kunjungan, No. Dokumen, Peralatan yang dibawa, Jam Masuk, Jam Keluar, Lp yang Bertugas(nama orang)`.
- Data: log tamu (Google Form). Timestamp `DD/MM/YYYY HH:MM:SS`, jam `HH:MM:SS`. Tanggal Kunjungan kadang kosong → pakai Timestamp.
- KPI: jumlah tamu hari ini, tamu masih di dalam (Jam Keluar kosong), rata-rata durasi.

### 3. `1OTPaUh5C1iHHPj_ihsfMxTjVhrfxPDZNHundJvUO9Zg` — "Form Kontrol Keluar Masuk Karyawan DC Tallo (Jawaban)"
- Publik: ya. Tab: `Form Responses 1`.
- Header: `Timestamp, Tanggal, Kode Store, Nama Karyawan(nama orang), Bagian, NIK Karyawan(sensitif), Status, Keterangan, Jam Keluar, Jam Masuk, Yang Bertugas Cek Body(nama orang), Durasi waktu`.
- Data: izin keluar-masuk karyawan (ISOMA, toilet, dll). Tanggal `DD/MM/YYYY`, durasi `H:mm:ss`.
- KPI: jumlah izin keluar per hari/bagian, yang belum kembali (Jam Masuk kosong), durasi rata-rata/melebihi batas.

### 4. `1tW0CEKUTkcMBFFVgk_8BOCIBzf0nkGxG-_g8V7iKVX0` — "LOGBOOK BARANG KELUAR 2026"
- Publik: ya. Tab: `SUMMARY`, `Monitoring LC`, `EROR LOADING`, `SEMESTER 1`, `SEMESTER 2`, `AZKO MAMUJU`, `DATA ARMADA PALOPO`, `DATA ARMADA PALU 2026`, `TRANSAKSI RUPA RUPA`, `TTO`, `NON MARCHENDISE` (bar tab sebagian rusak).
- Tab pertama (SUMMARY): tanpa header nyata; kolom 1 label ("TOTAL OD 2026 SEMESTER 1", …), kolom 2 angka (teks). Ringkasan jumlah OD.
- KPI: total OD per semester langsung dari SUMMARY; detail harian perlu tab SEMESTER 2 (belum disurvei).

### 5. `1U4Odr5w27a7ErcdCAJIhsJpBcYMqTBbMpgjXINGAnZc` — "TERBARU BARANG MASUK 2026"
- Publik: ya. Tab: `DO JEMPUTAN ALL BU TAHUN 2026`, `PENDINGAN 2026`, `TARIKANTUGU 2026`, `BARANG RETURN 3PL`, `SURAT JALAN`, `TTO`, `NON MERCHANDISE`, `IE`, `JEMPUTAN STO`, `BARANG MASUK KONTAINER`, `TRADE IN`.
- Tab pertama: `(kolom basmalah, isi "V"), NO RT, NO RCV / OD, (kosong), NAMA CUSTOMER(nama orang — jangan ditampilkan), KOLI, DRIVER(nama orang), NO POLISI, STORE PENGIRIM, LP, PENERIMA, KETERANGAN`.
- Data: barang jemputan/retur masuk; baris pemisah tanggal berbentuk teks "Kamis 01/01/2026" (bukan kolom tanggal!) → tanggal harus diambil dari baris pemisah atau dari YYYYMMDD di NO RCV/OD.
- KPI: jumlah dokumen/koli masuk per hari per store pengirim.

### 6. `1jB8LDiBboIynBJPdO38CCpXGNWXD7LxF8uSRfLPZ4uk` — "REKAP DATA PENJUALAN KARDUS"
- Publik: ya. Tab: `Form Responses 1`, `DATA PENJUALAN KARDUS`.
- Header: `Timestamp, Email Address, TGL PROSES, TGL SETOR, JUMLAH /KG, TOTAL HASIL PENJUALAN, KETERANGAN, Pelapor(nama orang), Petugas LP(nama orang), Harga/KG, Total`.
- Format campur: Timestamp `M/D/YYYY`, TGL `D-Mon-YYYY`, angka "Rp 1,234" / "12 kg" sebagai teks.
- KPI: total kg dan rupiah per bulan (perlu pembersihan angka).

### 7. `1wu9xjqFrmWaqNQksdOBfoy9xAu-cJYn14zSscm7fCvk` — "CHEKLIST OBSERVASI"
- Publik: ya. Tab: tidak terbaca. Halaman besar (>100 rb karakter → banyak baris, ratusan+).
- Header: `TGL & WAKTU, OBSERVASI, DUTY(nama orang), LP(nama orang), PINTU OUTBOUND A, PINTU OUTBOUND B, PINTU INBOUND, AREA MHE, OFFICE, DISPATCHING, CHATIME, STORING, RECIVING, AREA GUDANG LUAR, KUNCI ARMADA, KONDISI LAMPU, KONDISI CCTV, KONDISI CHARGER LIFTRUCK/FALLET MOVER, KONDISI STOP KONTAK, KONDISI TEMPAT SAMPAH, KONDISI ALARM, PARAF DUTY, PARAF LP`.
- Data: checklist opening/closing; `DD/MM/YYYY HH.MM.SS` (titik sebagai pemisah jam); nilai "Aman"/"TERGEMBOK" atau teks temuan.
- KPI: checklist hari ini sudah diisi (opening/closing), jumlah temuan (sel ≠ "Aman").

### 8. `12_LjT16sinXF6V2rAa_wPgS2rWeRY3un71I7MPtoc_s` — "UPDATE ARMADA YANG TERSEAL PENGIRIMAN ASTOR"
- Publik: ya. Tab: `Sheet1`.
- Header: `NO, NO POL, SEAL, TUJUAN` dengan baris pemisah tanggal teks "Jumat 09/10/2026".
- KPI: jumlah armada tersegel per hari / per tujuan.

---

## Inbound

### 9. `1F1VnN_kOOpTCUMip_-Jpdg6RUY7Ai9wmNFVFr6Z0kac` (gid 2031532) — "2026 PLANNING INBOUND (UNLOADING CONTAINER)"
- Publik: ya. 35 tab: `MASTER, Sheet77, Sheet74, LAPORAN, WEEKLY, DASHBOARD, COUNTAINER2026, Sheet73, MONITORING POD CONTAINER, JAN 2026, OTW POO AHI, MAR 2026, OTW POO HCI, FEB 2026, APR 2026 … DES 2026, Sheet76, Sheet75, Summary Periode Juni - Des, SLA UNLOAD COUNTAINER, DEMORAGE, Sheet70, TRANSIT, SUMMARY26, QUARTER 2026, Waktu Kerja Lebih, Harian, SumAll`.
- gid 2031532 (nama tab tidak pasti; kemungkinan ringkasan/LAPORAN): tabel per BU/SITE dengan grup `SKU, QTY, CBM, KOLI` untuk STORE OD / CUSTOMER OD / TOTAL OD, lalu `COUNTAINER (Teus)` per asal (CIKUPA/J-BEKA/SIDOARJO 40FT/20FT) dan LOKAL per merek (SAMSUNG, SHARP, LG, SONY, AQUA). Tanpa kolom tanggal. Dua kolom pertama tampak berisi kode/ID.
- KPI: TEUS per asal, total OD (qty/CBM/koli) per BU; detail kontainer harian ada di tab bulanan (JAN–DES 2026) dan `MONITORING POD CONTAINER`.

### 10. `1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong` (gid 1965699097) — "Dashboard Inbound Semester 2"
- Publik: ya. 29 tab: `Summary, Dashboard Daily, Dashboard Inbound, MPP, Transaction (Stock), Monitoring Transit, Query Progress (Stock), Query Progress (Transit), Productivity, Pengaturan, _ToolsState, Status Tools, Local, LPPBDO, Monthly, Weekly, Weekly (Jum'at), Template Meeting, Penilaian Vendor, Data untuk VM, bahan meeting, bahan meeting jumat, Master, Master Transit, Master Jumat, Master 2, Data Zona Merah, Query Lead Time, Lead Time Progress`.
- gid 1965699097 = **`Dashboard Daily`** (judul "Dashboard Daily Inbound", tanggal "10 October 2026", jam, "Unloading Today", "BU"). Tata letak dashboard, bukan tabel.
- Kemungkinan ini sumber utama aplikasi IMM sekarang. Untuk KPI baca `Transaction (Stock)`, `Query Progress (Stock/Transit)`, `Productivity`, `Master*`, bukan tab dashboard.

### 11. `1T6uWLA_8eDa5TYaKGZATHUoGMYXc6JzrR4wHEFK4mi4` (gid 1752327237) — "INBOUND (SCRIPT)"
- Publik: ya. 16 tab: `Dashboard Inbound, Occupancy, MPP, Local, Penilaian Vendor, Breakdown, Master Zona Merah, Master, Master 2, Master LC, OTW, LPPBDO, DO Unreceipt, Daily Progress, Handover, Productivity`.
- gid 1752327237 = **`Penilaian Vendor`**: `Week, TGL BONGKAR (DD Month YYYY), PLAN JAM TIBA, ACTUAL TIBA (H:mm), NO.KONTAINER, NO LC, SITE, TEUS, EXP, Status` + 6 kriteria YA/TIDAK (Kontainer bocor, Terlambat, Dokumen H-2, Kesesuaian permintaan, Informatif, Tarik kontainer). Tabel kedua di sebelahnya memakai `DD/MM/YYYY` dan ringkasan % per VENDOR EXPEDISI.
- KPI: skor vendor = % "TIDAK" per kriteria per ekspedisi per minggu; ketepatan waktu = ACTUAL ≤ PLAN.
- Struktur tab ini mirip master IMM (MASTER_*, LPPBDO_*, DO_UNRECEIPT, DAILY_PROGRESS) — tampaknya IMM master disalin dari sini oleh script.

---

## Inventory

### 12. `1Lah0IepAbVPJ1wpE6hjtEwOqojgKJniJvYn5FJtcob0` (gid 386268370) — "Dashboard inventory SCR"
- Publik: ya. Tab: `OCCUPANCY HCI`, `OCCUPANCY AHI`, `BARUS`, `1007 & 1009`.
- gid 386268370 (kemungkinan OCCUPANCY AHI): `TGL, BU, Capasity, Used Space, %, Inbound, Outbound` (+18 kolom kosong). TGL `d MMM yy` ("1 Jan 26"); angka desimal (CBM); % teks.
- KPI: occupancy harian = Used Space / Capasity; tren inbound/outbound CBM. **Sumber paling bersih untuk KPI occupancy.**

### 13. `10CJOU1DCjNnm6HePh0Xt_GT_i243XLJwo07MkaDyLNo` (gid 1494837787) — "Dashboard inventory02"
- Publik: ya. 16 tab: `Sheet2, Occupancy, Dashboard, Helper 1007 & 1009, Copy of Occupancy, Update 1007 & 1009, Helper Accupancy, Helper WTW HCI, Helper WTW AHI, Helper Pdg GR Store, Pending GR STORE & DC, In & Out, Helper In & Out, 1007 & 1009, WTW HCI, WTW AHI`.
- gid 1494837787 (cycle count harian): `TGL, TARGET, PLUS, MINUS, LOC KOSONG, RALISASI, ACCURASI LOC, Disc.Awal, PLUS, MINUS, HIT, TOTAL COUNT, ACCURASI COUNT, Disc.Awal, PLUS, MINUS, HIT, TOTAL QTY, ACCURASI QTY` lalu grup DONE/ON (LOC/COUNT/QTY + PLUS/MINUS/ACCURASI). TGL `d MMM yyyy`; akurasi teks "86.32%". Nama kolom berulang → baca berdasarkan posisi atau grup.
- KPI: akurasi lokasi/count/qty harian vs target.

### 14. `1_HLTa4UBkM74DnebjIS4lhj5iLN9HSApRoFpBYeLgHE` (gid 1921661520) — "DASHBOARD INVENTORY 2026"
- Publik: ya. 28 tab: `Sheet18, THROUGHPUT ( STOCK ) daily, THROUGHPUT ( STOCK ) Weekly, Grouping By Dept, Occupancy, Sheet31, HCI, AZKO, NEW DASHBOARD, Copy of NEW DASHBOARD, Sheet26, WTW HCI, WTW AZKO, Update barus, grafik, IN & OUT BARUS, Virtual, 1003 & Compere, Cycle Count, Pending GR STORE & DC, 1007 & 1009, CC PICKING, CC WTW, CC MOVE, Data Install, Pending GR DC, Sheet27, Sheet28`.
- gid 1921661520 (kemungkinan `Update barus`): dua blok "UPDATE BARUS OKTOBER 2026" HCI dan AZKO/AHI: `status, TOTAL SKU, QTY, %, RC SKU, QTY, HD SKU, QTY, PR SKU, QTY, TG SKU, QTY`. Status mis. "BELUM DI ADF", "APPROVAL DISKON". Tanpa kolom tanggal (bulan di judul).
- KPI: SKU/qty barang rusak (BARUS) per status per BU.

---

## Planner

### 15. `1WHg13sOdeAVtutRIn5eL_11a3SjOAR5d4fOWUXMiFiA` — "Dashboard Planner"
- Publik: ya. Tab: tidak terbaca dari /edit.
- Tab pertama = dashboard (±60 baris terisi): filter `SITE`, `AREA`, From/To Date (judul "SATURDAY 10 OCTOBER 2026"); blok "BY CUSTOMER" (HCI/AHI × Customer RDC/NDC/RT/TOTAL, TODAY (H0), OUTSTANDING CUSTOMER, OD, QTY, Kontribusi % CBM); blok "BY STORE (GRW)" dengan aging intransit 1-3/4-7/8-15 hari per store; ringkasan per site + AVG PER HARI; panel ORDER TERTINGGI/TERENDAH. Banyak sel `#VALUE!`, `#N/A`, `#DIV/0!`.
- KPI: outstanding customer OD dan aging intransit — tetapi hanya untuk tanggal yang dipilih di filter sheet; data mentah ada di tab lain yang belum diketahui.

---

## Storing

### 16. `1UxfNFEWjHhPP9MhBIAMDYnT6cv6XkzgeWX1qWk0YSNU` (gid 1151732757) — "DASHBOARD STORING & OUTBOUND AHI 2026"
- Publik: ya. Tab: `Dashboard, report/day, SHIPMENT, FILLRATE, RT, Query Picking, Case ID, Transaction, Query Grouping, Query Fillrate, shiped nol, AA, MIS SLA, Miss pick`.
- gid 1151732757 = `Dashboard` (judul "DASHBOARD STORING & OUTBOUND 2026", label "KPI", kolom jam "0:00:00"…). Tata letak dashboard, tanpa header.
- KPI: fill rate, SLA, miss pick — ambil dari `Query Fillrate`, `MIS SLA`, `Miss pick`, `Transaction` (belum disurvei).

### 17. `1xiP8ziuMarhvMI_f_WOjwwW3Vm4B3KleAYRGRFmpFSg` (gid 1254590900) — "Demand Picking 2026"
- Publik: ya. Tab: `sumary, diman picking, Feb, Maret, Mei, April, jUNI, jULI, Augt, Sept, okt`.
- gid 1254590900 = `diman picking`: `diman picking tgl` lalu grup berulang `cid, sku, qty, cbm` untuk: plan picking grw Ahi OD, plan picking cust Ahi OD, RUMUS total picking OD, Transit Store Ahi/Tgi/Kwi OD, RUMUS Total Transit Store OD, Transit Customer OD, RT cust OD, lalu `Sisa Diman BY CBM GRW/TRA, Cust Dc/Store`, RUMUS TOTAL DI MAN ALL OD. Tanggal teks "Thursday, 1 Oct" (tanpa tahun).
- KPI: demand picking harian (CBM/qty) per jenis; sisa demand.

---

## Official Report

### 18. `1yJpdmsaMT2nRGFXj21aSix9qQENJqy16D5g4U73ggww` — "MONITORING CONTAINER 2026"
- Publik: ya ("View only"). Tab: tidak terbaca.
- Tab pertama = tabel referensi: `CODE, SHIP NAME, (DROP WH), (RDC-SDC), CODE, KATEGORI (STORE/HUB), 0, POO (On Sailling/Yard/Delivered), ORIGIN, TUJUAN, QEY (ORIGIN-TUJUAN), (lead time hari)`. Tanpa tanggal.
- KPI: status kontainer nasional (POO → On Sailing → Yard → Delivered) dan lead time per rute.

### 19. `1IdI7WJr1SzyAL8WWASoO3ZkbFu3fp-xpGEn2Mm-W7VI` (gid 63428621) — "Monitoring Container - Update"
- Publik: ya. Tab: tidak terbaca.
- gid 63428621: judul "Data Container RDC -SDC" / "Update Data di link VM"; kolom `Teritori, DC, BU, Owner(nama orang), Status, Est. Penyelesaian POD, Growth` + kolom tanggal "10 Oct"…"16 Oct" (tanpa tahun). Angka dengan koma ribuan; Growth teks dengan ▲/▼.
- KPI: progres POD per DC/teritori.

### 20. `1EvZus41LoHBFBEGyVz9Ri6Re_q5G0c-cZtAcsAxy7vU` — "Salinan DC Daily Report - HCI"
- Publik: ya. Tab: `RDC Tallo HCI Okt, INBOUND, OUTBOUND CUSTOMER, OUTBOUND STORE, OUTBOUND ALL, OTHERS DC DAILY REPORT, Sheet Link, RDC Tallo HCI Sept … Jan` (satu tab per bulan).
- Tab pertama (RDC Tallo HCI Okt): baris = metrik (mis. "INBOUND VENDOR LOCAL", "OUTSTANDING AS OF TODAY", "0 HARI", "1 HARI", "2 HARI", "ARMADA"), kolom `UoM` + 36 kolom tanggal " 1 Oct-26"…" 5 Nov-26" (`d Mon-yy`, teks). Format "matriks lebar".
- KPI: ambil kolom tanggal hari ini → nilai metrik harian; perlu transpose.

### 21. `1xDo4qqUeBbbb_lLdAzSaBFDnylDZ7N56SjNcD59mWbw` — "Salinan dari Daily Report DC - AHI & NEKA"
- Publik: ya. Tab: `INBOUND, OUTBOUND STORE, OUTBOUND CUSTOMER, OUTBOUND ALL, OTHERS DC DAILY REPORT, RDC Tallo AHI Okt, … Sept/Jan–Agust, Sheet Link`.
- Tab pertama: struktur identik dengan #20 (INBOUND VENDOR LOCAL, UoM, kolom tanggal `d Mon-yy`).
- KPI: sama dengan #20, untuk BU AHI.

---

## Daily reports (dicocokkan ke nama di `Source Link`)

### 22. `1-DrDOPpH80FZ819XEXJr7MPJcq38Gv_2fTHHAwm8JZs` — "Laporan Daily Update 2026" (Official Report)
- Publik: ya. Tab: `RDC Tallo AHI Okt 2026, Summary AHI, AHI, RDC Tallo HCI Okt 2026, Summary HCI, HCI, schedulle, Penggunaan Armada, RDC Tallo HCI/AHI Jun…Sept 2026`.
- Tab pertama: `(kosong), PERFORMANCE, STANDARD, (kosong), 1 Oct-26 … 5 Nov-26` — baris = KPI (mis. "SLA Customer"), STANDARD "99%", nilai harian "100.00%".
- KPI: **sudah berupa KPI harian vs standar** — paling siap pakai untuk dashboard manajer.

### 23. `1F2JiOJpp2F7ITOjoMkchLE-HTCYUE6ZODRcvaqRhLwk` — "Data Container RDC -SDC" (Official Report)
- Publik: ya. 24 tab: `ALL, TEMUAN, Issue Point, LIST NRW, SUMMARY REPORT, SUMMARY SLA, RDC TALLO, RDC TAMORA, SDC AMBON/MANADO/PONTIANAK/BALIKPAPAN/KENDARI/BANJARMASIN/KUPANG/SAMARINDA/PALU/PANGKAL PINANG/TARAKAN/TERNATE/ABEPURA/BATAM/SORONG, Throughtput Batam`.
- Tab pertama (ALL): `count status, status (POO/On Sailling/Yard/Dooring), (kosong), ORIGIN, TUJUAN, QEY, ON SAILLING, ETD` + rumus ARRAYFORMULA/XLOOKUP/VSTACK yang menggabungkan tab per DC.
- KPI: jumlah kontainer per status per DC; tab `RDC TALLO` relevan untuk Tallo.

### 24. `1Fh9ZBo3sTW4u4upoWslDzT0Vl2Nh6ikJ5TJGiOx6GrQ` — "Layout AHI lokasi DC Tallo Update DASHBOARD" (Storing)
- Publik: ya. Tab: `Summary, By Dept, Layout CBM, Layout Loc, MASTER, Sheet4, PROJECT, Layout Dept, Grouping By Dept, Heat Map, Update Stock By Location, Master Loc, AHI, DEPT`.
- Tab pertama (Summary): `(kosong), DEPT, DESC, SESUAI SKU, %, NYASAR SKU, %, %, (total)` — kepatuhan lokasi per dept.
- KPI: % SKU "nyasar" (salah lokasi) per dept AHI.

### 25. `1HTmVQq7pnId3WdH-i-cG0H1LXfdiqaqMEkUs72z5dJM` — "Layout lokasi DC Tallo UP DATE HCI" (Storing)
- Publik: ya. Tab: `Sheet5, By Dept, Layout CBM, Layout Loc, Layout Dept, Mst_Lokasi_All, Mst_Lokasi_HCI, Mst_Lokasi_AHI, Mst_Lokasi_TGI, Mst_Lokasi_FBI, Grouping By Dept, Heat Map, Update Stock By Location, Timeline, Master Loc`.
- Tab pertama (`Sheet5`) kosong lewat gviz. Tab `Update Stock By Location` (dibaca dengan `sheet=`): ekspor WMS stok per lokasi — `NO., STORERKEY, LOT, LOC, LOC CATEGORY, ID, SKU, DESCR, SKUGROUP, LOTVAL, UOM, QTY, QTY CARTON, QTY INNER, QTY EA, QTYALLOCATED, QTYPICKED, AVAILABLE, STATUS, EDITDATE, EDITWHO, NON ORPACK, COM LOT SKU, Expiry Date, TOEXPIREDAYS, LOTTABLE04, SHELF LIFE, FLAG, CM3, KET`.
- KPI: stok per lokasi/dept, barang mendekati kedaluwarsa (TOEXPIREDAYS), heat map okupansi lokasi.

### 26. `1Vp7QyadObJJA0n8jV5SjCgkbL3klGpFvYzZiXAuyGxc` — "Daily Report HCI - RDC SDC" (Official Report)
- Publik: ya. Tab: `HCI`, `Sheet6`, banyak `BackUp_<dd Mon>` (08 Aug … 09 Oct).
- Tab pertama (HCI): tanpa header; judul "DC Daily Report" + daftar laporan per BU (HCI, AHI, SISCO AHI GROUP). Indeks/penghubung, bukan data.
- KPI: tidak langsung; isi ada di tab BackUp_* (snapshot harian).

### 27. `1iXNQJ3mLv7mw3X1x9n_IvVEroprL-scWhe13-dFGONY` — "Salinan dari Daily 2026 TALLO" (Official Report)
- Publik: ya. Tab: `Inbound`, `SLA & Outstanding Store`, `SLA Customer HCI`, `SLA Customer AHI`, `Occupancy & Akurasi`.
- Tab pertama (Inbound): "MONITORING CONTAINER INBOUND" 7 hari ke belakang — `Periode (dd MMM yyyy), BU, POO, OTW, POD 0 - 7 Hari, > 8 Hari, Total, TOTAL, SLA 0 - 7 Hari, > 8Hari, %`.
- KPI: **SLA bongkar kontainer (POD → bongkar < 7 hari)** per BU, siap pakai.

### 28. `1o8GxDc72nZTcHdj9oBH2CuYPZHbHvd1And4mG0yzRFw` — "Occupancy & Planning Inbound RDC SDC 2026" (Official Report)
- Publik: ya. Tab: `W1`…`W52`, `W1-2027`, `Copy of W22` (satu tab per minggu).
- Tab pertama: `(label), Medan, W1 … W52` — baris Inbound / Outbound (angka berkoma) / Occupancy ("58%") per DC daerah; ada blok "OCCUPANCY DC DAERAH", "MONITORING CONTAINER", "PLAN BONGKAR CONTAINER [CBM]".
- KPI: tren occupancy mingguan per DC; minggu ditulis "W<n>" tanpa tahun.

---

## Celah terbesar
1. **Pemetaan gid → nama tab tidak bisa dipastikan** lewat WebFetch (halaman /edit tanpa JS tidak menampilkan gid). Solusi: pakai `sheet=<nama tab>` di gviz.
2. **Master user tidak punya kolom PIN/sandi maupun ID terpisah**: `USER` menggabungkan ID + nama; ROLE dipakai sebagai dept. Untuk login perlu sumber kredensial lain (mis. Supabase) — jangan taruh PIN di sheet publik.
3. **Data pribadi di sheet publik**: nomor HP tamu (#2), NIK karyawan (#3), nama customer/driver (#5, LPPBDO). Siapa pun dengan ID bisa membaca. Dashboard harus menyaring kolom ini; pertimbangkan membatasi berbagi.
4. **Banyak tab dashboard tanpa header** (Inbound Dashboard Daily, Storing Dashboard, Planner, Daily Report HCI) dan sel error (`#N/A`, `#DIV/0!`). KPI harus dihitung dari tab mentah (Master/Query/Transaction) yang sebagian belum disurvei.
5. **Format tanggal tidak seragam**: `M/D/YYYY`, `DD/MM/YYYY`, `d MMM yy`, `d Mon-yy`, `D Month` tanpa tahun, `W<n>` tanpa tahun, `dd/mm/yyyy HH.MM.SS`, "1 Januari 2026", baris pemisah tanggal berupa teks. Angka sering teks ("Rp", koma ribuan, "%", "kg").
6. **Format matriks lebar** (tanggal sebagai kolom) di Daily Report HCI/AHI, Laporan Daily Update, INBOUND_LOCAL, DAILY_PROGRESS — perlu transpose; jendela tanggal bergeser tiap bulan.
7. `DO_UNRECEIPT` di master IMM kosong; `Source Link` tidak memuat URL (hyperlink hilang di gviz) sehingga daftar ID harus disimpan di konfigurasi aplikasi.
