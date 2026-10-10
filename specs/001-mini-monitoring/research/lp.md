# Riset sumber KPI dashboard LP (Loss Prevention) – DC Tallo

Tanggal riset: Sabtu 10 Okt 2026. Metode: hanya WebFetch ke gviz (`/gviz/tq`). Tidak ada nama orang, nomor HP, NIK, nama customer/driver, atau nomor polisi yang disalin. Kolom berisi data pribadi ditandai **PRIVATE** (aplikasi wajib membuangnya sebelum menampilkan/menyimpan).

## 0. Temuan teknis penting (berlaku untuk semua sheet)

1. **Nama tab salah = diam-diam dapat tab PERTAMA.** gviz tidak memberi error bila `sheet=` tidak cocok; ia mengembalikan tab pertama. Terbukti: `sheet=ZZZ TIDAK ADA` dan `sheet=SURAT JALAN` di sheet Barang Masuk mengembalikan isi `DO JEMPUTAN ALL BU TAHUN 2026` (hitungan identik 4060/3951/4049/3967/9310/1215). Nama tab yang benar ternyata **`SURAT JALAN `** (spasi di belakang). Aplikasi harus memvalidasi header yang diharapkan sebelum memakai data (mis. cek label kolom A/C), jangan percaya `sheet=` saja.
2. **Tipe kolom ditebak gviz dari mayoritas isi.** Sel minoritas yang beda tipe menjadi kosong (null). Contoh: `TARIKANTUGU 2026` kolom B bertipe angka (ID 8 digit), sehingga **baris pemisah tanggal teks di B hilang** → tanggal per hari tidak bisa dibaca lewat gviz. Solusi: pakai `/export?format=csv&gid=<gid>` (teks mentah) — gid harus diminta dari pemilik (terlihat di URL saat tab dibuka, `#gid=...`); halaman `/edit` dan `/htmlview` tidak memperlihatkan gid tanpa JS.
3. Kolom tanggal yang bertipe date/datetime bisa difilter/di-group di gviz: `toDate(A)`, `year(A)`, `month(A)` (**month 0-based**). Kolom tanggal "teks hari" kadang sebenarnya **angka serial berformat** (`dddd dd/mm/yyyy`), mis. Armada Terseal: nilai 46304, tampil "Jumat 09/10/2026". Baca `v` (angka) dari `out:json`, bukan teks.
4. gviz: urutan klausa `limit` sebelum `offset` (`limit 60 offset 44640`), kebalikannya error `INVALID_QUERY`.
5. WebFetch kadang mengembalikan respons lama untuk URL lain di sheet yang sama (cache). Bukan masalah aplikasi, hanya catatan riset.
6. Baris-tipe "Load/LC": kode `YYMMDD` + huruf + nomor (regex `^[0-9]{6}[A-Z][0-9]+$`, mis. pola `2609xxH068`) → **tanggal muat bisa diambil dari 6 digit pertama**, tanpa perlu membaca baris pemisah tanggal.

