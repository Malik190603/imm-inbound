# Mini Monitoring – DC Tallo Makassar

Aplikasi Android untuk tim DC Tallo Makassar (sebelum v2.0 bernama **IMM – Inbound Mini Monitoring**). Angka dibaca langsung dari spreadsheet kerja tim di Google Sheets; yang memang diisi di aplikasi (Work Order, Observasi LP, Project & Schedule, TTO, foto) disimpan di Supabase. Data dimuat ulang saat aplikasi dibuka, saat layar ditarik ke bawah, atau setelah ditinggal lebih dari 5 menit.

## Masuk
Login dengan **NIK** yang terdaftar di sheet **Master User APK** (kolom USER berisi `NIK.NAMA`, ROLE, JABATAN). Role × Jabatan menentukan menu yang tampil; NIK yang dihapus dari sheet otomatis keluar saat data pengguna dimuat ulang. Tidak ada PIN: siapa pun yang tahu NIK orang lain bisa masuk sebagai orang itu (risiko diterima pemilik).

## Tab dan menu
- **Home**: kalimat "perlu perhatian", lalu 5 kartu KPI: Akurasi DC Tallo, Occupancy, Barang damage (Sloc 1001), SLA Outbound, Incoming container. Manager melihat banner notifikasi Work Order.
- **List**: menu sesuai hak akses
  - *Dashboard* per dept: Inbound (termasuk alat Inbound lama: Putaway, TTO, Productivity, MPP – terkunci sandi 2 jam), Storing, Outbound, Inventory, Planner, MHE.
  - *Monitoring*: LC DC (aging), Container (sheet RDC).
  - *Occupancy & Capacity* (dan Layout Gudang), *Sloc* (Value, Qty), *Project & Schedule* (DC Project, Official Schedule; diisi Manager, Asst Manager, Supervisor, Admin), *Demand* (Inbound, Storing, Inventory, Planner, Outbound), *LPPBDO / LPPBPO* (Inbound; Outbound belum tersambung), *Report* (Daily Report, Status 9 report), *TTO & Dokumen*, *Infrastructure* (Work Order dengan persetujuan Manager, penyelesaian MHE dengan 1–4 foto; Reminder), *MPP* (Kebutuhan: menunggu data standar dari pemilik), *LP Menu* (In/Out tamu, karyawan, armada, kardus; Observasi LP Open → Ongoing → Closed).
  - ADMIN melihat semua menu; WAREHOUSEMAN hanya Home dan Demand.
- **Settings**: akun, tampilan, versi & pembaruan, daftar spreadsheet sumber, data yang belum tersedia, kamus istilah, keluar.

Filter bawaan: **Hari ini** dan **Semua BU** (LPPB: Bulan ini); tiap menu menyimpan filternya sendiri. Filter BU memakai logo brand: HCI (Informa, Informa Custom, Informa Electronics, Selma), AHI (Azko, Ataru), KWI (Krisbow), TGI (Toys Kingdom), FBI (Chatime). Angka yang belum punya sumber ditampilkan "Belum tersambung", bukan nol.

Warna: Storing hijau, Store oranye, Customer biru. BU: HCI biru, AHI merah, TGI biru muda, FBI ungu, KWI oranye.

## Sumber data
Semua spreadsheet terdaftar di `www/sources.js` (`DOCS`, `REG`) dan tampil di Settings → Database Spreadsheet. Kolom yang berisi data pribadi (nama tamu/driver/customer, nomor telepon, nomor dokumen, nomor polisi) **tidak pernah diminta** dari sheet; tes `tests/sources.test.mjs` memeriksanya. Sheet yang salah nama tab ditolak (bukan diam-diam membaca tab pertama).

## Cara pasang & update
1. Pertama kali: unduh `Mini-Monitoring-Tallo-vX.apk` (sebelum v2.0: `IMM-Tallo-vX.apk`) dari halaman **Releases**, buka, izinkan "Instal aplikasi tidak dikenal".
2. Update bersifat **wajib**: setiap dibuka, aplikasi mengecek rilis terbaru. Kalau ada versi lebih baru, layar terkunci sampai diperbarui (tanpa internet aplikasi tetap bisa dibuka).
   - Perubahan tampilan/logika saja → **update kilat** (±1 MB), langsung dipakai tanpa instal APK.
   - Perubahan native (plugin, izin, ikon) → APK diunduh di dalam aplikasi lalu dipasang menimpa versi lama. Tidak perlu uninstall.
3. Repo ini harus **publik** supaya aplikasi bisa membaca halaman Releases tanpa login.

## Syarat spreadsheet
- Kedua spreadsheet (IMM dan RDC) harus dibagikan **"Siapa saja yang memiliki link" sebagai Pelihat**. Kalau aksesnya ditutup, aplikasi menampilkan pesan gagal memuat.
- **Jangan ganti nama sheet dan jangan menggeser kolom** yang dibaca aplikasi. Menambah baris atau mengubah isi sel aman.

