# Feature Specification: Mini Monitoring DC Tallo Makassar

**Feature Branch**: `feat/mini-monitoring`

**Created**: 2026-10-10

**Status**: Draft

**Input**: Dokumen `Next_Update_Apk_Terbaru.docx` dari pemilik (tim DC Tallo Makassar), dua gambar
logo brand Kawan Lama Group, dan 29 tautan spreadsheet sumber data. Keputusan pemilik pada
2026-10-10: masuk cukup dengan NIK dari spreadsheet, notifikasi bertahap, data input disimpan
di Supabase, dan semua bagian dirilis sekaligus.

## Ringkasan

Aplikasi IMM (Inbound Mini Monitoring) diganti nama menjadi **Mini Monitoring** dan diperluas
dari aplikasi khusus inbound menjadi aplikasi monitoring seluruh departemen DC Tallo: Inbound,
Storing, Outbound, Inventory, Planner, LP (Loss Prevention), dan MHE. Setiap pengguna masuk
dengan NIK-nya. Menu yang terlihat ditentukan oleh Role (departemen) dan Jabatan pengguna di
tab `Master User APK`. Navigasi menjadi tiga bagian: **Home**, **List**, dan **Settings**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Masuk dengan NIK dan melihat menu sesuai hak akses (Priority: P1)

Pengguna membuka aplikasi, melihat intro "Mini Monitoring DC Tallo Makassar", lalu mengetik
NIK. Aplikasi mencocokkan NIK dengan tab `Master User APK`, menyimpan Role dan Jabatannya, dan
menampilkan Home. Di List hanya muncul menu yang boleh dibuka sesuai tabel akses.

**Why this priority**: semua fitur lain bergantung pada identitas pengguna (hak akses, kolom
"input by", persetujuan Work Order).

**Independent Test**: masuk dengan NIK uji dari tiap kombinasi Role × Jabatan, lalu bandingkan
daftar menu di List dengan tabel akses (FR-010).

**Acceptance Scenarios**:

1. **Given** NIK terdaftar dengan Role INBOUND dan Jabatan SUPERVISOR, **When** pengguna masuk,
   **Then** Home tampil dan List memuat Dashboard, Monitoring, Occupancy & Capacity, Sloc,
   Project & Schedule, Demand, LPPBDO/LPPBPO, Report, TTO & Dokumen, Infrastructure, MPP, tetapi
   tidak memuat LP Menu.
2. **Given** NIK tidak ada di master, **When** pengguna menekan Masuk, **Then** muncul pesan
   "NIK tidak terdaftar. Hubungi admin." dan pengguna tetap di layar masuk.
3. **Given** pengguna sudah masuk, **When** aplikasi ditutup dan dibuka lagi, **Then** pengguna
   langsung ke Home tanpa mengetik NIK lagi, sampai ia memilih Keluar.
4. **Given** Role atau Jabatan pengguna diubah di master, **When** aplikasi memuat ulang data,
   **Then** menu di List mengikuti nilai terbaru.

---

### User Story 2 - Home: kondisi DC dalam sekali lihat (Priority: P1)

Manajer membuka Home dan langsung melihat lima angka: Akurasi DC Tallo, Value barang damage,
Occupancy, Incoming Container (POO, OTW, POD), dan SLA Outbound. Semuanya mengikuti filter BU.

**Why this priority**: inilah layar yang paling sering dibuka atasan.

**Independent Test**: dengan data tiruan yang diketahui, kelima angka di Home sama dengan
perhitungan manual dari sumbernya untuk Semua BU dan untuk tiap BU.

**Acceptance Scenarios**:

1. **Given** filter Semua BU, **When** Home dibuka, **Then** tampil Akurasi (persen hitung
   terbaru), Value damage (rupiah), Occupancy (persen dan CBM terpakai dari kapasitas), jumlah
   kontainer POO/OTW/POD, dan SLA Outbound (persen terhadap standar), masing-masing dengan
   tanggal datanya.