URL dasar: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<tab>&tq=<query>` (pakai `out:json` untuk tipe kolom & nilai serial; `headers=0` agar baris judul tidak digabung).

---

## 1. Total tamu & tamu masih di dalam — **READY**

- Sheet `1Pr9g7PQ9_xFIBhejYo8eBbPmoOeBmI6OQKaaGqLFboE` (Logbook Visitor), tab `Form Visitor` (Google Form).
- Header (A–K): `Timestamp | Tanggal Kunjungan | Nama Tamu | Asal Perusahaan | Nomor Telepon | Tujuan Kunjungan | No. Dokumen | Peralatan yang dibawa | Jam Masuk | Jam Keluar | Lp yang Bertugas`
- Tanggal baris: `Timestamp` (A, datetime, tampil `DD/MM/YYYY H:MM:SS`). `Tanggal Kunjungan` (B, date `DD/MM/YYYY`, kadang tahunnya salah) → pakai A.
- BU: tidak ada.
- Rumus:
  - Hari ini: `select count(A) where toDate(A) = date '2026-10-10'` (atau filter di klien).
  - Bulan ini: `select count(A) where year(A)=2026 and month(A)=9` (Oktober = 9).
  - Masih di dalam: baris hari ini dengan `Jam Keluar` (J) kosong. **Catatan:** Jam Keluar sering tidak pernah diisi (2026: 74 tamu, 43 punya Jam Keluar) → jangan hitung hari-hari lalu sebagai "masih di dalam"; batasi ke hari ini.
- Contoh: 25/09/2026 = 4 tamu (3 punya Jam Keluar). Per bulan 2026: Jul 20, Agu 26, Sep 26, Okt 2 (01/10 dan 06/10). Per tahun: 2022 58, 2023 77, 2024 231, 2025 8, 2026 74. Tidak ada tamu tercatat 07–10 Okt.
- Nilai `Tujuan Kunjungan`: Service, Service TV, Antar/Jemput Barang, Control / Treatment, Interview/Lamar Kerja, Kunjungan External.
- Aman ditampilkan: Timestamp, Tanggal Kunjungan, Tujuan Kunjungan, Peralatan yang dibawa, Jam Masuk, Jam Keluar, (Asal Perusahaan: nama perusahaan, umumnya aman; bisa berisi nama perorangan bila tamu pribadi → sebaiknya tampilkan hanya bila bukan pribadi atau sembunyikan).
- PRIVATE: Nama Tamu, Nomor Telepon, Lp yang Bertugas, No. Dokumen (nomor surat/referensi; tidak tampak KTP, tapi isi bebas → perlakukan PRIVATE).
- URL terbukti: `.../gviz/tq?tqx=out:csv&sheet=Form%20Visitor&tq=select%20month(A),count(A),count(J)%20where%20year(A)=2026%20group%20by%20month(A)`; `...&tq=select%20toDate(A)%2C%20count(A)%2C%20count(J)%20group%20by%20toDate(A)%20order%20by%20toDate(A)%20desc%20limit%2015`

## 2. In/out karyawan & belum kembali — **PARTIAL**

- Sheet `1OTPaUh5C1iHHPj_ihsfMxTjVhrfxPDZNHundJvUO9Zg`, tab `Form Responses 1` (satu-satunya; tab pertama).
- Header (A–L): `Timestamp | Tanggal | Kode Store | Nama Karyawan | Bagian | NIK Karyawan | Status | Keterangan | Jam Keluar | Jam Masuk | Yang Bertugas Cek Body | Durasi waktu`
- Tipe (out:json): A datetime, B date, C/E/G/H string, I/J/L datetime (jam sebagai waktu-hari).
- Tanggal baris: `Timestamp` (A).
- BU: `Kode Store` (C: F004, H019, … → peta BU lewat tab `LOGIC` IMM master: H019→HCI, A017/F004/T009→AHI grup).
- Data: 125 baris sejak 13/07/2026 (+±60 baris kosong berisi "0:00:00" di Durasi). Juli–pertengahan Agustus lengkap (Status "Keluar", Keterangan ISOMA/Toilet/Dan Lain Lain, Jam Keluar, Jam Masuk, Durasi). **Sejak ±18/08/2026 formulir berubah:** Jam Keluar selalu kosong, Tanggal/Kode Store/Bagian/Status kosong, Durasi = Jam Masuk (rumus rusak). 15 hari terakhir: 1–3 entri/hari, total 22.
- Rumus: hari ini `count(A) where toDate(A)=today`; bulan ini `year(A)=Y and month(A)=M-1`; "belum kembali" = Jam Keluar terisi & Jam Masuk kosong → **tidak bisa dihitung untuk data baru** (Jam Keluar tidak diisi). Perlu perbaikan formulir oleh LP.
- Contoh: 10/10/2026 = 1 entri; 08/09/2026 = 2.
- Aman: Timestamp, Tanggal, Kode Store, Bagian, Status, Keterangan, Jam Keluar, Jam Masuk, Durasi waktu.
- PRIVATE: Nama Karyawan, NIK Karyawan, Yang Bertugas Cek Body.
- URL terbukti: `.../gviz/tq?tqx=out:json&sheet=Form%20Responses%201&tq=select%20A,B,C,E,G,H,I,J,L%20limit%203`; `.../gviz/tq?tqx=out:html&tq=select%20toDate(A),count(A),count(J),count(I)%20group%20by%20toDate(A)%20order%20by%20toDate(A)%20desc%20limit%2015`; `...&tq=select%20count(A)` (=125).

## 3. Penggunaan segel & armada terseal per hari/tujuan — **READY (hanya hari terakhir)**

- Sheet `12_LjT16sinXF6V2rAa_wPgS2rWeRY3un71I7MPtoc_s` (UPDATE ARMADA YANG TERSEAL PENGIRIMAN ASTOR), tab `Sheet1` (pertama).
- Header: `NO | NO POL | SEAL | TUJUAN` (A number, B string, C number, D string).
- Tanggal: baris pemisah di kolom A yang **berupa angka serial tanggal** (v=46304, format `dddd dd/mm/yyyy` → "Jumat 09/10/2026"). Deteksi: A > 40000 → tanggal = 1899-12-30 + v hari; A kecil (1..n) → baris armada.
- Sheet **ditimpa tiap hari**: saat ini hanya 1 pemisah (09/10/2026) + 8 armada. Riwayat tidak tersimpan → "bulan ini" tidak bisa (kecuali aplikasi menyimpan snapshot harian ke Supabase).
- Rumus: armada terseal = jumlah baris dengan NO kecil & SEAL terisi; penggunaan segel = jumlah SEAL terisi (1 segel per armada; tidak ada kolom jumlah segel terpisah); per tujuan = group TUJUAN (trim spasi; nilai gabungan "J387+J305" → pecah di "+" bila ingin per store; J*=HCI, A*=AHI).
- Contoh 09/10/2026: 8 armada, 8 segel, 8 tujuan (J387+J305, A390, A389+A390, J343, A495+A548, A548, J337, J725+J361).
- Aman: NO, SEAL (nomor segel 7 digit — boleh), TUJUAN. PRIVATE: NO POL.
- URL terbukti: `https://docs.google.com/spreadsheets/d/12_LjT16sinXF6V2rAa_wPgS2rWeRY3un71I7MPtoc_s/gviz/tq?tqx=out:json&tq=select%20*%20limit%2012`
- Catatan: tidak ditemukan sumber lain "penggunaan segel" (CHEKLIST OBSERVASI tidak punya kolom segel; hanya `KUNCI ARMADA`).