| Sheet | Kolom yang dibaca |
|---|---|
| LOGIC | A (kode Stock), D (kode Store) |
| MASTER_PLAN | D tgl bongkar, E jam, G no. kontainer, H No LC, I site/BU, M CBM to stock, R CBM to store, W CBM to customer, Z ekspedisi, AA fleet, AB ship from, AC TEUs |
| MASTER_LC | A No LC, E TradingPartner, F KODE SITE, G SITE NAME, P SITE, Q SKU, R DESCR, S Dept, Y SHIPPEDQTY, AA CBM_SHIPPED_QTY (yang dikirim, bukan original) |
| LPPBDO_HCI, LPPBDO_AHI | A UPDATE, B Tgl, C Bulan, D BU, E LPPBDO No., F Site Receiver, H Driver, L Artikel, M Desc, O Qty OD, P Qty Receive, Q Remark, R Status, S Kategori, T Qty LPPBDO, W Dept, AA Tanggal |
| RDC (spreadsheet terpisah, gid 345900811) | dicari lewat **judul kolom** (susunan kolomnya pernah berubah): BU (asal), SI (= No LC), Type Armada, Delivery Date, Checkout, No Container, Nama Kapal, POO, ETD, ATD, ETA, ATA…, REQUEST DOORING…, ACTUAL DOORING…, TANGGAL BONGKAR, Position…, Status Shipment, BU (kode, kemunculan kedua), AGING YARD, KATEGORI AGING YARD, BU NAME (difilter Makassar), TEUs, Aging POO…, Aging OTW…, AGING POD…, LEAD TIME… |

| Inbound stock (spreadsheet `1crYUpCJ…`, gid 349104626) | dicari lewat **judul kolom**: Storerkey, Trantype, SKU, Description, Sku Group, Toloc, Toid, Qty, Source type, CM3, Tanggal (WITA), Date, Kategori, Hitung Produktivitas?, Id Operator, Username Operator, CM3 (Final) |
| Inbound transit (gid 2022396471) | dicari lewat **judul kolom**: Owner, CBM Received, Received By, Date, Hitung Transit? |

Untuk dua sheet inbound, kolom boleh digeser asalkan **judulnya tidak diganti**.

## Menu Inbound
- Terkunci kata sandi; setelah benar terbuka 2 jam di HP itu. Di kode hanya ada hash sandinya (`PW_HASH` di `www/inbound-core.js`). Untuk mengganti sandi: hitung `sha256("imm-tallo:" + sandiBaru)` lalu ganti `PW_HASH`.
- **Putaway**: baris stock dengan Trantype `Move`, Source type `NSPRFPA02`, Toloc berawalan `FLR`, dikelompokkan per LPN (Toid). Awalan `ID` = good, `RC` = damage (kartu merah). Peringatan kalau satu LPN berisi lebih dari satu Sku Group.
- **Productivity**: hanya 5 operator (129057, 148453, 187606, 188400, 192831). Stock: baris `Hitung Produktivitas?` = Ya; Receive = `CM3` ÷ 1.000.000, Putaway = `CM3 (Final)` ÷ 1.000.000. Transit: baris `Hitung Transit?` = Ya; `CBM Received` dihitung sama untuk Receive dan Putaway.
- **TTO/Dokumen** dan **foto putaway** disimpan di Supabase (maksimal 4 foto per LPN/TTO, dikecilkan dan diberi cap waktu).

## Supabase (foto dan TTO)
1. Buat project Supabase khusus IMM.
2. SQL Editor → tempel isi `supabase/schema.sql` → Run (membuat tabel `putaway_photos`, `tto`, dan bucket `imm-photos`).
3. Project Settings → API: salin **Project URL** dan **anon public key** ke `SUPA` di `www/store.js`. Jangan pernah memakai kunci `service_role` (pemeriksaan rilis akan menolaknya).
4. Karena anon key ada di aplikasi dan repo ini publik, data TTO dan foto bisa diakses orang yang paham teknis di luar aplikasi.
5. Mini Monitoring (v2.0) menambah tabel `work_order`, `wo_event`, `observasi`, `obs_entry`, `dc_schedule`, `notif`, `run_no` dan kolom `tto.input_by`. Anon hanya boleh membaca tabel; semua perubahan lewat fungsi `imm_wo_create`, `imm_wo_move`, `imm_obs_create`, `imm_obs_move`, `imm_obs_add`, `imm_obs_cancel`, `imm_schedule_save`, `imm_notif_read` yang memeriksa aturan (persetujuan hanya jabatan MANAGER, penyelesaian hanya role MHE dengan 1–4 foto, dst.).

## Scan TTO dari foto
Di form **Tambah TTO** ada bagian "Scan dari foto". Foto dokumen dikirim ke fungsi server `scan-tto` di Supabase, dibaca AI (Gemini atau Claude), lalu No TTO (dari *Document No*), daftar barang, dan jumlah koli terisi sendiri untuk dicek sebelum disimpan. Kunci AI hanya ada di Supabase, tidak di aplikasi dan tidak di repo ini.