2. **Given** satu sumber gagal dimuat, **When** Home dibuka, **Then** kartu yang terdampak
   menampilkan "Data belum bisa dimuat" dengan tombol coba lagi, dan kartu lain tetap tampil.
3. **Given** pengguna mengetuk satu kartu, **When** ia punya akses ke menu terkait, **Then**
   aplikasi membuka menu List yang sesuai (mis. Occupancy & Capacity).

---

### User Story 3 - Filter global BU dengan logo (Priority: P1)

Filter BU menjadi dropdown: Semua BU, HCI (logo Informa, Selma), AHI (logo Azko, Ataru),
KWI (Krisbow), TGI (Toys Kingdom), FBI (Chatime). Filter periode bawaan semua List adalah
"Hari ini"; LPPBDO/LPPBPO memakai "Bulan ini".

**Why this priority**: semua layar membaca filter ini.

**Independent Test**: memilih tiap BU mengubah angka di Home dan List sesuai data BU itu saja;
memilih Semua BU sama dengan jumlah kelima BU.

**Acceptance Scenarios**:

1. **Given** aplikasi baru dibuka, **When** List apa pun dibuka, **Then** filter yang aktif
   adalah "Hari ini" dan "Semua BU" (LPPBDO/LPPBPO: "Bulan ini" dan "Semua BU").
2. **Given** dropdown BU dibuka, **When** pengguna melihat pilihan, **Then** tiap BU tampil
   dengan logo brand-nya dan nama BU-nya, dan pilihan bisa dibaca di tema terang dan gelap.

---

### User Story 4 - Dashboard per departemen (Priority: P2)

Pengguna membuka List → Dashboard, memilih departemen di dropdown (Inbound, Storing, Outbound,
Inventory, Planner, LP, MHE), dan melihat KPI departemen itu beserta yang tertunda/aging.

**Why this priority**: memberi semua departemen alasan memakai aplikasi setiap hari.

**Independent Test**: tiap departemen menampilkan KPI di FR-030..FR-036 dari data tiruan dengan
angka yang cocok dengan perhitungan manual; KPI tanpa sumber tampil sebagai "Belum tersambung".

**Acceptance Scenarios**:

1. **Given** dropdown Inbound, **When** dashboard tampil, **Then** terlihat TEUs masuk, CBM
   masuk, dan jadwal bongkar seperti Beranda versi sekarang.
2. **Given** dropdown Outbound, **When** dashboard tampil, **Then** tiap tahapan aging
   (LC→Check in, Check in→Open, Open→Close) menampilkan rata-rata, minimum, dan maksimum.
3. **Given** KPI yang sumbernya belum tersedia, **When** dashboard tampil, **Then** kartu itu
   bertuliskan "Belum tersambung ke data" dan tidak menampilkan angka nol palsu.

---

### User Story 5 - Work Order Infrastructure dengan persetujuan Manager (Priority: P2)

Pengguna membuat Work Order lewat "Tambah Work Order". Nomor dibuat otomatis
(`WO-yyyymmdd-0001`). Manager menyetujui. MHE menandai selesai dengan 1–4 foto.

**Why this priority**: alur kerja baru yang sekarang belum tercatat di mana pun.

**Independent Test**: buat WO, setujui sebagai Manager, tandai selesai sebagai MHE dengan dan
tanpa foto; periksa nomor, status, pencatat, dan pemberitahuan di tiap langkah.

**Acceptance Scenarios**:

1. **Given** WO terakhir hari ini bernomor `WO-20261010-0003`, **When** WO baru disimpan,
   **Then** nomornya `WO-20261010-0004`; WO pertama besok bernomor `WO-20261011-0001`.
2. **Given** pengguna bukan Manager, **When** ia membuka WO berstatus Menunggu persetujuan,
   **Then** tombol Setujui tidak tersedia.
3. **Given** MHE menandai WO selesai tanpa foto, **When** ia menekan Simpan, **Then** aplikasi
   menolak dengan pesan "Lampirkan minimal 1 foto dokumentasi".
4. **Given** MHE melampirkan 5 foto, **When** ia memilih foto ke-5, **Then** aplikasi menolak
   foto tersebut dan memberi tahu bahwa batasnya 4 foto.