## 4. LOGBOOK BARANG KELUAR 2026 — `1tW0CEKUTkcMBFFVgk_8BOCIBzf0nkGxG-_g8V7iKVX0`

### 4a. SUMMARY (tab pertama) — ringkasan siap pakai
- Tanpa header; A label, B.. angka. Isi (per 10/10/2026): TOTAL OD 2026 SEMESTER 1 = 82093; SEMESTER 2 = 42677; RUPA-RUPA SEMESTER 1 = 63; SEMESTER 2 = 332; DATA ARMADA PALOPO: JUMLAH ARMADA 83 (+ angka per kategori 856, 1881, 60, 13, 1, …); DATA ARMADA AZKO MAMUJU: 1 (5 GRW); DATA BARANG KURANG/LEBIH KIRIM per bulan (kolom BTD, DTB, BKK, BLK, BLP, BKP, TOTAL): Jul 8, Agu 3, Sep 3, lainnya 0.
- Label sub-kolom (GRW/Customer/…) ada di baris yang digabung gviz → baca dengan `headers=0` dan cocokkan teks label di kolom A.
- URL: `.../gviz/tq?tqx=out:csv&sheet=SUMMARY&headers=0&tq=select%20*%20limit%2040`

### 4b. Logbook barang keluar harian (tab `SEMESTER 2`) — **PARTIAL (data berhenti 15/09/2026)**
- ±44.700 baris. Baris 1–2 header ganda + baris 3–9 rekap bulanan, baris 10–13 blok kode eror, mulai baris 14 data.
- Header baris 1 (A–N): `(kosong) | NO | STOP | CARRIERID | TRANSPORTTYPE | NOPOL | JENIS PENGIRIMAN | KETERANGAN | RETASE | STATUS | NAMA CUST | TYPE | EROR | Action`. Baris 2 = label rekap: `GRW, Customer, RT, Flow Thru, Damage, SO Tugu, Tugu, Customer Sales Order, ECommerce ODI - 3PL, JUMLAH`.
- Tiga jenis baris:
  - Pemisah tanggal di A: `"Rabu 1 Juli 2026"` (hari + tanggal + **nama bulan Indonesia** + tahun). 68 pemisah: 1 Jul – 15 Sep 2026 (15–23 Agu tidak ada).
  - Baris armada/load: A = kode load `YYMMDD[A-Z]NNN` (tanggal di 6 digit pertama), B = rute ("HCI CUS 01", "CDELC AHI …"), D carrier, F nopol, G jenis kendaraan, H/I keterangan rute, J "RIT n".
  - Baris OD: E orderkey (angka), H gudang (WMWHSE4/5/11, H019), I nomor `OD.…`, J status (Shipped Complete/Hub-shipped), K nama customer, L TYPE, M kode EROR, N "DONE".