Pemasangan (sekali):
1. **SQL**: Supabase → SQL Editor → tempel ulang seluruh isi `supabase/schema.sql` → Run. Ini menambah tabel `scan_log` serta fungsi `imm_scan_take` dan `imm_scan_refund` (batas scan per hari; scan yang gagal di sisi AI tidak memakan jatah). Aman dijalankan ulang.
2. **Fungsi**: Supabase → Edge Functions → **Deploy a new function** → **Via Editor** → beri nama `scan-tto` (harus persis) → hapus isi contoh, tempel seluruh isi `supabase/functions/scan-tto/index.ts` → **Deploy function**. Biarkan verifikasi JWT menyala.
3. **Kunci**: Supabase → Edge Functions → **Secrets** → isi Key `GEMINI_API_KEY` dan Value kunci dari aistudio.google.com → **Save**. Sebagai gantinya kunci boleh disimpan di brankas database: `select vault.create_secret('<kunci>', 'GEMINI_API_KEY');` (dibaca fungsi lewat `imm_secret`; secret fungsi didahulukan). Untuk Claude pakai `ANTHROPIC_API_KEY`. Kalau dua-duanya dipasang, Gemini yang dipakai kecuali `SCAN_PROVIDER` diisi `claude`.
4. Opsional: `SCAN_DAILY_LIMIT` (bawaan 200 scan per hari), `GEMINI_MODEL` (bawaan `gemini-3.5-flash-lite`), `ANTHROPIC_MODEL` (bawaan `claude-haiku-4-5-20251001`).

Batas harian berlaku untuk semua HP bersama-sama dan `SCAN_DAILY_LIMIT=0` mematikan scan. Karena kunci anon ada di aplikasi, orang iseng bisa menghabiskan jatah hari itu; tagihan tetap terlindungi dan form manual tetap jalan.

Sebelum langkah di atas selesai, tombol scan menampilkan "Scan belum diaktifkan di server" dan form tetap bisa diisi manual. Foto dokumen dikirim ke penyedia AI yang kuncinya dipasang. Fungsi memakai `SUPABASE_SERVICE_ROLE_KEY` bawaan Supabase hanya untuk mencatat pemakaian.

## Tes
- `npm test` — logika inti (parse, login & hak akses, Work Order/Observasi, sumber data, KPI) dan penyimpanan (dijalankan juga saat rilis).
- `npm run check` — sintaks, konfigurasi, kunci rahasia, sandi tidak tertulis terang.

## Aturan perhitungan
- Patokan tanggal adalah **tanggal bongkar di MASTER_PLAN**. Baris MASTER_LC hanya dihitung kalau No LC-nya ada di MASTER_PLAN.
- **Storing** = KODE SITE ada di daftar Stock pada sheet LOGIC.
- **Outbound** = KODE SITE ada di daftar Store pada sheet LOGIC (store), ditambah KODE SITE 0 (customer, dikelompokkan per TradingPartner).
- BU dibaca dari huruf depan kode: H/J = HCI, A = AHI, F = FBI, T = TGI, K = KWI.
- LC yang ada di MASTER_LC tapi belum ada di MASTER_PLAN ditampilkan sebagai peringatan "LC belum dijadwalkan".

## Rilis ("gaspol")
Alurnya sama dengan Active Coach:
1. Perubahan di-commit dan di-push ke `main`.
2. GitHub Actions (`.github/workflows/build-apk.yml`) menentukan versi, memeriksa kode, membangun APK rilis, memastikan tanda tangannya sama dengan versi sebelumnya, lalu menerbitkannya di **Releases**.
3. **Versi:** `package.json` berisi versi dasar (mis. 1.0.0). Perbaikan kecil otomatis naik PATCH (1.0.3 → 1.0.4 …). Untuk fitur besar, naikkan MINOR di `package.json` (mis. 1.1.0).
4. **Catatan rilis** diambil dari pesan commit. Pisahkan dengan baris `Untuk pengguna:` dan `Untuk developer:`.
5. Pesan commit berisi `[beta]` → rilis beta (prerelease), tidak menjadi versi terbaru.
6. Rilis dibatalkan bila pemeriksaan kode gagal, APK ditandatangani kunci lain, atau APK masih bisa di-debug.

Kode tampilan dan logika ada di `www/index.html`. Lapisan desain v1.4 ada di `www/ui.css` (gaya), `www/ui.js` (komponen: kartu jawaban, strip minggu, perlu perhatian, kamus istilah) dan `www/ui-core.js` (fungsi murni yang diuji). Aturan desainnya dicatat di `DESIGN.md`; konteks produk di `PRODUCT.md`. Huruf disimpan di `www/fonts/` (tidak lagi dimuat dari internet). Proyek Android dibuat dengan Capacitor. Kunci tanda tangan ada di `android/app/imm-inbound.keystore`; jangan dihapus atau diganti, karena tanpa kunci yang sama APK baru tidak bisa dipasang menimpa versi lama. Karena kunci ini ada di repo, **repo harus tetap Private**.