5. **Given** WO dibuat, menunggu persetujuan, berstatus Pending, atau Selesai, **When** Manager
   membuka aplikasi, **Then** ia melihat pemberitahuan dan jumlah WO yang perlu tindakan.

---

### User Story 6 - Observasi dan Checklist LP (Priority: P2)

LP membuat Observasi (`OBS-yyyymmdd-0001`), check-in (Open → Ongoing), mengisi sub menu
Observasi (per lokasi) dan Checklist (per alat) dengan kondisi pilihan ganda, detail, dan foto,
lalu menutupnya (Ongoing → Closed).

**Why this priority**: menggantikan checklist observasi manual di spreadsheet.

**Independent Test**: jalankan satu observasi penuh, periksa status, nomor, isian, foto, dan
NIK pencatat.

**Acceptance Scenarios**:

1. **Given** observasi Open, **When** LP menekan Check-in, **Then** status menjadi Ongoing dan
   sub menu Observasi dan Checklist terbuka.
2. **Given** lokasi Area MHE, **When** LP memilih kondisi Bersih dan Aktif, **Then** keduanya
   tersimpan untuk lokasi itu.
3. **Given** observasi Closed, **When** dibuka lagi, **Then** isinya hanya bisa dibaca.

---

### User Story 7 - Menu List lainnya (Priority: P3)

Pengguna membuka Monitoring (LC DC, Container), Occupancy & Capacity (termasuk Layout Gudang),
Sloc (Value dan Qty), Project & Schedule, Demand, LPPBDO/LPPBPO, Report (Daily Report dan
Status pengisian), TTO & Dokumen, MPP Kebutuhan, dan LP Menu In/Out.

**Independent Test**: setiap menu tampil dengan data tiruan, mengikuti filter, dan hanya
terlihat oleh Role × Jabatan yang berhak.

**Acceptance Scenarios**:

1. **Given** Report → Status, **When** tujuh dari sembilan daily report sudah terisi untuk
   tanggal hari ini, **Then** tampil 78% beserta nama dua report yang belum terisi.
2. **Given** TTO baru, **When** disimpan, **Then** kolom "Yang menyerahkan" berisi teks bebas
   dan "Input by" berisi NIK pengguna yang masuk.
3. **Given** Monitoring → Container, **When** dibuka, **Then** kontainer dikelompokkan menjadi
   POO, OTW (Berlayar), POD (Yard), Unload (Dooring), Done (Delivered) seperti Monitoring
   Kontainer sekarang.

---

### User Story 8 - Settings baru (Priority: P3)

Settings berisi Akun, Versi APK, Tampilan (terang/gelap), Kurangi Animasi, Live Akses,
Pembaruan, Database Spreadsheet, Tentang, dan Keluar. Bagian "Pengguna" lama dihapus.

**Independent Test**: tiap baris berfungsi; Keluar mengembalikan ke layar masuk dan menghapus
sesi.

**Acceptance Scenarios**:

1. **Given** pengguna masuk, **When** membuka Akun, **Then** tampil NIK, nama dirinya sendiri,
   Role, dan Jabatan.
2. **Given** Database Spreadsheet dibuka, **When** pengguna mengetuk satu sumber, **Then**
   spreadsheet itu terbuka di browser.

### Edge Cases

- NIK diketik dengan spasi, huruf kecil, atau nol di depan: dicocokkan setelah dirapikan.
- NIK yang sama muncul dua kali di master: pakai baris terakhir.
- Master user tidak bisa dimuat saat pengguna belum pernah masuk: tampil pesan "Butuh internet
  untuk masuk pertama kali" dan tombol coba lagi.
- Master user gagal dimuat saat pengguna sudah masuk: aplikasi tetap memakai data akses
  terakhir yang tersimpan.
- Pengguna yang sedang masuk dihapus dari master: saat data dimuat ulang ia dikeluarkan dengan
  pesan yang jelas.