- TYPE (L) untuk baris OD (total S2): GRW 27084, Customer 13264, Flow Thru 334, ECommerce ODI - 3PL 332, SO Tugu 141, Damage 50, RT 24, ECommerce ODI - Own Fleet 6, Tugu 1.
- Rekap bulanan (baris 3–8, JUMLAH): Jul 19345, Agu 14049, Sep 9283, Okt 0.
- Rumus: hari ini = baca berurutan, tanggal dari pemisah terakhir (atau dari prefix load); hitung baris `I starts with 'OD.'` (dokumen) dan baris kode load (armada). Bulan ini: dari rekap baris JUMLAH per bulan (kolom A = nama bulan Indonesia), atau jumlahkan per hari.
- BU: tidak eksplisit; dari rute B ("HCI…", "AHI…") atau gudang H (WMWHSE4=?, WMWHSE11=?, H019=HCI — perlu konfirmasi pemilik).
- Kode EROR (legenda di tab `EROR LOADING`): BTD Barang Tanpa Dokumen, DTB Dokumen Tanpa Barang, BKK Barang Kurang Kirim, BLK Barang Lebih Kirim, BST Barang Salah Turun, BSA (tanpa keterangan); BLP/BKP muncul di SUMMARY tanpa legenda.
- Aman: A (tanggal/kode load), B rute, D carrier (DUMMY-…), E orderkey, G jenis kendaraan/pengiriman, H gudang, I nomor OD/rute, J status/rit, L TYPE, M EROR, N Action. PRIVATE: F NOPOL, K NAMA CUST; H/I pada baris armada kadang memuat nama toko+nama orang (mis. "J305 ST HCIR <nama>") → potong setelah kode store.
- URL: `.../sheet=SEMESTER%202&headers=0&tq=select%20A%20where%20A%20matches%20%27(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu).*%27`; `...&tq=select%20L,count(I)%20where%20I%20starts%20with%20%27OD.%27%20group%20by%20L`; `...&tq=select%20A,B,D,E,G,H,I,J,L,M%20limit%2060%20offset%2044640`
- Tab `SEMESTER 1` tidak dibuka (asumsi struktur sama; total 82093 di SUMMARY).

### 4c. Data armada Palopo (`DATA ARMADA PALOPO`) — **READY**
- Struktur sama dengan SEMESTER 2 (header `NO LC | STOP | … | TRANSPORTTYPE | … | JENIS PENGIRIMAN | KETERANGAN | RETASE | OD | STATUS | | TYPE | LP`), pemisah tanggal di A ("Minggu 21 Juni 2026"); baris armada: A nomor urut, **B kode LC `YYMMDD…`**.
- Armada per hari/bulan = hitung B yang cocok `[0-9]{6}[A-Z][0-9]+`, tanggal dari prefix. Total 83 (sama dengan SUMMARY): Jun 3, Jul 8, Agu 35, Sep 30, Okt 7 (01/10:2, 02/10:1, 03/10:1, 05/10:1, 06/10:2). Terakhir 06/10/2026.
- Aman: kode LC, rute, jenis kendaraan, RIT, gudang, nomor OD, status, TYPE. PRIVATE: nopol, nama driver/pembawa, LP, nama customer.
- URL: `.../sheet=DATA%20ARMADA%20PALOPO&headers=0&tq=select%20B%20where%20B%20matches%20%27[0-9]{6}[A-Z][0-9]%2B%27`