- Dua orang membuat WO atau Observasi pada saat yang sama: nomor urut tidak pernah ganda.
- Pergantian hari (tengah malam waktu Makassar): "Hari ini" dan nomor urut ikut tanggal baru
  tanpa harus menutup aplikasi.
- Sel sumber berisi `#N/A`, `#DIV/0!`, `#VALUE!`, atau kosong: dianggap tidak ada data, bukan
  nol.
- Tanggal di sumber tanpa tahun ("1 July", "W12"): tahun diambil dari konteks spreadsheet
  (tahun berjalan atau judul tab).
- Foto WO/Observasi gagal terunggah karena sinyal: isian tetap tersimpan sebagai draf dan bisa
  dikirim ulang.
- Data pribadi di sumber (nama customer, nomor HP tamu, NIK karyawan lain, nama driver) tidak
  pernah tampil.

## Requirements *(mandatory)*

### Functional Requirements

**Identitas, intro, dan navigasi**

- **FR-001**: Nama aplikasi MUST "Mini Monitoring"; intro menampilkan "Mini Monitoring DC Tallo
  Makassar" beserta logo Informa, Informa Custom Furniture, Informa Electronics, Selma, Azko,
  Krisbow, Toys Kingdom, Ataru, Eyesoul, dan Chatime. Logo lain di gambar tidak dipakai.
- **FR-002**: Navigasi utama MUST tepat tiga tab: Home, List, Settings.
- **FR-003**: Filter BU MUST berupa dropdown: Semua BU, HCI (logo Informa dan Selma), AHI (Azko
  dan Ataru), KWI (Krisbow), TGI (Toys Kingdom), FBI (Chatime).
- **FR-004**: Filter periode bawaan untuk semua List MUST "Hari ini" dan "Semua BU", kecuali
  LPPBDO/LPPBPO yang memakai "Bulan ini" dan "Semua BU".

**Masuk dan hak akses**

- **FR-005**: Pengguna MUST masuk dengan NIK yang ada di tab `Master User APK` spreadsheet IMM;
  ID diambil dari bagian depan kolom USER.
- **FR-006**: Aplikasi MUST menyimpan sesi di HP sampai pengguna memilih Keluar.
- **FR-007**: Setiap catatan yang dibuat di aplikasi (TTO, Work Order, Observasi, Checklist,
  persetujuan, perubahan status) MUST menyimpan NIK pencatat dan waktu.
- **FR-008**: Role yang dikenali: INBOUND, STORING, OUTBOUND, INVENTORY, PLANNER, LP, MHE,
  MANAGER, ASST. MANAGER. Jabatan: ADMIN, MANAGER, ASST. MANAGER, SUPERVISOR, STAFF COORDINATOR,
  STAFF, STAFF LP, WAREHOUSEMAN.
- **FR-009**: Menu MUST tampil hanya bila Role pengguna ada di kolom Role **dan** Jabatannya ada
  di kolom Jabatan pada tabel akses. Menu yang tidak berhak tidak tampil di List dan tidak bisa
  dibuka lewat tautan dari Home.
- **FR-010**: Tabel akses:

  | Menu | Sub menu | Role | Jabatan |
  |------|----------|------|---------|
  | Dashboard | Inbound, Storing, Inventory, Planner, Outbound, MHE, LP | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | Monitoring | LC DC, Container | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | Occupancy & Capacity | Occupancy & Capacity, Layout Gudang | sama seperti Monitoring | sama seperti Monitoring |
  | Sloc | Value, Qty | sama seperti Monitoring | sama seperti Monitoring |
  | Project & Schedule | DC Project, Official Schedule | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner | Manager, Asst Manager, Supervisor |
  | Demand | Inbound, Storing, Inventory, Planner, Outbound | Semua | Semua |
  | LPPBDO / LPPBPO | Inbound, Outbound | Manager, Asst Manager, Inbound, Outbound, Inventory, Planner | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | Report | Daily Report, Status | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | TTO & Dokumen | List | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner, LP | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator, Staff LP |
  | Infrastructure | Work Order, Reminder | Manager, Asst Manager, Inbound, Storing, Outbound, Inventory, Planner, LP, MHE | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | MPP | Kebutuhan | Manager, Asst Manager, Inbound, Storing, Outbound | Manager, Asst Manager, Supervisor, Staff, Staff Coordinator |
  | LP Menu | In/Out, Observasi | Manager, Asst Manager, LP | Manager, Asst Manager, Supervisor, Staff LP |