### 4d. Data armada Mamuju (`AZKO MAMUJU`) — **READY, data sangat sedikit**
- Struktur sama (header `NO | STOP | | TRANSPORTTYPE | | JENIS PENGIRIMAN | KETERANGAN | RETASE | STATUS | NAMA CUST | TYPE | PEMBAWA | LP`); kode load di **B**; pemisah tanggal di A ("Jumat 25 September 2026").
- Total 1 armada (25/09/2026, 5 OD GRW). PRIVATE: nopol, PEMBAWA, LP, NAMA CUST, nama driver.

### 4e. Data armada Palu (`DATA ARMADA PALU 2026`) — **PARTIAL (basi, terakhir 17/03/2026)**
- Datar, satu baris = satu armada. Header: `(no) | (tanggal) | NO LC | | | CARRIERID | TRANSPORTTYPE | NOPOL | JENIS PENGIRIMAN | KETERANGAN | KETERANGAN | STATUS | | PEMBAWA | LP`.
- Tanggal: B `DD/MM/YYYY` (kadang kosong) → pakai prefix NO LC (C).
- 200 kode (blok berulang; 103 unik), 192 di 2025; 2026: Jan 7, Mar 1. PRIVATE: NOPOL, PEMBAWA, LP.

### 4f. Transaksi Rupa Rupa (`TRANSAKSI RUPA RUPA`) — **PARTIAL (basi, terakhir 29/05/2026)**
- Struktur sama dengan SEMESTER 2 (header `NO | STOP | CARRIERID | | NOPOL | JENIS PENGIRIMAN | KETERANGAN | RETASE | STATUS | NAMA CUST | TYPE | | PEMBAWA | LP`), kode load di **A**, pemisah tanggal di A ("Rabu 20 Mei 2026"); M = qty per OD.
- 3 pemisah (20, 29, 30 Mei), 3 load; rekap atas: MEI 53 (ECommerce ODI - 3PL). SUMMARY menyebut Rupa-Rupa S1 63, S2 332 (=jumlah TYPE "ECommerce ODI - 3PL" di SEMESTER 2) → **KPI Rupa Rupa sebaiknya dari SEMESTER 2 kolom L = "ECommerce ODI - 3PL"**.
- PRIVATE: NOPOL, NAMA CUST (berisi nama + kurir), PEMBAWA, LP.

### 4g. TTO keluar (`TTO`) — **READY (sedikit data)**
- Header: `TANGGAL | NOPOL | PEMBAWA | NOORDER | PRIORITY | NO TTO | SHIPFTO | NOTRANSAKSI/OD | STATUS | NAMACUSTOMER | TYPE | JUMLAH KOLY | KETERANGAN | LP CEKKER`.
- A = date (per baris, tanpa pemisah). TYPE: TUGU, NON MERCHANDISE. Koli teks ("3 PCS").
- Total 4: 09/04 1, 04/09 2, 18/09 1. Rumus: `select count(F) where toDate(A)=...` / `month(A)`.
- Aman: TANGGAL, NOORDER, PRIORITY, NO TTO, SHIPFTO (kode store; bisa nama pribadi → tampilkan hanya bila pola kode), NOTRANSAKSI/OD, STATUS, TYPE, JUMLAH KOLY, KETERANGAN. PRIVATE: NOPOL, PEMBAWA, NAMACUSTOMER, LP CEKKER.