- **FR-011**: Jabatan ADMIN dan WAREHOUSEMAN, yang tidak tercantum di tabel akses, MUST
  diperlakukan begini: ADMIN melihat semua menu; WAREHOUSEMAN hanya Home dan Demand.
- **FR-012**: Pengguna Role LP MUST bisa memilih Dashboard LP, dan pengguna Role MHE MUST bisa
  memilih Dashboard MHE, walaupun Role itu tidak tercantum di baris Dashboard. Di dashboard,
  pengguna dengan Role departemen membuka departemennya sendiri lebih dulu.

**Home**

- **FR-020**: Home MUST menampilkan Akurasi DC Tallo (akurasi hitung terbaru), Value barang
  damage (rupiah, Sloc damage), Occupancy (persen dan CBM terpakai dari kapasitas), Incoming
  Container (jumlah dan TEUs di POO, OTW, POD), dan SLA Outbound (realisasi terhadap standar).
- **FR-021**: Setiap angka di Home MUST menyebut tanggal datanya dan mengikuti filter BU.

**Dashboard per departemen**

- **FR-030 Inbound**: TEUs masuk, CBM masuk, dan jadwal bongkar (setara Beranda sekarang).
- **FR-031 Storing**: total case id, picked, open case id, picking level bawah dan atas beserta
  rincian per level, floor, persentase, total demand dari inbound (CBM), outstanding floor,
  pressing.
- **FR-032 Outbound**: aging LC→Check in, Check in→Open, Open→Close (masing-masing rata-rata,
  min, maks); Rit 2 kirim hari ini; Rit 1 kirim besok; total picked dan status pengiriman
  (picked, open, close); outstanding booking DC (order, CBM); outstanding intransit (order,
  CBM); outstanding location pack (qty).
- **FR-033 Inventory**: occupancy; aging lokasi virtual dan floor (Intransit, Pack, Floor) per
  SKU dan qty; Sloc 1007-, 1007+, 1009-, 1009+; akurasi hitung dan root cause (Move, Picking,
  Pressing, Adjustment Plus, Adjustment Minus, Miss Cycle); cycle count wall to wall (target,
  plus, minus, lokasi kosong, aktual, persentase) dan perbaikan wall to wall (lokasi selesai,
  plus, minus, akurasi), masing-masing per lokasi, per count, dan per qty; update BARUS (batas
  budget, sisa budget, penggunaan budget DC dan Store).
- **FR-034 Planner**: outstanding transit (CBM); pending kirim; plan vs realisasi (OD, CBM, qty)
  per Customer RDC, Customer NDC, dan RT; outstanding customer per Today, H+1, H+2, H+3 ke atas
  (OD, CBM, qty); aging intransit customer di DC 1-3, 4-7, 8-15, 16-30, >30 hari.
- **FR-035 LP**: total tamu, keluar-masuk karyawan, penggunaan segel, DO jemputan, tarikan tugu,
  return 3PL, surat jalan, TTO, non merchandise, armada Palopo/Mamuju/Palu, transaksi Rupa Rupa.
- **FR-036 MHE**: jumlah Work Order per status, status aset, jenis kerusakan, estimasi biaya,
  tren, dan ringkasan, dihitung dari Work Order di aplikasi.
- **FR-037**: KPI yang sumber datanya belum diketahui atau belum terisi MUST tampil sebagai
  "Belum tersambung ke data" dan tercatat di daftar celah data (lihat Assumptions), bukan
  diisi angka karangan.

**Menu List lainnya**

- **FR-040 Monitoring**: LC DC (aging LC) dan Container (POO, OTW/Berlayar, POD/Yard,
  Unload/Dooring, Done/Delivered) setara Monitoring Kontainer sekarang.