### 4h. Non merchandise keluar (`NON MARCHENDISE`) — **READY (sedikit data)**
- Header: `TANGGAL | PENGIRIM | TUJUAN | NOMOR DOKUMEN | KETERANGAN JENIS BARANG | PEMBAWA NAMA | NOPOL | QTY | DIKETAHUI LP | PIC`.
- TANGGAL teks campur ("Senin 03 Februari 2025" / "Sabtu 12/09/2026") → parser dua format. 5 baris, terakhir 12/09/2026.
- Aman: TANGGAL, PENGIRIM, TUJUAN, NOMOR DOKUMEN, KETERANGAN JENIS BARANG (bisa memuat nopol → saring), QTY. PRIVATE: PEMBAWA NAMA, NOPOL, DIKETAHUI LP, PIC.

### 4i. `EROR LOADING` — legenda kode + rekap SEMESTER 1/2/TOTAL (TOTAL 8). `Monitoring LC` tidak dibuka.

## 5. TERBARU BARANG MASUK 2026 — `1U4Odr5w27a7ErcdCAJIhsJpBcYMqTBbMpgjXINGAnZc`

### 5a. DO jemputan / logbook barang masuk (`DO JEMPUTAN ALL BU TAHUN 2026`, tab pertama) — **READY (parse berurutan)**
- Header (A–M): `(basmalah) | NO RT | NO RCV / OD | (0) | NAMA CUSTOMER | KOLI | DRIVER | NO POLISI | STORE PENGIRIM | LP | PENERIMA | KETERANGAN | (kosong)`. A berisi "V" (centang).
- Tanggal: baris pemisah di **B** `"Kamis 01/01/2026"` (hari + DD/MM/YYYY). 253 pemisah (5 duplikat, beberapa hari bolong): Jan 31, Feb 28, Mar 28, Apr 30, Mei 29, Jun 23, Jul 30, Agu 25, Sep 28, Okt 1 (terakhir "Minggu 04/10/2026"; sebelumnya 29/09). NO RCV/OD memuat YYYYMMDD tanggal **order**, bukan tanggal terima.
- BU: dari STORE PENGIRIM (I) `"J337 / HCI LATANETE"`, `"A390 / AHI LATANETE"` → J*=HCI, A*=AHI. I hanya diisi di baris pertama tiap kelompok (1215 dari 4049) → isi-ke-bawah.
- Total: 4049 dokumen (count C), sum KOLI 9310.
- Rumus: baca berurutan; tanggal = pemisah terakhir; dokumen = baris dengan C terisi; koli = sum F.
- Contoh: 10/09/2026 = 14 dokumen, 38 koli (store A592, A390, A433, A318, A548); 13/09/2026 = 6 dokumen, 13 koli.
- Aman: NO RT, NO RCV / OD, KOLI, STORE PENGIRIM, KETERANGAN, tanda "V". PRIVATE: NAMA CUSTOMER, DRIVER, NO POLISI, LP, PENERIMA.
- URL: `.../sheet=DO%20JEMPUTAN%20ALL%20BU%20TAHUN%202026&headers=0&tq=select%20B%20where%20B%20matches%20%27(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu).*%27`; `...&tq=select%20count(A),count(B),count(C),count(F),sum(F),count(I)`; `...&tq=select%20A,B,C,F,I,L%20limit%2080%20offset%204000`

### 5b. Tarikan tugu (`TARIKANTUGU 2026`) — **PARTIAL (tanggal tak terbaca lewat gviz)**
- Header (A–L): `(no) | (ID 8 digit) | DO | (ID 6 digit) | NO.DOKUMEN | JENIS TUGU | NAMA CUSTOMER | JENIS TUGU | DRIVER | (header berisi sebuah nomor polisi — salah ketik) | LP | DISPECTH`.
- Pemisah tanggal teks di B ("Kamis 01/01/2026"), tetapi B bertipe angka di gviz → **pemisah jadi null**. Total: 622 dokumen (count E), 624 baris jenis (H, "TARIKAN TUGU DC"). Untuk per hari: perlu `export?format=csv&gid=` (minta gid) atau pemilik memformat kolom B sebagai teks biasa.
- Aman: NO.DOKUMEN, JENIS TUGU, DO, ID. PRIVATE: NAMA CUSTOMER, DRIVER, kolom J (nopol), LP, DISPECTH.