- **FR-041 Occupancy & Capacity**: persen occupancy beserta CBM inbound dan outbound serta
  kapasitas gudang saat ini; Layout Gudang dari spreadsheet layout HCI dan AHI yang sudah
  dikirim pemilik (per lokasi/dept).
- **FR-042 Sloc**: Value (rupiah) dan Qty untuk Sloc damage (1001), 1007-, 1007+, 1009-, 1009+.
- **FR-043 Project & Schedule**: DC Project (proyek yang berjalan, tanggal mulai dan selesai) dan
  Official Schedule HO (mis. stock opname). Datanya diisi di aplikasi oleh Manager, Asst
  Manager, atau Supervisor (nama, tanggal mulai, tanggal selesai, status, keterangan) dan
  bisa dilihat semua yang berhak membuka menu ini.
- **FR-044 Demand**: demand per departemen (Inbound, Storing, Inventory, Planner, Outbound),
  setidaknya dalam CBM dan qty per hari.
- **FR-045 LPPBDO / LPPBPO**: Inbound (ringkasan, total LPPBDO, ship by NDC, per kategori,
  status, top dept code damage) dan Outbound (ringkasan, total LPPBDO/LPPBPO, ship by store,
  per kategori, status, top dept code damage); bawaan Bulan ini dan Semua BU.
- **FR-046 Report**: Daily Report berisi sembilan laporan bernama (MONITORING CONTAINER 2026,
  Monitoring Container - Update, Salinan DC Daily Report - HCI, Salinan dari Daily Report DC -
  AHI & NEKA, Daily Report HCI - RDC SDC, Occupancy & Planning Inbound RDC SDC 2026, Salinan
  dari Daily 2026 TALLO, Laporan Daily Update 2026, Data Container RDC -SDC) yang bisa dibuka;
  Status menampilkan persen laporan yang sudah terisi untuk tanggal hari ini dan daftar yang
  belum.
- **FR-047 TTO & Dokumen**: daftar TTO seperti sekarang; "PIC yang menyerahkan" diganti
  "Yang menyerahkan" berupa teks bebas; "Input by" otomatis NIK pengguna.
- **FR-048 MPP Kebutuhan**: total MPP yang masuk per departemen, demand-nya, dan keterangan
  kurang/lebih. Rilis ini menampilkan kerangka menu dengan
  keterangan "Menunggu data MPP"; perhitungan kurang/lebih menyusul setelah pemilik mengirim
  standar produktivitas dan data kehadiran per departemen.
- **FR-049 LP Menu In/Out**: daftar tamu/kunjungan, keluar-masuk karyawan, logbook barang keluar
  dan masuk, armada terseal, dan rekap penjualan kardus, masing-masing dengan detail tanpa data
  pribadi.

**Work Order**

- **FR-050**: "Tambah Work Order" MUST berisi: nomor otomatis `WO-yyyymmdd-NNNN` (urut per
  tanggal), tanggal hari ini, Alat/Mesin (Electric Reachtruk, Forklift, Hand Pallet, Pallet
  Mover, Stock Picker, Battery Charger Pallet Mover, Battery Charger Electric Reachtruk, Lampu,
  Kelistrikan), Nama Pekerjaan (Perawatan Berkala, Perbaikan Kerusakan, Pemeriksaan Alat,
  Penggantian Komponen, Pemasangan, Pembongkaran, Pekerjaan Kelistrikan, Penanganan Gangguan,
  Pembersihan, Pengujian Fungsi, Modifikasi, Lain Lain), detail pekerjaan, waktu mulai (tanggal
  dan jam), tim yang terlibat, biaya estimasi (rupiah), dan catatan tambahan.
- **FR-051**: Status Work Order: Menunggu persetujuan → Disetujui → Pending (bila tertunda) →
  Selesai; Manager juga bisa Menolak. Hanya Jabatan MANAGER yang boleh menyetujui atau menolak.
- **FR-052**: Menandai Selesai MUST oleh pengguna Role MHE dan MUST melampirkan 1–4 foto.
- **FR-053**: Manager MUST mendapat pemberitahuan di aplikasi saat WO dibuat, butuh
  persetujuan, berstatus Pending, dan Selesai. Tahap berikutnya (di luar rilis ini): notifikasi
  HP walaupun aplikasi tertutup.