### 5c. Return 3PL (`BARANG RETURN 3PL`) — **READY (2 baris)**
- Header: `(tanggal) | PENGIRIM | NO DOKUMEN | (angka) | (qty) | PEMBAWA | PENERIMA | LP`. A = date `dd-mm-yyyy`.
- 2 baris: 27/08/2026, 02/09/2026 (Shopee Express, J&T). Aman: tanggal, PENGIRIM (kurir), NO DOKUMEN (resi), qty. PRIVATE: PEMBAWA, PENERIMA, LP.

### 5d. Surat jalan (`SURAT JALAN ` — **dengan spasi di belakang**) — **PARTIAL**
- Header 2 baris: `NO KONTAINER | EXPEDISI | PEMBAWA NAMA | DOKUMEN TTO | … | KOLY | PENERIMA LP | RECIVING`.
- Tanggal: pemisah di A ("Sabtu 03 Januari 2026", nama bulan Indonesia), hanya 6 pemisah (Januari), lalu baris judul bulan ("FEBRUARI") tanpa pemisah hari → mayoritas 438 baris tanpa tanggal harian; per bulan mungkin dari baris judul bulan.
- PRIVATE: PEMBAWA NAMA, PENERIMA/LP/RECIVING.
- URL: `.../sheet=SURAT%20JALAN%20&headers=0&tq=select%20A,count(C),count(D),count(F),count(L)%20group%20by%20A`

### 5e. TTO masuk (`TTO`) — **PARTIAL**
- Header: `(tanggal) | KETERANGAN STATUS BARANG | CUSTOMER/ DARI | NO TTO | NOMOR RECEIPT | JUMLAH KOLI | PEMBAWA NAMA | NOPOL | LP`. A = date (format `dddd dd/mm/yyyy`), **sering kosong** (12 dari 23) → isi-ke-bawah dari baris di atas (atau ambil YYYY/MM dari NO TTO `TTO/<store>/YYYY/MM/NNNN`).
- Per bulan (berdasar A): Mar 2, Mei 1, Jul 3, Agu 2, Sep 3, tanpa tanggal 12.
- Aman: tanggal, KETERANGAN STATUS BARANG, NO TTO, NOMOR RECEIPT, JUMLAH KOLI, CUSTOMER/DARI bila kode store. PRIVATE: CUSTOMER/DARI bila nama, PEMBAWA NAMA, NOPOL, LP.

### 5f. Non merchandise masuk (`NON MERCHANDISE`) — **READY (sedikit data)**
- Header: `TANGGAL | PENGIRIM | MASUK /DARI | NOMOR DOKUMEN | KETERANGAN JENIS BARANG | PEMBAWA NAMA | NOPOL | QTY | DIKETAHUI LP | PIC`. A date (`dddd dd/mm/yyyy`).
- 2026: Jan 1, Feb 3, Mar 4, Apr 3, Jun 1, Sep 1 (13).
- Aman: TANGGAL, PENGIRIM (perusahaan), MASUK/DARI (kurir), NOMOR DOKUMEN, KETERANGAN JENIS BARANG (bisa memuat nopol → saring), QTY. PRIVATE: PEMBAWA NAMA, NOPOL, DIKETAHUI LP, PIC.

### 5g. Tidak dibuka: `PENDINGAN 2026`, `IE`, `JEMPUTAN STO`, `BARANG MASUK KONTAINER`, `TRADE IN`. Selalu verifikasi nama tab (lihat §0.1).

## 6. Rekap penjualan kardus — **READY (perlu pembersihan)**