- **FR-054**: Infrastructure → Reminder MUST menampilkan WO yang menunggu persetujuan, yang
  sudah lewat waktu mulai tetapi belum selesai, dan yang Pending.

**Observasi LP**

- **FR-060**: "Tambah Observasi" MUST berisi nomor otomatis `OBS-yyyymmdd-NNNN`, tanggal hari
  ini, waktu mulai, dan tim yang terlibat; status awal Open.
- **FR-061**: Check-in mengubah Open → Ongoing; Tutup mengubah Ongoing → Closed. Hanya Role LP
  (dan Manager/Asst Manager) yang boleh mengubah status.
- **FR-062**: Sub menu Observasi: Lokasi (Pintu Inbound, Pintu Outbound A, Pintu Outbound B,
  Area MHE, Office, Dispatching, Floor, Rak, Area Luar, Area Parkir Armada, Area Parkir
  Karyawan, Area WC, Area Mess) dengan kondisi pilihan ganda (Aman/Baik, Tidak menyala, Bersih,
  Kotor, Tergembok, Lengkap, Aktif, Tidak Aktif, Berbahaya), detail lokasi, dan foto.
- **FR-063**: Sub menu Checklist: Lampu, CCTV, Apar, Tempat Sampah, Charger Lifttruck/Pallet
  Mover, Stop Kontak, Alarm, Hand Talkie, dengan kondisi pilihan ganda yang sama, detail lokasi,
  dan foto.
- **FR-064**: Observasi Closed MUST hanya bisa dibaca.

**Settings**

- **FR-070**: Settings MUST berisi Akun, Versi APK, Tampilan (terang/gelap), Kurangi Animasi,
  Live Akses (status update kilat), Pembaruan, Database Spreadsheet (daftar sumber per
  departemen yang bisa dibuka), Tentang, dan Keluar. Bagian "Pengguna" dan pertanyaan role per
  HP dihapus.

**Privasi dan data**

- **FR-080**: Nama customer, nama driver, nomor HP, dan NIK orang lain dari spreadsheet MUST
  NOT tampil. Nama pengguna hanya tampil di Akun miliknya sendiri. Kolom "Input by" menampilkan
  NIK pencatat.
- **FR-081**: Catatan yang dibuat di aplikasi MUST NOT dihapus permanen; pembatalan dicatat
  sebagai status.
- **FR-082**: Fitur yang sudah ada (menu Inbound terkunci sandi: Putaway, TTO/Dokumen,
  Productivity, MPP detail; scan TTO dari foto; rincian barang per dept/store; update kilat)
  MUST tetap berfungsi dan ditempatkan di menu List yang sesuai.

### Key Entities

- **Pengguna**: NIK, nama (hanya untuk dirinya), Role, Jabatan; sumbernya tab `Master User APK`.
- **Hak akses**: pasangan menu/sub menu × daftar Role × daftar Jabatan (FR-010).
- **Sumber data**: nama, departemen, spreadsheet dan tab, kolom yang dipakai, kolom yang
  disaring karena privasi.
- **Work Order**: nomor, tanggal, alat/mesin, nama pekerjaan, detail, waktu mulai, tim, biaya
  estimasi, catatan, status, riwayat status (siapa, kapan), foto (maks 4), NIK pembuat.
- **Observasi**: nomor, tanggal, waktu mulai, tim, status, NIK pembuat; berisi banyak
  **Temuan lokasi** (lokasi, kondisi[], detail, foto) dan **Item checklist** (alat, kondisi[],
  detail, foto).
- **Pemberitahuan**: penerima (Manager), jenis kejadian, Work Order terkait, sudah dibaca.
- **TTO/Dokumen**: seperti sekarang, ditambah "Yang menyerahkan" (teks) dan "Input by" (NIK).
- **Project/Jadwal**: jenis (DC Project atau Official Schedule HO), nama, tanggal mulai,
  tanggal selesai, status, keterangan, NIK pembuat.
- **Status laporan harian**: laporan, tanggal, terisi atau belum.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pengguna terdaftar bisa masuk dan melihat Home dalam 30 detik sejak aplikasi
  dibuka pertama kali dengan sinyal 4G biasa.
- **SC-002**: Untuk semua 9 Role × 8 Jabatan, menu yang tampil 100% sama dengan tabel akses.
- **SC-003**: Kelima angka Home tampil dalam 5 detik setelah masuk (setelah data pertama
  termuat) dan cocok dengan perhitungan manual dari sumbernya.
- **SC-004**: Membuat Work Order lengkap selesai dalam 2 menit; Manager melihat pemberitahuan
  paling lambat saat berikutnya membuka aplikasi.
- **SC-005**: Tidak ada nomor Work Order atau Observasi yang ganda.
- **SC-006**: Tidak ada nama customer, nomor HP, atau NIK orang lain di layar mana pun
  (diperiksa dengan data tiruan yang berisi nilai penanda).
- **SC-007**: Semua layar lolos batas keterbacaan: teks ≥ 12 px, target sentuh ≥ 44 px, kontras
  ≥ 4,5:1, tanpa geser samping di 360/400/1280 px, terang dan gelap.
- **SC-008**: Seluruh fungsi aplikasi versi sekarang tetap lulus tes yang sudah ada.

## Assumptions

- **Keamanan masuk**: pemilik memilih masuk dengan NIK saja. Siapa pun yang tahu NIK orang lain
  bisa masuk sebagai orang itu, dan spreadsheet master bisa dibaca publik. Risiko ini diterima
  pemilik untuk rilis ini; PIN bisa ditambahkan nanti tanpa mengubah alur lain.
- **Satu rilis**: semua bagian dirilis sekaligus setelah pemilik menulis "gaspol". Rilis ini
  memerlukan APK baru bila nama aplikasi di HP ikut diganti; bila tidak, cukup update kilat.
- **Notifikasi**: rilis ini hanya pemberitahuan di dalam aplikasi (badge dan daftar);
  notifikasi HP asli adalah tahap berikutnya.
- **Penyimpanan**: Work Order, Observasi, Checklist, foto, pemberitahuan, dan TTO disimpan di
  database aplikasi yang sudah dipakai untuk TTO dan foto putaway.
- **Sloc damage**: dokumen menyebut 1001 dan 1000 untuk damage; aplikasi memakai label
  "Damage (1001)" dan membaca kode yang ada di sumber.
- **Sumber yang sudah dipetakan**: master IMM (user, LC, plan, LPPBDO), Dashboard inventory SCR
  (occupancy, BARUS, 1007 & 1009), Dashboard inventory02 (akurasi cycle count, WTW), DASHBOARD
  INVENTORY 2026, Demand Picking 2026, DASHBOARD STORING & OUTBOUND AHI 2026, Dashboard Planner,
  2026 PLANNING INBOUND, Dashboard Inbound Semester 2, INBOUND (SCRIPT), tujuh spreadsheet LP,
  sembilan daily report, dan dua layout gudang. Semuanya bisa dibaca publik.
- **Celah data**: KPI yang hanya ada di tab dashboard berformula (mis. Planner, Storing &
  Outbound AHI) dihitung dari tab mentahnya bila ada; KPI tanpa tab mentah (mis. Outbound untuk
  HCI, segel LP per hari) tampil "Belum tersambung" sampai sumbernya tersedia.
- **Zona waktu**: semua tanggal memakai waktu Makassar (WITA).
- **Klarifikasi 2026-10-10**: ADMIN melihat semua menu, WAREHOUSEMAN hanya Home dan Demand;
  Project & Schedule diisi di aplikasi; MPP Kebutuhan menunggu data dari pemilik.
- **Di luar cakupan**: perhitungan MPP kurang/lebih, menulis kembali ke spreadsheet, notifikasi HP saat aplikasi tertutup,
  login dengan PIN/sandi, dan pengelolaan pengguna di dalam aplikasi.