- Sheet `1jB8LDiBboIynBJPdO38CCpXGNWXD7LxF8uSRfLPZ4uk`, tab `Form Responses 1` (tab lain `DATA PENJUALAN KARDUS` belum dibuka).
- Header: `Timestamp | Email Address | TGL PROSES | TGL SETOR | JUMLAH /KG | TOTAL HASIL PENJUALAN | KETERANGAN | Pelapor | Petugas LP | Harga/KG | Total`.
- Tipe: A datetime (`M/D/YYYY`), C/D date (`d-Mon-yyyy`), **E teks "262 kg"** (parse angka; kadang spasi ganda), F angka (format Rp), G kategori KARDUS / BESI WO, J/K angka (hampir selalu kosong).
- Tanggal: TGL PROSES (C).
- **Satuan rupiah tidak konsisten:** Juli 2026 F=280000 (rupiah penuh; K=279400), Agu–Sep F=270, 476, 975, 278 (tampak **ribuan**). Aplikasi: bila F < 10.000 kalikan 1.000 (konfirmasi pemilik). F sering kosong (penjualan belum dibayar).
- Per bulan (C): Jul KARDUS 1 entri Rp280.000; Agu KARDUS 3 (Rp476rb dari 2), BESI WO 3 (Rp270rb dari 1); Sep KARDUS 2 (Rp278rb dari 1), BESI WO 3 (Rp975rb dari 2). Terakhir 22/09/2026 (262 kg BESI WO, Rp786rb).
- Rumus: kg bulan = Σ parse(E) where month(C)=M (filter G=KARDUS bila hanya kardus); rupiah = Σ F (normalisasi).
- Aman: TGL PROSES, TGL SETOR, JUMLAH/KG, TOTAL HASIL PENJUALAN, KETERANGAN, Harga/KG, Total. PRIVATE: Email Address, Pelapor, Petugas LP.
- URL: `.../gviz/tq?tqx=out:csv&sheet=Form%20Responses%201&tq=select%20year(C),month(C),G,count(E),sum(F),count(F),sum(K)%20group%20by%20year(C),month(C),G`

## 7. CHEKLIST OBSERVASI (`1wu9xjqFrmWaqNQksdOBfoy9xAu-cJYn14zSscm7fCvk`) — tidak diriset ulang
- Dari survei: header `TGL & WAKTU, OBSERVASI, DUTY, LP, PINTU OUTBOUND A … KONDISI ALARM, PARAF DUTY, PARAF LP`; PRIVATE: DUTY, LP, PARAF DUTY, PARAF LP. Bukan sumber KPI di daftar ini.

## Tabel status

| KPI | Sumber | Status |
|---|---|---|
| Total tamu / masih di dalam | Visitor `Form Visitor` A, J | READY (Jam Keluar sering tak diisi) |
| In/out karyawan / belum kembali | Karyawan `Form Responses 1` | PARTIAL (form rusak sejak ±18/08) |
| Penggunaan segel | Armada Terseal `Sheet1` SEAL | READY hanya hari terakhir (sheet ditimpa) |
| Armada terseal per hari/tujuan | Armada Terseal `Sheet1` | READY hari terakhir |
| DO jemputan / logbook barang masuk | Masuk `DO JEMPUTAN ALL BU TAHUN 2026` | READY (parse pemisah) |
| Tarikan tugu | Masuk `TARIKANTUGU 2026` | PARTIAL (tanggal hilang di gviz) |
| Return 3PL | Masuk `BARANG RETURN 3PL` | READY (2 baris) |
| Surat jalan | Masuk `SURAT JALAN ` | PARTIAL (tanggal hanya Januari) |
| TTO | Masuk `TTO` + Keluar `TTO` | Masuk PARTIAL, Keluar READY |
| Non merchandise | Masuk `NON MERCHANDISE` + Keluar `NON MARCHENDISE` | READY |
| Armada Palopo | Keluar `DATA ARMADA PALOPO` | READY |
| Armada Mamuju | Keluar `AZKO MAMUJU` | READY (1 armada) |
| Armada Palu | Keluar `DATA ARMADA PALU 2026` | PARTIAL (basi s.d. Mar) |
| Transaksi Rupa Rupa | Keluar `SEMESTER 2` L="ECommerce ODI - 3PL" (tab RUPA RUPA basi) | PARTIAL |
| Logbook barang keluar harian | Keluar `SEMESTER 2` (+SUMMARY) | PARTIAL (data s.d. 15/09) |
| Rekap penjualan kardus | Kardus `Form Responses 1` | READY (normalisasi kg/Rp) |
